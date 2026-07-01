#!/usr/bin/env node
'use strict';

/**
 * Canvas-Fill Gate — every section must occupy the slide canvas.
 * ─────────────────────────────────────────────────────────────
 * Catches the defect visual-check.js MEASURES but does not flag: a
 * `<section>` without canvas height renders at content height (300–530px)
 * instead of the full canvas, so content strands at the top with a large
 * empty band below. validate.js can't see it (it checks OVER-flow, never
 * UNDER-fill); visual-check prints the canvas size but has no threshold.
 *
 * Two structural assertions (NOT aesthetic — "how full" stays advisory in
 * visual-check's fillH):
 *   (a) tallest section ≥ FLOOR_RATIO × canvas height → at least one page fills
 *   (b) shortest section ≥ 92% of tallest → all pages share one canvas size
 *
 * Canvas-adaptive (盲区 #2 修复, 2026-07):
 *   原硬编码 viewport:{1280,720} + FLOOR=600，对竖屏 720×1280 等非 16:9 deck
 *   会把画布 transform:scale 缩到接近 0 → tallest<600 误报。现读 Reveal.getConfig()
 *   的 width/height 把视口对齐到 deck 声明的画布，FLOOR 按画布高度等比。
 *   横屏 deck（dims=1280×720）行为完全不变（floor=600）。
 *
 * Usage:
 *   node scripts/test-canvas-fill.js <file.html> [<file2.html> ...]
 * Exit: 0 = all sections fill; 1 = under-filled / inconsistent; 2 = usage/dep.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const files = args.filter(a => !a.startsWith('--'));
if (!files.length) { console.error('Usage: node scripts/test-canvas-fill.js <file.html> [...]'); process.exit(2); }

const FLOOR_RATIO = 600 / 720;   // full-canvas section ≈ 83% of canvas height（原 FLOOR=600 ÷ 720，现按 deck 画布等比）
const CONSISTENCY = 0.92;        // shortest ≥ 92% of tallest

(async () => {
  let browser;
  try { browser = await chromium.launch(); }
  catch (e) { console.error(`ERROR: Playwright/chromium unavailable — ${e.message}`); process.exit(2); }

  const allViolations = [];
  let missing = 0;

  for (const file of files) {
    const abs = path.resolve(file);
    if (!fs.existsSync(abs)) { console.error(`  ✗  not found: ${file}`); missing++; continue; }
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto('file://' + abs, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(600);
    const ready = await page.evaluate(() => typeof Reveal !== 'undefined').catch(() => false);
    if (!ready) { console.error(`  ✗  ${path.basename(file)} — Reveal not loaded`); await page.close(); missing++; continue; }

    // 自适应视口到 deck 声明的画布。读 Reveal.getConfig() 的 width/height；非默认画布
    // （如竖屏 720×1280）则 setViewportSize 对齐 + 等 Reveal transform:scale 重算。
    const dims = await page.evaluate(() => {
      try {
        const c = (window.Reveal && Reveal.getConfig) ? Reveal.getConfig() : {};
        return { w: Number(c.width) || 1280, h: Number(c.height) || 720 };
      } catch (e) { return { w: 1280, h: 720 }; }
    }).catch(() => ({ w: 1280, h: 720 }));
    if (dims.w !== 1280 || dims.h !== 720) {
      await page.setViewportSize({ width: dims.w, height: dims.h });
      // setViewportSize 不触发 Reveal 重排——必须手动 layout() 让 transform:scale 按新视口
      // 重算，否则 section 仍按初始 1280×720 视口的旧 scale 渲染 → getBoundingClientRect 失真
      // （竖屏曾 tallest 0px：旧 scale 0.5625 把 720×1280 画布缩到 405×720 又被新视口挤偏）。
      await page.evaluate(() => { try { window.Reveal && window.Reveal.layout && window.Reveal.layout(); } catch (e) {} });
      await page.waitForTimeout(400);
    }
    const floor = Math.round(dims.h * FLOOR_RATIO);

    const n = await page.evaluate(() => document.querySelectorAll('.reveal .slides > section').length);
    const heights = [];
    for (let i = 0; i < n; i++) {
      await page.evaluate(idx => Reveal.slide(idx, 0), i);
      await page.waitForTimeout(200);
      const h = await page.evaluate(() => {
        const s = document.querySelector('.reveal section.present');
        return s ? Math.round(s.getBoundingClientRect().height) : 0;
      });
      heights.push(h);
    }
    await page.close();

    const max = Math.max(...heights);
    const min = Math.min(...heights);
    const ratio = max > 0 ? min / max : 0;
    const floorOk = max >= floor;
    const consistOk = ratio >= CONSISTENCY;
    const shortSlides = heights.map((h, i) => ({ s: i + 1, h })).filter(x => x.h < CONSISTENCY * max);

    if (floorOk && consistOk) {
      console.log(`  ✓  ${path.basename(file)} — ${n} slide(s) fill canvas (${min}–${max}px, ${dims.w}×${dims.h})`);
    } else {
      const reasons = [];
      if (!floorOk) reasons.push(`tallest ${max}px < ${floor} (canvas ${dims.w}×${dims.h})`);
      if (!consistOk) reasons.push(`shortest ${min}px = ${Math.round(ratio * 100)}% of tallest`);
      allViolations.push({ file: abs, max, min, shortSlides });
      console.log(`  ✗  ${path.basename(file)} — ${reasons.join('; ')}`);
      for (const x of shortSlides) console.log(`     slide ${x.s}: ${x.h}px`);
    }
  }

  await browser.close();
  if (missing > 0) { console.error(`\nERROR: ${missing} file(s) not found.`); process.exit(2); }
  if (allViolations.length) {
    console.log(`\nFAIL: ${allViolations.length} file(s) with sections not filling the canvas.`);
    console.log('  Fix: give `.reveal section` the canvas height (e.g. 720, or the deck-declared height); a content-height section renders short.');
    process.exit(1);
  }
  console.log('\nOK: every section fills the slide canvas.');
  process.exit(0);
})().catch(e => { console.error('error:', e.message); process.exit(2); });
