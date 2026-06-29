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

if (failures.length) {
  console.error('QA system contract failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('QA system contract passed.');
