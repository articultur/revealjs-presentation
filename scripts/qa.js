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
 *   node scripts/qa.js --seed examples/template-01-editorial-serif.html deck.html   # 路径 A scaffold 改写后验收(换皮门禁,只比指定种子)
 *   node scripts/qa.js --no-skeleton-gate deck.html            # 显式豁免换皮门禁(仅种子自身维护时用)
 *
 * 默认硬门禁(无需任何 flag):
 *   - 换皮门禁:未传 --seed 时自动对 examples/ 全部种子做 skeleton-diff,最大相似度 >70% = 硬失败;
 *     被检文件即 examples/ 种子自身时跳过(防自我命中);检测到 generate-deck seed-scaffold
 *     requiresRewrite 标记 = 未重写 scaffold 直接交付,硬失败。
 *   - design-brief 契约:check-design-brief.js 校验内嵌 <script id="design-brief"> 必填字段
 *     (aestheticAnchor/externalRefs/signatureMoment/extremeContrast/bannedPatterns
 *     + 叙事弧线三字段 narrativeArc/pacingCurve/bannedBeats),缺失 = 硬失败;
 *     examples/ 种子模板(历史产物)豁免。
 *   - 弧线落实:check-arc-adherence.js 验证 brief 声明的弧线真的落实——narrativeArc
 *     库内弧线须在 narrative-arcs.md 注册表、自定义弧线须 arcDefinition 四件套;
 *     bannedBeats 已知节拍签名扫描(anchor-numeral/face-off/kpi-wall/table 系/data-chart),
 *     命中 = 硬失败;examples/ 种子模板同样豁免。
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
const { THRESHOLD: SKELETON_THRESHOLD, diffFiles: skeletonDiffFiles } = require('./skeleton-diff.js'); // 换皮判定门槛(相似度 >70%)+ 直接比对函数(默认全种子模式用)
const { validateVisualSignoff } = require('./run-manifest.js'); // 持久签字校验(reviewer/时间/截图哈希/decision)
const { verifyDeck } = require('./verify-artifacts.js'); // 产物落地兜底(防"已交付"与磁盘事实背离)

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
// --seed:路径 A scaffold 改写后的验收——提供时只对指定种子跑 skeleton-diff 换皮门禁
// (骨架与种子结构相似度 >70% = 硬失败);不提供时默认对 examples/ 全部种子比对取最大值。
const seedArgIndex = optionIndex(['--seed']);
const seedArg = seedArgIndex >= 0 ? args[seedArgIndex + 1] : null;
// --no-skeleton-gate:显式豁免换皮门禁(仅 examples/ 种子自身维护等场景;常规交付不应使用)
const noSkeletonGate = args.includes('--no-skeleton-gate');
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
  '--no-skeleton-gate',
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
  console.error('Usage: node scripts/qa.js [--no-visual|--visual|--visual-dry-run] [--image-audit|--no-image-audit] [--seed seed.html|--no-skeleton-gate] [--visual-signoff-file signoff.json] [--out dir] <deck.html> [deck2.html]');
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

// examples/ 种子清单与「被检文件即种子自身」判定(换皮门禁防自我命中 + design-brief 历史豁免)
const EXAMPLES_DIR = path.join(ROOT, 'examples');
function seedFileList() {
  return fs.readdirSync(EXAMPLES_DIR).filter(f => f.endsWith('.html')).map(f => path.join(EXAMPLES_DIR, f));
}
function isSeedFile(absPath) {
  return seedFileList().includes(absPath);
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

// detectSelfReviewReviewer — 堵 self-review 漏洞:生产 signoff 的 reviewer 不得是 AI/自动化自审标记。
// 操作者写 "agent visual self-review" 即可伪造放行,故强校验:命中禁用词 → 返回诊断字符串(调用方并入 errs → exit 1)。
// 合法值是人工名("张三"/"Jane Doe")或显式独立第三方("independent:reviewer-name"/"third-party:org")。
function detectSelfReviewReviewer(reviewer) {
  const value = String(reviewer || '').toLowerCase();
  // 英文禁用词(词边界匹配,避免误伤含 ai/bot/auto 子串的真实人名)
  const enBanned = ['agent', 'self', 'auto', 'automated', 'autopilot', 'ai', 'bot', 'llm', 'gpt', 'claude', 'copilot', 'machine', 'script'];
  for (const w of enBanned) {
    if (new RegExp(`\\b${w}\\b`).test(value)) {
      return `signoff reviewer 含 self-review 标记 "${w}",不得作为独立视觉评审放行 (必须是人工名如 "张三"/"Jane Doe" 或显式独立第三方如 "independent:reviewer-name"/"third-party:org")`;
    }
  }
  // 中文禁用词(子串匹配)
  const zhBanned = ['机器', '自动', '代理', '自审', '机审', '模型', '智能体'];
  for (const w of zhBanned) {
    if (value.includes(w)) {
      return `signoff reviewer 含 self-review 标记 "${w}",不得作为独立视觉评审放行 (必须是人工名如 "张三"/"Jane Doe" 或显式独立第三方如 "independent:reviewer-name"/"third-party:org")`;
    }
  }
  return null;
}

// writeQaSummary — derive a per-deck state and persist the structured summary so readiness is
// auditable. State mirrors run.json: any floor/ceiling gate failure → blocked; visual signed by a
// human or passed by the model → ready; otherwise (visual pending/blocked/skipped) the deck still
// needs visual signoff and is not delivery-ready.
function writeQaSummary(file) {
  if (!summary) return;
  const floorKeys = ['grade', 'designStrength', 'elementQuality', 'editorialContamination', 'imageAudit', 'skeleton', 'designBrief', 'arcAdherence'];
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
      skeleton: null,
      designBrief: null,
      arcAdherence: null,
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

  // design-brief 契约(设计感 B 解法的机器抓手):单文件 HTML 内嵌
  // <script type="application/json" id="design-brief">,必填 aestheticAnchor /
  // externalRefs(≥1,含 url+visualNote)/ signatureMoment / extremeContrast /
  // bannedPatterns(≥1) + 叙事弧线三字段 narrativeArc / pacingCurve / bannedBeats(≥1)。
  // 缺 script 或字段不达标 = 硬失败,与 grade-gate 红灯同级。
  // examples/ 种子模板是历史产物,验收其自身时豁免。
  if (isSeedFile(abs)) {
    summary.gates.designBrief = 'skipped';
    console.log('  - design-brief skipped (examples/ 种子模板自身,历史产物豁免)');
  } else {
    const brief = runNode('design-brief', 'check-design-brief.js', [abs, '--json']);
    let briefJson = null;
    try {
      briefJson = JSON.parse(brief.stdout);
    } catch {
      // handled by record below
    }
    const briefPass = brief.status === 0 && !brief.error && briefJson && briefJson.pass === true;
    record(
      briefPass,
      briefPass
        ? 'design-brief 契约齐全(aestheticAnchor/externalRefs/signatureMoment/extremeContrast/bannedPatterns/narrativeArc/pacingCurve/bannedBeats)'
        : `design-brief 契约不达标${briefJson?.missing?.length ? ':缺 ' + briefJson.missing.join('; ') : ''}`,
      summarizeOutput(brief),
      'designBrief',
    );
  }

  // 弧线落实(叙事弧线的机器验证,与 design-brief 同策略:examples/ 种子模板豁免):
  // check-arc-adherence.js 从 brief 读叙事声明——narrativeArc 库内弧线须在
  // references/narrative-arcs.md 注册表(自定义弧线须 arcDefinition 四件套:
  // realWorldRef/pacingGrammar/rationale);bannedBeats 已知节拍签名扫描
  // (anchor-numeral/face-off/kpi-wall/data-table/ledger-table/neutral-data-table/
  // data-chart),命中被禁节拍 = 硬失败并指出页码/选择器;未知节拍 key 与
  // pacingCurve 拍数偏差只 warning 不 FAIL。
  if (isSeedFile(abs)) {
    summary.gates.arcAdherence = 'skipped';
    console.log('  - arc-adherence skipped (examples/ 种子模板自身,历史产物豁免)');
  } else {
    const arc = runNode('arc-adherence', 'check-arc-adherence.js', [abs, '--json']);
    let arcJson = null;
    try {
      arcJson = JSON.parse(arc.stdout);
    } catch {
      // handled by record below
    }
    const arcPass = arc.status === 0 && !arc.error && arcJson && arcJson.pass === true;
    record(
      arcPass,
      arcPass
        ? `弧线落实达标(${arcJson.arcType === 'custom' ? '自定义弧线 + arcDefinition 四件套' : `库内弧线 ${arcJson.arcId}`};bannedBeats 机器缺席扫描无命中${arcJson.warnings?.length ? `;${arcJson.warnings.length} 条 warning` : ''})`
        : `弧线落实不达标${arcJson?.failures?.length ? ':' + arcJson.failures.join('; ') : ''}`,
      summarizeOutput(arc),
      'arcAdherence',
    );
  }

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
          // 防 self-review 漏洞:reviewer 不得是 AI/自动化自审标记,必须是人工或显式独立第三方。
          const selfReviewErr = detectSelfReviewReviewer(signoff.reviewer);
          if (selfReviewErr) errs.push(selfReviewErr);
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

  // 换皮门禁(失败门禁 #9,硬失败,与 grade-gate 红灯同级):
  //   - generate-deck 种子 scaffold 产物带 requiresRewrite 标记:未重写直接交付,直接硬失败;
  //   - 提供 --seed 时:只对指定种子跑 skeleton-diff(路径 A scaffold 改写后验收,原语义);
  //   - 未提供 --seed 时(默认):自动对 examples/ 全部种子比对,取最大相似度,>70% = 硬失败;
  //   - 被检文件即 examples/ 种子自身时跳过(防自我命中);--no-skeleton-gate 显式豁免(种子维护用)。
  const deckHtml = fs.readFileSync(abs, 'utf8');
  if (/<!--\s*generate-deck seed-scaffold:\s*requiresRewrite=true/.test(deckHtml)) {
    record(
      false,
      '检测到 generate-deck seed-scaffold requiresRewrite 标记:这是未重写的种子 scaffold 产物(.scaffold.html),不是交付物——需重写 cover/proof/mechanism/close 中 ≥2 个 role 骨架并以正式文件名重新生成后再验收',
      '',
      'skeleton',
    );
  } else if (noSkeletonGate) {
    summary.gates.skeleton = 'skipped';
    console.log('  - skeleton-diff skipped by --no-skeleton-gate(显式豁免,仅种子自身维护场景)');
  } else if (isSeedFile(abs)) {
    summary.gates.skeleton = 'skipped';
    console.log('  - skeleton-diff skipped (被检文件即 examples/ 种子自身,防自我命中)');
  } else if (seedArg) {
    const diff = runNode('skeleton-diff', 'skeleton-diff.js', [abs, '--seed', seedArg, '--gate']);
    const similarity = parseSkeletonSimilarity(diff.stdout);
    record(
      diff.status === 0 && !diff.error,
      `skeleton-diff vs 种子骨架相似度 ${similarity ?? 'unknown'}% <= ${SKELETON_THRESHOLD}%`,
      summarizeOutput(diff),
      'skeleton',
    );
  } else {
    // 默认全种子比对:进程内直接调 diffFiles,取最大相似度(防稀释口径见 skeleton-diff.js)
    let maxSim = -1;
    let maxSeed = '';
    for (const seedPath of seedFileList()) {
      const r = skeletonDiffFiles(abs, seedPath);
      if (r.similarity > maxSim) { maxSim = r.similarity; maxSeed = path.basename(seedPath); }
    }
    record(
      maxSim <= SKELETON_THRESHOLD,
      `skeleton-diff vs 全部种子最大骨架相似度 ${maxSim}% <= ${SKELETON_THRESHOLD}%(最高 @ ${maxSeed})`,
      '',
      'skeleton',
    );
  }

  writeQaSummary(file);
}

// ── 产物落地兜底(verify-artifacts.js 复用,不 spawn 子进程)────────────────────
// qa.js 全绿只代表 gate 通过,不保证磁盘上真有可交付物。真实事故:上一轮 6 个 deck
// 报告"已交付"后从磁盘消失(文件飘空)。这里在 exit 0 前对每个被验收 deck 复核:
//   ① 文件存在且 >1KB(防"qa 跑完文件被外部进程删");② design-brief 内嵌成功;
//   ③ qa-summary 写盘成功且 passed === true(防"qa-summary 写失败")。
// 注意:qa.js 跑自身时 deck 文件必然存在(它刚校验过),本兜底主要防隐性飘空——
// qa-summary 写失败、design-brief 内嵌失败、文件被外部进程删等。
// examples/ 种子历史产物已豁免 design-brief 门禁,此处同步 skipDesignBrief。
// 任一 deck 落地复核失败 → 降为 blocked,failed=true,在退出前打印明确诊断
// ("qa 通过但产物飘空"),由下方既有 `if (failed)` 降级为 exit 1。
if (!failed) {
  for (const file of files) {
    const abs = path.resolve(file);
    const isSeed = isSeedFile(abs);
    const va = verifyDeck(abs, { outRoot, skipDesignBrief: isSeed, allowNotReady: true });
    if (!va.pass) {
      failed = true;
      console.error(`\n  ⚠ 产物落地兜底失败 [qa 通过但产物飘空] — ${file}`);
      for (const [check, res] of Object.entries(va.checks)) {
        if (!res.ok) console.error(`    ✗ ${check}: ${res.detail}`);
      }
    }
  }
}

if (failed) {
  console.error('\nUnified QA: FAIL');
  process.exit(1);
}

console.log('\nUnified QA: PASS');
