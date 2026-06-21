#!/usr/bin/env node
/**
 * Image Asset Audit
 * ------------------------------------------------------------
 * Checks image-driven Reveal.js decks for hard failures that normal
 * geometry gates cannot see: broken images, upscaled/low-resolution
 * full-bleed photos, awkward panorama crops, repeated hero imagery,
 * and theme background drift.
 *
 * Usage:
 *   node scripts/audit-image-assets.js deck.html
 *   node scripts/audit-image-assets.js deck.html --json
 *
 * Exit codes:
 *   0 - no blockers (warnings may exist)
 *   1 - one or more blockers
 *   2 - usage/setup error
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const htmlFile = args.find(arg => !arg.startsWith('--'));
const jsonOnly = args.includes('--json');
const waitArg = args.find(arg => arg.startsWith('--wait='));
const waitMs = waitArg ? Number(waitArg.split('=')[1]) : 900;

if (!htmlFile) {
  console.error('Usage: node scripts/audit-image-assets.js <html-file> [--json] [--wait=900]');
  process.exit(2);
}

const filePath = path.resolve(htmlFile);
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(2);
}

function normUrl(url) {
  if (!url) return '';
  return String(url)
    .replace(/^file:\/\//, '')
    .replace(/[?#].*$/, '')
    .replace(/\/\d+px-([^/]+)$/i, '/$1')
    .trim();
}

function pushIssue(issues, severity, slide, category, message, evidence = {}) {
  issues.push({ severity, slide, category, message, evidence });
}

async function waitForReveal(page) {
  await page.waitForFunction(() => {
    return typeof window.Reveal !== 'undefined' && window.Reveal.isReady();
  }, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(waitMs);
}

async function collectDeck(page) {
  return await page.evaluate(async () => {
    const parseBgUrls = (value) => {
      if (!value || value === 'none') return [];
      const urls = [];
      const re = /url\((?:"([^"]+)"|'([^']+)'|([^)]*))\)/g;
      let match;
      while ((match = re.exec(value))) {
        urls.push(match[1] || match[2] || match[3]);
      }
      return urls;
    };

    const loadSize = (src) => new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve({ naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, complete: true });
      img.onerror = () => resolve({ naturalWidth: 0, naturalHeight: 0, complete: false });
      img.src = src;
    });

    const slideEls = typeof window.Reveal !== 'undefined' && typeof window.Reveal.getSlides === 'function'
      ? window.Reveal.getSlides()
      : Array.from(document.querySelectorAll('.reveal .slides > section'));

    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const slides = [];

    for (let i = 0; i < slideEls.length; i += 1) {
      const slide = slideEls[i];
      if (window.Reveal && window.Reveal.slide) {
        const indices = window.Reveal.getIndices(slide);
        window.Reveal.slide(indices.h, indices.v || 0, indices.f);
        await new Promise(r => setTimeout(r, 80));
      }

      const sectionRect = slide.getBoundingClientRect();
      const computed = getComputedStyle(slide);
      const bgColor = computed.backgroundColor;
      const images = [];

      const addImage = async (kind, el, src) => {
        if (!src) return;
        const rect = el.getBoundingClientRect();
        if (rect.width < 24 || rect.height < 24) return;
        const areaRatio = (rect.width * rect.height) / (Math.max(1, sectionRect.width * sectionRect.height));
        const className = el.className ? String(el.className) : '';
        const roleHint = [
          className,
          el.getAttribute('data-role') || '',
          el.getAttribute('alt') || '',
        ].join(' ').toLowerCase();
        const natural = kind === 'img'
          ? { naturalWidth: el.naturalWidth || 0, naturalHeight: el.naturalHeight || 0, complete: el.complete && el.naturalWidth > 0 }
          : await loadSize(src);
        images.push({
          kind,
          src,
          alt: el.getAttribute('alt') || '',
          className,
          roleHint,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          sectionRect: { width: sectionRect.width, height: sectionRect.height },
          areaRatio,
          naturalWidth: natural.naturalWidth,
          naturalHeight: natural.naturalHeight,
          complete: natural.complete,
        });
      };

      for (const img of Array.from(slide.querySelectorAll('img'))) {
        await addImage('img', img, img.currentSrc || img.src);
      }

      for (const el of Array.from(slide.querySelectorAll('*'))) {
        const style = getComputedStyle(el);
        const urls = parseBgUrls(style.backgroundImage);
        for (const src of urls) await addImage('background', el, src);
      }

      const text = (slide.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 180);
      slides.push({ slide: i + 1, text, bgColor, images });
    }

    return { viewport, slides };
  });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`file://${filePath}`, { waitUntil: 'networkidle' });
  await waitForReveal(page);
  const deck = await collectDeck(page);
  await browser.close();

  const issues = [];
  const allImages = [];
  const heroImages = [];

  for (const slide of deck.slides) {
    for (const image of slide.images) {
      const displayW = image.rect.width;
      const displayH = image.rect.height;
      const naturalW = image.naturalWidth;
      const naturalH = image.naturalHeight;
      const srcKey = normUrl(image.src);
      const isHero = image.areaRatio >= 0.32 || /hero|cover|full|bleed|section|photo-main|image-main/.test(image.roleHint);
      const displayRatio = displayW / Math.max(1, displayH);
      const naturalRatio = naturalW / Math.max(1, naturalH);
      const upscale = Math.max(displayW / Math.max(1, naturalW), displayH / Math.max(1, naturalH));
      const record = { slide: slide.slide, ...image, srcKey, isHero, displayRatio, naturalRatio, upscale };
      allImages.push(record);
      if (isHero) heroImages.push(record);

      if (!image.complete || naturalW === 0 || naturalH === 0) {
        pushIssue(issues, 'blocker', slide.slide, 'broken-image', 'Image did not load or has zero natural size.', { src: image.src });
        continue;
      }

      if (isHero && upscale > 1.05) {
        pushIssue(issues, 'blocker', slide.slide, 'hero-upscaled', 'Hero/full-bleed image is displayed larger than its natural pixels.', {
          src: image.src,
          display: `${Math.round(displayW)}x${Math.round(displayH)}`,
          natural: `${naturalW}x${naturalH}`,
          upscale: Number(upscale.toFixed(2)),
        });
      }

      if (isHero && (naturalW < 1280 || naturalH < 720)) {
        pushIssue(issues, 'blocker', slide.slide, 'hero-low-resolution', 'Hero/full-bleed image is below the 1280x720 canvas baseline.', {
          src: image.src,
          natural: `${naturalW}x${naturalH}`,
        });
      }

      if (isHero && (Math.max(naturalW, naturalH) < 2200 || Math.min(naturalW, naturalH) < 900)) {
        pushIssue(issues, 'warning', slide.slide, 'hero-not-retina', 'Hero image may feel soft on projection; prefer original files with long edge >=2200px and short edge >=900px.', {
          src: image.src,
          natural: `${naturalW}x${naturalH}`,
        });
      }

      // 满版图用 Wikimedia /thumb/ 缩略图 URL（image-driven-deck.md §2 硬规则：满版必须原图 URL）
      // 实测北京 deck slide 3/5/6/7 用 1280px thumb 满版，投影偏糊；原图（删 /thumb/ 与 <w>px- 前缀）清晰 20 倍。
      if (isHero && /upload\.wikimedia\.org\/.*\/thumb\//i.test(image.src)) {
        pushIssue(issues, 'warning', slide.slide, 'hero-thumb-not-original', 'Full-bleed image uses a Wikimedia /thumb/ thumbnail URL; image-driven-deck.md §2 requires the original-file URL (drop /thumb/ and the <width>px- prefix) for hero/section/spread slots.', {
          src: image.src,
          natural: `${naturalW}x${naturalH}`,
        });
      }

      if (isHero && naturalRatio > 3.0 && displayRatio < 2.2) {
        pushIssue(issues, 'blocker', slide.slide, 'panorama-stretched-into-hero', 'Ultra-wide panorama is being used in a 16:9-ish hero slot; it will crop or feel low-height/cheap.', {
          src: image.src,
          naturalRatio: Number(naturalRatio.toFixed(2)),
          displayRatio: Number(displayRatio.toFixed(2)),
        });
      }
    }
  }

  const heroBySrc = new Map();
  for (const image of heroImages) {
    if (!image.srcKey) continue;
    if (!heroBySrc.has(image.srcKey)) heroBySrc.set(image.srcKey, []);
    heroBySrc.get(image.srcKey).push(image.slide);
  }
  for (const [src, slides] of heroBySrc.entries()) {
    const uniqueSlides = [...new Set(slides)];
    if (uniqueSlides.length > 1) {
      pushIssue(issues, 'blocker', uniqueSlides[0], 'repeated-hero-image', 'The same hero/chapter-scale photo is reused across multiple slides.', { src, slides: uniqueSlides });
    }
  }

  const supportBySrc = new Map();
  for (const image of allImages.filter(img => !img.isHero)) {
    if (!image.srcKey) continue;
    if (!supportBySrc.has(image.srcKey)) supportBySrc.set(image.srcKey, []);
    supportBySrc.get(image.srcKey).push(image.slide);
  }
  for (const [src, slides] of supportBySrc.entries()) {
    const uniqueSlides = [...new Set(slides)];
    if (uniqueSlides.length > 1) {
      pushIssue(issues, 'warning', uniqueSlides[0], 'repeated-support-image', 'The same support image appears on multiple slides; acceptable only when deliberately recurring.', { src, slides: uniqueSlides });
    }
  }

  const bgCounts = new Map();
  for (const slide of deck.slides) {
    bgCounts.set(slide.bgColor, (bgCounts.get(slide.bgColor) || 0) + 1);
  }
  const dominantBg = [...bgCounts.entries()].sort((a, b) => b[1] - a[1])[0] || [null, 0];
  if (deck.slides.length >= 4 && dominantBg[1] / deck.slides.length >= 0.6) {
    const driftSlides = deck.slides
      .filter(slide => slide.bgColor !== dominantBg[0])
      .map(slide => ({ slide: slide.slide, bgColor: slide.bgColor }));
    if (driftSlides.length) {
      pushIssue(issues, 'warning', driftSlides[0].slide, 'theme-background-drift', 'Most slides use one background color, but some slides drift; confirm this is intentional.', {
        dominant: dominantBg[0],
        driftSlides,
      });
    }
  }

  const blockers = issues.filter(issue => issue.severity === 'blocker');
  const warnings = issues.filter(issue => issue.severity === 'warning');
  const result = {
    passed: blockers.length === 0,
    source: filePath,
    slideCount: deck.slides.length,
    imageCount: allImages.length,
    heroImageCount: heroImages.length,
    blockerCount: blockers.length,
    warningCount: warnings.length,
    issues,
  };

  if (jsonOnly) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`image asset audit: ${result.passed ? 'PASS' : 'FAIL'}`);
    console.log(`  slides: ${result.slideCount}`);
    console.log(`  images: ${result.imageCount} (${result.heroImageCount} hero/full-bleed)`);
    console.log(`  issues: ${issues.length} (${blockers.length} blocker, ${warnings.length} warning)`);
    for (const issue of issues.slice(0, 12)) {
      const slide = issue.slide ? `slide ${issue.slide}` : 'deck';
      console.log(`  ${issue.severity.toUpperCase()} ${slide} [${issue.category}]: ${issue.message}`);
      if (issue.evidence?.natural) console.log(`    natural: ${issue.evidence.natural}`);
      if (issue.evidence?.slides) console.log(`    slides: ${issue.evidence.slides.join(', ')}`);
      if (issue.evidence?.src) console.log(`    src: ${String(issue.evidence.src).slice(0, 140)}`);
    }
  }

  process.exit(result.passed ? 0 : 1);
}

run().catch(err => {
  console.error(`image asset audit failed: ${err.message}`);
  process.exit(2);
});
