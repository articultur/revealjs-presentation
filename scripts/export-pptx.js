#!/usr/bin/env node
/**
 * Reveal.js HTML → 可编辑 PPTX 导出工具
 *
 * 将 reveal.js 演示文稿导出为真正可编辑的 PowerPoint 文件。
 * 每个文本元素（标题、段落、列表项）都是独立的文本框，可在 PowerPoint 中编辑、移动、修改。
 *
 * 使用方法：
 *   node scripts/export-pptx.js <HTML文件>
 *   node scripts/export-pptx.js <HTML文件> -o output.pptx
 *
 * 依赖：
 *   npm install pptxgenjs cheerio
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─── 参数解析 ───────────────────────────────────────────────

const args = process.argv.slice(2);
const htmlFile = args.find(a => !a.startsWith('-'));
const outputIdx = args.indexOf('-o');
const outputFile = outputIdx >= 0 ? args[outputIdx + 1] : null;

if (!htmlFile) {
  console.log('用法: node scripts/export-pptx.js <HTML文件> [-o output.pptx]');
  process.exit(1);
}

const htmlPath = path.resolve(htmlFile);
if (!fs.existsSync(htmlPath)) {
  console.error(`文件不存在: ${htmlPath}`);
  process.exit(1);
}

// ─── 依赖检查 ───────────────────────────────────────────────

let PptxGenJS, cheerio;
try {
  PptxGenJS = require('pptxgenjs');
  cheerio = require('cheerio');
} catch (e) {
  console.error('❌ 缺少依赖，请先安装：');
  console.error('   npm install pptxgenjs cheerio');
  process.exit(1);
}

// ─── 常量 ───────────────────────────────────────────────────

/** PPTX 幻灯片尺寸（英寸）- 16:9 宽屏 */
const SLIDE_W = 13.33;
const SLIDE_H = 7.5;

/** 安全边距（英寸） */
const MARGIN = { top: 0.5, bottom: 0.5, left: 0.6, right: 0.6 };

/** 可用内容区域 */
const CONTENT_W = SLIDE_W - MARGIN.left - MARGIN.right;
const CONTENT_H = SLIDE_H - MARGIN.top - MARGIN.bottom;

/** 标签 → 默认字号（pt） */
const FONT_SIZE_MAP = {
  h1: 36, h2: 28, h3: 22, h4: 18, h5: 16, h6: 14,
  p: 16, li: 14, span: 14, div: 14,
};

/** 标签 → 默认字重 */
const FONT_BOLD_MAP = {
  h1: true, h2: true, h3: true, h4: true,
  strong: true, b: true,
};

/** 不处理的标签（非内容元素） */
const SKIP_TAGS = new Set(['script', 'style', 'aside', 'noscript']);

// ─── CSS 工具函数 ───────────────────────────────────────────

/**
 * 从 HTML 中提取 :root CSS 变量
 */
function extractCssVars(html) {
  const vars = {};
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = styleRe.exec(html)) !== null) {
    const css = m[1];
    const rootRe = /:root\s*\{([^}]+)\}/g;
    let rm;
    while ((rm = rootRe.exec(css)) !== null) {
      const decls = rm[1];
      const propRe = /--([\w-]+)\s*:\s*([^;]+)/g;
      let pm;
      while ((pm = propRe.exec(decls)) !== null) {
        vars[`--${pm[1].trim()}`] = pm[2].trim();
      }
    }
  }
  return vars;
}

/**
 * 解析内联样式字符串为对象
 */
function parseInlineStyle(str) {
  const obj = {};
  if (!str) return obj;
  str.split(';').forEach(decl => {
    const colonIdx = decl.indexOf(':');
    if (colonIdx < 0) return;
    const key = decl.substring(0, colonIdx).trim().toLowerCase();
    const val = decl.substring(colonIdx + 1).trim();
    if (key && val) obj[key] = val;
  });
  return obj;
}

/**
 * 解析颜色值 → { hex: 'RRGGBB' } 或 null
 */
function parseColor(raw, vars) {
  if (!raw) return null;
  let val = raw.trim();

  // 解析 var() 引用
  const varMatch = val.match(/^var\(([^)]+)\)$/);
  if (varMatch) {
    const varName = varMatch[1].trim();
    val = (vars && vars[varName]) || '';
    if (!val) return null;
  }

  // rgba(r,g,b,a)
  const rgbaMatch = val.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbaMatch) {
    return { hex: rgbToHex(+rgbaMatch[1], +rgbaMatch[2], +rgbaMatch[3]) };
  }

  // #hex
  const hexMatch = val.match(/^#([0-9a-fA-F]{3,8})$/);
  if (hexMatch) {
    return { hex: normalizeHex(hexMatch[1]) };
  }

  // 颜色名称
  const namedColors = {
    white: 'FFFFFF', black: '000000', red: 'FF0000', green: '008000',
    blue: '0000FF', yellow: 'FFFF00', orange: 'FFA500', purple: '800080',
    gray: '808080', grey: '808080', transparent: null,
  };
  const lower = val.toLowerCase();
  if (lower in namedColors) {
    return namedColors[lower] ? { hex: namedColors[lower] } : null;
  }

  // oklch / hsl 等无法简单转换，返回 null
  return null;
}

function rgbToHex(r, g, b) {
  return [r, g, b].map(c => c.toString(16).padStart(2, '0').toUpperCase()).join('');
}

function normalizeHex(h) {
  h = h.toUpperCase();
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  return h.substring(0, 6);
}

/**
 * 解析 CSS font-size → pt 值
 */
function parseFontSize(val) {
  if (!val) return null;
  const num = parseFloat(val);
  if (isNaN(num)) return null;
  if (val.includes('em')) return Math.round(num * 16); // 1em ≈ 16pt
  if (val.includes('px')) return Math.round(num * 0.75); // 1px ≈ 0.75pt
  if (val.includes('pt')) return Math.round(num);
  if (val.includes('vw')) return Math.round(num * 1.2); // 粗略估计
  return Math.round(num);
}

/**
 * 解析 font-family
 */
function parseFontFamily(val) {
  if (!val) return 'Calibri';
  // 移除引号，取第一个字体
  const first = val.split(',')[0].replace(/['"]/g, '').trim();
  // 映射常见字体
  const map = {
    'noto sans sc': 'Microsoft YaHei',
    'noto serif sc': 'SimSun',
    'source sans 3': 'Calibri',
    'instrument sans': 'Calibri',
    'plus jakarta sans': 'Calibri',
    'figtree': 'Calibri',
  };
  return map[first.toLowerCase()] || first;
}

// ─── HTML 内容提取 ───────────────────────────────────────────

/**
 * 提取 slide 背景
 */
function extractBackground($, section, vars) {
  const el = $(section);
  const bg = {};

  // data-background-color
  const bgColor = el.attr('data-background-color');
  if (bgColor) {
    const c = parseColor(bgColor, vars);
    if (c) return { color: c.hex };
  }

  // data-background (可能是渐变)
  const bgAttr = el.attr('data-background');
  if (bgAttr) {
    // 尝试解析渐变色
    const colors = bgAttr.match(/#[0-9a-fA-F]{3,8}/g);
    if (colors && colors.length >= 2) {
      return {
        gradient: {
          type: 'gradient',
          stops: colors.slice(0, 2).map((c, i) => ({
            color: normalizeHex(c.replace('#', '')),
            position: i === 0 ? 0 : 1,
          })),
        },
      };
    }
    const gradColors = bgAttr.match(/rgba?\([^)]+\)/g);
    if (gradColors && gradColors.length >= 2) {
      return {
        gradient: {
          type: 'gradient',
          stops: gradColors.slice(0, 2).map((c, i) => {
            const m = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
            return m ? { color: rgbToHex(+m[1],+m[2],+m[3]), position: i===0?0:1 } : null;
          }).filter(Boolean),
        },
      };
    }
  }

  // 内联 style background
  const style = parseInlineStyle(el.attr('style') || '');
  for (const prop of ['background-color', 'background']) {
    if (style[prop]) {
      const c = parseColor(style[prop], vars);
      if (c) return { color: c.hex };
    }
  }

  // 从 CSS 变量推断
  if (vars['--bg']) {
    const c = parseColor(vars['--bg'], vars);
    if (c) return { color: c.hex };
  }

  return bg; // 无背景 → PowerPoint 默认
}

/**
 * 提取 speaker notes
 */
function extractNotes($, section) {
  const notesEl = $(section).find('aside.notes');
  if (notesEl.length) {
    return notesEl.text().trim();
  }
  return '';
}

/**
 * 从 HTML 元素提取格式化文本信息
 */
function extractTextInfo($, el, vars) {
  const $el = $(el);
  const tag = el.tagName?.toLowerCase() || 'span';
  const style = parseInlineStyle($el.attr('style') || '');

  // 文本内容
  const text = $el.text().trim();
  if (!text) return null;

  // 字号
  let fontSize = FONT_SIZE_MAP[tag] || 14;
  if (style['font-size']) {
    const parsed = parseFontSize(style['font-size']);
    if (parsed) fontSize = parsed;
  }
  // clamp() 中取中间值
  const clampMatch = (style['font-size'] || '').match(/clamp\([^,]+,\s*([^,]+)/);
  if (clampMatch) {
    const parsed = parseFontSize(clampMatch[1].trim());
    if (parsed) fontSize = parsed;
  }

  // 字重
  let bold = FONT_BOLD_MAP[tag] || false;
  if (style['font-weight']) {
    const fw = parseInt(style['font-weight']);
    bold = fw >= 600 || style['font-weight'] === 'bold';
  }

  // 斜体
  const italic = tag === 'em' || tag === 'i' || /italic/i.test(style['font-style'] || '');

  // 颜色
  let color = '000000';
  for (const prop of ['color']) {
    if (style[prop]) {
      const c = parseColor(style[prop], vars);
      if (c) color = c.hex;
    }
  }

  // 字体
  const fontFamily = parseFontFamily(style['font-family'] || vars['--font-body'] || '');

  // 对齐
  let align = 'left';
  if (/center/i.test(style['text-align'] || '')) align = 'center';
  else if (/right/i.test(style['text-align'] || '')) align = 'right';

  // 大写转换
  const isAllCaps = /uppercase/i.test(style['text-transform'] || '');

  return { text, fontSize, bold, italic, color, fontFamily, align, isAllCaps, tag };
}

/**
 * 检测 flex 布局并提取列
 */
function detectFlexColumns($, container) {
  const style = parseInlineStyle($(container).attr('style') || '');
  const isFlex = /flex/i.test(style['display'] || '');
  if (!isFlex) return null;

  const children = $(container).children().not('style, script, aside').toArray();
  if (children.length < 2) return null;

  // 解析 flex 比例
  const ratios = children.map(child => {
    const cs = parseInlineStyle($(child).attr('style') || '');
    const flex = parseFloat(cs['flex'] || '1');
    return flex > 0 ? flex : 1;
  });
  const totalRatio = ratios.reduce((a, b) => a + b, 0);

  return { children, ratios, totalRatio };
}

// ─── PPTX 生成 ───────────────────────────────────────────────

/**
 * 设置 slide 背景
 */
function setBackground(slide, bgInfo) {
  if (!bgInfo) return;
  if (bgInfo.color) {
    slide.background = { color: bgInfo.color };
  } else if (bgInfo.gradient) {
    slide.background = { fill: bgInfo.gradient };
  }
}

/**
 * 向 slide 添加文本框
 */
function addTextBox(slide, opts) {
  const textOpts = {
    x: opts.x || 0,
    y: opts.y || 0,
    w: opts.w || CONTENT_W,
    h: opts.h || 0.5,
    fontSize: opts.fontSize || 14,
    fontFace: opts.fontFamily || 'Calibri',
    color: opts.color || '000000',
    bold: opts.bold || false,
    italic: opts.italic || false,
    align: opts.align || 'left',
    valign: 'top',
    wrap: true,
    shrinkText: true,
    autoFit: true,
  };

  // 处理 ALL CAPS
  let text = opts.text || '';
  if (opts.isAllCaps) text = text.toUpperCase();

  // 处理列表（多行文本带项目符号）
  if (opts.bullet) {
    textOpts.bullet = { type: 'bullet' };
  }

  slide.addText(text, textOpts);
}

/**
 * 处理单个 slide 的内容元素
 */
function processSection($, section, vars) {
  const elements = [];
  const $section = $(section);

  // 跳过 style, script, aside.notes
  const contentChildren = $section.children().not('style, script, aside.notes').toArray();

  // 检查是否有标题级元素
  const hasHeading = contentChildren.some(el => /^h[1-6]$/.test(el.tagName?.toLowerCase()));

  // 当前 y 位置（英寸）
  let yPos = MARGIN.top;
  // 标题区域额外留白
  const HEADING_BOTTOM_MARGIN = 0.3;

  for (const child of contentChildren) {
    const tag = child.tagName?.toLowerCase();

    // 跳过非内容标签
    if (SKIP_TAGS.has(tag)) continue;

    // 标题元素
    if (/^h[1-6]$/.test(tag)) {
      const info = extractTextInfo($, child, vars);
      if (info && info.text) {
        const h = Math.max(0.5, info.fontSize / 36);
        addTextBoxToLocal(elements, {
          text: info.text,
          x: MARGIN.left,
          y: yPos,
          w: CONTENT_W,
          h: h,
          fontSize: info.fontSize,
          bold: info.bold,
          italic: info.italic,
          color: info.color,
          fontFamily: info.fontFamily,
          align: info.align,
          isAllCaps: info.isAllCaps,
        });
        yPos += h + HEADING_BOTTOM_MARGIN;
      }
      continue;
    }

    // 段落
    if (tag === 'p') {
      const info = extractTextInfo($, child, vars);
      if (info && info.text) {
        // 估算高度
        const lines = Math.ceil(info.text.length / 60);
        const h = Math.max(0.4, lines * 0.3);
        addTextBoxToLocal(elements, {
          text: info.text,
          x: MARGIN.left,
          y: yPos,
          w: CONTENT_W,
          h: h,
          fontSize: info.fontSize,
          bold: info.bold,
          italic: info.italic,
          color: info.color,
          fontFamily: info.fontFamily,
          align: info.align,
        });
        yPos += h + 0.15;
      }
      continue;
    }

    // 无序列表 / 有序列表
    if (tag === 'ul' || tag === 'ol') {
      const items = $(child).children('li').toArray();
      const bulletTexts = [];
      for (const li of items) {
        const info = extractTextInfo($, li, vars);
        if (info && info.text) bulletTexts.push(info.text);
      }
      if (bulletTexts.length > 0) {
        const lines = bulletTexts.reduce((sum, t) => sum + Math.ceil(t.length / 70), bulletTexts.length);
        const h = Math.max(0.5, lines * 0.28);
        const firstLi = $(items[0]);
        const firstInfo = extractTextInfo($, items[0], vars);
        addTextBoxToLocal(elements, {
          text: bulletTexts.map(t => ({ text: t, options: { bullet: true, indentLevel: 0 } })),
          x: MARGIN.left,
          y: yPos,
          w: CONTENT_W,
          h: h,
          fontSize: firstInfo?.fontSize || 14,
          color: firstInfo?.color || '000000',
          fontFamily: firstInfo?.fontFamily || 'Calibri',
          bullet: true,
          isBulletArray: true,
        });
        yPos += h + 0.15;
      }
      continue;
    }

    // pre > code（代码块）
    if (tag === 'pre') {
      const code = $(child).find('code').length ? $(child).find('code').text() : $(child).text();
      if (code.trim()) {
        const lines = code.split('\n').length;
        const h = Math.max(0.5, lines * 0.25);
        addTextBoxToLocal(elements, {
          text: code.trim(),
          x: MARGIN.left,
          y: yPos,
          w: CONTENT_W,
          h: h,
          fontSize: 11,
          fontFamily: 'Consolas',
          color: '333333',
        });
        yPos += h + 0.15;
      }
      continue;
    }

    // img 元素
    if (tag === 'img') {
      const src = $(child).attr('src');
      if (src) {
        elements.push({
          type: 'image',
          src: src,
          x: MARGIN.left,
          y: yPos,
          w: 4,
          h: 3,
        });
        yPos += 3 + 0.15;
      }
      continue;
    }

    // div 或其他容器 → 检测 flex 布局
    if (tag === 'div' || tag === 'section') {
      const flexCols = detectFlexColumns($, child);

      if (flexCols) {
        // 多列布局
        const { children: cols, ratios, totalRatio } = flexCols;
        let xPos = MARGIN.left;
        const gap = 0.3;
        const totalGap = gap * (cols.length - 1);
        const availW = CONTENT_W - totalGap;

        for (let ci = 0; ci < cols.length; ci++) {
          const colW = (ratios[ci] / totalRatio) * availW;
          const colElements = processColumn($, cols[ci], vars, xPos, yPos, colW);
          elements.push(...colElements);
          xPos += colW + gap;
        }

        // 估算 y 偏移（取最高列的高度）
        yPos += estimateColumnsHeight($, cols, vars) + 0.2;
      } else {
        // 非 flex 容器 → 递归处理子元素
        const innerElements = processInnerElements($, child, vars, MARGIN.left, yPos, CONTENT_W);
        elements.push(...innerElements.elements);
        yPos = innerElements.nextY;
      }
      continue;
    }

    // 其他元素（span 等）→ 提取文本
    const info = extractTextInfo($, child, vars);
    if (info && info.text) {
      addTextBoxToLocal(elements, {
        text: info.text,
        x: MARGIN.left,
        y: yPos,
        w: CONTENT_W,
        h: 0.4,
        fontSize: info.fontSize,
        bold: info.bold,
        color: info.color,
        fontFamily: info.fontFamily,
      });
      yPos += 0.55;
    }
  }

  return elements;
}

/**
 * 处理 flex 列中的内容
 */
function processColumn($, col, vars, xStart, yStart, colWidth) {
  const elements = [];
  const $col = $(col);
  const children = $col.children().not('style, script, aside').toArray();
  let yPos = yStart;

  for (const child of children) {
    const tag = child.tagName?.toLowerCase();
    if (SKIP_TAGS.has(tag)) continue;

    if (/^h[1-6]$/.test(tag)) {
      const info = extractTextInfo($, child, vars);
      if (info && info.text) {
        const h = Math.max(0.4, info.fontSize / 40);
        addTextBoxToLocal(elements, {
          text: info.text, x: xStart, y: yPos, w: colWidth, h: h,
          fontSize: info.fontSize, bold: info.bold, color: info.color,
          fontFamily: info.fontFamily, align: info.align,
        });
        yPos += h + 0.2;
      }
    } else if (tag === 'p' || tag === 'span') {
      const info = extractTextInfo($, child, vars);
      if (info && info.text) {
        const lines = Math.ceil(info.text.length / 40);
        const h = Math.max(0.3, lines * 0.25);
        addTextBoxToLocal(elements, {
          text: info.text, x: xStart, y: yPos, w: colWidth, h: h,
          fontSize: info.fontSize, bold: info.bold, color: info.color,
          fontFamily: info.fontFamily, align: info.align,
        });
        yPos += h + 0.1;
      }
    } else if (tag === 'ul' || tag === 'ol') {
      const items = $(child).children('li').toArray();
      const bulletTexts = items.map(li => $(li).text().trim()).filter(Boolean);
      if (bulletTexts.length) {
        const lines = bulletTexts.reduce((sum, t) => sum + Math.ceil(t.length / 35), bulletTexts.length);
        const h = Math.max(0.4, lines * 0.25);
        const firstInfo = items.length ? extractTextInfo($, items[0], vars) : null;
        addTextBoxToLocal(elements, {
          text: bulletTexts.map(t => ({ text: t, options: { bullet: true } })),
          x: xStart, y: yPos, w: colWidth, h: h,
          fontSize: firstInfo?.fontSize || 14,
          color: firstInfo?.color || '000000',
          fontFamily: firstInfo?.fontFamily || 'Calibri',
          bullet: true, isBulletArray: true,
        });
        yPos += h + 0.1;
      }
    } else if (tag === 'i' || tag === 'svg') {
      // 图标元素 → 提取文本作为占位
      const iconClass = $(child).attr('class') || '';
      const iconMatch = iconClass.match(/fa-(\w+)/);
      if (iconMatch) {
        elements.push({
          type: 'text', text: `[${iconMatch[1]}]`,
          x: xStart, y: yPos, w: colWidth, h: 0.3,
          fontSize: 10, color: '999999', align: 'center',
        });
      }
    } else {
      // 递归处理嵌套容器
      const inner = processInnerElements($, child, vars, xStart, yPos, colWidth);
      elements.push(...inner.elements);
      yPos = inner.nextY;
    }
  }

  return elements;
}

/**
 * 处理内部元素（非 flex 容器的子元素）
 */
function processInnerElements($, container, vars, xStart, yStart, width) {
  const elements = [];
  const children = $(container).children().not('style, script, aside').toArray();
  let yPos = yStart;

  for (const child of children) {
    const tag = child.tagName?.toLowerCase();
    if (SKIP_TAGS.has(tag)) continue;

    if (/^h[1-6]$/.test(tag)) {
      const info = extractTextInfo($, child, vars);
      if (info && info.text) {
        const h = Math.max(0.4, info.fontSize / 40);
        addTextBoxToLocal(elements, {
          text: info.text, x: xStart, y: yPos, w: width, h: h,
          fontSize: info.fontSize, bold: info.bold, color: info.color,
          fontFamily: info.fontFamily, align: info.align,
        });
        yPos += h + 0.2;
      }
    } else if (tag === 'p') {
      const info = extractTextInfo($, child, vars);
      if (info && info.text) {
        const lines = Math.ceil(info.text.length / 60);
        const h = Math.max(0.3, lines * 0.25);
        addTextBoxToLocal(elements, {
          text: info.text, x: xStart, y: yPos, w: width, h: h,
          fontSize: info.fontSize, bold: info.bold, color: info.color,
          fontFamily: info.fontFamily, align: info.align,
        });
        yPos += h + 0.1;
      }
    } else if (tag === 'ul' || tag === 'ol') {
      const items = $(child).children('li').toArray();
      const bulletTexts = items.map(li => $(li).text().trim()).filter(Boolean);
      if (bulletTexts.length) {
        const lines = bulletTexts.reduce((sum, t) => sum + Math.ceil(t.length / 60), bulletTexts.length);
        const h = Math.max(0.4, lines * 0.25);
        const firstInfo = items.length ? extractTextInfo($, items[0], vars) : null;
        addTextBoxToLocal(elements, {
          text: bulletTexts.map(t => ({ text: t, options: { bullet: true } })),
          x: xStart, y: yPos, w: width, h: h,
          fontSize: firstInfo?.fontSize || 14,
          color: firstInfo?.color || '000000',
          fontFamily: firstInfo?.fontFamily || 'Calibri',
          bullet: true, isBulletArray: true,
        });
        yPos += h + 0.1;
      }
    } else if (tag === 'div') {
      const flexCols = detectFlexColumns($, child);
      if (flexCols) {
        const { children: cols, ratios, totalRatio } = flexCols;
        let xPos = xStart;
        const gap = 0.2;
        const totalGap = gap * (cols.length - 1);
        const availW = width - totalGap;
        for (let ci = 0; ci < cols.length; ci++) {
          const colW = (ratios[ci] / totalRatio) * availW;
          const colElements = processColumn($, cols[ci], vars, xPos, yPos, colW);
          elements.push(...colElements);
          xPos += colW + gap;
        }
        yPos += estimateColumnsHeight($, cols, vars) + 0.1;
      } else {
        const inner = processInnerElements($, child, vars, xStart, yPos, width);
        elements.push(...inner.elements);
        yPos = inner.nextY;
      }
    }
  }

  return { elements, nextY: yPos };
}

/**
 * 向元素列表添加文本元素
 */
function addTextBoxToLocal(elements, opts) {
  elements.push({ type: 'text', ...opts });
}

/**
 * 估算 flex 列高度
 */
function estimateColumnsHeight($, cols, vars) {
  let maxH = 0;
  for (const col of cols) {
    const texts = $(col).find('h1, h2, h3, h4, h5, h6, p, li, span').toArray();
    let h = 0;
    for (const t of texts) {
      const info = extractTextInfo($, t, vars);
      if (info && info.text) {
        const lines = Math.ceil(info.text.length / 40);
        h += Math.max(0.3, lines * 0.25) + 0.1;
      }
    }
    maxH = Math.max(maxH, h);
  }
  return Math.max(maxH, 1);
}

// ─── 提取所有 section（展平嵌套） ──────────────────────────────

function extractAllSections($) {
  const sections = [];

  // 顶层 section（直接在 .slides 下）
  const topSections = $('.slides > section').toArray();

  if (topSections.length === 0) {
    // 回退：直接找所有 section
    $('section').each((i, el) => {
      sections.push(el);
    });
    return sections;
  }

  for (const top of topSections) {
    const nested = $(top).children('section').toArray();
    if (nested.length > 0) {
      // 有嵌套垂直 slides → 展平
      for (const child of nested) {
        sections.push(child);
      }
    } else {
      sections.push(top);
    }
  }

  return sections;
}

// ─── 主流程 ─────────────────────────────────────────────────

function main() {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(html);
  const fileName = path.basename(htmlPath, '.html');

  // 1. 提取 CSS 变量
  const vars = extractCssVars(html);
  console.log(`📐 提取到 ${Object.keys(vars).length} 个 CSS 变量`);

  // 2. 提取所有 section
  const sections = extractAllSections($);
  console.log(`📑 找到 ${sections.length} 张幻灯片`);

  if (sections.length === 0) {
    console.error('❌ 未找到 <section> 元素，请确认是 reveal.js HTML 文件');
    process.exit(1);
  }

  // 3. 创建 PPTX
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33" × 7.5"
  pptx.author = 'revealjs-presentation export';
  pptx.subject = fileName;

  // 4. 逐页处理
  sections.forEach((section, idx) => {
    const slide = pptx.addSlide();

    // 设置背景
    const bg = extractBackground($, section, vars);
    setBackground(slide, bg);

    // 设置 speaker notes
    const notes = extractNotes($, section);
    if (notes) {
      slide.addNotes(notes);
    }

    // 处理内容
    const elements = processSection($, section, vars);

    // 添加所有元素到 slide
    for (const el of elements) {
      if (el.type === 'text') {
        if (el.isBulletArray && Array.isArray(el.text)) {
          // 带项目符号的多行文本
          slide.addText(el.text, {
            x: el.x, y: el.y, w: el.w, h: el.h,
            fontSize: el.fontSize || 14,
            fontFace: el.fontFamily || 'Calibri',
            color: el.color || '000000',
            bold: el.bold || false,
            italic: el.italic || false,
            align: el.align || 'left',
            valign: 'top',
            wrap: true,
            shrinkText: true,
          });
        } else {
          addTextBox(slide, el);
        }
      } else if (el.type === 'image') {
        // 尝试添加图片（可能是相对路径或 URL）
        try {
          let imgPath = el.src;
          if (imgPath && !imgPath.startsWith('http') && !imgPath.startsWith('data:')) {
            imgPath = path.resolve(path.dirname(htmlPath), imgPath);
          }
          if (imgPath && fs.existsSync(imgPath)) {
            slide.addImage({ x: el.x, y: el.y, w: el.w || 4, h: el.h || 3, path: imgPath });
          }
        } catch (e) {
          // 图片加载失败，跳过
        }
      }
    }

    // 添加页码（右下角）
    slide.addText(`${idx + 1} / ${sections.length}`, {
      x: SLIDE_W - 1.5, y: SLIDE_H - 0.5, w: 1.2, h: 0.3,
      fontSize: 9, color: '999999', align: 'right',
    });
  });

  // 5. 输出
  const outputPath = outputFile || htmlPath.replace(/\.html?$/i, '.pptx');
  pptx.writeFile({ fileName: outputPath }).then(() => {
    console.log(`✅ PPTX 导出成功: ${outputPath}`);
    console.log(`   ${sections.length} 张可编辑幻灯片`);
  }).catch(err => {
    console.error('❌ 导出失败:', err.message);
    process.exit(1);
  });
}

main();
