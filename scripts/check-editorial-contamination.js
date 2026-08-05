#!/usr/bin/env node
'use strict';
/* eslint-disable */

/**
 * check-editorial-contamination.js
 * ====================================================================
 * 检测 deck 是否穿着 template-01 的 editorial-archive 外衣。
 *
 * 痛点(用户反馈):3 个 deck 之间变的只有 color + topic,设计语言恒为
 * editorial(serif + 左对齐 + kicker 眉标 + 报头/印章/角标/登记轴 + 档案馆气质)。
 * 颜色和主题是"贴上去"的,不是从主题"长出来"的。失败门禁 #9 只查 path A 对种子
 * 的 HTML 结构相似度(skeleton-diff),查不到"审美语言恒为 editorial"——本脚本补这个盲区。
 *
 * 判定:
 *   topic 是 editorial-archive 原生(历程/历史/档案/复盘…) → 用 archive 构件 = 合规,过
 *   topic 非 editorial:
 *     污染指数 = archive 构件去重数 + (serif display ? 1 : 0) + (共享基底 page-furniture ≥2 ? 1 : 0)
 *     指数 ≥ 2 = FAIL("editorial 皮:设计非从主题生长,是 template-01 档案馆外衣")
 *
 * 签名词汇来源:examples/template-01-editorial-serif.html 实测 class 词频
 * + generate-archetype-deck.js 共享基底强制类(kicker/pin/evidence-label)。
 *
 * 用法:
 *   node scripts/check-editorial-contamination.js <deck.html> [--topic "<主题>"] [--gate] [--json]
 *   --editorial-topic  显式声明 topic 为 editorial 原生(跳过污染判定)
 */

const fs = require('fs');

// template-01 / editorial-archive 签名构件(从 examples/template-01 实测提取)
const ARCHIVE_TOKENS = [
  'plate', 'folio', 'ledger', 'stamp', 'masthead', 'register-axis', 'registeraxis',
  'colophon', 'signoff', 'poster-wall', 'lede', 'catalogue', 'archive', 'dossier',
  'sign-off', 'mast-head',
];

// 共享基底 page-furniture(generate-archetype-deck.js 强制注入每个 assembleDeck deck)
// — kicker 眉标 / pin 角标 / evidence-label 源标 = editorial 排版惯例
const SHARED_FURNITURE = ['kicker', 'pin', 'evidence-label'];

// editorial-archive 原生主题关键词(这类主题用 archive 构件是正确的,豁免)
const EDITORIAL_TOPIC = [
  '历程', '历史', '发展史', '编年', '年史', '档案', '复盘', '回顾', '展览', '策展',
  '县志', '志书', '编年史', '回溯', '史话',
  'archive', 'catalogue', 'museum', 'heritage', 'chronicle', 'annals',
  'retrospective', 'memoir', 'history',
];

function isEditorialTopic(topic) {
  if (!topic) return false;
  const t = String(topic).toLowerCase();
  return EDITORIAL_TOPIC.some(k => t.includes(k.toLowerCase()));
}

function extractClasses(html) {
  const set = new Set();
  // 修 P1:旧正则只匹配双引号 class="..."。补单引号和无引号匹配,
  // 防止手写 HTML 用 class='...' 的 archive token 逃过污染检测。
  const re = /class\s*=\s*(?:"([^"]+)"|'([^']+)'|(\S+))/gi; let m;
  while ((m = re.exec(html))) {
    const val = m[1] || m[2] || m[3] || '';
    val.split(/\s+/).forEach(c => { if (c) set.add(c); });
  }
  return set;
}

function check(file, opts = {}) {
  const html = fs.readFileSync(file, 'utf8');
  const classes = extractClasses(html);

  // archive 构件:命中的 distinct token
  const lower = new Set([...classes].map(c => c.toLowerCase()));
  const archiveHits = [...new Set(
    [...lower].filter(c => ARCHIVE_TOKENS.some(tok => c === tok || c.startsWith(tok + '-') || c.startsWith(tok + '_')))
      .map(c => ARCHIVE_TOKENS.find(tok => c === tok || c.startsWith(tok + '-') || c.startsWith(tok + '_')))
  )];
  // 共享基底 page-furniture
  const furnitureHits = SHARED_FURNITURE.filter(f => classes.has(f));
  // serif display 信号:只看 --f-display(展示字体)是否真 serif 族;
  // 只认具体 serif 家族名,不认 generic 'serif'(会被 "sans-serif" / CJK fallback 误伤)
  const displayDecls = [...html.matchAll(/--f-display:\s*([^;]+)/gi)].map(m => m[1].toLowerCase());
  const serifDisplay = displayDecls.some(d =>
    /(cormorant|literata|newsreader|playfair|sourceserif|noto serif|fraunces|crimson|dm serif|georgia|instrument serif)/.test(d));

  const archiveN = archiveHits.length;
  const furnitureN = furnitureHits.length;
  const editorialSkeleton = furnitureN >= 3; // kicker+pin+evidence-label 三件套全在
  // 计分语义:editorial 皮 = archive 词汇。serif 展示字与 furniture 三件套都不是 editorial
  // 独有信号——furniture 是 generate-archetype-deck.js 给每个 assembleDeck section 强制注入的
  // baseline(见 assembleDeck wrap);serif 是合法字体选择(consulting/editorial-serif 等 voice
  // 的正当签名)。二者只在 archive 构件命中时才作为" corroborating evidence "加分;
  // archiveN=0 时一律不计,避免合法 voice 被自己的门禁误杀。
  const score = archiveN + (archiveN >= 1 && serifDisplay ? 1 : 0);

  const editorialTopic = opts.editorialTopic || isEditorialTopic(opts.topic);

  let verdict, reason;
  if (editorialTopic) {
    verdict = 'PASS';
    reason = `topic「${opts.topic || '(none)'}」是 editorial-archive 原生 → archive 构件合规`;
  } else if (score >= 2) {
    verdict = 'FAIL';
    reason = `editorial 皮:非 editorial 主题「${opts.topic || '(none)'}」命中 ${archiveN} archive 构件(${archiveHits.join('/') || '无'})${serifDisplay ? ' + serif 展示字' : ''}${editorialSkeleton ? ' + editorial 骨架(kicker/pin/evidence-label 三件套)' : (furnitureN >= 1 ? ` + 部分 page-furniture(${furnitureHits.join('/')})` : '')} → 污染指数 ${score}。设计非从主题生长,是 template-01 档案馆外衣。去色去字体后仍属 editorial,不属本主题。`;
  } else {
    verdict = 'PASS';
    reason = `污染指数 ${score} 未超阈(archive ${archiveN} · serif ${serifDisplay} · furniture ${furnitureN})`;
  }

  return { file, topic: opts.topic || '', editorialTopic, archiveHits, archiveN, furnitureHits, furnitureN, serifDisplay, score, verdict, reason };
}

// ── selftest:正/负向验证(任一失败 exit 1)──────────────────────────────
// ① 换皮检测力不降:template-01 种子 + 非 editorial 主题 → FAIL
// ② 合法 voice 不误杀:serif + furniture 三件套 + memo-seal(无 archive 词)→ PASS 且 score=0
// ③ serif 在 archive 命中时仍作佐证加分:1 archive + serif → score 2 → FAIL
// ④ editorial 原生主题豁免:template-01 + 编年史 → PASS
// ⑤ archive ≥2 无 serif 也 FAIL
function selftest() {
  const os = require('os');
  const path = require('path');
  const { spawnSync } = require('child_process');
  const ROOT = path.resolve(__dirname, '..');
  console.log('═══ check-editorial-contamination SELFTEST · 正/负向验证 ═══\n');
  let failed = 0;
  const t = (ok, desc) => { console.log(`  ${ok ? '✓' : '✗'} ${desc}`); if (!ok) failed++; };
  const page = (classes, displayFont) =>
    `<!doctype html><html><head><style>:root{--f-display:${displayFont};}</style></head>` +
    `<body><section class="${classes}"><h1>x</h1></section></body></html>`;
  const tmp = (name, html) => {
    const p = path.join(os.tmpdir(), `ec-selftest-${name}.html`);
    fs.writeFileSync(p, html);
    return p;
  };
  const SERIF = 'Cormorant Garamond, serif';
  const SANS = 'Inter, sans-serif';

  // ① template-01 种子 + 非 editorial 主题 → FAIL(检测力不降)
  const seed = path.join(ROOT, 'examples', 'template-01-editorial-serif.html');
  const r1 = check(seed, { topic: '系统监控' });
  t(r1.verdict === 'FAIL' && r1.archiveN >= 2,
    `template-01 + 非 editorial 主题 → FAIL(实际 ${r1.verdict}, archive=${r1.archiveN}, score=${r1.score})`);
  const g1 = spawnSync('node', [path.join(ROOT, 'scripts', 'check-editorial-contamination.js'), seed, '--topic', '系统监控', '--gate'], { encoding: 'utf8' });
  t(g1.status === 1, `template-01 --gate exit 1(实际 exit=${g1.status})`);

  // ② serif + furniture + memo-seal,无 archive 词 → PASS 且 score=0(serif/furniture 不计)
  const legit = tmp('legit', page('memo-head memo-seal seal kicker pin evidence-label', SERIF));
  const r2 = check(legit, { topic: '金融分析' });
  t(r2.verdict === 'PASS' && r2.archiveN === 0 && r2.score === 0,
    `consulting 式 deck(serif+furniture+memo-seal)→ PASS 且 score=0(实际 ${r2.verdict}, score=${r2.score})`);

  // ③ 1 archive + serif → score 2 → FAIL(serif 在 archive 命中时仍加分)
  const onePlusSerif = tmp('one-serif', page('lede kicker pin evidence-label', SERIF));
  const r3 = check(onePlusSerif, { topic: '金融分析' });
  t(r3.verdict === 'FAIL' && r3.archiveN === 1 && r3.score === 2,
    `1 archive(lede)+ serif → score 2 FAIL(实际 ${r3.verdict}, archive=${r3.archiveN}, score=${r3.score})`);

  // ④ editorial 原生主题 → 豁免 PASS
  const r4 = check(seed, { topic: '品牌编年史' });
  t(r4.verdict === 'PASS' && r4.editorialTopic === true,
    `template-01 + 编年史 → 豁免 PASS(实际 ${r4.verdict})`);

  // ⑤ archive ≥2 无 serif → FAIL
  const twoArchive = tmp('two', page('plate masthead kicker', SANS));
  const r5 = check(twoArchive, { topic: '金融分析' });
  t(r5.verdict === 'FAIL' && r5.archiveN === 2 && r5.score === 2,
    `2 archive(plate/masthead)+ sans → FAIL(实际 ${r5.verdict}, score=${r5.score})`);

  [legit, onePlusSerif, twoArchive].forEach(p => { try { fs.unlinkSync(p); } catch {} });
  console.log(`\n  ${failed === 0 ? '全部通过' : failed + ' 条断言失败'}`);
  if (failed) process.exit(1);
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--selftest')) { selftest(); return; }
  const file = argv.find(a => !a.startsWith('--') && !a.includes('='));
  const opts = { topic: '', editorialTopic: false, gate: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--topic') opts.topic = argv[++i] || '';
    else if (argv[i] === '--editorial-topic') opts.editorialTopic = true;
    else if (argv[i] === '--gate') opts.gate = true;
    else if (argv[i] === '--json') opts.json = true;
  }
  if (!file) {
    console.error('usage: check-editorial-contamination.js <deck.html> [--topic "<t>"] [--gate] [--json] | --selftest');
    process.exit(2);
  }
  const r = check(file, opts);
  if (opts.json) { console.log(JSON.stringify(r, null, 2)); }
  else {
    console.log(`═══ editorial-contamination: ${r.verdict} ═══`);
    console.log(`  topic: ${r.topic || '(none)'} ${r.editorialTopic ? '(editorial 原生 → 豁免)' : '(非 editorial)'}`);
    console.log(`  archive 构件(${r.archiveN}): ${r.archiveHits.join(', ') || '(无)'}`);
    console.log(`  共享基底 furniture(${r.furnitureN}): ${r.furnitureHits.join(', ') || '(无)'}`);
    console.log(`  serif display: ${r.serifDisplay}`);
    console.log(`  污染指数: ${r.score}  (阈值 ≥2 = FAIL)`);
    console.log(`  ${r.reason}`);
  }
  if (r.verdict === 'FAIL' && opts.gate) process.exit(1);
}

module.exports = { check, isEditorialTopic, ARCHIVE_TOKENS, SHARED_FURNITURE };
if (require.main === module) main();
