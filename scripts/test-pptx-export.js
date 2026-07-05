#!/usr/bin/env node
'use strict';

/**
 * test-pptx-export.js — PPTX 导出冒烟门禁(G006)
 * ------------------------------------------------------------
 * 跑 export-pptx.js 后用 jszip 解包 .pptx,机器化 launch-grade 原
 * 人工检查(行 39「PPTX 至少保留标题、核心结论、主图形」/行 66
 * 「核心标题/结论/proof object 丢失 = 阻断」):
 *
 *   1. slide 数 = HTML section 数(导出完整,无丢页/多页)
 *   2. 每页文本 run 总量 ≥5 字符(非空白;纯页码 "1/9"=3 字符判红)
 *   3. 每页含对应 section 的 h1 文本(标题不丢)
 *
 * Usage:
 *   node scripts/test-pptx-export.js <file.html> [...]
 *   node scripts/test-pptx-export.js examples/template-*.html
 *
 * Exit: 0=全部通过,1=有导出缺陷(slide 数不符/空白页/标题丢),
 *      2=依赖或用法错误(CI 不可绕过)
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

let JSZip;
try { JSZip = require('jszip'); }
catch { console.error('Missing dependency: jszip. Run `npm install jszip` first.'); process.exit(2); }
let cheerio;
try { cheerio = require('cheerio'); }
catch { console.error('Missing dependency: cheerio.'); process.exit(2); }

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (!args.length) {
  console.error('Usage: node scripts/test-pptx-export.js <file.html> [...]');
  process.exit(2);
}

const SCRIPTS = __dirname;
const TMP = '/tmp/pptx-smoke';
const MIN_TEXT_LEN = 5;      // 纯页码 "1/9" = 3 字符,正常页远超
const H1_MATCH_LEN = 6;      // h1 前 6 字符 includes(防大小写/空格差异)

// ─── HTML section 提取(对齐 export-pptx.js extractAllSections) ─────

function extractSections(html) {
  const $ = cheerio.load(html);
  const top = $('.slides > section').toArray();
  const pool = top.length ? top : $('section').toArray();
  const sections = [];
  for (const s of pool) {
    const nested = $(s).children('section').toArray();
    if (nested.length) sections.push(...nested);
    else sections.push(s);
  }
  return sections.map(sec => {
    const $sec = $(sec);
    // h1 优先,否则 h2/h3(action title 语义)
    const h1El = $sec.children('h1,h2,h3').first();
    const h1 = h1El.text().replace(/\s+/g, ' ').trim();
    return { h1 };
  });
}

// ─── PPTX 解包(jszip 读 slideN.xml 的 <a:t> run)─────────────────

async function inspectPptx(pptxPath) {
  const data = fs.readFileSync(pptxPath);
  const zip = await JSZip.loadAsync(data);
  const slideFiles = Object.keys(zip.files)
    .filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)/)[1], 10);
      const nb = parseInt(b.match(/slide(\d+)/)[1], 10);
      return na - nb;
    });
  const slides = [];
  for (const f of slideFiles) {
    const xml = await zip.files[f].async('string');
    const runs = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m => m[1]);
    slides.push({ file: f, runs, text: runs.join('') });
  }
  return slides;
}

function norm(s) { return (s || '').replace(/\s+/g, '').toLowerCase(); }

// ─── 主流程 ─────────────────────────────────────────────────

(async () => {
  fs.mkdirSync(TMP, { recursive: true });
  let totalFail = 0;
  let processed = 0;

  for (const file of args) {
    const abs = path.resolve(file);
    if (!fs.existsSync(abs)) {
      console.error(`  ✗  not found: ${file}`);
      totalFail++;
      continue;
    }

    const html = fs.readFileSync(abs, 'utf8');
    const sections = extractSections(html);
    const outPptx = path.join(TMP, path.basename(abs).replace(/\.html?$/i, '.pptx'));
    try { fs.unlinkSync(outPptx); } catch {}

    const r = spawnSync(process.execPath,
      [path.join(SCRIPTS, 'export-pptx.js'), abs, '-o', outPptx],
      { encoding: 'utf8', timeout: 90_000 });

    if (r.status !== 0 || !fs.existsSync(outPptx)) {
      console.log(`  ✗  ${path.basename(file)} — export-pptx 失败 (exit ${r.status})`);
      if (r.stderr) console.log(`     ${r.stderr.split('\n').slice(0, 2).join(' ')}`);
      totalFail++;
      continue;
    }

    let slides;
    try { slides = await inspectPptx(outPptx); }
    catch (e) {
      console.log(`  ✗  ${path.basename(file)} — jszip 解包失败: ${e.message}`);
      totalFail++;
      continue;
    }
    processed++;

    const issues = [];
    // 1. slide 数 = section 数
    if (slides.length !== sections.length) {
      issues.push(`slide 数 ${slides.length} ≠ section 数 ${sections.length}(丢页/多页)`);
    }
    // 2 & 3. 每页非空白 + h1 文本不丢
    const n = Math.min(slides.length, sections.length);
    for (let i = 0; i < n; i++) {
      const slide = slides[i];
      const sec = sections[i];
      if (norm(slide.text).length < MIN_TEXT_LEN) {
        issues.push(`slide ${i + 1} 空白/仅页码(文本 < ${MIN_TEXT_LEN} 字符)`);
        continue;                       // 空白页不必再查 h1
      }
      if (sec.h1) {
        const head = norm(sec.h1).slice(0, H1_MATCH_LEN);
        if (head && !norm(slide.text).includes(head)) {
          issues.push(`slide ${i + 1} 缺 h1「${sec.h1.slice(0, 24)}」`);
        }
      }
    }

    if (issues.length) {
      console.log(`  ✗  ${path.basename(file)} — ${issues.length} issue(s):  ${sections.length} sections → ${slides.length} slides`);
      issues.slice(0, 6).forEach(x => console.log(`       - ${x}`));
      totalFail++;
    } else {
      console.log(`  ✓  ${path.basename(file)} — ${slides.length} slides · 标题完整 · 无空白页`);
    }
    try { fs.unlinkSync(outPptx); } catch {}
  }

  console.log('');
  if (totalFail) {
    console.log(`FAIL: ${totalFail} file(s) PPTX 导出冒烟缺陷(slide 数不符 / 空白页 / 标题丢)。`);
    process.exit(1);
  }
  console.log(`OK: PPTX 导出冒烟通过(${processed} file(s): slide 数=section 数 + 标题不丢 + 无空白页)。`);
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(2);
});
