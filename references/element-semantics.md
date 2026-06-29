# PPT 元素语义系统

> 元素语义总入口。先判断元素承担什么论证任务,再进入 `motion-delight.md`、`icon-system.md`、`table-system.md`、`data-viz.md`、`diagram-system.md`、`image-system.md` 等专项实现文件。

## 核心原则

1. **元素先有语义,再有样式**:每个元素必须能回答“它解释哪个 action title / proof object”。颜色、动效、图标形状是第二步。
2. **一个元素一种职责**:图标不能伪装 proof object,表格不能硬讲趋势,动画不能弥补静态信息不成立。
3. **静态成立,动效增强**:导出 PPTX 或 reduced-motion 后,页面仍必须能读懂主张。
4. **PPT 服务内容**:元素选择来自内容形状,不是来自模板里已有组件。

## 权威边界

本文件是**路由与语义验收入口**,不是第二套组件手册。它决定“该不该用这个元素、它证明什么、在哪个阶段检查”。具体 CSS/SVG/HTML 制造细则以叶子文档为准:

- 动画制造细则: `motion-delight.md`
- 图标制造细则: `icon-system.md`
- 表格制造细则: `table-system.md`
- 数据图表制造细则: `data-viz.md`
- 架构图/流程图制造细则: `diagram-system.md`
- 图片/截图制造细则: `image-system.md` / `image-driven-deck.md`
- 页面家具安全区: `pin-safety.md` / `failure-gates.md`

若本文件与叶子文档在制造参数上冲突,以叶子文档为准;若在“元素是否服务主张”上冲突,以本文件和 `visual-verdict` 的语义评审为准。

## 阶段矩阵

| 阶段 | 元素语义动作 | 阻断信号 |
|---|---|---|
| **P1 引导** | 产出每页元素清单:主 proof object、辅助元素族、禁用元素族、动画解释任务、需要加载的专项 reference。 | 只写“用图表/用图标/加动效”,没有说明它证明什么。 |
| **P3 创作/评审** | 审查内容-元素贴合度:元素是否解释 action title,是否抢主 proof object,是否只是装饰。 | 动画只是进场;图标替代证据;表格在讲趋势;图片只是廉价背景。 |
| **P4 制造/生成** | 先读本文件,再按元素族加载专项文件;每页最多 1 个主 proof object,辅助元素不得抢焦点。 | 未声明元素清单就生成 HTML;元素 CSS/SVG 不遵守 Reveal/token 约束。 |
| **P5 优化** | 元素体系弱先回 P1/P3 改语义或骨架,不要只调 CSS。 | visual-verdict 指出图示不解释主张,但只改颜色/字号。 |
| **P6 检查/验收** | `element-quality-check.js` 查客观元素质量;`visual-verdict` / 人工审阅查元素是否服务主张。 | 机器无溢出但读者不知道图/动效/表格为什么存在。 |

## P1 Router 字段

```text
元素语义策略:主 proof object 类型____;必须出现的元素族____;禁用/少用的元素族____;动画承担的解释任务____;表格/图表/图片/代码的选择理由____。
```

## 元素族总览

| 元素族 | 主要任务 | 专项文件 |
|---|---|---|
| Proof Object / 论证对象 | 承担本页主证明 | 本文件 + `layout-archetypes.md` |
| Motion / 动画 | 解释组装、流动、增长、状态、揭示 | `motion-delight.md` |
| Icon / 图标 | 辅助状态、动作、分类、方向 | `icon-system.md` |
| Table / 表格 | 精确值查找、多维对比 | `table-system.md` |
| Data Viz / 数据图表 | 趋势、对比、占比、分布、异常 | `data-viz.md` |
| Diagram / 架构图/流程图 | 节点、连线、层级、时序、状态 | `diagram-system.md` |
| Image / Screenshot / Visual Asset | 实景、产品、界面、证据或情绪锚点 | `image-system.md` / `image-driven-deck.md` |
| Code / Terminal / Log Scene | 代码、终端、日志、diff 的证据现场 | `layout-patterns.md` 代码段;必要时新增专项 |
| Metric / KPI / Anchor Number | 大数字、比率、日期、基准 | `data-viz.md` / `layout-archetypes.md` |
| Quote / Evidence / Citation | 观点、证据、出处分层 | `layout-patterns.md` 引用段 + evidence ledger |
| Annotation / Callout / Connector | 标注、引线、箭头、坐标解释 | `diagram-system.md` / `icon-system.md` 连接器 |
| Page Furniture | topbar、pin、footer、source、页码 | `pin-safety.md` / `failure-gates.md` |
| Whitespace / 留白 | 主动控制节奏和视觉权重 | `design-fundamentals.md` |

## 元素族规则

### Proof Object / 论证对象

- **Use when**:每页都必须有。它可以是图表、表格、地图、流程、代码现场、产品界面、证据卡、引用墙、照片或大数字。
- **Do not use when**:没有“不用”的场景;若没有可视 proof object,先重写 action title 或拆页。
- **Design move**:让 proof object 占据页面视觉重心,辅助文字围绕它解释 so what。
- **Manufacturing rules**:每页最多 1 个主 proof object;物理表面型对象必须和承载面共享坐标系。
- **QA checks**:`visual-verdict` 必须能判断 proof object 是否解释 action title;`test-spatial-integrity.js` 查坐标漂移。

### Motion / 动画

- **Use when**:内容有时间、状态变化、机制运行或演示节奏:组装 assembly、流动 flow、增长 growth、状态切换 state、对比揭示 reveal。
- **Do not use when**:只是为了“高级感”的进场、漂浮、弹跳、循环装饰;静态态看不懂时也不能靠动画补。
- **Design move**:让动画顺序就是讲解顺序。HBM 类机制页可用分层组装、信号流、数据条增长、回到 slide 时重播。
- **Manufacturing rules**:高级动画每页最多 1 种;时长 ≤1200ms;必须有 `prefers-reduced-motion` 和 PPTX 静态 fallback。
- **QA checks**:`element-quality-check.js` 查 motion 子分;`visual-qa --show-fragments` 查首屏/全显态;`visual-verdict` 查动画是否解释机制。

### Icon / 图标

- **Use when**:表达状态、动作、分类、方向提示或小型 UI cue。
- **Do not use when**:需要证明主张、承载数据、替代产品/流程/证据对象。图标不是 proof object。
- **Design move**:图标只作为文字或节点的辅助信号,大小和颜色低于主 proof object。
- **Manufacturing rules**:只用 inline SVG;`stroke="currentColor"`;不用 Font Awesome、Emoji 或外部图标库。
- **QA checks**:`element-quality-check.js` 查 icon 子分;`lint-design.js` 查 Emoji / 外部库;人工查图标是否抢主视觉。

### Table / 表格

- **Use when**:读者需要精确值查找、多单位并列、方案矩阵、基准台账。
- **Do not use when**:想表达趋势、分布、占比、量级对比或情绪冲击;这些应改用数据图表。
- **Design move**:保留最少结构线,突出主角列/推荐行/关键数字,让数字自己说话。
- **Manufacturing rules**:遵守 T1-T6;列 ≤7,行 ≤8;数字右对齐;有 `<thead>` / `<th>`;无全网格和斑马纹。
- **QA checks**:`element-quality-check.js` 查 table 子分;`visual-verdict` 查表格是否解释 action title 而非 Excel 截图感。

### Data Viz / 数据图表

- **Use when**:讲趋势、对比、占比、分布、排名、异常点、变化幅度。
- **Do not use when**:读者必须读取大量精确值;应转成表格或拆页。
- **Design move**:图形形态来自问题:趋势用线/面积,对比用条形,占比用环/堆叠,异常用标注。
- **Manufacturing rules**:真实数据必须有 source / evidence status;不得捏造;趋势线不用 `T`;SVG text 不继承 stroke。
- **QA checks**:`test-evidence-ledger.js` 查证据标签;`test-spatial-integrity.js` 查 SVG 文本/曲线;视觉评审查图表是否解释主张。

### Diagram / 架构图 / 流程图

- **Use when**:讲系统关系、流程步骤、层级、依赖、状态机、时序。
- **Do not use when**:只是把 bullet 画成盒子;或 Mermaid 默认图直接作为最终视觉。
- **Design move**:节点表达实体,连线表达关系,布局方向表达阅读路径。
- **Manufacturing rules**:节点用 grid/flex,连接层可 SVG;每个节点只放必要标签和可选单一图标;避免绝对定位节点。
- **QA checks**:`element-quality-check.js` 查 diagram 子分;`visual-verdict` 查关系是否一眼可读。

### Image / Screenshot / Visual Asset

- **Use when**:真实视觉对象本身是内容:产品界面、城市/美食/旅游实景、人物/场景、证据截图。
- **Do not use when**:图片只是填空、氛围背景、和页面主张无关。
- **Design move**:定义照片角色:hero、evidence、texture、comparison、process still;每图必须有出处或用户提供说明。
- **Manufacturing rules**:图像驱动 deck 跑 `audit-image-assets.js`;截图要裁出关键区域,不要整屏缩到读不清。
- **QA checks**:资产门禁查断图/低清/放大/重复;视觉评审查图片是否解释 action title。

### Code / Terminal / Log Scene

- **Use when**:技术论证需要代码、命令、日志、diff、错误现场或运行证据。
- **Do not use when**:只是把文档整段粘进 `<pre>`;代码不能说明主张。
- **Design move**:突出关键行、输入/输出、错误/修复、前后 diff;用 terminal frame 或 code lens 做现场感。
- **Manufacturing rules**:每页代码行数 ≤14;每行尽量 ≤72 字符;关键行用背景/边线/行号标注;长日志改为 evidence card 或分屏 diff。
- **QA checks**:`check-overflow.js` 查 inline/code 越界;人工/视觉查关键行是否可读、是否解释 action title。

### Metric / KPI / Anchor Number

- **Use when**:单个数字、日期、比率、基准本身就是记忆锚点。
- **Do not use when**:数字没有 denominator、time window、source 或上下文;不要用“约/大致”软化逃避证据。
- **Design move**:大数字做锚点,旁边放小而密的证据列或基准解释。
- **Manufacturing rules**:绑定单位、时间范围、样本量、来源或 `illustrative`;大数字不得压 page furniture。
- **QA checks**:`test-evidence-ledger.js` 查标签;`design-strength-check.js` contentSpecificity 查数字软化。

### Quote / Evidence / Citation

- **Use when**:需要引用原话、证据片段、来源说明或专家/用户声音。
- **Do not use when**:引用只是装饰金句,没有来源或无法支撑主张。
- **Design move**:区分“观点文本”“来源信息”“证据状态”;引用墙只保留能互相增强的 3-5 条。
- **Manufacturing rules**:来源靠近引用;精确数字必须 verified/user-provided/illustrative;不要把 notes 当唯一来源。
- **QA checks**:evidence ledger gate 查精确数字;视觉评审查引用是否变成无证据装饰。

### Annotation / Callout / Connector

- **Use when**:需要把读者视线精确引到 proof object 的某个点、层、节点或异常。
- **Do not use when**:箭头/标签浮在空处,不指向具体对象。
- **Design move**:标注应该减少解释文字,不是增加噪音;引线细、短、低对比,关键词清楚。
- **Manufacturing rules**:标注和目标对象放同一坐标系;避免覆盖数据点和文字;连接器使用 `currentColor` 或主题 token。
- **QA checks**:`test-spatial-integrity.js` 查 marker-label collision;视觉评审查标注是否真能帮助理解。

### Page Furniture

- **Use when**:提供导航、页码、来源、版权、photo credit、进度、deck 上下文。
- **Do not use when**:承担主命题、抢视觉重心、压住正文或 proof object。
- **Design move**:topbar/pin/footer/source 是低层级页面家具,应稳定、可预测、避开安全区。
- **Manufacturing rules**:遵守 `pin-safety.md`;底部满宽元素必须为 pin 留安全带/对角/隐藏;source 和 photo credit 不能互相重叠。
- **QA checks**:`test-label-overlap.js`、`test-pin-collision.js`、`visual-qa` 查重叠/残影;`test-lint-main-claim.js` 查 pin 不承担唯一主题。

### Whitespace / 留白

- **Use when**:需要突出主张、给 proof object 呼吸、制造舞台感或阅读节奏。
- **Do not use when**:只是因为内容不够,或导致视觉重心失衡。
- **Design move**:把留白当元素:一侧锚点、一侧配重;大留白必须让主对象更有重量。
- **Manufacturing rules**:用 grid/flex/padding 管理留白,不要用随机 absolute 偏移;移动端/投影尺度下仍要平衡。
- **QA checks**:`visual-check.js` 看重心/跨度;视觉评审查“空”是否服务主张。

## 制造前检查清单

- [ ] 每页有 1 个主 proof object。
- [ ] 每个辅助元素能说明它服务 action title 的哪一部分。
- [ ] 动画属于 assembly / flow / growth / state / reveal 之一,且静态态成立。
- [ ] 图标只做辅助状态/动作/分类/方向,不抢 proof object。
- [ ] 表格只用于精确值查找;趋势/占比/分布改用数据图表。
- [ ] 图片/截图/代码/引用都有来源、证据状态或用户提供说明。
- [ ] page furniture 不压主内容,不承担唯一主张。

## 检查分工

| 检查 | 负责 |
|---|---|
| 客观合规 | `grade-gate.js` |
| 元素基础质量 | `element-quality-check.js` |
| 元素是否解释主张 | `visual-verdict.js` / 人工审阅 |
| 图像资产硬伤 | `audit-image-assets.js` |
| page furniture 重叠 | `test-label-overlap.js` / `test-pin-collision.js` |
