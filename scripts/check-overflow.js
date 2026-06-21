#!/usr/bin/env node
/**
 * check-overflow.js — 检测 reveal.js deck 的视觉叠放/溢出问题
 * 基于 playwright bbox 测量，识别五类问题：
 *   1. TEXT_OVERFLOW_RIGHT  — 文字/标签越画布右边界（right > 1264）
 *   2. ELEMENT_BEYOND_CANVAS — 任意元素越画布（right > 1280）
 *   3. TIMELINE_DESC_TOO_TALL — 时间线 .desc 高度 > 60px（超过 3 行）
 *   4. TEXT_OVERLAP_BAR — 时间线 .desc 文字与底部 .bar 进度条重叠
 *   5. INLINE_TEXT_PARENT_OVERFLOW — 元素内文字超过容器可视宽度
 *      (scrollWidth > clientWidth + 2)，抓 terminal/code/span 等
 *      inline 文字溢出父容器
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
        // 父元素快照：tag/cls/计算样式/行内 style（snap-shot 在 evaluate 内一次拿全，
        // items 数组在 Node 侧用，不重新 querySelectorAll）
        const pe = e.parentElement;
        const pcs = pe ? getComputedStyle(pe) : null;
        return {
          tag: e.tagName, cls,
          x: r.x, y: r.y, w: r.width, h: r.height,
          right: r.right, bottom: r.bottom,
          text: (e.textContent || '').trim().slice(0, 30),
          // 元素内文字是否超过可视宽度（scrollWidth > clientWidth）。
          // 这是抓 terminal/code/span 等 inline 文字溢出父容器的硬信号，
          // 不受 content-box/border-box 影响（content-box 时 content 撑开 clientWidth 也撑大 → 不可靠；
          // 但只要 container 设了 width/max-width 或 overflow:hidden/auto，clientWidth 就锁死）。
          scrollW: e.scrollWidth,
          clientW: e.clientWidth,
          parentRight: pe ? pe.getBoundingClientRect().right : null,
          parentCls: pe ? (pe.className.baseVal !== undefined ? pe.className.baseVal : (typeof pe.className === 'string' ? pe.className : '')).toString().slice(0, 30) : '',
          // 父容器宽度约束快照：用于「文字撑开 content-box」误报过滤
          peTag: pe ? pe.tagName : null,
          peWidth: pcs ? pcs.width : null,
          peMaxWidth: pcs ? pcs.maxWidth : null,
          peOverflowX: pcs ? pcs.overflowX : null,
          peInlineStyle: pe ? (pe.getAttribute('style') || '') : '',
          peScrollW: pe ? pe.scrollWidth : 0,
          peClientW: pe ? pe.clientWidth : 0,
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
    // 5: 元素内文字溢出父容器（scrollWidth > clientWidth）
    // 抓 #2 类：terminal/code/span 等 inline 文字溢出（之前曾因「文字 right > 父 right」不可靠
    // 而放弃，改用 scrollWidth/clientWidth：content-box 也好 border-box 也好，只要父容器有
    // 固定 width/max-width 或 overflow:hidden/auto，clientWidth 就锁死 → scrollWidth > clientWidth
    // 100% 反映「文字比容器宽」的视觉越界）。
    // 只对「有文字内容 + 父容器有显式宽度约束（width/max-width/overflow:hidden|auto）」的元素
    // 报警，避免「文字撑开父容器」的合法情况误报。
    for (const el of items) {
      if (el.tag === 'SCRIPT' || el.tag === 'STYLE') continue;
      if (WHITELIST.some(w => el.cls.includes(w))) continue;
      if (!el.text || el.text.length < 4) continue;
      if (typeof el.scrollW !== 'number' || typeof el.clientW !== 'number') continue;
      const overflow = el.scrollW - el.clientW;
      if (overflow <= 2) continue;
      // 父容器必须有显式宽度约束，否则 content-box 撑开 clientWidth 同步增长 → 误报
      const peWidth = el.peWidth || '';
      const peMaxWidth = el.peMaxWidth || 'none';
      const peOverflowX = el.peOverflowX || 'visible';
      const peInlineStyle = el.peInlineStyle || '';
      const hasParentWidthConstraint = (
        (peWidth && peWidth !== 'auto' && !peWidth.endsWith('%') && !peWidth.endsWith('vw')) ||
        (peMaxWidth && peMaxWidth !== 'none') ||
        ['hidden', 'auto', 'scroll'].includes(peOverflowX)
      );
      const hasInlineWidth = /(?:^|;)\s*(?:width|max-width)\s*:/i.test(peInlineStyle);
      if (!hasParentWidthConstraint && !hasInlineWidth) continue;
      // 避免重复报同一个父容器（pre 内部的多个 span 都会触发，只报最外层那个）：
      // 当 el 自身的 overflow >= 父的 overflow 时，el 就是「溢出最外层」（pre > div > body）。
      const peOverflow = (el.peScrollW || 0) - (el.peClientW || 0);
      const isOutermost = !el.peTag || peOverflow <= overflow + 2;
      if (!isOutermost) continue;
      issues.push({
        slide: i + 1,
        kind: 'INLINE_TEXT_PARENT_OVERFLOW',
        text: el.text,
        scrollW: el.scrollW,
        clientW: el.clientW,
        overflow: overflow,
        cls: el.cls,
        parentCls: el.parentCls,
      });
    }
    // 注：纯感官类（黑字黑底、图标是否解释主张、装饰盒是否压 page furniture）bbox 仍测不出，
    // 留给 visual-verdict（视觉模型或会话模型 Read dry-run 截图判定）。
  }
  await browser.close();

  console.log(`\n=== check-overflow: scale=${scale.toFixed(3)}, ${issues.length} issue(s) in ${n} slides ===`);
  if (issues.length === 0) { console.log('✅ 无溢出/叠放问题'); process.exit(0); }

  const bySlide = {};
  for (const it of issues) { (bySlide[it.slide] ??= []).push(it); }
  for (const [s, arr] of Object.entries(bySlide)) {
    console.log(`\nslide ${s}:`);
    for (const it of arr) {
      const meta = it.kind === 'INLINE_TEXT_PARENT_OVERFLOW'
        ? `scrollW=${it.scrollW} clientW=${it.clientW} overflow=${it.overflow}px parent=${it.parentCls || '-'}`
        : `right=${it.right ?? '-'} h=${it.height ?? '-'} interX=${it.interX ?? '-'} interY=${it.interY ?? '-'}`;
      console.log(`  ${it.kind.padEnd(25)} "${it.text}"  ${meta}  cls=${it.cls || '-'}`);
    }
  }
  process.exit(1);
})();
