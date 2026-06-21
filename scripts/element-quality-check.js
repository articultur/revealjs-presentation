#!/usr/bin/env node
'use strict';

/**
 * Element Quality Check — 度量四类元素(动画 / 图标 / 表格 / 流程图)的质量分。
 * ─────────────────────────────────────────────────────────────────
 * design-strength-check.js 度量整体设计感四维(天花板);
 * grade-gate.js 度量合规八门(地板);
 * 本脚本度量"单元素质量"(天花板·元素级),与 design-strength 同级 advisory,退出码恒 0。
 * 判据来源:references/motion-delight.md · icon-system.md · table-system.md · diagram-system.md
 *
 * 四子分(各 0–100,等权 25%):
 *   motion   动画(过渡合规 / easing / reduced-motion / stagger / 密度 / 签名动效)
 *   icon     图标(emoji / 外部库 / inline / stroke-width / 主题跟随 / 覆盖率)
 *   table    表格(data-ink / 列对齐 / 表头 / 阈值 / 强调色 / 斑马纹)
 *   diagram  流程图(层数 / 连线语义 / 标签密度 / 构建方式)
 *
 * 用法:
 *   node scripts/element-quality-check.js <file.html>
 *   node scripts/element-quality-check.js <file.html> --json
 *   node scripts/element-quality-check.js <file.html> --golden <ref.html>
 *
 * 退出码:始终 0(advisory;元素质量是"要够的天花板",不进 grade-gate 阻断)。
 * pass 判据:四子分均 ≥ 70 且总分 ≥ 75。
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const files = args.filter(a => !a.startsWith('--'));
const jsonOnly = args.includes('--json');
const goldenIdx = args.indexOf('--golden');
const goldenFile = goldenIdx > -1 ? args[goldenIdx + 1] : null;

if (!files.length) {
  console.error('用法: node scripts/element-quality-check.js <file.html> [--json] [--golden <ref.html>]');
  process.exit(2);
}

// ─── 基础解析 ──────────────────────────────────────────────────

const BASE_PX = 30;

function readHtml(file) {
  return fs.readFileSync(path.resolve(file), 'utf8');
}

// 顶层 section 提取(标签计数,处理嵌套)
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

// emoji 检测:只认真彩色 emoji pictographs;✓✗⚠★→ 等纯文字状态/箭头符号不算(避免误报终端状态符)
const EMOJI_RE = /[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}][\u{FE0F}]/gu;

// ─── motion 子分 ──────────────────────────────────────────────

function measureMotion(html, sections) {
  const details = [];
  let score = 100;

  // M1 过渡合规:禁 convex/concave/zoom
  const badTransition = html.match(/transition\s*[:=]\s*['"]?(convex|concave|zoom)['"]?/gi) || [];
  const badDataTransition = html.match(/data-transition\s*=\s*['"](convex|concave|zoom)['"]/gi) || [];
  const m1Bad = badTransition.length + badDataTransition.length;
  if (m1Bad) { score -= Math.min(30, m1Bad * 15); details.push(`M1 过渡违规 ×${m1Bad}(convex/concave/zoom)`); }

  // M2 easing 合规:禁 bounce/elastic/back/overshoot 弹性曲线
  const badEase = html.match(/cubic-bezier\s*\([^)]*\)|animation-timing[^;}]*(back|elastic|bounce)|transition-timing[^;}]*(back|elastic|bounce)/gi) || [];
  const bounceKw = html.match(/\b(back|elastic|bounce|overshoot)\b/gi) || [];
  const m2Bad = badEase.length + (bounceKw.length > 0 && /cubic-bezier/i.test(html) ? 1 : 0);
  if (m2Bad) { score -= Math.min(20, m2Bad * 10); details.push(`M2 弹性 easing ×${m2Bad}`); }

  // M3 reduced-motion 覆盖
  const hasReduced = /@media[^{]*prefers-reduced-motion/i.test(html);
  if (!hasReduced) { score -= 10; details.push('M3 缺 prefers-reduced-motion'); }

  // M4 stagger ≤150ms:解析 transition-delay / animation-delay
  const delays = [...html.matchAll(/(?:transition|animation)-delay\s*:\s*([\d.]+)\s*(ms|s)/gi)];
  let overDelay = 0;
  for (const d of delays) {
    const v = parseFloat(d[1]) * (d[2] === 's' ? 1000 : 1);
    if (v > 150) overDelay++;
  }
  if (overDelay) { score -= Math.min(15, overDelay * 5); details.push(`M4 stagger >150ms ×${overDelay}`); }

  // M5 动效密度:fragment / section 比值
  const fragCount = (html.match(/class="[^"]*\bfragment\b/gi) || []).length;
  const ratio = sections.length ? fragCount / sections.length : 0;
  if (sections.length && (ratio < 0.3 || ratio > 2.0)) {
    score -= 10;
    details.push(`M5 动效密度异常 ${ratio.toFixed(2)}(0.3–2.0 为佳;fragment ${fragCount}/section ${sections.length})`);
  }

  // M6 签名动效(bonus,+10 上限):收紧——必须有动画驱动的明确签名模式
  const signature =
    (/stroke-dashoffset/i.test(html) && /@keyframes|animation\s*:/i.test(html)) || // 路径描边需动画驱动
    /@keyframes\s+[a-z-]*(count|roll|draw|numb)/i.test(html) ||                   // 命名签名 keyframes
    /data-count|countUp/i.test(html) ||                                            // 数字滚动
    (/clip-path/i.test(html) && /@keyframes|animation\s*:/i.test(html));           // clip-path 揭示
  if (signature) { score = Math.min(100, score + 10); details.push('M6 ✓ 含签名动效(+10)'); }

  return { score: Math.max(0, Math.min(100, score)), details, present: true, metrics: { m1Bad, m2Bad, hasReduced, overDelay, fragCount, ratio, signature } };
}

// ─── icon 子分 ────────────────────────────────────────────────

function measureIcon(html, sections) {
  const details = [];
  let score = 100;

  // I1 emoji 当图标(标题/按钮/列表上下文)
  const emojiHits = (html.match(EMOJI_RE) || []).length;
  if (emojiHits) { score -= Math.min(40, emojiHits * 10); details.push(`I1 emoji ×${emojiHits}`); }

  // I2 外部图标库引用
  const extLib = html.match(/font-?awesome|cdnjs[^"']*icons|bootstrap-icons|<i\s+class="[^"]*\bfa-/gi) || [];
  const extImgIcon = html.match(/<img[^>]*src\s*=\s*['"][^"']*\bfa-|<link[^>]*font-?awesome/gi) || [];
  const i2Bad = extLib.length + extImgIcon.length;
  if (i2Bad) { score -= Math.min(40, i2Bad * 20); details.push(`I2 外部图标库 ×${i2Bad}`); }

  // I3 inline SVG(统计外部 svg 引用 = 反指标)
  const svgs = html.match(/<svg\b/gi) || [];
  const extSvgImg = html.match(/<img[^>]*src\s*=\s*['"][^"']*\.svg['"]/gi) || [];
  if (extSvgImg.length) { score -= Math.min(20, extSvgImg.length * 10); details.push(`I3 外部 .svg 引用 ×${extSvgImg.length}(应 inline)`); }

  // I4 stroke-width 一致(1.4–2.0,基准 1.6);风格化模板粗描边豁免(D8)
  const isStyled = /class="[^"]*\b(?:memphis|brutal|grunge|raw|experimental)\b/i.test(html);
  const swMatches = [...html.matchAll(/stroke-width\s*=\s*["']?([0-9.]+)/gi)];
  let swOff = 0;
  for (const s of swMatches) {
    const v = parseFloat(s[1]);
    if (v < 1.4 || v > 2.0) swOff++;
  }
  if (swOff) {
    if (isStyled) { details.push(`I4 ◐ stroke-width 偏离 ×${swOff} — 风格化模板 intentional,豁免`); }
    else { score -= Math.min(25, swOff * 5); details.push(`I4 stroke-width 偏离 ×${swOff}(基准 1.6,范围 1.4–2.0)`); }
  }

  // I5 主题跟随:stroke 应为 currentColor 或 var(--c-*);硬编码 hex/rgb/hsl/oklch 为违规
  const strokeVals = [...html.matchAll(/stroke\s*=\s*["']([^"']+)["']/gi)].map(m => m[1]);
  const nonTheme = strokeVals.filter(v => /^#[0-9a-f]{3,8}$/i.test(v) || /^(rgb|hsl|oklch)\s*\(/i.test(v));
  if (nonTheme.length) { score -= Math.min(20, nonTheme.length * 4); details.push(`I5 stroke 硬编码色 ×${nonTheme.length}(应 currentColor/var)`); }

  // I6 图标覆盖率:含 svg 的 section 占比 20%–60%
  const sectionsWithIcon = sections.filter(s => /<svg/i.test(s.html)).length;
  const coverage = sections.length ? sectionsWithIcon / sections.length : 0;
  if (sections.length && (coverage < 0.2 || coverage > 0.6)) {
    score -= 8;
    details.push(`I6 图标覆盖率 ${(coverage * 100).toFixed(0)}%(20%–60% 为佳)`);
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    details,
    present: svgs.length > 0,
    metrics: { emojiHits, i2Bad, svgCount: svgs.length, extSvgImg: extSvgImg.length, swOff, coverage: +coverage.toFixed(2) },
  };
}

// ─── table 子分 ───────────────────────────────────────────────

function measureTable(html) {
  const tables = [...html.matchAll(/<table\b[\s\S]*?<\/table>/gi)].map(m => m[0]);
  if (!tables.length) {
    return { score: 100, details: ['(未使用 <table>,跳过)'], present: false, metrics: { tables: 0 } };
  }
  const details = [];
  let score = 100;
  let agg = { gridExcess: 0, noHead: 0, colOver: 0, rowOver: 0, zebra: 0, numColMisalign: 0 };

  for (let i = 0; i < tables.length; i++) {
    const t = tables[i];
    // T1 data-ink:全网格反模式(竖线 border-left/right 密集 或 td/th 都带 border)
    const cellBorderAll = (t.match(/<t[dh][^>]*\bstyle="[^"]*border\s*:[^"]*1px/gi) || []).length;
    const vertBorders = (t.match(/border-(left|right)\s*:/gi) || []).length;
    const gridDensity = cellBorderAll + vertBorders;
    const cellCount = (t.match(/<t[dh]\b/gi) || []).length;
    if (cellCount && gridDensity / cellCount > 0.6) { agg.gridExcess++; }

    // T2 列对齐:数字列应有右对齐;检测内联 text-align:right + CSS class 机制(.num/.right)
    const numCells = t.match(/>\s*[¥$€]?\s*[\d.,]+\s*[%KMBms字节秒年万元亿]*\s*</g) || [];
    const inlineRight = (t.match(/text-align\s*:\s*right/gi) || []).length;
    const cssRightMechanism = /\.num\b[^{]*\{[^}]*text-align\s*:\s*right|\.right\b[^{]*\{[^}]*text-align/i.test(html);
    const rightAligned = inlineRight + (cssRightMechanism ? numCells.length : 0);
    if (numCells.length > rightAligned) agg.numColMisalign += (numCells.length - rightAligned);

    // T3 表头存在
    if (!/<thead\b|<th\b/i.test(t)) agg.noHead++;

    // T4 行列阈值
    const cols = ((t.match(/<tr\b[\s\S]*?<\/tr>/i) || [t])[0].match(/<t[dh]\b/gi) || []).length;
    const rows = (t.match(/<tr\b/gi) || []).length;
    if (cols > 7) agg.colOver++;
    if (rows > 8) agg.rowOver++;

    // T6 斑马纹:nth-child + background
    if (/nth-child[^}]*background/i.test(t) || /tr:nth-child[^}]*background/i.test(html)) agg.zebra++;
  }

  if (agg.gridExcess) { score -= Math.min(20, agg.gridExcess * 15); details.push(`T1 全网格/chartjunk ×${agg.gridExcess}`); }
  if (agg.numColMisalign) { score -= Math.min(20, agg.numColMisalign * 5); details.push(`T2 数字列未右对齐 ~${agg.numColMisalign} 格`); }
  if (agg.noHead) { score -= Math.min(24, agg.noHead * 12); details.push(`T3 缺表头 ×${agg.noHead}`); }
  if (agg.colOver) { score -= Math.min(16, agg.colOver * 8); details.push(`T4 列数 >7 ×${agg.colOver}`); }
  if (agg.rowOver) { score -= Math.min(16, agg.rowOver * 8); details.push(`T4 行数 >8 ×${agg.rowOver}`); }
  if (agg.zebra) { score -= 8; details.push('T6 斑马纹过填充'); }

  return { score: Math.max(0, Math.min(100, score)), details, present: true, metrics: { tables: tables.length, ...agg } };
}

// ─── diagram 子分 ─────────────────────────────────────────────

function measureDiagram(html, sections) {
  // 流程图特征:连接线 SVG(line/path 带 arrow)+ 多节点块;或显式 class(flow/architecture/diagram)
  const hasFlowClass = /class="[^"]*\b(flow|diagram|arch|pipeline|process|sequence|lifecycle)\b/i.test(html);
  const connectors = html.match(/<svg[^>]*>[\s\S]*?<(?:path|line|polyline)\b[^>]*>/gi) || [];
  const dasharray = html.match(/stroke-dasharray\s*[:=]/gi) || [];
  const arrows = html.match(/M[^"]*\b[lL]\b[^"]*(?:arrowhead|marker)|marker-end|<polygon[^>]*>/gi) || [];

  if (!hasFlowClass && connectors.length < 2 && arrows.length < 1) {
    return { score: 100, details: ['(未检测到流程图,跳过)'], present: false, metrics: { connectors: 0 } };
  }

  const details = [];
  let score = 100;

  // D2 连线语义:虚线存在 = 用了异步/可选语义(加分);全实线不扣但无 bonus
  if (dasharray.length) { score = Math.min(100, score + 5); details.push('D2 ✓ 虚线语义(+5)'); }

  // D4 构建方式:整张大 SVG 画流程图反模式(单个 svg 含 >5 节点 + 连线)
  const bigSvgs = [...html.matchAll(/<svg\b[\s\S]*?<\/svg>/gi)]
    .map(m => m[0])
    .filter(s => (s.match(/<(?:rect|circle|ellipse|g)\b/gi) || []).length > 8 && (s.match(/<(?:path|line|polyline)\b/gi) || []).length > 3);
  if (bigSvgs.length) { score -= Math.min(15, bigSvgs.length * 15); details.push(`D4 整张 SVG 画流程图 ×${bigSvgs.length}(应用 HTML+CSS)`); }

  // D1 流程层数(HTML+CSS 构建):flow section 内有 background 的节点 div 数;>7 才扣(宽松阈值,只抓极端堆叠,避免误判)
  let nodeCount = 0;
  const flowSection = sections ? sections.find(s => /class="[^"]*\b(?:flow|arch|diagram|pipeline|process|sequence|lifecycle)\b/i.test(s.attrs)) : null;
  if (flowSection) {
    nodeCount = (flowSection.html.match(/<div[^>]*style="[^"]*background[^"]*"[^>]*>/gi) || []).length;
    if (nodeCount > 7) { score -= Math.min(15, (nodeCount - 7) * 5); details.push(`D1 流程层数 ${nodeCount}(>7 建议拆分)`); }
  }
  // D3 标签密度 / D5 墨水比:需 DOM 运行时或语义解析才能精确,静态保持中性(不滥扣)——见 iteration decision-log

  return {
    score: Math.max(0, Math.min(100, score)),
    details,
    present: true,
    metrics: { connectors: connectors.length, dasharray: dasharray.length, arrows: arrows.length, bigSvgs: bigSvgs.length, nodes: nodeCount },
  };
}

// ─── 主度量 ────────────────────────────────────────────────────

function measure(file) {
  const html = readHtml(file);
  const sections = extractTopSections(html);
  const motion = measureMotion(html, sections);
  const icon = measureIcon(html, sections);
  const table = measureTable(html);
  const diagram = measureDiagram(html, sections);
  const overall = Math.round((motion.score + icon.score + table.score + diagram.score) / 4);
  return { file: path.basename(file), slides: sections.length, motion, icon, table, diagram, overall };
}

function passed(m) {
  const subs = [m.motion.score, m.icon.score, m.table.score, m.diagram.score];
  return subs.every(s => s >= 70) && m.overall >= 75;
}

function report(m) {
  const bar = (s) => `${'█'.repeat(Math.round(s / 10)).padEnd(10)} ${s}`;
  console.log(`\n  ${m.file}  (${m.slides} slides)`);
  for (const [k, label] of [['motion', '动画'], ['icon', '图标'], ['table', '表格'], ['diagram', '流程图']]) {
    const sub = m[k];
    const tag = sub.present ? (sub.score >= 70 ? '✓' : '⚠') : '—';
    console.log(`    ${label.padEnd(4)} ${tag} ${bar(sub.score)}${sub.present ? '' : '  (未使用)'}`);
    for (const d of sub.details) console.log(`         · ${d}`);
  }
  console.log(`    ${'─'.repeat(48)}`);
  console.log(`    元素质量总分: ${m.overall}/100   ${passed(m) ? '✓ PASS' : '✗ below (≥75 且子分≥70)'}`);
  return m;
}

// ─── 主流程 ────────────────────────────────────────────────────

if (!jsonOnly) {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  元素质量度量 (Element Quality) · 元素级天花板 ║');
  console.log('║  整体看 design-strength;单元素看这里          ║');
  console.log('╚══════════════════════════════════════════════╝');
}

const results = [];
for (const f of files) {
  if (!fs.existsSync(path.resolve(f))) { console.error(`  ✗ not found: ${f}`); continue; }
  const m = measure(f);
  results.push(m);
  if (!jsonOnly) report(m);
}

if (goldenFile && fs.existsSync(path.resolve(goldenFile)) && results.length) {
  const g = measure(goldenFile);
  if (!jsonOnly) {
    console.log(`\n  金标准参考: ${g.file}  总分 ${g.overall}/100`);
    console.log(`  ${'─'.repeat(48)}`);
    for (const r of results) {
      const d = r.overall - g.overall;
      const tag = d >= -5 ? '✓ 对齐金标准' : (d >= -15 ? '◐ 接近' : '✗ 低于金标准');
      console.log(`  ${r.file}: ${r.overall} vs 金标准 ${g.overall}  (Δ ${d > 0 ? '+' : ''}${d})  ${tag}`);
    }
  }
}

if (jsonOnly) {
  const out = results.map(m => ({
    file: m.file,
    pass: passed(m),
    score: m.overall,
    subscores: { motion: m.motion.score, icon: m.icon.score, table: m.table.score, diagram: m.diagram.score },
    details: { motion: m.motion.details, icon: m.icon.details, table: m.table.details, diagram: m.diagram.details },
  }));
  console.log(JSON.stringify(files.length === 1 ? out[0] : out, null, 2));
}

if (!jsonOnly) {
  console.log('\n  注:本脚本是 advisory(退出码恒 0)。元素质量是"要够的天花板",不阻断交付。');
  console.log('  子分低 → 回 references/{motion-delight,icon-system,table-system,diagram-system}.md 对应规则。\n');
}
process.exit(0);
