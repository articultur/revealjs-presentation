#!/usr/bin/env node
'use strict';

/**
 * Ghost Deck 生成器 + 双条件判断
 * ------------------------------------------------------------
 * 组件 1「意图对齐」的核心——防止"方向完全错了"大返工(BLACKPINK 教训:
 * 用户要"介绍 4 个成员",我却做成"团队数据 deck",根因是没对齐意图就生成)。
 *
 * 双条件判断(spec Round 4):
 *   A 明确需求 = 主题(topic) + 页数(pages) + 观众(audience) + 要点(points ≥3) 全给
 *   B 指定模板 = template / style / reference 之一非空("参照 xxx" / template-0X)
 *
 *   A && B → AUTO  一键自动出,不确认
 *   否则   → GHOST 生成轻骨架(每页 role + action title + proof object),
 *            5 秒可扫能喊停;不阻塞但让用户低成本纠偏
 *
 * ghost deck 字段:每页 # / role / action title / proof object / evidence status
 * Ghost Deck Test:只读 action titles 应能讲完整故事——读不通就先改论证,
 * 不进视觉设计(见 SKILL.md「Argument-First Planning」)。
 *
 * Usage:
 *   node scripts/generate-ghost-deck.js --json '{"topic":"...","pages":15,...}'
 *   node scripts/generate-ghost-deck.js brief.json
 *   node scripts/generate-ghost-deck.js --topic "介绍 BLACKPINK 4 个成员" \
 *     --pages 15 --audience "年轻偶像粉丝" --points "JISOO;JENNIE;ROSÉ;LISA"
 *
 * Exit codes:
 *   0 = AUTO(双条件满足,可一键生成)
 *   1 = GHOST(已输出 ghost 预览,等用户确认)
 *   2 = usage error
 */

const fs = require('fs');

// ─── 参数解析 ──────────────────────────────────────────────────

const args = process.argv.slice(2);

function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        flags[key] = true;
      } else {
        flags[key] = next;
        i++;
      }
    } else if (!flags._file && (a.endsWith('.json') || fs.existsSync(a))) {
      flags._file = a;
    }
  }
  return flags;
}

const flags = parseFlags(args);

function loadBrief() {
  if (flags.json) {
    try { return JSON.parse(flags.json); }
    catch (e) { console.error(`--json 解析失败: ${e.message}`); process.exit(2); }
  }
  if (flags._file) {
    try { return JSON.parse(fs.readFileSync(flags._file, 'utf8')); }
    catch (e) { console.error(`读取 ${flags._file} 失败: ${e.message}`); process.exit(2); }
  }
  const brief = {};
  if (flags.topic) brief.topic = flags.topic;
  if (flags.pages) brief.pages = parseInt(flags.pages, 10);
  if (flags.audience) brief.audience = flags.audience;
  if (flags.points) brief.points = flags.points.split(';').map(s => s.trim()).filter(Boolean);
  if (flags.template) brief.template = flags.template;
  if (flags.style) brief.style = flags.style;
  if (flags.reference) brief.reference = flags.reference;
  return brief;
}

const brief = loadBrief();

if (!brief.topic) {
  console.error('用法: node scripts/generate-ghost-deck.js --json "{...}" | brief.json | --topic "..." [--pages N --audience "..." --points "a;b;c" --template "..."]');
  console.error('  必填: topic(主题)');
  process.exit(2);
}

// ─── 双条件判断 ────────────────────────────────────────────────

const points = Array.isArray(brief.points) ? brief.points : [];

const condA = {
  topic: !!brief.topic && brief.topic.length >= 2,
  pages: Number.isFinite(brief.pages) && brief.pages > 0,
  audience: !!brief.audience && brief.audience.length >= 2,
  points: points.length >= 3,
};
const condAMet = condA.topic && condA.pages && condA.audience && condA.points;

const condB = !!(brief.template || brief.style || brief.reference);
const condBReason = brief.template ? `template="${brief.template}"`
  : brief.style ? `style="${brief.style}"`
  : brief.reference ? `reference="${brief.reference}"`
  : null;

const isAuto = condAMet && condB;

// ─── ghost deck 生成 ───────────────────────────────────────────

const ROLE_COVER = 'cover';
const ROLE_CLOSE = 'close';
const PROOF_BY_ROLE = {
  cover: '主视觉 / 主标题 + 平衡元素(stamp/拼贴墙/标签卡,见 §8)',
  context: 'overview 面板 / 时间线 / 全景图',
  team: '人物名片(照片 + 履历 + 标签)',
  claim: '主命题色块 / pullquote / 大数字',
  proof: '图表 / 表格 / 截图 / 引用墙 / 证据卡',
  data: '数据图(柱/环/趋势) + source label',
  comparison: '对峙版(左右对比 / A6 face-off)',
  process: '流程图 / 机制图 / 时间线',
  risk: '风险矩阵 / 对比表',
  close: 'conclusion / takeaway / 决策 / 下一步',
  appendix: '补充证据 / Q&A',
};

function deriveActionTitle(role, point, idx) {
  if (role === ROLE_COVER) return brief.topic;
  if (role === ROLE_CLOSE) return '结论 / 决策 / 下一步';
  if (point) {
    if (role === 'team') return `${point}:名片(长相 + 履历 + 定位)`;
    if (role === 'claim') return `${point} 的核心主张 / 代表作`;
    if (role === 'proof') return `${point}:数据 / 证据 / 现场`;
    if (role === 'data') return `${point} 的关键数据 + 来源`;
    if (role === 'comparison') return `${point} vs 对照组:差异在哪`;
    return point;
  }
  return `[需补 action title #${idx}]`;
}

function recommendEvidence(role, point) {
  if (role === 'team' && point) return `${point} 高清照(CC-BY / 用户换)+ 履历要点 + 定位标签`;
  return PROOF_BY_ROLE[role] || '待定 proof object';
}

// 按目标页数 + 要点分配 role 序列
function buildGhostRoles(totalPages, pts) {
  const roles = [{ role: ROLE_COVER, point: null }];
  const inner = totalPages - 2;   // 去掉 cover + close
  if (inner <= 0) {
    roles.push({ role: ROLE_CLOSE, point: null });
    return roles.slice(0, totalPages);
  }

  // 有要点:每个要点分 base 页(余数均给前几个),轮转 team/claim/proof 三拍
  if (pts.length > 0) {
    const base = Math.max(1, Math.floor(inner / pts.length));
    const remainder = inner % pts.length;
    let assigned = 0;
    const innerRoles = ['team', 'claim', 'proof'];   // 人物/主张/证据 三拍(可扩)
    for (let p = 0; p < pts.length && assigned < inner; p++) {
      const perPoint = base + (p < remainder ? 1 : 0);
      for (let k = 0; k < perPoint && assigned < inner; k++) {
        const r = innerRoles[k % innerRoles.length];
        roles.push({ role: r, point: pts[p] });
        assigned++;
      }
    }
    // 仍有余页:补 context/comparison
    while (assigned < inner) {
      roles.push({ role: assigned % 2 ? 'context' : 'comparison', point: null });
      assigned++;
    }
  } else {
    // 无要点:默认 cover→context→claim→proof→data→comparison→process→close 节奏
    const defaultInner = ['context', 'claim', 'proof', 'data', 'comparison', 'process', 'risk'];
    for (let i = 0; i < inner; i++) {
      roles.push({ role: defaultInner[i % defaultInner.length], point: null });
    }
  }
  roles.push({ role: ROLE_CLOSE, point: null });
  return roles.slice(0, totalPages);
}

function ghostDeck(totalPages, pts) {
  const rows = buildGhostRoles(totalPages, pts);
  return rows.map((r, i) => ({
    '#': i + 1,
    role: r.role,
    'action title': deriveActionTitle(r.role, r.point, i + 1),
    'proof object': recommendEvidence(r.role, r.point),
    evidence: r.role === 'data' || r.role === 'proof' ? 'needs-source(精确数字必须标 verified/user-provided/illustrative)' : '—',
  }));
}

function renderTable(rows) {
  const cols = ['#', 'role', 'action title', 'proof object', 'evidence'];
  const widths = cols.map(c => Math.max(c.length, ...rows.map(r => String(r[c] || '').length)));
  const sep = '├' + widths.map(w => '─'.repeat(w + 2)).join('┼') + '┤';
  const line = (cells) => '│ ' + cells.map((c, i) => String(c).padEnd(widths[i])).join(' │ ') + ' │';
  const top = '┌' + widths.map(w => '─'.repeat(w + 2)).join('┬') + '┐';
  const bot = '└' + widths.map(w => '─'.repeat(w + 2)).join('┴') + '┘';
  return [top, line(cols), sep, ...rows.map(r => line(cols.map(c => r[c]))), bot].join('\n');
}

// ─── 输出 ──────────────────────────────────────────────────────

if (isAuto) {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  GHOST DECK · 判定 AUTO(一键自动,不确认)     ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`  条件 A 明确需求: ${condAMet ? '✓ 全满足' : '✗ 未满足'}`);
  console.log(`    topic=${condA.topic ? '✓' : '✗'}  pages=${condA.pages ? brief.pages + ' ✓' : '✗'}  audience=${condA.audience ? '✓' : '✗'}  points=${condA.points ? points.length + ' ✓' : points.length + ' ✗'}`);
  console.log(`  条件 B 指定模板: ✓ ${condBReason}`);
  console.log('');
  console.log('  → 双条件满足,直接进 P4 生成 HTML,不需 ghost 预览。');
  console.log('  → 仍跑十门禁 + design-strength + visual-verdict 验证(校验不省)。');
  process.exit(0);
}

// GHOST
const totalPages = Number.isFinite(brief.pages) ? brief.pages : Math.max(8, points.length * 2 + 2);
const rows = ghostDeck(totalPages, points);

console.log('╔══════════════════════════════════════════════╗');
console.log('║  GHOST DECK · 判定 GHOST(需确认再生成)       ║');
console.log('╚══════════════════════════════════════════════╝');
console.log('  ⚠ 方向没对齐前不生成 HTML——BLACKPINK 教训:跳 ghost 直接生成 = 方向错大返工。');
console.log('');
console.log('  条件 A 明确需求: ' + (condAMet ? '✓' : '✗ 未满足'));
console.log(`    topic=${condA.topic ? '✓' : '✗(缺)'}  pages=${condA.pages ? brief.pages + ' ✓' : '✗(缺,默认 ' + totalPages + ')'}  audience=${condA.audience ? '✓' : '✗(缺)'}  points=${condA.points ? points.length + ' ✓' : points.length + ' ✗(需 ≥3)'}`);
console.log('  条件 B 指定模板: ' + (condB ? `✓ ${condBReason}` : '✗ 未指定(无 template/style/reference)'));
console.log('');
console.log(`  主题:${brief.topic}`);
console.log(`  观众:${brief.audience || '[未给——建议先确认]'}`);
console.log(`  要点:${points.length ? points.join(' / ') : '[未给——ghost 按 default 节奏分配,建议补]'}`);
console.log('');
console.log('  ── Ghost Deck(只读 action title 应能讲完整故事)──');
console.log(renderTable(rows));
console.log('');
console.log('  ── Ghost Deck Test ──');
console.log('  扫眼上面 action title 列:串起来是完整故事吗?proof object 能可视化证明吗?');
console.log('  · 方向对 → 回"继续 / 进 P4",我生成 HTML');
console.log('  · 方向错 → 回"改 X"(如"不是团队数据,是成员介绍"/"要 15 页不是 8 页")');
console.log('  · 补要点 → 回"加 a/b/c",我重生成 ghost');
console.log('');
console.log('  注:本预览不阻塞、低成本纠偏;确认后仍跑十门禁 + visual-verdict 校验。');
process.exit(1);
