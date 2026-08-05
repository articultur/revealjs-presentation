#!/usr/bin/env node
'use strict';

/**
 * test-editorial-contamination.js — behavioral test for check-editorial-contamination.js
 * ====================================================================
 * The gate has zero external tests; this pins its fail-closed contract the same way
 * qa.js exercises it: spawnSync(process.execPath, [script, absFixture, '--topic', t, '--gate']).
 *
 * CRITICAL: a FAIL verdict only exits non-zero when --gate is passed (see gate line: if
 * (r.verdict === 'FAIL' && opts.gate) process.exit(1)). qa.js always passes --gate, so we
 * mirror that — without --gate the negative case would wrongly exit 0.
 *
 * Cases:
 *   + clean non-editorial deck (no archive tokens)         → exit 0
 *   + editorial-native topic exempts a contaminated deck   → exit 0
 *   - contaminated deck (≥2 archive tokens, non-editorial) → exit 1
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GATE = path.join(ROOT, 'scripts', 'check-editorial-contamination.js');
const { check, isEditorialTopic } = require(GATE);

const SERIF = 'Cormorant Garamond, serif';
const SANS = 'Inter, sans-serif';

function page(classes, displayFont) {
  return '<!doctype html><html><head><style>' +
    `:root{--f-display:${displayFont};}</style></head>` +
    `<body><section class="${classes}"><h1>x</h1></section></body></html>`;
}

function tmp(name, html) {
  const p = path.join(os.tmpdir(), `ec-test-${name}-${process.pid}.html`);
  fs.writeFileSync(p, html);
  return p;
}

function run(absFixture, topic, extraArgs) {
  const args = [absFixture, '--topic', topic, '--gate'];
  if (extraArgs) args.push(...extraArgs);
  return spawnSync(process.execPath, [GATE, ...args], { encoding: 'utf8' });
}

const cases = [];
function caseOk(name, ok, detail) {
  cases.push({ name, ok });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

console.log('═══ test-editorial-contamination · behavioral ═══\n');

// + clean: no archive tokens, sans display, non-editorial topic → exit 0
const clean = tmp('clean', page('intro hero metric-grid', SANS));
const cleanApi = check(clean, { topic: '金融分析' });
const cleanCli = run(clean, '金融分析');
fs.unlinkSync(clean);
caseOk(
  'clean non-editorial deck (no archive tokens) → exit 0',
  cleanCli.status === 0 && cleanApi.verdict === 'PASS' && cleanApi.score === 0,
  `cli exit=${cleanCli.status} verdict=${cleanApi.verdict} score=${cleanApi.score}`,
);

// + editorial-native topic exempts an otherwise-contaminated deck → exit 0
const exempt = tmp('exempt', page('plate masthead', SERIF));
const exemptApi = check(exempt, { topic: '品牌编年史' });
const exemptCli = run(exempt, '品牌编年史');
fs.unlinkSync(exempt);
caseOk(
  'editorial-native topic (编年史) exempts contaminated deck → exit 0',
  exemptCli.status === 0 && exemptApi.verdict === 'PASS' && isEditorialTopic('品牌编年史'),
  `cli exit=${exemptCli.status} verdict=${exemptApi.verdict} archiveN=${exemptApi.archiveN} (exempt)`,
);

// - contaminated: ≥2 archive tokens, non-editorial topic, --gate → exit 1
const dirty = tmp('dirty', page('plate masthead', SANS));
const dirtyApi = check(dirty, { topic: '金融分析' });
const dirtyCli = run(dirty, '金融分析');
fs.unlinkSync(dirty);
caseOk(
  'contaminated deck (2 archive tokens, non-editorial) --gate → exit 1',
  dirtyCli.status === 1 && dirtyApi.verdict === 'FAIL' && dirtyApi.archiveN >= 2,
  `cli exit=${dirtyCli.status} verdict=${dirtyApi.verdict} archiveN=${dirtyApi.archiveN} score=${dirtyApi.score}`,
);

const failed = cases.filter(c => !c.ok).length;
console.log(`\n  ${failed === 0 ? `all ${cases.length} cases passed` : failed + '/' + cases.length + ' cases failed'}`);
process.exit(failed === 0 ? 0 : 1);
