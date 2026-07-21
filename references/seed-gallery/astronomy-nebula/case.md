# Astronomy · Nebula Full-Bleed 种子 case · Direction B · 2026-07-18

> **主题类型**:曾有 `astronomy/` atlas 种子(星图册风格;**后已移除,撞车教训留档于本文**),本 case 是**显式重做的 Direction B(星云满版冲击)**,验证 B 解法 + impeccable 增强对**同一主题不同审美方向**的覆盖。同主题不同 case 不是套用,是 B 解法对"星云摄影冲击"这一新审美意图的重新推导。
>
> **与原 astronomy/ 的关系**(原种子已移除,以下为历史对照):两个 case 共享主题(天文)但**审美意图不同**。原 astronomy/ 是观测档案(atlas + Bayer + chart)。本 case 是 NASA 海报摄影(Pentagram NASA + Michael Benson + 全幅)。字体/配色/原语**完全不同**,不是同一种子的换色版。

## 诊断(主题 + 方向)

- **主题**:astronomy(曾有种子 `astronomy/`,已移除)
- **方向 B 审美意图**:星云满版冲击,以 NASA/ESA JWST 假彩色摄影为画布,像 NASA JPL 旅行海报 / Pentagram NASA Exoplanet Travel Bureau / Michael Benson《Cosmos》摄影集
- **为什么另起 case**:
  - 用户明确要求"重做天文 deck,方向 B:星云满版冲击",**显式否定**了原 astronomy/ 的 atlas 路线("摆脱数据 deck 感,走宇宙壮丽图像")。
  - 这是 B 解法的核心能力验证:**同一主题可以走多个完全不同的审美方向**,每个方向都是完整设计,不是同一模板的换色。

## 审美意图先行(减法三件套)

### 一个具体情绪(不是泛"星云漂亮")

> **第一次看到 JWST 创生之柱 NIRCam 满版照的窒息感**——不是"宇宙浩瀚",是当你的视网膜意识到这些金色尘埃在 6500 年前发出这束光,而你正在用一颗 21 世纪的行星上的仪器接收它,那种**时间倒错 + 尺度眩晕 + 自我渺小**同时到达的瞬间。

不是"星云好看"。是**被一张照片淹没**的具体感官。

### 一个签名时刻

**满版照片 + NASA 任务戳 + 罗马数字 plate 编号**——打开 deck 第一页,Pillars of Creation 占满全屏,左下角 Big Shoulders Display 900 weight 三行 caps "ATLAS / of the / INVISIBLE"(中行 outline),右下角巨号罗马字 "I"。这是 Pentagram NASA Exoplanet Travel Bureau 的版式语言,不是 SaaS dashboard。

### 一个极端对比

**照片满版 vs NASA 资产卡片的小数据格**——主视觉是 1.6 megapixel 的 JWST 照片(eye 100%),科学元数据是左下角 440px 宽的暗色卡片,二者尺度比 ≥ 8:1。这是 NASA 新闻照片的传统:照片是主角,科学 chrome 是配角。

## 外部大师参考(禁读 examples/template-*.html)

调研 6 个 NASA/JWST 现实视觉文化来源,**不抄元素,内化为什么美**:

1. **NASA/ESA JWST 新闻发布影像本身**(2022-07-11 first images 至今)——SMACS 0723 深场、创生之柱、船底座悬崖、Southern Ring、Tarantula、Stephan's Quintet。
   - **为什么美**:这些照片的"美"不是审美家的判断,是**红外摄影翻译了看不见的真实**。JWST 把 1.87-4.05 μm 近红外映射到 RGB,让我们看见人眼永远看不见的尘埃内部新生恒星。Slide II-VII 的全部 8 张照片(除封面 + 末页)直接来自 JWST 新闻稿。
2. **NASA JPL "The Studio" Exoplanet Travel Bureau poster 系列**(Pentagram-adjacent,2015-今)——"Visit the Pillars of Creation" / "The Grand Tour" / "Planet 9"。
   - **为什么美**:JPL Studio 把 NASA 任务做成 **mid-century WPA 旅行海报**——巨型 condensed caps 标题 + 1-2 spot colors + 任务戳。这是 Slide I 封面 "ATLAS / OF THE / INVISIBLE" 的版式来源。**不是**模板排版,是海报排版。
3. **Michael Benson《Cosmos》(2011) / 《Otherworldly》(2003) / 《Planetfall》(2009)**——Benson 把 NASA/ESA 任务原始数据冲洗成画廊级摄影。
   - **为什么美**:Benson 拒绝"装饰",坚持**照片本身就是页面**。他的书页除了一行小字 credit 外全是照片。Slide II-VII 每页的 "scrim + 全幅照片 + 左下小 asset-card" 沿用这个传统。
4. **NASA Image and Video Library 资产卡**(images.nasa.gov / science.nasa.gov/asset/)——每张 NASA 新闻照附带的元数据卡:compass、scale bar、instrument、wavelength、credit。
   - **为什么美**:这些 asset-card **是 NASA 现实工作流的一部分**,不是 SaaS 装饰。Slide II-VII 的 `.asset-card` 签名原语直接移植这个传统:4 格数据 + 罗盘 SVG + 比例尺 + credit + verified 标签。
5. **NASA "meatball" logo(1976, Richard Danne / Bruce Blackburn)**——红蓝球形 NASA 标志,1976 FAA 时期联邦设计系统。
   - **为什么美**:NASA 红 #fc3d21 + NASA 蓝 #0b3d91 是**真实的联邦品牌色**,不是设计师审美选择。Slide 顶部 mission-strip 的圆形 meatball SVG(蓝球 + 红斜环)直接引用这个 50 年的传统。
6. **WPA Federal Art Project 海报(1935-1943)** + **1960s NASA 任务海报(Mercury, Apollo)**——美国联邦科学宣传海报的 mid-century 黄金期。
   - **为什么美**:WPA 字体传统(condensed sans 大字 + 单色底 + 红黑双主色)是 NASA 海报的祖宗。Slide 全部 typography(Big Shoulders Display = Chicago Tribune 招牌 / WPA 海报血统)源自这条 lineage。

**严禁参考的来源**:Tailwind UI / Dribbble "space dashboard"(AI 模板味来源)、Generic "tech-dark with starfield"(template-02 dark-tech 的换皮陷阱)、`examples/template-*.html`(B 解法禁读)。

## 审美推导"为什么美"(不只列元素)

### 为什么"满版照片 + 极少 chrome"传达宇宙尺度

不是"满屏好看"。是**照片的尺度是 1.6 megapixel 真实数据**,人眼无法在第一秒处理完——你被**淹没**。任何额外的 chrome(卡片网格、icon row、kicker)都在抢照片的注意力。Slide II-VII 把 chrome 压到左下 440px 暗色 asset-card + 右上 ≤280px stat,故意让 ≤80% 视觉面积留给照片。这是 Michael Benson 摄影集的纪律,不是 SaaS 网格的逻辑。

### 为什么"NASA 假彩色"揭示看不见的真实

不是"颜色丰富"。是 JWST 把人眼看不到的红外光映射到可见 RGB——颜色是**翻译**。Slide II SMACS 深场里的橙色弧形不是装饰,是被前景星系团引力透镜扭曲的、宇宙 6 亿岁时发出的光。Slide V Tarantula 的红丝缕是 Hα 656 nm 发射,直指恒星形成区。颜色**编码了天体物理事实**。

### 为什么"NASA 任务海报字体"传"乐观未来"

不是"复古好看"。是 1960s 美国 mid-century 科学宣传美学——Big Shoulders Display 的 condensed 900 weight 是芝加哥 Tribune 招牌 / WPA 海报血统,传**"未来属于科学"**的官方乐观。这与 SaaS Inter / Tailwind 默认 sans 完全不同的情绪语言。Slide I 封面的 "ATLAS / OF THE / INVISIBLE" 用 5.8em Big Shoulders 900 weight,中行 outline,末行 NASA red——这是 NASA 任务海报的版式语法,不是 landing page 的标题排版。

### 为什么"罗马数字 plate 编号"传"观测档案"

不是"装饰编号"。Plate I-VIII 的命名是**天文 atlas 历史惯例**(Bayer Uranometria 1603 就用 plate 编号),让 deck 读起来像一本天文图册,而不是 SaaS slide deck。这与 template-06 brutalist 的 "01/02/03" 数字脚手架**完全不同**:plate 编号是 atlas 出版传统,不是 section 索引。

## 6 维生成决策(每个写"为什么")

### ① 签名原语(≥1,去色仍辨识)

**NASA Asset Card**——左下角 440px 暗色面板,含 4 格数据(2×2 grid)+ 罗盘 SVG + 比例尺 + 5 组织 credit + verified 标签。出现 6/8 页(II-VII)。
- 为什么承载主题:这是 NASA 新闻照片发布工作流的真实元数据卡,不是通用卡片。去色后仍是"罗盘 + 数据格 + 比例尺 + credit"的科学 chrome,立刻识别为 NASA/JWST 影像。

**满版 JWST 照片**——每页 1 张全幅 NASA/ESA/CSA/STScI 公版照,object-position + object-fit:cover 满屏。出现 8/8 页。
- 为什么承载主题:这本身就是主题。照片是 JWST 拍的,不是装饰。

**NASA Meatball 任务戳**——顶部 mission-strip 左侧的圆形 SVG(蓝球 + 红斜环 + 内嵌小白点),复刻 NASA 1976 meatball logo。出现 8/8 页。
- 为什么承载主题:这是 NASA 官方品牌符号,不是装饰 icon。

**罗马数字 Plate 编号**——右下角罗马字大号(I-VIII),plate vol label。出现 8/8 页。
- 为什么承载主题:atlas 出版传统的页码,非 SaaS 索引。

共 4 个签名原语,全部从 NASA/JWST 现实视觉文化抽取,没有一个是通用卡片/icon。

### ② 多色系统(主 + 副 + elevation)

| Token | Hex | 角色 |
|---|---|---|
| `--c-bg` | `#0a0a0a` | carbon poster ink(WPA 联邦海报黑)|
| `--c-fg` | `#f4f1ea` | bone(NASA 文档纸张 / 老化 Bundy 黄)|
| `--c-fg-2` | `#d6d0c3` | mission-print 灰 |
| `--c-fg-3` | `#8b8479` | 星图褪色墨 |
| `--c-nasa-red` | `#fc3d21` | NASA meatball 红(主 accent)|
| `--c-nasa-blue` | `#0b3d91` | NASA meatball 蓝(只给 meatball SVG / 任务 patch)|
| `--c-jwst-gold` | `#ffb71b` | JWST 镜金 / JPL 招牌黄(verified 标签 / data 值强调)|
| `--c-bg-paper` | `rgba(10,10,10,0.86)` | asset-card 不透明底 |
| `--c-border-strong` | `rgba(244,241,234,0.34)` | asset-card 边线 |

**反查不撞**:
- **不撞原 astronomy/seed.html**(原 atlas seed 已移除,撞车教训保留;cosmic violet-ink #0a0815 + Bayer gold #d4a84b + Hα red #d24a3a + Cinzel atlas grammar)——本 deck 是 carbon WPA ink + NASA meatball red/blue + JWST gold + NASA poster grammar。**不同 palette 家族,不同 typography,不同 primitive**。
- 不撞 template-02 dark-tech(IBM teal #50e3c2)——本 deck NASA red 不是青色
- 不撞 template-09 editorial-photo(Noto Serif SC 900)——本 deck Big Shoulders Display 不是 serif
- 不撞 launch(purple 285 hue)——无紫
- 不撞 clinical(bond blue #255)——本 deck NASA blue #0b3d91 是 meatball 蓝,非 bond 蓝

### ③ 主题原生组件(≥3,从主题隐喻抽)

| 组件 | 隐喻来源 |
|---|---|
| **JWST 满版照片**(全幅 object-fit:cover) | NASA/ESA JWST 新闻稿摄影 |
| **NASA asset-card**(4 格数据 + 罗盘 + 比例尺 + credit) | NASA Image Library 元数据 |
| **NASA meatball SVG**(蓝球 + 红斜环 + 内白点) | NASA 1976 meatball logo |
| **Roman plate 编号**(I-VIII 大号右下) | 天文 atlas 出版传统 |
| **Scrim directional gradient**(左/右/上/下/全 5 种) | NASA 新闻照片 text-overlay 传统 |
| **任务 patch SVG**(hex / diamond / ellipse / dot 4 种) | NASA 任务徽章设计 |
| **Annotated callout**(dot + leader + dark panel) | JWST 新闻照片的科学标注 |
| **Big Shoulders Display outline/red 混排标题** | WPA / Pentagram NASA 海报字体传统 |

共 8 个原生组件(远超 ≥3 门槛),全部从 NASA/JWST 现实视觉文化抽取,没有一个是通用卡片/icon。

### ④ 字体三元组(全仓零重复)

| 角色 | 字体 | 主题理由 |
|---|---|---|
| Display | **Big Shoulders Display** | Chicago Tribune 招牌 / WPA Federal Art Project 海报血统,完美 NASA mid-century 任务海报气质。全仓 grep 零撞(template 用 Cormorant/IBM Plex Sans/Archivo/Sora/Fraunces/Archivo Black/Bricolage/Outfit/Noto Serif SC 900/Bitter;voices.json fontPool 用 Afacad/Literata;原 astronomy/ 用 Cinzel)。 |
| Body | **Public Sans** | US Web Design System 字体,**字面意义的 NASA 文档体**(NASA 网站就是 USWDS)。全仓零撞。 |
| Mono | **Martian Mono** | 宽字 retro-futuristic,NASA mission-control 数据屏气质。全仓零撞(template 用 Courier Prime/IBM Plex Mono/SF Mono/JetBrains Mono/Spline Sans Mono;voices.json 用 Chivo Mono;原 astronomy/ 用 Space Mono)。 |

**反查**:三元组在所有 10 template + 14 voices.json + 原 astronomy/seed.html(已移除)零撞车。三重确认。

impeccable reflex-reject list(Fraunces/Cormorant/IBM Plex/Space Mono/Inter/DM Sans/Outfit/Playfair/Syne 等)全部规避。**editorial-typographic**(saturated 第二阶 AI reflex lane)也规避——本 deck 走 NASA-poster-typographic lane,不是 editorial-magazine lane。

### ⑤ 材质纹理(≥1 可命名)

**NASA press-release scrim + carbon poster ink**——每页背景层是 NASA/ESA JWST 照片 + directional gradient scrim(左/右/上/下/全 5 种,按照片构图选)。命名"NASA scrim wash"。
- 出现页:8/8(全 8 页,远超 ≥3 门槛)
- 去色后仍识别:照片 grayscale 后仍是星云形态,scrim 仍是 directional 渐变,asset-card 仍是科学 chrome——立刻识别"NASA 影像 deck"。

### ⑥ 内容词表(≥10 主题术语)

直摘自 NASA/JWST 新闻稿 / STScI / SIMBAD:
- JWST / NIRCam / MIRI / L2 orbit / gravitational lens / lookback time / redshift z / arcmin / light-year / μm wavelength / protostar / planetary nebula / stellar nursery / Local Group / LMC / SMC / 30 Doradus / NGC 3372 / NGC 3132 / NGC 7320 / SMACS J0723.3-7327 / Stephan's Quintet / Hα 656 nm / O-type / B-type / white dwarf / tidal tail / shock front / meatball logo / WPA Federal Art Project / verified

含**证据标注**:`verified`(NASA/JWST 公版数据真实来源)在 8/8 页 asset-card credit 行 + mission-strip 标注,符合"证据标注是领域语言"的反直觉发现。

## 验证证据

### 去色测试

`* { filter: grayscale(1) }` 后:grayscale 满版星云照片 + 灰阶 scrim + 灰阶 NASA asset-card(罗盘 + 数据格 + 比例尺)+ 灰阶罗马 plate 编号 + 灰阶 NASA meatball 任务戳 → **3 秒认出"这是 NASA 影像 deck"**,不靠颜色。

### 词表测试(领域准确度)

- SMACS J0723.3-7327 坐标正确(real RA 07h 23m, Dec −73°27′)
- JWST 发射日期 2021-12-25 正确(Christmas Day Ariane 5 launch)
- JWST L2 orbit 距地球 1.5 M km 正确
- JWST 第一科学影像 2022-07-11/12 正确
- Pillars of Creation 距离 6,500 ly 正确(Eagle Nebula M16 距离)
- Pillars NIRCam WEIC 2218 发布 2022-10-19 正确
- Tarantula Nebula 30 Doradus 距离 ~170,000 ly(LMC 距离)正确
- Tarantula 含 ~2,400 young stars(STScI 估计)正确
- Southern Ring NGC 3132 距离 ~2,000 ly 正确
- Stephan's Quintet HCG 92 主成员 ~290 M ly(z ≈ 0.022)正确
- SMACS 0723 最远弧形 lookback 13.1 B yr 正确
- R136a1 ~260 M☉ 正确(most massive known star)
- MIRI cooling 7 K / JWST cooling −233 °C 正确

### 撞车规避

- 颜色:见 ② 反查
- 字体:见 ④ 反查
- 布局:Cover 用 NASA-poster 三行 caps 大标题 + outline 中行(SaaS 不会这么排版);interior 用 photo + asset-card(不是 A1 masthead + 内容卡片)
- 与原 astronomy/seed.html(已移除)共享主题但**完全不同审美**:atlas(观测档案)vs poster(满版摄影),两个陌生人,不是兄弟姐妹

## 8 页结构

| Plate | 布局原型 | 主题原生形式 | JWST 影像来源 |
|---|---|---|---|
| I Cover | 满版 photo + cover-masthead + 三行 NASA-poster caps + Roman plate "I" | Pentagram NASA Travel Bureau × WPA Federal Art Project | Pillars NIRCam+MIRI composite (pillarsofcreation_composite.jpg) |
| II Deep Field | 满版 photo + 大 stat "13.1 B yr" + poster + asset-card | NASA Image Library 元数据卡 | SMACS 0723.3-7327 (weic2206a) |
| III Cosmic Cliffs | 满版 photo + poster + asset-card | NASA 新闻稿 text-overlay | Carina NGC 3372 (weic2210a) |
| IV Southern Ring | 满版 photo + poster + asset-card | NASA 新闻稿 text-overlay | NGC 3132 (weic2208a) |
| V Tarantula | 满版 photo + 大 stat "2,400+" + poster + asset-card | NASA Image Library 元数据卡 | 30 Doradus LMC (weic2212a) |
| VI Stephan's Quintet | 满版 photo + poster + asset-card | NASA 新闻稿 text-overlay | HCG 92 (weic2207a) |
| VII Pillars Annotated | 满版 photo + 3 个 annotation callout + asset-card | JWST 科学标注 + NASA Image Library | M16 NIRCam solo (weic2218b) |
| VIII Colophon | 满版 photo + 2-col grid(大标题 + 4 任务 patch)| NASA 任务徽章 + atlas colophon | M16 NIRCam solo bookend (weic2218b) |

## impeccable 决策记录(用户明确要求)

按 impeccable skill `reference/brand.md`(brand register:design IS the product)+ `reference/overdrive.md` + `reference/polish.md` 跑:

### Setup
- 跑 `node .claude/skills/impeccable/scripts/context.mjs`(register=brand 确认)
- 读 `reference/brand.md`、`reference/overdrive.md`、SKILL.md general rules

### Absolute bans 三检
- ✅ **无 side-stripe** borders(asset-card 用 full border 1px,非 border-left 装饰)
- ✅ **无 gradient text**(标题用 solid color 或 outline stroke,非 background-clip:text)
- ✅ **无 glassmorphism**(asset-card `backdrop-filter: none`,opacity 0.86 实色底)
- ✅ **无 hero-metric template**(无 stat + supporting stats + gradient 网格,只有单一 stat + label)
- ✅ **无 eyebrow everywhere**(每页一个 mission-strip + 一个 eyebrow,不是每 section 一个 kicker)
- ✅ **无 identical card grids**(无 icon+title+text 重复卡片,asset-card 是单一面板)
- ✅ **无 overused-font**(Fraunces/IBM Plex/Space Mono/Inter/DM/Outfit/Playfair 等 reflex-reject list 全规避)

### AI slop category-reflex 双阶检验(impeccable 第二阶抓第一阶漏的)
- **第一阶 reflex**:从"astronomy"猜"深色 + 星点 SVG" → **重做**。本 deck 不用 SVG starfield(那是原 astronomy/ 的路),用**真实 JWST 照片满版**(NASA 摄影路线)。
- **第二阶 reflex**:从"astronomy 不 dark-tech"猜"editorial-typographic atlas(Cinzel + Bayer 金 + HR 图)" → **重做**(原 astronomy/ 就掉进了这个陷阱)。本 deck 走 **NASA-poster mid-century**(Big Shoulders Display + NASA red/blue + JWST gold)lane,完全跳出 editorial-magazine aesthetic。

### impeccable hook findings(代码 review pass)
1. **em-dash overuse**(real problem):**已修**。原稿 11 处 em-dash in body copy → 全部改为 colon / period / parens / comma。仅保留 CSS comments 内的 em-dash(非 body copy)。
2. **dark-glow**(real problem):**已修**。原 `.yah .dot { box-shadow: 0 0 12px 4px rgba(255, 183, 27, 0.5) }` 过亮 → 改为 `0 0 4px 1px rgba(255, 183, 27, 0.35)`(pinpoint star,非 neon glow)。
3. **numbered section markers**(false positive):hook 把 "Plate I-VIII" 罗马数字 + 7/12 日期当成 "01/02/03" 模式 → **不动**。这是 atlas 出版传统的"单一已命名编号序列",impeccable docs 明文允许:"One deliberate numbered sequence on one page is voice; numbered eyebrows on every section across the site is AI grammar." Plate 编号是 voice,不是 scaffolding。在 case.md 中分类为 intentional false positive。

### Bolder / Overdrive 放大决策
- **Cover title** `clamp(3.5em, 5em, 5.8em)` Big Shoulders 900 weight(从初稿 9em 收敛——9em 三行超出 720px 视口。G2 / G9 检测到溢出,迭代收敛到 5.8em)。
- **Outline middle line** on cover("of the" 用 -webkit-text-stroke)——Pentagram NASA Exoplanet Travel Bureau 的三行 poster 标题传统。
- **NASA red 单色**作为主 accent(不堆多色),JWST gold 作为 verified / data 强调,USA blue 只给 meatball SVG。
- **每页 asset-card** 是科学 chrome(罗盘 + 数据 + 比例尺 + credit),不是装饰卡片。这是"满版照片 vs 小数据面板"尺度对比的来源。

### Polish 决策(打磨细节)
- 每张照片单独选 directional scrim(left/right/top/bottom/full)按构图而非统一 dark wash——这是 Michael Benson 摄影集的纪律。
- compass SVG 内的"N"原本 y="3"(超出 viewBox 0-56)被 G10 spatial-integrity 检出 → 改 y="11" 修齐。
- evidence-ledger G5 要求每个精确数字附近有 verified 标签 → 在所有 6 张 asset-card credit 行 + slide I mission-strip + slide VIII colophon credit 加 `<span style="color: var(--c-jwst-gold);">verified</span>` 标签。
- font-weight 收敛 6 档(300/400/500/600/700/900)→ 4 档(300/500/700/900)满足 TOO_MANY_WEIGHTS P1。
- vw/vh 单位全改 em(项目 lint 禁 vw/vh,因 Reveal.js 用 transform:scale())。
- 8 张 JWST 图像 URL 全部 curl HEAD 200 + image/jpeg 验证(esawebb.org 公版)。

### 不像任何 template 的理由(B 解法核心)

| 现有 template | 不像的理由 |
|---|---|
| 原 astronomy/(已移除) | 本 deck 是 NASA 满版摄影 + NASA-poster 字体(不是 atlas + Cinzel + Bayer 金 + HR 散点) |
| 01 editorial-serif | 本 deck 满版照片 + NASA red(不是 cream 暖米黄 + 杂志栅格 + Cormorant) |
| 02 dark-tech | 本 deck 无 SVG starfield + NASA red/blue(不是 IBM teal + 终端);asset-card 是科学元数据(不是 ops dashboard) |
| 03 minimal-spatial | 本 deck 戏剧型满版照片(不是单色留白 + 锈红 + Archivo) |
| 04 vibrant-gradient | 本 deck 无渐变色块(只有真实照片 + directional scrim) |
| 05 nature-fresh | 本 deck 反向明度(深底 vs 浅底)+ NASA mid-century 字体(非 Fraunces 自然字体) |
| 06 brutalist | 本 deck Big Shoulders Display + NASA 红(非 Archivo Black + 暴露栅格);condensed 字但 NASA 海报血统非 brutalist |
| 07 memphis | 本 deck 严肃 NASA 文档语气(非波普色块 + Bricolage Grotesque) |
| 08 isometric | 本 deck 无等距投影 |
| 09 editorial-photo | 本 deck SVG chrome 是 NASA asset-card(非全出血照片 + Noto Serif SC 900 杂志栅格);满版照片是 NASA 摄影传统(非杂志摄影) |
| 10 clinical-trial | 本 deck 是 NASA 摄影海报(非临床 evidence binder + Bitter + bond blue) |

**去色去字体后**:仍是"满版 NASA/JWST 影像 + 左下角科学 asset-card(罗盘+数据+比例尺+credit) + 顶部 meatball 任务戳 + 右下角罗马 plate 编号 + 三行 condensed caps 海报标题"——这些是**只有 NASA/JWST 摄影海报才该有**的原生物件,不可能与任何 template 撞车。

## 验证脚本结果

| Gate | 结果 |
|---|---|
| G1 lint-design (P0) | ✓ 0 violations |
| G2 validate | ✓ 0 overflow |
| G3 label-overlap | ✓ no overlaps |
| G4 lint-main-claim | ✓ no violations |
| G5 evidence-ledger | ✓ all labeled(verified tag 在 8/8 页) |
| G6 color-role | ✓ main claims dominate |
| G7 contrast-aa | ✓ meets WCAG AA |
| G8 canvas-fill | ✓ sections fill canvas |
| G9 check-overflow | ✓ 0 issues |
| G10 spatial-integrity | ✓ surfaces aligned |
| G11 text-break | ✓ no splits |
| G12 design-strength | ✓ scaleContrast & metaphor ≥ floor |

**grade-gate**:ALL PASS ✓(12/12)
**design-strength-check**:四维 90/100(scaleContrast / colorCommit / tension / metaphor),六维 rubric 88/100(visualExcellence 89 / cohesion 83 / communication 100 / audience 80 / innovation 100 / techCraft 75)。**innovation 100/100** = 0 AI tells,验证 B 解法 + impeccable 双检的成功。
**visual-qa screenshots**:8/8 slides captured,visual analysis confirms rendering correct on cover / slide 2 / 4 / 5 / 7 / 8.

## B 解法 7 步(0-6)推导记录(用户明确要求)

0. **审美轴探索 + 用户锚点**:用户锚点明确——"摆脱数据 deck 感,走宇宙壮丽图像"(NASA 海报轴),显式否定原 astronomy/ 的 atlas 观测档案轴;同主题审美轴已探明(atlas vs poster),选 NASA 满版摄影轴。
1. **审美意图先行**:"JWST 创生之柱 NIRCam 满版照的窒息感"——不是泛"宇宙",是具体被一张照片淹没的瞬间。
2. **外部大师参考**(禁读 template/种子):NASA/ESA JWST 影像 + NASA JPL Pentagram-adjacent Travel Bureau 海报 + Michael Benson 摄影 + NASA Image Library asset-card + NASA meatball logo + WPA Federal Art Project 海报。
3. **审美推导"为什么美"**:为什么满版照片传宇宙尺度 / 为什么假彩色揭示看不见的真实 / 为什么 NASA 字体传乐观未来 / 为什么罗马 plate 编号传观测档案——4 条"为什么"内化,非抄元素。
4. **减法**(不填 6 维):只留情绪(窒息)+ 签名(满版照片 + NASA asset-card + NASA meatball + 罗马 plate)+ 对比(照片满版 vs 小数据面板 8:1 尺度)。
5. **impeccable 打磨**(bolder/overdrive/polish + Playwright 截图迭代):5 轮迭代(初稿 → em-dash 修复 → cover title 9em→5.8em 收敛 → evidence-ledger verified 标签 → spatial-integrity compass N 修齐)。每次改完跑 grade-gate + visual-qa 截图,rendered truth 决定质量。
6. **沉淀 case**(本文):本 case.md 是 B 解法产物,**学决策不套 HTML**。

## 与原 astronomy/ 的关系(同主题不同审美;原种子已移除,留档对照)

| 维度 | 原 astronomy/(atlas,已移除) | astronomy-nebula/(本 case / poster) |
|---|---|---|
| 审美意图 | "Saturn 在 3am 反射镜里第一次炸开"——观测者的屏息 | "JWST 创生之柱满版照的窒息"——被照片淹没 |
| 主形态 | atlas 星图册(plate-by-plate) | NASA 满版摄影海报 |
| 字体 | Cinzel + Spectral + Space Mono(古典 atlas) | Big Shoulders Display + Public Sans + Martian Mono(NASA mid-century poster) |
| 配色 | cosmic violet-ink + Bayer gold + Hα red | carbon WPA ink + NASA meatball red/blue + JWST gold |
| 签名原语 | star-plate SVG + constellation 金线 + RA/Dec 坐标 + HR 图 + 光谱暗线 + log 尺度梯 | NASA asset-card + NASA meatball + Roman plate + 满版 JWST 照片 + annotated callout |
| 主视觉 | SVG starfield + 数据图 | 真实 NASA 摄影满版 |

两个 case 曾共享主题但不共享任何字体/配色/原语/形态(原 astronomy/ 后已移除)。**这是 B 解法对"同主题多审美方向"覆盖能力的验证**,不是模板换色。

## 复用指引(给未来类似主题)

- **相似主题**(JWST/Hubble 摄影 / NASA 任务发布 / 宇宙摄影集 / 太空海报)可复用:
  - 字体三元组(Big Shoulders + Public Sans + Martian Mono)
  - NASA 配色 token(NASA red / blue / JWST gold / carbon ink)
  - 签名原语(NASA asset-card / meatball SVG / Roman plate / 满版 photo / annotation callout)
  - 满版 photo + directional scrim + 左下 asset-card + 右上 stat 版式
- **需变异**:
  - Hubble 影像主题:保留 asset-card 但改 release ID 命名(HEIC vs WEIC),改 gold 为 Hubble heritage 红
  - 行星地质主题:把 nebula photo 换成行星 surface 照片,保留 plate 编号但改尺度
  - 任务时间线:保留 NASA meatball + plate 但 timeline 替代 stat
- **不要套用**:本 case 是参考(学决策),不是模板。每次仍走 B 解法 7 步(0-6)。

## 一句话

> 满版 JWST 摄影 + NASA asset-card + NASA meatball + 罗马 plate 是 NASA/JWST 影像海报的现实视觉语言。把它们做成 HTML 组件,不是套模板,是把 NASA 摄影海报的母语写进 deck。B 解法 + impeccable 双检让方向 B 完全不像 dark-tech、不像任何 template、不像 AI slop。
