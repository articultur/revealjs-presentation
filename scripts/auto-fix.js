#!/usr/bin/env node
'use strict';

/**
 * Auto-Fix 自愈引擎(组件 4 兜底)
 * ------------------------------------------------------------
 * ADR(plan consensus):自愈**降为兜底**,主策略是"生成时防错"——
 * font-family 窄体 fallback + 大字安全间距 + archetype 防重叠 + ghost 判断。
 * 避免自愈越强越暗示生成不稳。本脚本只修"确定性"问题,主观(设计感)不碰。
 *
 * 自愈边界 a+b+c(spec Round 7,防死循环 + 防越修越糟):
 *   a 迭代上限 3 次,超过转人工(标"需人工修")
 *   b 只修确定性(字体 fallback / pin 泄漏 / 溢出缩字),主观不修
 *   c 修完重跑 grade-gate + validate + label-overlap,issues 数必须降,否则回退
 *
 * 修复分级:
 *   SAFE     字体窄体 fallback + pin 泄漏 display:none(零风险,默认总应用)
 *   ATTEMPT  溢出 section 缩字号 5% / pin 移右下(需 --aggressive;c 验证才保留)
 *   REPORT   对比度失败 / 视觉 blocker(报告转人工,不改——避免伤 voice)
 *
 * Usage:
 *   node scripts/auto-fix.js <html>                 # 只 SAFE 修复(in-place)
 *   node scripts/auto-fix.js <html> --out fixed.html
 *   node scripts/auto-fix.js <html> --aggressive    # 加 ATTEMPT 修复
 *   node scripts/auto-fix.js <html> --max-iter 3
 *
 * Exit codes:
 *   0 SAFE 修复应用完(或已是 best-effort),无新增 regression
 *   1 仍有 blocker(转人工;对比度/视觉语义类不改)
 *   2 usage error
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const args = process.argv.slice(2);
const htmlFile = args.find(a => !a.startsWith('--'));
const outIdx = args.indexOf('--out');
const outFile = outIdx >= 0 ? args[outIdx + 1] : null;
const aggressive = args.includes('--aggressive');
const maxIterIdx = args.indexOf('--max-iter');
const maxIter = maxIterIdx >= 0 ? parseInt(args[maxIterIdx + 1], 10) : 3;

if (!htmlFile) {
  console.error('用法: node scripts/auto-fix.js <html> [--out file] [--aggressive] [--max-iter N]');
  process.exit(2);
}
const filePath = path.resolve(htmlFile);
if (!fs.existsSync(filePath)) {
  console.error(`文件不存在: ${filePath}`);
  process.exit(2);
}

const SCRIPTS = path.join(__dirname);
const NARROW_FALLBACKS = ['Arial Narrow', 'Helvetica Neue Condensed', 'Roboto Condensed'];

// ─── 校验计数(重跑 c 验证)────────────────────────────────────

function runScript(name, file) {
  const r = spawnSync(process.execPath, [path.join(SCRIPTS, name), file], {
    encoding: 'utf8',
    timeout: 120_000,
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
  });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

// grade-gate 是 single source of truth(G1-G10 合一,内部已跑 validate G2 + label-overlap G3)
// 不再单独跑 validate/label-overlap——会 double/triple-count 致 c-validation 失真(review C1)
function countIssues(file) {
  if (!fs.existsSync(path.join(SCRIPTS, 'grade-gate.js'))) {
    return { total: 0, detail: [], firstBlocking: null };
  }
  const { status, stdout, stderr } = runScript('grade-gate.js', file);
  const out = stdout + stderr;
  if (/Grade Gate:\s*✓\s*PASS/i.test(out)) {
    return { total: 0, detail: [], firstBlocking: null };
  }
  // 数失败的 G(G1-G10 行,行尾 ✗)——比 exit code 更精确(review I5)
  const failedGates = [...out.matchAll(/^\s*(G\d+[^\n:]*?):\s*✗/gm)].map(m => m[1].trim());  // 允许行首缩进(grade-gate G 行有前导空格)
  const total = failedGates.length || 1;
  const detail = failedGates.length
    ? failedGates.map(g => `${g} ✗`)
    : [`grade-gate FAIL (exit ${status})`];
  return { total, detail, firstBlocking: { script: 'grade-gate.js', stdout: out.slice(0, 200) } };
}

// ─── SAFE 修复 ────────────────────────────────────────────────

// 1. 字体窄体 fallback:font-family 栈若无窄体 fallback,追加 'Arial Narrow'
//    防 FOUT 字体闪烁(BP logo-stamp 重叠根因)。
function fixFontFallbacks(html) {
  let changed = 0;
  const fixed = html.replace(/font-family\s*:\s*([^;}]+)/gi, (match, stack) => {
    const hasNarrow = NARROW_FALLBACKS.some(f => stack.toLowerCase().includes(f.toLowerCase()));
    if (hasNarrow) return match;                            // 已有窄体,不动
    const genericRe = /\b(sans-serif|serif|monospace|cursive|system-ui)\b/i;
    const gIdx = stack.search(genericRe);
    if (gIdx >= 0) {
      // 在 generic fallback 前插入窄体——FOUT 时优先用窄体而非默认宽体
      const before = stack.slice(0, gIdx).trim().replace(/,\s*$/, '');
      const after = stack.slice(gIdx);
      changed++;
      return `font-family: ${before}, 'Arial Narrow', ${after}`;
    }
    // 无 generic fallback,末尾加窄体 + sans-serif
    changed++;
    return `font-family: ${stack.trim()}, 'Arial Narrow', sans-serif`;
  });
  return { html: fixed, changed };
}

// 2. pin 泄漏:reveal 用 opacity/transform 隐藏非 present section,但 .pin 仍有
//    bounding rect → label-overlap 误判 slide N 的 pin 撞 slide N+1 元素(G3 LEAK)。
//    注入全局 display:none 兜底。
const PIN_LEAK_RULE = '.reveal section:not(.present) .pin { display: none !important; }';

function fixPinLeak(html) {
  if (/\.reveal\s+section:not\(\.present\)\s+\.pin\s*\{[^}]*display\s*:\s*none/.test(html)) {
    return { html, changed: 0 };                            // 已有规则,不重复注入
  }
  // 注入到最后一个 <style> 块末尾
  const styleCloseRe = /<\/style>/gi;
  let lastIdx = -1, m;
  while ((m = styleCloseRe.exec(html)) !== null) lastIdx = m.index;
  let injected = false;
  let fixed = html;
  if (lastIdx >= 0) {
    fixed = html.slice(0, lastIdx) + '\n' + PIN_LEAK_RULE + '\n' + html.slice(lastIdx);
    injected = true;
  } else {
    // 没 <style>,在 </head> 前注入
    fixed = html.replace(/<\/head>/i, `<style>${PIN_LEAK_RULE}</style>\n</head>`);
    injected = true;
  }
  return { html: fixed, changed: injected ? 1 : 0 };
}

// ─── ATTEMPT 修复(--aggressive;c 验证才保留)─────────────────

// 溢出缩字:把 ≥3em 的 display 字号 ×0.95(只缩一次,避免缩太小伤层级)
function attemptShrinkDisplay(html) {
  let changed = 0;
  const fixed = html.replace(/font-size\s*:\s*([3-9](?:\.\d+)?)em/gi, (match, v) => {
    const shrunk = (parseFloat(v) * 0.95).toFixed(3);
    changed++;
    return `font-size: ${shrunk}em`;
  });
  return { html: fixed, changed };
}

// pin 移右下(若 label-overlap 报 pin 撞底部满宽元素)
function attemptPinRight(html) {
  const pinBlockRe = /(\.pin\s*\{[^}]*?)\bleft\s*:\s*[^;]+;/i;
  if (!pinBlockRe.test(html)) return { html, changed: 0 };
  let changed = 0;
  const fixed = html.replace(pinBlockRe, (match, head) => {
    changed++;
    return `${head}left:auto; right:64px;`;
  });
  return { html: fixed, changed };
}

// ─── 主流程 ────────────────────────────────────────────────────

console.log('╔══════════════════════════════════════════════╗');
console.log('║  AUTO-FIX 自愈引擎(组件 4 兜底)              ║');
console.log('║  ADR:自愈降兜底,主策略生成时防错             ║');
console.log('╚══════════════════════════════════════════════╝');
console.log(`  文件: ${path.basename(filePath)}`);
console.log(`  模式: ${aggressive ? 'SAFE + ATTEMPT(--aggressive)' : 'SAFE(默认)'}`);
console.log('');

let html = fs.readFileSync(filePath, 'utf8');
const baseline = countIssues(filePath);
console.log(`  baseline issues: ${baseline.total}${baseline.total ? ' (' + baseline.detail.join(', ') + ')' : ''}`);
console.log('');

let iter = 0;
const applied = [];
let bestHtml = html;
let bestIssues = baseline.total;

// 单轮应用(SAFE 幂等;ATTEMPT 缩字一次性,反复会伤层级)
// maxIter 为未来迭代类修复预留;当前 SAFE+ATTEMPT 单轮 + c 验证即收敛。
iter = 1;
const fixes = [];
const f1 = fixFontFallbacks(html);
const f2 = fixPinLeak(f1.html);
if (f1.changed) fixes.push(`字体窄体 fallback ×${f1.changed}`);
if (f2.changed) fixes.push('pin 泄漏 display:none');

let afterHtml = f2.html;
if (aggressive) {
  const f3 = attemptShrinkDisplay(afterHtml);
  const f4 = attemptPinRight(f3.html);
  if (f3.changed) fixes.push(`display 字号 ×0.95 ×${f3.changed}`);
  if (f4.changed) fixes.push('pin 移右下');
  afterHtml = f4.html;
}
applied.push({ iter, fixes });

// c 验证:写到临时,重跑,issues 必须降/平才保留
const tmpFile = filePath + '.autofix-tmp';
fs.writeFileSync(tmpFile, afterHtml);
const after = countIssues(tmpFile);
fs.unlinkSync(tmpFile);

console.log(`  本轮:${fixes.join(' / ') || '无可应用修复'}`);
console.log(`    issues: ${baseline.total} → ${after.total}${after.detail.length ? ' (' + after.detail.join(', ') + ')' : ''}`);

let finalHtml = afterHtml;
if (after.total > bestIssues) {
  console.log(`    ⚠ 回退:issues 升高(${baseline.total}→${after.total}),不保留本轮改动`);
  finalHtml = html;                                         // 回退到原版
  bestIssues = baseline.total;
} else {
  bestHtml = afterHtml;
  bestIssues = after.total;
}

// 写出
const dest = outFile ? path.resolve(outFile) : filePath;
fs.writeFileSync(dest, finalHtml);
console.log('');
console.log(`  ✓ 已写出: ${dest}${dest === filePath ? ' (in-place)' : ''}`);
console.log(`  最终 issues: ${baseline.total} → ${bestIssues}`);
console.log('');

if (bestIssues > 0) {
  console.log('  ⚠ 仍有 blocker——自愈只修确定性,以下转人工:');
  if (!aggressive) console.log('    · 溢出/重叠未修(加 --aggressive 启用 ATTEMPT,或人工拆页/缩字)');
  console.log('    · 对比度失败:改 voice token 提亮 accent(见 design-strength colorContrast 子分)');
  console.log('    · 视觉语义 blocker:跑 visual-verdict.js 看 category,回 P5 修');
  console.log('    · 设计感(主观):自愈不碰,回 references/design-fundamentals.md §5');
  process.exit(1);
}

console.log('  ✓ 无确定性 blocker;主观/视觉语义类请另跑 visual-verdict.js + design-strength-check.js');
process.exit(0);
