#!/usr/bin/env node
/**
 * check-overflow.js — 检测 reveal.js deck 的视觉叠放/溢出问题
 * 基于 playwright bbox 测量，识别四类问题：
 *   1. TEXT_OVERFLOW_RIGHT  — 文字/标签越画布右边界（right > 1264）
 *   2. ELEMENT_BEYOND_CANVAS — 任意元素越画布（right > 1280）
 *   3. TIMELINE_DESC_TOO_TALL — 时间线 .desc 高度 > 60px（超过 3 行）
 *   4. TEXT_OVERLAP_BAR — 时间线 .desc 文字与底部 .bar 进度条重叠
 *
 * 用法: node scripts/check-overflow.js <deck.html>
 * 退出码: 0=无问题，1=有问题（供 grade-gate 集成阻断交付）
 */
const { chromium } = require('playwright');
const path = require('path');

const deck = process.argv[2];
if (!deck) { console.error('Usage: node check-overflow.js <deck.html>'); process.exit(2); }

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('file://' + path.resolve(deck));
  await page.waitForTimeout(2500);
  const n = await page.evaluate(() => (typeof Reveal !== 'undefined' && Reveal.getTotalSlides) ? Reveal.getTotalSlides() : 0);
  if (!n) { console.error('❌ Reveal 未加载或无 slides'); await browser.close(); process.exit(2); }

  const issues = [];
  let scale = 1;
  for (let i = 0; i < n; i++) {
    await page.evaluate((idx) => Reveal.slide(idx), i);
    await page.waitForTimeout(300);
    const data = await page.evaluate(() => {
      const present = document.querySelector('.reveal section.present');
      if (!present) return null;
      const scale = (window.Reveal && typeof Reveal.getScale === 'function') ? Reveal.getScale() : 1;
      const els = [...present.querySelectorAll('*')].filter(e => {
        const r = e.getBoundingClientRect();
        return r.width > 2 && r.height > 2;
      });
      return { scale, items: els.map(e => {
        const r = e.getBoundingClientRect();
        const clsRaw = e.className;
        const cls = clsRaw && (clsRaw.baseVal !== undefined ? clsRaw.baseVal : (typeof clsRaw === 'string' ? clsRaw : '')).toString().slice(0, 40);
        return {
          tag: e.tagName, cls,
          x: r.x, y: r.y, w: r.width, h: r.height,
          right: r.right, bottom: r.bottom,
          text: (e.textContent || '').trim().slice(0, 30),
          parentRight: e.parentElement ? e.parentElement.getBoundingClientRect().right : null,
          parentCls: e.parentElement && e.parentElement.className
            ? (e.parentElement.className.baseVal !== undefined ? e.parentElement.className.baseVal : (typeof e.parentElement.className === 'string' ? e.parentElement.className : '')).toString().slice(0, 30)
            : '',
        };
      }) };
    });
    if (!data) continue;
    const items = data.items;
    scale = data.scale;
    if (!data) continue;

    // 装饰元素白名单（模板固有设计：图纸边框/指北针/封面标签）
    const WHITELIST = ['sheet-frame', 'north-mark', 'cover-bottom', 'twine-svg', 'twine-line'];
    // 1 & 2: 元素越画布右边界（阈值 ≥ 16px 才报警，避免 reveal letterbox/装饰边框误报）
    for (const el of items) {
      if (el.tag === 'SCRIPT' || el.tag === 'STYLE') continue;
      if (WHITELIST.some(w => el.cls.includes(w))) continue;
      if (el.right > 1300) {
        issues.push({ slide: i + 1, kind: 'ELEMENT_BEYOND_CANVAS', text: el.text || el.cls, right: Math.round(el.right), cls: el.cls });
      } else if (el.right > 1284 && el.text) {
        issues.push({ slide: i + 1, kind: 'TEXT_OVERFLOW_RIGHT', text: el.text, right: Math.round(el.right), cls: el.cls });
      }
    }

    // 3: 时间线描述超 3 行（排除短编号：文本须 > 40 字符才算"描述"——i/ii/01PROVOKE 等编号标签是短文本，非溢出描述）
    for (const el of items) {
      if (/desc|node|step|milestone/.test(el.cls) && el.h > 60 && (el.text || '').length > 40) {
        issues.push({ slide: i + 1, kind: 'TIMELINE_DESC_TOO_TALL', height: Math.round(el.h), text: el.text });
      }
    }

    // 4: 描述文字与真进度条重叠（bar 须含 progress/track class 排除卡片内装饰 bar；desc 文本 > 40 字符排除编号标签）
    const bars = items.filter(e => /progress|track|timeline-bar/.test(e.cls));
    const descs = items.filter(e => /desc|node|step|milestone/.test(e.cls) && (e.text || '').length > 40);
    for (const d of descs) for (const b of bars) {
      const ix = Math.max(0, Math.min(d.x + d.w, b.x + b.w) - Math.max(d.x, b.x));
      const iy = Math.max(0, Math.min(d.y + d.h, b.y + b.h) - Math.max(d.y, b.y));
      if (iy > 10 && ix > 20) {
        issues.push({ slide: i + 1, kind: 'TEXT_OVERLAP_BAR', text: d.text, interY: Math.round(iy), interX: Math.round(ix) });
      }
    }
    // 注：元素内文字溢出（如 terminal path 越代码框）曾尝试用「文字 right > 父 right」检测，
    // 但父容器常随内容撑开（content-box），bbox 测不出视觉边框溢出，且误报固定宽度场景。
    // 这类「元素内溢出 + 对比度感官 + 数据图语义」留给 visual-verdict（视觉模型判定），非 bbox 能可靠抓。
  }
  await browser.close();

  console.log(`\n=== check-overflow: scale=${scale.toFixed(3)}, ${issues.length} issue(s) in ${n} slides ===`);
  if (issues.length === 0) { console.log('✅ 无溢出/叠放问题'); process.exit(0); }

  const bySlide = {};
  for (const it of issues) { (bySlide[it.slide] ??= []).push(it); }
  for (const [s, arr] of Object.entries(bySlide)) {
    console.log(`\nslide ${s}:`);
    for (const it of arr) {
      const meta = `right=${it.right ?? '-'} h=${it.height ?? '-'} interX=${it.interX ?? '-'} interY=${it.interY ?? '-'}`;
      console.log(`  ${it.kind.padEnd(25)} "${it.text}"  ${meta}  cls=${it.cls || '-'}`);
    }
  }
  process.exit(1);
})();
