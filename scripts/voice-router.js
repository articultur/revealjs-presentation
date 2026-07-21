#!/usr/bin/env node
'use strict';
/* eslint-disable */

/**
 * voice-router.js — 主题/风格 → voice 自动路由(四层架构 ②b 风格路由层)
 * ====================================================================
 * 对标 content-router.js(内容→layout),补上缺失的"主题/风格→voice"层。
 * 让"做个赛博朋克/和风/金融 PPT"能自动映射到 voice primitive,而非靠人工
 * 翻 SKILL.md 的 10 形状表或手写 token。
 *
 * 三级路由(优先级递降):
 *   1. 关键词精确命中(STYLE_KEYWORD_MAP)→ 直接返回
 *   2. 主题气质维度推断(TOPIC_DIMENSION_HINTS → 维度最近 voice)
 *   3. 兜底 editorial(通用稳健)
 *
 * voice 库来源:tokens/voices.json(经 build-voice-tokens.js 加载)+ legacy。
 *
 * 用法:
 *   node scripts/voice-router.js --demo              跑 6 个示例
 *   node scripts/voice-router.js "赛博朋克技术分享"   路由主题
 *   node scripts/voice-router.js "汇报" 极简         主题 + 风格词
 */

const fs = require('fs');
const path = require('path');
const { loadRegistry } = require('./build-voice-tokens');

const REG = loadRegistry();
const VOICES = REG.voices;

// seed-cases.json:沉淀 case 的可路由 DNA(seed-gallery 库:本草纲目 / NASA 星云 / 纪念碑谷…)
// 命中 → 返回 caseRef 指 case.md + seed.html,作 B 解法参考(学决策,不套 HTML)。
// 与 SEED_PRIORITY(template scaffold 套用)正交:case 是参考 DNA,不是套用模板。
// registry 缺失时降级为空(不阻断路由)。
let SEED_CASES = [];
try {
  SEED_CASES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tokens', 'seed-cases.json'), 'utf8')).cases || [];
} catch (e) { SEED_CASES = []; }

// legacy voice(已存在 primitive 但未迁入 registry):补 label + 维度以参与距离计算。
// 维度值由 tokens/<name>.css 用色 + 风格定位推导(与 registry 同量级:value/sat/density 1-5,weight 1-7):
//   editorial-serif:--c-bg #f3ecd9 浅暖纸底 + #6e2a18 暗红 accent → value4/sat2/hue28;档案排版 → density3/motion1
//   chinese-ink-wash:--c-bg #f5f1e8 宣纸白 + 浓墨/朱砂点题 → value5;墨分五色整体低饱 → sat1;留白美学 → density2
const LEGACY = {
  'editorial-serif': { name: 'editorial-serif', label: 'Editorial Serif', dimensions: { value: 4, saturation: 2, hue: 28, weight: 4, density: 3, motion: 1 } },
  'chinese-ink-wash': { name: 'chinese-ink-wash', label: 'Chinese Ink Wash', dimensions: { value: 5, saturation: 1, hue: 25, weight: 3, density: 2, motion: 1 } },
};

function getVoice(name) {
  return VOICES.find(v => v.name === name) || LEGACY[name] || null;
}

// ── 风格关键词 → voice(单一真相源:voices.json keywords + 长尾扩展)──────────
// REGISTRY_KW_MAP 从 voices.json 的 keywords 字段构建(加 keyword 到 voices.json 立即生效);
// STYLE_KEYWORD_EXTRA 是 registry keywords 未覆盖的英文/组合/别名。命中即返回。
const REGISTRY_KW_MAP = {};
for (const _v of VOICES) { for (const _k of _v.keywords) { REGISTRY_KW_MAP[_k] = _v.name; } }
const STYLE_KEYWORD_EXTRA = {
  // 组合词(优先)
  '高端美妆': 'luxury', '品牌发布': 'launch', '赛博朋克': 'technical',
  '苹果风': 'minimal', '新中式': 'chinese-ink-wash',
  // 东方/和风(legacy chinese-ink-wash:东方留白美学)
  '和风': 'chinese-ink-wash', '日式': 'chinese-ink-wash', '侘寂': 'chinese-ink-wash',
  'wabi': 'chinese-ink-wash', '水墨': 'chinese-ink-wash', '禅意': 'chinese-ink-wash',
  '东方': 'chinese-ink-wash', '国风': 'chinese-ink-wash', '古风': 'chinese-ink-wash',
  // 极简系
  '极简': 'minimal', '性冷淡': 'minimal', '简约': 'minimal', '留白': 'minimal',
  'minimal': 'minimal', 'quiet': 'minimal', 'clean': 'minimal',
  // 数据/金融
  '金融': 'data', '财务': 'data', '证券': 'data', '量化': 'data', '仪表盘': 'data',
  '经营分析': 'data', '数据分析': 'data', 'dashboard': 'data', 'analytics': 'data',
  'kpi': 'data',
  // 科技/技术
  '赛博': 'technical', 'cyberpunk': 'technical', '黑客': 'technical',
  '架构': 'technical', '系统设计': 'technical', '监控': 'technical',
  '终端': 'technical', '控制台': 'technical', 'technical': 'technical',
  'console': 'technical', 'sre': 'technical', '开发者': 'technical', 'tech': 'technical',
  // 发布
  '发布': 'launch', '新品': 'launch', 'demo': 'launch', 'launch': 'launch',
  'product': 'launch', 'drop': 'launch', '舞台': 'launch', '亮相': 'launch', 'keynote': 'launch',
  // 商务
  '商务': 'consulting', '咨询': 'consulting', '决策': 'consulting', '管理层': 'consulting',
  '战略': 'consulting', '复盘': 'consulting', '述职': 'consulting', '年终': 'consulting',
  'memo': 'consulting', 'board': 'consulting', 'strategy': 'consulting', 'consulting': 'consulting',
  // 融资
  '融资': 'pitch', '路演': 'pitch', 'bp': 'pitch', '商业计划': 'pitch',
  'pitch': 'pitch', 'investment': 'pitch', 'proposal': 'pitch', '销售': 'pitch', '提案': 'pitch',
  // 教育
  '教育': 'education', '培训': 'education', '课程': 'education', '课件': 'education',
  '工作坊': 'education', '教学': 'education', 'education': 'education', 'workshop': 'education',
  // 编辑/杂志
  '杂志': 'editorial', '编辑': 'editorial', '策展': 'editorial', '档案': 'editorial',
  'editorial': 'editorial', 'magazine': 'editorial', '品牌册': 'editorial', '画册': 'editorial',
  // 野兽
  '野兽': 'brutalist', 'brutalist': 'brutalist', '宣言': 'brutalist', '批判': 'brutalist',
  '先锋': 'brutalist', '反潮流': 'brutalist', '硬核': 'brutalist', '抗议': 'brutalist',
  // 奢华
  '奢侈': 'luxury', '奢华': 'luxury', '高端': 'luxury', '高定': 'luxury', '精品': 'luxury',
  '时尚': 'luxury', '美妆': 'luxury', '珠宝': 'luxury', 'luxury': 'luxury', 'premium': 'luxury',
  // 手绘/儿童
  '手绘': 'illustrated', '插画': 'illustrated', '儿童': 'illustrated', '亲子': 'illustrated',
  '可爱': 'illustrated', '卡通': 'illustrated', 'illustrated': 'illustrated', 'handmade': 'illustrated',
  // 复古
  '复古': 'retro', '怀旧': 'retro', '80年代': 'retro', 'memphis': 'retro',
  'retro': 'retro', 'vintage': 'retro', '撞色': 'retro', '海报': 'retro',
  // 学术/医疗(克制严谨)
  '学术': 'consulting', '论文': 'consulting', '研究': 'editorial',  // 杂志 feature 风(区别于 legacy editorial-serif 临床/档案)
  '临床': 'editorial-serif', '医疗': 'editorial-serif', '医学': 'editorial-serif',
};
const STYLE_KEYWORD_MAP = Object.assign({}, REGISTRY_KW_MAP, STYLE_KEYWORD_EXTRA);

// ── 种子优先映射(主题形状 → 精致种子 template;新 voice 只兜底长尾)──────────
// 10 种子经长期打磨(6 维达标:签名/多色/组件/字体/材质/词表,见 references/seed-quality-standard.md)。
// 已覆盖形状优先用种子 scaffold(完整签名),新 voice(technical/data 等)只用于种子未覆盖的长尾。
// 这是 autopilot eval 发现的修正:新 voice 平淡(只配色),种子精致 → 路由优先种子。
const SEED_PRIORITY = {
  // 01 editorial-serif(历程/编年/档案/策展)
  '历程': 'template-01-editorial-serif', '编年': 'template-01-editorial-serif', '发展史': 'template-01-editorial-serif', '档案': 'template-01-editorial-serif', '策展': 'template-01-editorial-serif', '画册': 'template-01-editorial-serif', '展览': 'template-01-editorial-serif',
  // 02 dark-tech(系统/技术/监控/赛博/终端)— cyberpunk 走这里(精致种子,非平淡 technical voice)
  '赛博朋克': 'template-02-dark-tech', '赛博': 'template-02-dark-tech', '技术分享': 'template-02-dark-tech', '开发者大会': 'template-02-dark-tech', '监控': 'template-02-dark-tech', '终端': 'template-02-dark-tech', '控制台': 'template-02-dark-tech', 'sre': 'template-02-dark-tech', '排障': 'template-02-dark-tech', '运营': 'template-02-dark-tech', '故障复盘': 'template-02-dark-tech',
  // 03 minimal-spatial(结构/架构/制图/建筑)
  '架构': 'template-03-minimal-spatial', '结构设计': 'template-03-minimal-spatial', '制图': 'template-03-minimal-spatial', '建筑': 'template-03-minimal-spatial', '平面图': 'template-03-minimal-spatial', '剖面': 'template-03-minimal-spatial', '方法论': 'template-03-minimal-spatial',
  // 04 vibrant-gradient(发布/舞台)
  '发布会': 'template-04-vibrant-gradient', '新品发布': 'template-04-vibrant-gradient', '舞台': 'template-04-vibrant-gradient', '亮相': 'template-04-vibrant-gradient', '登场': 'template-04-vibrant-gradient', '产品 drop': 'template-04-vibrant-gradient',
  // 05 nature-fresh(田野/自然/样本)
  '田野': 'template-05-nature-fresh', '自然观察': 'template-05-nature-fresh', '样本': 'template-05-nature-fresh', '标本': 'template-05-nature-fresh',
  // 06 brutalist(宣言/批判)
  '野兽派': 'template-06-brutalist', '抗议宣言': 'template-06-brutalist',
  // 07 memphis(创意/拼贴)
  '孟菲斯': 'template-07-memphis', '创意拼贴': 'template-07-memphis',
  // 08 isometric(等距/平台架构)
  '等距': 'template-08-isometric', '平台架构图': 'template-08-isometric', '3d 架构': 'template-08-isometric',
  // 09 editorial-photo(城市/旅行/美食摄影)
  '城市画册': 'template-09-editorial-photo', '旅行摄影': 'template-09-editorial-photo', '地产画册': 'template-09-editorial-photo', '美食摄影': 'template-09-editorial-photo', '产品摄影': 'template-09-editorial-photo',
  // 10 clinical-trial(临床/监管)
  '临床试验': 'template-10-clinical-trial', '监管 dossier': 'template-10-clinical-trial', '疗效证据': 'template-10-clinical-trial', 'kaplan-meier': 'template-10-clinical-trial',
  // ── 以下与 SKILL.md「第一步·选种子」形状表触发词对齐(追加在末尾:等长时现有词仍优先)──
  // 01:讲历程/历史/复盘/编年
  '历史': 'template-01-editorial-serif', '复盘': 'template-01-editorial-serif',
  // 02:讲系统运行/监控/排障/终端(监控/排障/终端已在上方)
  // 03:讲结构/架构/方法论/层级关系
  '结构': 'template-03-minimal-spatial', '层级': 'template-03-minimal-spatial',
  // 04:讲发布/亮相/舞台(亮相/舞台已在上方)
  '发布': 'template-04-vibrant-gradient',
  // 05:讲田野观察/教学/洞察/workshop
  '教学': 'template-05-nature-fresh', '洞察': 'template-05-nature-fresh', '工作坊': 'template-05-nature-fresh', 'workshop': 'template-05-nature-fresh',
  // 06:讲宣言/批判/对抗/反潮流
  '宣言': 'template-06-brutalist', '批判': 'template-06-brutalist',
  // 07:讲创意/活动/作品集/复古文化(「活动」过宽不收录,避免「团队建设活动」误路由)
  '作品集': 'template-07-memphis', '复古': 'template-07-memphis',
  // 08:讲平台/路线图/分层/阶段规划
  '平台': 'template-08-isometric', '路线图': 'template-08-isometric', '阶段规划': 'template-08-isometric',
  // 09:讲城市/旅游/美食/产品实拍(图像即内容)
  '城市': 'template-09-editorial-photo', '旅游': 'template-09-editorial-photo', '旅行': 'template-09-editorial-photo', '美食': 'template-09-editorial-photo', '实拍': 'template-09-editorial-photo',
  // 10:讲临床试验/监管 dossier(「临床试验」等长词已在上方)
  '临床': 'template-10-clinical-trial',
};
function matchSeed(text) {
  const lower = text.toLowerCase();
  const keys = Object.keys(SEED_PRIORITY).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (text.includes(k) || lower.includes(k.toLowerCase())) return { keyword: k, seed: SEED_PRIORITY[k] };
  }
  return null;
}

// ── 种子 case 路由(seed-gallery 沉淀 case 的可路由 DNA)──────────────────────
// matchCase:主题词命中 seed-cases.json 的 case keywords → 返回 { case, keyword }。
// 多 case 命中时按命中 keyword 长度降序(长词 = 更具体 = 优先)。不命中返回 null。
function matchCase(text) {
  const lower = text.toLowerCase();
  const ranked = [];
  for (const c of SEED_CASES) {
    for (const kw of c.keywords) {
      if (text.includes(kw) || lower.includes(kw.toLowerCase())) {
        ranked.push({ case: c, keyword: kw, len: kw.length });
        break; // 一个 case 命中任一 keyword 即可
      }
    }
  }
  if (!ranked.length) return null;
  ranked.sort((a, b) => b.len - a.len);
  return ranked[0];
}

// ── 主题词 → 维度坐标偏移(关键词未命中时,按主题气质推断)──────────
const TOPIC_DIMENSION_HINTS = [
  { re: /金融|财务|证券|量化|仪表盘|经营|数据|指标|财报/, target: { value: 1, saturation: 2, density: 5, motion: 1 }, reason: '冷峻数据/金融气质 → 深色高密度仪表盘' },
  { re: /儿童|亲子|幼儿|可爱|卡通|童话|绘本/, target: { value: 4, saturation: 3, hue: 42, motion: 3 }, reason: '温暖活泼 → 暖色圆润手绘' },
  { re: /高端|奢华|精品|时尚|珠宝|高定|美妆/, target: { value: 1, saturation: 1, density: 2 }, reason: '克制奢华 → 深底低饱和大留白' },
  { re: /宣言|批判|先锋|反叛|抗议|硬核|赛博|野兽/, target: { saturation: 4, weight: 7, motion: 1 }, reason: '强冲击宣言 → 高饱和粗字重硬边框' },
  { re: /学术|论文|临床|医学|监管|合规|法律/, target: { value: 4, saturation: 2, density: 4 }, reason: '严谨克制 → 浅底稳重 serif' },
  { re: /发布|新品|产品|舞台|亮相|登场/, target: { value: 1, motion: 4, saturation: 3 }, reason: '舞台发布 → 动感深色高饱和' },
  { re: /教育|培训|课程|教学|工作坊|学员/, target: { value: 4, saturation: 3, hue: 156 }, reason: '清新教学 → 自然色调田野感' },
  { re: /历史|编年|历程|复盘|策展|档案/, target: { value: 4, saturation: 3, hue: 28 }, reason: '编年策展 → 暖底 editorial 档案感' },
];

const DEFAULT_DIMS = { value: 4, saturation: 2, hue: 28, weight: 4, density: 3, motion: 1 };

// ── 通用气质信号(覆盖 TOPIC_DIMENSION_HINTS 未命中的长尾:科幻/哥特/霓虹…)──
// 任一命中即在 DEFAULT_DIMS 上叠加维度偏移,组合后取最近 voice。避免未覆盖词无差别 fallback editorial。
// 注意:不含「蒸汽|vapor」——蒸汽波是模板库外主题,应落 fallback 走路径 C(design-generation-workflow.md),
// 不应被 mood 信号拽进 retro voice。
const MOOD_SIGNALS = [
  { re: /暗黑|哥特|goth|dark|黑夜|阴郁/, dim: { value: 1, saturation: 1 } },
  { re: /neon|霓虹|赛博|撞色|艳丽|炫酷/, dim: { saturation: 5, motion: 4 } },
  { re: /未来|科幻|sci|太空|宇宙|星际|机甲/, dim: { motion: 4, saturation: 2, value: 1, hue: 204 } },
  { re: /柔|静谧|优雅|留白|禅|素雅|侘寂/, dim: { saturation: 1, motion: 1 } },
  { re: /暖|童趣|活泼|明快|可爱/, dim: { hue: 42, saturation: 3, value: 4 } },
];

function inferMoodDimensions(text) {
  const dims = Object.assign({}, DEFAULT_DIMS);
  let matched = false;
  for (const sig of MOOD_SIGNALS) {
    if (sig.re.test(text)) { Object.assign(dims, sig.dim); matched = true; }
  }
  return matched ? dims : null;
}

// 维度欧氏距离:6 维全算。weight 与 value/saturation 等同权(1 级差 = 1 单位,
// 缺省按中位 4 = DEFAULT_DIMS.weight 计);色相用环距/60(60°差 = 1 单位,与 value/sat 同量级)
function dimensionDistance(a, b) {
  const dv = (a.value - b.value);
  const ds = (a.saturation - b.saturation);
  const dw = ((a.weight || 4) - (b.weight || 4));
  const dd = (a.density - b.density);
  const dm = (a.motion - b.motion);
  const dh = Math.min(Math.abs((a.hue || 0) - (b.hue || 0)), 360 - Math.abs((a.hue || 0) - (b.hue || 0))) / 60;
  return Math.sqrt(dv * dv + ds * ds + dw * dw + dd * dd + dm * dm + dh * dh);
}

function findClosestByDimensions(target) {
  let best = null;
  let bestD = Infinity;
  // registry + LEGACY 都参与维度竞争:否则维度/mood/case 路径永远到不了
  // editorial-serif/chinese-ink-wash,与关键词路径(EXTRA 可映射 legacy)不一致
  for (const v of VOICES.concat(Object.values(LEGACY))) {
    const d = dimensionDistance(target, v.dimensions);
    if (d < bestD) { bestD = d; best = v; }
  }
  return { voice: best, distance: bestD };
}

function matchKeyword(text) {
  const lower = text.toLowerCase();
  // 长词优先;等长时 STYLE_KEYWORD_EXTRA(强风格信号:和风/水墨/侘寂…)优先于
  // REGISTRY_KW_MAP(弱主题词:文化/趋势/报告…),否则 Object.assign 插入序会让
  // registry 主题词挤掉等长风格词(「和风水墨」输给「文化」的 bug)。
  const keys = Object.keys(STYLE_KEYWORD_MAP).sort((a, b) => {
    if (b.length !== a.length) return b.length - a.length;
    const ea = Object.prototype.hasOwnProperty.call(STYLE_KEYWORD_EXTRA, a) ? 0 : 1;
    const eb = Object.prototype.hasOwnProperty.call(STYLE_KEYWORD_EXTRA, b) ? 0 : 1;
    return ea - eb;
  });
  for (const k of keys) {
    if (text.includes(k) || lower.includes(k.toLowerCase())) {
      return { keyword: k, voice: STYLE_KEYWORD_MAP[k] };
    }
  }
  return null;
}

function alternativesFor(name, n) {
  const base = getVoice(name);
  if (!base) return [];
  // 备选池与 findClosestByDimensions 对齐:registry + LEGACY
  return VOICES.concat(Object.values(LEGACY))
    .filter(v => v.name !== name)
    .map(v => ({ name: v.name, d: dimensionDistance(base.dimensions, v.dimensions) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map(r => r.name);
}

function routeVoice(topic, opts = {}) {
  const text = `${topic || ''} ${(opts.styleKeywords || []).join(' ')}`.trim();
  // 0. 种子优先:主题形状命中 10 个精致种子 → 用种子 template scaffold(完整签名),新 voice 只兜底长尾
  const seed = matchSeed(text);
  if (seed) {
    return {
      voice: null,
      preferSeed: seed.seed,
      label: seed.seed,
      reason: `形状命中精致种子 ${seed.seed}(6 维达标:签名/多色/组件/字体/材质/词表)。以该种子 HTML 为 scaffold,保留签名原语,改写内容;新 voice 仅用于种子未覆盖的长尾`,
      matchType: 'seed',
      alternatives: [],
    };
  }
  // 0b. 种子 case 优先:命中 seed-gallery 沉淀 case(参考设计 DNA,不套 HTML)
  //     case = 完整 DNA(独立字体+签名+材质,独立于 voice primitive 共享字体池),作 B 解法参考;
  //     voice primitive 只是配色肤色,所以 case 命中时返回最近 voice 作配色起点 fallback,
  //     但真正 DNA 在 caseRef 指向的 seed.html。打通「沉淀 case → 可路由 DNA」闭环。
  const caseHit = matchCase(text);
  if (caseHit) {
    const c = caseHit.case;
    const closest = findClosestByDimensions(c.dimensions);
    return {
      voice: closest.voice.name,
      preferCase: c.name,
      caseRef: {
        name: c.name,
        label: c.label,
        casePath: c.casePath,
        deckPath: c.deckPath,
        dna: c.dna,
      },
      label: c.label,
      reason: `主题命中沉淀 case「${c.name}」(关键词「${caseHit.keyword}」)。走 B 解法参考 ${c.casePath}(决策)+ ${c.deckPath}(DNA 字体:${c.dna.fonts.join(' / ')}),不套用 HTML。最近 voice「${closest.voice.name}」仅作配色起点 fallback(dimensions 距离 ${closest.distance.toFixed(2)})`,
      matchType: 'case',
      alternatives: [],
    };
  }
  // 1. 关键词精确命中
  const kw = matchKeyword(text);
  if (kw) {
    const v = getVoice(kw.voice);
    return {
      voice: kw.voice,
      label: v ? v.label : kw.voice,
      reason: `关键词「${kw.keyword}」命中 voice「${kw.voice}」`,
      matchType: 'keyword',
      alternatives: alternativesFor(kw.voice, 2),
    };
  }
  // 2. 主题气质维度推断
  for (const hint of TOPIC_DIMENSION_HINTS) {
    if (hint.re.test(text)) {
      const closest = findClosestByDimensions(Object.assign({}, DEFAULT_DIMS, hint.target));
      return {
        voice: closest.voice.name,
        label: closest.voice.label,
        reason: `${hint.reason} → 最近 voice「${closest.voice.name}」(维度距离 ${closest.distance.toFixed(2)})`,
        matchType: 'dimension',
        alternatives: alternativesFor(closest.voice.name, 2),
      };
    }
  }
  // 2b. 通用气质维度推断(覆盖 hint 未命中的长尾:科幻/哥特/霓虹/未来…;蒸汽波不覆盖,落 fallback 走路径 C)
  const moodDims = inferMoodDimensions(text);
  if (moodDims) {
    const closest = findClosestByDimensions(moodDims);
    return {
      voice: closest.voice.name,
      label: closest.voice.label,
      reason: `气质信号(暗/艳/动/柔/暖)推断 → 最近 voice「${closest.voice.name}」(维度距离 ${closest.distance.toFixed(2)})`,
      matchType: 'mood',
      alternatives: alternativesFor(closest.voice.name, 2),
    };
  }
  // 3. 兜底:无明确风格信号 = 模板库外主题(不在 10 种子形状也不在 14 voice)。
  //    显式指路路径 C,不再宣称「适配多数主题」——硬套 editorial voice 是 BLACKPINK 式方向错。
  return {
    voice: 'editorial',
    label: 'Editorial Magazine',
    reason: '无明确风格信号 → 模板库外主题 → 走路径 C(references/design-generation-workflow.md:B 解法,审美意图先行 + 外部大师参考),不要硬套 editorial voice(editorial 仅作生成时的配色兜底)',
    matchType: 'fallback',
    suggestedPath: 'C',
    // 备选按维度距离实算(距兜底 voice editorial 最近 2 个),不再硬编码 consulting/minimal
    alternatives: alternativesFor('editorial', 2),
  };
}

const DEMO_QUERIES = [
  '做一个赛博朋克风的 AI 技术分享',
  '做个儿童编程培训课件',
  '高端美妆品牌发布会',
  '金融行业年度经营分析报告',
  '做一个和风水墨风的文化分享',
  '某未知主题的通用季度汇报',
];

function main() {
  if (process.argv.includes('--demo')) {
    console.log('═══ voice-router DEMO · 主题/风格 → voice ═══\n');
    for (const q of DEMO_QUERIES) {
      const r = routeVoice(q);
      console.log(`主题:「${q}」`);
      console.log(`  → voice: ${r.voice} (${r.label}) [${r.matchType}]`);
      console.log(`    理由: ${r.reason}`);
      console.log(`    备选: ${(r.alternatives || []).join(', ') || '—'}\n`);
    }
    return;
  }
  const topic = process.argv[2];
  if (!topic) {
    console.log('用法: node scripts/voice-router.js "主题描述" [风格词...]');
    console.log('      node scripts/voice-router.js --demo');
    console.log(`\n可用 voice: ${VOICES.map(v => v.name).join(', ')}, ${Object.keys(LEGACY).join(', ')}`);
    return;
  }
  const r = routeVoice(topic, { styleKeywords: process.argv.slice(3) });
  console.log(JSON.stringify(r, null, 2));
}

if (require.main === module) main();

module.exports = { routeVoice, matchKeyword, findClosestByDimensions, alternativesFor, STYLE_KEYWORD_MAP, getVoice };
