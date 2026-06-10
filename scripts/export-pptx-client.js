/**
 * Reveal.js PPTX 导出按钮（客户端）
 *
 * 此脚本嵌入到 reveal.js HTML 文件中，提供浏览器内一键导出 PPTX 功能。
 * 使用 PptxGenJS（CDN）在浏览器端生成可编辑的 PowerPoint 文件。
 *
 * 使用方式：在 HTML 文件中添加以下两行：
 *   <script src="https://cdn.jsdelivr.net/npm/pptxgenjs@4.0.1/dist/pptxgen.bundle.js"></script>
 *   <script src="scripts/export-pptx-client.js"></script>
 *
 * 或者将此文件内容直接内联到 HTML 的 <script> 标签中。
 */

(function () {
  'use strict';

  // ─── 配置 ────────────────────────────────────────────────

  const BTN_TEXT = '📥 PPTX';
  const BTN_STYLE = [
    'position:fixed', 'bottom:16px', 'left:16px', 'z-index:9999',
    'padding:6px 14px', 'background:rgba(0,0,0,0.6)', 'color:#fff',
    'border:1px solid rgba(255,255,255,0.2)', 'border-radius:6px',
    'cursor:pointer', 'font-size:12px', 'opacity:0', 'transition:opacity 0.3s',
    'font-family:system-ui,sans-serif', 'pointer-events:auto',
  ].join(';');

  // ─── 工具函数 ─────────────────────────────────────────────

  function rgbToHex(r, g, b) {
    return [r, g, b].map(function (c) { return c.toString(16).padStart(2, '0').toUpperCase(); }).join('');
  }

  function parseRgb(str) {
    var m = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    return m ? rgbToHex(+m[1], +m[2], +m[3]) : null;
  }

  function getColor(el) {
    var style = getComputedStyle(el);
    return parseRgb(style.color) || '000000';
  }

  function getBgColor(el) {
    var style = getComputedStyle(el);
    var bg = style.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      return parseRgb(bg);
    }
    return null;
  }

  function getFontSize(el) {
    return parseFloat(getComputedStyle(el).fontSize) * 0.75; // px → pt
  }

  function getFontFamily(el) {
    var family = getComputedStyle(el).fontFamily;
    var first = family.split(',')[0].replace(/['"]/g, '').trim();
    var map = {
      'Noto Sans SC': 'Microsoft YaHei',
      'Noto Serif SC': 'SimSun',
      'noto sans sc': 'Microsoft YaHei',
    };
    return map[first] || map[first.toLowerCase()] || first;
  }

  function isBold(el) {
    return parseInt(getComputedStyle(el).fontWeight) >= 600;
  }

  function isItalic(el) {
    return getComputedStyle(el).fontStyle === 'italic';
  }

  function textContent(el) {
    return (el.textContent || '').trim();
  }

  // ─── 解析 CSS 变量 ────────────────────────────────────────

  function getCssVars() {
    var vars = {};
    var styles = document.querySelectorAll('style');
    styles.forEach(function (s) {
      var rootMatch = s.textContent.match(/:root\s*\{([^}]+)\}/);
      if (rootMatch) {
        var decls = rootMatch[1];
        var re = /(--[\w-]+)\s*:\s*([^;]+)/g;
        var m;
        while ((m = re.exec(decls))) {
          vars[m[1]] = m[2].trim();
        }
      }
    });
    return vars;
  }

  function resolveColor(val, vars) {
    if (!val) return null;
    var varMatch = val.match(/var\(([^)]+)\)/);
    if (varMatch && vars[varMatch[1]]) {
      val = vars[varMatch[1]];
    }
    if (val.startsWith('#')) return val.replace('#', '').toUpperCase();
    return parseRgb(val);
  }

  // ─── Slide 背景提取 ────────────────────────────────────────

  function extractSlideBg(section, vars) {
    // data-background-color
    var bgColor = section.getAttribute('data-background-color');
    if (bgColor) {
      var hex = resolveColor(bgColor, vars);
      if (hex) return { color: hex };
    }

    // data-background 渐变
    var bgAttr = section.getAttribute('data-background') || '';
    var hexColors = bgAttr.match(/#[0-9a-fA-F]{3,8}/g);
    if (hexColors && hexColors.length >= 2) {
      return {
        fill: {
          type: 'gradient',
          stops: hexColors.slice(0, 2).map(function (c, i) {
            return {
              color: c.replace('#', '').substring(0, 6).toUpperCase(),
              position: i === 0 ? 0 : 1,
            };
          }),
        },
      };
    }

    // 内联 style
    var style = section.getAttribute('style') || '';
    var bgMatch = style.match(/background(?:-color)?:\s*([^;]+)/);
    if (bgMatch) {
      var hex = resolveColor(bgMatch[1].trim(), vars);
      if (hex) return { color: hex };
    }

    return null;
  }

  // ─── 元素处理 ─────────────────────────────────────────────

  var CONTENT_ELEMENTS = 'h1, h2, h3, h4, h5, h6, p, ul, ol, pre, img';

  function processSlideContent(section, vars) {
    var elements = [];
    var directChildren = [];

    // 获取直接子元素（非 style/script/aside）
    Array.prototype.forEach.call(section.children, function (child) {
      var tag = child.tagName.toLowerCase();
      if (tag !== 'style' && tag !== 'script' && tag !== 'aside') {
        directChildren.push(child);
      }
    });

    var yPos = 0.5;

    directChildren.forEach(function (child) {
      var tag = child.tagName.toLowerCase();

      // flex 容器 → 多列
      if ((tag === 'div' || tag === 'section') && isFlexContainer(child)) {
        var columns = getFlexColumns(child);
        if (columns && columns.length >= 2) {
          yPos = processFlexColumns(columns, yPos, vars, elements);
          return;
        }
      }

      // 标题
      if (/^h[1-6]$/.test(tag)) {
        var text = textContent(child);
        if (text) {
          var h = Math.max(0.5, getFontSize(child) / 48);
          elements.push({
            type: 'text', text: text,
            x: 0.6, y: yPos, w: 12, h: h,
            fontSize: getFontSize(child), bold: isBold(child), italic: isItalic(child),
            color: getColor(child), fontFace: getFontFamily(child),
            align: getAlign(child),
          });
          yPos += h + 0.2;
        }
        return;
      }

      // 段落
      if (tag === 'p') {
        var text = textContent(child);
        if (text) {
          var lines = Math.ceil(text.length / 60);
          var h = Math.max(0.35, lines * 0.28);
          elements.push({
            type: 'text', text: text,
            x: 0.6, y: yPos, w: 12, h: h,
            fontSize: getFontSize(child), bold: isBold(child), italic: isItalic(child),
            color: getColor(child), fontFace: getFontFamily(child),
            align: getAlign(child),
          });
          yPos += h + 0.12;
        }
        return;
      }

      // 列表
      if (tag === 'ul' || tag === 'ol') {
        var items = child.querySelectorAll('li');
        var texts = [];
        items.forEach(function (li) {
          var t = textContent(li);
          if (t) texts.push({ text: t, options: { bullet: true } });
        });
        if (texts.length) {
          var lines = texts.reduce(function (s, t) { return s + Math.ceil(t.text.length / 60); }, texts.length);
          var h = Math.max(0.4, lines * 0.26);
          var firstLi = items[0];
          elements.push({
            type: 'bullets', text: texts,
            x: 0.6, y: yPos, w: 12, h: h,
            fontSize: firstLi ? getFontSize(firstLi) : 14,
            color: firstLi ? getColor(firstLi) : '000000',
            fontFace: firstLi ? getFontFamily(firstLi) : 'Calibri',
          });
          yPos += h + 0.12;
        }
        return;
      }

      // 代码块
      if (tag === 'pre') {
        var code = child.querySelector('code') ? child.querySelector('code').textContent : child.textContent;
        if (code.trim()) {
          var lines = code.split('\n').length;
          var h = Math.max(0.5, lines * 0.22);
          elements.push({
            type: 'text', text: code.trim(),
            x: 0.6, y: yPos, w: 12, h: h,
            fontSize: 10, fontFace: 'Consolas', color: '333333',
          });
          yPos += h + 0.12;
        }
        return;
      }

      // 图片
      if (tag === 'img') {
        elements.push({ type: 'image', src: child.src, x: 0.6, y: yPos, w: 4, h: 3 });
        yPos += 3.2;
        return;
      }

      // 其他容器 → 递归
      if (tag === 'div' || tag === 'section') {
        var innerElements = child.querySelectorAll(':scope > ' + CONTENT_ELEMENTS);
        innerElements.forEach(function (el) {
          var elTag = el.tagName.toLowerCase();
          var text = textContent(el);
          if (!text && elTag !== 'img') return;

          if (/^h[1-6]$/.test(elTag)) {
            elements.push({
              type: 'text', text: text,
              x: 0.6, y: yPos, w: 12, h: 0.5,
              fontSize: getFontSize(el), bold: isBold(el), color: getColor(el),
              fontFace: getFontFamily(el), align: getAlign(el),
            });
            yPos += 0.6;
          } else if (elTag === 'p' || elTag === 'span') {
            elements.push({
              type: 'text', text: text,
              x: 0.6, y: yPos, w: 12, h: 0.4,
              fontSize: getFontSize(el), color: getColor(el), fontFace: getFontFamily(el),
            });
            yPos += 0.5;
          } else if (elTag === 'ul' || elTag === 'ol') {
            var items = el.querySelectorAll('li');
            var texts = [];
            items.forEach(function (li) {
              var t = textContent(li);
              if (t) texts.push({ text: t, options: { bullet: true } });
            });
            if (texts.length) {
              elements.push({
                type: 'bullets', text: texts,
                x: 0.6, y: yPos, w: 12, h: 2,
                fontSize: 14, color: '000000', fontFace: 'Calibri',
              });
              yPos += 2.2;
            }
          }
        });
      }
    });

    return elements;
  }

  function isFlexContainer(el) {
    return /flex/i.test(getComputedStyle(el).display);
  }

  function getFlexColumns(el) {
    var children = [];
    Array.prototype.forEach.call(el.children, function (child) {
      var tag = child.tagName.toLowerCase();
      if (tag !== 'style' && tag !== 'script' && tag !== 'aside' && tag !== 'span') {
        children.push(child);
      }
    });
    // 过滤掉箭头 span
    if (children.length < 2) return null;

    // 检查 flex 比例
    var ratios = children.map(function (c) {
      var flex = parseFloat(getComputedStyle(c).flex || '1');
      return flex > 0 ? flex : 1;
    });

    return children.map(function (c, i) {
      return { el: c, ratio: ratios[i] };
    });
  }

  function processFlexColumns(columns, yPos, vars, elements) {
    var totalRatio = columns.reduce(function (s, c) { return s + c.ratio; }, 0);
    var gap = 0.3;
    var totalGap = gap * (columns.length - 1);
    var availW = 12 - totalGap;
    var xPos = 0.6;
    var maxH = 0;

    columns.forEach(function (col) {
      var colW = (col.ratio / totalRatio) * availW;
      var colY = yPos;

      var innerEls = col.el.querySelectorAll(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > p, :scope > ul, :scope > ol, :scope > i, :scope > img');
      innerEls.forEach(function (el) {
        var tag = el.tagName.toLowerCase();
        var text = textContent(el);

        if (/^h[1-6]$/.test(tag) && text) {
          elements.push({
            type: 'text', text: text,
            x: xPos, y: colY, w: colW, h: 0.4,
            fontSize: getFontSize(el), bold: isBold(el), color: getColor(el),
            fontFace: getFontFamily(el), align: getAlign(el),
          });
          colY += 0.5;
        } else if ((tag === 'p' || tag === 'span') && text) {
          var lines = Math.ceil(text.length / Math.max(20, colW * 6));
          var h = Math.max(0.3, lines * 0.24);
          elements.push({
            type: 'text', text: text,
            x: xPos, y: colY, w: colW, h: h,
            fontSize: getFontSize(el), color: getColor(el), fontFace: getFontFamily(el),
          });
          colY += h + 0.1;
        } else if ((tag === 'ul' || tag === 'ol') && text) {
          var items = el.querySelectorAll('li');
          var texts = [];
          items.forEach(function (li) {
            var t = textContent(li);
            if (t) texts.push({ text: t, options: { bullet: true } });
          });
          if (texts.length) {
            elements.push({
              type: 'bullets', text: texts,
              x: xPos, y: colY, w: colW, h: 1.5,
              fontSize: 14, color: '000000', fontFace: 'Calibri',
            });
            colY += 1.7;
          }
        } else if (tag === 'i') {
          // 图标 → 文本占位
          elements.push({
            type: 'text', text: '●',
            x: xPos, y: colY, w: colW, h: 0.4,
            fontSize: 24, color: getColor(el), align: 'center',
          });
          colY += 0.5;
        }
      });

      maxH = Math.max(maxH, colY - yPos);
      xPos += colW + gap;
    });

    return yPos + maxH + 0.2;
  }

  function getAlign(el) {
    var align = getComputedStyle(el).textAlign;
    if (align === 'center') return 'center';
    if (align === 'right') return 'right';
    return 'left';
  }

  // ─── 主导出函数 ─────────────────────────────────────────────

  function doExport() {
    if (typeof PptxGenJS === 'undefined') {
      alert('PptxGenJS 未加载，请检查网络连接。');
      return;
    }

    var btn = document.getElementById('pptx-export-btn');
    if (btn) { btn.textContent = '⏳ 导出中...'; btn.disabled = true; }

    try {
      var vars = getCssVars();
      var pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_WIDE';
      pptx.author = 'revealjs-presentation';

      // 获取所有 slides
      var topSections = document.querySelectorAll('.reveal .slides > section');
      if (topSections.length === 0) {
        topSections = document.querySelectorAll('section');
      }

      var slideCount = 0;

      topSections.forEach(function (section) {
        // 处理嵌套垂直 slides
        var nested = section.querySelectorAll(':scope > section');
        var slideSections = nested.length > 0 ? Array.from(nested) : [section];

        slideSections.forEach(function (sec) {
          var slide = pptx.addSlide();
          slideCount++;

          // 背景
          var bg = extractSlideBg(sec, vars);
          if (bg) slide.background = bg;

          // Speaker notes
          var notesEl = sec.querySelector('aside.notes');
          if (notesEl) {
            slide.addNotes(notesEl.textContent.trim());
          }

          // 内容
          var elements = processSlideContent(sec, vars);
          elements.forEach(function (el) {
            if (el.type === 'text') {
              slide.addText(el.text, {
                x: el.x, y: el.y, w: el.w, h: el.h,
                fontSize: el.fontSize, fontFace: el.fontFace || 'Calibri',
                color: el.color || '000000',
                bold: el.bold || false, italic: el.italic || false,
                align: el.align || 'left', valign: 'top',
                wrap: true, shrinkText: true,
              });
            } else if (el.type === 'bullets') {
              slide.addText(el.text, {
                x: el.x, y: el.y, w: el.w, h: el.h,
                fontSize: el.fontSize || 14, fontFace: el.fontFace || 'Calibri',
                color: el.color || '000000',
                valign: 'top', wrap: true, shrinkText: true,
              });
            } else if (el.type === 'image' && el.src) {
              try {
                slide.addImage({ x: el.x, y: el.y, w: el.w, h: el.h, path: el.src });
              } catch (e) { /* 图片加载失败，跳过 */ }
            }
          });

          // 页码
          slide.addText(slideCount + '', {
            x: 12.2, y: 7.0, w: 0.8, h: 0.3,
            fontSize: 9, color: '999999', align: 'right',
          });
        });
      });

      var fileName = (document.title || 'presentation').replace(/[^\w一-鿿-]/g, '_');
      pptx.writeFile({ fileName: fileName + '.pptx' }).then(function () {
        if (btn) { btn.textContent = '✅ 已导出'; setTimeout(function () { btn.textContent = BTN_TEXT; btn.disabled = false; }, 2000); }
      });
    } catch (err) {
      console.error('PPTX export error:', err);
      alert('导出失败: ' + err.message);
      if (btn) { btn.textContent = BTN_TEXT; btn.disabled = false; }
    }
  }

  // ─── 创建按钮 ─────────────────────────────────────────────

  function init() {
    var btn = document.createElement('button');
    btn.id = 'pptx-export-btn';
    btn.textContent = BTN_TEXT;
    btn.setAttribute('style', BTN_STYLE);
    btn.onclick = doExport;
    document.body.appendChild(btn);

    // 鼠标靠近时显示
    document.addEventListener('mousemove', function (e) {
      var show = e.clientY > window.innerHeight - 80 || e.clientX < 80;
      btn.style.opacity = show ? '0.9' : '0';
    });

    // 全屏时隐藏
    document.addEventListener('fullscreenchange', function () {
      btn.style.display = document.fullscreenElement ? 'none' : '';
    });
  }

  // DOM 就绪后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
