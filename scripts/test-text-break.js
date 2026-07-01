#!/usr/bin/env node
/**
 * Text Break Detector — 词/数字跨行断裂检测
 * ─────────────────────────────────────────────────────────────
 * 用户最痛的视觉缺陷：「一个词/数字变成两行」。
 *   47.3%   → 47.3 + %         （数字拆）
 *   response → respo + nse      （英文词拆）
 *   价格屠夫 → 价格 + 屠夫      （中文短语拆）
 *   终点裁决 → 终点裁 + 决      （孤字 widow）
 *
 * 本脚本在 1280×720 视口下渲染每张 slide，对短文本高权重区做三层检测。
 *
 * 三层：
 *   L1  token 跨行（数字+紧贴 %/× + 英文连续字母词）
 *       确定性硬门禁。Range.getClientRects 返回 ≥2 个不同 top 的 rect
 *       = token 跨视觉行 = 被拆。这是最痛的场景（数据被肢解）。
 *   L2  CJK 孤字行 + 孤标点行
 *       确定性硬门禁。逐字符建 Range 按 top 分组，元素跨 ≥2 行时：
 *       某行仅 1 个汉字 = 孤字 widow（"决" 单字甩到下一行）；
 *       某行 1-2 字符且全标点 = 孤标点行（末行甩下单个"。""，"等，
 *       即用户痛点「单独的句号」= widow/runt punctuation）。
 *   L4  避头尾（kinsoku shori，GB/T 15834-2011 + W3C clreq）
 *       确定性硬门禁。闭标点（。 ， ？ ！ ） 」等）不能行首 = 避头违例；
 *       开标点（（ 「 『 等开括号/开引号）不能行尾 = 避尾违例。
 *       只抓断行造成的违例（跳过首行行首/末行行尾——那是元素边界，非断行点）。
 *   L3a 中文通用词跨行（nodejieba 分词，可选）
 *       nodejieba 装上才跑。拦"显著/增长/缓解/实现"等通用词被拆。
 *       ⚠ 已知边界：jieba 通用词典没收创意短语（价格屠夫/终点裁决），
 *       会把它们切成"价格/屠夫"碎片 → L3a 对创意短语无效。创意短语归
 *       L3b 视觉评审 agent（references/failure-gates.md G11 提示词规则）。
 *
 * 适用范围：短文本高权重区 —— <h1>/<h2>/<h3> 或 class 含
 *   pin|claim|proof|metric|stat|statement|headline|kicker|eyebrow|
 *   title-block|quote，且 ownText 可见字符 ≤ 30（长正文豁免）。
 *
 * Usage:
 *   node scripts/test-text-break.js <file.html> [<file2.html> ...]
 *   node scripts/test-text-break.js examples/template-*.html
 *
 * Exit codes:
 *   0 — 无断裂
 *   1 — 至少一处断裂（阻断交付）
 *   2 — 依赖/用法错误/文件缺失（CI 不能被绕过）
 *
 * Fix guidance when this fails:
 *   - L1 数字拆 → 给数字容器 white-space:nowrap，或把数字+单位包进
 *     <span style="white-space:nowrap">47.3%</span>。
 *   - L1 英文拆 → 容器去掉 word-break:break-all/break-word，改用
 *     overflow-wrap:anywhere（只在整词装不下时才断，不随便肢解）。
 *   - L2 孤字 → 收紧容器宽度让整词上行，或 nowrap 关键短语。
 *   - L3a 通用词拆 → 同 L2；CJK 默认建议 word-break:keep-all（只在
 *     标点/空格断行，不在汉字间断），overflow-wrap:anywhere 兜底。
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

// L3a 可选依赖：nodejieba 是 C++ native module，依赖 prebuilt binary。
// 装不上（缺 prebuilt / 无编译工具链）→ L3a 跳过，L1/L2 仍跑（不阻塞）。
// L1/L2 已覆盖最痛的数字/英文/孤字，L3a 是中文通用词的增量覆盖。
let jieba = null;
try {
  jieba = require('nodejieba');
} catch (err) {
  // 静默降级，main 里提示。
}

const args = process.argv.slice(2);
const files = args.filter(a => !a.startsWith('--'));

if (!files.length) {
  console.error('Usage: node scripts/test-text-break.js <file.html> [<file2.html> ...]');
  process.exit(2);
}

// 适用元素 class 集合（与 test-lint-main-claim.js / lint-design.js 对齐）。
const CLAIM_CLASSES = ['pin','claim','proof','metric','stat','statement','headline','kicker','eyebrow','title-block','quote'];

// L1 token 正则：
//   - 多位数字（含小数/千分位）+ 可选紧贴 %/×/x：47.3% / 1,200 / 3.2×
//   - 单数字 + 紧贴符号：5% / 3×
//   - 英文连续字母词（≥2）：response / ORR
// 数字+CJK 量词（3期/5岁）由 L2 孤字兜底（量词单字行被抓）。
const TOKEN_RE = /\d[\d.,]*\d\s*[%×x]?|\d[%×x]|[A-Za-z]{2,}/g;

(async () => {
  const browser = await chromium.launch();
  let totalIssues = 0;
  let filesWithIssues = 0;
  let missingCount = 0;
  const l3aAvailable = !!jieba;
  if (!l3aAvailable) {
    console.log('  (i) nodejieba 不可用 — L3a 中文分词检测跳过，仅跑 L1/L2（已覆盖最痛的数字/英文/孤字）。');
  }

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

    // 枚举 horizontal section 及嵌套 vertical sub-slides（与 test-text-collision.js 同款）。
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

        // ── Pass 1：L1（token 跨行）+ L2（CJK 孤字行）+ 提取适用元素文本（供 L3a）──
        const pass1 = await page.evaluate(({ claimClasses, tokenReSrc, slideIdx }) => {
          const TOKEN_RE = new RegExp(tokenReSrc, 'g');
          const CLAIM_RE = new RegExp('\\b(' + claimClasses.join('|') + ')\\b');

          // 避头尾禁则字符（GB/T 15834-2011 + W3C clreq）。
          // 避头 = 不能行首（句末/闭标点）；避尾 = 不能行尾（句首/开标点）。
          // 直引号 " ' 歧义大（无法区分开闭）不纳入，只取明确的弯引号与括号。
          const KINSOKU_HEAD = new Set('。．，、；：？！）」』】〕〗〉》｝］”’.,;:!?)]}'.split(''));
          const KINSOKU_TAIL = new Set('（「『【〔〖〈《｛［“‘([{'.split(''));
          // 标点判断（孤标点行：整行仅标点 = widow/runt punctuation，用户痛点「单独的句号」）
          const PUNCT_TEST = /[。．，、；：？！）」』】〕〗〉》｝］“”‘’（「『【〔〖〈《｛［.,;:!?()[\]{}…—·]/;

          // isVisible：照搬 test-text-collision.js —— opacity 链 + bbox + 视口内。
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

          function ownText(el) {
            let s = '';
            for (const n of el.childNodes) if (n.nodeType === 3) s += n.nodeValue;
            return s.replace(/\s+/g, ' ').trim();
          }

          const cur = document.querySelector('section.present');
          if (!cur) return { l1: [], l2: [], elements: [] };

          function isHighWeight(el) {
            if (['H1','H2','H3'].includes(el.tagName)) return true;
            const cls = (typeof el.className === 'string') ? el.className : '';
            return CLAIM_RE.test(cls);
          }

          // 收集适用 + 可见 + ownText 2..30 可见字符的元素。
          // 排除嵌套（祖先已是候选 → 跳过子，避免同短语重复报）。
          const candEls = [];
          for (const el of cur.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,div,a,td,li,strong,em')) {
            if (!isVisible(el)) continue;
            if (!isHighWeight(el)) continue;
            const t = ownText(el);
            const visLen = t.replace(/\s/g, '').length;
            if (visLen < 2 || visLen > 30) continue;
            let p = el.parentElement, nested = false;
            while (p && p !== cur) {
              if (candEls.includes(p)) { nested = true; break; }
              p = p.parentElement;
            }
            if (nested) continue;
            candEls.push(el);
          }

          const l1 = [];
          const l2 = [];
          const l2punct = [];
          const l4 = [];
          const elements = [];

          for (const el of candEls) {
            const cls = (typeof el.className === 'string' && el.className.trim())
              ? `${el.tagName.toLowerCase()}.${el.className.trim().split(/\s+/).join('.')}`
              : el.tagName.toLowerCase();

            // 给元素打标记，供 Pass 2（L3a）用 querySelector 回找。
            const breakIdx = elements.length;
            el.setAttribute('data-break-idx', String(breakIdx));

            const textNodes = [];
            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
            let tn;
            while (tn = walker.nextNode()) textNodes.push(tn);

            // —— L1：token 跨行 ——
            // 遍历 textNode，对 TOKEN_RE 匹配的每个 token 建 Range，
            // getClientRects 返回 ≥2 个不同 top = 跨视觉行 = 被拆。
            for (const textNode of textNodes) {
              const text = textNode.nodeValue;
              if (!text) continue;
              TOKEN_RE.lastIndex = 0;
              let m;
              while ((m = TOKEN_RE.exec(text)) !== null) {
                const tok = m[0];
                const start = m.index;
                const range = document.createRange();
                range.setStart(textNode, start);
                range.setEnd(textNode, start + tok.length);
                const rects = [...range.getClientRects()];
                if (rects.length > 1) {
                  const tops = [...new Set(rects.map(r => Math.round(r.top)))];
                  if (tops.length > 1) {
                    l1.push({ kind: 'L1-token-break', slide: slideIdx, selector: cls, token: tok.trim(), lineCount: tops.length });
                  }
                }
              }
            }

            // —— L2：CJK 孤字行 ——
            // 逐可见字符建 Range，按 top 分组。元素跨 ≥2 行时，某行仅 1 个
            // 汉字 = 孤字 widow。
            // 容差按字号比例：同行字因 rotate/字间距会有 top 抖动（memphis cta-mega
            // em 有 transform:rotate(-1deg)，400px 宽上抖动 ~7px，4 字 top 差 5px）。
            // 固定 2px 容差会把同行误判成不同行 → 孤字假阳性。取 fontSize 一半：
            // 远大于旋转抖动，远小于相邻行距（lineHeight ≈ fs），稳妥区分同行/跨行。
            const fs = parseFloat(getComputedStyle(el).fontSize) || 16;
            const tolerance = Math.max(4, fs * 0.5);
            const charLines = new Map(); // topBucket -> [{ch,left}]
            for (const textNode of textNodes) {
              const text = textNode.nodeValue;
              if (!text) continue;
              for (let i = 0; i < text.length; i++) {
                const ch = text[i];
                if (/\s/.test(ch)) continue;
                const range = document.createRange();
                range.setStart(textNode, i);
                range.setEnd(textNode, i + 1);
                const r = range.getBoundingClientRect();
                if (r.width < 0.5) continue;
                const bucket = Math.round(r.top / tolerance) * tolerance;
                if (!charLines.has(bucket)) charLines.set(bucket, []);
                charLines.get(bucket).push({ ch, left: r.left });
              }
            }
            if (charLines.size >= 2) {
              const buckets = [...charLines.keys()].sort((a, b) => a - b);
              for (let bi = 0; bi < buckets.length; bi++) {
                const chars = charLines.get(buckets[bi]).slice().sort((a, b) => a.left - b.left);
                const isFirst = bi === 0;
                const isLast = bi === buckets.length - 1;
                // L2 孤字：单 CJK 字符成行
                if (chars.length === 1 && /[一-鿿]/.test(chars[0].ch)) {
                  const position = isFirst ? '行首孤字' : (isLast ? '行尾孤字' : '中段孤字');
                  l2.push({ kind: 'L2-orphan-cjk', slide: slideIdx, selector: cls, char: chars[0].ch, position });
                }
                // L2 孤标点行（widow/runt punctuation）：1-2 字符且全是标点。
                // 用户痛点「单独的句号」——末行甩下单个「。」「，」等。
                if (chars.length >= 1 && chars.length <= 2 && chars.every(c => PUNCT_TEST.test(c.ch))) {
                  const punctStr = chars.map(c => c.ch).join('');
                  const position = isFirst ? '行首' : (isLast ? '行尾' : '中段');
                  l2punct.push({ kind: 'L2-orphan-punct', slide: slideIdx, selector: cls, punct: punctStr, position });
                }
                // L4 避头尾（kinsoku）：只抓断行造成的违例——
                // 避头=闭标点不能行首（跳过首行，那是元素边界）；
                // 避尾=开标点不能行尾（跳过末行）。
                if (!isFirst && KINSOKU_HEAD.has(chars[0].ch)) {
                  l4.push({ kind: 'L4-kinsoku-head', slide: slideIdx, selector: cls, char: chars[0].ch, at: '行首' });
                }
                if (!isLast && KINSOKU_TAIL.has(chars[chars.length - 1].ch)) {
                  l4.push({ kind: 'L4-kinsoku-tail', slide: slideIdx, selector: cls, char: chars[chars.length - 1].ch, at: '行尾' });
                }
              }
            }

            // —— 收集元素文本（供 L3a 分词）——
            const fullText = textNodes.map(t => t.nodeValue).join('');
            if (fullText && fullText.trim()) {
              elements.push({ idx: breakIdx, selector: cls, text: fullText });
            }
          }

          return { l1, l2, l2punct, l4, elements };
        }, { claimClasses: CLAIM_CLASSES, tokenReSrc: TOKEN_RE.source, slideIdx: slideNo });

        for (const it of pass1.l1) issues.push(it);
        for (const it of pass1.l2) issues.push(it);
        for (const it of pass1.l2punct) issues.push(it);
        for (const it of pass1.l4) issues.push(it);

        // ── Pass 2：L3a 中文通用词跨行（仅 nodejieba 可用）──
        if (l3aAvailable && pass1.elements.length) {
          // Node 侧分词：jieba.cut → 只保留纯 CJK ≥2 字的词。
          const segResults = pass1.elements.map(e => ({
            idx: e.idx,
            selector: e.selector,
            tokens: [...new Set(
              jieba.cut(e.text)
                .map(w => w.trim())
                .filter(w => {
                  const cjk = w.match(/[一-鿿]/g);
                  // 纯 CJK（无标点/英文夹杂）且 ≥2 字
                  return cjk && cjk.length >= 2 && w.length === cjk.length;
                })
            )],
          })).filter(s => s.tokens.length);

          if (segResults.length) {
            const l3aIssues = await page.evaluate(({ segResults, slideIdx }) => {
              const cur = document.querySelector('section.present');
              if (!cur) return [];
              const out = [];
              for (const { idx, selector, tokens } of segResults) {
                const el = cur.querySelector(`[data-break-idx="${idx}"]`);
                if (!el) continue;
                const textNodes = [];
                const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
                let tn;
                while (tn = walker.nextNode()) textNodes.push(tn);

                for (const tok of tokens) {
                  let reported = false;
                  for (const textNode of textNodes) {
                    const text = textNode.nodeValue;
                    let pos = text.indexOf(tok);
                    while (pos !== -1) {
                      const range = document.createRange();
                      range.setStart(textNode, pos);
                      range.setEnd(textNode, pos + tok.length);
                      const rects = [...range.getClientRects()];
                      if (rects.length > 1) {
                        const tops = [...new Set(rects.map(r => Math.round(r.top)))];
                        if (tops.length > 1) {
                          out.push({ kind: 'L3a-cjk-word-break', slide: slideIdx, selector, token: tok, lineCount: tops.length });
                          reported = true;
                          break;
                        }
                      }
                      pos = text.indexOf(tok, pos + 1);
                    }
                    if (reported) break;
                  }
                }
              }
              return out;
            }, { segResults, slideIdx: slideNo });
            for (const it of l3aIssues) issues.push(it);
          }
        }
      }
    }

    if (issues.length === 0) {
      const layers = l3aAvailable ? 'L1+L2+L2punct+L3a+L4' : 'L1+L2+L2punct+L4';
      console.log(`  ✓  ${path.basename(file)} — no text break (${layers}) on ${slideNo} slide(s)`);
    } else {
      filesWithIssues++;
      totalIssues += issues.length;
      console.log(`  ✗  ${path.basename(file)} — ${issues.length} break issue(s):`);
      const byKind = { 'L1-token-break': [], 'L2-orphan-cjk': [], 'L2-orphan-punct': [], 'L3a-cjk-word-break': [], 'L4-kinsoku-head': [], 'L4-kinsoku-tail': [] };
      for (const it of issues) { if (byKind[it.kind]) byKind[it.kind].push(it); }
      const kindLabel = {
        'L1-token-break': 'L1 数字/英文词被拆',
        'L2-orphan-cjk': 'L2 中文孤字',
        'L2-orphan-punct': 'L2 孤标点行（单独的句号/逗号等）',
        'L3a-cjk-word-break': 'L3a 中文通用词被拆',
        'L4-kinsoku-head': 'L4 避头违例（行首禁则标点）',
        'L4-kinsoku-tail': 'L4 避尾违例（行尾禁则标点）',
      };
      for (const kind of Object.keys(byKind)) {
        const list = byKind[kind];
        if (!list.length) continue;
        console.log(`     [${kindLabel[kind]}] (${list.length})`);
        for (const it of list.slice(0, 12)) {
          if (kind === 'L1-token-break' || kind === 'L3a-cjk-word-break') {
            console.log(`       slide ${it.slide}: "${it.token}"  in ${it.selector}  跨 ${it.lineCount} 行`);
          } else if (kind === 'L2-orphan-cjk') {
            console.log(`       slide ${it.slide}: "${it.char}" (${it.position})  in ${it.selector}`);
          } else if (kind === 'L2-orphan-punct') {
            console.log(`       slide ${it.slide}: "${it.punct}" (${it.position}孤标点行)  in ${it.selector}`);
          } else if (kind.startsWith('L4-')) {
            console.log(`       slide ${it.slide}: "${it.char}" (${it.at}禁则违例)  in ${it.selector}`);
          }
        }
        if (list.length > 12) console.log(`       ... and ${list.length - 12} more`);
      }
    }

    await context.close();
  }

  await browser.close();

  if (totalIssues > 0) {
    console.log(`\nFAIL: ${totalIssues} text break(s) across ${filesWithIssues} file(s).`);
    console.log('  Fix: 数字→white-space:nowrap；英文→去 word-break:break-all 改 overflow-wrap:anywhere；CJK→keep-all + 兜底 anywhere。');
    process.exit(1);
  }
  if (missingCount > 0) {
    console.error(`\nERROR: ${missingCount} file(s) not found. A blocking gate must not exit 0 on missing input.`);
    process.exit(2);
  }
  console.log('\nOK: no text breaks.');
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(2);
});
