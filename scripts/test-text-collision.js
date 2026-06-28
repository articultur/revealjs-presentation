#!/usr/bin/env node
/**
 * Text Collision Detector
 * ─────────────────────────────────────────────────────────────
 * 在 reveal.js 演示文稿（1280×720 视口）内检测三类「文字碰撞」，
 * 这些都是 test-label-overlap.js 的盲区（后者只看 label-class 元素的
 * bounding-box 相交，抓不到渲染层叠、通配 margin reset、形状不包容文字）：
 *
 *   1. margin-swallow —— `section.present` 直接子元素写了 inline
 *      `margin-top: <非0>`，但被 `.reveal section > *:not(svg):not(.deco)
 *      { margin-top:0 !important }` 这类通配 reset 静默清零，
 *      导致标题压内容、内容压 nav。检测：el.style.marginTop 非空且非
 *      '0px'，但 getComputedStyle(el).marginTop === '0px'。
 *
 *   2. stack-occlude —— 高 z-index / 绝对定位元素把文字叶子盖住。
 *      bounding box 相交看不出来，要看渲染堆栈：在文字叶子 bbox 内
 *      采样 3 点取 document.elementsFromPoint(...)[0]，若顶层不是
 *      叶子自身也不互相包含，且顶层有非透明背景或自身有文字 → 报遮挡。
 *
 *   3. shape-overflow —— 文字叶子超出其「形父」content box（圆角矩形/
 *      气泡/异形容器的 padding 不足或形状不适合承载文字）。
 *
 * Usage:
 *   node scripts/test-text-collision.js <file.html> [<file2.html> ...]
 *   node scripts/test-text-collision.js examples/template-*.html
 *
 * Exit codes:
 *   0 — 无文字碰撞（且无缺失文件）。
 *   1 — 至少一处碰撞（阻断交付）。
 *   2 — 依赖 / 用法错误 / 文件缺失（CI 不能被绕过）。
 *
 * Fix guidance when this fails:
 *   - margin-swallow → 给该 inline margin-top 加 `!important` 抵御通配 reset。
 *   - stack-occlude  → 降低遮挡元素的 z-index，或移位让文字叶子不被覆盖。
 *   - shape-overflow → 增大形父 padding，或换成对文字友好的形状（圆角矩形）。
 */

'use strict';

const path = require('path');
const fs = require('fs');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (err) {
  console.error('Missing dependency: playwright. Run `npm install playwright` first.');
  process.exit(2);
}

const args = process.argv.slice(2);
const files = args.filter(a => !a.startsWith('--'));

if (!files.length) {
  console.error('Usage: node scripts/test-text-collision.js <file.html> [<file2.html> ...]');
  process.exit(2);
}

(async () => {
  const browser = await chromium.launch();
  let totalIssues = 0;
  let filesWithIssues = 0;
  let missingCount = 0;

  for (const file of files) {
    const abs = path.resolve(file);
    if (!fs.existsSync(abs)) {
      console.error(`  ✗  not found: ${file}`);
      missingCount++;
      continue;
    }

    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    await page.goto('file://' + abs, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    // 枚举 horizontal section 及其嵌套 vertical sub-slides（与 test-label-overlap 同款）。
    const horizontals = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.reveal .slides > section')).map(hor => ({
        vCount: hor.querySelectorAll(':scope > section').length,
      }))
    );

    const issues = [];
    let slideNo = 0;

    for (let h = 0; h < horizontals.length; h++) {
      const vCount = Math.max(1, horizontals[h].vCount);
      for (let v = 0; v < vCount; v++) {
        slideNo++;
        await page.evaluate(([hh, vv]) => window.Reveal && window.Reveal.slide(hh, vv), [h, v]);
        // 等 fade 过渡稳定（reveal.js 默认 fade ≈ 300ms，450ms 含余量）。
        await page.waitForTimeout(450);

        const result = await page.evaluate((slideIdx) => {
          // —— isVisible：照搬 test-label-overlap.js ——
          // display/visibility/opacity + 祖先 opacity 链 + bbox >2 + 视口内。
          // 祖先 opacity 检查是关键：reveal.js 用 opacity:0 隐藏非 present section。
          function isVisible(el) {
            if (!el.isConnected) return false;
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return false;
            let anc = el.parentElement;
            while (anc && !anc.classList.contains('reveal')) {
              if (parseFloat(getComputedStyle(anc).opacity) < 0.05) return false;
              anc = anc.parentElement;
            }
            const r = el.getBoundingClientRect();
            if (r.width < 2 || r.height < 2) return false;
            if (r.right < 2 || r.left > 1278 || r.bottom < 2 || r.top > 718) return false;
            return true;
          }

          const cur = document.querySelector('section.present');
          if (!cur) return { slide: slideIdx, marginSwallow: [], stackOcclude: [], shapeOverflow: [] };

          // 取 own text：遍历 childNodes 取 nodeType===3 拼接 + trim。
          function ownText(el) {
            let s = '';
            for (const n of el.childNodes) {
              if (n.nodeType === 3) s += n.nodeValue;
            }
            return s.replace(/\s+/g, ' ').trim();
          }

          const found = {
            marginSwallow: [],
            stackOcclude: [],
            shapeOverflow: [],
          };

          // —— 检测 1：margin-swallow ——
          // section.present 直接子元素中，占流的（非 absolute、非 svg、非 .sr-only），
          // inline marginTop 非空且非 '0px'，但 computed marginTop === '0px' → 被 reset 吞了。
          const TEXT_TAGS = new Set(['H1','H2','H3','H4','H5','H6','P','SPAN','DIV','A','TD','LI']);
          for (const el of cur.children) {
            if (el.tagName === 'svg') continue;
            if (el.classList.contains('sr-only')) continue;
            const cs = getComputedStyle(el);
            if (cs.position === 'absolute') continue;
            const inlineMT = el.style.marginTop;
            if (!inlineMT) continue;
            if (inlineMT.trim() === '0px' || inlineMT.trim() === '0') continue;
            if (cs.marginTop === '0px') {
              const tag = (typeof el.className === 'string' && el.className.trim())
                ? `${el.tagName.toLowerCase()}.${el.className.trim().split(/\s+/).join('.')}`
                : el.tagName.toLowerCase();
              found.marginSwallow.push({
                kind: 'margin-swallow',
                slide: slideIdx,
                tag,
                inlineMT,
              });
            }
          }

          // —— 收集文字叶子（三类检测的 2/3 共用）——
          const leaves = [];
          for (const cand of cur.querySelectorAll('h1,h2,h3,h4,h5,p,span,div,a,td,li')) {
            if (!isVisible(cand)) continue;
            const t = ownText(cand);
            if (t.length <= 2) continue;
            const r = cand.getBoundingClientRect();
            if (r.width <= 10 || r.height <= 4) continue;
            leaves.push({ el: cand, text: t, r });
          }

          // —— 检测 2：stack-occlude ——
          // 对每个文字叶子在 bbox 内采 3 点取 elementsFromPoint[0]，
          // 顶层既不是叶子自身也不互相包含、opacity>0.3、且有背景或自身文字 → 遮挡。
          // 同一叶子只报一次。
          function bgOpaque(el) {
            const cs = getComputedStyle(el);
            const bg = cs.backgroundColor;
            if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return true;
            const bi = cs.backgroundImage;
            if (bi && bi !== 'none') return true;
            return false;
          }
          for (const leaf of leaves) {
            if (found.stackOcclude.some(o => o._leaf === leaf.el)) continue;
            // pointer-events:none 的叶子（如 camera-frame HUD 角标）会被 elementsFromPoint
            // 忽略，误判被下层盖（t04 REC·CAM/TC 在 pointer-events:none 的 camera-frame 内，
            // 视觉实际在上）。这类装饰叶子交给 shape-overflow（bounding box）查，stack 跳过。
            let peEl = leaf.el, peNone = false;
            while (peEl && peEl !== cur) { if (getComputedStyle(peEl).pointerEvents === 'none') { peNone = true; break; } peEl = peEl.parentElement; }
            if (peNone) continue;
            const samples = [
              { x: leaf.r.left + leaf.r.width * 0.5, y: leaf.r.top + leaf.r.height * 0.3 },
              { x: leaf.r.left + leaf.r.width * 0.5, y: leaf.r.top + leaf.r.height * 0.5 },
              { x: leaf.r.left + leaf.r.width * 0.5, y: leaf.r.top + leaf.r.height * 0.7 },
            ];
            for (const s of samples) {
              const stack = document.elementsFromPoint(s.x, s.y);
              if (!stack.length) continue;
              const top = stack[0];
              if (top === leaf.el) continue;
              if (leaf.el.contains(top) || top.contains(leaf.el)) continue;
              const topCS = getComputedStyle(top);
              if (parseFloat(topCS.opacity) <= 0.3) continue;
              const topText = (top.textContent || '').replace(/\s+/g, ' ').trim();
              if (!bgOpaque(top) && topText.length <= 1) continue;
              const topCls = (typeof top.className === 'string' && top.className.trim())
                ? `${top.tagName.toLowerCase()}.${top.className.trim().split(/\s+/).join('.')}`
                : top.tagName.toLowerCase();
              found.stackOcclude.push({
                kind: 'stack-occlude',
                slide: slideIdx,
                text: leaf.text.slice(0, 16),
                occludedBy: topCls,
                occludedByText: topText.slice(0, 16),
                _leaf: leaf.el,
              });
              break; // 同一叶子只报一次
            }
          }

          // —— 检测 3：shape-overflow ——
          // 对每个文字叶子向上找最近「形父」：祖先链停在 section 前，
          // position!=='static' 且（背景非透明 || border-left>0）。
          // 算 content box（bbox 减 border 减 padding，四个方向各自算），
          // 文字叶子 bbox 越出任一边 >1px → 报告。
          function findShapeParent(el) {
            let p = el.parentElement;
            while (p && p !== cur) {
              const cs = getComputedStyle(p);
              const isPos = cs.position !== 'static';
              const hasBg = bgOpaque(p);
              const hasBorder = parseFloat(cs.borderLeftWidth) > 0;
              if (isPos && (hasBg || hasBorder)) return p;
              p = p.parentElement;
            }
            return null;
          }
          for (const leaf of leaves) {
            const sp = findShapeParent(leaf.el);
            if (!sp) continue;
            const r = sp.getBoundingClientRect();
            // 可见外边界 = border box 外沿（getBoundingClientRect，含边框）。
            // 文字越此 = 真出框。不用 content box（padding 内沿）——文字碰 padding、
            // 在边框内是正常的，content-box 判据会误报（brutalist "23 MIN"、vibrant
            // "on air" 字形都在 border 内、只碰 padding，曾被告；nature 信封才是真出框）。
            const cxL = r.left;
            const cxR = r.right;
            const cxT = r.top;
            const cxB = r.bottom;
            // 字形行并集（Range.getClientRects）：比 element bbox 紧，不含 element
            // padding/multi-line 空白，避免 line-height 上半空白越 content box 的假阳性
            //（brutalist .meta-card "23 MIN"：element bbox 越 top 8px 但字形 ink 在 content 内）。
            const rg = document.createRange(); rg.selectNodeContents(leaf.el);
            const rects = [...rg.getClientRects()];
            if (!rects.length) continue;
            const lb = {
              left: Math.min(...rects.map(rr => rr.left)),
              right: Math.max(...rects.map(rr => rr.right)),
              top: Math.min(...rects.map(rr => rr.top)),
              bottom: Math.max(...rects.map(rr => rr.bottom)),
            };
            // 字形 ink 近似：line-box 上下各内缩 half-leading，消除 line-height
            // 上下半行距噪声（否则紧贴容器顶/底的文字会因半行距假性越出，
            // 如 brutalist .meta-card "23 MIN" line-box 越 top 8px 但字形未越）。
            // 左右不内缩：行 box 左右边界 ≈ 字形起止。
            const fsEl = parseFloat(getComputedStyle(leaf.el).fontSize) || 16;
            const lhRaw = getComputedStyle(leaf.el).lineHeight;
            const lhEl = lhRaw === 'normal' ? fsEl * 1.2 : parseFloat(lhRaw);
            const halfLead = Math.max(0, (lhEl - fsEl) / 2);
            const inkTop = lb.top + halfLead;
            const inkBottom = lb.bottom - halfLead;
            const over = [];
            if (lb.left < cxL - 1) over.push(`left ${(cxL - lb.left).toFixed(0)}px`);
            if (lb.right > cxR + 1) over.push(`right ${(lb.right - cxR).toFixed(0)}px`);
            if (inkTop < cxT - 1) over.push(`top ${(cxT - inkTop).toFixed(0)}px`);
            if (inkBottom > cxB + 1) over.push(`bottom ${(inkBottom - cxB).toFixed(0)}px`);
            if (over.length) {
              const spCls = (typeof sp.className === 'string' && sp.className.trim())
                ? `${sp.tagName.toLowerCase()}.${sp.className.trim().split(/\s+/).join('.')}`
                : sp.tagName.toLowerCase();
              found.shapeOverflow.push({
                kind: 'shape-overflow',
                slide: slideIdx,
                text: leaf.text.slice(0, 16),
                container: spCls,
                overflow: over.join(' / '),
              });
            }
          }

          // 清掉内部字段（_leaf 不输出）
          found.stackOcclude.forEach(o => delete o._leaf);
          return { slide: slideIdx, ...found };
        }, slideNo);

        for (const it of result.marginSwallow) issues.push(it);
        for (const it of result.stackOcclude) issues.push(it);
        for (const it of result.shapeOverflow) issues.push(it);
      }
    }

    if (issues.length === 0) {
      console.log(`  ✓  ${path.basename(file)} — no text collision on ${slideNo} slide(s)`);
    } else {
      filesWithIssues++;
      totalIssues += issues.length;
      console.log(`  ✗  ${path.basename(file)} — ${issues.length} issue(s):`);
      const byKind = { 'margin-swallow': [], 'stack-occlude': [], 'shape-overflow': [] };
      for (const it of issues) byKind[it.kind].push(it);
      for (const kind of Object.keys(byKind)) {
        const list = byKind[kind];
        if (!list.length) continue;
        console.log(`     [${kind}] (${list.length})`);
        for (const it of list.slice(0, 10)) {
          if (kind === 'margin-swallow') {
            console.log(`       slide ${it.slide}: ${it.tag}  inline margin-top: ${it.inlineMT}`);
          } else if (kind === 'stack-occlude') {
            console.log(`       slide ${it.slide}: "${it.text}"  <-  ${it.occludedBy} "${it.occludedByText}"`);
          } else {
            console.log(`       slide ${it.slide}: "${it.text}"  in ${it.container}  overflow ${it.overflow}`);
          }
        }
        if (list.length > 10) console.log(`       ... and ${list.length - 10} more`);
      }
    }

    await context.close();
  }

  await browser.close();

  if (totalIssues > 0) {
    console.log(`\nFAIL: ${totalIssues} text collision(s) across ${filesWithIssues} file(s).`);
    console.log('  Fix: margin-swallow→加 !important；stack-occlude→降 z-index 或移位避让；shape-overflow→增 padding 或换形状。');
    process.exit(1);
  }
  if (missingCount > 0) {
    console.error(`\nERROR: ${missingCount} file(s) not found. A blocking gate must not exit 0 on missing input.`);
    process.exit(2);
  }
  console.log('\nOK: no text collisions.');
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(2);
});
