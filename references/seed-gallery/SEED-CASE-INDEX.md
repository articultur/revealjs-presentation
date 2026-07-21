# 种子 case 库索引 · SEED-CASE-INDEX

> **用途**:B 解法(`references/design-generation-workflow.md`)产出的 case 索引。每创建一个 case 加一行。未来遇相似主题 grep(字体/hue/签名/复用),决定复用 / 变异 / 新建。
>
> case 在 `references/seed-gallery/<theme>/`(永久):含 `seed.html`(deck)+ `case.md`(审美意图 / 外部大师来源 / 审美推导 / 签名时刻 / 打磨决策 / 不像 template 的理由)。
>
> **case 是参考(学决策),不是套用模板**。
>
> **可路由(2026-07-20 起)**:case 元数据注册在 `tokens/seed-cases.json`(单一真相源:keywords / dimensions / dna 摘要),`scripts/voice-router.js` 命中相似主题时返回 `caseRef` 指向 case.md + seed.html,作 B 解法参考。**新 case 必须三步**:① 此表加一行 + ② `seed-cases.json` 加一条 + ③ 跑 `node scripts/check-seed-collision.js references/seed-gallery/<theme>/seed.html` 确认无字体撞车——否则不可路由 / 会撞车。下方字体占用表降级为 fallback 速查,以脚本 grep 仓库实际为准。

## 索引

| theme | 字体(display/body/mono) | 主 hue | 签名 class | 远离(撞车规避) | case 路径 | 复用指引 |
|---|---|---|---|---|---|---|
| **astronomy-nebula 满版星云冲击**(Direction B / NASA poster) | Big Shoulders Display / Public Sans / Martian Mono | carbon WPA ink #0a0a0a + bone #f4f1ea + NASA meatball red #fc3d21(主)+ NASA blue #0b3d91(meatball SVG)+ JWST gold #ffb71b(verified 标签 / data 强调) | 满版 JWST 照片(8/8 页)· NASA asset-card(4 格数据+罗盘+比例尺+credit+verified)· NASA meatball SVG 任务戳 · Roman plate 编号 I-VIII · 三行 Big Shoulders 900 caps(outline+red 混排)· annotated callout · mission patch SVG · directional scrim wash(5 种) | 原 astronomy/(同主题不同方向,atlas vs poster;已移除)/ template-02 dark-tech(teal)/ template-06 brutalist(archivo black)/ template-09 editorial-photo(Noto Serif SC)—— 本 deck 是 NASA mid-century poster,完全跳出 editorial-typographic 第二阶 reflex | `references/seed-gallery/astronomy-nebula/` | JWST/Hubble 摄影 / NASA 任务发布 / 宇宙摄影集 / 太空海报:复用字体三元组 + NASA 配色 + asset-card/meatball/plate 签名;Hubble 主题:保留 asset-card 改 HEIC 命名;任务时间线:timeline 替代 stat |
| **astronomy-monument 纪念碑谷几何梦幻**(Direction B / Monument Valley × astronomy) | Tenor Sans / Pridi / Cutive Mono | night-deep #2D1B4E 深紫(Monument Valley 夜紫,非纯黑)+ night-mid #4A3478 amethyst + night-soft #6E5494 horizon purple + blush #C9A0C9 红巨星 / dawn + cream #F5E8D0 Ghibli 月光(主 fg)+ mist #9CC5CC 远雾 / Saturn + gold #E8C285 单一 Ida 路径金 | 满版 watercolor wash 渐变(8/8 页)· floating isometric cube/tetra/octa/prism monolith · Ida princess figure(circle + skirt triangle)· 30° gold walking-path(zigzag,可走)· Escher Penrose 阶梯(5 阶 + 2 ghost + loop-back)· Calder mobile(5 naked-eye planets counterweighted)· moon-glow radial-gradient(closest-side)· Plate Pillar(vertical-rl totem I-VIII,soft gold) | 原 astronomy/(科学观测,已移除)/ 原 astronomy-bright/(羊皮,已移除)/ astronomy-nebula/(NASA poster)/ template-02 dark-tech(teal ops)/ template-08 isometric(Outfit scene)/ template-04 vibrant-gradient(彩虹)—— 本 deck 是 Monument Valley × astronomy 交叉:柔和深紫渐变 + 等距几何块 + 空灵静谧,无 teal / 无散点 / 无 chart / 无照片 | `references/seed-gallery/astronomy-monument/` | 几何梦幻 deck(建筑 / 雕塑 / 几何 monograph):复用 night-deep 渐变 + Ida princess + 等距 cube + moon-glow;儿童插画:复用柔和渐变,字体换圆润;古典音乐 deck:Calder mobile(音符 mobile 化)。**同主题异调性**:同主题已被 2 个种子覆盖(nebula/monument),覆盖天文主题的 2 种美术调性边界(atlas/bright 已移除),后续天文 deck 必须出新调性 |
| **tcm-herbal 本草綱目**(B 解法 + web search A 级参照) | IM Fell English / EB Garamond + ZCOOL XiaoWei (CJK) / Ma Shan Zheng (brush) | paper oklch(0.78 0.082 80) aged jinling(L=0.78 比 cream band 暗 4%,C=0.082 高,避开 AI-slop cream)+ ink oklch(0.18 0.014 250) + 五色(qing 青 oklch(0.50 0.135 165) / chi 赤 oklch(0.52 0.180 30) / huang 黃 oklch(0.72 0.140 78) / bai 白 oklch(0.94 0.018 95) / hei 黑 oklch(0.16 0.020 250))+ zhusha 朱砂 oklch(0.46 0.190 32)(true HgS orange-leaning,不同于 chinese-ink-wash token #a02828 bluer-red) | 满版 8 层纸纹 sheet(8/8 页:corner oxidation + foxing + water-stain + 2 层 SVG turbulence + ink-bleed smudge + oxidation gradient)· 朱砂印章(4 corner seals + per-page + double inset frame)· vertical-rl 工楷眉批(Ma Shan Zheng)· folio head/foot(卷 + folio + 部) · 五色色条 color bar(5-element tag)· 木刻白描 SVG(stroke-width 1.4 ink-line + zhupi-line dashed)· 朱批标签(cinnabar label + dotted leader)· 16 部 taxonomy grid(8×2 + 五色编码 + 罗马数字 I-XVI)· 人參 ginseng 解剖图(根/莖/葉/果 朱批) | chinese-ink-wash token(单色朱砂 #a02828)/ template-01 editorial-serif(cream + brick + Cormorant)/ template-09 editorial-photo(ZCOOL QingKe HuangYou + 暖朱红)/ template-10 clinical-trial(bond blue + Bitter)/ 原 astronomy-bright(羊皮 rubric + Marcellus,已移除)—— 本 deck 是 5 色完整系统 + 8 层纸纹 + 多层朱印 + 木刻白描 + 16 部分类,完全不同基调 | `references/seed-gallery/tcm-herbal/` | 古典东方本草 / 汉方 / 韩医 / 日本本草 / 越南南药 / 印度阿育吠陀:复用 8 层 sheet + 五色 token + 朱印 + 木刻白描 + 工楷眉批;汉方换字体(日古典 + 越后);韩医换部 number 体系(《東醫寶鑑》17 卷);现代中医换 Noto Serif SC + Source Sans 3;阿育吠陀换 Devanagari + 三 dosha。**基调撞车检查**:本 deck 必须看不出是 template-09/10 / chinese-ink-wash token 换皮,要看出是 1596 金陵版翻开后看见的真实页面 |


<!-- 上一会话的 vaporwave / data-viz / cyberpunk master-ref 在 workspace/research/(临时目录,会话间清理,已丢)。若需,用 B 解法重做到本目录(references/seed-gallery/<theme>/)。 -->

## 字体占用表(避撞车,grep 此表 + `grep -l "<font>" examples/template-*.html tokens/*.css`)

| 来源 | 字体 |
|---|---|
| template-01 editorial-serif | Cormorant Garamond / Source Serif 4 / Courier Prime |
| template-02 dark-tech | IBM Plex Sans / IBM Plex Mono |
| template-03 minimal-spatial | Archivo / Archivo Narrow / SF Mono |
| template-04 vibrant-gradient | Sora / JetBrains Mono |
| template-05 nature-fresh | Fraunces / Work Sans / Caveat |
| template-06 brutalist | Archivo Black / IBM Plex Sans / JetBrains Mono |
| template-07 memphis | Bricolage Grotesque / JetBrains Mono |
| template-08 isometric | Outfit / JetBrains Mono |
| template-09 editorial-photo | Noto Serif SC 900 / ZCOOL QingKe HuangYou / Courier Prime |
| template-10 clinical-trial | Bitter / Hanken Grotesk / Spline Sans Mono |
| voices.json fontPool(14 voice) | Afacad / Literata / Chivo Mono |

| astronomy-nebula/(NASA poster) | Big Shoulders Display / Public Sans / Martian Mono |
| astronomy-monument/(Monument Valley) | Tenor Sans / Pridi / Cutive Mono |
| tcm-herbal/(本草綱目) | IM Fell English / EB Garamond / ZCOOL XiaoWei / Ma Shan Zheng |

> 新种子选字体前 grep 此表 + `examples/template-*.html` + `tokens/*.css` 三重确认。**不要信单一文档清单**(易过期,以 grep 仓库实际为准)。

## 查询示例

```bash
# 查"我想做航天,有没有相似 case 可复用"
grep -i '航天\|宇宙\|星\|astro' references/seed-gallery/SEED-CASE-INDEX.md

# 查"哪些 case 已用某字体"(避免撞车)
grep '<font>' references/seed-gallery/SEED-CASE-INDEX.md
```
