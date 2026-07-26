#!/usr/bin/env node
'use strict';
/* eslint-disable */

/**
 * skeleton-diff.js — 换皮结构级检测:输出 deck vs 种子的骨架相似度
 * ====================================================================
 * 失败门禁 #9 禁「同一套骨架换 5 套颜色」,但 lint-design 的 checkSkeletonReskin
 * 只查 class 命名(整抄种子 native class 全在时稳定通过);仓内此前没有
 * 「输出 vs 种子」的结构相似度工具。路径 A scaffold 模式标了 requiresRewrite,
 * 本脚本提供机器手段验证真的改了骨架:
 *
 *   1. 骨架签名:每页 section 提取「结构签名」= 规范化后的 DOM 形状
 *      (直接子元素的标签 + 全部 class 序列;class 排序后拼接保证确定性,
 *      调 class 顺序不再逃逸;忽略文本内容/内联样式/颜色类属性)。
 *   2. 相似度(防稀释,种子视角):对种子中每一页,取它与 deck 所有页的
 *      最大匹配度(签名同构 = 1,否则 0),求种子页平均——即「种子被复制了
 *      多少」而非「deck 有多少像种子」。抄 10 页再自加 5 页稀释不再逃逸。
 *   3. 平均最大匹配度 >70% 判换皮嫌疑。
 *
 * 用法:
 *   node scripts/skeleton-diff.js <deck.html> --seed examples/template-XX.html [--gate] [--json]
 *   node scripts/skeleton-diff.js --selftest   内置负向验证,失败 exit 1
 *
 * 退出码:0 = 相似度 ≤70%(或未开 --gate) / 1 = --gate 且 >70% 换皮嫌疑 / 2 = 用法或文件错误
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const THRESHOLD = 70; // 相似度 >70% = 换皮嫌疑(失败门禁 #9)

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

// ── 噪音剥离:注释/script/style 内的 '<' '>' 会干扰标签扫描 ──────────────
function stripNoise(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<!doctype[^>]*>/gi, ' ');
}

// ── 极简 DOM 解析(无外部依赖;本仓 deck 均为规整 HTML)────────────────────
// 节点:{ tag, cls(全部 class,小写+排序后拼接,保证确定性), children[] }。
// 文本节点不进树——签名只看元素形状。
const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^"'<>])*)(\/?)>/g;

function allClasses(attrStr) {
  const m = attrStr.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  if (!m) return '';
  const v = (m[1] || m[2] || m[3] || '').trim();
  // 取全部 class(不只首个),排序后拼接:调 class 顺序/在尾部追加 class 不再改变签名
  return v.split(/\s+/).filter(Boolean).map(c => c.toLowerCase()).sort().join(' ');
}

function parseTree(html) {
  const root = { tag: '#root', cls: '', children: [] };
  const stack = [root];
  let m;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(html)) !== null) {
    const tag = m[2].toLowerCase();
    if (m[1] === '/') {
      // 闭标签:弹栈到匹配元素(容错:无匹配的闭标签直接忽略)
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tag) { stack.length = i; break; }
      }
      continue;
    }
    const el = { tag, cls: allClasses(m[3] || ''), children: [] };
    stack[stack.length - 1].children.push(el);
    if (m[4] !== '/' && !VOID_TAGS.has(tag)) stack.push(el);
  }
  return root;
}

// ── 顶层 section 收集(文档序;嵌套 section=垂直堆叠,只取最外层算一页)────
function collectTopSections(root) {
  const out = [];
  const walk = el => {
    for (const c of el.children) {
      if (c.tag === 'section') { out.push(c); continue; } // 不再深入该子树
      walk(c);
    }
  };
  walk(root);
  return out;
}

// ── 结构签名:直接子元素的「标签 + 全部 class(排序)」序列 ────────────────
// 忽略文本内容/内联样式/颜色类属性(data-background/style 等根本不读);
// 子元素无 class 时只记标签。
function sectionSignature(sec) {
  return sec.children.map(c => c.tag + (c.cls ? '.' + c.cls.replace(/ /g, '.') : '')).join('>');
}

/**
 * 核心对比(防稀释,种子视角)。
 * 对种子每一页,取它与 deck 所有页的最大匹配度(签名同构 = 1,否则 0);
 * 相似度 = 种子页平均最大匹配度(0-100)——量的是「种子被复制了多少」,
 * deck 自加新页稀释分母不再影响判定。
 * @returns {{similarity:number, matched:number, total:number, pairs:object[], deckSections:number, seedSections:number}}
 */
function diffHtml(deckHtml, seedHtml) {
  const deckSecs = collectTopSections(parseTree(stripNoise(deckHtml)));
  const seedSecs = collectTopSections(parseTree(stripNoise(seedHtml)));
  const deckSigs = deckSecs.map(sectionSignature);
  const pairs = seedSecs.map((sec, j) => {
    const seedSig = sectionSignature(sec);
    // 该种子页与 deck 所有页的最大匹配:取第一个同构页作代表
    const hit = deckSigs.findIndex(sig => sig === seedSig);
    const role = j === 0 ? 'cover' : (j === seedSecs.length - 1 ? 'close' : 'middle');
    return {
      seedPage: j + 1,
      deckPage: hit >= 0 ? hit + 1 : null,
      role,
      match: hit >= 0,
      seedSig,
      deckSig: hit >= 0 ? deckSigs[hit] : null,
    };
  });
  const matched = pairs.filter(p => p.match).length;
  const similarity = pairs.length ? Math.round(matched / pairs.length * 100) : 0;
  return { similarity, matched, total: pairs.length, pairs, deckSections: deckSecs.length, seedSections: seedSecs.length };
}

function diffFiles(deckPath, seedPath) {
  return diffHtml(fs.readFileSync(deckPath, 'utf8'), fs.readFileSync(seedPath, 'utf8'));
}

// ── 种子路径解析:接受文件路径,也接受种子名(→ examples/<name>.html)──────
function resolveSeed(seedArg) {
  const direct = path.resolve(seedArg);
  if (fs.existsSync(direct)) return direct;
  const asName = path.join(ROOT, 'examples', seedArg.replace(/\.html$/, '') + '.html');
  if (fs.existsSync(asName)) return asName;
  return null;
}

function truncate(s, max = 96) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

// ── 报告 ────────────────────────────────────────────────────────────────
function report(deckPath, seedPath, r) {
  console.log('═══ skeleton-diff:输出 vs 种子骨架相似度 ═══');
  console.log(`deck: ${path.relative(ROOT, deckPath)}(${r.deckSections} 页)  seed: ${path.relative(ROOT, seedPath)}(${r.seedSections} 页)`);
  console.log('逐页对比(种子视角:✓ = 该种子页骨架被 deck 复制):');
  for (const p of r.pairs) {
    const role = { cover: 'cover', close: 'close', middle: 'mid  ' }[p.role];
    if (p.match) {
      console.log(`  ✓ seed p${p.seedPage} ${role} ↔ deck p${p.deckPage}  ${truncate(p.seedSig)}`);
    } else {
      console.log(`  ✗ seed p${p.seedPage} ${role} ↔ (deck 无同构页)  ${truncate(p.seedSig)}`);
    }
  }
  console.log(`\n总相似度: ${r.similarity}%(${r.matched}/${r.total} 种子页骨架被复制,门槛 >${THRESHOLD}%,防稀释:取种子页平均最大匹配)`);
  if (r.similarity > THRESHOLD) {
    console.log('判定: ❌ 换皮嫌疑(失败门禁 #9)— 需重写 cover/proof/mechanism/close 中 ≥2 个 role 骨架(结构/版式级,不是换文字/配色)');
  } else {
    console.log('判定: ✅ 通过(骨架与种子差异足够,未触换皮门禁)');
  }
}

// ── selftest:负向验证(任一失败 exit 1)──────────────────────────────────
// ① 种子 vs 它自己 = 100%,--gate exit 1
// ② generate-deck --demo 产物 vs 全部 10 种子 < 70%(抽 template-01 端到端验证 exit 0)
// ③ 只改文字/颜色的种子副本 → 判换皮(--gate exit 1)
// ④ 只调 class 顺序的种子副本 → 签名不变,仍判换皮(旧「首 class」签名会逃逸)
// ⑤ 整抄种子 + 自加 5 页稀释 → 种子视角仍 100%,判换皮(旧 deck 占比会被稀释到 67% 逃逸)
function selftest() {
  console.log('═══ skeleton-diff SELFTEST · 负向验证 ═══\n');
  let failed = 0;
  const check = (ok, desc) => {
    console.log(`  ${ok ? '✓' : '✗'} ${desc}`);
    if (!ok) failed++;
  };
  const run = args => spawnSync('node', [path.join(ROOT, 'scripts', 'skeleton-diff.js'), ...args], { encoding: 'utf8' });

  // ① 种子 vs 它自己(CLI 端到端:相似度 100% 且 --gate exit 1)
  const seed1 = path.join(ROOT, 'examples', 'template-01-editorial-serif.html');
  const r1 = run([seed1, '--seed', seed1, '--gate', '--json']);
  let j1 = {};
  try { j1 = JSON.parse(r1.stdout); } catch (e) { /* 解析失败按 0 处理 */ }
  check(r1.status === 1 && j1.similarity === 100,
    `种子 vs 它自己 = 100% 且 --gate exit 1(实际 similarity=${j1.similarity} exit=${r1.status})`);

  // ② generate-deck --demo 产物 vs 全部种子 < 70%
  const g = spawnSync('node', [path.join(ROOT, 'scripts', 'generate-deck.js'), '--demo'], { encoding: 'utf8' });
  const demoFile = path.join(ROOT, 'output', 'generate-deck-demo.html');
  if (g.status !== 0 || !fs.existsSync(demoFile)) {
    check(false, 'generate-deck --demo 生成失败,无法执行对比');
  } else {
    const seeds = fs.readdirSync(path.join(ROOT, 'examples')).filter(f => f.endsWith('.html'));
    let maxSim = -1, maxSeed = '';
    for (const s of seeds) {
      const r = diffFiles(demoFile, path.join(ROOT, 'examples', s));
      if (r.similarity > maxSim) { maxSim = r.similarity; maxSeed = s; }
    }
    check(maxSim < THRESHOLD, `demo 产物 vs 全部 ${seeds.length} 种子 < ${THRESHOLD}%(最高 ${maxSim}% @ ${maxSeed})`);
    // 端到端抽验:demo vs template-01 --gate 应 exit 0
    const r2 = run([demoFile, '--seed', seed1, '--gate']);
    check(r2.status === 0, `demo vs template-01 --gate exit 0(实际 exit=${r2.status})`);
  }

  // ③ 只改文字/颜色的种子副本 → 判换皮
  const seedHtml = fs.readFileSync(seed1, 'utf8');
  const reskin = seedHtml
    .replace(/#([0-9a-fA-F]{6})\b/g, '#3a7bd5')   // 换配色(hex)
    .replace(/#[0-9a-fA-F]{3}\b/g, '#e5c')          // 换配色(短 hex)
    .replace(/>([^<>\n]{2,})</g, '>换皮文字<');      // 换文字内容(不动标签结构)
  const r3 = diffHtml(reskin, seedHtml);
  check(r3.similarity > THRESHOLD, `文字/颜色副本相似度 ${r3.similarity}% > ${THRESHOLD}%(判换皮)`);
  const tmp = path.join(os.tmpdir(), 'skeleton-diff-selftest-reskin.html');
  fs.writeFileSync(tmp, reskin);
  const r4 = run([tmp, '--seed', seed1, '--gate']);
  fs.unlinkSync(tmp);
  check(r4.status === 1, `文字/颜色副本 --gate exit 1(实际 exit=${r4.status})`);

  // ④ 只调 class 顺序(每个 class 属性内 token 逆序)→ 排序签名不变,仍判换皮
  const shuffled = seedHtml.replace(/\bclass\s*=\s*("([^"]*)"|'([^']*)')/gi, (m, q, d, s) => {
    const tokens = (d !== undefined ? d : s).trim().split(/\s+/).filter(Boolean).reverse();
    const quote = q[0];
    return `class=${quote}${tokens.join(' ')}${quote}`;
  });
  check(shuffled !== seedHtml, 'class 顺序副本确实发生了 token 重排(前置断言)');
  const r5 = diffHtml(shuffled, seedHtml);
  check(r5.similarity === 100, `class 顺序副本相似度 ${r5.similarity}% = 100%(排序签名防逃逸)`);
  const tmp4 = path.join(os.tmpdir(), 'skeleton-diff-selftest-classswap.html');
  fs.writeFileSync(tmp4, shuffled);
  const r6 = run([tmp4, '--seed', seed1, '--gate']);
  fs.unlinkSync(tmp4);
  check(r6.status === 1, `class 顺序副本 --gate exit 1(实际 exit=${r6.status})`);

  // ⑤ 整抄种子 + 自加 5 页稀释 → 种子视角仍 100%(旧 deck 占比口径会被稀释逃逸)
  const filler = Array.from({ length: 5 }, (_, i) =>
    `<section><aside class="filler-a${i}"></aside><footer class="filler-b${i}"></footer></section>`).join('\n');
  const diluted = seedHtml.replace('</body>', `${filler}\n</body>`);
  check(diluted !== seedHtml, '稀释副本确实追加了 5 页(前置断言)');
  const r7 = diffHtml(diluted, seedHtml);
  check(r7.similarity === 100 && r7.matched === r7.total,
    `稀释副本种子视角相似度 ${r7.similarity}% = 100%(${r7.matched}/${r7.total} 种子页被复制,防稀释)`);
  const tmp5 = path.join(os.tmpdir(), 'skeleton-diff-selftest-diluted.html');
  fs.writeFileSync(tmp5, diluted);
  const r8 = run([tmp5, '--seed', seed1, '--gate']);
  fs.unlinkSync(tmp5);
  check(r8.status === 1, `稀释副本 --gate exit 1(实际 exit=${r8.status})`);

  console.log(`\n  ${failed === 0 ? '全部通过' : failed + ' 条断言失败'}`);
  if (failed) process.exit(1);
}

// ── CLI ─────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const a = { gate: false, json: false, selftest: false, seed: null, deck: null };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--seed') a.seed = argv[++i];
    else if (k === '--gate') a.gate = true;
    else if (k === '--json') a.json = true;
    else if (k === '--selftest') a.selftest = true;
    else if (!k.startsWith('-') && !a.deck) a.deck = k;
  }
  return a;
}

function main() {
  const a = parseArgs(process.argv.slice(2));
  if (a.selftest) { selftest(); return; }
  if (!a.deck || !a.seed) {
    console.log('用法: node scripts/skeleton-diff.js <deck.html> --seed examples/template-XX.html [--gate] [--json]');
    console.log('      node scripts/skeleton-diff.js --selftest');
    console.log('对种子每一页取与 deck 所有页的最大匹配(结构签名 = 直接子元素标签+全部 class 排序),种子页平均 >70% = 换皮嫌疑(失败门禁 #9,防稀释),--gate 时 exit 1。');
    return;
  }
  const deckAbs = path.resolve(a.deck);
  if (!fs.existsSync(deckAbs)) { console.log(`⚠️  deck 不存在: ${deckAbs}`); process.exit(2); }
  const seedAbs = resolveSeed(a.seed);
  if (!seedAbs) { console.log(`⚠️  种子不存在: ${a.seed}(试了路径本身与 examples/<name>.html)`); process.exit(2); }

  const r = diffFiles(deckAbs, seedAbs);
  const verdict = r.similarity > THRESHOLD ? 'reskin-suspect' : 'ok';
  if (a.json) {
    console.log(JSON.stringify({
      deck: path.relative(ROOT, deckAbs), seed: path.relative(ROOT, seedAbs),
      deckSections: r.deckSections, seedSections: r.seedSections,
      matched: r.matched, total: r.total,
      similarity: r.similarity, threshold: THRESHOLD, verdict,
      pairs: r.pairs,
    }, null, 2));
  } else {
    report(deckAbs, seedAbs, r);
  }
  if (a.gate && r.similarity > THRESHOLD) process.exit(1);
}

if (require.main === module) main();

module.exports = { diffHtml, diffFiles, sectionSignature, collectTopSections, parseTree, THRESHOLD };
