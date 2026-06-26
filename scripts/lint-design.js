#!/usr/bin/env node
/**
 * 设计规范自动检查脚本 (Design Lint)
 * 静态分析 reveal.js HTML 文件，检查 design-principles.md 中定义的规则
 *
 * 使用方法：
 *   node scripts/lint-design.js <HTML文件路径>
 *   node scripts/lint-design.js <HTML文件路径> --verbose   # 显示 P2 建议
 *   node scripts/lint-design.js <HTML文件路径> --json      # JSON 输出
 *
 * 退出码：
 *   0 = 无 P0 违规（P1/P2 仅有警告）
 *   1 = 存在 P0 违规
 *   2 = 参数错误或文件不存在
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─── 参数解析 ───────────────────────────────────────────────

const args = process.argv.slice(2);
const htmlFile = args.find(a => !a.startsWith('--'));
const verbose = args.includes('--verbose');
const jsonOutput = args.includes('--json');

if (!htmlFile) {
  console.log('用法: node scripts/lint-design.js <HTML文件> [--verbose] [--json]');
  console.log('');
  console.log('选项:');
  console.log('  --verbose   显示 P2 级别建议');
  console.log('  --json      以 JSON 格式输出');
  process.exit(2);
}

const filePath = path.resolve(htmlFile);
if (!fs.existsSync(filePath)) {
  console.error(`文件不存在: ${filePath}`);
  process.exit(2);
}

// ─── 常量定义 ───────────────────────────────────────────────

/** Tailwind 默认 indigo 色板（AI 生成标志性指纹） */
const INDIGO_PALETTE = new Set([
  '#6366f1', '#4f46e5', '#8b5cf6', '#818cf8',
  '#a78bfa', '#7c3aed', '#6d28d9', '#4338ca',
  '#3730a3', '#312e81', '#c4b5fd', '#ddd6fe',
  '#ede9fe', '#e0e7ff',
]);

/** 常见 duotone "信任"渐变起止色 */
const DUOTONE_GRADIENT_PAIRS = [
  ['#667eea', '#764ba2'], // 紫→蓝
  ['#6366f1', '#8b5cf6'], // indigo→紫
  ['#4f46e5', '#7c3aed'], // deep indigo→紫
  ['#3b82f6', '#8b5cf6'], // 蓝→紫
  ['#06b6d4', '#8b5cf6'], // 青→紫
  ['#3b82f6', '#06b6d4'], // 蓝→青
];

/** 禁止的字体（AI 生成设计指纹） */
const BANNED_FONTS = [
  'inter', 'roboto', 'arial', 'open sans',
  'fraunces', 'newsreader', 'crimson pro', 'playfair display',
  'syne', 'space mono', 'space grotesk',
  'dm serif', 'plus jakarta sans', 'instrument sans',
  'instrument serif',
];

/** 占位文本模式 */
const PLACEHOLDER_PATTERNS = [
  /lorem\s+ipsum/i,
  /placeholder/i,
  /功能[一二三四五六七八九十]/,
  /特性[一二三四五六七八九十]/,
  /item\s*(one|two|three|four|five)/i,
  /heading\s*(one|two|three)/i,
  /your\s+(text|title|name|company)/i,
  /请在此处/i,
  /在此处输入/i,
];

/**
 * Emoji 范围（标题/按钮/列表中不应出现）
 * 注意：范围严格限定在 Emoji/符号区块，避免覆盖 CJK Unified Ideographs (U+4E00-U+9FFF)
 */
const EMOJI_RE = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}]/u;

/** 常见捏造数据模式 */
const FAKE_DATA_PATTERNS = [
  /(\d+)\s*[×x×]\s*(faster| quicker| speedup)/i,
  /99\.9%\s*(uptime|availability|reliability)/i,
  /(\d+)%\s*(more|increase|growth|improvement|faster)/i,
];

// ─── HTML 解析工具 ──────────────────────────────────────────

/**
 * 提取所有 <style> 块内容
 */
function extractStyleBlocks(html) {
  const blocks = [];
  const re = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    blocks.push({ content: m[1], index: m.index });
  }
  return blocks;
}

/**
 * 提取所有 <section> 块
 */
function extractSections(html) {
  const sections = [];
  // 匹配 <section ...>...</section>（非贪婪，允许嵌套垂直 slide）
  const re = /<section([^>]*)>([\s\S]*?)<\/section>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    sections.push({
      attrs: m[1],
      content: m[2],
      fullMatch: m[0],
      index: m.index,
    });
  }
  return sections;
}

/**
 * 提取内联 style 属性
 */
function extractInlineStyles(html) {
  const styles = [];
  const re = /style="([^"]*)"/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    styles.push({ value: m[1], index: m.index });
  }
  return styles;
}

/**
 * 提取 CSS 中的颜色值
 */
function extractColors(css) {
  const colors = [];
  // 匹配 hex, rgb, hsl, oklch
  const re = /#([0-9a-fA-F]{3,8})\b|rgba?\([^)]+\)|hsla?\([^)]+\)|oklch\([^)]+\)/gi;
  let m;
  while ((m = re.exec(css)) !== null) {
    colors.push({ value: m[0], index: m.index });
  }
  return colors;
}

/**
 * 简化 hex 颜色用于比较（转小写，展开 3 位）
 */
function normalizeHex(hex) {
  let h = hex.toLowerCase().replace('#', '');
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  return '#' + h;
}

/**
 * 检查文本是否全部大写（英文）
 */
function isAllCaps(text) {
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 3) return false;
  return letters === letters.toUpperCase();
}

/**
 * 提取标签的文本内容（去除标签）
 */
function stripTags(html) {
  return html.replace(/<[^>]+>/g, '').trim();
}

/**
 * 压缩文本空白，便于主题词匹配
 */
function normalizeText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * 提取所有指定标签内容
 */
function extractTagTexts(html, tagNames) {
  const tags = tagNames.join('|');
  const re = new RegExp(`<(${tags})\\b[^>]*>([\\s\\S]*?)<\\/\\1>`, 'gi');
  const texts = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    texts.push({
      tag: m[1].toLowerCase(),
      text: normalizeText(stripTags(m[2])),
      raw: m[0],
      index: m.index,
    });
  }
  return texts.filter(item => item.text);
}

/**
 * 提取带 font-size 的内联文本，用于识别主视觉/大字号文本
 */
function extractLargeInlineTexts(html, minEm = 1.2) {
  const re = /<([a-z][\w:-]*)\b([^>]*)style="([^"]*font-size\s*:[^"]*)"[^>]*>([\s\S]*?)<\/\1>/gi;
  const texts = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const style = m[3];
    const emMatch = style.match(/font-size\s*:\s*(\d+(?:\.\d+)?)em/i);
    const pxMatch = style.match(/font-size\s*:\s*(\d+(?:\.\d+)?)px/i);
    const isLarge =
      (emMatch && parseFloat(emMatch[1]) >= minEm) ||
      (pxMatch && parseFloat(pxMatch[1]) >= 34);
    if (isLarge) {
      const text = normalizeText(stripTags(m[4]));
      if (text) {
        texts.push({ tag: m[1].toLowerCase(), text, raw: m[0], index: m.index });
      }
    }
  }
  return texts;
}

function cjkChars(text) {
  return (text.match(/[\u3400-\u9fff]/g) || []).join('');
}

function cjkBigrams(text) {
  const compact = cjkChars(text);
  const tokens = [];
  for (let i = 0; i < compact.length - 1; i++) {
    tokens.push(compact.slice(i, i + 2));
  }
  return [...new Set(tokens)];
}

function textContainsClaim(text, claim) {
  const normalized = normalizeText(text);
  if (!claim) return false;
  if (normalized.includes(claim)) return true;

  const tokens = cjkBigrams(claim);
  if (tokens.length === 0) return false;
  // 2 字主题词要求完整出现；4 字以上主题词允许用相邻核心词共同表达。
  if (cjkChars(claim).length <= 2) return tokens.some(token => normalized.includes(token));
  return tokens.length >= 2 && tokens.every(token => normalized.includes(token));
}

function extractPinTopic(pinText) {
  const afterSlash = pinText.includes('/') ? pinText.split('/').slice(1).join('/') : pinText;
  return normalizeText(afterSlash)
    .replace(/\b(?:cover|chapter|slide|benchmark|keynote|ppt|q[1-4])\b/gi, '')
    .replace(/\b\d{2,4}(?:[.-]\d{1,2})*\b/g, '')
    .replace(/[·|:：#-]+/g, ' ')
    .trim();
}

function isMeaningfulPinTopic(topic) {
  const cjk = cjkChars(topic);
  if (cjk.length < 4) return false;
  const generic = new Set([
    '封面', '目录', '结束', '收尾', '续', '命题', '起源', '背景',
    '对比', '档案', '架构', '开源', '创始人', '编年史',
    '价格对比', '编年史续',
  ]);
  return !generic.has(cjk);
}

/**
 * 获取行号（基于索引）
 */
function getLineNumber(html, index) {
  const before = html.substring(0, index);
  return (before.match(/\n/g) || []).length + 1;
}

// ─── 检查规则 ───────────────────────────────────────────────

const results = {
  p0: [],
  p1: [],
  p2: [],
  summary: { total: 0, p0: 0, p1: 0, p2: 0 },
};

function addResult(level, rule, message, line, context) {
  const entry = { level, rule, message, line, context: context || '' };
  results[level].push(entry);
  results.summary[level]++;
  results.summary.total++;
}

/**
 * P0-1: Tailwind 默认 indigo 作为 accent
 */
function checkIndigoAccent(html) {
  const allCss = extractStyleBlocks(html).map(b => b.content).join('\n');
  const inlineStyles = extractInlineStyles(html);
  const allColors = extractColors(allCss);

  // 检查 CSS 变量 --accent 的值
  const accentMatch = allCss.match(/--accent(?:-light|-dark)?:\s*([^;]+)/gi);
  if (accentMatch) {
    accentMatch.forEach(def => {
      const colors = extractColors(def);
      colors.forEach(c => {
        const norm = normalizeHex(c.value);
        if (INDIGO_PALETTE.has(norm)) {
          addResult('p0', 'INDIGO_ACCENT',
            `CSS 变量使用了 Tailwind 默认 indigo: ${c.value}`,
            null, def.trim());
        }
      });
    });
  }

  // 检查内联样式中的 indigo
  inlineStyles.forEach(s => {
    const colors = extractColors(s.value);
    colors.forEach(c => {
      const norm = normalizeHex(c.value);
      if (INDIGO_PALETTE.has(norm)) {
        addResult('p0', 'INDIGO_ACCENT',
          `内联样式使用了 Tailwind 默认 indigo: ${c.value}`,
          getLineNumber(html, s.index),
          s.value.substring(0, 80));
      }
    });
  });

  // 检查 data-background-color 和 style background
  const bgAttrRe = /data-background-color="([^"]+)"/gi;
  let m;
  while ((m = bgAttrRe.exec(html)) !== null) {
    const norm = normalizeHex(m[1]);
    if (INDIGO_PALETTE.has(norm)) {
      addResult('p0', 'INDIGO_ACCENT',
        `data-background-color 使用了 Tailwind 默认 indigo: ${m[1]}`,
        getLineNumber(html, m.index));
    }
  }
}

/**
 * P0-2: Emoji 做功能图标
 */
function checkEmojiInTitles(html) {
  const titleRe = /<(h[1-6]|button|li)[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = titleRe.exec(html)) !== null) {
    const text = stripTags(m[2]);
    if (EMOJI_RE.test(text)) {
      const emoji = text.match(EMOJI_RE)[0];
      addResult('p0', 'EMOJI_TITLE',
        `标题/按钮/列表中使用了 Emoji: "${emoji}"`,
        getLineNumber(html, m.index),
        text.substring(0, 60));
    }
  }
}

/**
 * P0-3: ALL CAPS 无 letter-spacing
 */
function checkAllCapsTracking(html) {
  const styleBlocks = extractStyleBlocks(html);
  const allCss = styleBlocks.map(b => b.content).join('\n');

  // 收集有 text-transform: uppercase 的选择器
  const upperSelectors = [];
  const ruleRe = /([^{}]+)\{([^}]*)\}/g;
  let m;
  while ((m = ruleRe.exec(allCss)) !== null) {
    const selector = m[1].trim();
    const body = m[2];
    if (/text-transform\s*:\s*uppercase/i.test(body)) {
      const hasTracking = /letter-spacing\s*:/i.test(body);
      if (!hasTracking) {
        upperSelectors.push(selector);
      }
    }
  }

  if (upperSelectors.length > 0) {
    addResult('p0', 'ALL_CAPS_NO_TRACKING',
      `text-transform: uppercase 但缺少 letter-spacing`,
      null,
      `选择器: ${upperSelectors.join(', ')}`);
  }

  // 检查 HTML 中 ALL CAPS 文本（非 HTML 标签内容全大写但无 tracking）
  const inlineStyles2 = extractInlineStyles(html);
  inlineStyles2.forEach(s => {
    if (/text-transform\s*:\s*uppercase/i.test(s.value) &&
        !/letter-spacing\s*:/i.test(s.value)) {
      addResult('p0', 'ALL_CAPS_NO_TRACKING',
        `内联 uppercase 但缺少 letter-spacing`,
        getLineNumber(html, s.index),
        s.value.substring(0, 80));
    }
  });
}

/**
 * P0-4: 大标题使用负 letter-spacing
 */
function checkHeadingTracking(html) {
  const styleBlocks = extractStyleBlocks(html);
  const allCss = styleBlocks.map(b => b.content).join('\n');

  const ruleRe = /([^{}]+)\{([^}]*)\}/g;
  let m;
  while ((m = ruleRe.exec(allCss)) !== null) {
    const selector = m[1].trim();
    if (!/\bh[12]\b/i.test(selector)) continue;
    const body = m[2];
    const trackingMatch = body.match(/letter-spacing\s*:\s*([^;]+)/i);
    if (trackingMatch && trackingMatch[1].trim().startsWith('-')) {
      addResult('p0', 'HEADING_NEG_TRACKING',
        `大标题选择器使用了负 letter-spacing`,
        null,
        `${selector} { letter-spacing: ${trackingMatch[1].trim()} }`);
    }
  }
}

/**
 * P0-5: 占位文本
 */
function checkPlaceholderText(html) {
  // 移除 script 和 style 标签内容，只检查可见文本
  const textOnly = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ');

  PLACEHOLDER_PATTERNS.forEach(pattern => {
    const match = textOnly.match(pattern);
    if (match) {
      addResult('p0', 'PLACEHOLDER_TEXT',
        `发现占位文本: "${match[0]}"`,
        null,
        `匹配模式: ${pattern}`);
    }
  });
}

/**
 * P0-6: accent 每页超过 3 次
 * 静态检查：统计 var(--accent) 在每个 section 中出现的次数
 */
function checkAccentOverflow(html) {
  const sections = extractSections(html);

  sections.forEach((sec, i) => {
    // 统计 var(--accent) 出现次数（包括 inline style 和 HTML 内容）
    const accentCount = (sec.fullMatch.match(/var\(--accent(?:-light|-dark)?\)/gi) || []).length;
    // 统计 OKLCH 相对色（oklch(from var(--accent) ...)）
    const oklchAccentCount = (sec.fullMatch.match(/oklch\s*\(\s*from\s+var\(--accent/gi) || []).length;
    // 也检查 accent 色值直接使用
    const accentHexRe = /--accent(?:-light|-dark)?:\s*([^;]+)/gi;
    const cssBlocks = extractStyleBlocks(html);
    let accentHexValues = [];
    cssBlocks.forEach(b => {
      let m;
      while ((m = accentHexRe.exec(b.content)) !== null) {
        const colors = extractColors(m[1]);
        accentHexValues.push(...colors.map(c => normalizeHex(c.value)));
      }
    });

    // 检查 section 内联 style 中直接使用 accent hex 值
    const inlineInSec = extractInlineStyles(sec.fullMatch);
    let directAccentCount = 0;
    inlineInSec.forEach(s => {
      const colors = extractColors(s.value);
      colors.forEach(c => {
        if (accentHexValues.includes(normalizeHex(c.value))) {
          directAccentCount++;
        }
      });
    });

    const totalAccentUses = accentCount + oklchAccentCount + directAccentCount;
    if (totalAccentUses > 3) {
      addResult('p0', 'ACCENT_OVERFLOW',
        `Slide ${i + 1}: accent 使用 ${totalAccentUses} 次（上限 3 次）`,
        getLineNumber(html, sec.index));
    }
  });
}

/**
 * P0-7: 圆角卡片 + 左侧彩色边框（经典 AI dashboard 瓦片）
 */
function checkCardAntiPattern(html) {
  const allCss = extractStyleBlocks(html).map(b => b.content).join('\n');
  const ruleRe = /([^{}]+)\{([^}]*)\}/g;
  let m;

  while ((m = ruleRe.exec(allCss)) !== null) {
    const selector = m[1].trim();
    const body = m[2];

    // border-radius ≥ 4px 才算"圆角"（2px 几乎不可见，不算）
    const radiusMatch = body.match(/border-radius\s*:\s*(\d+(?:\.\d+)?)(px|em|rem)/i);
    const radiusVal = radiusMatch ? parseFloat(radiusMatch[1]) : 0;
    const hasBorderRadius = radiusVal >= 4;
    const hasLeftBorder = /border-left\s*:\s*\d+px\s+solid/i.test(body) ||
                          /border-left\s*:\s*[^;]*var\(--accent/i.test(body);

    if (hasBorderRadius && hasLeftBorder) {
      addResult('p0', 'CARD_PLUS_BORDER',
        `圆角 + 左侧彩色边框（AI dashboard 瓦片反模式）`,
        null,
        `选择器: ${selector}`);
    }
  }
}

/**
 * P1-10: Ghost card（1px border + 16px+ radius + box-shadow）
 * impeccable Codex 绝对禁令
 */
function checkGhostCards(html) {
  const allCss = extractStyleBlocks(html).map(b => b.content).join('\n');
  const ruleRe = /([^{}]+)\{([^}]*)\}/g;
  let m;

  while ((m = ruleRe.exec(allCss)) !== null) {
    const selector = m[1].trim();
    const body = m[2];

    const hasThinBorder = /border\s*:\s*1px\s+solid/i.test(body);
    const radiusMatch = body.match(/border-radius\s*:\s*(\d+(?:\.\d+)?)(px|em|rem)/i);
    const hasLargeRadius = radiusMatch && parseFloat(radiusMatch[1]) >= 16;
    const hasShadow = /box-shadow\s*:/i.test(body);

    if (hasThinBorder && hasLargeRadius && hasShadow) {
      addResult('p0', 'GHOST_CARD',
        `Ghost card 模式：1px border + border-radius ≥16px + box-shadow（impeccable 禁令）`,
        null,
        `选择器: ${selector}。改为实色背景或移除 shadow`);
    }
  }
}

/**
 * P1-11: Over-rounding（border-radius ≥32px）
 * impeccable Codex 绝对禁令
 */
function checkOverRounding(html) {
  const allCss = extractStyleBlocks(html).map(b => b.content).join('\n');
  const inlineStyles = extractInlineStyles(html);

  const checkSource = (css, source) => {
    const radiusRe = /border-radius\s*:\s*(\d+(?:\.\d+)?)(px|em|rem)/gi;
    let m;
    while ((m = radiusRe.exec(css)) !== null) {
      if (parseFloat(m[1]) >= 32) {
        addResult('p0', 'OVER_ROUNDING',
          `border-radius ${m[1]}${m[2]} 过大（impeccable 禁令，上限 24px）`,
          null, source);
      }
    }
  };

  checkSource(allCss, '<style> block');
  inlineStyles.forEach(s => {
    checkSource(s.value, `inline style`);
  });
}

/**
 * P1-12: Side-stripe border（>1px 左/右边框做强调）
 * impeccable 绝对禁令
 */
function checkSideStripeBorder(html) {
  const allCss = extractStyleBlocks(html).map(b => b.content).join('\n');
  const ruleRe = /([^{}]+)\{([^}]*)\}/g;
  let m;

  while ((m = ruleRe.exec(allCss)) !== null) {
    const selector = m[1].trim();
    const body = m[2];

    // 检查 border-left/right > 1px 且带颜色
    const sideBorderMatch = body.match(/border-(left|right)\s*:\s*(\d+)px\s+solid\s+([^;]+)/i);
    if (sideBorderMatch && parseInt(sideBorderMatch[2]) > 1) {
      // 如果颜色是 accent 或非中性色
      const color = sideBorderMatch[3];
      if (/var\(--c-(?!bg|ink|mute|text|divider|border|rule|grid|fg|line|paper|surface)/i.test(color) || /#[0-9a-fA-F]{3,8}/.test(color)) {
        addResult('p0', 'SIDE_STRIPE_BORDER',
          `Side-stripe border: border-${sideBorderMatch[1]} ${sideBorderMatch[2]}px solid（impeccable 禁令）`,
          null,
          `选择器: ${selector}。用背景色差异代替边框强调`);
      }
    }
  }

  // 也检查内联 style
  const inlineStyles = extractInlineStyles(html);
  inlineStyles.forEach(s => {
    const sideMatch = s.value.match(/border-(left|right)\s*:\s*(\d+)px\s+solid\s+([^;]+)/i);
    if (sideMatch && parseInt(sideMatch[2]) > 1) {
      const color = sideMatch[3];
      if (/var\(--c-(?!bg|ink|mute|text|divider|border|rule|grid|fg|line|paper|surface)/i.test(color) || /#[0-9a-fA-F]{3,8}/.test(color)) {
        addResult('p0', 'SIDE_STRIPE_BORDER',
          `内联 side-stripe: border-${sideMatch[1]} ${sideMatch[2]}px solid（impeccable 禁令）`,
          getLineNumber(html, s.index));
      }
    }
  });
}

// ─── P1 检查 ────────────────────────────────────────────────

/**
 * P1-1: 禁止的字体
 */
function checkBannedFonts(html) {
  const allCss = extractStyleBlocks(html).map(b => b.content).join('\n');
  const fontMatch = allCss.match(/font-family\s*:\s*([^;]+)/gi) || [];

  fontMatch.forEach(fm => {
    const fontList = fm.replace(/font-family\s*:\s*/i, '').toLowerCase();
    BANNED_FONTS.forEach(banned => {
      if (fontList.includes(banned)) {
        addResult('p1', 'BANNED_FONT',
          `使用了禁止的字体: "${banned}"`,
          null,
          fm.trim());
      }
    });
  });
}

/**
 * P1-2: 纯黑/纯白无 tint
 */
function checkPureBlackWhite(html) {
  const allCss = extractStyleBlocks(html).map(b => b.content).join('\n');
  const inlineStyles = extractInlineStyles(html);

  const checkCssSource = (css, source) => {
    const colors = extractColors(css);
    colors.forEach(c => {
      const norm = normalizeHex(c.value);
      if (norm === '#000000' || norm === '#000') {
        // 排除 reset 样式和代码块
        if (!/pre\s|code\s|\.hljs/i.test(css.substring(Math.max(0, c.index - 100), c.index))) {
          addResult('p1', 'PURE_BLACK_WHITE',
            `使用了纯黑 ${c.value}，应添加 tint`,
            null, source);
        }
      }
      if (norm === '#ffffff' || norm === '#fff') {
        // 纯白在亮色背景上可能合理，但仍建议检查
        // 只在 CSS 变量定义或背景色中警告
        if (/--bg|--text|--surface|background|--white/i.test(
          css.substring(Math.max(0, c.index - 50), c.index + 50)
        )) {
          addResult('p1', 'PURE_BLACK_WHITE',
            `使用了纯白 ${c.value}，应考虑添加微量色调`,
            null, source);
        }
      }
    });
  };

  checkCssSource(allCss, '<style> block');
  inlineStyles.forEach(s => {
    checkCssSource(s.value, `inline style (line ${getLineNumber(html, s.index)})`);
  });
}

/**
 * P1-3: 字重超过 4 档
 * 只统计 CSS 中实际使用的 font-weight 声明（不解析 Google Fonts URL，
 * 因为 URL 中包含可变字体的多轴参数，容易误判）
 */
function checkFontWeightDiscipline(html) {
  const allCss = extractStyleBlocks(html).map(b => b.content).join('\n');
  const weightRe = /font-weight\s*:\s*(\d{3})/gi;
  const weights = new Set();
  let m;
  while ((m = weightRe.exec(allCss)) !== null) {
    weights.add(m[1]);
  }

  // 也检查内联 style 中的 font-weight
  const inlineStyles = extractInlineStyles(html);
  inlineStyles.forEach(s => {
    const fwMatch = s.value.match(/font-weight\s*:\s*(\d{3})/i);
    if (fwMatch) weights.add(fwMatch[1]);
  });

  if (weights.size > 4) {
    addResult('p1', 'TOO_MANY_WEIGHTS',
      `使用了 ${weights.size} 种字重: ${[...weights].sort().join(', ')}（建议 ≤4 档）`,
      null,
      `推荐: 300/400 (Read) + 500 (Emphasize) + 600 (Announce)`);
  }
}

/**
 * P1-4: 双色调渐变（紫→蓝/蓝→青 hero）
 */
function checkDuotoneGradient(html) {
  const allCss = extractStyleBlocks(html).map(b => b.content).join('\n');
  const gradientRe = /linear-gradient\s*\([^)]+\)/gi;
  let m;

  while ((m = gradientRe.exec(allCss)) !== null) {
    const grad = m[0];
    const colors = extractColors(grad);

    if (colors.length >= 2) {
      DUOTONE_GRADIENT_PAIRS.forEach(pair => {
        const hasFirst = colors.some(c => normalizeHex(c.value) === pair[0]);
        const hasSecond = colors.some(c => normalizeHex(c.value) === pair[1]);
        if (hasFirst && hasSecond) {
          addResult('p1', 'DUOTONE_GRADIENT',
            `检测到典型 AI "信任"渐变: ${pair[0]} → ${pair[1]}`,
            null,
            grad.substring(0, 80));
        }
      });
    }
  }

  // 也检查 data-background 中的渐变
  const bgGradRe = /data-background="([^"]*gradient[^"]*)"/gi;
  while ((m = bgGradRe.exec(html)) !== null) {
    const grad = m[1];
    const colors = extractColors(grad);
    if (colors.length >= 2) {
      DUOTONE_GRADIENT_PAIRS.forEach(pair => {
        const hasFirst = colors.some(c => normalizeHex(c.value) === pair[0]);
        const hasSecond = colors.some(c => normalizeHex(c.value) === pair[1]);
        if (hasFirst && hasSecond) {
          addResult('p1', 'DUOTONE_GRADIENT',
            `data-background 检测到典型 AI "信任"渐变`,
            getLineNumber(html, m.index));
        }
      });
    }
  }
}

/**
 * P1-5: 渐变文字（background-clip: text）
 */
function checkGradientText(html) {
  const allCss = extractStyleBlocks(html).map(b => b.content).join('\n');
  if (/background-clip\s*:\s*text/i.test(allCss) ||
      /-webkit-background-clip\s*:\s*text/i.test(allCss)) {
    // 检查是否配合渐变使用
    const ruleRe = /([^{}]+)\{([^}]*)\}/g;
    let m;
    while ((m = ruleRe.exec(allCss)) !== null) {
      const body = m[2];
      if ((/background-clip\s*:\s*text/i.test(body) ||
           /-webkit-background-clip\s*:\s*text/i.test(body)) &&
          /gradient/i.test(body)) {
        addResult('p0', 'GRADIENT_TEXT',
          `使用了渐变文字，建议改用纯色 + 排版层次`,
          null,
          `选择器: ${m[1].trim()}`);
      }
    }
  }
}

// ─── P2 检查 ────────────────────────────────────────────────

/**
 * P2-1: 所有内容都居中
 */
function checkEverythingCentered(html) {
  const sections = extractSections(html);
  let centeredCount = 0;
  let totalSections = sections.length;

  sections.forEach(sec => {
    const secCss = sec.attrs.match(/style="([^"]*)"/);
    if (secCss && /text-align\s*:\s*center/i.test(secCss[1])) {
      centeredCount++;
    }
    // 也检查 CSS 中的 section 规则
    const allCss = extractStyleBlocks(html).map(b => b.content).join('\n');
    if (/\.reveal\s+section\s*\{[^}]*text-align\s*:\s*center/i.test(allCss) ||
        /\.reveal\s+\.slides\s*\{[^}]*text-align\s*:\s*center/i.test(allCss)) {
      // 全局居中设置
      centeredCount = totalSections;
    }
  });

  if (totalSections > 0 && centeredCount === totalSections) {
    addResult('p2', 'EVERYTHING_CENTERED',
      `所有 ${totalSections} 页都使用居中对齐，建议左对齐 + 非对称布局`,
      null);
  }
}

/**
 * P2-2: 玻璃拟态过度使用
 */
function checkGlassmorphismOveruse(html) {
  const allCss = extractStyleBlocks(html).map(b => b.content).join('\n');
  const backdropCount = (allCss.match(/backdrop-filter\s*:/gi) || []).length;

  if (backdropCount > 2) {
    addResult('p2', 'GLASSMORPHISM_OVERUSE',
      `backdrop-filter 使用 ${backdropCount} 次，可能过度使用玻璃拟态`,
      null,
      `建议仅在 modal/overlay 等场景使用`);
  }
}

/**
 * P2-3: 缺少 prefers-reduced-motion 支持
 */
function checkReducedMotion(html) {
  const allCss = extractStyleBlocks(html).map(b => b.content).join('\n');
  const hasFragment = html.includes('class="fragment') || html.includes("class='fragment");
  const hasReducedMotion = /@media\s*\(\s*prefers-reduced-motion/i.test(allCss);

  if (hasFragment && !hasReducedMotion) {
    addResult('p2', 'NO_REDUCED_MOTION',
      `使用了 fragment 动画但缺少 prefers-reduced-motion 支持`,
      null);
  }
}

/**
 * P1: 禁止 text-shadow
 */
function checkTextShadow(html) {
  const allCss = extractStyleBlocks(html).map(b => b.content).join('\n');
  if (/text-shadow\s*:/.test(allCss)) {
    const line = getLineNumber(html, allCss.indexOf('text-shadow'));
    addResult('p1', 'TEXT_SHADOW',
      `发现 text-shadow 使用（演示文稿中文字已足够大，不需要阴影）`,
      line);
  }
  // inline styles
  const inlineInHtml = extractInlineStyles(html);
  inlineInHtml.forEach(s => {
    if (/text-shadow\s*:/.test(s.value)) {
      addResult('p1', 'TEXT_SHADOW',
        `inline style 中使用了 text-shadow`,
        getLineNumber(html, s.index));
    }
  });
}

/**
 * P0: 捏造数据模式检测
 */
function checkFakeData(html) {
  const sections = extractSections(html);
  sections.forEach((sec, i) => {
    const text = sec.fullMatch.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    FAKE_DATA_PATTERNS.forEach(pattern => {
      if (pattern.test(text)) {
        addResult('p0', 'FAKE_DATA',
          `Slide ${i + 1}: 可能包含捏造数据指标（"${pattern.source}"）`,
          getLineNumber(html, sec.index));
      }
    });
  });
}

/**
 * P1: Hero-metric 反模式（大数字 + 小标签 + 渐变背景组合）
 */
function checkHeroMetric(html) {
  const sections = extractSections(html);
  sections.forEach((sec, i) => {
    const content = sec.fullMatch;
    const hasBigNumber = /font-size\s*:[^;]*[3-9]em/i.test(content) || /font-size\s*:[^;]*clamp\([^)]*[3-9]em/i.test(content);
    const hasSmallLabel = /font-size\s*:[^;]*(?:0\.[4-7]em|small|xs)/i.test(content);
    const hasGradientBg = /background\s*:\s*linear-gradient/i.test(content) || /background-image\s*:\s*linear-gradient/i.test(content);
    if (hasBigNumber && hasSmallLabel && hasGradientBg) {
      addResult('p0', 'HERO_METRIC',
        `Slide ${i + 1}: 大数字 + 小标签 + 渐变背景组合（hero-metric 反模式）`,
        getLineNumber(html, sec.index));
    }
  });
}

/**
 * P2-4: 缺少 OKLCH 颜色系统
 */
function checkColorSystem(html) {
  const allCss = extractStyleBlocks(html).map(b => b.content).join('\n');
  const hasOklch = /oklch\s*\(/i.test(allCss);
  const hasCssVars = /--primary\s*:|--bg\s*:|--text\s*:|--accent\s*:|--c-bg\s*:|--c-fg\s*:|--c-accent\s*:/.test(allCss);

  if (!hasOklch && !hasCssVars) {
    addResult('p2', 'NO_COLOR_SYSTEM',
      `未检测到 OKLCH 或 CSS 变量颜色系统`,
      null,
      `推荐使用 OKLCH 定义 :root 颜色变量`);
  }
}

/**
 * P1-7: Font Awesome CDN 引用（建议迁移到 inline SVG）
 */
function checkFontAwesome(html) {
  if (/font-awesome|fontawesome|cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome/i.test(html)) {
    addResult('p1', 'FONT_AWESOME_CDN',
      `检测到 Font Awesome CDN 引用，建议迁移到 inline SVG 图标`,
      getLineNumber(html, html.search(/font-awesome|fontawesome/i)),
      `参考 references/icon-system.md 的迁移指南，可减少 ~100KB 加载`);
  }
}

/**
 * P2-6: SVG 图标描边宽度不合规（推荐 1.6px）
 */
function checkIconStrokeWidth(html) {
  const svgRe = /<svg[^>]*>[\s\S]*?<\/svg>/gi;
  let m;
  while ((m = svgRe.exec(html)) !== null) {
    const svg = m[0];
    // 跳过非图标 SVG（流程图、数据图、地图、雷达图等语义图形）
    if (isSemanticSvg(svg)) continue;
    const swMatch = svg.match(/stroke-width=["']?([0-9.]+)/);
    if (swMatch) {
      const sw = parseFloat(swMatch[1]);
      // 检查是否在 1.4-2.0 范围外（允许一定容差）
      if (sw < 1.4 || sw > 2.0) {
        addResult('p2', 'ICON_STROKE_WIDTH',
          `SVG 图标 stroke-width=${sw}，推荐 1.6（范围 1.4-2.0）`,
          getLineNumber(html, m.index),
          svg.substring(0, 80));
      }
    }
  }
}

/**
 * P2-7: SVG 图标使用硬编码颜色（应使用 currentColor）
 */
function checkIconHardcodedColor(html) {
  const svgRe = /<svg[^>]*>[\s\S]*?<\/svg>/gi;
  let m;
  let found = 0;
  while ((m = svgRe.exec(html)) !== null) {
    if (found >= 3) break; // 最多报告 3 个
    const svg = m[0];
    // 跳过非图标 SVG（流程图、数据图、地图、雷达图等语义图形）
    if (isSemanticSvg(svg)) continue;
    // 检查 stroke 使用了硬编码颜色（非 currentColor/none/var()）
    const strokeMatch = svg.match(/stroke=["']([^"']+)["']/g);
    if (strokeMatch) {
      for (const sm of strokeMatch) {
        const val = sm.match(/stroke=["']([^"']+)["']/)[1];
        if (val !== 'currentColor' && val !== 'none' && !val.startsWith('var(')) {
          addResult('p2', 'ICON_HARDCODED_COLOR',
            `SVG 图标 stroke 使用硬编码颜色 "${val}"，应改为 currentColor`,
            getLineNumber(html, m.index),
            svg.substring(0, 80));
          found++;
          break;
        }
      }
    }
  }
}

function isSemanticSvg(svg) {
  if (/width="[34][02]"/.test(svg) || /width="200"/.test(svg)) return true;
  if (/\b(?:flow-svg|slope|chart|map|radar|diagram|mechanism|network)\b/i.test(svg)) return true;
  if (/aria-label="[^"]*(?:chart|map|radar|flow|diagram|mechanism|slope|network|architecture|system)[^"]*"/i.test(svg)) return true;

  const viewBox = svg.match(/viewBox=["']\s*[-0-9.]+\s+[-0-9.]+\s+([0-9.]+)\s+([0-9.]+)\s*["']/i);
  if (viewBox) {
    const width = parseFloat(viewBox[1]);
    const height = parseFloat(viewBox[2]);
    if (width >= 96 || height >= 96) return true;
  }

  return false;
}

/**
 * P1-8: 溢出防护缺失（overflow prevention）
 */
function checkOverflowPrevention(html) {
  const styleBlocks = extractStyleBlocks(html);
  const allCss = styleBlocks.map(b => b.content).join('\n');

  // 检查 .reveal section 是否有 overflow: hidden
  const hasOverflowHidden = /\.reveal\s+(?:section|\.slides\s+>?\s*section)\s*\{[^}]*(?:overflow\s*:\s*hidden|overflow:hidden)/is.test(allCss);
  if (!hasOverflowHidden) {
    addResult('p1', 'NO_OVERFLOW_HIDDEN',
      `.reveal section 缺少 overflow: hidden，内容可能溢出 slide 边界`,
      null,
      `在 .reveal section {} 中添加 overflow: hidden;`);
  }

  // 检查是否有 word-break/overflow-wrap 防护
  const hasWordBreak = /word-break\s*:\s*break-word/.test(allCss) || /overflow-wrap\s*:\s*break-word/.test(allCss);
  if (!hasWordBreak) {
    addResult('p2', 'NO_WORD_BREAK',
      `缺少 word-break: break-word 防护，长文本可能撑破容器`,
      null,
      `添加：h1, h2, h3, h4, p, li, span, div { word-break: break-word; overflow-wrap: break-word; }`);
  }
}

/**
 * P0-8: vw/vh 单位（Reveal.js 中禁止使用）
 */
function checkViewportUnits(html) {
  const styleBlocks = extractStyleBlocks(html);
  const allCss = styleBlocks.map(b => b.content).join('\n');
  const violations = [];

  // 检查 <style> 中的 vw/vh
  const vwInStyleRe = /([0-9.]+)\s*(v[wh])\b/gi;
  let m;
  while ((m = vwInStyleRe.exec(allCss)) !== null) {
    // 排除注释中的
    const before = allCss.substring(Math.max(0, m.index - 30), m.index);
    if (/\/\*/.test(before) && !/\*\//.test(before)) continue;
    violations.push({ value: m[0], line: null, source: '<style>' });
  }

  // 检查内联 style 中的 vw/vh
  const inlineStyles = extractInlineStyles(html);
  inlineStyles.forEach(s => {
    const vwMatches = s.value.match(/([0-9.]+)\s*(v[wh])\b/gi);
    if (vwMatches) {
      violations.push({
        value: vwMatches.join(', '),
        line: getLineNumber(html, s.index),
        source: `inline style`
      });
    }
  });

  // 检查 clamp() 中间值是否有 vw/vh（仅检查内联 style，避免与 <style> 重复）
  const clampRe = /clamp\s*\([^)]+\)/gi;
  const inlineOnly = inlineStyles.map(s => s.value).join('\n');
  while ((m = clampRe.exec(inlineOnly)) !== null) {
    if (/v[wh]\b/i.test(m[0])) {
      violations.push({
        value: m[0],
        line: null,
        source: 'clamp() 中包含 vw/vh'
      });
    }
  }

  if (violations.length > 0) {
    violations.slice(0, 5).forEach(v => {
      addResult('p0', 'VIEWPORT_UNITS',
        `使用了 vw/vh 单位: ${v.value}（${v.source}）`,
        v.line,
        `Reveal.js 用 transform:scale() 缩放，vw/vh 不受影响。改用 em 单位。`);
    });
  }
}

/**
 * P0-9: Font Awesome 图标使用（应改为 inline SVG）
 */
function checkFontAwesomeUsage(html) {
  // 检查 <i class="fas/fa-..." 和 <i class="... fa-xxx">
  const faIconRe = /class="[^"]*\b(fa[slrbdtk]?\s+fa-[\w-]+|fa-[\w-]+)[^"]*"/gi;
  let m;
  let count = 0;
  while ((m = faIconRe.exec(html)) !== null) {
    if (count >= 5) break;
    addResult('p0', 'FONTAWESOME_ICON',
      `使用了 Font Awesome 图标类: ${m[1]}`,
      getLineNumber(html, m.index),
      `替换为 inline SVG，参考 references/icon-system.md`);
    count++;
  }
}

/**
 * P1-9: 内容密度检查
 */
function checkContentDensity(html) {
  const sections = extractSections(html);
  // 排除嵌套的子 section（垂直 slide 的父 section）
  const topLevelSections = sections.filter((sec, i) => {
    // 如果这个 section 的内容包含其他 <section>，它是嵌套父级，跳过
    return !/<section[\s>]/i.test(sec.content.trim().substring(0, 50));
  });

  topLevelSections.forEach((sec, i) => {
    const content = sec.content;

    // 检查列表项数量：单个垂直列表 <=5；多列对比页允许总数略高但不应超过 8。
    const listBlocks = content.match(/<[uo]l[\s\S]*?<\/[uo]l>/gi) || [];
    const counts = listBlocks.map(block => (block.match(/<li[\s>]/gi) || []).length);
    const maxListItems = counts.length ? Math.max(...counts) : 0;
    const totalListItems = counts.reduce((sum, count) => sum + count, 0);
    if (maxListItems > 5 || totalListItems > 8) {
      addResult('p1', 'DENSE_LIST',
        `Slide ${i + 1}: 列表有 ${totalListItems} 项（单列表上限 5 项，多列总上限 8 项）`,
        getLineNumber(html, sec.index),
        `拆成 2 页，或缩减单列表/整页列表数量`);
    }

    // 检查卡片数量（grid/flex 子项带 padding 的 div）
    const cardDivs = content.match(/<div[^>]*style="[^"]*padding[^"]*"[^>]*>\s*<(h[1-6]|p|svg)/gi) || [];
    if (cardDivs.length > 4) {
      addResult('p1', 'DENSE_CARDS',
        `Slide ${i + 1}: 卡片/面板 ${cardDivs.length} 个（上限 4 个）`,
        getLineNumber(html, sec.index));
    }

    // 检查代码块行数
    const codeBlock = content.match(/<code[^>]*>([\s\S]*?)<\/code>/gi);
    if (codeBlock) {
      codeBlock.forEach(block => {
        const lines = block.split('\n').length - 1;
        if (lines > 8) {
          addResult('p1', 'DENSE_CODE',
            `Slide ${i + 1}: 代码块 ${lines} 行（上限 8 行）`,
            getLineNumber(html, sec.index),
            `缩减代码或拆成 2 页`);
        }
      });
    }
  });
}

/**
 * P2-8: 背景层次检查（规则 11: ≥80% 页面有背景层次）
 */
function checkBackgroundTexture(html) {
  const allCss = extractStyleBlocks(html).map(b => b.content).join('\n');
  const hasColorField = /--c-bg\s*:|--bg\s*:/.test(allCss) &&
    /background\s*:\s*var\(--(?:c-)?bg\)/i.test(allCss);

  const hasGlobalTexture =
    /\.reveal\s+section\s*::?(after|before)\s*\{[^}]*(?:background-image|radial-gradient|linear-gradient|repeating-linear)/is.test(allCss);
  const hasNoiseTexture = /feTurbulence|fractalNoise/i.test(allCss) || /data:image\/svg/i.test(allCss);

  if (!hasColorField && !hasGlobalTexture && !hasNoiseTexture) {
    addResult('p2', 'NO_BACKGROUND_TEXTURE',
      `未检测到颜色场背景或全局背景层次`,
      null,
      `至少定义 --c-bg/--bg 并将 reveal 背景绑定到该 token；纹理仅用于签名页`);
  }
}

/**
 * P2-9: 签名时刻检查（规则 12: ≥1 个签名时刻）
 */
function checkSignatureMoment(html) {
  const allCss = extractStyleBlocks(html).map(b => b.content).join('\n');
  const signatures = [];

  if (/data-background-color="var\(--accent/i.test(html)) {
    signatures.push('全出血色块页');
  }

  const inlineStyles = extractInlineStyles(html);
  inlineStyles.forEach(s => {
    const emMatch = s.value.match(/font-size\s*:[^;]*?(\d+(?:\.\d+)?)\s*em/i);
    if (emMatch && parseFloat(emMatch[1]) >= 4 && !signatures.includes('超大数字/引言')) {
      signatures.push('超大数字/引言');
    }
    const clampMatch = s.value.match(/clamp\([^,]+,\s*[^,]+,\s*(\d+(?:\.\d+)?)\s*em\)/i);
    if (clampMatch && parseFloat(clampMatch[1]) >= 4 && !signatures.includes('超大数字/引言')) {
      signatures.push('超大数字/引言');
    }
  });

  if (/grid-template-columns\s*:[^;]*?(?:2fr\s+3fr|3fr\s+5fr|35%|65%|40%|60%|0\.\d+fr\s+1\.\d+fr|1\.\d+fr\s+0\.\d+fr)/i.test(html)) {
    signatures.push('非对称分割');
  }

  const bigFontMatches = allCss.match(/font-size\s*:[^;]*?(\d+(?:\.\d+)?)\s*em/gi) || [];
  bigFontMatches.forEach(m => {
    const val = m.match(/(\d+(?:\.\d+)?)\s*em/);
    if (val && parseFloat(val[1]) >= 4 && !signatures.includes('超大引言')) {
      signatures.push('超大引言');
    }
  });

  if (signatures.length === 0) {
    addResult('p2', 'NO_SIGNATURE_MOMENT',
      `未检测到签名时刻（每份演示需要 ≥1 个）`,
      null,
      `参考 design-polish.md 的 5 种配方：超大引言、非对称分割、单数字聚焦、全出血色块、图文对角`);
  }
}

/**
 * P2-10: 布局多样性检查（相邻 slide 不应有相同结构）
 */
function checkLayoutDiversity(html) {
  const sections = extractSections(html);

  const fingerprints = sections.map(sec => {
    const content = `${sec.attrs}\n${sec.content}`;
    const features = [];
    if (/<h[12]/i.test(content)) features.push('heading');
    if (/<ul[\s>]/i.test(content) || /<ol[\s>]/i.test(content)) features.push('list');
    if (/<pre[\s>]/i.test(content)) features.push('code');
    if (/grid-template-columns|class="[^"]*(?:deck-grid|grid|totems|pipeline|flywheel|lane|swimlane|node-grid|material-board|lookbook|kinetic-stage|beat-grid|cue|chart-wall|dash|case-grid|issue-grid)/i.test(content)) features.push('grid');
    if (/display\s*:\s*flex|class="[^"]*(?:deck-flex|two-col|engine|community-map|profile|flow-board|editor|terminal|diff)/i.test(content)) features.push('flex');
    if (/class="[^"]*danmaku/i.test(content)) features.push('interaction');
    if (/class="[^"]*ecosystem/i.test(content)) features.push('ecosystem');
    if (/class="[^"]*engine/i.test(content)) features.push('split-engine');
    if (/class="[^"]*feature-list/i.test(content)) features.push('flist');
    if (/class="[^"]*card/i.test(content)) features.push('card');
    if (/class="[^"]*stat/i.test(content)) features.push('stat');
    if (/class="[^"]*timeline/i.test(content)) features.push('timeline');
    if (/class="[^"]*(?:material-board|swatch)/i.test(content)) features.push('material-board');
    if (/class="[^"]*(?:ritual|steps)/i.test(content)) features.push('ritual');
    if (/class="[^"]*lookbook/i.test(content)) features.push('lookbook');
    if (/class="[^"]*(?:kinetic-stage|track|dot)/i.test(content)) features.push('kinetic');
    if (/class="[^"]*beat-grid/i.test(content)) features.push('beat-grid');
    if (/class="[^"]*cue/i.test(content)) features.push('cue-page');
    if (/class="[^"]*(?:beat-card|scene|frame-line|film-strip)/i.test(content)) features.push('storyboard');
    if (/class="[^"]*(?:flow-board|swimlane|node-grid)/i.test(content)) features.push('diagram');
    if (/class="[^"]*(?:chart-wall|slope|metric|heatmap|bars)/i.test(content)) features.push('dataviz');
    if (/class="[^"]*(?:editor|code-shell|terminal)/i.test(content)) features.push('code-view');
    if (/data-background-color/i.test(sec.attrs)) features.push('bleed');
    if (/class="[^"]*title-slide/i.test(sec.attrs)) features.push('title');
    return features.sort().join('+');
  });

  for (let i = 0; i < fingerprints.length - 2; i++) {
    if (fingerprints[i] && fingerprints[i] === fingerprints[i + 1] && fingerprints[i] === fingerprints[i + 2]) {
      addResult('p2', 'REPETITIVE_LAYOUT',
        `Slide ${i + 1}-${i + 3} 布局结构相同: "${fingerprints[i]}"`,
        null,
        `建议在连续页面间插入不同布局（引言页、色块页、数据页等）`);
      break;
    }
  }
}

/**
 * P1: 骨架换皮检测（失败门禁 #9 / spec Innovation 反 AI 模板）
 * 多数页面用通用 class（slide/card/panel/section...）且无主题原生 class
 * = 「左标题 + 右图形」5 套换色式 AI 模板感。
 */
function checkSkeletonReskin(html) {
  const sections = extractSections(html);
  const topLevel = sections.filter(sec =>
    !/<section[\s>]/i.test(sec.content.trim().substring(0, 50))
  );
  if (topLevel.length < 4) return;   // 小 deck 不评

  const genericRe = /\b(?:slide|section|page|card|panel|content|container|wrapper|block|item|row|col-|grid-item|feature|box|tile|unit|layer|module|segment)\b/i;
  // 主题原生 class 词根(反映领域对象,种子模板已用):纸上看到这类命名 = 有原生形式
  const nativeRe = /\b(?:blueprint|sheet|dimension|terminal|cockpit|stage|lane|board|wall|rail|strip|stack|ledger|ladder|mechanism|editor|bench|specimen|envelope|masthead|lookbook|cue-|beat-|kinetic|frame-|score-|command|civic|handoff|issue-|sample-|endpoint|ritual|totem|flywheel|swimlane|node-grid|flow-board|material-board|swatch|case-grid|chart-wall|slope|heatmap|newsroom|archive|catalog|dossier|manifesto|arena|exchange|workshop|studio|gallery|observatory|price-|market-|court-|field-|lab-)\b/i;

  let generic = 0, native = 0;
  topLevel.forEach(sec => {
    const cls = (sec.attrs.match(/class="([^"]*)"/) || [])[1] || '';
    if (nativeRe.test(cls)) native++;
    else if (genericRe.test(cls)) generic++;
  });

  if (native === 0 && generic >= topLevel.length * 0.6) {
    addResult('p1', 'SKELETON_RESKIN',
      `骨架换皮风险:${generic}/${topLevel.length} 页用通用 class,无主题原生 class(失败门禁 #9)`,
      null,
      `class 命名要反映主题对象(如 blueprint-sheet / terminal-shell / price-ladder / civic-command),不只换颜色字体`);
  }
}

/**
 * P2-11: 微细节多样性检查（规则 15: ≥3 种微细节润色）
 */
function checkMicroDetails(html) {
  const allCss = extractStyleBlocks(html).map(b => b.content).join('\n');
  const inlineStyles = extractInlineStyles(html);
  const detailTypes = [];

  // eyebrow/kicker: uppercase + letter-spacing ≥0.08em
  let hasEyebrow = false;
  inlineStyles.forEach(s => {
    if (/text-transform\s*:\s*uppercase/i.test(s.value) && /letter-spacing\s*:\s*0\.[089]/i.test(s.value)) {
      hasEyebrow = true;
    }
  });
  if (/text-transform\s*:\s*uppercase[\s\S]{0,120}letter-spacing\s*:\s*0\.(?:0[89]|1\d?|2\d)em/i.test(allCss) ||
      /letter-spacing\s*:\s*0\.(?:0[89]|1\d?|2\d)em[\s\S]{0,120}text-transform\s*:\s*uppercase/i.test(allCss)) {
    hasEyebrow = true;
  }
  if (hasEyebrow) detailTypes.push('eyebrow/kicker');

  // divider: height 1-3px + background
  let hasDivider = false;
  inlineStyles.forEach(s => {
    if (/height\s*:\s*[123]px/i.test(s.value) && /background/i.test(s.value)) {
      hasDivider = true;
    }
  });
  if (/height\s*:\s*[123]px[\s\S]{0,80}background/i.test(allCss)) {
    hasDivider = true;
  }
  if (hasDivider) detailTypes.push('分隔线');

  // capsule tag: border-radius 100px+
  let hasCapsule = false;
  inlineStyles.forEach(s => {
    if (/border-radius\s*:\s*(100px|9999px|999px)/i.test(s.value)) hasCapsule = true;
  });
  if (/border-radius\s*:\s*(100px|9999px|999px)/i.test(allCss)) hasCapsule = true;
  if (hasCapsule) detailTypes.push('胶囊标签');

  // numbered labels: "01", "02" pattern in text
  if (/>0[1-9]</.test(html) || />\s*0[1-9]\s*\//.test(html)) detailTypes.push('编号标签');

  // source citation
  if (/来源|Source|数据来源/i.test(html)) detailTypes.push('来源标注');

  // code/terminal label
  if (/class="[^"]*terminal-bar/i.test(html) || /\.ts"|\.js"|\.py"/i.test(html)) {
    detailTypes.push('代码/终端标签');
  }

  if (detailTypes.length < 3) {
    addResult('p2', 'FEW_MICRO_DETAILS',
      `仅检测到 ${detailTypes.length} 种微细节（建议 ≥3 种）`,
      null,
      `已有: ${detailTypes.join('、') || '无'}。可添加: 分隔线、eyebrow 标签、胶囊标签、编号标签、来源标注`);
  }
}

/**
 * P2-12: 间距节奏检查（规则 14: 间距有 3 级节奏）
 */
function checkSpacingRhythm(html) {
  const inlineStyles = extractInlineStyles(html);

  const marginValues = new Set();
  inlineStyles.forEach(s => {
    const mbMatches = s.value.match(/margin-(?:bottom|top)\s*:\s*([^;]+)/gi) || [];
    mbMatches.forEach(m => {
      const val = m.replace(/margin-(?:bottom|top)\s*:\s*/i, '').trim();
      marginValues.add(val);
    });
  });

  if (marginValues.size > 0 && marginValues.size < 3) {
    addResult('p2', 'FLAT_SPACING',
      `间距变化不足: 仅 ${marginValues.size} 种 margin 值（建议 ≥3 种）`,
      null,
      `当前值: ${[...marginValues].join(', ')}。建议: 紧(0.3em) + 中(1em) + 松(2em)`);
  }
}

/**
 * P2-13: 模板 DNA 装饰检查
 */
function checkTemplateDNA(html) {
  const allCss = extractStyleBlocks(html).map(b => b.content).join('\n');
  const decorations = [];

  if (/terminal-bar/i.test(html) || /\.terminal-bar/i.test(allCss)) decorations.push('终端栏 (dark-tech)');
  if (/cursor-blink|@keyframes\s+blink/i.test(allCss)) decorations.push('光标闪烁 (dark-tech)');
  if (/status-dot/i.test(allCss)) decorations.push('状态指示灯 (dark-tech)');

  if (/chapter-num/i.test(allCss)) decorations.push('章节号 (editorial)');
  if (/editorial-divider/i.test(allCss)) decorations.push('社论分隔线 (editorial)');

  if (/axis-label/i.test(allCss)) decorations.push('坐标轴标注 (minimal)');

  if (/glow-orb/i.test(allCss) || /filter\s*:\s*blur/i.test(allCss)) decorations.push('光晕效果 (vibrant)');

  if (/soft-card/i.test(allCss)) decorations.push('柔和卡片 (nature)');
  if (/leaf-deco/i.test(allCss)) decorations.push('叶形装饰 (nature)');
  if (/--f-display\s*:|--font-display\s*:/i.test(allCss) &&
      /--c-accent\s*:|--accent\s*:/i.test(allCss) &&
      (/\.pin\b/i.test(allCss) || /class="[^"]*\bpin\b/i.test(html))) {
    decorations.push('模板字体/色彩/Pin DNA');
  }

  if (decorations.length === 0) {
    addResult('p2', 'NO_TEMPLATE_DNA',
      `未检测到模板专属装饰元素`,
      null,
      `参考 design-polish.md 模板专属装饰，为选择的模板添加 DNA 元素`);
  }
}

/**
 * P1: 文案字数密度检查（纯文字 ≤120 字/页）
 * 统计中文汉字 + 英文单词数
 */
function checkWordCountDensity(html) {
  const sections = extractSections(html);
  const topLevelSections = sections.filter(sec =>
    !/<section[\s>]/i.test(sec.content.trim().substring(0, 50))
  );

  topLevelSections.forEach((sec, i) => {
    const text = stripTags(sec.content).replace(/\s+/g, ' ').trim();
    // 中文字符数
    const cjkCount = (text.match(/[一-鿿　-〿＀-￯]/g) || []).length;
    // 英文单词数
    const enWords = (text.match(/[a-zA-Z]+(?:[-'][a-zA-Z]+)*/g) || []).length;
    // 混合估算：1 中文字 ≈ 1 单位，1 英文词 ≈ 1.5 单位
    const total = cjkCount + Math.round(enWords * 1.5);
    if (total > 120) {
      addResult('p1', 'WORD_COUNT_DENSITY',
        `Slide ${i + 1}: 文案约 ${total} 单位（上限 ≤120）`,
        getLineNumber(html, sec.index),
        `CJK ${cjkCount} 字 + EN ${enWords} 词。缩减文案或拆页`);
    }
  });
}

/**
 * P2: em-dash overuse（每页 >2 个 em-dash/双连字符是 AI 文案节奏 tell）
 * 来源：taste-skill v2 + impeccable detect em-dash-overuse
 */
function checkEmDashOveruse(html) {
  const sections = extractSections(html);
  const topLevelSections = sections.filter(sec =>
    !/<section[\s>]/i.test(sec.content.trim().substring(0, 50))
  );

  topLevelSections.forEach((sec, i) => {
    // 只统计正文标签（p/h）内的 em-dash，排除 span.num 等装饰性破折号
    const bodyTexts = extractTagTexts(sec.content, ['p', 'blockquote']);
    const text = bodyTexts.map(t => t.text).join(' ');
    const emDashCount = (text.match(/—/g) || []).length;
    if (emDashCount > 2) {
      addResult('p2', 'EM_DASH_OVERUSE',
        `Slide ${i + 1}: 正文 ${emDashCount} 个 em-dash（建议 ≤2，AI 文案节奏 tell）`,
        getLineNumber(html, sec.index),
        `用逗号、冒号、句号或括号替代多余破折号`);
    }
  });
}

/**
 * P1: Pin 主题词必须进入主视觉层级
 *
 * 失败模式：页脚写“价格屠夫 / 发版节奏 / 行业冲击”，但主标题或主视觉
 * 只写时间、英文概念或普通说明，导致用户必须看页脚才知道本页论点。
 */
function checkPinMainClaimHierarchy(html) {
  const sections = extractSections(html);
  const topLevelSections = sections.filter(sec =>
    !/<section[\s>]/i.test(sec.content.trim().substring(0, 50))
  );

  topLevelSections.forEach((sec, i) => {
    const pinMatch = sec.content.match(/<[^>]*class="[^"]*\bpin\b[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i);
    if (!pinMatch) return;

    const pinText = normalizeText(stripTags(pinMatch[1]));
    const topic = extractPinTopic(pinText);
    if (!isMeaningfulPinTopic(topic)) return;

    const headingTexts = extractTagTexts(sec.content, ['h1', 'h2', 'h3']);
    const largeTexts = extractLargeInlineTexts(sec.content, 1.2);
    const mainVisualTexts = [...headingTexts, ...largeTexts]
      .map(item => item.text)
      .filter(text => !text.includes(pinText));

    const hasMainClaim = mainVisualTexts.some(text => textContainsClaim(text, topic));
    if (!hasMainClaim) {
      const bodyWithoutPin = sec.content.replace(pinMatch[0], '');
      const bodyText = normalizeText(stripTags(bodyWithoutPin));
      const appearsOnlyInBody = textContainsClaim(bodyText, topic);
      addResult('p1', 'PIN_TOPIC_NOT_IN_MAIN_VISUAL',
        `Slide ${i + 1}: pin 主题「${topic}」没有进入主标题/主视觉层级`,
        getLineNumber(html, sec.index),
        appearsOnlyInBody
          ? `主题词只出现在普通正文中；应升级到 h1/h2/色块/主数字/quote`
          : `当前主视觉候选: ${mainVisualTexts.slice(0, 3).join(' / ') || '无'}`);
    }
  });
}

/**
 * P2: Pin 不应比主标题更像主题
 */
function checkPinVisualRole(html) {
  const sections = extractSections(html);
  const topLevelSections = sections.filter(sec =>
    !/<section[\s>]/i.test(sec.content.trim().substring(0, 50))
  );

  topLevelSections.forEach((sec, i) => {
    const pinMatch = sec.content.match(/<[^>]*class="[^"]*\bpin\b[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i);
    if (!pinMatch) return;

    const topic = extractPinTopic(normalizeText(stripTags(pinMatch[1])));
    if (!isMeaningfulPinTopic(topic)) return;

    const pinTag = pinMatch[0];
    const pinUsesAccent = /color\s*:\s*var\(--c-accent|color\s*:\s*var\(--accent|#[0-9a-fA-F]{3,8}/i.test(pinTag);
    const pinLarge = /font-size\s*:\s*(?:[1-9](?:\.\d+)?em|[3-9]\dpx)/i.test(pinTag);
    if (pinUsesAccent || pinLarge) {
      addResult('p2', 'PIN_TOO_PROMINENT',
        `Slide ${i + 1}: pin 使用了过强的视觉层级`,
        getLineNumber(html, sec.index),
        `pin 只做索引，应使用低层级颜色/小字号；主题「${topic}」应在主视觉中表达`);
    }
  });
}

/**
 * P2: Fragment 数量检查（每页 ≤6 个 fragment）
 */
function checkFragmentCount(html) {
  const sections = extractSections(html);
  const topLevelSections = sections.filter(sec =>
    !/<section[\s>]/i.test(sec.content.trim().substring(0, 50))
  );

  topLevelSections.forEach((sec, i) => {
    const fragmentCount = (sec.content.match(/class="[^"]*fragment[^"]*"/gi) || []).length;
    if (fragmentCount > 6) {
      addResult('p2', 'TOO_MANY_FRAGMENTS',
        `Slide ${i + 1}: ${fragmentCount} 个 fragment（建议 ≤6）`,
        getLineNumber(html, sec.index),
        `过多 fragment 影响演示节奏，考虑拆页或减少动画步骤`);
    }
  });
}

/**
 * P2: 背景覆盖率检查（规则 11: ≥80% 页面有背景层次）
 * 统计有背景纹理/层次装饰的页面占比
 */
function checkBackgroundCoverage(html) {
  const sections = extractSections(html);
  const topLevelSections = sections.filter(sec =>
    !/<section[\s>]/i.test(sec.content.trim().substring(0, 50))
  );

  if (topLevelSections.length < 3) return;

  const allCss = extractStyleBlocks(html).map(b => b.content).join('\n');
  const hasColorField = /--c-bg\s*:|--bg\s*:/.test(allCss) &&
    /background\s*:\s*var\(--(?:c-)?bg\)/i.test(allCss);
  if (hasColorField) return;

  const hasGlobalTexture =
    /\.reveal\s+section\s*::?(after|before)\s*\{[^}]*(?:background-image|radial-gradient|linear-gradient|repeating-linear)/is.test(allCss);

  let decoratedCount = 0;
  topLevelSections.forEach(sec => {
    const content = sec.fullMatch;
    let hasDecoration = false;

    // 全局纹理覆盖（排除 title-slide 等 ::after display:none）
    if (hasGlobalTexture && !/class="[^"]*title-slide/.test(sec.attrs)) {
      hasDecoration = true;
    }

    // data-background-color（非默认 bg 色）
    if (/data-background-color/i.test(sec.attrs) && !/data-background-color="var\(--bg\)"/i.test(sec.attrs)) {
      hasDecoration = true;
    }

    // data-background 渐变/图片
    if (/data-background="[^"]*(?:gradient|http|\.jpg|\.png|\.svg)/i.test(sec.attrs)) {
      hasDecoration = true;
    }

    // inline background gradient
    if (/background\s*:\s*linear-gradient/i.test(content) ||
        /background-image\s*:\s*linear-gradient/i.test(content)) {
      hasDecoration = true;
    }

    // 装饰性 absolute 元素（terminal-bar、status-dot、装饰几何）
    if (/terminal-bar|status-dot|glow-orb|leaf-deco|class="[^"]*deco/i.test(content)) {
      hasDecoration = true;
    }

    if (hasDecoration) decoratedCount++;
  });

  const ratio = decoratedCount / topLevelSections.length;
  if (ratio < 0.8) {
    const pct = Math.round(ratio * 100);
    addResult('p2', 'LOW_BG_COVERAGE',
      `背景覆盖率 ${pct}%（${decoratedCount}/${topLevelSections.length} 页），建议 ≥80%`,
      null,
      `增加微妙纹理、渐变叠加或装饰几何。参考 design-polish.md 背景层次系统`);
  }
}

// ─── 执行检查 ───────────────────────────────────────────────

const html = fs.readFileSync(filePath, 'utf8');

// P0（必须 pass）
checkIndigoAccent(html);
checkEmojiInTitles(html);
checkAllCapsTracking(html);
checkHeadingTracking(html);
checkPlaceholderText(html);
checkAccentOverflow(html);
checkCardAntiPattern(html);
checkViewportUnits(html);
checkFontAwesomeUsage(html);
checkFakeData(html);

// P1（应该 pass）
checkBannedFonts(html);
checkPureBlackWhite(html);
checkFontWeightDiscipline(html);
checkDuotoneGradient(html);
checkGradientText(html);
checkFontAwesome(html);
checkOverflowPrevention(html);
checkContentDensity(html);
checkGhostCards(html);
checkOverRounding(html);
checkSideStripeBorder(html);
checkTextShadow(html);
checkHeroMetric(html);
checkWordCountDensity(html);
checkPinMainClaimHierarchy(html);
checkSkeletonReskin(html);

// P2（锦上添花）
checkEverythingCentered(html);
checkGlassmorphismOveruse(html);
checkReducedMotion(html);
checkColorSystem(html);
checkIconStrokeWidth(html);
checkIconHardcodedColor(html);
checkBackgroundTexture(html);
checkSignatureMoment(html);
checkLayoutDiversity(html);
checkMicroDetails(html);
checkSpacingRhythm(html);
checkTemplateDNA(html);
checkFragmentCount(html);
checkBackgroundCoverage(html);
checkPinVisualRole(html);
checkEmDashOveruse(html);

// ─── 输出报告 ───────────────────────────────────────────────

if (jsonOutput) {
  console.log(JSON.stringify(results, null, 2));
} else {
  const name = path.basename(filePath);

  console.log('');
  console.log(`╔══════════════════════════════════════════════╗`);
  console.log(`║  设计规范检查报告 (Design Lint)               ║`);
  console.log(`╚══════════════════════════════════════════════╝`);
  console.log(`  文件: ${name}`);
  console.log('');

  const printSection = (label, color, items) => {
    if (items.length === 0) {
      console.log(`  ${color === 'red' ? '🟢' : color === 'yellow' ? '✅' : '💡'} ${label}: 无问题`);
      return;
    }
    console.log(`  ${color === 'red' ? '🔴' : color === 'yellow' ? '🟡' : '💡'} ${label}:`);
    items.forEach(item => {
      const lineInfo = item.line ? ` (行 ${item.line})` : '';
      console.log(`     ${color === 'red' ? '✗' : '⚠'} [${item.rule}]${lineInfo} ${item.message}`);
      if (item.context) {
        console.log(`       ${item.context}`);
      }
    });
  };

  printSection('P0 必须修复', 'red', results.p0);
  printSection('P1 建议修复', 'yellow', results.p1);
  if (verbose) {
    printSection('P2 锦上添花', 'blue', results.p2);
  }

  console.log('');
  console.log(`  ────────────────────────────────────────────`);
  console.log(`  总计: ${results.summary.total} 个问题`);
  console.log(`    P0: ${results.summary.p0}  P1: ${results.summary.p1}  P2: ${results.summary.p2}`);
  console.log('');

  if (results.summary.p0 > 0) {
    console.log('  ❌ 存在 P0 级违规，必须修复后再交付');
    console.log(`  修复建议: 参考 references/design-principles.md`);
  } else if (results.summary.p1 > 0) {
    console.log('  ⚠️  P0 通过，但存在 P1 建议修复项');
  } else {
    console.log('  ✅ 设计规范检查全部通过');
  }
  console.log('');
}

// 退出码
process.exit(results.summary.p0 > 0 ? 1 : 0);
