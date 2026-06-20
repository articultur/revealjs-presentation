---
name: revealjs-presentation
description: |
  This skill should be used when the user asks to "做个 PPT / 幻灯片 / 课件 / 汇报 / keynote / pitch deck", "make a deck", or to turn a topic / outline / document / 数据 into slides. Covers common Chinese work scenarios: 做报告, 写课件, 年终总结, 述职, 答辩, 复盘, 融资 / BP / 提案, 架构评审, 产品发布, 技术分享, 路演, 营销方案. Also handles refreshing an existing reveal.js HTML, exporting to PPTX / PDF, and fixing slide overflow / pin-overlap / 文字被裁切 / 幻灯片显示不全, or generating decks in a specific visual style (editorial archive, dark-tech cockpit, architectural plate, live keynote, field notebook, brutalist, memphis, isometric — the 8 seed templates). Invoke even without the word "slides" when the ask is to communicate a structured argument visually. Output is a single self-contained HTML with a designed visual language, not a generic AI template.
---

# Reveal.js 演示文稿

生成有视觉辨识度的演示文稿，不是千篇一律的 AI 模板。输出为**单个 HTML 文件**，浏览器打开即用。

## 快速开始

生成一个演示的最短路径（快速模式，适合"做个 PPT"类需求）：

1. **触发**：用户说"做个 PPT / 幻灯片 / 课件"或给出主题
2. **确认 4 要素**：主题 · 观众 · 页数 · 语言（缺省：通用观众 / 8-12 页 / 中文）。页数是硬约束——用户给 N 页时最终偏差 ≤1（见 §8）
3. **先搭骨架**：轻量 ghost deck（每页 role + action title + proof object）+ Theme-to-Design Router 六行说明
4. **生成单个 HTML**：内联 CSS+JS、Reveal.js 4.6.0 CDN、1280×720 画布
5. **自检（两层）**：`node scripts/grade-gate.js <file>` 全绿（地板）+ `node scripts/design-strength-check.js <file>` 四维达标（天花板：尺度≥3:1、有满版色块面板、有非对称分割、有主题原生形式）；若页数 ≥12 或含密集数据/图表布局，加跑 `visual-qa.js --annotate-overflow` 逐页审阅
6. **交付**：HTML 路径 + 运行/导出说明 + 验证状态

需精细控制走 P0-P6 专业模式（下文）；发布会级先读 `references/launch-grade.md`。

## 零安装使用

CDN 加载 reveal.js + Google Fonts，用户**无需安装任何东西**。

- 浏览器打开 HTML → 方向键导航，`S` 演讲者备注，`F` 全屏
- **PPTX 导出**：HTML 内置按钮（右上角悬停/聚焦显示），点击即下载可编辑 .pptx
- **PDF 导出**：Chrome 打开 `file.html?print-pdf` → `Ctrl/Cmd+P`

用户问"怎么安装"——**不需要安装，双击 HTML 就用**。

## 流程

### 项目取舍后的六层架构

总集成契约见 `references/layered-architecture.md`。

| 层 | 责任 |
|---|---|
| 1. 生产管线层 | 结构化内容 → 单文件 Reveal.js HTML → 浏览器 PPTX / PDF |
| 2. 风格系统层 | 主题原生设计语法、风格候选、图表样式、Bento / 页面原语 |
| 3. 表达逻辑层 | ghost deck、action title、论证结构、图表注释、引用规范 |
| 4. 审美约束层 | 反 AI 模板味、字体 / 色彩 / 布局变化、bolder / quieter / distill / polish |
| 5. 质量审查层 | 层级、可读性、对齐、拥挤、可访问性、响应式 / 导出风险 |
| 6. 任务治理层 | brief、goals、ledger、checkpoint、steering、final gate |

### 四套质量体系（何时用哪个）

| 体系 | 规模 | 何时起作用 | 强制级 |
|------|------|-----------|--------|
| 关键约束 | 8 项（§1-§5 由脚本联合检查，§6-§8 为流程指南） | 生成 HTML 前（P4 / 快速模式） | 硬约束 |
| 设计硬规则 | 10 条 | `lint-design.js` 检查 | P0 必修，P1/P2 建议 |
| 失败门禁 | 13 条 | 全流程质量底线 | 触发即阻断交付 |
| Phase P0-P6 | 7 阶段 | 专业模式流程 | 每段 Gate 确认 |

八门禁（G1 lint → G2 validate → G3 label-overlap → G4 lint-main-claim → G5 evidence-ledger → G6 color-role → G7 contrast-aa → G8 canvas-fill，详见 §验证）自动覆盖关键约束与设计硬规则；失败门禁由八门禁及 test-pin-collision / test-reference-contract 等专项脚本联合检查。三种模式的叠加关系见下表。

### 三种工作模式

| 模式 | 何时用 | 行为 |
|------|--------|------|
| **快速模式（默认）** | 用户只说"做个 PPT"或没具体要求 | 收集 4 要素 → 轻量 ghost deck + 设计语法 → 直接生成 HTML → 八门禁 → 交付说明；不强制 7 题访谈 |
| **专业模式** | 用户要精细控制或明确要求评审 | 走 7 阶段 P0-P6，每段获 Gate 确认。详见 `references/pipeline-phases.md` |
| **发布会级模式** | 用户说"发布会级"/Keynote/品牌开场/惊艳/顶级/public launch/产品发布，或要求接近品牌介绍页 / 发布会开场这种质量 | 先读 `references/launch-grade.md`。输出前必须完成：storyboard、golden-reference 对标、逐页截图审阅、PPTX 导出证明、`node scripts/test-launch-grade-contract.js` |

| 专业模式 Phase | 名称 | 类型 | 核心任务 |
|:-----:|------|:----:|------|
| P0 | 设计上下文 | ● | 风格、色彩、字体方向 |
| P1 | 需求+设计语法 | ● | 场景/时长/听众 + ghost deck + Theme-to-Design Router 六行说明 |
| P2 | 输出方案 | ◐ | 内容结构、视觉方向 |
| P3 | 设计评审 | ● | 反模式检查 + 优化方向 |
| P4 | 生成初稿 | ● | HTML + **八门禁**（`grade-gate.js` 全绿 = G1-G8 全过，见 §验证；机器判 verdict，不可手动放行） |
| P5 | 优化迭代 | ● | 按规模执行优化（详见 references/pipeline-phases.md「Phase 5」） |
| P6 | 最终检查 | ◐ | 专业/发布会级必跑；快速模式 ≥12 页或密集数据时跑 |

● 必须完成　◐ 可跳过　/　刷新已有演示：跳过 P1，从 P3 开始评审

## 关键约束（生成 HTML 前必须先确认）

这一节是 P4 / 快速模式生成前的"过桥清单"，下面任意一条不满足都会在 lint / validate / label-overlap / lint-main-claim 中被拦截。**生成代码前先在脑里把这八项过一遍**。

### 1. 输出形态硬约束

- **单个自包含 HTML 文件**，不拆分 CSS/JS
- **Reveal.js 4.6.0 CDN**：`cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/reveal.{css,js}`
- **Google Fonts**：按设计语法选择，`<link>` 引入
- **CSS 全部内联**在 `<style>` 中，用 `--c-*` / `--f-*` token；骨架见 `references/css-skeleton.md`
- **每页一个 `<section>`**；section 级 flex/grid 必须用 `class="deck-flex"` / `class="deck-grid"`——reveal 会把 present section 的 inline `display` 改成 `block`，**写在 stylesheet 里的 `display:flex` 会被静默覆盖成 dead code，你以为在居中其实没有**；只有 `deck-flex`/`deck-grid` 类才能在 reveal override 后重新生效
- **图标用 inline SVG**（`references/icon-system.md`），不用 Font Awesome、不用 Emoji 当图标
- **不引入 Tailwind 或任何 CSS 框架**
- **禁止 `vw`/`vh` 单位**：Reveal 用 `transform: scale()` 缩放，vw/vh 不受影响 → 大屏溢出/小屏不可读；字号用 `em`/`px`（详见 `references/technical-specs.md`）
- **Reveal 配置**：`{ width: 1280, height: 720, margin: 0.04, hash: true, slideNumber: 'c/t', transition: 'fade' }`
- **页面过渡只用 `fade`/`slide`，禁 `convex`/`concave`/`zoom`**：3D 过渡给页面套透视，扭曲 `getBoundingClientRect` → `visual-check.js` 报画布尺寸混杂（**实测同一 deck 出现 1229×691 夹 1199×752**）。所有页画布尺寸必须一致（**G8** `test-canvas-fill.js` 机器查）。要"活泼"用 fragment 动效，别换过渡（详见 `references/visual-check.md`、`references/motion-delight.md`）
- **交付前必须过八门禁**：`grade-gate.js <file>` 全绿（见 §验证）。P4 生成后立刻跑，任一红灯 = 回 §2 拆页/降文字
- **切勿破坏 reveal 的 section 堆叠/隐藏**：弱选择器 `.reveal section{position:relative}` 无害（被 reveal.css 覆盖 = dead fallback）；**真正危险的是 `!important` 或加强选择器强覆盖 `position`** → section 进文档流垂直堆叠 → overflow:hidden 截断 → 除首页外全空白（**v15.2 实测 slide 3 top=1397，已回滚**）。给 present 垂直居中用 `.reveal section.present{display:flex!important}`，别 blanket-force（详见 `references/css-skeleton.md`）
- **Pin 定位上下文**：pin 相对最近 positioned 祖先（reveal 的 absolute section）；若 section 退回 static，pin 相对 BODY 全叠视口左下角 → `test-label-overlap` 报泄露

### 2. 内容预算（生成 section 前先算）

slide 画布 **1280×720px**，可用空间 ≈ 1120×580px，每页安全预算 ≤ 14em 垂直。心算总和超限按优先级拆页/降文/改 proof object/缩字号。密度硬上限和 VP_TOP 溢出症状详见 `references/content-budget.md`。

### 3. Pin 安全区（左下角索引不被遮）

`.pin` 独占左下角 ~200×40px。满宽内容挡到就三选一：安全带/对角/隐藏。装饰元素白名单详见 `references/pin-safety.md`。

### 4. 首屏即可读

封面 / 第一页的主标题和核心副标题**不得**用 `fragment` 初始隐藏。fragment 只用于后续逐步揭示或非核心内容。用户双击打开 HTML 时不能看到空白封面。`scripts/test-initial-slide-visible.js <file>` 自动检测（无参则检查种子模板）。

### 5. PPTX 内置导出

在 Reveal.js 之后加载 pptxgenjs CDN，并把 `scripts/export-pptx-client.js` 的内容**内联**到当前 HTML：

```html
<script src="https://cdn.jsdelivr.net/npm/pptxgenjs@4.0.1/dist/pptxgen.bundle.js"></script>
<script>/* paste scripts/export-pptx-client.js here */</script>
```

导出按钮默认不可见，只在右上角悬停或键盘聚焦时出现；不得覆盖左下角 pin、页码、导航控件或正式演示画面。**不要**用 `import()`（UMD 不支持）。

完整 CDN 链接、插件配置、代码高亮：`references/technical-specs.md`。

### 6. 首稿配方速查（让一稿落地更近）

常见内容 → 推荐布局映射表，先按配方落地再根据 lint/validate 反馈调整。详见 `references/first-draft-recipes.md`。

### 7. 封面右侧平衡（editorial-serif / minimal 模板高频遗漏）

左对齐封面常见问题：**主标题靠左下，右上 / 右半屏完全空白** → 视觉重心失衡。三选一补平衡——**装饰元素必须承载信息（编号/日期/类目/样本），绝不能是无意义图标**：

| 方案 | 实现 |
|------|------|
| (a) Stamp / 印章 | 右上角 `<span class="stamp">NO. 026 · CATALOGUED</span>`（编号·类目），旋转 -3deg |
| (b) Poster wall / 拼贴墙 | 右侧 320×420px 区域放 3×4 色块网格，几格 SVG 几格留白 |
| (c) Sample tag / 标签卡 | 右下散落 2-3 张轻微旋转的标签卡（带类目和标号） |

完整范本：`examples/template-01-editorial-serif.html` 封面（左主标 + 右色块墙 + 右下信封 + stamp）；配方见 `references/design-polish.md`。

### 8. 页数目标对齐（用户说"N 页"就是 N 页，不是 N-3）

用户给页数时，最终 `<section>` 数与目标偏差必须 **≤1 页**。**内容预算（§2）管单页密度，不是总页数**——根因是"先紧后松"被误读成"页数也紧"；页数不够就拆页（多一页留白比挤一页强），不要靠删内容凑数。执行三步：

- **生成前**：在 Theme-to-Design Router「页面骨架」行写明 `[目标 N 页] + 页面原语清单`，按 N 原子化规划每页
- **生成后**：`grep -c '<section>' <file>` 核对实际页数，偏差 >1 必须补页（章节分隔 / proof object / takeaway / 对比页是天然补页候选）或删页
- **用户没给页数**：默认 8-12 页，按内容密度定，**不要默认压到下限**

## Argument-First Planning

在选模板、字体、颜色前，先搭一版轻量 ghost deck。快速模式可以只在内部完成；专业模式 / 学术 / 数据 / 答辩 / 投资 / 决策类演示必须向用户展示。

### Ghost Deck 最低字段

| 字段 | 用途 |
|---|---|
| `#` | 页序，必须贴合用户目标页数（偏差 ≤1） |
| `role` | `cover` / `context` / `claim` / `proof` / `data` / `comparison` / `process` / `risk` / `close` / `appendix` |
| `action title` | 完整句主命题，不是“背景 / 方法 / 结果”这种 topic label |
| `proof object` | 承担论证的可视对象：图表、表格、地图、流程、代码现场、产品界面、证据卡、引用墙 |
| `evidence status` | `verified` / `user-provided` / `illustrative` / `needs-source` |

**Ghost deck test**：只读 action titles，应该能讲完整故事。读不通就先改论证，不要进入视觉设计。

### 表达规则

- 每页一个任务；一页同时解释背景和结论就拆页。
- 结果 / 数据页一页一个 exhibit，并把 “so what” 直接标在图表或 proof object 上。
- 精确数字、排名、百分比、DAU/MAU/GMV 必须有 `verified/source URL`、`user-provided` 或 `illustrative`。
- **历史/数据主题：具体日期、参数、价格、基准分数本身就是 proof object，必须用真实值 + 来源**。G5 证据门禁靠加 source label 满足，**绝不靠把数字软化为"约/示意/持平/大致"**——软化数字 = 丢掉设计感最关键的"具体性"。`design-strength-check.js` 的 contentSpecificity 子分会盯这个（四维主度量之外的第 5 子分）。
- 学术 / 研究 / 政策 / 医疗 / 金融内容优先使用 action title + citation；品牌 / 发布会内容可以更具舞台感，但仍必须有主命题。
- 结尾优先停在 conclusion / takeaway / decision slide；不要默认用 “Thank You” 空页收尾。
- **少用 em-dash（— / ——）做句中连接**：impeccable audit 把"句子里反复用破折号连接从句"列为 AI 文风指纹——跨种子 01/02/03/06 都中过。中文 `——`、英文 ` — ` 作连接，一页超过 2–3 次就成节奏 tell。改用逗号、冒号、句号或分号。结构性的 `—` 不算（表格无数据 `<td>—</td>`、编号标签 `ed.01 — Pilot`、装饰 `<span>—</span>`）。

## Theme-to-Design Router

模板不是最终目的，只是已经验证过的设计语法 seed。每次生成前必须先产出一段**设计语法说明**，再决定复用、改造或新建。

### 第一步·选种子：按主题"形状"，不按行业关键词

选模板看主题的**形状/动作**，不是行业关键词——同行业的两个主题可能要不同模板（"AI 历史"是历程→01，"AI 系统"是系统→02）。先走下表，命中后**种子只提供 voice（配色/字体/语气 token），布局来自 archetype 引擎库**（见下「voice / layout 解耦」）。

**voice / layout 解耦（表达能力的核心）**：种子 = voice（配色+字体+语气），archetype = layout（构图+张力+节奏）。两者解耦组合，表达空间从"8 套死模板"炸开成"N 声音 × M 版式"。**禁止把种子的布局原语原样当骨架填充**（如直接套 folio-grid/plate-grid 不改结构 = 失败门禁 #9 换皮）。主骨架必须由 `references/layout-archetypes.md` 的 ≥3 种 archetype 组合，其中 ≥1 种是**为本主题发明的变体**（调过参数/改过结构）。

| 主题形状（看主干动词） | 种子 |
|---|---|
| 讲**历程 / 历史 / 复盘 / 编年** | **01** editorial-serif |
| 讲**系统运行 / 监控 / 排障 / 终端** | **02** dark-tech |
| 讲**结构 / 架构 / 方法论 / 层级关系** | **03** minimal-spatial |
| 讲**发布 / 亮相 / 舞台 / 产品 drop** | **04** vibrant-gradient |
| 讲**田野观察 / 教学 / 洞察 / workshop** | **05** nature-fresh |
| 讲**宣言 / 批判 / 对抗 / 反潮流** | **06** brutalist |
| 讲**创意 / 活动 / 作品集 / 复古文化** | **07** memphis |
| 讲**平台 / 路线图 / 分层 / 阶段规划** | **08** isometric |

**歧义判据**（一行沾两样时，看主命题动词）：讲发展/讲故事 → 历程(01)；讲怎么跑/排障 → 系统(02)；讲怎么搭/组成 → 结构(03)；讲登场/亮相 → 发布(04)。

**worked example**：`AI 大模型发展史` → 历程 → **01**（不是 02：虽是技术，主干是"编年"不是"系统运行"）；`单体→三层架构迁移` → 结构 → **03**；`新产品发布会` → 发布 → **04**；`SRE 故障复盘` → 系统 → **02**。

**不硬套（硬约束）**：8 个形状都不沾（如纯金融台账、临床实验报告、法律案卷），就**新建一次性语法**（见下「新语法最低要求」），并说清"为什么 8 个种子都不行"。把内容塞进不合适的种子比新建更糟——硬套是比"发明癖"更大的失败。

### 必填六行（P1 结束前完成）

```text
主题本质：这不是在讲 ____，而是在讲 ____。
观众张力：观众当前相信/担心 ____，演示要让他们 ____。
设计隐喻：本 deck 像一个 ____，而不是一个普通 slide deck。
页面骨架：[目标 N 页] · 主要使用 ____ / ____ / ____ / ____ 这些页面动作（N 页数见 §8）。
Proof object：必须可视化证明 ____，不能只写成 bullet。
禁止套路：不能使用 ____，因为它会把主题讲偏或变成通用模板。
```

**生成方法**：抽主题本质（动作/冲突，不是名词）→ 找观众张力（怀疑/疲劳/陌生/兴奋/需决策）→ 选设计隐喻（控制室/档案馆/舞台/实验台/地图/交易大厅/导演分镜/工坊白板）→ 定义 4-6 种页面原语 → 绑定 proof object → 派生视觉系统（颜色/字体最后才决定）。完整说明：`references/design-polish.md`。

### 设计契约（必填，P1 结束前与六行一起产出）

六行说明定"讲什么"，设计契约定"长多大胆"。把野心写成可承诺、可度量的决策，避免"边写边默认最保险的值"（这正是合规 deck 退化为平庸的根因，见 `references/design-fundamentals.md` §0）。四项必填：

```text
尺度预设：newspaper-dramatic(≥5:1) / launch-bold(~4:1) / editorial-quiet(~3:1)
用色投入：spot-1(克制) / spot-2-bold(含满版色块面板) / ink-drama(深色满版+专色glow)
archetype 序列：每页分配一个 archetype（A1-A12，见 layout-archetypes.md），≥3 种、无连续 2 页相同
本主题发明变体：≥1 个为本主题调参/改结构的 archetype（不是照抄）
```

**退化拦截**：生成后跑 `node scripts/design-strength-check.js <file>`。四维（尺度对比/用色投入/构图张力/隐喻贯彻）任一不达标，**回炉重做骨架，不是微调**。典型退化信号：全 deck display ≤2.5em（尺度太平）、无任何满版色块面板（用色显平）、全是通用卡片无主题原生形式（隐喻没贯彻）。

### 匹配规则

（先用上面「第一步·选种子」判定主题形状属于本表哪一行。）

| 情况 | 处理 |
|------|------|
| 主题自然落入现有语法 | 用对应种子模板，替换内容原语和 proof object |
| 主题只部分匹配 | 借用最近模板作 scaffold，改写隐喻/骨架/命名 |
| 主题完全不匹配 | 新建一次性设计语法，不要硬套 |
| 用户给品牌/参考图 | 从品牌行为和语气抽隐喻，不只吸色或模仿字体 |
| 内容跨多个语境 | 选一个主隐喻，其他作为局部页面动作 |

**新语法最低要求**：1 个清晰隐喻 + 4 种页面原语 + 1 个签名时刻 + 1 套颜色/字体 token + 3 个禁用套路 + 1 条验证问题（把颜色字体拿掉后，这页是否仍属于这个主题？）。

### 设计强度三拨盘（density / variance / motion）

每份演示在生成前明确三个维度的强度（1-5），决定布局、动效、密度的基调，写进 Theme-to-Design Router 的"页面骨架"行。这是从 taste-skill 的 VARIANCE / MOTION / DENSITY 思路收敛来的 slide 版本：

| 拨盘 | 低（1-2） | 高（4-5） |
|------|----------|----------|
| **DENSITY 密度** | 留白多、单页单论点 | 信息密集、对比矩阵 |
| **VARIANCE 多样性** | 统一节奏、重复结构 | 布局多变、≥4 种页面原语 |
| **MOTION 动效** | 静态、仅 fade | fragment 编排、签名时刻动效 |

模式对应参考：快速模式 = 中 density + 中 variance + 低 motion；专业模式 = 按主题调；发布会级 = 中 density + 高 variance + 高 motion。拨盘是**对现有内容预算（≤14em）/布局多样性（≥4 种）/动效规则的参数化抽象**，不是新约束。

### 图表 / Bento 取舍

借鉴 `ppt-agent-skill` 的图表分层，但本项目优先保持单文件 HTML 和导出稳定：

| 场景 | 选择 |
|---|---|
| KPI、比例、趋势、对比 | 纯 HTML/CSS/SVG：进度条、环形、迷你折线、对比柱、指标行 |
| 流程、机制、系统关系 | `references/diagram-system.md`：流程图、关系图、时序图、状态图 |
| 密集经营数据 | 先拆页或转成 2-3 个 proof objects；Bento 只作为一页页面原语，不做全 deck 默认 |
| 地图、关系网络、桑基、热力日历 | 只有当 HTML-native 证明价值明确时才用 JS；否则做静态 SVG / 表格摘要，避免 PPTX 导出失真 |
| 严格表格 / 公式 / 架构框 | 保持几何关系和阅读顺序，优先减少内容而不是缩字号 |

### 失败模式门禁（13 条速查 / 完整说明见 `references/failure-gates.md`）

| # | 门禁 | 一句话 |
|---|------|--------|
| 1 | 原生语法 | 品牌/平台 deck 必须有该对象的界面证据，不只是"科技感/年轻化" |
| 2 | 审美通道 | 用 Fraunces/DM Sans/玻璃卡/通用渐变要先说明为什么主题就是这个媒介 |
| 3 | 证据台账 | 所有精确数字必须标 `verified / user-provided / illustrative`；"公开披露"不够 |
| 4 | 主命题进场 | pin/页码不能承担本页唯一主题；主视觉区必须读得到主命题 |
| 5 | 颜色角色 | 主命题用最高层级颜色；强调色不做随机高亮 |
| 6 | 密度溢出阻断 | `validate.js` `total > 0` = 必须修复；拆页优先（见 §2 优先级） |
| 7 | 截图复核 | 视觉调整后重跑 `visual-qa`；不要用"代码合理"代替截图 |
| 8 | fragment 首屏 | 初始截图必须有可读核心结论，不能全藏在 fragment 后 |
| 9 | 骨架换皮门禁 | 同一套"左标题 + 右图形"换 5 套颜色 = 失败；class 名要反映主题对象 |
| 10 | 跨模板相似度 | 5-10 张首页并排，去色后还像同一套 = 失败；金融像 cockpit，城市像 GIS |
| 11 | 种子模板对象契约 | 维护已实现的 `examples/template-01..05` 必须通过 `test-reference-contract.js` |
| 12 | 高风险布局预警 | 2×2 + 长标题、4-8 卡、密集时间线 + fragment 都易溢出，先用紧凑版 |
| 13 | **Pin 安全区** | 必须跑 `test-pin-collision.js`，OK 才能交付；详见上文「关键约束 §3」 |

## 种子模板（8 套已实现）

每个模板在 `examples/template-01..08-*.html` 有完整示例，class 命名和领域对象登记在 `references/template-invariants.json`。**使用种子模板时必须改变叙事结构和页面骨架，不只换字体/颜色/背景**（失败模式 #9）。

| 模板 | 设计语法 | 适用场景 |
|------|---------|---------|
| `template-01-editorial-serif` | 档案馆 / 策展（材料墙、印章、图版） | 研究报告、品牌历史、展览、策略复盘 |
| `template-02-dark-tech` | 控制室（雷达、终端、状态面板、故障演练） | 开发者大会、SRE、架构发布、技术产品 |
| `template-03-minimal-spatial` | 建筑制图（图纸、尺寸链、平面、剖面、路径） | 产品架构、方法论、复杂系统、组织设计 |
| `template-04-vibrant-gradient` | 发布会现场（主屏、观众席、摄影机框、产品 drop） | 品牌开场、社区产品、营销、Keynote |
| `template-05-nature-fresh` | 田野桌面（笔记本、钉图、样本标签、信封） | 培训、研究 workshop、教育、用户洞察 |
| `template-06-brutalist` | 野兽派 / 反模板（裸露硬边框、粗黑线、Archivo Black、荧光黄绿警示、错位坐标） | AI 批判、先锋创意、宣言式、反潮流品牌 |
| `template-07-memphis` | 80s Memphis 复古（撞色色块、几何三角/圆/波浪、粗描边、不对称散落） | 创意机构、活动、作品集、文化品牌、营销 |
| `template-08-isometric` | 等距 3D 信息图（30° 立体层叠、Edge/Mesh/Data 架构栈、侧视网格） | 平台架构、系统流程、路线图、阶段规划 |

> 另有 10 套设计语法（金融终端、临床实验室、城市基建、法律案卷、奢侈工坊、影视分镜、动画节奏、系统流程、代码走查、数据可视化）登记在 `references/design-polish.md` 作扩展参考，**尚未落地为种子 HTML**——其 "Template 06-15" 是逻辑章节序号，不对应 `examples/` 文件；需要时新建，别引用不存在的 `template-09..15`。

### 已知局限（高几何精度风格 + 全局防溢出）

建筑制图/紧凑 dark-tech 风格对几何精度要求高，subagent 生成时反复出现叠放：长英文标签溢出矩形、表格关键字列太窄断词（`Controll/er`/`Reposito/ry`）、行内文字越画布右边界被截、absolute 标线越画布消失、时间线描述文字与底部进度条重叠。

**四层防御**：

1. **设计层** — `references/layout-archetypes.md` 加溢出防护规格；`examples/template-03-minimal-spatial.html` 强化种子范本
2. **引导层** — SKILL.md 硬规则 + Theme-to-Design Router 设计契约（文字 `right ≤ 画布 - 24px` / 时间线节点 `≥ 200px` / 标线 `right ≤ 100%`）
3. **harness 兜底** — `template-03` `<style>` 加 10 条全局 CSS（含 `overflow: hidden !important` + `html/body overflow-x: hidden` + `section padding 0 24px` + 时间线 `desc max-height: 3.6em` + `bar margin-top: 12px` + `svg max-width: 100%` 防 SVG 拉伸越界 + `focus-visible` a11y 强化）
4. **js 脚本检查** — `scripts/check-overflow.js` 用 playwright 测每页 bbox（文字越界 / 元素重叠），集成 `grade-gate`（G9）失败阻断交付

**impeccable false-positive 提示**：`template-03` 的 em-dash（—）与 PLATE 编号（PLATE I/II/III、01-06 section 标记）是 minimal-spatial 建筑制图风格的**固有产物**（图纸标注 / 图版编号），**非 AI cadence tell**。`/impeccable audit` 会标这两个，属已确认 false positive，无需修改——改了就不是建筑制图了。

## 设计规则（lint 自动检查）

### 硬规则（违反 = P0，必须修复）

| # | 规则 | 原因 |
|---|------|------|
| 1 | 每页 **1 个视觉重心** | 一个标题、一个数字、一张图、或一个对比 |
| 2 | accent **≤3 次/页** | 60-30-10 法则，不超过 10% 强调 |
| 3 | ALL CAPS 加 `letter-spacing ≥0.06em` | AI 设计最可靠的"指纹" |
| 4 | 大标题 `letter-spacing: 0`，**禁止负 tracking** | 投影/PPTX/中文混排会挤压变脏 |
| 5 | 禁止 Tailwind indigo (`#6366f1` 等) 做 accent | AI 标志性指纹 |
| 6 | 禁止 Emoji 做图标（✨🚀🎯⚡🔥💡） | 用 inline SVG（`references/icon-system.md`） |
| 7 | 禁止紫→蓝双色调渐变做 hero | 扁平面 + 排版层级远胜装饰渐变 |
| 8 | 禁止圆角卡片 + 左侧彩色边框 | 经典 AI dashboard 瓦片 |
| 9 | 正文左对齐，居中**仅**标题/结尾页 | 居中 = 通用无设计感 |
| 10 | 有 tint 的中性色，不用纯灰/纯黑 | 加微量 chroma（oklch ≥0.01） |

**Impeccable 绝对禁令**：side-stripe border（>1px 左/右边框做强调）、ghost card（1px border + 16px+ radius + box-shadow）、over-rounding（border-radius ≥32px，上限 24px）、gradient text、hero-metric template（大数字 + 小标签 + 渐变背景）。`lint-design.js` 自动检测。

### 字体 Reflex-reject（自定义非模板时避开）

> Fraunces · Newsreader · Crimson Pro · Playfair Display · Syne · Space Mono/Grotesk · Inter · DM Serif · Plus Jakarta Sans · Instrument Sans/Serif

5 套种子模板已审查过字体组合，**直接使用**。替代字体表见 `references/impeccable-integration.md`。

### 设计精致度 & 容器处方 & 色彩策略

详细配方移到 `references/design-polish.md`：

- 精致度规则（设计隐喻决定 deck 人格、签名时刻、左对齐+偏移、间距 3 级节奏、微细节、颜色场背景）
- 容器样式处方（数据用实色块、列表用淡底、对比用一侧实色、说明用无容器）
- 色彩策略（Restrained / Committed / Committed+ / Drenched）自动匹配
- 5 个高频"AI 模板感"问题及解法（封面太平、卡片千篇一律、排版无层次、色彩克制、布局重复）
- 布局多样性清单（同一份演示必须含 ≥4 种布局）

## 动效

- 步骤序列：fragment `fade-up`，stagger ≤150ms/项
- 页面过渡：`fade`（默认）
- "惊喜"效果：仅 1-2 页
- Fragment 时长 300-500ms；标题页进入 500-800ms；退出 ~75% 进入时长
- **禁用 bounce/elastic 缓动**
- 支持 `prefers-reduced-motion`（简化为淡入）

动效时机和 6 种高级模式：`references/motion-delight.md`。

## 验证

三层模型，**完整脚本清单、阻断条件表、八门禁对照、impeccable 覆盖映射、G6/G7 分工、评估集成**见 `references/validation.md`：

| 层 | 脚本 | 性质 |
|---|---|---|
| **地板（合规）** | `node scripts/grade-gate.js <file>` 全绿（八门禁 G1-G8 合一） | 硬约束、**机器判 verdict，禁止人工放行**（案例见 `references/validation.md` G5 段） |
| **天花板（设计强度）** | `node scripts/design-strength-check.js <file>` 四维达标 + `node scripts/element-quality-check.js <file>` 元素子分 ≥70 | advisory，任一维不达标 = **回炉重做骨架**，不是微调 |
| **视觉评审** | `node scripts/visual-qa.js <file> --annotate-overflow --show-fragments` 逐页审阅 | 专业/发布会级 P6 必跑；快速模式 ≥12 页或含密集数据时跑 |

**关键认知**：门禁（地板）与设计强度（天花板）不可互替——合规但四维全默认 = 平庸；通过门禁要削弱设计时，找"既大胆又合规"的解（深化专色到 AA / 反相面板），不是改弱求合规。详见 `references/validation.md`、`references/design-fundamentals.md` §6。

调垂直平衡另跑 `node scripts/visual-check.js <file>`（启发式、非阻断，与 visual-qa 冲突时信 visual-qa）。评估框架用 `grade-gate.js --json` 的 `passed` 字段作客观断言。如果未执行验证，在最终回复中**明确说明**。

## 导出

- **PPTX**：HTML 内置按钮（每个标题/段落/列表项 = 独立文本框，完全可编辑）；CLI 备份：`node scripts/export-pptx.js <file>`
- **PDF**：Chrome 打开 `file.html?print-pdf` → `Ctrl/Cmd+P`
- **投影/手机/屏幕共享**适配：`references/technical-specs.md`

## 安装可选依赖

> 生成和查看演示**不需要安装任何东西**。

```bash
bash scripts/install-all.sh    # 一键装所有可选依赖（CLI 导出、Playwright 验证、本地预览）
bash scripts/setup.sh          # 仅环境检查
```

## 参考文件路由（按生成阶段按需加载）

| 何时 | 文件 | 获取 |
|------|------|------|
| **定项目取舍/总流程** | `references/layered-architecture.md` | GitHub 项目调研结论、六层职责、概念交叉索引 |
| **内容预算速查** | `references/content-budget.md` | 画布参数、高度估算表、溢出决策树、VP_TOP 症状、flex label 收缩 |
| **Pin 安全区** | `references/pin-safety.md` | 默认位置、三选一方案、test-pin-collision 验证、装饰白名单 |
| **首稿配方速查** | `references/first-draft-recipes.md` | 常见内容→推荐布局映射表（KPI、列表、时间线、收尾） |
| **写 CSS 骨架** | `references/css-skeleton.md` | 每个 HTML 必含的 6 段 CSS（token / 重置 / 溢出 / 排版 / pin / fragment） |
| **生成设计语法** | `references/design-polish.md` | Theme-to-Design Router、页面原语、种子模板 token、签名时刻配方 |
| **扎设计根（必读）** | `references/design-fundamentals.md` | 设计四维：字体尺度系统、构图张力、专色用色、隐喻→形式生成法。禁令的反面——教怎么长出设计感 |
| **选布局引擎（必读）** | `references/layout-archetypes.md` | 12 个 voice 无关、可组合、带参数的布局 archetype（满版分割/锚点数字/报头封面/对峙对比/机制图…）+ deck 级节奏编排 |
| **选配色字体** | `references/design-principles.md` | 配色方案、字体系统、反模式、文案规则 |
| **构建页面** | `references/layout-patterns.md` | 通用容器（列表/流程/代码/基础网格）；主骨架优先用 archetype |
| **需图标** | `references/icon-system.md` | 85 个 inline SVG 图标 |
| **需图表** | `references/diagram-system.md` | 流程/树/时序/关系/状态图，纯 HTML+CSS+SVG |
| **需数据图** | `references/data-viz.md` | 环形/柱状/进度环/迷你折线/对比条/堆叠条/数字看板/数据表 |
| **需表格** | `references/table-system.md` | data-ink 原则、6 类表格模板、列对齐/行列阈值、chartjunk 反例（系统级，data-viz §8 是单组件） |
| **需图片** | `references/image-system.md` | 6 种滤镜、5 种裁切、设备框、混合模式 |
| **加动效** | `references/motion-delight.md` | 时机、easing 曲线、6 种高级模式 |
| **调垂直平衡** | `references/visual-check.md` | visual-check 指标（重心/跨度/画布）、可接受取舍、假阳性、和 visual-qa 的分工 |
| **配 Reveal** | `references/technical-specs.md` | CDN、插件、三端适配、固定画布 |
| **失败门禁详解** | `references/failure-gates.md` | 13 条门禁完整说明 + 真实重影案例 |
| **验证脚本与门禁（总参考）** | `references/validation.md` | 三层模型、八门禁 G1-G8、完整脚本清单、阻断条件表、impeccable 覆盖映射、G6/G7 分工、评估集成 |
| **模板差异化审计** | `references/template-differentiation-audit.md` | 跨模板相似度审查证据、首页并排对比方法 |
| **专业模式评审** | `references/pipeline-phases.md` | Phase Gate 检查表、发现访谈、P5 分层 |
| **发布会级输出** | `references/launch-grade.md` | golden-reference 对标、页面原型、评分 rubric |
| **使用 impeccable** | `references/impeccable-integration.md` | impeccable 命令到演示场景的映射、色彩策略、字体替代 |

## 成功标准

- [ ] 第一眼就是经过**设计意图**的（不是 AI 模板感）
- [ ] P1 产出了 Theme-to-Design Router 六行说明 + **设计契约**（尺度预设/用色投入/archetype 序列/本主题发明变体），且不是直接套模板
- [ ] 主骨架由 ≥3 种 archetype 组合（非种子原语原样填充），含 ≥1 个本主题发明变体
- [ ] `design-strength-check.js` 四维达标（尺度≥3:1 / 有满版色块面板 / 有非对称分割 / 有主题原生形式）；数字未被软化成"约/持平"
- [ ] `element-quality-check.js` 元素子分达标（动画/图标/表格/流程图均 ≥70）；emoji 不当图标、图标 inline 且主题跟随、表格符合 data-ink
- [ ] 发布会级任务通过了 `references/launch-grade.md` 的 golden-reference、截图和导出门禁
- [ ] 匹配观众和语气，远距离可读
- [ ] reveal.js 运行无布局问题，逐页截图无残影/裁切/按钮污染
- [ ] `test-pin-collision.js` 输出 `OK: all pin regions clear.`
- [ ] 包含运行/导出说明和验证状态
