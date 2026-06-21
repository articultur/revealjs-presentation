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

  // 2 & 3. 用色投入 + 非对称分割（扫全 deck CSS：<style> 块 + inline style）
  // ── 架构修正（2026-06）：原实现逐 section 扫 section.innerHTML 内联样式，但 95%+ 的
  //    CSS 在 <style> 块里（section 标签外），导致 colorCommit/tension 对所有种子假阴性
  //    （实测 template-04 有满版 gradient/spot 却报 0%，诊断脚本确认 7/7 section bg=0）。
  //    改为扫全 deck 的 CSS 文本（<style> 块 + inline style）。scaleContrast / metaphor
  //    本就扫整份 html，故一直正常；只有这两维错扫了 section 内部。
  let panelCount = 0;
  let asymSplits = 0;
  const styleBlocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n');
  const inlineStyles = [...html.matchAll(/style\s*=\s*"([^"]+)"/g)].map(m => m[1]).join('\n');
  const cssText = styleBlocks + '\n' + inlineStyles;
  // commit background：深色 / 强调 token / 渐变；排除默认浅底（--c-bg/--c-surface/--c-paper）
  const commitBg = (val) => {
    if (/var\(--c-(?:bg|surface|paper)\b|var\(--bg\b/i.test(val)) return false;
    // 任何 --c-* 非底色 token 都算用色投入（yellow/pink/coral/teal/lime/orange/blue/ink/fg/accent/spot…）。
    // 旧版只认 fg/ink/accent/spot/deep/brand 六个，memphis/isometric 的具名颜色 token 全部漏判。
    if (/var\(--c-\w/i.test(val) || /var\(--(?:accent|spot|brand)\b/i.test(val)) return true;
    if (/(?:linear|radial|conic)-gradient/i.test(val)) return true;
    const hex = val.match(/#([0-9a-f]{6})/i);
    if (hex) {
      const n = parseInt(hex[1], 16);
      const lum = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
      return lum < 120; // 深色阈值：低于 120 亮度算"用色投入"
    }
    return false;
  };
  // colorCommit：全 deck commit background 出现次数（面板计数）
  const allBgVals = [...cssText.matchAll(/background(?:-color)?\s*:\s*([^;"'}]+)/gi)].map(m => m[1]);
  const commitBgs = allBgVals.filter(commitBg);
  panelCount = commitBgs.length;
  // tension：全 deck 非对称分割信号
  //   (a) grid-template-columns 含不同 fr 比（如 2fr 1fr，最常用的非对称手法）
  const gridRules = [...cssText.matchAll(/grid-template-columns\s*:\s*([^;"'}]+)/gi)].map(m => m[1]);
  for (const g of gridRules) {
    const frs = (g.match(/(\d+(?:\.\d+)?)\s*fr/gi) || []).map(x => parseFloat(x));
    if (frs.length >= 2 && frs.some(v => v !== frs[0])) asymSplits++;
  }
  //   (b) width/max-width 非 50% 的百分比（25-75 区间，排除正中对称）
  const wPct = [...cssText.matchAll(/(?:max-|min-)?width\s*:\s*(2[5-9]|[3-6][0-9]|7[0-5])\s*%/gi)].map(m => m[0]);
  asymSplits += wPct.filter(w => !/:50%/.test(w)).length;
  //   (c) 负 margin 错位（brutalist/memphis 散落手法）
  asymSplits += (cssText.match(/margin-(?:left|right)\s*:\s*-\d/i) || []).length;
  // colorCommitPct：每页平均 commit background 数映射到 0-100（每页 ≥1.5 个 = 满分）
  const avgCommitPerPage = sections.length ? commitBgs.length / sections.length : 0;
  const colorCommitPct = Math.min(100, Math.round(avgCommitPerPage / 1.5 * 100));
  const fullBleedSlides = Math.min(sections.length, commitBgs.length); // 等效页数（显示用）

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
    // 收紧（2026-06）：原 `1\/[0-9]` 误命中比例/章节号（实测北京 deck 无 A6 对峙页却被判 true，
    //   命中 "1/2" 等非对峙语境）。改为要求 A6 标志性结构——带 ≈ 的比率裁决或 class 标记。
    faceOff: /class="[^"]*\b(?:face-off|faceoff|versus|compare)\b|≈\s*\d+\s*\/\s*\d/.test(html),
    evidenceTable: /<table[\s\S]*accent[\s\S]*<\/table>/i.test(html) || /class="[^"]*ledger\b/i.test(html),
  };
  const nativeCount = Object.values(nativeSignals).filter(Boolean).length;

  // + 内容具体度：硬数字 vs 软化词
  const hardNumbers = (html.match(/¥\s*[\d.]+|\$\s*[\d.]+|\d+\.\d{1,2}\b|\d+\s*[KMB]\b|-\d{1,2}\.\d%/g) || []).length;
  const hedges = (html.match(/\b(?:约|示意|持平|大致|左右|量级示意|相对量级)\b/g) || []).length;

  // 5. archetype 节奏（2026-06）：归一化每页 archetype，检测过度使用 + 连续重复
  //    修"分数虚高但节奏平庸"——北京 deck 97 分但 IP2 出现 3 次、全深底无呼吸。
  const archetypes = sections.map(s => {
    const cls = classOf(s.attrs);
    const ph = cls.match(/\bph-[\w-]+/);            // image-driven deck: ph-cover/ph-spread/...
    if (ph) return ph[0];
    const toks = cls.split(/\s+/).filter(t => t && !/^(deck-(flex|grid)|present|stack)$/.test(t));
    return toks[0] || '';                             // 版式驱动 deck: 取首个语义 class
  });
  const archCounts = {};
  let maxArchCount = 0, maxArch = '';
  for (const a of archetypes) {
    if (!a) continue;
    archCounts[a] = (archCounts[a] || 0) + 1;
    if (archCounts[a] > maxArchCount) { maxArchCount = archCounts[a]; maxArch = a; }
  }
  let maxConsecutive = 0, curRun = 0, curArch = '', runArch = '';
  for (const a of archetypes) {
    if (a && a === curArch) curRun++;
    else { curArch = a; curRun = a ? 1 : 0; }
    if (curRun > maxConsecutive) { maxConsecutive = curRun; runArch = a; }
  }
  const archetypeMaxShare = sections.length ? maxArchCount / sections.length : 0;

  // 6. 深浅呼吸（2026-06）：扫 data-background，全深/全浅 = 缺反相页 = 视觉偏平。
  //    静态推断（无浏览器）：仅认带 hex 的 data-background；样本 < 4 页不评，避免误伤。
  const sectionTones = sections.map(s => {
    const m = s.attrs.match(/data-background\s*=\s*"([^"]+)"/);
    if (!m) return null;
    const hex = m[1].match(/#([0-9a-f]{6})/i);
    if (!hex) return null;
    const n = parseInt(hex[1], 16);
    const lum = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
    return lum < 120 ? 'dark' : 'light';
  }).filter(Boolean);
  const darkTones = sectionTones.filter(t => t === 'dark').length;
  const lightTones = sectionTones.length - darkTones;
  // -1 = 样本不足（< 4 页），不评；0 = 全深或全浅；100 = 深浅交替
  const lightDarkBreath = sectionTones.length >= 4
    ? (darkTones > 0 && lightTones > 0 ? 100 : 0)
    : -1;

  // 7. 色彩对比 colorContrast（2026-06）：voice token 关键配对 WCAG 对比度
  //    补"校验 vs 视觉"的缝——视觉模型能判"色彩对比弱"，这里机械化。
  //    实测杭州青墨 accent #3a6b5a on 深底 #11100d ≈ 3.1:1，视觉模型评"对比弱"，机械验证一致；
  //    北京朱红 #a92a18 on 深底 ≈ 2.8:1 更低，但北京 accent 只做背景+浅字不做深底字色，故无碍——
  //    因此本子分独立报告，不进 overall，避免对"accent 不做深底字色"的 voice 误判。
  const srgbLin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lumOf = hex => {
    const m = hex.match(/#?([0-9a-f]{6})/i);
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return 0.2126 * srgbLin((n >> 16) & 255) + 0.7152 * srgbLin((n >> 8) & 255) + 0.0722 * srgbLin(n & 255);
  };
  const ratioOf = (h1, h2) => { const l1 = lumOf(h1), l2 = lumOf(h2); if (l1 == null || l2 == null) return null; const hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + 0.05) / (lo + 0.05); };
  const rootBlock = (html.match(/:root\s*\{([^}]+)\}/) || [])[1] || '';
  const tokVal = name => { const m = rootBlock.match(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*:\\s*([^;]+)')); return m ? m[1].trim() : null; };
  const accent = tokVal('--c-accent'), bg = tokVal('--c-bg'), paper = tokVal('--c-bg-paper'), hot = tokVal('--c-hot'), accent2 = tokVal('--c-accent-2');
  // 检测 accent 是否真的做深底字色:若 CSS 把深底 kicker/em 改用 hot/accent-2/米白 覆盖,
  // 则 accent × 深底 是"潜在能力"而非"实际暴露"——不进 minRatio,避免对 v2/北京这类 voice 误判。
  const darkAccentOverridden = /(?:\.kicker\.on-dark|\.ph-(?:spread|stat|faceoff|grid-page|invite|cover|section)\b[^{]*\b(?:kicker|em\b))[^{]*\{[^}]*color\s*:\s*(?:var\(--c-(?:hot|accent-2|bg-paper|stamp)\b|rgba\([^)]*(?:244\s*,\s*236\s*,\s*214|238\s*,\s*228\s*,\s*206))/i.test(cssText);
  const contrastPairs = [
    { name: 'accent 字 × 深底 bg', a: accent, b: bg, use: 'kicker/em on dark', exposed: !darkAccentOverridden },
    { name: 'accent 底 × paper 字', a: accent, b: paper, use: 'stamp/roman/yr-chip 面板', exposed: true },
    { name: 'hot 字 × 深底', a: hot, b: bg, use: '数字 .v/.num', exposed: true },
    { name: 'accent-2 字 × 深底', a: accent2, b: bg, use: '封面 em/章节 em', exposed: true },
  ].filter(p => p.a && p.b)
    .map(p => ({ ...p, ratio: ratioOf(p.a, p.b) }))
    .filter(p => p.ratio != null);
  // minRatio 只计"实际暴露"的配对(潜在风险单独报告,不拉低分数)
  const exposedRatios = contrastPairs.filter(p => p.exposed).map(p => p.ratio);
  const minContrastRatio = exposedRatios.length ? Math.min(...exposedRatios) : null;
  const colorContrast = minContrastRatio == null ? null
    : minContrastRatio >= 4.5 ? 100
    : minContrastRatio >= 3 ? 75
    : minContrastRatio >= 2 ? 40
    : 15;

  return {
    file: path.basename(abs),
    slides: sections.length,
    scaleContrast: +maxDisplay.toFixed(2),
    fullBleedSlides,
    colorCommitPct,
    avgCommitPerPage: +avgCommitPerPage.toFixed(2),
    asymSplits,
    layoutVariety: +layoutVariety.toFixed(2),
    distinctLayouts: distinct,
    nativePrimitives: nativeCount,
    nativeSignals,
    hardNumbers,
    hedges,
    archetypeMaxShare: +archetypeMaxShare.toFixed(2),
    maxArchetypeCount: maxArchCount,
    maxArchetype: maxArch,
    maxConsecutiveArch: maxConsecutive,
    consecutiveArch: runArch,
    lightDarkBreath,
    darkTones,
    lightTones,
    colorContrast,
    minContrastRatio: minContrastRatio == null ? null : +minContrastRatio.toFixed(2),
    contrastPairs: contrastPairs.map(p => ({ name: p.name, use: p.use, ratio: +p.ratio.toFixed(2), exposed: p.exposed })),
  };
}

// ─── 评分 + 报告 ───────────────────────────────────────────────

function score(m) {
  // 各维 0–100，加权合成。阈值参考 design-fundamentals.md
  const sScale = Math.min(100, (m.scaleContrast / 3) * 100);          // 3:1 = 满分
  const sCommit = m.colorCommitPct;                                   // 已是 0-100（每页平均 commit bg 密度，1.5/页=满分）
  const sTension = Math.min(100, (m.asymSplits / 3) * 100);           // 3 处非对称 = 满分
  let sMetaphor = Math.min(100, ((m.nativePrimitives / 4) * 60) + (m.layoutVariety * 40)); // 4 原语 + 多样性
  // 节奏惩罚（2026-06）：archetype 过度使用 / 连续重复 / 缺深浅呼吸——堵"高分但平庸"
  let metaphorPenalty = 0;
  if (m.maxArchetypeCount >= 3 && m.archetypeMaxShare >= 0.25) metaphorPenalty += 8;   // 单页型 ≥3 次且 ≥25%
  if (m.maxConsecutiveArch >= 2) metaphorPenalty += 10;                                 // 连续 ≥2 页同 archetype（layout-archetypes.md 硬规则）
  if (m.lightDarkBreath === 0) metaphorPenalty += 10;                                   // 全深/全浅，缺反相呼吸
  sMetaphor = Math.max(0, sMetaphor - metaphorPenalty);
  const overall = Math.round(sScale * 0.3 + sCommit * 0.25 + sTension * 0.2 + sMetaphor * 0.25);
  return { sScale: Math.round(sScale), sCommit: Math.round(sCommit), sTension: Math.round(sTension), sMetaphor: Math.round(sMetaphor), metaphorPenalty, overall };
}

function report(m) {
  const s = score(m);
  const signals = Object.entries(m.nativeSignals).filter(([, v]) => v).map(([k]) => k).join(', ') || '—';
  console.log(`\n  ${m.file}  (${m.slides} slides)`);
  console.log(`    尺度对比 scaleContrast : ${m.scaleContrast}:1   (${s.sScale}/100)  ${m.scaleContrast >= 3 ? '✓' : '⚠ <3:1 太平'}`);
  console.log(`    用色投入 colorCommit    : 每页均 ${m.avgCommitPerPage} 个色块 (${m.fullBleedSlides} 处)  (${s.sCommit}/100)  ${s.sCommit >= 60 ? '✓' : '⚠ 用色偏平'}`);
  console.log(`    构图张力 tension        : ${m.asymSplits} 处非对称分割  (${s.sTension}/100)  ${m.asymSplits >= 2 ? '✓' : '⚠ 全对称'}`);
  console.log(`    隐喻贯彻 metaphor       : ${m.nativePrimitives} 原语 / ${m.distinctLayouts} 种布局  (${s.sMetaphor}/100)${s.metaphorPenalty ? `  ⚠ 节奏惩罚 -${s.metaphorPenalty}` : ''}`);
  console.log(`      └ 原生形式: ${signals}`);
  if (m.maxArchetypeCount >= 3 && m.archetypeMaxShare >= 0.25) {
    console.log(`      ⚠ archetype 过度使用: "${m.maxArchetype}" ×${m.maxArchetypeCount} (${Math.round(m.archetypeMaxShare * 100)}%)  → -8  建议:该页型占比过高,用 A6/A2/A10 打断`);
  }
  if (m.maxConsecutiveArch >= 2) {
    console.log(`      ⚠ archetype 连续: "${m.consecutiveArch}" 连 ${m.maxConsecutiveArch} 页  → -10  (layout-archetypes.md: 连续 2 页同 archetype = 失败)`);
  }
  if (m.lightDarkBreath === 0) {
    console.log(`      ⚠ 深浅呼吸: 全 deck ${m.darkTones} 深 / ${m.lightTones} 浅,缺反相页  → -10  建议:插 1 页 A2 命题/A10 引言做浅底呼吸`);
  } else if (m.lightDarkBreath === 100) {
    console.log(`      ✓ 深浅呼吸: 深 ${m.darkTones} / 浅 ${m.lightTones} 交替`);
  }
  console.log(`    内容具体度 specificity  : ${m.hardNumbers} 硬数 vs ${m.hedges} 软化词  ${m.hedges > m.hardNumbers / 3 && m.hedges > 0 ? '⚠ 软化过多' : '✓'}`);
  if (m.colorContrast != null) {
    const tag = m.colorContrast >= 75 ? '✓' : m.colorContrast >= 40 ? '⚠ 偏低' : '✗ 不足';
    console.log(`    色彩对比 colorContrast : 最低 ${m.minContrastRatio}:1  (${m.colorContrast}/100)  ${tag}  [仅计实际暴露配对 · WCAG ≥3 AA-大字 / ≥4.5 AAA · 不进总分]`);
    for (const p of m.contrastPairs) {
      const t = p.ratio >= 4.5 ? '✓ AAA ' : p.ratio >= 3 ? '◐ AA-大字' : p.ratio >= 2 ? '⚠ 偏低 ' : '✗ 不足 ';
      const exp = p.exposed ? '' : '  · 潜在(深底已用 hot 覆盖,未暴露)';
      console.log(`      ${t}  ${String(p.ratio).padStart(5)}:1  ${p.name}${exp}`);
    }
    if (m.colorContrast < 75) {
      console.log(`      💡 实际暴露的配对 < 3:1 → 提亮 accent(如青墨 #3a6b5a→#4a8a72),或把深底字色改用 hot(已暴露的 deck 说明没做这层覆盖)`);
    }
  }
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
