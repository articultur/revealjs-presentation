---
name: revealjs-presentation
description: |
  Use this skill to create, edit, or export a **slide deck / presentation / PPT / 幻灯片** — multiple slides built for an audience, delivered as one self-contained HTML file (opens in a browser, exports to editable PPTX / PDF). This is the DEFAULT for ANY "make slides" intent, Chinese or English: "做个 PPT / 幻灯片 / 课件 / 汇报 / deck / slides", "整几个 slides", "make a deck", "turn this into N pages / 做成 N 页". It turns a topic, outline, docx, CSV / 数据, report, architecture, incident postmortem, or city / food / travel photos into audience-facing multi-page slides — 述职 / 年终总结 / 复盘 / 答辩 / 架构评审 / 产品发布 / 技术分享 / tech talk / 路演 / 融资 BP / pitch deck / 提案 / 课件. Also use it to fix or extend an existing reveal.js HTML (文字被裁切 / 元素重叠 / 投影显示不全 / overflow / pin overlap), or export a deck to PPTX / PDF. NOT for a single chart, graph, diagram, poster, infographic, landing page, resume, or a plain Word / Markdown / Excel / PDF document.
---

# Reveal.js 演示文稿

生成有视觉辨识度的演示文稿，不是千篇一律的 AI 模板。输出为**单个 HTML 文件**，浏览器打开即用。

## 快速开始

生成一个演示的最短路径（快速模式，适合"做个 PPT"类需求）：

1. **触发**：用户说"做个 PPT / 幻灯片 / 课件"或给出主题。**触发时立刻判别模式**：args/消息含"专业模式 / professional / P0-P6 / 发布会级 / keynote / 惊艳"→ 标记 **Gate 模式**（P1/P3 后强制 STOP 等确认，见下文「Gate 模式硬约束」）；否则快速模式。**Gate 模式必须在回复开头声明**："检测到『专业模式』→ 进 Gate 流程，本阶段输出设计语法后我会停下等你确认，不直接生成。"
2. **确认 4 要素**：主题 · 观众 · 页数 · 语言（缺省：通用观众 / 8-12 页 / 中文）。页数是硬约束——用户给 N 页时最终偏差 ≤1（见 §8）
3. **判断双条件 + 搭骨架**（防"方向完全错了"大返工——跑 `node scripts/generate-ghost-deck.js --json '{...}'` 可机器判）：
   - **路径决策（A/B/C，机器辅助）**：先跑 `node scripts/route-deck.js --topic "<主题>" [--style "<风格词>"] [--wow] [--json]`——seed 命中→A（返回 `seed`）、命中具体 voice→B（返回 `voice`）、`--wow`/命中 `caseRef`/兜底→C，并输出 `reasons` + `acceptance`。**route-deck 只是机器辅助，最终仍按「路径选择」表人工确认**（惊艳轴对机器不可见，要惊艳显式 `--wow`）
   - **弧线路由（机器辅助）**：路径定了接着跑 `node scripts/route-arc.js "<主题>" [--json]`——命中返回 N1-N8 库内弧线（含节奏曲线/禁用节拍摘要，直接喂七行「叙事弧线」行与 brief 三字段）；未命中返回 `invent: true` + 四件套要求 → 走 `references/narrative-arcs.md`「新弧线发明流程」（启发→生成→检验→沉淀），不许默认回落默认节拍
   - **AUTO（一键自动,不确认）**：明确需求（主题+页数+观众+要点 全给）**且**指定模板/风格（"参照 xxx" / template-0X / 或任意风格词如"赛博朋克/和风/金融"——`scripts/voice-router.js` 自动路由到 14 voice 库之一）→ 直接生成 HTML
   - **GHOST（轻骨架预览,5 秒可扫能喊停）**：双条件任一不满足 → 先生成 ghost deck（每页 role + action title + proof object）+ Theme-to-Design Router 七行说明,等用户"继续 / 改 X"才生成 HTML。**Ghost Deck Test**：只读 action titles 应能讲完整故事——读不通先改论证,不进视觉设计

   **图像驱动主题**（城市/旅游/美食/产品实拍,见主题形状表 09 行）骨架前先按 `references/image-driven-deck.md` §4 工作流:列关键词清单 → Wikimedia Commons 搜图 → 选图,再搭骨架（每页绑一张 CC-BY 图）
4. **生成单个 HTML**：内联 CSS+JS、Reveal.js 4.6.0 CDN、1280×720 画布。**弧线→结构映射（advisory，提升叙事质量）**：弧线不是标签——narrative-arcs.md 里每条弧线定义了不同的**页面语法清单**（如 N1 账本审计 = 立据页→对账页→裁决页→封账页；N4 画廊漫步 = 展签页→凝视页→转场页；N9 舞台揭幕 = 幕标页→暗场页→揭幕页→返场页）。生成前建议把弧线的页面语法映射到具体 section 结构：
   - 读弧线定义的页面语法清单（`references/narrative-arcs.md` 对应 N 节，或自定义弧线的 `arcDefinition.pacingGrammar`）
   - 每种页面语法可在 section 级体现不同结构——但**统一视觉语言（如深海全 abyss-panel）也是合法的设计模式**，关键是每页打开后有不同的视觉重心和 proof object，不是 class 名的多样性。统一基底 + 内部变体（如 abyss-panel + biolume-reveal 子组件）完全可接受
   - 可为页面语法选 archetype（`references/layout-archetypes.md` A1-A12）或为本主题发明结构变体作为 section 骨架；也可用统一基底 class + 内部差异化组件
   - **参考指标（不阻断）**：`design-strength-check.js` 的 `structuralVariety` 度量 section 级 class 分布，低于 60 分时检查是否每页真的有视觉区分（内部组件/布局/信息密度差异），而非机械地拆 class 名
5. **Craft pass（工艺补强，防"结构合规但视觉扁平"）**：生成 HTML 后、自检前，检查 `design-strength-check.js` 的 `craftDensity` 子分。路径 A（种子 scaffold）读种子的 CSS 装饰手法（`grep -E 'linear-gradient|radial-gradient|box-shadow|::(?:before|after)' examples/<seed>.html`），给生成 deck 补齐**等量装饰密度**——种子有渐变光效/阴影层次/伪元素签名，生成 deck 也要有对应手法（不是照抄值，是继承装饰语言）。目标：`craftDensity ≥ 对应种子的 50%`（`design-strength-check.js <file> --golden examples/<seed>.html` 比对）。路径 B/C 无种子时要求 `craftDensity ≥ 30`（至少有渐变或阴影层次，不能全平涂）。**不达标的常见修复**：满版色块加 `linear-gradient` 替代纯色、面板加 `box-shadow` 深度、签名组件用 `::before/::after` 加装饰线/角标。
6. **自检（统一验收入口 `node scripts/qa.js <file>`）**：qa.js 一次跑完全量验收——`grade-gate.js` 十四门禁地板全绿（含溢出、对比度、pin、空间完整性、**craftDensity≥10 反扁平地板**）+ `design-strength-check.js` 品质总分 ≥75（天花板：尺度≥3:1、有满版色块面板、有非对称分割、有主题原生形式、**craftDensity 工艺精致度**）+ `element-quality-check.js` 元素子分 + 图像驱动自动 `audit-image-assets.js` + `visual-verdict.js` 视觉语义评审（G1–G14 兜不住的感官类问题：图示不清 / 标签不可读 / 图表不解释主张 / 图片廉价 / 主题割裂）。**无 key / 未 opt-in = UNSKIPPABLE-BLOCKED**（不静默降级）；`generate-deck.js --gates` 只跑地板+design-strength **≠ 全量验收**，完整机制（dry-run / signoff / 路径 × 模式验收矩阵）见 §验证 与 `references/validation.md`，**任何视觉调整后必须重跑**。路径 A scaffold 改写后验收加 `--seed`：`node scripts/qa.js <file> --seed examples/<seed>.html`（skeleton-diff 换皮门禁：骨架相似度 >70% = 硬失败）。
7. **交付**：HTML 路径 + 运行/导出说明 + 验证状态

**模板库外主题**（voice-router 兜底 editorial,如天文学/航空/古典乐/蒸汽波…,不在 10 种子形状也不在 14 voice）**或要求"惊艳/设计感/发布会级"** → 走**路径 C B 解法**（[`references/design-generation-workflow.md`](references/design-generation-workflow.md):审美意图先行 + 外部大师参考禁 template + 审美推导 + 减法 + impeccable 打磨,见下文「路径选择」）。不套种子/voice,从主题现实视觉文化推导生成。

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
| 2. 风格系统层 | 主题原生设计语法、风格候选(先翻 [`references/inspiration/`](references/inspiration/) 15 风格分类选 1-2 个,查 case 借技法 → 落 [`tokens/`](tokens/) primitive;**风格不在覆盖时走 style-gap 四件套:case + token + content rewrite + layout variant,不硬套最近 template**,见 [`references/off-template-style-gap.md`](references/off-template-style-gap.md))、图表样式、Bento / 页面原语 |
| 3. 表达逻辑层 | ghost deck、action title、论证结构、图表注释、引用规范 |
| 4. 审美约束层 | 反 AI 模板味、字体 / 色彩 / 布局变化、bolder / quieter / distill / polish |
| 5. 质量审查层 | 层级、可读性、对齐、坐标系完整性、拥挤、可访问性、响应式 / 导出风险 |
| 6. 任务治理层 | brief、goals、ledger、checkpoint、steering、final gate |

### 四套质量体系（何时用哪个）

| 体系 | 规模 | 何时起作用 | 强制级 |
|------|------|-----------|--------|
| 关键约束 | 9 项（§1-§6 由脚本联合检查，§7-§9 为流程指南） | 生成 HTML 前（P4 / 快速模式） | 硬约束 |
| 设计硬规则 | 10 条 | `lint-design.js` 检查 | P0 必修，P1/P2 建议 |
| 失败门禁 | 19 条 | 全流程质量底线 | 触发即阻断交付 |
| Phase P0-P6 | 7 阶段 | 专业模式流程 | 每段 Gate 确认 |

十四门禁（G1 lint → G2 validate → G3 label-overlap → G4 lint-main-claim → G5 evidence-ledger → G6 color-role → G7 contrast-aa → G8 canvas-fill → G9 check-overflow → G10 spatial-integrity → G11 text-break → G12 design-strength → G13 text-collision → G14 pin-collision，详见 §验证）自动覆盖关键约束与设计硬规则；失败门禁由十四门禁及 test-pin-collision / test-reference-contract 等专项脚本联合检查。三种模式的叠加关系见下表。

### 三种工作模式

| 模式 | 何时用 | 行为 |
|------|--------|------|
| **快速模式（默认）** | 用户只说"做个 PPT"或没具体要求 | 收集 4 要素 → 轻量 ghost deck + 设计语法 → 直接生成 HTML → **craft pass（补齐 CSS 装饰密度）** → `qa.js` 全量验收（含十四门禁地板 + craftDensity 反扁平地板）→ 交付说明；不强制 7 题访谈 |
| **专业模式** | 用户要精细控制或明确要求评审 | 走 7 阶段 P0-P6，每段获 Gate 确认。详见 `references/pipeline-phases.md` |
| **发布会级模式** | 用户说"发布会级"/Keynote/品牌开场/惊艳/顶级/public launch/产品发布，或要求接近品牌介绍页 / 发布会开场这种质量 | 先读 `references/launch-grade.md`。输出前必须完成：storyboard、golden-reference 对标、逐页截图审阅、PPTX 导出证明、`node scripts/test-launch-grade-contract.js` |

| 专业模式 Phase | 名称 | 类型 | 核心任务 |
|:-----:|------|:----:|------|
| P0 | 设计上下文 | ● | 风格(先翻 [`references/inspiration/`](references/inspiration/) 选 1-2 个 → 查 [`tokens/`](tokens/) 有无对应 primitive;若风格/内容不在覆盖范围,按 [`references/off-template-style-gap.md`](references/off-template-style-gap.md) 补齐 case + token + content rewrite + layout variant)、色彩、字体方向 |
| P1 | 需求+设计语法 | ● | 场景/时长/听众 + ghost deck + Theme-to-Design Router 七行说明 + **内容-版式贴合度预检**（内容形状 / 主 proof object / 版式为何服务它）+ **元素语义策略**（每页元素清单 / 动画解释任务 / 必须或禁用的元素族）+ **动效决策**（按 §动效决策清单,定每页动效类型:无 / fragment 逐步 / CSS 循环 / CSS 进场;循环 ≤3 处/deck,fragment ≤30% 页面;过"关掉测试"）。**⚠ 输出后必须 STOP，等用户"继续 / 进 P4 / 改 X"才能生成 HTML——擅自生成 = 违规** |
| P2 | 输出方案 | ◐ | 内容结构、视觉方向 |
| P3 | 设计评审 | ● | 反模式检查 + **内容-版式贴合度评审**（proof object 是否解释主张 / 是否内容被硬塞进模板 / 版式不解释主张）+ **内容-元素贴合度评审**（元素是否解释 action title / 动画是否解释机制而非装饰 / 图标、表格、图片、代码是否抢主 proof object）+ 优化方向。**⚠ Gate 模式下输出后必须 STOP，等用户确认优化方向** |
| P4 | 生成初稿 | ● | 先读 `references/element-semantics.md` 做元素语义路由,显式分派 13 类元素: proof object / motion / icon / table / data-viz / diagram / image / code / metric / quote-evidence / annotation / page furniture / whitespace,再加载对应专项文件。**按 P1 动效决策**给适当页面加动效(加载 `references/motion-delight.md` 对应 recipe:fragment 逐步揭示工艺/堆叠、CSS 循环 flow/pulse/glow 给持续传输/传导页、CSS 进场 grow 给对比条;封面/void-page/精确数据页不加;SVG 元素 fragment 用纯 opacity 禁 transform)。**两条路径**:**内容在 10 template 覆盖** → 套 template 但重写 proof object 和页面骨架;**不在覆盖** → 先声明 style gap → `scripts/content-router.js` 路由 archetype(A1-A12 + 主题变体)→ `scripts/generate-archetype-deck.js`（或统一入口 `scripts/generate-deck.js`，voice 缺省时 `voice-router.js` 自动推断）生成(四层架构闭合,见 [tokens/README.md](tokens/README.md) 与 [`references/off-template-style-gap.md`](references/off-template-style-gap.md))。两种都过 **十四门禁**(`grade-gate.js` 全绿 = G1-G14 全过;机器判 verdict,不可手动放行) |
| P5 | 优化迭代 | ● | 按规模执行优化（详见 references/pipeline-phases.md「Phase 5」） |
| P6 | 最终检查 | ◐ | 专业/发布会级必跑；快速模式 ≥12 页、密集数据或视觉结构调整时跑；复核**视觉语义与内容-版式贴合度/内容-元素贴合度**，确认每页元素清单服务 action title；`visual-verdict` 或人工审阅有 blocker 就回 P3/P5 |

● 必须完成　◐ 可跳过　/　刷新已有演示：跳过 P1，从 P3 开始评审

### Gate 模式硬约束（防跳步 · 2026-06 新增）

**判别**：args / 用户消息含"专业模式 / professional / P0-P6 / 发布会级 / keynote / 惊艳"→ 标记为 **Gate 模式**。

**硬约束**——Gate 模式下：

- **P1 输出设计语法（七行 + 契约 + ghost）后必须 STOP**，等用户显式确认（"继续 / 进 P4 / OK / 改 X"）才能进 P4 生成 HTML
- **P3 设计评审后必须 STOP**，等用户确认优化方向
- **擅自生成 HTML 或一口气跑完 P0-P6 = 违规失败**，无论 deck 质量多高
- 快速模式（默认）不 STOP，一次产出

**触发时声明**：Gate 模式被触发，回复开头必须声明判别结果 + "本阶段输出后会停下等确认"，让用户知道掌握控制权。

> **这条是元规则**：我（Claude）曾在专业模式下跳过 Gate，一口气生成 + 自行改门禁，把用户控制权吃掉。本节就是为防止再犯而设——下次 Gate 模式触发，撞见这条必须 STOP。

## 关键约束（生成 HTML 前必须先确认）

这一节是 P4 / 快速模式生成前的"过桥清单"，下面任意一条不满足都会在 lint / validate / label-overlap / lint-main-claim 中被拦截。**生成代码前先在脑里把这九项过一遍**。

### 1. 输出形态硬约束

- **单个自包含 HTML 文件**，不拆分 CSS/JS
- **Reveal.js 4.6.0 CDN**：`cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/reveal.{css,js}`。SRI 策略（JS 加固定 SRI、**CSS 不加**——被 hook 提示缺 integrity 时别盲目给 CSS 补，hash 错触发 CSP 拦截致视觉崩坏）详见 `references/technical-specs.md`「CDN SRI 策略」
- **Google Fonts**：按设计语法选择，`<link>` 引入
- **CSS 全部内联**在 `<style>` 中，用 `--c-*` / `--f-*` token；骨架见 `references/css-skeleton.md`
- **每页一个 `<section>`**；section 级 flex/grid 必须用 `class="deck-flex"` / `class="deck-grid"`——reveal 会把 present section 的 inline `display` 改成 `block`，**写在 stylesheet 里的 `display:flex` 会被静默覆盖成 dead code，你以为在居中其实没有**；只有 `deck-flex`/`deck-grid` 类才能在 reveal override 后重新生效
- **图标用 inline SVG**（`references/icon-system.md`），不用 Font Awesome、不用 Emoji 当图标
- **不引入 Tailwind 或任何 CSS 框架**：框架类名是 AI 模板味来源，且单文件自包含 + PPTX 导出要求 CSS 全可控——手写 `--c-*`/`--f-*` token 才能贯彻设计语法
- **禁止 `vw`/`vh` 单位**：Reveal 用 `transform: scale()` 缩放，vw/vh 不受影响 → 大屏溢出/小屏不可读；字号用 `em`/`px`（详见 `references/technical-specs.md`）
- **Reveal 配置**：`{ width: 1280, height: 720, margin: 0.04, hash: true, slideNumber: 'c/t', transition: 'fade' }`
- **页面过渡只用 `fade`/`slide`，禁 `convex`/`concave`/`zoom`**：3D 过渡给页面套透视，扭曲 `getBoundingClientRect` → `visual-check.js` 报画布尺寸混杂。所有页画布尺寸必须一致（**G8** `test-canvas-fill.js` 机器查）。要"活泼"用 fragment 动效，别换过渡（详见 `references/visual-check.md`、`references/motion-delight.md`）
- **交付前必须过十四门禁**：`grade-gate.js <file>` 全绿（见 §验证）。P4 生成后立刻跑，任一红灯 = 回 §2 拆页/降文字/重绑坐标系
- **切勿 `!important`/强选择器覆盖 section `position`** → section 进文档流垂直堆叠、被 overflow:hidden 截断、除首页外全空白；present 垂直居中用 `.reveal section.present{display:flex!important}`，别 blanket-force（机理详见 `references/css-skeleton.md`）
- **Pin 定位上下文**：pin 相对最近 positioned 祖先（reveal 的 absolute section）；若 section 退回 static，pin 相对 BODY 全叠视口左下角 → `test-label-overlap` 报泄露
- **字体 fallback 防 FOUT 重叠**：`font-family` 栈在 generic fallback（`sans-serif`/`serif`）前带窄体 fallback（`'Arial Narrow'`/`'Helvetica Neue Condensed'`）；大字（≥3em）与角元素（stamp/pin/photo-credit/角标）水平间距 **≥50px**。`test-font-loading.js` 检测（宽度差 >15% 或间距 <50px = warning；0px 实质重叠 = blocker），`auto-fix.js` 兜底注入（默认 dry-run 只报告，`--write --inject-font-fallback` 落盘，默认关因改全部 font-family 影响 voice）
- **section reset 吞 margin-top（静默无报错）**：模板通配 reset（如 `.reveal section > *:not(svg):not(.deco){margin-top:0!important}`）会清零 section 直系子元素 class 里的 `margin-top`——无报错、无 lint 拦截，直接标题压内容/内容压 nav。直系子元素垂直间距**必须 inline `style="margin-top:Xpx!important"` 或 padding**，不写在 class 里（机理 + 案例见 `references/layout-patterns.md`「文字防碰撞规则」）
- **文字断行（G11 · 用户最痛「一个词/句号变两行」）**：标题 h1-h3 默认 `word-break:keep-all; overflow-wrap:anywhere; text-wrap:balance`（keep-all 防 CJK 拆字、anywhere 兜底防溢出、balance 均衡行宽）；**末尾标点「。」「，」用 `<span style="white-space:nowrap">词。</span>` 绑定前词**防孤标点甩下行；数字+单位、`<em>`/标签 `white-space:nowrap`；**避坑** `break-word/break-all`（肢解英文词）。⚠ `text-wrap:pretty` 实测**不能**解决中文孤标点——必须 `nowrap` 绑定。G11 五层检测（L1 数字/英文 + L2 孤字/孤标点 + L3a 中文词 + L4 避头尾）见 `references/failure-gates.md` §19

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

### 6. Proof object 坐标系完整性

有物理表面隐喻的页面（图纸/地图/仪表盘/白板）必须把**承载面**和 proof object 绑定到同一坐标系。优先级：同容器 > 同 CSS 变量 > 禁止 absolute 背景 + sibling `%`/`px` 混算。SVG `<text>` 须落在 viewport 内（`text-anchor="end"` 或扩 viewBox，不靠 overflow:hidden 截）；`<text>` 取消 `stroke`（`.reveal svg text { stroke:none; paint-order:fill; }`）；数据趋势线禁用 `T` 曲线（末端上翘），用 `polyline` 或 `C` 三次贝塞尔。`test-spatial-integrity.js` 阻断：图形漂出承载面、SVG 裁切/继承描边、T 曲线。种子物理版面契约写入 `references/template-invariants.json` 的 `physicalContract`。

### 7. 首稿配方速查（让一稿落地更近）

常见内容 → 推荐布局映射表，先按配方落地再根据 lint/validate 反馈调整。详见 `references/first-draft-recipes.md`。

### 8. 封面右侧平衡（editorial-serif / minimal 模板高频遗漏）

左对齐封面常见问题：**主标题靠左下，右上 / 右半屏完全空白** → 视觉重心失衡。三选一补平衡——**装饰元素必须承载信息（编号/日期/类目/样本），绝不能是无意义图标**：

| 方案 | 实现 |
|------|------|
| (a) Stamp / 印章 | 右上角 `<span class="stamp">NO. 026 · CATALOGUED</span>`（编号·类目），旋转 -3deg |
| (b) Poster wall / 拼贴墙 | 右侧 320×420px 区域放 3×4 色块网格，几格 SVG 几格留白 |
| (c) Sample tag / 标签卡 | 右下散落 2-3 张轻微旋转的标签卡（带类目和标号） |

完整范本：`examples/template-01-editorial-serif.html` 封面（左主标 + 右色块墙 + 右下信封 + stamp）；配方见 `references/design-polish.md`。

### 9. 页数目标对齐（用户说"N 页"就是 N 页，不是 N-3）

用户给页数时，最终 `<section>` 数与目标偏差必须 **≤1 页**。**内容预算（§2）管单页密度，不是总页数**——根因是"先紧后松"被误读成"页数也紧"；页数不够就拆页（多一页留白比挤一页强），不要靠删内容凑数。执行三步：

- **生成前**：在 Theme-to-Design Router「页面骨架」行写明 `[目标 N 页] + 页面原语清单`，按 N 原子化规划每页
- **生成后**：`grep -c '<section>' <file>` 核对实际页数，偏差 >1 必须补页（章节分隔 / proof object / takeaway / 对比页是天然补页候选）或删页
- **用户没给页数**：默认 8-12 页，按内容密度定，**不要默认压到下限**

### 10. Section 级视觉差异（advisory · 2026-07）

统一视觉语言（如深海全 abyss-panel）≠ 同质化——前者是有意图的一致性，后者是偷懒。`structuralVariety` 度量 section class 分布（不阻断）：判断标准不是 class 名多样性，而是每页打开后视觉重心/信息密度/proof object 是否可区分。统一基底 + 内部变体（abyss-panel + biolume-reveal）完全可接受。

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
- **少用 em-dash（— / ——）做句中连接**：impeccable audit 把"句子里反复用破折号连接从句"列为 AI 文风指纹。中文 `——`、英文 ` — ` 作连接，一页超过 2–3 次就成节奏 tell。改用逗号、冒号、句号或分号。结构性的 `—` 不算（表格无数据 `<td>—</td>`、编号标签 `ed.01 — Pilot`、装饰 `<span>—</span>`）。

## Theme-to-Design Router

模板不是最终目的，只是已经验证过的设计语法 seed。每次生成前必须先产出一段**设计语法说明**，再决定复用、改造或新建。

### Style Gap 硬约束:模板外内容不硬套

内容不在 10 seed 覆盖范围,或最近模板会让主题错位 → 进入 [`references/off-template-style-gap.md`](references/off-template-style-gap.md)。**PPT 服务于内容,不是内容服务于模板**。Style gap 须补齐四件套(inspiration case + token primitive + content rewrite + layout variant ≥3 archetype 含 ≥1 发明变体),并在七行说明外附 Style-gap Router 声明(模板见 off-template-style-gap.md)。如果 visual-verdict 指出”风格冲突/内容被硬塞进模板”,先回四件套修 content rewrite 或 layout variant,不要只换颜色和字体。

### 路径选择：种子快速 / 组合通用 / B 解法生成（模板库外或要求惊艳）

三条路径，按"主题是否在模板库内 + 是否要求惊艳设计感"选：

| 路径 | 何时用 | 怎么走 | 机器入口 |
|---|---|---|---|
| **A. 种子快速** | 主题形状命中下表 10 行（历程/系统/结构/发布/田野/宣言/创意/平台/图像/临床） | 选种子 voice → 套 layout archetype（不原样套模板，见「voice / layout 解耦」） | `node scripts/route-deck.js --topic "<主题>"` seed 命中 → `path: A` + 返回 `seed`；`generate-deck.js` seed 短路走 scaffold 复制（标 `requiresRewrite`，须重写 ≥2 个 role 骨架，见「voice / layout 解耦」） |
| **B. 组合通用** | 风格/主题不在 10 形状但**在 14 voice 覆盖**（金融/教育/融资/极简…，voice-router 命中具体 voice 非 fallback） | `node scripts/voice-router.js "主题/风格词"` 选 voice → `node scripts/generate-deck.js` 组合 archetype → `node scripts/qa.js <file>` 全量验收（**不得止于 `--gates`**，验收矩阵见 `references/validation.md`）。加新 voice = `tokens/voices.json` 加一条 + `build-voice-tokens.js`（见 [`references/style-space.md`](references/style-space.md)） | `node scripts/route-deck.js --topic "<主题>"` 命中具体 voice → `path: B` + 返回 `voice` → `node scripts/generate-deck.js --input deck.json`（voice 缺省自动推断） |
| **C. B 解法生成（模板库外 / 要求惊艳）** | 主题**不在 10 形状也不在 14 voice**（模板库外：天文学/航空/古典乐/蒸汽波/赛博朋克…），**或用户要求"惊艳/设计感/发布会级"** | 走 [`references/design-generation-workflow.md`](references/design-generation-workflow.md)：**审美意图先行**（一个具体情绪+签名时刻+极端对比）+ **外部大师参考**（主题的现实视觉文化，**禁读 template/voice 套用**）+ **审美推导为什么美** + **减法生成**（不填 6 维清单，6 维事后验收）+ **impeccable 打磨**（截图迭代）。不套种子/voice，从外部大师推导。case 库 `references/seed-gallery/`（`voice-router.js` 命中沉淀 case `tokens/seed-cases.json` → 返回 `caseRef` 参考 DNA：本草纲目 / JWST 星云 / 纪念碑谷…，**不套 HTML**，B 解法参考其决策 + 字体/签名/材质；新 case 注册：`SEED-CASE-INDEX.md` 加行登记（强制第①步）+ case.md + seed.html + seed-cases.json 加一条 + 跑 `check-seed-collision.js`）。 | `node scripts/route-deck.js --topic "<主题>" --wow` / 命中 `caseRef` / voice-router 兜底（非具体命中，显式指路 C，不再称「适配多数主题」）→ `path: C` → [`references/design-generation-workflow.md`](references/design-generation-workflow.md) |

> **惊艳轴对机器不可见**：route-deck 只从主题/风格词判径，"惊艳/设计感/发布会级"是审美要求不是主题信号，机器判不出——要求惊艳必须显式 `--wow` 声明，否则主题命中 seed/voice 时会落 A/B。

**关键认知（B 解法是核心能力，种子/voice 是兜底）**：种子/voice 库（10 template + 14 voice）是**已覆盖兜底 + case 参考**，不是表达天花板。**真正"适配任意主题"靠 B 解法（设计能力）**——任意主题（含模板库外），从外部大师作品推导，不套用。路径 A/B 是已覆盖主题快速用；**路径 C 是模板库外或要求惊艳的核心能力**（风格任意时不要硬套最近模板/voice，走 C 从零生成）。voice（风格肤色：配色/字体）× archetype（版式构图：张力/节奏）**正交组合 = 14 × 12 表达空间**，且 voice 可任意扩展（加一条 JSON 即可）。"做个赛博朋克 PPT" 默认走路径 A（形状命中 dark-tech 种子；`route-deck.js` 返回 path A + seed template-02-dark-tech），要求惊艳则 `--wow` 走路径 C；只有纯风格主题（蒸汽波/金融台账等非种子形状）才走路径 B（voice-router 路由到对应 voice + archetype 组合，或新增 voice primitive）。**PPT 服务于内容，不是内容服务于模板**——风格任意时硬套最近模板是比"发明新 voice"更大的失败（呼应失败门禁 #9）。

### 第一步·选种子：按主题"形状"，不按行业关键词

选模板看主题的**形状/动作**，不是行业关键词——同行业的两个主题可能要不同模板（"AI 历史"是历程→01，"AI 系统"是系统→02）。先走下表，命中后**种子只提供 voice（配色/字体/语气 token），布局来自 archetype 引擎库**（见下「voice / layout 解耦」）。

**voice / layout 解耦（表达能力的核心）**：种子 = voice（配色+字体+语气），archetype = layout（构图+张力+节奏）。两者解耦组合，表达空间从"死模板"炸开成"N 声音 × M 版式"。**禁止把种子的布局原语原样当骨架填充**（直接套 folio-grid/plate-grid 不改结构 = 门禁 #9 换皮）；主骨架必须由 `references/layout-archetypes.md` 的 ≥3 种 archetype 组合，其中 ≥1 种是**为本主题发明的变体**。**与 scaffold 复制模式的关系**：`generate-deck.js` 的种子 scaffold 模式（复制种子 HTML 作起点）与"禁止原样填充"不矛盾——scaffold 只提供 voice/签名原语起点（配色/字体/签名组件的精致底子），**不是交付物**；输出标 **`requiresRewrite: true`**，必须重写 cover/proof/mechanism/close 中 **≥2 个 role 骨架**（只换文字/配色 = 换皮，即门禁 #9「重写 2/4 骨架」，见 `references/failure-gates.md` §9）。机器验证：`node scripts/skeleton-diff.js <deck> --seed examples/<seed>.html --gate`（骨架相似度 >70% = 换皮嫌疑 exit 1）。

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
| 讲**城市 / 旅游 / 美食 / 产品实拍**（图像即内容，实景是 proof object） | **09** editorial-photo |
| 讲**临床试验 / 监管 dossier / 疗效与安全性证据**（监管提交，数据即 proof object） | **10** clinical-trial |

**歧义判据**（一行沾两样时，看主命题动词）：讲发展/讲故事 → 历程(01)；讲怎么跑/排障 → 系统(02)；讲怎么搭/组成 → 结构(03)；讲登场/亮相 → 发布(04)；**看长什么样（实景是 proof）→ 图像(09)，看多大/多少/怎么跑（数据/论证是 proof）→ 版式(01-08)**。同名主题看主命题：杭州风光→09，杭州经济/历史→01/03；产品实拍→09，产品架构→03；餐厅品牌册→09，餐厅经营数据→02。图像驱动先读 `references/image-driven-deck.md` 按 §4 工作流搜图（Wikimedia Commons），再排版。

**worked example**：`AI 大模型发展史` → 历程 → **01**（不是 02：虽是技术，主干是"编年"不是"系统运行"）；`单体→三层架构迁移` → 结构 → **03**；`新产品发布会` → 发布 → **04**；`SRE 故障复盘` → 系统 → **02**。

**不硬套（硬约束）**：10 个形状都不沾（如纯金融台账、法律案卷、天文学科普——临床实验报告已由 template-10 覆盖，不算），或命中形状但视觉隐喻会讲偏,就进入 Style Gap 路径（见上）。说清"为什么现有种子都不行",再新建一次性语法或 archetype 变体。把内容塞进不合适的种子比新建更糟——硬套是比"发明癖"更大的失败。

### 必填七行（P1 结束前完成）

```text
主题本质：这不是在讲 ____，而是在讲 ____。
观众张力：观众当前相信/担心 ____，演示要让他们 ____。
设计隐喻：本 deck 像一个 ____，而不是一个普通 slide deck。
叙事弧线：本 deck 走 ____ 弧线（references/narrative-arcs.md 9 条之一或自定义；机器入口 `node scripts/route-arc.js "<主题>"`，未命中走「新弧线发明流程」），节奏曲线 ____，禁用节拍 ____。
页面骨架：[目标 N 页] · 主要使用 ____ / ____ / ____ / ____ 这些页面动作（N 页数见 §8）。
Proof object：必须可视化证明 ____，不能只写成 bullet。
禁止套路：不能使用 ____，因为它会把主题讲偏或变成通用模板。
```

**生成方法**：抽主题本质（动作/冲突，不是名词）→ 找观众张力（怀疑/疲劳/陌生/兴奋/需决策）→ 选设计隐喻（控制室/档案馆/舞台/实验台/地图/交易大厅/导演分镜/工坊白板）→ 定义 4-6 种页面原语 → 绑定 proof object → 派生视觉系统（颜色/字体最后才决定）。完整说明：`references/design-polish.md`。

### 设计契约（必填，P1 结束前与七行一起产出）

七行说明定"讲什么"，设计契约定"长多大胆"。把野心写成可承诺、可度量的决策，避免"边写边默认最保险的值"（这正是合规 deck 退化为平庸的根因，见 `references/design-fundamentals.md` §0）。四项必填：

```text
尺度预设：newspaper-dramatic(≥5:1) / launch-bold(~4:1) / editorial-quiet(~3:1)
用色投入：spot-1(克制) / spot-2-bold(含满版色块面板) / ink-drama(深色满版+专色glow)
archetype 序列：每页分配一个 archetype（A1-A12，见 layout-archetypes.md），≥3 种、无连续 2 页相同
本主题发明变体：≥1 个为本主题调参/改结构的 archetype（不是照抄）
```

**退化拦截**：生成后跑 `node scripts/design-strength-check.js <file>`。四维（尺度对比/用色投入/构图张力/隐喻贯彻）任一不达标，**回炉重做骨架，不是微调**。典型退化信号：全 deck display ≤2.5em（尺度太平）、无任何满版色块面板（用色显平）、全是通用卡片无主题原生形式（隐喻没贯彻）。**图像 deck 特别注意**：满版照片不算色块——colorCommit 扫的是 commit background 声明密度（÷ 页数），照片顶替不了。图像 deck 要 colorCommit ≥60 得靠**色块密度**：≥1 页满版色块锚点（`image-driven-deck.md` IP6）+ 数据 / 标签实色 chip + kicker 色带一起上（单独锚点不够，需 chip 密度叠加）。

### 匹配规则

按主题形状选种子后：自然落入 → 替换内容原语和 proof object；部分匹配 → 借 scaffold 改写隐喻/骨架；不匹配 → 新建语法别硬套；品牌/参考图 → 从行为和语气抽隐喻不只吸色。**新语法最低要求**：1 隐喻 + 4 页面原语 + 1 签名时刻 + 1 token 套 + 3 禁用套路 + 1 验证问题（去色去字体后仍属本主题？）。Style gap 还须有 inspiration case + content rewrite + layout variant。

### 反 editorial 收敛（设计从主题生长，不是 template-01 换皮）

template-01（editorial-serif）是旗舰，base.css / 共享骨架 / archetype 库 / design-polish 配方都偏 editorial——它是**引力中心**。最大退化：任意主题都套 editorial 外衣（serif + 左对齐 + kicker 眉标 + 报头/印章/角标/登记轴 + 档案馆气质），只换颜色和主题文字。这就是"**颜色和主题是贴上去的、不是长出来的**"——失败门禁 #9 的**审美语言维度**（skeleton-diff 只查 HTML 结构相似度，查不到审美语言恒为 editorial）。

**硬约束**：

- **editorial-archive 构件**（`plate` / `folio` / `ledger` / `stamp` / `masthead` / `register-axis` / `colophon` / `signoff` / `poster-wall` / `lede` / `catalogue`）**只在 editorial 原生主题**（历程 / 历史 / 档案 / 复盘 / 编年 / 展览 / 策展）用。非 editorial 主题（天文 / 融资 pitch / 金融 / 医疗 / 产品…）用这些构件 = 设计没从主题生长。
- **共享骨架 page-furniture**（`kicker` 眉标 / `pin` 角标 / `evidence-label` 源标）是 editorial 排版惯例——非 editorial 主题别三件套全上。
- **"去色去字体后仍属本主题"是硬契约**（不再是 advisory）：去掉颜色字体，页面结构仍要属于本主题——JWST 该有望远镜/蜂窝镜/光谱构件，pitch 该有终端/漏斗/数据构件，不能仍属 editorial 档案馆。
- **路径 C 必斩共享骨架**：模板库外 / 惊艳主题禁用 assembleDeck 共享基底类，必须 bespoke HTML，结构从外部大师推导（不只换色字）。

**机器门禁**：`node scripts/qa.js <file> --topic "<主题>"` 跑 `check-editorial-contamination.js`——非 editorial 主题污染超阈（archive 构件 ≥2，或 1 archive 构件 + serif 展示字佐证）= **FAIL，与 grade-gate 红灯同级**。计分语义：**editorial 皮 = archive 词汇**；serif 展示字与 furniture 三件套（kicker/pin/evidence-label,生成器给所有 voice 统一注入）不是 editorial 独有信号,只在 archive 命中时作佐证加分,archive=0 时不计入（合法 voice 如 consulting 的 serif/印签不被误杀,其签名类用 `memo-seal`/`seal` 词表外词汇）。editorial 原生主题用 `--editorial-topic` 豁免；传 `--topic` 不传则读 `<title>` 兜底。自检：`node scripts/check-editorial-contamination.js --selftest`。

### 设计强度三拨盘（density / variance / motion）

每份演示在生成前明确 density / variance / motion 三个维度强度（1-5），写进 Theme-to-Design Router 的"页面骨架"行。完整拨盘表（低/高对照）+ 模式对应（快速=中中低 / 专业=按主题 / 发布会级=中高高）见 `references/design-fundamentals.md` §设计强度三拨盘。

### 图表 / Bento 取舍

本项目优先保持单文件 HTML 和导出稳定。场景 → 选择映射表（KPI/趋势 → 纯 CSS-SVG；流程/系统 → diagram-system；密集数据 → 拆页,Bento 只作单页原语；地图/网络 → 静态 SVG 避免导出失真；严格表格 → 减内容不缩字号）见 `references/data-viz.md` §图表/Bento 取舍。

### 失败模式门禁（§1-15 速查 + §16-19 新增，完整说明见 `references/failure-gates.md`）

| # | 门禁 | 一句话 |
|---|------|--------|
| 1 | 原生语法 | 品牌/平台 deck 必须有该对象的界面证据，不只是"科技感/年轻化" |
| 2 | 审美通道 | 用 Fraunces/DM Sans/玻璃卡/通用渐变要先说明为什么主题就是这个媒介 |
| 3 | 证据台账 | 所有精确数字必须标英文 `verified / user-provided / illustrative`（**G5 只认英文关键词**，中文"已核实/示意"不算）；"公开披露"不够 |
| 4 | 主命题进场 | pin/页码不能承担本页唯一主题；主视觉区必须读得到主命题 |
| 5 | 颜色角色 | 主命题用最高层级颜色；强调色不做随机高亮 |
| 6 | 密度溢出阻断 | `validate.js` `total > 0` = 必须修复；拆页优先（见 §2 优先级） |
| 7 | 截图复核 | 视觉调整后重跑 `visual-qa`；不要用"代码合理"代替截图 |
| 8 | fragment 首屏 | 初始截图必须有可读核心结论，不能全藏在 fragment 后 |
| 9 | 骨架换皮门禁 | 同一套"左标题 + 右图形"换 5 套颜色 = 失败；class 名要反映主题对象 |
| 10 | 跨模板相似度 | 5-10 张首页并排，去色后还像同一套 = 失败；金融像 cockpit，城市像 GIS |
| 11 | 种子模板对象契约 | 维护已实现的 `examples/template-01..10` 必须通过 `test-reference-contract.js` |
| 12 | 高风险布局预警 | 2×2 + 长标题、4-8 卡、密集时间线 + fragment 都易溢出，先用紧凑版 |
| 13 | **Pin 安全区** | 必须跑 `test-pin-collision.js`，OK 才能交付；详见上文「关键约束 §3」 |
| 14 | **空间完整性** | proof object 必须和承载面共享坐标系；SVG 文字不得裁切/继承描边；数据趋势线禁用会反射上翘的 `T` |
| 15 | **视觉语义评审** | 图示/图表页跑 `visual-verdict.js`；blocker 必须修，dry-run 不等于模型通过 |
| 16 | **结构同质化（advisory）** | structuralVariety 度量 section 级 class 分布——**仅 advisory 参考，不阻断**。统一视觉语言（如深海全 abyss-panel）≠ 同质化，机械指标无法区分，需人工判断 |

> 表速查 §1-15 阻断门禁 + #16 advisory；**完整 19 条**（§16 自愈边界 / §17 AI 味 / §18 字体闪烁 / §19 文字断行=G11）见 `references/failure-gates.md`。"19 条"= failure-gates.md 的 19 个阻断门禁总数。

## 种子模板（10 套已实现）

每个模板在 `examples/template-01..10-*.html` 有完整示例，class 命名和领域对象登记在 `references/template-invariants.json`。**使用种子模板时必须改变叙事结构和页面骨架，不只换字体/颜色/背景**（失败模式 #9）。

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
| `template-09-editorial-photo` | 杂志大片 / 城市画册（满版照片封面、图文对开、网格画廊、图+数据锚点） | 城市、旅游、地产、美食、产品摄影、活动纪实 |
| `template-10-clinical-trial` | 临床试验 / 监管 dossier（dossier masthead、试验臂 arm-rail、试验设计矩阵、CR/PR/SD/PD 响应堆叠、Kaplan-Meier 曲线、亚组 forest plot、安全性矩阵） | 临床试验 topline、监管简报、疗效证据 dossier、医学科学交流 |

> design-polish.md 登记 10 套设计语法（金融终端、临床实验室、城市基建、法律案卷、奢侈工坊、影视分镜、动画节奏、系统流程、代码走查、数据可视化），其中**临床实验室（clinical-lab）已落地为 `examples/template-10-clinical-trial.html`**，其余 9 套仍为扩展参考、尚未落地为种子 HTML。design-polish.md 的 "Template 06-15" 是逻辑章节序号，不对应 `examples/` 文件（注：`examples/template-09` 是 editorial-photo、`examples/template-10` 是 clinical-trial，均与 design-polish 章节号无关）。

### 已知局限（高几何精度风格 + 全局防溢出）

建筑制图 / 紧凑 dark-tech 风格的几何精度溢出风险用**四层防御**（设计层 / 引导层 / harness 兜底 / js 脚本检查）系统化拦截。完整四层说明 + impeccable false-positive 提示（template-03 的 em-dash 与 PLATE 编号是建筑制图固有产物,非 AI tell）见 `references/failure-gates.md` §四层防御。

## 设计规则（lint 自动检查）

`lint-design.js` 自动检测 10 条硬规则（P0 必修）：每页 1 个视觉重心 · accent ≤3 次/页 · ALL CAPS 加 letter-spacing ≥0.06em · 大标题禁止负 tracking · 禁 Tailwind indigo · 禁 Emoji 当图标 · 禁紫蓝渐变 hero · 禁圆角卡片+侧边框 · 正文左对齐 · 中性色加 tint 不用纯灰。**Impeccable 绝对禁令**：side-stripe / ghost card / over-rounding(≥32px) / gradient text / hero-metric template。

**字体 Reflex-reject**（自定义时避开）：Fraunces · Newsreader · Crimson Pro · Playfair Display · Syne · Space Mono/Grotesk · Inter · DM Serif · Plus Jakarta Sans · Instrument Sans/Serif。种子模板已审查，直接使用。替代字体表见 `references/impeccable-integration.md`。

**精致度配方**（容器样式/色彩策略/布局多样性）→ `references/design-polish.md`。

## 动效

**核心心法**：动效服务讲解，不服务装饰。**默认零动效**，每个加入的动效要按内容动词论证。**关掉测试**：禁用所有动效 deck 还能讲清吗？不能 = 内容缺陷，先修内容，别用动效补救。

**机制选择（按内容动词，P1 设计时定；不混用）**：

| 机制 | 触发 | 适合场景 / 内容动词 |
|---|---|---|
| **fragment**（按→揭示） | 演讲者按键 | 工艺/流程/步骤「逐步造」、堆叠/层级「逐层」（逐层 OR CSS 进场 rise） |
| **CSS 循环**（`infinite`） | 进页自动播 | 信号传输/能量传导「持续流」（flow 蚂蚁线 / pulse 呼吸 / glow 发光） |
| **CSS 进场**（`forwards`） | 进页自动 | 数据对比/增长「从 0 长到 X」（grow scaleX 0→1） |
| **不动效** | — | 宣言/口号、封面主标题、精确读数「一次看清」；拿不准 → 不动效（克制优先） |

**克制上限（硬规则，P4 后必查）**：循环动效 **≤3 应用点/deck**（一个应用点 = 一种独立用法，"互连线 flow"算 1 点不论几条线；同动效跨页每页计 1）、每页 **≤2 个 `infinite`**（互相干扰）、fragment **≤30% 页面**（"惊喜"仅 1-2 页）；生成后 `grep 'animation:[^;}]*infinite'` 数应用点（类型 + 页面去重），>3 必删到 ≤3。

**实现规则**：fragment `fade-up` stagger ≤150ms/项；进场 400-650ms；循环 1.4-2.4s；用 `cubic-bezier(0.22,1,0.36,1)`（`linear` 只给持续流动）；**禁 bounce/elastic**（PPTX 导出丢）；页面过渡只用 `fade`/`slide`（禁 3D，理由见 §1）；必兼容 `prefers-reduced-motion`（显示终态）；**SVG fragment 用纯 opacity，禁 transform**（viewBox 下失真）。

**导出兼容（硬约束）**：fragment + CSS 动效在 PPTX/PDF 导出**都会丢**。设计时必须保证**静态快照可读**——动效是 HTML 演示的加值，不是信息载体。关掉动效的 PPTX 也要能独立讲清。

详细 recipe（fragment stagger / easing 曲线 / CSS 循环 flow·pulse·glow / 数字滚动 / SVG 描边 / 视差等高级模式）：`references/motion-delight.md`。

## 验证

三层模型 + **统一验收入口 `node scripts/qa.js <file>`**（一次跑完：grade-gate 十四门禁地板 + design-strength 品质总分 ≥75 + element-quality + 图像驱动自动 audit + visual-verdict 三态 pass/blocked/signoff + **design-brief 契约门禁**——交付 HTML 必须内嵌 `<script type="application/json" id="design-brief">`，`aestheticAnchor`/`externalRefs`/`signatureMoment`/`extremeContrast`/`bannedPatterns` + 叙事弧线三字段 `narrativeArc`/`pacingCurve`/`bannedBeats` 八必填字段缺失 = 硬失败，`examples/` 种子模板豁免，详见 `scripts/check-design-brief.js`；**弧线落实门禁**（`check-arc-adherence.js`：库内弧线须在 narrative-arcs.md 注册表、自定义弧线须 `arcDefinition` 四件套 + `bannedBeats` 已知节拍签名扫描命中 = 硬失败，种子同豁免，详见 `scripts/check-arc-adherence.js`）；换皮门禁默认对全部种子比对，`--no-skeleton-gate` 豁免；`grade-gate.js` 仍是地板，`generate-deck.js --gates` 只跑地板+design-strength ≠ 全量验收），**完整脚本清单、阻断条件表、十四门禁对照、路径 × 模式验收矩阵、impeccable 覆盖映射、G6/G7 分工、评估集成**见 `references/validation.md`：

| 层 | 脚本 | 性质 |
|---|---|---|
| **地板（合规）** | `node scripts/grade-gate.js <file>` 全绿（十四门禁 G1-G14 合一） | 硬约束、**机器判 verdict，禁止人工放行**（案例见 `references/validation.md` G5 段） |
| **天花板（设计强度）** | `node scripts/design-strength-check.js <file>` 五维达标（尺度/用色/张力/隐喻/工艺） + `node scripts/element-quality-check.js <file>` 元素子分 ≥70 | advisory，任一维不达标 = **回炉重做骨架**，不是微调 |
| **视觉评审** | `node scripts/visual-qa.js <file> --annotate-overflow --show-fragments` 逐页审阅 + `node scripts/visual-verdict.js <file>` LLM 视觉语义评审 | **P4 生成后必跑、任何视觉改动后必跑**（快速模式也跑）。**无 key / 未 opt-in = UNSKIPPABLE-BLOCKED（G001,非 dry-run 假通过）**：`visual-verdict.js` 需 `VISUAL_VERDICT_OPT_IN=1`（默认关防外发）才真实调用，dry-run 需显式 `--dry-run`，无 `OPENAI_API_KEY` 默认 exit 2 硬错误；签字放行走 `scripts/qa.js`（`--visual-signoff` / `VISUAL_VERDICT_SIGNOFF=1` 人工签字）；**视觉能力自检 + 反幻觉锚点（必做，防谎报通过）见 `references/validation.md`「视觉能力自检协议」**——无视觉能力必须记 `passed=null`，不得声称读图通过**L3b 创意短语断行**（`价格屠夫`/`终点裁决`/`客观缓解率` 等 jieba 切不准的整体短语被拆两行）也走视觉评审，判别规则（R1 残尾孤字 / R2 固定短语切割 + 豁免）见 `references/failure-gates.md` §19 |
| **反 editorial 收敛** | `node scripts/check-editorial-contamination.js <file> --topic "<主题>"`（qa.js `--topic` 内置；`--selftest` 自检） | 非 editorial 主题穿档案馆外衣（archive 构件 ≥2,或 1 构件 + serif 佐证）= FAIL；Goodhart 补丁——门禁 #9 的审美语言维度 |
| **弧线落实** | `node scripts/check-arc-adherence.js <file>`（qa.js 内置，种子豁免） | brief 声明的弧线真的落实：库内弧线须在注册表、自定义弧线须 `arcDefinition` 四件套；`bannedBeats` 已知节拍（anchor-numeral/face-off/kpi-wall/table 系/data-chart）签名扫描，命中 = FAIL 并指出页码/选择器；未知节拍 key 与 pacingCurve 拍数偏差仅 warning |
| **图片资产门禁** | `node scripts/audit-image-assets.js <file>` | 图像驱动 deck 必跑；阻断断图、满版图被放大、满版图低于画布、超宽低高图硬塞 hero、封面/章节/结尾重复大图；警告支撑图重复与背景主题漂移 |

**关键认知**：门禁（地板）与设计强度（天花板）不可互替——合规但四维全默认 = 平庸；通过门禁要削弱设计时，找"既大胆又合规"的解（深化专色到 AA / 反相面板），不是改弱求合规。详见 `references/validation.md`、`references/design-fundamentals.md` §6。

调垂直平衡另跑 `node scripts/visual-check.js <file>`（启发式、非阻断，与 visual-qa 冲突时信 visual-qa）。视觉语义问题（图示不清、标签不可读、图表不解释主张）信 `visual-verdict.js`，机制见上表。评估框架用 `grade-gate.js --json` 的 `passed` 字段作客观断言。如果未执行验证，在最终回复中**明确说明**。

图像驱动 deck 的设计问题除 `audit-image-assets.js` 拦硬伤外，`visual-verdict.js` 还按照片专属 rubric 判：是否讲清页面主张 / 是否重复 / 是否廉价 / 是否主题割裂 / 是否有视觉冲击。

**内容-版式贴合度不是机器 QA 的替代项，而是路由与验收项**：P1 先判断内容形状、主 proof object 与版式服务关系；P3 评审 proof object 是否解释主张、是否内容被硬塞进模板、是否版式不解释主张；P6 用 `visual-verdict` 或人工审阅确认视觉语义无 blocker。若失败，优先回 P1/P3 重写 content rewrite 或 layout variant，不靠换色/换字体补救。

## 导出

- **PPTX**：HTML 内置按钮（每个标题/段落/列表项 = 独立文本框，文字层可编辑）；CLI 备份：`node scripts/export-pptx.js <file>`。**已知限制（非 100% 像素级可编辑）**：A3(timeline)/A8(mechanism)/IMG(image-compare) 三类 archetype 的复杂视觉走 **hybrid** 策略（栅格化 complex-visual 保真、文字仍独立可编辑，见 `references/pptx-export-strategies.json`）；voice 字体在 PPTX 端若 Office 未装会**回退 Calibri**（`export-pptx-client.js` mapFont 兜底）。即"文字层可编辑 + 复杂视觉栅格化保真"，非逐元素矢量可编辑。
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
| **选叙事弧线（必读）** | `references/narrative-arcs.md` | 9 条跨页叙事弧线（账本审计/值班夜航/质证对决/画廊漫步/标尺之旅/专辑聆听/田野笔记/工程剖面/舞台揭幕）：节奏曲线、页面语法、禁用节拍——七行「叙事弧线」行与 brief `narrativeArc`/`pacingCurve`/`bannedBeats` 的取值来源 |
| **选配色字体** | `references/design-principles.md` | 配色方案、字体系统、反模式、文案规则 |
| **处理模板外内容 / 风格缺口** | `references/off-template-style-gap.md` | Style gap 判定、四件套扩展、PPT 服务内容的验收线 |
| **选风格 / 适配任意主题** | `references/style-space.md` | 风格 6 维坐标系、关键词→voice 速查表、voice×archetype 组合空间、加新 voice 流程（`voice-router.js` 自动路由 + `build-voice-tokens.js` 编译 `tokens/voices.json` 单一真相源） |
| **造新种子（主题不覆盖时）** | `references/seed-creation-workflow.md` | 种子创建 7 步 workflow（诊断→走 B 解法生成→6 维生成→验证→沉淀 case→自动化→独立 reviewer；deck 生成走 B 解法 7 步（0-6））。**设计感核心**（A/B 测试验证）：禁读现有 template（否则模仿）+ 外部大师参考 + 审美推导"为什么美" + 审美意图先行（一个情绪/签名/对比，减法不填清单）+ impeccable 打磨。配套 `seed-quality-standard.md`（6 维验收尺，事后用）。3 个沉淀 case 示范在 `references/seed-gallery/`（tcm-herbal / astronomy-nebula / astronomy-monument） |
| **任意主题生成（核心能力）** | `references/design-generation-workflow.md` | **B 解法**：任意主题 → 有设计感 deck。不靠套种子/模板（枚举），靠设计能力。7 步（0-6）：审美轴探索 + 用户锚点→审美意图先行→外部大师参考（禁 template）→审美推导→减法生成→impeccable 打磨→沉淀 case。种子/voice 库降为 **case 参考 + 已覆盖兜底**（不套用）。data-viz 额外要数据可视化能力为核心 |
| **元素语义总入口** | `references/element-semantics.md` | proof object、动画、图标、表格、图表、图片、代码、引用、页面家具在 P1/P3/P4/P6 的选择和验收 |
| **构建页面** | `references/layout-patterns.md` | 通用容器（列表/流程/代码/基础网格）；主骨架优先用 archetype |
| **需图标** | `references/icon-system.md` | 85 个 inline SVG 图标 |
| **需图表** | `references/diagram-system.md` | 流程/树/时序/关系/状态图，纯 HTML+CSS+SVG |
| **需数据图** | `references/data-viz.md` | 环形/柱状/进度环/迷你折线/对比条/堆叠条/数字看板/数据表 |
| **需表格** | `references/table-system.md` | data-ink 原则、6 类表格模板、列对齐/行列阈值、chartjunk 反例（系统级，data-viz §8 是单组件） |
| **需图片** | `references/image-system.md` | 6 种滤镜、5 种裁切、设备框、混合模式 |
| **图像驱动主题（城市/旅游/地产/美食/产品摄影）** | `references/image-driven-deck.md` | 图源指南（Wikimedia/Openverse）、选图标准、照片角色台账、6 种图像 archetype、图片资产门禁与视觉模型 rubric（配合 image-system.md 落地） |
| **加动效** | `references/motion-delight.md` | 时机、easing 曲线、6 种高级模式 |
| **调垂直平衡** | `references/visual-check.md` | visual-check 指标（重心/跨度/画布）、可接受取舍、假阳性、和 visual-qa 的分工 |
| **配 Reveal** | `references/technical-specs.md` | CDN、插件、三端适配、固定画布 |
| **失败门禁详解** | `references/failure-gates.md` | 19 条门禁完整说明 + 真实重影案例 |
| **验证脚本与门禁（总参考）** | `references/validation.md` | 三层模型、统一验收入口 `qa.js`、十四门禁 G1-G14、路径 × 模式验收矩阵、完整脚本清单、阻断条件表、impeccable 覆盖映射、G6/G7 分工、评估集成 |
| **模板差异化审计** | `references/template-differentiation-audit.md` | 跨模板相似度审查证据、首页并排对比方法 |
| **专业模式评审** | `references/pipeline-phases.md` | Phase Gate 检查表、发现访谈、P5 分层 |
| **发布会级输出** | `references/launch-grade.md` | golden-reference 对标、页面原型、评分 rubric |
| **使用 impeccable** | `references/impeccable-integration.md` | impeccable 命令到演示场景的映射、色彩策略、字体替代 |

## 成功标准

- [ ] **Gate 模式守门（元规则）**：若用户指定专业/发布会模式，P1 设计语法输出后**已停下等确认**（没停 = 违规失败，无论 deck 质量多高；规则见 §流程「Gate 模式硬约束」）
- [ ] 第一眼就是经过**设计意图**的（不是 AI 模板感）
- [ ] P1 产出了 Theme-to-Design Router 七行说明 + **设计契约**（尺度预设/用色投入/archetype 序列/本主题发明变体），且不是直接套模板
- [ ] **叙事弧线已声明且落实**：七行「叙事弧线」行与 design-brief 的 `narrativeArc`/`pacingCurve`/`bannedBeats` 一致（references/narrative-arcs.md 9 条之一或自定义），声明禁用的默认节拍（如 anchor-numeral/face-off/kpi-wall）确实没有出现在 deck 里（`check-arc-adherence.js` 机器扫描，qa.js 硬门禁）
- [ ] **内容-版式贴合度**已通过：内容形状、主 proof object、版式为何服务它都明确；去掉颜色和字体后，页面结构仍属于这个主题
- [ ] **元素语义**已通过：每页元素清单、主 proof object、辅助元素族、动画解释任务明确；每个元素都服务 action title,不是模板装饰
- [ ] 主骨架由 ≥3 种 archetype 组合（非种子原语原样填充），含 ≥1 个本主题发明变体
- [ ] 物理表面型 proof object 与承载面共享坐标系；SVG 文字不靠裁切隐藏、不继承描边；数据趋势线不用 `T`
- [ ] `design-strength-check.js` 四维达标（尺度≥3:1 / 有满版色块面板 / 有非对称分割 / 有主题原生形式）；数字未被软化成"约/持平"
- [ ] **未穿 editorial 皮**（`check-editorial-contamination.js` 过）：非 editorial 主题的构件/骨架/排版从主题生长，去色去字体后仍属本主题而非 template-01 档案馆；路径 C 用 bespoke 骨架非共享基底
- [ ] `element-quality-check.js` 元素子分达标（动画/图标/表格/流程图均 ≥70）；emoji 不当图标、图标 inline 且主题跟随、表格符合 data-ink
- [ ] **动效关掉测试**：禁用所有动效 deck 还能讲清（动效是 HTML 加值不是信息载体）；循环动效 ≤3 处/deck、fragment ≤30% 页面；`prefers-reduced-motion` 显示终态不隐藏；PPTX 导出（动效丢失）静态快照可读
- [ ] 发布会级任务通过了 `references/launch-grade.md` 的 golden-reference、截图和导出门禁
- [ ] 匹配观众和语气，远距离可读
- [ ] reveal.js 运行无布局问题，逐页截图无残影/裁切/按钮污染
- [ ] `test-pin-collision.js` 输出 `OK: all pin regions clear.`
- [ ] 图像驱动 deck 已跑 `audit-image-assets.js`：无断图、无低清/放大满版图、无重复封面/章节大图、无非意图背景主题漂移
- [ ] **`visual-verdict.js` 已跑且无 blocker**——感官类问题只能视觉抓，G1–G14 兜不住；无 key / 无视觉能力时记 `passed=null dry-run`，**不得声称判定通过**（opt-in / dry-run / Claude 读图反幻觉机制见 §验证）
- [ ] **适配任意主题（含模板库外）**：① 在 10 种子形状 / 14 voice 内 → 路径 A 种子 / 路径 B voice 组合（`scripts/voice-router.js` + `scripts/generate-deck.js`）；② **模板库外**（不在 10 形状也不在 14 voice，如天文学/航空/古典乐/蒸汽波）**或要求"惊艳/设计感"** → **路径 C B 解法**（`references/design-generation-workflow.md`：审美意图先行 + 外部大师参考禁 template + 审美推导 + 减法 + impeccable 打磨；case 沉淀 `references/seed-gallery/`）。两条都过十四门禁 + `design-strength-check.js` 达标；未硬套模板（门禁 #9）。加新 voice 走 `tokens/voices.json` + `build-voice-tokens.js`（见 `references/style-space.md`）
- [ ] 包含运行/导出说明和验证状态
