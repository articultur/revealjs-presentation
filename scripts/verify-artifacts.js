#!/usr/bin/env node
'use strict';
/* eslint-disable */

/**
 * verify-artifacts.js — 产物落地校验(防"已交付"报告与磁盘事实背离)
 * ===================================================================
 * 背景:agent 生成 deck 后会报告"已交付",但真实事故——上一轮 6 个 deck
 * 报告交付后从磁盘消失(文件飘空)。qa.js 全绿只代表 gate 通过,不保证磁盘上
 * 真有可交付物。本脚本是机器兜底:给定 deck 路径,逐项核验磁盘事实。
 *
 * 三道校验(任一不达标 → exit 1,逐项点名):
 *   ① 文件存在且 >1KB
 *      - 缺文件 / 0 字节 / <1KB(空壳占位) = fail
 *   ② 内嵌 <script type="application/json" id="design-brief"> 可解析且 8 字段齐全
 *      - 复用 scripts/check-design-brief.js 的 extractBrief / validateBrief,不重复实现
 *   ③ qa-summary JSON 存在且 passed === true
 *      - 默认查 <deck-dir>/<deck-basename>-qa-summary.json
 *      - 默认再查 <out-root>/<deck-basename>-qa-summary.json(out-root = 项目根 qa-output,
 *        即 qa.js 默认 --out 路径)
 *      - --qa-summary <path> 显式指定(跳过默认查找)
 *
 * 用法:
 *   node scripts/verify-artifacts.js <deck.html> [deck2.html ...]
 *   node scripts/verify-artifacts.js --qa-summary <path> <deck.html>
 *   node scripts/verify-artifacts.js --selftest   内置正/负向验证,失败 exit 1
 *
 * 退出码:0 = 全部 deck 三项达标 / 1 = 任一 deck 任一项缺失或不达标 / 2 = 用法错误
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const { extractBrief, validateBrief } = require('./check-design-brief.js');

const ROOT = path.resolve(__dirname, '..');

const MIN_BYTES = 1024; // 文件最低字节数门槛(>1KB,防空壳占位)
const REQUIRED_BRIEF_FIELDS = 8; // design-brief 必填字段数(aestheticAnchor/externalRefs/
// signatureMoment/extremeContrast/bannedPatterns/narrativeArc/pacingCurve/bannedBeats)

// ── 单个 deck 的产物落地校验(核心函数,qa.js 直接 require 复用,不 spawn 子进程)──
// @param {string} deckPath  deck 文件绝对路径
// @param {object} opts
//   @param {string} [opts.qaSummaryPath]  显式指定 qa-summary 路径;不传则按默认顺序查找
// @returns {{
//   deck: string,
//   pass: boolean,
//   checks: {
//     fileExists: {ok:boolean, detail:string},
//     designBrief: {ok:boolean, detail:string},
//     qaSummary: {ok:boolean, detail:string, path?:string}
//   }
// }}
function verifyDeck(deckPath, opts = {}) {
  const abs = path.isAbsolute(deckPath) ? deckPath : path.resolve(deckPath);
  const result = {
    deck: abs,
    pass: true,
    checks: {
      fileExists: { ok: false, detail: '' },
      designBrief: { ok: false, detail: '' },
      qaSummary: { ok: false, detail: '' },
    },
  };

  const fail = (check, detail) => {
    result.checks[check].ok = false;
    result.checks[check].detail = detail;
    result.pass = false;
  };
  const pass = (check, detail) => {
    result.checks[check].ok = true;
    result.checks[check].detail = detail;
  };

  // ① 文件存在且 >1KB
  if (!fs.existsSync(abs)) {
    fail('fileExists', `文件不存在: ${abs}`);
    // 文件不在,后续校验无意义,直接返回(避免级联噪音)
    result.checks.designBrief.detail = '跳过(文件不存在)';
    result.checks.qaSummary.detail = '跳过(文件不存在)';
    return result;
  }
  const stat = fs.statSync(abs);
  if (stat.size < MIN_BYTES) {
    fail('fileExists', `文件过小: ${stat.size} 字节 < ${MIN_BYTES} 字节门槛(疑似空壳占位): ${abs}`);
    result.checks.designBrief.detail = '跳过(文件过小)';
    result.checks.qaSummary.detail = '跳过(文件过小)';
    return result;
  }
  pass('fileExists', `${stat.size} 字节 ≥ ${MIN_BYTES} 门槛`);

  // ② 内嵌 design-brief 可解析且 8 字段齐全(复用 check-design-brief.js)
  //    opts.skipDesignBrief = true 时跳过(qa.js 对 examples/ 种子历史产物已豁免 design-brief 门禁)
  if (opts.skipDesignBrief) {
    result.checks.designBrief.ok = true;
    result.checks.designBrief.detail = '跳过(种子豁免/qa.js 已单独把守)';
  } else {
    const html = fs.readFileSync(abs, 'utf8');
    const { brief, error: briefErr } = extractBrief(html);
    if (briefErr) {
      fail('designBrief', briefErr);
    } else {
      const missing = validateBrief(brief);
      if (missing.length > 0) {
        fail('designBrief', `design-brief 字段不达标(${missing.length} 项缺失): ${missing.join('; ')}`);
      } else {
        pass('designBrief', `8 字段齐全(aestheticAnchor/externalRefs/signatureMoment/extremeContrast/bannedPatterns/narrativeArc/pacingCurve/bannedBeats)`);
      }
    }
  }

  // ③ qa-summary JSON 存在且 passed === true
  // 查找顺序:显式 --qa-summary → <deck-dir>/<basename>-qa-summary.json →
  //          <out-root>/<basename>-qa-summary.json(qa.js 默认 --out = 项目根 qa-output)
  const candidates = [];
  if (opts.qaSummaryPath) {
    candidates.push(path.isAbsolute(opts.qaSummaryPath) ? opts.qaSummaryPath : path.resolve(opts.qaSummaryPath));
  } else {
    const deckDir = path.dirname(abs);
    const baseName = path.basename(abs, '.html');
    candidates.push(path.join(deckDir, `${baseName}-qa-summary.json`));
    // qa.js 默认 --out = 项目根 qa-output;opts.outRoot 允许调用方覆盖(qa.js 传它实际的 outRoot)
    const outRoot = opts.outRoot || path.join(ROOT, 'qa-output');
    candidates.push(path.join(outRoot, `${baseName}-qa-summary.json`));
  }

  let qaSummaryPath = null;
  for (const c of candidates) {
    if (fs.existsSync(c)) { qaSummaryPath = c; break; }
  }
  if (!qaSummaryPath) {
    fail('qaSummary', `qa-summary 文件未找到(查找: ${candidates.join(' → ')})`);
  } else {
    result.checks.qaSummary.path = qaSummaryPath;
    let summary = null;
    let parseErr = null;
    try {
      summary = JSON.parse(fs.readFileSync(qaSummaryPath, 'utf8'));
    } catch (e) {
      parseErr = `qa-summary JSON 解析失败: ${e.message}`;
    }
    if (parseErr) {
      fail('qaSummary', parseErr);
    } else if (opts.allowNotReady) {
      // qa.js 兜底专用:视觉层未签字的 deck(state=needs-visual-signoff,passed=false)
      // 是合法未交付态,不是飘空。这里只要文件存在且可解析且 state !== 'blocked' 即过;
      // blocked = 地板门禁失败(qa.js 不会走到这),passed 缺失视为异常。
      const st = summary.state;
      if (st === 'blocked') {
        fail('qaSummary', `qa-summary state=blocked(地板门禁失败): ${qaSummaryPath}`);
      } else if (summary.passed === true) {
        pass('qaSummary', `passed === true(state=${st || '?'}): ${qaSummaryPath}`);
      } else {
        pass('qaSummary', `state=${st || '?'}(passed=${summary.passed},allowNotReady 容忍未签字): ${qaSummaryPath}`);
      }
    } else if (summary.passed !== true) {
      const stateStr = summary.state ? `(state=${summary.state})` : '';
      fail('qaSummary', `qa-summary passed !== true(实际 passed=${summary.passed}${stateStr}): ${qaSummaryPath}`);
    } else {
      pass('qaSummary', `passed === true(state=${summary.state || '?'}): ${qaSummaryPath}`);
    }
  }

  return result;
}

// ── 自检：正向 / 负向验证（任一失败 exit 1）──────────────────────────────
// ① 完整产物（deck >1KB + 8 字段 brief + qa-summary passed=true）→ pass
// ② 文件缺失 → fail 且点名 fileExists
// ③ qa-summary passed=false → fail 且点名 qaSummary + state
// ④ design-brief 缺字段 → fail 且点名 designBrief
function selftest() {
  console.log('═══ verify-artifacts SELFTEST · 正/负向验证 ═══\n');
  let failed = 0;
  const check = (ok, desc) => {
    console.log(`  ${ok ? '✓' : '✗'} ${desc}`);
    if (!ok) failed++;
  };

  const page = briefJson =>
    `<!doctype html><html><head><title>t</title></head><body>` +
    `<script type="application/json" id="design-brief">${JSON.stringify(briefJson)}</script>` +
    `<div class="reveal"><div class="slides"><section><h1>x</h1></section></div></div>` +
    `<div style="display:none">${'x'.repeat(2048)}</div></body></html>`; // 确保文件 >1KB

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

  // ① 完整产物 → pass
  const tmpDir = path.join(os.tmpdir(), `verify-artifacts-selftest-${process.pid}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  const deckGood = path.join(tmpDir, 'good-deck.html');
  fs.writeFileSync(deckGood, page(goodBrief));
  const summaryGood = path.join(tmpDir, 'good-deck-qa-summary.json');
  fs.writeFileSync(summaryGood, JSON.stringify({ version: 1, deck: deckGood, passed: true, state: 'ready', qualityScore: 88 }));
  const r1 = verifyDeck(deckGood);
  check(
    r1.pass === true
      && r1.checks.fileExists.ok
      && r1.checks.designBrief.ok
      && r1.checks.qaSummary.ok,
    `完整产物(>1KB + 8 字段 brief + qa-summary passed=true)→ pass(实际 pass=${r1.pass})`,
  );
  check(r1.checks.fileExists.ok, `  fileExists 核对: ${r1.checks.fileExists.detail}`);

  // ② 文件缺失 → fail 且点名 fileExists
  const r2 = verifyDeck(path.join(tmpDir, 'no-such-deck.html'));
  check(
    r2.pass === false && r2.checks.fileExists.ok === false && /文件不存在/.test(r2.checks.fileExists.detail),
    `文件缺失 → fail 且点名 fileExists(实际 pass=${r2.pass}; detail=${r2.checks.fileExists.detail})`,
  );
  check(!r2.checks.designBrief.ok && !r2.checks.qaSummary.ok, `  文件缺失后 designBrief/qaSummary 不应通过`);

  // ③ qa-summary passed=false → fail 且点名 qaSummary + state
  const deckBadSummary = path.join(tmpDir, 'bad-summary-deck.html');
  fs.writeFileSync(deckBadSummary, page(goodBrief));
  const summaryBad = path.join(tmpDir, 'bad-summary-deck-qa-summary.json');
  fs.writeFileSync(summaryBad, JSON.stringify({ version: 1, deck: deckBadSummary, passed: false, state: 'blocked', qualityScore: 60 }));
  const r3 = verifyDeck(deckBadSummary);
  check(
    r3.pass === false
      && r3.checks.fileExists.ok
      && r3.checks.designBrief.ok
      && r3.checks.qaSummary.ok === false
      && /passed !== true/.test(r3.checks.qaSummary.detail)
      && /state=blocked/.test(r3.checks.qaSummary.detail),
    `qa-summary passed=false → fail 且点名 qaSummary + state(实际 pass=${r3.pass}; detail=${r3.checks.qaSummary.detail})`,
  );

  // ④ design-brief 缺字段 → fail 且点名 designBrief
  const deckBadBrief = path.join(tmpDir, 'bad-brief-deck.html');
  fs.writeFileSync(deckBadBrief, page({ aestheticAnchor: '  ', bannedPatterns: [] })); // 多项缺失
  const summaryBriefOk = path.join(tmpDir, 'bad-brief-deck-qa-summary.json');
  fs.writeFileSync(summaryBriefOk, JSON.stringify({ version: 1, deck: deckBadBrief, passed: true, state: 'ready' }));
  const r4 = verifyDeck(deckBadBrief);
  check(
    r4.pass === false && r4.checks.designBrief.ok === false && /字段不达标/.test(r4.checks.designBrief.detail),
    `design-brief 缺字段 → fail 且点名 designBrief(实际 pass=${r4.pass}; detail=${r4.checks.designBrief.detail})`,
  );

  // 额外:--qa-summary 显式路径生效(指向临时文件,默认查找路径不存在)
  const deckExplicit = path.join(tmpDir, 'explicit-deck.html');
  fs.writeFileSync(deckExplicit, page(goodBrief));
  const explicitSummary = path.join(tmpDir, 'explicit-summary.json'); // 非默认名
  fs.writeFileSync(explicitSummary, JSON.stringify({ passed: true, state: 'ready' }));
  const r5 = verifyDeck(deckExplicit, { qaSummaryPath: explicitSummary });
  check(r5.checks.qaSummary.ok && r5.checks.qaSummary.path === explicitSummary,
    `--qa-summary 显式路径生效(实际 path=${r5.checks.qaSummary.path})`);

  // 清理
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* 忽略 */ }

  console.log(`\n  ${failed === 0 ? '全部通过' : failed + ' 条断言失败'}`);
  if (failed) process.exit(1);
}

// ── CLI ─────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const a = { qaSummaryPath: null, selftest: false, decks: [] };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--selftest') a.selftest = true;
    else if (k === '--qa-summary') {
      a.qaSummaryPath = argv[++i];
      if (!a.qaSummaryPath) { console.error('用法错误:--qa-summary 需要一个路径参数'); process.exit(2); }
    } else if (!k.startsWith('-')) {
      a.decks.push(k);
    } else {
      console.error(`未知参数: ${k}`); process.exit(2);
    }
  }
  return a;
}

function main() {
  const a = parseArgs(process.argv.slice(2));
  if (a.selftest) { selftest(); return; }
  if (!a.decks.length) {
    console.log('用法: node scripts/verify-artifacts.js <deck.html> [deck2.html ...]');
    console.log('      node scripts/verify-artifacts.js --qa-summary <path> <deck.html>');
    console.log('      node scripts/verify-artifacts.js --selftest');
    console.log('校验项:① 文件存在且 >1KB;② 内嵌 design-brief 8 字段齐全;③ qa-summary passed===true。任一不达标 exit 1。');
    process.exit(2);
  }

  let allPass = true;
  const results = [];
  for (const deck of a.decks) {
    const r = verifyDeck(deck, { qaSummaryPath: a.qaSummaryPath });
    results.push(r);
    if (!r.pass) allPass = false;
  }

  // 逐个 deck 逐项打印
  for (const r of results) {
    console.log(`\n[${path.relative(ROOT, r.deck) || r.deck}]`);
    for (const [check, res] of Object.entries(r.checks)) {
      const icon = res.ok ? '✓' : '✗';
      console.log(`  ${icon} ${check}: ${res.detail}`);
    }
  }

  if (allPass) {
    console.log('\n✅ 产物落地核对清单:全部 deck 三项达标');
    for (const r of results) {
      console.log(`   • ${path.relative(ROOT, r.deck) || r.deck}: 文件 ${r.checks.fileExists.detail} / brief ${r.checks.designBrief.detail} / qa-summary ok`);
    }
    process.exit(0);
  } else {
    console.error('\n❌ 产物落地校验失败:以下 deck 任一项不达标');
    for (const r of results) {
      if (r.pass) continue;
      const failedChecks = Object.entries(r.checks).filter(([, v]) => !v.ok).map(([k]) => k);
      console.error(`   • ${path.relative(ROOT, r.deck) || r.deck}: ${failedChecks.join(', ')}`);
    }
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { verifyDeck, MIN_BYTES, REQUIRED_BRIEF_FIELDS };
