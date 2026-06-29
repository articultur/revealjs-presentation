#!/usr/bin/env node
/**
 * reveal.js visual QA helper.
 *
 * Captures every slide after Reveal has settled so reviewers can inspect
 * contact-sheet quality, transition residue, hidden core content, and crop.
 *
 * Usage:
 *   node scripts/visual-qa.js deck.html --out /tmp/deck-visual
 *   node scripts/visual-qa.js deck.html --output /tmp/deck-visual
 *   node scripts/visual-qa.js deck.html --show-fragments
 *   node scripts/visual-qa.js deck.html --annotate-overflow   # red-outline VP_TOP/overflow elements
 *
 * --annotate-overflow mode:
 *   After capturing each slide, injects overflow-detect.js, marks VP_TOP /
 *   VP_BOTTOM / VP_LEFT / VP_RIGHT elements with red dashed outlines and
 *   pixel-value labels, then takes a second "annotated" screenshot. The
 *   manifest.json includes an `overflow` summary per slide so reviewers
 *   can't miss content-page issues (the iteration-1 clinical kicker problem:
 *   cover screenshot was clean but slides 3+7 had VP_TOP clipping).
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

function firstPositionalArg() {
  const valueFlags = new Set(['--out', '--output']);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (valueFlags.has(arg)) {
      i++;
      continue;
    }
    if (!arg.startsWith('--')) return arg;
  }
  return null;
}

const htmlFile = firstPositionalArg();
const outArgIndex = args.findIndex(arg => arg === '--out' || arg === '--output');
const showFragments = args.includes('--show-fragments');
const annotateOverflow = args.includes('--annotate-overflow');
const waitArg = args.find(arg => arg.startsWith('--wait='));
const waitMs = waitArg ? Number(waitArg.split('=')[1]) : 900;
const knownFlags = new Set(['--out', '--output', '--show-fragments', '--annotate-overflow']);
const unknownFlags = args.filter(arg => arg.startsWith('--') && !knownFlags.has(arg) && !arg.startsWith('--wait='));

if (unknownFlags.length) {
  console.error(`未知参数: ${unknownFlags.join(', ')}`);
  console.error('用法: node scripts/visual-qa.js <HTML文件> [--out dir|--output dir] [--show-fragments] [--annotate-overflow] [--wait=900]');
  process.exit(2);
}

if (!htmlFile) {
  console.log('用法: node scripts/visual-qa.js <HTML文件> [--out dir|--output dir] [--show-fragments] [--annotate-overflow] [--wait=900]');
  process.exit(1);
}

const filePath = path.resolve(htmlFile);
if (!fs.existsSync(filePath)) {
  console.error(`文件不存在: ${filePath}`);
  process.exit(1);
}

const outDir = outArgIndex >= 0 && args[outArgIndex + 1]
  ? path.resolve(args[outArgIndex + 1])
  : path.join(path.dirname(filePath), `${path.basename(filePath, '.html')}-visual-qa`);

fs.mkdirSync(outDir, { recursive: true });

// Load overflow-detect.js for annotation mode
const overflowDetectCode = annotateOverflow
  ? fs.readFileSync(path.join(__dirname, 'overflow-detect.js'), 'utf8')
  : null;

async function waitForReveal(page) {
  await page.waitForFunction(() => {
    return typeof window.Reveal !== 'undefined' && window.Reveal.isReady();
  }, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(waitMs);
}

async function revealAllFragments(page) {
  await page.evaluate(() => {
    document.querySelectorAll('.reveal .slides > section').forEach(section => {
      section.querySelectorAll('.fragment').forEach(fragment => {
        fragment.classList.add('visible');
        fragment.classList.add('current-fragment');
        fragment.style.setProperty('opacity', '1', 'important');
        fragment.style.setProperty('visibility', 'visible', 'important');
        fragment.style.setProperty('transform', 'none', 'important');
      });
    });
  });
}

/**
 * Inject overflow-detect.js, run scan on current slide, and add red
 * dashed outlines + pixel labels on overflowing elements so the
 * screenshot makes issues visually obvious.
 */
async function annotateCurrentSlide(page) {
  return await page.evaluate(() => {
    // Use the already-injected comprehensiveOverflowScan
    if (typeof window.comprehensiveOverflowScan !== 'function') return null;

    const present = document.querySelector('.reveal section.present');
    if (!present) return null;

    const scan = window.comprehensiveOverflowScan({ sections: [present], slideOffset: 1 });
    const issues = [...(scan.viewport || []), ...(scan.container || []), ...(scan.content || [])];

    // Mark overflow elements with visible red outlines + labels
    const marked = [];
    for (const item of issues) {
      // Find the element (by tag + text + class hints from scan output)
      let el = null;
      if (item.cls && typeof item.cls === 'string') {
        const firstCls = item.cls.trim().split(/\s+/)[0];
        const sel = item.tag ? `${item.tag}.${firstCls}` : `.${firstCls}`;
        try { el = present.querySelector(sel); } catch {}
      }
      if (!el && item.tag) {
        const candidates = present.querySelectorAll(item.tag);
        for (const c of candidates) {
          if (item.text && c.textContent?.includes(item.text?.slice(0, 10))) { el = c; break; }
        }
        if (!el && candidates.length === 1) el = candidates[0];
      }

      if (el) {
        el.style.setProperty('outline', '2px dashed #ff3333', 'important');
        el.style.setProperty('outline-offset', '3px', 'important');

        // Add a small label showing the overflow type + px
        const label = document.createElement('div');
        label.textContent = `${item.type || 'OVF'} ${item.val || ''}px`;
        label.style.cssText = 'position:absolute;background:#ff3333;color:#fff;font-size:9px;padding:1px 4px;z-index:99999;pointer-events:none;font-family:monospace;white-space:nowrap;';
        const rect = el.getBoundingClientRect();
        label.style.left = Math.max(2, rect.left) + 'px';
        label.style.top = Math.max(2, rect.top - 16) + 'px';
        document.body.appendChild(label);
        marked.push({ type: item.type, val: item.val, tag: item.tag, cls: item.cls });
      }
    }

    return { total: issues.length, marked: marked.length, types: [...new Set(issues.map(i => i.type))] };
  });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`file://${filePath}`, { waitUntil: 'networkidle' });
  await waitForReveal(page);

  // Pre-inject overflow detector if annotating
  if (annotateOverflow && overflowDetectCode) {
    await page.evaluate(() => { window.__REVEALJS_VALIDATE_DISABLE_AUTO_RUN__ = true; });
    await page.addScriptTag({ content: overflowDetectCode });
  }

  const slideCount = await page.evaluate(() => {
    if (typeof window.Reveal !== 'undefined' && typeof window.Reveal.getSlides === 'function') {
      return window.Reveal.getSlides().length;
    }
    return document.querySelectorAll('.reveal .slides > section').length;
  });

  const manifest = [];
  let overflowSummary = { totalIssues: 0, slidesWithIssues: 0, issueTypes: {} };

  for (let i = 0; i < slideCount; i += 1) {
    await page.evaluate(index => {
      const slide = window.Reveal.getSlides()[index];
      const indices = window.Reveal.getIndices(slide);
      window.Reveal.slide(indices.h, indices.v || 0, indices.f);
    }, i);
    await page.waitForFunction(index => {
      const slide = window.Reveal.getSlides()[index];
      return slide && slide.classList.contains('present');
    }, i, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(waitMs);
    if (showFragments) await revealAllFragments(page);

    const slideNo = String(i + 1).padStart(2, '0');

    // Clean screenshot
    const cleanPath = path.join(outDir, `slide-${slideNo}.png`);
    await page.screenshot({ path: cleanPath, fullPage: false });

    // Annotated screenshot (if enabled)
    let annotatedPath = null;
    let overflow = null;
    if (annotateOverflow) {
      overflow = await annotateCurrentSlide(page);
      if (overflow && overflow.total > 0) {
        annotatedPath = path.join(outDir, `slide-${slideNo}-annotated.png`);
        await page.screenshot({ path: annotatedPath, fullPage: false });
        overflowSummary.totalIssues += overflow.total;
        overflowSummary.slidesWithIssues++;
        for (const t of (overflow.types || [])) {
          overflowSummary.issueTypes[t] = (overflowSummary.issueTypes[t] || 0) + 1;
        }
        // Clean up injected labels for next slide
        await page.evaluate(() => {
          document.querySelectorAll('*').forEach(el => {
            el.style.outline = '';
          });
          document.querySelectorAll('div').forEach(d => {
            if (d.style.zIndex === '99999') d.remove();
          });
        });
      }
    }

    const text = await page.evaluate(index => {
      const slide = window.Reveal.getSlides()[index];
      return (slide ? slide.innerText : '').trim().replace(/\s+/g, ' ').slice(0, 160);
    }, i);

    const entry = { slide: i + 1, screenshot: cleanPath, text };
    if (annotatedPath) entry.screenshotAnnotated = annotatedPath;
    if (overflow) entry.overflow = overflow;
    manifest.push(entry);
  }

  await browser.close();

  const manifestData = {
    source: filePath,
    showFragments,
    annotateOverflow,
    waitMs,
    slideCount,
    slides: manifest,
  };
  if (annotateOverflow) {
    manifestData.overflowSummary = overflowSummary;
  }
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifestData, null, 2));

  console.log(`visual QA screenshots: ${outDir}`);
  console.log(`slides captured: ${slideCount}`);
  if (annotateOverflow) {
    console.log(`overflow issues: ${overflowSummary.totalIssues} on ${overflowSummary.slidesWithIssues} slide(s)`);
    if (overflowSummary.totalIssues > 0) {
      console.log(`  types: ${Object.entries(overflowSummary.issueTypes).map(([k, v]) => `${k}×${v}`).join(', ')}`);
      console.log(`  → annotated screenshots saved as slide-NN-annotated.png`);
    }
  }
}

run().catch(err => {
  console.error('visual QA failed:', err);
  process.exit(1);
});
