#!/usr/bin/env node
'use strict';
/* eslint-disable */

/**
 * generate-deck.js — 任意主题/风格 → 验证过的 deck(统一入口)
 * ====================================================================
 * 把散落的路由 + 生成 + 门禁接成一条命令:
 *   主题/风格 → voice-router 选 voice → content-router 选 archetype 序列
 *   → generate-archetype-deck 生成 HTML → --gates 时跑 qa.js 全量门禁(仅豁免视觉层,失败 exit 1)
 *
 * 核心增量(相对 generate-archetype-deck):
 *   - voice 缺省或 'auto' 时,voice-router 从主题/风格词自动推断(不再靠人工指定)
 *   - 生成后可选串联门禁(--gates)
 *
 * 用法:
 *   node scripts/generate-deck.js --demo [--gates]            内置「社区慢行交通」demo(voice 自动推断,走 assembleDeck)
 *   node scripts/generate-deck.js --input deck.json [--out f] [--gates]
 *   node scripts/generate-deck.js --input deck.json --voice minimal   指定 voice
 *
 * input.json schema(同 generate-archetype-deck):
 *   { topic, voice?: 'auto' | <name>, styleKeywords?: [], sections: [...], off_template?, style_gap? }
 * voice 省略或 'auto' → voice-router 推断。
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const { routeVoice } = require('./voice-router');
const { routeDeck } = require('./content-router');
const { assembleDeck, routeReportLines } = require('./generate-archetype-deck');
const { loadDeckManifest, manifestToGeneratorInput } = require('./deck-manifest');

const ROOT = path.resolve(__dirname, '..');

// ── 内置 demo:社区慢行交通年度报告 ──
// 种子未覆盖的主题(旧 demo 含「临床试验」被 seed 短路成 template-10 字节级复制,
// 走不到 assembleDeck;SEED_PRIORITY 已扩到「城市」,故用「社区」避开 seed 命中);
// 故意用自由文本段落,演示内容填充层:文本→字段抽取(A5 锚点/A3 编年/A10 引言)
// + 无法分类段落按 A4 消费 body(不再整 deck throw)。
const DEMO = {
  topic: '社区慢行交通年度报告',
  voice: 'auto',
  sections: [
    { title: '社区慢行交通年度报告', body: '步行与骑行友好社区的年度体检:出行分担率、路网密度、安全与居民满意度。' },
    { title: '出行分担率', body: '全市慢行出行分担率提升至 38%,中心城区慢行路网密度达 8.2 公里/平方公里' },
    { title: '建设时间线', body: '2023 年启动示范段建设,2024 年完成关键骨干网络,2025 年全域贯通,2026 年评估提升' },
    { title: '市民评价', body: '受访市民表示:“现在骑车通勤比开车还快,沿途还能看河景。”' },
    { title: '问题与对策', body: '老城区断面不足、路权被侵占;对策是压缩机动车道、增设停放区、完善地铁接驳' },
    { title: '下一步', body: '下一步:2027 年启动二期建设,重点覆盖外围组团,谢谢' },
  ],
  // 设计契约(人写,生成器 pass-through 内嵌):年度报告 = 账目式审视,禁默认数据套路
  designBrief: {
    aestheticAnchor: '城市体检报告的克制秩序:版式让位于读数,年度审视而非成果炫耀',
    externalRefs: [{ url: 'https://www.pentagram.com/work', visualNote: '编辑化数据版式:大留白 + 单一强调色的克制' }],
    signatureMoment: '分担率 38% 作为年度账目的关键一笔,置于整页视觉中心',
    extremeContrast: '尺度 6:1,关键读数满版 vs 说明文字小字号密集排布',
    bannedPatterns: ['side-stripe', 'gradient text'],
    narrativeArc: 'N1 账本审计(见 references/narrative-arcs.md)',
    pacingCurve: '疏-密-密-疏-密-收',
    bannedBeats: ['anchor-numeral', 'kpi-wall'],
  },
};

// ── 种子 scaffold 重写契约(失败门禁 #9)──
// 种子 HTML 只是 scaffold 不是成品:cover/proof/mechanism/close 四个 role 中
// 至少重写 2 个的骨架(结构/版式级),只换文字/配色 = 违反失败门禁 #9。
const SEED_REWRITE_CONTRACT = {
  requiresRewrite: true,
  roles: ['cover', 'proof', 'mechanism', 'close'],
  minRewrite: 2,
  note: 'cover/proof/mechanism/close 四个 role 中至少重写 2 个骨架(结构/版式级重写,保留种子签名原语);只换文字/配色 = 违反失败门禁 #9',
};

const USAGE = `用法:
  node scripts/generate-deck.js --demo [--gates]
  node scripts/generate-deck.js --input deck.json [--out out.html] [--gates] [--voice <name>]
  voice 省略或 'auto' → voice-router 从 topic 推断风格。--gates 生成后跑 grade-gate + design-strength-check。`;

/** voice 缺省或 'auto' → voice-router 推断;否则沿用。返回 voice 路由信息(null=用户指定) */
function resolveVoice(input) {
  if (input.voice && input.voice !== 'auto') return null;
  const info = routeVoice(input.topic || '', { styleKeywords: input.styleKeywords || [] });
  if (info.preferSeed) {
    input.preferSeed = info.preferSeed;
    return info; // 种子 scaffold 模式,不 resolve voice
  }
  input.voice = info.voice;
  // 推断 voice 后,若 input 带 style_gap,同步 token 以通过 off-template 契约
  if (input.style_gap) input.style_gap.token = info.voice;
  return info;
}

/**
 * 端到端生成。input.voice 会被原地解析为真实 voice。
 * @returns {{html, voice, voiceInfo, routed}}
 */
function generate(input) {
  const voiceInfo = resolveVoice(input);
  if (input.preferSeed) {
    // 种子优先(方向 1):复制精致种子 HTML 作 scaffold — Claude 后续改写内容、保留签名原语(6 维)。
    // 种子经长期打磨(签名/多色/组件/字体/材质/词表),比新 voice primitive 平淡组合精致。
    const seedPath = path.join(ROOT, 'examples', input.preferSeed + '.html');
    if (!fs.existsSync(seedPath)) {
      throw new Error('Seed template not found: ' + input.preferSeed + ' (looked at ' + seedPath + ')');
    }
    const html = fs.readFileSync(seedPath, 'utf8');
    return {
      html,
      preferSeed: input.preferSeed,
      voiceInfo,
      seedScaffold: true,
      requiresRewrite: true,
      rewriteChecklist: SEED_REWRITE_CONTRACT,
    };
  }
  const routed = routeDeck(input);
  const html = assembleDeck(input, routed);
  return { html, voice: input.voice, voiceInfo, routed };
}

function runGatesOn(file, topic) {
  // 全量门禁(qa.js --no-visual):grade-gate + design-strength + element-quality + design-brief +
  // arc-adherence + editorial-contamination + skeleton 一次跑完,不再只做"两道地板"的半验收。
  // 唯一豁免的是视觉层(需 vision key 或人工签字)——因此 --gates 全绿 ≠ 可交付,只是"除视觉外全绿"。
  // topic 传给 editorial-contamination(不传则 qa.js 读 <title> 兜底,标题措辞偏 editorial 会误判)。
  const os = require('os');
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'generate-deck-gates-'));
  const qaArgs = [path.join(ROOT, 'scripts', 'qa.js'), '--no-visual', '--out', outDir];
  if (topic) qaArgs.push('--topic', topic);
  qaArgs.push(file);
  const r = spawnSync('node', qaArgs, { encoding: 'utf8', timeout: 420000 });
  const stdout = (r.stdout || '').trim();
  const stderr = (r.stderr || (r.error && r.error.message) || '').trim();
  const summaryPath = path.join(outDir, `${path.basename(file, '.html')}-qa-summary.json`);
  let gates = null;
  try {
    gates = JSON.parse(fs.readFileSync(summaryPath, 'utf8')).gates;
  } catch {
    // qa.js 自身失败(参数/环境)时无 summary——按整体失败上报
  }
  if (!gates) {
    return [{ gate: 'qa.js 全量门禁 (--no-visual)', ok: false, detail: (stderr || stdout).split('\n').slice(0, 10).join('\n') }];
  }
  const out = [];
  for (const [name, state] of Object.entries(gates)) {
    if (name === 'visual') continue; // 视觉层由 --no-visual 显式豁免,单独提示
    const ok = state === 'pass' || state === 'skipped' || state === 'human-signoff' || state === 'model';
    out.push({ gate: `qa:${name}`, ok, detail: ok ? state : `${state} — 详见 qa.js 输出` });
  }
  out.push({ gate: 'qa:visual (感官层)', ok: true, detail: 'skipped by --no-visual — 交付前必须另行跑完整 qa.js 或附人工签字' });
  // 整体失败(如 design-brief 缺失)时附 qa.js 诊断摘录
  if (r.status !== 0) {
    const diag = (stderr || stdout).split('\n').filter((l) => l.includes('✗')).slice(0, 6).join('\n');
    if (diag) out.push({ gate: 'qa.js 诊断', ok: false, detail: diag });
  }
  return out;
}

function parseArgs(argv) {
  const a = { demo: false, gates: false, voice: null };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--demo') a.demo = true;
    else if (k === '--gates') a.gates = true;
    else if (k === '--input') a.input = argv[++i];
    else if (k === '--out') a.out = argv[++i];
    else if (k === '--voice') a.voice = argv[++i];
    else if (k === '--manifest') a.manifest = argv[++i];
  }
  return a;
}

function main() {
  const a = parseArgs(process.argv.slice(2));
  let input;
  let outFile;

  if (a.manifest && a.input) {
    console.error('--manifest and --input are mutually exclusive');
    process.exit(2);
  }
  if (a.manifest) {
    const manifest = loadDeckManifest(a.manifest);
    input = manifestToGeneratorInput(manifest);
    outFile = a.out || path.resolve(path.dirname(a.manifest), manifest.output.html);
  } else if (a.demo || !a.input) {
    input = JSON.parse(JSON.stringify(DEMO));
    input.voice = 'auto'; // 触发 voice-router 推断(种子未覆盖主题 → 走 assembleDeck)
    outFile = path.join(ROOT, 'output', 'generate-deck-demo.html');
  } else {
    input = JSON.parse(fs.readFileSync(a.input, 'utf8'));
    if (!input.voice) input.voice = 'auto';
    if (a.voice) input.voice = a.voice; // 显式覆盖
    outFile = a.out || path.join(ROOT, 'output', 'deck.html');
  }

  const result = generate(input);
  if (result.seedScaffold) {
    // 种子 scaffold 不是交付物:改写为 <name>.scaffold.html(不占用正式交付名),
    // 并写入 requiresRewrite 标记注释——qa.js 检测到该标记 = 未重写直接交付,硬失败。
    outFile = outFile.endsWith('.html')
      ? outFile.replace(/\.html$/, '.scaffold.html')
      : outFile + '.scaffold.html';
    result.html = `<!-- generate-deck seed-scaffold: requiresRewrite=true seed=${result.preferSeed} — 未重写 scaffold,非交付物(SEED_REWRITE_CONTRACT: cover/proof/mechanism/close ≥2 个 role 骨架重写后才可交付) -->\n` + result.html;
  }
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, result.html);

  console.log('✅ generate-deck:', path.relative(ROOT, outFile));
  console.log('   主题:', input.topic);
  if (result.seedScaffold) {
    console.log('   🌱 种子 scaffold:', result.preferSeed, `[${result.voiceInfo.matchType}]`);
    console.log('      ', result.voiceInfo.reason);
    console.log('   ⚠ requiresRewrite: true — 复制了精致种子 HTML(完整签名),已改写为 .scaffold.html(不占用正式交付名);必须改写内容(保留签名原语 + 6 维),别只换文字/配色。');
    const c = result.rewriteChecklist;
    console.log(`      重写清单:${c.roles.join(' / ')} 四个 role 中至少重写 ${c.minRewrite} 个骨架`);
    console.log('     ', c.note);
    console.log(`      验收:改完后跑 node scripts/skeleton-diff.js <你的deck> --seed examples/${result.preferSeed}.html --gate(骨架相似度 >70% = 换皮,失败门禁 #9)`);
  } else {
    console.log('   voice:', result.voice, result.voiceInfo ? `[${result.voiceInfo.matchType}] ${result.voiceInfo.reason}` : '(用户指定)');
    console.log('   路由:', result.routed.deck_check.hint);
    // 生成报告:序列 warning + 待人工标注段落 + 字段抽取/降级清单
    for (const line of routeReportLines(result.routed)) console.log(line);
  }

  if (a.gates) {
    console.log('\n── 门禁(qa.js 全量,仅豁免视觉层) ──');
    const results = runGatesOn(outFile, input.topic);
    for (const r of results) {
      console.log(`\n[${r.ok ? '✅' : '❌'}] ${r.gate}`);
      if (r.detail) console.log(r.detail);
    }
    const failed = results.filter((r) => !r.ok);
    if (failed.length) {
      console.error(`\n❌ --gates: ${failed.length} 项门禁未过 — 该 deck 距可交付还有硬失败,勿当"全绿"上报`);
      process.exit(1);
    }
    console.log('\n✅ --gates 全绿(视觉层除外) — 交付前仍须跑完整 qa.js 过视觉层(或附人工签字)');
  }
}

if (require.main === module) main();

module.exports = { generate, resolveVoice, runGatesOn };
