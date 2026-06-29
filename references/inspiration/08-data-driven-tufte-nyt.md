# 案例 08 · Edward Tufte × NYT Upshot(数据可视化教父)

> 来源 · Edward Tufte《The Visual Display of Quantitative Information》(数据可视化经典,1983)+ The New York Times "The Upshot" 栏目(普利策级数据新闻)
> 类型 · 数据可视化 / 信息图
> 风格标签 · Data-Driven
> 公认度 · Tufte 是数据可视化领域的开山宗师(耶鲁教授,4 本经典著作,提出 data-ink ratio);NYT Upshot 是当代数据新闻标杆。David McCandless《Information is Beautiful》同列
> 官方对照 · [NYT Upshot](https://www.nytimes.com/section/upshot)(看数据新闻:注释嵌入 + 小多图)·[Edward Tufte 著作](https://www.edwardtufte.com/tufte/)(data-ink ratio / sparkline / small multiples 原则源头)

## 满分维度(6 维 rubric)

- Visual ⭐⭐⭐⭐⭐ — 数据可视化精雕到极致
- Communication ⭐⭐⭐⭐⭐ — 数据自己会说话
- TechnicalCraft ⭐⭐⭐⭐⭐ — 工艺天花板(Tufte 的 sparkline / small multiples)
- Cohesion ⭐⭐⭐⭐ — 一套数据语言贯穿
- Audience ⭐⭐⭐⭐ — NYT Upshot 做到大众可读
- Innovation ⭐⭐⭐⭐ — 数据形式本身创新

## 为什么好(3 个具体决定)

1. **数据墨水比(Data-Ink Ratio)** — Tufte 核心原则:每一滴墨水都要传递信息。删掉一切装饰性图表元素——边框、3D、阴影、多余网格、渐变填充。极致克制让数据浮出。
2. **小多图(Small Multiples)** — 同一个图表重复多次,每次变一个变量,并排对比。比单个复杂图更有效,读者一眼看到模式。
3. **注释嵌入数据** — NYT Upshot 的标志:关键数据点直接在图上文字标注,不用 legend。读者不用来回看"红是 A 蓝是 B"。

## 可借鉴技法(生成时调用)

- **删一切非数据元素**:无图表边框 / 3D / 阴影 / 多余网格线(对齐 [data-viz.md](../data-viz.md))
- **sparkline**:行内小折线替代大表格,密集时序数据一行一个 mini 图
- **关键点直接标注**:不用 legend,数据点上直接写文字
- **small multiples**:一个变量一个图,多个图并排(对齐 [diagram-system.md](../diagram-system.md))
- **颜色编码数据维度**,不用颜色装饰;用色 ≤ 3
- **数据按"故事顺序"排序**(不是字母表/默认),让趋势可见

## 反 AI 味点

- ✗ 没有 3D 图表 / 渐变柱状图 / 阴影
- ✗ 没有"信息图"装饰(大数字 + 小图标堆砌)
- ✗ 没有 5 色以上不编码数据的配色
- ✓ 极致克制 = 数据可视化天花板,模板做不出这种纪律

## 我们的实现(这个风格的子集)

**当前无专门 data-driven template**。这是「风格 > template」的典型——Data-Driven 风格存在且强大,但我们 9 个 template 还没专门实现。做数据 PPT 时,从 [data-viz.md](../data-viz.md) 取 Tufte 原则,落到 template-01 editorial-serif 或 template-03 minimal-spatial 上。**该考虑加 template-10 data-driven**。

## 一句话

> 每一滴墨水都是数据,小多图胜过大图表,注释嵌在数据上。
