#!/usr/bin/env node
'use strict';

/**
 * Design Strength Check — 度量设计的"四维"强度，给设计一个回路梯度。
 * ─────────────────────────────────────────────────────────────────
 * grade-gate.js 度量的是"合规"（地板）；本脚本度量的是"设计强度"（天花板）。
 * 两者互补：合规不可绕过，设计强度要主动够。见 references/design-fundamentals.md §5。
 *
 * 四维（静态分析，无需浏览器）：
 *   1. scaleContrast  最大 display 字号 / 正文基线 比（目标 ≥ 3:1）
 *   2. tension        满版色块面板页数 + 非对称分割数（构图张力）
 *   3. colorCommit    满版 ink/accent 面板承担视觉的页数占比
 *   4. metaphor       布局多样性（distinct section 骨架数）+ 主题原生形式（masthead/stamp/anchor-numeral 等信号）
 *   + contentSpecificity  硬数字 vs 软化词（约/示意/持平）比
 *
 * 用法：
 *   node scripts/design-strength-check.js <file.html>
 *   node scripts/design-strength-check.js <file.html> --golden <reference.html>   # 与金标准对比
 *
 * 退出码：始终 0（advisory，非阻断）—— 设计强度是"要够的天花板"，不是 pass/fail 地板。
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const files = args.filter(a => !a.startsWith('--'));
const goldenIdx = args.indexOf('--golden');
const goldenFile = goldenIdx > -1 ? args[goldenIdx + 1] : null;

if (!files.length) {
  console.error('用法: node scripts/design-strength-check.js <file.html> [--golden <ref.html>]');
  process.exit(2);
}

// ─── 解析工具 ──────────────────────────────────────────────────

const BASE_PX = 30; // reveal font-size 通常 28-30px，按 30 折算

function parseSize(str) {
  if (!str) return null;
  // clamp(a, b, c) → 取 max (c)
  const clamp = str.match(/clamp\([^,]+,\s*[^,]+,\s*([^)]+)\)/i);
  if (clamp) str = clamp[1];
  const em = str.match(/([\d.]+)\s*em/i);
  if (em) return parseFloat(em[1]);
  const px = str.match(/([\d.]+)\s*px/i);
  if (px) return parseFloat(px[1]) / BASE_PX;
  return null;
}

function allFontSizes(html) {
  const sizes = [];
  const re = /font-size\s*:\s*([^;"')]+)/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const v = parseSize(m[1]);
    if (v && v > 0) sizes.push(v);
  }
  return sizes;
}

// 顶层 section 提取（标签计数，处理嵌套）
function extractTopSections(html) {
  const re = /<section[^>]*>|<\/section>/gi;
  const tags = [];
  let m;
  while ((m = re.exec(html)) !== null) tags.push({ i: m.index, open: !/<\/section>/i.test(m[0]), tag: m[0] });
  const sections = [];
  let depth = 0, start = null, startTag = '';
  for (const t of tags) {
    if (t.open) {
      if (depth === 0) { start = t.i; startTag = t.tag; }
      depth++;
    } else {
      depth--;
      if (depth === 0 && start !== null) {
        sections.push({ start, end: t.i + t.tag.length, attrs: startTag, html: html.slice(start, t.i + t.tag.length) });
      }
    }
  }
  return sections;
}

function classOf(attrs) {
  const m = attrs.match(/class="([^"]*)"/);
  return m ? m[1].trim() : '';
}

// ─── 四维度量 ──────────────────────────────────────────────────

function measure(file) {
  const abs = path.resolve(file);
  const html = fs.readFileSync(abs, 'utf8');
  const sections = extractTopSections(html);

  // 1. 尺度对比：全 deck 最大字号（display 候选 ≥2em）/ 1em 基线
  const sizes = allFontSizes(html);
  const maxDisplay = sizes.length ? Math.max(...sizes) : 0;
  const scaleContrast = maxDisplay; // vs 1em 基线；≥3 为达标

  // 2 & 3. 满版色块面板 + 非对称分割（逐 section 扫内联样式）
  let fullBleedSlides = 0;
  let panelCount = 0;
  let asymSplits = 0;
  for (const s of sections) {
    const inner = s.html;
    // 满版色块面板：background 指向 fg/ink/accent 或深 hex 的块级元素
    const panelRe = /background\s*:\s*(?:var\(--c-(?:fg|ink|accent)\b|var\(--accent\b|#[0-9a-f]{3,6})/gi;
    const panels = inner.match(panelRe) || [];
    // 真正的"满版"：section padding:0 或子元素 width:N%
    const isFullBleed = /padding\s*:\s*0\b/.test(inner) && panels.length > 0;
    if (isFullBleed) fullBleedSlides++;
    panelCount += panels.length;
    // 非对称分割：width 非 50% 的百分比
    const widths = inner.match(/width\s*:\s*(4[0-9]|5[1-9]|[67][0-9])\s*%/g) || [];
    asymSplits += widths.length;
  }
  const colorCommitPct = sections.length ? (fullBleedSlides / sections.length) : 0;

  // 4. 隐喻贯彻：布局多样性 + 主题原生形式信号
  const layouts = sections.map(s => classOf(s.attrs));
  const distinct = new Set(layouts.filter(Boolean)).size;
  const layoutVariety = sections.length ? distinct / sections.length : 0;

  // 主题原生形式信号（archetype 原语出现）
  const nativeSignals = {
    masthead: /\.masthead\b|border-top:\s*3px\s+double/i.test(html),
    headlineRule: /headline-rule|height:\s*4px/i.test(html),
    stamp: /class="[^"]*\bstamp\b/i.test(html),
    anchorNumeral: /font-size\s*:\s*clamp\([^)]*5em|font-size\s*:\s*[4-6](?:\.\d+)?em/i.test(html),
    pullquote: /pullquote|border-top:[^;]*border-bottom:[^;]*padding/i.test(html),
    kpiCard: /kpi-card|\.kpi\b/i.test(html),
    registerAxis: /register|timeline-marks|\.tl-node\b/i.test(html),
    faceOff: /≈|1\/[0-9]|\/\s*对比/i.test(html),
    evidenceTable: /<table[\s\S]*accent[\s\S]*<\/table>/i.test(html) || /class="[^"]*ledger\b/i.test(html),
  };
  const nativeCount = Object.values(nativeSignals).filter(Boolean).length;

  // + 内容具体度：硬数字 vs 软化词
  const hardNumbers = (html.match(/¥\s*[\d.]+|\$\s*[\d.]+|\d+\.\d{1,2}\b|\d+\s*[KMB]\b|-\d{1,2}\.\d%/g) || []).length;
  const hedges = (html.match(/\b(?:约|示意|持平|大致|左右|量级示意|相对量级)\b/g) || []).length;

  return {
    file: path.basename(abs),
    slides: sections.length,
    scaleContrast: +maxDisplay.toFixed(2),
    fullBleedSlides,
    colorCommitPct: +(colorCommitPct * 100).toFixed(0),
    asymSplits,
    layoutVariety: +layoutVariety.toFixed(2),
    distinctLayouts: distinct,
    nativePrimitives: nativeCount,
    nativeSignals,
    hardNumbers,
    hedges,
  };
}

// ─── 评分 + 报告 ───────────────────────────────────────────────

function score(m) {
  // 各维 0–100，加权合成。阈值参考 design-fundamentals.md
  const sScale = Math.min(100, (m.scaleContrast / 3) * 100);          // 3:1 = 满分
  const sCommit = Math.min(100, (m.colorCommitPct / 20) * 100);       // 20% 页满版 = 满分
  const sTension = Math.min(100, (m.asymSplits / 3) * 100);           // 3 处非对称 = 满分
  const sMetaphor = Math.min(100, ((m.nativePrimitives / 4) * 60) + (m.layoutVariety * 40)); // 4 原语 + 多样性
  const overall = Math.round(sScale * 0.3 + sCommit * 0.25 + sTension * 0.2 + sMetaphor * 0.25);
  return { sScale: Math.round(sScale), sCommit: Math.round(sCommit), sTension: Math.round(sTension), sMetaphor: Math.round(sMetaphor), overall };
}

function report(m) {
  const s = score(m);
  const signals = Object.entries(m.nativeSignals).filter(([, v]) => v).map(([k]) => k).join(', ') || '—';
  console.log(`\n  ${m.file}  (${m.slides} slides)`);
  console.log(`    尺度对比 scaleContrast : ${m.scaleContrast}:1   (${s.sScale}/100)  ${m.scaleContrast >= 3 ? '✓' : '⚠ <3:1 太平'}`);
  console.log(`    用色投入 colorCommit    : ${m.colorCommitPct}% 满版页 (${m.fullBleedSlides}页)  (${s.sCommit}/100)  ${m.colorCommitPct >= 15 ? '✓' : '⚠ 无满版面板=显平'}`);
  console.log(`    构图张力 tension        : ${m.asymSplits} 处非对称分割  (${s.sTension}/100)  ${m.asymSplits >= 2 ? '✓' : '⚠ 全对称'}`);
  console.log(`    隐喻贯彻 metaphor       : ${m.nativePrimitives} 原语 / ${m.distinctLayouts} 种布局  (${s.sMetaphor}/100)`);
  console.log(`      └ 原生形式: ${signals}`);
  console.log(`    内容具体度 specificity  : ${m.hardNumbers} 硬数 vs ${m.hedges} 软化词  ${m.hedges > m.hardNumbers / 3 && m.hedges > 0 ? '⚠ 软化过多' : '✓'}`);
  console.log(`    ${'─'.repeat(48)}`);
  console.log(`    设计强度总分: ${s.overall}/100   (尺度 30% · 用色 25% · 张力 20% · 隐喻 25%)`);
  return s;
}

// ─── 主流程 ────────────────────────────────────────────────────

console.log('╔══════════════════════════════════════════════╗');
console.log('║  设计强度度量 (Design Strength) · 天花板信号  ║');
console.log('║  合规看 grade-gate（地板）；设计感看这里       ║');
console.log('╚══════════════════════════════════════════════╝');

const results = [];
for (const f of files) {
  if (!fs.existsSync(path.resolve(f))) { console.error(`  ✗ not found: ${f}`); continue; }
  const m = measure(f);
  const s = report(m);
  results.push({ m, s });
}

if (goldenFile && fs.existsSync(path.resolve(goldenFile)) && results.length) {
  const g = measure(goldenFile);
  const gs = score(g);
  console.log(`\n  金标准参考: ${g.file}  (${g.slides} slides)  总分 ${gs.overall}/100`);
  console.log(`  ${'─'.repeat(48)}`);
  for (const r of results) {
    const d = r.s.overall - gs.overall;
    const tag = d >= -5 ? '✓ 对齐金标准' : (d >= -15 ? '◐ 接近' : '✗ 低于金标准');
    console.log(`  ${r.m.file}: ${r.s.overall} vs 金标准 ${gs.overall}  (Δ ${d > 0 ? '+' : ''}${d})  ${tag}`);
  }
}

console.log('\n  注：本脚本是 advisory（退出码恒 0）。设计强度是"要够的天花板"，不是 pass/fail 地板。');
console.log('  四维不达标 → 回 references/design-fundamentals.md §5 四维自检，重做而非微调。\n');
process.exit(0);
