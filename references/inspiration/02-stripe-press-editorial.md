# 案例 02 · Stripe Press / 发布页编辑式

> 来源 · stripe.com/press · stripe.com 历次发布页(公开网站)
> 类型 · 编辑式 / 数据故事
> 风格标签 · Editorial × Data-Driven
> 公认度 · 设计圈公认"科技编辑风"天花板,Awwwards 多次获奖
> 官方对照 · [Stripe Press](https://stripe.com/press)(编辑式排版 / serif 字体工艺)·[Stripe 官网](https://stripe.com)(数据可视化 + 渐变当工具的用法)

## 满分维度(6 维 rubric)

- TechnicalCraft ⭐⭐⭐⭐⭐ — 字距/行高/对齐像素级精雕
- Cohesion ⭐⭐⭐⭐⭐ — 全站一套排版系统
- Visual ⭐⭐⭐⭐⭐ — 数据可视化精雕
- Communication ⭐⭐⭐⭐ — 编辑式严谨论证
- Innovation ⭐⭐⭐⭐ — 渐变当工具不当装饰
- Audience ⭐⭐⭐⭐ — 开发者/设计师范本

## 为什么好(3 个决定)

1. **serif 字体 + 严谨栅格** — 不用 sans-serif 圆润科技感,用 serif 做编辑权威感。8 列栅格,所有元素对齐到栅格线。
2. **图表是主角不是装饰** — 数据可视化精雕(渐变流图/拓扑/时序),图表本身就是版面 hero,不是"右下角小图"或 legend 堆砌。
3. **渐变当工具** — Stripe 的标志渐变只在**数据流**上(表示流动/转换/时序),不在背景当装饰 mesh。这是渐变的正确用法。

## 可借鉴技法(生成时调用)

- 数据页用 serif 字体 + 8 列栅格(对齐 [technical-specs.md](../technical-specs.md) 栅格规范)
- 图表 hero 化,占版面 60%+,标签嵌入图内不用 legend
- 渐变只用在"表达流动/转换"的数据上,不用作背景 mesh
- 数字用 `font-variant-numeric: tabular-nums`,所有数据列对齐
- 引用/出处用编辑式 footnote 风格,不用"来源:xxx"通用标签

## 反 AI 味点

- ✗ 没有"五颜六色 gradient mesh 背景"
- ✗ 没有 emoji 数据图标
- ✗ 没有圆角卡 dashboard
- ✓ 渐变是数据编码,不是装饰

## 对应我们的模板

**template-01 editorial-serif** — 共享:serif + 编辑栅格 + 严谨论证
差异:我们的 editorial-serif 偏杂志感,Stripe 偏科技严谨。做数据故事时融合 Stripe 的图表 hero 化 + tabular-nums 工艺。

## 一句话

> 排版是权威,图表是 hero,渐变是数据。
