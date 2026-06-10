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
const BANNED_FONTS = ['inter', 'roboto', 'arial', 'open sans'];

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
 * P0-4: 大标题无负 letter-spacing
 */
function checkHeadingTracking(html) {
  const styleBlocks = extractStyleBlocks(html);
  const allCss = styleBlocks.map(b => b.content).join('\n');

  // 检查 h1, h2 规则是否有负 letter-spacing
  ['h1', 'h2'].forEach(tag => {
    const headingRuleRe = new RegExp(
      `(?:^|\\s|,})(${tag}(?:\\s|\\.|\\:|\\+|>|~|,)[^{}]*|${tag}\\s*)\\{([^}]*)\\}`,
      'gim'
    );
    let foundHeadingRule = false;
    let hasNegTracking = false;
    let m;

    while ((m = headingRuleRe.exec(allCss)) !== null) {
      foundHeadingRule = true;
      const body = m[2];
      const trackingMatch = body.match(/letter-spacing\s*:\s*([^;]+)/i);
      if (trackingMatch) {
        const val = parseFloat(trackingMatch[1]);
        if (val < 0 || trackingMatch[1].trim().startsWith('-')) {
          hasNegTracking = true;
        }
      }
    }

    if (foundHeadingRule && !hasNegTracking) {
      addResult('p0', 'HEADING_NO_NEG_TRACKING',
        `<${tag}> 定义了样式但缺少负 letter-spacing`,
        null,
        `建议: letter-spacing: -0.01em ~ -0.02em`);
    }
  });
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

    const totalAccentUses = accentCount + directAccentCount;
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
 * P1-3: 字重超过 3 档
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

  if (weights.size > 3) {
    addResult('p1', 'TOO_MANY_WEIGHTS',
      `使用了 ${weights.size} 种字重: ${[...weights].sort().join(', ')}（建议 ≤3 档）`,
      null,
      `推荐: 400 (Read) + 500 (Emphasize) + 600 (Announce)`);
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
        addResult('p1', 'GRADIENT_TEXT',
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
 * P2-4: 缺少 OKLCH 颜色系统
 */
function checkColorSystem(html) {
  const allCss = extractStyleBlocks(html).map(b => b.content).join('\n');
  const hasOklch = /oklch\s*\(/i.test(allCss);
  const hasCssVars = /--primary\s*:|--bg\s*:|--text\s*:|--accent\s*:/.test(allCss);

  if (!hasOklch && !hasCssVars) {
    addResult('p2', 'NO_COLOR_SYSTEM',
      `未检测到 OKLCH 或 CSS 变量颜色系统`,
      null,
      `推荐使用 OKLCH 定义 :root 颜色变量`);
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

// P1（应该 pass）
checkBannedFonts(html);
checkPureBlackWhite(html);
checkFontWeightDiscipline(html);
checkDuotoneGradient(html);
checkGradientText(html);

// P2（锦上添花）
checkEverythingCentered(html);
checkGlassmorphismOveruse(html);
checkReducedMotion(html);
checkColorSystem(html);

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
