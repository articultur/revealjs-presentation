# Phase 5 & Phase 6 详细说明

本文档包含 Phase 5（优化迭代）和 Phase 6（最终检查）的完整执行细节。

---

## Phase 5: 优化迭代 Tier 详情

根据演示复杂度选择优化层级：

```
< 5 slides  ────▶  Simple Tier (5 skills)
5-15 slides  ──▶  Standard Tier (7 skills)
> 15 slides  ──▶  Full Tier (12 skills)
```

### Simple Tier (< 5 slides)

**快速优化，仅核心 skills**：

| # | 命令 | 用途 |
|---|-----|------|
| 1 | `/arrange` | 布局节奏 |
| 2 | `/typeset` | 字体排版 |
| 3 | `/colorize` | 色彩系统 |
| 4 | `/clarify` | 文案清晰 |
| 5 | `/distill` | 去除冗余 |

### Standard Tier (5-15 slides)

**标准优化，核心 + 动效 + 润色**：

| # | 命令 | 用途 |
|---|-----|------|
| 1-5 | (同 Simple) | 核心优化 |
| 6 | `/animate` | 添加动效 |
| 7 | `/polish` | 最终润色 |

### Full Tier (> 15 slides 或 正式演讲)

**完整优化，全部 12 skills**：

| # | 命令 | 用途 |
|---|-----|------|
| 1 | `/arrange` | 布局节奏 |
| 2 | `/typeset` | 字体排版 |
| 3 | `/colorize` | 色彩战略 |
| 4 | `/clarify` | 改进文案 |
| 5 | `/distill` | 提炼精华 |
| 6 | `/animate` | 添加动效 |
| 7 | `/delight` | 添加惊喜 |
| 8 | `/bolder` | 增强表现力（如需要） |
| 9 | `/quieter` | 减弱嘈杂（如需要） |
| 10 | `/optimize` | 性能优化 |
| 11 | `/harden` | 增强健壮性 |
| 12 | `/polish` | 最终润色 |

**执行顺序**：#1-5 → #6-7 → #8-9（如需要）→ #10-12

---

## Phase 6: 最终检查 完整执行步骤

### Step 1: 启动 HTTP 服务器

由于浏览器安全策略，`file://` 协议无法直接访问。启动本地服务器：

```bash
cd <HTML文件所在目录> && python3 -m http.server 8765 &
```

**自动清理**：Phase 6 完成后自动 kill 进程。

### Step 2: Playwright Headless 扫描

**检测真实内容溢出**（使用 `scrollWidth > clientWidth`）：

```javascript
() => {
  const results = { contentOverflows: [], total: 0 };

  document.querySelectorAll('section').forEach((sec, si) => {
    sec.querySelectorAll('*').forEach(el => {
      const computed = window.getComputedStyle(el);
      const hasOverflow = ['auto', 'scroll'].includes(computed.overflowX) ||
                          ['auto', 'scroll'].includes(computed.overflowY);
      const isTextElement = ['H1','H2','H3','H4','H5','H6','P','LI','TD','SPAN','A','LABEL'].includes(el.tagName);
      if (hasOverflow || isTextElement) return;

      if (el.scrollWidth > el.clientWidth + 2) {
        results.contentOverflows.push({
          slide: si,
          tag: el.tagName,
          cls: el.className || '',
          type: 'W',
          overflow: el.scrollWidth - el.clientWidth
        });
        results.total++;
      }
      if (el.scrollHeight > el.clientHeight + 2) {
        results.contentOverflows.push({
          slide: si,
          tag: el.tagName,
          cls: el.className || '',
          type: 'H',
          overflow: el.scrollHeight - el.clientHeight
        });
        results.total++;
      }
    });
  });

  return results;
}
```

### Step 3: 结构化检测结果

| 情况 | 输出 | 后续动作 |
|------|------|---------|
| `total = 0` | ✅ 无内容溢出 | 进入 Step 4（交付确认）|
| `total > 0` | ⚠️ 检测到 N 个内容溢出 | 进入 Step 4（截图验证）|

### Step 4: 截图验证（有问题时）+ 交付确认

**触发条件**：检测到 `total > 0`

验证策略：
1. 截图问题页面
2. 列出溢出元素供人工确认

**交付确认**：
- `total = 0` → 直接交付 HTML 文件
- `total > 0` → 列出问题元素，人工确认是否接受当前状态或手动修复

### 清理

完成后关闭 Playwright 浏览器和 HTTP 服务器。

---

## 附录A: 溢出预防 (Overflow Prevention)

**核心原则**：
- **宁可保守设计**（内容偏少），事后微调放大
- **不要设计太满**，否则溢出后无解
- 每次修改后**立即验证**，不要批量修改后才发现问题

**预防检查清单（设计时执行）**：
- [ ] 3列卡片：每卡 padding ≤ 1em，gap ≤ 0.8em
- [ ] 6列网格：每卡 padding ≤ 0.7em，gap ≤ 0.6em
- [ ] 列表：每项 margin ≤ 0.3em，最多 4 项
- [ ] h2 margin-bottom ≤ 0.5em
- [ ] clamp() 最大值：h1 ≤ 2.5em，h2 ≤ 1.8em，正文 ≤ 0.95em
- [ ] **垂直流程图：最多 7 步（含首尾），超过则拆页或改横向**
- [ ] **混合布局（标题+流程图+卡片）：先验证总高度不超限**

详细代码示例见 `references/layout-patterns.md`。
