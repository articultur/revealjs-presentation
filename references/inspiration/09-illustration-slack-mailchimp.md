# 案例 09 · Slack × Mailchimp(定制插画系统)

> 来源 · Slack 品牌插画系统 + Mailchimp 手绘品牌 + Headspace 冥想插画 + Notion 表情角色
> 类型 · 定制插画 / 品牌插画
> 风格标签 · Illustration
> 公认度 · 定制插画是品牌差异化核心。Slack / Mailchimp / Headspace 的插画系统是设计行业标杆。**反 AI 味的强力风格——AI 做不出全 deck 一致的定制插画系统**
> 官方对照 · [Slack Brand Guidelines](https://slack.com/brand-guidelines)(看插画系统:配色 + 几何人物)·[Mailchimp Brand](https://mailchimp.com/brand/)(手绘猴子 + 不羁风)

## 满分维度(6 维 rubric)

- Innovation ⭐⭐⭐⭐⭐ — 定制插画是品牌签名,AI 难以复制一致性
- Visual ⭐⭐⭐⭐⭐ — 温暖 + 人性化 + 辨识度
- Cohesion ⭐⭐⭐⭐⭐ — 一套插画系统贯穿全品牌
- Audience ⭐⭐⭐⭐⭐ — 友好可亲,降低距离感
- Communication ⭐⭐⭐⭐ — 插画即隐喻
- TechnicalCraft ⭐⭐⭐⭐ — 一致性本身是工艺

## 为什么好(3 个决定)

1. **定制插画 = 品牌签名** — 不用通用图标 / stock illustration,定制一套属于品牌的插画系统。Slack 的多彩几何人物、Mailchimp 的猴子、Headspace 的冥想角色——看一眼就知道是谁,换标题套不上别处。
2. **插画即隐喻** — 插画不是装饰,是把抽象概念(协作 / 邮件 / 冥想)变成可视隐喻。Headspace 用一个微笑的圆球代表"放松的大脑",比文字解释更直击。
3. **一致性系统** — 一套插画规则(线条粗细 / 配色 / 比例 / 表情 / 透视)贯穿所有场景。**一致性是 AI 最难做到的**——AI 每张插画都不一样,定制系统要求 100% 一致。

## 可借鉴技法(生成时调用)

- **定制插画系统**:生成前先定义规则(线条粗细 / 配色 / 比例 / 表情 / 透视),全 deck 严格遵循
- **插画作为 proof object**,不是装饰——每个插画对应一个抽象概念的隐喻(对齐 [icon-system.md](../icon-system.md))
- **不用通用 outline 图标 / emoji / stock illustration**——这些是 AI 味头号指纹
- **角色化**:给主题一个"代言人"插画(Mailchimp 猴子模式),贯穿全 deck
- **配色用品牌色 + 插画色**,不渐变;插画内部色块 ≤ 5
- **透视统一**:全 deck 用同一透视(平面 / 等距 / 2.5D),不混

## 反 AI 味点

- ✗ 没有 emoji 图标(🏆🚀💡 这类)
- ✗ 没有 stock illustration / 通用图标库
- ✗ 没有"通用 outline 图标集"(Lucide / Heroicons 裸用)
- ✓ 定制插画系统 = 反 AI 的终极护城河(AI 做不到全 deck 一致)

## 我们的实现(这个风格的子集)

**当前无插画 template**。这是「风格 > template」的典型——Illustration 风格存在且强大(且是反 AI 的最强武器),但我们 template 没实现。做插画 deck 时,**必须先定义"插画系统规则"**,不能用通用图标替代——否则立即 AI 味。这一风格的实现需要插画资产生成能力 + 一致性约束,是后续可探索方向。

## 一句话

> 定制插画是品牌签名,插画即隐喻,一致性是反 AI 的护城河。
