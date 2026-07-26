#!/usr/bin/env node
'use strict';
/* eslint-disable */

/**
 * generate-archetype-deck.js — 端到端:内容 → archetype 路由 → deck.html
 * ====================================================================
 * 完整实现 ② 内容路由层的"最后一公里":把 content-router 的路由结果
 * (archetype + variant)落成真实可渲染的单文件 deck.html。
 *
 * 全链路(四层架构闭合):
 *   结构化内容 → content-router 路由(②) → A1-A12 archetype 骨架(①)
 *   → 套 token(③,内联) → deck.html → lint/visual-verdict 校验(④)
 *
 * 实验性生成器(非交付模板):证明"内容不在 10 template 覆盖也能靠
 * archetype 组合生成高质量 deck"。产物放 output/(gitignore),不进 examples/。
 *
 * 内容填充层(任意文稿 → deck):
 *   - 8 个吃结构化字段的 archetype(A3/A5/A6/A7/A8/A9/A10/A11)缺字段时,
 *     extractFields 从自由文本 body 补救抽取;抽不出 → 降级 A4 消费 body,不渲染空网格
 *   - 无法自动分类的段落(fallback_chapter)不再整 deck throw:按 A4 渲染 +
 *     生成报告列「待人工标注段落」(routeReportLines)
 *   - 每个 <section> 带 data-archetype="A1"…"A12"(供 design-strength-check 节奏检测)
 *
 * voice 签名表达层(Wave 2,破「12 voice = 同骨架换配色」):
 *   - <body> 带 voice-<name> class;VOICE_SIGNATURES 每 voice 一段签名 CSS 覆盖层
 *     (注入 <style> 末尾),把 voices.json note 承诺的签名组件(launch 设备框/cue stack、
 *     technical swimlane/console、illustrated sticker notes、retro memphis grid/ticket、
 *     brutalist 硬边框、data 终端读数、consulting 报头双线/档案章…)落成真实 CSS
 *   - sectionClass 名单落在 <section> 上(供 design-strength nativeSignals 识别);
 *     dimensions.weight/motion 推导通用气质层(字重/边框硬度/fragment 动效标记)
 *   - 变体参数消费:panel_ratio(A8 面板比)/node_density(A3 非均匀节点)/anchor_scale
 *     (A5 锚点字号)/verdict_scale(A6 裁决字号)/highlight_col(A9 高亮列),全部 params
 *     同时以 data-variant 属性落 section 供后续消费
 *
 * 用法:
 *   node scripts/generate-archetype-deck.js --demo [out.html]
 *   node scripts/generate-archetype-deck.js input.json [out.html]
 */

const fs = require('fs');
const path = require('path');
const { routeDeck } = require('./content-router');

const ROOT = path.resolve(__dirname, '..');
const TOKENS_DIR = path.join(ROOT, 'tokens');
const PPTX_CLIENT_PATH = path.join(ROOT, 'scripts', 'export-pptx-client.js');

// voice → Google Fonts URL
// 单一真相源:tokens/voices.json(经 build-voice-tokens.js 编译)+ legacy 字体映射。
// 加新 voice = voices.json 加一条 + `node scripts/build-voice-tokens.js`,无需改这里。
const { build: buildVoiceRegistry, loadRegistry } = require('./build-voice-tokens');
// registry 按名索引:取 dimensions(weight/motion 气质坐标)推导通用签名层
const REGISTRY_BY_NAME = {};
for (const v of loadRegistry().voices || []) REGISTRY_BY_NAME[v.name] = v;
const VOICE_FONTS = (() => {
  const registryFonts = buildVoiceRegistry({ dry: true }).fontMap; // { voiceName: googleFontsUrl }
  const legacy = {
    'editorial-serif': 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Source+Serif+4:opsz,wght@8..60,400&family=Noto+Serif+SC:wght@400;600&family=Noto+Sans+SC:wght@400&family=Courier+Prime:wght@400&display=swap',
    'chinese-ink-wash': 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=Noto+Sans+SC:wght@400;500;700&family=Courier+Prime:wght@400;700&display=swap',
  };
  return Object.assign({}, registryFonts, legacy);
})();
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function readTokensInline(voice) {
  const base = fs.readFileSync(path.join(TOKENS_DIR, 'base.css'), 'utf8');
  const tokenPath = path.join(TOKENS_DIR, `${voice}.css`);
  if (!fs.existsSync(tokenPath)) {
    throw new Error(`Missing style token primitive: tokens/${voice}.css. Supported: ${Object.keys(VOICE_FONTS).join(', ')}.`);
  }
  const prim = fs.readFileSync(tokenPath, 'utf8');
  return base + '\n' + prim;
}

function readPptxClientInline() {
  return fs.readFileSync(PPTX_CLIENT_PATH, 'utf8').replace(/<\/script/gi, '<\\/script');
}

function evidenceStatus(s, input) {
  return s.evidence_status || input.evidence_status || 'illustrative';
}

function requireFields(kind, section, fields) {
  const missing = fields.filter(field => !section[field]);
  if (missing.length) {
    throw new Error(`Missing ${kind} fields: ${missing.join(', ')}`);
  }
}

function requireOffTemplateContract(input, routed) {
  const isOffTemplate = input.off_template || Boolean(input.style_gap);
  if (!isOffTemplate) return;
  const gap = input.style_gap || {};
  const missing = ['inspiration_case', 'token', 'content_rewrite', 'layout_variant']
    .filter(field => !gap[field]);
  if (missing.length) {
    throw new Error(`Missing style-gap contract fields: ${missing.join(', ')}`);
  }
  if (gap.token !== input.voice) {
    throw new Error(`Style-gap token must match voice: ${gap.token || '(missing)'} != ${input.voice}`);
  }
}

// 无法自动分类的段落(fallback_chapter)不再整 deck throw:
// 显式按 A4(chapter/满版分割)渲染并消费 body,同时列入「待人工标注段落」
// 报告(见 routeReportLines),提示人工补 content_type / 结构化字段。
function listImplicitFallbacks(routed) {
  return routed.routes.filter(r => r.fallback_chapter).map(r => ({
    index: r.index,
    title: r.title,
    body_preview: String(r.body || '').replace(/\s+/g, ' ').slice(0, 40),
  }));
}

// 生成报告行:序列 warning + 待人工标注段落 + 字段抽取失败降级段落。
// 须在 assembleDeck 之后调用(degraded 标记在渲染期才打上)。
function routeReportLines(routed) {
  const lines = [];
  for (const w of routed.warnings || []) lines.push(`   ⚠ ${w}`);
  const fallbacks = listImplicitFallbacks(routed);
  if (fallbacks.length) {
    lines.push('   ⚠ 待人工标注段落(无法自动分类,已按 A4 满版分割消费 body 渲染;建议补 content_type/结构化字段):');
    for (const f of fallbacks) lines.push(`     - [${f.index}] ${f.title || '(无标题)'} │ ${f.body_preview}`);
  }
  const degraded = routed.routes.filter(r => r.degraded);
  if (degraded.length) {
    lines.push('   ⚠ 字段抽取失败已降级为 A4 消费 body(原路由缺结构化字段且无法从文本抽取):');
    for (const r of degraded) lines.push(`     - [${r.index}] ${r.archetype} ${r.title || '(无标题)'}`);
  }
  return lines;
}

// ── 文本 → 结构化字段 轻量抽取(优雅降级)──
// 8 个吃只读结构化字段的 archetype(A3 nodes / A5 number+evidence / A6 对峙值 /
// A7 kpis / A8 前后 items / A9 rows / A10 quote / A11 items)缺字段时,先从自由
// 文本 body 补救抽取;抽不出来 → 返回 null,调用方降级为消费 body 的 A4 版式,
// 绝不渲染空网格。
// 启发式局限(有意保守):只认常见中文书写习惯 —— 句首年份/日期、「数字+单位」
// 短语、vs/对比、引号句、→ 链;跨句表格、隐含对照等复杂语义抽不准,拿不准一律
// 降级,不硬抽。

// 「数字+单位」短语:每子句取第一个数字,label 取数字前的短修饰语
function extractNumberPhrases(body) {
  const out = [];
  const clauses = String(body || '').split(/[\n;；,，。]/).map(x => x.trim()).filter(Boolean);
  for (const c of clauses) {
    const m = c.match(/\d+(?:\.\d+)?\s*(?:%|万|亿|倍|项|个|家|次|天|人|台|条|公里|元|分|小时|pp)?/);
    if (m) {
      const label = c.replace(m[0], '').replace(/^[\s的:：为达至到]+|[\s的了。达至到]+$/g, '').trim();
      out.push({ label: label.slice(0, 12) || '指标', value: m[0].trim() });
    }
  }
  return out;
}

function extractFields(s, archetype) {
  const body = String(s.body || '');
  const text = `${s.title || ''} ${body}`;
  const clauses = body.split(/[\n;；,，]/).map(x => x.trim()).filter(Boolean);
  switch (archetype) {
    case 'A3': { // 日期/年份行 → nodes
      const nodes = [];
      for (const c of clauses) {
        const m = c.match(/((?:19|20)\d{2}\s*年?|\d{1,2}\s*月\s*\d{1,2}\s*日?|\d{1,2}\s*月)\s*[·:：\-—]?\s*(.*)/);
        if (m) nodes.push({ year: m[1].trim(), title: (m[2] || '').slice(0, 18) || m[1].trim(), desc: '' });
      }
      return nodes.length >= 2 ? { nodes } : null;
    }
    case 'A5': { // 大数字 → number;其余数字短语 → evidence
      const m = body.match(/\d+(?:\.\d+)?\s*(?:%|万|亿|倍)/) || body.match(/\d[\d,]{3,}/);
      if (!m) return null;
      const evidence = extractNumberPhrases(body).filter(p => p.value !== m[0]).slice(0, 3)
        .map(p => ({ k: p.label, v: p.value }));
      return { number: m[0], label: s.title || '', event: s.title || '', evidence };
    }
    case 'A6': { // 「A 数值 vs B 数值 / A 对比 B」→ 对峙标签 + 首两个数字做对峙值
      const vsSrc = /(?:vs\.?|versus|对比|对照)/i.test(body) ? body : text; // 优先在 body 里切(title 里的"对比"不是对峙点)
      const parts = vsSrc.split(/\s*(?:vs\.?|versus|对比|对照)\s*/i);
      if (parts.length < 2) return null;
      const grab = (txt) => {
        const m = String(txt).match(/\d+(?:\.\d+)?\s*(?:%|万|亿|倍|分钟|小时|天|元|个|项|公里)?/);
        if (!m) return null;
        const label = String(txt).replace(m[0], '').replace(/^[\s的为达至到]+|[\s的了。达至到]+$/g, '').trim();
        return { label: label.slice(0, 10), value: m[0].trim() };
      };
      const a = grab(parts[0]);
      const b = grab(parts.slice(1).join(' '));
      if (!a || !b) return null;
      const aNum = parseFloat(a.value), bNum = parseFloat(b.value);
      const verdict = (isFinite(aNum) && isFinite(bNum) && bNum !== 0)
        ? (a.value.includes('%') && b.value.includes('%')
          ? `${(aNum - bNum) > 0 ? '+' : ''}${(aNum - bNum).toFixed(1)}pp`
          : `${(aNum / bNum).toFixed(1)}×`)
        : '';
      return {
        a_label: a.label || 'A', b_label: b.label || 'B',
        a_value: a.value, b_value: b.value,
        verdict, verdict_note: '',
      };
    }
    case 'A7': { // 数字组(≥2 个数字短语)→ kpis
      const nums = extractNumberPhrases(body);
      return nums.length >= 2 ? { kpis: nums.slice(0, 4).map(p => ({ label: p.label, value: p.value, note: '' })) } : null;
    }
    case 'A8': { // → 链 → 前/后 items
      const segs = body.split(/\s*(?:→|->)\s*/).map(x => x.trim()).filter(Boolean);
      if (segs.length < 2) return null;
      const before = segs[0].split(/[\n;；,，]/).map(x => x.trim()).filter(Boolean);
      const after = segs.slice(1).join(';').split(/[\n;；,，]/).map(x => x.trim()).filter(Boolean);
      if (!before.length || !after.length) return null;
      const red = body.match(/(?:降低|减少|提升|增加|下降|缩短)\s*\d+(?:\.\d+)?\s*(?:%|倍)?/);
      return { before_items: before, after_items: after, reduction: red ? red[0] : '' };
    }
    case 'A9': { // | 分隔行 或 多数字子句 → rows
      let rows = [];
      const pipeLines = body.split(/\n/).filter(l => (l.match(/\|/g) || []).length >= 1);
      if (pipeLines.length >= 2) {
        rows = pipeLines.map(l => l.split('|').map(c => c.trim()).filter(Boolean));
      } else {
        rows = clauses.map(c => {
          const nums = extractNumberPhrases(c);
          return nums.length ? [c.replace(/[\d.,%\s]/g, '').slice(0, 10) || nums[0].label, ...nums.map(p => p.value)] : null;
        }).filter(r => r && r.length >= 2);
      }
      if (rows.length < 2) return null;
      const width = Math.max(...rows.map(r => r.length));
      const headers = ['项目', ...Array.from({ length: width - 1 }, (_, i) => `数值 ${i + 1}`)];
      return { headers, rows, highlight_col: 1 };
    }
    case 'A10': { // 引号句 → quote(含弯引号);表示/指出 前缀 → who
      const q = body.match(/["「『“‘]([^"」』”’]{4,})["」』”’]/);
      if (!q) return null;
      const who = body.match(/([^\s,，。:：]{2,10}?)(?:表示|指出|认为|说道|评价)/);
      return { quote: q[1], who: who ? who[1] : (s.who || ''), role: s.role || '' };
    }
    case 'A11': { // 编号列表/多子句 → items(编号可跨行也可同行内联;lookbehind 防小数/百分数误判)
      const numbered = body.split(/\n/).map(l => l.match(/^\s*[1-9][.、)]\s*(.+)/)).filter(Boolean).map(m => m[1].trim());
      const inline = (body.match(/(?<![\d.])[1-9][.、)]\s*[^;；,，\n]+/g) || [])
        .map(x => x.replace(/^\s*[1-9][.、)]\s*/, '').trim()).filter(Boolean);
      const src = numbered.length >= 2 ? numbered : (inline.length >= 2 ? inline : clauses);
      if (src.length < 2) return null;
      return { items: src.slice(0, 4).map(c => { const p = c.split(/[:：—-]/); return { t: (p[0] || c).slice(0, 14), d: (p[1] || '').slice(0, 40) }; }) };
    }
    default: return null;
  }
}

// 各 archetype 的最低字段契约:缺这些字段就渲染不出内容(空网格)
const REQUIRED_FIELDS = {
  A3: s => Array.isArray(s.nodes) && s.nodes.length > 0,
  A5: s => Boolean(s.number),
  A6: s => Boolean(s.a_value && s.b_value),
  A7: s => Array.isArray(s.kpis) && s.kpis.length > 0,
  A8: s => (Array.isArray(s.before_items) && s.before_items.length > 0) || (Array.isArray(s.after_items) && s.after_items.length > 0),
  A9: s => Array.isArray(s.rows) && s.rows.length > 0,
  A10: s => Boolean(s.quote), // 只认显式 quote;缺失时先抽取引号句,抽不出再沿用 body(fillArchetype A10 特例)
  A11: s => Array.isArray(s.items) && s.items.length > 0,
};

// body 按换行/分号拆段(A4 满版分割消费自由文本用)
function bodyLines(body) {
  const lines = String(body || '').split(/[\n;；]+/).map(x => x.trim()).filter(Boolean);
  return lines.length ? lines : [''];
}

// ── per-voice 签名覆盖层(Wave 2)──
// Wave 1 末诊断:同一骨架套 12 个 registry voice,归一化色值后 diff 只剩 1 行 ——
// voice 间唯一差异是颜色 + display serif/sans 二选一;voices.json note 承诺的签名
// 组件从未渲染,dimensions 的 weight/motion 维度零排版表达。本层把 note 落成真实 CSS:
//   - 每 voice 一段签名 CSS 覆盖层(注入 <style> 末尾,只覆盖不重建骨架)
//   - sectionClass:签名 class 名单,落在 <section> class 上(供 design-strength
//     nativeSignals 识别 —— 命名对齐既有原语词根:memphis/sticker/console/terminal)
// 约束(物理契约):只用该 voice token 变量(var(--c-*)/var(--f-*)),不引入新硬编码
// 色值;不碰 section position/display,不用 vw/vh;覆盖 inline 骨架样式才用 !important
// (覆盖层语义),且只用于边框/背景类非排字属性。遗留 voice(editorial-serif 等)不在
// registry,无 dimensions,保持 token 层差异,不强行签名。
const VOICE_SIGNATURES = {
  // launch「舞台现场,设备框 + cue stack」(weight 5 / motion 4)
  launch: {
    sectionClass: { '*': 'device-frame' },
    css: `.voice-launch .device-frame{outline:1px solid var(--c-border);outline-offset:-0.55em;}
.voice-launch .kicker{border-bottom:2px solid var(--c-accent);padding-bottom:0.25em;}
.voice-launch .pin,.voice-launch .evidence-label{border:1px solid var(--c-border);background:var(--c-bg-paper);padding:0.3em 0.7em;}
.voice-launch h1,.voice-launch h2,.voice-launch h3{font-weight:700;}`,
  },
  // technical「控制室 console,swimlane + failure rail」(weight 4 / motion 2)
  technical: {
    sectionClass: { '*': 'console-chrome', A3: 'swimlane' },
    css: `.voice-technical .console-chrome{box-shadow:inset 4px 0 0 var(--c-border);}
.voice-technical .kicker{background:var(--c-fg);color:var(--c-bg);padding:0.28em 0.65em;}
.voice-technical .pin{border-top:2px solid var(--c-accent);padding-top:0.35em;}
.voice-technical .swimlane h4{border-left:2px solid var(--c-fg);padding-left:0.5em;}
.voice-technical .swimlane p{border-left:2px solid var(--c-border);padding-left:0.5em;}
.voice-technical table{border:1px solid var(--c-border);}`,
  },
  // illustrated「暖色亲近感,sticker notes + 轻微错位」(weight 4 / motion 3)
  illustrated: {
    sectionClass: { A7: 'sticker-notes', A11: 'sticker-notes' },
    css: `.voice-illustrated .sticker-notes .sig-grid>div{border:2px dashed var(--c-fg-3) !important;border-radius:0.6em;box-shadow:0.12em 0.14em 0 var(--c-border);padding:0.9em !important;}
.voice-illustrated .sticker-notes .sig-grid>div:nth-child(odd){transform:rotate(-0.6deg);}
.voice-illustrated .sticker-notes .sig-grid>div:nth-child(even){transform:rotate(0.5deg);}
.voice-illustrated .kicker{border:1.5px dashed var(--c-accent);border-radius:1em;padding:0.25em 0.7em;align-self:flex-start;}`,
  },
  // retro「几何撞色,memphis grid + ticket」(weight 6 / motion 4)
  retro: {
    sectionClass: { '*': 'memphis-grid', A12: 'ticket' },
    css: `.voice-retro .memphis-grid{background-image:repeating-linear-gradient(0deg,var(--c-rule) 0,var(--c-rule) 1px,transparent 1px,transparent 2.6em),repeating-linear-gradient(90deg,var(--c-rule) 0,var(--c-rule) 1px,transparent 1px,transparent 2.6em);}
.voice-retro .sig-grid>div{box-shadow:0.22em 0.22em 0 var(--c-fg);}
.voice-retro .ticket .stamp{border-width:3px !important;border-style:dashed !important;padding:0.5em 1em !important;box-shadow:0.25em 0.25em 0 var(--c-fg);}
.voice-retro h1,.voice-retro h2,.voice-retro h3{font-weight:700;}`,
  },
  // brutalist「裸露硬边框 + 荧光警示,uppercase」(weight 7 / motion 1)
  brutalist: {
    sectionClass: { '*': 'hard-frame' },
    css: `.voice-brutalist .hard-frame{box-shadow:inset 0 0 0 3px var(--c-fg);}
.voice-brutalist .kicker{background:var(--c-fg);color:var(--c-bg);padding:0.28em 0.6em;text-transform:uppercase;letter-spacing:0.16em;}
.voice-brutalist h1,.voice-brutalist h2,.voice-brutalist h3{font-weight:700;text-transform:uppercase;letter-spacing:0.01em;}
.voice-brutalist .sig-grid>div{border-width:3px !important;box-shadow:0.25em 0.25em 0 var(--c-fg);}`,
  },
  // data「深色仪表盘,图表墙 + 标注承载结论」→ 终端读数面板化(weight 4 / motion 2)
  data: {
    sectionClass: { A5: 'terminal-readout', A7: 'terminal-readout', A9: 'terminal-readout' },
    css: `.voice-data .terminal-readout{outline:1px solid var(--c-border);outline-offset:-0.5em;}
.voice-data .pin,.voice-data .evidence-label{border:1px solid var(--c-border);background:var(--c-bg-paper);padding:0.3em 0.65em;}
.voice-data .sig-grid>div{border-top:3px solid var(--c-accent) !important;}
.voice-data table{border:1px solid var(--c-border);}
.voice-data th{border-bottom-width:3px !important;}`,
  },
  // consulting「决策 memo 气质」→ 报头双线 + 档案章(weight 4 / motion 1)
  consulting: {
    sectionClass: { '*': 'memo-head', A12: 'archive-stamp' },
    css: `.voice-consulting .memo-head{box-shadow:inset 0 3px 0 var(--c-fg),inset 0 5px 0 var(--c-bg),inset 0 6px 0 var(--c-fg);}
.voice-consulting .archive-stamp .stamp{border-color:var(--c-stamp) !important;color:var(--c-stamp) !important;border-radius:50%;padding:0.9em !important;transform:rotate(-4deg);}
.voice-consulting .kicker{letter-spacing:0.22em;}
.voice-consulting h1,.voice-consulting h2,.voice-consulting h3{font-weight:600;}`,
  },
  // minimal「极端留白,一句主张占视觉中心」→ 去装饰:正立、轻字重、宽字距(weight 3 / motion 1)
  minimal: {
    sectionClass: { '*': 'quiet-frame' },
    css: `.voice-minimal .reveal section *{font-style:normal !important;}
.voice-minimal h1,.voice-minimal h2,.voice-minimal h3{font-weight:500;letter-spacing:0.02em;}
.voice-minimal .kicker{letter-spacing:0.3em;}
.voice-minimal .pin,.voice-minimal .evidence-label{opacity:0.65;}`,
  },
  // education「田野清新,lesson path + worksheet」→ 圆角标签 + worksheet 虚线格(weight 4 / motion 2)
  education: {
    sectionClass: { '*': 'lesson-path' },
    css: `.voice-education .kicker{border:1.5px solid var(--c-accent);border-radius:1em;padding:0.25em 0.7em;align-self:flex-start;}
.voice-education .sig-grid>div{border-radius:0.7em;}
.voice-education .lesson-path td{border-bottom-style:dashed !important;}
.voice-education h1,.voice-education h2,.voice-education h3{font-weight:600;}`,
  },
  // pitch「判断路径可视化,problem→traction→ask」→ accent 路标 chip + 加重顶边(weight 5 / motion 3)
  pitch: {
    sectionClass: { '*': 'pitch-path' },
    css: `.voice-pitch .kicker{background:var(--c-accent);color:var(--c-bg);padding:0.3em 0.7em;font-weight:600;align-self:flex-start;}
.voice-pitch .sig-grid>div{border-top-width:5px !important;}
.voice-pitch h1,.voice-pitch h2,.voice-pitch h3{font-weight:700;}`,
  },
  // editorial「视觉报道,feature spread + art block + 栏目节奏」→ 栏目标题/首字下沉/画框(weight 4 / motion 1)
  editorial: {
    sectionClass: { '*': 'feature-spread' },
    css: `.voice-editorial .kicker{font-family:var(--f-display);font-style:italic;text-transform:none;letter-spacing:0.06em;font-size:0.62em;}
.voice-editorial section[data-archetype="A2"] p::first-letter{font-family:var(--f-display);font-size:2.8em;line-height:0.9;float:left;padding-right:0.12em;color:var(--c-accent);}
.voice-editorial section[data-archetype="A4"]>div:first-child{box-shadow:inset 0 0 0 0.45em var(--c-fg),inset 0 0 0 calc(0.45em + 1px) var(--c-bg);}
.voice-editorial h1,.voice-editorial h2,.voice-editorial h3{font-weight:600;}`,
  },
  // luxury「深底金调,plinth + material rail + lookbook 留白」→ 金字轨道 + 轻字重宽字距(weight 3 / motion 1)
  luxury: {
    sectionClass: { '*': 'plinth' },
    css: `.voice-luxury .plinth{box-shadow:inset 1px 0 0 var(--c-accent);}
.voice-luxury h1,.voice-luxury h2,.voice-luxury h3{font-weight:400;letter-spacing:0.06em;}
.voice-luxury .kicker{letter-spacing:0.34em;}
.voice-luxury .pin,.voice-luxury .evidence-label{letter-spacing:0.2em;}`,
  },
};

// motion ≥4 → fragment fade-up 默认开启的标记 CSS(配 body.voice-motion-high;
// 生成的骨架暂产不出 fragment,此为下游手工/后续消费层的默认动效契约;
// prefers-reduced-motion 媒体查询(!important)仍优先,动效可被系统关闭)
const MOTION_FRAGMENT_CSS = `.voice-motion-high .reveal .fragment{opacity:0;transform:translateY(0.35em);transition:opacity .45s var(--ease),transform .45s var(--ease);}
.voice-motion-high .reveal .fragment.visible{opacity:1;transform:none;}`;

// dimensions 推导的通用气质层:weight ≥6 → 更粗 display 字重 + 更硬边框;
// weight ≤3 → 更轻字重 + 宽字距。先于手写签名注入(同优先级后者胜,签名可精修)。
function dimensionCss(name, dim) {
  const v = `.voice-${name}`;
  if (dim.weight >= 6) return `${v} h1,${v} h2,${v} h3{font-weight:700;}${v} .sig-grid>div{border-width:2px !important;}`;
  if (dim.weight <= 3) return `${v} h1,${v} h2,${v} h3{font-weight:400;letter-spacing:0.04em;}`;
  return '';
}

// 合成 voice 签名:{ css(通用气质层 + 手写签名 + motion 标记), sectionClass, motionHigh }
const signatureCache = {};
function buildVoiceSignature(voice) {
  if (signatureCache[voice]) return signatureCache[voice];
  const reg = REGISTRY_BY_NAME[voice];
  const dim = reg && reg.dimensions;
  const sig = VOICE_SIGNATURES[voice] || null;
  let css = '';
  if (dim) css += dimensionCss(voice, dim) + '\n';
  if (sig) css += sig.css + '\n';
  const motionHigh = Boolean(dim && dim.motion >= 4);
  if (motionHigh) css += MOTION_FRAGMENT_CSS + '\n';
  signatureCache[voice] = { css, sectionClass: (sig && sig.sectionClass) || {}, motionHigh };
  return signatureCache[voice];
}

// section 签名 class:通配('*')+ 按 archetype 命中,拼进 class 属性
function sigSectionClasses(route, input) {
  const sc = buildVoiceSignature(input.voice).sectionClass;
  const out = [];
  if (sc['*']) out.push(sc['*']);
  if (sc[route.archetype]) out.push(sc[route.archetype]);
  return out.length ? ' ' + out.join(' ') : '';
}

// 变体参数落 data-variant 属性:未被版式直接消费的 params 也不丢,供后续消费层读取
function dataVariantAttr(route) {
  const p = route.variant_params;
  if (!p) return '';
  const s = Object.keys(p).map(k => `${k}:${p[k]}`).join(';');
  return ` data-variant="${esc(s)}"`;
}

// ── 参数化版式层(Wave 3,破「同 archetype 不同 deck 几何逐字节相同」)──
// Wave 2 末诊断:13 个 archetype 各一段写死 inline-style HTML,同 archetype 不同
// deck 的几何结构(paddng/字号 clamp/网格列数)逐字节相同;5 个旧旋钮
// (node_density/anchor_scale/verdict_scale/panel_ratio/highlight_col)只覆盖 5 个
// archetype 的单点,且只改 CSS 值不改 DOM 结构——skeleton-diff 签名(class+标签)
// 不变,无法证明「真改了几何」。本层统一暴露三组参数(所有 archetype 都能读):
//   --split-ratio   主分割比(满版分割左右比/横轴节点间距比/对峙双方面积比),
//                   值如 "38/62" / "1fr 2fr" / "40%"
//   --align-axis    主对齐轴(left/center/right,或 grid 轴序),影响内容主轴对齐
//   --density-tier  密度档(compact/normal/airy),影响 padding/字号 clamp/行距
// 注入:section 级 inline style 声明三组变量(默认值 = 现有硬编码值,不传参时产出
// 不变 —— 回归保护);消费:各 case 用 var(--x, <现有默认>) 取值。
// 关键:三组参数除改 CSS 值外,还落一个结构 class token(如 split-30-70 /
// density-compact / axis-left),让 skeleton-diff 的签名(直接子元素标签+全部
// class 排序)真分叉 —— 参数不同 = DOM 结构不同构,不只是颜色/字号微调。

// 三组参数的默认值(= 各 archetype 现有硬编码值;不传参时产出不变)
const DEFAULT_SPLIT = '42/58';   // A4 满版分割左 42% / 右 58%(现有硬编码)
const DEFAULT_AXIS = 'left';     // 现有内容主轴对齐
const DEFAULT_DENSITY = 'normal';// 现有 padding/clamp 档

// 密度档 → 具体几何映射(compact:padding 收紧 + clamp 收紧;airy:相反)
// 各 archetype 消费时取档 → 映射到 padding/em 值;normal = 现有硬编码。
function densityMap(tier) {
  switch (tier) {
    case 'compact': return { padMul: 0.72, gapMul: 0.78, clampTighten: 0.88, lineTighten: 1.04 };
    case 'airy':    return { padMul: 1.28, gapMul: 1.22, clampTighten: 1.12, lineTighten: 0.94 };
    case 'normal':
    default:        return { padMul: 1.0, gapMul: 1.0, clampTighten: 1.0, lineTighten: 1.0 };
  }
}

// split_ratio 字符串 → 结构化(支持 "30/70" / "1fr 2fr" / "40%" 三种写法)
// 返回 { left, right, leftClass, rightClass }:left/right 是宽度/flex 值,
// leftClass/rightClass 是落 class 的 token(skeleton-diff 看得到结构分叉)。
function parseSplitRatio(raw) {
  const s = String(raw || '').trim();
  // "30/70" 或 "30:70"
  const slash = s.match(/^(\d+(?:\.\d+)?)\s*[/:：]\s*(\d+(?:\.\d+)?)$/);
  if (slash) {
    const a = parseFloat(slash[1]), b = parseFloat(slash[2]);
    const la = Math.round(a), lb = Math.round(b);
    return {
      left: `${a}%`, right: `${b}%`,
      leftClass: `split-l${la}`, rightClass: `split-r${lb}`,
      a, b,
    };
  }
  // "1fr 2fr" / "1fr 2fr 1fr"(grid 模板;取前两段作左右)
  const fr = s.match(/^(\d+(?:\.\d+)?)fr\s+(\d+(?:\.\d+)?)fr/);
  if (fr) {
    const a = parseFloat(fr[1]), b = parseFloat(fr[2]);
    return {
      left: `${a}fr`, right: `${b}fr`,
      leftClass: `split-fr${a}`, rightClass: `split-fr${b}`,
      a, b,
    };
  }
  // "40%"(单值 → 左 40% 右 60%)
  const pct = s.match(/^(\d+(?:\.\d+)?)%$/);
  if (pct) {
    const a = parseFloat(pct[1]), b = 100 - a;
    return {
      left: `${a}%`, right: `${b}%`,
      leftClass: `split-l${Math.round(a)}`, rightClass: `split-r${Math.round(b)}`,
      a, b,
    };
  }
  return null; // 无法解析
}

// align_axis → 结构 class token(落子元素 class,让签名分叉)
function axisClass(axis) {
  switch (String(axis || '').trim()) {
    case 'center': return 'axis-center';
    case 'right':  return 'axis-right';
    case 'left':
    default:       return 'axis-left';
  }
}

// 从 route 解析三组参数(含默认值回退);同时保留旧 5 旋钮向后兼容。
// @returns {{ splitRatio:string, axis:string, density:string, split:object|null,
//            axisCls:string, densityCls:string, dm:object, splitCls:string }}
function resolveVariantParams(route) {
  const p = (route && route.variant_params) || {};
  const splitRatio = p.split_ratio || DEFAULT_SPLIT;
  const axis = p.align_axis || DEFAULT_AXIS;
  const density = p.density_tier || DEFAULT_DENSITY;
  const split = parseSplitRatio(splitRatio);
  const axisCls = axisClass(axis);
  const densityCls = `density-${density}`;
  const dm = densityMap(density);
  const splitCls = split ? `${split.leftClass} ${split.rightClass}` : '';
  return { splitRatio, axis, density, split, axisCls, densityCls, dm, splitCls };
}

// section 级 CSS 变量声明(注入 wrap 的 style 头;默认值 = 现有硬编码,不传参不变)
function paramCssVars(route) {
  const P = resolveVariantParams(route);
  return `--split-ratio:${P.splitRatio};--align-axis:${P.axis};--density-tier:${P.density};`;
}

// 参数结构 class(拼进 section 或关键子元素的 class,让 skeleton-diff 签名分叉)
// 落 section 级:axis + density(split 落具体子元素,见各 case)
function paramSectionClass(route) {
  const P = resolveVariantParams(route);
  return ` ${P.axisCls} ${P.densityCls}`;
}

// ── 12 archetype fill(对齐 references/layout-archetypes.md 骨架,token 化)──
function fillArchetype(route, s, idx, total, input = {}) {
  const num = String(idx + 1).padStart(2, '0');
  // 字段契约 + 优雅降级:8 个吃只读结构化字段的 archetype(A3/A5/A6/A7/A8/A9/A10/A11)
  // 缺字段时,先 extractFields 从 body 补救抽取;仍缺 → 递归按 A4 满版分割渲染并
  // 消费 body(route.degraded 标记,进生成报告),绝不渲染空网格。
  const needs = REQUIRED_FIELDS[route.archetype];
  if (needs && !needs(s)) {
    const extracted = extractFields(s, route.archetype);
    const merged = extracted ? Object.assign({}, s, extracted) : null;
    if (merged && needs(merged)) {
      s = merged;
      route.extracted_fields = Object.keys(extracted).join(',');
    } else if (route.archetype === 'A10' && s.body) {
      // A10 特例:抽不出引号句但 body 在 → 沿用 body 渲染(非空网格),不降级
    } else {
      route.degraded = true;
      // 降级后按 A4 渲染,原 archetype 的变体参数一并作废(不消费、不落 data-variant)
      return fillArchetype(Object.assign({}, route, { archetype: 'A4', variant_hint: null, variant_params: null }), s, idx, total, input);
    }
  }
  const v = route.variant_hint ? `<!-- variant:${esc(route.variant_hint)} -->` : '';
  const vAttr = dataVariantAttr(route);          // 变体参数落属性(供后续消费)
  const sigCls = sigSectionClasses(route, input); // voice 签名 class(供 nativeSignals)
  const evArr = Array.isArray(s.evidence) ? s.evidence : [];
  const evFirst = evArr[0];
  const evStatus = evFirst ? (evFirst.status || evidenceStatus(s, input)) : evidenceStatus(s, input);
  const evidence = evFirst
    ? `<div class="evidence-label" data-evidence-id="${esc(evFirst.id || '')}" data-evidence-status="${esc(evStatus)}">${esc(evStatus)}</div>`
    : `<div class="evidence-label">${esc(evStatus)}</div>`;
  const P = resolveVariantParams(route); // 三组参数(默认值 = 现有硬编码,不传参产出不变)
  const wrap = (inner, cls = 'deck-flex', style = 'height:100%;') =>
    `<section class="${cls}${sigCls}${paramSectionClass(route)}" data-archetype="${route.archetype}"${vAttr} data-slide-id="${esc(s.id || '')}" data-background="var(--c-bg)" style="${paramCssVars(route)}${style}">${v}${evidence}${inner}<div class="pin">${num} / ${esc(route.content_type)}</div></section>`;

  switch (route.archetype) {
    // A1 Masthead Cover
    case 'A1': return wrap(`<div style="padding:1.1em 2.4em 0.6em;">
      <div style="border-top:3px double var(--c-fg);border-bottom:1px solid var(--c-fg);padding:0.5em 0 0.35em;display:flex;justify-content:space-between;font-family:var(--f-mono);font-size:0.52em;letter-spacing:0.16em;text-transform:uppercase;color:var(--c-fg-2);">
        ${(s.meta || ['VOL. 01', '2026', 'REPORT']).map(m => `<span>${esc(m)}</span>`).join('')}
      </div>
      <div style="font-family:var(--f-display);font-size:clamp(2.4em,4.6em,5.6em);font-weight:600;font-style:italic;line-height:1;color:var(--c-fg);margin-top:0.26em;">${esc(s.title)}</div>
      ${s.subtitle ? `<div style="font-family:var(--f-mono);font-size:0.68em;letter-spacing:0.28em;color:var(--c-accent);margin-top:0.35em;text-transform:uppercase;">${esc(s.subtitle)}</div>` : ''}
    </div>
    <div style="height:4px;background:var(--c-fg);"></div>
    <div style="padding:1em 2.4em;display:flex;gap:2em;flex:1;align-items:flex-start;">
      <div style="flex:1.5;font-family:var(--f-display);font-size:1.3em;font-style:italic;line-height:1.32;color:var(--c-fg-2);">${esc(s.body || '')}</div>
      <div style="flex:1;border-left:1px solid var(--c-border);padding-left:1.4em;">
        <div style="font-family:var(--f-mono);font-size:0.52em;letter-spacing:0.12em;text-transform:uppercase;color:var(--c-fg-2);margin-bottom:0.5em;">关键事实</div>
        ${(s.facts || []).map(f => `<div style="font-size:0.68em;margin:0.28em 0;color:var(--c-fg-2);"><b style="color:var(--c-fg);font-family:var(--f-mono);">${esc(f.k)}</b> ${esc(f.v)}</div>`).join('')}
      </div>
    </div>`, 'deck-flex', 'flex-direction:column;padding:0;height:100%;');

    // A2 Manifesto Statement
    case 'A2': return wrap(`<div class="kicker">${esc(s.title || '命题')}</div>
      <h1 style="margin:0.4em 0 0;font-family:var(--f-display);font-size:clamp(2.4em,3.6em,4.4em);font-weight:500;line-height:1.12;color:var(--c-fg);">
        ${s.emphasis ? `<em style="color:var(--c-accent);">${esc(s.emphasis)}</em>` : ''}${esc(s.body || '')}
      </h1>
      <div style="height:1px;background:var(--c-border);margin:1.1em 0;"></div>
      <p style="font-size:0.9em;max-width:50ch;color:var(--c-fg-2);">${esc(s.support || '')}</p>`, 'deck-flex', 'flex-direction:column;justify-content:center;padding:0 5em;height:100%;');

    // A3 Register Axis(variant:node_density=non-uniform → 关键节点列宽 1.6fr + 间距收紧)
    case 'A3': {
      const nd = route.variant_params && route.variant_params.node_density;
      const nodeCols = nd === 'non-uniform'
        ? (s.nodes || []).map(n => (n.accent ? '1.6fr' : '1fr')).join(' ')
        : `repeat(${Math.min((s.nodes || []).length, 6)},1fr)`;
      const nodeGap = nd === 'non-uniform' ? '10px' : '14px';
      return wrap(`<div class="kicker">${esc(s.title || '编年')}</div>
      <h2 style="font-family:var(--f-display);font-size:1.8em;margin:0.3em 0 0.4em;">${esc(s.subtitle || s.title || '')}</h2>
      <div style="position:relative;margin-top:2.2em;padding-top:1.4em;border-top:2px solid var(--c-fg);">
        <div style="display:grid;grid-template-columns:${nodeCols};gap:${nodeGap};">
          ${(s.nodes || []).map(n => `<div style="position:relative;padding-top:1.4em;">
            <div style="position:absolute;top:-1.85em;left:0;width:9px;height:9px;border-radius:50%;background:${n.accent ? 'var(--c-accent)' : 'var(--c-fg-3)'};"></div>
            <div style="font-family:var(--f-display);font-style:italic;font-size:1.5em;line-height:1;color:${n.accent ? 'var(--c-accent)' : 'var(--c-fg)'};">${esc(n.year)}</div>
            <h4 style="font-size:0.78em;margin:0.35em 0 0.2em;">${esc(n.title)}</h4>
            <p style="font-size:0.56em;color:var(--c-fg-2);">${esc(n.desc||'')}</p>
          </div>`).join('')}
        </div>
      </div>`, 'deck-flex', 'flex-direction:column;padding:2.6em 3em;height:100%;');
    }

    // A4 Full-Bleed Split(body 按行/分号拆段消费,自由文本也能读)
    // 参数:--split-ratio 驱动左右栏宽度 + 落结构 class(split-lN/split-rN),
    // 让 skeleton-diff 签名按比例分叉(30/70 ≠ 50/50 ≠ 70/30)。
    case 'A4': {
      const sp = P.split || parseSplitRatio(DEFAULT_SPLIT); // 默认 42/58
      return `<section class="deck-flex${sigCls}${paramSectionClass(route)}" data-archetype="A4"${vAttr} data-slide-id="${esc(s.id || '')}" data-background="var(--c-bg)" style="${paramCssVars(route)}height:100%;padding:0;">${v}${evidence}
      <div class="${sp.leftClass}" style="width:${sp.left};background:var(--c-fg);color:var(--c-bg);display:flex;flex-direction:column;justify-content:space-between;padding:${(2.2 * P.dm.padMul).toFixed(2)}em 2em;">
        <div><div class="kicker" style="color:var(--c-bg);opacity:0.82;">${esc(s.title)}</div>
        <h2 style="color:var(--c-bg);margin:0.5em 0 0;">${esc(s.panel_title||s.title)}</h2></div>
        <div style="font-family:var(--f-display);font-style:italic;color:var(--c-bg);font-size:1.1em;">${esc(s.panel_quote||'')}</div>
      </div>
      <div class="${sp.rightClass}" style="width:${sp.right};display:flex;flex-direction:column;justify-content:center;padding:${(2.2 * P.dm.padMul).toFixed(2)}em 2.6em;gap:${(0.55 * P.dm.gapMul).toFixed(2)}em;">${bodyLines(s.body).map(l => `<p style="font-size:0.82em;line-height:1.5;color:var(--c-fg-2);">${esc(l)}</p>`).join('')}</div>
      <div class="pin" style="color:rgba(240,233,216,0.6);">${num} / ${esc(route.content_type)}</div></section>`;
    }

    // A5 Anchor Numeral(variant:anchor_scale → 锚点字号上限;--density-tier 影响排版密度)
    // 参数:anchor_scale 驱动字号 + 落结构 class(anchor-sN),density 驱动间距,
    // 让不同 scale 档的签名分叉(small 2em ≠ normal 4em ≠ huge 6em)。
    case 'A5': {
      const as = route.variant_params && route.variant_params.anchor_scale;
      const numSize = as ? `clamp(4em,${as}em,${(as + 0.8).toFixed(1)}em)` : 'clamp(3.6em,5em,5.6em)';
      // anchor 结构 class(skeleton-diff 签名分叉):small/normal/huge → anchor-s2/s4/s6
      const anchorCls = as ? `anchor-s${Math.round(parseFloat(as))}` : 'anchor-default';
      return wrap(`<div class="anchor-block ${anchorCls}" style="display:flex;gap:${(3 * P.dm.gapMul).toFixed(2)}em;align-items:flex-start;width:100%;">
      <div style="flex:1;">
        <div class="kpi-label" style="color:var(--c-fg-3);font-family:var(--f-mono);font-size:0.5em;letter-spacing:0.16em;text-transform:uppercase;">${esc(s.label||'')}</div>
        <div style="font-family:var(--f-display);font-size:${numSize};font-weight:600;font-style:italic;line-height:1;margin:0.15em 0;color:var(--c-accent);">${esc(s.number||'')}</div>
        <div style="font-family:var(--f-display);font-style:italic;font-size:1.2em;margin-top:0.4em;">${esc(s.event||s.title||'')}</div>
        <p style="font-size:0.78em;margin-top:0.5em;color:var(--c-fg-2);">${esc(s.note||'')}</p>
        <div style="font-family:var(--f-mono);font-size:0.5em;color:var(--c-fg-3);margin-top:0.6em;letter-spacing:0.1em;text-transform:uppercase;">${esc(s.source||'')}</div>
      </div>
      <div style="flex:1.1;border-left:1px solid var(--c-border);padding-left:2em;">
        <div class="kpi-label" style="font-family:var(--f-mono);font-size:0.5em;letter-spacing:0.16em;text-transform:uppercase;color:var(--c-fg-2);">证据</div>
        ${(s.evidence || []).map(e => `<div style="display:flex;justify-content:space-between;padding:0.4em 0;border-bottom:1px solid var(--c-rule);font-size:0.7em;"><span style="color:var(--c-fg-2);">${esc(e.k)}</span><b style="font-family:var(--f-mono);color:var(--c-fg);">${esc(e.v)}</b></div>`).join('')}
      </div></div>`, 'deck-flex', 'align-items:center;padding:2.6em 3.2em;height:100%;');
    }

    // A6 Face-Off Compare(variant:verdict_scale → 裁决字号;--split-ratio 驱动对峙双方面积比)
    // 参数:split_ratio 驱动左右面板宽度 + 落结构 class(face-lN/face-rN),
    // 让不同对峙比的签名分叉(52/48 ≠ 60/40 ≠ 70/30)。
    case 'A6': {
      const vscale = route.variant_params && route.variant_params.verdict_scale;
      const sp = P.split || parseSplitRatio('52/48'); // A6 现有默认左 52% / 右 48%
      return `<section class="deck-flex${sigCls}${paramSectionClass(route)}" data-archetype="A6"${vAttr} data-slide-id="${esc(s.id || '')}" data-background="var(--c-bg)" style="${paramCssVars(route)}height:100%;padding:0;">${v}${evidence}
      <div class="face-left ${sp.leftClass}" style="width:${sp.left};background:var(--c-accent);color:var(--c-bg);display:flex;flex-direction:column;justify-content:space-between;padding:1.9em 2.4em;">
        <div><div style="font-family:var(--f-mono);font-size:0.5em;letter-spacing:0.16em;text-transform:uppercase;color:var(--c-bg);opacity:0.8;">${esc(s.a_label||'A')}</div>
        <div style="font-family:var(--f-display);font-size:clamp(3.4em,4.6em,5.2em);font-style:italic;font-weight:600;color:var(--c-bg);line-height:1;">${esc(s.a_value||'')}</div>
        <div style="font-family:var(--f-mono);font-size:0.5em;opacity:0.8;color:var(--c-bg);">${esc(s.a_unit||'')}</div></div>
        ${(s.a_details||[]).map(d=>`<div style="font-size:0.62em;color:var(--c-bg);opacity:0.92;border-top:1px solid rgba(255,255,255,0.2);padding-top:0.3em;margin-top:0.3em;">${esc(d)}</div>`).join('')}
      </div>
      <div class="face-right ${sp.rightClass}" style="width:${sp.right};display:flex;flex-direction:column;justify-content:center;padding:2.2em 2.5em;">
        <div style="font-family:var(--f-mono);font-size:0.5em;letter-spacing:0.16em;text-transform:uppercase;color:var(--c-fg-2);">${esc(s.b_label||'B')}</div>
        <div style="font-family:var(--f-display);font-size:clamp(2.8em,3.4em,4em);font-style:italic;font-weight:600;color:var(--c-fg);line-height:1;">${esc(s.b_value||'')}</div>
        <div style="font-family:var(--f-mono);font-size:0.5em;color:var(--c-fg-2);">${esc(s.b_unit||'')}</div>
        ${(s.b_details||[]).map(d=>`<div style="font-size:0.62em;color:var(--c-fg-2);border-top:1px solid var(--c-rule);padding-top:0.3em;margin-top:0.3em;">${esc(d)}</div>`).join('')}
        <div style="height:1px;background:var(--c-fg);margin:1.2em 0 0.8em;"></div>
        <div style="font-family:var(--f-display);font-style:italic;font-size:${vscale ? `${vscale}em` : '2.2em'};color:var(--c-accent);line-height:1;">${esc(s.verdict||'')}</div>
        <div style="font-family:var(--f-mono);font-size:0.5em;color:var(--c-fg-2);letter-spacing:0.12em;text-transform:uppercase;">${esc(s.verdict_note||'')}</div>
      </div><div class="pin">${num} / ${esc(route.content_type)}</div></section>`;
    }

    // A7 KPI Grid(sig-grid:voice 签名卡面 hook)
    case 'A7': return wrap(`<div class="kicker">${esc(s.title||'指标')}</div>
      <div class="sig-grid" style="display:grid;grid-template-columns:repeat(${Math.min((s.kpis||[]).length,4)},1fr);gap:1.1em;margin-top:1.4em;">
        ${(s.kpis||[]).map((k,i)=>`<div style="border:1px solid var(--c-fg);background:${i===0?'var(--c-fg)':'var(--c-bg-paper)'};color:${i===0?'var(--c-bg)':'var(--c-fg)'};padding:1.1em 1em;">
          <div style="font-family:var(--f-mono);font-size:0.48em;letter-spacing:0.12em;text-transform:uppercase;opacity:0.8;">${esc(k.label)}</div>
          <div style="font-family:var(--f-display);font-style:italic;font-weight:600;font-size:2.6em;line-height:0.95;color:${i===0?'var(--c-bg)':'var(--c-accent)'};margin-top:0.15em;">${esc(k.value)}</div>
          <div style="font-size:0.58em;opacity:0.75;margin-top:0.2em;">${esc(k.note||'')}</div></div>`).join('')}
      </div>`, 'deck-flex', 'flex-direction:column;justify-content:center;padding:2.6em 3em;height:100%;');

    // A8 Mechanism(items 文字标签 + 衰减条,绝不丢内容;A8 仅适合量化前后对比;
    // variant:panel_ratio → 后栏占比(0.38 → 前栏 flex 1.63 / 后栏 1))
    // 参数:--density-tier(compact/normal/airy)驱动结构真分叉 ——
    //   compact:前/后/箭头三元素堆叠成单栏(meccol-stack),箭头变分隔条;
    //   normal: 现有左右双面板 + 中间箭头(meccol-pair);
    //   airy:   前/中(箭头)/后三栏分离 + 额外 gap 包装(meccol-trio)。
    // 不同密度档 = 不同 DOM 子元素 class + 不同子元素数,skeleton-diff 签名分叉。
    case 'A8': {
      const pr = route.variant_params && route.variant_params.panel_ratio;
      const beforeFlex = pr ? Math.round(((1 - pr) / pr) * 100) / 100 : 1;
      const beforeItems = (s.before_items||[]).map((it,i)=>`<div style="margin:${(0.5*P.dm.gapMul).toFixed(2)}em 0;"><div style="font-size:0.62em;color:var(--c-fg-2);margin-bottom:0.25em;">${esc(it)}</div><div style="height:0.5em;background:var(--c-fg);opacity:${0.85-i*0.13};"></div></div>`).join('');
      const afterItems = (s.after_items||[]).map(it=>`<div style="margin:${(0.5*P.dm.gapMul).toFixed(2)}em 0;"><div style="font-size:0.62em;color:var(--c-bg);margin-bottom:0.25em;">${esc(it)}</div><div style="height:0.4em;background:var(--c-bg);opacity:0.85;"></div></div>`).join('');
      const beforeLabel = `<div style="font-family:var(--f-mono);font-size:0.48em;letter-spacing:0.12em;text-transform:uppercase;color:var(--c-fg-3);margin-bottom:0.5em;">${esc(s.before_label||'前')}</div>`;
      const afterLabel = `<div style="font-family:var(--f-mono);font-size:0.48em;letter-spacing:0.12em;text-transform:uppercase;opacity:0.85;margin-bottom:0.5em;">${esc(s.after_label||'后')}</div>`;
      const reduction = `<div style="font-family:var(--f-mono);font-size:0.52em;margin-top:0.6em;">${esc(s.reduction||'')}</div>`;
      let mechInner;
      if (P.density === 'compact') {
        // 紧凑:单栏堆叠(前→条→后),子元素结构 = meccol-stack + 3 div
        mechInner = `<div class="meccol-stack" style="display:flex;flex-direction:column;gap:${(0.6*P.dm.gapMul).toFixed(2)}em;">
          <div style="border:1px solid var(--c-border);padding:${(1*P.dm.padMul).toFixed(2)}em;">${beforeLabel}${beforeItems}</div>
          <div class="mech-arrow" style="height:3px;background:var(--c-accent);"></div>
          <div style="border:2px solid var(--c-accent);background:var(--c-accent);color:var(--c-bg);padding:${(1*P.dm.padMul).toFixed(2)}em;">${afterLabel}${afterItems}${reduction}</div>
        </div>`;
      } else if (P.density === 'airy') {
        // 宽松:三栏分离(前/箭头列/后),子元素结构 = meccol-trio + 3 div + 额外 gap 容器
        mechInner = `<div class="meccol-trio" style="display:grid;grid-template-columns:1fr 0.3fr 1fr;gap:${(1.8*P.dm.gapMul).toFixed(2)}em;align-items:stretch;">
          <div style="border:1px solid var(--c-border);padding:${(1.2*P.dm.padMul).toFixed(2)}em;">${beforeLabel}${beforeItems}</div>
          <div class="mech-arrow" style="display:flex;align-items:center;justify-content:center;font-size:2em;color:var(--c-accent);font-family:var(--f-display);font-style:italic;">→</div>
          <div style="border:2px solid var(--c-accent);background:var(--c-accent);color:var(--c-bg);padding:${(1.2*P.dm.padMul).toFixed(2)}em;">${afterLabel}${afterItems}${reduction}</div>
        </div>`;
      } else {
        // normal:现有左右双面板 + 中间箭头(meccol-pair)
        mechInner = `<div class="meccol-pair" style="display:flex;gap:${(1.2*P.dm.gapMul).toFixed(2)}em;align-items:stretch;">
          <div style="flex:${beforeFlex};border:1px solid var(--c-border);padding:1em;">${beforeLabel}${beforeItems}</div>
          <div class="mech-arrow" style="display:flex;align-items:center;font-size:2em;color:var(--c-accent);font-family:var(--f-display);font-style:italic;">→</div>
          <div style="flex:1;border:2px solid var(--c-accent);background:var(--c-accent);color:var(--c-bg);padding:1em;">${afterLabel}${afterItems}${reduction}</div>
        </div>`;
      }
      return wrap(`<div class="kicker">${esc(s.title||'机制')}</div>
      <h2 style="font-family:var(--f-display);font-size:1.8em;margin:0.3em 0 1em;">${esc(s.subtitle||s.title||'')}</h2>
      ${mechInner}`, 'deck-flex', 'flex-direction:column;justify-content:center;padding:2.6em 3em;height:100%;');
    }

    // A9 Evidence Table(variant:highlight_col 参数优先于字段,主角列 accent 高亮)
    case 'A9': {
      const hlCol = (route.variant_params && route.variant_params.highlight_col != null)
        ? route.variant_params.highlight_col : s.highlight_col;
      return wrap(`<div class="kicker">${esc(s.title||'台账')}</div>
      <h2 style="font-family:var(--f-display);font-size:1.6em;margin:0.3em 0 0.8em;">${esc(s.subtitle||s.title||'')}</h2>
      <table style="width:100%;border-collapse:collapse;font-family:var(--f-body);font-size:0.66em;">
        <thead><tr>${(s.headers||[]).map((h,i)=>`<th style="text-align:${i===0?'left':'right'};padding:0.5em;font-family:var(--f-mono);font-size:0.85em;letter-spacing:0.12em;text-transform:uppercase;color:${i===hlCol?'var(--c-accent)':'var(--c-fg-3)'};border-bottom:2px solid var(--c-fg);">${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${(s.rows||[]).map(r=>`<tr>${r.map((c,i)=>`<td style="padding:0.55em 0.5em;border-bottom:1px solid var(--c-rule);text-align:${i===0?'left':'right'};color:${i===hlCol?'var(--c-accent)':'var(--c-fg-2)'};font-weight:${i===hlCol?600:400};${i>0?'font-family:var(--f-mono);':''}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>`, 'deck-flex', 'flex-direction:column;padding:2.6em 3em;height:100%;');
    }

    // A10 Pullquote
    case 'A10': return `<section class="deck-grid${sigCls}" data-archetype="A10"${vAttr} data-slide-id="${esc(s.id || '')}" data-background="var(--c-bg)" style="grid-template-columns:0.3fr 0.7fr;gap:64px;align-items:center;padding:64px 80px;height:100%;">${v}${evidence}
      <div style="border-right:1px solid var(--c-border);padding-right:56px;">
        <div style="font-family:var(--f-display);font-style:italic;font-size:4em;color:var(--c-accent);line-height:0.9;">№ ${esc(s.number||'')}</div>
        <div style="font-family:var(--f-mono);font-size:0.5em;letter-spacing:0.12em;text-transform:uppercase;color:var(--c-fg-2);margin-top:0.6em;">${esc(s.title||'引言')}</div>
        <div style="font-weight:600;font-size:0.85em;margin-top:0.4em;">${esc(s.who||'')}</div>
        <div style="font-family:var(--f-mono);font-size:0.5em;color:var(--c-fg-2);letter-spacing:0.08em;">${esc(s.role||'')}</div>
      </div>
      <div style="font-family:var(--f-display);font-style:italic;font-size:1.9em;line-height:1.32;color:var(--c-fg);">"${esc(s.quote||s.body||'')}"</div>
      <div class="pin" style="bottom:24px;">${num} / ${esc(route.content_type)}</div></section>`;

    // A11 Takeaway Roster(sig-grid:voice 签名卡面 hook)
    case 'A11': return wrap(`<div class="kicker">${esc(s.title||'要点')}</div>
      <h2 style="font-family:var(--f-display);font-size:1.8em;margin:0.3em 0 1em;">${esc(s.subtitle||s.title||'')}</h2>
      <div class="sig-grid" style="display:grid;grid-template-columns:repeat(${Math.min((s.items||[]).length,3)},1fr);gap:1.4em;">
        ${(s.items||[]).map((it,i)=>`<div style="border-top:3px solid var(--c-accent);padding:0.7em 0;">
          <div style="font-family:var(--f-display);font-style:italic;font-size:2.5em;color:var(--c-accent);line-height:1;">${['i','ii','iii','iv'][i]}.</div>
          <h3 style="font-size:1.1em;margin:0.4em 0 0.25em;">${esc(it.t)}</h3>
          <p style="font-size:0.64em;color:var(--c-fg-2);">${esc(it.d||'')}</p></div>`).join('')}
      </div>`, 'deck-flex', 'flex-direction:column;justify-content:center;padding:2.6em 3em;height:100%;');

    // A12 Masthead Closing
    case 'A12': return wrap(`<div style="text-align:center;">
        <div style="border-top:3px double var(--c-fg);border-bottom:1px solid var(--c-fg);padding:0.5em 0 0.35em;display:inline-block;font-family:var(--f-mono);font-size:0.52em;letter-spacing:0.16em;text-transform:uppercase;color:var(--c-fg-2);min-width:60%;">${esc(s.topic||'FIN')}</div>
        <h2 style="font-family:var(--f-display);font-style:italic;font-size:clamp(2.4em,3.6em,4.2em);font-weight:500;line-height:1.1;margin:0.5em 0;color:var(--c-fg);">${esc(s.title||'')}</h2>
        <p style="font-size:0.85em;max-width:50ch;margin:0.8em auto;color:var(--c-fg-2);font-style:italic;">${esc(s.body||'')}</p>
        <div style="margin-top:1.2em;display:inline-flex;gap:0.6em;"><span class="stamp" style="border:2px solid var(--c-accent);color:var(--c-accent);padding:0.35em 0.8em;font-family:var(--f-mono);font-size:0.5em;letter-spacing:0.22em;text-transform:uppercase;">${esc(s.stamp||'CATALOGUED')}</span></div>
      </div>`, 'deck-flex', 'flex-direction:column;justify-content:center;align-items:center;padding:2.6em 3em;height:100%;text-align:center;');

    // IMG · 图像对峙(顶部标题 + 双图并排对比 + 标签;图像驱动主题。proof 是图,非文字)
    case 'IMG': {
      requireFields('image-compare', s, ['img_a', 'img_b', 'a_label', 'b_label']);
      return `<section class="deck-flex${sigCls}" data-archetype="IMG"${vAttr} data-slide-id="${esc(s.id || '')}" data-background="var(--c-bg)" style="height:100%;flex-direction:column;padding:0;">${v}${evidence}
        <div style="padding:1em 1.6em 0.7em;border-bottom:1px solid var(--c-border);">
          <div class="kicker">${esc(s.subtitle||'图像对比')}</div>
          <h2 style="font-family:var(--f-display);font-size:1.7em;font-style:italic;margin:0.2em 0 0;color:var(--c-fg);">${esc(s.title||'')}</h2>
        </div>
        <div style="flex:1;display:flex;min-height:0;">
          <div style="width:50%;display:flex;flex-direction:column;background:var(--c-bg-paper);">
            <div style="flex:1;background:url('${esc(s.img_a)}') center/cover;filter:saturate(0.85) contrast(0.95);min-height:0;"></div>
            <div style="padding:0.9em 1.4em;border-top:3px solid var(--c-accent);">
              <div style="font-family:var(--f-mono);font-size:0.5em;letter-spacing:0.12em;text-transform:uppercase;color:var(--c-accent);">${esc(s.a_label)}</div>
              <div style="font-family:var(--f-display);font-size:1.3em;font-style:italic;margin:0.2em 0;">${esc(s.a_value)}</div>
              <div style="font-size:0.56em;color:var(--c-fg-2);">${esc(s.a_detail||'')}</div>
            </div>
          </div>
          <div style="width:50%;display:flex;flex-direction:column;">
            <div style="flex:1;background:url('${esc(s.img_b)}') center/cover;filter:saturate(0.85) contrast(0.95);min-height:0;"></div>
            <div style="padding:0.9em 1.4em;border-top:3px solid var(--c-fg-2);">
              <div style="font-family:var(--f-mono);font-size:0.5em;letter-spacing:0.12em;text-transform:uppercase;color:var(--c-fg-2);">${esc(s.b_label)}</div>
              <div style="font-family:var(--f-display);font-size:1.3em;font-style:italic;margin:0.2em 0;">${esc(s.b_value)}</div>
              <div style="font-size:0.56em;color:var(--c-fg-2);">${esc(s.b_detail||'')}</div>
            </div>
          </div>
        </div>
        <div class="pin">${num} / ${esc(s.title||'图像对比')}</div>
      </section>`;
    }

    default: return wrap(`<h2>${esc(s.title||'')}</h2><p>${esc(s.body||'')}</p>`);
  }
}

function assembleDeck(input, routed) {
  if (!input.voice) {
    throw new Error('Missing required voice token name');
  }
  requireOffTemplateContract(input, routed);
  // 无法自动分类的段落(fallback_chapter)不再 throw:按 A4 消费 body 渲染,
  // 清单见 routeReportLines(routed) 的「待人工标注段落」。
  const voice = input.voice;
  const tokens = readTokensInline(voice);
  const fonts = VOICE_FONTS[voice];
  if (!fonts) {
    const supported = Object.keys(VOICE_FONTS).join(', ');
    throw new Error(`Missing voice font mapping: ${voice}. Supported voices: ${supported}. To add: add a voice entry to tokens/voices.json then run: node scripts/build-voice-tokens.js`);
  }
  const pptxClient = readPptxClientInline();
  const sections = routed.routes.map((r, i) => fillArchetype(r, input.sections[i], i, routed.routes.length, input)).join('\n');
  // voice 签名层:body 带 voice-<name>(+ motion≥4 时 voice-motion-high 标记),
  // 签名 CSS 注入 <style> 末尾(覆盖层,只覆盖不重建骨架;只用 token 变量)
  const sig = buildVoiceSignature(voice);
  const voiceCls = String(voice).replace(/[^a-z0-9-]/gi, '');
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(input.topic || 'Deck')}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/reveal.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${fonts}" rel="stylesheet">
<style>
${tokens}
.reveal{font-family:var(--f-body),'Arial Narrow',serif;font-size:28px;color:var(--c-fg);background:var(--c-bg);}
.reveal .slides{text-align:left;}
.reveal section{padding:2.6em 3em;height:100%;box-sizing:border-box;overflow:hidden;background:var(--c-bg);position:relative;}
.reveal section>*{max-width:100%;box-sizing:border-box;}
.reveal h1,.reveal h2,.reveal h3{font-family:var(--f-display);color:var(--c-fg);line-height:1.1;margin:0;}
.reveal p{margin:0;}
.kicker{font-family:var(--f-mono);font-size:0.5em;letter-spacing:0.16em;text-transform:uppercase;color:var(--c-fg-3);display:inline-block;}
.pin{position:absolute;left:2.5em;bottom:1.2em;font-family:var(--f-mono);font-size:0.46em;letter-spacing:0.08em;color:var(--c-fg-3);}
.evidence-label{position:absolute;right:2.5em;top:1.2em;z-index:2;font-family:var(--f-mono);font-size:0.44em;letter-spacing:0.12em;text-transform:uppercase;color:var(--c-fg-3);}
.deck-flex{display:flex !important;}
.deck-grid{display:grid !important;}
.reveal .progress{color:var(--c-accent);}
#pptx-export-btn{position:fixed;top:14px;right:14px;z-index:1000;opacity:0;pointer-events:none;border:1px solid var(--c-border);background:var(--c-bg);color:var(--c-fg);font-family:var(--f-mono);font-size:11px;letter-spacing:0.12em;padding:6px 10px;}
#pptx-export-btn:focus,#pptx-export-btn:hover,body:hover #pptx-export-btn{opacity:1;pointer-events:auto;}
@media (prefers-reduced-motion:reduce){.reveal *{transition:none!important;animation:none!important;}}
${sig.css}</style>
</head>
<body class="voice-${voiceCls}${sig.motionHigh ? ' voice-motion-high' : ''}">
<div class="reveal"><div class="slides">
${sections}
</div></div>
<script src="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/reveal.js"></script>
<script src="https://cdn.jsdelivr.net/npm/pptxgenjs@4.0.1/dist/pptxgen.bundle.js"></script>
<script>
${pptxClient}
</script>
<script>
Reveal.initialize({width:1280,height:720,margin:0.04,hash:true,slideNumber:'c/t',progress:true,center:false,controls:true,controlsTutorial:false,transition:'fade',backgroundTransition:'fade'});
</script>
</body></html>`;
}

// ── 内置医疗 demo(结构化 sections,不在 10 template 覆盖)──
const MEDICAL = {
  topic: 'III 期临床试验结果 · CX-204',
  voice: 'editorial-serif',
  off_template: true,
  style_gap: {
    inspiration_case: 'clinical readout / evidence dossier',
    token: 'editorial-serif',
    content_rewrite: 'clinical endpoints, cohorts, hazard ratio, safety ledger',
    layout_variant: 'A5 endpoint anchor + A9 trial ledger + A8 mechanism variant',
  },
  evidence_status: 'illustrative',
  sections: [
    { title: 'III 期临床结果', content_type: 'cover', subtitle: 'CX-204 · 晚期 NSCLC', meta: ['VOL. 01', '2026', 'CLINICAL READOUT'],
      body: 'CX-204 将晚期 NSCLC 患者 5 年总生存率从 42% 提升到 67%,达到主要终点。',
      facts: [{ k: 'OS', v: '67% vs 42%' }, { k: 'PFS', v: '中位 14.2 月' }, { k: 'N', v: 'n=480' }, { k: '期', v: 'III 期' }] },
    { title: '核心结论', content_type: 'thesis', emphasis: '67%', body: ' —— 5 年生存率的全新基准。', support: 'III 期试验 n=480,主要终点 OS 达到,HR=0.52,p<0.001。' },
    { title: '主要终点', content_type: 'data-anchor', label: 'PRIMARY ENDPOINT · OS', number: '67%', event: 'CX-204 试验组 5 年生存率',
      note: 'vs 对照组 42% · HR=0.52(95%CI 0.42-0.64) · p<0.001', source: 'III 期 · 主要终点 · verified',
      evidence: [{ k: '对照组 OS', v: '42%' }, { k: 'HR (95%CI)', v: '0.52 (0.42-0.64)' }, { k: 'p 值', v: '< 0.001' }] },
    { title: '试验 vs 对照', content_type: 'comparison', subtitle: 'OS 对峙',
      a_label: 'CX-204', a_value: '67%', a_unit: '5 年 OS', a_details: ['HR = 0.52', 'p < 0.001'],
      b_label: '标准疗法', b_value: '42%', b_unit: '5 年 OS', b_details: ['现有 SOC', '安慰剂对照'],
      verdict: '+25pp', verdict_note: '绝对生存获益' },
    { title: '多指标台账', content_type: 'evidence-table', subtitle: 'CX-204 vs 对照 · 全终点',
      headers: ['终点', 'CX-204', '对照', 'HR / p'], highlight_col: 1,
      rows: [['OS(5 年)', '67%', '42%', 'HR=0.52'], ['PFS(中位)', '14.2 月', '8.1 月', 'HR=0.48'], ['ORR', '72%', '41%', '—'], ['3-4 级 AE', '38%', '31%', '可控']] },
    { title: '作用机制', content_type: 'mechanism', subtitle: '靶点 X 抑制 → 通路 Y 阻断 → 凋亡激活',
      before_label: '传统化疗', after_label: 'CX-204', reduction: '复发风险降低 48%',
      before_items: ['广谱细胞毒', '选择性低', '耐药快'],
      after_items: ['靶点 X 高选择', '通路 Y 阻断', '凋亡激活'] },
    { title: '试验时间线', content_type: 'chronology', subtitle: '2022 入组 → 2025 读出',
      nodes: [
        { year: '2022', title: '入组启动', desc: 'n=480 随机' },
        { year: '2023', title: '给药完成', desc: 'Q3W × 18 周期' },
        { year: '2024', title: '中期分析', desc: 'OS 显著获益', accent: true },
        { year: '2025', title: '主要读出', desc: '达到主要终点', accent: true } ] },
    { title: 'PI 评价', content_type: 'quote', number: '07', who: 'R. Tanaka', role: '主要研究者(PI) · 肿瘤学',
      quote: '这是十年来该领域最显著的总生存获益。' },
    { title: '结论要点', content_type: 'takeaways', subtitle: 'III 期读出结论',
      items: [
        { t: 'OS 显著获益', d: '67% vs 42%,HR=0.52,p<0.001' },
        { t: '安全性可控', d: '3-4 级 AE 38%,无新安全信号' },
        { t: 'NDA 启动', d: 'Q4 报产申请提交' } ] },
    { title: '下一步', content_type: 'closing', topic: 'CX-204 · NEXT', body: 'CX-204 将于 Q4 提交 NDA,有望成为晚期 NSCLC 一线新标准。', stamp: '2026 · NDA Q4' },
  ],
};

function main() {
  const arg = process.argv[2];
  const input = (!arg || arg === '--demo') ? MEDICAL : JSON.parse(fs.readFileSync(arg, 'utf8'));
  const routed = routeDeck(input);
  const html = assembleDeck(input, routed);
  const out = process.argv[3] || path.join(ROOT, 'output', `archetype-deck.html`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log('✅ 生成 deck:', path.relative(ROOT, out));
  console.log('   主题:', input.topic);
  console.log('   路由:', routed.deck_check.hint);
  // 生成报告:序列 warning + 待人工标注段落 + 字段抽取/降级清单
  for (const line of routeReportLines(routed)) console.log(line);
}

if (require.main === module) main();
module.exports = { fillArchetype, assembleDeck, extractFields, listImplicitFallbacks, routeReportLines, MEDICAL, VOICE_SIGNATURES, buildVoiceSignature, resolveVariantParams, parseSplitRatio, densityMap, paramCssVars, paramSectionClass };
