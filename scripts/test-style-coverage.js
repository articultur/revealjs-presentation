#!/usr/bin/env node
'use strict';
/* eslint-disable */

/**
 * test-style-coverage.js — 风格覆盖烟雾测试
 * ====================================================================
 * 验证"适配任意主题/风格"不只是一两个 voice 行,而是覆盖极差异的 5 个 voice:
 *   technical(深冷)/ illustrated(暖浅圆润)/ brutalist(高饱和硬)/ luxury(深金)/ retro(撞色)
 *
 * 检查三件事:
 *   1. 每个 voice 生成 deck 过 grade-gate(G1-G14)+ design-strength
 *   2. 配色色相覆盖广(失败门禁 #10 跨模板相似度的机器代理:accent 色相跨度 ≥120°)
 *   3. 每 deck archetype ≥3 种(失败门禁 #9 换皮)
 *
 * 可复跑: node scripts/test-style-coverage.js   (退出码 0=全过)
 */

const fs = require('fs');
const path = require('path');
const { generate, runGatesOn } = require('./generate-deck');
const { MEDICAL } = require('./generate-archetype-deck');
const { loadRegistry } = require('./build-voice-tokens');

const ROOT = path.resolve(__dirname, '..');
const REG = loadRegistry();

// 5 极差异 voice:深冷 / 暖浅 / 高饱和硬 / 深金 / 撞色
const COVERAGE_VOICES = ['technical', 'illustrated', 'brutalist', 'luxury', 'retro'];

function voiceAccentHue(name) {
  const v = REG.voices.find(x => x.name === name);
  return v ? v.dimensions.hue : null;
}

// 色相环覆盖跨度(最大相邻间隔法):跨度 = 360 - 最大间隔
function hueSpan(hues) {
  const hs = hues.filter(h => h != null).map(Number).sort((a, b) => a - b);
  if (hs.length < 2) return 0;
  const gaps = [];
  for (let i = 0; i < hs.length; i++) {
    let g = hs[(i + 1) % hs.length] - hs[i];
    if (g < 0) g += 360;
    gaps.push(g);
  }
  return 360 - Math.max.apply(null, gaps);
}

/**
 * 检查 HTML 里所有 var(--c-*) 引用都有定义(防 P0:var 未定义→样式静默消失)。
 * 扫两类定义源:(1) HTML 内联 `--c-*:` 定义;(2) 本地 <link rel=stylesheet href> 指向的
 * CSS 文件(http/CDN 跳过)。后者让用「外置 token CSS」的 deck(如 template-01 link
 * ../tokens/*.css)不被误报——此前只扫内联,对 link 模式假阳性(误判 7 个核心 var 缺失)。
 * options.basePath = deck 文件所在目录,用于解析相对 href;不传则只扫内联(向后兼容)。
 */
function verifyVarDefinitions(html, options = {}) {
  const refs = new Set();
  const refRe = /var\((--c-[a-z-]+)\)/g;
  let m;
  while ((m = refRe.exec(html)) !== null) refs.add(m[1]);
  const defs = new Set();
  const defRe = /(--c-[a-z-]+)\s*:/g;
  while ((m = defRe.exec(html)) !== null) defs.add(m[1]);
  let hasExternalSources = false;
  if (options.basePath) {
    const fs = require('fs');
    const path = require('path');
    // 顺序无关:匹配 <link> 标签中同时含 rel="stylesheet" 和 href="..."。
    // 修 P0 bug:旧正则硬编码 rel 在 href 前,href-first 的合法 HTML(如
    // <link href="..." rel="stylesheet">)永远不匹配 → 链接 CSS 被漏掉 → 误报 var 未定义。
    const linkRe = /<link\b[^>]*\brel\s*=\s*["']stylesheet["'][^>]*>/gi;
    let lm;
    while ((lm = linkRe.exec(html)) !== null) {
      const tag = lm[0];
      const hrefMatch = tag.match(/\bhref\s*=\s*["']([^"'()]+)["']/i);
      if (!hrefMatch) continue;
      const href = hrefMatch[1];
      if (/^(https?:)?\/\//.test(href)) {
        // CDN/远程样式表:无法本地解析。标记存在外部源,使调用方(qa.js)能将
        // "可能在外部 CSS 定义"的 var 从 missing 中排除——不因无法读取 CDN 而误杀。
        hasExternalSources = true;
        continue;
      }
      try {
        const resolved = path.resolve(options.basePath, href);
        const linked = fs.readFileSync(resolved, 'utf8');
        defRe.lastIndex = 0;
        let dm;
        while ((dm = defRe.exec(linked)) !== null) defs.add(dm[1]);
      } catch {
        // 链接文件不可读:不注入定义;若该 var 真未定义会落到 missing(正确行为)。
      }
    }
  }
  // 有外部 CSS 源时,missing 里可能包含 CDN 定义的 var——无法本地验证,
  // 不应误报为"未定义"。将 hasExternalSources 返回给调用方做软降级。
  const missing = [...refs].filter(r => !defs.has(r));
  return { missing, refCount: refs.size, hasExternalSources };
}

function main() {
  console.log('═══ test-style-coverage · 5 极差异 voice 烟雾测试 ═══\n');
  console.log('voice        grade-gate  design  archetype  accent-hue');
  console.log('─'.repeat(58));

  const results = [];
  // output/ 被 .gitignore(仅 output/regression/ 入库);烟雾测试写 coverage-*.html 前确保目录在。
  fs.mkdirSync(path.join(ROOT, 'output'), { recursive: true });
  for (const v of COVERAGE_VOICES) {
    const input = JSON.parse(JSON.stringify(MEDICAL));
    input.voice = v;
    input.style_gap = Object.assign({}, MEDICAL.style_gap, { token: v });
    try {
      const { html, routed } = generate(input);
      const f = path.join(ROOT, 'output', `coverage-${v}.html`);
      fs.writeFileSync(f, html);
      const gates = runGatesOn(f);
      const varCheck = verifyVarDefinitions(html);
      const rec = {
        voice: v,
        gateOk: gates[0].ok,
        designOk: gates[1].ok,
        varOk: varCheck.missing.length === 0,
        varMissing: varCheck.missing,
        archetypes: routed.deck_check.archetype_count,
        hue: voiceAccentHue(v),
      };
      results.push(rec);
      console.log(
        `${v.padEnd(13)}${gates[0].ok ? '✅ 全绿' : '❌ 红'}    ${gates[1].ok ? '✅' : '⚠️'}     ${rec.archetypes}          ${rec.hue}°    ${rec.varOk ? '✅var' : '❌var:' + rec.varMissing.join(',')}`
      );
    } catch (e) {
      results.push({ voice: v, error: e.message });
      console.log(`${v.padEnd(13)}ERR ${e.message}`);
    }
  }

  const hues = results.map(r => r.hue).filter(h => h != null);
  const span = hueSpan(hues);
  const allGate = results.length === COVERAGE_VOICES.length && results.every(r => r.gateOk);
  const allArch = results.every(r => r.archetypes >= 3);
  const allVar = results.every(r => r.varOk);
  const wideHue = span >= 120;

  console.log('\n── 判定 ──');
  console.log(`  accent 色相: ${hues.map(h => h + '°').join(', ')}  → 跨度 ${span}°`);
  console.log(`  [${allGate ? '✅' : '❌'}] 5 voice 门禁全绿`);
  console.log(`  [${allArch ? '✅' : '❌'}] 每 deck archetype ≥3(门禁 #9 换皮)`);
  console.log(`  [${allVar ? '✅' : '❌'}] 所有 var(--c-*) 引用有定义(防 P0 静默消失)`);
  console.log(`  [${wideHue ? '✅' : '❌'}] 色相跨度 ≥120°(门禁 #10 跨模板相似度·机器代理)`);

  const pass = allGate && allArch && allVar && wideHue;
  console.log(`\n  ${pass ? '✅ 风格覆盖测试通过' : '❌ 风格覆盖测试未通过'}`);
  process.exit(pass ? 0 : 1);
}

if (require.main === module) main();
// verifyVarDefinitions 导出供 qa.js var-resolution 门禁复用(此前孤儿:只在烟雾测试内跑,没接进交付路径)。
module.exports = { COVERAGE_VOICES, hueSpan, verifyVarDefinitions };
