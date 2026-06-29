# 案例 04 · Linear.app 发布页

> 来源 · linear.app(公开网站) + Linear 历次 changelog/launch
> 类型 · 极简 / 暗色科技
> 风格标签 · Dark Tech × Minimal
> 公认度 · 设计圈公认"暗色科技产品页"标杆,Linear 设计团队(Karri Saarinen)公开影响行业标准
> 官方对照 · [Linear 官网](https://linear.app)(暗色底 #08090A / 单一紫 #5E6AD2 / 字距工艺)·[Linear Method](https://linear.app/method)(品牌叙事排版)

## 满分维度(6 维 rubric)

- TechnicalCraft ⭐⭐⭐⭐⭐ — 字距/行高/动效像素级
- Visual ⭐⭐⭐⭐⭐ — 暗色底 + 单一紫
- Cohesion ⭐⭐⭐⭐⭐ — 全站系统化
- Innovation ⭐⭐⭐⭐ — 精致即签名
- Communication ⭐⭐⭐⭐ — 产品功能清晰
- Audience ⭐⭐⭐⭐⭐ — 高端开发者审美

## 为什么好(3 个决定)

1. **暗色底 + 单一紫** — 不用 indigo→紫渐变 mesh,用深灰(#08090A)底 + 单一紫(#5E6AD2)强调。色彩系统克制到极致。
2. **字体层级系统化** — Inter 字体,字距/行高/字号阶梯精雕(大标题负字距 -0.02em,正文 0,小字 +0.02em)。工艺即设计。
3. **动效克制但精致** — 不滥用动效,只在状态切换/数据更新时显式动效。动效是反馈不是装饰。

## 可借鉴技法(生成时调用)

- 暗色页用 `#08090A` 而非纯黑(纯黑过重,深灰更高级)
- 单一强调色,不做渐变背景
- 字距精雕:大标题负字距,小字正字距(对齐 [technical-specs.md](../technical-specs.md) 字体章节)
- 动效只在"状态变化"时触发,不做常驻装饰动画
- 产品截图 hero 化,周围大量负空间

## 反 AI 味点

- ✗ 没有 gradient mesh 背景
- ✗ 没有 glassmorphism 卡
- ✗ 没有"科技感"渐变文字
- ✗ 没有发光/光晕装饰
- ✓ 精致来自克制和工艺

## 对应我们的模板

**template-02 dark-tech** — 共享:暗色 + 科技 + 单色强调
差异:我们的 dark-tech 偏通用科技,Linear 偏产品精致。做产品发布时融合 Linear 的字距工艺 + 深灰不纯黑。

## 一句话

> 深灰不纯黑,单紫不渐变,精致靠工艺。
