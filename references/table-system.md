# 演示文稿表格系统

> 系统级表格设计引导。`data-viz.md §8` 给了一个对比表组件;本文件补齐**理论、多类型、决策树、反例**,并作为 `scripts/element-quality-check.js` 表格子分(T1–T6)的判据来源。
>
> **定位**:表格是"精确值查找"的媒介,不是装饰。精品表格的唯一标准是——**让数字自己说话,墨水都花在数据上**。
>
> 先读 `references/element-semantics.md` 的 Table 规则。表格用于精确值查找、多维对比、方案矩阵；如果要表达趋势、分布、占比或量级冲击,应改用 `data-viz.md` 的图表而不是把表格做花。

---

## 目录

1. [设计理论基础](#设计理论基础)
2. [表格 vs 图表:何时用表](#表格-vs-图表何时用表)
3. [六条硬规则(T1–T6)](#六条硬规则t1t6)
4. [表格类型 → 决策树](#表格类型--决策树)
5. [模板库](#模板库)
6. [chartjunk 反例(反面教材)](#chartjunk-反例反面教材)
7. [通用 CSS 工具类](#通用-css-工具类)
8. [PPTX 导出说明](#pptx-导出说明)
9. [与其他参考文件的配合](#与其他参考文件的配合)

---

## 设计理论基础

### Tufte 数据墨水比(Data-Ink Ratio)

> Data-ink ratio = 1 − (可擦除而不损失数据信息的墨水占比)

**核心原则:最大化数据墨水。** 表格里的每一根线、每一块填充、每一个边框,要么承载信息,要么删掉。理想的表格墨水比趋近 1.0——只剩数字和最小必要的结构线。

落到表格:
- **删**全网格线(竖线几乎总是冗余)
- **删**单元格边框、深色填充、阴影、3D 斜面
- **留**表头下沿一条线、行底一条淡线(引导视线,非封闭)
- **留**汇总行/推荐行的轻量强调(承载"这是结论"的信息)

### 认知负荷理论(Sweller)

表格的阅读是"逐格扫描"。任何不承载信息的视觉噪声(斑马纹、彩虹色、粗边框)都会**占用工作记忆**,降低读数速度。精品表格的留白和淡线是**为眼球铺路**,不是装饰。

---

## 表格 vs 图表:何时用表

借鉴 FT Visual Vocabulary 的"按意图选择"思路——**先定想表达什么,再选媒介**:

| 你想表达 | 用表格 | 用图表 |
|---------|-------|-------|
| 精确数值查找(延迟 12ms vs 8ms) | ✅ | ✗ |
| 多单位并列(价格 / 延迟 / 吞吐 / 成本) | ✅ | ✗ |
| 模式 / 趋势 / 分布 | ✗ | ✅ |
| 量级对比一眼看出谁大谁小 | ✗ | ✅(柱状/条形) |
| 占比 / 份额 | ✗ | ✅(环形) |

**一句话判据**:读者需要**读出具体数字**→ 用表;读者只需**感受相对大小**→ 用图。混用时,表配一句话结论,图配一个精确锚点。

---

## 六条硬规则(T1–T6)

这六条是 `element-quality-check.js` 表格子分的机器判据,违反即扣分。

### T1 · 数据墨水比(无全网格线)

**禁止**画完整网格(每格四边框)。允许的结构线只有:
- 表头底部 1 条(2px,淡色)
- 每行底部 1 条(1px,更淡)
- 汇总行顶部 1 条(可选,2px,强调色)

```css
/* ✓ 好:只有横向结构线,无竖线 */
table { border-collapse: collapse; }
th { border-bottom: 2px solid oklch(from var(--c-fg-3) l c h / 0.2); }
td { border-bottom: 1px solid oklch(from var(--c-fg-3) l c h / 0.1); }
```

```css
/* ✗ 坏:全网格 = chartjunk */
td, th { border: 1px solid #999; }
```

### T2 · 列对齐

| 列类型 | 对齐 | 理由 |
|-------|------|------|
| **数字 / 货币 / 百分比** | `text-align: right` | 小数点对齐,便于纵向比较 |
| **文本(名称/方案)** | `text-align: left` | 阅读起始锚点一致 |
| **布尔 / 状态符号(✓/✗)** | `text-align: center` | 单字符居中视觉平衡 |
| **表头** | **跟随该列数据对齐** | 数字列表头也右对齐,不要全左对齐 |

> 常见错误:表头一律左对齐、数字列居中。两者都破坏纵向扫读。

### T3 · 表头存在

必须用 `<thead>` + `<th>`,不允许用加粗的首行 `<td>` 冒充表头。表头处理:
- `text-transform: uppercase` + `letter-spacing: 0.06em`
- `font-size: 0.85em`(比正文小一档,弱化噪音)
- `color: var(--c-fg-3)`(muted,不抢正文)
- `font-weight: 500`(不要 700,过粗像标题)

### T4 · 行列阈值

| 维度 | 上限 | 超出怎么办 |
|------|------|-----------|
| 列数 | **≤ 7** | 拆成两张表,或砍掉次要列 |
| 行数(含表头) | **≤ 8** | 拆页,或只留 Top N + "其他"汇总行 |

> 超过阈值 = 单页信息过载,违反内容预算。宁可两张干净的表,不要一张塞满的表。

### T5 · 强调色用途

`--c-accent` 在表格内**只用于**:
- 推荐行/最优方案的极淡背景(`oklch(from var(--c-accent) l c h / 0.06)`)
- 关键数字本身(`color: var(--c-accent)`)
- 汇总行顶部线

**禁止**:给随机单元格高亮、给整列染色、用强调色做斑马纹背景。强调色是"结论信号",用滥了就失效。

### T6 · 无斑马纹过填充

**禁止**大面积 `nth-child(even)` 交替深色背景。斑马纹是 Excel 默认审美,在演示文稿里是 chartjunk。

替代:用**极淡的行底线**引导视线(见 T1),需要突出某行时用 T5 的 accent 极淡背景(单行,非交替)。

```css
/* ✗ 坏:斑马纹 */
tr:nth-child(even) { background: oklch(from var(--c-fg) l c h / 0.15); }

/* ✓ 好:无斑马,靠行底线;推荐行单独 accent */
tr.recommended { background: oklch(from var(--c-accent) l c h / 0.06); }
```

---

## 表格类型 → 决策树

```
要展示的数据是什么形态?
├─ 多方案多维对比(方案 × 指标) → 对比表(§模板 1)
├─ 功能/特性清单(有/无 ✓✗)    → 特性矩阵(§模板 2)
├─ 财务/经营摘要(收入/成本/利润)→ 财务摘要表(§模板 3)
├─ 价格档位(基础/专业/企业)    → 定价表(§模板 4)
├─ 时间安排/路线图(阶段 × 时间)→ 时间线表(§模板 5)
└─ SLA / 状态监控(指标 × 阈值) → 状态表(§模板 6)
```

---

## 模板库

### 模板 1 · 对比表(最常用)

多方案横向对比。详见 `data-viz.md §8` 的完整示例。要点:推荐行用 accent 极淡背景 + `font-weight:600` + `★` 标记。

### 模板 2 · 特性矩阵(Feature Matrix)

功能清单,单元格用 ✓/✗ 或 ●/○,居中对齐。

```html
<table style="width:100%;border-collapse:collapse;font-size:0.82em;">
  <thead>
    <tr>
      <th style="text-align:left;padding:0.55em 1em;color:var(--c-fg-3);
        text-transform:uppercase;letter-spacing:0.06em;font-size:0.85em;font-weight:500;
        border-bottom:2px solid oklch(from var(--c-fg-3) l c h / 0.2);">能力</th>
      <th style="text-align:center;padding:0.55em 1em;color:var(--c-fg-3);
        text-transform:uppercase;letter-spacing:0.06em;font-size:0.85em;font-weight:500;
        border-bottom:2px solid oklch(from var(--c-fg-3) l c h / 0.2);">基础版</th>
      <th style="text-align:center;padding:0.55em 1em;color:var(--c-accent);
        text-transform:uppercase;letter-spacing:0.06em;font-size:0.85em;font-weight:600;
        border-bottom:2px solid var(--c-accent);">专业版</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom:1px solid oklch(from var(--c-fg-3) l c h / 0.1);">
      <td style="padding:0.55em 1em;">多端同步</td>
      <td style="padding:0.55em 1em;text-align:center;color:var(--c-fg-3);">✓</td>
      <td style="padding:0.55em 1em;text-align:center;color:var(--c-accent);">✓</td>
    </tr>
    <tr style="border-bottom:1px solid oklch(from var(--c-fg-3) l c h / 0.1);">
      <td style="padding:0.55em 1em;">团队协作</td>
      <td style="padding:0.55em 1em;text-align:center;color:var(--c-fg-3);opacity:0.4;">—</td>
      <td style="padding:0.55em 1em;text-align:center;color:var(--c-accent);">✓</td>
    </tr>
  </tbody>
</table>
```

**要点**:
- ✓ 用 `--c-accent` / `--c-fg-3`,✗ 或缺失用 `opacity:0.4` 弱化(不是红色,红色 = 警告语义)
- 推荐列(专业版)表头用 accent 色 + 顶部 2px accent 线
- 单字符居中,不留多余留白

### 模板 3 · 财务摘要表

经营数据,关键在**汇总行 + 数字右对齐 + 关键数字 accent**。

```html
<table style="width:100%;border-collapse:collapse;font-size:0.85em;">
  <thead>
    <tr>
      <th style="text-align:left;padding:0.6em 1em;color:var(--c-fg-3);
        text-transform:uppercase;letter-spacing:0.06em;font-size:0.82em;font-weight:500;
        border-bottom:2px solid oklch(from var(--c-fg-3) l c h / 0.2);">项目</th>
      <th style="text-align:right;padding:0.6em 1em;color:var(--c-fg-3);
        text-transform:uppercase;letter-spacing:0.06em;font-size:0.82em;font-weight:500;
        border-bottom:2px solid oklch(from var(--c-fg-3) l c h / 0.2);">2024</th>
      <th style="text-align:right;padding:0.6em 1em;color:var(--c-fg-3);
        text-transform:uppercase;letter-spacing:0.06em;font-size:0.82em;font-weight:500;
        border-bottom:2px solid oklch(from var(--c-fg-3) l c h / 0.2);">2025</th>
      <th style="text-align:right;padding:0.6em 1em;color:var(--c-fg-3);
        text-transform:uppercase;letter-spacing:0.06em;font-size:0.82em;font-weight:500;
        border-bottom:2px solid oklch(from var(--c-fg-3) l c h / 0.2);">同比</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom:1px solid oklch(from var(--c-fg-3) l c h / 0.1);">
      <td style="padding:0.6em 1em;">营收</td>
      <td style="padding:0.6em 1em;text-align:right;">¥1.2亿</td>
      <td style="padding:0.6em 1em;text-align:right;">¥1.8亿</td>
      <td style="padding:0.6em 1em;text-align:right;color:var(--c-accent);font-weight:600;">+50%</td>
    </tr>
    <tr style="border-bottom:1px solid oklch(from var(--c-fg-3) l c h / 0.1);">
      <td style="padding:0.6em 1em;">成本</td>
      <td style="padding:0.6em 1em;text-align:right;">¥0.8亿</td>
      <td style="padding:0.6em 1em;text-align:right;">¥1.0亿</td>
      <td style="padding:0.6em 1em;text-align:right;color:var(--c-fg-3);">+25%</td>
    </tr>
    <!-- 汇总行:顶部 accent 线 + 加粗 -->
    <tr style="border-top:2px solid var(--c-accent);">
      <td style="padding:0.6em 1em;font-weight:600;">净利润</td>
      <td style="padding:0.6em 1em;text-align:right;font-weight:600;">¥0.4亿</td>
      <td style="padding:0.6em 1em;text-align:right;font-weight:600;">¥0.8亿</td>
      <td style="padding:0.6em 1em;text-align:right;color:var(--c-accent);font-weight:600;">+100%</td>
    </tr>
  </tbody>
</table>
```

**要点**:
- 同比列:正向 `--c-accent`,负向 `--c-fg-3`(不滥用红绿,色盲不友好)
- 汇总行用 `border-top: 2px solid var(--c-accent)` + `font-weight:600/700` 做视觉锚点
- 数字带单位(亿/万/%),但同一列单位一致

### 模板 4 · 定价表

档位对比,重点档位用 accent 卡片背景突出。

```html
<div style="display:flex;gap:12px;align-items:stretch;">
  <div style="flex:1;padding:1.2em;border-radius:10px;
    background:oklch(from var(--c-fg) l c h / 0.04);">
    <div style="color:var(--c-fg-3);font-size:0.8em;text-transform:uppercase;letter-spacing:0.08em;">基础版</div>
    <div style="font-size:2em;font-weight:600;margin:0.2em 0;">¥99<span style="font-size:0.45em;color:var(--c-fg-3);font-weight:400;">/月</span></div>
    <div style="font-size:0.78em;color:var(--c-fg-3);line-height:1.6;">10GB 存储 · 单用户</div>
  </div>
  <!-- 推荐档:accent 边框 + 极淡背景 -->
  <div style="flex:1;padding:1.2em;border-radius:10px;
    background:oklch(from var(--c-accent) l c h / 0.08);
    border:2px solid var(--c-accent);">
    <div style="color:var(--c-accent);font-size:0.8em;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">专业版 · 推荐</div>
    <div style="font-size:2em;font-weight:600;margin:0.2em 0;color:var(--c-accent);">¥299<span style="font-size:0.45em;color:var(--c-fg-3);font-weight:400;">/月</span></div>
    <div style="font-size:0.78em;color:var(--c-fg-3);line-height:1.6;">100GB · 团队 10 人</div>
  </div>
  <div style="flex:1;padding:1.2em;border-radius:10px;
    background:oklch(from var(--c-fg) l c h / 0.04);">
    <div style="color:var(--c-fg-3);font-size:0.8em;text-transform:uppercase;letter-spacing:0.08em;">企业版</div>
    <div style="font-size:2em;font-weight:600;margin:0.2em 0;">定制</div>
    <div style="font-size:0.78em;color:var(--c-fg-3);line-height:1.6;">无限存储 · SSO</div>
  </div>
</div>
```

> 定价表是表格的"卡片变体",用 flex 而非 `<table>`,但仍遵守 T5(强调色只给推荐档)。

### 模板 5 · 时间线 / 路线图表

阶段 × 时间,适合展示发版节奏、项目里程碑。

```html
<table style="width:100%;border-collapse:collapse;font-size:0.82em;">
  <thead>
    <tr>
      <th style="text-align:left;padding:0.55em 1em;color:var(--c-fg-3);
        text-transform:uppercase;letter-spacing:0.06em;font-size:0.85em;font-weight:500;
        border-bottom:2px solid oklch(from var(--c-fg-3) l c h / 0.2);">阶段</th>
      <th style="text-align:left;padding:0.55em 1em;color:var(--c-fg-3);
        text-transform:uppercase;letter-spacing:0.06em;font-size:0.85em;font-weight:500;
        border-bottom:2px solid oklch(from var(--c-fg-3) l c h / 0.2);">时间</th>
      <th style="text-align:left;padding:0.55em 1em;color:var(--c-fg-3);
        text-transform:uppercase;letter-spacing:0.06em;font-size:0.85em;font-weight:500;
        border-bottom:2px solid oklch(from var(--c-fg-3) l c h / 0.2);">交付物</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom:1px solid oklch(from var(--c-fg-3) l c h / 0.1);">
      <td style="padding:0.55em 1em;color:var(--c-accent);font-weight:600;">Q1</td>
      <td style="padding:0.55em 1em;">1–3 月</td>
      <td style="padding:0.55em 1em;">MVP 上线</td>
    </tr>
    <tr style="border-bottom:1px solid oklch(from var(--c-fg-3) l c h / 0.1);">
      <td style="padding:0.55em 1em;color:var(--c-fg-3);">Q2</td>
      <td style="padding:0.55em 1em;">4–6 月</td>
      <td style="padding:0.55em 1em;">协作功能</td>
    </tr>
  </tbody>
</table>
```

**要点**:当前/已完成阶段的阶段名用 accent,未来阶段用 muted——进度感来自色彩,不来自额外装饰。

### 模板 6 · 状态 / SLA 表

监控指标 + 阈值状态,状态用语义色点而非整行染色。

```html
<table style="width:100%;border-collapse:collapse;font-size:0.82em;">
  <thead>
    <tr>
      <th style="text-align:left;padding:0.55em 1em;color:var(--c-fg-3);
        text-transform:uppercase;letter-spacing:0.06em;font-size:0.85em;font-weight:500;
        border-bottom:2px solid oklch(from var(--c-fg-3) l c h / 0.2);">服务</th>
      <th style="text-align:right;padding:0.55em 1em;color:var(--c-fg-3);
        text-transform:uppercase;letter-spacing:0.06em;font-size:0.85em;font-weight:500;
        border-bottom:2px solid oklch(from var(--c-fg-3) l c h / 0.2);">可用性</th>
      <th style="text-align:center;padding:0.55em 1em;color:var(--c-fg-3);
        text-transform:uppercase;letter-spacing:0.06em;font-size:0.85em;font-weight:500;
        border-bottom:2px solid oklch(from var(--c-fg-3) l c h / 0.2);">状态</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom:1px solid oklch(from var(--c-fg-3) l c h / 0.1);">
      <td style="padding:0.55em 1em;">API Gateway</td>
      <td style="padding:0.55em 1em;text-align:right;">99.98%</td>
      <td style="padding:0.55em 1em;text-align:center;">
        <span style="color:var(--c-accent);">●</span> 正常
      </td>
    </tr>
    <tr style="border-bottom:1px solid oklch(from var(--c-fg-3) l c h / 0.1);">
      <td style="padding:0.55em 1em;">数据库</td>
      <td style="padding:0.55em 1em;text-align:right;">99.91%</td>
      <td style="padding:0.55em 1em;text-align:center;">
        <span style="color:var(--c-fg-3);">●</span> 降级
      </td>
    </tr>
  </tbody>
</table>
```

**要点**:状态用单个语义色点(`●`)+ 文字,不整行染红/绿——保持表格中性,状态点足够抢眼。

---

## chartjunk 反例(反面教材)

以下是精品表格**必须避免**的写法:

### 反例 1 · 全网格线
```css
td, th { border: 1px solid #999; }  /* ✗ 竖线冗余,墨水浪费 */
```
**问题**:竖线不承载信息(列已由对齐和留白区分),只是视觉噪音。

### 反例 2 · 深色斑马纹
```css
tr:nth-child(even) { background: #f0f0f0; }  /* ✗ Excel 默认审美 */
```
**问题**:交替背景占用工作记忆,与数据无关。演示文稿用淡行底线替代。

### 反例 3 · 随机高亮
```html
<td style="background:yellow;color:red;">12ms</td>  /* ✗ 无语义高亮 */
```
**问题**:高亮不指向"结论",读者不知道为什么这个数字黄了。用 `--c-accent` 且只给推荐/关键值。

### 反例 4 · 表头过重
反例:表头字号与正文相同,且字重比正文更重。
**问题**:表头是索引不是主角。用 0.85em + weight 500 + muted 色,让正文数字成为视觉焦点。

### 反例 5 · 3D / 阴影 / 圆角边框
```css
table { box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 8px; }  /* ✗ 伪立体 */
```
**问题**:表格是二维数据矩阵,任何 3D 暗示都在误导读者(暗示有深度/层级)。保持平面。

---

## 通用 CSS 工具类

建议在 deck 的 `<style>` 里定义,减少内联重复:

```css
.tbl { width: 100%; border-collapse: collapse; font-size: 0.85em; }
.tbl th {
  text-transform: uppercase; letter-spacing: 0.06em;
  font-size: 0.85em; font-weight: 500; color: var(--c-fg-3);
  padding: 0.6em 1em;
  border-bottom: 2px solid oklch(from var(--c-fg-3) l c h / 0.2);
}
.tbl td {
  padding: 0.6em 1em;
  border-bottom: 1px solid oklch(from var(--c-fg-3) l c h / 0.1);
}
.tbl .num { text-align: right; }
.tbl .center { text-align: center; }
.tbl .recommended {
  background: oklch(from var(--c-accent) l c h / 0.06);
  font-weight: 600;
}
.tbl .total {
  border-top: 2px solid var(--c-accent);
  font-weight: 600;
}
.tbl .accent { color: var(--c-accent); }
.tbl .muted { color: var(--c-fg-3); }
```

---

## PPTX 导出说明

- HTML 表格在 PPTX 导出时会转为**静态文本框 + 线条**(不可编辑为原生 PPT 表格)
- 表头 `uppercase` / `letter-spacing` 在导出后可能丢失,关键结论建议在正文也写一遍
- 强调色背景和边框线导出稳定,可放心使用
- 如需导出后可编辑的表格,导出后在 PowerPoint 里重建并套用对应主题色

---

## 与其他参考文件的配合

| 需求 | 参考 |
|------|------|
| 单个对比表组件(直接复制) | `data-viz.md §8` |
| 何时用表 vs 用图 | 本文件 §表格 vs 图表 + `data-viz.md §选择指南` |
| 表格溢出修复 | `failure-gates.md §6`(密度和溢出阻断) |
| Pin 安全区(表格末行 vs pin) | `failure-gates.md §13`、`pin-safety.md` |
| 表格内的强调色角色 | `failure-gates.md §5`(颜色角色门禁) |
| 机器判据(本文件的化身) | `scripts/element-quality-check.js` 子分 table(T1–T6) |
