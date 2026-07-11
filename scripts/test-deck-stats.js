#!/usr/bin/env node
'use strict';

/**
 * test-deck-stats.js — contract tests for scripts/deck-stats.js
 *
 * Covers three cases:
 *   1. Single file  — JSON object with all 7 keys, slides positive integer
 *   2. Multiple files — JSON array of length 2, each entry well-formed
 *   3. Error path    — entry has error key AND exit code non-zero
 */

const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const deckStats = path.join(root, 'scripts/deck-stats.js');
const clinicalTrial = path.join(root, 'examples/template-10-clinical-trial.html');
const editorialSerif = path.join(root, 'examples/template-01-editorial-serif.html');

const EXPECTED_KEYS = ['file', 'slides', 'tables', 'backgrounds', 'hasExportButton', 'hasInkTheme', 'bytes'];

let passed = 0;
let failed = 0;

function ok(label) {
  console.log(`✓ ${label}`);
  passed++;
}

function fail(label, detail) {
  console.error(`✗ ${label}`);
  if (detail) console.error(`  ${detail}`);
  failed++;
}

function runDeckStats(args) {
  return spawnSync(process.execPath, [deckStats, ...args], {
    cwd: root,
    encoding: 'utf8',
  });
}

// --- Case 1: Single file produces a well-formed object ---
(function singleFile() {
  const label = 'Single file: JSON object with all 7 keys and positive integer slides';

  const result = runDeckStats([clinicalTrial]);
  if (result.status !== 0) {
    fail(label, `unexpected exit code ${result.status}\n${result.stderr}`);
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch (e) {
    fail(label, `stdout is not valid JSON: ${e.message}`);
    return;
  }

  if (Array.isArray(parsed)) {
    fail(label, 'expected a JSON object, got an array');
    return;
  }

  for (const key of EXPECTED_KEYS) {
    if (!(key in parsed)) {
      fail(label, `missing key "${key}" in output`);
      return;
    }
  }

  if (typeof parsed.slides !== 'number' || !Number.isInteger(parsed.slides) || parsed.slides <= 0) {
    fail(label, `slides should be a positive integer, got ${JSON.stringify(parsed.slides)}`);
    return;
  }

  ok(label);
})();

// --- Case 2: Multiple files produce a JSON array of well-formed entries ---
(function multipleFiles() {
  const label = 'Multiple files: JSON array of length 2, each entry well-formed';

  const result = runDeckStats([clinicalTrial, editorialSerif]);
  if (result.status !== 0) {
    fail(label, `unexpected exit code ${result.status}\n${result.stderr}`);
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch (e) {
    fail(label, `stdout is not valid JSON: ${e.message}`);
    return;
  }

  if (!Array.isArray(parsed)) {
    fail(label, 'expected a JSON array, got a non-array');
    return;
  }

  if (parsed.length !== 2) {
    fail(label, `expected array length 2, got ${parsed.length}`);
    return;
  }

  for (let i = 0; i < parsed.length; i++) {
    const entry = parsed[i];
    for (const key of EXPECTED_KEYS) {
      if (!(key in entry)) {
        fail(label, `entry ${i} missing key "${key}"`);
        return;
      }
    }
  }

  ok(label);
})();

// --- Case 3: Error path — non-existent file produces error key and non-zero exit ---
(function errorPath() {
  const label = 'Error path: missing file has error key and non-zero exit code';

  const result = runDeckStats([path.join(root, 'examples/nonexistent-file-xyz.html')]);

  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch (e) {
    fail(label, `stdout is not valid JSON: ${e.message}`);
    return;
  }

  if (!('error' in parsed)) {
    fail(label, 'expected "error" key in the JSON entry');
    return;
  }

  if (result.status === 0) {
    fail(label, 'expected non-zero exit code, got 0');
    return;
  }

  ok(label);
})();

if (failed > 0) {
  console.error(`\n${failed} test(s) failed, ${passed} passed.`);
  process.exit(1);
}

console.log(`\nAll ${passed} test(s) passed.`);
