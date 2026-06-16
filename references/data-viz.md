# 数据可视化组件库

> 纯 CSS+SVG 数据图表，零依赖，Reveal.js 画布内自适应缩放。

## 设计原则

- **数据墨水比最大化**：删除网格线、3D 效果、多余装饰。数据本身是视觉元素。
- **单色系统**：用 `--c-accent` 的不同透明度/明度区分数据，不引入新颜色。
- **动画入场**：图表用 fragment 或 CSS animation 进入，让数据"生长"。
- **标注优于图例**：直接在数据旁标注数值，不用底部图例。
- **来源必须可见**：真实数据图必须在图表附近标注 `数据来源：...` / `Source: ...`，字号可小但不能藏在 notes。
- **禁止捏造数据**：没有来源时不得捏造百分比、增长率、用户数、性能指标；只能使用明确标记的“示意数据”，并避免 99.9%、3x、+300% 等廉价可信度数字。

```html
<p style="font-size:0.62em;color:var(--c-fg-3);margin-top:0.8em;">
  数据来源：2026 Q1 客户调研报告 · N=2,400
</p>
```

---

## 1. 环形图（Donut Chart）

使用 `conic-gradient`，纯 CSS 实现。

```html
<!-- 基础用法：单环 -->
<div style="display:flex;align-items:center;gap:2em;">
  <div style="position:relative;width:10em;height:10em;border-radius:50%;
    background:conic-gradient(
      var(--c-accent) 0deg 151deg,
      var(--c-fg-3) 151deg 252deg,
      oklch(from var(--c-accent) l c h / 0.3) 252deg 360deg
    );
    display:flex;align-items:center;justify-content:center;">
    <div style="width:6em;height:6em;border-radius:50%;background:var(--c-bg);
      display:flex;align-items:center;justify-content:center;flex-direction:column;">
      <span style="font-size:1.6em;font-weight:600;">42%</span>
      <span style="font-size:0.7em;color:var(--c-fg-3);">核心指标</span>
    </div>
  </div>
  <div style="display:flex;flex-direction:column;gap:0.6em;">
    <div style="display:flex;align-items:center;gap:0.5em;">
      <span style="width:0.8em;height:0.8em;border-radius:2px;background:var(--c-accent);"></span>
      <span style="font-size:0.8em;">产品 A — 42%</span>
    </div>
    <div style="display:flex;align-items:center;gap:0.5em;">
      <span style="width:0.8em;height:0.8em;border-radius:2px;background:var(--c-fg-3);"></span>
      <span style="font-size:0.8em;">产品 B — 28%</span>
    </div>
    <div style="display:flex;align-items:center;gap:0.5em;">
      <span style="width:0.8em;height:0.8em;border-radius:2px;background:oklch(from var(--c-accent) l c h / 0.3);"></span>
      <span style="font-size:0.8em;">产品 C — 30%</span>
    </div>
  </div>
</div>
```

```css
/* 动画入场：从 0deg 生长到目标角度 */
@keyframes donut-grow {
  from { transform: rotate(-90deg); }
  to { transform: rotate(270deg); }
}
```

**角度换算**：百分比 × 3.6 = 度数。如 42% = 151.2deg。

---

## 2. 柱状图（Bar Chart）

水平柱状图，适合对比 3-5 项数据。

```html
<div style="display:flex;flex-direction:column;gap:1em;">
  <!-- 数据行 -->
  <div style="display:flex;align-items:center;gap:1em;">
    <span style="width:5em;font-size:0.8em;text-align:right;">React</span>
    <div style="flex:1;height:1.4em;background:oklch(from var(--c-fg-3) l c h / 0.15);border-radius:3px;position:relative;">
      <div style="height:100%;width:72%;background:var(--c-accent);border-radius:3px;"></div>
    </div>
    <span style="width:3em;font-size:0.8em;font-weight:600;">72%</span>
  </div>
  <div style="display:flex;align-items:center;gap:1em;">
    <span style="width:5em;font-size:0.8em;text-align:right;">Vue</span>
    <div style="flex:1;height:1.4em;background:oklch(from var(--c-fg-3) l c h / 0.15);border-radius:3px;">
      <div style="height:100%;width:58%;background:oklch(from var(--c-accent) l c h / 0.7);border-radius:3px;"></div>
    </div>
    <span style="width:3em;font-size:0.8em;font-weight:600;">58%</span>
  </div>
  <div style="display:flex;align-items:center;gap:1em;">
    <span style="width:5em;font-size:0.8em;text-align:right;">Angular</span>
    <div style="flex:1;height:1.4em;background:oklch(from var(--c-fg-3) l c h / 0.15);border-radius:3px;">
      <div style="height:100%;width:35%;background:oklch(from var(--c-accent) l c h / 0.5);border-radius:3px;"></div>
    </div>
    <span style="width:3em;font-size:0.8em;font-weight:600;">35%</span>
  </div>
</div>
```

```css
/* 动画入场：柱从 0 宽增长 */
.bar-fill {
  animation: bar-grow 600ms ease-out both;
  transform-origin: left;
}
@keyframes bar-grow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
```

**设计细节**：
- 背景轨道用 `--c-fg-3` 低透明度，不用纯灰
- 同色系递减透明度区分排名（accent → accent/0.7 → accent/0.5）
- 数值右对齐，等宽空间
- 最多 5 行，超出拆页

---

## 3. 进度环（Progress Ring）

SVG `stroke-dasharray` 实现圆环进度。

```html
<div style="display:flex;gap:3em;align-items:center;">
  <div style="position:relative;width:8em;height:8em;">
    <svg viewBox="0 0 100 100" style="transform:rotate(-90deg);">
      <!-- 背景环 -->
      <circle cx="50" cy="50" r="42" fill="none"
        stroke="oklch(from var(--c-fg-3) l c h / 0.15)" stroke-width="6"/>
      <!-- 进度环：dasharray = 周长，dashoffset = 周长 × (1 - 百分比) -->
      <circle cx="50" cy="50" r="42" fill="none"
        stroke="var(--c-accent)" stroke-width="6" stroke-linecap="round"
        stroke-dasharray="263.9" stroke-dashoffset="79.2"/>
    </svg>
    <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;">
      <span style="font-size:1.4em;font-weight:600;">70%</span>
      <span style="font-size:0.65em;color:var(--c-fg-3);">完成度</span>
    </div>
  </div>
</div>
```

**计算公式**：
- 周长 = 2 × π × r = 2 × 3.14159 × 42 ≈ 263.9
- dashoffset = 263.9 × (1 - 0.70) ≈ 79.2

```css
/* 动画：从完整偏移到目标偏移 */
.progress-ring-fill {
  animation: ring-fill 800ms ease-out both;
}
@keyframes ring-fill {
  from { stroke-dashoffset: 263.9; }
}
```

---

## 4. 迷你折线图（Sparkline）

SVG `polyline`，适合嵌入标题旁或卡片内。

```html
<div style="display:flex;align-items:flex-end;gap:2em;">
  <div>
    <div style="font-size:0.7em;color:var(--c-fg-3);margin-bottom:0.2em;">月活趋势</div>
    <span style="font-size:1.8em;font-weight:600;">2.4M</span>
    <span style="font-size:0.7em;color:var(--c-accent);margin-left:0.3em;">+18%</span>
  </div>
  <svg viewBox="0 0 200 60" style="width:12em;height:3.5em;">
    <!-- 面积填充 -->
    <polygon fill="oklch(from var(--c-accent) l c h / 0.08)"
      points="0,50 25,42 50,38 75,30 100,35 125,22 150,18 175,12 200,8 200,60 0,60"/>
    <!-- 折线 -->
    <polyline fill="none" stroke="var(--c-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      points="0,50 25,42 50,38 75,30 100,35 125,22 150,18 175,12 200,8"/>
    <!-- 终点标记 -->
    <circle cx="200" cy="8" r="3" fill="var(--c-accent)"/>
  </svg>
</div>
```

**设计约束**：
- 折线宽度 ≤ 12em，高度 ≤ 3.5em
- 数据点 ≤ 12 个
- 面积填充用 accent 极低透明度（0.06-0.1）
- 只标记终点，不标记每个数据点

---

## 5. 对比条（Comparison Bar）

双向柱状图，适合正反/前后对比。

```html
<div style="display:flex;flex-direction:column;gap:1em;">
  <div style="display:flex;align-items:center;gap:0;">
    <span style="width:5em;font-size:0.75em;text-align:right;padding-right:1em;">性能</span>
    <div style="display:flex;align-items:center;flex:1;height:1.2em;">
      <!-- 左侧（旧/反） -->
      <div style="flex:1;display:flex;justify-content:flex-end;">
        <div style="width:35%;height:100%;background:oklch(from var(--c-fg-3) l c h / 0.3);
          border-radius:3px 0 0 3px;"></div>
      </div>
      <!-- 中线 -->
      <div style="width:2px;height:1.6em;background:var(--c-fg-3);"></div>
      <!-- 右侧（新/正） -->
      <div style="flex:1;">
        <div style="width:68%;height:100%;background:var(--c-accent);
          border-radius:0 3px 3px 0;"></div>
      </div>
    </div>
  </div>
  <!-- 对比图例 -->
  <div style="display:flex;justify-content:center;gap:2em;margin-top:0.5em;">
    <div style="display:flex;align-items:center;gap:0.4em;">
      <span style="width:0.8em;height:0.8em;border-radius:2px;
        background:oklch(from var(--c-fg-3) l c h / 0.3);"></span>
      <span style="font-size:0.7em;color:var(--c-fg-3);">优化前</span>
    </div>
    <div style="display:flex;align-items:center;gap:0.4em;">
      <span style="width:0.8em;height:0.8em;border-radius:2px;background:var(--c-accent);"></span>
      <span style="font-size:0.7em;color:var(--c-fg-3);">优化后</span>
    </div>
  </div>
</div>
```

---

## 6. 堆叠条（Stacked Bar）

单行内展示多段占比。

```html
<div style="display:flex;flex-direction:column;gap:1.2em;">
  <div>
    <div style="font-size:0.8em;margin-bottom:0.4em;">Q4 预算分配</div>
    <div style="display:flex;height:1.2em;border-radius:3px;overflow:hidden;">
      <div style="width:45%;background:var(--c-accent);"></div>
      <div style="width:30%;background:oklch(from var(--c-accent) l c h / 0.6);"></div>
      <div style="width:25%;background:oklch(from var(--c-accent) l c h / 0.3);"></div>
    </div>
    <div style="display:flex;gap:1.5em;margin-top:0.4em;">
      <span style="font-size:0.7em;display:flex;align-items:center;gap:0.3em;">
        <span style="width:0.6em;height:0.6em;border-radius:1px;background:var(--c-accent);"></span>
        研发 45%
      </span>
      <span style="font-size:0.7em;display:flex;align-items:center;gap:0.3em;">
        <span style="width:0.6em;height:0.6em;border-radius:1px;background:oklch(from var(--c-accent) l c h / 0.6);"></span>
        市场 30%
      </span>
      <span style="font-size:0.7em;display:flex;align-items:center;gap:0.3em;">
        <span style="width:0.6em;height:0.6em;border-radius:1px;background:oklch(from var(--c-accent) l c h / 0.3);"></span>
        运营 25%
      </span>
    </div>
  </div>
</div>
```

---

## 7. 数字看板（Metric Card）

大数字 + 趋势指示，用于 KPI 展示页。

```html
<div style="display:flex;gap:2em;">
  <div style="padding:1.5em;background:oklch(from var(--c-fg-3) l c h / 0.08);border-radius:8px;flex:1;">
    <div style="font-size:0.7em;color:var(--c-fg-3);text-transform:uppercase;letter-spacing:0.08em;">月活用户</div>
    <div style="font-size:2.2em;font-weight:600;margin-top:0.2em;letter-spacing: 0;">2.4M</div>
    <div style="font-size:0.75em;color:var(--c-accent);margin-top:0.3em;">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-1px;">
        <path d="M8 3L13 8H3L8 3Z" fill="currentColor"/>
      </svg>
      +18.2% 环比
    </div>
  </div>
  <div style="padding:1.5em;background:oklch(from var(--c-fg-3) l c h / 0.08);border-radius:8px;flex:1;">
    <div style="font-size:0.7em;color:var(--c-fg-3);text-transform:uppercase;letter-spacing:0.08em;">转化率</div>
    <div style="font-size:2.2em;font-weight:600;margin-top:0.2em;letter-spacing: 0;">4.7%</div>
    <div style="font-size:0.75em;color:var(--c-fg-3);margin-top:0.3em;">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align:-1px;">
        <path d="M8 13L3 8H13L8 13Z" fill="currentColor"/>
      </svg>
      -0.3% 环比
    </div>
  </div>
</div>
```

**设计约束**：
- 每页最多 4 个 metric card（2×2 或 4 列）
- 数字字号 ≥ 1.8em，远距离可读
- 背景用 `--c-fg-3` 极低透明度，不是 `border`
- 上升趋势用 `--c-accent`，下降用 `--c-fg-3`

---

## 8. 表格数据（Data Table）

轻量表格，适合对比数据。

```html
<div>
  <table style="width:100%;border-collapse:collapse;font-size:0.8em;">
    <thead>
      <tr style="border-bottom:2px solid oklch(from var(--c-fg-3) l c h / 0.2);">
        <th style="text-align:left;padding:0.6em 1em;font-weight:500;color:var(--c-fg-3);
          text-transform:uppercase;letter-spacing:0.06em;font-size:0.85em;">方案</th>
        <th style="text-align:right;padding:0.6em 1em;font-weight:500;color:var(--c-fg-3);
          text-transform:uppercase;letter-spacing:0.06em;font-size:0.85em;">延迟</th>
        <th style="text-align:right;padding:0.6em 1em;font-weight:500;color:var(--c-fg-3);
          text-transform:uppercase;letter-spacing:0.06em;font-size:0.85em;">吞吐</th>
        <th style="text-align:right;padding:0.6em 1em;font-weight:500;color:var(--c-fg-3);
          text-transform:uppercase;letter-spacing:0.06em;font-size:0.85em;">成本</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom:1px solid oklch(from var(--c-fg-3) l c h / 0.1);">
        <td style="padding:0.6em 1em;">方案 A</td>
        <td style="padding:0.6em 1em;text-align:right;">12ms</td>
        <td style="padding:0.6em 1em;text-align:right;">8.2K/s</td>
        <td style="padding:0.6em 1em;text-align:right;">¥340</td>
      </tr>
      <tr style="background:oklch(from var(--c-accent) l c h / 0.06);">
        <td style="padding:0.6em 1em;font-weight:600;">方案 B ★</td>
        <td style="padding:0.6em 1em;text-align:right;">8ms</td>
        <td style="padding:0.6em 1em;text-align:right;">12K/s</td>
        <td style="padding:0.6em 1em;text-align:right;">¥280</td>
      </tr>
      <tr style="border-bottom:1px solid oklch(from var(--c-fg-3) l c h / 0.1);">
        <td style="padding:0.6em 1em;">方案 C</td>
        <td style="padding:0.6em 1em;text-align:right;">24ms</td>
        <td style="padding:0.6em 1em;text-align:right;">5.1K/s</td>
        <td style="padding:0.6em 1em;text-align:right;">¥190</td>
      </tr>
    </tbody>
  </table>
</div>
```

**设计约束**：
- 列数 ≤ 5，行数 ≤ 6（含表头），超出拆页
- 推荐行用 accent 低透明度背景高亮，不加边框
- 数值列右对齐，文本列左对齐
- 表头用 uppercase + letter-spacing + muted 色

---

## 选择指南

| 数据场景 | 推荐图表 | 数据量 |
|---------|---------|-------|
| 占比/份额 | 环形图 | ≤4 段 |
| 排名对比 | 柱状图 | 3-5 项 |
| 进度/完成度 | 进度环 | 1-3 个 |
| 趋势 | 迷你折线图 | 6-12 点 |
| 前后对比 | 对比条 | 2-4 组 |
| 构成 | 堆叠条 | 2-4 段 |
| KPI 展示 | 数字看板 | 2-4 个 |
| 详细对比 | 表格 | ≤5 列 × 6 行 |
