---
name: revealjs-presentation
version: 15.2
description: |
  Generate visually distinctive reveal.js presentations (single self-contained HTML, no install needed). Use this skill whenever the user mentions PPT, slides, presentation, 幻灯片, 课件, 汇报, 演讲, keynote, pitch deck, or asks to turn a topic/outline/document/数据 into slides — also when they say 做报告, 写课件, 培训材料, 方案介绍, 年终总结, 答辩, 述职, 产品发布, 技术分享, 营销方案, 路演, OKR/复盘汇报, or hint at presenting information visually. Also use when refreshing or polishing an existing reveal.js HTML, exporting to PPTX/PDF, fixing layout overflow or pin-overlap in slides, setting up the presentation tool, or generating decks in a specific visual style (editorial archive, dark-tech cockpit, architectural plate, live keynote, field notebook, or one of the 5 seed templates). Even if the user does not explicitly say "slides", invoke this skill if their ask is to communicate a structured argument visually to an audience.
---

# Reveal.js 演示文稿

生成有视觉辨识度的演示文稿，不是千篇一律的 AI 模板。输出为**单个 HTML 文件**，浏览器打开即用。

## 快速开始

生成一个演示的最短路径（快速模式，适合"做个 PPT"类需求）：

1. **触发**：用户说"做个 PPT / 幻灯片 / 课件"或给出主题
2. **确认 4 要素**：主题 · 观众 · 页数 · 语言（缺省：通用观众 / 8-12 页 / 中文）。页数是硬约束——用户给 N 页时最终偏差 ≤1（见 §8）
3. **产出设计语法**：Theme-to-Design Router 六行说明（见下文）
4. **生成单个 HTML**：内联 CSS+JS、Reveal.js 4.6.0 CDN、1280×720 画布
5. **自检**：`node scripts/lint-design.js <file>`（P0=0）+ `node scripts/test-pin-collision.js <file>`（OK）
6. **交付**：HTML 路径 + 运行/导出说明 + 验证状态

需精细控制走 P0-P6 专业模式（下文）；发布会级先读 `references/launch-grade.md`。

## 零安装使用

CDN 加载 reveal.js + Google Fonts，用户**无需安装任何东西**。

- 浏览器打开 HTML → 方向键导航，`S` 演讲者备注，`F` 全屏
- **PPTX 导出**：HTML 内置按钮（右上角悬停/聚焦显示），点击即下载可编辑 .pptx
- **PDF 导出**：Chrome 打开 `file.html?print-pdf` → `Ctrl/Cmd+P`

用户问"怎么安装"——**不需要安装，双击 HTML 就用**。

## 流程

### 四套质量体系（何时用哪个）

| 体系 | 规模 | 何时起作用 | 强制级 |
|------|------|-----------|--------|
| 关键约束 | 7 项 | 生成 HTML 前（P4 / 快速模式） | 硬约束，lint/validate 打回 |
| 设计硬规则 | 10 条 | `lint-design.js` 检查 | P0 必修，P1/P2 建议 |
| 失败门禁 | 13 条 | 全流程质量底线 | 触发即阻断交付 |
| Phase P0-P6 | 7 阶段 | 专业模式流程 | 每段 Gate 确认 |

快速模式只需「关键约束 + 硬规则 P0」；专业模式叠加 Phase；发布会级再叠加 `references/launch-grade.md`。

### 三种工作模式

| 模式 | 何时用 | 行为 |
|------|--------|------|
| **快速模式（默认）** | 用户只说"做个 PPT"或没具体要求 | 收集 4 要素（主题/观众/页数/语言）→ 生成设计语法 → 直接生成 HTML → 交付说明 |
| **专业模式** | 用户要精细控制或明确要求评审 | 走 7 阶段 P0-P6，每段获 Gate 确认。详见 `references/pipeline-phases.md` |
| **发布会级模式** | 用户说"发布会级"/Keynote/品牌开场/惊艳/顶级/public launch/产品发布，或要求接近品牌介绍页 / 发布会开场这种质量 | 先读 `references/launch-grade.md`。输出前必须完成：storyboard、golden-reference 对标、逐页截图审阅、PPTX 导出证明、`node scripts/test-launch-grade-contract.js` |

| 专业模式 Phase | 名称 | 类型 | 核心任务 |
|:-----:|------|:----:|------|
| P0 | 设计上下文 | ● | 风格、色彩、字体方向 |
| P1 | 需求+设计语法 | ● | 场景/时长/听众 + Theme-to-Design Router 六行说明 |
| P2 | 输出方案 | ◐ | 内容结构、视觉方向 |
| P3 | 设计评审 | ● | 反模式检查 + 优化方向 |
| P4 | 生成初稿 | ● | HTML + **lint + validate 双卡点**（lint P0=0 **且** validate.js total=0 才能继续） |
| P5 | 优化迭代 | ● | 按规模执行对应 sub-skills |
| P6 | 最终检查 | ◐ | 溢出检测 + 截图复核 + 交付 |

● 必须完成　◐ 可跳过　/　刷新已有演示：跳过 P1，从 P3 开始评审

## 关键约束（生成 HTML 前必须先确认）

这一节是 P4 / 快速模式生成前的"过桥清单"，下面任意一条不满足都会在 lint 或 validate 阶段被打回。**生成代码前先在脑里把这七项过一遍**。

### 1. 输出形态硬约束

- **单个自包含 HTML 文件**，不拆分 CSS/JS
- **Reveal.js 4.6.0 CDN**：`cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/reveal.{css,js}`
- **Google Fonts**：按设计语法选择，`<link>` 引入
- **CSS 全部内联**在 `<style>` 中，使用 `--c-*` / `--f-*` token；完整骨架见 `references/css-skeleton.md`
- **每页一个 `<section>`**；section 级 flex/grid 必须加 `class="deck-flex"` 或 `class="deck-grid"`（Reveal 会把 present section 的 inline `display` 改成 `block`）
- **图标用 inline SVG**（`references/icon-system.md`），不用 Font Awesome、不用 Emoji 当图标
- **不引入 Tailwind 或任何 CSS 框架**
- **禁止 `vw`/`vh` 单位**：Reveal 用 `transform: scale()` 缩放，vw/vh 不受 transform 影响 → 大屏溢出/小屏不可读。所有字号用 `em`/`px`
- **Reveal 配置**：`{ width: 1280, height: 720, margin: 0.04, hash: true, slideNumber: 'c/t', transition: 'fade' }`
- **交付前必须过三门禁**：`lint-design.js` P0=0 **且** `validate.js` total=0 **且** `test-label-overlap.js` 退出码 0，缺一不可。三者覆盖不同缺陷域——`lint` 抓设计规则违规（accent 滥用、AI 字体指纹），`validate` 是 Playwright **真实渲染**溢出检测（视口溢出/内容重叠），`test-label-overlap` 抓 pin/stamp 标签**跨 slide 泄露**（section 非 positioned 时 absolute pin 相对 BODY，全叠视口左下角）+ 互相重叠。**P4 生成后必须立刻跑这三个**，任一漏跑 = 视觉 bug 到用户手里（iteration-1 实测 security-training 漏跑 validate 交付 62 处溢出）。validate 报错优先 `--fix`，仍 >0 回 §2 拆页/降文字，**不要用缩字号硬塞**。
- **切勿破坏 reveal 的 section 堆叠/隐藏**：section 的 `position` 必须由 reveal.css 控制（`.reveal .slides>section{position:absolute}` + 非 present 用 opacity:0/display:none 隐藏）。生成 HTML 时**不要**给 section 强制 `position: relative`——哪怕无 !important，只要选择器强到 `.reveal .slides > section`（特异性 0,2,1 = reveal.css），模板 `<style>` 后于 `<link>` 加载 → 同特异性后赢 → 覆盖 reveal 的 absolute → section 进文档流垂直堆叠 → overflow:hidden 截断 → 除首页外全空白（v15.2 实测 slide 3 top=1397，已回滚）。pin 的 `position:absolute` 自动相对最近 positioned 祖先（reveal 的 absolute section），无需额外干预；若 section 退回 static（非 positioned），pin 会相对 BODY 全叠视口左下角 = test-label-overlap 报泄露。

### 2. 内容预算（生成 section 前先算）

slide 实际画布 = **1280×720px**，扣除推荐 padding（60×80×80×80）后**可用空间 ≈ 1120×580px ≈ 35×19em**。

**每页安全预算 ≤ 14em 垂直**（不含 section padding）。在写 section 内容前心算：

| 元素 | 高度估算 |
|------|----------|
| h1（2em） | ~2.5em |
| h2（1.6em） | ~2em |
| p（1 行 65ch） | ~1.5em |
| 三列卡片 / 双列卡片 | ~8em |
| 2×2 网格 | ~9em |
| 时间线（4 节点） | ~8em |
| kicker + divider | ~1.2em |

> 心算总和 > 14em → **停下来**，按优先级处理：①拆页 → ②缩短文案 → ③改 proof object → ④缩字号（最后才用）。
>
> **设计原则：先紧后松**。初稿宁可留白也不要塞满；满了再"缩字号"是 5 套模板优化里反复踩的坑（详见 `references/failure-gates.md` #6、#12、#13 的真实案例）。

**密度硬上限**：垂直列表 ≤5、双列卡 ≤4、三列卡 ≤3、时间线 ≤6、代码块 ≤8 行、纯文字 ≤120 字。超出即拆页。完整高度估算和 8 个超框案例：`references/layout-patterns.md`。

### 3. Pin 安全区（左下角索引不被遮）

`.pin` 是页码 / 章节索引，位于左下角 `left:72px bottom:32px`，独占约 **200×40px** 可读区域。底部一旦有 colophon、stat-row、表格末行、装饰雷达、audience-floor 之类满宽内容，**必须三选一**：

| 方案 | 适用 | 实现 |
|------|------|------|
| (a) 安全带 | 底部有满宽内容 | section `padding-bottom: ≥80px`（CSS skeleton 已默认 80） |
| (b) 对角 | 内容偏左下 | `.pin { right:64px; left:auto }` |
| (c) 隐藏 | finale / 全屏数据页 | `style="display:none" data-qa-ignore="decorative"`，靠 Reveal 自带 `slideNumber:'c/t'` 索引 |

**P4 必跑**：

```bash
node scripts/test-pin-collision.js examples/*.html
```

输出 `OK: all pin regions clear.` 才能交付。任何 collision 报告都视为阻断项。

**装饰元素白名单**：背景框、雷达、audience-floor、sheet-frame、灯光 beams、装饰 SVG line 必须加 `data-qa-ignore="decorative"`。**正文、标题、数据、表格行、图表不得用此标记逃避检测**。详细案例和反例：`references/failure-gates.md` #13。

### 4. 首屏即可读

封面 / 第一页的主标题和核心副标题**不得**用 `fragment` 初始隐藏。fragment 只用于后续逐步揭示或非核心内容。用户双击打开 HTML 时不能看到空白封面。`scripts/test-initial-slide-visible.js` 自动检测。

### 5. PPTX 内置导出

在 Reveal.js 之后加载 pptxgenjs CDN，并把 `scripts/export-pptx-client.js` 的内容**内联**到当前 HTML：

```html
<script src="https://cdn.jsdelivr.net/npm/pptxgenjs@4.0.1/dist/pptxgen.bundle.js"></script>
<script>/* paste scripts/export-pptx-client.js here */</script>
```

导出按钮默认不可见，只在右上角悬停或键盘聚焦时出现；不得覆盖左下角 pin、页码、导航控件或正式演示画面。**不要**用 `import()`（UMD 不支持）。

完整 CDN 链接、插件配置、代码高亮：`references/technical-specs.md`。

### 6. 首稿配方速查（让一稿落地更近）

下面是从 5 套模板复盘得到的常见内容 → 推荐布局映射。**先按配方落地，再根据 lint/validate 反馈调整**，比"自由发挥后再修"省 2-3 轮迭代。

| 内容形态 | 推荐布局 | 关键参数 |
|---------|---------|----------|
| 3-4 个 KPI 指标 | 2×2 卡片网格 + 趋势 delta | 卡片 padding `1.2em 1.4em`，数字 `font-size: 2.5em`，趋势用 ▲/▼ + accent 色 |
| **5+ 个 KPI 指标** | **拆 2 页**（4+N 或 N+N） | 不要硬塞，违反 §2 内容预算 |
| 4-6 项进展/特性列表 | 编号 01-NN + em-dash 解释 | `01 + 4-6 字主张 + ── + 一行解释`，每项 ~1.5em |
| 7+ 项列表 | 拆 2 页或转为分组卡 | 同上 |
| 时间线 4-6 节点 | 横向时间线 + 节点圆点 | 节点上方年份，下方一句话 |
| 数据 + 数据源 | 数字旁加 `verified / user-provided / illustrative` 标签 | 失败门禁 #3 Evidence Ledger 要求 |
| 单一主张 / 章节分隔 | 全屏大字 + 一行副标题 | h2 `font-size: 2.4em+`，左对齐偏左缘 |
| 5-7 分钟路演收尾 | CTA 按钮 + Demo/资料 二级按钮 + colophon | 按钮用实色块，不用 ghost button |

### 7. 封面右侧平衡（editorial-serif / minimal 模板高频遗漏）

editorial-serif、minimal-spatial 等左对齐封面常见问题：**主标题靠左下，右上 / 右半屏完全空白**。视觉重心失衡。

修复方案三选一：

| 方案 | 实现 |
|------|------|
| (a) Stamp / 印章 | 右上角加 `<span class="stamp">NO. 026 · CATALOGUED</span>`，旋转 -3deg |
| (b) Poster wall / 拼贴墙 | 右侧 320×420px 区域放 3×4 色块网格，几格 SVG 几格留白 |
| (c) Sample tag / 标签卡 | 右下角散落 2-3 张轻微旋转的标签卡（带类目和标号） |

`examples/template-01-editorial-serif.html` 的封面是完整范本（左主标 + 右色块墙 + 右下信封 + stamp）。

### 8. 页数目标对齐（用户说"N 页"就是 N 页，不是 N-3）

用户给页数（"15 页左右"、"做 8 页"）时，最终 `<section>` 数与目标的偏差必须 **≤1 页**。iteration-1 实测：v15.0 把"15 页"压成 12 页、"12 页"压成 9 页（两处都欠 3 页）——根因是「先紧后松」被误读成"页数也紧"。**内容预算（§2）管的是单页密度，不是总页数**。页数不够就拆页（多一页留白页比挤一页强），不要靠删内容或缩字号凑数。

执行三步：
- **生成前**：在 Theme-to-Design Router 的「页面骨架」行写明 `[目标 N 页] + 页面原语清单`，按 N 原子化规划每一页，而不是"边写边看够不够"
- **生成后**：`grep -c '<section>' <file>` 核对实际页数，偏差 >1 必须补页（章节分隔 / proof object / takeaway / 对比页都是天然的补页候选）或删页
- **用户没给页数**：默认 8-12 页，按内容密度定，**不要默认压到下限**

## Theme-to-Design Router

模板不是最终目的，只是已经验证过的设计语法 seed。每次生成前必须先产出一段**设计语法说明**，再决定复用、改造或新建。

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

### 匹配规则

| 情况 | 处理 |
|------|------|
| 主题自然落入现有语法 | 用对应种子模板，替换内容原语和 proof object |
| 主题只部分匹配 | 借用最近模板作 scaffold，改写隐喻/骨架/命名 |
| 主题完全不匹配 | 新建一次性设计语法，不要硬套 |
| 用户给品牌/参考图 | 从品牌行为和语气抽隐喻，不只吸色或模仿字体 |
| 内容跨多个语境 | 选一个主隐喻，其他作为局部页面动作 |

**新语法最低要求**：1 个清晰隐喻 + 4 种页面原语 + 1 个签名时刻 + 1 套颜色/字体 token + 3 个禁用套路 + 1 条验证问题（把颜色字体拿掉后，这页是否仍属于这个主题？）。

### 设计强度三拨盘（density / variance / motion）

每份演示在生成前明确三个维度的强度（1-5），决定布局、动效、密度的基调，写进 Theme-to-Design Router 的"页面骨架"行：

| 拨盘 | 低（1-2） | 高（4-5） |
|------|----------|----------|
| **DENSITY 密度** | 留白多、单页单论点 | 信息密集、对比矩阵 |
| **VARIANCE 多样性** | 统一节奏、重复结构 | 布局多变、≥4 种页面原语 |
| **MOTION 动效** | 静态、仅 fade | fragment 编排、签名时刻动效 |

模式对应参考：快速模式 = 中 density + 中 variance + 低 motion；专业模式 = 按主题调；发布会级 = 中 density + 高 variance + 高 motion。拨盘是**对现有内容预算（≤14em）/布局多样性（≥4 种）/动效规则的参数化抽象**，不是新约束。

### 失败模式门禁（13 条速查 / 完整说明见 `references/failure-gates.md`）

| # | 门禁 | 一句话 |
|---|------|--------|
| 1 | 原生语法 | 品牌/平台 deck 必须有该对象的界面证据，不只是"科技感/年轻化" |
| 2 | 审美通道 | 用 Fraunces/DM Sans/玻璃卡/通用渐变要先说明为什么主题就是这个媒介 |
| 3 | 证据台账 | 所有精确数字必须标 `verified / user-provided / illustrative`；"公开披露"不够 |
| 4 | 主命题进场 | pin/页码不能承担本页唯一主题；主视觉区必须读得到主命题 |
| 5 | 颜色角色 | 主命题用最高层级颜色；强调色不做随机高亮 |
| 6 | 密度溢出阻断 | `validate.js` `total > 0` = 必须修复；优先拆页/降文字而不是缩字号 |
| 7 | 截图复核 | 视觉调整后重跑 `visual-qa`；不要用"代码合理"代替截图 |
| 8 | fragment 首屏 | 初始截图必须有可读核心结论，不能全藏在 fragment 后 |
| 9 | 骨架换皮门禁 | 同一套"左标题 + 右图形"换 5 套颜色 = 失败；class 名要反映主题对象 |
| 10 | 跨模板相似度 | 5-10 张首页并排，去色后还像同一套 = 失败；金融像 cockpit，城市像 GIS |
| 11 | 种子模板对象契约 | 维护已实现的 `examples/template-01..05` 必须通过 `test-reference-contract.js` |
| 12 | 高风险布局预警 | 2×2 + 长标题、4-8 卡、密集时间线 + fragment 都易溢出，先用紧凑版 |
| 13 | **Pin 安全区** | 必须跑 `test-pin-collision.js`，OK 才能交付；详见上文「关键约束 §3」 |

## 种子模板（5 套已实现）

每个模板在 `examples/template-01..05-*.html` 有完整示例，class 命名和领域对象登记在 `references/template-invariants.json`。**使用种子模板时必须改变叙事结构和页面骨架，不只换字体/颜色/背景**（失败模式 #9）。

| 模板 | 设计语法 | 适用场景 |
|------|---------|---------|
| `template-01-editorial-serif` | 档案馆 / 策展（材料墙、印章、图版） | 研究报告、品牌历史、展览、策略复盘 |
| `template-02-dark-tech` | 控制室（雷达、终端、状态面板、故障演练） | 开发者大会、SRE、架构发布、技术产品 |
| `template-03-minimal-spatial` | 建筑制图（图纸、尺寸链、平面、剖面、路径） | 产品架构、方法论、复杂系统、组织设计 |
| `template-04-vibrant-gradient` | 发布会现场（主屏、观众席、摄影机框、产品 drop） | 品牌开场、社区产品、营销、Keynote |
| `template-05-nature-fresh` | 田野桌面（笔记本、钉图、样本标签、信封） | 培训、研究 workshop、教育、用户洞察 |

> 另有 10 套设计语法（金融终端、临床实验室、城市基建、法律案卷、奢侈工坊、影视分镜、动画节奏、系统流程、代码走查、数据可视化）作为扩展参考登记在 `references/template-invariants.json` 与 `references/design-polish.md`，**尚未落地为种子 HTML**；需要时按其设计语法新建，不要引用不存在的 `examples/template-06..15` 文件。

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

```bash
node scripts/lint-design.js <file>               # P0/P1/P2 设计规则 + impeccable 禁令
node scripts/lint-design.js <file> --verbose      # 含 P2 建议 + 精致度
node scripts/validate.js <file>                    # Playwright 溢出检测 + 截图
node scripts/validate.js <file> --fix              # 检测 + 自动修复 + 重检
node scripts/test-pin-collision.js <file>          # Pin/水印与正文重叠检测
node scripts/test-label-overlap.js <file>          # 标签互相重叠 + 跨 slide 泄露检测（pin 定位上下文失效）
node scripts/visual-qa.js <file> --out /private/tmp/<deck>-visual
node scripts/visual-qa.js <file> --show-fragments --out /private/tmp/<deck>-visual-all
node scripts/test-initial-slide-visible.js         # fragment 首屏门禁
node scripts/test-launch-grade-contract.js          # 发布会级 skill 规则 + golden reference
```

**阻断含义**（任一触发都不能交付）：

| 脚本 | 阻断条件 |
|------|----------|
| `lint-design.js` | 退出码 1 = 存在 P0 违规 |
| `validate.js` | 输出 `total > 0` = 真实布局溢出 |
| `test-pin-collision.js` | 退出码 1 = Pin 与正文重叠 |
| `test-label-overlap.js` | 退出码 1 = 标签跨 slide 泄露（section 非 positioned → pin 相对 BODY 全叠视口）或互相重叠 |
| `visual-qa.js` 截图 | 残影/裁切/按钮污染/主标题弱化 = 回 P5 修 |

**可选 AI-tell 复查**：`node .agents/skills/impeccable/scripts/detect.mjs --json <file>` 补 lint 盲区（side-tab、em-dash overuse）。⚠️ detect 为 web 设计，演示场景部分命中是**假阳性**——`numbered-section-markers`（章节索引是合理用法）、`dark-glow`（雷达/舞台光束是主题 voice）通常忽略；只关注 side-tab、em-dash overuse 等真问题。

**P4 后必跑（三门禁，任一不满足回 P5 重生成）**：`lint-design.js`（P0 必须 0）**和** `validate.js`（total 必须 0）**和** `test-label-overlap.js`（退出码 0）。三者覆盖不同缺陷域——lint 抓设计规则，validate 抓真实渲染溢出，test-label-overlap 抓标签泄露/重叠（前两者都看不到的盲区），**不可互相替代**。**P6 必跑**：完整 `visual-qa.js` 初始 + `--show-fragments` 两组截图，逐页人工审阅。完整 P4/P6 检查表：`references/pipeline-phases.md`。

如果未执行验证，在最终回复中**明确说明**。

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
| **写 CSS 骨架** | `references/css-skeleton.md` | 每个 HTML 必含的 6 段 CSS（token / 重置 / 溢出 / 排版 / pin / fragment） |
| **生成设计语法** | `references/design-polish.md` | Theme-to-Design Router、页面原语、种子模板 token、签名时刻配方 |
| **选配色字体** | `references/design-principles.md` | 配色方案、字体系统、反模式、文案规则 |
| **构建页面** | `references/layout-patterns.md` | 15+ 布局 HTML/CSS、溢出预防、8 个超框案例 |
| **需图标** | `references/icon-system.md` | 85 个 inline SVG 图标 |
| **需图表** | `references/diagram-system.md` | 流程/树/时序/关系/状态图，纯 HTML+CSS+SVG |
| **需数据图** | `references/data-viz.md` | 环形/柱状/进度环/迷你折线/对比条/堆叠条/数字看板/数据表 |
| **需图片** | `references/image-system.md` | 6 种滤镜、5 种裁切、设备框、混合模式 |
| **加动效** | `references/motion-delight.md` | 时机、easing 曲线、6 种高级模式 |
| **配 Reveal** | `references/technical-specs.md` | CDN、插件、三端适配、固定画布 |
| **失败门禁详解** | `references/failure-gates.md` | 13 条门禁完整说明 + 真实重影案例 |
| **模板差异化审计** | `references/template-differentiation-audit.md` | 跨模板相似度审查证据、首页并排对比方法 |
| **专业模式评审** | `references/pipeline-phases.md` | Phase Gate 检查表、发现访谈、P5 分层 |
| **发布会级输出** | `references/launch-grade.md` | golden-reference 对标、页面原型、评分 rubric |
| **使用 impeccable** | `references/impeccable-integration.md` | impeccable 命令到演示场景的映射、色彩策略、字体替代 |

## 成功标准

- [ ] 第一眼就是经过**设计意图**的（不是 AI 模板感）
- [ ] P1 产出了 Theme-to-Design Router 六行说明，且不是直接套模板
- [ ] 发布会级任务通过了 `references/launch-grade.md` 的 golden-reference、截图和导出门禁
- [ ] 匹配观众和语气，远距离可读
- [ ] reveal.js 运行无布局问题，逐页截图无残影/裁切/按钮污染
- [ ] `test-pin-collision.js` 输出 `OK: all pin regions clear.`
- [ ] 包含运行/导出说明和验证状态
