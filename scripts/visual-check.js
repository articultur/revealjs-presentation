#!/usr/bin/env node
/** 程序化视觉检测：留白 / 画布 / 重叠（不依赖 vision AI，纯几何测量）*/
const { chromium } = require('playwright');
const path = require('path');
const file = process.argv[2];
if (!file) { console.error('usage: node visual_check.js <file.html>'); process.exit(1); }
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto('file://' + path.resolve(file), { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  const n = await p.evaluate(() => document.querySelectorAll('.reveal .slides > section').length);
  console.log(`file: ${path.basename(file)} | slides: ${n}\n`);
  for (let i = 0; i < n; i++) {
    await p.evaluate(idx => Reveal && Reveal.slide(idx, 0), i);
    await p.waitForTimeout(500);
    const r = await p.evaluate(() => {
      const sec = document.querySelector('.reveal section.present');
      if (!sec) return null;
      const sr = sec.getBoundingClientRect();
      // 实质内容元素（排除装饰 .deco / svg shape / 纯背景）
      const els = Array.from(sec.querySelectorAll('*')).filter(e => {
        if (e.closest('.deco')) return false;
        if (e.tagName === 'svg') return false;
        const cs = getComputedStyle(e);
        if (cs.display === 'none' || parseFloat(cs.opacity) < 0.15) return false;
        const r = e.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return false;
        return true;
      });
      let minTop=9999,maxBot=0,minLeft=9999,maxRight=0;
      els.forEach(e => {
        const r = e.getBoundingClientRect();
        minTop=Math.min(minTop,r.top);maxBot=Math.max(maxBot,r.bottom);
        minLeft=Math.min(minLeft,r.left);maxRight=Math.max(maxRight,r.right);
      });
      const contentH=maxBot-minTop, contentW=maxRight-minLeft;
      const fillH = contentH / sr.height;
      const topWhite = (minTop - sr.top) / sr.height;
      const botWhite = (sr.bottom - maxBot) / sr.height;
      // 文字元素两两重叠
      const texts = els.filter(e => {
        const t = (e.innerText || '').trim();
        return t.length > 1 && t.length < 40 && e.children.length <= 3;
      });
      const pairs = [];
      for (let a = 0; a < texts.length; a++) {
        for (let c = a + 1; c < texts.length; c++) {
          if (texts[a].contains(texts[c]) || texts[c].contains(texts[a])) continue;
          const ra = texts[a].getBoundingClientRect();
          const rb = texts[c].getBoundingClientRect();
          const ix = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
          const iy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          if (ix > 15 && iy > 10) pairs.push(`${(texts[a].innerText||'').trim().slice(0,14)} ⟷ ${(texts[c].innerText||'').trim().slice(0,14)}`);
        }
      }
      return {
        canvas: `${Math.round(sr.width)}×${Math.round(sr.height)}`,
        contentBox: `${Math.round(contentW)}×${Math.round(contentH)}`,
        fillH: Math.round(fillH * 100) + '%',
        topWhite: Math.round(topWhite * 100) + '%',
        botWhite: Math.round(botWhite * 100) + '%',
        overlaps: pairs.length,
        pairs: pairs.slice(0, 4),
      };
    });
    if (r) {
      const flag = (parseInt(r.botWhite) > 30 ? ' ⚠️底留白' : '') + (parseInt(r.topWhite) > 25 ? ' ⚠️顶留白' : '') + (r.overlaps > 0 ? ' ⚠️重叠'+r.overlaps : '');
      console.log(`slide ${i+1}: 画布=${r.canvas} 内容=${r.contentBox} 填充H=${r.fillH} 顶白=${r.topWhite} 底白=${r.botWhite} 重叠=${r.overlaps}${flag}`);
      r.pairs.forEach(pp => console.log(`    重叠: ${pp}`));
    }
  }
  await b.close();
})();
