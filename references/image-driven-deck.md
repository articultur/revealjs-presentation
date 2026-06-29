# 图像驱动演示文稿 · Image-Driven Decks

> 当主题的 proof object 是"实景"——城市、建筑、产品、美食、活动现场——版式驱动不够,**图就是论据**。本指南教三件事:**去哪找图、找怎样的图、怎么把图排进版式而不沦为旅游册**。
>
> 配合 [image-system.md](image-system.md)(滤镜 / 裁切 / overlay 工具)与 [layout-archetypes.md](layout-archetypes.md)(版式引擎)使用。种子示范见 `examples/template-09-editorial-photo.html`。

## 目录
1. [何时用图像驱动](#何时用图像驱动)
2. [§1 去哪找图](#1-去哪找图)
3. [§2 找怎样的图](#2-找怎样的图)
4. [§2.5 图片角色台账](#25-图片角色台账)
5. [§3 怎么排版(7 种图像 archetype)](#3-怎么排版)
6. [§4 工作流](#4-工作流)
7. [§5 杭州 worked example](#5-杭州-worked-example)

---

## 何时用图像驱动

主题形状 = **"展示实景"**:
- 城市 / 地域介绍(杭州、巴黎、某县城)
- 旅游 / 文旅 / 招商
- 建筑 / 地产 / 室内作品集
- 美食 / 餐厅 / 菜单
- 产品摄影 / 发布会实物
- 活动 / 婚礼 / 会议纪实

**核心判断题**:把这页的图全删掉,还剩什么?
- **剩不下**("必须看图才知道长什么样")→ **图像驱动(09)**,图是 proof object,先搜图再排版
- **剩得下**(数据 / 论证 / 方法论本身是 proof)→ **版式驱动(01-08)**,图只作点缀

### 图像 vs 版式:同名主题怎么选

同一座城市 / 产品,可能图像也可能版式,看**主命题动词**(不是看主题词):

| 主题 | 主命题 | 选 | 理由 |
|---|---|---|---|
| 杭州城市介绍(风光/文旅) | 看西湖 / 雷峰塔长什么样 | **09 图像** | 实景是 proof |
| 杭州经济报告 | GDP / 产业数据 | **01/03 版式** | 数据是 proof |
| 杭州历史 | 良渚→南宋编年 | **01 版式** | 时间线是 proof |
| 杭州美食地图 | 菜长什么样 | **09 图像** | 实物是 proof |
| 某产品发布 | 产品实物 + 参数 | **04 发布** 或 **09** | 舞台 drop→04,实拍→09 |
| 某产品架构 | 系统怎么搭 | **03 结构** | 架构图是 proof |
| 餐厅品牌册 | 菜品 + 空间实拍 | **09 图像** | 实景是 proof |
| 餐厅经营数据 | 营收 / 翻台 / 客单价 | **02/03 版式** | 数据是 proof |

**一句话判据**:"看长什么样"→ 09 图像;"看多大 / 多少 / 怎么跑"→ 版式。

**混合主题**(城市介绍 + 数据):选主隐喻——图作主 proof 用 09,数据插 IP5(图+数据)或单独版式页。不要把数据硬塞进图像页(挤),也不要把实景硬排成版式(丢图)。

> 8 个版式种子(01-08)都是"纯 CSS/SVG 驱动",本指南 + template-09 补的正是"图像即内容"这条线。

---

## §1 去哪找图

### 图库对比(全免费、商用可用)

| 图库 | 协议 | 需 key | 强项 | 适合 |
|---|---|---|---|---|
| **Wikimedia Commons** | CC-BY / CC-BY-SA / CC0(每图标清) | 否 | 地标 / 历史 / 科普 / 文物,**真实非摆拍** | 城市 / 建筑 / 历史 / 文化(首选) |
| **Openverse** | 聚合 CC(可按 license 筛) | 否(匿名搜) | 700M+,聚合 Wikimedia + Flickr 等 | 通用 CC 图搜索 |
| **Unsplash** | Unsplash License(≈CC0,免署名) | 网页搜否 / API 是 | 高质量生活 / 风景摄影 | 高质感氛围图 |
| **Pexels** | Pexels License(≈CC0,免署名) | 网页搜否 / API 是 | 商用摄影 / 视频 | 产品 / 商业场景 |
| **Pixabay** | Pixabay License(≈CC0) | 网页搜否 / API 是 | 矢量 / 插画 / 图标也多 | 需矢量配图 |

### 首选决策树

- **城市 / 地标 / 历史 / 文物** → **Wikimedia Commons**(真实非摆拍,license 标得最清)
- **通用氛围 / 高质感摄影** → Unsplash / Pexels
- **要按 license 精筛或聚合搜** → Openverse

### 搜索方式(无需 key)

**Wikimedia Commons**:
- 网页搜:`commons.wikimedia.org` 搜关键词 → 选 `File:` 页面 → 取"Original file"URL
- 分类入口(推荐,质量最稳):`commons.wikimedia.org/wiki/Category:West_Lake_(Hangzhou)`
- API(返回 JSON,可程序化取图 + license):
  ```
  https://commons.wikimedia.org/w/api.php?action=query&generator=search
    &gsrsearch=West+Lake+Hangzhou&gsrnamespace=6&gsrlimit=10
    &prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1280&format=json
  ```
  返回每图:`title` / `thumburl`(1280px 缩略)/ `url`(原图)/ `LicenseShortName`(extmetadata)

**Openverse**:
- 网页搜:`openverse.org`(可按 license 筛 CC0 / CC-BY)
- API:`https://api.openverse.org/v1/images/?q=west+lake+hangzhou`(匿名,无需 key)
- **自动化(G003 三期,2026-06)**:`node scripts/fetch-assets.js --query "..." --limit 5 --json`——脚本封装 Openverse + Wikimedia,输出 JSON(url/license/source/creator)供 skill 消费,带缓存 + 退避 + 占位降级

### 限流兜底三道(G003,2026-06)

图源 API 限流/超时常见（Wikimedia SSL handshake timeout / 429 / Openverse 匿名限 ~100 req/day；BLACKPINK 教训：重试多次仍拿不到 3840 高清）。`scripts/fetch-assets.js` 三道兜底：

| 兜底 | 机制 | 触发 |
|------|------|------|
| 1. 本地缓存 | `.cache/assets/<hash>.json`（7 天 TTL） | 同 query 二次搜 |
| 2. 指数退避重试 | 3 次：1s/2s/4s | 429 / 超时 / 网络抖动 |
| 3. 占位降级 | Picsum 随机图 + 标注"换官方照" | Openverse 0 结果 / 全失败 |

**占位降级铁律**：占位图必须标注"换官方照"（Picsum 是随机图，非主题素材）。明星/特定人物 CC-BY 天花板（Openverse/Wikimedia 不收），直接占位 + 用户手动换——不浪费时间重试拿不到的图。

### License 规范(必须遵守)

| 协议 | 要求 | deck 里怎么标 |
|---|---|---|
| CC0 | 无需署名 | 可不标(礼貌标"CC0 · 作者") |
| CC-BY | 署名作者 | 图旁小字 / credits 页:"Photo · 作者 · CC-BY" |
| CC-BY-SA | 署名 + 相同协议共享 | "Photo · 作者 · CC-BY-SA" |
| Unsplash / Pexels | 免署名(推荐) | 可不标(标了更专业) |

**铁律**:每张图必须在 deck 里标注来源(图旁小字或统一 credits 页)。G5 evidence-ledger 把"图源未标"和"数字未标"视为同等失败。

---

## §2 找怎样的图

### 必要条件(硬筛,不过滤掉)

- **横构图 16:9 或更宽**:适配 1280×720 满版;纯竖图只能侧栏,不要满版
- **满版照片用原图 URL,不用 thumb 缩略图**:Wikimedia 两种直链——`/wikipedia/commons/<哈希>/<文件名>` 是**原图**(通常 2-5MB,全分辨率),`/wikipedia/commons/thumb/<哈希>/<文件名>/<宽>px-<文件名>` 是**压缩缩略图**(200-700KB)。满版封面 / 章节页 / 大片对开铺 1280×720,**必须用原图 URL**——thumb 被压缩过,放大满版会糊(实测故宫同图:1920px thumb 仅 216KB,原图 4.45MB,差 20 倍,满版观感差一档)。判别:**URL 带 `/thumb/` = 缩略图;删掉 `/thumb/` 和 `<宽>px-` 前缀即得原图**。thumb 仅留给 IP3 缩略图网格的小图位
- **CC 协议清晰**:Wikimedia / Openverse 每图都标;避开"来源不明"的网图

### 质量条件(优选,拉开档次)

- **负空间**:画面有留白区(天空、水面、墙面、雾),便于 hero overlay 压文字
- **主体单一**:一图一视觉重心(一座塔、一碗菜、一栋楼);不要"全家福"式杂乱
- **色调克制**:低饱和、自然光;避开 HDR 塑料感、过曝、霓虹毒艳
- **真实非摆拍**:优选纪实 / 新闻 / 旅行摄影(Wikimedia 强项);避开 stock photo 假笑 / 摆拍 / 合成背景

### 反模式(直接淘汰)

- ❌ 水印 / 低分辨率 / 截图带浏览器 UI
- ❌ 过度饱和、HDR、塑料肤色、阿宝色
- ❌ stock photo 摆拍感(假笑人群、摆拍手势、合成背景)
- ❌ 主体杂乱(游客乱入、电线穿插、杂物堆)
- ❌ 全 deck 色调不统一(冷蓝夹暖橙混搭)→ 后期用 Tinted 滤镜统一
- ❌ 封面 / 章节 / 结尾重复同一张图(第一眼廉价,像素材不够)
- ❌ 超宽低高图硬塞 16:9 满版(例如 1920×333 天际线),会被裁成一条雾带或拉低质感
- ❌ 实用信息 / 路线 / 数据页随便放地标照:图没有解释页面任务,只是在"证明这座城市存在"

## §2.5 图片角色台账

图像驱动 deck 先做**照片角色台账**,再写 HTML。每张大图必须回答"为什么是这张,不是另一张"。

| 页型 | 图片角色 | 选择标准 | 禁止 |
|---|---|---|---|
| Cover | 建立世界观 | 最强、最高分辨率、最有负空间的一张;不要和正文重复 | 低清、暗糊、和第 1 页重复 |
| Chapter | 切换场景 / 情绪 | 与章节动作相关,和 cover 有色调连续但构图不同 | 随机地标、重复 cover |
| Proof | 证明 action title | 图中主体必须直接支持标题里的动词或结论 | 只因"好看"而放 |
| Route / Practical | 解释路径 / 使用方式 | 中轴线、地图感、街道动线、交通或人流;能辅助信息结构 | 景点照冒充路线说明 |
| Gallery | 建立样本集 | 多张图统一裁切/滤镜,每张有不同样本意义 | 同一建筑角度反复出现 |
| Close | 收束记忆点 | 与主命题形成回环,但不能复用封面 | Thank-you 空页或重复封面 |

**生成前必填**:

```text
Slide 01 · cover · image role: establishing shot · why_this_image: ____ · source/license: ____
Slide 02 · proof · image role: landmark detail · why_this_image: ____ · source/license: ____
...
```

**硬规则**:

1. Cover / chapter / close 三类大图之间不得重复同一源图。
2. 支撑图可以重复,但只能作为刻意的 recurring motif;否则换图。
3. 每页图必须绑定 action title 中的名词或动词。绑定不出来,说明这页不是图片驱动页,应改为数据/路线/色块锚点页。
4. 满版图优先原图 URL 或 ≥2200px 长边、≥900px 短边;低于 1280×720 或被放大显示 = 阻断。
5. 若需要用暗 overlay 保文字,overlay 只能服务可读性;不能把低清、杂乱、语义不匹配的图"压黑藏起来"。
6. **同一地标/主体不得多页同角度重复(2026-06)**:封面用了天际线,章节页/画廊就换角度(俯瞰/街景/特写)。实测北京 deck slide 1 封面 + slide 8 画廊都用 CBD 天际线 → 触发 audit `repeated-support-image`。台账补一列"拍摄角度/时段",撞了换图。
7. **满版图 URL 禁 `/thumb/`(2026-06 硬)**:Wikimedia 满版必须原图 URL(`/wikipedia/commons/<哈希>/<文件名>`,无 `/thumb/` 无 `<w>px-` 前缀)。`audit-image-assets.js` 已把 `/thumb/` 满版标为 `hero-thumb-not-original` warning。3840px 的 thumb 虽够清,但技术上仍是缩略图,原图更稳(实测 1280px thumb 与原图差 20 倍体积)。

---

## §3 怎么排版

配合 [image-system.md](image-system.md) 的滤镜 + [layout-archetypes.md](layout-archetypes.md) 的版式引擎。核心原则:**图是设计元素,不是插入物**——每张图经处理融入配色,绝不裸放(裸放 = 旅游册,失败门禁 #1)。

### 7 种图像 archetype(IP = Image-Photo)

#### IP1 · 满版照片封面(Hero Overlay)
图占满 1280×720,hero overlay 压暗(`brightness 0.35-0.5` + 底部 gradient),标题压在留白区。
- 用 `image-system.md` 的 **Hero Overlay** 滤镜
- 标题压在图的负空间区(天空 / 水面 / 雾),不在主体上
- 适合:**封面**、章节分隔
- 反模式:标题压在塔尖 / 人脸上(糊);图未压暗就压白字(读不出)

#### IP2 · 大片图文对开(Photo Spread)
图占 52-58%,文字侧 42-48%,非对称。
- 图侧用 **Muted** 或 **Tinted** 滤镜融入 voice 配色
- 文字侧:action title + 一段说明 + 数据 / 来源
- 适合:**单景深描**(西湖全景、雷峰塔特写、龙井茶园)
- 反模式:50:50 对称(无张力);图和文字各讲各的(图要解释标题)

#### IP3 · 网格画廊(Grid Gallery)
2×3 或 3×2,6 张以内。统一滤镜 + 统一裁切 + `0.5em` 间距。
- 全部 **Muted 滤镜**(`saturate 0.7 contrast 0.9`)统一色调
- 每图配一行 caption(景名 + 图源)
- 适合:**多景速览**(杭州六景、产品系列、菜单九宫格)
- 反模式:>6 张(挤);每图不同滤镜(花);无 caption(读者不知道看什么)

#### IP4 · 照片章节页(Full-Bleed Section)
全出血图 + 底部 caption bar(图源 + 一句说明)。
- `brightness 0.5` + 底部 `linear-gradient` 让 caption 可读
- caption bar 写图源("Photo · 作者 · CC-BY")+ 一句章节引导
- 适合:**章节切换**、转场呼吸
- 反模式:图未压暗 + caption 直接压上(读不出);无图源(G5 红灯)

#### IP5 · 图 + 数据锚点(Photo + Stat)
照片侧 + 巨型数字侧(`layout-archetypes.md` A5 Anchor Numeral 变体)。
- 图证"长什么样",数字证"多大 / 多少"
- 适合:**城市数据页**(天际线 + GDP)、**产品页**(实物 + 参数)
- 反模式:图和数字各占一半对称(用 52:48);数字 <4em(无锚点引力)

#### IP6 · 色块锚点页(Color Anchor,非照片为主)
满版品牌专色色块占主视觉,照片退为缩略图网格 / 单张小图 / 数据锚点。**这是图像 deck 里唯一"色块为主"的版式,用来打破"全 deck 照片 + 遮罩"的用色偏平**——照片再震撼也顶替不了专色色块的张力对比,缺了它 deck 就"平、不惊艳"。
- 满版专色(`var(--c-accent)` 或 voice 深色)压 action title + 巨型数字 / 引言,右侧 35-40% 或底部一条照片缩略图带(3-4 张 96×96px Muted 小图)
- 或:左 60% 满版色块(巨型数字 + takeaway),右 40% 单张竖图 `object-fit:cover`
- 适合:**数据总结页 / takeaway / 章节高潮**——照片 deck 最容易在这些页退化成"又一张满版照",IP6 给它一个色块支点
- 反模式:色块 + 照片仍 50:50 对称(无张力);色块上压小字(浪费满版色);全 deck 都是 IP6(那就不是图像 deck 了,1-2 页足够)
- **主题色贯穿(colorCommit 偏平的正解,硬)**:`design-strength-check.js` 的 colorCommit 扫的是全 deck **commit background 声明数**(深色 / `var(--c-accent)` / gradient,排除 `--c-bg` 浅底)÷ 页数;照片不算色块。**最常见的偏平根因:主题色只作 `color` / `border` 文字色,没作 `background` 实色**——colorCommit 不认 color/border,视觉上主题色也显得"不实、没贯穿"(单页 IP6 再好也是孤岛)。正解是把主题 accent 作为**实色 background** 铺到每页关键元素:① **1 页 IP6 满版色块锚点**;② **印章 / 序号 chip**——stamp、card 的 i/ii/iii 序号、plate 编号用 `background:var(--c-accent)` 实色填充(不是 border/color);③ **年份 / 标签 chip**——ev-row 年份、kicker 分类压在 accent chip 上;④ **封面印章**。主题色既贯穿全 deck 成统一视觉语言,每处又都是 commit background。实测北京 deck 四阶段:33(仅 5 处,主题色全是 color)→ +1 页 IP6(36)→ +3 数据 chip(55)→ **主题色贯穿 stamp / 序号 / 年份 / 封面印章(79/100 ✓,总分 80→92,grade-gate 全绿)**。判别:翻遍 deck,主题 accent 出现时是 `background:` 实色(算 commit)还是 `color:`/`border:`(不算)——后者就是"主题色没贯穿"。色块要承载信息(编号 / 分类 / 层级 / 数字),不是无意义堆色——后者变"花",触发反模式

#### IP7 · 照片对峙（Photo Face-Off,图像版 A6 · 2026-06 新增）
两个对照值正面对峙 + 巨型比率裁决(`≈ 1/X`)。**图像 deck 最缺的戏剧页型**——照片擅长"长什么样",但没法直接表达"全貌 vs 你能接触的"这种规模落差,IP7 用对峙 + 裁决把它压成一眼震撼。
- 左侧 accent 实色面板(52%):巨型数字 A(全长/总量/全部)+ 标签 + 一句分量说明
- 右侧深底(48%):数字 B(本地段/可见量/你能走到的)+ `≈ 1/X` 比率裁决 + 取舍说明
- 典型场景:**长城全长 21,196km vs 北京段 520km ≈ 1/40**、**故宫 9000 间 vs 开放 ~1500 间 ≈ 1/6**、**地铁全网 N 站 vs 游客用到 M 站 ≈ 1/X**
- 适合:**规模落差页 / "你以为的 vs 真实的"页 / 章节高潮**——比单纯 IP5 数据锚点多一层"裁决"张力
- 反模式:两侧都浅底(无对峙);无 `≈ 1/X` 裁决(对峙没结论);比率数字 < 2.5em(没分量);两侧数字同级(要用 5em+ vs 3em+ 的尺度差体现"全貌 vs 局部")
- **和 IP5 的分工**:IP5 是"一个数字 + 证据列"(单向证明),IP7 是"两个数字 + 裁决"(双向对峙)。规模主题用 IP7,单一物证用 IP5,不要混
- 种子示范:`examples/template-09-editorial-photo.html` slide 5(`.ph-faceoff`)

### 排版铁律

1. **全 deck 统一 1 种滤镜**(Muted 或 Tinted),不要每页换滤镜 → 花
2. **图必经 overlay / tinted 处理**,不裸放;裸放就是旅游册
3. **图源必标**(G5):每图旁小字 "Photo · 作者 · 协议",或 deck 末统一 credits 页
4. **文字压在留白区**,不压画面主体(压塔尖 / 人脸 = 糊)
5. **图色调对齐 voice token**:editorial cream voice → 暖色低饱和图;dark-tech → 冷暗图;vibrant → 高饱和(但统一)
6. **小字在角落 + 配色随底**(避免文字遮图 / 互相重叠):`pin` 左下、`photo-credit` 右下,**分占两角不撞**;**浅底深字 / 深底浅字**——深底(满版图 / 深色面板)用 `.pin.on-dark` + `.photo-credit`(米白半透明),浅底用 `.pin` + `.photo-credit.light`(墨色)。大标题(action title)可以压图,但只压在**留白区**(底部 gradient 压暗区),不压图主体(塔尖 / 人脸 / 视觉中心);小字(kicker / source / caption)优先角落或文字侧,不在图主体上漂浮。
7. **深浅呼吸(硬,2026-06 升级)**:全深或全浅 deck = 视觉偏平。**必须插 ≥1 页反相页**做呼吸——深底 deck 插 1 页浅底 A2 命题/A10 引言,浅底 deck 插 1 页深底 IP4 章节/IP6 色块。判据:翻遍全 deck,data-background 是否全是同一色调?是 → 必加反相页。`design-strength-check.js` 已把"全深/全浅"列为 metaphor **-10 惩罚**(深浅呼吸子分)。实测:北京 deck 10 页全深 → colorCommit 虚高 100 但 breath=0 扣 10;原种子 3 深 5 浅 → breath ✓ 但 colorCommit 42。**两者兼得才是正解**(新 template-09 v2:9 深 1 浅,breath ✓ 且 colorCommit 100)。
8. **archetype 节奏(硬,2026-06 升级)**:同类 archetype **不得连续 ≥2 页**,单一 archetype **不得 ≥3 次**(占比 ≥25%)。图像 deck 最容易 IP2 大片对开连用——视觉骨架同构 = 平。生成后台账对照下方"节奏表"自检。`design-strength-check.js` 已把"过度使用 -8 / 连续 -10"列为惩罚。

### 图像 deck 节奏表(10 页金骨架 · 2026-06 新增)

经校验验证(新 template-09 v2 实测 design-strength **99/100**、grade-gate pass)的 10 页节奏,生成时按主题套内容即可:

| 页 | archetype | 底 | 角色 | 设计动作 |
|---|---|---|---|---|
| 1 | IP1 封面 | 深 | establishing | 满版图 + hero overlay + cover-code 竖排水印 + cover-stamp |
| 2 | IP4 章节页 I | 深 | 切场景 | section-dim + 横向 gradient + kicker+h2 |
| 3 | IP2 对开 | 深 | 单景深描 | 59:41 图文 + stat-row 三数据 |
| 4 | IP3 画廊(featured) | 深 | 样本集 | 主景占 2×1 大格 + 4 小格,统一 muted |
| 5 | **IP7 对峙** | 深 | 规模落差 | accent 实色面板 × 深底,`≈ 1/X` 裁决 |
| 6 | IP5 数据锚点 | 深 | 单物证 | 巨型数字(accent 实色)+ 年份 chip 台账 |
| 7 | **A2 命题** | **浅** | 主张/呼吸 | 大字主张 + 极端留白(全 deck 唯一浅底) |
| 8 | IP2 flip 对开 | 深 | 现代深描 | flip 布局,与 slide 3 区分 |
| 9 | IP4 章节页 II | 深 | 切实用 | 同 IP4 骨架,内容转实用信息 |
| 10 | A12 收尾 | 深 | 邀请闭环 | 报头双线 + 三件事卡 + stamp,呼应封面 |

节奏要点:① **IP2 只 2 次**(slide 3/8),不超 25%;② **A2 浅底插在中段**(slide 7)做呼吸;③ **IP7 对峙 + IP5 数据相邻但分工**(对峙 vs 单证);④ 首尾闭环(IP1 cover-stamp ↔ A12 stamp)。

### §3.5 呼吸页(A2 Manifesto)· 可复用页型规范

> ph-manifesto 起源于 template-09 editorial-photo 种子的"本主题发明变体",经 Dieter Rams 审计(27/30)确认为高分离度页型。这里把它从一次性发明提炼为**任何深底图像 deck 都能套用的通用呼吸页规范**,其他种子/主题可直接复用。

**角色**:全 deck 唯一反相页。把前半段影像收束成**一个主张**,同时给眼睛一个"亮起来"的呼吸点,打破全深单调。它是 deck 里**信息密度 + 视觉权重最高**的一页(主张句 + 支撑句 + 极端留白),不是配图说明页。

**位置约束(硬)**:
- 必须**前后都是深底页**——呼吸页靠"反相"产生张力,夹在两深底之间才成立;两浅相邻 = 无呼吸
- 插在 deck **中段(约 60–75% 位置)**——前半段影像铺陈完、后半段实用信息开始前,用主张收束转折;放太早(前 3 页)读者还没建立上下文,放太晚(末页)变成结尾而非呼吸
- **全 deck 只 1 页**——多张浅底页会稀释"唯一呼吸点"的视觉权重,且触发 colorCommit 偏平

**token 用法(零孤立色)**:

| 用途 | token | 说明 |
|---|---|---|
| 背景 | `var(--c-bg-paper)` | 纸色浅底,来自 `:root`,禁新色 |
| 主张字 | `var(--c-fg)` | 深墨色,h2 / em |
| 支撑字 | `var(--c-fg-2)` | muted 深棕,p |
| 角落标注 | `var(--c-fg-3)` | subtle,pin / m-foot |
| 强调 | `var(--c-accent)` | kicker / em,与深底页共享同一 accent |

全部复用 `:root`,**禁止在呼吸页引入孤立色**——这是它能在深色 deck 里"反相却不割裂"的关键。

**HTML 骨架(最小可复用)**:

```html
<section class="ph-manifesto deck-flex" data-background="var(--c-bg-paper)">
  <span class="kicker">Midway · 一个主张</span>
  <h2>{主题}不是一天能<em>看完</em>的{名词}。</h2>
  <div class="m-rule"></div>
  <p>[一句支撑:为什么需要慢 / 分次 / 走路——把前半段影像收束成主张。]</p>
  <div class="m-foot">a claim, not a caption · 主张页</div>
  <span class="pin">NN · A2 manifesto (light)</span>
</section>
```

**明暗过渡要求(配套,硬)**:深↔浅明暗反差大,默认 `backgroundTransition: 'fade'` 中间帧两层叠加会灰蒙闪烁。生成呼吸页时**必须**为背景层加专属过渡曲线(参考 template-09 实现):

```css
.reveal .backgrounds .slide-background { transition: opacity 720ms cubic-bezier(0.33, 0, 0.2, 1); }
```

拉长背景过渡 + ease-out,让暗↔亮跳变给眼睛适应时间,内容过渡仍走 default。

**可复用 checklist(生成时逐条勾)**:

- [ ] 全 deck 只此 1 页浅底,且前后页都是深底?
- [ ] 位置在中段(60–75%),非首尾?
- [ ] 只用 `:root` token,无孤立色?
- [ ] 有 1 句主张(h2)+ 1 句支撑(p),非空装饰?
- [ ] m-foot 标注"a claim, not a caption"(主张页 ≠ 配图说明页)?
- [ ] 背景层过渡曲线已加(防深↔浅闪眼)?
- [ ] `design-strength` 深浅呼吸子分 = ✓(全深/全浅会被 metaphor -10)?

**何时不该用**:

- deck 本身就是浅底系 → 反过来插 1 页**深底**章节页做呼吸,不要硬塞浅底
- 总页数 < 6 → 没有足够铺垫,呼吸页显得突兀;用普通章节页即可
- 没有真正的"主张"可收束 → 空有留白无内容,变成空洞;宁可不要

---

## §4 工作流(生成图像驱动 deck)

1. **列关键词清单**:主题的核心 proof object 各一个关键词
2. **写照片角色台账**:先分配 cover / chapter / proof / route / gallery / close,每页写 `why_this_image`
3. **搜图**:每关键词去首选图库搜(Wikimedia 用于城市 / 地标),选 1-2 张候选
4. **选图**:按 §2 + §2.5 标准(横构图 / 高分辨率 / 负空间 / CC 协议 / 角色不重复 / 语义绑定)硬筛
5. **取 URL(满版用原图)**:从 `File:` 页取**原图 URL**(`/wikipedia/commons/<哈希>/<文件名>`,非 `/thumb/`);只有 IP3 缩略图网格的小图位用 `thumburl`。用 API 时取 `url`(原图)字段,不要默认取 `thumburl`
6. **验证每张图可达(防 404 裂图,必做)**:选定 URL 后**逐张验证**,任一非 200 立即换图——Wikimedia 上同一主题常有多张序列号图(`_13` / `_22`),部分会被删除或重命名,直接热链会 404 裂图(实测 `Nanluoguxiang_..._22.jpg` 已 404,同主题 `_13.jpg` 正常 200)。验证方式任一:
   - `curl -s -o /dev/null -w "%{http_code} %{url_effective}\n" "<url>"`(看是否 `200`)
   - 或浏览器直接打开 URL 看是否出图
   - 批量验已生成的 deck:`for u in $(grep -oE 'https://upload\.wikimedia[^"]*' deck.html | sort -u); do printf "%s " "$u"; curl -s -o /dev/null -w "%{http_code}\n" "$u"; done` —— 出现非 200 的回 §2 换图
7. **排版**:按 §3 archetype 分配 + 对照"节奏表"(封面 IP1 / 章节 IP4 / 主景 IP2 / 速览 IP3 / **规模落差用 IP7 对峙** / 数据 IP5 / **中段插 A2 浅底命题做呼吸** / **数据总结用 IP6 色块锚点** / 收尾 A12)。**节奏自检:同类 archetype 不连续 ≥2 页、单一 archetype 不 ≥3 次、必须有 ≥1 浅底呼吸页**——不满足回 step 3 重排
8. **处理**:全 deck 统一 Muted/Tinted 滤镜,封面 / 章节页加 hero overlay;背景主题不漂移,除非是刻意章节反差
9. **标注**:每图标图源(作者 + 协议),数据图加 verified,末页 credits 汇总
10. **资产硬检**:`node scripts/audit-image-assets.js <file>`。阻断:断图、满版图被放大、满版低于 1280×720、超宽低高图硬塞 16:9、cover/chapter/close 大图重复。警告:满版图非 retina、支撑图重复、背景主题漂移
11. **视觉语义检**:`node scripts/visual-verdict.js <file>`。要求视觉模型明确判:图片是否解释标题、是否廉价/低质/过暗、照片是否重复、主题是否割裂、是否有设计冲击力。blocker 必须改
12. **综合自检**:`grade-gate`(G5 查图源 / 数字标注)+ `design-strength`(**图像 deck 重点看 5 个子分**:① colorCommit 主题色贯穿,至少 1 页 IP6 否则"用色偏平"; ② 深浅呼吸,全深/全浅 metaphor -10; ③ archetype 节奏,连续≥2 页 -10、单页型≥3 次 -8; ④ colorContrast token 字色 WCAG 对比,accent 做深底字色<3:1 则提亮或改用 hot 覆盖; ⑤ scaleContrast≥3:1)+ `audit-image-assets`(查 broken/upscaled + **`/thumb/` 满版缩略图 warning**)+ `visual-verdict`(视觉模型评整体冲击)

### 视觉模型辅助判定提示词(手工复核用)

当无 `OPENAI_API_KEY` 只能 `visual-verdict.js --dry-run` 时,让有视觉能力的会话模型读取截图,使用下面的补充 rubric:

```text
请作为严苛的图片驱动 PPT 视觉评审,逐页判断:
1. 这张图是否直接解释本页 action title? 若只是泛泛地标/氛围图,标 blocker 或 warning。
2. 封面、章节、结尾是否重复同一图片或同一视觉角度? 重复大图为 blocker。
3. 满版图是否显得低清、糊、过暗、裁切廉价、主体被文字压住? 关键页为 blocker。
4. 全 deck 是否像同一套视觉系统? 背景、滤镜、专色、文字位置是否割裂?
5. 页面是否有一个眼前一亮的主视觉决定? 若都是普通图文对开/暗罩文字,标 weak-design-impact。
6. 路线/实用信息/数据页的图是否帮助理解路径、结构或数字? 若不能,标 photo-does-not-explain-claim。
输出 blocker / warning / note,每条写 slide、证据、修法。
```

### 单文件自包含 vs 外链 URL

- **外链 URL**(默认):`<img src="https://upload.wikimedia.org/...">` —— HTML 小,但有两个运行时风险:① 离线不可用;② **并发限流(429)**——同一 deck 并发拉 >10 张 upload.wikimedia.org 图可能触发 Too Many Requests,部分图间歇性加载失败(curl 批量测 18 张有 4 张 429;浏览器加载多图页也是并发请求,封面/章节页若图失败 = 第一眼就垮)
- **base64 内联**:`<img src="data:image/jpeg;base64,...">` —— 真正单文件自包含,但 HTML 膨胀(每图 200KB-2MB,10 张 = 2-20MB)
- **本地 images/ 目录**:HTML + 同目录 images/ 文件夹交付,折中

默认用**外链 URL**(演示场景都在线),交付时说明"图依赖 Wikimedia CDN,离线/限流时需下载内联"。**防限流**:IP3 网格 ≤6 张;关键页(封面 IP1 / 章节页 IP4)的图优先 base64 内联或本地化,确保首屏必现;全 deck >12 张外链图时,考虑把半数关键图内联。

---

## §5 杭州 worked example

关键词 → Wikimedia 分类 / 文件 → archetype 分配:

| 关键词 | Wikimedia 入口 | 用途 / archetype |
|---|---|---|
| 西湖全景 | `Category:West_Lake_(Hangzhou)` | 封面 IP1 / 章节 IP4 |
| 雷峰塔 | `杭州西湖(远景:御码头雷峰塔).jpg`(1920×1080) | IP2 大片对开 |
| 龙井茶园 | `Category:Longjing_tea` | IP3 画廊 |
| 钱塘江 / 大桥 | `Category:Qiantang_River` | IP4 章节页 |
| 良渚玉琮 | `Category:Liangzhu_Culture` | IP5 图 + 数据 |
| 阿里总部 / 数字 | `Category:Alibaba_Group` | IP5 图 + 数据 |

(具体 `File:` URL 在生成时从 commons.wikimedia.org 取最新可用;上面分类入口长期稳定。)

### 杭州 deck 的图像节奏(10 页示例)

```
IP1 西湖封面 → IP4 良渚章节 → IP2 雷峰塔深描 → IP3 龙井/丝绸/官窑画廊
→ IP5 良渚玉琮+年代 → IP2 钱塘江 → IP4 南宋章节 → IP5 阿里+数字经济
→ IP3 城市天际线画廊 → IP1 西湖夜景收尾(credits)
```

每页统一 Muted 滤镜,封面 / 章节页加 hero overlay 压暗,数据图配 verified 标注,末页 credits 汇总所有图源。
