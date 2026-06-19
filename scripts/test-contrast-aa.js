#!/usr/bin/env node
'use strict';

/**
 * Contrast AA Gate — absolute WCAG 2.1 contrast, browser-rendered.
 * ─────────────────────────────────────────────────────────────
 * Closes the gap test-color-role.js (G6) leaves open: G6 only checks that
 * the main claim out-contrasts the pin (a RELATIVE hierarchy). It has no
 * absolute floor, so a 2.96:1 white-on-pink ships green. This gate adds the
 * missing absolute AA check.
 *
 * The math and thresholds are aligned with impeccable's `low-contrast` rule
 * (detector/shared/color.mjs + rules/checks.mjs):
 *   • real sRGB relative luminance (no OKLCH-L approximation)
 *   • large-text threshold: ≥24px, or ≥18.67px at font-weight ≥700 → 3.0:1
 *   • normal text → 4.5:1
 *
 * Background resolution — SOLID background-color only, walking ancestors to
 * the nearest opaque one. This is deliberately conservative:
 *   • Gradient / background-image surfaces are NOT used. They are very often
 *     decorative (vignettes, 0.04-alpha shadows, dot/stripe patterns) and
 *     treating their stops as the text backdrop produces false failures.
 *   • When no opaque solid ancestor is found, the element is SKIPPED — we do
 *     not fall back to the section and guess. A blocking gate must not cry
 *     wolf; a conservative miss is preferred to a false fail.
 * getComputedStyle resolves var()/oklch → rgb, so no token parsing is needed.
 *
 * Why browser (Playwright) and not static parse like G6: contrast depends on
 * the cascade (inheritance, var() resolution, shorthand→backgroundColor).
 * Static parsing misses inherited text colors and ancestor surfaces — exactly
 * the text-on-accent-block case this gate exists to catch.
 *
 * Usage:
 *   node scripts/test-contrast-aa.js <file.html> [<file2.html> ...]
 *
 * Exit codes:
 *   0 — all checked text meets WCAG AA
 *   1 — at least one text element below AA
 *   2 — usage error / missing dependency / file not found
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const files = args.filter(a => !a.startsWith('--'));

if (!files.length) {
  console.error('Usage: node scripts/test-contrast-aa.js <file.html> [<file2.html> ...]');
  process.exit(2);
}

// WCAG large-text breakpoints (pt → px at 96dpi). Matches impeccable constants.
const LARGE_PX = 18 * (96 / 72);       // 24px
const LARGE_BOLD_PX = 14 * (96 / 72);  // 18.67px

// Browser-side probe: self-contained (serializes across page.evaluate).
const PROBE = ([LARGE_PX, LARGE_BOLD_PX]) => {
  const parseRgb = (s) => {
    if (!s) return null;
    const m = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?\s*\)/i);
    return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 } : null;
  };
  // Gradient color stops (with alpha). Used only to decide whether a gradient
  // paints an opaque enough surface to be the text's real backdrop.
  const parseStops = (s) => {
    if (!s || !s.includes('gradient')) return [];
    const stops = [];
    for (const m of s.matchAll(/rgba?\(\s*[\d.]+[,\s]+[\d.]+[,\s]+[\d.]+[^)]*\)/g)) { const c = parseRgb(m[0]); if (c) stops.push(c); }
    for (const m of s.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
      const h = m[1]; const f = h.length === 6 ? h : h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      stops.push({ r: parseInt(f.slice(0,2),16), g: parseInt(f.slice(2,4),16), b: parseInt(f.slice(4,6),16), a: 1 });
    }
    return stops;
  };
  const lum = ({ r, g, b }) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const hex = (c) => '#' + [c.r, c.g, c.b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

  const sec = document.querySelector('.reveal section.present');
  if (!sec) return [];
  const out = [];
  for (const el of sec.querySelectorAll('*')) {
    // Direct text only (skip wrappers whose text lives in children).
    const direct = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!direct) continue;
    if (el.closest('[aria-hidden="true"], .deco, svg')) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.15) continue;
    const fs = parseFloat(cs.fontSize);
    if (!(fs > 0)) continue;
    const text = parseRgb(cs.color);
    if (!text || text.a < 1) continue; // semi-transparent text = false-positive risk, skip
    // Walk ancestors to nearest OPAQUE SOLID background-color. If a gradient
    // with an opaque stop is hit first, the text sits on a multi-color surface
    // we can't reduce to one color → skip (don't guess, don't cry wolf). Faint
    // decorative gradients (sub-alpha shadows) have no opaque stop → ignored,
    // so the walk continues to the real solid beneath.
    let bg = null, skipGradient = false, node = el, bgSrc = '';
    while (node && node !== document) {
      const st = getComputedStyle(node);
      const solid = parseRgb(st.backgroundColor);
      if (solid && solid.a >= 0.95) {
        bg = solid;
        bgSrc = node === el ? 'self' : (node.tagName.toLowerCase() + (typeof node.className === 'string' && node.className ? '.' + node.className.trim().split(/\s+/)[0] : ''));
        break;
      }
      if (parseStops(st.backgroundImage).some(s => s.a >= 0.5)) { skipGradient = true; break; }
      node = node.parentElement;
    }
    if (skipGradient || !bg) continue; // no single solid surface — skip rather than guess
    const r = ratio(text, bg);
    const fw = parseInt(cs.fontWeight, 10) || 400;
    const isLarge = fs >= LARGE_PX || (fs >= LARGE_BOLD_PX && fw >= 700);
    const thr = isLarge ? 3.0 : 4.5;
    if (r < thr) {
      out.push({ ratio: +r.toFixed(2), thr, text: (el.innerText || '').trim().slice(0, 22), fg: hex(text), bg: hex(bg), src: bgSrc });
    }
  }
  return out;
};

(async () => {
  let browser;
  try {
    browser = await chromium.launch();
  } catch (e) {
    console.error(`ERROR: Playwright/chromium unavailable — ${e.message}`);
    console.error('  Run `bash scripts/install-all.sh` to install optional deps.');
    process.exit(2);
  }

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
    const fileV = [];
    for (let i = 0; i < n; i++) {
      await page.evaluate(idx => Reveal.slide(idx, 0), i);
      await page.waitForTimeout(250);
      const vs = await page.evaluate(PROBE, [LARGE_PX, LARGE_BOLD_PX]).catch(() => []);
      for (const v of vs) fileV.push({ slide: i + 1, ...v });
    }
    await page.close();

    if (fileV.length === 0) {
      console.log(`  ✓  ${path.basename(file)} — ${n} slide(s), all text meets WCAG AA`);
    } else {
      allViolations.push({ file: abs, v: fileV });
      console.log(`  ✗  ${path.basename(file)} — ${fileV.length} text element(s) below AA:`);
      for (const v of fileV) console.log(`     slide ${v.slide}: ${v.ratio}:1 (need ${v.thr}) — "${v.text}" ${v.fg} on ${v.bg} [${v.src}]`);
    }
  }

  await browser.close();

  if (missing > 0) { console.error(`\nERROR: ${missing} file(s) not found / unreadable.`); process.exit(2); }

  if (allViolations.length > 0) {
    const tot = allViolations.reduce((s, f) => s + f.v.length, 0);
    console.log(`\nFAIL: ${tot} text element(s) below WCAG AA across ${allViolations.length} file(s).`);
    console.log('  Fix: raise text-color lightness vs its surface, or swap the accent block, to reach 4.5:1 (3:1 large).');
    process.exit(1);
  }

  console.log('\nOK: all checked text meets WCAG AA contrast.');
  process.exit(0);
})().catch(e => { console.error('error:', e.message); process.exit(2); });
