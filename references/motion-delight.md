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
    <i class="fas fa-check-circle" style="font-size: 5em; color: #fff; animation: pulse 2s ease-in-out infinite;"></i>
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
