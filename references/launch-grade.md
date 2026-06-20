# 发布会级 Deck 标准

用于用户要求"发布会级"、Keynote、品牌开场、惊艳、顶级、public launch、产品发布，或明确希望接近品牌介绍页 / 发布会开场这种质量时。目标不是更花，而是让每页像现场大屏上的一个明确品牌论点。

## Golden Reference

- `tests/fixtures/launch-grade-principles.html` 是 golden reference 样本，合同测试会验证它存在；生成发布会级 deck 时先打开/截图，再比对新稿是否有同级别的品牌识别度、色彩决断、页面原型变化和导出完整性。
- 复制的是质量机制而非具体版式：开场即品牌、强颜色场、单页单论点、页面原型切换、1-2 个 signature moments、截图和 PPTX 证据。
- 该样本用来校准原则，不要逐页复制其结构。

## Page Archetypes

发布会级 deck 至少使用 4 种原型，12 页以上建议 6 种以上。连续 2 页不要使用同一种结构。

| 原型 | 适用论点 | 质量要求 |
|------|----------|----------|
| Full-bleed brand opener | 品牌登场、产品开场 | 首屏无需点击即可识别品牌/产品；大色块或大字占主导 |
| Statement wall | 战略句、价值观、章节转场 | 一句话占主要视觉面积；不能像普通标题页 |
| Key metrics | 用户、增长、规模、效率 | 1 个主数字 + 2-4 个辅助数字；保留数据来源或口径 |
| Culture/interaction proof | 社区、弹幕、评论、行为 | 视觉化互动机制，不用普通 bullet list |
| Ecosystem map | 业务版图、能力关系 | 用 deck-grid 或 deck-flex 放内容节点，SVG 只做连接层 |
| Engine/split proof | 技术/商业引擎解释 | 左右强对比或主从关系明确；每侧最多 3 个要点 |
| Commercial chapter | 商业化、变现、业务模型 | 用颜色场或阶梯图表达，不做卡片堆叠 |
| Quote/voice | 用户声音、创作者声音 | 声音本身是视觉重心；引用必须短、可读、可投影 |
| Manifesto/finale | 收束、愿景、call to action | 只保留高记忆度语句；避免总结清单 |
| Map/globe | 地域、网络、出海、覆盖 | 地理是 proof object 时使用；节点不得绝对定位正文 |

## Visual QA Loop

1. 先写 storyboard：每页只写标题、核心论点、页面原型、proof object。
2. 生成 HTML 时优先使用稳定可导出的 HTML/CSS/SVG；section 级 flex/grid 必须使用 `deck-flex` 或 `deck-grid`。
3. 运行 `node scripts/lint-design.js <file> --json`，P0 必须为 0；P1 建议修复（发布会级可选 P1 清零，但门禁底线是 P0）；P2 不得出现重复模板感或过弱签名页。
4. 运行 `node scripts/validate.js <file>`，无正文/图表/标题溢出。
5. 运行 `node scripts/visual-qa.js <file> --out /private/tmp/<deck>-visual` 和 `node scripts/visual-qa.js <file> --show-fragments --out /private/tmp/<deck>-visual-all`，逐页审阅初始与满载状态。
6. 运行 `node scripts/visual-verdict.js <file> --out /private/tmp/<deck>-verdict`，让视觉模型按固定 rubric 判断图示是否解释主张、标签是否可读、页面家具是否干扰主体；任何 blocker 都回到 storyboard / P5 修复。若无模型 key，只能用 `--dry-run` 记录 prompt 与截图，不能声称模型判定通过。
7. 做“页脚主题反查”：逐页读左下角 `pin`，确认其中的主题词已经在主视觉区域出现或被等价表达。`pin` 只能是索引，不能是本页唯一标题；否则把主题词升级到标题、色块、主图形、核心数据或 quote。
8. 做“颜色角色反查”：主标题/主数字/主 proof object 是否使用最高层级颜色；来源、页码、脚注是否退到低层级。若强调色随机散落或页脚比主标题更像主题，返工。
9. 对照 golden reference（`tests/fixtures/launch-grade-principles.html`）：新稿至少要有同等级的开场识别、布局变化、色彩决断和完整页密度；若看起来像普通汇报、模板页或报告页，回到 storyboard。
10. 运行 `node scripts/export-pptx.js <file> -o /private/tmp/<deck>.pptx`，确认 PPTX 至少保留标题、核心结论、主图形和色彩层级。
11. 运行 `node scripts/test-launch-grade-contract.js`，确保 skill 的发布会级流程、golden reference 和验证命令没有退化。

## Scoring Rubric

发布会级任务必须达到 18/20，且任何失败门禁都不能触发。

| 维度 | 4 分 | 2 分 | 0 分 |
|------|-----|-----|-----|
| Brand/stage impact | 首屏像发布会开场，品牌/产品不可误读 | 有品牌但像普通封面 | 首屏像报告标题页或需要点击才看懂 |
| Archetype variety | 4+ 原型且切换自然 | 3 种以内或连续重复 | 大量标题+列表/卡片 |
| Proof clarity | 每页一个视觉论点，数据/关系/声音可读 | 局部信息过密或主次弱 | 堆材料、无视觉重心 |
| Browser integrity | 初始/满载截图无裁切、残影、控件污染 | 少量边缘风险但不影响演示 | 任何核心内容溢出或遮挡 |
| Export integrity | PPTX 保留主视觉和可编辑文本 | 局部降级但结论保留 | 导出丢失核心信息 |

## Failure Gates

任一项出现都必须返工：

- 开场页不是第一眼品牌/产品信号，或主标题/副标题初始被 fragment 隐藏。
- 连续 3 页使用近似"标题 + 卡片/列表"结构。
- 用装饰渐变、玻璃卡、side-stripe、ghost card、Mermaid 风格图来替代真正布局。
- 主要内容节点用 absolute 坐标硬摆，导致缩放或导出风险。
- 数据、用户量、商业指标没有来源、口径或"示意"标注。
- 视觉 QA 未审阅截图，只报告 lint/validate 通过。
- 页脚 `pin` 里的主题词没有进入主视觉区域，导致用户必须看页脚才知道这页在讲什么。
- 改动单页视觉结构后未重新截图复核，或截图中仍有顶边/底边裁切、导航遮挡、主标题弱于脚注。
- PPTX 未导出或导出后核心标题/结论/proof object 丢失。

## Delivery Evidence

最终回复或审阅记录至少包含：

- HTML 文件路径。
- lint / validate / visual-qa / visual-verdict / export-pptx / test-launch-grade-contract 的命令和结果。
- 截图目录和 PPTX 输出路径。
- 与 golden reference（`tests/fixtures/launch-grade-principles.html`）的简短差距判断：已接近、仍偏普通、或不适用。
