# 技术规范详解

## CDN 依赖（统一版本 4.6.x）

### 完整依赖列表

```html
<!-- ============================================
     Reveal.js 核心（必须）
     ============================================ -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/reveal.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/theme/black.css">

<!-- ============================================
     图标系统：使用 inline SVG，不引入 Font Awesome
     图标库参考：references/icon-system.md
     ============================================ -->
<!-- 不引入 Font Awesome CDN，用 inline SVG 替代 -->

<!-- ============================================
     Google Fonts 中文字体（中文演示必须）
     ============================================ -->
<!-- Sans -->
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@200;300;400;500;600&display=swap" rel="stylesheet">
<!-- Serif -->
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;600&display=swap" rel="stylesheet">

<!-- ============================================
     Highlight.js 代码高亮（可选）
     ============================================ -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
```

### Reveal.js 主题

推荐使用的主题（`dist/theme/` 下）：

| 主题文件 | 风格 | 适用场景 |
|---------|------|---------|
| `black.css` | 深色背景 | 技术演讲、开发者会议 |
| `white.css` | 浅色背景 | 学术报告、教学课件 |
| `league.css` | 中性深色 | 通用 |
| `beige.css` | 米色背景 | 温和演示 |
| `night.css` | 暗黑主题 | 高对比度 |
| `moon.css` | 蓝紫渐变 | 创意展示 |

## Reveal.initialize 配置

### 推荐配置

```javascript
Reveal.initialize({
  // 尺寸
  width: 1280,           // 明确尺寸，不用默认值 960
  height: 720,          // 16:9 标准比例

  // 内边距
  margin: 0.04,         // 4% 内边距

  // 缩放限制
  minScale: 0.8,        // 限制缩放范围
  maxScale: 1.2,

  // 功能开关
  hash: true,           // URL 包含幻灯片索引
  slideNumber: 'c/t',   // 当前/总数，如 "3/12"
  progress: true,       // 底部进度条
  center: true,         // 内容居中
  controls: true,       // 导航箭头
  controlsTutorial: false, // 禁用教程提示

  // 过渡效果
  transition: 'fade',   // 页面过渡：只用 fade/slide；禁 convex/concave/zoom（3D 透视扭曲 visual-check 画布测量，见 references/visual-check.md）
  transitionSpeed: 'default', // slow/default/fast
  backgroundTransition: 'fade', // 背景过渡

  // 触控
  touch: true,          // 启用触控
  loop: false,          // 循环播放
  rtl: false,           // RTL 布局

  // 自动播放（可选）
  // autoSlide: 5000,    // 每页 5 秒
  // autoSlideStoppable: true,
});
```

详情见 `references/motion-delight.md` 的"页面过渡"章节。

### 自动播放配置

```javascript
// 演讲模式：每页 5 秒，循环播放
Reveal.configure({
  autoSlide: 5000,
  loop: true,
  autoSlideStoppable: true
});

// 点击停止自动播放
document.addEventListener('click', function(e) {
  if (e.target.matches('section')) {
    Reveal.next();
  }
});
```

## CSS 约束规则

### 颜色系统（推荐 OKLCH）

**使用 OKLCH 而非 HEX**，OKLCH 是感知均匀的颜色空间，lightness 的等步长看起来相等。

```css
/* OKLCH: lightness (0-100%), chroma (0-0.4+), hue (0-360) */
:root {
  --primary: oklch(60% 0.15 250);       /* 蓝色 */
  --primary-light: oklch(85% 0.08 250); /* 同一色相，更浅 */
  --accent: oklch(65% 0.2 30);         /* 橙色强调 */
  --bg: oklch(15% 0.01 250);           /* 深色背景 */
  --bg-subtle: oklch(20% 0.02 250);   /* 次要背景 */
  --text: oklch(95% 0.01 250);        /* 浅色文字 */
  --text-muted: oklch(70% 0.02 250);  /* 次要文字 */
}

/* 不使用纯灰或纯黑——添加微量色调 */
.ok-gray: oklch(95% 0.01 250);  /* 冷色调蓝灰 */
.ok-gray-dark: oklch(15% 0.01 250);
```

> 注意：OKLCH 在 Safari 15.4+、Chrome 111+、Firefox 113+ 支持。如需兼容旧版浏览器，回退到 HEX 或 HSLA。

### 基础约束（必须）

```css
/* 幻灯片容器 - 确保内容不溢出 */
.reveal .slides {
  text-align: left;
  height: 100%;
  width: 100%;
}

.reveal section {
  height: 100%;
  width: 100%;
  max-height: 100%;
  padding: 60px 80px;       /* 固定内边距 */
  box-sizing: border-box;    /* padding 计入宽高 */
  overflow: hidden;         /* 禁止溢出 */
}
```

### 流体字号规范（clamp）

使用 `clamp(最小, 首选, 最大)` 让字号在内容密集时自动缩小，避免固定字号导致溢出。

**核心原则**：clamp 的**最小值是不可再缩的红线**。当内容触发最小值仍放不下时，说明排版方案错了，必须拆页或换版面。

> **禁止使用 `vw`/`vh` 单位**：Reveal.js 通过 `transform: scale()` 缩放固定 1280×720 画布。`vw`/`vh` 基于视口计算，不受 transform 影响，会导致大屏元素过大溢出、小屏元素过小不可读。**所有 `clamp()` 必须使用 `em` 单位**。

#### clamp() 在固定画布上的行为

Reveal.js 的渲染模型是一个**固定尺寸的虚拟画布**（1280×720），然后通过 `transform: scale()` 缩放到实际视口大小。这意味着：

```
实际渲染流程：
  HTML 内容 → 在 1280×720 画布上渲染 → transform: scale() 缩放到视口

em 单位：相对于根字体大小（.reveal { font-size: 32px }）
  → 在画布坐标系内计算 → 受 transform: scale() 影响 → 行为正确

vw/vh 单位：相对于视口大小
  → 在视口坐标系内计算 → 不受 transform: scale() 影响 → 行为错误
```

**`clamp()` 在这个模型中的作用**：

`clamp(1.8em, 2.8em, 3.2em)` 中的三个值都是 `em`，它们在画布坐标系内计算。clamp 的效果是：当相邻元素空间紧张时，字号会缩小到最小值；空间充裕时，字号会放大到首选值或最大值。

**但注意**：在 Reveal.js 中，画布尺寸始终是 1280×720——它不会因为视口大小改变而改变。因此：

| 场景 | clamp 是否生效 | 原因 |
|------|:--:|------|
| 窗口从 1920px 缩到 1024px | 否 | 画布始终 1280×720，只是 scale 值变小 |
| 窗口从 1024px 放到 1920px | 否 | 同上，scale 值变大 |
| 某页内容多、另一页内容少 | **是** | 不同页面如果用了不同的 clamp 值，各页独立计算 |
| 用 CSS 改变根字号时 | **是** | 如 `@media (max-width: 1024px) { .reveal { font-size: 24px; } }` |

**结论**：clamp() 在 Reveal.js 中的作用是**防溢出**（为内容多的页面提供更小的字号下限），而不是**响应式**（不随视口大小变化）。真正的视口适配由 `@media` 改变 `.reveal { font-size }` 实现。

#### 推荐流体字号（仅 em 单位）

```css
.reveal h1 {
  font-size: clamp(1.8em, 2.8em, 3.2em);
}
.reveal h2 {
  font-size: clamp(1.2em, 1.6em, 2em);
}
.reveal h3 {
  font-size: clamp(0.9em, 1.1em, 1.3em);
}
.reveal p {
  font-size: clamp(0.75em, 0.9em, 1em);
}
.reveal li {
  font-size: clamp(0.75em, 0.85em, 0.95em);
}
```

#### 不可再缩的最小字号

| 元素 | 最小字号 | 触底后的动作 |
|------|---------|------------|
| h1 | **1.8em** | 拆页或换版面 |
| h2 | **1.2em** | 拆页 |
| h3 | **0.9em** | 压缩标题字数 |
| 正文 p | **0.75em** | 删减内容或拆页 |
| 列表项 | **0.75em** | 减少项数到 ≤3 |
| 数据卡标题 | **0.8em** | 缩短标签文字 |

#### 溢出救助决策树

当检测到溢出或内容过满时，**严格按以下优先级处理**：

```
1. 缩减内容（首选）
   - 删减次要描述，只保留标题
   - 合并相似项
   - 用更短的文字

2. 紧凑化间距（次选）
   - padding: 1.5em → 1em
   - gap: 1.5em → 0.8em
   - margin: 1em → 0.5em

3. 换版面（如果紧凑化不够）
   - 3 列 → 2 列
   - 单列 9 项 → 双列 5+4
   - 混合布局 → 纯列表

4. 拆页（最终手段）
   - 拆成"概览页 + 详情页"
   - 或按章节拆分
```

**硬规则**：

- ⛔ **禁止**缩小字号到最小值以下
- ⛔ **禁止**一页塞超过合理上限的内容
- ✅ **宁可多 2 页清晰的幻灯片，不要 1 页看不清的幻灯片**

| 场景 | ❌ 错误做法 | ✅ 正确做法 |
|------|-----------|-----------|
| 9 项列表放不下 | 缩小字体到 0.6em | 拆成 2 页（5+4），保持 0.85em |
| 6 列卡片溢出 | 缩小卡片到看不见 | 改成 2×3 网格，或拆 2 页 |
| 代码块+标题+3 张卡 | 全部缩小 | 去掉卡片，代码独占一页 |
| 流程图 9 步单行 | 字体缩到极小 | 拆成 2 行（4+5），或拆 2 页 |

### 流程图、架构图约束

```css
.flow, .arch-row {
  max-width: 100%;
  overflow: hidden;
  flex-wrap: wrap;           /* 自动换行 */
}

.flow-step, .arch-item {
  flex-shrink: 0;            /* 不被压缩 */
  white-space: nowrap;       /* 文字不换行 */
}
```

### 内容区块约束

```css
/* 段落 */
.reveal p {
  line-height: 1.6;         /* 行高 */
  margin-bottom: 0.6em;      /* 段间距 */
}

/* 列表 */
.reveal ul, .reveal ol {
  line-height: 1.8;          /* 行距 */
}

/* 代码块 */
.reveal pre {
  margin: 1em 0;             /* 上下间距 */
  box-shadow: none;          /* 移除阴影 */
}

.reveal pre code {
  padding: 0.75em 1em;       /* 内边距 */
  border-radius: 4px;
  font-size: 0.75em;         /* 字体缩小 */
}
```

### 媒体查询（响应式）

```css
/* 平板横屏 */
@media screen and (max-width: 1024px) {
  .reveal { font-size: 28px; }
  .reveal section { padding: 40px 60px; }
}

/* 平板竖屏 */
@media screen and (max-width: 768px) {
  .reveal { font-size: 24px; }
  .reveal section { padding: 30px 40px; }
}

/* 手机 */
@media screen and (max-width: 480px) {
  .reveal { font-size: 20px; }
  .reveal section { padding: 20px 30px; }
}
```

## 响应式设计

### 相对单位使用

| 类型 | 推荐单位 | 说明 |
|------|---------|------|
| 字体 | em | 随父元素缩放，与 Reveal.js scale 协调 |
| 间距 | em | 保持比例，随画布缩放 |
| 图片 | % | 相对于容器 |
| 容器 | em / % | 不使用 vh/vw（见下方说明） |

### 为什么禁止 vw/vh 单位

Reveal.js 的工作原理是在固定尺寸画布（默认 1280×720）上渲染内容，然后用 `transform: scale()` 缩放整个画布以适配视口。

```
视口 1920px → scale(1.0) → 画布 1280px 内容正常显示
视口 800px  → scale(0.625) → 画布 1280px 内容缩小显示
```

`vw` 和 `vh` 基于视口尺寸计算，**不受 transform: scale() 影响**：
- 在 1920px 视口上：`6vw = 115px`（过大，可能溢出）
- 在 800px 视口上：`6vw = 48px`（过小，不可读）
- 而 `3em` 在两种视口下都随画布等比缩放，保持一致

**规则**：所有字号、间距、尺寸一律使用 `em`、`%`、`px`（相对画布坐标）。`clamp()` 的中间值也必须是 `em`。

### 内容区安全高度

```css
/* 内容区安全高度——用 em 而非 vh */
.content-safe {
  max-height: calc(100% - 4em); /* 减去顶部和底部内边距 */
  overflow-y: auto;
}
```

### 字体响应式

```css
/* 基础字体 */
.reveal { font-size: 32px; }

/* 小屏幕缩小 */
@media screen and (max-width: 1280px) {
  .reveal { font-size: 28px; }
}

@media screen and (max-width: 1024px) {
  .reveal { font-size: 24px; }
}

@media screen and (max-width: 768px) {
  .reveal { font-size: 20px; }
}
```

## 垂直幻灯片（嵌套结构）

### 基础嵌套

```html
<section>
  <section> <!-- 垂直主幻灯片 -->
    <h2>主标题</h2>
    <p>按 ↓ 进入子内容</p>
  </section>
  <section> <!-- 垂直子幻灯片 1 -->
    <h3>子主题 1</h3>
    <p>详细内容...</p>
  </section>
  <section> <!-- 垂直子幻灯片 2 -->
    <h3>子主题 2</h3>
    <p>详细内容...</p>
  </section>
</section>
```

### 带过渡的嵌套

```html
<section data-transition="slide">
  <section data-transition="fade">
    <h2>第一页</h2>
    <p>按 ↓</p>
  </section>
  <section data-transition="fade">
    <h2>第二页</h2>
    <p>按 ↓</p>
  </section>
</section>
```

## 数据属性

### 常用 data 属性

```html
<!-- 背景 -->
<section data-background-color="#1a1a2e">
<section data-background="linear-gradient(...)">
<section data-background="image.jpg" data-background-size="cover" data-background-repeat="no-repeat">

<!-- 过渡 -->
<section data-transition="fade">
<section data-transition-speed="fast">

<!-- 可见性 -->
<section data-visibility="hidden">
<section data-visibility="uncounted"> <!-- 不计入幻灯片总数 -->

<!-- 背景视频 -->
<section data-background-video="video.mp4" data-background-video-loop data-background-video-muted>
```

## 初始化后配置

```javascript
// 动态修改配置
Reveal.configure({
  controls: true,
  progress: true,
  center: false
});

// 获取当前幻灯片信息
Reveal.getIndices();      // { h: 0, v: 0 }
Reveal.getCurrentSlide();  // 当前幻灯片元素
Reveal.getTotalSlides();  // 总页数

// 导航方法
Reveal.slide(2, 0);       // 跳转到第3张（索引2）的垂直第1张
Reveal.next();            // 下一页
Reveal.prev();            // 上一页
Reveal.nextFragment();    // 下一个 fragment
Reveal.prevFragment();    // 上一个 fragment

// 事件监听
Reveal.on('slidechanged', function(event) {
  console.log('Slide changed to:', event.indexh, event.indexv);
});

Reveal.on('fragmentshown', function(event) {
  console.log('Fragment shown:', event.fragment);
});
```

## 代码高亮配置

### 初始化 Highlight.js

```javascript
// 在 Reveal.initialize 之后调用
Reveal.initialize({
  // ... 其他配置
}).then(function() {
  // 初始化代码高亮
  hljs.highlightAll();
});
```

### 支持的语言

Reveal.js 4.6.0 内置支持的语言包括：
- JavaScript / TypeScript
- Python
- HTML / CSS
- JSON
- Markdown
- SQL
- Bash / Shell
- YAML
- XML
- PHP
- Ruby
- Go
- Rust
- Java
- C / C++
- C#
- Swift
- Kotlin
- 以及更多...

### 自定义语言高亮主题

```html
<!-- 可选的高亮主题 -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
<!-- 或 -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/monokai.min.css">
```

可用主题列表：https://cdnjs.com/libraries/highlight.js

---

## Reveal.js 插件（CDN 加载）

以下插件可通过 CDN 加载，无需本地安装。按需在 HTML 中引入。

### 插件一览

| 插件 | 功能 | CDN | 推荐场景 |
|------|------|-----|---------|
| **Chalkboard** | 在幻灯片上画笔批注 | jsDelivr | 教学、互动演示 |
| **Notes** | 独立演讲者窗口 | Reveal 内置 | 正式演讲 |
| **Zoom** | Alt+点击放大细节 | Reveal 内置 | 数据图表、代码演示 |
| **Math** | KaTeX 数学公式渲染 | CDN | 学术报告 |
| **Search** | Ctrl+Shift+F 搜索内容 | Reveal 内置 | 长文档、培训材料 |
| **Animate** | GSAP 动画集成 | jsDelivr | 高级动画需求 |

### Notes（演讲者窗口）— 推荐

为每个 slide 添加 `<aside class="notes">` 内容，按 `S` 键打开独立演讲者窗口。

```html
<!-- Reveal.js 4.x 内置，无需额外引入 -->
<script>
Reveal.initialize({
  // ... 其他配置
  plugins: [ RevealNotes ]
});
</script>

<!-- CDN 引入（如需） -->
<script src="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/plugin/notes/notes.js"></script>
```

使用：

```html
<section>
  <h2>市场分析</h2>
  <p>公开内容...</p>
  <aside class="notes">
    演讲者备注：强调第三季度的增长曲线，这里可以暂停让观众消化数据。
    切换时间约 2 分钟。
  </aside>
</section>
```

### Zoom（细节放大）

按住 Alt + 点击任意元素放大查看，再点击恢复。

```html
<script src="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/plugin/zoom/zoom.js"></script>

<script>
Reveal.initialize({
  plugins: [ RevealZoom ]
});
</script>
```

### Chalkboard（画笔批注）

在幻灯片上实时画笔标注。教学场景强烈推荐。

```html
<!-- 引入 -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js-plugins@4.2.5/chalkboard/style.css">
<script src="https://cdn.jsdelivr.net/npm/reveal.js-plugins@4.2.5/chalkboard/plugin.js"></script>

<!-- 配置 -->
<script>
Reveal.initialize({
  plugins: [ RevealChalkboard ],
  chalkboard: {
    boardmarkerWidth: 3,
    chalkWidth: 5,
    src: null,          // 预绘制的画笔数据
    readOnly: false,    // true = 只能查看不能画
    toggleChalkboardButton: { left: "60px", bottom: "30px" },
    toggleNotesButton: { left: "100px", bottom: "30px" },
    transition: 800,
    theme: "chalkboard" // 或 "whiteboard"
  }
});
</script>
```

快捷键：
- `B`：切换黑板/白板
- `C`：切换画笔颜色
- `DEL`：清除当前页画笔
- `Esc`：退出画笔模式

### Math（数学公式）

使用 KaTeX 渲染 LaTeX 数学公式，适合学术和工程演示。

```html
<script src="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/plugin/math/math.js"></script>

<script>
Reveal.initialize({
  plugins: [ RevealMath.KaTeX ],
  math: {
    katexOptions: {
      macros: { "\\R": "\\mathbb{R}" }
    }
  }
});
</script>
```

使用：

```html
<section>
  <h2>公式推导</h2>
  <p>欧拉公式：</p>
  <p>$$e^{i\pi} + 1 = 0$$</p>
  <p style="font-size:0.8em; color:var(--text-muted);">
    行内公式：$E = mc^2$
  </p>
</section>
```

### Search（内容搜索）

按 `Ctrl+Shift+F` 搜索幻灯片内容，长文档必备。

```html
<script src="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/plugin/search/search.js"></script>

<script>
Reveal.initialize({
  plugins: [ RevealSearch ]
});
</script>
```

### 插件组合推荐

根据场景选择插件组合：

| 场景 | 推荐插件组合 |
|------|-------------|
| 技术演讲 | Notes + Zoom + Math |
| 教学互动 | Notes + Chalkboard + Zoom |
| 产品发布 | Notes + Zoom |
| 学术报告 | Notes + Math + Search |
| 培训材料 | Notes + Chalkboard + Search |

### 完整插件引入模板

```html
<!-- Reveal.js 核心 -->
<script src="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/reveal.js"></script>

<!-- 按需引入插件（取消注释需要的） -->
<script src="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/plugin/notes/notes.js"></script>
<script src="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/plugin/zoom/zoom.js"></script>
<script src="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/plugin/search/search.js"></script>
<script src="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/plugin/math/math.js"></script>
<!-- Chalkboard 需要额外 CSS -->
<!-- <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js-plugins@4.2.5/chalkboard/style.css"> -->
<!-- <script src="https://cdn.jsdelivr.net/npm/reveal.js-plugins@4.2.5/chalkboard/plugin.js"></script> -->

<script>
Reveal.initialize({
  width: 1280,
  height: 720,
  margin: 0.04,
  hash: true,
  slideNumber: 'c/t',
  transition: 'fade',

  // 注册引入的插件
  plugins: [
    RevealNotes,
    RevealZoom,
    RevealSearch,
    RevealMath.KaTeX,
    // RevealChalkboard,
  ]
});
</script>
```

---

## 三端适配指南（借鉴 /adapt）

> 演示文稿不是只在一个场景下使用。投影仪、笔记本、手机分享是三种完全不同的体验——不是缩放像素，而是重新思考内容呈现。

### 三种场景对比

| 维度 | 投影仪 | 笔记本/屏幕共享 | 手机/聊天分享 |
|------|--------|---------------|-------------|
| **观看距离** | 2-5m | 40-60cm | 20-30cm |
| **分辨率** | 1280×720（常见） | 1920×1080+ | 375×812 |
| **交互方式** | 无（演讲者控制） | 方向键/点击 | 触摸滚动 |
| **注意力** | 跟着演讲者走 | 可能分心 | 快速扫视 |
| **关键需求** | 高对比、大字号 | 均衡呈现 | 自包含、可独立理解 |

### 投影仪适配（默认场景）

这是主场景，现有模板已为此优化。关键检查点：

```css
/* 投影仪安全的字号下限——仅 em 单位 */
h1 { font-size: clamp(2em, 3em, 3.5em); }   /* 最小 2em */
h2 { font-size: clamp(1.4em, 1.7em, 2em); } /* 最小 1.4em */
p  { font-size: clamp(0.8em, 0.95em, 1em); } /* 最小 0.8em */
```

**投影安全检查**：
- [ ] 正文在 3m 距离可辨读（最小 16px 等效）
- [ ] 标题在 5m 距离清晰可见（最小 32px 等效）
- [ ] 对比度足够（深色背景文字 ≥ WCAG AA）
- [ ] 图片和图表在低分辨率下不模糊
- [ ] 无依赖鼠标 hover 的关键信息

### 笔记本/屏幕共享适配

观众在自己的电脑上看，可能窗口不全屏。需要处理：

```css
/* Reveal.js 响应式宽度 */
.reveal { width: 100%; height: 100%; }

/* 不全屏时的字号安全网——仅 em 单位 */
@media (max-width: 1024px) {
  h1 { font-size: clamp(1.8em, 2.2em, 2.5em); }
  h2 { font-size: clamp(1.2em, 1.4em, 1.6em); }
  p  { font-size: clamp(0.75em, 0.85em, 0.9em); }
}
```

**屏幕共享检查**：
- [ ] 窗口缩到 1024px 宽时内容不溢出
- [ ] 侧边栏/聊天窗口遮挡时核心内容仍可见
- [ ] Fragment 顺序合理（逐个展示胜过一次全部出现）

### 手机/聊天分享适配

演示结束后发到群里，观众用手机看。这需要特殊处理：

```css
/* 移动端打印/分享模式 */
@media (max-width: 768px) {
  .reveal .slides section {
    /* 允许滚动查看完整内容 */
    overflow-y: auto;
    padding: 2em 1.5em;
  }
  /* 简化动画为即时显示 */
  .fragment { opacity: 1 !important; transform: none !important; }
}
```

**手机分享建议**：
- 提供 `?print-pdf` 版本作为"阅读模式"（一页纵向展示）
- 每页信息自包含——手机观众不记得前 3 页说了什么
- Speaker notes 中的关键信息考虑内联到正文中
- 使用 PDF 导出而非 HTML 文件分享（手机浏览器兼容性差）

### 按场景选择导出格式

| 分享方式 | 推荐格式 | 方法 |
|---------|---------|------|
| 投影仪演示 | HTML | 双击打开，全屏（F） |
| 屏幕共享 | HTML | 浏览器打开，不全屏也安全 |
| 发给同事编辑 | PPTX | HTML 内置按钮导出 |
| 发到群里阅读 | PDF | `?print-pdf` → 打印为 PDF |
| 嵌入文档/网站 | PDF | 同上 |
