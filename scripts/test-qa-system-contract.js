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
  ['reviewer', 'reviewedAt', 'screenshotsManifestSha256', 'deckSha256', 'decision'].forEach((field) => {
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
    if (incomplete.length === 0) fail('validateVisualSignoff must reject a signoff missing reviewedAt/screenshotsManifestSha256/deckSha256/decision.');
    const wrongDecision = validateVisualSignoff({
      reviewer: 'human:x', reviewedAt: '2026-07-24T10:00:00+08:00',
      screenshotsManifestSha256: 'a'.repeat(64), deckSha256: 'b'.repeat(64), decision: 'fail',
    });
    if (wrongDecision.length === 0) fail('validateVisualSignoff must reject decision !== "pass".');
    const valid = validateVisualSignoff({
      reviewer: 'human:x', reviewedAt: '2026-07-24T10:00:00+08:00',
      screenshotsManifestSha256: 'a'.repeat(64), deckSha256: 'b'.repeat(64), decision: 'pass',
    });
    if (valid.length !== 0) fail(`validateVisualSignoff must accept a well-formed signoff (got: ${valid.join('; ')}).`);
    const badHash = validateVisualSignoff({
      reviewer: 'human:x', reviewedAt: '2026-07-24T10:00:00+08:00',
      screenshotsManifestSha256: 'not-hex', deckSha256: 'b'.repeat(64), decision: 'pass',
    });
    if (badHash.length === 0) fail('validateVisualSignoff must reject a non-64-hex screenshotsManifestSha256.');
    const noDeckHash = validateVisualSignoff({
      reviewer: 'human:x', reviewedAt: '2026-07-24T10:00:00+08:00',
      screenshotsManifestSha256: 'a'.repeat(64), decision: 'pass',
    });
    if (noDeckHash.length === 0) fail('validateVisualSignoff must reject a signoff missing deckSha256 (签字必须绑定 deck).');

    // File-binding proofs: a signoff is only valid against the exact deck + screenshots manifest
    // it names. Missing files must error (never silently skip), mismatches must error, and the
    // same signoff reused against a different deck must fail.
    const crypto = require('crypto');
    const os = require('os');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-contract-signoff-'));
    const deckA = path.join(tmp, 'deck-a.html');
    const deckB = path.join(tmp, 'deck-b.html');
    const shots = path.join(tmp, 'screenshots-manifest.json');
    fs.writeFileSync(deckA, '<html>deck A</html>');
    fs.writeFileSync(deckB, '<html>deck B — different bytes</html>');
    fs.writeFileSync(shots, JSON.stringify({ screenshots: ['p1.png'] }));
    const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
    const boundSignoff = {
      reviewer: 'human:x', reviewedAt: '2026-07-24T10:00:00+08:00',
      screenshotsManifestSha256: sha(shots), deckSha256: sha(deckA), decision: 'pass',
    };
    const boundOk = validateVisualSignoff(boundSignoff, { manifestFile: shots, deckFile: deckA });
    if (boundOk.length !== 0) fail(`validateVisualSignoff must accept a correctly file-bound signoff (got: ${boundOk.join('; ')}).`);
    const missingManifest = validateVisualSignoff(boundSignoff, { manifestFile: path.join(tmp, 'no-such-manifest.json'), deckFile: deckA });
    if (missingManifest.length === 0) fail('validateVisualSignoff must reject when the screenshots manifest file is missing (no silent skip).');
    const wrongManifestHash = validateVisualSignoff({ ...boundSignoff, screenshotsManifestSha256: 'c'.repeat(64) }, { manifestFile: shots, deckFile: deckA });
    if (wrongManifestHash.length === 0) fail('validateVisualSignoff must reject a screenshots-manifest hash mismatch.');
    const replayed = validateVisualSignoff(boundSignoff, { manifestFile: shots, deckFile: deckB });
    if (replayed.length === 0) fail('validateVisualSignoff must reject a signoff replayed against a different deck (deckSha256 mismatch).');
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
