# 图像驱动演示文稿 · Image-Driven Decks

> 当主题的 proof object 是"实景"——城市、建筑、产品、美食、活动现场——版式驱动不够,**图就是论据**。本指南教三件事:**去哪找图、找怎样的图、怎么把图排进版式而不沦为旅游册**。
>
> 配合 [image-system.md](image-system.md)(滤镜 / 裁切 / overlay 工具)与 [layout-archetypes.md](layout-archetypes.md)(版式引擎)使用。种子示范见 `examples/template-09-editorial-photo.html`。

## 目录
1. [何时用图像驱动](#何时用图像驱动)
2. [§1 去哪找图](#1-去哪找图)
3. [§2 找怎样的图](#2-找怎样的图)
4. [§3 怎么排版(5 种图像 archetype)](#3-怎么排版)
5. [§4 工作流](#4-工作流)
6. [§5 杭州 worked example](#5-杭州-worked-example)

---

## 何时用图像驱动

主题形状 = **"展示实景"**:
- 城市 / 地域介绍(杭州、巴黎、某县城)
- 旅游 / 文旅 / 招商
- 建筑 / 地产 / 室内作品集
- 美食 / 餐厅 / 菜单
- 产品摄影 / 发布会实物
- 活动 / 婚礼 / 会议纪实

**判断题**:把这页图的文字说明全删掉,还剩什么?如果剩不下设计感 → 用图像驱动。反之(数据 / 论证 / 方法论主题)→ 版式驱动(`layout-archetypes.md`),图只作点缀。

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
- **分辨率 ≥ 1920×1080**:满版铺 1280×720 不糊;缩略图(几百 px)别用
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

---

## §3 怎么排版

配合 [image-system.md](image-system.md) 的滤镜 + [layout-archetypes.md](layout-archetypes.md) 的版式引擎。核心原则:**图是设计元素,不是插入物**——每张图经处理融入配色,绝不裸放(裸放 = 旅游册,失败门禁 #1)。

### 5 种图像 archetype(IP = Image-Photo)

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

### 排版铁律

1. **全 deck 统一 1 种滤镜**(Muted 或 Tinted),不要每页换滤镜 → 花
2. **图必经 overlay / tinted 处理**,不裸放;裸放就是旅游册
3. **图源必标**(G5):每图旁小字 "Photo · 作者 · 协议",或 deck 末统一 credits 页
4. **文字压在留白区**,不压画面主体(压塔尖 / 人脸 = 糊)
5. **图色调对齐 voice token**:editorial cream voice → 暖色低饱和图;dark-tech → 冷暗图;vibrant → 高饱和(但统一)
6. **小字在角落 + 配色随底**(避免文字遮图 / 互相重叠):`pin` 左下、`photo-credit` 右下,**分占两角不撞**;**浅底深字 / 深底浅字**——深底(满版图 / 深色面板)用 `.pin.on-dark` + `.photo-credit`(米白半透明),浅底用 `.pin` + `.photo-credit.light`(墨色)。大标题(action title)可以压图,但只压在**留白区**(底部 gradient 压暗区),不压图主体(塔尖 / 人脸 / 视觉中心);小字(kicker / source / caption)优先角落或文字侧,不在图主体上漂浮。

---

## §4 工作流(生成图像驱动 deck)

1. **列关键词清单**:主题的核心 proof object 各一个关键词
2. **搜图**:每关键词去首选图库搜(Wikimedia 用于城市 / 地标),选 1-2 张候选
3. **选图**:按 §2 标准(横构图 / 高分辨率 / 负空间 / CC 协议)硬筛
4. **取 URL**:从 `File:` 页取原图 URL,或 API 拿 `thumburl`(≥1280px)
5. **排版**:按 §3 archetype 分配(封面 IP1 / 章节 IP4 / 主景 IP2 / 速览 IP3 / 数据 IP5)
6. **处理**:全 deck 统一 Muted 滤镜,封面 / 章节页加 hero overlay
7. **标注**:每图标图源(作者 + 协议),数据图加 verified,末页 credits 汇总
8. **自检**:`grade-gate`(G5 查图源 / 数字标注)+ `design-strength` + `visual-verdict`(P4 必跑)

### 单文件自包含 vs 外链 URL

- **外链 URL**(推荐):`<img src="https://upload.wikimedia.org/...">` —— HTML 小,图稳定(Wikimedia CDN),但离线不可用
- **base64 内联**:`<img src="data:image/jpeg;base64,...">` —— 真正单文件自包含,但 HTML 膨胀(每图 200KB-2MB,10 张 = 2-20MB)
- **本地 images/ 目录**:HTML + 同目录 images/ 文件夹交付,折中

默认用**外链 URL**(演示场景都在线),交付时说明"图依赖 Wikimedia CDN,离线需下载内联"。

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
