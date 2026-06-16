/**
 * Reveal.js PPTX 导出按钮（客户端）v2
 *
 * 保留配色、排版和布局的 PPTX 导出。
 * 通过 CSS 变量读取调色板，按 slide 类型还原视觉风格。
 *
 * 使用方式：
 *   <script src="https://cdn.jsdelivr.net/npm/pptxgenjs@4.0.1/dist/pptxgen.bundle.js"></script>
 *   <script src="scripts/export-pptx-client.js"></script>
 *   或将内容内联到 HTML 的 <script> 标签中。
 */

(function () {
  'use strict';

  var BTN_TEXT = 'PPTX';

  // ─── 颜色工具 ─────────────────────────────────────────

  function rgbToHex(r, g, b) {
    return [r, g, b].map(function (c) { return Math.round(c).toString(16).padStart(2, '0').toUpperCase(); }).join('');
  }

  function parseRgb(str) {
    if (!str) return null;
    var m = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
    return m ? rgbToHex(+m[1], +m[2], +m[3]) : null;
  }

  function cbrt(x) {
    return x >= 0 ? Math.pow(x, 1 / 3) : -Math.pow(-x, 1 / 3);
  }

  function linearToSrgb(c) {
    c = Math.max(0, Math.min(1, c));
    return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  }

  function oklchToHex(str) {
    if (!str) return null;
    var m = str.match(/oklch\(\s*([\d.]+)(%)?\s+([\d.]+)\s+([\d.]+)/);
    if (!m) return null;
    var L = m[2] === '%' ? +m[1] / 100 : +m[1];
    var C = +m[3];
    var H = +m[4];

    // OKLCH → OKLAB
    var a = C * Math.cos(H * Math.PI / 180);
    var b = C * Math.sin(H * Math.PI / 180);

    // OKLAB → LMS' (nonlinear)
    var l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    var m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    var s_ = L - 0.0894841775 * a - 1.2914855480 * b;

    // LMS' → LMS (cube, not cube-root — this is the inverse direction)
    var l3 = l_ * l_ * l_;
    var m3 = m_ * m_ * m_;
    var s3 = s_ * s_ * s_;

    // LMS → linear sRGB
    var rl = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
    var gl = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
    var bl = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

    // Linear sRGB → sRGB (gamma encode)
    var r = Math.round(Math.min(255, Math.max(0, linearToSrgb(rl) * 255)));
    var g = Math.round(Math.min(255, Math.max(0, linearToSrgb(gl) * 255)));
    var bv = Math.round(Math.min(255, Math.max(0, linearToSrgb(bl) * 255)));
    return rgbToHex(r, g, bv);
  }

  function anyColorToHex(str) {
    if (!str) return null;
    if (str.startsWith('#')) return str.replace('#', '').substring(0, 6).toUpperCase();
    if (str.startsWith('oklch')) return oklchToHex(str);
    if (str.startsWith('rgb')) return parseRgb(str);
    return parseRgb(str);
  }

  function resolveColor(val, vars) {
    if (!val) return null;
    if (val.startsWith('#') && val.length >= 4) return val.replace('#', '').substring(0, 6).toUpperCase();
    if (val.startsWith('oklch')) return oklchToHex(val);
    if (val.startsWith('rgb')) return parseRgb(val);
    var varMatch = val.match(/var\(\s*(--[\w-]+)\s*\)/);
    if (varMatch && vars[varMatch[1]]) return resolveColor(vars[varMatch[1]], vars);
    return parseRgb(val);
  }

  function getElColor(el) {
    return anyColorToHex(getComputedStyle(el).color) || '000000';
  }

  function getElBg(el) {
    var bg = getComputedStyle(el).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return anyColorToHex(bg);
    return null;
  }

  // ─── CSS 变量解析 ────────────────────────────────────

  function getCssVars() {
    var vars = {};
    document.querySelectorAll('style').forEach(function (s) {
      var rootMatch = s.textContent.match(/:root\s*\{([^}]+)\}/);
      if (rootMatch) {
        var re = /(--[\w-]+)\s*:\s*([^;]+)/g;
        var m;
        while ((m = re.exec(rootMatch[1]))) vars[m[1]] = m[2].trim();
      }
    });
    applyCssVarAliases(vars);
    return vars;
  }

  function applyCssVarAliases(vars) {
    var aliases = {
      '--bg': '--c-bg',
      '--text': '--c-fg',
      '--text-muted': '--c-fg-2',
      '--text-subtle': '--c-fg-3',
      '--accent': '--c-accent',
      '--divider': '--c-border',
      '--font-display': '--f-display',
      '--font-body': '--f-body',
      '--font-mono': '--f-mono',
    };
    Object.keys(aliases).forEach(function (legacy) {
      var canonical = aliases[legacy];
      if (!vars[legacy] && vars[canonical]) vars[legacy] = vars[canonical];
      if (!vars[canonical] && vars[legacy]) vars[canonical] = vars[legacy];
    });
  }

  // ─── 文本工具 ─────────────────────────────────────────

  function pxToPt(px) { return parseFloat(px) * 0.75; }

  function mapFont(family) {
    var first = (family || '').split(',')[0].replace(/['"]/g, '').trim().toLowerCase();
    var map = {
      'noto sans sc': 'Microsoft YaHei',
      'noto serif sc': 'SimSun',
      'outfit': 'Calibri',
      'inter': 'Calibri',
      'jetbrains mono': 'Consolas',
      'sf mono': 'Consolas',
    };
    return map[first] || map[first] || 'Calibri';
  }

  function isBold(el) { return parseInt(getComputedStyle(el).fontWeight) >= 600; }

  function textOf(el) { return (el.textContent || '').trim(); }

  // ─── Slide 分类 ──────────────────────────────────────

  function isCenterSlide(sec) { return sec.classList.contains('center-slide'); }

  function getSlideType(sec) {
    if (sec.querySelector('.price-duo')) return 'price';
    if (sec.querySelector('.bar-group')) return 'bars';
    if (sec.querySelector('.min-table')) return 'table';
    if (sec.querySelector('.split')) return 'split';
    if (sec.querySelector('.case-grid')) return 'grid';
    if (isCenterSlide(sec)) return 'hero';
    return 'content';
  }

  // ─── 提取背景色 ──────────────────────────────────────

  function extractBg(sec, vars) {
    var bgAttr = sec.getAttribute('data-background-color');
    if (bgAttr) { var h = resolveColor(bgAttr, vars); if (h) return h; }

    var style = sec.getAttribute('style') || '';
    var m = style.match(/background(?:-color)?:\s*([^;]+)/);
    if (m) { var h = resolveColor(m[1].trim(), vars); if (h) return h; }

    var bgVar = vars['--bg'];
    if (bgVar) { var h = resolveColor(bgVar, vars); if (h) return h; }

    return 'FFFFFF';
  }

  // ─── 各类型 Slide 导出 ───────────────────────────────

  function exportHero(slide, sec, vars) {
    var bg = extractBg(sec, vars);
    slide.background = { color: bg };

    var h1 = sec.querySelector('h1');
    if (h1) {
      var text = textOf(h1);
      var fs = pxToPt(getComputedStyle(h1).fontSize);
      var color = getElColor(h1);
      var align = isCenterSlide(sec) ? 'center' : 'left';
      slide.addText(text, {
        x: 0.6, y: 1.2, w: 12.8, h: 3,
        fontSize: Math.min(44, fs), fontFace: 'Calibri',
        color: color, bold: true, align: align, valign: 'middle',
        lineSpacingMultiple: 1.1, paraSpaceAfter: 0,
      });
    }

    var ps = sec.querySelectorAll('p, .subtitle, .big-quote');
    ps.forEach(function (p, i) {
      var text = textOf(p);
      if (!text) return;
      var color = getElColor(p);
      var fs = pxToPt(getComputedStyle(p).fontSize);
      var isQuote = p.classList.contains('big-quote');
      slide.addText(text, {
        x: 0.6, y: isQuote ? 1.8 : 4.2 + i * 0.6,
        w: 12.8, h: isQuote ? 2.5 : 0.6,
        fontSize: isQuote ? 22 : Math.min(16, fs),
        fontFace: 'Calibri', color: color,
        align: isCenterSlide(sec) ? 'center' : 'left',
        valign: isQuote ? 'middle' : 'top',
        lineSpacingMultiple: 1.5,
      });
    });
  }

  function exportTable(slide, sec, vars) {
    var bg = extractBg(sec, vars);
    slide.background = { color: bg };
    var textMuted = resolveColor(vars['--text-muted'], vars) || '999999';
    var divider = resolveColor(vars['--divider'], vars) || 'E0E0E0';
    var y = 0.6;

    // Kicker
    var kicker = sec.querySelector('.kicker');
    if (kicker) {
      slide.addText(textOf(kicker), {
        x: 0.6, y: y, w: 12, h: 0.35,
        fontSize: 9, color: textMuted, fontFace: 'Calibri',
        align: 'left', bold: false,
      });
      y += 0.45;
    }

    // Title
    var h2 = sec.querySelector('h2');
    if (h2) {
      slide.addText(textOf(h2), {
        x: 0.6, y: y, w: 12, h: 0.7,
        fontSize: 24, color: getElColor(h2), fontFace: 'Calibri',
        bold: true, align: 'left',
      });
      y += 0.9;
    }

    // Table
    var table = sec.querySelector('table');
    if (!table) return;
    var rows = table.querySelectorAll('tr');
    var tableData = [];
    var colW = [3.5, 4.5, 4.5];

    rows.forEach(function (row) {
      var cells = row.querySelectorAll('th, td');
      var rowData = [];
      cells.forEach(function (cell, ci) {
        var text = textOf(cell);
        var isHeader = cell.tagName.toLowerCase() === 'th';
        var isHighlight = cell.classList.contains('highlight');
        var color = isHeader ? textMuted : (isHighlight ? resolveColor(vars['--accent'], vars) || getElColor(cell) : getElColor(cell));
        rowData.push({
          text: text,
          options: {
            fontSize: isHeader ? 9 : 10,
            bold: isHeader || isHighlight,
            color: color,
            fontFace: 'Calibri',
            align: ci === 0 ? 'left' : 'left',
            valign: 'middle',
            border: { pt: 0.5, color: divider },
            fill: { color: bg },
          }
        });
      });
      if (rowData.length) tableData.push(rowData);
    });

    if (tableData.length) {
      slide.addTable(tableData, {
        x: 0.6, y: y, w: 12.5,
        colW: colW,
        rowH: 0.4,
        border: { pt: 0.5, color: divider },
        autoPage: false,
      });
    }
  }

  function exportBars(slide, sec, vars) {
    var bg = extractBg(sec, vars);
    slide.background = { color: bg };
    var textMuted = resolveColor(vars['--text-muted'], vars) || '999999';
    var gptColor = resolveColor(vars['--gpt'], vars) || '1A9956';
    var claudeColor = resolveColor(vars['--claude'], vars) || '7C3AED';
    var y = 0.6;

    var kicker = sec.querySelector('.kicker');
    if (kicker) {
      slide.addText(textOf(kicker), { x: 0.6, y: y, w: 12, h: 0.35, fontSize: 9, color: textMuted, fontFace: 'Calibri' });
      y += 0.45;
    }

    var h2 = sec.querySelector('h2');
    if (h2) {
      slide.addText(textOf(h2), { x: 0.6, y: y, w: 12, h: 0.7, fontSize: 24, color: getElColor(h2), fontFace: 'Calibri', bold: true });
      y += 1.0;
    }

    // Legend
    slide.addText([
      { text: '  ', options: { fontSize: 8, color: gptColor } },
      { text: 'GPT 5.5    ', options: { fontSize: 9, color: textMuted, bold: true } },
      { text: '  ', options: { fontSize: 8, color: claudeColor } },
      { text: 'Opus 4.8', options: { fontSize: 9, color: textMuted, bold: true } },
    ], { x: 0.6, y: y, w: 6, h: 0.3 });
    y += 0.5;

    // Bars
    var barRows = sec.querySelectorAll('.bar-row');
    barRows.forEach(function (row) {
      var label = row.querySelector('.bar-label');
      if (label) {
        slide.addText(textOf(label), { x: 0.6, y: y, w: 12, h: 0.25, fontSize: 8, color: textMuted, fontFace: 'Calibri', bold: true });
        y += 0.3;
      }

      var pairs = row.querySelectorAll('.bar-pair');
      pairs.forEach(function (pair) {
        var val = pair.querySelector('.bar-val');
        var fill = pair.querySelector('.bar-fill');
        if (!val || !fill) return;
        var isGpt = fill.classList.contains('gpt');
        var color = isGpt ? gptColor : claudeColor;
        var numVal = parseFloat(textOf(val));
        var barW = (numVal / 100) * 10;

        slide.addShape(pptx.shapes.RECTANGLE, {
          x: 1.5, y: y, w: barW, h: 0.18,
          fill: { color: color },
          rectRadius: 0.05,
        });
        slide.addText(textOf(val), {
          x: 0.6, y: y - 0.05, w: 0.8, h: 0.28,
          fontSize: 9, color: color, fontFace: 'Calibri', bold: true, align: 'right',
        });
        y += 0.28;
      });
      y += 0.25;
    });
  }

  function exportSplit(slide, sec, vars) {
    var bg = extractBg(sec, vars);
    slide.background = { color: bg };
    var textMuted = resolveColor(vars['--text-muted'], vars) || '999999';
    var y = 0.6;

    var kicker = sec.querySelector('.kicker');
    if (kicker) {
      slide.addText(textOf(kicker), { x: 0.6, y: y, w: 12, h: 0.35, fontSize: 9, color: textMuted, fontFace: 'Calibri' });
      y += 0.45;
    }

    var h2 = sec.querySelector('h2');
    if (h2) {
      slide.addText(textOf(h2), { x: 0.6, y: y, w: 12, h: 0.7, fontSize: 24, color: getElColor(h2), fontFace: 'Calibri', bold: true });
      y += 1.0;
    }

    var cols = sec.querySelectorAll('.split-col');
    if (cols.length < 2) return;

    var colW = 6.0;
    var gap = 0.6;

    cols.forEach(function (col, ci) {
      var x = 0.6 + ci * (colW + gap);

      var h3 = col.querySelector('h3');
      if (h3) {
        slide.addText(textOf(h3), {
          x: x, y: y, w: colW, h: 0.4,
          fontSize: 13, color: getElColor(h3), fontFace: 'Calibri', bold: true,
        });
      }

      var ul = col.querySelector('ul, ol');
      if (ul) {
        var items = ul.querySelectorAll('li');
        var bullets = [];
        items.forEach(function (li) {
          var t = textOf(li);
          if (t) bullets.push({ text: t, options: { bullet: true, color: textMuted, fontSize: 10, fontFace: 'Calibri' } });
        });
        if (bullets.length) {
          slide.addText(bullets, {
            x: x, y: y + 0.45, w: colW, h: 3.5,
            fontSize: 10, fontFace: 'Calibri', color: textMuted,
            valign: 'top', wrap: true, lineSpacingMultiple: 1.6,
          });
        }
      }
    });
  }

  function exportPrice(slide, sec, vars) {
    var bg = extractBg(sec, vars);
    slide.background = { color: bg };
    var textMuted = resolveColor(vars['--text-muted'], vars) || '999999';
    var y = 0.8;

    var kicker = sec.querySelector('.kicker');
    if (kicker) {
      slide.addText(textOf(kicker), { x: 0.6, y: y, w: 12, h: 0.35, fontSize: 9, color: textMuted, fontFace: 'Calibri', align: 'center' });
      y += 0.5;
    }

    var h2 = sec.querySelector('h2');
    if (h2) {
      slide.addText(textOf(h2), { x: 0.6, y: y, w: 12, h: 0.7, fontSize: 24, color: getElColor(h2), fontFace: 'Calibri', bold: true, align: 'center' });
      y += 1.2;
    }

    var blocks = sec.querySelectorAll('.price-block');
    var blockW = 4;
    var totalW = blocks.length * blockW + (blocks.length - 1) * 1;
    var startX = (13.33 - totalW) / 2;

    blocks.forEach(function (block, bi) {
      var x = startX + bi * (blockW + 1);
      var nameEl = block.querySelector('.price-name');
      var numEl = block.querySelector('.price-num');
      var unitEl = block.querySelector('.price-unit');

      if (nameEl) {
        slide.addText(textOf(nameEl), { x: x, y: y, w: blockW, h: 0.35, fontSize: 9, color: getElColor(nameEl), fontFace: 'Calibri', bold: true, align: 'center', letterSpacing: 3 });
      }
      if (numEl) {
        slide.addText(textOf(numEl), { x: x, y: y + 0.4, w: blockW, h: 1.2, fontSize: 48, color: getElColor(numEl), fontFace: 'Calibri', bold: true, align: 'center', valign: 'middle' });
      }
      if (unitEl) {
        slide.addText(textOf(unitEl), { x: x, y: y + 1.7, w: blockW, h: 0.3, fontSize: 9, color: textMuted, fontFace: 'Calibri', align: 'center' });
      }
    });

    var note = sec.querySelector('.price-duo + p, p:last-child');
    if (note) {
      slide.addText(textOf(note), { x: 1.5, y: y + 2.5, w: 10, h: 0.5, fontSize: 9, color: textMuted, fontFace: 'Calibri', align: 'center' });
    }
  }

  function exportGrid(slide, sec, vars) {
    var bg = extractBg(sec, vars);
    slide.background = { color: bg };
    var textMuted = resolveColor(vars['--text-muted'], vars) || '999999';
    var divider = resolveColor(vars['--divider'], vars) || 'E0E0E0';
    var y = 0.6;

    var kicker = sec.querySelector('.kicker');
    if (kicker) {
      slide.addText(textOf(kicker), { x: 0.6, y: y, w: 12, h: 0.35, fontSize: 9, color: textMuted, fontFace: 'Calibri' });
      y += 0.45;
    }

    var h2 = sec.querySelector('h2');
    if (h2) {
      slide.addText(textOf(h2), { x: 0.6, y: y, w: 12, h: 0.7, fontSize: 24, color: getElColor(h2), fontFace: 'Calibri', bold: true });
      y += 1.0;
    }

    var items = sec.querySelectorAll('.case-item');
    var colW = 6.0;
    var gap = 0.6;

    items.forEach(function (item, i) {
      var col = i % 2;
      var row = Math.floor(i / 2);
      var x = 0.6 + col * (colW + gap);
      var iy = y + row * 1.4;

      var tag = item.querySelector('.case-tag');
      var h4 = item.querySelector('h4');
      var p = item.querySelector('p');

      if (tag) {
        slide.addText(textOf(tag), { x: x, y: iy, w: colW, h: 0.25, fontSize: 8, color: getElColor(tag), fontFace: 'Calibri', bold: true, letterSpacing: 2 });
      }
      if (h4) {
        slide.addText(textOf(h4), { x: x, y: iy + 0.3, w: colW, h: 0.3, fontSize: 12, color: getElColor(h4), fontFace: 'Calibri', bold: true });
      }
      if (p) {
        slide.addText(textOf(p), { x: x, y: iy + 0.65, w: colW, h: 0.35, fontSize: 9, color: textMuted, fontFace: 'Calibri' });
      }

      // Divider line
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: x, y: iy + 1.15, w: colW, h: 0.01,
        fill: { color: divider },
      });
    });
  }

  function exportProofText(slide, sec, startY) {
    var selector = [
      '.metric-value', '.metric-unit', '.metric-label', '.metric-note',
      '.year', '.event strong', '.event span',
      '.pill', '.bubble', '.totem h3', '.totem p',
      '.engine-list span', '.engine-list b',
      '.tag', '.bar-row span',
      '.tech-node b', '.tech-node span',
      '.big-word span', '.revenue-step h3', '.revenue-step p',
      '.quote-card p', '.speaker', '.manifesto-list div',
    ].join(',');
    var y = startY;
    var exported = new Set();
    sec.querySelectorAll(selector).forEach(function (el) {
      if (y > 6.65) return;
      var text = textOf(el).replace(/\s+/g, ' ');
      if (!text || exported.has(text)) return;
      exported.add(text);
      var cs = getComputedStyle(el);
      var isMetric = el.classList.contains('metric-value');
      slide.addText(text, {
        x: 0.6, y: y, w: 12, h: isMetric ? 0.52 : 0.35,
        fontSize: isMetric ? 28 : 11,
        color: getElColor(el),
        fontFace: mapFont(cs.fontFamily),
        bold: isBold(el),
        wrap: true,
        fit: 'shrink',
      });
      y += isMetric ? 0.58 : 0.38;
    });
  }

  function exportContent(slide, sec, vars) {
    // Fallback for unknown layouts
    var bg = extractBg(sec, vars);
    slide.background = { color: bg };
    var textMuted = resolveColor(vars['--text-muted'], vars) || '999999';
    var y = 0.6;

    var children = sec.querySelectorAll(':scope > .kicker, :scope > h2, :scope > h1, :scope > p, :scope > ul, :scope > ol, :scope > table');
    children.forEach(function (el) {
      var tag = el.tagName.toLowerCase();
      var text = textOf(el);
      if (!text) return;

      if (tag === 'h1') {
        slide.addText(text, { x: 0.6, y: y, w: 12, h: 1.5, fontSize: 36, color: getElColor(el), fontFace: 'Calibri', bold: true, align: 'center', valign: 'middle' });
        y += 1.7;
      } else if (tag === 'h2') {
        slide.addText(text, { x: 0.6, y: y, w: 12, h: 0.7, fontSize: 24, color: getElColor(el), fontFace: 'Calibri', bold: true });
        y += 0.9;
      } else if (tag === 'p') {
        var lines = Math.ceil(text.length / 60);
        slide.addText(text, { x: 0.6, y: y, w: 12, h: lines * 0.3, fontSize: 12, color: getElColor(el), fontFace: 'Calibri', wrap: true });
        y += lines * 0.3 + 0.15;
      } else if (tag === 'ul' || tag === 'ol') {
        var items = el.querySelectorAll('li');
        var bullets = [];
        items.forEach(function (li) { var t = textOf(li); if (t) bullets.push({ text: t, options: { bullet: true } }); });
        slide.addText(bullets, { x: 0.6, y: y, w: 12, h: 2, fontSize: 10, color: textMuted, fontFace: 'Calibri', wrap: true });
        y += 2.2;
      }
    });

    exportProofText(slide, sec, Math.max(y, 2.0));
  }

  // ─── 主导出 ──────────────────────────────────────────

  var pptx;

  function doExport() {
    if (typeof PptxGenJS === 'undefined') { alert('PptxGenJS 未加载，请检查网络连接。'); return; }

    var btn = document.getElementById('pptx-export-btn');
    if (btn) { btn.textContent = '导出中...'; btn.disabled = true; }

    try {
      pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_WIDE';
      pptx.author = 'revealjs-presentation';

      var vars = getCssVars();
      var sections = document.querySelectorAll('.reveal .slides > section');

      sections.forEach(function (sec) {
        var nested = sec.querySelectorAll(':scope > section');
        var slideSections = nested.length > 0 ? Array.from(nested) : [sec];

        slideSections.forEach(function (s) {
          var slide = pptx.addSlide();
          var type = getSlideType(s);

          switch (type) {
            case 'hero': exportHero(slide, s, vars); break;
            case 'table': exportTable(slide, s, vars); break;
            case 'bars': exportBars(slide, s, vars); break;
            case 'split': exportSplit(slide, s, vars); break;
            case 'price': exportPrice(slide, s, vars); break;
            case 'grid': exportGrid(slide, s, vars); break;
            default: exportContent(slide, s, vars); break;
          }

          // Page number
          slide.addText('' + pptx.slides.length, {
            x: 12.3, y: 7.0, w: 0.8, h: 0.3,
            fontSize: 8, color: resolveColor(vars['--text-muted'], vars) || '999999',
            align: 'right',
          });

          // Speaker notes
          var notes = s.querySelector('aside.notes');
          if (notes) slide.addNotes(notes.textContent.trim());
        });
      });

      var name = (document.title || 'presentation').replace(/[^\w一-鿿-]/g, '_');
      pptx.writeFile({ fileName: name + '.pptx' }).then(function () {
        if (btn) { btn.textContent = '已导出'; setTimeout(function () { btn.textContent = BTN_TEXT; btn.disabled = false; }, 2000); }
      });
    } catch (err) {
      console.error('PPTX export error:', err);
      alert('导出失败: ' + err.message);
      if (btn) { btn.textContent = BTN_TEXT; btn.disabled = false; }
    }
  }

  // ─── 初始化按钮 ──────────────────────────────────────

  function init() {
    var vars = getCssVars();
    var textColor = resolveColor(vars['--text'], vars) || '333333';
    var bgColor = resolveColor(vars['--bg'], vars) || 'FFFFFF';

    var btn = document.createElement('button');
    btn.id = 'pptx-export-btn';
    btn.textContent = BTN_TEXT;
    btn.setAttribute('aria-label', '导出 PPTX');
    btn.setAttribute('title', '导出 PPTX');
    btn.setAttribute('style', [
      'position:fixed', 'top:16px', 'right:16px', 'z-index:9999',
      'padding:6px 12px', 'background:#' + bgColor, 'color:#' + textColor,
      'border:1px solid rgba(0,0,0,0.12)', 'border-radius:6px',
      'cursor:pointer', 'font-size:12px', 'opacity:0', 'transition:opacity 0.2s',
      'font-family:system-ui,sans-serif',
    ].join(';'));
    btn.onclick = doExport;

    btn.onmouseenter = function () { btn.style.opacity = '1'; };
    btn.onfocus = function () { btn.style.opacity = '1'; };
    btn.onmouseleave = function () { btn.style.opacity = '0'; };
    btn.onblur = function () { btn.style.opacity = '0'; };

    document.body.appendChild(btn);

    document.addEventListener('mousemove', function (e) {
      var show = e.clientY < 76 && e.clientX > window.innerWidth - 110;
      btn.style.opacity = show ? '0.9' : '0';
    });

    document.addEventListener('fullscreenchange', function () {
      btn.style.display = document.fullscreenElement ? 'none' : '';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
