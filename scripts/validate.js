#!/usr/bin/env node
/**
 * reveal.js 自动化验证脚本
 * 自动打开浏览器 → 检测溢出 → 截图报告 → 关闭
 *
 * 使用方法：
 *   node scripts/validate.js <HTML文件路径>
 *   node scripts/validate.js <HTML文件路径> --fix  # 同时应用自动修复
 *
 * 依赖：npm install playwright
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const htmlFile = args.find(a => !a.startsWith('--'));
const doFix = args.includes('--fix');

if (!htmlFile) {
  console.log('用法: node scripts/validate.js <HTML文件> [--fix]');
  console.log('示例: node scripts/validate.js output/presentation.html');
  process.exit(1);
}

const filePath = path.resolve(htmlFile);
if (!fs.existsSync(filePath)) {
  console.error(`文件不存在: ${filePath}`);
  process.exit(1);
}

const fileUrl = `file://${filePath}`;
const overflowDetectCode = fs.readFileSync(path.join(__dirname, 'overflow-detect.js'), 'utf8');
const autoFixCode = fs.readFileSync(path.join(__dirname, 'auto-fix-css.js'), 'utf8');

// ─── Shared slide scanner ──────────────────────────────────────
// Extracted from duplicated logic: one function for initial scan
// and re-scan after --fix.

async function scanAllSlides(page) {
  if (typeof window.Reveal !== 'undefined' && typeof window.Reveal.getSlides === 'function') {
    const slides = window.Reveal.getSlides();
    const merged = { viewport: [], container: [], content: [], total: 0 };
    for (let i = 0; i < slides.length; i++) {
      const indices = window.Reveal.getIndices(slides[i]);
      window.Reveal.slide(indices.h, indices.v || 0);
      await new Promise(resolve => setTimeout(resolve, 650));
      // Force all fragments visible so overflow is measured at worst-case content density
      slides[i].querySelectorAll('.fragment').forEach(fragment => {
        fragment.classList.add('visible');
        fragment.classList.add('current-fragment');
        fragment.classList.remove('fragment', 'fade-up', 'fade-down', 'fade-left', 'fade-right', 'fade-in', 'fade-out');
        fragment.style.setProperty('transform', 'none', 'important');
        fragment.style.setProperty('opacity', '1', 'important');
      });
      const scan = window.comprehensiveOverflowScan({ sections: [slides[i]], slideOffset: i + 1 });
      merged.viewport.push(...(scan.viewport || []));
      merged.container.push(...(scan.container || []));
      merged.content.push(...(scan.content || []));
      merged.total += scan.total || 0;
    }
    window.Reveal.slide(0, 0);
    return merged;
  }
  return window.comprehensiveOverflowScan();
}

async function validate() {
  console.log('启动浏览器...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  console.log(`打开: ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  // 等待 Reveal.js 初始化完成（延长到 20s 应对慢 CDN）
  await page.waitForFunction(() => {
    return typeof Reveal !== 'undefined' && Reveal.isReady();
  }, { timeout: 20000 }).catch(() => {
    console.error('Reveal.js 未检测到（>20s），可能是 CDN 加载失败或非 reveal 文件。');
  });
  await page.waitForTimeout(500); // 额外等待动画完成

  // 注入溢出检测脚本
  console.log('执行溢出检测...');
  await page.evaluate(() => {
    window.__REVEALJS_VALIDATE_DISABLE_AUTO_RUN__ = true;
  });
  await page.addScriptTag({ content: overflowDetectCode });

  const results = await page.evaluate(scanAllSlides);

  console.log(`\n检测结果: ${results.total} 个问题`);
  if (results.viewport.length > 0) {
    console.log('%c视口/内容溢出:', 'color: #ff0000; font-weight: bold;');
    results.viewport.forEach(item => {
      const detail = item.cls || item.style || item.text
        ? ` | ${[item.cls, item.style, item.text].filter(Boolean).join(' | ')}`
        : '';
      const rect = item.rect && item.boundary
        ? ` | rect=${JSON.stringify(item.rect)} boundary=${JSON.stringify(item.boundary)}`
        : '';
      console.log(`  Slide ${item.slideIndex ?? item.slide} | ${item.tag} | ${item.type}: ${item.val}px${detail}${rect}`);
    });
  }
  if (results.container.length > 0) {
    console.log('%c容器溢出:', 'color: #00aa00; font-weight: bold;');
    results.container.forEach(item => {
      console.log(`  Slide ${item.slideIndex ?? '-'} | ${item.tag} -> ${item.parent} | X: ${item.overflowX}px Y: ${item.overflowY}px`);
    });
  }

  // 截图保存。若存在问题，跳转到第一张失败 slide，避免证据截图停在无关页面。
  let screenshotPath = filePath.replace('.html', '-overflow.png');
  if (results.total > 0) {
    const firstIssue = [
      ...(results.viewport || []),
      ...(results.container || []),
      ...(results.content || []),
    ].find(item => Number.isInteger(item.slideIndex) && item.slideIndex > 0);
    if (firstIssue && typeof firstIssue.slideIndex === 'number') {
      await page.evaluate(slideIndex => {
        if (typeof window.Reveal !== 'undefined') window.Reveal.slide(slideIndex - 1, 0);
      }, firstIssue.slideIndex);
      await page.waitForTimeout(500);
      screenshotPath = filePath.replace(/\.html?$/i, `-overflow-slide-${firstIssue.slideIndex}.png`);
    }
  }
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`\n截图保存: ${screenshotPath}`);
  console.log('（红色边框 = 溢出元素，绿色边框 = 容器溢出）');

  // 可选：自动修复
  if (doFix) {
    console.log('\n应用自动修复...');
    await page.addScriptTag({ content: autoFixCode });
    const fixResults = await page.evaluate(() => {
      if (typeof window.autoFixCSS === 'function') {
        return window.autoFixCSS();
      }
      throw new Error('auto-fix-css.js did not expose window.autoFixCSS');
    });
    console.log(`修复结果: ${fixResults.fixed} 项`);

    // 重新检测（复用共享扫描函数）
    const finalResults = await page.evaluate(scanAllSlides);
    console.log(`修复后剩余问题: ${finalResults.total} 个`);

    if (finalResults.total === 0) {
      console.log('%c✅ 全部修复完成', 'color: #00aa00; font-size: 14px;');
    }

    // 保存修复后截图
    const fixedPath = filePath.replace('.html', '-fixed.png');
    await page.screenshot({ path: fixedPath, fullPage: false });
    console.log(`修复后截图: ${fixedPath}`);
  }

  await browser.close();

  if (results.total > 0 && !doFix) {
    console.log('\n提示: 使用 --fix 参数可尝试自动修复');
  }

  return results.total === 0;
}

validate().then(passed => {
  process.exit(passed ? 0 : 1);
}).catch(err => {
  console.error('验证失败:', err);
  process.exit(1);
});
