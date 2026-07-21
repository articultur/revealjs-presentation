#!/usr/bin/env node
'use strict';
/* eslint-disable */

/**
 * content-router.js — 内容 → 版式原语路由器(四层架构 ② 内容路由层)
 * ====================================================================
 * 实验性原型(2026-06):验证「内容不在 10 template 覆盖,也能靠 archetype
 * 组合拼出高质量 deck 骨架」。填补 layout-archetypes(① 原语)与 tokens
 * (③ 风格)之间的 ② 内容路由层 —— 让「选版式」从「人选 template」升级到
 * 「内容驱动选 archetype」。
 *
 * 四层架构(见 tokens/README.md):
 *   ① 版式原语库  = A1-A12 archetype(references/layout-archetypes.md,已有)
 *   ② 内容路由    = 本脚本(输入内容特征 → 输出 archetype 选择)  ← 缺这一层
 *   ③ 风格 token  = tokens/(已有)
 *   ④ 设计规则引擎 = lint-design.js / visual-verdict.js(已有)
 *
 * 不进 examples/ 模板库(吸取 pilot-ink-wash 归类教训)。
 *
 * 用法:
 *   node scripts/content-router.js --demo    跑内置「III 期临床试验」demo
 *   node scripts/content-router.js in.json   路由自定义 JSON
 *
 * JSON schema:
 *   { "topic": "...", "voice": "...", "sections": [ {title, body, content_type?} ] }
 *   content_type 省略或 "auto" = 自动推断;否则显式指定。
 */

// ── content-type → archetype 映射(对齐 references/layout-archetypes.md A1-A12)──
const ARCHETYPE_MAP = {
  cover:           { code: 'A1',  name: 'Masthead Cover',     reason: '报头双线 + 巨型标题,建立权威感' },
  thesis:          { code: 'A2',  name: 'Manifesto Statement', reason: '巨型斜体命题 + 极端留白,让主张成为视觉' },
  chronology:      { code: 'A3',  name: 'Register Axis',      reason: '横轴里程碑节点,表达编年/路线' },
  chapter:         { code: 'A4',  name: 'Full-Bleed Split',   reason: '满版面板 × 内容,非对称分隔章节' },
  'data-anchor':   { code: 'A5',  name: 'Anchor Numeral',     reason: '巨型数字做引力 + 证据列' },
  comparison:      { code: 'A6',  name: 'Face-Off Compare',   reason: '两值对峙 + 比率裁决' },
  kpi:             { code: 'A7',  name: 'KPI Grid',           reason: '粗边框卡 + 巨型数字速览' },
  mechanism:       { code: 'A8',  name: 'Mechanism Diagram',  reason: '前→后转换条,量化机制' },
  'evidence-table':{ code: 'A9',  name: 'Evidence Table',     reason: '强调列高亮表格,台账/矩阵' },
  quote:           { code: 'A10', name: 'Pullquote',          reason: '上下双线 + 巨型斜体引言' },
  takeaways:       { code: 'A11', name: 'Takeaway Roster',    reason: '编号顶边卡阵列,要点/启示' },
  closing:         { code: 'A12', name: 'Masthead Closing',   reason: '报头收尾,呼应封面' },
  'image-compare': { code: 'IMG', name: 'Image Face-Off',    reason: '双图并排对比 + 标签(图像驱动:proof 是图本身,见 image-driven-deck.md)' },
};

// ── archetype 变体规则(对应失败门禁 #9:≥1 主题发明变体)──
// 返回 { hint, params } = 带真实参数的变体建议;null = 该段不变体(照原 archetype)。
// params 是机器可读的变体参数(节点密度/面板比/高亮列…),deck_check 只统计带
// params 的变体 —— 无参数的口号式"变体"不算数(旧 mechanism/evidence-table 恒真
// 规则曾让 variant_count 虚高,门禁 #9 形同虚设)。
// layout-archetypes.md 第 412 行手则的自动化:不只选 A1-A12,还要调参数成主题变体。
const VARIANT_RULES = {
  'data-anchor': (s, sec) => { const m = s.match(/(\d+(?:\.\d+)?)%/) || String((sec && sec.number) || '').match(/(\d+(?:\.\d+)?)%/); return (m && parseFloat(m[1]) >= 50) ? { hint: '锚点数字放大到 5.6em 占视觉中心(显著数据变体)', params: { anchor_scale: 5.6 } } : null; },
  comparison:      s => /差距|大幅|远低于|远高于|显著优于|提升到|降低到/.test(s) ? { hint: '满版 accent 面板 + 裁决比率放大(对峙变体)', params: { panel: 'full-bleed', verdict_scale: 2.7 } } : null,
  chronology:      s => /关键|转折|里程碑|突破|读出/.test(s) ? { hint: '非均匀节点,关键节点密集 + accent(编年变体)', params: { node_density: 'non-uniform', accent_nodes: true } } : null,
  mechanism:       (s, sec) => /\d+(?:\.\d+)?\s*(?:%|倍)/.test(s) || /\d+(?:\.\d+)?\s*(?:%|倍)/.test(String((sec && sec.reduction) || '')) ? { hint: '后栏 accent 满版高亮(面板比 38%)+ 量化减少(机制变体)', params: { panel_ratio: 0.38 } } : null,
  'evidence-table': s => ((s.match(/\|/g) || []).length >= 6 || /多指标|全终点|全量|矩阵/.test(s)) ? { hint: '主角列 accent 高亮 + 数据列右对齐(台账变体)', params: { highlight_col: 1, align: 'right' } } : null,
};

// ── content-type 自动检测(按优先级:语义强 → 数字特征 → 兜底)──
const DETECT_RULES = [
  { type: 'image-compare', test: s => s.__hasImageCompare },
  { type: 'takeaways',      test: s => /要点|启示|结论是|建议:|小结/.test(s) || /\n\s*[1-9][.、)]/.test(s) || /^[1-9][.、]\s/.test(s) },
  { type: 'thesis',         test: s => /^(核心|主张|结论是|我们认为|关键发现|核心结论)/.test(s) || (s.length < 55 && /(提升|降低|达到|占比|增长|减少)了?\s*\d/.test(s)) },
  { type: 'closing',        test: s => {
      if (!/下一步|展望|谢谢|结语|结束|报产|申请提交|Q[1-4]\s*提交/.test(s)) return false;
      // 位置守卫:A12 是收尾版式,只有最后一段可直接判 closing;中段须段首显式词
      // (结尾/总结/下一步),防"中段提到下一步/Q4 提交"把 A12 插到 deck 中段。
      if (s.__index === s.__total - 1) return true;
      return /^\s*(结尾|总结|下一步)/.test(s);
    } },
  { type: 'comparison',     test: s => /\bvs\.?\b|对比|对照(组)?|新旧|替代方案| versus /i.test(s) },
  { type: 'quote',          test: s => /["「『“‘].{4,}["」』”’]/.test(s) || (/(表示|指出|认为|说道|评语)/.test(s) && /["「『“‘]/.test(s)) },
  { type: 'mechanism',      test: s => /→|机制|通路|触发|导致|步骤|流程图|抑制|阻断|转化/.test(s) },
  { type: 'chronology',     test: s => (s.match(/\d{4}\s*年|\d+\s*(月|周|阶段|期|季度)/g) || []).length >= 2 },
  { type: 'data-anchor',    test: s => {
      // 大数字锚点:百分比,或 ≥4 位数字(排除 19xx/20xx 年份),或带 万/亿/倍 的量级数;文本要短、数字要少(防和 kpi 撞车)
      const nums = s.match(/\d+(?:\.\d+)?/g) || [];
      const big = /\d+(\.\d+)?%/.test(s)
        || nums.some(n => n.replace('.', '').length >= 4 && !/^(19|20)\d{2}$/.test(n))
        || /\d+(?:\.\d+)?\s*(?:万|亿|倍)/.test(s);
      return big && s.length < 90 && nums.length <= 3;
    } },
  { type: 'evidence-table', test: s => /组别|基线|终点|组间|矩阵|台帐|台账|P\s*[=<]\s*0\.\d/.test(s) || (s.match(/\|/g) || []).length >= 4 },
  { type: 'kpi',            test: s => (s.match(/\d+(\.\d+)?%?/g) || []).length >= 3 && s.length < 140 },
];

/** 自动推断单段 content-type */
function detectContentType(section) {
  const text = `${section.title || ''} ${section.body || ''}`.trim();
  if (section.index === 0) return 'cover';
  if (section.index === section.total - 1 && /结尾|结束|谢谢|总结|展望|下一步|conclusion|closing|summary|thank you|next steps/i.test(text)) return 'closing';
  const signal = Object.assign(new String(text), {
    __hasImageCompare: Boolean(section.img_a && section.img_b),
    __index: section.index,   // 位置守卫用(closing 等版式需要知道段落位置)
    __total: section.total,
  });
  for (const r of DETECT_RULES) {
    if (r.test(signal)) return r.type;
  }
  return 'chapter'; // 兜底:无强特征的中间段 → 章节分隔
}

function routeSection(section) {
  const text = `${section.title || ''} ${section.body || ''}`.trim();
  const explicitType = Boolean(section.content_type && section.content_type !== 'auto');
  const ct = (!section.content_type || section.content_type === 'auto')
    ? detectContentType(section)
    : section.content_type;
  const arch = ARCHETYPE_MAP[ct] || ARCHETYPE_MAP.chapter;
  const variantFn = VARIANT_RULES[ct];
  const v = variantFn ? variantFn(text, section) : null;
  const variant_hint = v ? v.hint : null;
  const variant_params = v ? (v.params || null) : null; // 无 params 的变体不计入 deck_check
  const fallback_chapter = !explicitType && ct === 'chapter' && section.index > 0 && section.index < section.total - 1;
  return {
    index: section.index,
    title: (section.title || '').slice(0, 28),
    body: section.body || '',
    content_type: ct,
    archetype: arch.code,
    archetype_name: arch.name,
    reason: arch.reason,
    variant_hint,
    variant_params,
    fallback_chapter,
  };
}

function routeDeck(input) {
  const total = input.sections.length;
  const routes = input.sections.map((s, i) => routeSection({ ...s, index: i, total }));
  const codes = [...new Set(routes.map(r => r.archetype))];
  const variantCount = routes.filter(r => r.variant_params).length; // 只统计带真实参数的变体
  const fallbackCount = routes.filter(r => r.fallback_chapter).length;
  const min3 = codes.length >= 3;
  const varOk = variantCount >= 1;
  // ── 序列层检查(warning,不 throw):节奏与首尾完整性 ──
  const warnings = [];
  for (let i = 1; i < routes.length; i++) {
    if (routes[i].archetype === routes[i - 1].archetype) {
      warnings.push(`连续同型:section ${i - 1}-${i} 同为 ${routes[i].archetype}(layout-archetypes.md: 连续 2 页同 archetype = 失败,建议插 A2/A10 打断)`);
    }
  }
  if (!codes.includes('A1')) warnings.push('缺 cover(A1):deck 没有封面页,首段未路由到 A1');
  if (!codes.includes('A12')) warnings.push('缺 closing(A12):deck 没有收尾页,末段未路由到 A12');
  return {
    topic: input.topic,
    voice: input.voice || 'editorial-serif',
    routes,
    warnings,
    deck_check: {
      archetype_count: codes.length,
      archetype_codes: codes.join(' '),
      min_3_satisfied: min3,
      variant_invented: varOk,
      variant_count: variantCount,
      fallback_chapter_count: fallbackCount,
      hint: (min3 ? `✅ ≥3 archetype(${codes.length} 种)` : '⚠️ 不足 3 种 archetype(换皮风险)')
        + ' · ' + (varOk ? `✅ ≥1 主题变体(${variantCount} 处)` : '⚠️ 无主题变体(门禁 #9 未满足)'),
    },
  };
}

// ── 内置 demo:III 期临床试验(医疗主题,不在 10 template 覆盖)──
const MEDICAL_DEMO = {
  topic: 'III 期临床试验结果汇报(医疗主题 — 不在 10 template 覆盖)',
  voice: 'editorial-serif',
  sections: [
    { title: '封面',       body: 'III 期临床试验结果汇报 · CX-204 治疗晚期 NSCLC' },
    { title: '核心结论',   body: '核心结论:CX-204 将 5 年生存率从 42% 提升到 67%' },
    { title: '主要终点',   body: '67% — 主要终点指标(总生存期 OS)' },
    { title: '试验对比',   body: 'CX-204 试验组 vs 标准疗法对照组,OS 对比' },
    { title: '多指标台账', body: '组别基线/终点:OS、PFS、ORR、3-4 级 AE 多指标台账' },
    { title: '作用机制',   body: '机制:靶点 X 抑制 → 通路 Y 阻断 → 凋亡激活' },
    { title: '试验时间线', body: '2022 年入组,2023 年给药,2024 年随访,2025 年读出' },
    { title: 'PI 评价',    body: '主要研究者表示:「这是十年来该领域最显著的总生存获益」' },
    { title: '结论要点',   body: '要点:1. OS 显著获益;2. 安全性可控;3. 报产申请启动' },
    { title: '下一步',     body: '下一步:NDA 报产申请,Q4 提交,谢谢' },
  ],
};

function main() {
  const arg = process.argv[2];
  let input;
  if (!arg || arg === '--demo') {
    input = MEDICAL_DEMO;
    console.log('═══ content-router DEMO · 医疗主题(不在 10 template 覆盖)═══\n');
  } else {
    input = JSON.parse(require('fs').readFileSync(arg, 'utf8'));
  }
  const r = routeDeck(input);
  console.log(`主题:${r.topic}`);
  console.log(`voice:${r.voice}\n`);
  console.log('── 每段路由(内容特征 → archetype + 变体)──');
  r.routes.forEach(x => {
    console.log(`  [${String(x.index).padStart(2)}] ${x.archetype} ${x.archetype_name.padEnd(20)} ← ${x.content_type.padEnd(15)} │ ${x.title}`);
    if (x.variant_hint) console.log(`        ↳ 变体:${x.variant_hint} │ params:${JSON.stringify(x.variant_params)}`);
  });
  console.log('\n── 全 deck 多样性检查(失败门禁 #9 换皮)──');
  console.log(`  archetype 数:${r.deck_check.archetype_count} 种 → ${r.deck_check.archetype_codes}`);
  console.log(`  ${r.deck_check.hint}`);
  if (r.warnings.length) {
    console.log('\n── 序列层检查(warning,不阻断)──');
    r.warnings.forEach(w => console.log(`  ⚠ ${w}`));
  }
}

if (require.main === module) main();

module.exports = { routeDeck, routeSection, detectContentType, ARCHETYPE_MAP, VARIANT_RULES };
