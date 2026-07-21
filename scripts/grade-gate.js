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
 *   G11 test-text-break.js       exit 0            (词/数字跨行断裂)
 *   G12 design-strength-check.js --gate PASS       (反 slop 地板:scaleContrast≥2.5 & metaphor≥1)
 *   G13 test-text-collision.js   exit 0            (margin-swallow / stack-occlude / shape-overflow)
 *   G14 test-pin-collision.js    exit 0            (.pin 辅助索引区不与内容重叠)
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

// Shared fail-closed: a JS error in a gate script's stderr means the detector
// itself broke (e.g. missing Playwright binary → unhandled launch error). The gate
// must fail-closed, never silently pass. Mirrors G9-G11's scriptBug pattern.
function detectScriptBug(stderr) {
  return /(?:Reference|Type|Syntax|Range|URI|Eval|Aggregate)Error|^Error:/m.test(stderr || '');
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
  // Fail-closed: a clean validate.js run ALWAYS prints a count (total === 0).
  // total === null means stdout was unparseable — treat as failure (mirrors G9/G10/G11
  // parseFailed), never as a pass. Same defensive class as the missing-browser case.
  const parseFailed = total === null;
  const scriptBug = detectScriptBug(result.stderr);
  return {
    passed: result.status === 0 && total === 0 && !scriptBug,
    total,
    parseFailed,
    scriptBug,
    exitCode: result.status,
    stderr: result.stderr?.trim() || null,
    error: scriptBug ? 'validate internal script error' : (parseFailed ? 'validate total parse failed' : null),
  };
}

function runLabelOverlap(filePath) {
  const result = spawnSync('node', [path.join(SCRIPTS_DIR, 'test-label-overlap.js'), filePath], {
    encoding: 'utf8',
    timeout: 60_000,
  });
  if (result.error) return { passed: false, error: result.error.message, overlaps: null };
  // exit 0 = no overlaps, exit 1 = overlaps found, exit 2 = error
  const scriptBug = detectScriptBug(result.stderr);
  return {
    passed: result.status === 0 && !scriptBug,
    overlaps: result.status === 1 ? 'found' : (result.status === 2 ? 'error' : 'none'),
    scriptBug,
    exitCode: result.status,
    stderr: result.stderr?.trim() || null,
    error: scriptBug ? 'label-overlap internal script error' : null,
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
  const scriptBug = detectScriptBug(result.stderr);
  return {
    passed: result.status === 0 && !scriptBug,
    violationCount: violations.length,
    violations,
    scriptBug,
    exitCode: result.status,
    stderr: result.stderr?.trim() || null,
    error: scriptBug ? 'lint-main-claim internal script error' : null,
  };
}

function runEvidenceLedger(filePath) {
  const result = spawnSync('node', [path.join(SCRIPTS_DIR, 'test-evidence-ledger.js'), filePath], {
    encoding: 'utf8',
    timeout: 30_000,
  });
  if (result.error) return { passed: false, error: result.error.message };
  const scriptBug = detectScriptBug(result.stderr);
  return {
    passed: result.status === 0 && !scriptBug,
    scriptBug,
    exitCode: result.status,
    stderr: result.stderr?.trim() || null,
    error: scriptBug ? 'evidence-ledger internal script error' : null,
  };
}

function runColorRole(filePath) {
  const result = spawnSync('node', [path.join(SCRIPTS_DIR, 'test-color-role.js'), filePath], {
    encoding: 'utf8',
    timeout: 30_000,
  });
  if (result.error) return { passed: false, error: result.error.message };
  const scriptBug = detectScriptBug(result.stderr);
  return {
    passed: result.status === 0 && !scriptBug,
    scriptBug,
    exitCode: result.status,
    stderr: result.stderr?.trim() || null,
    error: scriptBug ? 'color-role internal script error' : null,
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
  const scriptBug = detectScriptBug(result.stderr);
  return {
    passed: result.status === 0 && !scriptBug,
    violationCount,
    scriptBug,
    exitCode: result.status,
    stderr: result.stderr?.trim() || null,
    error: scriptBug ? 'contrast-aa internal script error' : null,
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
  const scriptBug = detectScriptBug(result.stderr);
  return {
    passed: result.status === 0 && !scriptBug,
    shortCount,
    scriptBug,
    exitCode: result.status,
    stderr: result.stderr?.trim() || null,
    error: scriptBug ? 'canvas-fill internal script error' : null,
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
  const scriptBug = /(?:Reference|Type|Syntax|Range|URI|Eval|Aggregate)Error|^Error:/m.test(stderr);
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
  const stderr = result.stderr?.trim() || '';
  const stdout = result.stdout || '';
  const m = stdout.match(/(\d+) spatial issue\(s\)/);
  // test-spatial-integrity 无 issue 时输出 "spatial integrity clear"(不含数字),只靠正则
  // 会让正常 deck 误判 parse failed → fail-closed 误杀。clear 信号 → issueCount=0;有 issue → 正则取 N。
  const isClear = /spatial integrity clear|OK: spatial integrity/i.test(stdout);
  const issueCount = m ? parseInt(m[1], 10) : (isClear ? 0 : null);
  // 脚本内部 bug 说明 G10 失效;门禁必须 fail-closed,避免坏检测静默放行(对齐 G9 runCheckOverflow)。
  const scriptBug = /(?:Reference|Type|Syntax|Range|URI|Eval|Aggregate)Error|^Error:/m.test(stderr);
  const parseFailed = issueCount === null;
  return {
    passed: !scriptBug && !parseFailed && issueCount === 0,
    issueCount,
    exitCode: result.status,
    stderr: stderr || null,
    error: scriptBug
      ? 'spatial-integrity internal script error'
      : (parseFailed ? 'spatial-integrity issue count parse failed' : null),
  };
}

// ─── G11 · 词/数字跨行断裂（playwright Range.getClientRects + nodejieba 分词） ───
function runTextBreak(filePath) {
  const result = spawnSync('node', [path.join(SCRIPTS_DIR, 'test-text-break.js'), filePath], {
    encoding: 'utf8', timeout: 180_000,
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
  });
  if (result.error) return { passed: false, error: result.error.message };
  const stderr = result.stderr?.trim() || '';
  const stdout = result.stdout || '';
  const m = stdout.match(/(\d+) break issue\(s\)/);
  // test-text-break 无 issue 时输出 "no text break"(不含数字),只靠正则会让正常 deck
  // 误判 parse failed → fail-closed 误杀。clear 信号 → issueCount=0;有 issue → 正则取 N。
  const isClear = /no text break|OK: no text breaks/i.test(stdout);
  const issueCount = m ? parseInt(m[1], 10) : (isClear ? 0 : null);
  // 脚本内部 bug 说明 G11 失效;门禁必须 fail-closed,避免坏检测静默放行(对齐 G9 runCheckOverflow)。
  const scriptBug = /(?:Reference|Type|Syntax|Range|URI|Eval|Aggregate)Error|^Error:/m.test(stderr);
  const parseFailed = issueCount === null;
  return {
    passed: !scriptBug && !parseFailed && issueCount === 0,
    issueCount,
    exitCode: result.status,
    stderr: stderr || null,
    error: scriptBug
      ? 'text-break internal script error'
      : (parseFailed ? 'text-break issue count parse failed' : null),
  };
}

// ─── G12 · 反 slop 地板(design-strength --gate:scaleContrast≥2.5 且 metaphor≥1) ───
function runDesignStrength(filePath) {
  const result = spawnSync('node', [path.join(SCRIPTS_DIR, 'design-strength-check.js'), filePath, '--gate'], {
    encoding: 'utf8', timeout: 180_000,
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
  });
  if (result.error) return { passed: false, error: result.error.message };
  const stdout = result.stdout || '';
  const m = stdout.match(/→ (PASS|FAIL)/);
  const gateResult = m ? m[1] : null;
  const parseFailed = gateResult === null;
  return {
    passed: result.status === 0 && !parseFailed && gateResult === 'PASS',
    gateResult,
    exitCode: result.status,
    stdout: stdout.slice(-400),
  };
}

// ─── G13 · 文字碰撞（margin-swallow / stack-occlude / shape-overflow；test-label-overlap 的渲染层叠盲区） ───
function runTextCollision(filePath) {
  const result = spawnSync('node', [path.join(SCRIPTS_DIR, 'test-text-collision.js'), filePath], {
    encoding: 'utf8', timeout: 180_000,
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
  });
  if (result.error) return { passed: false, error: result.error.message };
  const stderr = result.stderr?.trim() || '';
  const stdout = result.stdout || '';
  const m = stdout.match(/FAIL: (\d+) text collision/);
  // test-text-collision 无 issue 时输出 "OK: no text collisions"(不含数字),只靠正则
  // 会让正常 deck 误判 parse failed → fail-closed 误杀。clear 信号 → issueCount=0;有 issue → 正则取 N。
  const isClear = /OK: no text collisions/i.test(stdout);
  const issueCount = m ? parseInt(m[1], 10) : (isClear ? 0 : null);
  // 脚本内部 bug 说明 G13 失效;门禁必须 fail-closed,避免坏检测静默放行(对齐 G9/G10/G11)。
  const scriptBug = /(?:Reference|Type|Syntax|Range|URI|Eval|Aggregate)Error|^Error:/m.test(stderr);
  const parseFailed = issueCount === null;
  return {
    passed: !scriptBug && !parseFailed && issueCount === 0,
    issueCount,
    exitCode: result.status,
    stderr: stderr || null,
    error: scriptBug
      ? 'text-collision internal script error'
      : (parseFailed ? 'text-collision issue count parse failed' : null),
  };
}

// ─── G14 · pin 碰撞（.pin 辅助索引区不与内容重叠;failure-gates.md「任何 collision 视为阻断项」) ───
function runPinCollision(filePath) {
  const result = spawnSync('node', [path.join(SCRIPTS_DIR, 'test-pin-collision.js'), filePath], {
    encoding: 'utf8', timeout: 180_000,
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
  });
  if (result.error) return { passed: false, error: result.error.message };
  const stderr = result.stderr?.trim() || '';
  const stdout = result.stdout || '';
  const m = stdout.match(/FAIL: (\d+) pin collision/);
  const isClear = /OK: all pin regions clear/i.test(stdout);
  const issueCount = m ? parseInt(m[1], 10) : (isClear ? 0 : null);
  const scriptBug = /(?:Reference|Type|Syntax|Range|URI|Eval|Aggregate)Error|^Error:/m.test(stderr);
  const parseFailed = issueCount === null;
  return {
    passed: !scriptBug && !parseFailed && issueCount === 0,
    issueCount,
    exitCode: result.status,
    stderr: stderr || null,
    error: scriptBug
      ? 'pin-collision internal script error'
      : (parseFailed ? 'pin-collision issue count parse failed' : null),
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

  const textBreak = runTextBreak(abs);
  if (!jsonOnly) {
    console.log(`  G11 text-break:      ${textBreak.passed ? '✓ no word/number split' : fail(`✗ ${textBreak.issueCount || '?'} break(s)`)}${textBreak.error ? ` (${textBreak.error})` : ''}`);
  }

  const strength = runDesignStrength(abs);
  if (!jsonOnly) {
    console.log(`  G12 design-strength: ${strength.passed ? '✓ scaleContrast≥2.5 & metaphor≥1' : fail(`✗ ${strength.gateResult || strength.error || '反 slop 地板未达'}`)}`);
  }

  const textCollision = runTextCollision(abs);
  if (!jsonOnly) {
    console.log(`  G13 text-collision:  ${textCollision.passed ? '✓ no text collision' : fail(`✗ ${textCollision.issueCount || '?'} collision(s)`)}${textCollision.error ? ` (${textCollision.error})` : ''}`);
  }

  const pinCollision = runPinCollision(abs);
  if (!jsonOnly) {
    console.log(`  G14 pin-collision:   ${pinCollision.passed ? '✓ pin regions clear' : fail(`✗ ${pinCollision.issueCount || '?'} collision(s)`)}${pinCollision.error ? ` (${pinCollision.error})` : ''}`);
  }

  const allPassed = lint.passed && validate.passed && overlap.passed && mainClaim.passed && evidence.passed && colorRole.passed && contrast.passed && canvas.passed && overflow.passed && spatial.passed && textBreak.passed && strength.passed && textCollision.passed && pinCollision.passed;
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
      textBreak: { passed: textBreak.passed, issueCount: textBreak.issueCount || 0, exitCode: textBreak.exitCode || 0, error: textBreak.error || null },
      designStrength: { passed: strength.passed, gateResult: strength.gateResult || null, exitCode: strength.exitCode || 0 },
      textCollision: { passed: textCollision.passed, issueCount: textCollision.issueCount || 0, exitCode: textCollision.exitCode || 0, error: textCollision.error || null },
      pinCollision: { passed: pinCollision.passed, issueCount: pinCollision.issueCount || 0, exitCode: pinCollision.exitCode || 0, error: pinCollision.error || null },
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
      if (!f.gates?.textBreak?.passed) reasons.push(`text-break fail (${f.gates?.textBreak?.issueCount || '?'} breaks)`);
      if (!f.gates?.designStrength?.passed) reasons.push(`design-strength fail (${f.gates?.designStrength?.gateResult || '?'})`);
      if (!f.gates?.textCollision?.passed) reasons.push(`text-collision fail (${f.gates?.textCollision?.issueCount || '?'} collisions)`);
      if (!f.gates?.pinCollision?.passed) reasons.push(`pin-collision fail (${f.gates?.pinCollision?.issueCount || '?'} collisions)`);
      console.log(failDim(`  ✗ ${path.basename(f.file)}: ${reasons.join(', ') || f.error}`));
    }
  }
}

process.exit(allPassed ? 0 : 1);
