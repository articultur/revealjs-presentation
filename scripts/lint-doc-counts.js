#!/usr/bin/env node
'use strict';

/**
 * lint-doc-counts.js — 文档计数 vs 实装一致性校验(G005 新增)
 * ------------------------------------------------------------
 * 评估 G005 根因:文档计数漂移(十一门禁 / 8 套模板 / 15 条失败门禁)
 * 误导读者与评估者,是 Goodhart 退化的入口。本脚本扫描文档里的
 * 旧计数残留,命中即 fail,防止漂移回归。
 *
 * 权威来源(实装,不可改):
 *   - scripts/grade-gate.js      G1-G12(十二门禁,allPassed 链 12 项)
 *   - examples/template-*.html   10 个 seed template(01-10)
 *   - references/failure-gates.md §1-§19(19 条失败门禁)
 *
 * 校验内容:
 *   1. 旧门禁计数词(十一/十/八门禁、G1-G10、G1-G11、G1–G10 en-dash)
 *   2. 旧 template 计数(9 套已实现、9 implemented、all nine、template-01..09)
 *   3. 旧失败门禁计数(13 条、15 条失败门禁)
 *
 * 豁免:references/template-differentiation-audit.md(行 3 自述历史档案,
 *  记录 15→5 收敛过程,旧计数是其历史叙述的一部分,不是当前事实声明)
 *
 * Usage: node scripts/lint-doc-counts.js
 * Exit: 0=计数一致,1=发现旧计数残留(漂移回归),2=用法/IO 错误
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// 旧计数残留(被 G005 淘汰,出现 = 漂移回归)
const FORBIDDEN = [
  // 门禁数:权威 = 十二门禁(G1-G12)
  { re: /十一门禁/g, name: '旧门禁数「十一门禁」(应为十二门禁)' },
  { re: /十门禁/g, name: '旧门禁数「十门禁」(应为十二门禁)' },
  { re: /八门禁/g, name: '旧门禁数「八门禁」(应为十二门禁)' },
  { re: /G1-G11/g, name: '旧门禁代号「G1-G11」(应为 G1-G12)' },
  { re: /G1-G10/g, name: '旧门禁代号「G1-G10」(应为 G1-G12)' },
  { re: /G1–G11/g, name: '旧门禁代号「G1–G11」en-dash(应为 G1–G12)' },
  { re: /G1–G10/g, name: '旧门禁代号「G1–G10」en-dash(应为 G1–G12)' },
  // template 数:权威 = 10 套(01..10)
  { re: /9 套已实现/g, name: '旧 template 数「9 套已实现」(应为 10 套)' },
  { re: /9 implemented/g, name: '旧 template 数「9 implemented」(应为 10 implemented)' },
  { re: /all eight gates/gi, name: '旧门禁数「all eight gates」(应为 all twelve gates)' },
  { re: /for all nine\b/g, name: '旧 template 数「for all nine」(应为 for all ten)' },
  { re: /template-01\.\.09/g, name: '旧 template 范围「template-01..09」(应为 01..10)' },
  { re: /9 template\b/g, name: '旧 template 数「9 template」(应为 10)' },
  { re: /9 个 seed template/g, name: '旧 template 数「9 个 seed template」(应为 10)' },
  { re: /9 个形状/g, name: '旧 template 数「9 个形状」(应为 10 个形状)' },
  { re: /9 个 template/g, name: '旧 template 数「9 个 template」(应为 10)' },
  { re: /种子模板（8 套）/g, name: '旧 template 数「种子模板（8 套）」(应为 10 套)' },
  // 失败门禁数:权威 = 19 条(§1-§19)
  { re: /13 条失败门禁/g, name: '旧失败门禁数「13 条失败门禁」(应为 19 条)' },
  { re: /15 条失败门禁/g, name: '旧失败门禁数「15 条失败门禁」(应为 19 条)' },
  { re: /1[345] 条门禁/g, name: '旧失败门禁数「N 条门禁」(无"失败"前缀,应为 19 条;review fix:原正则要求"失败"前缀致 CI 假绿)' },
];

// 历史档案豁免(旧计数是其历史叙述,非当前事实)
// + 本脚本自身:FORBIDDEN 数组的定义字符串含旧计数词,扫 .js 时会 self-match
const EXEMPT = new Set([
  path.join(ROOT, 'references/template-differentiation-audit.md'),
  path.join(ROOT, 'scripts/lint-doc-counts.js'),
]);

function walkMd(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === '.impeccable' || ent.name === '.omc' || ent.name === '.claude' || ent.name === 'revealjs-presentation-workspace') continue;
      out.push(...walkMd(p));
    } else if (ent.name.endsWith('.md')) {
      out.push(p);
    }
  }
  return out;
}

// scripts/*.js 注释也扫(.js 陈旧门禁计数同样误导,review fix:原只扫 .md 漏 .js)
function walkJs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.js'))
    .map(e => path.join(dir, e.name));
}

const files = [...walkMd(ROOT), ...walkJs(path.join(ROOT, 'scripts'))];
const findings = [];

for (const file of files) {
  if (EXEMPT.has(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split('\n');
  for (const { re, name } of FORBIDDEN) {
    lines.forEach((line, i) => {
      re.lastIndex = 0;
      if (re.test(line)) {
        findings.push({ file: path.relative(ROOT, file), line: i + 1, name, snippet: line.trim().slice(0, 100) });
      }
    });
  }
}

console.log('╔══════════════════════════════════════════════╗');
console.log('║  lint-doc-counts · 文档计数 vs 实装一致性     ║');
console.log('╚══════════════════════════════════════════════╝');
console.log(`  权威:G1-G12(十二门禁)· 10 seed template · §1-§19(19 条失败门禁)`);
console.log(`  扫描 ${files.length} 个文档(.md + scripts/*.js;豁免 ${EXEMPT.size})`);

if (findings.length === 0) {
  console.log('\n  ✅ 无旧计数残留——文档计数与实装一致');
  process.exit(0);
}

console.log(`\n  ✗ 发现 ${findings.length} 处旧计数残留(漂移回归):\n`);
for (const f of findings) {
  console.log(`  ${f.file}:${f.line}`);
  console.log(`    ${f.name}`);
  console.log(`    ${f.snippet}`);
  console.log('');
}
console.log('  修复:把旧计数改为权威值(十二门禁/G1-G12/10 套/template-01..10/19 条)');
process.exit(1);
