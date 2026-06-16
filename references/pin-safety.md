# Pin 安全区

> 每页左下角 `.pin` 索引不被正文/装饰元素遮挡的规则与解决方案。

## 默认位置

`.pin` 是页码 / 章节索引，位于左下角 `left:72px bottom:32px`，独占约 **200×40px** 可读区域。

底部一旦有 colophon、stat-row、表格末行、装饰雷达、audience-floor 之类满宽内容，**必须三选一**：

| 方案 | 适用 | 实现 |
|------|------|------|
| (a) 安全带 | 底部有满宽内容 | section `padding-bottom: ≥80px`（CSS skeleton 已默认 80） |
| (b) 对角 | 内容偏左下 | `.pin { right:64px; left:auto }` |
| (c) 隐藏 | finale / 全屏数据页 | `style="display:none" data-qa-ignore="decorative"`，靠 Reveal 自带 `slideNumber:'c/t'` 索引 |

## P4 必须验证

```bash
node scripts/test-pin-collision.js examples/*.html

> （Unix shell；Windows 需手动列举文件，或用 `node scripts/test-pin-collision.js <file1> <file2> ...`）
```

输出 `OK: all pin regions clear.` 才能交付。任何 collision 报告都视为阻断项。

## 装饰元素白名单

背景框、雷达、audience-floor、sheet-frame、灯光 beams、装饰 SVG line 必须加 `data-qa-ignore="decorative"`。

**正文、标题、数据、表格行、图表不得用此标记逃避检测**。详细案例和反例：`references/failure-gates.md` #13。
