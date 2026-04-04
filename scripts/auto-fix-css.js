/**
 * CSS 自动修复脚本 v2
 * 修复：Flex min-width + Grid 1fr + word-break
 *
 * 使用方法：在 DevTools Console (F12) 中粘贴此代码并执行
 * 或：fetch('scripts/auto-fix-css.js').then(r => r.text()).then(eval)
 *
 * 参数说明：
 * - dryRun (默认 false): true 时只报告不修改
 */

(function autoFixCSS(dryRun = false) {
  let fixed = 0;
  const dryRunPrefix = dryRun ? '[DRY-RUN] ' : '';

  // ========== A1: Flex min-width（Flex 子项溢出）==========
  document.querySelectorAll('.reveal section *').forEach(el => {
    const parent = el.parentElement;
    if (!parent) return;
    const p = window.getComputedStyle(parent);
    if (p.display === 'flex') {
      // 检查是否已经有 min-width 设置
      const elStyle = window.getComputedStyle(el);
      const currentMinWidth = parseFloat(elStyle.minWidth) || 0;

      // 只有当 min-width > 0 且实际溢出时才跳过
      if (el.scrollWidth > parent.clientWidth && currentMinWidth === 0) {
        if (!dryRun) {
          el.style.minWidth = '0';
        }
        fixed++;
        console.log(`${dryRunPrefix}[A1] ${el.tagName}${el.className ? '.' + el.className.split(' ')[0] : ''} +min-width: 0`);
      }
    }
  });

  // ========== A2: Grid 1fr → minmax(0, 1fr)（只改 inline style，不碰 stylesheet）==========
  // 遍历所有可能有 grid-template-columns 的元素
  document.querySelectorAll('[style*="grid"]').forEach(el => {
    const style = el.style;
    if (style.gridTemplateColumns && style.gridTemplateColumns.includes('1fr')) {
      if (!style.gridTemplateColumns.includes('minmax')) {
        if (!dryRun) {
          style.gridTemplateColumns = style.gridTemplateColumns.replace(/1fr/g, 'minmax(0, 1fr)');
        }
        fixed++;
        console.log(`${dryRunPrefix}[A2] [style*="grid"] +grid-template-columns: 1fr → minmax(0, 1fr)`);
      }
    }
  });

  // ========== A3: word-break（长文本溢出，使用 overflow-wrap: anywhere）==========
  document.querySelectorAll('p,h1,h2,h3,li,td,span').forEach(el => {
    if (el.scrollWidth > el.clientWidth + 1) {
      const computed = window.getComputedStyle(el);
      // 排除已经设置过 overflow-wrap 或有明确 overflow 的元素
      if (computed.overflowWrap === 'normal' || computed.overflowWrap === 'unchanged') {
        if (!dryRun) {
          el.style.overflowWrap = 'anywhere';
        }
        fixed++;
        console.log(`${dryRunPrefix}[A3] ${el.tagName}${el.className ? '.' + el.className.split(' ')[0] : ''} +overflow-wrap: anywhere`);
      }
    }
  });

  // ========== 报告 ==========
  if (dryRun) {
    console.log(`\n%c[DRY-RUN 模式] 将修复: ${fixed} 项（无实际修改）`, 'font-size: 14px; color: #0066ff;');
  } else {
    console.log(`\n自动修复: ${fixed} 项`);
  }

  return { fixed, dryRun };
})();

// 使用示例：
// autoFixCSS()        // 执行修复
// autoFixCSS(true)    // 只报告不修改（dry-run 模式）
