#!/usr/bin/env node
'use strict';

/**
 * Main Claim Gate — ensures pin text carries only index metadata,
 * not the sole topical expression of a slide.
 *
 * For each <section>: if the pin/索引 contains topic/subject words
 * that appear nowhere in the main visual area (h1/h2/h3 or content
 * with font-size ≥ 1.2em), the slide fails this gate.
 *
 * Usage:
 *   node scripts/test-lint-main-claim.js <file.html> [<file2.html> ...]
 *
 * Exit codes:
 *   0 — no violations
 *   1 — at least one slide fails (blocking for delivery)
 *   2 — usage error / file not found
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const files = args.filter(a => !a.startsWith('--'));

if (!files.length) {
  console.error('Usage: node scripts/test-lint-main-claim.js <file.html> [<file2.html> ...]');
  process.exit(2);
}

// ─── Helpers ──────────────────────────────────────────────────

// Extract meaningful topic words — CJK only.
// 只提取 CJK 主题词（≥2 中文字）。英文索引词（cover / proof / mechanism / stage
// 等页面角色词）不作为主题词，与 lint-design.js 的 isMeaningfulPinTopic 对齐：
// 5 套种子模板的 pin 全是英文索引（"01 · cover"），主题由 h1/h2 承担；若把英文
// 索引词当主题词检查，pin 角色词不在 main 标题 → 5 模板全部误报（实测 25 处）。
// 中文 deck 的 pin 主题词是中文（如"价格屠夫"），CJK 提取能正确捕获。
function topicWords(text) {
  const cleaned = text
    .replace(/[0-9]+\s*[\/·]\s*/g, '')   // strip "06 / "
    .replace(/[\d.,%+\-×x()（）【】\[\]]/g, '')  // strip numbers / symbols
    .trim();
  const cjk = cleaned.match(/[一-鿿]{2,}/g);
  return cjk ? [...new Set(cjk)] : [];
}

// Check if any topic word from pin appears in main-visual text
function topicCoveredByMain(pinText, mainText) {
  const pinTopics = topicWords(pinText);
  if (pinTopics.length === 0) return true;  // no extractable topic = pass
  const mainLower = mainText.toLowerCase();
  return pinTopics.every(w => {
    // Check both exact and lowercased
    if (mainLower.includes(w.toLowerCase())) return true;
    return false;
  });
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
  const violations = [];

  // Pin-first extraction: locate every .pin, then find its enclosing
  // <section>…</section> pair by tag-counting.  This handles nested
  // vertical slides correctly — no false matches on container sections.

  // Step 1 — collect all .pin positions and text.
  // 修复 (闭环审查发现)：原正则只匹配 <div class="pin">，但 5 套种子模板的
  // pin 全部是 <span class="pin">，导致脚本对每个模板都报 "no .pin elements
  // found" 静默 pass —— 门禁形同虚设（假绿色）。改为匹配任意标签，与
  // lint-design.js 的 checkPinMainClaimHierarchy 用同一正则，保证两者一致。
  const pinRegex = /<[^>]*class="[^"]*\bpin\b[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/gi;
  const pins = [];
  let pmatch;
  while ((pmatch = pinRegex.exec(html)) !== null) {
    const t = pmatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (t) pins.push({ index: pmatch.index, text: t });
  }
  if (pins.length === 0) {
    console.log(`  ✓  ${path.basename(file)} — no .pin elements found, nothing to gate`);
    continue;
  }

  // Step 2 — for each pin, find its enclosing section boundaries
  let slideNo = 0;
  for (const pin of pins) {
    // Walk backwards from pin to find nearest <section open>
    const before = html.slice(0, pin.index);
    const tagsBefore = [...before.matchAll(/<\/?section[^>]*>/gi)];
    if (tagsBefore.length === 0) continue;
    let depth = 0, sectionStart = -1;
    for (let i = tagsBefore.length - 1; i >= 0; i--) {
      const t = tagsBefore[i][0];
      if (/<\/section>/i.test(t)) { depth++; continue; }
      if (/<section[^>]*>/i.test(t)) {
        if (depth === 0) { sectionStart = tagsBefore[i].index; break; }
        depth--;
      }
    }
    if (sectionStart < 0) continue;

    // Walk forward from pin to find matching </section>
    const after = html.slice(pin.index);
    const tagsAfter = [...after.matchAll(/<\/?section[^>]*>/gi)];
    depth = 0; let sectionEnd = -1;
    for (const m of tagsAfter) {
      const t = m[0];
      if (/<section[^>]*>/i.test(t)) { depth++; continue; }
      if (/<\/section>/i.test(t)) {
        if (depth === 0) { sectionEnd = pin.index + m.index + t.length; break; }
        depth--;
      }
    }
    if (sectionEnd < 0) continue;

    slideNo++;
    const pinText = pin.text;
    const sectionHTML = html.slice(sectionStart, sectionEnd);

    // Extract main-visual text
    const mainVisualTexts = [];
    for (const tag of ['h1', 'h2', 'h3']) {
      const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
      let hm;
      while ((hm = re.exec(sectionHTML)) !== null) {
        mainVisualTexts.push(hm[1].replace(/<[^>]+>/g, '').trim());
      }
    }
    const largeTextRe = /<(div|span|p|strong|em)[^>]*font-size\s*:\s*(?:clamp\([^)]*(?:[2-9]|\d{2,})[^)]*\)|(?:[2-9]|\d{2,})(?:\.\d+)?em)[^>]*>([\s\S]*?)<\/(?:div|span|p|strong|em)>/gi;
    let lt;
    while ((lt = largeTextRe.exec(sectionHTML)) !== null) {
      const t = lt[2].replace(/<[^>]+>/g, '').trim();
      if (t) mainVisualTexts.push(t);
    }
    const proofRe = /<(div|span|p|strong|em)[^>]*class="[^"]*(?:claim|proof|metric|stat|statement|headline|title-block|quote|kicker|eyebrow)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|span|p|strong|em)>/gi;
    let pm2;
    while ((pm2 = proofRe.exec(sectionHTML)) !== null) {
      const t = pm2[2].replace(/<[^>]+>/g, '').trim();
      if (t && t.length > 3) mainVisualTexts.push(t);
    }

    const mainText = mainVisualTexts.join(' ');

    if (!topicCoveredByMain(pinText, mainText)) {
      violations.push({
        slide: slideNo,
        pin: pinText.slice(0, 60),
        mainExcerpt: mainText.slice(0, 80) || '(no main-visual text found)',
      });
    }
  }


  if (violations.length === 0) {
    console.log(`  ✓  ${path.basename(file)} — ${slideNo} slide(s), all pins backed by main visual`);
  } else {
    allViolations.push({ file: abs, violations });
    console.log(`  ✗  ${path.basename(file)} — ${violations.length} slide(s) where pin carries topic not in main visual:`);
    for (const v of violations) {
      console.log(`     slide ${v.slide}: pin="${v.pin}"  main="${v.mainExcerpt}"`);
    }
  }
}

if (missingCount > 0) {
  console.error(`\nERROR: ${missingCount} file(s) not found.`);
  process.exit(2);
}

if (allViolations.length > 0) {
  const totalSlides = allViolations.reduce((s, fv) => s + fv.violations.length, 0);
  console.log(`\nFAIL: ${totalSlides} slide(s) across ${allViolations.length} file(s) fail main-claim gate.`);
  console.log('  Fix: move topic expression from pin into h1/h2/h3 or large proof object in the visual area.');
  process.exit(1);
}

console.log('\nOK: all pins are backed by main-visual topic expression.');
process.exit(0);
