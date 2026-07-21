#!/usr/bin/env node
'use strict';
/* eslint-disable */

/**
 * check-seed-collision.js — 种子撞车检查(字体三元组 + 主签名色相)
 * ====================================================================
 * 解决 SEED-CASE-INDEX.md 字体占用表"手工维护易过期"问题(文档自己写
 * "不要信单一文档清单,以 grep 仓库实际为准"):输入一个种子(seed.html 或
 * 含 :root 的 voice CSS),grep 全仓报告字体撞车 + 主色相撞车。
 *
 * **种子注册前必跑**(seed-creation-workflow.md 步骤 4 撞车测试的机器闭环,
 * 替代靠人 grep + 人读表)。
 *
 * 检查两类撞车(seed-quality-standard.md 维④ 字体全仓零重复 + 维② 配色撞车线):
 *   1. 字体:特色字体族(Google Font 名,排除 generic/CJK fallback)在
 *      examples/template-*.html + tokens/*.css + seed-gallery/<theme>/seed.html
 *      中是否已被**其它**种子使用。撞车 = 撞车。
 *   2. 主签名色::root 内 oklch/hex 主色(hex 统一转 oklch,取 chroma 最高的 top3)
 *      与现有种子签名色**同空间**比较,双判据皆中才警告(信噪比修复,曾单色相
 *      判据让现存 case 两两全触发 = warning 常亮无信号):
 *        a. 色相环距 ≤ 15°
 *        b. 明度带/彩度带重叠:oklch L 差 ≤ 0.15 且 C 差 ≤ 0.10
 *      同暖色家族但明度差大(深朱砂 vs 浅金)是不同基调,降权不警告。
 *      命中 = 警告(需人工判整体基调是否撞,见 design-generation-workflow.md 步骤5)。
 *
 * 限制(已知,文档化):
 *   - CJK fallback(Noto Sans/Serif SC)算通用,不算特色撞车
 *
 * 用法:
 *   node scripts/check-seed-collision.js references/seed-gallery/<theme>/seed.html
 *   node scripts/check-seed-collision.js --all              检查所有 seed-gallery case
 *   node scripts/check-seed-collision.js tokens/<voice>.css 检查单个 voice primitive
 *
 * 退出码:0 = 无撞车 / 1 = 有撞车(CI 用)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// 通用/fallback 字体,不算特色撞车(几乎所有种子都带 CJK + Arial Narrow 防 FOUT)
const GENERIC_FONTS = new Set([
  'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui',
  'ui-monospace', 'ui-serif', 'ui-sans-serif', 'inherit', 'initial',
  'georgia', 'times new roman', 'arial', 'helvetica', 'courier new',
  'verdana', 'tahoma', 'trebuchet ms', 'impact', 'geneva',
  'noto sans sc', 'noto serif sc',   // CJK fallback,通用
  'arial narrow', 'courier',         // 窄体 fallback 防 FOUT(见 technical-specs.md)
]);

// ── 全仓种子文件收集(撞车比对池)─────────────────────────────────────────
function collectSeedFiles() {
  const out = [];
  const pushDir = (dir, filter, kind) => {
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir)) {
      if (filter(f)) out.push({ kind, path: path.join(dir, f) });
    }
  };
  pushDir(path.join(ROOT, 'examples'), f => /^template-.*\.html$/.test(f), 'template');
  pushDir(path.join(ROOT, 'tokens'), f => /^[a-z][a-z0-9-]*\.css$/.test(f) && f !== 'base.css', 'voice-token');
  // seed-gallery/<theme>/seed.html
  const sgDir = path.join(ROOT, 'references', 'seed-gallery');
  if (fs.existsSync(sgDir)) {
    for (const d of fs.readdirSync(sgDir)) {
      const seedHtml = path.join(sgDir, d, 'seed.html');
      if (fs.existsSync(seedHtml) && fs.statSync(seedHtml).isFile()) {
        out.push({ kind: 'case-seed', path: seedHtml });
      }
    }
  }
  return out;
}

// ── 字体提取(google fonts @import/link + CSS font-family)─────────────────
function extractFonts(content) {
  const fonts = new Set();
  // google fonts: family=Font+Name:wght 或 family=Font+Name&(family 结束于 & : " 空格)
  const famRe = /family=([A-Za-z][A-Za-z0-9+ ,.&-]*?)(?=[&:"\s])/g;
  let m;
  while ((m = famRe.exec(content)) !== null) {
    const name = m[1].replace(/\+/g, ' ').trim();
    if (name && !GENERIC_FONTS.has(name.toLowerCase())) fonts.add(name);
  }
  // CSS font-family: 'Font One', 'Font Two', sans-serif
  const ffRe = /font-family\s*:\s*([^;}\n]+)/g;
  while ((m = ffRe.exec(content)) !== null) {
    for (const raw of m[1].split(',')) {
      const name = raw.replace(/['"]/g, '').trim();
      if (!name) continue;
      if (/^var\(/.test(name)) continue; // CSS 变量引用(如 var(--f-body)),不是字体名
      if (!GENERIC_FONTS.has(name.toLowerCase())) fonts.add(name);
    }
  }
  return [...fonts];
}

// ── hex → oklch(统一色彩空间,替代旧 hsl hue 近似)──────────────────────────
// 旧版 hex 走 hsl hue,与 oklch 原生 hue 跨空间比较有系统误差(暖色区 Δ可达 20°+),
// 是 warning 常亮的根源之一。统一转 oklch 后 L/C/H 同空间可比,跨空间标注随之删除。
// 换算:sRGB → linear → LMS(oklab 矩阵) → oklab → oklch。
// 矩阵:Björn Ottosson oklab(https://bottosson.github.io/posts/oklab/)。
// 锚点自验:#ff0000 → L≈0.628 C≈0.258 H≈29.2°;#ffffff → L=1 C=0。
function hexToOklch(hex) {
  const h = hex.replace('#', '');
  if (h.length !== 6 && h.length !== 3) return null;
  const expand = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const r = lin(parseInt(expand.substr(0, 2), 16));
  const g = lin(parseInt(expand.substr(2, 2), 16));
  const b = lin(parseInt(expand.substr(4, 2), 16));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  const C = Math.sqrt(A * A + B * B);
  let H = Math.atan2(B, A) * 180 / Math.PI;
  if (H < 0) H += 360;
  return { L, C, H };
}

// ── 签名色提取(:root 内 oklch + hex 统一转 oklch,取 chroma 最高 top3)───────
function extractSignatureColors(content) {
  const colors = [];
  // oklch:--c-xxx: oklch(L C H),L 支持 0-1 或百分比(统一归一到 0-1),H 支持小数
  const oklchRe = /--c-[a-z0-9-]+\s*:\s*oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/gi;
  let m;
  while ((m = oklchRe.exec(content)) !== null) {
    const L = m[2] === '%' ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
    colors.push({ L, C: parseFloat(m[3]), H: parseFloat(m[4]) });
  }
  // hex:--c-xxx: #rrggbb(含 alpha #rrggbbxx 也取前 6 位)→ 统一转 oklch
  const hexRe = /--c-[a-z0-9-]+\s*:\s*(#[0-9a-fA-F]{6})/g;
  while ((m = hexRe.exec(content)) !== null) {
    const c = hexToOklch(m[1]);
    if (c) colors.push(c);
  }
  // 按 chroma 降序,签名色 = top3(滤掉近无彩色,只比真正签名)
  colors.sort((a, b) => b.C - a.C);
  return colors.slice(0, 3).filter(c => c.C >= 0.08);
}

function hueDistance(a, b) {
  return Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
}

// ── 签名色撞车双判据(信噪比修复)──────────────────────────────────────────
// 单色相判据曾让 --all 现存 3 case 两两全触发(Δ4-11°),warning 常亮 = 无信号。
// 真撞车 = 色相近似 且 明度带/彩度带也重叠;同暖色家族但明度差大(深朱砂 L≈0.4
// vs 浅金 L≈0.8)是不同基调,降权不警告。
const HUE_WARN_DEG = 15;      // a. 色相环距 ≤ 15°
const LIGHTNESS_BAND = 0.15;  // b1. oklch L 差 ≤ 0.15(明度带重叠)
const CHROMA_BAND = 0.10;     // b2. oklch C 差 ≤ 0.10(彩度带重叠)

// ── 单种子撞车检查 ────────────────────────────────────────────────────────
function checkCollision(targetFile, allFiles) {
  const targetContent = fs.readFileSync(targetFile, 'utf8');
  const targetFonts = new Set(extractFonts(targetContent));
  const targetColors = extractSignatureColors(targetContent);
  const targetPath = path.relative(ROOT, targetFile);
  const targetIsCase = targetFile.includes(path.join('references', 'seed-gallery'));
  const fontHits = [];
  const hueHits = [];

  for (const src of allFiles) {
    if (path.resolve(src.path) === path.resolve(targetFile)) continue;
    const srcContent = fs.readFileSync(src.path, 'utf8');

    // 字体撞车
    const shared = extractFonts(srcContent).filter(f => targetFonts.has(f));
    if (shared.length) {
      fontHits.push({ with: path.relative(ROOT, src.path), kind: src.kind, shared });
    }

    // 签名色撞车:只 case-seed ↔ case-seed(注册场景:新 case 互相撞才是真问题;
    // case vs template 基调撞车由 design-generation-workflow 步骤5 人工整体判,
    // voice-token 是配色肤色层不参与 — 避免跨层噪声淹没真信号)
    if (!targetIsCase || src.kind !== 'case-seed') continue;
    const srcColors = extractSignatureColors(srcContent);
    for (const tc of targetColors) {
      for (const sc of srcColors) {
        const dH = hueDistance(tc.H, sc.H);
        const dL = Math.abs(tc.L - sc.L);
        const dC = Math.abs(tc.C - sc.C);
        // 双判据:色相近似 且 明度带/彩度带重叠,才警告(见上方常量注释)
        if (dH <= HUE_WARN_DEG && dL <= LIGHTNESS_BAND && dC <= CHROMA_BAND) {
          hueHits.push({
            with: path.relative(ROOT, src.path), kind: src.kind,
            targetHue: Math.round(tc.H), srcHue: Math.round(sc.H),
            distance: Math.round(dH),
            dL: +dL.toFixed(2), dC: +dC.toFixed(2),
          });
        }
      }
    }
  }
  return { targetPath, fonts: [...targetFonts], signatureColors: targetColors, fontHits, hueHits };
}

function report(r) {
  console.log(`\n═══ ${r.targetPath} ═══`);
  console.log(`  特色字体(${r.fonts.length}): ${r.fonts.join(' / ') || '—'}`);
  const sigHues = r.signatureColors.map(c => `${c.H|0}°(L=${c.L.toFixed(2)},C=${c.C.toFixed(2)})`).join(' ');
  console.log(`  签名色(oklch): ${sigHues || '—'}`);

  if (r.fontHits.length === 0 && r.hueHits.length === 0) {
    console.log('  ✅ 无撞车(字体零重复 + 签名色无同带近似)');
    return true;
  }
  if (r.fontHits.length) {
    console.log(`  ❌ 字体撞车:`);
    for (const h of r.fontHits) console.log(`     · 与 ${h.with} [${h.kind}] 共用: ${h.shared.join(', ')}`);
  }
  if (r.hueHits.length) {
    console.log(`  ⚠️  签名色近似(ΔH≤${HUE_WARN_DEG}° 且明度/彩度带重叠,需人工判基调是否撞):`);
    for (const h of r.hueHits) {
      console.log(`     · 与 ${h.with} [${h.kind}] ${h.targetHue}°↔${h.srcHue}°(ΔH${h.distance}° ΔL${h.dL} ΔC${h.dC})`);
    }
  }
  return false;
}

function usage() {
  console.log('用法:');
  console.log('  node scripts/check-seed-collision.js <seed.html|voice.css>');
  console.log('  node scripts/check-seed-collision.js --all   (检查所有 seed-gallery case)');
}

function main() {
  const args = process.argv.slice(2);
  const allFiles = collectSeedFiles();

  const targets = [];
  if (args.includes('--all')) {
    for (const f of allFiles) if (f.kind === 'case-seed') targets.push(f.path);
    if (!targets.length) { console.log('⚠️  seed-gallery 下无 case seed.html'); return; }
  } else {
    const a = args.find(x => !x.startsWith('-'));
    if (!a) { usage(); return; }
    const abs = path.resolve(a);
    if (!fs.existsSync(abs)) { console.log(`⚠️  文件不存在: ${abs}`); process.exit(2); }
    targets.push(abs);
  }

  console.log(`比对池: ${allFiles.length} 个种子文件(template + voice-token + case-seed)`);

  let allClean = true;
  let anyFontCollision = false;
  for (const t of targets) {
    const r = checkCollision(t, allFiles);
    const clean = report(r);
    if (!clean) {
      allClean = false;
      if (r.fontHits.length) anyFontCollision = true;
    }
  }

  console.log('\n── 判定 ──');
  if (allClean) {
    console.log('✅ 全部通过:字体零重复 + 签名色无同带近似撞车');
    process.exit(0);
  } else {
    console.log(anyFontCollision
      ? '❌ 未通过:存在字体撞车(维④ 硬约束,必须改字体)'
      : '⚠️  签名色近似(非硬约束):人工判整体基调是否撞(design-generation-workflow 步骤5)');
    process.exit(anyFontCollision ? 1 : 0);
  }
}

if (require.main === module) main();

module.exports = {
  collectSeedFiles, extractFonts, extractSignatureColors,
  checkCollision, hueDistance, hexToOklch,
};
