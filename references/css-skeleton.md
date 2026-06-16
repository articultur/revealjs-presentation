# CSS Skeleton — 每个 HTML 必含的基础块

复制以下 CSS 到生成 HTML 的 `<style>` 标签内。**不可省略任何一条**。

替换 `:root` 里的颜色/字体 token 适配选定的种子模板或新语法。

```css
/* ── 1. 颜色 & 字体 Token（替换为你选的模板配色） ── */
:root {
  --c-bg: #fafadf;                          /* 背景色：纸质 / 有色彩倾向的深色 */
  --c-fg: #1a1a16;                          /* 前景色 */
  --c-fg-2: rgba(26, 26, 22, 0.62);         /* 二级层级 */
  --c-fg-3: rgba(26, 26, 22, 0.32);         /* 三级层级 */
  --c-accent: #8a6a4a;                      /* 单一强调色，使用频率 ≤5% */
  --c-border: rgba(26, 26, 22, 0.20);       /* 边框/分隔线 */

  --f-display: "Cormorant Garamond", "Noto Serif SC", Georgia, serif;
  --f-body: "DM Sans", "Noto Sans SC", system-ui, sans-serif;
  --f-mono: "Courier Prime", "Courier New", monospace;

  /* 兼容旧参考片段和 PPTX 导出脚本；新代码优先用 --c-* / --f-* */
  --bg: var(--c-bg);
  --text: var(--c-fg);
  --text-muted: var(--c-fg-2);
  --text-subtle: var(--c-fg-3);
  --accent: var(--c-accent);
  --divider: var(--c-border);
  --font-display: var(--f-display);
  --font-body: var(--f-body);
  --font-mono: var(--f-mono);
}

/* ── 2. 基础重置 + Pin 安全带（必含 padding-bottom: 80px） ── */
.reveal { font-family: var(--f-body); font-size: 30px; color: var(--c-fg); background: var(--c-bg); }
.reveal .slides { text-align: left; }
.reveal .slides > section {
  padding: 60px 80px 80px 80px;             /* 底部 80px = pin 安全带 */
  height: 100%; box-sizing: border-box;
  overflow: hidden;
  position: relative !important;             /* 关键，不可省略 !important：reveal.css 把 section 设为 absolute 做 slide 堆叠，会覆盖普通 relative。一旦退回 absolute，absolute pin 的定位上下文错乱 → 邻近 slide 的 pin/stamp 泄露到当前视口并互相重叠（test-label-overlap.js 检测的 P0 bug）。实测 9/9 既有文件中招；加 !important 后泄露 18→0。 */
}

/* Reveal 会把 present section 强制设为 block；section 级 flex/grid 必须加 deck-flex/deck-grid 类 */
.reveal .slides > section.deck-flex.present { display: flex !important; top: 0 !important; }
.reveal .slides > section.deck-grid.present { display: grid !important; top: 0 !important; }

/* ── 3. 溢出预防（不可省略） ── */
.reveal section > * { max-width: 100%; box-sizing: border-box; }
h1, h2, h3, h4, p, li, span, div { word-break: break-word; overflow-wrap: break-word; }
img, svg, video { max-width: 100%; max-height: 100%; object-fit: contain; }

/* ── 4. 排版系统 ── */
.reveal h1, .reveal h2, .reveal h3 {
  font-family: var(--f-display);
  line-height: 1.08;
  letter-spacing: 0;                         /* 禁止负 tracking（硬规则 #4） */
}
.reveal h1 { font-size: 3.2em; font-weight: 600; }
.reveal h2 { font-size: 2em;  font-weight: 600; }
.reveal p  { font-size: 0.85em; line-height: 1.65; color: var(--c-fg-2); }
/* editorial-serif 覆盖：h1 改为 font-weight: 400; font-style: italic */
/* dark-tech / vibrant-gradient 覆盖：h1 改为 font-weight: 300 */

/* ── 5. Pin 注释（左下角索引；详见 SKILL.md "Pin 安全区"） ── */
.pin {
  position: absolute; bottom: 32px; left: 72px;
  font-family: var(--f-mono); font-size: 0.5em;
  color: var(--c-fg-3); letter-spacing: 0.06em;
  z-index: 10;
}

/* ── 6. Fragment 动画（reduce-motion 友好） ── */
.reveal .fragment { transition-duration: 350ms; }
@media (prefers-reduced-motion: reduce) {
  .reveal .fragment { opacity: 1; transform: none; transition: opacity 200ms ease-out; }
}
```

每个种子模板的完整 token 配置见 `references/design-polish.md`（"种子模板 token"章节）。
