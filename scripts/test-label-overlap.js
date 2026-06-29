#!/usr/bin/env node
/**
 * Label Overlap Detector
 * ─────────────────────────────────────────────────────────────
 * Detects label-class elements (.pin / .source / .photo-credit / .evidence-label / .stamp / .corner-mark / kicker)
 * that visually overlap inside the 1280×720 viewport — INCLUDING
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
 *   0 — no overlapping label pairs (and no missing files).
 *   1 — at least one overlap pair (blocking for delivery).
 *   2 — dependency / usage error / missing file(s) (CI must not be fooled).
 *
 * Fix guidance when this fails:
 *   - Leaked pins (tagged [LEAK]) mean a non-present section's pin is
 *     visible on the current slide. Reveal.css already sets sections to
 *     `position: absolute` — verify this has not been overridden to
 *     `position: static` by custom CSS. If the section's positioning is
 *     intact, the pin's `position: absolute` resolves to the section
 *     automatically and hides with it via reveal's opacity toggle.
 *     Do NOT add `position: relative` to sections — this will break
 *     reveal's slide stacking and cause all but the first slide to
 *     appear blank (v15.2 regression: slide 3 top=1397).
 *   - Same-slide overlaps mean two labels were placed at colliding
 *     coordinates — move one (e.g. `.pin.right { right:64px; left:auto }`).
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { LABEL_SELECTOR } = require('./qa-selectors');

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

// Label-class elements: 真正的索引/元数据小元素。选择器集中在 qa-selectors.js，
// 防止新增 page furniture class 后只改一处检测、另一处继续漏检。

(async () => {
  const browser = await chromium.launch();
  let totalIssues = 0;
  let filesWithIssues = 0;
  let missingCount = 0;  // MINOR5: track missing files so CI gate can't be fooled by a typo'd path

  for (const file of files) {
    const abs = path.resolve(file);
    if (!fs.existsSync(abs)) {
      console.error(`  ✗  not found: ${file}`);
      missingCount++;
      continue;
    }

    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    await page.goto('file://' + abs, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    // MAJOR1: enumerate horizontal sections AND their nested vertical sub-slides
    // (reveal.js drill-down pages). Old code hardcoded v=0 and missed verticals.
    const horizontals = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.reveal .slides > section')).map(hor => ({
        vCount: hor.querySelectorAll(':scope > section').length,
      }))
    );

    const issues = [];
    let slideNo = 0;

    for (let h = 0; h < horizontals.length; h++) {
      const vCount = Math.max(1, horizontals[h].vCount);
      for (let v = 0; v < vCount; v++) {
        slideNo++;
        await page.evaluate(([hh, vv]) => window.Reveal && window.Reveal.slide(hh, vv), [h, v]);
        // MAJOR2: wait for the fade transition to actually settle, not just 100ms.
        // reveal.js default fade ≈ 300ms; 450ms covers it with margin. The old 100ms
        // relied on overflow:hidden's instant clip = fragile coupling to a CSS side-effect.
        await page.waitForTimeout(450);

        const result = await page.evaluate(({ slideIdx, sel }) => {
          function isVisible(el) {
            if (!el.isConnected) return false;
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return false;
            // 祖先 opacity:0 → 视觉不可见。reveal.js 用 opacity 隐藏非 present section，
            // label 自己 opacity:1 但被父 section opacity:0 遮蔽 = 视觉不可见。不查祖先会
            // 误判为可见 → 假阳性泄露（曾让 5 个正常模板报 120 对假泄露）。
            let anc = el.parentElement;
            while (anc && !anc.classList.contains('reveal')) {
              if (parseFloat(getComputedStyle(anc).opacity) < 0.05) return false;
              anc = anc.parentElement;
            }
            const r = el.getBoundingClientRect();
            if (r.width < 2 || r.height < 2) return false;
            // label 是小尺寸索引/元数据元素；排除被选择器误匹配的布局容器（双保险，
            // 即使选择器命中 .folio-grid 等容器，尺寸 >600×120 也会被滤掉）。
            // 实测依据: .folio-grid ~1280×640 / .archive-cover ~1280×720 被挡，
            // .stamp ≤300×60 / .pin ≤120×40 / .kicker ≤440×60 放行（template-01..05）。
            if (r.width > 600 || r.height > 120) return false;
            // inside the 1280×720 viewport (allow a few px of bleed)
            if (r.right < 2 || r.left > 1278 || r.bottom < 2 || r.top > 718) return false;
            return true;
          }

          const labels = Array.from(document.querySelectorAll(sel)).filter(isVisible);

          const items = labels.map(el => {
            const r = el.getBoundingClientRect();
            // MAJOR1: leak = label 不在任何 .present section 内（属于 .past/.future）。
            // 用 closest('section.present') 正确处理嵌套 vertical 栈：当 inner sub-slide
            // active 时 reveal 把 .present 放在 inner section，inner label 的 closest
            // 命中它 → 非 leak；其他 vertical sub 的 label closest 落空 → leak。
            const leak = !el.closest('section.present');
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
          return { slide: slideIdx, visible: items.length, leakCount: items.filter(x => x.leak).length, overlaps };
        }, { slideIdx: slideNo, sel: LABEL_SELECTOR });

        for (const ov of result.overlaps) {
          issues.push({
            slide: result.slide,
            a: ov.a, b: ov.b, ix: ov.ix, iy: ov.iy,
            leak: ov.a.leak || ov.b.leak,
          });
        }
      }
    }

    if (issues.length === 0) {
      console.log(`  ✓  ${path.basename(file)} — no label overlap on ${slideNo} slide(s)`);
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
    console.log('  Fix: ensure each <section> is `position: relative !important` so its absolute .pin hides with it; or move colliding labels apart (`.pin.right { right:64px; left:auto }`).');
    process.exit(1);
  }
  if (missingCount > 0) {
    console.error(`\nERROR: ${missingCount} file(s) not found. A blocking gate must not exit 0 on missing input.`);
    process.exit(2);
  }
  console.log('\nOK: no label overlaps.');
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(2);
});
