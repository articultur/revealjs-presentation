#!/usr/bin/env node
'use strict';
/* eslint-disable */

/**
 * check-design-brief.js — design-brief 契约校验(设计感 B 解法的机器抓手)
 * ====================================================================
 * references/design-generation-workflow.md 的 B 解法(审美锚点/外部大师参考/
 * 签名时刻/极端对比/禁用套路)此前是纯文档流程,无机器抓手。本脚本把契约落成
 * 可校验产物:项目是单文件 HTML 交付,brief 随文件走——在被检 HTML 内嵌
 *
 *   <script type="application/json" id="design-brief">{ ... }</script>
 *
 * 必填字段:
 *   aestheticAnchor  审美锚点(非空字符串)
 *   externalRefs     外部大师参考清单(数组 ≥1,每项含非空 url + visualNote)
 *   signatureMoment  签名时刻(非空字符串)
 *   extremeContrast  极端对比(非空字符串)
 *   bannedPatterns   禁用套路(数组 ≥1,每项非空字符串)
 *   narrativeArc     叙事弧线(非空字符串;references/narrative-arcs.md 弧线名或自定义弧线声明)
 *   pacingCurve      节奏曲线(非空字符串;页级疏密与高潮位置描述,如"疏-密-密-疏-高潮-收")
 *   bannedBeats      禁用节拍(数组 ≥1,每项非空字符串;声明本 deck 禁用的默认节拍,
 *                    如 anchor-numeral / face-off / kpi-wall——防所有 deck 收敛到同一条默认节拍)
 *
 * 可证伪化(声明→DOM 弱交叉验证):signatureMoment / extremeContrast 中用反引号包裹的
 * token(如 `hero-cover`)是机器锚点,必须作为 class/id/data-* 真实存在于 deck DOM,
 * 写了锚点但 DOM 没有 = fail 并点名;不写锚点不 fail(兼容存量),但记 warning(声明不可机器证伪)。
 *
 * 用法:
 *   node scripts/check-design-brief.js <deck.html> [--json]
 *   node scripts/check-design-brief.js --selftest   内置正/负向验证,失败 exit 1
 *
 * 退出码:0 = 契约达标 / 1 = 缺 script 或字段不达标 / 2 = 用法或文件错误
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

const isNonEmptyStr = v => typeof v === 'string' && v.trim().length > 0;

// ── 提取内嵌 design-brief(script 标签属性顺序不限)──────────────────────
// @returns {{brief:object|null, error:string|null}}
function extractBrief(html) {
  const SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  let m;
  while ((m = SCRIPT_RE.exec(html)) !== null) {
    const attrs = m[1] || '';
    if (!/\bid\s*=\s*("design-brief"|'design-brief'|design-brief\b)/i.test(attrs)) continue;
    if (!/\btype\s*=\s*("application\/json"|'application\/json'|application\/json\b)/i.test(attrs)) continue;
    try {
      return { brief: JSON.parse(m[2]), error: null };
    } catch (e) {
      return { brief: null, error: `design-brief JSON 解析失败: ${e.message}` };
    }
  }
  return { brief: null, error: '缺少 <script type="application/json" id="design-brief"> 内嵌块' };
}

// ── 字段校验:返回缺失/不达标项清单(空数组 = 达标)──────────────────────
function validateBrief(brief) {
  const missing = [];
  if (!brief || typeof brief !== 'object' || Array.isArray(brief)) {
    return ['design-brief 必须是 JSON 对象'];
  }
  if (!isNonEmptyStr(brief.aestheticAnchor)) missing.push('aestheticAnchor(审美锚点,非空字符串)');
  if (!Array.isArray(brief.externalRefs) || brief.externalRefs.length < 1) {
    missing.push('externalRefs(外部大师参考清单,数组 ≥1)');
  } else {
    brief.externalRefs.forEach((r, i) => {
      if (!r || !isNonEmptyStr(r.url) || !isNonEmptyStr(r.visualNote)) {
        missing.push(`externalRefs[${i}](每项需含非空 url + visualNote)`);
      }
    });
  }
  if (!isNonEmptyStr(brief.signatureMoment)) missing.push('signatureMoment(签名时刻,非空字符串)');
  if (!isNonEmptyStr(brief.extremeContrast)) missing.push('extremeContrast(极端对比,非空字符串)');
  if (!Array.isArray(brief.bannedPatterns) || brief.bannedPatterns.length < 1 || !brief.bannedPatterns.every(isNonEmptyStr)) {
    missing.push('bannedPatterns(禁用套路,数组 ≥1,每项非空字符串)');
  }
  if (!isNonEmptyStr(brief.narrativeArc)) missing.push('narrativeArc(叙事弧线,非空字符串,见 references/narrative-arcs.md)');
  if (!isNonEmptyStr(brief.pacingCurve)) missing.push('pacingCurve(节奏曲线,非空字符串,页级疏密与高潮位置)');
  if (!Array.isArray(brief.bannedBeats) || brief.bannedBeats.length < 1 || !brief.bannedBeats.every(isNonEmptyStr)) {
    missing.push('bannedBeats(禁用节拍,数组 ≥1,每项非空字符串,如 anchor-numeral/face-off/kpi-wall)');
  }
  return missing;
}

// ── 声明→DOM 弱交叉验证(可证伪化)────────────────────────────────────────
// signatureMoment / extremeContrast 是自由文本,只验"非空"=填表合规(写 "x" 也达标)。
// 约定:声明中用反引号包裹的 token(如 `hero-cover`)是机器可证伪锚点——必须作为
// class/id/data-* 属性值真实存在于 deck DOM;写了锚点但 DOM 没有 = 声明与落实不符,fail 并点名。
// 不写锚点不 fail(兼容存量 deck),但记 warning:该声明不可机器证伪。
function extractAnchorTokens(brief) {
  const anchors = [];
  for (const field of ['signatureMoment', 'extremeContrast']) {
    const text = typeof brief[field] === 'string' ? brief[field] : '';
    const re = /`([^`]+)`/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      const token = m[1].trim();
      if (token) anchors.push({ field, token });
    }
  }
  return anchors;
}

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function tokenInDom(html, token) {
  const t = escapeRegExp(token.replace(/^[.#]/, ''));
  return new RegExp(`\\b(?:class|id|data-[a-z0-9-]+)\\s*=\\s*"[^"]*\\b${t}\\b`, 'i').test(html)
      || new RegExp(`\\b(?:class|id|data-[a-z0-9-]+)\\s*=\\s*'[^']*\\b${t}\\b`, 'i').test(html);
}

// ── 单文件检查。@returns {{pass:boolean, missing:string[], error:string|null, warnings:string[]}} ──
function checkHtml(html) {
  const { brief, error } = extractBrief(html);
  if (error) return { pass: false, missing: [error], error, warnings: [] };
  const missing = validateBrief(brief);
  const warnings = [];
  if (missing.length === 0) {
    const anchors = extractAnchorTokens(brief);
    for (const a of anchors) {
      if (!tokenInDom(html, a.token)) {
        missing.push(`${a.field} 声明的锚点 \`${a.token}\` 在 DOM 中不存在(声明→落实不符;锚点须作为 class/id/data-* 真实落进 deck)`);
      }
    }
    for (const field of ['signatureMoment', 'extremeContrast']) {
      if (!anchors.some((a) => a.field === field)) {
        warnings.push(`${field} 未含反引号锚点,声明不可机器证伪(建议把落实处 class 写进声明,如 \`hero-cover\`)`);
      }
    }
  }
  return { pass: missing.length === 0, missing, error: null, warnings };
}

function checkFile(filePath) {
  return checkHtml(fs.readFileSync(filePath, 'utf8'));
}

// ── selftest:正/负向验证(任一失败 exit 1)──────────────────────────────
// ① 字段齐全的 brief → pass,CLI exit 0
// ② 无 design-brief script → fail,CLI exit 1
// ③ externalRefs 缺 visualNote + bannedPatterns 空 + 三叙事字段缺失 → fail,缺失项逐条点名
// ④ script 属性顺序颠倒(id 在前 type 在后)也能识别 → pass
// ⑤ 叙事弧线三字段(narrativeArc/pacingCurve/bannedBeats)单独缺失 → 各报各的缺失项
function selftest() {
  console.log('═══ check-design-brief SELFTEST · 正/负向验证 ═══\n');
  let failed = 0;
  const check = (ok, desc) => {
    console.log(`  ${ok ? '✓' : '✗'} ${desc}`);
    if (!ok) failed++;
  };
  const run = args => spawnSync('node', [path.join(ROOT, 'scripts', 'check-design-brief.js'), ...args], { encoding: 'utf8' });
  const page = briefJson =>
    `<!doctype html><html><head><title>t</title></head><body>` +
    (briefJson === null ? '' : `<script type="application/json" id="design-brief">${JSON.stringify(briefJson)}</script>`) +
    `<div class="reveal"><div class="slides"><section><h1>x</h1></section></div></div></body></html>`;
  const goodBrief = {
    aestheticAnchor: '纪念碑谷的静谧几何',
    externalRefs: [{ url: 'https://example.com/master-ref', visualNote: '极端留白 + 单点霓虹的孤独感' }],
    signatureMoment: '满版巨字封面,标题占页高 60%',
    extremeContrast: '尺度 8:1,深满版 vs 浅留白',
    bannedPatterns: ['side-stripe', 'gradient text'],
    narrativeArc: 'N4 画廊漫步(见 references/narrative-arcs.md)',
    pacingCurve: '疏-疏-密-疏-高潮-收',
    bannedBeats: ['anchor-numeral', 'face-off'],
  };

  // ① 字段齐全 → pass
  const r1 = checkHtml(page(goodBrief));
  check(r1.pass === true && r1.missing.length === 0, `字段齐全 brief → pass(实际 pass=${r1.pass})`);
  const tmp1 = path.join(os.tmpdir(), 'design-brief-selftest-good.html');
  fs.writeFileSync(tmp1, page(goodBrief));
  const g1 = run([tmp1]);
  fs.unlinkSync(tmp1);
  check(g1.status === 0, `字段齐全 CLI exit 0(实际 exit=${g1.status})`);

  // ② 无 script → fail
  const r2 = checkHtml(page(null));
  check(r2.pass === false && /id="design-brief"/.test(r2.missing.join('')), '无 design-brief script → fail 且点名缺内嵌块');
  const tmp2 = path.join(os.tmpdir(), 'design-brief-selftest-none.html');
  fs.writeFileSync(tmp2, page(null));
  const g2 = run([tmp2, '--json']);
  fs.unlinkSync(tmp2);
  let j2 = {};
  try { j2 = JSON.parse(g2.stdout); } catch (e) { /* 解析失败按 fail 处理 */ }
  check(g2.status === 1 && j2.pass === false, `无 script CLI --json exit 1 且 pass=false(实际 exit=${g2.status})`);

  // ③ 多项不达标 → 逐条点名
  const badBrief = { aestheticAnchor: '  ', externalRefs: [{ url: 'https://x.example' }], bannedPatterns: [] };
  const r3 = checkHtml(page(badBrief));
  const m3 = r3.missing.join('\n');
  check(r3.pass === false
    && /aestheticAnchor/.test(m3) && /externalRefs\[0\]/.test(m3)
    && /signatureMoment/.test(m3) && /extremeContrast/.test(m3) && /bannedPatterns/.test(m3)
    && /narrativeArc/.test(m3) && /pacingCurve/.test(m3) && /bannedBeats/.test(m3),
    `空锚点/缺 visualNote/空 bannedPatterns/缺叙事三字段 → 8 条缺失逐条点名(实际 ${r3.missing.length} 条)`);

  // ④ 属性顺序颠倒(id 在 type 前)也能识别
  const swapped = `<!doctype html><html><body><script id="design-brief" type="application/json">${JSON.stringify(goodBrief)}</script></body></html>`;
  const r4 = checkHtml(swapped);
  check(r4.pass === true, `script 属性顺序颠倒仍识别 → pass(实际 pass=${r4.pass})`);

  // ⑤ 叙事弧线三字段单独缺失 → 各报各的
  const { narrativeArc: _na, ...briefNoArc } = goodBrief;
  const r5a = checkHtml(page(briefNoArc));
  check(r5a.pass === false && r5a.missing.length === 1 && /narrativeArc/.test(r5a.missing[0]),
    `仅缺 narrativeArc → fail 且只点名 narrativeArc(实际 ${r5a.missing.join(';') || 'none'})`);
  const r5b = checkHtml(page({ ...goodBrief, pacingCurve: '' }));
  check(r5b.pass === false && r5b.missing.length === 1 && /pacingCurve/.test(r5b.missing[0]),
    `pacingCurve 空字符串 → fail 且只点名 pacingCurve(实际 ${r5b.missing.join(';') || 'none'})`);
  const r5c = checkHtml(page({ ...goodBrief, bannedBeats: [] }));
  check(r5c.pass === false && r5c.missing.length === 1 && /bannedBeats/.test(r5c.missing[0]),
    `bannedBeats 空数组 → fail 且只点名 bannedBeats(实际 ${r5c.missing.join(';') || 'none'})`);
  const r5d = checkHtml(page({ ...goodBrief, bannedBeats: ['  '] }));
  check(r5d.pass === false && r5d.missing.length === 1 && /bannedBeats/.test(r5d.missing[0]),
    `bannedBeats 项为空字符串 → fail 且点名 bannedBeats(实际 ${r5d.missing.join(';') || 'none'})`);

  // ⑥ 声明→DOM 弱交叉验证(可证伪化)
  const pageDom = (briefJson, extraDom) =>
    `<!doctype html><html><head><title>t</title></head><body>` +
    `<script type="application/json" id="design-brief">${JSON.stringify(briefJson)}</script>` +
    `<div class="reveal"><div class="slides">${extraDom}</div></div></body></html>`;
  const anchoredBrief = {
    ...goodBrief,
    signatureMoment: '满版巨字封面 `hero-cover`,标题占页高 60%',
    extremeContrast: '尺度 8:1,`deep-panel` vs 浅留白',
  };
  // 锚点真实落进 DOM → pass 且无 warning
  const r6a = checkHtml(pageDom(anchoredBrief, '<section class="hero-cover"><h1>x</h1><div class="deep-panel">y</div></section>'));
  check(r6a.pass === true && r6a.warnings.length === 0,
    `锚点 \`hero-cover\`/\`deep-panel\` 落实进 DOM → pass 且无 warning(实际 pass=${r6a.pass}, warnings=${r6a.warnings.length})`);
  // 声明了锚点但 DOM 没有 → fail 并点名
  const r6b = checkHtml(pageDom(anchoredBrief, '<section><h1>x</h1></section>'));
  check(r6b.pass === false && r6b.missing.some((m) => m.includes('hero-cover')) && r6b.missing.some((m) => m.includes('deep-panel')),
    `锚点未落实 → fail 且逐一点名(实际 ${r6b.missing.join(';') || 'none'})`);
  // 无锚点声明 → pass 但带"不可证伪" warning
  const r6c = checkHtml(page(goodBrief));
  check(r6c.pass === true && r6c.warnings.length === 2,
    `无锚点 brief → pass 但 signatureMoment/extremeContrast 各记 1 条 warning(实际 warnings=${r6c.warnings.length})`);

  console.log(`\n  ${failed === 0 ? '全部通过' : failed + ' 条断言失败'}`);
  if (failed) process.exit(1);
}

// ── CLI ─────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const a = { json: false, selftest: false, deck: null };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--json') a.json = true;
    else if (k === '--selftest') a.selftest = true;
    else if (!k.startsWith('-') && !a.deck) a.deck = k;
  }
  return a;
}

function main() {
  const a = parseArgs(process.argv.slice(2));
  if (a.selftest) { selftest(); return; }
  if (!a.deck) {
    console.log('用法: node scripts/check-design-brief.js <deck.html> [--json]');
    console.log('      node scripts/check-design-brief.js --selftest');
    console.log('校验内嵌 <script type="application/json" id="design-brief"> 必填字段:aestheticAnchor / externalRefs(≥1,含 url+visualNote)/ signatureMoment / extremeContrast / bannedPatterns(≥1)/ narrativeArc / pacingCurve / bannedBeats(≥1);缺 script 或字段不达标 exit 1。');
    return;
  }
  const abs = path.resolve(a.deck);
  if (!fs.existsSync(abs)) { console.log(`⚠️  文件不存在: ${abs}`); process.exit(2); }

  const r = checkFile(abs);
  if (a.json) {
    console.log(JSON.stringify({ deck: path.relative(ROOT, abs), pass: r.pass, missing: r.missing, warnings: r.warnings }, null, 2));
  } else if (r.pass) {
    console.log(`✅ design-brief 契约达标: ${path.relative(ROOT, abs)}`);
    for (const w of r.warnings || []) console.log(`   ⚠ ${w}`);
  } else {
    console.log(`❌ design-brief 契约不达标: ${path.relative(ROOT, abs)}`);
    for (const item of r.missing) console.log(`   ✗ ${item}`);
  }
  if (!r.pass) process.exit(1);
}

if (require.main === module) main();

module.exports = { checkHtml, checkFile, extractBrief, validateBrief };
