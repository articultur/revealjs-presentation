#!/usr/bin/env node
/**
 * Grade Gate — machine-enforced delivery verdict
 * ─────────────────────────────────────────────────────────────
 * Runs the blocking gates and produces a machine-readable JSON
 * verdict. NO human "I think it's minor" override — each gate passes
 * only when its objective threshold is met.
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
 *   G1  lint-design.js          P0 = 0            (design rule violations)
 *   G2  validate.js              total = 0         (viewport/content overflow)
 *   G3  test-label-overlap.js    exit 0            (label leaks/overlaps)
 *   G4  test-lint-main-claim.js  exit 0            (pin-as-sole-claim detection)
 *   G5  test-evidence-ledger.js  exit 0            (unlabeled metrics)
 *   G6  test-color-role.js       exit 0            (main-claim contrast hierarchy)
 *   G7  test-contrast-aa.js      exit 0            (absolute WCAG AA contrast)
 *   G8  test-canvas-fill.js      exit 0            (sections fill the 720 canvas)
 *   G9  check-overflow.js        issueCount = 0    (bbox overflow / overlap)
 *   G10 test-spatial-integrity.js exit 0           (surface drift / clipped SVG text)
 *
 * Usage:
 *   node scripts/grade-gate.js <file.html> [<file2.html> ...]
 *   node scripts/grade-gate.js --json <file.html>   # JSON to stdout only
 *
 * Exit codes:
 *   0 — all files pass all gates
 *   1 — at least one gate failed on at least one file
 *   2 — usage error / missing dependency / file not found
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

// ─── ANSI helpers ──────────────────────────────────────────────
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const R = '\x1b[0m';
const fail = (s) => `${RED}${BOLD}${s}${R}`;
const pass = (s) => `${GREEN}${s}${R}`;
const failDim = (s) => `${RED}${DIM}${s}${R}`;

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

function runLintMainClaim(filePath) {
  const result = spawnSync('node', [path.join(SCRIPTS_DIR, 'test-lint-main-claim.js'), filePath], {
    encoding: 'utf8',
    timeout: 30_000,
  });
  if (result.error) return { passed: false, error: result.error.message };
  // Parse violation details from stdout: each "slide N: pin="..."" line
  const violations = [];
  const lines = result.stdout.split('\n');
  for (const line of lines) {
    const m = line.match(/slide\s+(\d+):\s*pin="([^"]+)"\s*main="([^"]*)"/);
    if (m) violations.push({ slide: parseInt(m[1]), pin: m[2], mainExcerpt: m[3] });
  }
  return {
    passed: result.status === 0,
    violationCount: violations.length,
    violations,
    exitCode: result.status,
    stderr: result.stderr?.trim() || null,
  };
}

function runEvidenceLedger(filePath) {
  const result = spawnSync('node', [path.join(SCRIPTS_DIR, 'test-evidence-ledger.js'), filePath], {
    encoding: 'utf8',
    timeout: 30_000,
  });
  if (result.error) return { passed: false, error: result.error.message };
  return {
    passed: result.status === 0,
    exitCode: result.status,
    stderr: result.stderr?.trim() || null,
  };
}

function runColorRole(filePath) {
  const result = spawnSync('node', [path.join(SCRIPTS_DIR, 'test-color-role.js'), filePath], {
    encoding: 'utf8',
    timeout: 30_000,
  });
  if (result.error) return { passed: false, error: result.error.message };
  return {
    passed: result.status === 0,
    exitCode: result.status,
    stderr: result.stderr?.trim() || null,
  };
}

function runContrastAA(filePath) {
  const result = spawnSync('node', [path.join(SCRIPTS_DIR, 'test-contrast-aa.js'), filePath], {
    encoding: 'utf8',
    timeout: 60_000,
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
  });
  if (result.error) return { passed: false, error: result.error.message };
  const violationCount = (result.stdout.match(/^     slide \d+:/gm) || []).length;
  return {
    passed: result.status === 0,
    violationCount,
    exitCode: result.status,
    stderr: result.stderr?.trim() || null,
  };
}

function runCanvasFill(filePath) {
  const result = spawnSync('node', [path.join(SCRIPTS_DIR, 'test-canvas-fill.js'), filePath], {
    encoding: 'utf8',
    timeout: 60_000,
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
  });
  if (result.error) return { passed: false, error: result.error.message };
  const shortCount = (result.stdout.match(/^     slide \d+:/gm) || []).length;
  return {
    passed: result.status === 0,
    shortCount,
    exitCode: result.status,
    stderr: result.stderr?.trim() || null,
  };
}

// ─── G9 · 文字/标线越画布 + 时间线叠放（playwright bbox 检测） ───
function runCheckOverflow(filePath) {
  const result = spawnSync('node', [path.join(SCRIPTS_DIR, 'check-overflow.js'), filePath], {
    encoding: 'utf8', timeout: 180_000,
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
  });
  if (result.error) return { passed: false, error: result.error.message };
  const stderr = result.stderr?.trim() || '';
  const m = (result.stdout || '').match(/(\d+) issue\(s\)/);
  const issueCount = m ? parseInt(m[1]) : null;
  // 脚本内部 bug 说明 G9 失效；门禁必须 fail-closed，避免坏检测静默放行。
  const scriptBug = /ReferenceError|TypeError|SyntaxError|^Error:/m.test(stderr);
  const parseFailed = issueCount === null;
  return {
    passed: result.status === 0 && !scriptBug && !parseFailed && issueCount === 0,
    issueCount,
    exitCode: result.status,
    stderr: stderr || null,
    error: scriptBug
      ? 'check-overflow internal script error'
      : (parseFailed ? 'check-overflow issue count parse failed' : null),
  };
}

// ─── G10 · 空间完整性（proof object 与物理表面坐标系一致 + SVG 文字不被 viewBox 裁切） ───
function runSpatialIntegrity(filePath) {
  const result = spawnSync('node', [path.join(SCRIPTS_DIR, 'test-spatial-integrity.js'), filePath], {
    encoding: 'utf8', timeout: 180_000,
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
  });
  if (result.error) return { passed: false, error: result.error.message };
  const m = (result.stdout || '').match(/(\d+) spatial issue\(s\)/);
  const issueCount = m ? parseInt(m[1], 10) : 0;
  return {
    passed: result.status === 0,
    issueCount,
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
    console.log(`  G1 lint-design:      ${lint.passed ? '✓ P0=0' : fail(`✗ P0=${lint.p0}`)}${lint.error ? ` (${lint.error})` : ''}`);
    if (!lint.passed && lint.details) lint.details.slice(0, 3).forEach(d => console.log(`    ${d}`));
  }

  const validate = runValidate(abs);
  if (!jsonOnly) {
    console.log(`  G2 validate:         ${validate.passed ? '✓ total=0' : fail(`✗ total=${validate.total ?? '?'}`)}${validate.error ? ` (${validate.error})` : ''}`);
  }

  const overlap = runLabelOverlap(abs);
  if (!jsonOnly) {
    console.log(`  G3 label-overlap:    ${overlap.passed ? '✓ no overlaps' : fail(`✗ ${overlap.overlaps}`)}${overlap.error ? ` (${overlap.error})` : ''}`);
  }

  const mainClaim = runLintMainClaim(abs);
  if (!jsonOnly) {
    const vc = mainClaim.violationCount || '?';
    console.log(`  G4 lint-main-claim:  ${mainClaim.passed ? '✓ no violations' : fail('✗ ' + vc + ' slide(s)')}${mainClaim.error ? ` (${mainClaim.error})` : ''}`);
  }

  const evidence = runEvidenceLedger(abs);
  if (!jsonOnly) {
    console.log(`  G5 evidence-ledger:   ${evidence.passed ? '✓ all labeled' : fail('✗ unlabeled metrics')}${evidence.error ? ` (${evidence.error})` : ''}`);
  }

  const colorRole = runColorRole(abs);
  if (!jsonOnly) {
    console.log(`  G6 color-role:        ${colorRole.passed ? '✓ main claims dominate' : fail('✗ pin out-contrasts claim')}${colorRole.error ? ` (${colorRole.error})` : ''}`);
  }

  const contrast = runContrastAA(abs);
  if (!jsonOnly) {
    const vc = contrast.violationCount || 0;
    console.log(`  G7 contrast-aa:       ${contrast.passed ? '✓ meets WCAG AA' : fail(`✗ ${vc} below AA`)}${contrast.error ? ` (${contrast.error})` : ''}`);
  }

  const canvas = runCanvasFill(abs);
  if (!jsonOnly) {
    const sc = canvas.shortCount || 0;
    console.log(`  G8 canvas-fill:       ${canvas.passed ? '✓ sections fill canvas' : fail(`✗ ${sc} short`)}${canvas.error ? ` (${canvas.error})` : ''}`);
  }

  const overflow = runCheckOverflow(abs);
  if (!jsonOnly) {
    console.log(`  G9 check-overflow:    ${overflow.passed ? '✓ no overflow/overlap' : fail(`✗ ${overflow.issueCount || '?'} issue(s)`)}${overflow.error ? ` (${overflow.error})` : ''}`);
  }

  const spatial = runSpatialIntegrity(abs);
  if (!jsonOnly) {
    console.log(`  G10 spatial-integrity:${spatial.passed ? '✓ surfaces aligned' : fail(`✗ ${spatial.issueCount || '?'} issue(s)`)}${spatial.error ? ` (${spatial.error})` : ''}`);
  }

  const allPassed = lint.passed && validate.passed && overlap.passed && mainClaim.passed && evidence.passed && colorRole.passed && contrast.passed && canvas.passed && overflow.passed && spatial.passed;
  if (!jsonOnly) console.log(`  → ${allPassed ? pass('PASS') : fail('FAIL')}`);

  results.push({
    file: abs,
    passed: allPassed,
    gates: {
      lint: { passed: lint.passed, p0: lint.p0, p1: lint.p1, error: lint.error || null, details: lint.details || [] },
      validate: { passed: validate.passed, total: validate.total, error: validate.error || null },
      labelOverlap: { passed: overlap.passed, overlaps: overlap.overlaps, error: overlap.error || null },
      lintMainClaim: { passed: mainClaim.passed, violationCount: mainClaim.violationCount || 0, violations: mainClaim.violations || [], error: mainClaim.error || null },
      evidenceLedger: { passed: evidence.passed, error: evidence.error || null },
      colorRole: { passed: colorRole.passed, error: colorRole.error || null },
      contrastAA: { passed: contrast.passed, violationCount: contrast.violationCount || 0, error: contrast.error || null },
      canvasFill: { passed: canvas.passed, shortCount: canvas.shortCount || 0, error: canvas.error || null },
      checkOverflow: { passed: overflow.passed, issueCount: overflow.issueCount || 0, exitCode: overflow.exitCode || 0, error: overflow.error || null },
      spatialIntegrity: { passed: spatial.passed, issueCount: spatial.issueCount || 0, exitCode: spatial.exitCode || 0, error: spatial.error || null },
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
  if (allPassed) {
    console.log(pass(`Grade Gate: ✓ ALL PASS`));
  } else {
    console.log(fail(`Grade Gate: ✗ FAIL`));
  }
  console.log(`  ${summary.filesPassed}/${summary.filesChecked} files passed all gates`);
  if (!allPassed) {
    const failed = results.filter(r => !r.passed);
    for (const f of failed) {
      const reasons = [];
      if (!f.gates?.lint?.passed) reasons.push(`lint P0=${f.gates?.lint?.p0}`);
      if (!f.gates?.validate?.passed) reasons.push(`validate total=${f.gates?.validate?.total}`);
      if (!f.gates?.labelOverlap?.passed) reasons.push(`label-overlap fail`);
      const mcVc = f.gates?.lintMainClaim?.violationCount || '?';
      if (!f.gates?.lintMainClaim?.passed) reasons.push(`lint-main-claim fail (${mcVc} slides)`);
      if (!f.gates?.evidenceLedger?.passed) reasons.push(`evidence-ledger fail`);
      if (!f.gates?.colorRole?.passed) reasons.push(`color-role fail`);
      if (!f.gates?.contrastAA?.passed) reasons.push(`contrast-aa fail (${f.gates?.contrastAA?.violationCount || '?'} texts)`);
      if (!f.gates?.canvasFill?.passed) reasons.push(`canvas-fill fail (${f.gates?.canvasFill?.shortCount || '?'} short)`);
      if (!f.gates?.checkOverflow?.passed) reasons.push(`check-overflow fail (${f.gates?.checkOverflow?.issueCount || '?'} issues)`);
      if (!f.gates?.spatialIntegrity?.passed) reasons.push(`spatial-integrity fail (${f.gates?.spatialIntegrity?.issueCount || '?'} issues)`);
      console.log(failDim(`  ✗ ${path.basename(f.file)}: ${reasons.join(', ') || f.error}`));
    }
  }
}

process.exit(allPassed ? 0 : 1);
