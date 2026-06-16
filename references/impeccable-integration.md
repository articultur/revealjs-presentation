# Impeccable 集成指南

> 本文档详细说明如何将 impeccable 设计框架的每个命令和参考应用到 reveal.js 演示文稿场景。

## 核心定位

演示文稿属于 **brand 寄存器**（design IS the product）——观众对设计的印象就是交付物本身。因此：

- 遵循 impeccable 的品牌/视觉参考指导，而非只按产品功能清单排版
- 色彩策略可以是 Restrained / Committed / Full palette / Drenched，不限于 ≤10% accent
- 字体选择必须经过 reflex-reject 检查
- 需要通过 AI slop test —— 观众不应一眼看出"AI 做的"

---

## Phase × 命令映射

### Phase 0: 设计上下文 → 使用 `palette.mjs`

如果项目没有已确定的品牌色，运行 impeccable 的色板种子脚本：

```bash
node .agents/skills/impeccable/scripts/palette.mjs
```

返回一个品牌种子色 + 构图指导。围绕它构建调色板（bg, surface, text, accent, muted），全部使用 OKLCH。

**色彩策略选择**：

| 策略 | 适用演示 | 说明 |
|------|---------|------|
| Restrained | 技术演讲、学术报告 | accent ≤10%，中性色为主 |
| Committed | 产品发布、商务汇报 | 一个饱和色占 30-60% |
| Full palette | 营销推广、创意展示 | 3-4 个命名角色，各有用途 |
| Drenched | 品牌展示、Keynote | 表面本身就是颜色 |

### Phase 3: 设计评审 → 使用 `/critique`

impeccable 的 `/critique` 比我们现有的"反模式检查"强得多：

**Nielsen 10 项启发式评估**（适配演示场景）：

| # | 启发式 | 演示文稿适配 |
|---|--------|-------------|
| 1 | 系统状态可见性 | 幻灯片编号、进度条、当前章节提示 |
| 2 | 匹配真实世界 | 用观众熟悉的语言，不用行话 |
| 3 | 用户控制 | 方向键导航、快捷键、自由跳转 |
| 4 | 一致性 | 全篇统一配色、字体、间距 |
| 5 | 错误预防 | 溢出预防、内容密度限制 |
| 6 | 识别而非回忆 | 每页信息自包含，不依赖前页记忆 |
| 7 | 灵活性 | 快速导航、演讲者模式、书签 |
| 8 | 美学与极简 | 每页 1 个视觉重心，无装饰噪音 |
| 9 | 错误恢复 | 演示中断时的状态恢复 |
| 10 | 帮助文档 | 演讲者备注、导航提示 |

**Persona 测试**（适配演示场景）：

| Persona | 演示适配 | 关注点 |
|---------|---------|--------|
| **Jordan**（新手观众） | 第一次看这个话题的人 | 内容是否自解释？术语是否清晰？ |
| **Casey**（分心观众） | 手机上/远程看演示的人 | 远距离可读？关键信息够突出？ |
| **Alex**（专业观众） | 领域专家 | 信息密度够不够？有没有新东西？ |

**自动化检测**：

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json <HTML文件>
```

检测能力覆盖：
- AI slop patterns（side-stripe borders、gradient text、glassmorphism）
- 对比度问题
- 字体违规
- 布局反模式

### Phase 5: 优化迭代 → 命令 × 任务映射

impeccable 的 22 个命令在演示场景中的具体应用：

#### 核心优化（Simple Tier，< 5 slides）

| 命令 | 演示场景应用 | 已集成到 | 落地参考 |
|------|------------|---------|---------|
| `/layout`（同 `/arrange`） | 布局节奏：间距变化、视觉层次、内容密度 | ✅ `design-principles.md` | impeccable layout reference |
| `/typeset` | 字体层级：字重差 2 档、letter-spacing、clamp() | ✅ `design-principles.md` | impeccable typeset reference |
| `/colorize` | 色彩系统：OKLCH 调色板、60-30-10、tinted neutrals | ✅ `design-principles.md` | impeccable colorize reference |
| `/clarify` | 文案清晰：消除行话、文案自检、speaker notes 人情味 | ✅ **新增** `design-principles.md` 文案清晰化节 | impeccable clarify reference |
| `/distill` | 去除冗余：合并相似项、缩短描述、删减装饰 | ✅ `SKILL.md` 缩减策略 | impeccable distill reference |

#### 标准优化（Standard Tier，5-15 slides）

核心 + 以下：

| 命令 | 演示场景应用 | 已集成到 | 落地参考 |
|------|------------|---------|---------|
| `/animate` | Fragment timing、stagger ≤150ms、easing curves、reduced-motion | ✅ `motion-delight.md` | impeccable animate reference |
| `/polish` | 最终润色：像素对齐、状态完整性、代码质量 | ✅ `impeccable-integration.md` Polish 清单 | impeccable polish reference |

#### 完整优化（Full Tier，> 15 slides）

标准 + 以下：

| 命令 | 演示场景应用 | 已集成到 | 落地参考 |
|------|------------|---------|---------|
| `/delight` | 惊喜时刻：隐藏彩蛋、庆祝动画、personality copy | ✅ `motion-delight.md` | impeccable delight reference |
| `/bolder` | 增强表现力：放大关键视觉、加强字体对比、增加色彩饱和度 | ✅ **新增** `design-principles.md` 力度调节节 | impeccable bolder reference |
| `/quieter` | 减弱嘈杂：减少动画数量、降低装饰强度、增加留白 | ✅ **新增** `design-principles.md` 力度调节节 | impeccable quieter reference |
| `/harden` | 健壮性：长文本处理、溢出安全、边缘情况 | ✅ `layout-patterns.md` + `SKILL.md` 内容适配节 | impeccable harden reference |
| `/optimize` | 性能优化：图片懒加载、CSS 精简、CDN 缓存 | ✅ `technical-specs.md` | impeccable optimize reference |

### 新增集成

| 命令 | 演示场景应用 | 集成位置 |
|------|------------|---------|
| **`/shape`** | 专业模式发现访谈：2-3 轮深度需求理解（观众状态、行动目标、视觉锚点） | ✅ **新增** `pipeline-phases.md` Phase 0-1 节 |
| **`/adapt`** | 三端适配：投影仪（高对比大字号）+ 笔记本（响应式）+ 手机（自包含） | ✅ **新增** `technical-specs.md` 三端适配指南节 |
| **`/clarify`** | 文案自检：模糊标语检测、行话替换、被动语态改写、硬限制 | ✅ **新增** `design-principles.md` 文案清晰化节 |
| **`/bolder`** | 加力操作：字号翻倍、accent 扩大到 30%、打破对称、80/20 原则 | ✅ **新增** `design-principles.md` 力度调节节 |
| **`/quieter`** | 减力操作：动画减到 ≤30%、颜色减到 ≤3 种、间距增加 50% | ✅ **新增** `design-principles.md` 力度调节节 |

### 尚未集成的命令

| 命令 | 说明 | 原因 |
|------|------|------|
| `/craft` | 端到端构建 feature | 演示文稿不做 feature 开发 |
| `/init` | 项目初始化 | 已通过 `install-all.sh` 覆盖 |
| `/document` | 从代码生成设计文档 | 对模板维护有用，优先级低 |
| `/extract` | 提取可复用 token/组件 | 对模板统一有用，优先级低 |
| `/onboard` | 首次体验设计 | 可映射为"开场页设计"，优先级低 |
| `/live` | 浏览器可视化变体迭代 | 需要 Playwright 实时集成，优先级低 |
| `/overdrive` | 突破常规极限 | 高级动效，可后续补充到 motion-delight.md |

### Phase 6: 最终检查 → 使用 `/audit`

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json <HTML文件>
```

然后做 `/audit` 检查：
- 无障碍性：对比度、语义 HTML、ARIA 标签
- 响应性：多断点测试
- 性能：加载速度、动画帧率

---

## Impeccable 绝对禁令 × 演示适配

impeccable 的绝对禁令比我们现有的 P0 规则更全面。以下是需要额外检查的项：

| impeccable 禁令 | 演示场景检测方式 |
|----------------|----------------|
| **Side-stripe borders**（>1px 左/右边框做强调） | 检查 CSS `border-left/right` 值 |
| **Gradient text**（`background-clip: text`） | 检查 CSS 组合 |
| **Glassmorphism as default** | 检查 `backdrop-filter: blur` 使用频率 |
| **Hero-metric template**（大数字+小标签+渐变） | 检查数值展示模式 |
| **Identical card grids** | 检查重复的卡片结构 |
| **Tiny uppercase tracked eyebrow** | 检查 ALL CAPS + tracking 的重复使用 |
| **Numbered section markers**（01/02/03） | 检查章节编号模式 |
| **Text overflow** | 检查 clamp() 最大值在窄视口的表现 |
| **Codex-specific: ghost cards**（1px border + 16px+ shadow） | 检查 CSS 组合 |
| **Codex-specific: over-rounding**（32px+ radius） | 检查 `border-radius` 值 |

---

## 字体选择流程（来自 brand.md）

每张演示文稿都必须执行：

1. **写出 3 个品牌性格词**：不是"现代""优雅"，而是"温暖、机械、有主见"或"冷静、精准、审慎"
2. **列出你会本能选择的 3 种字体** → 检查是否在 reflex-reject 列表中
3. **在实际字体目录中浏览**（Google Fonts 等），找有物理对象感的字体
4. **交叉检查**："优雅"不一定是衬线，"技术"不一定是无衬线

### Reflex-reject 列表（必须避免）

> 使用 5 个预定义模板时，模板配置的字体组合已通过审查，直接使用。
> 以下列表仅对**自定义（非模板）演示文稿**生效：

Fraunces · Newsreader · Crimson Pro · Playfair Display · Syne · Space Mono/Grotesk · Inter · DM Serif · Plus Jakarta Sans · Instrument Sans/Serif

> 以下字体虽在 AI 高频列表中，但已被预定义模板采用，模板场景中可直接使用：Lora · Cormorant · DM Sans · Outfit · IBM Plex

### 推荐替代（演示场景）

| 类型 | 推荐 |
|------|------|
| 中文正文 | Noto Sans SC（安全选择）、Source Han Sans（Adobe 生态）|
| 中文标题 | Noto Serif SC、LXGW WenKai（文艺感）|
| 英文无衬线 | Figtree、Onest、Urbanist、Manrope |
| 英文衬线 | Source Serif 4、Lora |
| 等宽 | JetBrains Mono、Fira Code |

---

## 色彩系统（来自 colorize.md）

### 使用 OKLCH

```css
:root {
  /* 品牌色（由 palette.mjs 生成） */
  --accent: oklch(65% 0.2 30);

  /* 中性色（向品牌色 tint） */
  --bg: oklch(15% 0.01 30);
  --bg-subtle: oklch(20% 0.02 30);
  --text: oklch(95% 0.01 30);
  --text-muted: oklch(70% 0.02 30);

  /* 语义色 */
  --success: oklch(65% 0.2 150);
  --error: oklch(60% 0.2 25);
  --warning: oklch(80% 0.15 85);
}
```

### 禁止的默认 tint

不要使用 `oklch(97% 0.01 60)` 及其邻居作为背景色——这是 AI 的 cream/sand 默认值。

### 60-30-10 法则

- **60%**：中性背景、留白
- **30%**：次要颜色（文本、边框）
- **10%**：强调色（CTA、高亮）

在 Committed/Full palette/Drenched 策略下，accent 占比可以更高。

---

## 动效规范（来自 animate.md）

完整动效时长法则（100/300/500）、easing 曲线、6 种高级运动模式见 `references/motion-delight.md`（动效主文件，避免重复）。此处仅列 impeccable animate 的核心约束：

- **时长**：hover 100-150ms / fragment 200-300ms / 入场 500-800ms
- **Easing**：用 ease-out-quart/quint/expo；**禁 bounce/elastic**
- **运动材料**：blur / clip-path / shadow / mask（不只是 transform/opacity）

详细时机、stagger ≤150ms、reduced-motion 适配：`motion-delight.md`。

---

## Polish 清单（来自 polish.md）

最终润色时逐项检查：

### 视觉对齐
- [ ] 所有元素对齐到网格
- [ ] 间距使用设计系统 token
- [ ] 多断点测试
- [ ] 视觉对齐（非仅数学对齐）

### 排版
- [ ] 层级一致性
- [ ] 行宽 50-75 字符
- [ ] 孤行/寡行处理
- [ ] 字间距合规

### 色彩与对比
- [ ] WCAG AA 对比度
- [ ] token 一致使用
- [ ] 灰色文字不在彩色背景上

### 交互状态
- [ ] 每个可交互元素有 default / hover / focus 状态
- [ ] 过渡时长 150-300ms
- [ ] easing 使用 ease-out-quart/quint/expo
- [ ] `prefers-reduced-motion` 支持

### 响应性
- [ ] 无水平滚动
- [ ] 触摸目标 ≥44×44px
- [ ] 最小字号 14px（移动端）

### 边缘情况
- [ ] 长文本不溢出
- [ ] 空内容状态优雅
- [ ] 加载状态清晰

---

## 检测器使用

### 基础检测

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json <HTML文件>
```

### 退出码

- `0` = 干净
- `2` = 有发现

### 检测范围

impeccable 的 `detect.mjs` 检测：
- Side-stripe borders
- Gradient text
- Glassmorphism overuse
- Ghost card pattern
- Over-rounding
- AI slop patterns
- 对比度问题
- 字体违规

配合 `lint-design.js` 使用：
- `lint-design.js` → 演示文稿专用 P0/P1/P2 规则
- `detect.mjs` → impeccable 通用 AI slop 检测

两者互补，不重复。

---

## 快速集成参考

生成演示文稿时，按以下流程利用 impeccable：

```
P0 设计上下文
  ├─ palette.mjs → 生成品牌色
  └─ brand.md → 选择字体、色彩策略

P3 设计评审
  ├─ /critique → Nielsen 10 项评分 + Persona 测试
  └─ detect.mjs → 自动化反模式检测

P5 优化迭代
  ├─ Simple: /layout /typeset /colorize /clarify /distill
  ├─ Standard: + /animate /polish
  └─ Full: + /delight /bolder /quieter /harden /optimize

P6 最终检查
  ├─ /audit → 无障碍 + 性能 + 响应性
  ├─ detect.mjs → 最终反模式扫描
  └─ lint-design.js → P0 规则检查
```
