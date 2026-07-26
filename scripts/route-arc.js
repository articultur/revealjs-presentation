#!/usr/bin/env node
'use strict';
/* eslint-disable */

/**
 * route-arc.js — 弧线路由:任意主题 → 叙事弧线建议(N1-N8 / invent)
 * ====================================================================
 * 对齐 voice-router(主题→voice)/ route-deck(主题→路径)的第三根路由轴:
 * 主题 → 跨页叙事弧线(references/narrative-arcs.md 弧线库)。让"弧线怎么选"
 * 不再靠自觉:新主题进来先跑本脚本,命中用库内弧线,未命中返回 invent:true
 * 并输出新弧线发明四件套要求(走 narrative-arcs.md「新弧线发明流程」,禁默认回落)。
 *
 * 关键词映射:长词优先(如「作品集」先于「作品」);等长并列时按 KEYWORDS 注册
 * 顺序先注先得(如「监控」先于「系统」,「系统监控」→ N2 而非 N8)——注册顺序即
 * 歧义裁决表,加词时想清楚并列冲突谁赢。
 *
 * 弧线摘要数据为内置镜像(pacing/banned 摘自 narrative-arcs.md 注册表):
 *   取舍——md 是散文式注册文档(全角标点/自由表格),机器解析脆;镜像把机器要用的
 *   节奏曲线/禁用节拍摘要固化在脚本里,沉淀新弧线时按流程同时改两处(md 加行 +
 *   本文件 ARCS/KEYWORDS 加条 + selftest 加断言)。selftest 含镜像↔md 名称一致性
 *   断言(镜像个个能在 md 里找到名字),防镜像漂移成第二真相源。
 *
 * 用法:
 *   node scripts/route-arc.js "<主题>" [--json]
 *   node scripts/route-arc.js --selftest   内置主题断言,失败 exit 1
 *
 * 输出(--json 同构):
 *   命中:{ topic, arc, name, en, pacingCurve, bannedBeats, reasons[] }
 *   未中:{ topic, arc:null, invent:true, reasons[], requirements{...} }
 *
 * 退出码:0 = 正常路由 / 1 = selftest 断言失败 / 2 = 用法错误
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ARCS_MD = path.join(ROOT, 'references', 'narrative-arcs.md');

// ── 弧线注册镜像(摘自 references/narrative-arcs.md 注册表;沉淀新弧线时两处同改)──
// pacing = 节奏曲线摘要;banned = 禁用节拍摘要;ref = 现实叙事载体参考(启发用)。
const ARCS = {
  N1: { name: '账本审计', en: 'Ledger Audit', ref: '审计报告、法庭卷宗、复式账簿',
    pacing: '密-密-疏-密-高潮(裁决)-收:短句页与密账页交替,密度先压后放',
    banned: '不用 anchor-numeral(数字必须在账目语境里,不裸奔);不用 face-off(对账即对峙,无需另设擂台)' },
  N2: { name: '值班夜航', en: 'Night Watch', ref: '航海日志、SRE 值班手册、空管记录',
    pacing: '疏-密-密-疏-高潮(告警处置)-收:编年匀速推进,告警处骤密',
    banned: '不用 kpi-wall(状态沿时间讲,不堆一次性仪表盘);不用 anchor-numeral(读数进日志语境)' },
  N3: { name: '质证对决', en: 'Cross-Examination', ref: '庭审实录、辩论赛、科学打假',
    pacing: '密-疏-密-密-疏-高潮(裁决):张弛交替,每轮质证后留一拍缓冲',
    banned: '不用 kpi-wall(证据要逐件出示,不一墙铺开);表格只许做证物清单,不做中性数据堆叠' },
  N4: { name: '画廊漫步', en: 'Gallery Walk', ref: '美术馆展册、摄影集、Pace/Gagosian 图录',
    pacing: '疏-疏-疏-疏-疏-收:全曲线低密度,高潮靠单件作品的满版特写而非信息堆叠',
    banned: '不用 anchor-numeral;不用 face-off;不用 kpi-wall;不做任何数据图表页——留白即节奏,密度是敌人' },
  N5: { name: '标尺之旅', en: 'Powers of Ten', ref: 'Eames《Powers of Ten》、宇宙尺度科普',
    pacing: '疏-疏-密-疏-疏-收:每页一站匀速推进,高潮是尺度反转页(最大↔最小同框)',
    banned: '不用 data-table(刻度即数据,表格打断行进感);不用 face-off(旅程单线推进,无两方)' },
  N6: { name: '专辑聆听', en: 'Album Listen', ref: '黑胶唱片内页、专辑 booklet、DJ setlist',
    pacing: '疏-密-疏-密-高潮(主打歌)-疏:Side A 蓄势 / Side B 放开,主打曲处情绪峰值',
    banned: '不用 kpi-wall(数据进 liner note);不用 face-off;表格只许做曲目单(track-listing)' },
  N7: { name: '田野笔记', en: 'Field Notes', ref: '博物学家笔记、民族志、Lab notebook',
    pacing: '疏-疏-密-疏-高潮(顿悟)-疏:随笔式疏朗,密度起伏随观察兴致,顿悟页单句击穿',
    banned: '不用 face-off;不用 kpi-wall;不做严密数据表(田野记录允许毛边,表格仅作样本台账)' },
  N8: { name: '工程剖面', en: 'Cutaway', ref: '建筑剖面图、DK 解剖百科、技术拆解手册',
    pacing: '密-疏-密-密-疏-收:整体密(全貌信息量大)→剖开疏→逐层密→合拢疏',
    banned: '不用 anchor-numeral(参数上铭牌,不上墙);不用 face-off(逐层是叠加不是对抗)' },
  N9: { name: '舞台揭幕', en: 'Stage Reveal', ref: '剧院五幕节目单、Apple keynote「One More Thing」传统、舞台监督 cue 本',
    pacing: '疏-密-密-疏-高潮(揭幕)-密-密-疏-疏-收:幕次推进,暗场蓄势后揭幕单点峰值,返场彩蛋余韵',
    banned: '不用 anchor-numeral(悬念是资产,参数价格进铭牌/价签语境不裸奔);不用 face-off(发布会是单向舞台仪式,无辩方);不用 kpi-wall(参数走铭牌逐条陈列,不一墙铺开)' },
};

// ── 关键词映射 [关键词, 弧线](注册顺序 = 等长冲突的裁决顺序;长词优先在匹配时排序)──
const KEYWORDS = [
  // N1 账本审计:数字要对得上
  ['复盘', 'N1'], ['决算', 'N1'], ['对账', 'N1'], ['审计', 'N1'], ['账本', 'N1'],
  ['财报', 'N1'], ['年报', 'N1'], ['成本', 'N1'], ['核销', 'N1'], ['账目', 'N1'],
  // N2 值班夜航:时间轴上有人盯着(「监控」须先于 N8「系统」注册:系统监控 → N2)
  ['监控', 'N2'], ['值班', 'N2'], ['应急', 'N2'], ['巡检', 'N2'], ['oncall', 'N2'],
  ['运维', 'N2'], ['值守', 'N2'], ['排障', 'N2'], ['告警', 'N2'], ['夜航', 'N2'], ['巡逻', 'N2'],
  // N3 质证对决:两方必须分出高下
  ['分析', 'N3'], ['评审', 'N3'], ['争议', 'N3'], ['合规', 'N3'], ['尽调', 'N3'],
  ['辩论', 'N3'], ['对决', 'N3'], ['评测', 'N3'], ['打假', 'N3'], ['竞标', 'N3'], ['质证', 'N3'],
  // N4 画廊漫步:看,本身就是内容
  ['艺术', 'N4'], ['美学', 'N4'], ['作品', 'N4'], ['赏析', 'N4'], ['展览', 'N4'],
  ['摄影', 'N4'], ['画廊', 'N4'], ['策展', 'N4'], ['画展', 'N4'],
  // N5 标尺之旅:同一坐标轴上旅行
  ['科普', 'N5'], ['尺度', 'N5'], ['宇宙', 'N5'], ['微观', 'N5'], ['旅程', 'N5'],
  ['天文', 'N5'], ['纵深', 'N5'], ['宏观', 'N5'],
  // N9 舞台揭幕(部分词):「首演」须先于 N6「演出」注册(等长 2 字,注册顺序裁决):产品首演 → N9 而非 N6
  ['首演', 'N9'],
  // N6 专辑聆听:一组作品按顺序播放
  ['音乐', 'N6'], ['歌单', 'N6'], ['专辑', 'N6'], ['演出', 'N6'], ['歌曲', 'N6'],
  ['唱片', 'N6'], ['曲目', 'N6'], ['乐队', 'N6'],
  // N7 田野笔记:我去看过了,记给你听
  ['调研', 'N7'], ['观察', 'N7'], ['访谈', 'N7'], ['采风', 'N7'], ['考察', 'N7'],
  ['田野', 'N7'], ['旅行', 'N7'], ['游记', 'N7'],
  // N8 工程剖面:切开给你看里面
  ['架构', 'N8'], ['原理', 'N8'], ['拆解', 'N8'], ['机制', 'N8'], ['分层', 'N8'],
  ['系统', 'N8'], ['硬件', 'N8'], ['构造', 'N8'], ['剖面', 'N8'], ['组成', 'N8'],
  // N9 舞台揭幕:悬念要在全场面前揭开(「发布会」3 字长词优先,压过 2 字词)
  ['发布会', 'N9'], ['揭幕', 'N9'], ['keynote', 'N9'], ['首发', 'N9'], ['新品', 'N9'],
];

// 长词优先(「作品集」>「作品」);等长保持注册顺序(stable sort)——注册顺序即歧义裁决。
const SORTED_KEYWORDS = [...KEYWORDS].sort((a, b) => b[0].length - a[0].length);

// ── 新弧线发明四件套要求(invent 时输出,与 narrative-arcs.md「新弧线发明流程」对应)──
function inventRequirements() {
  return {
    realWorldRef: '①启发:该主题的现实叙事载体是什么(账簿/航海日志/法庭卷宗/唱片/展览册/节目单…)——按 B 解法精神 web search 找现实参照,禁拍脑袋',
    pacingCurve: '②生成:节奏曲线(页级疏密与高潮位置,如「疏-密-高潮-收」),写进 brief pacingCurve 字段',
    pacingGrammar: '②生成:≥3 种特有页面类型(页面语法),写进 brief arcDefinition.pacingGrammar',
    bannedBeats: '②生成:≥1 条禁用节拍(显式不用的默认节拍),写进 brief bannedBeats 字段',
    rationale: '②生成:为什么该主题需要新弧线(N1-N8 为何不沾),写进 brief arcDefinition.rationale',
    verify: '③检验:node scripts/check-arc-adherence.js <file>(arcDefinition + bannedBeats 机器缺席扫描) + design-strength + 截图评审',
    register: '④沉淀:验证通过后注册——narrative-arcs.md 库表加行(N9+)+ route-arc.js KEYWORDS/ARCS 加条 + selftest 加断言 + 跑 route-arc --selftest 确认',
  };
}

/**
 * 弧线路由。
 * @returns 命中 { topic, arc, name, en, pacingCurve, bannedBeats, reasons[] };
 *          未中 { topic, arc:null, invent:true, reasons[], requirements }
 */
function routeArc(topic) {
  const t = String(topic || '');
  const reasons = [];
  const hits = [];
  for (const [kw, arc] of SORTED_KEYWORDS) {
    if (t.toLowerCase().includes(kw.toLowerCase())) hits.push([kw, arc]);
  }
  if (!hits.length) {
    reasons.push('关键词映射未命中 N1-N8 任何弧线 → 库外主题,不许默认回落「封面→巨数→机制→对峙→表格」默认节拍');
    reasons.push('走 references/narrative-arcs.md「新弧线发明流程」四步:启发→生成→检验→沉淀');
    return { topic: t, arc: null, invent: true, reasons, requirements: inventRequirements() };
  }
  const [kw, arc] = hits[0];
  const sameArcHits = hits.filter(h => h[1] === arc).map(h => `「${h[0]}」`);
  reasons.push(`命中关键词 ${sameArcHits.join('/')}(长词优先,等长按注册顺序裁决)→ ${arc} ${ARCS[arc].name}`);
  if (hits.some(h => h[1] !== arc)) {
    const others = [...new Set(hits.filter(h => h[1] !== arc).map(h => `${h[1]}(${h[0]})`))];
    reasons.push(`同时沾 ${others.join('、')},取 ${arc}——其余弧线语汇可作局部页面动作,不作主弧线`);
  }
  reasons.push(`现实参照:${ARCS[arc].ref}`);
  return {
    topic: t, arc, name: ARCS[arc].name, en: ARCS[arc].en,
    pacingCurve: ARCS[arc].pacing, bannedBeats: ARCS[arc].banned, reasons,
  };
}

// ── selftest:内置主题断言(任一失败 exit 1)────────────────────────────────
function selftest() {
  console.log('═══ route-arc SELFTEST · 主题 → 弧线断言 ═══\n');
  let failed = 0;
  const check = (ok, desc, detail = '') => {
    console.log(`  ${ok ? '✓' : '✗'} ${desc}${detail ? `\n    ${detail}` : ''}`);
    if (!ok) failed++;
  };
  const CASES = [
    ['2025 年度财务复盘', 'N1', '复盘 → N1 账本审计'],
    ['数据中心 oncall 值班手册', 'N2', 'oncall/值班 → N2 值班夜航'],
    ['银行与券商经营分析', 'N3', '分析 → N3 质证对决(金融分析 deck 实际弧线)'],
    ['当代艺术展览赏析', 'N4', '艺术/赏析/展览 → N4 画廊漫步'],
    ['从原子到宇宙的尺度科普', 'N5', '宇宙/尺度/科普 → N5 标尺之旅'],
    ['蒸汽波音乐专辑分享', 'N6', '音乐/专辑 → N6 专辑聆听(蒸汽波 deck 实际弧线)'],
    ['云南咖啡产地调研笔记', 'N7', '调研 → N7 田野笔记'],
    ['分布式系统架构拆解', 'N8', '架构/拆解 → N8 工程剖面'],
    ['澄声科技新品发布会', 'N9', '发布会 → N9 舞台揭幕(沉淀验证 deck 主题)'],
    ['耳机新品首演', 'N9', '等长冲突裁决:「首演」先于「演出」注册,首演 → N9 而非 N6'],
  ];
  for (const [topic, arc, desc] of CASES) {
    const r = routeArc(topic);
    check(r.arc === arc && r.invent !== true, desc, `「${topic}」→ ${r.arc || 'invent'}`);
  }
  // 库外主题 → invent:true + 四件套要求
  const r9 = routeArc('宠物殡葬服务介绍');
  check(r9.invent === true && r9.arc === null && r9.requirements && r9.requirements.realWorldRef && r9.requirements.pacingGrammar,
    '库外主题「宠物殡葬服务介绍」→ invent:true 且输出新弧线四件套要求');
  // 等长冲突按注册顺序裁决:「监控」先于「系统」注册 → 系统监控落 N2
  const r10 = routeArc('生产环境监控系统建设');
  check(r10.arc === 'N2', '等长冲突裁决:「监控」先于「系统」注册,「监控系统」→ N2 而非 N8', `实际 → ${r10.arc}`);
  // 镜像 ↔ narrative-arcs.md 名称一致性(防镜像漂移;md 缺失只警告不失败)
  if (fs.existsSync(ARCS_MD)) {
    const md = fs.readFileSync(ARCS_MD, 'utf8');
    const drift = Object.entries(ARCS).filter(([id, a]) => !md.includes(`${id} ${a.name}`));
    check(drift.length === 0, '镜像弧线名个个能在 narrative-arcs.md 找到(防第二真相源漂移)',
      drift.length ? `漂移:${drift.map(([id]) => id).join(',')}` : `${Object.keys(ARCS).length} 条一致`);
  } else {
    console.log('  - references/narrative-arcs.md 不在仓库内,跳过镜像一致性断言');
  }
  console.log(`\n  ${failed === 0 ? '全部通过' : failed + ' 条断言失败'}`);
  if (failed) process.exit(1);
}

// ── CLI ─────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const a = { json: false, selftest: false, topic: null };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--json') a.json = true;
    else if (k === '--selftest') a.selftest = true;
    else if (k === '--topic') a.topic = argv[++i];
    else if (!k.startsWith('-') && !a.topic) a.topic = k;
  }
  return a;
}

function main() {
  const a = parseArgs(process.argv.slice(2));
  if (a.selftest) { selftest(); return; }
  if (!a.topic) {
    console.log('用法: node scripts/route-arc.js "<主题>" [--json]');
    console.log('      node scripts/route-arc.js --selftest');
    console.log('主题 → 叙事弧线:命中关键词返回 N1-N8 库内弧线(含节奏曲线/禁用节拍摘要);未命中返回 invent:true + 新弧线发明四件套要求(走 references/narrative-arcs.md「新弧线发明流程」)。');
    return;
  }
  const r = routeArc(a.topic);
  if (a.json) { console.log(JSON.stringify(r, null, 2)); return; }
  console.log(`主题:「${a.topic}」`);
  if (r.invent) {
    console.log('  → 库外主题(invent):N1-N8 均不沾,走「新弧线发明流程」发明新弧线,不许默认回落');
    console.log('    理由:');
    for (const s of r.reasons) console.log(`      · ${s}`);
    console.log('    新弧线发明要求:');
    for (const v of Object.values(r.requirements)) console.log(`      · ${v}`);
    return;
  }
  console.log(`  → 弧线 ${r.arc} ${r.name}(${r.en})`);
  console.log('    理由:');
  for (const s of r.reasons) console.log(`      · ${s}`);
  console.log(`    节奏曲线:${r.pacingCurve}`);
  console.log(`    禁用节拍:${r.bannedBeats}`);
}

if (require.main === module) main();

module.exports = { routeArc, ARCS, KEYWORDS };
