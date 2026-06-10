---
name: revealjs-presentation
description: |
  生成有设计感的 reveal.js 演示文稿（单个 HTML 文件，浏览器运行，支持 PDF 导出）。当用户提到任何演示相关需求时务必使用此技能：PPT、幻灯片、slides、presentation、deck、课件、汇报、报告、演讲稿、keynote、pitch deck、demo。即使用户只说"做个 PPT"、"帮我做个演示"、"做几页 slides"而没提到 reveal.js，也应触发此技能。覆盖场景：将主题/大纲/文档转化为演示文稿；创建特定风格（社论风、暗色科技、极简空间、活力渐变、清新自然）；刷新已有 reveal.js 演示的视觉质量；构建中文或双语幻灯片；季度汇报、年度总结、技术分享、培训材料、产品发布、毕业答辩。也处理初始化场景（setup、初始化、安装依赖、check dependencies）。
---

# Reveal.js 演示文稿

生成有视觉辨识度的演示文稿，不是千篇一律的 AI 模板。输出为单个可运行的 reveal.js HTML 文件，支持浏览器演示和 PDF 导出。

## 初始化

当用户说 "setup"、"初始化"、"安装依赖"、"is this ready" 时执行：

```bash
bash scripts/setup.sh    # 检查 impeccable + skill 结构
npm run setup            # 同上，Node.js 可用时自动安装 impeccable
```

如实报告输出。失败时解释缺少什么以及如何修复。

## 依赖

| 依赖 | 是否必须 | 安装方式 |
|---|---|---|
| **impeccable**（`frontend-design` 技能） | 是 — 视觉质量保障 | `npx skills add pbakaus/impeccable` |
| **reveal.js** | 否 — 运行时从 CDN 加载 | 无需操作 |
| **Node.js 18+** | 可选 — 仅本地开发服务器 | 仅 `npm run start` 需要 |

Impeccable 提供 7 个参考文件和 20 个设计命令（`/audit`、`/polish`、`/critique` 等），指导视觉决策。没有它，输出默认为通用 AI 质量。

## 输出物

- 将主题、大纲、备忘录或文档转化为精心设计的演示文稿
- 支持特定氛围（社论风、暗色科技、极简空间、活力渐变、清新自然）
- 刷新已有 reveal.js 演示的视觉辨识度
- 构建中文或双语幻灯片，含正确排版

**交付格式**：单个自包含 HTML 文件，使用 Reveal.js 4.6.x CDN、`Reveal.initialize(...)`、统一的颜色/字体系统、完整的 `<section>` 标记，以及必要的演讲者备注。

如果用户要求 "PPT" 但不要求 `.pptx` 格式，继续生成 reveal.js HTML 并说明交付格式。

## 设计流水线（7 阶段）

按顺序执行 7 个阶段。每阶段完成后需向用户展示产出，获得确认（Gate）后进入下一阶段。

| Phase | 名称 | 类型 | 核心任务 |
|:-----:|------|:----:|------|
| P0 | 设计上下文 | ● 强制 | 确认设计风格、色彩、字体方向 |
| P1 | 需求+模板 | ● 强制 | 确认场景、时长、听众，选择模板 |
| P2 | 输出方案 | ◐ 条件 | 确认内容结构、视觉方向 |
| P3 | 设计评审 | ● 强制 | `/critique` 评审 + 优化方向 |
| P4 | 生成初稿 | ● 强制 | 生成 HTML 文件 |
| P5 | 优化迭代 | ● 强制 | 根据 slide 数量执行对应 skills |
| P6 | 最终检查 | ◐ 条件 | 溢出检测 + 截图验证 + 交付确认 |

● = 必须完成　◐ = 上下文已存在时可跳过

> **新手模式**：如果用户是新手或不确定，只收集四个要素（主题、观众、页数、语言），默认 6-10 页，一个模板，无高级过渡。每页一个核心信息，始终验证并报告 pass/fail。

> **刷新已有演示**：跳过 P1 模板选择，从 P3 评审当前输出开始。

### P0: 设计上下文

询问用户偏好的视觉风格，或根据主题推荐方向。确定主色、强调色、字体对（display + body）。参照 `references/design-principles.md` 的配色和字体规范。

不要跳过此阶段——大多数低质量演示的问题出在视觉方向，而不是 HTML 语法。

**Gate 0 产出**：设计方向确认

### P1: 需求+模板

确认主题、受众、页数、语言。从 5 个模板中选择一个作为基础视觉语言：

| 模板 | 风格 | 适用场景 |
|------|------|---------|
| `template-01-editorial-serif` | 优雅、正式、社论 | 学术报告、商务汇报 |
| `template-02-dark-tech` | 高对比、技术 | 产品发布、开发者大会 |
| `template-03-minimal-spatial` | 网格、空间感 | 解释性内容、架构说明 |
| `template-04-vibrant-gradient` | 大胆、活力 | 营销推广、创意展示 |
| `template-05-nature-fresh` | 柔和、清新 | 教学、内部分享 |

根据受众和信息匹配模板，不要随机选择。

**Gate 1 产出**：需求确认 + 模板选择

### P2: 输出方案（可跳过）

当 P1 已充分覆盖时跳过。

- 列出每页核心信息（一个视觉重心/页）
- 确定页面顺序：封面 → 背景/问题 → 核心观点 → 证据/案例 → 总结/号召
- 确认版面选择（参照 `references/layout-patterns.md` 版面池）

**Gate 2 产出**：内容大纲 + 版面分配

### P3: 设计评审

对方案做设计评审，检查反模式。确认：

- accent 使用 ≤3 次/页
- letter-spacing 合规（ALL CAPS ≥ 0.06em，大标题有负 tracking）
- 无 AI-slop（参照 `references/design-principles.md` P0 硬规则）

**Gate 3 产出**：评审报告 + 用户确认的优化方向

### P4: 生成初稿

从选定模板开始，保留其视觉系统：

- 使用 CSS 变量管理颜色、间距、字体
- 使用 `clamp()` 流体字号（参照 `references/technical-specs.md`）
- 每页 1 个视觉重心，版面从版面池选择
- 正文左对齐，居中仅在特殊页面使用
- 支持 `prefers-reduced-motion`

**Gate 4 产出**：HTML 文件路径

### P5: 优化迭代

根据演示复杂度选择层级：

| 层级 | 适用范围 | 执行的 skills |
|------|---------|--------------|
| Simple | < 5 slides | `/arrange` `/typeset` `/colorize` `/clarify` `/distill` |
| Standard | 5-15 slides | Simple + `/animate` `/polish` |
| Full | > 15 slides 或正式演讲 | 完整 12 skills 流程 |

**Gate 5 产出**：执行的 skills 列表和结果

### P6: 最终检查（可跳过）

运行设计规范检查和溢出检测（详见下方"验证"章节）。

**Gate 6 产出**：检查报告 + 用户交付确认

详细 Gate 检查点和 Phase 5/6 完整执行步骤：`references/pipeline-phases.md`

## 设计规则

### 每页 1 个视觉重心

一个标题、一个数字、一张图、或一个对比。不要"什么都强调"。

版面从 `references/layout-patterns.md` 的版面池中选择——根据内容性质匹配版面，不要从零设计。页面数量由内容决定。

### 动效服务于理解

- 步骤和序列使用渐进揭示（fragment）
- 页面过渡用 `fade`
- Stagger 延迟 ≤150ms/项
- "惊喜"效果仅用于 1-2 页

动效时机和曲线：`references/motion-delight.md`

### 做到

- 标题与正文强对比
- 中性色有色调（tinted neutrals），不用纯灰
- 每页 accent ≤3 次
- 间距有节奏变化
- 1-2 页让人记住的设计

### 避免

- SaaS 渐变滥用
- 默认字体栈（Inter、Roboto、Arial）
- 纯黑/纯白无 tint
- 全部居中
- 嵌套卡片和装饰性玻璃拟态
- 密集的 bullet wall

详细设计指南：`references/design-principles.md`

## 验证

### Step 1: 设计规范检查（静态分析）

```bash
node scripts/lint-design.js <file>               # P0/P1/P2 设计规则检查
node scripts/lint-design.js <file> --verbose      # 包含 P2 建议
node scripts/lint-design.js <file> --json         # JSON 输出
```

自动检查项（P0）：Tailwind indigo accent、标题 Emoji、ALL CAPS 无 tracking、大标题无负 tracking、占位文本、accent 每页 >3 次、圆角+左边框卡片

自动检查项（P1）：禁止字体、纯黑/白无 tint、字重 >3 档、duotone 渐变、渐变文字

退出码 1 = 存在 P0 违规，必须修复。

### Step 2: 溢出检测（Playwright）

```bash
node scripts/validate.js <file>        # 检测溢出并截图
node scripts/validate.js <file> --fix  # 检测 + 自动修复 + 重新验证
```

### 手动检查项（脚本无法自动化的设计判断）

- [ ] 每页有且仅有 1 个视觉重心
- [ ] 至少 1 页"让人记住"的设计
- [ ] 间距有节奏变化（不是处处相同 padding）
- [ ] 拆分内容后核对原始项完整性（防止遗漏）

### 手动验证（备用）

浏览器打开 HTML，方向键逐页检查溢出、比例失调、动画问题。

如果未执行验证，在最终回复中明确说明。

## 导出

### PPTX 导出（可编辑）

生成可在 PowerPoint 中编辑、增删、修改的 .pptx 文件：

```bash
node scripts/export-pptx.js <file>                    # 同目录生成 .pptx
node scripts/export-pptx.js <file> -o output.pptx     # 指定输出路径
```

特性：
- 每个标题、段落、列表项都是独立文本框，可自由编辑
- 保留文字颜色、字体、粗体、斜体等格式
- 保留幻灯片背景（纯色和渐变）
- 保留 speaker notes
- 多列布局自动识别并还原
- 自动添加页码

依赖：`npm install pptxgenjs cheerio`

### PDF 导出

**方法一：浏览器内置**（推荐）
1. Chrome 打开 `file.html?print-pdf`
2. `Ctrl+P` / `Cmd+P` → 打印为 PDF

**方法二：Decktape**（命令行自动化）
```bash
npm install -g decktape
decktape reveal file.html output.pdf
```

## 交付

始终提供：

- 一个可运行的 HTML 文件（无需安装）
- 使用说明：浏览器打开，方向键导航，`S` 查看演讲者备注，`F` 全屏
- PDF 导出：见上方"导出"章节
- 是否执行了验证的明确说明

新手模式额外说明：
- 一句话"下一步"操作指引
- 溢出或字体空白的故障排除提示

可选本地服务器（`file://` 有问题时）：`npm run start` → `http://localhost:4173/file.html`

## 成功标准

优秀的结果：

- 第一眼看就是经过设计意图的
- 匹配用户的受众和语气
- 远距离可读
- 没有模板疲劳感
- 作为 reveal.js 演示文稿运行无布局问题

完成前必须通过：

1. 意图匹配：用户意图映射到此技能
2. 依赖：视觉方向体现 impeccable 级约束
3. 技术：reveal.js 结构有效
4. 可读性：无密集 bullet wall，无严重溢出
5. 交付：包含运行/导出说明和验证状态
6. 流水线：Phase 4 前 Gate 0-3 已确认

## 参考文件

按需加载获取详细指导：

- **`references/design-principles.md`** — 颜色系统（OKLCH）、字体规则、accent 使用限制、P0 反 AI-slop 规则
- **`references/layout-patterns.md`** — 版面池决策树、8+ 种布局的 HTML/CSS 代码、溢出预防、内容密度限制
- **`references/motion-delight.md`** — 动画时机、easing 曲线、fragment 模式、stagger 技巧、reduced-motion
- **`references/technical-specs.md`** — CDN 引入、Reveal 配置、CSS 约束、`clamp()` 流体排版、溢出救助决策树
- **`references/pipeline-phases.md`** — Gate 检查表、Phase 5 分层系统、Phase 6 完整执行步骤、溢出预防

## 模板

`examples/` 目录下的完整示例：

- **`template-01-editorial-serif.html`** — 优雅、正式
- **`template-02-dark-tech.html`** — 高对比、技术风
- **`template-03-minimal-spatial.html`** — 网格、空间感
- **`template-04-vibrant-gradient.html`** — 大胆、活力
- **`template-05-nature-fresh.html`** — 柔和、清新

## 脚本

- **`scripts/setup.sh`** — 首次环境检查
- **`scripts/lint-design.js`** — 设计规则静态分析（P0/P1/P2 检查）
- **`scripts/validate.js`** — Playwright 自动溢出检测 + 截图
- **`scripts/doctor.sh`** — 诊断检查
- **`scripts/bootstrap.sh`** — 安装开发依赖
- **`scripts/overflow-detect.js`** — 浏览器控制台溢出扫描
- **`scripts/auto-fix-css.js`** — 浏览器控制台 CSS 自动修复
- **`scripts/export-pptx.js`** — 导出可编辑 PPTX（需要 pptxgenjs + cheerio）
