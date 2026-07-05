#!/usr/bin/env node
/**
 * check-overflow.js — 检测 reveal.js deck 的视觉叠放/溢出问题(G9)
 * ------------------------------------------------------------
 * 复用 overflow-detect.js 的 comprehensiveOverflowScan 作为单一 bbox
 * 扫描器(评估 G004①):消除 check-overflow 与 overflow-detect 双轨扫描,
 * 统一豁免机制 data-qa-ignore(替换原 class WHITELIST 双轨,G004②),
 * 边界检测基于 sectionRect 自动适配 Reveal.getScale(),消除 letterbox /
 * scale<1 时的视口像素阈值漏报(G004③)。
 *
 * 检测来源:
 *   comprehensiveOverflowScan(共享扫描器,浏览器侧):
 *     - VP_TOP / VP_RIGHT / VP_BOTTOM / VP_LEFT
 *         元素越 section 边界(boundary=present 的 getBoundingClientRect,
 *         随 Reveal scale 一起缩放 → 阈值无需硬编码视口像素)
 *     - CONTENT_W / CONTENT_H
 *         内容溢出容器(scrollWidth/Height > clientWidth/Height + 2,
 *         已排除 absolute/fixed out-of-flow 后代防 abs-SVG 误报,G001-②)
 *     - CHILD_Ovf(Flex/Grid 子元素撑破父容器)
 *   本脚本独有(overflow-detect 不针对 timeline 语义,保留):
 *     - TIMELINE_DESC_TOO_TALL — 时间线 .desc 高度 > 60px(超过 3 行)
 *     - TEXT_OVERLAP_BAR      — 时间线 .desc 文字与底部 .bar 进度条重叠
 *
 * 用法: node scripts/check-overflow.js <deck.html>
 * 退出码: 0=无问题,1=有问题(供 grade-gate G9 集成阻断交付),2=用法/依赖错误
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const deck = process.argv[2];
if (!deck) { console.error('Usage: node check-overflow.js <deck.html>'); process.exit(2); }

const filePath = path.resolve(deck);
if (!fs.existsSync(filePath)) { console.error(`文件不存在: ${filePath}`); process.exit(2); }

// 共享扫描器源码(与 validate.js 同源注入,单一 bbox 逻辑)
const overflowDetectCode = fs.readFileSync(path.join(__dirname, 'overflow-detect.js'), 'utf8');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('file://' + filePath, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => typeof Reveal !== 'undefined' && Reveal.isReady(), { timeout: 20000 })
    .catch(() => { console.error('❌ Reveal 未加载(>20s)'); });
  await page.waitForTimeout(500); // 等 fade/缩放稳定

  // 注入共享扫描器:先关 auto-run(IIFE 末尾会全文档跑一次,这里只要逐页手动调)
  await page.evaluate(() => { window.__REVEALJS_VALIDATE_DISABLE_AUTO_RUN__ = true; });
  await page.addScriptTag({ content: overflowDetectCode });

  const n = await page.evaluate(() => (typeof Reveal !== 'undefined' && Reveal.getTotalSlides) ? Reveal.getTotalSlides() : 0);
  if (!n) { console.error('❌ Reveal 未加载或无 slides'); await browser.close(); process.exit(2); }

  // scale 全局一致(Reveal 整体缩放,不随切页变化),循环外取一次。
  // 仅供输出诊断,边界检测已在 scan 内基于 sectionRect 自动适配 scale。
  const scale = await page.evaluate(() => (typeof Reveal !== 'undefined' && typeof Reveal.getScale === 'function') ? Reveal.getScale() : 1);

  const issues = [];
  for (let i = 0; i < n; i++) {
    await page.evaluate((idx) => Reveal.slide(idx), i);
    await page.waitForTimeout(450);

    // ── ① 共享扫描器:VP_* / CONTENT_* / CHILD_Ovf ──────────────
    // data-qa-ignore 豁免由 comprehensiveOverflowScan 内置 isDecorativeIgnored
    // 统一处理(与 validate.js / test-pin-collision / test-spatial-integrity 同机制)。
    const scan = await page.evaluate(() => {
      const present = document.querySelector('.reveal section.present');
      if (!present || typeof window.comprehensiveOverflowScan !== 'function') return null;
      return window.comprehensiveOverflowScan({ sections: [present] });
    });
    if (scan) {
      for (const item of [...(scan.viewport || []), ...(scan.container || [])]) {
        issues.push({
          slide: i + 1,
          kind: item.type || 'CHILD_Ovf',
          text: (item.text || item.cls || '').toString().slice(0, 30),
          val: item.val != null ? item.val : (item.overflowX || item.overflowY || 0),
          cls: item.cls || '',
        });
      }
    }

    // ── ② 本脚本独有:timeline 语义检测 ──────────────────────────
    // overflow-detect 是结构性扫描,不懂 timeline desc/bar 语义,这两类保留。
    const tl = await page.evaluate(() => {
      const present = document.querySelector('.reveal section.present');
      if (!present) return { items: [] };
      const els = [...present.querySelectorAll('*')].filter(e => {
        const r = e.getBoundingClientRect();
        return r.width > 2 && r.height > 2;
      });
      const pick = e => {
        const r = e.getBoundingClientRect();
        const clsRaw = e.className;
        const cls = clsRaw && (clsRaw.baseVal !== undefined ? clsRaw.baseVal : (typeof clsRaw === 'string' ? clsRaw : '')).toString().slice(0, 40);
        return { tag: e.tagName, cls, x: r.x, y: r.y, w: r.width, h: r.height, text: (e.textContent || '').trim().slice(0, 30) };
      };
      return { items: els.map(pick) };
    });
    const items = (tl && tl.items) || [];
    // TIMELINE_DESC_TOO_TALL(排除短编号:文本须 > 40 字符才算"描述")
    for (const el of items) {
      if (/desc|node|step|milestone/.test(el.cls) && el.h > 60 && (el.text || '').length > 40) {
        issues.push({ slide: i + 1, kind: 'TIMELINE_DESC_TOO_TALL', height: Math.round(el.h), text: el.text, val: Math.round(el.h), cls: el.cls });
      }
    }
    // TEXT_OVERLAP_BAR(bar 须含 progress/track/timeline-bar 排除卡片内装饰 bar)
    const bars = items.filter(e => /progress|track|timeline-bar/.test(e.cls));
    const descs = items.filter(e => /desc|node|step|milestone/.test(e.cls) && (e.text || '').length > 40);
    for (const d of descs) for (const b of bars) {
      const ix = Math.max(0, Math.min(d.x + d.w, b.x + b.w) - Math.max(d.x, b.x));
      const iy = Math.max(0, Math.min(d.y + d.h, b.y + b.h) - Math.max(d.y, b.y));
      if (iy > 10 && ix > 20) {
        issues.push({ slide: i + 1, kind: 'TEXT_OVERLAP_BAR', text: d.text, interY: Math.round(iy), interX: Math.round(ix), val: Math.round(iy), cls: d.cls });
      }
    }
    // 注:纯感官类(黑字黑底、图标是否解释主张、装饰盒是否压 page furniture)bbox 仍测不出,
    // 留给 visual-verdict(视觉模型或会话模型 Read dry-run 截图判定)。
  }
  await browser.close();

  console.log(`\n=== check-overflow: scale=${scale.toFixed(3)}, ${issues.length} issue(s) in ${n} slides ===`);
  if (issues.length === 0) { console.log('✅ 无溢出/叠放问题'); process.exit(0); }

  const bySlide = {};
  for (const it of issues) { (bySlide[it.slide] ??= []).push(it); }
  for (const [s, arr] of Object.entries(bySlide)) {
    console.log(`\nslide ${s}:`);
    for (const it of arr) {
      const meta = `val=${it.val ?? '-'} h=${it.height ?? '-'} interX=${it.interX ?? '-'} interY=${it.interY ?? '-'}`;
      console.log(`  ${String(it.kind).padEnd(25)} "${it.text}"  ${meta}  cls=${it.cls || '-'}`);
    }
  }
  process.exit(1);
})();
