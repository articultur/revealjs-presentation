/**
 * 综合溢出检测脚本 v3
 * 检测：视口溢出 + 容器溢出 + 内容溢出
 *
 * 使用方法：在 DevTools Console (F12) 中粘贴此代码并执行
 * 或：fetch('scripts/overflow-detect.js').then(r => r.text()).then(eval)
 *
 * 输出说明：
 * - 红色边框 + VP_* : 视口溢出（元素超出可视区域）
 * - 绿色边框 + CHILD_Ovf : 子元素撑破父容器（Flex/Grid）
 * - 红色边框 + CONTENT_* : 内容溢出（文字/元素超出容器，与视口溢出共线）
 */

(function installOverflowScanner(global) {
  function classText(el) {
    if (!el || el.className == null) return '';
    if (typeof el.className === 'string') return el.className;
    if (typeof el.className.baseVal === 'string') return el.className.baseVal;
    return String(el.className || '');
  }

  function firstClass(cls) {
    return (cls || '').trim().split(/\s+/)[0] || '';
  }

  function isDecorativeIgnored(el) {
    const ignored = el.closest('[data-qa-ignore="decorative"]');
    if (!ignored) return false;
    const text = (ignored.textContent || '').trim();
    return text.length === 0;
  }

  function comprehensiveOverflowScan(options = {}) {
  const sectionNodes = options.sections
    ? Array.from(options.sections)
    : Array.from(document.querySelectorAll(options.visibleOnly ? '.reveal section.present' : 'section'));
  const vp = { width: window.innerWidth, height: window.innerHeight };
  const results = { viewport: [], container: [], content: [], total: 0 };

  // 重置所有之前的高亮
  document.querySelectorAll('*').forEach(el => {
    el.style.outline = '';
  });

  // ========== 1. 视口溢出 + 内容溢出 ==========
  sectionNodes.forEach((sec, si) => {
    const slideIndex = Number.isInteger(options.slideOffset) ? options.slideOffset : si;
    sec.querySelectorAll('*').forEach(el => {
      if (isDecorativeIgnored(el)) return;
      const rect = el.getBoundingClientRect();
      const sectionRect = sec.getBoundingClientRect();
      const computed = window.getComputedStyle(el);
      if (computed.display === 'contents' || (rect.width === 0 && rect.height === 0)) return;
      const boundary = el === sec
        ? { top: 0, right: vp.width, bottom: vp.height, left: 0 }
        : sectionRect;
      const issues = [];

      // 边界检测：section 对视口，section 内元素对当前 slide 边界。
      if (rect.top < boundary.top - 2) issues.push({ type: 'VP_TOP', val: Math.round(boundary.top - rect.top) });
      if (rect.bottom > boundary.bottom + 2) issues.push({ type: 'VP_BOTTOM', val: Math.round(rect.bottom - boundary.bottom) });
      if (rect.left < boundary.left - 2) issues.push({ type: 'VP_LEFT', val: Math.round(boundary.left - rect.left) });
      if (rect.right > boundary.right + 2) issues.push({ type: 'VP_RIGHT', val: Math.round(rect.right - boundary.right) });

      // 内容溢出检测（排除自身有 overflow 的元素）
      const hasExplicitOverflow = ['auto', 'scroll'].includes(computed.overflowX) ||
                                  ['auto', 'scroll'].includes(computed.overflowY);
      const inlineStyle = el.getAttribute('style') || '';
      const hasWidthConstraint = el.tagName === 'SECTION' ||
        /(?:^|;)\s*(?:width|max-width)\s*:/i.test(inlineStyle) ||
        ['hidden', 'clip'].includes(computed.overflowX);
      const hasHeightConstraint = el.tagName === 'SECTION' ||
        /(?:^|;)\s*(?:height|max-height)\s*:/i.test(inlineStyle) ||
        ['hidden', 'clip'].includes(computed.overflowY);
      // 文本级元素（H1-H6, P, LI 等）的多行文本会自然撑开高度，不是问题
      const isTextElement = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'LI', 'TD', 'SPAN', 'A', 'LABEL'].includes(el.tagName);
      if (!hasExplicitOverflow && !isTextElement && (hasWidthConstraint || hasHeightConstraint)) {
        // 排除代码块等预期有溢出的元素
        const isPreOrCode = el.tagName === 'PRE' || el.tagName === 'CODE';
        if (hasWidthConstraint && el.scrollWidth > el.clientWidth + 2 && !isPreOrCode) {
          issues.push({ type: 'CONTENT_W', val: Math.round(el.scrollWidth - el.clientWidth) });
        }
        if (hasHeightConstraint && el.scrollHeight > el.clientHeight + 2) {
          issues.push({ type: 'CONTENT_H', val: Math.round(el.scrollHeight - el.clientHeight) });
        }
      }

      if (issues.length > 0) {
        el.style.outline = '3px solid #ff0000';
        el.style.outlineOffset = '2px';
        results.total++;
        issues.forEach(iss => {
        results.viewport.push({
            slide: si,
            slideIndex,
            tag: el.tagName,
            cls: classText(el),
            style: (el.getAttribute('style') || '').slice(0, 160),
            text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
            rect: {
              top: Math.round(rect.top),
              right: Math.round(rect.right),
              bottom: Math.round(rect.bottom),
              left: Math.round(rect.left),
            },
            boundary: {
              top: Math.round(boundary.top),
              right: Math.round(boundary.right),
              bottom: Math.round(boundary.bottom),
              left: Math.round(boundary.left),
            },
            ...iss
          });
        });
      }
    });
  });

  // ========== 2. Flex/Grid 容器溢出检测（递归检查）==========
  function checkContainerOverflow(container, depth = 0) {
    if (depth > 3) return; // 防止无限递归，最多检查 3 层嵌套

    const computed = window.getComputedStyle(container);
    if (computed.display !== 'flex' && computed.display !== 'grid') return;

    const containerRect = container.getBoundingClientRect();
    const children = container.children;

    Array.from(children).forEach(child => {
      if (child.tagName === 'SCRIPT' || child.tagName === 'STYLE') return;
      if (isDecorativeIgnored(child)) return;

      const childRect = child.getBoundingClientRect();
      const childComputed = window.getComputedStyle(child);
      if (childComputed.display === 'contents' || (childRect.width === 0 && childRect.height === 0)) return;

      const overflowX = childRect.right - containerRect.right;
      const overflowY = childRect.bottom - containerRect.bottom;

      if (overflowX > 2 || overflowY > 2) {
        // 排除自身有 overflow 的子元素
        if (!['auto', 'scroll', 'hidden'].includes(childComputed.overflowX) &&
            !['auto', 'scroll', 'hidden'].includes(childComputed.overflowY)) {
          child.style.outline = '3px solid #00ff00';
          child.style.outlineOffset = '2px';
          results.container.push({
            tag: child.tagName,
            cls: classText(child),
            parent: `${container.tagName}${firstClass(classText(container)) ? '.' + firstClass(classText(container)) : ''}`,
            overflowX: Math.round(overflowX),
            overflowY: Math.round(overflowY)
          });
          results.total++;
        }
      }

      // 递归检查子元素是否为容器
      checkContainerOverflow(child, depth + 1);
    });
  }

  sectionNodes.forEach(sec => {
    checkContainerOverflow(sec);
  });

  // ========== 3. 输出报告 ==========
  console.log('%c=== 综合溢出检测报告 ===', 'font-size: 16px; font-weight: bold; color: #333;');
  console.log(`总问题数: ${results.total}`);

  if (results.viewport.length > 0) {
    console.log('%c视口/内容溢出:', 'font-weight: bold; color: #ff0000;');
    results.viewport.forEach(item => {
      console.log(
        `  Slide ${item.slideIndex ?? item.slide} | ${item.tag}${firstClass(item.cls) ? '.' + firstClass(item.cls) : ''} | ${item.type}: ${item.val}px`
      );
    });
  }

  if (results.container.length > 0) {
    console.log('%c容器溢出 (Flex/Grid):', 'font-weight: bold; color: #00aa00;');
    results.container.forEach(item => {
      console.log(
        `  ${item.tag}${firstClass(item.cls) ? '.' + firstClass(item.cls) : ''} -> ${item.parent} | X: ${item.overflowX}px Y: ${item.overflowY}px`
      );
    });
  }

  if (results.total === 0) {
    console.log('%c\u2705 未检测到溢出问题', 'font-size: 14px; color: #00aa00;');
  } else {
    console.log('%c\u26A0\uFE0F 发现 ' + results.total + ' 个溢出问题（已用边框标记）', 'font-size: 14px; color: #ff6600;');
  }

  return results;
  }

  global.comprehensiveOverflowScan = comprehensiveOverflowScan;

  if (!global.__REVEALJS_VALIDATE_DISABLE_AUTO_RUN__) {
    global.__lastOverflowScan = comprehensiveOverflowScan();
  }
})(typeof window !== 'undefined' ? window : globalThis);
