# 布局模式详解

## 目录

1. [单列居中布局](#单列居中布局)
2. [两列布局](#两列布局)
3. [三列布局](#三列布局)
4. [四列布局（紧凑）](#四列布局紧凑)
5. [列表布局](#列表布局)
6. [流程图布局](#流程图布局)
7. [架构图布局](#架构图布局)
8. [代码展示](#代码展示)
9. [Fragment 动画](#fragment-动画)
10. [引用块](#引用块)
11. [超框案例记录](#超框案例记录) — 8 个真实案例及解决方案
12. [内容密度限制](#内容密度限制)
13. [快速检查清单](#快速检查清单)

---

每一页有且仅有 **1 个视觉重心**：一句金句、一个大数字、一张图、或一个对比。不要"什么都强调"。

背景层次、签名时刻、微细节润色等精致度配方：`design-polish.md`

根据内容性质选择版面：

| 这一页要表达什么 | 选用的版面 | 代码参考 |
|---|---|---|
| 开场/封面 | 标题页模板 — 居中大字 + kicker + 副标题 + 元数据 | → 单列居中 · 标题页模板 |
| 提出一个观点 | 大字引言 — 全屏金句或主张 | → 引用块 |
| 提出一个问题 | 全屏问句 — 极简，按语义断行 | → 单列居中（大号 h1） |
| 展示数据 | 大数字 + 数据卡 — 数字突出，标注来源 | → 三列布局 · 指标卡片 |
| 对比两个方案 | 两列对比 — 左右分屏 | → 两列布局 |
| 列出要点 | 紧凑列表 — ≤4 项，每项一行或一行+描述 | → 列表布局 |
| 展示流程 | 流程图 — ≤5 步横排，>5 步拆成两行 | → 流程图布局 |
| 展示架构 | 层级架构图 — 从上到下分层 | → 架构图布局 |
| 列出功能/特性 | 卡片网格 — 2×2 或 3 列 | → 三列布局 |
| 展示时间线 | 横向时间轴 — 等距节点 | → 流程图（横向步骤） |
| 总结/号召 | 大字结尾页 — 简洁有力 | → 标题页（反用） |

**页面数量规划**：
- 每页 1 个核心要点 → 要点数 + 封面 + 结尾 = 总页数
- 短内容（<5 要点）：6-10 页起步
- 长内容（5-10 要点）：10-16 页，可加章节分隔页
- 超长内容（>10 要点）：16+ 页，拆分章节，每章有独立封面

---

## 单列居中布局

默认布局方式，适合标题页和简单内容：

```html
<section>
  <h2>标题</h2>
  <p>单列内容，居中对齐</p>
</section>
```

### 标题页模板

```html
<section class="title-slide" data-background="var(--c-bg)">
  <h1 style="font-size: 2.5em; color: var(--c-fg);">演讲标题</h1>
  <p style="color: var(--c-fg-3); font-size: 1.2em;">副标题</p>
  <div style="margin-top: 2em; color: var(--c-fg-3);">
    <p>演讲者 | 日期</p>
  </div>
</section>
```

## 两列布局

适合对比类内容或左右分区：

```html
<section>
  <div style="display: flex; gap: 2em; align-items: flex-start;">
    <div style="flex: 1;">
      <h3>左侧标题</h3>
      <p>左侧内容...</p>
    </div>
    <div style="flex: 1;">
      <h3>右侧标题</h3>
      <p>右侧内容...</p>
    </div>
  </div>
</section>
```

### 两列图文布局

```html
<section>
  <div style="display: flex; gap: 2em; align-items: center;">
    <div style="flex: 1;">
      <h2>标题</h2>
      <p>描述文字...</p>
    </div>
    <div style="flex: 1; text-align: center;">
      <img src="image.jpg" alt="描述" style="max-width: 100%; border-radius: 8px;">
    </div>
  </div>
</section>
```

## 三列布局

适合特性介绍或服务展示：

```html
<section>
  <h2 style="text-align: center;">特性总览</h2>
  <div style="display: flex; gap: 1.5em; text-align: center; margin-top: 1.5em;">
    <div style="flex: 1; min-width: 0;">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--c-accent)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 0.5em;"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
      <h3 style="margin-top: 0.3em;">快速</h3>
      <p style="font-size: 0.85em;">描述文字</p>
    </div>
    <div style="flex: 1; min-width: 0;">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--c-accent)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 0.5em;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      <h3 style="margin-top: 0.3em;">安全</h3>
      <p style="font-size: 0.85em;">描述文字</p>
    </div>
    <div style="flex: 1; min-width: 0;">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--c-accent)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 0.5em;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      <h3 style="margin-top: 0.3em;">简单</h3>
      <p style="font-size: 0.85em;">描述文字</p>
    </div>
  </div>
</section>
```

## 四列布局（紧凑）

适合功能列表：

```html
<section>
  <h2>功能列表</h2>
  <div style="display: flex; gap: 1em; flex-wrap: wrap; text-align: center;">
    <div style="flex: 1; min-width: 200px;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--c-accent)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
      <p style="font-size: 0.75em; margin-top: 0.5em;">代码高亮</p>
    </div>
    <!-- 重复更多项 -->
  </div>
</section>
```

## 列表布局

### 基础列表

```html
<section>
  <h2>要点</h2>
  <ul style="line-height: 2;">
    <li>第一要点</li>
    <li>第二要点</li>
    <li>第三要点</li>
  </ul>
</section>
```

### 带图标的列表

```html
<ul style="list-style: none; padding: 0; line-height: 2.2;">
  <li style="display:flex; align-items:center; gap:0.5em;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    完成的特性
  </li>
  <li style="display:flex; align-items:center; gap:0.5em;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    重要特性
  </li>
</ul>
```

### Badge 列表（紧凑）

```html
<div class="skill-types" style="display: flex; flex-wrap: wrap; gap: 0.35em;">
  <div class="skill-type-item" style="display: flex; align-items: center; gap: 0.5em; background: oklch(from var(--c-fg) l c h / 0.06); padding: 0.25em 0.5em; border-radius: 4px;">
    <span class="num-badge" style="background: var(--c-accent); color: #fff; width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.6em;">1</span>
    <span class="skill-type-name" style="font-size: 0.7em;">技能类型</span>
  </div>
  <!-- 更多项 -->
</div>
```

## 流程图布局

### 单行流程图（≤5 元素）

```html
<div class="flow" style="display: flex; align-items: center; gap: 0.5em; flex-wrap: wrap; max-width: 100%;">
  <span class="flow-step" style="background: oklch(from var(--c-fg) l c h / 0.06); padding: 0.35em 0.7em; border-radius: 3px; font-size: 0.7em; white-space: nowrap; flex-shrink: 0;">输入</span>
  <span class="flow-arrow">→</span>
  <span class="flow-step" style="background: oklch(from var(--c-fg) l c h / 0.06); padding: 0.35em 0.7em; border-radius: 3px; font-size: 0.7em; white-space: nowrap; flex-shrink: 0;">处理</span>
  <span class="flow-arrow">→</span>
  <span class="flow-step accent" style="background: var(--c-accent); color: #fff; padding: 0.35em 0.7em; border-radius: 3px; font-size: 0.7em; white-space: nowrap; flex-shrink: 0;">输出</span>
</div>
```

### 两行流程图（>5 元素）

```html
<!-- 第一行 -->
<div class="flow" style="display: flex; align-items: center; gap: 0.5em; flex-wrap: wrap; max-width: 100%; margin-bottom: 0.5em;">
  <span class="flow-step">Step1</span><span class="flow-arrow">→</span>
  <span class="flow-step">Step2</span><span class="flow-arrow">→</span>
  <span class="flow-step">Step3</span><span class="flow-arrow">→</span>
  <span class="flow-step">Step4</span>
</div>
<!-- 第二行 -->
<div class="flow" style="display: flex; align-items: center; gap: 0.5em; flex-wrap: wrap; max-width: 100%;">
  <span class="flow-step">Step5</span><span class="flow-arrow">→</span>
  <span class="flow-step">Step6</span><span class="flow-arrow">→</span>
  <span class="flow-step">Step7</span><span class="flow-arrow">→</span>
  <span class="flow-step">Step8</span><span class="flow-arrow">→</span>
  <span class="flow-step accent">完成</span>
</div>
```

### 垂直流程图（纵向步骤）

当步骤需要纵向展示时，**严格控制步骤数量**：

```
可用内容高度 ≈ 550px
每步高度 ≈ 60px（含箭头）
箭头高度 ≈ 25px
所以：垂直流程图最多 7 步（含首尾）
```

```html
<div class="vflow" style="display: flex; flex-direction: column; align-items: center; gap: 0;">
  <!-- Step 1 -->
  <div class="vflow-step" style="background: oklch(from var(--c-fg) l c h / 0.06); padding: 0.4em 1.2em; border-radius: 4px; font-size: 0.7em; text-align: center; min-width: 120px;">
    加载参考文档
  </div>
  <!-- Arrow -->
  <div style="color: var(--c-fg-3); font-size: 1.2em; line-height: 1;">↓</div>
  <!-- Step 2 -->
  <div class="vflow-step" style="background: oklch(from var(--c-fg) l c h / 0.06); padding: 0.4em 1.2em; border-radius: 4px; font-size: 0.7em; text-align: center; min-width: 120px;">
    加载模板
  </div>
  <!-- Arrow -->
  <div style="color: var(--c-fg-3); font-size: 1.2em; line-height: 1;">↓</div>
  <!-- Step 3 -->
  <div class="vflow-step accent" style="background: var(--c-accent); color: #fff; padding: 0.4em 1.2em; border-radius: 4px; font-size: 0.7em; text-align: center; min-width: 120px;">
    补齐变量
  </div>
</div>
```

**⚠️ 垂直流程图超过 7 步的解决方案：**

| 方案 | 适用场景 |
|------|---------|
| 拆成 2 页 | 步骤可分组，每组 ≤ 7 步 |
| 改横向 | 步骤横向排列，wrap 成多行 |
| 精简文字 | 减少每步描述，只保留关键词 |
| 改表格 | 4 步以内可用，超过 4 步用横向流程图 |

## 架构图布局

### 基础架构图

```html
<div style="text-align: center;">
  <div class="arch-row" style="display: flex; justify-content: center; gap: 0.5em; flex-wrap: wrap; margin-bottom: 1em;">
    <span class="arch-item" style="background: var(--c-accent); color: #fff; padding: 0.5em 1em; border-radius: 4px; font-size: 0.75em;">顶层组件</span>
  </div>
  <div class="arch-row" style="display: flex; justify-content: center; gap: 0.5em; flex-wrap: wrap;">
    <span class="arch-item" style="background: oklch(from var(--c-fg) l c h / 0.06); padding: 0.4em 0.8em; border-radius: 4px; font-size: 0.7em;">子组件 A</span>
    <span class="arch-item" style="background: oklch(from var(--c-fg) l c h / 0.06); padding: 0.4em 0.8em; border-radius: 4px; font-size: 0.7em;">子组件 B</span>
    <span class="arch-item" style="background: oklch(from var(--c-fg) l c h / 0.06); padding: 0.4em 0.8em; border-radius: 4px; font-size: 0.7em;">子组件 C</span>
  </div>
</div>
```

### 多层架构图

```html
<div style="text-align: center;">
  <!-- Layer 1 -->
  <div style="margin-bottom: 1em;">
    <span class="arch-item" style="background: #3B82F6; color: #fff; padding: 0.5em 1.5em; border-radius: 4px;">应用层</span>
  </div>
  <!-- Arrows -->
  <div style="color: var(--c-fg-3); margin: 0.5em 0;">↓</div>
  <!-- Layer 2 -->
  <div style="display: flex; justify-content: center; gap: 1em; margin-bottom: 1em; flex-wrap: wrap;">
    <span class="arch-item" style="background: #10B981; color: #fff; padding: 0.4em 1em; border-radius: 4px;">API</span>
    <span class="arch-item" style="background: #10B981; color: #fff; padding: 0.4em 1em; border-radius: 4px;">Auth</span>
    <span class="arch-item" style="background: #10B981; color: #fff; padding: 0.4em 1em; border-radius: 4px;">Cache</span>
  </div>
  <!-- Arrows -->
  <div style="color: var(--c-fg-3); margin: 0.5em 0;">↓</div>
  <!-- Layer 3 -->
  <div style="display: flex; justify-content: center; gap: 1em; flex-wrap: wrap;">
    <span class="arch-item" style="background: var(--c-accent); color: #fff; padding: 0.4em 1em; border-radius: 4px;">数据库</span>
    <span class="arch-item" style="background: var(--c-accent); color: #fff; padding: 0.4em 1em; border-radius: 4px;">存储</span>
  </div>
</div>
```

## 代码展示

### 基础代码块

```html
<section>
  <h3>代码示例</h3>
  <pre><code class="javascript" data-trim>
function hello() {
  console.log('Hello, World!');
  return true;
}
  </code></pre>
</section>
```

### 带语法高亮的代码

```html
<section>
  <h3>Python 示例</h3>
  <pre><code class="python" data-trim>
def main():
    print("Hello, World!")
    return 0

if __name__ == "__main__":
    main()
  </code></pre>
</section>
```

## Fragment 动画

### 基础 Fragment

```html
<p class="fragment">第一步：发现问题</p>
<p class="fragment">第二步：分析原因</p>
<p class="fragment">第三步：制定方案</p>
```

### Fragment 效果变体

```html
<p class="fragment fade-up">上浮出现</p>
<p class="fragment fade-down">下沉出现</p>
<p class="fragment fade-left">左滑出现</p>
<p class="fragment fade-right">右滑出现</p>
<p class="fragment highlight-red">红色高亮</p>
<p class="fragment highlight-blue">蓝色高亮</p>
<p class="fragment highlight-green">绿色高亮</p>
<p class="fragment strike-through">删除线</p>
<p class="fragment">缩小 <span class="fragment shrink">shrink</span></p>
<p class="fragment">放大 <span class="fragment grow">grow</span></p>
```

### 组合 Fragment

```html
<section>
  <p class="fragment fade-up" data-fragment-index="1">第一个出现</p>
  <p class="fragment fade-up" data-fragment-index="2">第二个出现</p>
  <p class="fragment fade-up" data-fragment-index="3">第三个出现</p>
</section>
```

## 引用块

### 基础引用

```html
<section>
  <div class="pullquote" style="border-left: 3px solid var(--c-accent); padding-left: 1em; margin: 1.5em 0;">
    <p style="font-family: 'Noto Serif SC', serif; font-size: 1.1em; font-style: italic; color: var(--c-fg);">
      这是一段引用文字，可以是名言警句或重要观点。
    </p>
    <p style="font-size: 0.8em; color: var(--c-fg-3); margin-top: 0.5em;">— 来源或作者</p>
  </div>
</section>
```

### 带背景色的引用

```html
<div style="background: linear-gradient(135deg, var(--c-accent) 0%, oklch(from var(--c-accent) l c h / 0.35) 100%); padding: 1.5em; border-radius: 8px; margin: 1em 0;">
  <p style="color: #fff; font-size: 1em; margin: 0;">
    引用内容
  </p>
  <p style="color: rgba(255,255,255,0.8); font-size: 0.8em; margin-top: 0.5em;">
    — 来源
  </p>
</div>
```

## 超框案例记录

> 以下案例来自真实项目经验。案例中引用的文件名仅作记录用途，实际文件可能不存在于当前仓库。

### 案例 1：9 项列表超框

| 项目 | 内容 |
|------|------|
| 问题 | 9 项列表垂直堆叠导致超框 |
| 原因 | 单列承载 9 项内容，每项 2 行文字，总高度超出可用区域 |
| 解决方案 | 改双列布局（5+4），缩小字体和间距 |

```html
<!-- 错误：单列 9 项 -->
<div class="skill-types">
  <div class="skill-type-item">...</div> × 9
</div>

<!-- 正确：双列 -->
<div style="display: flex; gap: 1em;">
  <div class="skill-types">... × 5</div>
  <div class="skill-types">... × 4</div>
</div>
```

### 案例 2：flow 箭头链文字过长

| 项目 | 内容 |
|------|------|
| 问题 | `A → B` 流程步骤文字过长导致超框 |
| 原因 | flow-step 内的中文文字过长，又设置了 `white-space: nowrap` |
| 解决方案 | 缩短文字、使用更短的描述 |

```html
<!-- 错误：文字太长 + nowrap -->
<span class="flow-step">references/api.md</span>
<span class="flow-step">详细函数签名和用法</span>

<!-- 正确：简短文字 -->
<span class="flow-step">references/</span>
<span class="flow-step">函数签名 · 用法示例</span>
```

### 案例 3：架构图单行元素过多

| 项目 | 内容 |
|------|------|
| 问题 | 架构图一行 6+ 个元素超框 |
| 原因 | 固定 `flex-wrap: nowrap` 导致无法换行 |
| 解决方案 | 启用 `flex-wrap: wrap`，并减小字体到 0.65em |

```css
/* 错误：nowrap 导致无法换行 */
.arch-row {
  flex-wrap: nowrap;
}

/* 正确：wrap 允许换行 */
.arch-row {
  flex-wrap: wrap;
  max-width: 100%;
}
```

### 案例 4：流程图单行 9+ 元素

| 项目 | 内容 |
|------|------|
| 问题 | 9 步流程图单行排列完全超出可视区域 |
| 原因 | 忽略了"单行 ≤ 5 元素"原则 |
| 解决方案 | 拆成两行，每行 4-5 元素 |

```
错误：[Step1] → [Step2] → ... → [Step9]
正确：
[Step1] → [Step2] → [Step3] → [Step4]
[Step5] → [Step6] → [Step7] → [Step8] → [Step9]
```

### 案例 5：4 要素列表截断

| 项目 | 内容 |
|------|------|
| 问题 | "4 要素"页面，第 4 项被截断 |
| 原因 | 4 项列表每项有图标+标题+描述，总高度超出 |
| 解决方案 | 缩短描述文字、减小 margin 和 padding |

```html
<!-- 修复前：描述文字较长 -->
<div class="apple-list-item">
  <strong>避免模糊词</strong>
  <span>不写 "helps with"、"provides guidance"</span>
</div>

<!-- 修复后：缩短文字 + 减小间距 -->
<div class="apple-list-item" style="margin: 0.4em 0;">
  <strong>避免模糊词</strong>
  <span>不写 helps with、provides</span>
</div>
```

### 案例 6：代码块截断

| 项目 | 内容 |
|------|------|
| 问题 | "高级技巧"页面代码块只显示半行 |
| 原因 | 代码块 + 3 个卡片 + 标题+描述，总高度超出 |
| 解决方案 | 去掉 `<pre><code>` 包裹，改用纯文本展示 |

```html
<!-- 修复前：代码块 -->
<pre><code class="json" style="font-size: 0.6em;">
{"pre_tool_use": [{"matcher": ".*", ...}]}
</code></pre>

<!-- 修复后：纯文本行 -->
<div class="apple-card" style="padding: 0.5em 0.8em;">
  <p style="font-size: 0.6em; color: gray; font-family: monospace;">
    {"pre_tool_use": [{"matcher": ".*", ...}]}
  </p>
</div>
```

### 案例 7：6 项检查清单只显示 3 项

| 项目 | 内容 |
|------|------|
| 问题 | "快速检查清单"6 项只显示 3 项 |
| 原因 | 6 项列表每项有图标+文字，双列布局仍然溢出 |
| 解决方案 | 改用更紧凑的卡片样式，减小 gap 和 padding |

```html
<!-- 修复前：列表项样式 -->
<div class="apple-list-item" style="margin: 0; padding: 0.4em 0;">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c-accent)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  <div class="item-content">
    <strong>description 包含具体触发短语</strong>
  </div>
</div>

<!-- 修复后：紧凑卡片样式 -->
<div class="apple-card" style="padding: 0.5em 0.8em; display: flex; align-items: center; gap: 0.5em;">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c-accent)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  <span style="font-size: 0.8em; color: white;">description 包含具体触发短语</span>
</div>
```

### 案例 8：编辑拆分时信息丢失

| 项目 | 内容 |
|------|------|
| 问题 | 将 9 种 Skill 类型拆分为 2 页时，遗漏了"基础设施运维"项，只剩 8 项 |
| 原因 | 编辑时只关注布局，忽略了对原始内容的逐项核对 |
| 解决方案 | **拆分内容前：先列出所有原始项的清单，每复制一项就打一个标记** |

```markdown
## 拆分前 checklist
- [x] 库与 API 参考
- [x] 产品验证
- [x] 数据获取与分析
- [x] 业务流程自动化
- [x] 代码脚手架
- [x] 代码质量审查
- [x] CI/CD 与部署
- [x] 运维手册
- [x] 基础设施运维  ← 这个最容易漏

拆分后检查：
- Slide 2a: 4 项 ✓
- Slide 2b: 5 项 ✓
```

---

## 内容密度限制

reveal.js 演示区域固定为 **1280 × 720px**，实际可用高度约 **650px**（减去 padding 和 progress bar）。

### 内容类型密度上限

| 元素类型 | 每页上限 | 说明 |
|---------|---------|------|
| 标题 + 要点列表 | 4-5 项 | 每项一行文字 |
| 带描述的列表项 | 3 项 | 每项有标题+描述 |
| 2×2 卡片网格 | 4 个 | 每个卡片有标题+描述 |
| 3 列卡片 | 3 个 | 每个卡片简洁内容 |
| 代码块 | 1 个 | 简短代码，不换行 |
| 混合布局 | 更少 | 标题+卡片+列表同时存在 |

### 修复策略优先级

当内容溢出时，按以下顺序尝试：

1. **减少文字** — 缩短描述、合并相似项、删除次要内容
2. **缩小尺寸** — 减小 padding、font-size、gap、margin
3. **改布局** — 单列改双列、大卡片改小卡片
4. **删内容** — 如果以上都不够，只能删减内容

### 防超框 CSS 规则

以下规则应在模板生成时默认应用，防止布局溢出：

```css
/* grid 列：使用 minmax(0, 1fr) 替代 1fr */
.grid-container {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

/* flex 子项：允许强制收缩 */
.flex-item {
  min-width: 0;
  word-break: break-word;
}

/* 数字/长文本：允许断行 */
.stat-number {
  word-break: break-all;
}
```

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| grid 列不收缩 | `1fr` 最小值为内容宽度 | 改用 `minmax(0, 1fr)` |
| flex 子项不收缩 | 默认 `min-width: auto` | 添加 `min-width: 0` |
| 数字/长单词溢出 | 无断行规则 | 添加 `word-break: break-all` |
| absolute 装饰元素重叠内容 | 脱离文档流，与主内容空间未分离 | 见下方"绝对定位叠加元素" |

### 绝对定位叠加元素（防重叠规则）

终端信息栏、状态指示器等 `position: absolute` 的装饰元素，容易与主内容重叠。**必须**遵守以下规则：

**规则 1：叠加元素必须有实色背景**

```css
/* ❌ 错误：opacity 让背景也变透明，内容穿透可见 */
.overlay-info {
  position: absolute;
  bottom: 0.5em;
  right: 1em;
  opacity: 0.5;  /* 背景也变透明！ */
}

/* ✅ 正确：用颜色控制透明度，背景保持实色 */
.overlay-info {
  position: absolute;
  bottom: 0.5em;
  right: 1em;
  color: oklch(30% 0.01 250);  /* 直接用暗色，不用 opacity */
  background: var(--c-bg);        /* 实色背景覆盖下方内容 */
  padding: 0.2em 0.5em;
  z-index: 2;
}
```

**规则 2：最后内容元素加 `margin-bottom` 预留缓冲区**

```css
/* 内容区域最后一个元素的底部间距，必须大于叠加元素的高度 */
.last-content-element {
  margin-bottom: 2em;  /* 至少 2em，防止内容进入叠加元素区域 */
}
```

**规则 3：section 的 padding-bottom 必须为叠加元素预留空间**

```css
/* 有底部叠加元素时，padding-bottom ≥ 80px */
.reveal section {
  padding: 60px 80px 80px 80px;  /* 底部 80px 预留给 terminal-bar 等 */
}
```

**自检方法**：所有 fragment 显示后，检查叠加元素与最后内容元素的 bounding box 是否有 >3px 的垂直重叠。

### 高度计算参考

```
可用高度 ≈ 650px

标题区域: ~50px (h2 + margin-bottom)
内容区: ~550px
底部留白: ~50px

示例计算：
- 4 项列表：每项 ~35px × 4 = 140px ✓
- 2×2 卡片：每卡 ~80px × 2 行 = 160px ✓
- 3 列卡片：每卡 ~100px = 100px ✓
```

## 精致布局模板

> 以下模板整合了背景层次、空间构图和微细节润色。直接复制使用，是"精致"而非"能看"的布局。
> 配方来源：`design-polish.md`

### 精致标题页（带背景纹理 + eyebrow + 分隔线）

```html
<section class="title-slide" data-background="var(--c-bg)">
  <p style="font-size:0.75em; text-transform:uppercase; letter-spacing:0.1em;
            color:var(--c-accent); margin-bottom:1.5em;" class="fragment fade-up">
    2026 年度报告
  </p>
  <h1 style="font-size:clamp(2em, 3em, 3.5em); font-weight:600;
             letter-spacing: 0; line-height:1.1; margin-bottom:0.3em;"
      class="fragment fade-up" >
    设计的理性<br>与感性
  </h1>
  <p style="font-size:1.2em; font-weight:300; color:var(--c-fg-3);
            margin-bottom:2em;" class="fragment fade-up">
    探索数字产品中的美学逻辑
  </p>
  <div style="width:60px; height:2px; background:var(--c-accent);"
       class="fragment fade-up"></div>
  <p style="font-size:0.85em; color:var(--c-fg-3); margin-top:1.5em;"
     class="fragment fade-up">
    张明远 · 2026年春季
  </p>
</section>
```

配套 CSS（放在 `<style>` 中，为内容页添加点阵纹理）：

```css
.reveal section::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(var(--c-fg) 0.5px, transparent 0.5px);
  background-size: 24px 24px;
  opacity: 0.03;
  pointer-events: none;
  z-index: 0;
}
.reveal section > * { position: relative; z-index: 1; }
.title-slide::after { display: none; }
```

### 精致内容页（左对齐 + 编号标签 + 节奏间距）

```html
<section data-background="var(--c-bg)">
  <p style="font-size:0.7em; text-transform:uppercase; letter-spacing:0.1em;
            color:var(--c-accent); margin-bottom:0.8em;">
    Chapter 02
  </p>
  <h2 style="font-size:1.8em; font-weight:600; letter-spacing: 0;
             margin-bottom:0.4em;">
    核心方法论
  </h2>
  <div style="width:40px; height:2px; background:var(--c-accent); margin-bottom:2em;"></div>
  <ul style="list-style:none; padding:0; display:flex; flex-direction:column; gap:1.2em;">
    <li style="display:flex; gap:1em; align-items:baseline;">
      <span style="color:var(--c-accent); font-weight:600; font-size:0.85em;
                   min-width:2em;">01</span>
      <span>系统性的思考方式——从全局到局部，层层递进</span>
    </li>
    <li style="display:flex; gap:1em; align-items:baseline;">
      <span style="color:var(--c-accent); font-weight:600; font-size:0.85em;
                   min-width:2em;">02</span>
      <span>可量化的评估标准——每个设计决策都有数据支撑</span>
    </li>
    <li style="display:flex; gap:1em; align-items:baseline;">
      <span style="color:var(--c-accent); font-weight:600; font-size:0.85em;
                   min-width:2em;">03</span>
      <span>用户研究数据支撑——以真实反馈驱动迭代</span>
    </li>
  </ul>
  <p style="font-size:0.7em; color:var(--c-fg-3); margin-top:2.5em;">
    数据来源：2026 Q1 用户调研报告 · N=2,400
  </p>
</section>
```

### 精致双列页（非对称 35/65 + 色块编号）

```html
<section data-background="var(--c-bg)" style="padding:0; overflow:hidden;">
  <div style="display:flex; height:100%; margin:0;">
    <!-- 左 35%：accent 色块 -->
    <div style="width:35%; background:var(--c-accent);
                display:flex; align-items:flex-end; padding:3em 2em;">
      <div>
        <div style="font-size:clamp(3em, 5em, 6em); font-weight:600;
                    color:oklch(98% 0.01 80); line-height:1;
                    letter-spacing: 0;">03</div>
        <div style="font-size:0.85em; color:oklch(from var(--c-accent) l c h / 0.7);
                    margin-top:0.5em; text-transform:uppercase;
                    letter-spacing:0.08em;">核心技术</div>
      </div>
    </div>
    <!-- 右 65%：内容 -->
    <div style="width:65%; padding:3em; display:flex; flex-direction:column;
                justify-content:center; background:var(--c-bg);">
      <h2 style="font-size:1.6em; margin-bottom:0.8em;">架构设计哲学</h2>
      <ul style="list-style:none; padding:0; display:flex;
                 flex-direction:column; gap:0.8em; font-size:0.95em;">
        <li style="display:flex; gap:0.8em; align-items:center;">
          <span style="color:var(--c-accent); font-weight:600;
                       font-size:0.8em;">01</span>
          <span>模块化设计，按需加载</span>
        </li>
        <li style="display:flex; gap:0.8em; align-items:center;">
          <span style="color:var(--c-accent); font-weight:600;
                       font-size:0.8em;">02</span>
          <span>事件驱动，解耦通信</span>
        </li>
        <li style="display:flex; gap:0.8em; align-items:center;">
          <span style="color:var(--c-accent); font-weight:600;
                       font-size:0.8em;">03</span>
          <span>边缘计算，就近响应</span>
        </li>
      </ul>
    </div>
  </div>
</section>
```

### 精致特性卡片（2×2 网格 + SVG 图标 + eyebrow）

```html
<section data-background="var(--c-bg)">
  <p style="font-size:0.7em; text-transform:uppercase; letter-spacing:0.1em;
            color:var(--c-accent); margin-bottom:0.5em;">Core Features</p>
  <h2 style="font-size:1.8em; margin-bottom:1.5em;">产品特性</h2>
  <div style="display:grid; grid-template-columns:repeat(2, minmax(0, 1fr));
              gap:1em;">
    <div style="background:oklch(from var(--c-fg) l c h / 0.06); padding:1.5em; border-radius:4px;">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
           stroke="var(--c-accent)" stroke-width="1.6" stroke-linecap="round"
           stroke-linejoin="round" style="margin-bottom:0.5em;">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
      </svg>
      <h3 style="font-size:1em; margin-bottom:0.3em;">智能创作</h3>
      <p style="font-size:0.8em; color:var(--c-fg-3); margin:0; line-height:1.5;">
        输入文字即可生成图像</p>
    </div>
    <div style="background:oklch(from var(--c-fg) l c h / 0.06); padding:1.5em; border-radius:4px;">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
           stroke="var(--c-accent)" stroke-width="1.6" stroke-linecap="round"
           stroke-linejoin="round" style="margin-bottom:0.5em;">
        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
      <h3 style="font-size:1em; margin-bottom:0.3em;">实时协作</h3>
      <p style="font-size:0.8em; color:var(--c-fg-3); margin:0; line-height:1.5;">
        多人同时编辑，灵感同步</p>
    </div>
    <div style="background:oklch(from var(--c-fg) l c h / 0.06); padding:1.5em; border-radius:4px;">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
           stroke="var(--c-accent)" stroke-width="1.6" stroke-linecap="round"
           stroke-linejoin="round" style="margin-bottom:0.5em;">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
      <h3 style="font-size:1em; margin-bottom:0.3em;">开放接口</h3>
      <p style="font-size:0.8em; color:var(--c-fg-3); margin:0; line-height:1.5;">
        RESTful API，无缝集成</p>
    </div>
    <div style="background:oklch(from var(--c-fg) l c h / 0.06); padding:1.5em; border-radius:4px;">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
           stroke="var(--c-accent)" stroke-width="1.6" stroke-linecap="round"
           stroke-linejoin="round" style="margin-bottom:0.5em;">
        <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
      </svg>
      <h3 style="font-size:1em; margin-bottom:0.3em;">移动优先</h3>
      <p style="font-size:0.8em; color:var(--c-fg-3); margin:0; line-height:1.5;">
        一处编辑，处处可见</p>
    </div>
  </div>
</section>
```

### 精致全出血章节页（accent 背景 + 装饰几何）

```html
<section data-background-color="var(--c-accent)"
         style="display:flex; align-items:center; justify-content:center;
                position:relative; overflow:hidden;">
  <!-- 装饰几何 -->
  <div style="position:absolute; top:-80px; right:-80px; width:280px; height:280px;
              border-radius:50%; border:1px solid oklch(98% 0.01 80 / 0.15);
              pointer-events:none;"></div>
  <div style="position:absolute; bottom:-50px; left:-50px; width:180px; height:180px;
              border-radius:8px; transform:rotate(15deg);
              background:oklch(98% 0.01 80 / 0.06); pointer-events:none;"></div>
  <!-- 内容 -->
  <div style="text-align:center; position:relative; z-index:1;">
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

### 精致引用页（超大引言 + 极端留白）

```html
<section data-background="var(--c-bg)"
         style="display:flex; align-items:center; height:100%;">
  <div style="max-width:85%;">
    <div style="font-size:clamp(2.2em, 3.5em, 4.5em); font-weight:600;
                line-height:1.15; letter-spacing: 0; color:var(--c-fg);">
      设计不是<br>看起来如何，<br>
      <span style="color:var(--c-accent);">而是如何运作。</span>
    </div>
    <div style="margin-top:2em; font-size:0.8em; color:var(--c-fg-3);
                letter-spacing:0.06em; text-transform:uppercase;">
      Steve Jobs · Apple Design Philosophy
    </div>
  </div>
</section>
```

### 精致大数字聚焦页（来源标注 + 纹理背景）

```html
<section data-background="var(--c-bg)"
         style="display:flex; align-items:center; justify-content:center; height:100%;">
  <div style="text-align:center;">
    <div style="font-size:clamp(4em, 7em, 9em); font-weight:600;
                line-height:0.9; letter-spacing: 0; color:var(--c-accent);">
      97<span style="font-size:0.4em; font-weight:400; letter-spacing:0;">%</span>
    </div>
    <div style="margin-top:1em; font-size:1.1em; color:var(--c-fg);
                letter-spacing: 0;">
      用户满意度
    </div>
    <div style="margin-top:0.5em; font-size:0.7em; color:var(--c-fg-3);
                letter-spacing:0.04em;">
      基于 2,400+ 活跃用户反馈 · 2026 Q1
    </div>
  </div>
</section>
```

---

## 快速检查清单

生成 PPT 后，在浏览器中检查：
- [ ] 4 项列表是否全部显示（第 4 项是否被截断）
- [ ] 代码块是否完整显示（有无截断或换行）
- [ ] 6+ 项检查清单是否完整
- [ ] 混合布局（标题+卡片+引用）是否溢出
- [ ] **拆分内容后是否核对原始项完整性**（防止遗漏）

---

## 高级布局模式

> 以下布局模式适用于需要更强视觉冲击力的页面。每个模式都遵循"每页 1 个视觉重心"原则。

### 全屏图片 + 文字叠加

图片占满整个 slide，文字覆盖在图片上方。适合封面、章节分隔页、视觉冲击页。

```html
<section data-background="https://picsum.photos/1280/720"
         data-background-size="cover">
  <div style="position:relative; z-index:1;">
    <!-- 半透明遮罩（提升文字可读性） -->
    <div style="position:absolute; inset:0; background:rgba(0,0,0,0.5); z-index:-1;"></div>
    <h1 style="font-size:2.5em; color:#fff; text-shadow:0 2px 8px rgba(0,0,0,0.3);">标题文字</h1>
    <p style="color:rgba(255,255,255,0.85); font-size:1.1em;">副标题或说明</p>
  </div>
</section>
```

**遮罩变体**：

| 效果 | 遮罩 CSS |
|------|---------|
| 全覆盖（50% 黑） | `background:rgba(0,0,0,0.5)` |
| 底部渐变（文字在下方） | `background:linear-gradient(transparent 30%, rgba(0,0,0,0.7))` |
| 左侧渐变（文字在左侧） | `background:linear-gradient(to right, rgba(0,0,0,0.6) 40%, transparent)` |
| 聚焦中心 | `background:radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.5))` |

### 竖向分割屏（50/50 Split）

左右各占 50%，一侧纯色/渐变，一侧内容。适合对比、人物介绍、产品展示。

```html
<section style="padding:0;">
  <div style="display:flex; height:100%; margin:-60px -80px;">
    <!-- 左侧：渐变/纯色 -->
    <div style="flex:1; background:linear-gradient(135deg, var(--c-accent), oklch(from var(--c-accent) l c h / 0.35));
                display:flex; align-items:center; justify-content:center; padding:3em;">
      <h2 style="font-size:2em; color:#fff; text-align:center;">大标题</h2>
    </div>
    <!-- 右侧：内容 -->
    <div style="flex:1; padding:3em 2.5em; display:flex; flex-direction:column; justify-content:center;">
      <p style="font-size:0.95em; line-height:1.7;">右侧内容区域。可以是文字、列表、图表等。</p>
      <ul style="margin-top:1em; line-height:2;">
        <li>要点一</li>
        <li>要点二</li>
        <li>要点三</li>
      </ul>
    </div>
  </div>
</section>
```

### 大数字聚焦（Metric Spotlight）

单个大数字占据视觉中心，辅以标签和来源说明。数据展示的最强模式。

```html
<section>
  <div style="text-align:center;">
    <p style="font-size:0.85em; text-transform:uppercase; letter-spacing:0.1em;
              color:var(--c-fg-3); margin-bottom:0.5em;">年度增长率</p>
    <div style="font-size:5em; font-weight:600; color:var(--c-accent); line-height:1;">
      +127<span style="font-size:0.5em;">%</span>
    </div>
    <p style="font-size:0.8em; color:var(--c-fg-3); margin-top:0.8em;">
      相比去年同期 · 数据来源：内部报表 Q4
    </p>
  </div>
</section>
```

**多指标变体**（≤3 个指标）：

```html
<section>
  <h2 style="text-align:center; margin-bottom:1em;">核心指标</h2>
  <div style="display:flex; justify-content:center; gap:4em; text-align:center;">
    <div>
      <div style="font-size:3em; font-weight:600; color:var(--c-accent);">97%</div>
      <div style="font-size:0.8em; color:var(--c-fg-3);">满意度</div>
    </div>
    <div>
      <div style="font-size:3em; font-weight:600; color:var(--c-accent);">2.4K</div>
      <div style="font-size:0.8em; color:var(--c-fg-3);">日活用户</div>
    </div>
    <div>
      <div style="font-size:3em; font-weight:600; color:var(--c-accent);">3.2s</div>
      <div style="font-size:0.8em; color:var(--c-fg-3);">响应时间</div>
    </div>
  </div>
</section>
```

### 横向时间线

等距节点展示时间线，适合里程碑、路线图、项目进度。

```html
<section>
  <h2 style="text-align:center; margin-bottom:1.5em;">发展历程</h2>
  <div style="position:relative; display:flex; justify-content:space-between;
              padding:0 2em;">
    <!-- 连接线 -->
    <div style="position:absolute; top:20px; left:2em; right:2em; height:2px;
                background:var(--c-accent); opacity:0.3;"></div>
    <!-- 节点 -->
    <div style="text-align:center; flex:1;">
      <div style="width:14px; height:14px; border-radius:50%; background:var(--c-accent);
                  margin:14px auto 0.8em;"></div>
      <div style="font-size:0.75em; font-weight:600;">2022</div>
      <div style="font-size:0.65em; color:var(--c-fg-3); margin-top:0.3em;">项目启动</div>
    </div>
    <div style="text-align:center; flex:1;">
      <div style="width:14px; height:14px; border-radius:50%; background:var(--c-accent);
                  margin:14px auto 0.8em;"></div>
      <div style="font-size:0.75em; font-weight:600;">2023</div>
      <div style="font-size:0.65em; color:var(--c-fg-3); margin-top:0.3em;">产品上线</div>
    </div>
    <div style="text-align:center; flex:1;">
      <div style="width:14px; height:14px; border-radius:50%; background:var(--c-accent);
                  margin:14px auto 0.8em;"></div>
      <div style="font-size:0.75em; font-weight:600;">2024</div>
      <div style="font-size:0.65em; color:var(--c-fg-3); margin-top:0.3em;">百万用户</div>
    </div>
    <div style="text-align:center; flex:1;">
      <div style="width:14px; height:14px; border-radius:50%; background:var(--c-accent);
                  border:3px solid oklch(from var(--c-accent) l c h / 0.35); margin:14px auto 0.8em;"></div>
      <div style="font-size:0.75em; font-weight:600;">2025</div>
      <div style="font-size:0.65em; color:var(--c-accent); margin-top:0.3em;">现在</div>
    </div>
  </div>
</section>
```

**时间线规则**：
- 节点数 **≤6 个**，超过则拆页
- 每个节点标签 **≤4 字**（中文）/ **≤2 词**（英文）
- 当前节点用 accent 色 + 边框高亮

### 金句引用页（Full-screen Quote）

全屏展示一句核心观点，最大化视觉冲击。适合开场、章节过渡、结尾。

```html
<section style="display:flex; align-items:center; justify-content:center;">
  <div style="max-width:80%; text-align:center;">
    <div style="font-size:2.2em; font-weight:500; line-height:1.4; letter-spacing: 0;">
      "好的设计不是没有东西可以添加，<br>
      而是没有东西可以去掉。"
    </div>
    <div style="margin-top:1.5em; font-size:0.85em; color:var(--c-fg-3);">
      — Antoine de Saint-Exupéry
    </div>
  </div>
</section>
```

### 特性对比表

两列对比，左"旧"右"新"或左"问题"右"方案"。

```html
<section>
  <h2 style="text-align:center; margin-bottom:1em;">前后对比</h2>
  <div style="display:flex; gap:2em;">
    <!-- 左侧：问题 -->
    <div style="flex:1; background:oklch(95% 0.02 25); padding:1.5em; border-radius:8px;">
      <div style="font-size:0.8em; font-weight:600; color:oklch(60% 0.15 25); margin-bottom:0.8em;">
        改造前
      </div>
      <ul style="list-style:none; padding:0; font-size:0.85em; line-height:2;">
        <li>手动部署，耗时 2 小时</li>
        <li>配置分散在 5 个仓库</li>
        <li>回滚需要 30 分钟</li>
      </ul>
    </div>
    <!-- 右侧：方案 -->
    <div style="flex:1; background:oklch(95% 0.02 150); padding:1.5em; border-radius:8px;">
      <div style="font-size:0.8em; font-weight:600; color:oklch(65% 0.15 155); margin-bottom:0.8em;">
        改造后
      </div>
      <ul style="list-style:none; padding:0; font-size:0.85em; line-height:2;">
        <li>一键部署，2 分钟完成</li>
        <li>配置集中管理</li>
        <li>秒级回滚</li>
      </ul>
    </div>
  </div>
</section>
```

### 布局选择决策树（增强版）

在原有决策树基础上，新增以下匹配规则：

| 这一页要表达什么 | 选用的版面 | 代码参考 |
|---|---|---|
| 视觉冲击/情感渲染 | 全屏图片 + 文字叠加 | → 高级 · 全屏图片 |
| 对比两个状态/方案 | 竖向分割屏（50/50） | → 高级 · 分割屏 |
| 展示核心数据 | 大数字聚焦（单指标 or ≤3 指标） | → 高级 · 大数字聚焦 |
| 展示时间线/里程碑 | 横向时间线（≤6 节点） | → 高级 · 时间线 |
| 核心观点/金句 | 全屏引用页 | → 高级 · 金句引用 |
| 前后对比/新旧对比 | 特性对比表 | → 高级 · 对比表 |
