#!/usr/bin/env node
'use strict';

/**
 * route-deck.js — 路径总线:任意主题 → 路径 A / B / C 一路由出
 * ====================================================================
 * 包在 voice-router 之上的一层决策:voice-router 回答「命中哪个 voice/种子/case」,
 * 本脚本回答「走哪条生成路径 + 验收跑什么」。三条路径(定义见 SKILL.md「路径选择」):
 *
 *   A 种子快速   主题形状命中 10 种子(voice-router preferSeed)
 *                → examples/<seed>.html 作 scaffold,保留签名原语改写内容
 *   B 组合通用   关键词/维度/mood 命中 14 voice 之一(非 fallback)
 *                → voice-router → content-router → generate-archetype-deck/generate-deck
 *   C B 解法生成 模板库外(voice-router fallback)/ 命中沉淀 case(caseRef)/ --wow 惊艳
 *                → references/design-generation-workflow.md(审美意图先行 + 外部大师参考,
 *                  禁套 template/voice;caseRef 只参考决策 + 字体/签名/材质,不套 HTML)
 *
 * 优先级:--wow > 种子(A) > caseRef(C) > fallback(C) > voice 命中(B)。
 *
 * 用法:
 *   node scripts/route-deck.js --topic "<主题>" [--style "<风格词>"] [--wow] [--json]
 *   node scripts/route-deck.js --selftest        内置主题断言,失败 exit 1
 *
 * 输出(--json 同构):{ path, voice?, seed?, caseRef?, reasons[], acceptance[] }
 *   acceptance = 该路径要跑的脚本清单(统一 node scripts/qa.js <file> 全量验收)。
 */

const { routeVoice } = require('./voice-router');

const QA_ALL = 'node scripts/qa.js <file>  # 全量验收(地板门禁 + 天花板检查)';

/**
 * 路径决策。opts: { style?: string, wow?: boolean }
 * @returns {{path:'A'|'B'|'C', voice?:string, seed?:string, caseRef?:object, reasons:string[], acceptance:string[]}}
 */
function routeDeckPath(topic, opts = {}) {
  const info = routeVoice(topic || '', { styleKeywords: opts.style ? [opts.style] : [] });
  const reasons = [info.reason];
  const out = { path: null, reasons, acceptance: [QA_ALL] };

  // --wow 优先于一切:惊艳/发布会级必走 C(不套种子/voice,从外部大师参考推导)
  if (opts.wow) {
    out.path = 'C';
    reasons.unshift('--wow 惊艳要求 → 必走路径 C(优先级高于一切命中)');
    reasons.push('按 references/design-generation-workflow.md:审美意图先行 + 外部大师参考(禁 template/voice 套用) + 减法生成 + impeccable 截图迭代打磨');
    if (info.caseRef) out.caseRef = info.caseRef;
    return out;
  }

  // A:种子形状命中 → 种子 scaffold
  if (info.preferSeed) {
    out.path = 'A';
    out.seed = info.preferSeed;
    reasons.push(`路径 A:以 examples/${info.preferSeed}.html 为 scaffold,保留签名原语(6 维)改写内容`);
    reasons.push('⚠ 禁止原样填充 scaffold:需重写 ≥2 个 role 骨架(主骨架由 ≥3 种 archetype 组合,≥1 种为本主题发明的变体),否则触失败门禁 #9 换皮');
    out.acceptance.push(`node scripts/skeleton-diff.js <file> --seed examples/${info.preferSeed}.html --gate  # 换皮结构级检测(骨架相似度 >70% = 失败门禁 #9)`);
    return out;
  }

  // C:命中沉淀 case(参考 DNA,不套 HTML)
  if (info.caseRef) {
    out.path = 'C';
    out.caseRef = info.caseRef;
    reasons.push(`路径 C:caseRef「${info.caseRef.name}」→ 读 ${info.caseRef.casePath}(决策)+ ${info.caseRef.deckPath}(DNA,不套 HTML),按 design-generation-workflow.md 生成`);
    return out;
  }

  // C:模板库外(fallback)——不硬套 editorial voice
  if (info.matchType === 'fallback') {
    out.path = 'C';
    reasons.push('路径 C:模板库外主题 → references/design-generation-workflow.md(B 解法),不要硬套 editorial voice');
    return out;
  }

  // B:命中具体 voice(keyword/dimension/mood)→ 组合生成工具链
  out.path = 'B';
  out.voice = info.voice;
  reasons.push(`路径 B:voice「${info.voice}」× archetype 组合生成(voice-router → content-router → generate-archetype-deck)`);
  out.acceptance.unshift('node scripts/generate-deck.js --input deck.json --gates  # 组合生成 + grade-gate/design-strength 门禁');
  return out;
}

// ── selftest:内置主题断言(任一失败 exit 1)────────────────────────────────
const SELFTEST = [
  { topic: '做一个和风水墨风的文化分享', desc: '和风 → B/chinese-ink-wash(强风格信号压过弱主题词「文化」)',
    ok: r => (r.path === 'B' && r.voice === 'chinese-ink-wash') || r.path === 'C' },
  { topic: '天文学', desc: '天文学 → C + caseRef(上位词命中沉淀 case)',
    ok: r => r.path === 'C' && !!r.caseRef },
  { topic: '年终复盘', desc: '年终复盘 → A/template-01(历程/复盘形状)',
    ok: r => r.path === 'A' && r.seed === 'template-01-editorial-serif' },
  { topic: '系统监控', desc: '系统监控 → A/template-02(系统/监控形状)',
    ok: r => r.path === 'A' && r.seed === 'template-02-dark-tech' },
  { topic: '产品发布', desc: '产品发布 → A/template-04(发布/亮相形状)',
    ok: r => r.path === 'A' && r.seed === 'template-04-vibrant-gradient' },
  { topic: '教学课件', desc: '教学课件 → A/template-05(教学/工作坊形状)',
    ok: r => r.path === 'A' && r.seed === 'template-05-nature-fresh' },
  { topic: '旅游攻略', desc: '旅游攻略 → A/template-09(城市/旅游图像驱动)',
    ok: r => r.path === 'A' && r.seed === 'template-09-editorial-photo' },
  { topic: '临床试验', desc: '临床试验 → A/template-10(临床/监管形状)',
    ok: r => r.path === 'A' && r.seed === 'template-10-clinical-trial' },
  { topic: '金融分析', desc: '金融分析 → B/consulting 或 data(14 voice 内)',
    ok: r => r.path === 'B' && (r.voice === 'consulting' || r.voice === 'data') },
  { topic: '蒸汽波风格的音乐分享', wow: true, desc: '蒸汽波 --wow → C(惊艳必走 C)',
    ok: r => r.path === 'C' },
  { topic: '量子引力科普', wow: true, desc: '任意主题 --wow → C(--wow 优先于一切)',
    ok: r => r.path === 'C' },
  { topic: '蒸汽波风格的音乐分享', desc: '蒸汽波(无 --wow)→ C(模板库外,不再被 mood 拽进 retro)',
    ok: r => r.path === 'C' },
];

function selftest() {
  console.log('═══ route-deck SELFTEST · 主题 → 路径断言 ═══\n');
  let failed = 0;
  for (const c of SELFTEST) {
    const r = routeDeckPath(c.topic, { wow: c.wow });
    const pass = c.ok(r);
    if (!pass) failed++;
    const hit = r.path === 'A' ? `seed=${r.seed}` : r.path === 'B' ? `voice=${r.voice}` : (r.caseRef ? `caseRef=${r.caseRef.name}` : '模板库外');
    console.log(`  ${pass ? '✓' : '✗'} ${c.desc}`);
    console.log(`    「${c.topic}」${c.wow ? ' --wow' : ''} → 路径 ${r.path} (${hit})`);
  }
  console.log(`\n  ${SELFTEST.length - failed}/${SELFTEST.length} 通过`);
  if (failed) { console.error(`  ✗ ${failed} 条断言失败`); process.exit(1); }
}

// ── CLI ─────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const a = { wow: false, json: false, selftest: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--topic') a.topic = argv[++i];
    else if (k === '--style') a.style = argv[++i];
    else if (k === '--wow') a.wow = true;
    else if (k === '--json') a.json = true;
    else if (k === '--selftest') a.selftest = true;
  }
  return a;
}

function main() {
  const a = parseArgs(process.argv.slice(2));
  if (a.selftest) { selftest(); return; }
  if (!a.topic) {
    console.log('用法: node scripts/route-deck.js --topic "<主题>" [--style "<风格词>"] [--wow] [--json]');
    console.log('      node scripts/route-deck.js --selftest');
    console.log('路径: A 种子快速(10 种子 scaffold) / B 组合通用(14 voice × 12 archetype) / C B 解法生成(模板库外或 --wow 惊艳)');
    return;
  }
  const r = routeDeckPath(a.topic, { style: a.style, wow: a.wow });
  if (a.json) { console.log(JSON.stringify(r, null, 2)); return; }
  console.log(`主题:「${a.topic}」${a.style ? ` 风格:「${a.style}」` : ''}${a.wow ? ' --wow' : ''}`);
  console.log(`  → 路径 ${r.path}(${{ A: '种子快速', B: '组合通用', C: 'B 解法生成' }[r.path]})`);
  if (r.seed) console.log(`    seed: ${r.seed}(examples/${r.seed}.html)`);
  if (r.voice) console.log(`    voice: ${r.voice}`);
  if (r.caseRef) console.log(`    caseRef: ${r.caseRef.name} → ${r.caseRef.casePath} / ${r.caseRef.deckPath}`);
  console.log('    理由:');
  for (const s of r.reasons) console.log(`      · ${s}`);
  console.log('    验收:');
  for (const s of r.acceptance) console.log(`      · ${s}`);
}

if (require.main === module) main();

module.exports = { routeDeckPath };
