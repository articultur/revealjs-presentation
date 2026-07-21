# 好种子质量标准 · Seed Quality Standard

> 实证来源:10 个用户认可的种子(template-01..10)+ `references/seed-gallery/` 现存 3 case(tcm-herbal / astronomy-nebula / astronomy-monument,`case.md` 含逐个 6 维清单 + signature 来源)的 6 维分析。原 `research/seed-analysis.md` 在 workspace 临时目录已丢失,实证以现存 case 为准。这是"好种子"的**可验收标准 + 生成规则**,不是审美空谈。新增 voice / 路由优先种子都以此为尺。
>
> **核心判据**:去色去字体后,仍能 3 秒认出主题(失败门禁 #10 的精神)。新 voice 普遍只做了"配色",缺其它 5 维 → 平淡。

## 6 维标准(10/10 种子实证达标)

| 维度 | 最低线 | 反例(不合格) |
|---|---|---|
| **① 签名原语** | ≥1 个去色后仍辨识的主题独有视觉装置,出现在 ≥3 页,不可来自通用组件库 | 只有 `<div class="card">` + 换配色 |
| **② 多色系统** | 主 accent + ≥1 有角色副色(warn/alarm/ctrl/spot)+ ≥2 层背景 elevation + fg 三级对比 | 6 个无角色色,或单层 bg |
| **③ 主题原生组件** | ≥3 个从主题现实隐喻抽的组件(平均 5.5),≥1 主题独有,≥1 承载 proof object | 通用卡片/网格 |
| **④ 字体三元组** | display+body+mono 各有主题理由,**全仓零重复**(现 10 种子用 10 套 display) | Inter/Roboto 默认,或撞车 |
| **⑤ 材质纹理** | ≥1 可命名的主题材质(纸纹/网格/扫描线/压暗/撞色阴影),≥3 页共享 | 随机渐变堆 |
| **⑥ 内容词表** | ≥10 主题术语(action title/label/proof 三类),≥70% 不与现有种子重复,含证据标注 | 通用"背景/方法/结果" |

## 生成规则 Checklist(新种子必须全过)

- [ ] **去色测试**:`* { filter: grayscale(1) }` 后,3 秒能认出主题?(签名/组件/材质承载,不靠配色)
- [ ] **主题词表测试**:domain expert 看词表准不准?(从该主题专业书/报告/经典作品直摘,不造词)
- [ ] **字体反查**:grep 现有 10 种子,display/mono 不撞车(已用:Cormorant/IBM Plex Sans/Archivo/Sora/Fraunces/Archivo Black/Bricolage/Outfit/Noto Serif SC 900/Bitter;mono:Courier Prime/IBM Plex Mono/SF Mono/JetBrains Mono/Spline Sans Mono)
- [ ] **配色反查**:不撞现有种子撞车线(editorial-serif 暖米黄 / dark-tech IBM teal #50e3c2 / minimal-spatial 锈红 #b03a1a / clinical bond blue #255 / memphis 6 色)
- [ ] **验收门槛**:`:root` 内 `--c-*` ≥8 个 + `--f-*` ≥3 个;`.kicker/.pin/.source` 3/3;签名 class ≥3 个 grep 全仓唯一;`<style>` ≥200 行;证据标注 ≥3 次。机器化部分(`--c-*` / 签名 class / `<style>` 行数 / 字体三元组 4 项):`node scripts/check-seed-quality.js <seed.html>` 逐项 PASS/FAIL,FAIL exit 1

## 新主题 signature 调研原则

1. **现实视觉文化优先**:Pinterest/Are.na/书籍封面/电影美术/博物馆藏品 搜主题关键词,记录 5 个反复出现的视觉元素。**不要从 Tailwind UI/Dribbble 开始**(那是 SaaS 默认,塌进通用 deck)。
2. 三个已调研方向(调研方法实证见 `references/seed-gallery/` 三 case 的 `case.md`「外部大师参考」节;原 `research/seed-analysis.md` §4 已丢失):
   - **cyberpunk** ← William Gibson/Blade Runner 2049/Aphex Twin:CRT scan-line + glitch + neon(cyan #00ffff + magenta #ff00aa);字体 Orbitron/Space Grotesk/VT323
   - **data-viz** ← Tufte/NYT Upshot/FT:sparkline + small multiples + slope chart;FT 红 #c8403a + diverging 蓝↔红;Tiempos/IBM Plex Mono Condensed
   - **ink-wash** ← 宋元山水/八大山人/徐冰:浓淡墨 + 飞白 + 印章 + 极端留白;五色墨 + 朱砂;Source Han Serif/Ma Shan Zheng

## 反直觉发现(指导生成)

1. **签名强度 ≠ 复杂度**:brutalist 极简(2 accent + 1 字重 Black)签名最强——复杂度来自字重对比 400↔900,不是颜色多。
2. **主题原生组件 ≥3 是真门槛**:低于 3 个,无论配色怎么换都退回"通用 deck + 不同 accent"。
3. **撞车规避是显性约束**:clinical 在 token 注释里明确写"远离 01/02/03"——有意识设计,不是自然发生。新 voice 必须声明远离哪些种子。
4. **字体三元组全仓零重复**:字体是辨识度主载体之一。新增 voice 不能复用任何现有 display/mono。
5. **证据标注是领域语言**:`verified/user-provided/illustrative` 在 10/10 种子反复出现,是数据可信度分级,不是装饰。新种子必须继承。

## 与现有文档关系

- `references/style-space.md`:风格维度坐标系 + voice 速查。本文件是"voice/种子质量验收尺"。
- `references/off-template-style-gap.md`:模板外四件套。本文件的四件套验收可补强 style-gap 的"内容-版式贴合度"。
- `references/seed-gallery/`(tcm-herbal / astronomy-nebula / astronomy-monument):现存 case 的 `case.md` 含逐个 6 维清单 + 详细 signature 来源。本文件是精炼版(原 `research/seed-analysis.md` workspace 临时文件已丢失,现存 case 为实证基准)。
