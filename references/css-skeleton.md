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
.reveal section {
  padding: 60px 80px 80px 80px;             /* 底部 80px = pin 安全带 */
  height: 100%; box-sizing: border-box;
  overflow: hidden;
  position: relative;             /* ⚠️ 切勿加 !important、切勿把选择器加强到 `.reveal .slides > section`：任一都会覆盖 reveal.css 的 `.reveal .slides>section{position:absolute}`（!important 强制 / 同特异性后加载赢）→ section 退回 relative 进文档流垂直堆叠 → .slides overflow:hidden 截断 → 除首页外全空白（实测 slide 3 top=1397，已回滚）。本弱选择器 `.reveal section`（0,1,1）被 reveal.css（0,2,1）覆盖，section 保持 absolute 正常堆叠，position: relative 仅 fallback 无害。pin/label 跨 slide 泄露待不破坏堆叠的方案。 */
}

/* ⚠️ section 背景渐变的 letterbox 色差坑（端到端实测）：
   section 上加全幅 radial-gradient 会在边缘与 .reveal 的 letterbox 产生色差分界（section 边 ≠ letterbox，肉眼可见一条线）。
   要"晕染"氛围又要无缝，二选一：
   (a) `radial-gradient(closest-side at 50% 46%, <亮色>, var(--c-bg) 88%)` —— closest-side 让渐变在最近边之前 fade 到 --c-bg、88% 提前收口 → 所有边=纯 --c-bg(=letterbox) 无缝，中心微亮。
   (b) 渐变放 `.reveal`（视口层）、section 设 `background:transparent` —— 整片连续渐变，也无接缝。
   反例（制造色差）：`radial-gradient(at 28% -8%, <亮色>, transparent)` —— 亮点落在边缘、与 letterbox 不同色。*/
/* Reveal 会把 present section 强制设为 block；section 级 flex/grid 必须加 deck-flex/deck-grid 类 */
.reveal .slides > section.deck-flex.present { display: flex !important; top: 0 !important; }
.reveal .slides > section.deck-grid.present { display: grid !important; top: 0 !important; }

/* ── 3. 溢出预防（不可省略） ── */
.reveal section > * { max-width: 100%; box-sizing: border-box; }
h1, h2, h3, h4, p, li, span, div { word-break: break-word; overflow-wrap: break-word; }
img, svg, video { max-width: 100%; max-height: 100%; object-fit: contain; }
/* 图形 SVG 常在根节点设置 stroke；文字必须取消继承描边，否则投影时会发糊。 */
.reveal svg text { stroke: none; paint-order: fill; }

/* ── 4. 排版系统 ── */
.reveal h1, .reveal h2, .reveal h3 {
  font-family: var(--f-display);
  line-height: 1.08;
  letter-spacing: 0;                         /* 禁止负 tracking（硬规则 #4） */
}
.reveal h1 { font-size: 3.2em; font-weight: 600; }
.reveal h2 { font-size: 2em;  font-weight: 600; }
/* ⚠️ 大号展示文字（数字 / 比率 / 标题，font-size 明显大于正文）正下方紧邻其它文字时，
   line-height 别压到 ≤1：字形（斜体 / 分数 / 下伸部 gjpqy）会溢出 line-box 压到下方文字。
   box 类门禁（G3 label-overlap / G9 check-overflow）量的是元素 box、量不到字形墨迹 →
   会漏判这类重叠（box 有间隙但字形压下去了）。解法二选一：line-height ≥ 1.15，
   或在元素间留足 margin 吸收字形下溢。标题 h1-h6 因通常带 margin 较安全；最高风险是
   「大数字 / 比率 + 紧贴小标签」组合（如 .ratio ≈1/3 压 .verdict-lbl、.value 4.8M 压 .since）。 */
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
