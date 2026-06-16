#!/usr/bin/env node
/**
 * Label Overlap Detector
 * ─────────────────────────────────────────────────────────────
 * Detects label-class elements (.pin / .stamp / .corner-mark / kicker /
 * folio) that visually overlap inside the 1280×720 viewport — INCLUDING
 * labels that belong to a non-present slide but leak into the current
 * viewport (a known blind spot of reveal.js 4.x absolute-positioned pins).
 *
 * Why this exists alongside test-pin-collision.js:
 *   test-pin-collision.js only checks pin↔content WITHIN section.present
 *   and explicitly skips pin↔pin. It cannot see a neighbor slide's pin
 *   that leaks onto the current view. This script catches that gap by
 *   scanning every visually-visible label in the viewport per slide,
 *   regardless of which section owns it.
 *
 * Usage:
 *   node scripts/test-label-overlap.js <file.html> [<file2.html> ...]
 *   node scripts/test-label-overlap.js examples/template-*.html
 *
 * Exit codes:
 *   0 — no overlapping label pairs (or only single-label slides).
 *   1 — at least one overlap pair (blocking for delivery).
 *   2 — dependency / usage error.
 *
 * Fix guidance when this fails:
 *   - Leaked pins (tagged [LEAK]) mean a non-present section's pin is
 *     visible on the current slide. Ensure the pin's offsetParent is its
 *     own <section> (give the section `position: relative`) so it hides
 *     with the section, OR confirm reveal.js is hiding .past/.future.
 *   - Same-slide overlaps mean two labels were placed at colliding
 *     coordinates — move one (e.g. `.pin.right { right:64px; left:auto }`).
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
const files = args.filter(a => !a.startsWith('--'));

if (!files.length) {
  console.error('Usage: node scripts/test-label-overlap.js <file.html> [<file2.html> ...]');
  process.exit(2);
}

// Label-class elements that carry indexing / metadata text and must not
// visually collide with each other or leak across slides.
const LABEL_SELECTOR = '.pin, .stamp, .corner-mark, [class*="kicker"], [class*="folio"], [class*="catalog-mark"]';

(async () => {
  const browser = await chromium.launch();
  let totalIssues = 0;
  let filesWithIssues = 0;

  for (const file of files) {
    const abs = path.resolve(file);
    if (!fs.existsSync(abs)) {
      console.error(`  ✗  not found: ${file}`);
      continue;
    }

    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    await page.goto('file://' + abs, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const slideCount = await page.evaluate(() =>
      document.querySelectorAll('.reveal .slides > section').length
    );

    const issues = [];

    for (let i = 0; i < slideCount; i++) {
      await page.evaluate(idx => window.Reveal && window.Reveal.slide(idx, 0), i);
      await page.waitForTimeout(100);

      const result = await page.evaluate(({ slideIdx, sel }) => {
        function isVisible(el) {
          if (!el.isConnected) return false;
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return false;
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) return false;
          // inside the 1280×720 viewport (allow a few px of bleed)
          if (r.right < 2 || r.left > 1278 || r.bottom < 2 || r.top > 718) return false;
          return true;
        }

        const present = document.querySelector('.reveal .slides > section.present');
        const labels = Array.from(document.querySelectorAll(sel)).filter(isVisible);

        const items = labels.map(el => {
          const r = el.getBoundingClientRect();
          const ownSection = el.closest('section');
          const leak = !!(present && ownSection && ownSection !== present);
          return {
            text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
            cls: (typeof el.className === 'string' ? el.className : '').split(' ').filter(Boolean).join('.'),
            rect: { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom) },
            leak,
          };
        });

        const overlaps = [];
        for (let a = 0; a < items.length; a++) {
          for (let b = a + 1; b < items.length; b++) {
            const A = items[a].rect, B = items[b].rect;
            const ix = Math.min(A.r, B.r) - Math.max(A.l, B.l);
            const iy = Math.min(A.b, B.b) - Math.max(A.t, B.t);
            if (ix > 8 && iy > 4) {
              overlaps.push({ a: items[a], b: items[b], ix, iy });
            }
          }
        }
        return { slide: slideIdx + 1, visible: items.length, leakCount: items.filter(x => x.leak).length, overlaps };
      }, { slideIdx: i, sel: LABEL_SELECTOR });

      for (const ov of result.overlaps) {
        issues.push({
          slide: result.slide,
          a: ov.a, b: ov.b, ix: ov.ix, iy: ov.iy,
          leak: ov.a.leak || ov.b.leak,
        });
      }
    }

    if (issues.length === 0) {
      console.log(`  ✓  ${path.basename(file)} — no label overlap on ${slideCount} slide(s)`);
    } else {
      filesWithIssues++;
      totalIssues += issues.length;
      const leaks = issues.filter(it => it.leak).length;
      console.log(`  ✗  ${path.basename(file)} — ${issues.length} overlap pair(s)${leaks ? ` (${leaks} involve leaked labels)` : ''}:`);
      for (const it of issues.slice(0, 15)) {
        const tag = it.leak ? ' [LEAK]' : '';
        console.log(`     slide ${it.slide}${tag}: ${it.ix}x${it.iy}px  "${it.a.text}" <-> "${it.b.text}"`);
      }
      if (issues.length > 15) console.log(`     ... and ${issues.length - 15} more`);
    }

    await context.close();
  }

  await browser.close();

  if (totalIssues > 0) {
    console.log(`\nFAIL: ${totalIssues} label overlap pair(s) across ${filesWithIssues} file(s).`);
    console.log('  [LEAK] = label from a non-present slide leaking into the viewport.');
    console.log('  Fix: ensure each <section> is `position: relative` so its absolute .pin hides with it; or move colliding labels apart (`.pin.right { right:64px; left:auto }`).');
    process.exit(1);
  }
  console.log('\nOK: no label overlaps.');
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(2);
});
