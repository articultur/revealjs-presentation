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
     Font Awesome 图标（可选，推荐）
     ============================================ -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

<!-- ============================================
     Google Fonts 中文字体（中文演示必须）
     ============================================ -->
<!-- Sans -->
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet">
<!-- Serif -->
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap" rel="stylesheet">

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
  transition: 'fade',   // 页面过渡: fade/slide/convex/concave/zoom
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

### 过渡效果对比

| 效果 | 特点 | 适用场景 |
|------|------|---------|
| `fade` | 渐变过渡，推荐默认 | 通用，推荐 |
| `slide` | 滑动切换 | 内容切换 |
| `convex` | 凸出切换 | 轻松活泼 |
| `concave` | 凹陷切换 | 强调深度 |
| `zoom` | 缩放过渡 | 重点强调 |

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
| 字体 | em / rem | 随父元素缩放 |
| 间距 | em / vh / vw | 保持比例 |
| 图片 | % | 相对于容器 |
| 容器 | vh | 相对于视口 |

### 视口安全值

```css
/* 视口高度计算 */
.reveal section {
  height: 100vh;             /* 使用视口高度 */
  max-height: 720px;         /* 最大不超过设计稿高度 */
}

/* 内容区安全高度 */
.content-safe {
  max-height: calc(100vh - 120px); /* 减去顶部和底部内边距 */
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
