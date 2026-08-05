#!/usr/bin/env node
'use strict';

/**
 * test-arc-adherence.js — behavioral test for check-arc-adherence.js
 * ====================================================================
 * The gate has zero external tests; this pins its fail-closed contract the same way
 * qa.js exercises it: spawnSync(process.execPath, [script, absFixture, '--json']),
 * pass = (status === 0 && json.pass === true).
 *
 * Cases:
 *   + library arc N1 + a banned beat that is genuinely absent (kpi-wall) → exit 0
 *   - declares banned anchor-numeral but a section has a 5em pure-number → exit 1
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GATE = path.join(ROOT, 'scripts', 'check-arc-adherence.js');
const { checkHtml } = require(GATE);

function page(brief, sections) {
  return '<!doctype html><html><head><style>.reveal{font-size:28px;}</style>' +
    `<script type="application/json" id="design-brief">${JSON.stringify(brief)}</script></head>` +
    `<body><div class="reveal"><div class="slides">${sections}</div></div></body></html>`;
}

function tmp(name, html) {
  const p = path.join(os.tmpdir(), `arc-test-${name}-${process.pid}.html`);
  fs.writeFileSync(p, html);
  return p;
}

function run(absFixture) {
  return spawnSync(process.execPath, [GATE, absFixture, '--json'], { encoding: 'utf8' });
}

const cases = [];
function caseOk(name, ok, detail) {
  cases.push({ name, ok });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

console.log('═══ test-arc-adherence · behavioral ═══\n');

// + adherent: library arc N1, bans kpi-wall which is absent → exit 0
const goodBrief = {
  narrativeArc: 'N1 账本审计',
  pacingCurve: '密-收',
  bannedBeats: ['kpi-wall:证据逐件呈堂,不用指标墙'],
};
const goodSections = '<section><h1>立据</h1></section><section><h1>封账</h1></section>';
const goodHtml = page(goodBrief, goodSections);
const goodApi = checkHtml(goodHtml);
const goodFixture = tmp('good', goodHtml);
const goodCli = run(goodFixture);
fs.unlinkSync(goodFixture);
let goodJson = {};
try { goodJson = JSON.parse(goodCli.stdout); } catch { /* fail below */ }
caseOk(
  'library arc N1 + absent banned beat (kpi-wall) → exit 0 & pass=true',
  goodCli.status === 0 && goodJson.pass === true && goodApi.pass === true,
  `cli exit=${goodCli.status} json.pass=${goodJson.pass} api.pass=${goodApi.pass}`,
);

// - violation: bans anchor-numeral but P2 has a 5em pure-number readout → exit 1
const badBrief = {
  narrativeArc: 'N1 账本审计',
  pacingCurve: '密-密-收',
  bannedBeats: ['anchor-numeral:数字进账目语境,禁巨数锚点'],
};
const badSections =
  '<section><h1>立据</h1></section>' +
  '<section><div class="big" style="font-size:5em;">42%</div></section>' +
  '<section><h1>封账</h1></section>';
const badHtml = page(badBrief, badSections);
const badApi = checkHtml(badHtml);
const badFixture = tmp('bad', badHtml);
const badCli = run(badFixture);
fs.unlinkSync(badFixture);
let badJson = {};
try { badJson = JSON.parse(badCli.stdout); } catch { /* fail below */ }
const namesAnchor = badApi.failures.some(f => /anchor-numeral/.test(f));
caseOk(
  'banned anchor-numeral but P2 has 5em pure number → exit 1 & names anchor-numeral',
  badCli.status === 1 && badJson.pass === false && namesAnchor,
  `cli exit=${badCli.status} json.pass=${badJson.pass} namedAnchor=${namesAnchor} fails=[${(badApi.failures[0] || '').slice(0, 60)}]`,
);

const failed = cases.filter(c => !c.ok).length;
console.log(`\n  ${failed === 0 ? `all ${cases.length} cases passed` : failed + '/' + cases.length + ' cases failed'}`);
process.exit(failed === 0 ? 0 : 1);
