# 内容预算

> slide 画布约束与内容密度规则。生成任何 `<section>` 前必须先心算本文件中的预算。

## 画布参数

slide 实际画布 = **1280×720px**，扣除推荐 padding（60×80×80×80）后**可用空间 ≈ 1120×580px ≈ 35×19em**。

**每页安全预算 ≤ 14em 垂直**（不含 section padding）。

## 高度估算速查

| 元素 | 高度估算 |
|------|----------|
| h1（2em） | ~2.5em |
| h2（1.6em） | ~2em |
| p（1 行 65ch） | ~1.5em |
| 三列卡片 / 双列卡片 | ~8em |
| 2×2 网格 | ~9em |
| 时间线（4 节点） | ~8em |
| kicker + divider | ~1.2em |

## 溢出决策树

> 心算总和 > 14em → **停下来**，按优先级处理：①拆页 → ②缩短文案 → ③改 proof object → ④缩字号（最后才用）。
>
> **设计原则：先紧后松**。初稿宁可留白也不要塞满；溢出优先拆页（案例见 `references/failure-gates.md` #6、#12、#13）。

**密度硬上限**：垂直列表 ≤5、双列卡 ≤4、三列卡 ≤3、时间线 ≤6、代码块 ≤8 行、纯文字 ≤120 字。超出即拆页。完整高度估算和 8 个超框案例：`references/layout-patterns.md`。

## VP_TOP 症状（`validate.js` 必报，P0）

当 section 实际内容高度 > 可用高（≈19em/580px）且用了 `justify-content:center` 时，居中后**顶部内容会溢出 section 上边界**，被 `section{overflow:hidden}` 裁剪——表现为顶部元素（kicker / 小标题 / h1 上沿）"显示不全"（文字上半部缺失）。

validate.js 检测为 `VP_TOP: Npx`（元素 top < section boundary top）。**VP_TOP > 0 = 内容超高，必须拆页或降内容**（缩字号治标不治本，内容仍溢出）。

实测：clinical v15.0 的 kicker "Chapter 05 · Safety" 因 section 内容溢出贴顶，文字顶部被裁 6px（用户肉眼可见"显示不全"）。validate.js 已能抓此问题——v15.3 起 P4 六门禁强制跑 grade-gate.js 即可拦截，关键是**不能漏跑 grade-gate.js**。

## Flex Label 收缩

**flex column 容器内的 inline label（kicker/eyebrow/小标题）必须 `align-self: flex-start`**：作为 flex 子项，`display:inline-flex/inline-block` 会被**块化为 `flex`/`block`**，`align-self:auto` 在交叉轴解析为 `stretch` → 撑满 section 宽度（实测 examples + clinical 的 kicker 从内容宽 ~233px 撑到 1037–1091px）。

撑满本身不直接致裁剪，但是布局异常（label 应是紧凑 inline 标签）。给这类 label 显式 `align-self: flex-start`（或 `width: max-content`）让它收缩到内容宽。
