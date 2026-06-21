# 失败模式门禁 / Failure Mode Gates

15 条来自真实生成失败复盘的硬门禁。SKILL.md 给出一句话概括 + 修复入口；本文件保留完整说明、根因和反例。

任何门禁触发都视为阻断项，优先级高于"看起来风格统一"。

十门禁（lint + validate + label-overlap + lint-main-claim + evidence-ledger + color-role + contrast-aa + canvas-fill + check-overflow + spatial-integrity）自动覆盖关键约束与设计硬规则；失败门禁由十门禁及 test-pin-collision / test-reference-contract 等专项脚本联合检查。

---

## 1. 原生语法 / Native Grammar Gate

品牌、平台、产品类 deck 必须写出该对象自己的行为和界面证据。不要只写"杂志感、科技感、年轻化、发布会感"。

**例**：
- 小红书必须考虑瀑布流笔记卡、搜索框、评论区、标签、收藏、种草链路、用户头像和手机 feed 几何
- B 站必须考虑播放器、弹幕、UP 主、分区、投币/充电、直播/番剧等原生对象

**自检**：把颜色字体拿掉后，这页是否仍然属于这个主题？

## 2. 审美通道门禁

如果使用 Cormorant Garamond、DM Sans、cream editorial、杂志拼贴、玻璃卡片、通用渐变大字等高频 AI 审美通道，必须说明为什么主题本身就是这个媒介；否则重新选择更贴近主题行为的隐喻和页面原语。

完整字体黑名单见 `references/impeccable-integration.md`。

## 3. 证据台账 / Evidence Ledger Gate

所有精确数字、排名、百分比、估值、DAU/MAU/GMV 必须标记为：

- `verified` + source URL
- `user-provided`
- `illustrative`

"公开披露"、"行业数据"、"示意数据"**单独出现不够**；无可靠来源时改成区间、趋势或显著标注"示意"，不得用权威语气。

## 4. 主命题进场门禁 / Main Claim Gate

`pin`、页码、脚注、导航标签不能承担本页唯一主题。

每页必须能在主视觉区域（标题、色块、主图形、核心数据或 quote）读到这一页的中文/英文主命题；页脚只做索引。

若页脚写"价格屠夫 / 发版节奏 / 行业冲击"等概念，而画面主体没有等价表达，必须把该概念升级到主标题或 proof object 中。

`scripts/test-lint-main-claim.js` 自动检测。

## 5. 颜色角色门禁

主命题颜色必须是本页最高层级之一。不要把标题放进低对比灰色、页脚淡色或装饰色；强调色用于主张、关键数字、路径或证据，不用于随机高亮。

色块页尤其要检查：标题、主数字、来源和页脚是否各自有明确层级，而不是互相抢。

## 6. 密度和溢出阻断

```bash
node scripts/validate.js <file>
```

`total > 0` 是**阻断项**，必须修复到 `total = 0` 才能交付。

lint 通过不等于布局通过。若溢出来自信息密度，**优先级**：
1. 拆页
2. 降文字
3. 改 proof object
4. **最后才**缩字号硬塞

## 7. 截图复核门禁

任何视觉结构调整后必须重新运行 `visual-qa` 并审阅对应截图。若修改后出现：

- 顶边/底边裁切
- 导航遮挡
- 元素被裁
- 主标题弱化
- 右侧证据区被压扁

继续迭代。**不要用"代码看起来合理"替代截图判断**。

## 8. fragment 首屏门禁

任一页**初始截图**必须有可读的核心结论和 proof object。

不能把主体内容全部藏在 fragment 之后，导致第一页或中间页打开像空稿、半成品或只有背景。

`scripts/test-initial-slide-visible.js` 自动检测。

## 9. 骨架换皮门禁 / Skeleton Reskin Gate

如果两个主题的：
- cover 都是"左标题 + 右图形"
- proof 页都是"左说明 + 右表格"
- closing 页都是居中大字

那就是**换皮失败**。

如果多个模板都落成"左信息栏 + 中央主物件 + 右结论栏"，也属于换皮失败。

使用种子模板时，至少重写 `cover / proof / mechanism / close` 中的**两个**页面骨架，并让 class 命名反映主题原生对象，例如：

`blueprint-sheet` · `dimension-chain` · `title-block` · `main-screen` · `audience-floor` · `camera-frame` · `notebook-spread` · `specimen-envelope` · `terminal-shell` · `price-ladder` · `civic-command` · `handoff-bus` · `failure-rail` · `editor-stage` · `analysis-bench` · `question-rail` · `sample-rail` · `endpoint-strip` · `issue-board` · `lookbook-strip` · `cue-stack`

不能只替换颜色、字体和背景。

## 10. 跨模板相似度门禁 / Cross-template Similarity Gate

连续生成多套模板时，必须把 5-10 张首页截图**并排审查**。

若去掉颜色后仍能看出同一套"巨型标题 + 单个对象 + 页脚 pin"语法，必须重构最相似的模板。

| 主题 | 应该像 |
|------|--------|
| 金融 | 终端 cockpit |
| 城市 | 地图界面 |
| 流程 | 系统运行板 |
| 代码 | 编辑/调试现场 |
| 数据 | 分析工作台 |

## 11. 种子模板对象契约 / Seed Object Contract

维护已实现的 `examples/template-01` 到 `template-08` 时，每个模板都必须保留 `references/template-invariants.json` 中登记的：

- cover/proof/mechanism/close 角色
- 首屏领域对象
- 全 deck proof object
- 高风险物理版面的 `physicalContract`（surface ownership / exclusion / alignment / placement / collision）

并通过：

```bash
node scripts/test-reference-contract.js
```

这不是命名洁癖，而是防止模板退化成同一套骨架换皮。

## 12. 高风险布局预警

以下是溢出高风险布局，生成时**先用紧凑版或拆页版**，再用截图验证：

- 2x2 指标格 + 长标题 + 来源
- 4-8 个分类卡
- 四步竖向流程 + 旁注
- 密集时间线 + fragment
- 左右分栏三段证据表

## 13. Pin 安全区门禁 / Pin Safe Zone Gate

每页 `.pin` 元素必须独占左下角（或被显式移到的右下角/底部居中）一块 **~200px×40px** 的可读区域，禁止被表格末行、底部 colophon、统计数据行、装饰雷达/audience-floor 等元素覆盖。

生成时遵守**三选一**：

| 方案 | 适用 | 实现 |
|------|------|------|
| (a) 安全带 | 底部有满宽内容（colophon/h-foot/stat-row/matrix 末行） | section `padding-bottom: ≥80px` |
| (b) 对角 | 内容偏左下 | `.pin { right:64px; left:auto }` |
| (c) 隐藏 | finale / 全屏数据页 | `style="display:none" data-qa-ignore="decorative"`，靠 Reveal 自带 `slideNumber:'c/t'` 索引 |

**必须运行**：

```bash
node scripts/test-pin-collision.js examples/*.html
```

输出 `OK: all pin regions clear.` 才能交付。任何 collision 报告都视为阻断项。

**装饰元素白名单标记**：背景框、雷达、audience-floor、sheet-frame、灯光 beams、装饰 SVG line 等必须加 `data-qa-ignore="decorative"`，否则会被该脚本误报。

**禁止滥用 `data-qa-ignore`**：正文、标题、数据、表格行、图表均不得使用此标记逃避检测。

## 14. 空间完整性门禁 / Spatial Integrity Gate

有“物理承载面”的 slide，proof object 必须和承载面共享坐标系。典型承载面包括：建筑图纸、蓝图网格、地图底板、白板、桌面、终端屏幕、舞台主屏、路线板。

**真实失败**：`template-03-minimal-spatial` 封面中 `.blueprint-sheet` 用 `top/right/bottom/left` 定位，平面图和尺寸链却作为 sibling 用 section 百分比定位。机器 overflow 全绿，但截图里平面图下滑到图纸外，和背景网格错位。

生成时遵守：

1. **首选容器法**：把 proof object、尺寸链、标注放进同一个 surface 容器内。
2. **次选变量法**：承载面和内部对象共用同一组 CSS 变量，例如 `--sheet-left` / `--sheet-right` / `--sheet-bottom`。
3. **禁止漂浮法**：承载面只是 absolute 背景，核心图形/标注作为 sibling 用不相干的 `%` 和 `px` 混合定位。

维护或新增种子模板时，必须把这类关系登记为 `references/template-invariants.json` 的 `physicalContract`，至少覆盖：

- `surfaceRules`：承载面 owns 哪些对象，允许最大 spill 几 px
- `exclusionRules`：哪些对象绝不能相交（如图纸网格 vs 标题栏）
- `alignmentRules`：哪些边/轴必须对齐（如尺寸链 vs 外墙）
- `placementRules`：主体对象在承载面里的方向和安全留白
- `collisionRules`：标号、节点、标签、文字之间的禁止碰撞

所有建筑制图页还必须保留三个安全区：页标 `.kicker` 不得贴/压 sheet-frame 顶线；`.north-mark` 不得压主标题；可见 `.pin` 不得压 `.route-board` / `.matrix-grid` / `.void-foot` / `.cover-bottom`。

SVG 内部也算坐标系：`<text>` 不能贴着 viewBox 右边靠默认裁切“省略”；右侧尺寸标注应使用 `text-anchor="end"`、扩大 viewBox，或把坐标移回 viewport 内。若 SVG 根节点或父 `<g>` 设置了 `stroke`，所有 `<text>` 必须显式 `stroke:none; paint-order:fill;`，否则文字会继承描边，在投影尺度发糊。

**必须运行**：

```bash
node scripts/test-spatial-integrity.js <file>
```

该脚本会阻断：

- `.blueprint-sheet` 外的 `.plan-drawing` / `.dimension-chain` / `.plate-notes` 漂出图纸边界
- 显式 `data-qa-surface="name"` 的表面与 `[data-qa-contained-by="name"]` 内容不对齐
- `physicalContract` 声明的 surface / exclusion / alignment / placement / collision 违约
- 页标压 sheet-frame、north mark 压标题、pin 压图板/页脚信息
- 建筑图纸封面中的平面 SVG 被 CSS 拉伸变形
- 建筑图纸封面中的尺寸链左右端未贴齐外墙左右边界
- 建筑图纸封面中的序号 marker 与房间 label 重叠
- SVG `<text>` 的实际渲染 bbox 超出 SVG viewport，被 viewBox 裁切
- SVG `<text>` 继承可见 `stroke`，导致架构图/图表标签变糊
- 数据图 SVG 中使用 `T` 平滑二次贝塞尔，导致趋势线末端反射上翘或非数据形态

机器只能抓典型几何错误；仍需看 `visual-qa` 截图确认：网格线、标注、proof object 的“物理世界”是否是同一张纸/同一块屏/同一张地图。

## 15. 视觉语义评审门禁 / LLM Visual Verdict Gate

固定脚本适合稳定检测 bbox、溢出、对比度、坐标系和已知碰撞；但它们不擅长判断“这张图到底有没有讲清楚”。当 slide 包含建筑图、路线图、图表、机制图、仪表盘、流程图或任何复杂 proof object 时，必须补跑视觉模型评审：

```bash
node scripts/visual-verdict.js <file> --out /tmp/<deck>-verdict
```

该脚本会先用 `visual-qa` 渲染截图，再把截图和固定 rubric 交给视觉模型，输出 `visual-verdict.json`。以下类别中的 `blocker` 都必须回到 storyboard / P5 修复：

- `unclear-proof-object`：图示不知道在表达什么，或只是装饰。
- `unreadable-label`：标签没有几何重叠，但投影尺度不可读。
- `chart-does-not-explain-claim`：图表和标题主张脱节。
- `weak-visual-hierarchy`：三秒内读不出主张与证据关系。
- `frame-collision` / `navigation-collision`：页面家具在视觉上干扰主体，即使脚本未判定相交。

无 `OPENAI_API_KEY` 时可以运行 `--dry-run` 生成同一套截图和 prompt：

```bash
node scripts/visual-verdict.js <file> --dry-run
```

但 dry-run 只证明评审输入已生成，**不等于视觉模型判定通过**；最终交付必须明确说明未执行模型视觉判定。

### 真实重影案例（来自 5 模板优化复盘）

1. **雷达 + pin**：左下角雷达 SVG 与 pin "01 · cockpit · cover" 重叠 → 雷达移右下角并加 `data-qa-ignore="decorative"`
2. **stats 行 + pin**：底部 "12 TEAMS · 8 WKS · 3 FAILURE MODES" 压在 pin "02 · statement" 上 → pin 移到右下
3. **matrix 末行 + pin**：matrix-grid 最后一行 CORE 顶到底部，pin "04 · matrix · mechanism" 在表格里 → pin 用方案 (c) 隐藏
4. **colophon + pin**：launch-close 满宽 colophon "Spring Reveal · 2026" 与 pin "07 · close" 重叠 → pin 用方案 (c) 隐藏
5. **ops-copy + kicker**：statement 页 `position:absolute` 的 ops-copy 与 flex 居中的 kicker 同 y 坐标 → 删除冗余 ops-copy，简化为只用 kicker

这五处是 SKILL.md 主线"先紧后松、留出安全带"指引的**反面教材**。

## 四层防御（高几何精度风格 + 全局防溢出）

建筑制图 / 紧凑 dark-tech 风格对几何精度要求高，subagent 生成时反复出现叠放：长英文标签溢出矩形、表格关键字列太窄断词（`Controll/er`/`Reposito/ry`）、行内文字越画布右边界被截、absolute 标线越画布消失、时间线描述文字与底部进度条重叠。

**四层防御**：

1. **设计层** — `references/layout-archetypes.md` 加溢出防护规格；`examples/template-03-minimal-spatial.html` 强化种子范本；物理表面必须声明“表面容器 + 内部对象”的坐标关系，并在 `template-invariants.json` 的 `physicalContract` 中登记
2. **引导层** — SKILL.md 硬规则 + Theme-to-Design Router 设计契约（文字 `right ≤ 画布 - 24px` / 时间线节点 `≥ 200px` / 标线 `right ≤ 100%` / proof object 与承载面共享坐标系 / 标号不得覆盖文字）
3. **harness 兜底** — `template-03` `<style>` 加 10 条全局 CSS（含 `overflow: hidden !important` + `html/body overflow-x: hidden` + `section padding 0 24px` + 时间线 `desc max-height: 3.6em` + `bar margin-top: 12px` + `svg max-width: 100%` 防 SVG 拉伸越界 + `focus-visible` a11y 强化）
4. **js 脚本检查** — `scripts/check-overflow.js` 用 playwright 测每页 bbox（文字越界 / 元素重叠），集成 `grade-gate`（G9）；`scripts/test-spatial-integrity.js` 测物理表面 containment、manifest physicalContract、SVG text clipping/stroke、数据曲线 `T` 命令，集成 `grade-gate`（G10）

**impeccable false-positive 提示**：`template-03` 的 em-dash（—）与 PLATE 编号（PLATE I/II/III、01-06 section 标记）是 minimal-spatial 建筑制图风格的**固有产物**（图纸标注 / 图版编号），**非 AI cadence tell**。`/impeccable audit` 会标这两个，属已确认 false positive，无需修改——改了就不是建筑制图了。
