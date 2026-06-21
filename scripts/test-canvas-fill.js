#!/usr/bin/env node
'use strict';

/**
 * Canvas-Fill Gate — every section must occupy the slide canvas.
 * ─────────────────────────────────────────────────────────────
 * Catches the defect visual-check.js MEASURES but does not flag: a
 * `<section>` without `height:720px` (or equivalent) renders at content
 * height (300–530px) instead of the full ~691px canvas, so content strands
 * at the top with a large empty band below. validate.js can't see it (it
 * checks OVER-flow, never UNDER-fill); visual-check prints the canvas size
 * but has no threshold on it.
 *
 * Two structural assertions (NOT aesthetic — "how full" stays advisory in
 * visual-check's fillH):
 *   (a) tallest section ≥ 600px  → at least one page fills the canvas
 *   (b) shortest section ≥ 92% of tallest → all pages share one canvas size
 *
 * Why structural not aesthetic: a section that doesn't occupy its 720 canvas
 * is a sizing bug (content-height short box), not a "minimalist breathing
 * room" choice. Breathing room happens INSIDE a full canvas.
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

const FLOOR = 600;        // a full-canvas section renders ~691 at 1280×720 viewport
const CONSISTENCY = 0.92; // shortest ≥ 92% of tallest

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
    const floorOk = max >= FLOOR;
    const consistOk = ratio >= CONSISTENCY;
    const shortSlides = heights.map((h, i) => ({ s: i + 1, h })).filter(x => x.h < CONSISTENCY * max);

    if (floorOk && consistOk) {
      console.log(`  ✓  ${path.basename(file)} — ${n} slide(s) fill canvas (${min}–${max}px)`);
    } else {
      const reasons = [];
      if (!floorOk) reasons.push(`tallest ${max}px < ${FLOOR}`);
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
    console.log('  Fix: give `.reveal section` `height:720px` (and vertically distribute content); a content-height section renders short.');
    process.exit(1);
  }
  console.log('\nOK: every section fills the slide canvas.');
  process.exit(0);
})().catch(e => { console.error('error:', e.message); process.exit(2); });
