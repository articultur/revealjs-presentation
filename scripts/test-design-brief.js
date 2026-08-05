#!/usr/bin/env node
'use strict';

/**
 * test-design-brief.js — behavioral test for check-design-brief.js
 * ====================================================================
 * The gate has zero external tests; this pins its fail-closed contract the same way
 * qa.js exercises it: spawnSync(process.execPath, [script, absFixture, '--json']),
 * pass = (status === 0 && json.pass === true).
 *
 * Cases:
 *   + complete brief with all 8 required fields        → exit 0
 *   - brief missing a required field (narrativeArc)    → exit 1
 *   - brief with empty bannedBeats array               → exit 1
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GATE = path.join(ROOT, 'scripts', 'check-design-brief.js');
const { checkHtml } = require(GATE);

function page(brief) {
  return '<!doctype html><html><head><title>t</title></head><body>' +
    (brief === null ? '' : `<script type="application/json" id="design-brief">${JSON.stringify(brief)}</script>`) +
    '<div class="reveal"><div class="slides"><section><h1>x</h1></section></div></div></body></html>';
}

function tmp(name, html) {
  const p = path.join(os.tmpdir(), `brief-test-${name}-${process.pid}.html`);
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

console.log('═══ test-design-brief · behavioral ═══\n');

const goodBrief = {
  aestheticAnchor: '纪念碑谷的静谧几何',
  externalRefs: [{ url: 'https://example.com/master-ref', visualNote: '极端留白 + 单点霓虹' }],
  signatureMoment: '满版巨字封面,标题占页高 60%',
  extremeContrast: '尺度 8:1,深满版 vs 浅留白',
  bannedPatterns: ['side-stripe', 'gradient text'],
  narrativeArc: 'N4 画廊漫步(见 references/narrative-arcs.md)',
  pacingCurve: '疏-疏-密-疏-高潮-收',
  bannedBeats: ['anchor-numeral', 'face-off'],
};

// + complete brief (all 8 fields) → exit 0
const goodHtml = page(goodBrief);
const goodApi = checkHtml(goodHtml);
const goodFixture = tmp('good', goodHtml);
const goodCli = run(goodFixture);
fs.unlinkSync(goodFixture);
let goodJson = {};
try { goodJson = JSON.parse(goodCli.stdout); } catch { /* fail below */ }
caseOk(
  'complete brief (all 8 required fields) → exit 0 & pass=true',
  goodCli.status === 0 && goodJson.pass === true && goodApi.pass === true,
  `cli exit=${goodCli.status} json.pass=${goodJson.pass} api.pass=${goodApi.pass}`,
);

// - missing a required field (narrativeArc omitted) → exit 1, names narrativeArc
const { narrativeArc: _na, ...noArc } = goodBrief;
const noArcHtml = page(noArc);
const noArcApi = checkHtml(noArcHtml);
const noArcFixture = tmp('no-arc', noArcHtml);
const noArcCli = run(noArcFixture);
fs.unlinkSync(noArcFixture);
let noArcJson = {};
try { noArcJson = JSON.parse(noArcCli.stdout); } catch { /* fail below */ }
const namesArc = (noArcJson.missing || []).some(m => /narrativeArc/.test(m)) || /narrativeArc/.test(noArcApi.missing.join(' '));
caseOk(
  'brief missing narrativeArc → exit 1 & names narrativeArc',
  noArcCli.status === 1 && noArcJson.pass === false && namesArc,
  `cli exit=${noArcCli.status} json.pass=${noArcJson.pass} namedArc=${namesArc}`,
);

// - empty bannedBeats array → exit 1, names bannedBeats
const emptyBeatsHtml = page({ ...goodBrief, bannedBeats: [] });
const emptyBeatsApi = checkHtml(emptyBeatsHtml);
const emptyBeatsFixture = tmp('empty-beats', emptyBeatsHtml);
const emptyBeatsCli = run(emptyBeatsFixture);
fs.unlinkSync(emptyBeatsFixture);
let emptyJson = {};
try { emptyJson = JSON.parse(emptyBeatsCli.stdout); } catch { /* fail below */ }
const namesBeats = (emptyJson.missing || []).some(m => /bannedBeats/.test(m));
caseOk(
  'brief with empty bannedBeats array → exit 1 & names bannedBeats',
  emptyBeatsCli.status === 1 && emptyJson.pass === false && namesBeats,
  `cli exit=${emptyBeatsCli.status} json.pass=${emptyJson.pass} namedBeats=${namesBeats}`,
);

const failed = cases.filter(c => !c.ok).length;
console.log(`\n  ${failed === 0 ? `all ${cases.length} cases passed` : failed + '/' + cases.length + ' cases failed'}`);
process.exit(failed === 0 ? 0 : 1);
