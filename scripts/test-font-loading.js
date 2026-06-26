#!/usr/bin/env node
/**
 * Font Loading Flicker Check
 * ------------------------------------------------------------
 * 检测字体加载闪烁(FOUT)导致的文字重叠——BLACKPINK deck 的 logo 大字 vs
 * 右上印章重叠的根因:字体未加载时 fallback 字体更宽,logo 撑到印章位置。
 *
 * 两道检测(**遍历每一个 slide**,不只 present):
 *   1. font-flicker-width: 大字(logo/h1/h2/大数字 ≥60px)在 fallback 字体
 *      (Google Fonts 被 abort)vs 真实字体加载后的宽度差 > 15% = 字体闪烁
 *      可能导致加载前/后布局跳变重叠。
 *   2. large-text-clearance: 大字与角元素(stamp/pin/photo-credit 等绝对
 *      定位)水平间距 < 50px = 字体宽度波动时易撞(BP logo-stamp 8px 实例)。
 *
 * 遍历修复(2026-06):原版只测 present slide,非 present section 被 reveal
 * transform 移出视口致 getBoundingClientRect 返回移出位置,大字漏测。改为
 * 外部循环 Reveal.slide(i) 激活每个 slide 再测,覆盖全 deck 大字。
 *
 * Usage:
 *   node scripts/test-font-loading.js <html-file>
 *
 * Exit codes:
 *   0 - no blocker(宽度差 < 15% 且间距 ≥ 50px)
 *   1 - blocker(宽度差 ≥ 15% 或间距 < 50px,需修:font-family 加窄体
 *       fallback / 缩大字 / 移角元素)
 *   2 - usage/setup error
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const htmlFile = args.find(a => !a.startsWith('--'));
if (!htmlFile) {
  console.error('Usage: node scripts/test-font-loading.js <html-file>');
  process.exit(2);
}
const filePath = path.resolve(htmlFile);
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(2);
}

const WIDTH_RATIO_THRESHOLD = 0.15;   // 大字 fallback vs loaded 宽度差 > 15% = 闪烁风险
const CLEARANCE_THRESHOLD = 50;        // 大字与角元素水平间距 < 50px = 易撞
const SLIDE_TRANSITION_MS = 250;       // reveal fade 过渡 ~200ms,留余量等 present 切换

const LARGE_SELECTOR = '.logo, h1, h2, .name-en, .big-num, .iya, .track, .kicker-large, .pullquote, .anchor-numeral, .display';
const CORNER_SELECTOR = '.stamp, .cover-stamp, .close-stamp, .pin, .photo-credit, .source, .dots, .north-mark, .corner-tag';

async function getSlideCount(page) {
  return await page.evaluate(() => {
    if (typeof window.Reveal !== 'undefined' && window.Reveal.getTotalSlides) {
      return window.Reveal.getTotalSlides();
    }
    return document.querySelectorAll('.reveal .slides > section').length;
  });
}

// 激活第 idx 张 slide(Reveal.slide),等过渡,返回 present section 的大字度量
async function measureSlideAt(page, idx) {
  await page.evaluate(i => {
    if (typeof window.Reveal !== 'undefined' && window.Reveal.slide) {
      window.Reveal.slide(i);
    }
  }, idx);
  await page.waitForTimeout(SLIDE_TRANSITION_MS);
  return await page.evaluate(({ selector, idx }) => {
    const sections = document.querySelectorAll('.reveal .slides > section');
    const slideEl = Array.from(sections).find(s => s.classList.contains('present')) || sections[idx];
    if (!slideEl) return [];
    const out = [];
    slideEl.querySelectorAll(selector).forEach(el => {
      const cs = getComputedStyle(el);
      if (parseFloat(cs.fontSize) < 60) return;        // 3em × 20px ≈ 60px
      const r = el.getBoundingClientRect();
      if (r.width < 50) return;                          // 跳过不可见
      out.push({
        slide: idx + 1,
        text: (el.textContent || '').trim().slice(0, 24),
        width: Math.round(r.width),
        left: Math.round(r.left),
        right: Math.round(r.right),
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
      });
    });
    return out;
  }, { selector: LARGE_SELECTOR, idx });
}

// 激活第 idx 张 slide,测该 slide 大字与绝对定位角元素的水平间距
async function clearanceSlideAt(page, idx) {
  await page.evaluate(i => {
    if (typeof window.Reveal !== 'undefined' && window.Reveal.slide) {
      window.Reveal.slide(i);
    }
  }, idx);
  await page.waitForTimeout(SLIDE_TRANSITION_MS);
  return await page.evaluate(({ largeSel, cornerSel, threshold, idx }) => {
    const sections = document.querySelectorAll('.reveal .slides > section');
    const slideEl = Array.from(sections).find(s => s.classList.contains('present')) || sections[idx];
    if (!slideEl) return [];
    const issues = [];
    const large = Array.from(slideEl.querySelectorAll(largeSel)).filter(el => parseFloat(getComputedStyle(el).fontSize) >= 60);
    const corners = Array.from(slideEl.querySelectorAll(cornerSel)).filter(el => {
      const cs = getComputedStyle(el);
      return (cs.position === 'absolute' || cs.position === 'fixed') && el.getBoundingClientRect().width > 0;
    });
    large.forEach(l => {
      const lr = l.getBoundingClientRect();
      corners.forEach(c => {
        const cr = c.getBoundingClientRect();
        if (lr.bottom < cr.top || lr.top > cr.bottom) return;   // 垂直无重叠则跳过
        const gap = lr.right <= cr.left ? cr.left - lr.right
                  : cr.right <= lr.left ? lr.left - cr.right
                  : 0;
        if (gap < threshold) {
          issues.push({
            slide: idx + 1,
            category: 'large-text-clearance',
            severity: gap === 0 ? 'blocker' : 'warning',
            message: `"${(l.textContent || '').trim().slice(0, 18)}" 大字与 "${(c.textContent || '').trim().slice(0, 18)}" 角元素水平间距 ${gap}px < ${threshold}px——字体宽度波动时易撞(BP logo-stamp 根因)`,
          });
        }
      });
    });
    return issues;
  }, { largeSel: LARGE_SELECTOR, cornerSel: CORNER_SELECTOR, threshold: CLEARANCE_THRESHOLD, idx });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  // === Pass 1: 字体未加载(fallback)——Google Fonts 被 abort ===
  await page.route('**/*', route => {
    const url = route.request().url();
    if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
      route.abort();
    } else {
      route.continue();
    }
  });
  await page.goto(`file://${filePath}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  const slideCount = await getSlideCount(page);
  const fallbackBySlide = [];
  for (let i = 0; i < slideCount; i++) {
    fallbackBySlide.push(await measureSlideAt(page, i));
  }

  // === Pass 2: 字体加载后(真实字体)===
  await page.unroute('**/*');
  await page.goto(`file://${filePath}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  const loadedBySlide = [];
  const clearanceIssues = [];
  for (let i = 0; i < slideCount; i++) {
    loadedBySlide.push(await measureSlideAt(page, i));
    clearanceIssues.push(...await clearanceSlideAt(page, i));
  }

  await browser.close();

  // === 分析宽度差(per slide per element 配对)===
  const issues = [...clearanceIssues];
  for (let i = 0; i < slideCount; i++) {
    const fb = fallbackBySlide[i] || [];
    const ld = loadedBySlide[i] || [];
    const maxLen = Math.max(fb.length, ld.length);
    for (let j = 0; j < maxLen; j++) {
      const f = fb[j], l = ld[j];
      if (!f || !l || f.width <= 0) continue;
      if (f.text !== l.text) continue;     // 元素错位则跳过(保守)
      const ratio = Math.abs(l.width - f.width) / f.width;
      if (ratio > WIDTH_RATIO_THRESHOLD) {
        issues.push({
          slide: f.slide,
          category: 'font-flicker-width',
          severity: 'warning',
          message: `"${f.text}" 字体加载前后宽度差 ${(ratio * 100).toFixed(0)}% (fallback ${f.width}px → loaded ${l.width}px),超 ${WIDTH_RATIO_THRESHOLD * 100}% 阈值——加载前可能撑到相邻元素致重叠。修法:font-family 加窄体 fallback(如 Arial Narrow)+ 缩大字 / 移角元素`,
        });
      }
    }
  }

  // === 报告 ===
  const blockers = issues.filter(i => i.severity === 'blocker');
  const warnings = issues.filter(i => i.severity === 'warning');
  const fallbackTotal = fallbackBySlide.reduce((s, a) => s + a.length, 0);
  const loadedTotal = loadedBySlide.reduce((s, a) => s + a.length, 0);
  console.log(`font loading check: ${blockers.length === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`  slides scanned: ${slideCount} (Reveal.slide 遍历每页)`);
  console.log(`  large text measured: fallback=${fallbackTotal} loaded=${loadedTotal} (≥60px)`);
  console.log(`  issues: ${issues.length} (${blockers.length} blocker, ${warnings.length} warning)`);
  for (const issue of issues.slice(0, 14)) {
    console.log(`  ${issue.severity.toUpperCase()} slide ${issue.slide} [${issue.category}]: ${issue.message}`);
  }

  process.exit(blockers.length === 0 ? 0 : 1);
}

run().catch(err => {
  console.error(`font loading check failed: ${err.message}`);
  process.exit(2);
});
