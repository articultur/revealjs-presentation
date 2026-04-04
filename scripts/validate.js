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

async function validate() {
  console.log('启动浏览器...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  console.log(`打开: ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  // 等待 Reveal.js 初始化完成
  await page.waitForFunction(() => {
    return typeof Reveal !== 'undefined' && Reveal.isReady();
  }, { timeout: 10000 }).catch(() => {
    console.log('Reveal.js 未检测到，继续执行...');
  });
  await page.waitForTimeout(500); // 额外等待动画完成

  // 注入溢出检测脚本
  console.log('执行溢出检测...');
  await page.addScriptTag({ content: overflowDetectCode });
  const results = await page.evaluate(() => {
    // 调用全局函数（脚本注入了 comprehensiveOverflowScan）
    if (typeof comprehensiveOverflowScan === 'function') {
      return comprehensiveOverflowScan();
    }
    return { total: 0, viewport: [], container: [] };
  });

  console.log(`\n检测结果: ${results.total} 个问题`);
  if (results.viewport.length > 0) {
    console.log('%c视口/内容溢出:', 'color: #ff0000; font-weight: bold;');
    results.viewport.forEach(item => {
      console.log(`  Slide ${item.slide} | ${item.tag} | ${item.type}: ${item.val}px`);
    });
  }
  if (results.container.length > 0) {
    console.log('%c容器溢出:', 'color: #00aa00; font-weight: bold;');
    results.container.forEach(item => {
      console.log(`  ${item.tag} -> ${item.parent} | X: ${item.overflowX}px Y: ${item.overflowY}px`);
    });
  }

  // 截图保存
  const screenshotPath = filePath.replace('.html', '-overflow.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`\n截图保存: ${screenshotPath}`);
  console.log('（红色边框 = 溢出元素，绿色边框 = 容器溢出）');

  // 可选：自动修复
  if (doFix) {
    console.log('\n应用自动修复...');
    await page.addScriptTag({ content: autoFixCode });
    const fixResults = await page.evaluate(() => {
      if (typeof autoFixCSS === 'function') {
        return autoFixCSS();
      }
      return { fixed: 0 };
    });
    console.log(`修复结果: ${fixResults.fixed} 项`);

    // 重新检测
    const finalResults = await page.evaluate(() => {
      if (typeof comprehensiveOverflowScan === 'function') {
        return comprehensiveOverflowScan();
      }
      return { total: 0, viewport: [], container: [] };
    });
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
