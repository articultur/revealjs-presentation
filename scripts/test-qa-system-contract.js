#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function fail(message) {
  failures.push(message);
}

function requireToken(content, token, label) {
  if (token instanceof RegExp) {
    if (!token.test(content)) fail(`${label} is missing pattern ${token}`);
    return;
  }
  if (!content.includes(token)) fail(`${label} is missing "${token}"`);
}

const pkg = JSON.parse(read('package.json'));
if (pkg.scripts?.qa !== 'node scripts/qa.js') {
  fail('package.json must expose qa as node scripts/qa.js.');
}
if (pkg.scripts?.['test:qa-system-contract'] !== 'node scripts/test-qa-system-contract.js') {
  fail('package.json must expose test:qa-system-contract.');
}

if (!exists('scripts/qa.js')) {
  fail('scripts/qa.js unified QA runner is missing.');
} else {
  const qa = read('scripts/qa.js');
  [
    'grade-gate.js',
    'design-strength-check.js',
    'element-quality-check.js',
    'visual-verdict.js',
    'audit-image-assets.js',
  ].forEach(token => requireToken(qa, token, 'scripts/qa.js'));
  requireToken(qa, /passed\s*!==\s*true/, 'scripts/qa.js');
  requireToken(qa, /qualityScore\s*<\s*75/, 'scripts/qa.js');
}

const gradeGate = read('scripts/grade-gate.js');
if (/scriptBug\s*\?\s*true/.test(gradeGate)) {
  fail('grade-gate must fail closed when check-overflow has an internal script error.');
}
if (/跳过此项检查（不阻断）/.test(gradeGate)) {
  fail('grade-gate must not label internal gate errors as non-blocking.');
}

const labelOverlap = read('scripts/test-label-overlap.js');
[
  '.source',
  '.photo-credit',
  '.evidence-label',
].forEach(token => requireToken(labelOverlap, token, 'scripts/test-label-overlap.js'));

const visualQa = read('scripts/visual-qa.js');
requireToken(visualQa, '--output', 'scripts/visual-qa.js');
requireToken(visualQa, /unknown.*flag|unsupported.*flag|未知参数/i, 'scripts/visual-qa.js');

// ── Durable visual signoff contract (Task 10) ────────────────────────────────
// Production readiness must not rest on a bare boolean flag. qa.js must offer a file-backed
// signoff, restrict the boolean/env escape hatch to NODE_ENV=test, and emit a structured
// qa-summary so readiness is auditable.
if (!exists('scripts/qa.js')) {
  fail('scripts/qa.js unified QA runner is missing.');
} else {
  const qa = read('scripts/qa.js');
  requireToken(qa, '--visual-signoff-file', 'scripts/qa.js');
  requireToken(qa, /NODE_ENV\s*===\s*['"]test['"]/, 'scripts/qa.js NODE_ENV=test restriction for boolean signoff');
  requireToken(qa, /visual-signoff.*test|test.*visual-signoff|NODE_ENV=test 专用/, 'scripts/qa.js must label --visual-signoff as test-only');
  requireToken(qa, 'qa-summary', 'scripts/qa.js structured qa-summary output');
  ['reviewer', 'reviewedAt', 'screenshotsManifestSha256', 'decision'].forEach((field) => {
    requireToken(qa, field, `scripts/qa.js signoff field ${field}`);
  });
}

// run-manifest must export the shared signoff validator, and it must reject incomplete signoffs
// while accepting a well-formed one.
const runManifestPath = path.join(root, 'scripts', 'run-manifest.js');
if (!fs.existsSync(runManifestPath)) {
  fail('scripts/run-manifest.js is missing.');
} else {
  const { validateVisualSignoff } = require(runManifestPath);
  if (typeof validateVisualSignoff !== 'function') {
    fail('run-manifest.js must export validateVisualSignoff.');
  } else {
    const incomplete = validateVisualSignoff({ reviewer: 'human:x' });
    if (incomplete.length === 0) fail('validateVisualSignoff must reject a signoff missing reviewedAt/screenshotsManifestSha256/decision.');
    const wrongDecision = validateVisualSignoff({
      reviewer: 'human:x', reviewedAt: '2026-07-24T10:00:00+08:00',
      screenshotsManifestSha256: 'a'.repeat(64), decision: 'fail',
    });
    if (wrongDecision.length === 0) fail('validateVisualSignoff must reject decision !== "pass".');
    const valid = validateVisualSignoff({
      reviewer: 'human:x', reviewedAt: '2026-07-24T10:00:00+08:00',
      screenshotsManifestSha256: 'a'.repeat(64), decision: 'pass',
    });
    if (valid.length !== 0) fail(`validateVisualSignoff must accept a well-formed signoff (got: ${valid.join('; ')}).`);
    const badHash = validateVisualSignoff({
      reviewer: 'human:x', reviewedAt: '2026-07-24T10:00:00+08:00',
      screenshotsManifestSha256: 'not-hex', decision: 'pass',
    });
    if (badHash.length === 0) fail('validateVisualSignoff must reject a non-64-hex screenshotsManifestSha256.');
  }
}

if (failures.length) {
  console.error('QA system contract failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('QA system contract passed.');
