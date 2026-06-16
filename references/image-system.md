# 图片处理系统

> CSS-only 图片效果：滤镜、裁切、混合、设备框——让演示中的图片有设计感，零依赖。

## 设计原则

- **图片是设计元素，不是插入物**：每张图片都经过处理以融入整体配色。
- **一致性优先**：同一份演示中，图片处理方式统一（同一种滤镜、同一种裁切形状）。
- **文字可读性不可妥协**：图片上覆盖文字时，必须确保对比度足够。

---

## 1. 滤镜预设（Filter Presets）

6 种滤镜预设，按场景选择。同一份演示只用 1 种。

### 柔和（Muted）— 默认推荐

降低饱和度和对比度，让图片不抢文字焦点。

```html
<img src="photo.jpg" style="
  width:100%;
  filter: saturate(0.7) contrast(0.9) brightness(1.05);
  border-radius:4px;
"/>
```

### 英雄叠加（Hero Overlay）— 封面页

图片作为背景，叠加深色渐变保证文字可读。

```html
<section style="position:relative;background:none;">
  <!-- 图片层 -->
  <img src="hero.jpg" style="
    position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
    filter:brightness(0.4) saturate(0.8);
  "/>
  <!-- 渐变强化层（可选，进一步压暗底部） -->
  <div style="
    position:absolute;inset:0;
    background:linear-gradient(to top, oklch(from var(--c-bg) l c h / 0.9) 0%, transparent 60%);
  "></div>
  <!-- 内容层 -->
  <div style="position:relative;z-index:1;">
    <h1>标题覆盖在图片上</h1>
    <p>文字始终清晰可读</p>
  </div>
</section>
```

**关键**：`brightness(0.3-0.5)` + `saturate(0.7-0.9)` 确保白字可读。

### 着色（Tinted）— 品牌融合

图片色调统一到 accent 色系。

```html
<div style="position:relative;display:inline-block;">
  <img src="photo.jpg" style="width:100%;display:block;"/>
  <div style="
    position:absolute;inset:0;
    background:var(--c-accent);
    mix-blend-mode:multiply;
    opacity:0.25;
  "></div>
</div>
```

### 锐利（Crisp）— 产品截图

提高清晰度，适合 UI 截图和技术图。

```html
<img src="screenshot.png" style="
  width:100%;
  filter: contrast(1.1) brightness(1.02);
  border-radius:4px;
  border:1px solid oklch(from var(--c-fg-3) l c h / 0.15);
"/>
```

### 黑白（B&W）— 引用/数据页

完全去色，适合严肃场景。

```html
<img src="photo.jpg" style="
  width:100%;
  filter:grayscale(1) contrast(1.1);
"/>
```

### 双色调（Duotone）— 高级感

用 CSS 近似双色调效果。

```html
<div style="position:relative;display:inline-block;">
  <img src="photo.jpg" style="
    width:100%;display:block;
    filter:grayscale(1) contrast(1.2);
  "/>
  <div style="
    position:absolute;inset:0;
    background:var(--c-accent);
    mix-blend-mode:color;
    opacity:0.6;
  "></div>
</div>
```

---

## 2. 形状裁切（Clip-Path Masks）

用 `clip-path` 裁切图片形状。同一份演示只用 1 种。

### 圆形

```html
<img src="avatar.jpg" style="
  width:8em;height:8em;object-fit:cover;
  clip-path:circle(50%);
"/>
```

### 圆角矩形（安全选择）

```html
<img src="photo.jpg" style="
  width:100%;object-fit:cover;
  clip-path:inset(0 round 8px);
"/>
```

### 六边形

```html
<img src="photo.jpg" style="
  width:10em;height:10em;object-fit:cover;
  clip-path:polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
"/>
```

### 波浪底边

```html
<div style="position:relative;">
  <img src="photo.jpg" style="
    width:100%;height:12em;object-fit:cover;display:block;
    clip-path:polygon(0 0, 100% 0, 100% 80%, 50% 100%, 0 80%);
  "/>
</div>
```

### 有机形状（Blob）

```html
<img src="photo.jpg" style="
  width:12em;height:12em;object-fit:cover;
  clip-path:polygon(
    30% 0%, 70% 0%, 100% 30%, 100% 60%,
    80% 100%, 50% 95%, 20% 100%, 0% 70%,
    0% 30%
  );
"/>
```

---

## 3. 混合模式叠加（Blend Modes）

用 `mix-blend-mode` 让图片与配色融合，不引入新颜色。

### 推荐组合

| 混合模式 | 效果 | 适用场景 |
|---------|------|---------|
| `multiply` | 暗部融合，类似着色 | 浅色图片 + 深色背景 |
| `screen` | 亮部融合 | 深色图片 + 浅色元素 |
| `color` | 色相替换，保留明暗 | 双色调效果 |
| `overlay` | 对比增强 | 文字+图片叠加 |
| `soft-light` | 柔和着色 | 微妙色调统一 |

### 配色融合（最常用）

```html
<section style="position:relative;background:none;">
  <img src="photo.jpg" style="
    position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
    filter:brightness(0.5);
  "/>
  <!-- 用 bg 色叠加让图片融入页面 -->
  <div style="
    position:absolute;inset:0;
    background:var(--c-bg);
    mix-blend-mode:color;
    opacity:0.4;
  "></div>
  <div style="position:relative;z-index:1;">
    <h2>图片自然融入配色方案</h2>
  </div>
</section>
```

---

## 4. 设备框（Device Frame）

为截图添加设备外壳，增加真实感。

### 浏览器窗口

```html
<div style="
  border-radius:6px;overflow:hidden;
  background:oklch(from var(--c-bg) l c h / 0.5);
  border:1px solid oklch(from var(--c-fg-3) l c h / 0.15);
">
  <!-- 标题栏 -->
  <div style="
    display:flex;align-items:center;gap:6px;
    padding:8px 12px;
    background:oklch(from var(--c-bg) l c h / 0.3);
    border-bottom:1px solid oklch(from var(--c-fg-3) l c h / 0.1);
  ">
    <span style="width:8px;height:8px;border-radius:50%;background:#ff5f57;"></span>
    <span style="width:8px;height:8px;border-radius:50%;background:#febc2e;"></span>
    <span style="width:8px;height:8px;border-radius:50%;background:#28c840;"></span>
    <span style="
      flex:1;margin-left:8px;
      font-size:0.65em;color:var(--c-fg-3);
      padding:2px 8px;border-radius:3px;
      background:oklch(from var(--c-fg-3) l c h / 0.08);
    ">https://example.com</span>
  </div>
  <!-- 内容 -->
  <div style="padding:0;">
    <img src="screenshot.png" style="width:100%;display:block;"/>
  </div>
</div>
```

### 手机竖屏

```html
<div style="
  display:inline-block;
  padding:8px;border-radius:20px;
  background:oklch(from var(--c-fg-3) l c h / 0.1);
  border:1px solid oklch(from var(--c-fg-3) l c h / 0.15);
">
  <div style="
    border-radius:12px;overflow:hidden;
    background:var(--c-bg);
  ">
    <!-- 状态栏 -->
    <div style="
      display:flex;justify-content:space-between;
      padding:4px 12px;
      font-size:0.55em;color:var(--c-fg-3);
    ">
      <span>9:41</span>
      <span>100%</span>
    </div>
    <img src="mobile.png" style="width:10em;display:block;"/>
  </div>
</div>
```

---

## 5. 图片+文字布局模式

### 左图右文

```html
<div style="display:flex;gap:2em;align-items:center;">
  <div style="flex:0 0 45%;">
    <img src="photo.jpg" style="
      width:100%;border-radius:4px;
      filter:saturate(0.7) contrast(0.9);
    "/>
  </div>
  <div style="flex:1;">
    <h3>左侧配图，右侧内容</h3>
    <p style="color:var(--c-fg-3);">图片占 45%，内容占 55%，留出呼吸感。</p>
  </div>
</div>
```

### 全出血背景图

```html
<section style="position:relative;background:none;padding:0;">
  <img src="hero.jpg" style="
    position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
    filter:brightness(0.35) saturate(0.8);
  "/>
  <div style="position:relative;z-index:1;padding:60px 80px;display:flex;flex-direction:column;justify-content:flex-end;height:100%;">
    <p style="font-size:0.7em;color:var(--c-accent);text-transform:uppercase;letter-spacing:0.1em;">案例研究</p>
    <h1 style="font-size:2.4em;max-width:60%;">标题文字覆盖在图片上</h1>
    <p style="max-width:50%;color:var(--c-fg-3);margin-top:0.5em;">副标题说明</p>
  </div>
</section>
```

### 网格画廊

```html
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.5em;">
  <img src="1.jpg" style="width:100%;height:6em;object-fit:cover;border-radius:2px;
    filter:saturate(0.7) contrast(0.9);"/>
  <img src="2.jpg" style="width:100%;height:6em;object-fit:cover;border-radius:2px;
    filter:saturate(0.7) contrast(0.9);"/>
  <img src="3.jpg" style="width:100%;height:6em;object-fit:cover;border-radius:2px;
    filter:saturate(0.7) contrast(0.9);"/>
</div>
```

**设计约束**：
- 画廊最多 2×3 或 3×2 布局（6 张以内）
- 所有图片使用相同滤镜和 border-radius
- 间距统一 0.5em

---

## 选择指南

| 场景 | 滤镜 | 裁切 | 布局 |
|------|------|------|------|
| 封面页 | Hero Overlay | 无/波浪 | 全出血 |
| 产品展示 | Crisp | 圆角矩形 | 左图右文 |
| 团队介绍 | Muted | 圆形/六边形 | 网格画廊 |
| 数据页配图 | B&W | 无 | 侧边小图 |
| 案例研究 | Tinted | 无 | 全出血+文字 |
| UI 截图 | Crisp | 无 | 浏览器框 |
| 高级装饰页 | Duotone | Blob/六边形 | 居中特写 |
