# 布局原型引擎库 · Layout Archetypes

> 设计层的核心表达词汇。每个 archetype 是一个**参数化、跨声音可复用的布局引擎**，不是一个固定模板。
>
> **与 `layout-patterns.md` 的分工**：那一份是**无声音的通用容器**（列表、流程图、代码块、基础网格）——当内容需要一个"盒子"时去那里。本文件是**有设计意图的版面引擎**（满版分割、巨型锚点数字、报头封面、对峙对比、机制图）——当一页要"有设计感、有张力"时来这里。生成 deck 时，**主骨架应优先由 archetype 构成**，通用容器只做局部填充。

## 为什么需要 archetype（表达能力的关键）

旧版 DeepSeek deck 之所以"有设计感"，是因为它的每一页都是一个**为主题发明的版面**：报头封面、巨型日期数字、¥2 vs $2.50 对峙、MHA→MLA 压缩图。而种子模板的 folio-grid/plate-grid 是**含蓄、平衡、可复用但无声音**的。

archetype 层把"有设计感的版面"从"一次性发明"变成"可复用的引擎"：解耦 **voice**（配色/字体/语气，来自种子或自定义）与 **layout**（构图/张力/节奏，来自 archetype）。任意 voice × 任意 archetype 可组合，表达空间从"8 套死模板"炸开成"N 种声音 × M 种版式"。

**硬约束（呼应失败门禁 #9 换皮）**：生成 deck 时，若最终版面 = 种子模板原样复用（直接套 folio-grid/plate-grid 不改骨架），视为换皮失败。**主骨架必须由 ≥3 种 archetype 组合**，其中 ≥1 种是**为本主题发明的变体**（调过参数、改过结构，而非照抄）。

---

## 通用参数：尺度与用色（所有 archetype 共用）

archetype 的"大胆/克制"由两个全局参数控制。生成前在 Theme-to-Design Router 的**设计契约**里先定这两项。

### 字体尺度比（scale ratio）

`最大 display em ÷ 正文 em`。决定层级戏剧性。

| 预设 | 比例 | display 典型 | 气质 | 适用 |
|---|---|---|---|---|
| `newspaper-dramatic` | ≥5:1 | 5–6em | 报纸/编年/强冲击 | 历史、发布、宣言 |
| `editorial-quiet` | ~3:1 | 2.5–3em | 含蓄、研究、editorial | 复盘、报告、教学 |
| `launch-bold` | ~4:1 | 3.5–4.5em | 现代、产品、舞台 | 产品发布、营销 |

**退化信号**：若全 deck display ≤ 2.5em（scale ratio < 3:1），版面几乎一定太平。这是设计强度度量的第一条。

### 用色投入（color commitment）

| 预设 | 做法 | 风险 |
|---|---|---|
| `spot-1` | 1 个强调色，≤5% 面积，纯色场背景 | 最稳，易显平 |
| `spot-2-bold` | 1 主色 + 1 副色，**含满版色块面板** | 表达力强，需 AA 配对 |
| `ink-drama` | 墨黑/深色满版面板 + 专色 glow | 戏剧性最高 |

**AA 安全配对速查**（专色印在 cream/bg 上要够深）：
- 满版面板用 `var(--c-fg)` 做底、`var(--c-bg)` 做字 → 任意 voice 都高对比（前景反相）。
- 满版 accent 面板：`background: var(--c-accent); color: var(--c-bg)` → 需 accent 足够深（cobalt/oxblood/forest 可；亮蓝/亮金不可，需深化）。
- 副色（金/琥珀）**优先用在深色面板上**（深底高对比）；用在浅底上要深化到 AA（如 gold `#C99A3A` → ochre `#6E5212`）。

---

## Archetype 总览

| # | Archetype | 设计动作 | 典型用途 |
|---|---|---|---|
| A1 | Masthead Cover | 报头双线 + 巨型标题 + 印章 + 事实侧栏 | 封面 |
| A2 | Manifesto Statement | 巨型斜体命题 + 极端留白 | 核心主张/章节分隔 |
| A3 | Register Axis | 横轴里程碑节点 | 编年/路线图总览 |
| A4 | Full-Bleed Split | 满版深色/accent 面板 × 内容面板，非对称 | 起源/章节/对比 |
| A5 | Anchor Numeral | 单个巨型数字/日期做页面引力 + 证据列 | 事件页/数据锚点 |
| A6 | Face-Off Compare | 两值对峙 + 比率裁决 | 价格/新旧/方案对比 |
| A7 | KPI Grid | 3–4 粗边框卡 + 巨型斜体数字 | 档案/指标速览 |
| A8 | Mechanism Diagram | 前→后转换条（量化对比） | 技术机制/优化证明 |
| A9 | Evidence Table | 强调列高亮的表格 | 基准/台账/对比矩阵 |
| A10 | Pullquote | 上下双线 + 巨型斜体引言 | 第三方背书/金句 |
| A11 | Takeaway Roster | 编号顶边卡阵列（i/ii/iii） | 启示/结论/要点 |
| A12 | Masthead Closing | 报头收尾，呼应封面 | 结尾 |

---

## A1 · Masthead Cover（报头封面）

**设计动作**：用印刷报头的"双线+单线"建立权威感，巨型斜体标题占据视觉，印章行 + 事实侧栏填充信息密度。让封面像一份**策展过的档案**，不是一个标题页。

**参数**：标题尺度 `newspaper-dramatic`（5–6em）｜分栏比 主:侧 ≈ 1.5:1｜印章数 2–3｜侧栏事实 4–5 行。

**骨架**（voice 无关，token 来自种子）：
```html
<section class="deck-flex" style="flex-direction:column; padding:0; height:100%;">
  <div style="padding:1.2em 2.5em 0.7em;">
    <div style="border-top:3px double var(--c-fg); border-bottom:1px solid var(--c-fg);
                padding:0.55em 0 0.4em; display:flex; justify-content:space-between;
                font-family:var(--f-mono); font-size:0.55em; letter-spacing:0.16em;
                text-transform:uppercase; color:var(--c-fg-2);">
      <span>VOL. 01 · {系列}</span><span>EST. {年份}</span><span>{刊名}</span>
    </div>
    <div style="font-family:var(--f-display); font-size:clamp(2.8em,5em,6em);
                font-weight:600; font-style:italic; line-height:1; letter-spacing:0;
                color:var(--c-fg); margin-top:0.28em;">{主标题}</div>
    <div style="font-family:var(--f-mono); font-size:0.72em; letter-spacing:0.3em;
                color:var(--c-accent); margin-top:0.4em; text-transform:uppercase;">{副标 · 锚定主题}</div>
  </div>
  <div style="height:4px; background:var(--c-fg);"></div><!-- headline-rule -->
  <div style="padding:1em 2.5em; display:flex; gap:2em; flex:1; align-items:flex-start;">
    <div style="flex:1.5;">
      <div style="font-family:var(--f-display); font-size:1.65em; font-style:italic; line-height:1.28;">
        {一句行动主张，含 <em>关键词</em>}
      </div>
      <div style="display:flex; gap:0.7em; margin-top:1.2em; flex-wrap:wrap;">
        <span class="stamp">{事实1}</span><span class="stamp">{事实2}</span>
      </div>
    </div>
    <div style="flex:1; border-left:1px solid var(--c-border); padding-left:1.5em;">
      <div style="font-family:var(--f-mono); font-size:0.55em; letter-spacing:0.12em;
                  text-transform:uppercase; color:var(--c-fg-2);">关键事实</div>
      <!-- 4–5 行事实 -->
    </div>
  </div>
  <div class="pin">01 / cover</div>
</section>
```
**stamp（印章）**：`border:2px solid var(--c-accent); color:var(--c-accent); transform:rotate(-1.5deg)`，等宽字体大写 spaced。第二枚可用副色（深化到 AA）。

**voice 配对**：editorial 用 cream + 焦赭；dark-tech 把 bg 换深色、双线用 fg、accent 用古金；launch 用满版 accent 底 + 白字（scale 不变）。

**反模式**：标题 ≤ 3em（失去报头气势）；侧栏事实 > 6 行（拥挤）；印章 > 4 枚（杂乱）。

---

## A2 · Manifesto Statement（大字命题）

**设计动作**：一个巨型斜体命题占满 60%+ 画面，极端留白，让"主张"本身成为视觉。最少装饰。

**参数**：尺度 `newspaper-dramatic` 或 `launch-bold`｜正文 max-width 50ch｜留白 ≥ 40%。

**骨架**：
```html
<section class="deck-flex" style="flex-direction:column; justify-content:center; padding:0 5.5em; height:100%;">
  <div class="kicker">{章节标签}</div>
  <h1 style="margin:0.4em 0 0;">
    <em>{强调词}</em>，<br><span style="color:var(--c-fg);">{主张后半}</span>
  </h1>
  <div style="height:1px; background:var(--c-border); margin:1em 0;"></div>
  <p style="font-size:0.95em; max-width:50ch;">{一句支撑}</p>
</section>
```
**反模式**：命题拆成 3 行以上；加卡片/边框（命题页要的是留白，不是容器）；居中（左对齐更有主张感）。

---

## A3 · Register Axis（编年横轴）

**设计动作**：一条横轴 + 等距里程碑节点，把"时间/进程"可视化成一目了然的加速曲线。

**参数**：节点数 5–6（>6 拆页）｜当前/重点节点用 accent，其余 muted｜每节点 year + h4 + 1 行 p。

**骨架**：
```html
<div style="position:relative; margin-top:2.4em; padding-top:1.4em; border-top:2px solid var(--c-fg);">
  <div style="display:grid; grid-template-columns:repeat(6,1fr); gap:14px;">
    <div style="position:relative; padding-top:1.4em;">
      <!-- 节点圆点：top:-1.85em; 9–10px; accent 或 fg-3 -->
      <div style="font-family:var(--f-display); font-style:italic; font-size:1.5em; line-height:1;">{'YY.MM}</div>
      <h4 style="font-size:0.78em; margin:0.35em 0 0.2em;">{节点标题}</h4>
      <p style="font-size:0.56em;">{一行说明}</p>
    </div>
    <!-- 重复 5–6 个 -->
  </div>
</div>
```
**反模式**：节点 > 6；每节点 p > 1 行；所有节点都 accent（无主次）。

---

## A4 · Full-Bleed Split（满版分割）

**设计动作**：一整块满版色块面板（深墨或 accent）× 内容面板，非对称（40/60、52/48），制造最大色彩张力。`padding:0` 让色块铺到边。

**参数**：分栏比 非对称（38:62 / 52:48 / 42:58，禁 50:50）｜面板色 = `var(--c-fg)`（墨）或 `var(--c-accent)`（accent，需 AA 深）｜面板字 = `var(--c-bg)`。

**骨架**：
```html
<section class="deck-flex" style="height:100%; padding:0;">
  <div style="width:42%; background:var(--c-fg); color:var(--c-bg);
              display:flex; flex-direction:column; justify-content:space-between; padding:2.2em 2em;">
    <div>
      <div class="kicker" style="color:var(--c-accent);">{章节}</div><!-- 深底上副色要亮，用 accent 或定义 panel-accent -->
      <h2 style="color:var(--c-bg); margin:0.5em 0 0;">{面板标题}</h2>
    </div>
    <div style="font-family:var(--f-display); font-style:italic; color:var(--c-bg);">{面板引言}</div>
  </div>
  <div style="width:58%; display:flex; flex-direction:column; justify-content:center; padding:2.2em 2.6em;">
    <!-- 内容：时间线节点 / 列表 / 证据 -->
  </div>
  <div class="pin" style="color:rgba(240,233,216,0.6);">{NN / label}</div>
</section>
```
**voice 配对**：墨面板（`var(--c-fg)`）任意 voice 通用；accent 面板需 accent 够深（editorial 焦赭、dark-tech 古金在深底上 glow、launch 满版品牌色）。

**反模式**：50:50 对称（无张力）；面板字用 `var(--c-fg-2)` 半透明在深底上（对比不足）；`padding≠0`（色块不到边，张力尽失）。

---

## A5 · Anchor Numeral（巨型锚点数字）

**设计动作**：一个巨型日期/数字（5em 斜体）做页面引力中心，右侧/下方一列证据（背景、同期事件、基准）。**历史/数据主题的核心 proof object**。

**参数**：锚点尺度 5–5.6em｜分栏 主:证据 ≈ 1:1.1｜证据列用竖线分隔。

**骨架**：
```html
<div style="display:flex; gap:3em; align-items:flex-start;">
  <div style="flex:1;">
    <div class="kpi-label" style="color:var(--c-fg-3);">DATE</div>
    <div style="font-family:var(--f-display); font-size:clamp(3.6em,5em,5.6em);
                font-weight:600; font-style:italic; line-height:1; margin:0.15em 0;">11.29</div>
    <div class="kpi-label">{YYYY · WEEKDAY}</div>
    <div style="margin-top:1.3em; font-family:var(--f-display); font-style:italic; font-size:1.25em;">{事件名}</div>
    <p style="font-size:0.8em; margin-top:0.6em;">{一句说明 + <em>关键数</em>}</p>
    <div class="source">{来源 · verified}</div>
  </div>
  <div style="flex:1.1; border-left:1px solid var(--c-border); padding-left:2em;">
    <div class="kpi-label">{证据类型}</div>
    <!-- 同期事件 / 基准条 / 背景事实 -->
  </div>
</div>
```
**反模式**：锚点数字 < 4em（失去引力）；证据列和锚点等宽对称（用 1:1.1 制造轻微不平衡）；锚点数字用 sans（斜体 display serif 才有"档案日期"质感）。

---

## A6 · Face-Off Compare（对峙对比）

**设计动作**：两个值/方案**正面对峙**，最后给一个**比率裁决**（A/B → ≈1/8）。比普通双栏对比更有戏剧性，因为有个"判决"。

**参数**：分栏 52:48 / 48:52｜一侧满版色块（A4 变体）｜裁决用巨型斜体数字。

**骨架**（一侧满版 accent + 一侧浅底）：
```html
<section class="deck-flex" style="height:100%; padding:0;">
  <div style="width:52%; background:var(--c-accent); color:var(--c-bg);
              display:flex; flex-direction:column; justify-content:space-between; padding:1.9em 2.4em;">
    <div>
      <div class="kicker" style="color:var(--c-accent-2-on-dark);">{A 标签}</div>
      <div style="font-family:var(--f-display); font-size:clamp(3.4em,4.6em,5.2em);
                  font-style:italic; font-weight:600; color:var(--c-bg);">¥2</div>
      <div class="kpi-label" style="color:rgba(255,255,255,0.8);">{单位说明}</div>
    </div>
    <!-- A 的明细行 -->
  </div>
  <div style="width:48%; display:flex; flex-direction:column; justify-content:center; padding:2.2em 2.5em;">
    <div class="kpi-label">{B 标签}</div>
    <div style="font-family:var(--f-display); font-size:clamp(2.8em,3.4em,4em);
                font-style:italic; font-weight:600; color:var(--c-fg);">$2.50</div>
    <!-- B 的明细行 -->
    <div style="height:1px; background:var(--c-fg); margin:1.2em 0 1em;"></div>
    <div class="kpi" style="font-size:2.7em;">≈ 1/8</div>
    <div class="kpi-label">{裁决说明 · A/B}</div>
  </div>
</section>
```
**反模式**：两侧都浅底（无对峙）；无裁决（对峙没结论）；裁决数字 < 2em（没分量）。

---

## A7 · KPI Grid（指标卡阵）

**设计动作**：3–4 张粗边框卡，每卡一个巨型斜体数字 + 标签 + 注释。其中 1 张可反相（深底）做视觉重点。

**参数**：卡数 3–4（>4 拆页）｜数字尺度 2.7–3em｜边框 1px solid `var(--c-fg)`｜1 张 `background:var(--c-fg)` 反相。

**骨架**：
```html
<div style="display:grid; grid-template-columns:repeat(4,1fr); gap:1.1em;">
  <div style="border:1px solid var(--c-fg); background:var(--c-bg-2); padding:1.1em 1em;">
    <div class="kpi-label">{指标名}</div>
    <div style="font-family:var(--f-display); font-style:italic; font-weight:600;
                font-size:2.7em; line-height:0.95; color:var(--c-accent); margin-top:0.2em;">671B</div>
    <div style="font-size:0.6em; color:var(--c-fg-2); margin-top:0.25em;">{注释}</div>
  </div>
  <!-- 重复，1 张加 style="background:var(--c-fg); color:var(--c-bg);" 数字色用副色 -->
</div>
```
**反模式**：卡数 > 4；卡片加 box-shadow（ghost-card 禁令）；圆角 ≥ 16（over-rounding）；数字 < 2.5em（无冲击）。

> **禁令边界**：KPI 卡 = 1px 边框 + 实色底 + **无阴影** + radius<16 = **允许**，不是 ghost card。这是被鼓励的容器。

---

## A8 · Mechanism Diagram（机制图）

**设计动作**：把"优化/转换"量化成**前→后的条状对比**（如 MHA→MLA 压缩、优化前后延迟）。比抽象架构图更有说服力，因为能量化"省了多少"。

**参数**：两栏（前/后）+ 中间箭头｜后栏用 accent 满版高亮｜条数 3–5。

**骨架**：
```html
<div style="display:flex; gap:1.2em; align-items:stretch;">
  <div style="flex:1; border:1px solid var(--c-border); padding:0.8em;">
    <div class="kpi-label" style="color:var(--c-fg-3);">{前 · 传统}</div>
    <!-- 多条衰减条：height:1.15em; background:var(--c-fg); opacity 递减 -->
  </div>
  <div style="display:flex; align-items:center; font-size:2em; color:var(--c-accent);
              font-family:var(--f-display); font-style:italic;">→</div>
  <div style="flex:1; border:2px solid var(--c-accent); background:var(--c-accent);
              color:var(--c-bg); padding:0.8em;">
    <div class="kpi-label" style="color:var(--c-accent-2-on-dark);">{后 · 优化}</div>
    <!-- 更少更短的条，用 var(--c-bg) -->
    <div style="font-family:var(--f-mono); font-size:0.54em; margin-top:0.55em;">减少 {N}%</div>
  </div>
</div>
```
**反模式**：用 Mermaid/抽象节点图（无法量化）；后栏不用 accent 高亮（没体现"变好了"）；条数 > 5。

---

## A9 · Evidence Table（证据台账表）

**设计动作**：表格 + **一列用 accent 高亮**（主角列），把"主角 vs 对照"的对比压进表格。比纯表格更有立场。

**参数**：列 ≤ 5，行 ≤ 6｜主角列表头 + 单元格都用 accent｜数据列右对齐。

**骨架**：见旧 deck slide 11（R1 vs o1 vs Claude 表）。主角列 `<th style="color:var(--c-accent)">` + `<td style="color:var(--c-accent); font-weight:700">`。

**反模式**：列 > 5；无主角列高亮（表格无立场）；行 > 6（拆页）。

---

## A10 · Pullquote（引言页）

**设计动作**：上下双线 + 巨型斜体引言 + 左侧 meta 栏（编号/出处）。让引言像被**装裱**过。

**骨架**：
```html
<section class="deck-grid" style="grid-template-columns:0.3fr 0.7fr; gap:64px; align-items:center; padding:64px 80px;">
  <div style="border-right:1px solid var(--c-border); padding-right:56px;">
    <div style="font-family:var(--f-display); font-style:italic; font-size:4em; color:var(--c-accent); line-height:0.9;">№ 07</div>
    <div class="kpi-label">{出处类型}</div>
    <div style="font-weight:600;">{人名}</div>
    <div class="kpi-label" style="color:var(--c-fg-2);">{职位}</div>
  </div>
  <div style="font-family:var(--f-display); font-style:italic; font-size:1.85em; line-height:1.32; position:relative;">
    {引言，含 <em style="color:var(--c-accent)">关键词</em>}
  </div>
</section>
```
**反模式**：引言 < 1.5em（无装裱感）；引言用 sans（serif italic 才有引言质感）；引言超过 3 行。

---

## A11 · Takeaway Roster（启示阵列）

**设计动作**：3 张**顶部粗边**卡（i/ii/iii），每卡一个巨型罗马序号 + 标题 + 一行说明。比普通卡片网格更有"结论感"。

**骨架**：
```html
<div style="display:grid; grid-template-columns:repeat(3,1fr); gap:1.4em;">
  <div style="border-top:3px solid var(--c-accent); padding:0.8em 0;">
    <div style="font-family:var(--f-display); font-style:italic; font-size:2.6em; color:var(--c-accent); line-height:1;">i.</div>
    <h3 style="font-size:1.15em; margin:0.4em 0 0.3em;">{结论标题}</h3>
    <p style="font-size:0.66em;">{一行说明}</p>
  </div>
</div>
```
**反模式**：卡数 > 3；底部也加边框（失去"顶边签"质感）；序号 < 2em。

---

## A12 · Masthead Closing（报头收尾）

**设计动作**：呼应封面报头，居中收束。`To be continued.` 式的开放结尾，而非空"谢谢"。

**骨架**：见旧 deck slide 16/18。masthead + 巨型斜体结尾语 + headline-rule + 印章行 + 联系信息 mono。

**反模式**：用"Thank You"空页收尾；不呼应封面（失去首尾闭环）。

---

## 组合节奏（deck 级编排）

单页好不够，**deck 级的设计感来自 archetype 的节奏编排**。连续 2 页相同 archetype = 失败。

一个有设计感的 deck 骨架通常长这样（以 ~16 页编年主题为例）：

```
A1 封面 → A2 命题 → A3 编年总览 → A4 满版分割(起源)
→ A5 锚点数字(事件1) → A4 满版分割(章节1) → A5 锚点数字(事件2)
→ A7 KPI 阵(档案) → A8 机制图 → A9 证据表(基准)
→ A4 满版分割(冲击) → A10 引言 → A6 对峙对比 → A4 满版分割(人物)
→ A11 启示阵列 → A12 报头收尾
```

节奏要点：
- **满版分割（A4）作为节奏锚**，每 2–3 页出现一次，制造深/浅交替的呼吸。
- **锚点数字（A5）和 KPI（A7）交替**用，避免连续两页"大数字"。
- **命题（A2）/ 引言（A10）是呼吸页**，插在密集数据页之间降密度。
- **首尾闭环**：A1 报头 ↔ A12 报头。

---

## 金标准映射（旧 DeepSeek deck → archetype）

供生成时参照"这套主题该怎么用 archetype"：

| 旧 deck 页 | archetype | 说明 |
|---|---|---|
| 1 封面 | A1 | 报头 + 巨标 + 印章 + 事实栏 |
| 2 命题 | A2 | 14 个月 |
| 3 起源 | A4 | 满版墨面板 × 时间线 |
| 4/9/10 事件 | A5 | 巨型日期锚点 + 证据列 |
| 5 价格战 | A4 变体 | 满版 cobalt + 满版墨双面板 |
| 7 发版节奏 | A4 | 满版墨 × 卡片矩阵 |
| 8 V3 档案 | A7 | 4 KPI 卡（1 反相） |
| 11 benchmark | A9 | 主角列高亮表 |
| 12 冲击 | A8 变体 | 股价条 + 引言 |
| 14 价格对比 | A6 | ¥2 vs $2.50 → ≈1/8 |

**这正是它"有设计感"的来源**：每页都是一个有张力的 archetype，且节奏交替。把这套映射抽象出来，生成同类主题时可直接复用骨架、换 voice 和内容。

---

## 生成时的使用流程

1. **定 voice**：选种子或自定义配色/字体 token（见 `design-polish.md` 种子 token；尺度/用色预设见 `design-fundamentals.md` §1、§3）。
2. **定参数**：在设计契约里写下 scale ratio（newspaper-dramatic / editorial-quiet / launch-bold）+ color commitment（spot-1 / spot-2-bold / ink-drama）。
3. **选 archetype 序列**：按上面的"组合节奏"为每页分配 archetype，确保 ≥3 种、≥1 种本主题发明变体、无连续 2 页相同。
4. **填内容**：每个 archetype 用真实 proof object（日期/数字/引言/来源），不软化。
5. **自检**：去色后，每页的结构是否仍能认出是哪个 archetype？若多页去色后是同一种"左标题+右网格"，就是换皮，回 step 3。
