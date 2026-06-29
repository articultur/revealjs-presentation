# 标杆库 Inspiration

> 按**设计风格本身**分类的全球高质量演示标杆 · 链接 + 拆解 + 可借鉴技法

## 这个库是什么

[design-fundamentals.md §7](../design-fundamentals.md) 的 6 维 rubric 是**抽象评判标准**(尺子);这个库是**具象样片**(满分长什么样)。

**组织主线是「设计风格」,不是「我们的 template」**。我们的 9 个 template 只是"当前能生成的子集",不代表优秀 PPT 风格的全集。这个库按设计行业公认的风格分类法组织,采集范围远大于 template——这样才能让生成时"见过满分",而不是"只能在 9 个 template 里打转"。

## 风格分类法(15 个核心风格)

按行业公认的设计语言 + 视觉策略分类。真实 deck 通常是 2-3 个风格交叉(可混搭):

| 风格 | 核心特征 | 我们的 case |
|---|---|---|
| **Editorial / Magazine** 编辑式 | serif + 栅格 + 严谨留白 | [02 Stripe Press](02-stripe-press-editorial.md) |
| **Minimal / Swiss** 极简瑞士 | 大留白 + 克制 + 单一强调 | [03 TED](03-ted-big-idea.md) · [04 Linear](04-linear-minimal-launch.md) |
| **Dark Tech** 暗色科技 | 深底 + 单色强调 + 动效克制 | [04 Linear](04-linear-minimal-launch.md) |
| **Brutalist** 粗野 | 系统字 + 暴露栅格 + 高对比 | [07 Brutalist](07-brutalist-editorial.md) |
| **Memphis / Postmodern** 波普后现代 | 不对称 + 波普色 + 图案 | [06 Bauhaus/Memphis](06-bauhaus-memphis-geometric.md) |
| **Bauhaus / Geometric** 几何 | 原色 + 几何 + 网格 | [06 Bauhaus/Memphis](06-bauhaus-memphis-geometric.md) |
| **Photographic** 摄影驱动 | 全出血照片 + 极简文字 | [01 Apple](01-apple-keynote-product-spec.md) |
| **Data-Driven** 数据驱动 | 图表为主 + 数据可视化 | [08 Tufte × NYT](08-data-driven-tufte-nyt.md) · [02 Stripe](02-stripe-press-editorial.md)(部分) |
| **Keynote / Launch** 发布会级 | 大屏冲击 + 产品 hero | [01 Apple](01-apple-keynote-product-spec.md) |
| **Pitch / Business** 商业融资 | 叙事弧线 + 数据 proof | 🏆 [Airbnb showcase](showcases/airbnb-pitch-deck.md) |
| **Speech / Big Idea** 演讲 | 一页一论点 + 大字 | [03 TED](03-ted-big-idea.md) |
| **Brand System** 品牌系统 | 系统化视觉语言 | [05 Pentagram](05-pentagram-brand-system.md) |
| **Illustration** 定制插画 | 品牌插画系统 + 隐喻 | [09 Slack × Mailchimp](09-illustration-slack-mailchimp.md) |
| **Isometric/Technical** 等距投影 | 30° 统一透视 + 蓝图美学 | [10 Stripe Isometric](10-isometric-technical-stripe.md) |
| **Retro/Vintage** 复古 | 时代配色 + 印刷质感 | [11 Saul Bass × Synthwave](11-retro-vintage-saul-bass.md) |

**待补风格**:15 核心风格已全覆盖。后续可补更细分流派(Swiss Modernism / Y2K / Art Deco / Memphis 80s 子风格)。

## 怎么用(P2 设计阶段)

1. **选风格**:按主题从上表选 1-2 个主风格(可混搭)
2. **拆案例**:查该风格的 case,从「可借鉴技法」挑 2-3 个落到本 deck
3. **落 token**:查 [`../tokens/`](../tokens/) 有无对应 primitive 文件。有 → 引用;**无(风格空白)→ 新建 token override,不新建 template**(见 [tokens/README.md](../tokens/README.md)「风格空白时怎么办」)
4. **校验**:visual-verdict 判 ai-template-tell 时,参考 case「反 AI 味点」自检——满分案例没有哪些指纹

## 录入 schema(统一结构)

每个案例一个 .md,文件名 `NN-来源-类型.md`:

| 段落 | 内容 |
|---|---|
| 来源 | 公开出处 + 版权状态 |
| 类型 | 主题场景标签 |
| 风格标签 | 属于哪些设计风格(可多个,主线) |
| 公认度 | 为什么算标杆 |
| 官方对照 | 真实作品的官方链接(纯索引) |
| 满分维度 | 6 维 rubric 哪几维满 |
| 为什么好 | 拆 3 个具体设计决定(不是"好看")|
| 可借鉴技法 | 生成时可调用的具体技法(动词开头)|
| 反 AI 味点 | 这个案例没有哪些 AI 指纹 |
| 我们的实现 | 我们哪个 template 实现了这个风格的**子集**(明确"子集",不代表全部) |
| 一句话 | 浓缩提炼 |

## 我们的 template 覆盖(附录 · 风格的子集实现)

我们的 9 个 template 是上述风格的部分实现,**不代表风格全部**。生成时优先选风格,再看我们哪个 template 最接近,不够再超越 template:

| 我们的 template | 实现的风格 |
|---|---|
| template-01 editorial-serif | Editorial |
| template-02 dark-tech | Dark Tech |
| template-03 minimal-spatial | Minimal |
| template-04 vibrant-gradient | (待补标杆) |
| template-05 nature-fresh | (待补标杆) |
| template-06 brutalist | Brutalist |
| template-07 memphis | Memphis |
| template-08 isometric | Isometric/Technical |
| template-09 editorial-photo | Photographic |

## 镇库实物(showcases/)

`showcases/` 子目录存**公开流传 / 开源授权**的真实 deck 逐页拆解,是仓库内**可分发的实物**(不只是指向外部的链接)。

- 🏆 [Airbnb 种子轮 Pitch Deck](showcases/airbnb-pitch-deck.md) — Pitch/Business 风格,13 页融资叙事弧线

## 版权约束

- 本库**只存文字拆解**(基于公开设计观察,符合评论性 fair use),**不存截图**
- 如需本地对照截图,自录存 `.cache/inspiration/`(已在 `.gitignore`),不提交
- 外部参考只列官方链接,不代理原图内容
- 不可公开分发获奖作品原图

## 待补(后续可加)

- **风格细分流派**(15 核心风格已全覆盖):Swiss Modernism / Y2K / Art Deco / Memphis 80s 子风格,可作后续细分
- **template-04/05 标杆**:vibrant-gradient(Vercel 渐变)、nature-fresh(自然有机风)
- **更多 showcases**:Sequoia pitch template / Guy Kawasaki 10-20-30
- **Awwwards SOTD 动效案例** → 配合 [motion-delight.md](../motion-delight.md)
