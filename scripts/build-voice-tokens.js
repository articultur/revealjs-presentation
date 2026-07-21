#!/usr/bin/env node
'use strict';
/* eslint-disable */

/**
 * build-voice-tokens.js — 从 tokens/voices.json 生成 primitive CSS
 * ====================================================================
 * voice registry (tokens/voices.json) 是风格 primitive 的单一真相源。
 * 本脚本把它编译成 tokens/<name>.css,对齐 tokens/README.md 的 primitive
 * 契约(--c- 系列 + --f- 系列),供 generate-archetype-deck.js 内联使用。
 *
 * 加新风格 = 在 voices.json 加一条 voice,然后重跑本脚本。无需手写 CSS。
 *
 * 字体栈统一带窄体 fallback(Arial Narrow / Courier New)防 FOUT 重叠
 * (见 references/technical-specs.md「字体 fallback 安全清单」)。
 *
 * 用法:
 *   node scripts/build-voice-tokens.js           生成所有 voice primitive
 *   node scripts/build-voice-tokens.js --check   只校验 schema,不落盘(CI 用)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT, 'tokens', 'voices.json');
const TOKENS_DIR = path.join(ROOT, 'tokens');

// primitive 契约(对齐 tokens/README.md「primitive 文件契约」)
const REQUIRED_COLORS = [
  '--c-bg', '--c-fg', '--c-fg-2', '--c-fg-3', '--c-accent', '--c-border',
];

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    throw new Error(`Voice registry not found: ${REGISTRY_PATH}`);
  }
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
}

function validateVoice(v) {
  const missing = REQUIRED_COLORS.filter(c => !v.colors || !v.colors[c]);
  if (missing.length) {
    throw new Error(`voice "${v.name}" missing color primitives: ${missing.join(', ')}`);
  }
  if (!v.fonts || !v.fonts.display || !v.fonts.googleFonts) {
    throw new Error(`voice "${v.name}" missing fonts.display / fonts.googleFonts`);
  }
  if (!v.keywords || !v.keywords.length) {
    throw new Error(`voice "${v.name}" missing keywords (voice-router needs them)`);
  }
  if (!v.dimensions) {
    throw new Error(`voice "${v.name}" missing dimensions (style-space coordinates)`);
  }
}

// fonts.display = 'serif' | 'sans' → 对应字体栈
function displayStack(pool, kind) {
  return kind === 'serif' ? pool.serifDisplay : pool.sansBody;
}

function fontUrl(pool, kind) {
  return kind === 'serif' ? pool.serifGoogleFonts : pool.sansGoogleFonts;
}

function renderCss(v, pool) {
  const colorLines = REQUIRED_COLORS.map(c => `  ${c}: ${v.colors[c]};`).join('\n');
  // 注意:CSS 注释内禁止出现 `*` 紧跟 `/` 的序列(见 tokens/README.md CSS 注释约束)
  return `/* voice: ${v.name} — ${v.label}
 * AUTO-GENERATED from tokens/voices.json by scripts/build-voice-tokens.js — do not edit by hand.
 * 改风格改 voices.json 后重跑: node scripts/build-voice-tokens.js
 * primitive 契约见 tokens/README.md (semantic 映射层在 base.css)。
 * 字体栈带窄体 fallback 防 FOUT 重叠 (见 technical-specs.md)。
 */
:root {
  /* 颜色 primitive */
${colorLines}

  /* 字体 primitive */
  --f-display: ${displayStack(pool, v.fonts.display)};
  --f-body: ${pool.sansBody};
  --f-mono: ${pool.mono};
}
`;
}

/**
 * 编译 registry → primitive CSS 文件 + voice→fontUrl 映射
 * @param {object} opts { dry: 只校验不落盘 }
 */
function build(opts = {}) {
  const { dry = false } = opts;
  const reg = loadRegistry();
  const pool = reg.fontPool;
  if (!pool) throw new Error('voices.json missing fontPool');

  const generated = [];
  const fontMap = {};
  for (const v of reg.voices) {
    validateVoice(v);
    const css = renderCss(v, pool);
    if (!dry) {
      fs.writeFileSync(path.join(TOKENS_DIR, `${v.name}.css`), css);
    }
    generated.push(v.name);
    fontMap[v.name] = fontUrl(pool, v.fonts.googleFonts);
  }
  return { generated, fontMap, version: reg.version };
}

function main() {
  const dry = process.argv.includes('--check');
  const r = build({ dry });
  const mode = dry ? 'CHECK (schema validated, no write)' : 'WROTE';
  console.log(`✅ build-voice-tokens [${mode}] — ${r.generated.length} voice primitive`);
  console.log('   voices:', r.generated.join(', '));
  console.log('   registry version:', r.version);
}

if (require.main === module) main();

module.exports = { build, loadRegistry, REQUIRED_COLORS };
