#!/usr/bin/env node
/**
 * lint-template-chrome.js — 模板/deck chrome 元素颜色 lint
 * ─────────────────────────────────────────────────────────────
 * 扫 HTML 中的"chrome"元素（页标 pin / 标题块 title-block / 底源 source /
 * 角标 north-mark / 装饰 stamp 等），检查其前景/背景对比度是否 ≥ AA。
 *
 * 这是 G7 test-contrast-aa 的**专项**版本：G7 扫所有文本可能 false positive
 * 太多（图表轴标签、装饰缩写等不该拦），lint-template-chrome 只盯"页面家具"，
 * 这些元素"不可见"等于设计 bug——比正文文字优先级更高。
 *
 * 治本：模板作者写新模板时跑一遍，避免 chrome 默认色是黑字黑底这类暗坑。
 *
 * 用法：
 *   node scripts/lint-template-chrome.js <file.html> [<file2.html> ...]
 *   node scripts/lint-template-chrome.js examples/*.html
 *
 * 退出码：
 *   0 — chrome 全部 AA 通过
 *   1 — 至少一个 chrome 元素低于 AA
 *   2 — usage / 依赖 / 文件缺失
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const files = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (!files.length) {
  console.error('Usage: node scripts/lint-template-chrome.js <file.html> [<file2.html> ...]');
  process.exit(2);
}

// Chrome 元素的选择器：模板作者应让这些类有清晰颜色对比
const CHROME_SELECTORS = [
  '.pin',           // 页码标记（slide indicator）
  '.title-block',   // 角标信息块（项目/作者/日期/比例）
  '.cover-bottom',  // 封面底部带
  '.north-mark',    // 指北针/方位标
  '.src',           // 单行 source 标注
  '.source',        // 同上
  '.stamp',         // 印章/标记
  '.seal',          // 印章
  '.nav',           // 导航
  '.footer',        // 页脚
  '.cite',          // 引用源
  '.deco',          // 装饰元素（带文字的）
  '.kicker',        // 标题小标
  '.eyebrow',       // 眉签
  '.meta',          // 元数据
  '.legend',        // 图例（带文字的）
];

// 大字阈值（WCAG AA large = ≥18pt regular or ≥14pt bold）；1pt = 96/72 px
const LARGE_PX = 24;
const LARGE_BOLD_PX = 18.67;

// 浏览器侧探针：扫描每个 .present section 的 chrome 元素
const PROBE = (() => {
  const parseRgb = (s) => {
    if (!s) return null;
    const m = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?\s*\)/i);
    return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 } : null;
  };
  const lum = ({ r, g, b }) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const hex = (c) => '#' + [c.r, c.g, c.b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const sel = CHROME_SELECTORS.join(', ');
  return ({ LARGE_PX, LARGE_BOLD_PX }) => {
    const sec = document.querySelector('.reveal section.present');
    if (!sec) return [];
    const out = [];
    for (const el of sec.querySelectorAll(sel)) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.15) continue;
      // 元素自身文字（直接 text node）
      const hasDirectText = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
      if (!hasDirectText) continue;
      const fs = parseFloat(cs.fontSize);
      if (!(fs > 0)) continue;
      const text = parseRgb(cs.color);
      if (!text || text.a < 1) continue;
      // 找最近 opaque solid 背景
      let bg = null, skipGradient = false, node = el;
      while (node && node !== document) {
        const st = getComputedStyle(node);
        const solid = parseRgb(st.backgroundColor);
        if (solid && solid.a >= 0.95) { bg = solid; break; }
        if (st.backgroundImage && st.backgroundImage !== 'none' && st.backgroundImage.includes('gradient')) {
          // 装饰渐变可能误导，跳过该元素
          if (st.backgroundImage.includes('rgba') || st.backgroundImage.includes('#')) { skipGradient = true; break; }
        }
        node = node.parentElement;
      }
      if (skipGradient || !bg) continue;
      const r = ratio(text, bg);
      const fw = parseInt(cs.fontWeight, 10) || 400;
      const isLarge = fs >= LARGE_PX || (fs >= LARGE_BOLD_PX && fw >= 700);
      const thr = isLarge ? 3.0 : 4.5;
      if (r < thr) {
        out.push({
          ratio: +r.toFixed(2),
          thr,
          text: (el.textContent || '').trim().slice(0, 30),
          fg: hex(text),
          bg: hex(bg),
          cls: (typeof el.className === 'string' ? el.className : '').slice(0, 40),
        });
      }
    }
    return out;
  };
})();

(async () => {
  let browser;
  try { browser = await chromium.launch(); }
  catch (e) { console.error(`ERROR: ${e.message}`); console.error('  Run `bash scripts/install-all.sh` to install.'); process.exit(2); }

  const allViolations = [];
  let missing = 0;

  for (const file of files) {
    const abs = path.resolve(file);
    if (!fs.existsSync(abs)) { console.error(`  ✗  not found: ${file}`); missing++; continue; }
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    try {
      await page.goto('file://' + abs, { waitUntil: 'networkidle' }).catch(() => {});
      await page.waitForTimeout(600);
      const ready = await page.evaluate(() => typeof Reveal !== 'undefined').catch(() => false);
      if (!ready) {
        console.error(`  ✗  ${path.basename(file)} — Reveal not loaded, skip`);
        missing++; await page.close(); continue;
      }
      const n = await page.evaluate(() => document.querySelectorAll('.reveal .slides > section').length);
      const fileV = [];
      for (let i = 0; i < n; i++) {
        await page.evaluate((idx) => Reveal.slide(idx, 0), i);
        await page.waitForTimeout(200);
        const vs = await page.evaluate(PROBE, { LARGE_PX, LARGE_BOLD_PX }).catch(() => []);
        for (const v of vs) fileV.push({ slide: i + 1, ...v });
      }
      await page.close();
      if (fileV.length === 0) {
        console.log(`  ✓  ${path.basename(file)} — ${n} slide(s), all chrome passes AA`);
      } else {
        allViolations.push({ file: abs, v: fileV });
        console.log(`  ✗  ${path.basename(file)} — ${fileV.length} chrome element(s) below AA:`);
        for (const v of fileV) {
          console.log(`     slide ${v.slide}: ${v.ratio}:1 (need ${v.thr}) — "${v.text}" ${v.fg} on ${v.bg} [${v.cls}]`);
        }
      }
    } catch (e) { console.error(`  ✗  ${file}: ${e.message}`); await page.close(); }
  }

  await browser.close();
  if (missing > 0) { console.error(`\nERROR: ${missing} file(s) skipped.`); process.exit(2); }
  if (allViolations.length > 0) {
    const tot = allViolations.reduce((s, f) => s + f.v.length, 0);
    console.log(`\nFAIL: ${tot} chrome element(s) below WCAG AA across ${allViolations.length} file(s).`);
    console.log('  Fix: raise text color lightness vs its surface (or use --c-bg on --c-fg) at the template CSS level.');
    process.exit(1);
  }
  console.log('\nOK: all chrome elements pass WCAG AA contrast.');
})().catch((e) => { console.error('error:', e.message); process.exit(2); });
