# visual-check.js — 布局平衡检测（启发式）

`scripts/visual-check.js` 是**纯几何测量**（不依赖 vision AI），报告每页的垂直平衡与画布一致性。它和 `visual-qa.js` 分工不同，**两者冲突时信 visual-qa**。

```bash
node scripts/visual-check.js <file.html>
```

## 四个指标

| 指标 | 目标 | 含义 |
|------|------|------|
| 画布 | 八页一致 | `section.present` 的 `getBoundingClientRect` 宽×高；所有页必须相同 |
| 填充H | — | 内容元素总高度占画布比例，参考用 |
| 重点重心 | ≈50%（<42% 报"偏上"） | "重点元素"垂直中点位置；偏上 = 头重脚轻 |
| 重点跨度 | >55%（<55% 报"小"） | "重点元素"首末垂直跨度；小 = 内容挤在一带 |
| 重叠 | 0 | 文字元素两两 bbox 相交（>15×10px） |

## "重点元素"怎么界定（决定重心/跨度准不准）

计入重点：标签 `H1–H4`，**或** class 命中正则：

```
poster-title|burst-line|work-cell|step-cell|roster|person|metric-cell|quote|cta|gallery|scatter-block|mega|dialogue
```

排除：`.deco` / `.nav` / `.source` / `.pin` 及一切装饰、导航、脚注。

**关键**：你想让某块"算进重点"，class 名必须**精确命中上面正则**。命名偏离（如 `path-step` 而非 `step-cell`）→ 该页整块不被识别 → 重心读数失真（典型症状：整页重点重心 = 0%）。

## 已知取舍与假阳性（不要为凑指标硬改设计）

- **海报式 deck（Memphis / brutalist）span < 55% 是签名，不是缺陷**。紧凑色块就是这类风格；别为拉跨度去铺散内容。重心比跨度更重要。
- **重点重心 = 0% 几乎总是正则漏匹配**（class 没命中），不是真的没内容。先核对 class 名，别去改布局。
- **旋转元素的重叠告警是 bbox 假阳性**：`rotate` 后轴对齐 bbox 变大，相邻元素"假相交"。Memphis 散落块、印章、标签卡都会触发。**真实溢出以 `visual-qa.js --annotate-overflow` 为准。**
- **画布尺寸混杂（如 1229×691 夹 1199×752）= 该 deck 用了 3D 过渡**（`convex`/`concave`/`zoom`）。3D 透视扭曲 `getBoundingClientRect`。改回 `transition:'fade'` 即恢复一致。section 的真实高度（`clientHeight`）始终 = 720，不影响渲染，但会让本检测误报——所以这条只看"是否混杂"，绝对数值不重要。

## 调重心的两条实操（Memphis / template-07 实测）

1. **装饰带不挪重心**：底部 `.deco` / `.band` 被排除，加再多装饰也不影响重心读数。要降重心得移动**真实内容**（标题、卡片），不是加 ornament。
2. **全局 `*:not(svg):not(.deco){margin-top:0!important}` 会清掉所有内容上边距**：改用**行内 `margin-top:Npx!important`**（行内 !important 压过 stylesheet !important）把标题往下推。

## 金律

`visual-check` = 布局**平衡**启发式（重心 / 跨度 / 画布一致性）；`visual-qa` = **真实渲染溢出**真相。两者冲突时——例如 visual-check 报画布混杂或旋转重叠，但 visual-qa 显示 0 溢出——**信 visual-qa**，把 visual-check 的告警当排查线索而非阻断门禁。
