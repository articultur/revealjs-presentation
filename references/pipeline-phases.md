# Design Pipeline 详细说明（Phase 0-6）

> 本文件是 SKILL.md "设计流水线" 章节的详细参考。SKILL.md 包含各阶段的概要说明，本文档提供 Gate 检查表、Phase 5 完整 skill 列表、Phase 6 逐步执行步骤等详细内容。

---

## 执行规则

- **● 强制标记**：必须完成，不可跳过
- **◐ 条件标记**：上下文已存在时可跳过
- **Gate 是 BLOCKER**：每阶段必须向用户展示输出，获得确认后才能进入下一阶段

## Gate 速查表

| Gate | 阶段 | 必须向用户确认的内容 |
|:----:|------|---------------------|
| 0 | 设计上下文 | 设计风格/色彩/字体方向 |
| 1 | 需求+模板 | 场景、时长、听众、模板选择 |
| 2 | 方案 | 内容结构、视觉方向 |
| 3 | 设计评审 | `/critique` 报告 + 优化方向确认 |
| 4 | 生成初稿 | HTML 文件路径 |
| 5 | 优化迭代 | 执行的 skills 列表和结果 |
| 6 | 最终检查 | Phase 6 检查报告 + 用户交付确认 |

---

## Phase 5: 优化迭代 Tier 详情

根据演示复杂度选择优化层级：

```
< 5 slides  ────▶  Simple Tier (5 skills)
5-15 slides  ──▶  Standard Tier (7 skills)
> 15 slides  ──▶  Full Tier (12 skills)
```

### Simple Tier (< 5 slides)

**快速优化，仅核心 skills**：

| # | 命令 | 用途 |
|---|-----|------|
| 1 | `/arrange` | 布局节奏 |
| 2 | `/typeset` | 字体排版 |
| 3 | `/colorize` | 色彩系统 |
| 4 | `/clarify` | 文案清晰 |
| 5 | `/distill` | 去除冗余 |

### Standard Tier (5-15 slides)

**标准优化，核心 + 动效 + 润色**：

| # | 命令 | 用途 |
|---|-----|------|
| 1-5 | (同 Simple) | 核心优化 |
| 6 | `/animate` | 添加动效 |
| 7 | `/polish` | 最终润色 |

### Full Tier (> 15 slides 或 正式演讲)

**完整优化，全部 12 skills**：

| # | 命令 | 用途 |
|---|-----|------|
| 1 | `/arrange` | 布局节奏 |
| 2 | `/typeset` | 字体排版 |
| 3 | `/colorize` | 色彩战略 |
| 4 | `/clarify` | 改进文案 |
| 5 | `/distill` | 提炼精华 |
| 6 | `/animate` | 添加动效 |
| 7 | `/delight` | 添加惊喜 |
| 8 | `/bolder` | 增强表现力（如需要） |
| 9 | `/quieter` | 减弱嘈杂（如需要） |
| 10 | `/optimize` | 性能优化 |
| 11 | `/harden` | 增强健壮性 |
| 12 | `/polish` | 最终润色 |

**执行顺序**：#1-5 → #6-7 → #8-9（如需要）→ #10-12

---

## Phase 6: 最终检查 完整执行步骤

### Step 1: 设计规范检查（静态分析）

```bash
node scripts/lint-design.js <HTML文件>            # P0/P1/P2 设计规范检查
node scripts/lint-design.js <HTML文件> --verbose   # 包含 P2 建议
```

检查内容：
- **P0（必须通过）**：Tailwind indigo accent、标题 Emoji、ALL CAPS 无 tracking、大标题无负 tracking、占位文本、accent 每页 >3 次、圆角+左边框卡片
- **P1（建议修复）**：禁止字体、纯黑/纯白无 tint、字重 >3 档、duotone 渐变、渐变文字
- **P2（锦上添花）**：全部居中、玻璃拟态过度、缺少 reduced-motion、颜色系统
- 退出码 1 = 存在 P0 违规，必须修复

### Step 2: 溢出检测（Playwright）

```bash
node scripts/validate.js <HTML文件>      # 检测溢出并截图
node scripts/validate.js <HTML文件> --fix  # 检测 + 自动修复 + 重新验证
```

脚本自动：
- 启动无头浏览器（Playwright）
- 加载 HTML 文件
- 执行溢出检测（视口/容器/内容三层检测）
- 截图标记溢出元素（红色=视口溢出，绿色=容器溢出）
- 如指定 --fix：应用自动修复并重新验证

### Step 3: 结构化检测结果

| 情况 | 输出 | 后续动作 |
|------|------|---------|
| `total = 0` | ✅ 无内容溢出 | 进入 Step 4（交付确认）|
| `total > 0` | ⚠️ 检测到 N 个内容溢出 | 查看截图，确认是否接受或手动修复 |

### Step 4: 交付确认

- `total = 0` → 直接交付 HTML 文件
- `total > 0` → 列出问题元素，参考截图，人工确认是否接受当前状态或手动修复

### 截图说明

检测后生成 `<文件名>-overflow.png`，标记如下：
- **红色边框**：视口/内容溢出元素
- **绿色边框**：Flex/Grid 容器溢出（子元素撑破父容器）

### 手动验证（备用）

如 Playwright 不可用：
1. 双击 HTML 文件在浏览器中打开
2. 用方向键逐页检查
3. 检查溢出、比例失调、动画问题

---

## 附录A: 溢出预防 (Overflow Prevention)

**核心原则**：
- **宁可保守设计**（内容偏少），事后微调放大
- **不要设计太满**，否则溢出后无解
- 每次修改后**立即验证**，不要批量修改后才发现问题

**预防检查清单（设计时执行）**：
- [ ] 3列卡片：每卡 padding ≤ 1em，gap ≤ 0.8em
- [ ] 6列网格：每卡 padding ≤ 0.7em，gap ≤ 0.6em
- [ ] 列表：每项 margin ≤ 0.3em，最多 4 项
- [ ] h2 margin-bottom ≤ 0.5em
- [ ] clamp() 最大值：h1 ≤ 2.5em，h2 ≤ 1.8em，正文 ≤ 0.95em
- [ ] **垂直流程图：最多 7 步（含首尾），超过则拆页或改横向**
- [ ] **混合布局（标题+流程图+卡片）：先验证总高度不超限**

详细代码示例见 `references/layout-patterns.md` 的"超框案例记录"和"防超框 CSS 规则"章节。
