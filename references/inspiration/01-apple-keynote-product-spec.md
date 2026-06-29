# 案例 01 · Apple Keynote 产品规格页

> 来源 · Apple 历届秋季/春季发布会 keynote(公开直播 apple.com)
> 类型 · 产品发布 / 规格
> 风格标签 · Photographic × Keynote/Launch
> 公认度 · 业界公认"发布会级"标杆,[launch-grade.md](../launch-grade.md) 的对标原型
> 官方对照 · [Apple Newsroom](https://www.apple.com/newsroom/)(高清产品静态图,看全出血 + 单数字 hero)·[Apple Events](https://www.apple.com/apple-events/)(keynote 视频回看)

## 满分维度(6 维 rubric)

- Visual ⭐⭐⭐⭐⭐ — 全出血产品照,纯黑/纯白底,极致反差
- Communication ⭐⭐⭐⭐⭐ — 单一规格焦点,3 秒识别
- Audience ⭐⭐⭐⭐⭐ — 现场观众"哇"反应可验证
- Innovation ⭐⭐⭐⭐⭐ — 产品即版面,无任何模板指纹
- Cohesion ⭐⭐⭐⭐⭐ — 全 keynote 视觉语言 100% 一致
- TechnicalCraft ⭐⭐⭐⭐ — 字体层级 + 动效克制

## 为什么好(3 个具体决定)

1. **产品即版面** — 不用"左标题 + 右产品图"模板,产品照全出血撑满,文字最小化(只剩产品名 + 一个数字)。版面只能属于这个产品,换标题套不上别处。
2. **单一规格数字焦点** — 一页只一个关键数字(如分辨率/亮度/续航),用超大字号撑成视觉主体。规格不再是规格表,是 hero。
3. **极致负空间** — 1280×720 上产品占约 60%,剩下纯黑/纯白留白。敢留白是发布会级和模板级的分水岭。

## 可借鉴技法(生成时调用)

- 产品照全出血(cover/产品页),不留"产品介绍卡"边框
- 规格数字用 `clamp(8rem, 12vw, 14rem)` 撑成 hero,小字标签 0.4–0.5em
- 背景纯色(产品色或中性色),不加 gradient mesh
- 一页一个规格,不做"规格对比表"塞 10 行
- 文字最小化:产品名 + 一个数字 + 一个动词,其他全删

## 反 AI 味点

- ✗ 没有 indigo→紫渐变背景
- ✗ 没有圆角卡 + 左色边
- ✗ 没有 side-stripe / emoji 图标
- ✗ 没有"左标题 + 右图形"换色骨架
- ✓ 产品本身就是版面,不需要装饰

## 对应我们的模板

**template-09 editorial-photo** — 共享:全出血照片 + 极简文字 + 单一焦点
差异:我们的 editorial-photo 偏编辑式(带署名/边框),Apple 更纯(零边框)。生成发布会级时往 Apple 方向收——去边框、去署名、产品撑满。

## 一句话

> 产品就是版面,数字就是 hero,留白就是设计。
