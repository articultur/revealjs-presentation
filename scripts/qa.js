#!/usr/bin/env node
'use strict';

/**
 * Unified QA runner
 * ------------------------------------------------------------
 * Combines the deterministic floor gates with the launch-grade ceiling checks.
 *
 * Usage:
 *   node scripts/qa.js deck.html [deck2.html]
 *   node scripts/qa.js --no-visual deck.html
 *   node scripts/qa.js --visual-dry-run --allow-visual-pending deck.html
 *   node scripts/qa.js --image-audit deck.html
 *   node scripts/qa.js --visual-signoff deck.html   # 人工视觉复核签字(放行 BLOCKED 感官层)
 *
 * Visual verdict gating: real model review requires OPENAI_API_KEY + VISUAL_VERDICT_OPT_IN=1
 * (default off). Without both, visual-verdict is UNSKIPPABLE-BLOCKED — sign off manually with
 * --visual-signoff / VISUAL_VERDICT_SIGNOFF=1 only after a human visual review.
 *
 * Exit codes:
 *   0 - every required gate passed
 *   1 - one or more quality gates failed or are pending
 *   2 - usage/setup error
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SCRIPTS = __dirname;
const args = process.argv.slice(2);

function optionIndex(names) {
  return args.findIndex(arg => names.includes(arg));
}

function positionalFiles() {
  const valueFlags = new Set(['--out', '--output']);
  const result = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (valueFlags.has(arg)) {
      i++;
      continue;
    }
    if (!arg.startsWith('--')) result.push(arg);
  }
  return result;
}

const files = positionalFiles();
const noVisual = args.includes('--no-visual');
const forceVisual = args.includes('--visual');
const visualDryRun = args.includes('--visual-dry-run');
const allowVisualPending = args.includes('--allow-visual-pending');
// 感官层(visual-verdict)无法自动审时的人工签字逃生口;授权截图外发到 vision 模型。
const visualSignoff = args.includes('--visual-signoff') || process.env.VISUAL_VERDICT_SIGNOFF === '1';
const visualOptIn = process.env.VISUAL_VERDICT_OPT_IN === '1';
const forceImageAudit = args.includes('--image-audit');
const noImageAudit = args.includes('--no-image-audit');
const outArgIndex = optionIndex(['--out', '--output']);
const outRoot = outArgIndex >= 0 && args[outArgIndex + 1]
  ? path.resolve(args[outArgIndex + 1])
  : path.join(ROOT, 'qa-output');

const knownFlags = new Set([
  '--no-visual',
  '--visual',
  '--visual-dry-run',
  '--allow-visual-pending',
  '--visual-signoff',
  '--image-audit',
  '--no-image-audit',
  '--out',
  '--output',
]);
const unknownFlags = args.filter(arg => arg.startsWith('--') && !knownFlags.has(arg));

if (unknownFlags.length) {
  console.error(`Unknown flag: ${unknownFlags.join(', ')}`);
  process.exit(2);
}

if (!files.length) {
  console.error('Usage: node scripts/qa.js [--no-visual|--visual|--visual-dry-run] [--image-audit|--no-image-audit] [--out dir] <deck.html> [deck2.html]');
  process.exit(2);
}

function runNode(label, script, scriptArgs, timeout = 300_000) {
  const result = spawnSync(process.execPath, [path.join(SCRIPTS, script), ...scriptArgs], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout,
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
  });
  return {
    label,
    script,
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error || null,
  };
}

function parseQualityScore(stdout) {
  const match = stdout.match(/品质总分 qualityScore\s*:\s*(\d+)\/100/);
  return match ? Number(match[1]) : null;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function isImageDriven(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  return /<img\b|data-background-image\s*=|background(?:-image)?\s*:\s*url\(/i.test(html);
}

function visualMode() {
  if (noVisual) return 'skip';
  if (visualDryRun) return 'dry-run';
  // 真实模型评审 = 外发截图到 vision 模型。必须同时满足 OPENAI_API_KEY + 显式 opt-in
  // (VISUAL_VERDICT_OPT_IN=1,默认关防意外外发)。无 key 或未 opt-in → blocked,不再静默
  // 降级 dry-run 假通过(评估 P0 修复项 G001-③:感官缺陷只靠 visual-verdict,失能时必须
  // 强制人工签字,不能让 G1-G12 全绿的 deck 蒙混交付)。
  if (forceVisual) {
    if (!process.env.OPENAI_API_KEY) return 'blocked-no-key';
    if (!visualOptIn) return 'blocked-no-optin';
    return 'model';
  }
  if (process.env.OPENAI_API_KEY && visualOptIn) return 'model';
  return 'blocked';
}

function summarizeOutput(result) {
  return `${result.stdout}\n${result.stderr}`.trim().split('\n').slice(0, 24).map(line => `    ${line}`).join('\n');
}

let failed = false;

function record(ok, label, details = '') {
  if (ok) {
    console.log(`  ✓ ${label}`);
    return;
  }
  failed = true;
  console.error(`  ✗ ${label}`);
  if (details) console.error(details);
}

console.log('╔══════════════════════════════════════════════╗');
console.log('║  Unified PPT QA                              ║');
console.log('║  floor gates + design ceiling + visual gate  ║');
console.log('╚══════════════════════════════════════════════╝');

for (const file of files) {
  const abs = path.resolve(file);
  console.log(`\n[${path.basename(file)}]`);

  if (!fs.existsSync(abs)) {
    record(false, `file missing: ${file}`);
    continue;
  }

  const grade = runNode('grade-gate', 'grade-gate.js', [abs], 420_000);
  record(grade.status === 0 && !grade.error, 'grade-gate.js all green', summarizeOutput(grade));

  const strength = runNode('design-strength-check', 'design-strength-check.js', [abs]);
  const qualityScore = parseQualityScore(strength.stdout);
  record(
    strength.status === 0 && !strength.error && qualityScore !== null && qualityScore >= 75,
    `design-strength qualityScore ${qualityScore ?? 'unknown'} >= 75`,
    summarizeOutput(strength),
  );
  if (qualityScore < 75) {
    // Explicit branch kept for contract tests and future reviewers: this is a hard QA failure.
    failed = true;
  }

  const element = runNode('element-quality-check', 'element-quality-check.js', [abs, '--json']);
  let elementJson = null;
  try {
    elementJson = JSON.parse(element.stdout);
  } catch {
    // handled by record below
  }
  const elementPass = element.status === 0 && !element.error && elementJson && elementJson.pass === true;
  record(
    elementPass,
    `element-quality score ${elementJson?.score ?? 'unknown'} pass`,
    summarizeOutput(element),
  );

  const shouldAuditImages = forceImageAudit || (!noImageAudit && isImageDriven(abs));
  if (shouldAuditImages) {
    const audit = runNode('audit-image-assets', 'audit-image-assets.js', [abs, '--json'], 300_000);
    let auditJson = null;
    try {
      auditJson = JSON.parse(audit.stdout);
    } catch {
      // handled by record below
    }
    record(
      audit.status === 0 && !audit.error && auditJson?.passed === true,
      `audit-image-assets passed (${auditJson?.blockerCount ?? 'unknown'} blockers)`,
      summarizeOutput(audit),
    );
  } else {
    console.log('  - audit-image-assets skipped (no image-driven surface detected)');
  }

  const mode = visualMode();
  if (mode === 'skip') {
    console.log('  - visual-verdict skipped by --no-visual');
    continue;
  }

  const visualOut = path.join(outRoot, `${path.basename(file, '.html')}-visual-verdict`);
  if (mode === 'blocked' || mode === 'blocked-no-key' || mode === 'blocked-no-optin') {
    const reason = mode === 'blocked-no-key'
      ? 'OPENAI_API_KEY 未配置'
      : mode === 'blocked-no-optin'
        ? 'VISUAL_VERDICT_OPT_IN=1 未授权截图外发'
        : '无 key 或未授权外发';
    const verdictPath = path.join(visualOut, 'visual-verdict.json');
    if (visualSignoff) {
      fs.mkdirSync(visualOut, { recursive: true });
      fs.writeFileSync(verdictPath, JSON.stringify({
        passed: true, skipped: true, reason: 'human-signoff',
        blockedReason: reason, signoff: '--visual-signoff/VISUAL_VERDICT_SIGNOFF=1',
        source: abs,
      }, null, 2));
      record(true, `visual-verdict BLOCKED → 人工签字放行 (${reason}; artifact: ${verdictPath})`);
    } else {
      record(false, `visual-verdict UNSKIPPABLE-BLOCKED: ${reason}; 感官层无法自动审,需人工视觉复核签字 (--visual-signoff 或 VISUAL_VERDICT_SIGNOFF=1)`);
    }
    continue;
  }

  const visualArgs = [abs, '--out', visualOut];
  if (mode === 'dry-run') visualArgs.push('--dry-run');
  const visual = runNode(`visual-verdict ${mode}`, 'visual-verdict.js', visualArgs, 420_000);
  const verdictPath = path.join(visualOut, 'visual-verdict.json');
  let verdict = null;
  try {
    verdict = fs.existsSync(verdictPath) ? readJson(verdictPath) : null;
  } catch {
    // handled by record below
  }

  if (mode === 'dry-run' && verdict?.passed !== true) {
    record(
      allowVisualPending,
      allowVisualPending
        ? `visual-verdict dry-run artifact recorded (${verdictPath})`
        : 'visual-verdict pending: dry-run is not a model pass',
      summarizeOutput(visual),
    );
  } else {
    record(
      visual.status === 0 && !visual.error && verdict?.passed === true,
      `visual-verdict model pass (${verdictPath})`,
      summarizeOutput(visual),
    );
  }
}

if (failed) {
  console.error('\nUnified QA: FAIL');
  process.exit(1);
}

console.log('\nUnified QA: PASS');
