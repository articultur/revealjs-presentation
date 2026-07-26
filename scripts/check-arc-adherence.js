#!/usr/bin/env node
'use strict';
/* eslint-disable */

/**
 * check-arc-adherence.js — 弧线落实检验(叙事弧线的机器验证抓手)
 * ====================================================================
 * route-arc.js 管「怎么选/怎么发明」,本脚本管「怎么验证落实」:从 deck 内嵌
 * design-brief 读叙事声明,机器验证 deck 真的按声明走了:
 *
 *   1. narrativeArc 库内弧线(N1-N8…)→ 必须在 references/narrative-arcs.md 注册表内
 *      (解析 md 的 `## N…` 标题,库加行即生效);声明自定义弧线 → 必须额外带
 *      arcDefinition 对象(新弧线四件套:realWorldRef 现实叙事参考 / pacingGrammar
 *      页面语法 / rationale 为什么需要新弧线;禁用节拍仍在 bannedBeats),缺 = FAIL。
 *   2. bannedBeats 机器缺席检测:每项解析节拍 key(首个空白/全角或半角冒号前的
 *      token),已知 key 做签名扫描,命中 = FAIL 并指出页码/选择器;未知 key =
 *      warning(无法机器验证,提示需人工),不 FAIL。
 *   3. pacingCurve 弱校验:剥掉括号注记后按 -/→/、 分拍,与实际 <section> 数对比,
 *      偏差 >±2 = warning 不 FAIL(格式自由,防脆)。
 *
 * 已知节拍签名(签名是启发式,宁窄勿宽——只抓明确结构信号,防误杀弧线原生语法):
 *   anchor-numeral      有效字号 ≥4em 且内容纯数字的元素(em 沿 DOM 继承折算 px)
 *   face-off            face-off/versus/vs/compare/duel 类名;或「N/N 或 N:N 纯比率
 *                       + ≥2.5em + 裁决语境词(裁决/verdict/表决…)」的比率裁决结构
 *   kpi-wall            kpi/metric/stat-wall|grid|board|panel 容器类名;或单页 ≥3 个
 *                       KPI 读数(kpi|metric|stat 卡类名,或 ≥1.8em 纯数字读数)
 *   data-table          禁任何 <table>
 *   ledger-table        禁任何 <table>
 *   neutral-data-table  禁 ≥2 个 <table>(允许 1 个有名分的清单表,如证物登记册)
 *   data-chart          bar-fill 类名;chart/graph/plot/donut/sparkline 等图表类名;
 *                       SVG 内 axis/tick/series/plot-area 等图表构件类名
 *   (不用「≥4 个 rect = 柱状图」这类几何启发:插画 SVG(平面图/示意图)会误杀)
 *
 * 用法:
 *   node scripts/check-arc-adherence.js <deck.html> [--json]
 *   node scripts/check-arc-adherence.js --selftest   内置正/负向验证,失败 exit 1
 *
 * 退出码:0 = 落实达标 / 1 = FAIL(库弧线未注册 / 缺 arcDefinition / 命中被禁节拍)/ 2 = 用法或文件错误
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const { extractBrief } = require('./check-design-brief.js');
const { ARCS } = require('./route-arc.js');

const ROOT = path.resolve(__dirname, '..');
const ARCS_MD = path.join(ROOT, 'references', 'narrative-arcs.md');

const isNonEmptyStr = v => typeof v === 'string' && v.trim().length > 0;

// ── 库注册表:解析 narrative-arcs.md 的 `## N…` 标题(库加行即生效;md 缺失退回镜像)──
// @returns {{[id:string]:string}} 如 { N1:'账本审计', … }
function loadArcRegistry() {
  const reg = {};
  try {
    const md = fs.readFileSync(ARCS_MD, 'utf8');
    const re = /^##\s+(N\d+)\s+([^\s·—–-]+)/gm;
    let m;
    while ((m = re.exec(md))) reg[m[1]] = m[2];
  } catch (e) { /* md 缺失:退回 route-arc 镜像 */ }
  if (!Object.keys(reg).length) for (const [id, a] of Object.entries(ARCS)) reg[id] = a.name;
  return reg;
}

// ── narrativeArc 分类:库内 / 自定义。库内须在注册表;自定义须带 arcDefinition 四件套。──
// @returns {{failures:string[], arcType:'library'|'custom'|null, arcId:string|null}}
function checkArcDeclaration(brief, registry) {
  const failures = [];
  const field = brief.narrativeArc || '';
  const idMatch = /\bN\s*(\d{1,2})\b/i.exec(field);
  if (idMatch) {
    const id = `N${Number(idMatch[1])}`;
    if (registry[id]) return { failures, arcType: 'library', arcId: id };
    failures.push(`narrativeArc 声明库弧线 ${id},但 references/narrative-arcs.md 注册表内无此弧线(注册须走「新弧线发明流程」,不许只改 brief);若为自定义弧线,删去编号并提供 arcDefinition`);
    return { failures, arcType: null, arcId: id };
  }
  for (const [id, name] of Object.entries(registry)) {
    if (field.includes(name)) return { failures, arcType: 'library', arcId: id };
  }
  // 自定义弧线:四件套 arcDefinition(禁用节拍仍在 bannedBeats,由签名扫描验)
  const def = brief.arcDefinition;
  if (!def || typeof def !== 'object' || Array.isArray(def)) {
    failures.push('narrativeArc 未命中库注册表(自定义弧线),但 brief 缺 arcDefinition 对象(新弧线四件套:realWorldRef/pacingGrammar/rationale)');
    return { failures, arcType: 'custom', arcId: null };
  }
  if (!isNonEmptyStr(def.realWorldRef)) failures.push('arcDefinition.realWorldRef(现实叙事形式参考,非空字符串)缺失——库外主题须 web search 找现实参照,禁拍脑袋');
  if (!isNonEmptyStr(def.pacingGrammar)) failures.push('arcDefinition.pacingGrammar(页面语法:≥3 种特有页面类型,非空字符串)缺失');
  if (!isNonEmptyStr(def.rationale)) failures.push('arcDefinition.rationale(为什么该主题需要新弧线,非空字符串)缺失');
  return { failures, arcType: 'custom', arcId: null };
}

// ── 轻量 HTML 解析(无依赖):构建 DOM + 收集 <style> 原文 + section 页序 ────────────
const VOID_TAGS = new Set(['br', 'img', 'hr', 'meta', 'link', 'input', 'source', 'wbr', 'col', 'base', 'area', 'track', 'embed']);

function parseAttrs(raw) {
  const attrs = {};
  const re = /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let m;
  while ((m = re.exec(raw || ''))) attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  return attrs;
}

function parseDeck(html) {
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  const root = { tag: '#root', attrs: {}, children: [], parent: null };
  let cur = root;
  let sectionCount = 0;
  const styles = [];
  const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;
  let last = 0;
  let m;
  while ((m = TAG_RE.exec(html))) {
    if (m.index > last) cur.children.push({ tag: '#text', text: html.slice(last, m.index), parent: cur });
    last = TAG_RE.lastIndex;
    const tag = m[2].toLowerCase();
    if (m[1]) { // 闭合标签:向上找最近匹配开标签
      let p = cur;
      while (p.parent && p.tag !== tag) p = p.parent;
      if (p.parent) cur = p.parent;
      continue;
    }
    if (tag === 'script' || tag === 'style') { // 整块吞到闭合标签(script 丢弃,style 留 CSS)
      const closeRe = new RegExp(`</${tag}\\s*>`, 'ig');
      closeRe.lastIndex = TAG_RE.lastIndex;
      const cm = closeRe.exec(html);
      const inner = cm ? html.slice(TAG_RE.lastIndex, cm.index) : html.slice(TAG_RE.lastIndex);
      if (tag === 'style') styles.push(inner);
      if (cm) { TAG_RE.lastIndex = closeRe.lastIndex; last = TAG_RE.lastIndex; } else { last = html.length; TAG_RE.lastIndex = html.length; }
      continue;
    }
    const node = { tag, attrs: parseAttrs(m[3]), children: [], parent: cur, section: tag === 'section' ? ++sectionCount : 0 };
    cur.children.push(node);
    if (!m[4] && !VOID_TAGS.has(tag)) cur = node;
  }
  return { root, styles, sectionCount };
}

function elementText(el) {
  if (el.tag === '#text') return el.text;
  return (el.children || []).map(elementText).join('');
}

function walkAll(root) {
  const out = [];
  const rec = (el, sectionIdx) => {
    const idx = el.tag === 'section' ? el.section : sectionIdx;
    if (el.tag !== '#text') out.push({ el, section: idx });
    for (const c of el.children || []) rec(c, idx);
  };
  rec(root, 0);
  return out;
}

// ── CSS font-size 解析(右端选择器匹配 + 祖先链子序列;文档序后者优先,inline 最高)──
function parseCompound(s) {
  s = s.replace(/::?[a-zA-Z-]+(\([^)]*\))?/g, '').trim();
  const tag = (/^[a-zA-Z][a-zA-Z0-9]*/.exec(s) || [''])[0].toLowerCase() || null;
  const classes = [...s.matchAll(/\.([a-zA-Z0-9_-]+)/g)].map(x => x[1]);
  const id = (/#([a-zA-Z0-9_-]+)/.exec(s) || [])[1] || null;
  if (!tag && !classes.length && !id) return null;
  return { tag, classes, id };
}

function buildFontRules(styles) {
  const rules = [];
  for (const css of styles) {
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(css))) {
      const fs = /(?:^|;)\s*font-size\s*:\s*([0-9.]+)\s*(em|px|rem)\b/i.exec(m[2]);
      if (!fs) continue;
      for (const sel of m[1].split(',')) {
        const parts = sel.trim().split(/[\s>+~]+/).filter(Boolean).map(parseCompound);
        if (parts.length && parts.every(Boolean)) rules.push({ parts, size: parseFloat(fs[1]), unit: fs[2].toLowerCase() });
      }
    }
  }
  return rules;
}

function matchCompound(el, c) {
  if (c.tag && el.tag !== c.tag) return false;
  if (c.id && (el.attrs.id || '') !== c.id) return false;
  const cls = (el.attrs.class || '').split(/\s+/).filter(Boolean);
  return c.classes.every(x => cls.includes(x));
}

function matchRule(el, parts) {
  if (!matchCompound(el, parts[parts.length - 1])) return false;
  let anc = el.parent;
  for (let i = parts.length - 2; i >= 0; i--) {
    let found = false;
    while (anc && anc.tag !== '#root') {
      if (matchCompound(anc, parts[i])) { found = true; anc = anc.parent; break; }
      anc = anc.parent;
    }
    if (!found) return false;
  }
  return true;
}

function baseFontPx(rules) {
  for (const r of rules) {
    const t = r.parts[r.parts.length - 1];
    if (t.classes.includes('reveal') && r.unit === 'px') return r.size;
  }
  return 42; // reveal.js 默认;本仓库 deck 均显式设 .reveal{font-size:Npx}
}

function resolveFontPx(el, rules, basePx, memo) {
  if (memo.has(el)) return memo.get(el);
  const parentPx = el.parent && el.parent.tag !== '#root' ? resolveFontPx(el.parent, rules, basePx, memo) : basePx;
  let decl = null;
  for (const r of rules) if (matchRule(el, r.parts)) decl = r; // 文档序后者覆盖
  const inline = el.attrs.style && /font-size\s*:\s*([0-9.]+)\s*(em|px|rem)\b/i.exec(el.attrs.style);
  if (inline) decl = { size: parseFloat(inline[1]), unit: inline[2].toLowerCase() }; // inline 最高
  const px = !decl ? parentPx : decl.unit === 'px' ? decl.size : decl.size * parentPx; // em/rem 近似:相对父级
  memo.set(el, px);
  return px;
}

function selectorOf(el) {
  const cls = (el.attrs.class || '').split(/\s+/).filter(Boolean).map(c => `.${c}`).join('');
  return `${el.tag}${el.attrs.id ? `#${el.attrs.id}` : ''}${cls}`;
}

// ── 节拍 key 解析 + 签名扫描 ──────────────────────────────────────────────
const KNOWN_BEATS = new Set(['anchor-numeral', 'face-off', 'kpi-wall', 'data-table', 'ledger-table', 'neutral-data-table', 'data-chart']);
const NUMERIC_RE = /^[\d\s.,%‰~≈+×xX\-–—/⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉万亿年月日#]+$/;
const isNumericText = t => { const s = (t || '').trim(); return s.length > 0 && /\d/.test(s) && NUMERIC_RE.test(s); };

function beatKey(entry) {
  return String(entry).trim().split(/[\s:：]/)[0].toLowerCase();
}

// @returns 命中清单 [{page, sel, note}](空 = 缺席,达标)
function scanBeat(key, ctx) {
  const { items, tables, basePx } = ctx;
  const hits = [];
  const hit = (el, section, note) => hits.push({ page: section || '?', sel: selectorOf(el), note });
  const classIdOf = el => `${el.attrs.class || ''} ${el.attrs.id || ''}`;

  if (key === 'anchor-numeral') {
    for (const { el, section, fontPx, text } of items) {
      if (fontPx >= 4 * basePx && isNumericText(text)) hit(el, section, `有效字号 ${(fontPx / basePx).toFixed(1)}em ≥4em 且内容纯数字「${text.trim().slice(0, 24)}」`);
      else if (/anchor[-_]?numeral|hero[-_]?metric|giant[-_]?num|big[-_]?(num|number)/i.test(classIdOf(el))) hit(el, section, '类名直接声明巨数锚点构件');
    }
  } else if (key === 'face-off') {
    for (const { el, section, fontPx, text, parentText } of items) {
      const cls = (el.attrs.class || '').split(/\s+/).filter(Boolean);
      if (cls.some(c => /^(face[-_]?off|faceoff|versus|vs|duel|confront|compare|comparison)([-_].*)?$/i.test(c))) {
        hit(el, section, `对峙类名 ${cls.filter(c => /^(face[-_]?off|faceoff|versus|vs|duel|confront|compare|comparison)/i.test(c)).join('/')}`);
        continue;
      }
      const t = text.trim();
      if (/^\d+\s*[/:：]\s*\d+$/.test(t) && fontPx >= 2.5 * basePx && /裁决|verdict|表决|投票|胜出|击败|jury/i.test(`${t} ${parentText} ${classIdOf(el)}`)) {
        hit(el, section, `比率裁决结构「${t.slice(0, 16)}」(≥2.5em + 裁决语境)`);
      }
    }
  } else if (key === 'kpi-wall') {
    for (const { el, section } of items) {
      if (/(kpi|metric|stat)[-_]?(wall|grid|board|panel|cards)/i.test(classIdOf(el))) hit(el, section, '指标墙容器类名');
    }
    const perSection = new Map();
    for (const { el, section, fontPx, text } of items) {
      const cls = (el.attrs.class || '').split(/\s+/).filter(Boolean);
      const kpiCard = cls.some(c => /^(kpi|metric|stat)([-_](card|value|number|item|box|figure))?$/i.test(c));
      const bigReadout = isNumericText(text) && fontPx >= 1.8 * basePx;
      if (kpiCard || bigReadout) {
        if (!perSection.has(section)) perSection.set(section, []);
        perSection.get(section).push({ el, note: kpiCard ? 'KPI 卡类名' : `≥1.8em 纯数字读数「${text.trim().slice(0, 16)}」` });
      }
    }
    for (const [section, arr] of perSection) {
      if (arr.length >= 3) hits.push({ page: section || '?', sel: arr.slice(0, 3).map(a => selectorOf(a.el)).join(' + '), note: `单页 ${arr.length} 个 KPI 读数(≥3 = 指标墙):${arr[0].note} 等` });
    }
  } else if (key === 'data-table' || key === 'ledger-table') {
    for (const t of tables) hits.push({ page: t.section || '?', sel: 'table', note: `${key} 禁任何 <table>(共 ${tables.length} 个)` });
  } else if (key === 'neutral-data-table') {
    if (tables.length >= 2) hits.push({ page: tables[1].section || '?', sel: 'table', note: `neutral-data-table 禁 ≥2 个 <table>(实际 ${tables.length} 个,只许 1 个有名分的清单表)` });
  } else if (key === 'data-chart') {
    for (const { el, section } of items) {
      const ci = classIdOf(el);
      if (/bar[-_]?fill/i.test(ci)) { hit(el, section, 'bar-fill 条形填充构件'); continue; }
      const tokens = ci.split(/\s+/).filter(Boolean);
      if (tokens.some(t => /^(data-chart|chart|charts|graph|plot|bar-chart|line-chart|pie-chart|donut|sparkline)([-_].*)?$/i.test(t))) { hit(el, section, '图表容器类名'); continue; }
      if (el.tag === 'svg') {
        const inner = walkAll(el);
        const bad = inner.find(x => /axis|tick|series|grid[-_]?line|plot[-_]?area|pie[-_]?slice|chart[-_]?bar/i.test(classIdOf(x.el)));
        if (bad) hit(el, section, `SVG 内图表构件类名(${selectorOf(bad.el)})`);
      }
    }
  }
  return hits;
}

// ── pacingCurve 弱校验:剥括号注记 → 按 -/→/、 分拍 → 与 section 数对比(>±2 = warning)──
function countBeats(curve) {
  if (!isNonEmptyStr(curve)) return null;
  let s = String(curve);
  s = s.replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, ''); // 剥全/半角括号注记(如「处置 03:48-03:55」内的连字符)
  return s.split(/[-–—→、]+/).map(x => x.trim()).filter(x => x.length > 0).length;
}

// ── 单文件检查。@returns {{pass:boolean, failures:string[], warnings:string[], error:string|null}} ──
function checkHtml(html) {
  const { brief, error } = extractBrief(html);
  if (error) return { pass: false, failures: [error], warnings: [], error };

  const failures = [];
  const warnings = [];
  const registry = loadArcRegistry();

  // ① 弧线声明:库内须在注册表;自定义须 arcDefinition 四件套
  const decl = checkArcDeclaration(brief, registry);
  failures.push(...decl.failures);

  // brief 契约本体(八必填)由 check-design-brief.js 管;此处只验落实,字段缺失时降级跳过对应检查
  const { root, styles, sectionCount } = parseDeck(html);
  const rules = buildFontRules(styles);
  const basePx = baseFontPx(rules);
  const memo = new Map();
  const items = walkAll(root).map(({ el, section }) => ({
    el, section,
    fontPx: resolveFontPx(el, rules, basePx, memo),
    text: elementText(el),
    parentText: el.parent && el.parent.tag !== '#root' ? elementText(el.parent).slice(0, 200) : '',
  }));
  const tables = items.filter(x => x.el.tag === 'table');

  // ② bannedBeats 缺席检测:已知 key 签名扫描(命中 = FAIL),未知 key warning(不 FAIL)
  if (Array.isArray(brief.bannedBeats)) {
    for (const entry of brief.bannedBeats) {
      if (!isNonEmptyStr(entry)) continue;
      const key = beatKey(entry);
      if (!KNOWN_BEATS.has(key)) {
        warnings.push(`bannedBeats「${key}」非机器已知节拍(已知:${[...KNOWN_BEATS].join('/')}),无法机器验证缺席,需人工确认`);
        continue;
      }
      for (const h of scanBeat(key, { items, tables, basePx })) {
        failures.push(`bannedBeats 命中被禁节拍「${key}」@P${h.page} ${h.sel}:${h.note}`);
      }
    }
  }

  // ③ pacingCurve 弱校验(>±2 = warning 不 FAIL)
  const beats = countBeats(brief.pacingCurve);
  if (beats !== null && sectionCount > 0 && Math.abs(beats - sectionCount) > 2) {
    warnings.push(`pacingCurve 拍数 ${beats} 与实际 <section> 数 ${sectionCount} 偏差 >±2(弱校验,仅提示核对节奏声明)`);
  }

  return { pass: failures.length === 0, failures, warnings, error: null, arcType: decl.arcType, arcId: decl.arcId };
}

function checkFile(filePath) {
  return checkHtml(fs.readFileSync(filePath, 'utf8'));
}

// ── selftest:正/负向验证(任一失败 exit 1)──────────────────────────────
// ① 库内 N3 + bannedBeats 全部缺席(1 个清单表在 neutral-data-table 允许范围)→ pass,CLI exit 0
// ② 自定义弧线缺 arcDefinition → fail,点名 arcDefinition
// ③ 声明禁 anchor-numeral 但 P2 有 5em 纯数字 → fail,指出页码/选择器
// ④ 未知节拍 key → pass 但 warning 提示需人工
// ⑤ 自定义弧线 + arcDefinition 四件套齐全 → pass
function selftest() {
  console.log('═══ check-arc-adherence SELFTEST · 正/负向验证 ═══\n');
  let failed = 0;
  const check = (ok, desc) => {
    console.log(`  ${ok ? '✓' : '✗'} ${desc}`);
    if (!ok) failed++;
  };
  const run = args => spawnSync('node', [path.join(ROOT, 'scripts', 'check-arc-adherence.js'), ...args], { encoding: 'utf8' });
  const baseBrief = {
    aestheticAnchor: 'x', externalRefs: [{ url: 'https://x.example', visualNote: 'x' }],
    signatureMoment: 'x', extremeContrast: 'x', bannedPatterns: ['side-stripe'],
  };
  const page = (brief, sections = '<section><h1>x</h1></section>') =>
    `<!doctype html><html><head><style>.reveal{font-size:28px;}</style>` +
    `<script type="application/json" id="design-brief">${JSON.stringify(brief)}</script></head>` +
    `<body><div class="reveal"><div class="slides">${sections}</div></div></body></html>`;

  // ① 库内弧线 + 缺席达标(1 个 table < neutral-data-table 的 ≥2 阈值;3.2em 数字 < 4em)
  const good = {
    ...baseBrief, narrativeArc: 'N3 质证对决(见 references/narrative-arcs.md)', pacingCurve: '密-疏-密-收',
    bannedBeats: ['kpi-wall:证据逐件呈堂', 'neutral-data-table:只许证物清单', 'anchor-numeral'],
  };
  const goodSections =
    '<section><h1>开庭</h1></section>' +
    '<section><div style="font-size:3.2em;">1.42%</div></section>' +
    '<section><table><tr><td>Exhibit A</td></tr></table></section>' +
    '<section><h1>休庭</h1></section>';
  const r1 = checkHtml(page(good, goodSections));
  check(r1.pass === true && r1.warnings.length === 0, `库内 N3 + 缺席达标 → pass 且无 warning(实际 pass=${r1.pass} fail=${r1.failures.join(';') || 'none'} warn=${r1.warnings.join(';') || 'none'})`);
  const tmp1 = path.join(os.tmpdir(), 'arc-adherence-selftest-good.html');
  fs.writeFileSync(tmp1, page(good, goodSections));
  const g1 = run([tmp1]);
  fs.unlinkSync(tmp1);
  check(g1.status === 0, `正例 CLI exit 0(实际 exit=${g1.status})`);

  // ② 自定义弧线缺 arcDefinition → fail
  const noDef = { ...baseBrief, narrativeArc: '安可返场弧线(自定义)', pacingCurve: '疏-密-收', bannedBeats: ['kpi-wall'] };
  const r2 = checkHtml(page(noDef, '<section><h1>a</h1></section><section><p>b</p></section><section><p>c</p></section>'));
  check(r2.pass === false && r2.failures.some(f => /arcDefinition/.test(f)), `自定义弧线缺 arcDefinition → fail 且点名 arcDefinition(实际 ${r2.failures.join(';') || 'none'})`);
  const tmp2 = path.join(os.tmpdir(), 'arc-adherence-selftest-nodef.html');
  fs.writeFileSync(tmp2, page(noDef));
  const g2 = run([tmp2, '--json']);
  fs.unlinkSync(tmp2);
  let j2 = {};
  try { j2 = JSON.parse(g2.stdout); } catch (e) { /* 解析失败按 fail 处理 */ }
  check(g2.status === 1 && j2.pass === false, `缺 arcDefinition CLI --json exit 1 且 pass=false(实际 exit=${g2.status})`);

  // ③ 禁 anchor-numeral 但 P2 有 5em 纯数字 → fail 指出页码/选择器
  const banned = { ...baseBrief, narrativeArc: 'N1 账本审计', pacingCurve: '密-密-收', bannedBeats: ['anchor-numeral:数字进账目语境'] };
  const badSections =
    '<section><h1>立据</h1></section>' +
    '<section><div class="big" style="font-size:5em;">42%</div></section>' +
    '<section><h1>封账</h1></section>';
  const r3 = checkHtml(page(banned, badSections));
  check(r3.pass === false && r3.failures.some(f => /anchor-numeral/.test(f) && /P2/.test(f) && /div\.big/.test(f)),
    `P2 有 5em 纯数字「42%」→ fail 且指出 P2/div.big(实际 ${r3.failures.join(';') || 'none'})`);

  // ④ 未知节拍 key → pass + warning
  const unknown = { ...baseBrief, narrativeArc: 'N8 工程剖面', pacingCurve: '密-疏-收', bannedBeats: ['mechanism-diagram 机制图页'] };
  const r4 = checkHtml(page(unknown, '<section><h1>整体</h1></section><section><p>剖开</p></section><section><h1>合拢</h1></section>'));
  check(r4.pass === true && r4.warnings.some(w => /mechanism-diagram/.test(w) && /人工/.test(w)),
    `未知 key「mechanism-diagram」→ pass 且 warning 提示需人工(实际 pass=${r4.pass} warn=${r4.warnings.join(';') || 'none'})`);

  // ⑤ 自定义弧线 + arcDefinition 四件套齐全 → pass
  const custom = {
    ...baseBrief, narrativeArc: '安可返场弧线(自定义)', pacingCurve: '疏-密-收',
    bannedBeats: ['kpi-wall'],
    arcDefinition: {
      realWorldRef: '演唱会 encore 环节:正篇落幕→呼声→返场→真正终曲(web search: concert encore tradition)',
      pacingGrammar: '落幕页(正篇总结)→暗场页(留白蓄势)→呼声页(观众数据单句)→返场页(满版新歌)→终曲页(credits)',
      rationale: '主题是巡演幕后纪录,N1-N8 均无「落幕后再返场」的二段峰值结构',
    },
  };
  const r5 = checkHtml(page(custom, '<section><h1>落幕</h1></section><section><p>呼声</p></section><section><h1>终曲</h1></section>'));
  check(r5.pass === true && r5.arcType === 'custom', `自定义弧线 + arcDefinition 齐全 → pass(实际 pass=${r5.pass} fail=${r5.failures.join(';') || 'none'})`);

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
    console.log('用法: node scripts/check-arc-adherence.js <deck.html> [--json]');
    console.log('      node scripts/check-arc-adherence.js --selftest');
    console.log('弧线落实检验:narrativeArc 库内须在 narrative-arcs.md 注册表/自定义须 arcDefinition 四件套(realWorldRef/pacingGrammar/rationale);bannedBeats 已知节拍(anchor-numeral/face-off/kpi-wall/data-table/ledger-table/neutral-data-table/data-chart)签名扫描,命中 = FAIL 指出页码/选择器,未知 key = warning;pacingCurve 拍数 vs <section> 数偏差 >±2 = warning。');
    return;
  }
  const abs = path.resolve(a.deck);
  if (!fs.existsSync(abs)) { console.log(`⚠️  文件不存在: ${abs}`); process.exit(2); }

  const r = checkFile(abs);
  if (a.json) {
    console.log(JSON.stringify({ deck: path.relative(ROOT, abs), pass: r.pass, arcType: r.arcType, arcId: r.arcId, failures: r.failures, warnings: r.warnings }, null, 2));
  } else if (r.pass) {
    console.log(`✅ 弧线落实达标: ${path.relative(ROOT, abs)}(${r.arcType === 'custom' ? '自定义弧线 + arcDefinition' : `库内弧线 ${r.arcId}`})`);
    for (const w of r.warnings) console.log(`   ⚠ ${w}`);
  } else {
    console.log(`❌ 弧线落实不达标: ${path.relative(ROOT, abs)}`);
    for (const f of r.failures) console.log(`   ✗ ${f}`);
    for (const w of r.warnings) console.log(`   ⚠ ${w}`);
  }
  if (!r.pass) process.exit(1);
}

if (require.main === module) main();

module.exports = { checkHtml, checkFile, loadArcRegistry, beatKey, countBeats, scanBeat, KNOWN_BEATS };
