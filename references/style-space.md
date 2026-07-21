# 风格空间 · Style Space

> 把"任意主题/风格"参数化,而非枚举。风格不是 10 个模板的选单,是一个 6 维连续空间 + 一张关键词速查表。任意 voice(风格肤色)× 任意 archetype(版式构图)正交组合,表达空间从"10 套死模板"炸开成"N 声音 × M 版式"。
>
> **机器真相源**:`tokens/voices.json`(voice primitive + 关键词 + 维度坐标)+ `scripts/voice-router.js`(主题→voice 自动路由)+ `scripts/build-voice-tokens.js`(编译 primitive)。本文件是它们的人读映射。

## 为什么是"空间"不是"模板"

10 个种子模板是已验证的 voice seed,但真实需求是开放的:赛博朋克、和风侘寂、Y2K、Art Deco、新中式、医疗合规、儿童绘本……枚举永远追不上长尾。

解法是**解耦 + 参数化**:
- **voice(风格)**= 配色 + 字体 + 语气 = `tokens/<name>.css` primitive
- **layout(版式)**= 构图 + 张力 + 节奏 = A1-A12 archetype(见 `layout-archetypes.md`)
- 两者正交。14 voice × 12 archetype = **168 种组合**,且 voice 可任意扩展。

加新风格不再是"写一个完整 template HTML"(易换皮、成本高),而是"在 voices.json 加一条 primitive + 关键词 + 维度",重跑 `build-voice-tokens.js`,voice-router 自动可用。

## 四级路由(任意主题 → voice)

`voice-router.js` 按优先级递降(关键词 → 主题维度 → 通用气质信号 → 兜底),任意长尾风格都能路由或优雅降级:

1. **关键词精确命中**:主题/风格词 → voice,直接返回。关键词源 = `voices.json` 的 `keywords` 字段(单一真相源)+ `STYLE_KEYWORD_EXTRA` 长尾别名。
2. **主题维度推断**(关键词未命中):主题词命中气质正则(金融/儿童/高端/宣言/临床…)→ 6 维坐标 → 欧氏距离最近的 voice。
3. **通用气质信号**(主题词未命中):文本含 暗黑/蒸汽霓虹/科幻未来/柔静/暖童 等气质词 → 维度偏移 → 最近 voice。覆盖 hint 未命中的长尾(蒸汽波→retro、哥特→luxury、科幻→launch)。
4. **兜底 editorial**:无任何风格/气质信号时的通用稳健选择。

```bash
node scripts/voice-router.js "做一个赛博朋克风的 AI 技术分享"   # → technical
node scripts/voice-router.js "Q3 总结" 极简                    # 主题 + 风格词
node scripts/voice-router.js --demo                            # 6 个示例
```

## 风格关键词 → voice 速查表

> 与 `voice-router.js` 的 `STYLE_KEYWORD_MAP` 同源。加新关键词改那里(单一真相源)。

| 风格 / 主题域 | 关键词(中 / 英) | voice |
|---|---|---|
| **极简 / 留白** | 极简 · 性冷淡 · 简约 · 留白 · 苹果风 · minimal · quiet · clean | `minimal` |
| **数据 / 金融** | 金融 · 财务 · 证券 · 量化 · 仪表盘 · 经营分析 · dashboard · KPI | `data` |
| **科技 / 赛博** | 赛博朋克 · 架构 · 系统 · 监控 · 终端 · SRE · 开发者 · cyberpunk · console | `technical` |
| **发布 / 舞台** | 发布 · 新品 · 品牌发布 · demo · 舞台 · 亮相 · keynote · launch | `launch` |
| **商务 / 决策** | 商务 · 咨询 · 决策 · 战略 · 复盘 · 述职 · 年终 · memo · board | `consulting` |
| **融资 / 路演** | 融资 · 路演 · BP · 商业计划 · 提案 · 销售 · pitch · investment | `pitch` |
| **教育 / 培训** | 教育 · 培训 · 课程 · 课件 · 工作坊 · 教学 · education · workshop | `education` |
| **编辑 / 杂志** | 杂志 · 编辑 · 策展 · 档案 · 画册 · 品牌册 · editorial · magazine | `editorial` |
| **野兽 / 宣言** | 野兽 · 宣言 · 批判 · 先锋 · 反潮流 · 硬核 · 抗议 · brutalist | `brutalist` |
| **奢华 / 高端** | 奢侈 · 奢华 · 高端 · 高定 · 精品 · 时尚 · 美妆 · 珠宝 · luxury | `luxury` |
| **手绘 / 儿童** | 手绘 · 插画 · 儿童 · 亲子 · 可爱 · 卡通 · illustrated · handmade | `illustrated` |
| **复古 / 撞色** | 复古 · 怀旧 · 80 年代 · memphis · 撞色 · 海报 · retro · vintage | `retro` |
| **东方 / 水墨** | 和风 · 日式 · 侘寂 · 水墨 · 禅意 · 新中式 · 国风 · 古风 · wabi-sabi | `chinese-ink-wash` |
| **学术 / 临床** | 学术 · 论文 · 临床 · 医疗 · 医学 · 监管 · 合规 · 法律 | `consulting` / `editorial-serif` |

> `editorial-serif`(临床/档案 seed,已落地 template-10)与 `chinese-ink-wash`(东方水墨 pilot)是 legacy voice:primitive 已存在,尚未迁入 voices.json registry,但 voice-router 与生成管线均已支持。

## 6 维风格坐标

每个 voice 在 6 个维度上有坐标(见 `voices.json` 的 `dimensions`)。维度推断时,主题气质映射到目标坐标,取欧氏距离最近的 voice。色相用环距(60° 差 = 1 单位,与其它维度同量级)。

| 维度 | 含义 | 1 | 5/7 |
|---|---|---|---|
| `value` | 明度 | 深暗 | 高亮 |
| `saturation` | 饱和 | 近灰 | 艳丽 |
| `hue` | 主色相(oklch 0-360) | — | — |
| `weight` | 字重 | 细 | 超粗 |
| `density` | 信息密度 | 疏 | 密 |
| `motion` | 动度 | 静 | 动 |

### 各 voice 坐标

| voice | value | sat | hue | weight | density | motion | 气质 |
|---|---|---|---|---|---|---|---|
| `consulting` | 4 | 2 | 22 | 4 | 4 | 1 | 文气稳重 · 决策 memo |
| `minimal` | 5 | 1 | 20 | 3 | 2 | 1 | 极端留白 · 一句主张 |
| `data` | 1 | 2 | 204 | 4 | 5 | 2 | 深色冷峻 · 仪表盘密 |
| `launch` | 1 | 3 | 306 | 5 | 3 | 4 | 舞台动感 · 高饱和 |
| `education` | 4 | 3 | 156 | 4 | 3 | 2 | 田野清新 · 自然色 |
| `pitch` | 2 | 3 | 86 | 5 | 4 | 3 | 暖底果断 · 判断路径 |
| `technical` | 1 | 2 | 204 | 4 | 5 | 2 | 控制室 · console 密 |
| `editorial` | 4 | 3 | 28 | 4 | 3 | 1 | 暖底策展 · 档案感 |
| `brutalist` | 5 | 4 | 114 | 7 | 4 | 1 | 硬边粗字 · 高饱和 |
| `luxury` | 1 | 1 | 72 | 3 | 2 | 1 | 深底金调 · 大留白 |
| `illustrated` | 4 | 3 | 42 | 4 | 3 | 3 | 暖色圆润 · 手绘亲近 |
| `retro` | 3 | 5 | 330 | 6 | 4 | 4 | 几何撞色 · 高能动 |
| `chinese-ink-wash`¹ | 5 | 1 | 25 | 3 | 2 | 1 | 宣纸浓墨 · 散点留白 |
| `editorial-serif`¹ | 4 | 2 | 28 | 4 | 3 | 1 | 临床档案 · 监管 dossier |

¹ legacy voice,坐标供距离计算用。

## voice 不在覆盖时:合成或新增

风格词没命中、维度推断也不贴(如 Y2K、Art Deco、蒸汽波、极简日式黑白)时:

### 路径 A:先用维度找最近 voice + style-gap 四件套
多数"长尾风格"用最近 voice + content rewrite + layout variant 就能成立(见 `off-template-style-gap.md`)。例:蒸汽波 → 最近 `retro`/`launch`(高饱和动度)+ 霓虹色 token 重写 + 80s 网格 variant。

### 路径 B:新增 voice primitive(风格真的没有对应肤色时)
1. 确认现有 14 voice 都不沾(去色去字体后仍不属本主题)。
2. 在 `tokens/voices.json` 的 `voices` 数组加一条:
   ```jsonc
   {
     "name": "y2k",
     "label": "Y2K Cyber Pop",
     "keywords": ["y2k", "蒸汽波", "vaporwave", "千禧", "赛博流行"],
     "dimensions": { "value": 2, "saturation": 5, "hue": 300, "weight": 6, "density": 4, "motion": 4 },
     "colors": { "--c-bg": "...", "--c-fg": "...", /* 6 primitive,OKLCH 优先 */ },
     "fonts": { "display": "sans", "googleFonts": "sans" },
     "note": "..."
   }
   ```
3. `node scripts/build-voice-tokens.js` → 生成 `tokens/y2k.css`。
4. voice-router 自动可用(读 voices.json,无需改代码)。
5. **AA 安全**:accent 印在 bg 上要 ≥4.5:1;深底用亮 accent、浅底用深 accent(配对速查见 `layout-archetypes.md`「AA 安全配对」)。字体栈必须带窄体 fallback(防 FOUT 重叠)。
6. 若内容语义也需要改写(不只是肤色),走 `off-template-style-gap.md` 四件套的 inspiration case + content rewrite + layout variant。

> 这就是"加风格"的全部成本:一条 JSON + 重跑 build。不需要写完整 template HTML,不需要改门禁,不需要改 voice-router 代码。

## voice × archetype 组合空间

voice 决定**肤色**(色/字/背景),archetype 决定**构图**(张力/节奏)。正交:

```
voice(14):   minimal  data  technical  launch  ...  chinese-ink-wash
              ×
archetype(12): A1 封面  A2 命题  A3 编年  A4 满版分割  ...  A12 收尾
              =
168 组合,且每页 archetype 可不同(见 layout-archetypes.md「组合节奏」)
```

**硬约束(失败门禁 #9 换皮)**:主骨架必须 ≥3 种 archetype 组合 + ≥1 本主题发明变体,不能种子原语原样填充。换 voice 不等于换骨架——同一 voice 下 archetype 序列要随主题内容变。

## 与其它文档的关系

- `tokens/README.md`:token 两层架构(semantic/primitive)+ primitive 文件契约。本文件是"选哪个 primitive"的指南。
- `off-template-style-gap.md`:模板外内容的四件套合同。本文件的"路径 A/B"是其入口。
- `layout-archetypes.md`:12 个 voice 无关的版式引擎 + AA 配对速查。
- `design-fundamentals.md`:设计四维根(尺度/张力/用色/隐喻→形式),voice 的维度坐标是其"用色/尺度"的参数化。
