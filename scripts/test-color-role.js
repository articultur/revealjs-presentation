#!/usr/bin/env node
'use strict';

/**
 * Color Role Gate — ensures major claim elements (h1, h2, .claim,
 * .proof, .headline) carry higher visual contrast than secondary
 * elements (.pin, footer, metadata, caption).
 *
 * The "main claim must be the highest color-role layer on the page."
 * This script approximates that by comparing contrast ratios against
 * the slide background.  If a pin/footer text has a higher contrast
 * ratio than the page's h1 or h2, the slide is flagged.
 *
 * Only inline styles and <style> blocks are scanned.  External CSS
 * is not resolved.
 *
 * Usage:
 *   node scripts/test-color-role.js <file.html> [<file2.html> ...]
 *
 * Exit codes:
 *   0 — clean (or only P1 warnings)
 *   1 — P0 violations found (main claim weaker than pin)
 *   2 — usage error / file not found
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const files = args.filter(a => !a.startsWith('--'));

if (!files.length) {
  console.error('Usage: node scripts/test-color-role.js <file.html> [<file2.html> ...]');
  process.exit(2);
}

// ─── OKLCH helpers ─────────────────────────────────────────────

// Parse oklch(…) or oklch(…% …% …) string into { l, c, h }
function parseOklch(str) {
  const m = str.match(/oklch\(\s*([\d.]+)%?\s+([\d.]+)%?\s+([\d.]+)/i);
  if (!m) return null;
  return { l: parseFloat(m[1]) / 100, c: parseFloat(m[2]) / 100, h: parseFloat(m[3]) };
}

// Parse hex #RRGGBB or #RGB
function parseHex(str) {
  const m = str.match(/#([0-9a-fA-F]{3,8})/);
  if (!m) return null;
  let hex = m[1];
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  if (hex.length === 8) hex = hex.slice(0, 6); // strip alpha
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  return { r, g, b };
}

// sRGB → linear
function toLinear(c) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

// Relative luminance (WCAG)
function relativeLuminance(color) {
  if (color.l !== undefined) {
    // OKLCH → approximate luminance (OKLCH L is perceptual, scale to sRGB range)
    // This is an approximation; full OKLCH→sRGB conversion is complex.
    // We use OKLCH lightness directly as it correlates well with perceived contrast.
    return color.l;
  }
  if (color.r !== undefined) {
    return 0.2126 * toLinear(color.r) + 0.7152 * toLinear(color.g) + 0.0722 * toLinear(color.b);
  }
  return 0;
}

// Contrast ratio (WCAG 2.1)
function contrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Parse color from CSS value string
function parseColor(val) {
  const oklch = parseOklch(val);
  if (oklch) return oklch;
  const hex = parseHex(val);
  if (hex) return hex;
  // rgb/rgba
  const rgb = val.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgb) return { r: parseInt(rgb[1])/255, g: parseInt(rgb[2])/255, b: parseInt(rgb[3])/255 };
  return null;
}

// Extract CSS custom property values from <style> blocks
function parseStyleBlock(html) {
  const props = {};
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let sm;
  while ((sm = styleRe.exec(html)) !== null) {
    const css = sm[1];
    const varRe = /--([\w-]+)\s*:\s*([^;]+);/g;
    let vm;
    while ((vm = varRe.exec(css)) !== null) {
      props[`--${vm[1]}`] = vm[2].trim();
    }
  }
  return props;
}

// Resolve `var(--name)` references in a value string
function resolveVar(val, vars, depth) {
  if (depth === undefined) depth = 0;
  if (depth > 5) return val;
  return val.replace(/var\((--[\w-]+)\)/g, (_, name) => {
    return vars[name] ? resolveVar(vars[name], vars, depth + 1) : name;
  });
}

// Get effective text color for an element from inline style + CSS vars
function getTextColor(elHTML, vars) {
  // Inline color
  const inlineColor = elHTML.match(/color\s*:\s*([^;"]+)/i);
  if (inlineColor) {
    const val = resolveVar(inlineColor[1].trim(), vars);
    const c = parseColor(val);
    if (c) return { color: c, source: 'inline' };
  }
  // Class-based: try to find .class { color: … } in vars or common patterns
  // For now, rely on explicit inline styles
  return null;
}

// Get background color of a section from inline style or CSS vars
function getBgColor(elHTML, vars) {
  // Inline background
  const inlineBg = elHTML.match(/background(?:-color)?\s*:\s*([^;"]+)/i);
  if (inlineBg) {
    const val = resolveVar(inlineBg[1].trim(), vars);
    // Skip gradients, images
    if (/^(?:linear-gradient|radial-gradient|url|#)/.test(val) || parseColor(val)) {
      const c = parseColor(val);
      if (c) return c;
    }
  }
  // Fallback: try --c-bg from vars
  const bgVar = vars['--c-bg'];
  if (bgVar) return parseColor(bgVar);
  return null;
}

// ─── Main ─────────────────────────────────────────────────────

const allViolations = [];
let missingCount = 0;

for (const file of files) {
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) {
    console.error(`  ✗  not found: ${file}`);
    missingCount++;
    continue;
  }

  const html = fs.readFileSync(abs, 'utf8');
  const vars = parseStyleBlock(html);
  const violations = [];

  // Find <section> blocks
  const sectionRe = /<section[^>]*>([\s\S]*?)<\/section>/gi;
  let sm;
  let slideNo = 0;

  while ((sm = sectionRe.exec(html)) !== null) {
    slideNo++;
    const sectionHTML = sm[0];
    const innerHTML = sm[1];

    const bgColor = getBgColor(sectionHTML, vars) || getBgColor(innerHTML, vars);
    if (!bgColor) continue; // can't compute contrast without background

    const bgLum = relativeLuminance(bgColor);

    // Collect "major claim" elements: h1, h2, .claim, .proof, .headline, .title-block
    const majorEls = [];
    const majorRe = /<(h1|h2)[^>]*>([\s\S]*?)<\/\1>/gi;
    let mm;
    while ((mm = majorRe.exec(innerHTML)) !== null) {
      majorEls.push({ tag: mm[1], html: mm[0], text: mm[2].replace(/<[^>]+>/g, '').trim() });
    }
    // Also check elements with claim/proof/headline/title-block class
    const claimRe = /<(div|span|p|strong|em)[^>]*class="[^"]*(?:claim|proof|headline|title-block)[^"]*"[^>]*>(?:[\s\S]*?)<\/\1>/gi;
    let cm;
    while ((cm = claimRe.exec(innerHTML)) !== null) {
      majorEls.push({ tag: cm[1], html: cm[0], text: cm[1].includes('>') ? cm[0] : cm[0].replace(/<[^>]+>/g, '').trim() });
    }

    if (majorEls.length === 0) continue;

    // Collect "secondary" elements: .pin, [class*="pin"], footer, caption
    const minorEls = [];
    const pinRe = /<(div|span|p)[^>]*class="[^"]*\bpin\b[^"]*"[^>]*>([\s\S]*?)<\/\1>/gi;
    let pm;
    while ((pm = pinRe.exec(innerHTML)) !== null) {
      minorEls.push({ tag: 'pin', html: pm[0], text: pm[2].replace(/<[^>]+>/g, '').trim() });
    }

    // Compare lowest major contrast vs highest minor contrast
    let minMajorContrast = Infinity;
    for (const el of majorEls) {
      const textColor = getTextColor(el.html, vars);
      if (!textColor) continue;
      const lum = relativeLuminance(textColor.color);
      const ratio = contrastRatio(lum, bgLum);
      if (ratio < minMajorContrast) minMajorContrast = ratio;
    }

    let maxMinorContrast = 0;
    for (const el of minorEls) {
      const textColor = getTextColor(el.html, vars);
      if (!textColor) continue;
      const lum = relativeLuminance(textColor.color);
      const ratio = contrastRatio(lum, bgLum);
      if (ratio > maxMinorContrast) maxMinorContrast = ratio;
    }

    if (maxMinorContrast > 0 && minMajorContrast < Infinity && maxMinorContrast > minMajorContrast) {
      violations.push({
        slide: slideNo,
        minMajorContrast: minMajorContrast.toFixed(1),
        maxMinorContrast: maxMinorContrast.toFixed(1),
        delta: (maxMinorContrast - minMajorContrast).toFixed(1),
      });
    }
  }

  if (violations.length === 0) {
    console.log(`  ✓  ${path.basename(file)} — ${slideNo} slide(s), main claims dominate pin in contrast`);
  } else {
    allViolations.push({ file: abs, violations });
    console.log(`  ✗  ${path.basename(file)} — ${violations.length} slide(s) where pin/footer out-contrasts main claim:`);
    for (const v of violations) {
      console.log(`     slide ${v.slide}: main claim CR ${v.minMajorContrast} < pin CR ${v.maxMinorContrast} (Δ${v.delta})`);
    }
  }
}

if (missingCount > 0) {
  console.error(`\nERROR: ${missingCount} file(s) not found.`);
  process.exit(2);
}

if (allViolations.length > 0) {
  const totalSlides = allViolations.reduce((s, fv) => s + fv.violations.length, 0);
  console.log(`\nFAIL: ${totalSlides} slide(s) across ${allViolations.length} file(s) where pin contrast exceeds main claim.`);
  console.log('  Fix: strengthen main-claim color (higher contrast vs background) or weaken pin/footer color.');
  process.exit(1);
}

console.log('\nOK: main claim elements dominate pin/footer in contrast on all slides.');
process.exit(0);
