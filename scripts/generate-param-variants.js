#!/usr/bin/env node
'use strict';
/* eslint-disable */

/**
 * generate-param-variants.js — 参数化版式回归产物生成器
 * ====================================================================
 * 路径 B 生成器参数化改造(Wave 3)的回归验证产物:为 3 个代表性 archetype
 * (A4 满版分割 / A5 锚点数字 / A8 机制)各生成 3 组差异参数的变体页,
 * 共 9 个最小 deck,落到 output/regression/。
 *
 * 每个 deck = 单页 section + 必要 base CSS/token + PPTX 导出脚本 +
 * 最小合法 design-brief(8 字段)+ 库内弧线声明(N1 账本审计)。
 *
 * 参数组(真能改变版式结构,不只改 CSS):
 *   A4 split_ratio:  "30/70" / "50/50" / "70/30"(左右栏宽度 + split-lN/split-rN class)
 *   A5 anchor_scale: 2 / 4 / 6(锚点字号 + anchor-sN class)
 *   A8 density_tier: compact / normal / airy(单栏堆叠 / 双面板 / 三栏,子元素结构分叉)
 *
 * 用法: node scripts/generate-param-variants.js
 * 产物: output/regression/param-A4-v1.html … param-A8-v3.html(9 个)
 */

const fs = require('fs');
const path = require('path');
const { assembleDeck } = require('./generate-archetype-deck');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'output', 'regression');

// 最小合法 design-brief(8 必填字段:见 check-design-brief.js)
// 弧线声明用库内 N1 账本审计(在 references/narrative-arcs.md 注册表内),
// bannedBeats 避开本 deck 实际用到的节拍(不触 bannedBeats 签名扫描 FAIL)。
function minimalBrief(topic, signatureMoment, pacingCurve) {
  return {
    aestheticAnchor: '编辑设计语汇:满版分割 + 衬线展示字 + 留白节奏',
    externalRefs: [{ url: 'https://example.com/master-ref', visualNote: '极端留白 + 单点霓虹的孤独感' }],
    signatureMoment,
    extremeContrast: '尺度 6:1,深满版 vs 浅留白',
    bannedPatterns: ['side-stripe', 'gradient text'],
    narrativeArc: 'N1 账本审计(见 references/narrative-arcs.md)',
    pacingCurve,
    bannedBeats: ['kpi-wall:本页不是指标墙', 'data-chart:本页无图表'],
  };
}

// 把 design-brief 内嵌进 assembleDeck 产出的 HTML(紧邻 </body> 前)
function embedBrief(html, brief) {
  const tag = `<script type="application/json" id="design-brief">${JSON.stringify(brief)}</script>`;
  return html.replace('</body>', `${tag}\n</body>`);
}

// ── 9 个变体的输入定义 ──────────────────────────────────────────────────
// 每个 input 只含 1 个目标 section(content_type 显式指定,避免路由歧义);
// variant_params 携带要验证的三组参数之一。
// 注:单 section deck 不满足 ≥3 archetype 路由门禁,但本产物只做版式参数回归,
// 不走完整 deck pipeline;qa.js --no-visual 会跑 design-brief/arc/skeleton 门禁。

const A4_SECTION = {
  title: '城市慢行交通', content_type: 'chapter',
  panel_title: '路权重构', panel_quote: '把街道还给行人',
  body: '压缩机动车道;增设停放区;完善地铁接驳;拓宽人行步道。',
};
const A5_SECTION = {
  title: '主要终点', content_type: 'data-anchor',
  label: 'PRIMARY ENDPOINT · OS', number: '67%', event: '试验组 5 年生存率',
  note: 'vs 对照组 42% · HR=0.52', source: 'III 期 · 主要终点',
  evidence: [{ k: '对照组 OS', v: '42%' }, { k: 'HR', v: '0.52' }, { k: 'p 值', v: '< 0.001' }],
};
const A8_SECTION = {
  title: '作用机制', content_type: 'mechanism',
  subtitle: '靶点 X 抑制 → 通路 Y 阻断 → 凋亡激活',
  before_label: '传统化疗', after_label: 'CX-204', reduction: '复发风险降低 48%',
  before_items: ['广谱细胞毒', '选择性低', '耐药快'],
  after_items: ['靶点 X 高选择', '通路 Y 阻断', '凋亡激活'],
};

const VARIANTS = [
  // A4 满版分割 × 3 组 split_ratio
  { id: 'param-A4-v1', archetype: 'A4', params: { split_ratio: '30/70' },
    section: A4_SECTION, topic: 'A4 · split 30/70',
    signature: '左栏 30% 深色满版 / 右栏 70% 浅色正文', pacing: '疏-密-收' },
  { id: 'param-A4-v2', archetype: 'A4', params: { split_ratio: '50/50' },
    section: A4_SECTION, topic: 'A4 · split 50/50',
    signature: '左右等分对峙', pacing: '密-密-收' },
  { id: 'param-A4-v3', archetype: 'A4', params: { split_ratio: '70/30' },
    section: A4_SECTION, topic: 'A4 · split 70/30',
    signature: '左栏 70% 深色满版主导 / 右栏 30% 收尾', pacing: '密-疏-收' },
  // A5 锚点数字 × 3 组 anchor_scale
  { id: 'param-A5-v1', archetype: 'A5', params: { anchor_scale: 2 },
    section: A5_SECTION, topic: 'A5 · anchor small(2em)',
    signature: '锚点数字收紧到 2em,证据栏主导', pacing: '疏-密-收' },
  { id: 'param-A5-v2', archetype: 'A5', params: { anchor_scale: 4 },
    section: A5_SECTION, topic: 'A5 · anchor normal(4em)',
    signature: '锚点数字 4em 占视觉中心', pacing: '密-疏-收' },
  { id: 'param-A5-v3', archetype: 'A5', params: { anchor_scale: 6 },
    section: A5_SECTION, topic: 'A5 · anchor huge(6em)',
    signature: '锚点数字 6em 满版巨字', pacing: '密-密-收' },
  // A8 机制 × 3 组 density_tier
  { id: 'param-A8-v1', archetype: 'A8', params: { density_tier: 'compact' },
    section: A8_SECTION, topic: 'A8 · density compact',
    signature: '前后单栏堆叠,箭头变分隔条', pacing: '密-密-收' },
  { id: 'param-A8-v2', archetype: 'A8', params: { density_tier: 'normal' },
    section: A8_SECTION, topic: 'A8 · density normal',
    signature: '左右双面板 + 中间箭头', pacing: '疏-密-收' },
  { id: 'param-A8-v3', archetype: 'A8', params: { density_tier: 'airy' },
    section: A8_SECTION, topic: 'A8 · density airy',
    signature: '前/箭头列/后三栏分离 + 宽 gap', pacing: '疏-疏-收' },
];

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const v of VARIANTS) {
    // 单 section input:content_type 显式,off_template 避免强制 style-gap 契约
    // (assembleDeck 的 requireOffTemplateContract 只在 off_template=true 时校验)
    const input = {
      topic: v.topic,
      voice: 'editorial-serif',
      evidence_status: 'illustrative',
      sections: [Object.assign({}, v.section, {
        // 把 variant_params 注入 section 层:content-router 的 routeSection 会
        // 透传 section 上的字段;但 variant_params 由 VARIANT_RULES 推导。
        // 这里直接在 section 上预设 variant_params + variant_hint,
        // routeDeck 会把它们带上(见 content-router routeSection:不覆盖预设)。
        variant_params: v.params,
        variant_hint: `参数化变体 ${JSON.stringify(v.params)}`,
      })],
    };
    const html = assembleDeck(input, { routes: [{
      index: 0,
      title: v.section.title,
      body: v.section.body || '',
      content_type: v.section.content_type,
      archetype: v.archetype,
      archetype_name: v.archetype,
      reason: '回归用单页',
      variant_hint: input.sections[0].variant_hint,
      variant_params: v.params,
      fallback_chapter: false,
    }], deck_check: { archetype_count: 1, variant_count: 1, variant_invented: true, hint: '回归单页' }, warnings: [] });
    const withBrief = embedBrief(html, minimalBrief(v.topic, v.signature, v.pacing));
    const out = path.join(OUT_DIR, `${v.id}.html`);
    fs.writeFileSync(out, withBrief);
    console.log(`✅ ${v.id} → ${path.relative(ROOT, out)}`);
  }
  console.log(`\n共生成 ${VARIANTS.length} 个参数化变体 deck → ${path.relative(ROOT, OUT_DIR)}/`);
}

if (require.main === module) main();
module.exports = { VARIANTS, minimalBrief, embedBrief };
