# Design Pipeline 详细说明（Phase 0-6）

> 本文件是 SKILL.md "设计流水线" 章节的详细参考。SKILL.md 包含各阶段的概要说明，本文档提供 Gate 检查表、Phase 5 完整 skill 列表、Phase 6 逐步执行步骤等详细内容。

---

## 执行规则

- **● 强制标记**：必须完成，不可跳过
- **◐ 条件标记**：上下文已存在时可跳过
- **Gate 是 BLOCKER（专业模式）**：专业模式每阶段必须向用户展示输出，获得确认后才能进入下一阶段；快速模式按 `SKILL.md` 直接生成、验证、交付后迭代。

## Gate 速查表

| Gate | 阶段 | 必须向用户确认的内容 |
|:----:|------|---------------------|
| 0 | 设计上下文 | 设计风格/色彩/字体方向 |
| 1 | 需求+设计语法 | 场景、时长、听众、ghost deck、Theme-to-Design Router、模板/新语法判断 |
| 2 | 方案 | 内容结构、视觉方向 |
| 3 | 设计评审 | `/critique` 报告 + 优化方向确认 |
| 4 | 生成初稿 | HTML 文件路径 + 十门禁全绿（参见 SKILL.md §验证） |
| 5 | 优化迭代 | 执行的 skills 列表和结果 |
| 6 | 最终检查 | Phase 6 检查报告 + 用户交付确认 |

十门禁（lint + validate + label-overlap + lint-main-claim + evidence-ledger + color-role + contrast-aa + canvas-fill + check-overflow + spatial-integrity）自动覆盖关键约束与设计硬规则；失败门禁由十门禁及 test-pin-collision / test-reference-contract 等专项脚本联合检查。

## 各 Phase 对应 reference（流程闭环）

| Phase | 主要 reference | 获取 |
|:-----:|------|------|
| P0-6 总架构 | `references/layered-architecture.md` | 外部项目取舍、六层职责、轻量合同 |
| P0-1 设计上下文/语法 | `references/design-polish.md` | Theme-to-Design Router 完整说明、页面原语、签名时刻 |
| P0-1 色彩/字体 | `references/design-principles.md` | 配色方案、字体系统、反模式 |
| P2-3 评审 | `references/failure-gates.md` + `references/impeccable-integration.md` | 15 条门禁、impeccable 命令映射 |
| P4 生成骨架 | `references/css-skeleton.md` + `references/technical-specs.md` | CSS 骨架、CDN/插件/三端适配 |
| P4 布局/图表/图标/图片 | `references/layout-patterns.md` / `references/diagram-system.md` / `references/data-viz.md` / `references/icon-system.md` / `references/image-system.md` | 按需加载 |
| P5 优化 | `references/impeccable-integration.md`（Phase×命令映射）+ `references/motion-delight.md` | 命令到演示场景、动效 |
| P6 最终（发布会级） | `references/launch-grade.md` + 本文件 Step 1-7 | golden-reference、验证步骤 |

---

## Phase 0-1 专业模式：发现访谈（借鉴 /shape）

> 专业模式不直接开始生成，先通过 2-3 轮访谈深度理解需求。快速模式跳过此步骤。

### 访谈节奏

每轮 2-3 个问题，自然对话，不是一次性甩出所有问题。至少一轮，最多两轮。

### 第一轮：核心四问（必问）

| 维度 | 问题 | 目的 |
|------|------|------|
| **目的** | 演示结束后，你希望观众**做什么**？ | 确定行动目标（投资？采用？认同？学习？） |
| **观众状态** | 观众听到这个话题时是什么**心理状态**？（好奇？怀疑？疲劳？迫切？） | 决定语气和开场策略 |
| **内容范围** | 你有多少内容？最多和最少各是什么？ | 确定页数和密度 |
| **视觉锚点** | 有没有你**特别喜欢**的演示/品牌/网站？或**绝对不要**的风格？ | 锁定视觉方向，避免试错 |
| **HTML-native 价值** | 这份演示有没有必须用网页能力证明的点：复杂图表、3D、地图、物理互动、可交互动画？ | 决定是否调用 ECharts/Three.js/Mapbox/Matter.js 等前端能力 |

### 双条件判断（P1 入口,2026-06 MVP 新增）

进入 P1 先判"是否需要 ghost 预览"（防"方向完全错了"大返工,BLACKPINK 教训）：

| 条件 | 判据 | 跑 |
|------|------|------|
| **A 明确需求** | 主题 + 页数 + 观众 + 要点(≥3) 全给 | — |
| **B 指定模板** | "参照 xxx" / template-0X / 明确风格名 | — |
| **A && B → AUTO** | 一键自动,不确认,直接生成 HTML | `node scripts/generate-ghost-deck.js --json '{...}'` exit 0 |
| **否则 → GHOST** | 生成轻骨架预览,5 秒可扫能喊停 | 同脚本 exit 1,输出 ghost 表 |

GHOST 模式下：输出 ghost deck 后**必须 STOP**，等用户"继续 / 改 X"才进 P4 生成 HTML（Gate 模式硬约束，见 SKILL.md）。

### Ghost Deck（必产出）

在 Theme-to-Design Router 前先给出轻量 ghost deck：

| 字段 | 要求 |
|------|------|
| `#` | 页序，贴合目标页数 |
| `role` | cover / context / claim / proof / data / comparison / process / risk / close / appendix |
| `action title` | 完整句主命题，不是 topic label |
| `proof object` | 图表、表格、地图、流程、产品界面、证据卡、引用墙等 |
| `evidence status` | verified / user-provided / illustrative / needs-source |
| `physical contract` | 有图纸/地图/屏幕/桌面/舞台等承载面时，声明 surface / owned objects / forbidden collisions |

Gate 1 通过标准：只读 action titles 能讲完整故事；每页 role 清楚；每个 proof object 都服务主命题。读不通先改论证，不进入视觉设计。

### Theme-to-Design Router（必产出）

P1 不能只给“选择了哪个模板”。必须先给 ghost deck，再给设计语法路由卡：

```text
主题本质：这不是在讲 ____，而是在讲 ____。
观众张力：观众当前相信/担心 ____，演示要让他们 ____。
设计隐喻：本 deck 像一个 ____，而不是一个普通 slide deck。
页面骨架：主要使用 ____ / ____ / ____ / ____ 这些页面动作。
Proof object：必须可视化证明 ____，不能只写成 bullet。
物理契约：____ 是承载面；____ 必须在其中；____ 不得侵入/重叠；____ 必须对齐。
禁止套路：不能使用 ____，因为它会把主题讲偏或变成通用模板。
```

然后给出模板/新语法判断：

| 判断 | 行动 |
|------|------|
| 与种子模板高度匹配 | 使用该模板，但仍要改写 proof object 和页面动作 |
| 只局部匹配 | 借用 scaffold，新建隐喻和页面原语 |
| 不匹配 | 新建设计语法，不硬套 5 个 examples |

视觉 Gate 1 通过标准：用户能看懂“为什么这个主题应该长成这种页面”，而不只是知道“选了哪个模板”。

### 第二轮：补充确认（按需）

| 维度 | 问题 | 适用场景 |
|------|------|---------|
| **场景描述** | 用一句话描述物理场景：谁、在哪、什么光线、什么心情 | 确定明暗主题（深色/浅色） |
| **色彩策略** | 低调克制（Restrained）/ 主题鲜明（Committed）/ 丰富多彩（Full）/ 沉浸色域（Drenched）？ | 不确定色彩方向时 |
| **交付格式** | 只在浏览器展示？需要投影？需要发 PPTX 文件？ | 决定是否需要响应式和导出优化 |
| **二次编辑** | 后续主要由 AI 继续改，还是需要非工程用户像 PPT 一样拖拽/评论/调参？ | 决定继续用 skill，还是建议升级为独立 App/Web 项目 |

### 形态决策 Gate

专业模式 P1 必须给出形态判断：

| 判断 | 继续使用 skill | 建议单独 App/Web |
|------|----------------|------------------|
| 生成频率 | 单份或少量 deck | 高频、多项目、多模板 |
| 编辑方式 | AI 迭代源码 + 浏览器 QA | 可视化拖拽、滑杆、评论、手绘改稿 |
| 协作 | 单人或轻量审阅 | 多人评论、权限、版本历史 |
| 资产 | 当前 deck 内部自包含 | 品牌库、素材库、组件库 |
| 导出 | HTML/PPTX/PDF 三件套 | 多目标导出、云端渲染、团队交付流 |

### 断言式确认

当答案已经明显时，**断言然后请确认**，不要列菜单：

```
❌ "你想要 Restrained / Committed / Full / Drenched 哪种？"
✅ "这个场景读起来是 Restrained（克制配色、技术专业感），对吗？"
```

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

最终检查借鉴 designer-skills 的七维视觉批评和 frontend-design-audit 的 15 条启发式，但按 slide 场景裁剪：优先看层级、品牌一致性、构图、排版、色彩、信息密度、可访问性、导出风险。表单、loading、undo 等 web app 项只在 deck 内有真实交互时检查。

### Step 1: 设计规范检查（静态分析）

```bash
node scripts/lint-design.js <HTML文件>            # P0/P1/P2 设计规范检查
node scripts/lint-design.js <HTML文件> --verbose   # 包含 P2 建议
```

检查内容：
- **P0（必须通过）**：Tailwind indigo accent、标题 Emoji、ALL CAPS 无 tracking、大标题使用负 tracking、占位文本、accent 每页 >3 次、圆角+左边框卡片
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

### Step 3: 首屏可用性检查

```bash
node scripts/test-initial-slide-visible.js
```

必须确认第一页打开即有主标题/核心副标题，不能依赖第一次点击后才出现。

### Step 4: 逐页视觉截图（Contact-sheet QA）

```bash
node scripts/visual-qa.js <HTML文件> --out /private/tmp/<deck>-visual
node scripts/visual-qa.js <HTML文件> --show-fragments --out /private/tmp/<deck>-visual-all
node scripts/visual-verdict.js <HTML文件> --out /private/tmp/<deck>-verdict
```

必须人工审阅两组截图：
- 初始状态：每页不能是空白、半成品或核心内容被 fragment 隐藏。
- 展开状态：不能有文字裁切、内容越界、残影叠层、前后页混叠。
- 演示 chrome：PPTX 导出按钮、导航箭头、页码不得遮挡正文或 pin 注释；导出按钮默认应不可见，仅悬停/聚焦出现。
- 设计质量：每页必须有清晰视觉重心；大字号 statement 不能互压；数据页必须可读且有来源或“示意”标注。
- 原生语法 / Native Grammar：品牌、平台、产品类 deck 必须能看到对象自己的界面、行为或社群机制，例如 feed、播放器、搜索、评论、交易路径、控制台、仪表盘，而不是只有换色模板。
- 证据台账 / Evidence Ledger：精确数字、排名、百分比、DAU/MAU/GMV 必须在页面或备注中对应 `verified/source URL`、`user-provided` 或 `illustrative`；“公开披露”不是可追溯来源。
- LLM 视觉语义：`visual-verdict.js` 的 blocker 必须修复；若因无模型 key 只能 `--dry-run`，检查记录必须明确“未执行模型判定”，不能写成视觉通过。

任何一页不达标，回到 Phase 5 修复，并重新执行 Step 1-4。

### Step 4.5: HTML-native 能力验证

如果 deck 使用 ECharts、Three.js、Spline、ShaderToy/fragment shader、Unicorn、Matter.js、Mapbox、Canvas 或 WebGL：

- 检查 canvas/svg 容器非空、首屏非黑屏、关键画面在 1280×720 内完整可见。
- 截图至少覆盖初始状态、交互后状态、fragment 展开后状态。
- 对自动动画确认 `prefers-reduced-motion` 下不会隐藏核心信息。
- PPTX 导出必须保留静态 fallback：标题、结论、关键图形或截图，不能只留下空 canvas。
- 如果浏览器验证失败，降级为静态 SVG/PNG proof object，并记录原因。

### Step 5: 结构化检测结果

| 情况 | 输出 | 后续动作 |
|------|------|---------|
| `total = 0` | ✅ 无内容溢出 | 进入 Step 6（交付确认）|
| `total > 0` | ❌ 阻断：检测到 N 个内容溢出 | 必须修复到 `total = 0`；优先拆页、降密度、重构 proof object，不接受“看起来还行” |

### Step 6: PPTX 导出验证

```bash
node scripts/export-pptx.js <HTML文件> -o /private/tmp/<deck>-review.pptx
```

导出成功只说明文件可生成，不等于视觉保真。若 deck 使用复杂 HTML/CSS/SVG，必须至少抽查导出后的 PPTX 是否保留关键标题、章节和主要 proof object。

### Step 7: 交付确认

- `total = 0` → 直接交付 HTML 文件
- `total > 0` → 不交付；列出问题元素，参考截图，回到 Phase 5 修复并重新验证

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
- [ ] 字号使用固定 `em`/`px` 尺寸，不用 `vw`/`vh`；h1 ≤ 4em，h2 ≤ 2.6em，正文 ≤ 0.95em
- [ ] **垂直流程图：最多 7 步（含首尾），超过则拆页或改横向**
- [ ] **混合布局（标题+流程图+卡片）：先验证总高度不超限**

详细代码示例见 `references/layout-patterns.md` 的"超框案例记录"和"防超框 CSS 规则"章节。
