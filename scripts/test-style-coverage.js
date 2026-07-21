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

/** 检查生成的 HTML 里所有 var(--c-*) 引用都有定义(防 P0:var 未定义→样式静默消失) */
function verifyVarDefinitions(html) {
  const refs = new Set();
  const refRe = /var\((--c-[a-z-]+)\)/g;
  let m;
  while ((m = refRe.exec(html)) !== null) refs.add(m[1]);
  const defs = new Set();
  const defRe = /(--c-[a-z-]+)\s*:/g;
  while ((m = defRe.exec(html)) !== null) defs.add(m[1]);
  const missing = [...refs].filter(r => !defs.has(r));
  return { missing, refCount: refs.size };
}

function main() {
  console.log('═══ test-style-coverage · 5 极差异 voice 烟雾测试 ═══\n');
  console.log('voice        grade-gate  design  archetype  accent-hue');
  console.log('─'.repeat(58));

  const results = [];
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
module.exports = { COVERAGE_VOICES, hueSpan };
