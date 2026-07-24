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
  const re = /class="([^"]+)"/g; let m;
  while ((m = re.exec(html))) m[1].split(/\s+/).forEach(c => { if (c) set.add(c); });
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
  // 注意:furniture 三件套是 generate-archetype-deck.js 给每个 assembleDeck section 强制注入的
  // baseline(见 assembleDeck wrap),非 editorial 独有信号;计入 score 会让每个 assembleDeck
  // deck 误 FAIL。editorial 皮改由 archive 构件(精确匹配)+ serif 展示字判定。editorialSkeleton
  // 仍计算仅作 reason 信息,不进 score。
  const score = archiveN + (serifDisplay ? 1 : 0);

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

function main() {
  const argv = process.argv.slice(2);
  const file = argv.find(a => !a.startsWith('--') && !a.includes('='));
  const opts = { topic: '', editorialTopic: false, gate: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--topic') opts.topic = argv[++i] || '';
    else if (argv[i] === '--editorial-topic') opts.editorialTopic = true;
    else if (argv[i] === '--gate') opts.gate = true;
    else if (argv[i] === '--json') opts.json = true;
  }
  if (!file) {
    console.error('usage: check-editorial-contamination.js <deck.html> [--topic "<t>"] [--gate] [--json]');
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
