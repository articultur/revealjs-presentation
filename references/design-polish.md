# 设计精致度指南

> 生成"第一眼看就经过设计"的演示文稿，不是"能用的 AI 模板"。
> 本文件提供具体可复制的 CSS 食谱，不是理论。
>
> 核心理念：**设计隐喻即人格，页面原语即结构，字体和颜色是最后的表达层。**

## 目录

1. [页面类型系统](#页面类型系统)
2. [背景与颜色场](#背景与颜色场)
3. [签名时刻配方](#签名时刻配方)
4. [空间构图模式](#空间构图模式)
5. [微细节润色](#微细节润色)
6. [从主题生成设计语法](#从主题生成设计语法)
7. [种子语法与视觉 token](#种子语法与视觉-token)
8. [阴影与深度系统](#阴影与深度系统)
9. [精致度检查清单](#精致度检查清单)

---

## 页面类型系统

> 借鉴自 beautiful-html-templates：每种页面有命名类型，有自己的布局逻辑和排版规则。

专业演示文稿不是"每页都不同的随机布局"，而是由 7 种命名页面类型组合而成：

### 类型一览

| 类型 | 用途 | 占比 | 排版特征 |
|------|------|------|---------|
| **Cover** | 封面/标题页 | 1 页 | 居中、大字号、极端留白 |
| **Statement** | 核心主张、章节分隔 | 1-2 页 | 超大字号占 60%+ 面积 |
| **Stats** | 关键数据展示 | 1-2 页 | 单数字聚焦或多指标网格 |
| **Quote** | 引言、第三方背书 | 0-1 页 | 大号 serif italic + 引号标记 |
| **Content** | 正文内容、列表、说明 | 50%+ | 左对齐、标准排版层级 |
| **Compare** | 对比、双栏分析 | 1-2 页 | 非对称分割或并排 |
| **End** | 结尾、行动号召 | 1 页 | 居中、呼应封面 |

### Cover 页面

```html
<section class="slide-cover" style="display:flex; flex-direction:column;
  justify-content:flex-end; height:100%;">
  <!-- Pin 注释 -->
  <div class="pin" style="position:absolute; top: 1.5em; left: 72px;
    font-family:var(--f-mono); font-size: 0.5em; color:var(--c-fg-3);
    letter-spacing: 0.06em;">01 / 封面</div>
  <!-- 主标题 -->
  <div style="max-width:80%;">
    <div style="font-size:clamp(2.5em, 4em, 5em); font-weight:400;
                font-style:italic; line-height:1.1;
                letter-spacing: 0; color:var(--c-fg);">
      项目名称
    </div>
    <div style="margin-top:1.2em; font-size:0.85em; color:var(--c-fg-2);
                letter-spacing:0.04em;">
      副标题或日期
    </div>
  </div>
</section>
```

### Statement 页面

```html
<section class="slide-statement" style="display:flex; align-items:center;
  height:100%;">
  <div style="max-width:85%;">
    <div style="font-size:clamp(2em, 3.5em, 4.5em); font-weight:400;
                font-style:italic; line-height:1.15;
                letter-spacing: 0; color:var(--c-fg);">
      核心主张文案，<em style="font-style:normal; font-weight:600;
      color:var(--c-accent);">强调关键词</em>
    </div>
    <div style="margin-top:2em; font-size:0.75em; color:var(--c-fg-3);
                letter-spacing:0.06em; text-transform:uppercase;">
      来源或上下文
    </div>
  </div>
  <div class="pin" style="position:absolute; bottom: 32px; left: 72px;
    font-family:var(--f-mono); font-size: 0.5em; color:var(--c-fg-3);
    letter-spacing: 0.06em;">03 / 核心观点</div>
</section>
```

### Stats 页面

```html
<section class="slide-stats" style="display:flex; align-items:center;
  height:100%;">
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:3em;
    width:80%;">
    <div>
      <div style="font-size:clamp(3em, 5em, 6em); font-weight:300;
                  line-height:1; letter-spacing: 0; color:var(--c-fg);">
        97<span style="font-size:0.4em; font-weight:400;
        letter-spacing:0;">%</span>
      </div>
      <div style="margin-top:0.8em; font-size:0.9em; color:var(--c-fg-2);">
        用户满意度
      </div>
    </div>
    <div>
      <div style="font-size:clamp(3em, 5em, 6em); font-weight:300;
                  line-height:1; letter-spacing: 0; color:var(--c-fg);">
        3x
      </div>
      <div style="margin-top:0.8em; font-size:0.9em; color:var(--c-fg-2);">
        性能提升
      </div>
    </div>
  </div>
  <div class="pin" style="position:absolute; bottom: 32px; left: 72px;
    font-family:var(--f-mono); font-size: 0.5em; color:var(--c-fg-3);
    letter-spacing: 0.06em;">04 / 关键数据</div>
</section>
```

### Quote 页面

```html
<section class="slide-quote" style="display:flex; align-items:center;
  height:100%;">
  <div style="max-width:75%; padding-left:2em;">
    <!-- 引号标记——唯一使用 accent 色的地方 -->
    <div style="font-size:4em; line-height:0.8; color:var(--c-accent);
                font-family:Georgia, serif; margin-bottom:-0.3em;">&ldquo;</div>
    <div style="font-size:clamp(1.3em, 2em, 2.5em); font-weight:400;
                font-style:italic; line-height:1.3; color:var(--c-fg);">
      引言内容放这里，不要太长。
    </div>
    <div style="margin-top:1.5em; font-size:0.8em; color:var(--c-fg-2);
                letter-spacing:0.04em;">
      —— 引用来源 · 职位
    </div>
  </div>
  <div class="pin" style="position:absolute; bottom: 32px; left: 72px;
    font-family:var(--f-mono); font-size: 0.5em; color:var(--c-fg-3);
    letter-spacing: 0.06em;">05 / 引言</div>
</section>
```

### Content 页面

```html
<section class="slide-content" style="display:flex; flex-direction:column;
  justify-content:center; height:100%;">
  <!-- Eyebrow -->
  <div style="font-size:0.7em; font-weight:500; text-transform:uppercase;
              letter-spacing:0.1em; color:var(--c-fg-3); margin-bottom:0.8em;">
    章节标签
  </div>
  <h2 style="font-size:clamp(1.5em, 2em, 2.5em); font-weight:600;
             letter-spacing: 0; margin:0; color:var(--c-fg);">
    标题
  </h2>
  <!-- 分隔线 -->
  <div style="width:48px; height:2px; background:var(--c-border); margin:1em 0;"></div>
  <p style="font-size:0.9em; color:var(--c-fg-2); line-height:1.7;
            max-width:55ch; margin:0;">
    正文内容
  </p>
  <div class="pin" style="position:absolute; bottom: 32px; left: 72px;
    font-family:var(--f-mono); font-size: 0.5em; color:var(--c-fg-3);
    letter-spacing: 0.06em;">06 / 说明</div>
</section>
```

### Compare 页面

```html
<section class="slide-compare" style="display:flex; height:100%; padding:0;">
  <!-- 左侧 35%：对比面 A -->
  <div style="width:35%; background:var(--c-accent); display:flex;
              flex-direction:column; justify-content:flex-end; padding:3em 2em;">
    <div style="font-size:0.7em; text-transform:uppercase;
                letter-spacing:0.1em; color:rgba(255,255,255,0.7);
                margin-bottom:1em;">方案 A</div>
    <div style="font-size:1.8em; font-weight:600; color:#fff;
                line-height:1.2;">旧方案</div>
    <ul style="list-style:none; padding:0; margin-top:1.5em; font-size:0.85em;
               color:rgba(255,255,255,0.8); line-height:2;">
      <li>特点 1</li>
      <li>特点 2</li>
    </ul>
  </div>
  <!-- 右侧 65%：对比面 B -->
  <div style="width:65%; display:flex; flex-direction:column;
              justify-content:center; padding:3em;">
    <div style="font-size:0.7em; text-transform:uppercase;
                letter-spacing:0.1em; color:var(--c-fg-3);
                margin-bottom:1em;">方案 B</div>
    <div style="font-size:1.8em; font-weight:600; color:var(--c-fg);
                line-height:1.2;">新方案</div>
    <ul style="list-style:none; padding:0; margin-top:1.5em; font-size:0.85em;
               color:var(--c-fg-2); line-height:2;">
      <li>特点 1</li>
      <li>特点 2</li>
    </ul>
  </div>
  <div class="pin" style="position:absolute; bottom: 32px; left: 72px;
    font-family:var(--f-mono); font-size: 0.5em; color:var(--c-fg-3);
    letter-spacing: 0.06em;">07 / 对比</div>
</section>
```

### End 页面

```html
<section class="slide-end" style="display:flex; align-items:center;
  justify-content:center; height:100%;">
  <div style="text-align:center;">
    <div style="font-size:clamp(2em, 3em, 4em); font-weight:400;
                font-style:italic; color:var(--c-fg);
                letter-spacing: 0;">
      谢谢
    </div>
    <div style="width:48px; height:1px; background:var(--c-border);
                margin:1.5em auto;"></div>
    <div style="font-size:0.85em; color:var(--c-fg-2);
                letter-spacing:0.03em;">
      contact@example.com
    </div>
  </div>
  <div class="pin" style="position:absolute; bottom: 32px; left: 72px;
    font-family:var(--f-mono); font-size: 0.5em; color:var(--c-fg-3);
    letter-spacing: 0.06em;">08 / 结束</div>
</section>
```

---

## 背景与颜色场

> **颜色场原则**：背景色就是设计本身。选对颜色不需要任何纹理叠加。
> 这是与"每页必须加纹理"思路的根本区别。

### 颜色场背景（首选，80% 页面）

大多数页面只用纯色背景。**选对背景色 = 不需要任何纹理。**

```css
/* ✅ 颜色场：背景色承载设计感 */
.reveal section {
  background: var(--c-bg);  /* 有色彩倾向的深色或纸质色 */
}
```

浅色模板的"纹理感"来自纸质色本身（cream/bone/ivory），不是 CSS 叠加的图案。

### 微妙纹理（可选，≤30% 页面）

仅在感觉页面太"平"时使用，且**不作为默认行为**：

```css
/* 方案 A：细点阵——仅 dark-tech 模板 */
.reveal section.textured::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(var(--c-fg) 0.5px, transparent 0.5px);
  background-size: 24px 24px;
  opacity: 0.03;
  pointer-events: none;
  z-index: 0;
}
.reveal section.textured > * { position: relative; z-index: 1; }
```

```css
/* 方案 B：noise 噪点——仅 editorial-serif 模板 */
.reveal section.textured::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
}
```

### 渐变叠加（仅章节分隔页）

```css
/* 从角落渗出——仅 Statement 页面 */
.reveal section.slide-statement::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 80% 20%,
    oklch(from var(--c-accent) l c h / 0.06) 0%,
    transparent 60%
  );
  pointer-events: none;
}
```

### 选择规则

| 页面类型 | 背景 | 说明 |
|---------|------|------|
| Cover | 纯色场 | 背景色就是设计 |
| Content | 纯色场 | 不加任何处理 |
| Statement | 纯色场 + 可选角落渐变 | 微妙的深度感 |
| Stats | 纯色场 | 数字本身就是视觉 |
| Quote | 纯色场 | 排版层次足够 |
| Compare | 纯色场 + 一侧 accent 色 | 对比通过颜色分割实现 |
| End | 纯色场 | 呼应封面 |

---

## 签名时刻配方

每个演示文稿必须包含 **1-2 个签名时刻**——观众会截图分享的页面。以下 5 个配方选择 1-2 个应用：

### 配方 1：超大引言页

用 5em+ 字号占据 60%+ 页面面积，配合极端的留白。

```html
<section style="display:flex; align-items:center; height:100%;">
  <div style="max-width:85%;">
    <div style="font-size:clamp(2.5em, 4em, 5em); font-weight:600;
                line-height:1.15; letter-spacing: 0;
                color:var(--c-fg);">
      设计不是<br>看起来如何，<br>
      <span style="color:var(--c-accent);">而是如何运作。</span>
    </div>
    <div style="margin-top:2em; font-size:0.85em; color:var(--c-fg-3);
                letter-spacing:0.06em; text-transform:uppercase;">
      Steve Jobs · Apple Design Philosophy
    </div>
  </div>
</section>
```

### 配方 2：非对称分割页

左右不是 50/50，而是 35/65 或 25/75。一侧用 accent 色块，一侧放内容。

```html
<section style="padding:0; overflow:hidden;">
  <div style="display:flex; height:100%; margin:0;">
    <!-- 左侧 35%：色块 -->
    <div style="width:35%; background:var(--c-accent);
                display:flex; align-items:flex-end; padding:3em 2em;">
      <div>
        <div style="font-size:6em; font-weight:700; color:oklch(98% 0.01 80);
                    line-height:1; letter-spacing: 0;">03</div>
        <div style="font-size:0.9em; color:oklch(from var(--c-accent) l c h / 0.7);
                    margin-top:0.5em; text-transform:uppercase; letter-spacing:0.08em;">
          核心技术
        </div>
      </div>
    </div>
    <!-- 右侧 65%：内容 -->
    <div style="width:65%; padding:3em 3em; display:flex; flex-direction:column;
                justify-content:center; background:var(--c-bg);">
      <h2 style="font-size:1.8em; margin-bottom:0.8em;">架构设计哲学</h2>
      <ul style="list-style:none; padding:0; line-height:2.2; font-size:0.95em;">
        <li style="display:flex; gap:0.8em; align-items:center;">
          <span style="color:var(--c-accent); font-weight:600; font-size:0.85em;">01</span>
          <span>模块化设计，按需加载</span>
        </li>
        <li style="display:flex; gap:0.8em; align-items:center;">
          <span style="color:var(--c-accent); font-weight:600; font-size:0.85em;">02</span>
          <span>事件驱动，解耦通信</span>
        </li>
        <li style="display:flex; gap:0.8em; align-items:center;">
          <span style="color:var(--c-accent); font-weight:600; font-size:0.85em;">03</span>
          <span>边缘计算，就近响应</span>
        </li>
      </ul>
    </div>
  </div>
</section>
```

### 配方 3：单数字聚焦页

一个超大数字占满画面 50% 以上，旁边只放一行标签。

```html
<section style="display:flex; align-items:center; justify-content:center; height:100%;">
  <div style="text-align:center;">
    <div style="font-size:clamp(4em, 7em, 9em); font-weight:700;
                line-height:0.9; letter-spacing: 0; color:var(--c-accent);">
      97<span style="font-size:0.4em; font-weight:400; letter-spacing:0;">%</span>
    </div>
    <div style="margin-top:1em; font-size:1.1em; color:var(--c-fg);
                letter-spacing: 0;">
      用户满意度
    </div>
    <div style="margin-top:0.5em; font-size:0.75em; color:var(--c-fg-3);
                letter-spacing:0.04em;">
      基于 2,400+ 活跃用户反馈 · 2026 Q1
    </div>
  </div>
</section>
```

### 配方 4：全出血色块页

整页用 accent 色做背景，白字，极端视觉冲击。用于章节分隔或核心主张。

```html
<section data-background-color="var(--c-accent)"
         style="display:flex; align-items:center; justify-content:center;">
  <div style="text-align:center;">
    <div style="font-size:0.75em; text-transform:uppercase; letter-spacing:0.12em;
                color:oklch(98% 0.01 80 / 0.7); margin-bottom:1em;">
      Chapter 03
    </div>
    <h1 style="font-size:clamp(2em, 3em, 3.5em); color:oklch(98% 0.01 80);
               letter-spacing: 0; line-height:1.15; margin:0;">
      技术实现
    </h1>
    <div style="width:60px; height:2px; background:oklch(98% 0.01 80 / 0.4);
                margin:1.5em auto 0;"></div>
  </div>
</section>
```

### 配方 5：图文对角构图

图片和文字以对角方式排列，创造动态张力。

```html
<section style="padding:0; overflow:hidden;">
  <div style="display:grid; grid-template-columns:1fr 1fr; height:100%; margin:0;">
    <!-- 左侧：内容 -->
    <div style="padding:3em 2.5em 3em 4em; display:flex; flex-direction:column;
                justify-content:center;">
      <div style="font-size:0.75em; text-transform:uppercase; letter-spacing:0.1em;
                  color:var(--c-accent); margin-bottom:1em;">核心优势</div>
      <h2 style="font-size:1.8em; margin-bottom:0.6em;">性能突破</h2>
      <p style="color:var(--c-fg-3); font-size:0.9em; line-height:1.7;">
        重新设计的渲染管线，冷启动时间从 800ms 降至 45ms。
      </p>
      <!-- 指标行 -->
      <div style="display:flex; gap:2.5em; margin-top:2em;">
        <div>
          <div style="font-size:2em; font-weight:600; color:var(--c-accent);">45ms</div>
          <div style="font-size:0.7em; color:var(--c-fg-3);">冷启动</div>
        </div>
        <div>
          <div style="font-size:2em; font-weight:600; color:var(--c-accent);">3x</div>
          <div style="font-size:0.7em; color:var(--c-fg-3);">吞吐提升</div>
        </div>
      </div>
    </div>
    <!-- 右侧：色块/图片 -->
    <div style="background:linear-gradient(135deg, oklch(from var(--c-accent) l c h / 0.15) 0%,
                oklch(from var(--c-accent) l c h / 0.05) 100%);
                display:flex; align-items:center; justify-content:center;">
      <!-- 可替换为 <img> -->
      <div style="font-size:8em; font-weight:700; color:oklch(from var(--c-accent) l c h / 0.08);
                  letter-spacing: 0; line-height:1;">
        &rarr;
      </div>
    </div>
  </div>
</section>
```

### 签名时刻选择指南

| 演示类型 | 推荐配方 | 原因 |
|---------|---------|------|
| 学术/正式 | 配方 1（超大引言） | 权威感、思想深度 |
| 产品发布 | 配方 2（非对称分割）+ 配方 3（单数字） | 数据冲击 + 专业感 |
| 技术演讲 | 配方 3（单数字）+ 配方 5（图文对角） | 数据驱动 + 视觉变化 |
| 营销/创意 | 配方 4（全出血色块）+ 配方 5（图文对角） | 视觉大胆 + 动态构图 |
| 教学/分享 | 配方 1（超大引言）+ 配方 4（章节分隔） | 叙事节奏 + 章节清晰 |

---

## 空间构图模式

### 规则 1：左对齐但有偏移

正文左对齐是基础，但不要从 slide 的 padding 起点开始——给左侧留出"呼吸位"：

```html
<!-- ❌ 内容直接从 padding 开始 -->
<div>
  <h2>标题</h2>
  <p>正文</p>
</div>

<!-- ✅ 左侧留出设计呼吸位 -->
<div style="padding-left:1.5em;">
  <h2>标题</h2>
  <p style="max-width:55ch;">正文</p>
</div>
```

### 规则 2：不对称留白

不要让内容居中分布。有意制造一侧的留白：

```html
<!-- 左 40% 留白 + 右 60% 内容 -->
<section style="display:flex; align-items:center;">
  <div style="width:40%;"></div>
  <div style="width:60%;">
    <h2 style="font-size:1.8em;">标题</h2>
    <p style="max-width:40ch;">正文内容</p>
  </div>
</section>
```

### 规则 3：节奏变化

相邻 slide 的内容密度和空间分布必须不同。**连续 2 页相同布局 = 设计失败**。

```
Slide 1: 密集内容（列表 + 数据）
Slide 2: 大量留白（引言/数字）
Slide 3: 左右分割
Slide 4: 密集内容（卡片网格）
Slide 5: 全屏色块（章节分隔）
Slide 6: 密集内容
```

### 规则 4：垂直韵律

同一页内的元素间距不要统一，创造"紧-松-紧"的节奏：

```css
/* ❌ 均匀间距 */
.title { margin-bottom: 1em; }
.subtitle { margin-bottom: 1em; }
.content { margin-top: 1em; }

/* ✅ 有韵律的间距 */
.title { margin-bottom: 0.3em; }      /* 紧：标题和副标题贴合 */
.subtitle { margin-bottom: 2em; }      /* 松：副标题后留大空间 */
.content { margin-top: 0; }            /* 紧：内容紧跟 */
```

### 规则 5：黄金比例分割

两列布局不要 50/50。用 40/60 或 35/65：

```css
/* ❌ 对称 */
.grid { grid-template-columns: 1fr 1fr; }

/* ✅ 黄金比例 */
.grid { grid-template-columns: 2fr 3fr; }
/* 或 */
.grid { grid-template-columns: 3fr 5fr; }
```

---

## 微细节润色

### Pin 注释系统

> 每页左下角的等宽字体小注释——从印刷排版借鉴的"页码+章节标记"。
> 这是最有"设计感"且最不"装饰"的细节。

```css
.pin {
  position: absolute;
  bottom: 32px;
  left: 72px;
  font-family: var(--f-mono);
  font-size: 0.5em;
  color: var(--c-fg-3);       /* 最淡的层级——不应该被注意到，但被注意到时加分 */
  letter-spacing: 0.06em;
  z-index: 10;
}
```

```html
<!-- 每页都加，放在 section 的直接子元素 -->
<div class="pin">03 / 技术架构</div>
```

规则：
- 格式：`页码 / 章节主题` 或 `页码 · 简短标注`
- 使用等宽字体，颜色用 `--c-fg-3`（最淡层级）
- 每页必有，包括封面和结尾页

### 强调反转

在 italic 风格的模板（editorial-serif, nature-fresh）中，`<em>` 不是变斜体，而是反转回 roman + accent 色：

```css
/* 模板全局：标题用 italic */
h1, h2 { font-style: italic; font-weight: 400; }

/* em 反转：roman + accent */
em { font-style: normal; font-weight: 600; color: var(--c-accent); }
```

这个技巧让 accent 色出现得极其自然——只在需要被"读出来"的关键词上。比给整个标题加 accent 色更优雅。

在非 italic 模板（dark-tech, minimal-spatial, vibrant-gradient）中，用标准加粗强调：

```css
strong { font-weight: 600; color: var(--c-fg); }
```

### 分隔线样式

不用 `<hr>`，用有设计感的分隔线：

```html
<!-- 短横线（社论风） -->
<div style="width:48px; height:2px; background:var(--c-accent); margin:1.5em 0;"></div>

<!-- 渐隐线 -->
<div style="width:200px; height:1px;
            background:linear-gradient(to right, var(--c-accent), transparent);
            margin:1.5em 0;"></div>

<!-- 虚线 -->
<div style="width:100px; border-top:2px dotted var(--c-fg-3); opacity:0.3;
            margin:1.5em 0;"></div>
```

### 编号标签样式

有序列表用编号标签替代默认序号：

```html
<ul style="list-style:none; padding:0;">
  <li style="display:flex; gap:1em; margin-bottom:1.2em; align-items:baseline;">
    <span style="font-size:0.75em; font-weight:600; color:var(--c-accent);
                 min-width:2em; text-align:right;">01</span>
    <div>
      <strong>模块化设计</strong><br>
      <span style="font-size:0.85em; color:var(--c-fg-3);">按需加载，独立部署</span>
    </div>
  </li>
</ul>
```

### 标签/胶囊样式

```html
<!-- 实色胶囊 -->
<span style="display:inline-block; font-size:0.7em; font-weight:500;
             padding:0.3em 0.8em; border-radius:100px;
             background:var(--c-accent); color:oklch(98% 0.01 80);
             letter-spacing:0.04em; text-transform:uppercase;">
  新功能
</span>

<!-- 描边胶囊 -->
<span style="display:inline-block; font-size:0.7em; font-weight:500;
             padding:0.25em 0.7em; border-radius:100px;
             border:1px solid oklch(from var(--c-accent) l c h / 0.4);
             color:var(--c-accent); letter-spacing:0.04em;">
  v2.0
</span>

<!-- 淡底胶囊 -->
<span style="display:inline-block; font-size:0.7em; font-weight:500;
             padding:0.25em 0.7em; border-radius:100px;
             background:oklch(from var(--c-accent) l c h / 0.1);
             color:var(--c-accent);">
  技术演讲
</span>
```

### Eyebrow / Kicker 标题

标题上方的章节标签——最有性价比的设计细节：

```html
<div style="font-size:0.7em; font-weight:500; text-transform:uppercase;
            letter-spacing:0.1em; color:var(--c-accent); margin-bottom:0.8em;">
  核心技术
</div>
<h2 style="font-size:2em; margin-top:0;">架构设计</h2>
```

### 来源标注样式

数据或引言下方的小字标注：

```html
<div style="display:flex; align-items:center; gap:0.5em;
            font-size:0.7em; color:var(--c-fg-3);">
  <span style="width:16px; height:1px; background:var(--c-fg-3); display:inline-block;"></span>
  <span>数据来源：内部报表 Q4 2025</span>
</div>
```

### 代码块标签

代码块上方加语言标签：

```html
<div style="display:flex; justify-content:space-between; align-items:center;
            background:oklch(from var(--c-fg) l c h / 0.95);
            color:var(--c-bg); padding:0.4em 1em; border-radius:4px 4px 0 0;
            font-family:monospace; font-size:0.65em;">
  <span>server.ts</span>
  <span style="opacity:0.5;">TypeScript</span>
</div>
<pre style="margin:0;"><code style="border-radius:0 0 4px 4px; border-top:none;">
// code here
</code></pre>
```

---

## 从主题生成设计语法

> 现有模板只是验证过的 seed。真正的能力是把任意主题翻译成自己的设计语法。

### 设计语法 = 6 个决定

| 决定 | 产出 | 判断问题 |
|------|------|----------|
| 主题本质 | 这份 deck 真正在讲什么动作/冲突 | 如果删掉行业名，还剩什么故事？ |
| 观众张力 | 观众的疑虑、欲望、疲劳或期待 | 他们为什么需要被说服？ |
| 设计隐喻 | 一个现实场景或媒介 | 这份演示像什么？控制室、档案馆、舞台、地图、实验台？ |
| 页面原语 | 4-6 种可复用页面动作 | 每页是在展示证据、拆机制、给路径、造高潮还是收束？ |
| Proof object | 可视化承载物 | 哪些论点必须被看见，而不是被读到？ |
| 表达系统 | 色彩、字体、线条、动效 | 这些选择是否服务于隐喻？ |

### 六行路由卡

生成前必须先写路由卡：

```text
主题本质：这不是在讲 ____，而是在讲 ____。
观众张力：观众当前相信/担心 ____，演示要让他们 ____。
设计隐喻：本 deck 像一个 ____，而不是一个普通 slide deck。
页面骨架：主要使用 ____ / ____ / ____ / ____ 这些页面动作。
Proof object：必须可视化证明 ____，不能只写成 bullet。
禁止套路：不能使用 ____，因为它会把主题讲偏或变成通用模板。
```

### 原生语法 / Native Grammar

主题匹配不是“选一个好看的模板”，而是找出这个主题独有的行为、界面和物件。平台、品牌、产品、社区类 deck 必须先列出原生语法，再决定字体和颜色。

| 主题对象 | 必须优先寻找的原生语法 | 容易误入的假风格 |
|----------|------------------------|------------------|
| 小红书 | 瀑布流、笔记卡、搜索框、评论区、标签、收藏、种草链路、头像、手机 feed 几何、真实用户语气 | 生活方式杂志、cream editorial、泛女性化拼贴 |
| B 站 | 播放器、弹幕、UP 主、分区频道、投币/充电、直播间、番剧时间表、社区梗和二创路径 | 只做蓝粉渐变、只放大数字、通用互联网发布会 |
| 开发者工具 | 终端、日志、diff、trace、控制台、任务队列、失败重试、API 请求/响应 | 只做暗色科技面板 |
| 电商/交易 | 商品卡、搜索筛选、订单链路、价格/库存、交易状态、决策漏斗、售后节点 | 只做商业仪表盘 |
| 研究/报告 | 样本、引用、方法、证据链、对照组、置信区间、限制说明 | 只做档案馆装饰 |

生成前用 3 个问题拦截模板漂移：

1. 页面上有没有主题自己的对象？例如 feed、播放器、终端、订单、样本，而不是抽象卡片。
2. 观众能不能从布局动作看出主题？把颜色和字体拿掉后，结构仍应属于这个对象。
3. 这个风格是不是在替主题说话？如果只是“高级、年轻、科技、杂志”，还没有完成设计语法。

### 证据台账 / Evidence Ledger

视觉可信度不只来自排版，也来自数字是否站得住。所有精确数字必须在生成阶段建立证据台账：

| 字段 | 要求 |
|------|------|
| claim | 页面上出现的完整数字或排名，例如 `3 亿 MAU`、`#1 App Store` |
| status | `verified/source URL`、`user-provided` 或 `illustrative` |
| source | 可追溯 URL、用户提供材料名，或明确写 `示意` |
| slide treatment | 页面如何呈现：权威数字、趋势区间、示意标签、备注脚注 |

“公开披露”“行业数据”“据公开资料”不够，不能单独作为来源。找不到可靠来源时，不要把数字做成权威巨型主视觉；改成趋势表达、范围表达，或在数字旁显著标注“示意”。

### 隐喻生成词库

| 主题气质 | 可用隐喻 | 页面原语 |
|----------|----------|----------|
| 证据、历史、复盘、研究 | 档案馆、证据桌、策展墙、实验记录 | 材料墙、图版、标注、时间索引、结论印章 |
| 实时系统、技术可信、运维 | 控制室、雷达站、终端、飞行仪表 | 状态面板、信号曲线、告警、终端日志、演练回放 |
| 结构复杂、方法论、产品架构 | 建筑剖面、地图、蓝图、城市规划 | 轴线、剖面、路径、楼层、入口出口、模块块体 |
| 品牌、社区、发布会、潮流 | 舞台、弹幕现场、快闪店、频道包装 | 开场大屏、ticker、巨型数字、观众墙、产品登场 |
| 学习、调研、洞察、共创 | 田野手册、工作坊、样本箱、教学黑板 | 样本卡、观察日志、学习路径、共创画布、收获页 |
| 金融、交易、增长、运营 | 交易大厅、仪表盘、作战室、航海图 | 盘口、风控线、增长漏斗、路线图、决策矩阵 |
| 影视、故事、内容创作 | 分镜台、剪辑时间线、片场、展映厅 | 镜头卡、场记板、时间线、主角弧线、片尾字幕 |
| 医疗、科学、严肃验证 | 实验室、诊断报告、显微镜、临床路径 | 样本、检测值、对照组、路径、结论标签 |

### 当现有模板不匹配

不要问“选哪个模板最接近”，而是问“这个主题需要什么设计语法”。新语法最少要定义：

1. **命名**：用场景命名，不用形容词命名。例：`trading-floor-ops` 好于 `professional-blue`。
2. **页面原语**：至少 4 种，且每种有不同布局骨架。
3. **Proof object**：每个核心论点对应一个图形、数据、路径、状态或对比。
4. **禁用套路**：列出 3 个会让主题变通用的套路。
5. **视觉反事实测试**：把颜色字体换掉后，页面结构仍然应属于该主题。

### 反例

| 错误做法 | 为什么错 | 正确做法 |
|----------|----------|----------|
| “这是 AI 主题，所以用暗色科技模板” | 只按行业标签匹配 | 判断是在讲能力演示、风险治理、产品发布还是研究进展 |
| “品牌年轻，所以用高饱和渐变” | 情绪被颜色替代 | 找品牌行为：社区现场、街头发布、内容频道、会员仪式 |
| “培训就用自然清新模板” | 场景过度简化 | 判断是课程路径、实操工坊、知识地图还是考核流程 |
| “商业汇报用正式模板” | 太泛 | 判断是融资说服、经营复盘、战略转向还是组织动员 |

## 种子语法与视觉 token

> 每个种子模板的独特性来自**设计隐喻 + 页面骨架 + proof object + 字体颜色系统**，不是装饰元素。
> 装饰是最后的手段；如果装饰不能承担内容角色，就删除。

### 使用原则

- 模板个性 = 叙事隐喻 × 页面骨架 × proof object × 字体颜色系统
- **禁止换皮原则**：不能只换字体、颜色、圆角或背景纹理；每套模板必须改变信息组织方式。
- 装饰必须承担角色：档案标签、信号读数、空间轴线、发布 ticker、田野编号都要服务于内容理解。
- **骨架差异检查**：把颜色和字体临时拿掉后，如果两个模板仍然是同一套版式，只是右侧图形不同，就不合格。每个模板至少要在 cover、proof、mechanism、closing 四类页面里改变两类页面动作。
- **原生命名检查**：模板 class 名必须暴露主题对象，不接受通用 `hero / card / section / panel` 贯穿到底。金融用 `terminal / ticker / order-book`，临床用 `sample-rail / endpoint-strip / assay-board`，法律用 `docket-tabs / clause-margin / issue-board`，动画用 `cue-stack / timeline-stage / easing-panel`。
- **首页并排检查**：新增或改造多个模板时，把首页截图并排看；如果 3 张以上共享“巨型标题 + 单个右侧物件”或“上标题 + 下卡片墙”，必须重构。模板新鲜感来自物理界面差异，不来自 palette 差异。优先把首页做成该领域的原生界面：交易终端 cockpit、GIS 城市运行图、系统 handoff 运行板、编辑器调试现场、分析 notebook，而不是把标题卡片贴在证明物旁边。
- **种子模板对象清单**：当前已实现 5 套种子模板（01-05），均登记在 `references/template-invariants.json`，包含 cover/proof/mechanism/close 角色、首屏领域对象、全 deck proof object 和禁用旧 fallback，并接受 `scripts/test-reference-contract.js` 的自动门禁。下文 Template 06-15 为设计语法扩展参考（尚未落地为种子 HTML，无 CSS token 块，无 invariants.json 条目，需按其设计语法新建）；新增任何种子模板时不能只新增主题色，也要新增对应的页面原语和 proof object。

### Template 01：社论衬线 (editorial-serif)

**设计 DNA**：档案馆 / 策展式。页面像证据桌、材料墙、图版说明和研究卡片，而不是普通标题正文页。

**典型骨架**：asymmetric dossier cover、evidence wall、plate reading、stamp statement、archive index。

```css
:root {
  --c-bg: #f3efe4;
  --c-paper: #e5dcc9;
  --c-fg: #201f1b;
  --c-muted: #6d675e;
  --c-accent: #a8172d;
  --c-rule: #c9c0ae;
  --f-display: "Noto Serif SC", "Source Han Serif SC", Georgia, serif;
  --f-body: "Noto Sans SC", system-ui, sans-serif;
  --f-mono: "Courier Prime", "Courier New", monospace;
}

/* 页面语法：用 paper、stamp、plate、note 等对象组织信息 */
.paper { background: var(--c-paper); border: 1px solid var(--c-rule); }
.stamp { border: 2px solid var(--c-accent); color: var(--c-accent); }
```

### Template 02：深色科技 (dark-tech)

**设计 DNA**：控制室 / 系统演示。页面像实时监控台、雷达、终端和故障演练，不是泛科技蓝背景。

**典型骨架**：ops dashboard、radar proof、telemetry chart、terminal log、incident simulation。

```css
:root {
  --c-bg: #061311;
  --c-panel: #0c2924;
  --c-fg: #ecfff8;
  --c-muted: #82a49a;
  --c-accent: #32ffd2;
  --c-alert: #ff4d2e;
  --c-line: rgba(50, 255, 210, 0.2);
  --f-display: "Space Grotesk", "Noto Sans SC", system-ui, sans-serif;
  --f-body: "Noto Sans SC", system-ui, sans-serif;
  --f-mono: "JetBrains Mono", "Fira Code", monospace;
}

/* 页面语法：所有图形都像监控读数 */
.panel { background: var(--c-panel); border: 1px solid var(--c-line); }
.mono { font-family: var(--f-mono); text-transform: uppercase; }
```

### Template 03：极简空间 (minimal-spatial)

**设计 DNA**：建筑制图 / 空间叙事。页面像一张可审阅的建筑图纸：标题栏、尺寸链、平面图、比例尺、指北针和剖面共同解释复杂系统。

**典型骨架**：architectural plate cover、title block、dimension chain、section cut、floorplan matrix、journey path。

```css
:root {
  --c-bg: #eef2ee;
  --c-fg: #132825;
  --c-muted: #6d7c78;
  --c-line: #cbd5d1;
  --c-accent: #2962ff;
  --c-block: #dfe7e2;
  --f-display: "Noto Serif SC", Georgia, serif;
  --f-body: "Noto Sans SC", system-ui, sans-serif;
  --f-mono: "IBM Plex Mono", "JetBrains Mono", monospace;
}

/* 页面语法：图纸、标题栏、尺寸链和路径是主角 */
.blueprint-sheet { border: 2px solid var(--c-fg); }
.dimension-chain { border-top: 1px solid var(--c-fg); }
```

### Template 04：活力渐变 (vibrant-gradient)

**设计 DNA**：发布会现场 / Live Keynote。页面像开场大屏、倒计时、观众席、摄像机框和产品登场，不是渐变背景模板。

**典型骨架**：live stage cover、main screen、camera frame、audience floor、metric props、product drop、brand totem。

```css
:root {
  --c-bg: #101020;
  --c-hot: #ff4388;
  --c-cyan: #00d9ff;
  --c-yellow: #ffe45c;
  --c-fg: #fff8fb;
  --c-card: #fff8fb;
  --c-ink: #161624;
  --f-display: "Space Grotesk", "Noto Sans SC", system-ui, sans-serif;
  --f-body: "Noto Sans SC", system-ui, sans-serif;
  --f-mono: "JetBrains Mono", monospace;
}

/* 页面语法：巨型舞台屏、现场框线、观众席和产品 drop */
.main-screen { background: rgba(18,18,33,.54); }
.audience-floor { display: grid; grid-template-columns: repeat(18, 1fr); }
```

### Template 05：自然清新 (nature-fresh)

**设计 DNA**：田野桌面 / 工作坊。页面像一张真实的采集工作台：笔记本、钉图、样本标签、标本信封、观察日志和共创画布共同形成方法。

**典型骨架**：field desk cover、notebook spread、pinned route map、sample tags、field journal、workshop canvas、harvest statement。

```css
:root {
  --c-bg: #e9f1ea;
  --c-panel: #123f32;
  --c-fg: #19382f;
  --c-muted: #668079;
  --c-accent: #ff6b2d;
  --c-line: #b9c9c0;
  --f-display: "Noto Serif SC", Georgia, serif;
  --f-body: "Noto Sans SC", system-ui, sans-serif;
  --f-mono: "IBM Plex Mono", monospace;
}

/* 页面语法：笔记本、地图、标签、信封和桌面 */
.notebook-spread { background: var(--c-panel); }
.specimen-envelope { border: 1px solid var(--c-line); }
```

### Template 06：金融交易终端 (financial-terminal)

**设计 DNA**：交易终端 / 风险雷达。页面像一台决策终端：ticker、报价簿、风险雷达、资金流和信号读数共同构成 proof object。

**典型骨架**：terminal cover、risk radar、order book、flow table、committee close。

### Template 07：临床实验室 (clinical-lab)

**设计 DNA**：临床实验室 / 证据分层。页面像样本板、试验终点表、剂量反应曲线和机制观察记录。

**典型骨架**：sample tray cover、endpoint table、assay curve、safety matrix、evidence close。

### Template 08：城市基础设施 (civic-infrastructure)

**设计 DNA**：城市运行图 / 基础设施。页面像城市运维地图、交通走廊、节点系统和服务半径分析。

**典型骨架**：ops map cover、corridor logic、node system、section cut、policy close。

### Template 09：法律案卷 (legal-casefile)

**设计 DNA**：法律案卷 / 论证矩阵。页面像事实链、条款页、IRAC 矩阵和风险意见书。

**典型骨架**：casefile cover、issue matrix、clause boundary、risk scale、opinion close。

### Template 10：奢侈品牌工坊 (luxury-atelier)

**设计 DNA**：工坊 / 材质叙事。页面像材质板、手工工序、橱窗陈列和 lookbook，而不是金色装饰模板。

**典型骨架**：material board、brand ritual、craft sequence、lookbook spread、desire close。

### Template 11：影视分镜 (cinematic-storyboard)

**设计 DNA**：影视分镜 / 镜头叙事。页面像 shot board、act beat、scene reveal 和 cut rhythm，用镜头顺序组织内容。

**典型骨架**：storyboard cover、act beats、scene reveal、cut principle、final frame。

### Template 12：动画节奏 (motion-sequence)

**设计 DNA**：动画节奏 / 注意力编排。页面用 anchor、reveal、connect、lock 定义观察顺序，动画服务论点，不做统一 fade-up。

**典型骨架**：kinetic cover、timing beats、cue system、motion semantics、sequence close。

### Template 13：系统流程 (system-flow)

**设计 DNA**：系统流程 / 非 Mermaid 图解。节点用 grid/flex 承载，SVG 只做连接层；必须显示责任边界、异常路径和恢复策略。

**典型骨架**：flow board、swimlane、failure path、recovery map、interface close。

### Template 14：代码走查 (code-walkthrough)

**设计 DNA**：代码走查 / 技术证据。代码不是截图，必须有行号、高亮、diff、trace、终端证据和讲解路径。

**典型骨架**：editor cover、diff narrative、terminal proof、trace stack、invariant close。

### Template 15：数据可视化工作室 (data-visual-studio)

**设计 DNA**：数据可视化工作室。先定义观察问题，再选择条形、热力、斜率、指标结构或来源标注；图表是论证，不是装饰。

**典型骨架**：chart wall、comparison logic、metric structure、exception view、argument close。

---

## 精致度检查清单

生成 PPT 后逐项检查。**全部通过才算合格**。

### 排版优先

- [ ] 字体组合与模板 DNA 匹配（不是通用字体）
- [ ] 大标题用 italic 或轻字重（不是 700+ bold）
- [ ] ALL CAPS 有 letter-spacing ≥0.06em
- [ ] 大标题（32px+）`letter-spacing: 0`（禁止负 tracking，参见硬规则 #4）
- [ ] 字重范围在 200-600 内，签名时刻元素可例外使用 700

### 颜色场

- [ ] 背景色有色彩倾向（不是纯白/纯黑）
- [ ] 只有 1 种强调色，使用频率 ≤5%
- [ ] 用不透明度变体（0.62/0.32/0.20）代替多个灰色
- [ ] 没有装饰性渐变叠加在内容页上

### 页面类型

- [ ] 每页可以归类为 Cover/Statement/Stats/Quote/Content/Compare/End 之一
- [ ] 至少使用了 4 种不同的页面类型
- [ ] 相邻 slide 布局不同（无连续 2 页相同结构）

### Pin 注释

- [ ] 每页左下角有 pin 注释
- [ ] Pin 使用等宽字体
- [ ] Pin 颜色用 `--c-fg-3`（最淡层级）
- [ ] Pin 只做索引；若 pin 含有本页主题词，主视觉区域必须有同一主题词或等价主张
- [ ] Pin 的颜色/位置不比主标题、主数字或 proof object 更像视觉重点

### 签名时刻

- [ ] 有 1-2 页让人想截图的页面
- [ ] 签名页与内容页视觉对比明显（字号/留白/色块）
- [ ] 签名页没有装饰元素——靠排版制造冲击

### 空间构图

- [ ] 至少 1 页有明显的非对称留白
- [ ] 至少 1 页使用黄金比例分割（非 50/50）
- [ ] 每页内部间距有韵律（不是均匀 1em）

### 微细节

- [ ] 标题页有 eyebrow/kicker 标签
- [ ] 有编号的列表使用编号标签样式（非默认序号）
- [ ] 数据来源有标注样式
- [ ] 分隔线使用设计化样式（非 `<hr>`）
- [ ] italic 模板使用强调反转（em = roman + accent）

### 模板一致性

- [ ] 字体组合全程不改变
- [ ] 颜色 token 全程不改变
- [ ] 没有混用不同模板的字体或颜色

---

## 阴影与深度系统

> 用阴影建立视觉层级，不是装饰。阴影让元素"浮起来"或"凹进去"。

### 5 级阴影

同一份演示最多使用 2-3 个级别，不要混用全部。

```css
/* ── Level 1：微妙浮起（卡片、stat box） ── */
.shadow-subtle {
  box-shadow:
    0 1px 2px oklch(from var(--c-fg) l c h / 0.04),
    0 2px 8px oklch(from var(--c-fg) l c h / 0.03);
}

/* ── Level 2：中等浮起（弹出面板、featured card） ── */
.shadow-medium {
  box-shadow:
    0 2px 4px oklch(from var(--c-fg) l c h / 0.05),
    0 8px 24px oklch(from var(--c-fg) l c h / 0.06);
}

/* ── Level 3：高位浮起（模态、签名时刻元素） ── */
.shadow-float {
  box-shadow:
    0 4px 8px oklch(from var(--c-fg) l c h / 0.06),
    0 16px 48px oklch(from var(--c-fg) l c h / 0.08);
}

/* ── Level 4：内凹（输入框、内嵌区域） ── */
.shadow-inset {
  box-shadow: inset 0 1px 3px oklch(from var(--c-fg) l c h / 0.06);
}

/* ── Level 5：accent 色（仅签名时刻使用，每份 ≤1 次） ── */
.shadow-accent {
  box-shadow:
    0 4px 12px oklch(from var(--c-accent) l c h / 0.2),
    0 8px 32px oklch(from var(--c-accent) l c h / 0.1);
}
```

### 设计规则

1. **阴影来源色用 `var(--c-fg)` 的 OKLCH 变体**，不用纯黑（`#000`）。纯黑阴影在浅色/深色背景上都显得脏。
2. **透明度 0.03-0.08**：演示文稿的阴影比 Web 应用更克制。投影环境看不清微妙阴影，但屏幕上能看到。
3. **Level 5 accent 阴影每份演示 ≤1 次**：用于签名时刻的关键元素（如 CTA 按钮、核心数据卡片）。频繁使用 = "发光效果" = AI 指纹。
4. **同一页面只用 1 个阴影级别**：不同级别混在同一页会混乱。
5. **禁止 `text-shadow`**：演示中文字已经足够大，text-shadow 是 AI 模板指纹。

### 在布局中使用

```html
<!-- 卡片 + 微妙阴影 -->
<div style="
  padding:1.5em;
  background:oklch(from var(--c-bg) l c h / 0.6);
  border-radius:8px;
  box-shadow:
    0 1px 2px oklch(from var(--c-fg) l c h / 0.04),
    0 2px 8px oklch(from var(--c-fg) l c h / 0.03);
">
  <p>带微妙阴影的卡片</p>
</div>

<!-- 签名时刻 + accent 阴影 -->
<div style="
  padding:2em;
  background:var(--c-accent);
  border-radius:6px;
  box-shadow:
    0 4px 12px oklch(from var(--c-accent) l c h / 0.2),
    0 8px 32px oklch(from var(--c-accent) l c h / 0.1);
  color:oklch(from var(--c-bg) l c h / 0.95);
">
  <h2>签名时刻元素</h2>
</div>
```
