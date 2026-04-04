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
 * - 粉红色边框 + CONTENT_* : 内容溢出（文字/元素超出容器）
 */

(function comprehensiveOverflowScan() {
  const vp = { width: window.innerWidth, height: window.innerHeight };
  const results = { viewport: [], container: [], content: [], total: 0 };

  // 重置所有之前的高亮
  document.querySelectorAll('*').forEach(el => {
    el.style.outline = '';
  });

  // ========== 1. 视口溢出 + 内容溢出 ==========
  document.querySelectorAll('section').forEach((sec, si) => {
    sec.querySelectorAll('*').forEach(el => {
      const rect = el.getBoundingClientRect();
      const computed = window.getComputedStyle(el);
      const issues = [];

      // 视口边界检测（-2px buffer 减少亚像素误报）
      if (rect.top < -2) issues.push({ type: 'VP_TOP', val: Math.round(-rect.top) });
      if (rect.bottom > vp.height + 2) issues.push({ type: 'VP_BOTTOM', val: Math.round(rect.bottom - vp.height) });
      if (rect.left < -2) issues.push({ type: 'VP_LEFT', val: Math.round(-rect.left) });
      if (rect.right > vp.width + 2) issues.push({ type: 'VP_RIGHT', val: Math.round(rect.right - vp.width) });

      // 内容溢出检测（排除自身有 overflow 的元素）
      const hasExplicitOverflow = ['auto', 'scroll'].includes(computed.overflowX) ||
                                  ['auto', 'scroll'].includes(computed.overflowY);
      // 文本级元素（H1-H6, P, LI 等）的多行文本会自然撑开高度，不是问题
      const isTextElement = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'LI', 'TD', 'SPAN', 'A', 'LABEL'].includes(el.tagName);
      if (!hasExplicitOverflow && !isTextElement) {
        // 排除代码块等预期有溢出的元素
        const isPreOrCode = el.tagName === 'PRE' || el.tagName === 'CODE';
        if (el.scrollWidth > el.clientWidth + 2 && !isPreOrCode) {
          issues.push({ type: 'CONTENT_W', val: Math.round(el.scrollWidth - el.clientWidth) });
        }
        if (el.scrollHeight > el.clientHeight + 2) {
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
            tag: el.tagName,
            cls: el.className || '',
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

      const childRect = child.getBoundingClientRect();
      const childComputed = window.getComputedStyle(child);

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
            cls: child.className || '',
            parent: `${container.tagName}${container.className ? '.' + container.className.split(' ')[0] : ''}`,
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

  document.querySelectorAll('.reveal section').forEach(sec => {
    checkContainerOverflow(sec);
  });

  // ========== 3. 输出报告 ==========
  console.log('%c=== 综合溢出检测报告 ===', 'font-size: 16px; font-weight: bold; color: #333;');
  console.log(`总问题数: ${results.total}`);

  if (results.viewport.length > 0) {
    console.log('%c视口/内容溢出:', 'font-weight: bold; color: #ff0000;');
    results.viewport.forEach(item => {
      console.log(
        `  Slide ${item.slide} | ${item.tag}${item.cls ? '.' + item.cls.split(' ')[0] : ''} | ${item.type}: ${item.val}px`
      );
    });
  }

  if (results.container.length > 0) {
    console.log('%c容器溢出 (Flex/Grid):', 'font-weight: bold; color: #00aa00;');
    results.container.forEach(item => {
      console.log(
        `  ${item.tag}${item.cls ? '.' + item.cls.split(' ')[0] : ''} -> ${item.parent} | X: ${item.overflowX}px Y: ${item.overflowY}px`
      );
    });
  }

  if (results.total === 0) {
    console.log('%c\u2705 未检测到溢出问题', 'font-size: 14px; color: #00aa00;');
  } else {
    console.log('%c\u26A0\uFE0F 发现 ' + results.total + ' 个溢出问题（已用边框标记）', 'font-size: 14px; color: #ff6600;');
  }

  return results;
})();
