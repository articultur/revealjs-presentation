#!/usr/bin/env node
'use strict';

/**
 * BLACKPINK Case MVP 回归
 * ------------------------------------------------------------
 * 断言 MVP 新机制对 BLACKPINK case 有效——杜绝 spec 列出的 4 痛点:
 *   方向错(跳 Gate)/ 重叠 / 字体闪烁 / 浅底破坏主题
 *
 * 5 个断言:
 *   1. generate-ghost-deck 判 GHOST("介绍 4 成员" 无模板 → exit 1,非 AUTO)
 *      —— 防"方向完全错了"大返工(BP 教训:跳 ghost 直接生成 = 做成团队数据 deck)
 *   2. test-font-loading PASS(字体窄体 fallback + 大字间距 ≥50px,exit 0)
 *      —— 防 FOUT 字体闪烁致 logo-stamp 重叠(BP 8px 重叠根因)
 *   3. auto-fix 注入字体 fallback 不破坏 deck(issues 不升,字体 fallback 在 generic 前)
 *      —— 自愈引擎 a+b:c 边界 + SAFE 修复有效
 *   4. lint-design 不误判 SKELETON_RESKIN(BP deck 用主题原生 class bp-cover/bp-name-spread)
 *      —— 骨架换皮检测不误伤主题原生 deck
 *   5. design-strength innovation/techCraft ≥80(无 AI tell + 代码工艺防错)
 *      —— Innovation 四重 + TechnicalCraft 6 维代理
 *
 * Usage:
 *   node scripts/test-bp-regression.js                    # 默认 outputs/blackpink.html
 *   node scripts/test-bp-regression.js <deck.html>
 *
 * Exit codes:
 *   0 全部断言通过(MVP 对 BP case 有效)
 *   1 有断言失败(MVP 对 BP case 失效,需修)
 *   2 usage error
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const args = process.argv.slice(2);
const deckArg = args.find(a => !a.startsWith('--'));
const deckPath = deckArg ? path.resolve(deckArg) : path.resolve('outputs/blackpink.html');

if (!fs.existsSync(deckPath)) {
  console.error(`Deck 不存在: ${deckPath}`);
  console.error('用法: node scripts/test-bp-regression.js [deck.html](默认 outputs/blackpink.html)');
  process.exit(2);
}

const SCRIPTS = path.join(__dirname);
const BP_BRIEF = JSON.stringify({
  topic: '介绍 BLACKPINK 4 个成员',
  pages: 15,
  audience: '年轻偶像粉丝',
  points: ['JISOO', 'JENNIE', 'ROSÉ', 'LISA'],
  template: null,   // 未指定模板 → 应判 GHOST
});

function run(name, cmdArgs, opts = {}) {
  const r = spawnSync(process.execPath, [path.join(SCRIPTS, name), ...cmdArgs], {
    encoding: 'utf8',
    timeout: 180_000,
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
    ...opts,
  });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

const results = [];
function assert(name, ok, detail) {
  results.push({ name, ok, detail });
  const tag = ok ? '✓ PASS' : '✗ FAIL';
  console.log(`  ${tag} · ${name}${detail && !ok ? `\n      ${detail}` : ''}`);
}

console.log('╔══════════════════════════════════════════════╗');
console.log('║  BLACKPINK Case MVP 回归                      ║');
console.log('║  断言:方向对齐 / 字体不闪 / 自愈不破坏 /       ║');
console.log('║       lint 不误判 / 6 维代理高分               ║');
console.log('╚══════════════════════════════════════════════╝');
console.log(`  deck: ${path.relative(process.cwd(), deckPath)}`);
console.log('');

// ─── 1. generate-ghost-deck 判 GHOST ──────────────────────────
console.log('  [1/5] generate-ghost-deck 判 GHOST(无模板 → exit 1)');
const ghost = run('generate-ghost-deck.js', ['--json', BP_BRIEF]);
assert(
  'ghost 判 GHOST(exit 1,非 AUTO)',
  ghost.status === 1 && ghost.stdout.includes('判定 GHOST') && !ghost.stdout.includes('判定 AUTO'),
  `exit=${ghost.status}, ${ghost.stdout.slice(0, 120)}`,
);
assert(
  'ghost deck 含成员介绍 role(team,非团队数据)',
  /│\s*team\s*│/.test(ghost.stdout) && /JISOO[\s\S]*名片/.test(ghost.stdout),
  'ghost 表无 team/JISOO 名片行',
);

// ─── 2. test-font-loading PASS ────────────────────────────────
console.log('  [2/5] test-font-loading PASS(字体不闪 + 间距 ≥50px)');
const font = run('test-font-loading.js', [deckPath]);
assert(
  'test-font-loading PASS(exit 0,无 blocker)',
  font.status === 0 && /PASS/.test(font.stdout),
  `exit=${font.status}, ${font.stdout.split('\n').filter(l => /FAIL|blocker|issues/.test(l)).join('; ').slice(0, 150)}`,
);

// ─── 3. auto-fix 不破坏 deck ──────────────────────────────────
console.log('  [3/5] auto-fix 注入字体 fallback 不破坏 deck');
const fixedCopy = deckPath + '.regression-tmp';
fs.copyFileSync(deckPath, fixedCopy);
const autofix = run('auto-fix.js', [fixedCopy]);   // in-place SAFE
const fixedHtml = fs.readFileSync(fixedCopy, 'utf8');
fs.unlinkSync(fixedCopy);
assert(
  'auto-fix 字体 fallback 在 generic 前(Arial Narrow, sans-serif)',
  /'Arial Narrow',\s*sans-serif/.test(fixedHtml) || /'Arial Narrow',\s*serif/.test(fixedHtml),
  'fixed HTML 无 "Arial Narrow, sans-serif" 模式',
);
assert(
  'auto-fix 不报 error(自愈引擎跑通)',
  autofix.status !== 2 && !/Cannot find module|Error:/.test(autofix.stdout + autofix.stderr),
  (autofix.stdout + autofix.stderr).slice(0, 150),
);
const issuesMatch = (autofix.stdout + autofix.stderr).match(/issues:\s*(\d+)\s*[→-]*\s*(\d+)/);
assert(
  'auto-fix c-validation:issues 不升(自愈边界 c,review I2)',
  issuesMatch && parseInt(issuesMatch[2], 10) <= parseInt(issuesMatch[1], 10),
  issuesMatch ? `baseline=${issuesMatch[1]} → after=${issuesMatch[2]}` : '未匹配 issues X → Y 行',
);

// ─── 4. lint-design 不误判 SKELETON_RESKIN ────────────────────
console.log('  [4/5] lint-design 不误判 SKELETON_RESKIN(BP 用主题原生 class)');
const lint = run('lint-design.js', [deckPath]);
assert(
  'lint 无 SKELETON_RESKIN(BP bp-cover/bp-name-spread 是主题原生)',
  !/SKELETON_RESKIN/.test(lint.stdout),
  'lint 触发了 SKELETON_RESKIN(误判)',
);

// ─── 5. design-strength innovation/techCraft 高分 ─────────────
console.log('  [5/5] design-strength innovation/techCraft ≥80');
const strength = run('design-strength-check.js', [deckPath]);
const innovMatch = strength.stdout.match(/原创性 innovation\s*:\s*(\d+)\s*个 AI tell\s*\((\d+)\/100\)/);
const craftMatch = strength.stdout.match(/技术工艺 techCraft\s*:\s*\((\d+)\/100\)/);
assert(
  'innovation ≥80(0 个 AI tell)',
  innovMatch && parseInt(innovMatch[2], 10) >= 80 && parseInt(innovMatch[1], 10) === 0,
  innovMatch ? `AI tell=${innovMatch[1]}, score=${innovMatch[2]}` : '未匹配 innovation 行',
);
assert(
  'techCraft ≥80(overflow 防护 + 字体 fallback + 无 vw/vh)',
  craftMatch && parseInt(craftMatch[1], 10) >= 80,
  craftMatch ? `techCraft=${craftMatch[1]}` : '未匹配 techCraft 行',
);

// ─── 汇总 ─────────────────────────────────────────────────────
const passed = results.filter(r => r.ok).length;
const failed = results.length - passed;
console.log('');
console.log(`  ${'─'.repeat(46)}`);
console.log(`  MVP BP 回归: ${passed}/${results.length} 通过${failed ? `,${failed} 失败` : ''}`);

if (failed > 0) {
  console.log('  ✗ MVP 对 BP case 部分失效——见上面 FAIL 项,需修');
  process.exit(1);
}
console.log('  ✓ MVP 新机制对 BLACKPINK case 全部有效(方向对齐 + 字体不闪 + 自愈不破坏 + 不误判 + 高分)');
console.log('    杜绝 spec 4 痛点:方向错(断言1)/ 字体闪烁重叠(断言2)/ 自愈破坏(断言3)/ 主题原生(断言4-5)');
process.exit(0);
