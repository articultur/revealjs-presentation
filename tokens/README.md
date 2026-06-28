# Design Tokens

> token 是 style-gap 四件套之一,不是完整解法。内容不符合已有 template 时,不要硬套最近模板,也不要只换 token。

## 这是什么

把每个 template 内联的 `:root` 视觉变量,**外置成可复用的 token 文件**。换风格 = 换一个 token 文件;新主题不在覆盖范围时,token 只解决色/字/背景 primitive,还必须配合 inspiration case、content rewrite 和 layout archetype variant。完整合同见 [`references/off-template-style-gap.md`](../references/off-template-style-gap.md)。

对应 [references/inspiration/](../references/inspiration/) 的人读标杆(15 风格拆解),`tokens/` 是这些风格的**机器可读实现源**。

## 两层架构(业界 design tokens 共识)

```
tokens/
  base.css                # ① semantic 契约层(写一次):--bg:var(--c-bg) 等映射 + 通用 spacing
  editorial-serif.css     # ② primitive 层:--c-*/--f-*(从各 template 抽出)
  dark-tech.css           #   每个风格一个 primitive 文件
  ...
```

| 层 | 定义什么 | 由谁提供 | 业界对应 |
|---|---|---|---|
| **base.css** | semantic 映射契约(`--bg`/`--text`/`--accent` 同名) | 共享,写一次 | Material 3 semantic tokens |
| **`<style>.css`** | primitive(原始色值 `--c-*` + 字体 `--f-*`) | 每风格一个文件 | Material 3 primitive tokens |
| template HTML | layout 骨架 + 组件 CSS | 9 个 template | component tokens(版式与风格正交) |

**关键**:template 是「版式骨架」,**与风格正交**。token 决定风格 primitive,但不能单独决定主题是否成立。PPT 服务于内容:当内容需要新的现实隐喻或 proof object 时,必须改写内容语义和 layout variant。

## 怎么用

### deck 引用(开发态)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/reveal.css">
<link rel="stylesheet" href="../tokens/base.css">
<link rel="stylesheet" href="../tokens/editorial-serif.css">
<!-- base.css 先(semantic 契约),<style>.css 后(primitive) -->
```

最终生成的单文件 deck 由生成流程把 token **内联**进 `<style>`(保持单文件特性)。

### 换风格

只换第二个 link:`editorial-serif.css` → `dark-tech.css`。layout 不动,视觉全换。

### 风格空白时怎么办(核心价值)

主题不在 15 风格覆盖(如水墨/和风/行业专属美学)→

1. **不硬套最近 template**(AI 味),先声明 style gap。
2. 在 [references/inspiration/](../references/inspiration/) 选择或新增一条 case(人学拆解)。
3. 新建 `tokens/<new-style>.css`,只填 primitive(`--c-*` + `--f-*`)。
4. 改写 action title、标签、proof object,让内容进入该风格的语义媒介。
5. 复用 A1-A12 layout archetype,并至少发明 1 个本主题变体;必要时才新增 template。
6. README 风格表加一行,并记录验证问题。

成本从「写一个完整 template HTML」降到「case + primitive token + 内容语义 + layout 变体」。如果 layout 变体仍无法表达主题,再考虑新增 template。

### token 的边界:三层配合(pilot 实证)

> token 换的是「肤色层」(色/字/背景)。**完整实现一个新风格,token 只是三层之一。**

> 以下结论来自一次性验证:把 [chinese-ink-wash.css](chinese-ink-wash.css) 套在 template-01 layout 上观察「换 token」的效果。**该 pilot deck 未入 `examples/` 模板库**——它只是换了 token 的 template-01,layout / 内容仍是编辑骨架,**不构成合格水墨模板**。实测:

| 层 | token 能否换 | pilot 结果 |
|---|---|---|
| **色 / 字 / 背景** | ✅ 能 | 宣纸白 / 浓墨 / 朱砂 / 宋体全切,8 个 section 背景全切(computed style 验证) |
| **内容(文案语义)** | ❌ 不能 | 英文文案配水墨色 → 偏编辑档案;cover 改中文「留白处,见山河」→ 水墨 / 新中式成立 |
| **layout(版式骨架)** | ❌ 不能 | pilot 沿用 template-01 西方左文右图网格;要更纯的水墨(留白 / 散点)需调 layout |

**结论**:加 token 文件 = 换肤色,成本极低(约 50 行),但不能单独保证高质量 PPT。要让风格成立,必须同时做内容改写和 layout 调整;要"纯粹"的传统美学,layout variant 不是可选项。这与 [references/off-template-style-gap.md](../references/off-template-style-gap.md) 的四件套一致——token 是风格 primitive,内容 / layout / reference 是另外三层。

## primitive 文件契约

每个 `<style>.css` **必须**提供这些 primitive(供 base.css semantic 映射引用):

```css
:root {
  /* 颜色(必需) */
  --c-bg:    /* 主背景 */
  --c-fg:    /* 主文字 */
  --c-fg-2:  /* 次要文字(muted) */
  --c-fg-3:  /* 弱化文字(subtle) */
  --c-accent:/* 强调色 */
  --c-border:/* 分隔线/边框 */

  /* 字体(必需) */
  --f-display: /* 标题字 */
  --f-body:    /* 正文字 */
  --f-mono:    /* 等宽字 */
}
```

可选:风格专属色(如 `--c-stamp` / `--c-bg-paper` / `--f-sans`)、覆盖 base.css 的 `--space-*` / `--rule-w`。

## 字体 fallback 安全约束

primitive 的字体栈必须遵守 [references/technical-specs.md](../references/technical-specs.md)「字体 fallback 安全清单」——generic fallback 前带窄体 fallback(防 FOUT 重叠,见 scripts/test-font-loading.js)。

## 当前进度

- [x] base.css(semantic 契约)
- [x] editorial-serif.css(template-01 primitive,pilot)
- [ ] dark-tech / minimal-spatial / vibrant-gradient / nature-fresh / brutalist / memphis / isometric / editorial-photo(推广,待 pilot 验证通过)
- [x] token 扩库机制验证:水墨 primitive [chinese-ink-wash.css](chinese-ink-wash.css)(套 template-01 做一次性验证,pilot deck 未入库;**真正水墨模板需新 layout,属 template-10 范畴,非 token 能单独完成**)
- [ ] 风格空白扩展:和风 / Y2K / Art Deco(遇新主题时补)

## 颜色空间

新建 token 文件**优先用 OKLCH**(感知均匀,见 technical-specs.md 颜色系统)。pilot 的 editorial-serif 沿用原 HEX(迁移时保持视觉一致),后续推广统一 OKLCH。

## CSS 注释约束(避坑)

`/* */` 注释内**禁止出现 `*` 紧跟 `/` 的序列**(如 `--c-*/--f-*`)——浏览器会把 `*/` 当作注释结束符,注释提前结束,后续文本变非法 CSS,`:root` 规则被整体丢弃(表现为 `cssRules.length=0`、token 静默失效,很难排查)。

写法:用空格或文字隔开 → `--c-* 与 --f-*`、`--c-* / --f-*`(`*` 后空格再 `/`)。
