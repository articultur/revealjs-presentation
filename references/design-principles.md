# 设计原则详解

> 本文件整合了 [impeccable](https://github.com/pbakaus/impeccable) 设计框架的反模式和最佳实践

## 目录

1. [配色方案](#配色方案)
2. [字体系统](#字体系统)
3. [布局与空间](#布局与空间)
4. [视觉细节](#视觉细节)
5. [动效设计](#动效设计)
6. [反模式清单](#反模式清单)

---

## 配色方案

### 场景化配色建议

| 场景 | 推荐主色 | 背景 | 说明 |
|------|---------|------|------|
| 技术演讲 | #3B82F6 (蓝) | 深色/渐变 | 专业科技感 |
| 教学课件 | #10B981 (绿) | 浅色 | 轻松易读 |
| 产品发布 | #8B5CF6 (紫) | 深色 | 高端大气 |
| 学术报告 | #1E40AF (深蓝) | 白色 | 严谨专业 |
| 创意展示 | #F59E0B (橙) | 深色 | 活力创意 |

### 使用 OKLCH 颜色空间

**推荐使用 OKLCH**，而非 HSL。OKLCH 是感知均匀的，意味着 lightness 的等步长看起来相等。

```css
/* OKLCH: lightness (0-100%), chroma (0-0.4+), hue (0-360) */
:root {
  --primary: oklch(60% 0.15 250);       /* 蓝色 */
  --primary-light: oklch(85% 0.08 250); /* 同一色相，更浅 */
  --primary-dark: oklch(35% 0.12 250);  /* 同一色相，更深 */
}
```

### 不要使用纯灰或纯黑

```css
/* ❌ 死灰色 */
--gray-100: oklch(95% 0 0);

/* ✅ 添加色调的灰 */
--gray-100: oklch(95% 0.01 250); /* 冷色调蓝 */
--gray-900: oklch(15% 0.01 250);
```

### 渐变背景公式

```css
/* 专业科技感 */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* 清新自然 */
background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);

/* 深邃神秘 */
background: linear-gradient(135deg, #0c0c0c 0%, #2d3436 100%);
```

### 60-30-10 法则

- **60%**：中性背景、留白、基础表面
- **30%**：次要颜色——文本、边框、非活跃状态
- **10%**：强调色——CTA、高亮、焦点状态

---

## 字体系统

### 字体层级（保持对比）

| 角色 | 典型比例 | 用途 |
|------|---------|------|
| xs | 0.75em | 注释、法律文字 |
| sm | 0.875em | 次要 UI、元数据 |
| base | 1em | 正文 |
| lg | 1.25-1.5em | 副标题、引导文字 |
| xl+ | 2-4em | 标题、主文本 |

**原则：使用更少的尺寸，但对比更强。** 避免相邻尺寸太接近（14px, 15px, 16px...）。

### 不要使用的字体

| ❌ 避免 | ✅ 推荐替代 |
|--------|-----------|
| Inter | Instrument Sans, Plus Jakarta Sans, Outfit |
| Arial | -apple-system, BlinkMacSystemFont |
| Roboto | Onest, Figtree, Urbanist |
| Open Sans | Source Sans 3, DM Sans |

### 中文字体配置

```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap" rel="stylesheet">
```

---

## 布局与空间

### 核心原则

1. **内容优先**：设计服务于内容，不是装饰大于内容
2. **克制美学**：避免过度设计，保持专业简洁
3. **一致性**：统一的配色、字体、间距系统贯穿全篇

### 视觉节奏

通过变化的间距创造视觉节奏——不是每个地方都用相同的 padding。

```css
/* ❌ 错误：相同间距 */
.card { padding: 1em; }
.section { padding: 1em; }

/* ✅ 正确：变化的间距 */
.card { padding: 1.5em; }
.section { padding: 4em 2em; gap: 2em; }
```

### 不要过度使用卡片

```css
/* ❌ 错误：一切都是卡片 */
/* 不要把所有内容都包装在卡片中 */

/* ✅ 正确：只在需要时使用卡片 */
.feature-card { background: var(--bg-subtle); border-radius: 8px; padding: 1.5em; }

/* ❌ 错误：卡片嵌套卡片 */
/* 这会制造视觉噪音，扁平化层次 */

/* ✅ 正确：扁平化结构 */
.section { background: var(--bg-subtle); padding: 2em; }
.subsection { border-left: 2px solid var(--accent); padding-left: 1em; }
```

### 使用 flex-wrap 实现自动换行

```css
.flow, .arch-row {
  display: flex;
  flex-wrap: wrap;      /* ✅ 自动换行比硬编码安全 */
  max-width: 100%;
  overflow: hidden;
}
```

---

## 视觉细节

### 不要使用玻璃拟态 everywhere

```css
/* ❌ 错误：装饰性玻璃拟态 */
/* blur效果、玻璃卡片、发光边框到处使用 */

/* ✅ 正确：目的性使用 */
.glass-panel {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### 不要使用渐变文字

```css
/* ❌ 错误：用于"冲击力"的渐变文字 */
/* 这只是装饰，没有意义 */

/* ✅ 正确：纯色 + 排版层次 */
.metric-title {
  font-size: 3em;
  font-weight: 700;
  color: var(--text);
}
```

### 不要居中一切

```css
/* ❌ 错误：一切居中 */
/* 居中会看起来通用且无设计感 */

/* ✅ 正确：左对齐 + 非对称布局 */
.slide-content {
  text-align: left;
  padding-left: 2em;
}
```

---

## 动效设计

### Fragment 动画最佳实践

```html
<!-- ✅ 正确：使用指数缓动 -->
<p class="fragment fade-up">第一步</p>

<!-- ❌ 错误：使用 bounce/elastic 缓动 -->
<!-- bounce 和 elastic 感觉过时且廉价 -->
```

详情见 `references/motion-delight.md` 的"页面过渡"章节。

---

## 反模式清单

> 以下是 AI 生成演示文稿时常见的"俗套设计"，应避免：

### 配色反模式

| ❌ 避免 | ✅ 替代方案 |
|--------|-----------|
| 纯黑 (#000) 或纯白 (#fff) | 添加 tint（哪怕 0.01 chroma） |
| 灰色文字在彩色背景上 | 使用背景色的深色版本 |
| 紫色到蓝色渐变 + 霓虹强调色 | 选择单一强调色 + 中性背景 |
| 默认深色模式 + 发光强调 | 选择适合内容氛围的配色 |

### 字体反模式

| ❌ 避免 | ✅ 替代方案 |
|--------|-----------|
| Inter、Roboto、Arial | Noto Sans SC、Source Serif 4 |
| 系统默认字体用于标题 | 选择有特色的显示字体 |
| 相邻尺寸太接近 | 使用 Modular Scale，尺寸对比明显 |

### 布局反模式

| ❌ 避免 | ✅ 替代方案 |
|--------|-----------|
| 一切都是卡片 | 只在需要区分层次时使用卡片 |
| 卡片嵌套卡片 | 扁平化结构，使用 border-left 等区分 |
| 相同尺寸的卡片网格重复 | 变化尺寸，或使用非对称布局 |
| 一切居中 | 左对齐 + 非对称布局 |
| 相同间距 everywhere | 创造视觉节奏，紧密vs宽松交替 |

### 视觉反模式

| ❌ 避免 | ✅ 替代方案 |
|--------|-----------|
| 到处使用玻璃拟态 | 目的性使用，如 modal 背景 |
| 圆角矩形 + 通用阴影 | 目的性阴影，或扁平设计 |
| 渐变文字 | 使用排版层次代替 |
| 装饰性小图表 | 只在传达有意义数据时使用图表 |

---

## AI Slop 测试

**关键质量检查**：如果展示这个界面给某人并说"AI 做的"，他们会立刻相信吗？如果是，这就是问题所在。

一个独特的界面应该让人问"这是怎么做到的"，而不是"这是哪个 AI 做的"。

回顾上面的 **不要** 清单——这些都是 2024-2025 年 AI 生成作品的指纹。

---

## 参考资源

- [impeccable 官方仓库](https://github.com/pbakaus/impeccable)
- [impeccable.style](https://impeccable.style)
- [OKLCH 颜色转换工具](https://oklch.com/)
