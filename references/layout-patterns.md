# 布局模式详解

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
<section class="title-slide" data-background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
  <h1 style="font-size: 2.5em; color: #fff;">演讲标题</h1>
  <p style="color: rgba(255,255,255,0.8); font-size: 1.2em;">副标题</p>
  <div style="margin-top: 2em; color: rgba(255,255,255,0.6);">
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
    <div style="flex: 1;">
      <i class="fas fa-rocket" style="font-size: 2.5em; color: #3B82F6;"></i>
      <h3 style="margin-top: 0.5em;">快速</h3>
      <p style="font-size: 0.85em;">描述文字</p>
    </div>
    <div style="flex: 1;">
      <i class="fas fa-shield-alt" style="font-size: 2.5em; color: #10B981;"></i>
      <h3 style="margin-top: 0.5em;">安全</h3>
      <p style="font-size: 0.85em;">描述文字</p>
    </div>
    <div style="flex: 1;">
      <i class="fas fa-users" style="font-size: 2.5em; color: #8B5CF6;"></i>
      <h3 style="margin-top: 0.5em;">简单</h3>
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
      <i class="fas fa-code" style="font-size: 1.5em; color: var(--accent);"></i>
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
  <li>
    <i class="fas fa-check-circle" style="color: #10B981; margin-right: 0.5em;"></i>
    完成的特性
  </li>
  <li>
    <i class="fas fa-star" style="color: #F59E0B; margin-right: 0.5em;"></i>
    重要特性
  </li>
</ul>
```

### Badge 列表（紧凑）

```html
<div class="skill-types" style="display: flex; flex-wrap: wrap; gap: 0.35em;">
  <div class="skill-type-item" style="display: flex; align-items: center; gap: 0.5em; background: var(--bg-subtle); padding: 0.25em 0.5em; border-radius: 4px;">
    <span class="num-badge" style="background: var(--accent); color: #fff; width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.6em;">1</span>
    <span class="skill-type-name" style="font-size: 0.7em;">技能类型</span>
  </div>
  <!-- 更多项 -->
</div>
```

## 流程图布局

### 单行流程图（≤5 元素）

```html
<div class="flow" style="display: flex; align-items: center; gap: 0.5em; flex-wrap: wrap; max-width: 100%;">
  <span class="flow-step" style="background: var(--bg-subtle); padding: 0.35em 0.7em; border-radius: 3px; font-size: 0.7em; white-space: nowrap; flex-shrink: 0;">输入</span>
  <span class="flow-arrow">→</span>
  <span class="flow-step" style="background: var(--bg-subtle); padding: 0.35em 0.7em; border-radius: 3px; font-size: 0.7em; white-space: nowrap; flex-shrink: 0;">处理</span>
  <span class="flow-arrow">→</span>
  <span class="flow-step accent" style="background: var(--accent); color: #fff; padding: 0.35em 0.7em; border-radius: 3px; font-size: 0.7em; white-space: nowrap; flex-shrink: 0;">输出</span>
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
  <div class="vflow-step" style="background: var(--bg-subtle); padding: 0.4em 1.2em; border-radius: 4px; font-size: 0.7em; text-align: center; min-width: 120px;">
    加载参考文档
  </div>
  <!-- Arrow -->
  <div style="color: var(--text-muted); font-size: 1.2em; line-height: 1;">↓</div>
  <!-- Step 2 -->
  <div class="vflow-step" style="background: var(--bg-subtle); padding: 0.4em 1.2em; border-radius: 4px; font-size: 0.7em; text-align: center; min-width: 120px;">
    加载模板
  </div>
  <!-- Arrow -->
  <div style="color: var(--text-muted); font-size: 1.2em; line-height: 1;">↓</div>
  <!-- Step 3 -->
  <div class="vflow-step accent" style="background: var(--accent); color: #fff; padding: 0.4em 1.2em; border-radius: 4px; font-size: 0.7em; text-align: center; min-width: 120px;">
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
    <span class="arch-item" style="background: var(--accent); color: #fff; padding: 0.5em 1em; border-radius: 4px; font-size: 0.75em;">顶层组件</span>
  </div>
  <div class="arch-row" style="display: flex; justify-content: center; gap: 0.5em; flex-wrap: wrap;">
    <span class="arch-item" style="background: var(--bg-subtle); padding: 0.4em 0.8em; border-radius: 4px; font-size: 0.7em;">子组件 A</span>
    <span class="arch-item" style="background: var(--bg-subtle); padding: 0.4em 0.8em; border-radius: 4px; font-size: 0.7em;">子组件 B</span>
    <span class="arch-item" style="background: var(--bg-subtle); padding: 0.4em 0.8em; border-radius: 4px; font-size: 0.7em;">子组件 C</span>
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
  <div style="color: var(--text-muted); margin: 0.5em 0;">↓</div>
  <!-- Layer 2 -->
  <div style="display: flex; justify-content: center; gap: 1em; margin-bottom: 1em; flex-wrap: wrap;">
    <span class="arch-item" style="background: #10B981; color: #fff; padding: 0.4em 1em; border-radius: 4px;">API</span>
    <span class="arch-item" style="background: #10B981; color: #fff; padding: 0.4em 1em; border-radius: 4px;">Auth</span>
    <span class="arch-item" style="background: #10B981; color: #fff; padding: 0.4em 1em; border-radius: 4px;">Cache</span>
  </div>
  <!-- Arrows -->
  <div style="color: var(--text-muted); margin: 0.5em 0;">↓</div>
  <!-- Layer 3 -->
  <div style="display: flex; justify-content: center; gap: 1em; flex-wrap: wrap;">
    <span class="arch-item" style="background: #8B5CF6; color: #fff; padding: 0.4em 1em; border-radius: 4px;">数据库</span>
    <span class="arch-item" style="background: #8B5CF6; color: #fff; padding: 0.4em 1em; border-radius: 4px;">存储</span>
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
  <div class="pullquote" style="border-left: 3px solid var(--accent); padding-left: 1em; margin: 1.5em 0;">
    <p style="font-family: 'Noto Serif SC', serif; font-size: 1.1em; font-style: italic; color: var(--text);">
      这是一段引用文字，可以是名言警句或重要观点。
    </p>
    <p style="font-size: 0.8em; color: var(--text-muted); margin-top: 0.5em;">— 来源或作者</p>
  </div>
</section>
```

### 带背景色的引用

```html
<div style="background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%); padding: 1.5em; border-radius: 8px; margin: 1em 0;">
  <p style="color: #fff; font-size: 1em; margin: 0;">
    引用内容
  </p>
  <p style="color: rgba(255,255,255,0.8); font-size: 0.8em; margin-top: 0.5em;">
    — 来源
  </p>
</div>
```

## 超框案例记录

### 案例 1：9 项列表超框

| 项目 | 内容 |
|------|------|
| 文件 | `claude-code-skills-lessons.html` 第 3 页 |
| 问题 | "9 种 Skills 类型"页面，9 项列表垂直堆叠导致超框 |
| 原因 | 单列承载 9 项内容，每项 2 行文字，总高度超出 720px |
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
| 文件 | `claude-code-skills-lessons.html` 第 8 页 |
| 问题 | `[references/api.md] → [详细函数签名和用法]` 超框 |
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
| 文件 | `memory-system-architecture-v4.html` |
| 问题 | 架构图第二行 6 个 skill 元素超框 |
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

### 案例 4：流程图单行 9 元素

| 项目 | 内容 |
|------|------|
| 文件 | `agent-skill-design.html` "数据流"页面 |
| 问题 | 9 步流程图单行排列完全超出可视区域 |
| 原因 | 忽略了"单行 ≤ 5 元素"原则 |
| 解决方案 | 拆成两行，每行 4-5 元素 |

```
错误：[Step1] → [Step2] → ... → [Step9]
正确：
[Step1] → [Step2] → [Step3] → [Step4]
[Step5] → [Step6] → [Step7] → [Step8] → [Step9]
```

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

## 超框案例记录（续）

### 案例 5：4 要素列表截断

| 项目 | 内容 |
|------|------|
| 文件 | `how-to-write-good-skills-apple-dark.html` 第 4 页 |
| 问题 | "好 Description 的四要素"页面，第 4 项被截断 |
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
| 文件 | `how-to-write-good-skills-apple-dark.html` 第 12 页 |
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
| 文件 | `how-to-write-good-skills-apple-dark.html` 第 14 页 |
| 问题 | "快速检查清单"6 项只显示 3 项 |
| 原因 | 6 项列表每项有图标+文字，双列布局仍然溢出 |
| 解决方案 | 改用更紧凑的卡片样式，减小 gap 和 padding |

```html
<!-- 修复前：列表项样式 -->
<div class="apple-list-item" style="margin: 0; padding: 0.4em 0;">
  <i class="fas fa-check-circle"></i>
  <div class="item-content">
    <strong>description 包含具体触发短语</strong>
  </div>
</div>

<!-- 修复后：紧凑卡片样式 -->
<div class="apple-card" style="padding: 0.5em 0.8em; display: flex; align-items: center; gap: 0.5em;">
  <i class="fas fa-check-circle" style="flex-shrink: 0;"></i>
  <span style="font-size: 0.8em; color: white;">description 包含具体触发短语</span>
</div>
```

### 案例 8：编辑拆分时信息丢失

| 项目 | 内容 |
|------|------|
| 文件 | `如何写好-Agent-Skill.html` Slide 2 |
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

## 快速检查清单

生成 PPT 后，在浏览器中检查：
- [ ] 4 项列表是否全部显示（第 4 项是否被截断）
- [ ] 代码块是否完整显示（有无截断或换行）
- [ ] 6+ 项检查清单是否完整
- [ ] 混合布局（标题+卡片+引用）是否溢出
- [ ] **拆分内容后是否核对原始项完整性**（防止遗漏）
