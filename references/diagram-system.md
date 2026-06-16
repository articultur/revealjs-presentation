# 演示图表系统

> 纯 HTML+CSS+SVG 构建的演示图表，零依赖、完全可定制、PPTX 导出后节点文字可编辑。

## 设计理论基础

### Tufte 数据墨水比

> "Above all else, show the data. Maximize the data-ink ratio. Erase non-data-ink." — Edward Tufte

- **data-ink**：图表中传达实际数据的视觉元素（节点文字、连线）
- **non-data-ink**：装饰性元素（背景渐变、多余边框、阴影）
- 目标：data-ink / total-ink → 尽可能接近 1.0

在演示图表中：
- 节点只包含**必要的标签文字**和**可选的单一图标**
- 连线只传达关系，不加渐变/发光
- 删除一切不影响理解的装饰
- 公开演示不要使用 Mermaid 默认图作为最终视觉；Mermaid 只能作为结构草稿，最终交付必须重绘为 HTML/CSS/SVG，保证节点可控、文本可读、PPTX 导出后主要文字可编辑

### Gestalt 格式塔原则

| 原则 | 图表应用 |
|------|---------|
| **接近性** | 有连接的节点间距小（gap: 16-24px），无连接的间距大（gap: 40-60px） |
| **相似性** | 同级节点统一形状/大小/颜色，不同级用颜色深浅区分 |
| **连续性** | 连线使用直线或柔和曲线（贝塞尔），不使用锯齿折线 |
| **闭合性** | 分组用浅色背景区域表示，不需要显式边框 |
| **包含性** | 父节点包含子节点的视觉暗示（缩进、浅色区域） |

### 认知负荷理论（Sweller）

- **节点上限**：≤7 个/页（工作记忆容量 7±2）
- **层级上限**：≤3 层（超过则拆分）
- **连线密度**：每个节点连接 ≤3 条线（超过则简化或分组）
- **渐进式揭示**：复杂图表用 fragment 逐步呈现

---

## 图表设计规则

### 节点

```css
/* 节点基础样式 — 所有图表类型通用 */
.diagram-node {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 0.85em;
  font-weight: 500;
  color: var(--c-fg);
  background: oklch(from var(--c-accent) l c h / 0.06);
  border: 1.6px solid oklch(from var(--c-accent) l c h / 0.2);
  border-radius: 8px;
  white-space: nowrap;
}

/* 节点——当前/高亮状态 */
.diagram-node.active {
  background: var(--c-accent);
  color: white;
  border-color: var(--c-accent);
}

/* 节点——决策/分支（菱形视觉暗示，用旋转矩形） */
.diagram-node.decision {
  border-radius: 2px;
  transform: rotate(0deg); /* 保持文字可读，不用真正旋转 */
  border-style: dashed;
}
```

**规则**：
- 描边 1.6px（投影安全）
- 填充用 `oklch(from var(--c-accent) ...)` 极浅底色
- 圆角 ≤12px（impeccable over-rounding 禁令）
- 同一图表中节点形状统一（不混用矩形/圆形/菱形）
- 节点内文字 ≤8 字/4 词
- 节点内只放：文字，或 图标+文字。禁止 图标+文字+标签 三件套

### 连线

```css
/* SVG 连线样式 */
.diagram-line {
  stroke: var(--c-fg-3);
  stroke-width: 1.2;
  fill: none;
  opacity: 0.5;
}

/* 箭头 marker */
.diagram-arrow {
  fill: var(--c-fg-3);
  opacity: 0.5;
}
```

```html
<!-- SVG marker 定义（放在图表 SVG 的 <defs> 中） -->
<svg style="position:absolute;width:0;height:0;">
  <defs>
    <marker id="arrow" viewBox="0 0 10 6" refX="10" refY="3"
            markerWidth="8" markerHeight="6" orient="auto-start-reverse">
      <path d="M0 0 L10 3 L0 6z" fill="currentColor" opacity="0.5"/>
    </marker>
  </defs>
</svg>
```

**规则**：
- 线宽 1.2-1.6px
- 颜色 `var(--c-fg-3)`，透明度 0.4-0.5
- 箭头：小三角，宽 8px 高 6px
- 连线使用直线或贝塞尔曲线，不用锯齿折线
- 每条连线只传达 1 种关系
- 连线标签 ≤4 字，放在线的中点

### 布局

- 所有布局使用 **CSS Grid 或 Flexbox**
- 禁止 `position: absolute` 放节点（仅允许用于 SVG 连线层）
- 节点间距用 Grid `gap` 控制
- SVG 连线层使用 `position: absolute` 覆盖在 Grid 布局之上

---

## 图表类型 → 决策树

```
需要展示什么？
├─ 步骤/流程/决策 → 流程图（Flowchart）
├─ 层次/分类/组织 → 树形图/脑图（Tree / Mind Map）
├─ 时序/交互/API → 时序图（Sequence）
├─ 网络拓扑/依赖 → 关系图（Relationship）
└─ 状态变化/周期 → 状态图（State）

节点数 > 7？ → 拆成两页，或分组（子图 → 概括节点）
层级 > 3？  → 折叠底层，用 fragment 渐进展开
```

---

## 模板 1：流程图（Flowchart）

适用：产品流程、工作流、决策树。节点数 ≤7。

```html
<section>
  <h2>用户注册流程</h2>
  <div class="flowchart" style="
    display: grid;
    grid-template-columns: 1fr;
    gap: 2px;
    justify-items: center;
    max-width: 400px;
    margin: 1.5em auto;
  ">
    <!-- 节点 -->
    <div class="diagram-node" style="border-radius: 20px;">开始</div>
    <div style="display:flex;align-items:center;height:24px;">
      <svg width="2" height="24"><line x1="1" y1="0" x2="1" y2="24"
        stroke="var(--c-fg-3)" stroke-width="1.2" opacity="0.5"/></svg>
    </div>
    <div class="diagram-node">填写手机号</div>
    <div style="display:flex;align-items:center;height:24px;">
      <svg width="2" height="24"><line x1="1" y1="0" x2="1" y2="24"
        stroke="var(--c-fg-3)" stroke-width="1.2" opacity="0.5"/></svg>
    </div>
    <div class="diagram-node decision">验证码正确？</div>
    <div style="display:flex;gap:2em;justify-content:center;width:100%;">
      <div style="display:flex;flex-direction:column;align-items:center;">
        <span style="font-size:0.7em;color:var(--c-fg-3);margin-bottom:4px;">是</span>
        <svg width="2" height="16"><line x1="1" y1="0" x2="1" y2="16"
          stroke="var(--c-accent)" stroke-width="1.2"/></svg>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;">
        <span style="font-size:0.7em;color:var(--c-fg-3);margin-bottom:4px;">否</span>
        <svg width="2" height="16"><line x1="1" y1="0" x2="1" y2="16"
          stroke="var(--c-fg-3)" stroke-width="1.2" opacity="0.5"/></svg>
      </div>
    </div>
    <div style="display:flex;gap:2em;justify-content:center;">
      <div class="diagram-node">创建账户</div>
      <div class="diagram-node">重新发送</div>
    </div>
  </div>
</section>
```

**水平流程变体**（≤5 步）：

```html
<section>
  <h2>交付流程</h2>
  <div style="display:flex;align-items:center;justify-content:center;gap:0;margin-top:1.5em;">
    <div class="diagram-node active">需求确认</div>
    <svg width="40" height="24" viewBox="0 0 40 24" fill="none"
         stroke="var(--c-accent)" stroke-width="1.2" stroke-linecap="round">
      <line x1="0" y1="12" x2="34" y2="12"/>
      <path d="M30 7l5 5-5 5"/>
    </svg>
    <div class="diagram-node">设计开发</div>
    <svg width="40" height="24" viewBox="0 0 40 24" fill="none"
         stroke="var(--c-fg-3)" stroke-width="1.2" opacity="0.5" stroke-linecap="round">
      <line x1="0" y1="12" x2="34" y2="12"/>
      <path d="M30 7l5 5-5 5"/>
    </svg>
    <div class="diagram-node">测试验收</div>
    <svg width="40" height="24" viewBox="0 0 40 24" fill="none"
         stroke="var(--c-fg-3)" stroke-width="1.2" opacity="0.5" stroke-linecap="round">
      <line x1="0" y1="12" x2="34" y2="12"/>
      <path d="M30 7l5 5-5 5"/>
    </svg>
    <div class="diagram-node">上线交付</div>
  </div>
</section>
```

---

## 模板 2：树形图 / 脑图（Tree / Mind Map）

适用：组织架构、知识分类、功能拆解。层级 ≤3，节点 ≤7。

```html
<section>
  <h2>系统架构</h2>
  <div class="tree" style="
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    margin-top: 1em;
  ">
    <!-- 根节点 -->
    <div class="diagram-node active" style="font-size:0.9em;">核心平台</div>
    <!-- 根 → 二级 连线 -->
    <svg width="400" height="16" viewBox="0 0 400 16" fill="none"
         stroke="var(--c-fg-3)" stroke-width="1.2" opacity="0.4">
      <line x1="200" y1="0" x2="80" y2="16"/>
      <line x1="200" y1="0" x2="200" y2="16"/>
      <line x1="200" y1="0" x2="320" y2="16"/>
    </svg>
    <!-- 二级节点 -->
    <div style="display:flex;gap:24px;justify-content:center;width:100%;">
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
        <div class="diagram-node">用户服务</div>
        <svg width="2" height="12"><line x1="1" y1="0" x2="1" y2="12"
          stroke="var(--c-fg-3)" stroke-width="1.2" opacity="0.4"/></svg>
        <div class="diagram-node" style="font-size:0.75em;padding:6px 12px;">认证</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
        <div class="diagram-node">数据服务</div>
        <svg width="2" height="12"><line x1="1" y1="0" x2="1" y2="12"
          stroke="var(--c-fg-3)" stroke-width="1.2" opacity="0.4"/></svg>
        <div class="diagram-node" style="font-size:0.75em;padding:6px 12px;">存储</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
        <div class="diagram-node">API 网关</div>
        <svg width="2" height="12"><line x1="1" y1="0" x2="1" y2="12"
          stroke="var(--c-fg-3)" stroke-width="1.2" opacity="0.4"/></svg>
        <div class="diagram-node" style="font-size:0.75em;padding:6px 12px;">路由</div>
      </div>
    </div>
  </div>
</section>
```

**脑图变体**（中心发散）：

```html
<section>
  <h2>设计思维</h2>
  <div style="
    position:relative;width:600px;height:340px;margin:1em auto;
    display:grid;grid-template-columns:1fr 1fr 1fr;grid-template-rows:1fr 1fr 1fr;
    align-items:center;justify-items:center;
  ">
    <!-- SVG 连线层 -->
    <svg style="position:absolute;inset:0;width:100%;height:100%;"
         fill="none" stroke="var(--c-fg-3)" stroke-width="1.2" opacity="0.3">
      <line x1="300" y1="170" x2="100" y2="60"/>
      <line x1="300" y1="170" x2="500" y2="60"/>
      <line x1="300" y1="170" x2="100" y2="280"/>
      <line x1="300" y1="170" x2="500" y2="280"/>
    </svg>
    <!-- 节点层：grid 放置，避免 absolute 内容重叠 -->
    <div class="diagram-node" style="grid-column:1;grid-row:1;z-index:1;">共情</div>
    <div class="diagram-node" style="grid-column:3;grid-row:1;z-index:1;">定义</div>
    <div class="diagram-node active" style="grid-column:2;grid-row:2;z-index:1;font-size:1em;padding:12px 24px;">设计思维</div>
    <div class="diagram-node" style="grid-column:1;grid-row:3;z-index:1;">构思</div>
    <div class="diagram-node" style="grid-column:3;grid-row:3;z-index:1;">原型</div>
  </div>
</section>
```

---

## 模板 3：时序图（Sequence）

适用：API 调用链、用户旅程、交互流程。参与者 ≤4。

```html
<section>
  <h2>支付时序</h2>
  <div style="
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
    max-width: 700px;
    margin: 1em auto;
    font-size: 0.8em;
  ">
    <!-- 参与者头部 -->
    <div style="text-align:center;padding-bottom:8px;border-bottom:1.6px solid var(--c-fg-3);opacity:0.5;">
      <div style="font-weight:600;">用户</div>
    </div>
    <div style="text-align:center;padding-bottom:8px;border-bottom:1.6px solid var(--c-accent);">
      <div style="font-weight:600;color:var(--c-accent);">客户端</div>
    </div>
    <div style="text-align:center;padding-bottom:8px;border-bottom:1.6px solid var(--c-fg-3);opacity:0.5;">
      <div style="font-weight:600;">服务端</div>
    </div>

    <!-- 生命线 + 消息 -->
    <div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding-top:12px;">
      <div style="color:var(--c-fg-3);font-size:0.75em;">①</div>
      <div style="color:var(--c-fg-3);font-size:0.75em;margin-top:32px;">④</div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding-top:12px;">
      <div style="display:flex;align-items:center;gap:4px;width:100%;">
        <span style="flex:1;height:1.2px;background:var(--c-accent);opacity:0.5;"></span>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="var(--c-accent)" opacity="0.5">
          <path d="M0 0l8 4-8 4z"/></svg>
      </div>
      <span style="font-size:0.7em;color:var(--c-fg-3);">发起支付</span>
      <div style="margin-top:8px;display:flex;align-items:center;gap:4px;width:100%;">
        <svg width="8" height="8" viewBox="0 0 8 8" fill="var(--c-fg-3)" opacity="0.5">
          <path d="M8 0l-8 4 8 4z"/></svg>
        <span style="flex:1;height:1.2px;background:var(--c-fg-3);opacity:0.3;"></span>
      </div>
      <span style="font-size:0.7em;color:var(--c-fg-3);">返回结果</span>
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding-top:12px;">
      <div style="color:var(--c-fg-3);font-size:0.75em;">②</div>
      <div style="color:var(--c-fg-3);font-size:0.75em;margin-top:32px;">③</div>
    </div>
  </div>
</section>
```

---

## 模板 4：关系图（Relationship / Network）

适用：网络拓扑、依赖关系、系统交互。节点 ≤6。

```html
<section>
  <h2>微服务依赖</h2>
  <div style="
    position:relative;width:500px;height:300px;margin:1em auto;
    display:grid;grid-template-columns:1fr 1fr 1fr;grid-template-rows:1fr 1fr 1fr;
    align-items:center;justify-items:center;
  ">
    <!-- SVG 连线层（先画线，节点盖在上面） -->
    <svg style="position:absolute;inset:0;width:100%;height:100%;"
         fill="none" stroke="var(--c-fg-3)" stroke-width="1.2" opacity="0.3">
      <!-- API → Auth -->
      <line x1="250" y1="50" x2="100" y2="150"/>
      <!-- API → Data -->
      <line x1="250" y1="50" x2="400" y2="150"/>
      <!-- Auth → Cache -->
      <line x1="100" y1="180" x2="180" y2="260"/>
      <!-- Data → Cache -->
      <line x1="400" y1="180" x2="220" y2="260"/>
    </svg>
    <!-- 节点层：grid 放置，避免 absolute 内容重叠 -->
    <div class="diagram-node active" style="grid-column:2;grid-row:1;z-index:1;">API Gateway</div>
    <div class="diagram-node" style="grid-column:1;grid-row:2;z-index:1;">Auth Service</div>
    <div class="diagram-node" style="grid-column:3;grid-row:2;z-index:1;">Data Service</div>
    <div class="diagram-node" style="grid-column:2;grid-row:3;z-index:1;">Redis Cache</div>
  </div>
</section>
```

---

## 模板 5：状态图（State / Lifecycle）

适用：状态机、订单生命周期、用户状态。状态 ≤5。

```html
<section>
  <h2>订单生命周期</h2>
  <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:0;margin-top:1.5em;">
    <!-- 状态 1 -->
    <div class="diagram-node" style="border-radius:20px;">待支付</div>
    <svg width="40" height="24" viewBox="0 0 40 24" fill="none"
         stroke="var(--c-fg-3)" stroke-width="1.2" opacity="0.4" stroke-linecap="round">
      <line x1="0" y1="12" x2="34" y2="12"/>
      <path d="M30 7l5 5-5 5"/>
    </svg>
    <!-- 状态 2 -->
    <div class="diagram-node active">已支付</div>
    <svg width="40" height="24" viewBox="0 0 40 24" fill="none"
         stroke="var(--c-accent)" stroke-width="1.2" stroke-linecap="round">
      <line x1="0" y1="12" x2="34" y2="12"/>
      <path d="M30 7l5 5-5 5"/>
    </svg>
    <!-- 状态 3 -->
    <div class="diagram-node">配送中</div>
    <svg width="40" height="24" viewBox="0 0 40 24" fill="none"
         stroke="var(--c-fg-3)" stroke-width="1.2" opacity="0.4" stroke-linecap="round">
      <line x1="0" y1="12" x2="34" y2="12"/>
      <path d="M30 7l5 5-5 5"/>
    </svg>
    <!-- 状态 4 -->
    <div class="diagram-node" style="border-radius:20px;
      background:oklch(from var(--c-accent) l c h / 0.12);border-color:var(--c-accent);">
      已完成</div>
  </div>
</section>
```

---

## 信息密度规则

| 图表类型 | 最大节点数 | 最大层级 | 最大连线/节点 |
|---------|-----------|---------|-------------|
| 流程图 | ≤7 | ≤4（含分支） | ≤2 |
| 树/脑图 | ≤7 | ≤3 | ≤3 |
| 时序图 | ≤4 参与者 | — | — |
| 关系图 | ≤6 | — | ≤3 |
| 状态图 | ≤5 | — | ≤2 |

**超出限制时**：
1. 分组——多个节点合并为一个"概括节点"
2. 拆页——复杂图表拆成 2-3 页，用 fragment 渐进展开
3. 简化——只保留核心节点，次要节点移到 speaker notes

---

## 通用 CSS 工具类

```css
/* 在 <style> 中添加以下类，所有图表模板共享 */

/* 节点——基础 */
.d-node {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 0.85em;
  font-weight: 500;
  color: var(--c-fg);
  background: oklch(from var(--c-accent) l c h / 0.06);
  border: 1.6px solid oklch(from var(--c-accent) l c h / 0.2);
  border-radius: 8px;
  white-space: nowrap;
  transition: all 200ms cubic-bezier(0.25, 1, 0.5, 1);
}

/* 节点——高亮/当前 */
.d-node.active {
  background: var(--c-accent);
  color: white;
  border-color: var(--c-accent);
}

/* 节点——终端（起始/结束） */
.d-node.terminal {
  border-radius: 20px;
}

/* 节点——决策 */
.d-node.decision {
  border-style: dashed;
}

/* 连接线颜色 */
.d-line { stroke: var(--c-fg-3); stroke-width: 1.2; fill: none; opacity: 0.4; }
.d-line.accent { stroke: var(--c-accent); opacity: 0.6; }

/* 水平箭头连接器 */
.d-arrow-h {
  display: inline-flex;
  align-items: center;
  width: 40px;
  height: 24px;
}
.d-arrow-h svg { width: 40px; height: 24px; }

/* 垂直连接器 */
.d-arrow-v {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
}
```

---

## PPTX 导出说明

图表中的节点使用 `<div>` 渲染，PptxGenJS 会将每个 `<div>` 导出为独立文本框，**文字内容在 PowerPoint 中可编辑**。

SVG 连线在 PPTX 中会作为图片处理（不可编辑）。如果需要导出后编辑连线，应改用 PowerPoint 原生的形状和连接器重新绘制。

---

## 与其他参考文件的配合

| 需求 | 参考文件 |
|------|---------|
| 节点内需要图标 | `references/icon-system.md` — 70 个 inline SVG 图标 |
| 水平箭头连接器 | `references/icon-system.md` — connector-arrow, connector-dash |
| 分层架构布局 | `references/layout-patterns.md` — 层次图模板 |
| 时间线布局 | `references/layout-patterns.md` — 横向时间线 |
| 图表动画节奏 | `references/motion-delight.md` — fragment stagger ≤150ms |
| 整体设计规则 | `references/design-principles.md` — OKLCH、字体、间距 |
