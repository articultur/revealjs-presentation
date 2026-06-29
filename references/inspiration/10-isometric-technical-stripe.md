# 案例 10 · Stripe Isometric(等距投影 + 蓝图美学)

> 来源 · Stripe 的 isometric 插画系统(支付/金融流程图,设计圈公认标杆)+ 工程蓝图传统(建筑/机械标准视图)
> 类型 · 等距投影 / 技术图
> 风格标签 · Isometric/Technical
> 公认度 · Stripe 的 isometric 系统是科技产品页标杆,被广泛模仿。等距投影本身是工程/建筑标准三视图外的第四范式
> 官方对照 · [Stripe 官网各产品页](https://stripe.com/)(看支付流程的等距插画:30° 透视 + 组件空间化)·[Behance Isometric 合集](https://www.behance.net/search?search=isometric)(等距插画系统全集)

## 满分维度(6 维 rubric)

- TechnicalCraft ⭐⭐⭐⭐⭐ — 等距投影精度,30° 一致性
- Visual ⭐⭐⭐⭐⭐ — 立体感 + 空间组织力
- Cohesion ⭐⭐⭐⭐⭐ — 一套透视规则贯穿全 deck
- Communication ⭐⭐⭐⭐ — 把复杂系统组件关系可视
- Innovation ⭐⭐⭐⭐ — 等距即签名
- Audience ⭐⭐⭐⭐ — 科技/工程受众

## 为什么好(3 个具体决定)

1. **30° 等距投影统一** — 所有元素用同一等距透视(30° 标准),不混平面/等距/2.5D。三维一致性是工艺,也是这个风格的命脉——一混透视就崩。
2. **复杂系统空间化** — 流程/架构/系统用等距空间组织,组件立体摆放 + 连线,比平面图更能表达"组件关系"。Stripe 用它画支付流程,一眼看懂谁连谁。
3. **蓝图美学** — 标注线 / 测量数字 / 浅网格背景,工程图纸的严谨美学。像建筑 plate(对齐 [layout-archetypes.md](../layout-archetypes.md) architectural-plate)。

## 可借鉴技法(生成时调用)

- **全 deck 同一等距透视**(30° 标准),绝不混平面图或假 3D
- **流程/架构页用等距空间组织**(组件 + 连线),表达组件关系(对齐 [diagram-system.md](../diagram-system.md))
- **蓝图美学**:标注引线 + 测量数字 + 浅网格背景,工程严谨感
- **等距图标统一一套**(线条粗细 + 配色 + 透视全一致)
- **标签嵌在图周围**(不用 side dashboard),对齐 architectural-plate 模式
- **配色克制**:蓝图蓝 / 单色系,不五颜六色;阴影统一光源

## 反 AI 味点

- ✗ 没有平面图 + 3D 混用(透视混乱是 AI 重灾区)
- ✗ 没有"科技感"假 3D 渐变球
- ✗ 没有阴影光源不一致
- ✓ 30° 透视一致性 = 工艺签名,AI 难做到全 deck 统一

## 我们的实现(这个风格的子集)

**[template-08 isometric](../examples/template-08-isometric.html)** 实现了这个风格的子集。差异:我们的 isometric 偏静态几何图,Stripe 偏产品流程叙事(组件 + 连线 + 时序)。做系统/架构 deck 时,在 template-08 上加 Stripe 的"流程空间化"——组件立体摆放 + 动态连线。

## 一句话

> 30° 统一透视,复杂系统空间化,蓝图美学是签名。
