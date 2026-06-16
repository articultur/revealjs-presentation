#!/usr/bin/env node
/**
 * Pin Collision Detector
 * ─────────────────────────────────────────────────────────────
 * Validates that every slide's `.pin` element does NOT visually
 * overlap any other content element. Pin region must stay clear
 * because pin text is auxiliary indexing — content elements
 * overlapping the pin produce "ghost text" / unreadable overlay.
 *
 * Usage:
 *   node scripts/test-pin-collision.js <file.html> [--show-fragments]
 *   node scripts/test-pin-collision.js examples/template-*.html
 *
 * Exit codes:
 *   0 — no collisions, or only collisions with elements marked
 *       `data-qa-ignore="decorative"`.
 *   1 — at least one real collision (blocking for delivery).
 *
 * Detection logic:
 *   For each slide, find every `.pin` element + its bounding rect.
 *   Then for every other element with non-empty text or non-zero
 *   size, check axis-aligned bounding-box intersection with the
 *   pin rect (inflated by 4px on each side).
 *   Elements that are themselves pins, ancestors of a pin, or
 *   tagged `data-qa-ignore="decorative"` are skipped.
 */

'use strict';

const path = require('path');
const fs = require('fs');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (err) {
  console.error('Missing dependency: playwright. Run `npm install playwright` first.');
  process.exit(2);
}

const args = process.argv.slice(2);
const showFragments = args.includes('--show-fragments');
const files = args.filter(a => !a.startsWith('--'));

if (!files.length) {
  console.error('Usage: node scripts/test-pin-collision.js <file.html> [<file2.html> ...] [--show-fragments]');
  process.exit(2);
}

(async () => {
  const browser = await chromium.launch();
  let totalCollisions = 0;
  let filesWithCollisions = 0;

  for (const file of files) {
    const abs = path.resolve(file);
    if (!fs.existsSync(abs)) {
      console.error(`  ✗  not found: ${file}`);
      continue;
    }

    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    await page.goto('file://' + abs, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);

    const slideCount = await page.evaluate(() =>
      document.querySelectorAll('.reveal .slides > section').length
    );

    const collisions = [];

    for (let i = 0; i < slideCount; i++) {
      // Go to slide i (Reveal.js navigation)
      await page.evaluate(idx => window.Reveal && window.Reveal.slide(idx, 0), i);
      await page.waitForTimeout(80);

      if (showFragments) {
        // Reveal all fragments on the slide
        await page.evaluate(() => {
          if (window.Reveal) {
            const total = window.Reveal.getTotalSlides();
            while (window.Reveal.nextFragment && window.Reveal.nextFragment()) {/* loop */}
          }
        });
        await page.waitForTimeout(80);
      }

      const slideCollisions = await page.evaluate(({ slideIdx, pad }) => {
        function rectsOverlap(a, b, pad) {
          return !(a.right + pad < b.left ||
                   a.left - pad > b.right ||
                   a.bottom + pad < b.top ||
                   a.top - pad > b.bottom);
        }
        function isVisible(el) {
          if (!el.isConnected) return false;
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return false;
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) return false;
          return true;
        }
        function isIgnored(el) {
          return !!el.closest('[data-qa-ignore="decorative"]');
        }
        function summary(el) {
          const cls = el.className && typeof el.className === 'string' ? el.className.split(' ').filter(Boolean).join('.') : '';
          const txt = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
          return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}${txt ? ' “' + txt + '”' : ''}`;
        }

        const present = document.querySelector('.reveal .slides > section.present');
        if (!present) return [];
        const pins = Array.from(present.querySelectorAll('.pin')).filter(isVisible);
        if (!pins.length) return [];

        const results = [];
        for (const pin of pins) {
          const pinRect = pin.getBoundingClientRect();
          const candidates = present.querySelectorAll('*');
          for (const el of candidates) {
            if (el === pin) continue;
            if (el.contains(pin) || pin.contains(el)) continue;
            if (el.classList && el.classList.contains('pin')) continue;
            if (isIgnored(el)) continue;
            if (!isVisible(el)) continue;
            // Only flag elements with their own text (leaf-ish) to avoid
            // huge wrapper containers swamping the report
            const hasOwnText = Array.from(el.childNodes).some(n =>
              n.nodeType === 3 && n.textContent.trim().length > 0
            );
            const isLeafBg = el.children.length === 0;
            if (!hasOwnText && !isLeafBg) continue;
            const r = el.getBoundingClientRect();
            if (r.width < 4 || r.height < 4) continue;
            if (rectsOverlap(pinRect, r, pad)) {
              results.push({
                slide: slideIdx + 1,
                pinText: (pin.textContent || '').trim(),
                pinRect: { l: Math.round(pinRect.left), t: Math.round(pinRect.top), r: Math.round(pinRect.right), b: Math.round(pinRect.bottom) },
                offender: summary(el),
                offenderRect: { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom) },
              });
            }
          }
        }
        return results;
      }, { slideIdx: i, pad: 6 });

      collisions.push(...slideCollisions);
    }

    if (collisions.length === 0) {
      console.log(`  ✓  ${path.basename(file)} — pin region clear on all ${slideCount} slide(s)`);
    } else {
      filesWithCollisions++;
      totalCollisions += collisions.length;
      console.log(`  ✗  ${path.basename(file)} — ${collisions.length} collision(s):`);
      for (const c of collisions) {
        console.log(`     slide ${c.slide} · pin "${c.pinText}"`);
        console.log(`        overlaps: ${c.offender}`);
        console.log(`        pin rect ${JSON.stringify(c.pinRect)} vs offender ${JSON.stringify(c.offenderRect)}`);
      }
    }

    await context.close();
  }

  await browser.close();

  if (totalCollisions > 0) {
    console.log(`\nFAIL: ${totalCollisions} pin collision(s) across ${filesWithCollisions} file(s). Move pin to the right (\`right:64px; left:auto\`) OR add padding-bottom (\`>= 56px\`) OR mark offender \`data-qa-ignore="decorative"\` if it is genuinely decorative.`);
    process.exit(1);
  }
  console.log('\nOK: all pin regions clear.');
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(2);
});
