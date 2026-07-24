# Reveal.js Presentation Skill

> 生成有设计感的演示文稿，输出为单个 HTML 文件，浏览器打开即用。**无需安装任何东西。**

## 快速开始

```
你：做一个关于 AI 趋势的 PPT，受众是产品经理，8 页
AI：[生成 HTML 文件]
你：[双击 HTML 打开浏览器，方向键演示]
```

就这样。生成的 HTML 通过 CDN 加载 reveal.js、pptxgenjs 和 Google Fonts；图标使用内联 SVG，不依赖 Font Awesome。

- 方向键：翻页
- `S`：演讲者备注
- `F`：全屏

## 导出

| 格式 | 方法 | 需要安装？ |
|------|------|-----------|
| **PPTX** | HTML 内置按钮（右上角悬停/聚焦显示），点击即下载；导出脚本默认内联在 HTML 中 | ❌ 不需要 |
| **PDF** | Chrome 打开 `file.html?print-pdf` → 打印为 PDF | ❌ 不需要 |
| **CLI PPTX** | `node scripts/export-pptx.js file.html` | 需要 Node.js |

## 可选安装

如果你需要 CLI 工具（命令行导出、自动验证、本地预览）：

```bash
bash scripts/install-all.sh    # 一键安装所有可选依赖
```

安装内容：

| 工具 | 用途 |
|------|------|
| pptxgenjs + cheerio | CLI PPTX 导出 |
| Playwright | 自动溢出检测和截图验证 |
| http-server | 本地预览 `npm run start` |
| impeccable | 视觉设计增强 |

没有 Node.js？没关系——核心功能（生成 + 查看 + 导出）全在浏览器中完成。

## 种子模板（10 套）

每套模板是一份已验证的设计语法 seed（配色 + 字体 + 语气 + 页面原语），对应 `examples/` 下的完整 HTML 范例。

| 模板 | 设计语法 | 适用场景 |
|------|----------|----------|
| template-01-editorial-serif | 档案馆 / 策展（材料墙、印章、图版） | 研究报告、品牌历史、展览、策略复盘 |
| template-02-dark-tech | 控制室（雷达、终端、状态面板） | 开发者大会、SRE、架构发布、技术产品 |
| template-03-minimal-spatial | 建筑制图（图纸、尺寸链、剖面） | 产品架构、方法论、复杂系统、组织设计 |
| template-04-vibrant-gradient | 发布会现场（主屏、摄影机框、产品 drop） | 品牌开场、社区产品、营销、Keynote |
| template-05-nature-fresh | 田野桌面（笔记本、钉图、样本标签） | 培训、研究 workshop、教育、用户洞察 |
| template-06-brutalist | 野兽派 / 反模板（裸露硬边框、荧光警示） | AI 批判、先锋创意、宣言式、反潮流品牌 |
| template-07-memphis | 80s Memphis 复古（撞色色块、几何、粗描边） | 创意机构、活动、作品集、文化品牌 |
| template-08-isometric | 等距 3D 信息图（30° 立体层叠、侧视网格） | 平台架构、系统流程、路线图、阶段规划 |
| template-09-editorial-photo | 影像编辑（全幅摄影、图说证物、图册节奏） | 城市 / 旅行 / 美食 / 产品实拍、影像驱动叙事 |
| template-10-clinical-trial | 监管档案（临床顶线、证据活页、监管量表） | 临床试验 topline、证据 binder、合规汇报 |

> 模板只是 voice seed，不是终态。每次生成前先产出「设计语法说明 + 设计契约」，主骨架由 `references/layout-archetypes.md` 的 archetype 组合而成，**不原样套模板**（否则触发失败门禁 #9）。详见 [SKILL.md](SKILL.md) 的 Theme-to-Design Router。

## 风格空间：适配任意主题/风格（不止 10 模板）

10 个种子模板是已验证的 voice seed，**不是表达天花板**。voice（风格肤色）× archetype（版式构图）正交组合 = 14 voice × 12 archetype 表达空间，且 voice 可任意扩展。

- **14 voice 库**：`tokens/voices.json` 单一真相源 —— editorial-serif / chinese-ink-wash（legacy）+ consulting / minimal / data / launch / education / pitch / technical / editorial / brutalist / luxury / illustrated / retro。
- **任意风格词自动路由**：`node scripts/voice-router.js "赛博朋克 / 和风 / 金融 / 本草纲目 / JWST 星云 …"` → 推荐 voice + 6 维推断 + 备选（中英文 + 长尾关键词）；命中沉淀 case（`tokens/seed-cases.json`）返回 `caseRef` 指向 case.md + seed.html 作 B 解法参考。
- **组合生成（路径 B，风格任意时默认）**：`node scripts/generate-deck.js --input deck.json`（voice 缺省或 `'auto'` 时自动推断）→ archetype 组合 → 十四门禁。
- **加新风格** = `tokens/voices.json` 加一条 + `node scripts/build-voice-tokens.js`，无需改代码。详见 [`references/style-space.md`](references/style-space.md)。

```bash
node scripts/voice-router.js --demo              # 看主题→voice 路由示例
node scripts/generate-deck.js --demo --gates     # 组合生成 + 门禁串联
node scripts/build-voice-tokens.js --check       # 校验 voice registry
```

## 设计语言 demo（可生成）

```bash
node scripts/generate-style-examples.js    # 生成 12 份不同设计语言的小型 demo deck
```

这些是用于横向对比设计语言差异的独立 demo（consulting memo / minimal keynote / data story / product launch / education / pitch / architecture / magazine / brutalist / luxury / illustrated / memphis），由脚本生成、**未纳入 git**；不是种子模板——种子模板见上表。

## 编排与交付（authoring & delivery）

生成只是其中一环。完整链路用一份 **Deck Manifest**(`deck.manifest.json`)作为唯一可编辑状态，串起布局、证据、媒体、视觉签字到导出:

```
deck.manifest.json  ──►  run-deck-pipeline.js  ──►  run.json(state=ready) + ppt/
   唯一真相              fail-closed 状态机           可审计交付物
```

| 环节 | 脚本 / 文件 | 作用 |
| --- | --- | --- |
| 布局契约 | `references/layout-registry.json` + `scripts/deck-manifest.js` | 13 个 archetype(A1-A12+IMG)的 props/mediaSlots/pptx 策略;`validateDeckManifest` 强制 schema + 证据语义 |
| 渲染 | `scripts/generate-deck.js --manifest` | manifest → HTML;每页盖 `data-archetype` + `data-slide-id` + `data-evidence-id`(可追溯) |
| 媒体 | `scripts/media-stage.js` | 暂存媒体(SSRF 防护 + SHA256 去重);相对路径按 manifest 目录解析 |
| 状态机 | `scripts/run-manifest.js` + `run-deck-pipeline.js` | draft→rendered→needs-visual-signoff→ready/blocked;`ready` 需 manifest 校验+渲染+QA 地板+PPTX 保真+视觉签字全过 |
| 工作台 | `workbench/`(server.js + app.js) | 127.0.0.1 受控编辑器,只改 manifest 公开 props(ETag 并发,禁 contenteditable/eval/innerHTML=userValue) |
| PPTX | `references/pptx-export-strategies.json` + `analyze-pptx-fidelity.js` + `export-pptx.js` | 每个 archetype 声明 editable/hybrid/raster 策略;保真分析 + 导出 |
| 验收 | `scripts/qa.js` | 十四门禁 + design-strength≥75 + element-quality + editorial + 图像审计 + 视觉层;写结构化 `<deck>-qa-summary.json` |

**证据分级**(manifest `slides[].evidence[]`,`validation.md` 详述):`verified`(须 url+locator+checkedAt)/ `user-provided`(须 note)/ `illustrative`(禁 source)/ `needs-source`(交付阻塞)。

**视觉签字**:生产用 `qa.js --visual-signoff-file signoff.json`(须 reviewer/reviewedAt/screenshotsManifestSha256/decision=pass,可审计);`--visual-signoff`/`VISUAL_VERDICT_SIGNOFF=1` 仅 `NODE_ENV=test` 可用。

**端到端证明**:`npm run test:authoring-e2e` 用 `tests/fixtures/workbench-e2e.manifest.json`(8 页/8 archetype/媒体槽/verified+user-provided 证据/hybrid PPTX/动效/收尾)跑完整链路,断言 `run.json.state===ready` 且每个 artifact 落盘。

## 结构

```
revealjs-presentation/
├── SKILL.md              # AI 技能定义（核心文件）
├── README.md             # 本文件
├── DESIGN.md · GUIDE.md · PRODUCT.md   # 项目设计 / 指南 / 产品说明
├── package.json          # Node.js 依赖
├── examples/             # 10 套种子模板（template-01..10）
├── references/           # 31 份设计参考文档 + inspiration/ + seed-gallery/ + template-invariants.json
│   ├── layered-architecture.md       # 六层架构 + 概念交叉索引
│   ├── design-fundamentals.md        # 设计四维根（尺度/张力/用色/隐喻→形式）
│   ├── style-space.md                # 风格空间（voice × archetype 正交组合）
│   ├── layout-archetypes.md          # 12 个布局 archetype 引擎库
│   ├── layout-patterns.md            # 通用容器（列表/流程/代码/网格）
│   ├── content-budget.md             # 内容预算 / 溢出决策树
│   ├── pin-safety.md                 # Pin 安全区规则
│   ├── first-draft-recipes.md        # 首稿配方速查
│   ├── css-skeleton.md               # CSS 骨架 + reveal 陷阱
│   ├── design-polish.md              # 设计精致度 / 语法 / 容器处方
│   ├── design-principles.md          # 配色 / 字体 / 反模式
│   ├── element-semantics.md          # 元素语义总入口（论证任务→专项实现）
│   ├── icon-system.md                # inline SVG 图标库
│   ├── diagram-system.md             # 流程/树/时序/关系/状态图
│   ├── data-viz.md                   # 数据可视化组件
│   ├── table-system.md               # 表格系统 / data-ink
│   ├── image-system.md               # 图片滤镜 / 裁切 / 设备框
│   ├── image-driven-deck.md          # 图像驱动 deck（找图 / 选图 / 排图）
│   ├── motion-delight.md             # 动效时机 / easing / 高级模式
│   ├── visual-check.md               # 垂直平衡启发式
│   ├── technical-specs.md            # CDN / Reveal 配置 / 三端适配
│   ├── failure-gates.md              # 19 条失败门禁
│   ├── validation.md                 # 验证脚本与门禁总参考（三层模型/十四门禁/阻断表）
│   ├── design-generation-workflow.md # B 解法生成 workflow（主题→设计 DNA→deck）
│   ├── off-template-style-gap.md     # 模板外风格 gap 契约（四件套补齐）
│   ├── seed-creation-workflow.md     # 种子沉淀 workflow（B 解法子流程，可选）
│   ├── seed-quality-standard.md      # 好种子 6 维验收标准
│   ├── pipeline-phases.md            # 专业模式 Phase Gate
│   ├── launch-grade.md               # 发布会级标准
│   ├── template-differentiation-audit.md  # 跨模板相似度审计
│   ├── impeccable-integration.md     # impeccable 集成
│   ├── inspiration/                  # 标杆库（11 份风格拆解 + showcases/）
│   ├── seed-gallery/                 # 种子 case 库（SEED-CASE-INDEX + 3 case）
│   └── template-invariants.json      # 种子模板对象契约数据
├── scripts/             # 工具脚本（验证 / 导出 / 安装 / lint）
└── tests/               # 测试 fixtures
```

完整能力清单、生成流程、设计规则、验证脚本说明见 [SKILL.md](SKILL.md)。
