#!/usr/bin/env node
'use strict';
/* eslint-disable */

/**
 * check-seed-quality.js — 种子质量门槛 + 注册一致性检查
 * ====================================================================
 * 把 seed-quality-standard.md「验收门槛」机器化(此前纯文字 checklist,靠人
 * grep/数行,执行随缘)。两个模式:
 *
 * 1. 单种子质量门槛(新种子注册前必跑,seed-creation-workflow.md 步骤 3):
 *      node scripts/check-seed-quality.js references/seed-gallery/<theme>/seed.html
 *    四项硬门槛(seed-quality-standard.md 验收门槛行):
 *      ① `--c-*` 自定义色 token ≥8(文件级唯一声明数;声明集中在 :root,
 *         文件级统计等价且不受 :root 块边界写法影响)
 *      ② 签名 class ≥3 且全仓唯一:种子 <style> 内定义的 class,在比对池
 *         (examples/*.html + tokens/*.css + 其他 seed-gallery/seed.html)
 *         中零同名 ≥3 个。唯一数 <3 = FAIL(exit 1);
 *         有同名碰撞但唯一数达标 = **warning 不 exit 1**——现存 3 个标杆
 *         case 本身带历史同名 class(.seal/.h-kicker/.stat 等),标杆不能
 *         硬拦;碰撞交人工判整体基调(design-generation-workflow.md 步骤 5)。
 *      ③ `<style>` ≥200 行(所有 style 块行数合计)
 *      ④ 字体三元组:--f-display/--f-body/--f-mono 声明齐全;等效:
 *         ≥3 个 --f-* 字体 token(维④ 字体是辨识度主载体,必须显式声明)
 *
 * 2. 注册一致性(注册进 tokens/seed-cases.json 后必跑):
 *      node scripts/check-seed-quality.js --registry
 *    seed-cases.json 每条 ↔ SEED-CASE-INDEX.md 有对应行 ↔ casePath/deckPath
 *    文件存在;反向 INDEX 提到的 theme / seed-gallery 磁盘目录也必须已注册
 *    (seed-creation-workflow.md:不注册 = case 不可路由 = 沉淀失败)。
 *
 * 输出逐项 PASS/FAIL,FAIL exit 1(CI 用);warning 不影响退出码。
 * 退出码:0 = 全过 / 1 = 有 FAIL / 2 = 用法或文件错误
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SEED_GALLERY_DIR = path.join(ROOT, 'references', 'seed-gallery');
const SEED_CASES_JSON = path.join(ROOT, 'tokens', 'seed-cases.json');
const SEED_CASE_INDEX = path.join(SEED_GALLERY_DIR, 'SEED-CASE-INDEX.md');

// ── 比对池收集(签名 class 唯一性比对:examples + tokens + 其他 case seed)──
function collectPoolFiles(targetFile) {
  const out = [];
  const pushDir = (dir, filter) => {
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir)) {
      if (filter(f)) out.push(path.join(dir, f));
    }
  };
  pushDir(path.join(ROOT, 'examples'), f => /\.html$/.test(f));
  pushDir(path.join(ROOT, 'tokens'), f => /\.css$/.test(f));
  if (fs.existsSync(SEED_GALLERY_DIR)) {
    for (const d of fs.readdirSync(SEED_GALLERY_DIR)) {
      const seedHtml = path.join(SEED_GALLERY_DIR, d, 'seed.html');
      if (fs.existsSync(seedHtml) && fs.statSync(seedHtml).isFile()) out.push(seedHtml);
    }
  }
  // 目标自身不进比对池(自己和自己的 class 必然"撞车")
  const targetAbs = targetFile ? path.resolve(targetFile) : null;
  return out.filter(p => !targetAbs || path.resolve(p) !== targetAbs);
}

// ── <style> 块提取(返回各块完整文本,含 <style>/</style> 标签行)──────────
function extractStyleBlocks(html) {
  const blocks = [];
  const re = /<style[^>]*>[\s\S]*?<\/style>/gi;
  let m;
  while ((m = re.exec(html)) !== null) blocks.push(m[0]);
  return blocks;
}

// ── class 提取(只取 <style> 内定义;剥注释/url()/@import 防误判)───────────
// 如 @import url(//fonts.googleapis.com/css2?...) 里的 `.com`/`.css2` 不是 class
function extractClasses(css) {
  const stripped = css
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/@import[^;]*;/gi, ' ')
    .replace(/url\([^)]*\)/gi, ' ');
  const classes = new Set();
  const re = /\.[a-zA-Z][a-zA-Z0-9-]*/g; // 点后必须跟字母,排除 0.5/1.4 等数值
  let m;
  while ((m = re.exec(stripped)) !== null) classes.add(m[0].slice(1).toLowerCase());
  return [...classes];
}

// ── 单种子 4 项门槛检查 ────────────────────────────────────────────────────
function checkSeedQuality(targetFile, poolFiles) {
  const content = fs.readFileSync(targetFile, 'utf8');
  const styleBlocks = extractStyleBlocks(content);
  const css = styleBlocks.join('\n');

  // ① --c-* 自定义色 token ≥8(文件级唯一声明)
  const colorTokens = new Set();
  const cRe = /--c-[a-z0-9-]+\s*:/g;
  let m;
  while ((m = cRe.exec(content)) !== null) colorTokens.add(m[0].replace(/[\s:]/g, ''));

  // ② 签名 class:目标种子 <style> 定义的 class 在比对池零同名
  const classes = extractClasses(css);
  const uniqueClasses = [];
  const colliding = []; // { name, files[] }
  for (const c of classes) {
    const cRe = new RegExp('\\.' + c + '(?![a-zA-Z0-9-])');
    const hits = [];
    for (const pf of poolFiles) {
      if (cRe.test(fs.readFileSync(pf, 'utf8'))) hits.push(path.relative(ROOT, pf));
    }
    if (hits.length === 0) uniqueClasses.push(c);
    else colliding.push({ name: c, files: hits });
  }

  // ③ <style> ≥200 行(块行数合计,含标签行——与 grep/awk 口径一致)
  const styleLines = styleBlocks.reduce((n, b) => n + b.split('\n').length, 0);

  // ④ 字体三元组:--f-display/--f-body/--f-mono,等效 = ≥3 个 --f-* token
  const fontTokens = new Set();
  const fRe = /--f-[a-z0-9-]+\s*:/g;
  while ((m = fRe.exec(css)) !== null) fontTokens.add(m[0].replace(/[\s:]/g, ''));
  const hasTrio = fontTokens.has('--f-display') && fontTokens.has('--f-body') && fontTokens.has('--f-mono');

  return {
    targetPath: path.relative(ROOT, targetFile),
    colorCount: colorTokens.size,
    classCount: classes.length,
    uniqueClasses, colliding,
    styleLines,
    fontTokens: [...fontTokens], hasTrio,
  };
}

function reportSeed(r) {
  let fails = 0;
  console.log(`\n═══ ${r.targetPath} ═══`);

  const pass1 = r.colorCount >= 8;
  console.log(`  ${pass1 ? 'PASS' : 'FAIL'} ① --c-* 自定义色 token: ${r.colorCount} 个(门槛 ≥8)`);
  if (!pass1) fails++;

  const pass2 = r.uniqueClasses.length >= 3;
  console.log(`  ${pass2 ? 'PASS' : 'FAIL'} ② 签名 class 全仓唯一: ${r.uniqueClasses.length} 个唯一 / 共 ${r.classCount} 个(门槛 唯一 ≥3)`);
  if (!pass2) fails++;
  if (r.colliding.length) {
    // 现存 3 个标杆 case 带历史同名 class(见文件头注释 ②),warning 不 exit 1
    console.log(`     ⚠ ${r.colliding.length} 个 class 与比对池同名(不拦截,人工判基调撞车):`);
    for (const c of r.colliding) {
      // 通用结构 class(.reveal/.slides 等)遍布全仓,汇总显示;少数文件同名才逐个列(真信号)
      const detail = c.files.length > 4 ? `${c.files.length} 个文件(全仓通用结构 class)` : c.files.join(', ');
      console.log(`       · .${c.name} ↔ ${detail}`);
    }
  }

  const pass3 = r.styleLines >= 200;
  console.log(`  ${pass3 ? 'PASS' : 'FAIL'} ③ <style> 行数: ${r.styleLines} 行(门槛 ≥200)`);
  if (!pass3) fails++;

  const pass4 = r.hasTrio || r.fontTokens.length >= 3;
  const trioDesc = r.hasTrio
    ? '--f-display/--f-body/--f-mono 齐全'
    : `等效:--f-* token ${r.fontTokens.length} 个(${r.fontTokens.join(' ') || '无'})`;
  console.log(`  ${pass4 ? 'PASS' : 'FAIL'} ④ 字体三元组: ${trioDesc}`);
  if (!pass4) fails++;

  return fails;
}

// ── 注册一致性:seed-cases.json ↔ SEED-CASE-INDEX.md ↔ 文件存在 ────────────
function checkRegistry() {
  let fails = 0;
  const fail = msg => { console.log(`  FAIL ${msg}`); fails++; };
  const pass = msg => console.log(`  PASS ${msg}`);

  if (!fs.existsSync(SEED_CASES_JSON)) {
    console.log(`  FAIL 注册表不存在: ${path.relative(ROOT, SEED_CASES_JSON)}`);
    return 1;
  }
  if (!fs.existsSync(SEED_CASE_INDEX)) {
    console.log(`  FAIL 索引不存在: ${path.relative(ROOT, SEED_CASE_INDEX)}`);
    return 1;
  }

  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(SEED_CASES_JSON, 'utf8'));
  } catch (e) {
    console.log(`  FAIL seed-cases.json 解析失败: ${e.message}`);
    return 1;
  }
  const cases = registry.cases;
  if (!Array.isArray(cases)) {
    console.log('  FAIL seed-cases.json 缺 cases 数组');
    return 1;
  }
  const indexContent = fs.readFileSync(SEED_CASE_INDEX, 'utf8');

  // 正向:每条注册项 → 字段齐全 + INDEX 有对应行 + casePath/deckPath 文件存在
  const seenNames = new Set();
  for (const c of cases) {
    console.log(`\n── case: ${c.name || '(缺 name)'} ──`);
    if (!c.name || !c.casePath || !c.deckPath) {
      fail(`字段不全(需 name/casePath/deckPath): ${JSON.stringify({ name: c.name, casePath: c.casePath, deckPath: c.deckPath })}`);
      continue;
    }
    if (seenNames.has(c.name)) fail(`name 重复注册: ${c.name}`);
    seenNames.add(c.name);

    if (indexContent.includes(`references/seed-gallery/${c.name}/`)) {
      pass(`SEED-CASE-INDEX.md 有对应行(references/seed-gallery/${c.name}/)`);
    } else {
      fail(`SEED-CASE-INDEX.md 无 ${c.name} 对应行(不注册 = 不可路由)`);
    }
    if (fs.existsSync(path.join(ROOT, c.casePath))) pass(`casePath 存在: ${c.casePath}`);
    else fail(`casePath 文件不存在: ${c.casePath}`);
    if (fs.existsSync(path.join(ROOT, c.deckPath))) pass(`deckPath 存在: ${c.deckPath}`);
    else fail(`deckPath 文件不存在: ${c.deckPath}`);
  }

  // 反向①:INDEX 提到的 theme → 必须有注册项(占位 <theme> 不含 [a-z0-9-] 首字符,天然排除)
  console.log('\n── 反向:SEED-CASE-INDEX.md → seed-cases.json ──');
  const indexThemes = new Set();
  const tRe = /references\/seed-gallery\/([a-z0-9-]+)\//g;
  let m;
  while ((m = tRe.exec(indexContent)) !== null) indexThemes.add(m[1]);
  for (const t of indexThemes) {
    if (seenNames.has(t)) pass(`INDEX theme "${t}" 已注册`);
    else fail(`INDEX theme "${t}" 在 seed-cases.json 无注册项`);
  }

  // 反向②:seed-gallery 磁盘目录(含 seed.html/case.md)→ 必须有注册项
  console.log('\n── 反向:seed-gallery 磁盘目录 → seed-cases.json ──');
  if (fs.existsSync(SEED_GALLERY_DIR)) {
    for (const d of fs.readdirSync(SEED_GALLERY_DIR)) {
      const dir = path.join(SEED_GALLERY_DIR, d);
      if (!fs.statSync(dir).isDirectory()) continue;
      const hasCase = fs.existsSync(path.join(dir, 'seed.html')) || fs.existsSync(path.join(dir, 'case.md'));
      if (!hasCase) continue;
      if (seenNames.has(d)) pass(`目录 "${d}" 已注册`);
      else fail(`目录 "${d}" 有 case 产物但未注册(沉淀失败:不可路由)`);
    }
  }
  return fails;
}

function usage() {
  console.log('用法:');
  console.log('  node scripts/check-seed-quality.js <seed.html>   单种子 4 项质量门槛');
  console.log('  node scripts/check-seed-quality.js --registry    注册一致性(seed-cases.json ↔ INDEX ↔ 文件)');
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--registry')) {
    console.log('═══ 注册一致性检查:tokens/seed-cases.json ↔ SEED-CASE-INDEX.md ↔ 文件 ═══');
    const fails = checkRegistry();
    console.log('\n── 判定 ──');
    if (fails === 0) { console.log('✅ 注册一致:每条注册项 ↔ INDEX 行 ↔ 文件存在,反向无漏注册'); process.exit(0); }
    console.log(`❌ 注册不一致:${fails} 项 FAIL`);
    process.exit(1);
  }

  const target = args.find(x => !x.startsWith('-'));
  if (!target) { usage(); return; }
  const abs = path.resolve(target);
  if (!fs.existsSync(abs)) { console.log(`⚠️  文件不存在: ${abs}`); process.exit(2); }

  const pool = collectPoolFiles(abs);
  console.log(`比对池: ${pool.length} 个文件(examples/*.html + tokens/*.css + 其他 case seed.html)`);
  const fails = reportSeed(checkSeedQuality(abs, pool));

  console.log('\n── 判定 ──');
  if (fails === 0) { console.log('✅ 4 项门槛全过(同名 class 碰撞为 warning,不拦截)'); process.exit(0); }
  console.log(`❌ ${fails} 项未达门槛(seed-quality-standard.md 验收门槛)`);
  process.exit(1);
}

if (require.main === module) main();

module.exports = {
  collectPoolFiles, extractStyleBlocks, extractClasses,
  checkSeedQuality, checkRegistry,
};
