#!/usr/bin/env node
/**
 * Grade Gate — machine-enforced delivery verdict
 * ─────────────────────────────────────────────────────────────
 * Runs the three blocking gates (lint, validate, label-overlap) and
 * produces a machine-readable JSON verdict. NO human "I think it's
 * minor" override — each gate passes only when its objective threshold
 * is met.
 *
 * Why this exists:
 *   benchmark.json iteration-1 clinical had overflow_count=2 (two VP_TOP
 *   kicker clipping issues) but the human grader marked the assertion
 *   "validate.js total = 0" as passed: true with rationale "only 2 minor
 *   overflow issues (best in class)." The kicker "Chapter 05 · Safety"
 *   was visibly clipped — a real P0 visual bug that the human waived
 *   through. This script eliminates that class of error by enforcing
 *   objective thresholds programmatically.
 *
 * Gates:
 *   G1  lint-design.js      P0 = 0            (design rule violations)
 *   G2  validate.js          total = 0         (viewport/content overflow)
 *   G3  test-label-overlap.js exit 0            (label leaks/overlaps)
 *
 * Usage:
 *   node scripts/grade-gate.js <file.html> [<file2.html> ...]
 *   node scripts/grade-gate.js --json <file.html>   # JSON to stdout only
 *
 * Exit codes:
 *   0 — all files pass all three gates
 *   1 — at least one gate failed on at least one file
 *   2 — usage error / missing dependency / file not found
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const args = process.argv.slice(2);
const jsonOnly = args.includes('--json');
const files = args.filter(a => !a.startsWith('--'));

if (!files.length) {
  console.error('Usage: node scripts/grade-gate.js <file.html> [<file2.html> ...] [--json]');
  process.exit(2);
}

const SCRIPTS_DIR = __dirname;

// ─── Gate runners ─────────────────────────────────────────────

function runLint(filePath) {
  const result = spawnSync('node', [path.join(SCRIPTS_DIR, 'lint-design.js'), filePath, '--json'], {
    encoding: 'utf8',
    timeout: 30_000,
  });
  if (result.error) return { passed: false, error: result.error.message, p0: null, p1: null };
  try {
    const data = JSON.parse(result.stdout);
    return {
      passed: data.summary.p0 === 0,
      p0: data.summary.p0,
      p1: data.summary.p1,
      details: data.p0.map(d => `[${d.rule}] ${d.message}`),
      exitCode: result.status,
    };
  } catch {
    return { passed: false, error: 'lint JSON parse failed', p0: null, stderr: result.stderr };
  }
}

function runValidate(filePath) {
  const result = spawnSync('node', [path.join(SCRIPTS_DIR, 'validate.js'), filePath], {
    encoding: 'utf8',
    timeout: 60_000,
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
  });
  if (result.error) return { passed: false, error: result.error.message, total: null };
  // validate.js exit code 0 = total === 0, exit 1 = there were issues
  // Parse the total from stdout for evidence
  const totalMatch = result.stdout.match(/检测结果:\s*(\d+)\s*个问题/);
  const total = totalMatch ? parseInt(totalMatch[1], 10) : null;
  return {
    passed: result.status === 0 && (total === 0 || total === null),
    total,
    exitCode: result.status,
    stderr: result.stderr?.trim() || null,
  };
}

function runLabelOverlap(filePath) {
  const result = spawnSync('node', [path.join(SCRIPTS_DIR, 'test-label-overlap.js'), filePath], {
    encoding: 'utf8',
    timeout: 60_000,
  });
  if (result.error) return { passed: false, error: result.error.message, overlaps: null };
  // exit 0 = no overlaps, exit 1 = overlaps found, exit 2 = error
  return {
    passed: result.status === 0,
    overlaps: result.status === 1 ? 'found' : (result.status === 2 ? 'error' : 'none'),
    exitCode: result.status,
    stderr: result.stderr?.trim() || null,
  };
}

// ─── Main ─────────────────────────────────────────────────────

const results = [];

for (const file of files) {
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) {
    results.push({ file, error: 'file not found', passed: false });
    continue;
  }

  if (!jsonOnly) console.log(`\n${path.basename(file)}`);

  const lint = runLint(abs);
  if (!jsonOnly) {
    console.log(`  G1 lint-design:      ${lint.passed ? '✓ P0=0' : `✗ P0=${lint.p0}`}${lint.error ? ` (${lint.error})` : ''}`);
    if (!lint.passed && lint.details) lint.details.slice(0, 3).forEach(d => console.log(`    ${d}`));
  }

  const validate = runValidate(abs);
  if (!jsonOnly) {
    console.log(`  G2 validate:         ${validate.passed ? '✓ total=0' : `✗ total=${validate.total ?? '?'}`}${validate.error ? ` (${validate.error})` : ''}`);
  }

  const overlap = runLabelOverlap(abs);
  if (!jsonOnly) {
    console.log(`  G3 label-overlap:    ${overlap.passed ? '✓ no overlaps' : `✗ ${overlap.overlaps}`}${overlap.error ? ` (${overlap.error})` : ''}`);
  }

  const allPassed = lint.passed && validate.passed && overlap.passed;
  if (!jsonOnly) console.log(`  → ${allPassed ? 'PASS' : 'FAIL'}`);

  results.push({
    file: abs,
    passed: allPassed,
    gates: {
      lint: { passed: lint.passed, p0: lint.p0, p1: lint.p1, error: lint.error || null, details: lint.details || [] },
      validate: { passed: validate.passed, total: validate.total, error: validate.error || null },
      labelOverlap: { passed: overlap.passed, overlaps: overlap.overlaps, error: overlap.error || null },
    },
  });
}

// ─── Summary ──────────────────────────────────────────────────

const allPassed = results.every(r => r.passed);
const summary = {
  passed: allPassed,
  filesChecked: results.length,
  filesPassed: results.filter(r => r.passed).length,
  filesFailed: results.filter(r => !r.passed).length,
  results,
};

if (jsonOnly) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(`\n${'─'.repeat(56)}`);
  console.log(`Grade Gate: ${allPassed ? '✓ ALL PASS' : '✗ FAIL'}`);
  console.log(`  ${summary.filesPassed}/${summary.filesChecked} files passed all three gates`);
  if (!allPassed) {
    const failed = results.filter(r => !r.passed);
    for (const f of failed) {
      const reasons = [];
      if (!f.gates?.lint?.passed) reasons.push(`lint P0=${f.gates?.lint?.p0}`);
      if (!f.gates?.validate?.passed) reasons.push(`validate total=${f.gates?.validate?.total}`);
      if (!f.gates?.labelOverlap?.passed) reasons.push(`label-overlap fail`);
      console.log(`  ✗ ${path.basename(f.file)}: ${reasons.join(', ') || f.error}`);
    }
  }
}

process.exit(allPassed ? 0 : 1);
