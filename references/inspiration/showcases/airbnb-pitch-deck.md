# 镇库实物 · Airbnb 种子轮 Pitch Deck (2009)

> 来源 · Airbnb 2009 seed round pitch deck,公开流传 10+ 年(广泛分享版本,13 页)
> 类型 · Pitch / 融资叙事
> 风格标签 · Pitch/Business
> 公认度 · 全球公认 pitch deck 设计标杆,被《Forbes》《TechCrunch》、Guy Kawasaki、无数创业课程教材引用
> 官方对照 · [SlideShare 公开版本](https://www.slideshare.net/slideshow/airbnb-pitch-deck-airbnb/34200058) · 搜索 "airbnb pitch deck" 可查 TechCrunch / Forbes 等多篇逐页解读

> ⚠ 内容说明:本拆解基于公开流传版本的设计原则与叙事弧线,不逐字复述原件文案。具体视觉请对照官方链接。

## 为什么选它做镇库实物

- **公开流传** — 10+ 年广泛分享,无分发顾虑,可作仓库内可分发实物
- **完整叙事** — 13 页从 problem 到 ask,是融资叙事的教科书,适合拆解
- **务实审美** — 不是 Apple keynote 那种发布会级炫技,而是**商业 deck 的天花板**,更接近日常用例
- **可对照我们的 template** — 编辑式数据故事,映射 [template-01 editorial-serif](../../../examples/template-01-editorial-serif.html)

## 叙事弧线(为什么是标杆)

这是 pitch deck 经典叙事结构,被广泛模仿:

```
Cover(论点)
  → Problem(痛点)
    → Solution(解法,对齐 problem)
      → Market(市场够大)
        → Product(产品长这样)
          → Business Model(怎么赚钱)
            → Traction(已经在涨)   ← 投资人最看重
              → Competition(竞争定位)
                → Competitive Advantage(护城河)
                  → Team(团队能搞定)
                    → Press(社会证明)
                      → Ask(要多少钱干什么)
```

每页一个论点(action title),串起来是完整故事 —— 这正是我们 [generate-ghost-deck.js](../../../scripts/generate-ghost-deck.js) 的 Ghost Deck Test 标准。

## 关键页设计拆解(公开著名的几个决定)

### Traction 页 · 增长曲线 = proof
- **决定**:用上升曲线展示增长,不堆数字表
- **为什么好**:投资人 3 秒看到"在涨"。视觉是 proof,不是装饰
- **rubric**:Visual ⭐⭐⭐⭐⭐ / Communication ⭐⭐⭐⭐⭐
- **借鉴**:数据页用图表 hero 化(对齐 [data-viz.md](../../data-viz.md))

### Market 页 · 同心圆 TAM/SAM/SOM
- **决定**:三层市场用同心圆可视化,不是三行数字
- **为什么好**:抽象市场数字变图形,一眼看懂"够大"
- **rubric**:Visual ⭐⭐⭐⭐⭐
- **借鉴**:层级数据用嵌套几何(圆/方),不做表格

### Competition 页 · 2×2 定位矩阵
- **决定**:竞争对手放 2×2 矩阵,自己占空缺象限
- **为什么好**:不回避竞争,用定位图证明差异化
- **rubric**:Visual ⭐⭐⭐⭐ / Communication ⭐⭐⭐⭐⭐
- **借鉴**:对比页用矩阵/对峙版(对齐 [layout-archetypes.md](../../layout-archetypes.md) face-off)

### Cover 页 · 封面即论点
- **决定**:封面不是"Airbnb"公司名,是 action title "Book rooms with locals, rather than hotels"
- **为什么好**:第一页就告诉投资人主张,不是公司介绍
- **rubric**:Communication ⭐⭐⭐⭐⭐
- **借鉴**:cover 用 action title,不用公司名/泛主题(对齐 [content-budget.md](../../content-budget.md))

### Team 页 · 照片 + 履历 + 资质
- **决定**:创始人有照片 + 履历 + 对齐业务的资质(不是通用"经验丰富")
- **为什么好**:投资人投人。具体资质 > 抽象形容词
- **rubric**:Audience ⭐⭐⭐⭐⭐
- **借鉴**:团队页用人物名片(对齐 [layout-archetypes.md](../../layout-archetypes.md) team-spread)

## 设计哲学提炼

1. **每页一个 action title** — 13 页 13 个论点,串成完整故事。遮住图也能讲清
2. **数据驱动 proof** — Traction 曲线 / Market 同心圆 / Competition 矩阵。视觉是证据不是装饰
3. **封面即论点** — 第一页主张什么,不是公司叫什么
4. **务实排版** — 不炫技,不渐变,不装饰。清晰即设计

## 反 AI 味点(自检)

- ✗ 没有 indigo→紫渐变
- ✗ 没有 gradient text / glassmorphism
- ✗ 没有"科技感"装饰图标
- ✗ 没有五颜六色信息图
- ✓ 务实 + 数据 + 清晰叙事 = 商业 deck 天花板

## 对应我们的 template

**[template-01 editorial-serif](../../../examples/template-01-editorial-serif.html)** — 共享:编辑式 + 数据故事 + 严谨论证
差异:Airbnb 更务实(数据优先,零装饰),我们的 editorial-serif 更杂志感(serif + 边框)。做融资 deck 时往 Airbnb 方向收——去边框、数据 hero 化、action title 优先。

## 一句话

> 封面即论点,数据即 proof,叙事弧线是骨架。
