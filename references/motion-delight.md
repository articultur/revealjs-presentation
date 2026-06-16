# 动效与惊喜设计

> 本文件整合了 impeccable 的 [animate](https://github.com/pbakaus/impeccable) 和 [delight](https://github.com/pbakaus/impeccable) 技能，专为 reveal.js 演示场景适配。

## 目录

1. [动效时长法则](#动效时长法则)
2. [Easing 曲线规范](#easing-曲线规范)
3. [Fragment 动画扩展](#fragment-动画扩展)
4. [页面过渡](#页面过渡)
5. [Staggered 动画](#staggered-动画)
6. [Hover 微交互](#hover-微交互)
7. [Reduced Motion 支持](#reduced-motion-支持)
8. [Delight 时刻](#delight-时刻)
9. [Personality Copy](#personality-copy)

---

## 动效时长法则

reveal.js 演示场景的动画比普通 UI 更有张力——观众在远处看，不是手指在屏幕上。

| 时长 | 适用场景 | 示例 |
|------|---------|------|
| **100-150ms** | 即时反馈（hover、点击） | 按钮颜色变化 |
| **300-500ms** | Fragment 出现（默认推荐） | 列表项逐个出现 |
| **500-800ms** | 页面整体过渡 | slide 切换、元数据淡入 |
| **800-1200ms** | 戏剧性强调 | 标题页、章节开场 |

**退出动画快于进入动画**：退出用 ~75% 的进入时长。

---

## Easing 曲线规范

reveal.js 默认的 `ease` 和 `linear` 太机械。使用这些曲线：

```css
:root {
  /* 推荐默认：平滑、自然减速 */
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);

  /* 更有冲劲：自信、果断 */
  --ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);

  /* 快速精准：代码演示、时间紧迫 */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);

  /* 进出切换：同一元素的两个状态 */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
}

/* reveal.js fragment 应用自定义 easing */
.fragment {
  transition-timing-function: var(--ease-out-quart);
}
```

**禁用 bounce/elastic** — 这些在 2015 年流行，现在看起来廉价且过时。

---

## Fragment 动画扩展

### 自定义 Easing 的 Fragment

```html
<section>
  <p class="fragment" data-fragment-index="1"
     style="transition-timing-function: var(--ease-out-quart);">
    第一步：发现问题
  </p>
  <p class="fragment fade-up"
     style="transition-timing-function: var(--ease-out-quint);">
    第二步：分析原因
  </p>
  <p class="fragment fade-up"
     style="transition-timing-function: var(--ease-out-expo);">
    第三步：制定方案
  </p>
</section>
```

### Staggered 动画（渐进显示）

```html
<section>
  <!-- 每个 item 延迟 150ms -->
  <ul style="list-style: none; padding: 0;">
    <li class="fragment fade-up"
        style="transition-delay: 0ms;">列表项 1</li>
    <li class="fragment fade-up"
        style="transition-delay: 150ms;">列表项 2</li>
    <li class="fragment fade-up"
        style="transition-delay: 300ms;">列表项 3</li>
    <li class="fragment fade-up"
        style="transition-delay: 450ms;">列表项 4</li>
  </ul>
</section>
```

### CSS 变量实现 Stagger

```css
/* 用 CSS 变量控制 stagger */
.stagger-item {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 400ms var(--ease-out-quart),
              transform 400ms var(--ease-out-quart);
  transition-delay: calc(var(--i, 0) * 100ms);
}

.stagger-item.visible {
  opacity: 1;
  transform: translateY(0);
}
```

```html
<ul style="list-style: none; padding: 0;">
  <li class="stagger-item" style="--i: 0;">项 1</li>
  <li class="stagger-item" style="--i: 1;">项 2</li>
  <li class="stagger-item" style="--i: 2;">项 3</li>
  <li class="stagger-item" style="--i: 3;">项 4</li>
</ul>
```

---

## 页面过渡

reveal.js 支持多种过渡效果，结合 CSS 可以更精细控制：

```javascript
Reveal.initialize({
  transition: 'fade',        // 基础过渡
  transitionSpeed: 'default', // 'default', 'slow', 'fast'
  backgroundTransition: 'fade', // 背景过渡
});
```

### 过渡效果选择

| 效果 | 适用场景 |
|------|---------|
| `fade` | 通用，推荐默认 |
| `slide` | 内容切换、线性流程 |
| `convex` | 轻松活泼、创意演讲 |
| `concave` | 强调深度、学术报告 |
| `zoom` | 重点强调、戏剧化 |

### 自定义页面进入动画

```css
/* 标题页特殊进入 */
section.title-slide h1 {
  animation: title-enter 800ms var(--ease-out-expo) forwards;
}

@keyframes title-enter {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

---

## Hover 微交互

reveal.js 中每个可交互元素都值得微交互设计：

```css
/* 流程步骤 hover */
.flow-step {
  transition: transform 150ms var(--ease-out-quart),
              box-shadow 150ms var(--ease-out-quart),
              background 150ms var(--ease-out-quart);
  cursor: pointer;
}

.flow-step:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 卡片 hover */
.card {
  transition: transform 200ms var(--ease-out-quart),
              box-shadow 200ms var(--ease-out-quart);
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

/* 图标缩放 */
.icon-hover {
  transition: transform 200ms var(--ease-out-quart);
}

.icon-hover:hover {
  transform: scale(1.1);
}
```

---

## Reduced Motion 支持

约 35% 的成年人有前庭功能障碍。演示文稿同样需要尊重用户的 motion 偏好：

```css
/* 默认动画 */
.fragment {
  transition: opacity 400ms var(--ease-out-quart),
              transform 400ms var(--ease-out-quart);
}

/* 减少动画：只保留透明度变化 */
@media (prefers-reduced-motion: reduce) {
  .fragment {
    animation: none !important;
    transition: opacity 200ms ease-out !important;
  }

  .flow-step:hover,
  .card:hover,
  .icon-hover:hover {
    transform: none !important;
  }

  /* 标题页动画简化为淡入 */
  section.title-slide h1 {
    animation: fade-in 400ms ease-out forwards;
  }
}
```

---

## Delight 时刻

演示文稿中的 delight 应该是**发现式的惊喜**，而不是打断式的表演。

### 发现式惊喜

```html
<!-- 隐藏彩蛋：按 Shift + ? 触发 -->
<section data-background="var(--bg)">
  <h2>谢谢聆听</h2>
  <p style="font-size: 0.6em; color: var(--text-muted);">
    提示：试试按 Shift + ?
  </p>
  <aside class="notes">
    （不在演讲中提示，这是给好奇观众的隐藏彩蛋）
  </aside>
</section>

<script>
// 键盘彩蛋：Shift + ? 显示隐藏消息
document.addEventListener('keydown', function(e) {
  if (e.shiftKey && e.key === '?') {
    var easterEgg = document.createElement('div');
    easterEgg.innerHTML = '🎉 你找到了彩蛋！';
    easterEgg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:3em;z-index:9999;animation:fadeIn 500ms ease-out';
    document.body.appendChild(easterEgg);
    setTimeout(function() { easterEgg.remove(); }, 2000);
  }
});
</script>
```

### 成功状态庆祝

```html
<!-- 总结页的视觉惊喜 -->
<section data-background="linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)">
  <div class="celebration">
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="animation: pulse 2s ease-in-out infinite;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    <h2 style="color: #fff; margin-top: 0.5em;">演讲结束</h2>
    <p style="color: rgba(255,255,255,0.85);">感谢参与</p>
  </div>
</section>

<style>
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.9; }
}
</style>
```

### Speaker Notes 的人情味

```html
<aside class="notes">
  技术提示不要只有"讲这个参数"，加点人情味：

  ❌ "讲解函数的 timeout 参数，默认值是 5000ms"
  ✅ "这里有个 timeout，默认 5 秒。如果观众问能不能调——可以，但别调太大，不然报错时等得人心焦。"

  注意：只给演讲者看，不给观众看。
</aside>
```

---

## Personality Copy

### 开场白模板

| 场景 | 冷淡型 | 有个性型 |
|------|--------|--------|
| 技术演讲 | "今天的主题是..." | "这个问题坑了我三天，今天一次说清楚。" |
| 产品发布 | "我们很高兴发布..." | "憋了半年的招，终于拿出来了。" |
| 教学课件 | "本节课学习..." | "学会了这些，你可以少加班两小时。" |

### Fragment 逐步揭示的叙事感

```html
<!-- ❌ 机械的"第一点、第二点" -->
<p class="fragment">1. 打开终端</p>
<p class="fragment">2. 运行命令</p>

<!-- ✅ 有叙事节奏的揭示 -->
<p class="fragment" style="transition-delay: 0ms;">
  先打开终端，别怕黑色的窗口。
</p>
<p class="fragment" style="transition-delay: 150ms;">
  看到 $ 闪烁了吗？那是系统在等你说话。
</p>
<p class="fragment" style="transition-delay: 300ms;">
  现在输入这个命令，回车——
</p>
<p class="fragment highlight-blue" style="transition-delay: 450ms;">
  npm run dev
</p>
```

### 结束语模板

| 场景 | 结束语 |
|------|--------|
| 技术演讲 | "搞定了。有问题找我，GitHub 见。" |
| 产品发布 | "上手试试，有感觉了再聊。" |
| 教学课件 | "今天的作业：把其中一个步骤讲给你的同事听。" |
| 学术报告 | "更多细节可以看论文，或者直接来找我。" |

---

## 快速检查清单

生成动画后检查：

- [ ] Fragment 出现时间不超过 500ms（太长会拖慢节奏）
- [ ] Hover 反馈在 150ms 内（太慢会感觉迟钝）
- [ ] 标题页有进入动画（不要静止出现）
- [ ] Stagger 延迟不超过 150ms 每项（超过会让观众等）
- [ ] `prefers-reduced-motion` 用户看到的是简单淡入，不是静止不动
- [ ] 彩蛋不打断演讲，不在演讲 notes 中提示

---

## 参考资源

- [impeccable animate](https://github.com/pbakaus/impeccable)
- [impeccable delight](https://github.com/pbakaus/impeccable)
- [CSS Easing Explorer](https://easings.net/)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

---

## 高级动画模式

> 以下动画模式适用于需要更强视觉冲击力的演示场景。每个模式都兼容 `prefers-reduced-motion`。

### 数字滚动动画

适合展示关键数据指标。数字从 0 滚动到目标值，配合缓动曲线产生专业感。

```html
<section>
  <h2 style="text-align:center; font-size:1.2em; margin-bottom:0.5em;">关键成果</h2>
  <div style="display:flex; justify-content:center; gap:3em; text-align:center;">
    <div>
      <div class="counter" data-target="97" style="font-size:3.5em; font-weight:600; color:var(--accent);">0</div>
      <div style="font-size:0.8em; color:var(--text-muted); margin-top:0.3em;">满意度 %</div>
    </div>
    <div>
      <div class="counter" data-target="2400" style="font-size:3.5em; font-weight:600; color:var(--accent);">0</div>
      <div style="font-size:0.8em; color:var(--text-muted); margin-top:0.3em;">活跃用户</div>
    </div>
  </div>
</section>

<script>
// 数字滚动动画（slidechanged 事件触发）
Reveal.on('slidechanged', function(event) {
  var counters = event.currentSlide.querySelectorAll('.counter');
  counters.forEach(function(el) {
    var target = parseInt(el.getAttribute('data-target'));
    var duration = 1200;
    var start = performance.now();
    function tick(now) {
      var progress = Math.min((now - start) / duration, 1);
      // ease-out-quart
      var ease = 1 - Math.pow(1 - progress, 4);
      el.textContent = Math.round(target * ease);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
});
</script>
```

### 文字逐字揭示

标题文字逐字出现，制造悬念和节奏感。适合开场页和章节过渡页。

```html
<style>
.char-reveal span {
  display: inline-block;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 400ms var(--ease-out-quart, cubic-bezier(0.25,1,0.5,1)),
              transform 400ms var(--ease-out-quart, cubic-bezier(0.25,1,0.5,1));
}
.char-reveal.visible span {
  opacity: 1;
  transform: translateY(0);
}
</style>

<section>
  <h1 class="char-reveal" style="font-size:2.5em;">
    <!-- JS 会自动将文字拆分为单字 span -->
    改变从这里开始
  </h1>
</section>

<script>
// 拆分文字为单字 span，并为每个字设置延迟
document.querySelectorAll('.char-reveal').forEach(function(el) {
  var text = el.textContent.trim();
  el.innerHTML = '';
  text.split('').forEach(function(char, i) {
    var span = document.createElement('span');
    span.textContent = char === ' ' ? ' ' : char;
    span.style.transitionDelay = (i * 60) + 'ms';
    el.appendChild(span);
  });
});

// slidechanged 时触发动画
Reveal.on('slidechanged', function(event) {
  event.currentSlide.querySelectorAll('.char-reveal').forEach(function(el) {
    el.classList.remove('visible');
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        el.classList.add('visible');
      });
    });
  });
});
</script>
```

### clip-path 图片揭示

图片以裁剪动画方式展开，比简单的淡入更有戏剧效果。

```html
<style>
.clip-reveal {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 800ms cubic-bezier(0.25, 1, 0.5, 1);
}
.clip-reveal.visible {
  clip-path: inset(0 0 0 0);
}
</style>

<section>
  <div style="display:flex; gap:2em; align-items:center;">
    <div style="flex:1;">
      <h2>产品亮点</h2>
      <p>描述文字...</p>
    </div>
    <div style="flex:1;">
      <img class="clip-reveal" src="https://picsum.photos/600/400"
           alt="产品图片"
           style="width:100%; border-radius:8px;">
    </div>
  </div>
</section>

<script>
Reveal.on('slidechanged', function(event) {
  event.currentSlide.querySelectorAll('.clip-reveal').forEach(function(el) {
    el.classList.remove('visible');
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        el.classList.add('visible');
      });
    });
  });
});
</script>
```

**clip-path 变体**：

| 效果 | clip-path 值（初始 → 结束） |
|------|---------------------------|
| 从左到右 | `inset(0 100% 0 0)` → `inset(0 0 0 0)` |
| 从中间展开 | `inset(0 50% 0 50%)` → `inset(0 0 0 0)` |
| 圆形扩散 | `circle(0%)` → `circle(75%)` |
| 菱形展开 | `polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)` → `polygon(0 0, 100% 0, 100% 100%, 0 100%)` |

### 3D 透视过渡

利用 CSS perspective 和 transform 实现 3D 翻转效果，适合关键转折页。

```html
<style>
.flip-in {
  perspective: 1000px;
}
.flip-in .flip-card {
  transform: rotateY(-90deg);
  transition: transform 600ms cubic-bezier(0.25, 1, 0.5, 1);
  transform-origin: left center;
}
.flip-in.visible .flip-card {
  transform: rotateY(0deg);
}
</style>

<section class="flip-in">
  <div class="flip-card" style="background:var(--bg-subtle); padding:2em; border-radius:8px;">
    <h2 style="font-size:2em; margin-bottom:0.3em;">核心观点</h2>
    <p style="color:var(--text-muted);">这段内容会以 3D 翻转效果出现</p>
  </div>
</section>
```

### SVG 路径描边动画

SVG 图标的描边逐步绘制，适合流程图、架构图中的连线。

```html
<style>
.draw-path {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  transition: stroke-dashoffset 1500ms cubic-bezier(0.25, 1, 0.5, 1);
}
.draw-path.visible {
  stroke-dashoffset: 0;
}
</style>

<section>
  <div style="text-align:center;">
    <svg width="400" height="100" viewBox="0 0 400 100">
      <path class="draw-path" d="M 20 50 C 100 10, 150 90, 200 50 S 300 10, 380 50"
            fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>
    </svg>
    <p style="margin-top:1em; font-size:0.8em; color:var(--text-muted);">路径动画示例</p>
  </div>
</section>

<script>
Reveal.on('slidechanged', function(event) {
  event.currentSlide.querySelectorAll('.draw-path').forEach(function(el) {
    // 设置正确的 dasharray 值
    var length = el.getTotalLength ? el.getTotalLength() : 1000;
    el.style.strokeDasharray = length;
    el.style.strokeDashoffset = length;
    el.classList.remove('visible');
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        el.style.strokeDashoffset = '0';
        el.classList.add('visible');
      });
    });
  });
});
</script>
```

### 视差层叠效果

多层元素以不同速度移动，创造深度感。适合标题页和章节分隔页。

```html
<style>
.parallax-layer {
  transition: transform 600ms cubic-bezier(0.25, 1, 0.5, 1);
}
</style>

<section style="overflow:hidden;">
  <!-- 背景装饰层（慢速移动） -->
  <div class="parallax-layer" data-speed="0.3"
       style="position:absolute; top:-10%; right:-5%;
              width:300px; height:300px; border-radius:50%;
              background:var(--accent); opacity:0.1;">
  </div>
  <!-- 中间装饰层（中速移动） -->
  <div class="parallax-layer" data-speed="0.6"
       style="position:absolute; bottom:5%; left:10%;
              width:150px; height:150px; border-radius:12px;
              background:var(--accent); opacity:0.08;
              transform:rotate(15deg);">
  </div>
  <!-- 内容层（正常速度） -->
  <div style="position:relative; z-index:1;">
    <h1 style="font-size:2.5em;">章节标题</h1>
    <p style="color:var(--text-muted);">视差层叠效果演示</p>
  </div>
</section>

<script>
// 视差效果：鼠标移动时不同层不同速度
document.addEventListener('mousemove', function(e) {
  var x = (e.clientX / window.innerWidth - 0.5) * 2;
  var y = (e.clientY / window.innerHeight - 0.5) * 2;
  document.querySelectorAll('.parallax-layer').forEach(function(el) {
    var speed = parseFloat(el.getAttribute('data-speed')) || 0.5;
    el.style.transform = 'translate(' + (x * speed * 20) + 'px, ' + (y * speed * 20) + 'px)';
  });
});
</script>
```

### 高级动画快速检查清单

使用高级动画时额外检查：

- [ ] 每个 slide 最多使用 **1 种**高级动画（不要叠加）
- [ ] 高级动画时长 **≤1200ms**（再长观众会等）
- [ ] 数字滚动在 **1200ms** 内完成
- [ ] 文字逐字延迟 **≤60ms/字**（中文）/ **≤40ms/字**（英文）
- [ ] `prefers-reduced-motion` 下降级为简单淡入
- [ ] 动画不影响文字可读性（模糊、遮挡等）
- [ ] 全部高级动画不超过 **2-3 个 slide**（其余用基础 fragment）
