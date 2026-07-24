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
 *   node scripts/qa.js --visual-signoff-file signoff.json deck.html   # 生产:持久人工视觉签字(放行 BLOCKED 感官层)
 *   node scripts/qa.js --visual-signoff deck.html                    # 测试专用(NODE_ENV=test)布尔签字逃生口
 *   node scripts/qa.js --seed examples/template-01-editorial-serif.html deck.html   # 路径 A scaffold 改写后验收(换皮门禁)
 *
 * Visual verdict gating: real model review requires OPENAI_API_KEY + VISUAL_VERDICT_OPT_IN=1
 * (default off). Without both, visual-verdict is UNSKIPPABLE-BLOCKED — sign off with a durable
 * --visual-signoff-file (production) or, under NODE_ENV=test, --visual-signoff / VISUAL_VERDICT_SIGNOFF=1.
 *
 * Each deck also writes a structured <deck>-qa-summary.json into --out (version/deck/passed/state/
 * qualityScore/gates/artifacts) so readiness is auditable rather than just a console exit code.
 *
 * Exit codes:
 *   0 - every required gate passed
 *   1 - one or more quality gates failed or are pending
 *   2 - usage/setup error
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { THRESHOLD: SKELETON_THRESHOLD } = require('./skeleton-diff.js'); // 换皮判定门槛(相似度 >70%)
const { validateVisualSignoff } = require('./run-manifest.js'); // 持久签字校验(reviewer/时间/截图哈希/decision)

const ROOT = path.resolve(__dirname, '..');
const SCRIPTS = __dirname;
const args = process.argv.slice(2);

function optionIndex(names) {
  return args.findIndex(arg => names.includes(arg));
}

function positionalFiles() {
  const valueFlags = new Set(['--out', '--output', '--seed', '--topic', '--visual-signoff-file']);
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
// 生产环境必须用 --visual-signoff-file <签字文件>(reviewer/reviewedAt/screenshotsManifestSha256/
// decision,可审计持久证据);--visual-signoff / VISUAL_VERDICT_SIGNOFF=1 仅 NODE_ENV=test 可用。
const isTestEnv = process.env.NODE_ENV === 'test';
const visualSignoffFlag = args.includes('--visual-signoff');
const visualSignoff = visualSignoffFlag || (process.env.VISUAL_VERDICT_SIGNOFF === '1' && isTestEnv);
const visualOptIn = process.env.VISUAL_VERDICT_OPT_IN === '1';
const forceImageAudit = args.includes('--image-audit');
const noImageAudit = args.includes('--no-image-audit');
// editorial-contamination(反 template-01 收敛 / Goodhart 补丁)
//   --topic <t>          传主题(不传则读 <title> 兜底);非 editorial 主题穿档案馆外衣 = fail
//   --editorial-topic    强制声明 topic 为 editorial 原生(历程/历史/档案…),豁免
//   --no-editorial-check 跳过本检查
const topicArgIndex = optionIndex(['--topic']);
const topicNext = topicArgIndex >= 0 ? args[topicArgIndex + 1] : undefined;
if (topicArgIndex >= 0 && (!topicNext || topicNext.startsWith('--'))) {
  console.error('qa.js: --topic 需要一个值(不能是 flag 或空;若主题字面含 -- 请确认它在值位置)');
  process.exit(2);
}
const topicArg = topicNext || '';
const editorialTopicFlag = args.includes('--editorial-topic');
const noEditorialCheck = args.includes('--no-editorial-check');
const outArgIndex = optionIndex(['--out', '--output']);
const outRoot = outArgIndex >= 0 && args[outArgIndex + 1]
  ? path.resolve(args[outArgIndex + 1])
  : path.join(ROOT, 'qa-output');
// --seed:路径 A scaffold 改写后的验收——提供时在视觉层之后加跑 skeleton-diff 换皮门禁
// (骨架与种子结构相似度 >70% = 硬失败);不提供时行为完全不变。
const seedArgIndex = optionIndex(['--seed']);
const seedArg = seedArgIndex >= 0 ? args[seedArgIndex + 1] : null;
// --visual-signoff-file:生产级人工视觉签字(JSON:reviewer/reviewedAt/screenshotsManifestSha256/
// decision)。校验通过后复制进 --out,并把可审计路径写进 qa-summary。这是感官层 BLOCKED 时唯一
// 的生产放行方式。
const visualSignoffFileIndex = optionIndex(['--visual-signoff-file']);
const visualSignoffFile = visualSignoffFileIndex >= 0 ? args[visualSignoffFileIndex + 1] : null;

const knownFlags = new Set([
  '--no-visual',
  '--visual',
  '--visual-dry-run',
  '--allow-visual-pending',
  '--visual-signoff',
  '--visual-signoff-file',
  '--image-audit',
  '--no-image-audit',
  '--out',
  '--output',
  '--seed',
  '--topic',
  '--editorial-topic',
  '--no-editorial-check',
]);
const unknownFlags = args.filter(arg => arg.startsWith('--') && !knownFlags.has(arg));

if (unknownFlags.length) {
  console.error(`Unknown flag: ${unknownFlags.join(', ')}`);
  process.exit(2);
}

if (seedArgIndex >= 0 && (!seedArg || seedArg.startsWith('--'))) {
  console.error('Usage: --seed 需要种子文件路径或种子名(如 examples/template-01-editorial-serif.html)');
  process.exit(2);
}

if (visualSignoffFileIndex >= 0 && (!visualSignoffFile || visualSignoffFile.startsWith('--'))) {
  console.error('qa.js: --visual-signoff-file 需要一个签字文件路径(JSON: reviewer/reviewedAt/screenshotsManifestSha256/decision)');
  process.exit(2);
}

// 生产守卫:布尔 --visual-signoff 与 VISUAL_VERDICT_SIGNOFF=1 不构成可审计证据,仅 NODE_ENV=test 可用。
if (visualSignoffFlag && !isTestEnv && !visualSignoffFile) {
  console.error('qa.js: --visual-signoff(布尔)是 NODE_ENV=test 专用逃生口;生产环境视觉放行必须用 --visual-signoff-file <签字文件>');
  process.exit(2);
}
if (process.env.VISUAL_VERDICT_SIGNOFF === '1' && !isTestEnv) {
  console.error('qa.js: VISUAL_VERDICT_SIGNOFF=1 受限于 NODE_ENV=test;生产环境必须用 --visual-signoff-file <签字文件>');
  process.exit(2);
}

if (!files.length) {
  console.error('Usage: node scripts/qa.js [--no-visual|--visual|--visual-dry-run] [--image-audit|--no-image-audit] [--seed seed.html] [--visual-signoff-file signoff.json] [--out dir] <deck.html> [deck2.html]');
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

function parseSkeletonSimilarity(stdout) {
  const match = stdout.match(/总相似度:\s*(\d+)%/);
  return match ? Number(match[1]) : null;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readTitle(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1].trim() : '';
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
  // 强制人工签字,不能让 G1-G14 全绿的 deck 蒙混交付)。
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
// Per-deck accumulators (reset each iteration): fileFailed drives this deck's qa-summary state,
// summary.gates records each gate's status for the structured <deck>-qa-summary.json artifact.
let fileFailed = false;
let summary = null;

function record(ok, label, details = '', gateKey = null) {
  if (gateKey && summary) summary.gates[gateKey] = ok ? 'pass' : 'fail';
  if (ok) {
    console.log(`  ✓ ${label}`);
    return;
  }
  failed = true;
  fileFailed = true;
  console.error(`  ✗ ${label}`);
  if (details) console.error(details);
}

// writeQaSummary — derive a per-deck state and persist the structured summary so readiness is
// auditable. State mirrors run.json: any floor/ceiling gate failure → blocked; visual signed by a
// human or passed by the model → ready; otherwise (visual pending/blocked/skipped) the deck still
// needs visual signoff and is not delivery-ready.
function writeQaSummary(file) {
  if (!summary) return;
  const floorKeys = ['grade', 'designStrength', 'elementQuality', 'editorialContamination', 'imageAudit'];
  const floorFailed = summary.fileMissing === true || floorKeys.some((k) => summary.gates[k] === 'fail');
  const visualReady = summary.gates.visual === 'human-signoff' || summary.gates.visual === 'model';
  summary.state = floorFailed ? 'blocked' : (visualReady ? 'ready' : 'needs-visual-signoff');
  summary.passed = summary.state === 'ready';
  try {
    fs.mkdirSync(outRoot, { recursive: true });
    const summaryPath = path.join(outRoot, `${path.basename(file, '.html')}-qa-summary.json`);
    fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
    console.log(`  qa-summary → ${summaryPath} (state=${summary.state}, passed=${summary.passed})`);
  } catch (e) {
    console.error(`  ⚠ qa-summary 写入失败: ${e.message}`);
  }
}

console.log('╔══════════════════════════════════════════════╗');
console.log('║  Unified PPT QA                              ║');
console.log('║  floor gates + design ceiling + visual gate  ║');
console.log('╚══════════════════════════════════════════════╝');

for (const file of files) {
  const abs = path.resolve(file);
  console.log(`\n[${path.basename(file)}]`);

  // Reset per-deck accumulators.
  fileFailed = false;
  summary = {
    version: 1,
    deck: file,
    passed: null,
    state: null,
    qualityScore: null,
    gates: {
      grade: null,
      designStrength: null,
      elementQuality: null,
      editorialContamination: null,
      imageAudit: null,
      visual: null,
    },
    artifacts: {},
  };

  if (!fs.existsSync(abs)) {
    summary.fileMissing = true;
    record(false, `file missing: ${file}`);
    writeQaSummary(file);
    continue;
  }

  const grade = runNode('grade-gate', 'grade-gate.js', [abs], 420_000);
  record(grade.status === 0 && !grade.error, 'grade-gate.js all green', summarizeOutput(grade), 'grade');

  const strength = runNode('design-strength-check', 'design-strength-check.js', [abs]);
  const qualityScore = parseQualityScore(strength.stdout);
  summary.qualityScore = qualityScore ?? null;
  record(
    strength.status === 0 && !strength.error && qualityScore !== null && qualityScore >= 75,
    `design-strength qualityScore ${qualityScore ?? 'unknown'} >= 75`,
    summarizeOutput(strength),
    'designStrength',
  );
  if (qualityScore < 75) {
    // Explicit branch kept for contract tests and future reviewers: this is a hard QA failure.
    failed = true;
    fileFailed = true;
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
    'elementQuality',
  );

  // editorial-contamination(反 template-01 收敛 / Goodhart 补丁):非 editorial 主题穿档案馆
  // 外衣(archive 构件 / editorial 骨架三件套 / serif 展示字)= 设计非从主题生长,颜色与主题
  // 是贴上去的而非长出来的。与 grade-gate 红灯同级(失败门禁 #9 的审美语言维度补丁)。
  if (!noEditorialCheck) {
    const topic = topicArg || readTitle(abs);
    const ecArgs = [abs, '--topic', topic || '(none)', '--gate'];
    if (editorialTopicFlag) ecArgs.push('--editorial-topic');
    const ec = runNode('editorial-contamination', 'check-editorial-contamination.js', ecArgs);
    record(
      ec.status === 0 && !ec.error,
      `editorial-contamination topic「${topic || '(无 title — 传 --topic)'}」未穿 editorial 皮`,
      summarizeOutput(ec),
      'editorialContamination',
    );
  } else {
    summary.gates.editorialContamination = 'skipped';
  }

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
      'imageAudit',
    );
  } else {
    summary.gates.imageAudit = 'skipped';
    console.log('  - audit-image-assets skipped (no image-driven surface detected)');
  }

  const mode = visualMode();
  if (mode === 'skip') {
    summary.gates.visual = 'skipped';
    console.log('  - visual-verdict skipped by --no-visual');
  } else {
    const visualOut = path.join(outRoot, `${path.basename(file, '.html')}-visual-verdict`);
    if (mode === 'blocked' || mode === 'blocked-no-key' || mode === 'blocked-no-optin') {
      const reason = mode === 'blocked-no-key'
        ? 'OPENAI_API_KEY 未配置'
        : mode === 'blocked-no-optin'
          ? 'VISUAL_VERDICT_OPT_IN=1 未授权截图外发'
          : '无 key 或未授权外发';
      const verdictPath = path.join(visualOut, 'visual-verdict.json');
      if (visualSignoffFile) {
        // 生产持久签字:校验签字文件 + 核验截图清单哈希 + 复制进 --out,写可审计路径到 qa-summary。
        let signoff = null;
        let parseErr = null;
        if (!fs.existsSync(visualSignoffFile)) {
          parseErr = `签字文件不存在: ${visualSignoffFile}`;
        } else {
          try {
            signoff = JSON.parse(fs.readFileSync(visualSignoffFile, 'utf8'));
          } catch (e) {
            parseErr = `签字文件 JSON 解析失败: ${e.message}`;
          }
        }
        if (parseErr) {
          summary.gates.visual = 'blocked';
          record(false, `visual-signoff-file 无效: ${parseErr}`);
        } else {
          const manifestSibling = path.join(path.dirname(path.resolve(visualSignoffFile)), 'screenshots-manifest.json');
          const errs = validateVisualSignoff(signoff, { manifestFile: manifestSibling });
          if (errs.length) {
            summary.gates.visual = 'blocked';
            record(false, `visual-signoff-file 校验失败: ${errs.join('; ')}`);
          } else {
            fs.mkdirSync(visualOut, { recursive: true });
            const copiedSignoff = path.join(visualOut, 'visual-signoff.json');
            fs.writeFileSync(copiedSignoff, `${JSON.stringify({ ...signoff, sourceDeck: abs, copiedAt: new Date().toISOString() }, null, 2)}\n`);
            fs.writeFileSync(verdictPath, JSON.stringify({
              passed: true, skipped: true, reason: 'human-signoff-file',
              signoff: copiedSignoff, blockedReason: reason, source: abs,
            }, null, 2));
            summary.gates.visual = 'human-signoff';
            summary.artifacts.visualSignoff = copiedSignoff;
            summary.artifacts.visualVerdict = verdictPath;
            record(true, `visual-verdict BLOCKED → 签字文件放行 (reviewer=${signoff.reviewer}; ${copiedSignoff})`);
          }
        }
      } else if (visualSignoff) {
        // 测试逃生口(NODE_ENV=test):记 stub,非生产级证据 —— 仅用于在测试环境放行感官层。
        fs.mkdirSync(visualOut, { recursive: true });
        fs.writeFileSync(verdictPath, JSON.stringify({
          passed: true, skipped: true, reason: 'human-signoff',
          blockedReason: reason, signoff: '--visual-signoff/VISUAL_VERDICT_SIGNOFF=1 (test-only)', source: abs,
        }, null, 2));
        summary.gates.visual = 'human-signoff';
        summary.artifacts.visualVerdict = verdictPath;
        record(true, `visual-verdict BLOCKED → 测试签字放行 (${reason}; artifact: ${verdictPath})`);
      } else {
        summary.gates.visual = 'blocked';
        record(false, `visual-verdict UNSKIPPABLE-BLOCKED: ${reason}; 感官层无法自动审,需人工视觉复核签字 (--visual-signoff-file <签字文件>; 测试可用 --visual-signoff / VISUAL_VERDICT_SIGNOFF=1)`);
      }
    } else {
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
        summary.gates.visual = 'pending';
        record(
          allowVisualPending,
          allowVisualPending
            ? `visual-verdict dry-run artifact recorded (${verdictPath})`
            : 'visual-verdict pending: dry-run is not a model pass',
          summarizeOutput(visual),
        );
      } else {
        const visualPass = visual.status === 0 && !visual.error && verdict?.passed === true;
        summary.gates.visual = visualPass ? 'model' : 'blocked';
        if (visualPass) summary.artifacts.visualVerdict = verdictPath;
        record(
          visualPass,
          `visual-verdict model pass (${verdictPath})`,
          summarizeOutput(visual),
        );
      }
    }
  }

  // 换皮门禁(仅提供 --seed 时加跑):路径 A scaffold 改写验收——骨架与种子结构相似度
  // >70% = 换皮嫌疑(失败门禁 #9),硬失败,与 grade-gate 红灯同级。
  if (seedArg) {
    const diff = runNode('skeleton-diff', 'skeleton-diff.js', [abs, '--seed', seedArg, '--gate']);
    const similarity = parseSkeletonSimilarity(diff.stdout);
    record(
      diff.status === 0 && !diff.error,
      `skeleton-diff vs 种子骨架相似度 ${similarity ?? 'unknown'}% <= ${SKELETON_THRESHOLD}%`,
      summarizeOutput(diff),
    );
  }

  writeQaSummary(file);
}

if (failed) {
  console.error('\nUnified QA: FAIL');
  process.exit(1);
}

console.log('\nUnified QA: PASS');
