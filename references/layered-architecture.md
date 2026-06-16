# 六层架构与项目取舍

这份文档记录对外部项目 / skill 思路的调研结论，并把真正适合本仓库的部分收敛成 PPT 生成流程。原则很简单：只吸收能提高交付质量、可验证性或生成稳定性的做法；不把外部项目当作必须安装的依赖。

六门禁（lint + validate + label-overlap + lint-main-claim + evidence-ledger + color-role）自动覆盖关键约束与设计硬规则；失败门禁由六门禁及 test-pin-collision / test-reference-contract 等专项脚本联合检查。

## 调研结论

| 来源 | 证据 | 有价值 | 不适用 / 暂不采用 | 结论 |
|---|---|---|---|---|
| `Phlegonlabs/Powerpoint-fancy-design` | README 描述其将 page-structured Markdown 转为 `1600x900` HTML slides，再导出 PNG / PPTX；还包含 slide role、safe zone、layout prototype、geometry preserve、rubric audit 等 reference 链。<https://github.com/Phlegonlabs/Powerpoint-fancy-design> | 内容优先、逐页 Markdown handoff、slide role 分类、安全区、几何保持、公开场合 audit、PNG/PPTX 验证思路 | 不照搬 `1600x900` 画布、每页单独 HTML、PNG 图片型 PPTX 默认管线；本项目保持 `1280x720`、单文件 Reveal.js、浏览器内 PPTX 导出 | **强吸收流程思想，不替换本项目管线** |
| `Akxan/ppt-agent-skill` | README 列出 26 风格、18 图表、Bento Grid、6 步 pipeline、HTML→SVG→PPTX 后处理和 reference library。<https://github.com/Akxan/ppt-agent-skill> | 风格库作为参考地图、图表复杂度分层、Bento 作为页面原语、typography / failure modes / pipeline compatibility 的文档组织方式 | 不整套导入 26 风格；不强制 7 题三层访谈；不改成 HTML→SVG→PPTX 重管线；不让品牌名参考变成仿站模板 | **吸收“风格/图表词库”，拒绝重管线和重访谈** |
| `Gabberflast/academic-pptx-skill` | README / SKILL.md 明确其负责 academic deck 的内容和结构：action titles、logical argument、ghost deck test、one exhibit per results slide、chart annotation、citations、conclusions slide。<https://github.com/Gabberflast/academic-pptx-skill> | action title、ghost deck、论证结构、图表注释、引用 / 证据台账、结论页优先于 “Thank You” | 不采用其白底 / 单字体 / 三色上限作为所有 deck 默认；这些只适合学术 / 分析型语境 | **表达逻辑强吸收，视觉约束按场景采用** |
| `Leonxlnx/taste-skill` + 本地 `impeccable` | taste-skill README / SKILL.md 强调 anti-slop、brief inference、variance / motion / density 三拨盘、设计系统 map、pre-flight；本仓库已有 `.agents/skills/impeccable/` 并映射到 `references/impeccable-integration.md`。<https://github.com/Leonxlnx/taste-skill> | 反 AI 模板味、brief→design read、三拨盘、字体 / 色彩 / 布局反射拒绝、bolder / quieter / distill / polish | taste-skill 面向 landing / portfolio / redesign，不是 slide 专用；不照搬 React/Tailwind/GSAP/图标库规则；不要求每次运行全部命令 | **吸收审美判断和三拨盘，保留本仓库 slide 约束** |
| `Owl-Listener/designer-skills` + `mistyhx/frontend-design-audit` | designer-skills 的 visual-critique 覆盖 hierarchy、brand consistency、composition、typography、colour、affordance、information density；frontend-design-audit 用 15 heuristics 输出 severity、principle references、concrete fixes。<https://github.com/Owl-Listener/designer-skills> <https://github.com/mistyhx/frontend-design-audit> | 最终视觉审查、层级、可读性、对齐、拥挤、可访问性、响应式 / 导出风险、severity 排序 | 不新增一个只靠主观判断的审核层；frontend app 的 loading/forms/undo 等原则只按 slide 场景映射，不机械套用 | **用七维视觉批评 + 15 原则补充本仓库 QA** |
| `ultragoal` 思路 | 本机 OMX ultragoal 使用 brief、goals、ledger、checkpoint、steering、final gate 做 durable plan | 复杂任务需要目标、证据、checkpoint、最终门禁；适合模板升级 / 大范围 skill 改造 | 普通“做个 PPT”不要求启动 OMX runtime；Codex App outside-tmux 下不依赖 `omx question` / team runtime | **吸收治理词汇，快速模式轻量化** |

## 本项目采用的六层职责

| 层 | 本项目采用方式 | 生成时必须做到 |
|---|---|---|
| 1. 生产管线层 | 保持单文件 Reveal.js HTML + 内联 CSS/JS + 浏览器 PPTX 导出；借鉴 page-structured Markdown、safe zone、geometry preserve | 生成前规划 `<section>` 数；生成后 `grade-gate.js` 全绿；不破坏 Reveal section 堆叠 |
| 2. 风格系统层 | 使用种子模板 + 主题原生设计语法；借鉴风格库但不照搬预设 | 提供 2-3 个风格候选或一个明确设计隐喻；至少 4 种页面原语；去色后仍不像同一骨架 |
| 3. 表达逻辑层 | 生成前先做 ghost deck：slide role、action title、proof object、evidence status | 每页一个主命题；数据和引用标 `verified` / `user-provided` / `illustrative`；图表有注释 |
| 4. 审美约束层 | 用 impeccable + failure gates 拦截 AI 模板味 | 避免 ghost cards、通用渐变、重复 tiny eyebrow、骨架换皮；按需要 bolder / quieter / distill |
| 5. 质量审查层 | 机器门禁优先，截图复核补充 | lint P0=0、validate total=0、label-overlap exit 0、lint-main-claim exit 0、evidence-ledger exit 0、color-role exit 0；P6 用 visual-qa 审阅初始和展开状态 |
| 6. 任务治理层 | 快速模式只保留 brief + final evidence；专业 / 发布会级才用 checkpoint 和 ledger | 最终回复说明文件路径、验证命令、结果、未验证风险；复杂任务记录 steering 原因 |

## 生成前轻量合同

快速模式不强制 7 题访谈，但生成 HTML 前必须在内部完成这张合同：

```text
Brief: 主题 / 观众 / 页数 / 语言 / 交付格式
Ghost deck: 每页 role + action title + proof object + evidence status
Style grammar: 设计隐喻 + 页面原语 + 图表语法 + 禁止套路
Production route: 单文件 HTML / Reveal 4.6.0 / 1280x720 / PPTX 导出
QA route: grade-gate + visual-qa 是否需要跑；若不能跑，说明原因
```

## 取舍规则

1. **不牺牲零安装体验**：普通用户打开 HTML 就能演示和导出；任何重管线只作为维护 / 发布会级可选项。
2. **不让风格库变成模板库**：风格名称只帮助选语法；每个主题仍要重写 proof object 和页面动作。
3. **先论证再设计**：先写 action title / ghost deck，再选字体、色彩、Bento 或图表。
4. **图表先轻后重**：优先纯 HTML/CSS/SVG；只有复杂地图、关系网络、交互证明等确实需要网页能力时才引入 JS。
5. **机器门禁不被主观覆盖**：designer / audit 只能补充问题，不能把 `grade-gate.js` 红灯改成可交付。

## 概念交叉索引

> 本仓库参考资源的"地图的地图"。按六层架构分组：生产管线→风格系统→表达逻辑→视觉资产→动效→质量与治理。

### 1. 生产管线 — 从 HTML 到交付

| 概念 | 文件 | 用途 |
|------|------|------|
| 技术规范 | `references/technical-specs.md` | CDN、Reveal 配置、clamp 字号 |
| 发布会级标准 | `references/launch-grade.md` | golden-reference、页面原型、评分 rubric |

### 2. 风格系统 — 视觉语法与页面原语

| 概念 | 文件 | 用途 |
|------|------|------|
| 设计精致度 / 语法 | `references/design-polish.md` | Router、页面原语、签名时刻 |
| 配色 / 字体 / 反模式 | `references/design-principles.md` | 色彩策略、字体黑名单、反 AI 模板 |
| CSS 骨架 | `references/css-skeleton.md` | token / 重置 / 溢出 / 排版 / pin / fragment |
| 布局模式 | `references/layout-patterns.md` | 15+ 布局、超框案例 |

### 3. 表达逻辑 — 内容预算与首稿落地

| 概念 | 文件 | 用途 |
|------|------|------|
| 内容预算 / 溢出决策 | `references/content-budget.md` | 高度估算、密度上限、VP_TOP |
| 首稿配方 | `references/first-draft-recipes.md` | 常见内容→布局映射 |
| Pin 安全区 | `references/pin-safety.md` | 默认位置、三方案、白名单 |

### 4. 视觉资产 — 图标 / 图表 / 数据图 / 图片

| 概念 | 文件 | 用途 |
|------|------|------|
| 图标系统 | `references/icon-system.md` | 85 个 inline SVG |
| 图表系统 | `references/diagram-system.md` | 流程/树/时序/关系/状态图 |
| 数据可视化 | `references/data-viz.md` | 环形/柱状/进度环/折线/数字看板 |
| 图片处理 | `references/image-system.md` | 滤镜、裁切、设备框、混合模式 |

### 5. 动效 — 过渡与 Delight

| 概念 | 文件 | 用途 |
|------|------|------|
| 动效与惊喜 | `references/motion-delight.md` | easing、fragment、stagger、reduced-motion |

### 6. 质量与治理 — 门禁、审计、流程

| 概念 | 文件 | 用途 |
|------|------|------|
| 总流程 / 项目取舍 | `references/layered-architecture.md`（本文件） | 六层职责、调研结论 |
| 失败门禁 | `references/failure-gates.md` | 13 条门禁完整说明 + 重影案例 |
| 专业模式 | `references/pipeline-phases.md` | Phase Gate 检查表、访谈、P5 分层 |
| 模板差异审计 | `references/template-differentiation-audit.md` | 跨模板相似度审查方法 |
| impeccable 集成 | `references/impeccable-integration.md` | 命令到演示场景的映射 |

### 契约与模板

| 概念 | 文件 | 用途 |
|------|------|------|
| 种子模板 | `examples/template-01..05-*.html` | 5 套已实现模板 |
| 模板契约 | `references/template-invariants.json` | 机器可读对象登记 |
