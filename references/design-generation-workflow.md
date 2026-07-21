# 设计生成 Workflow · 任意主题 → 视觉种子(DNA)→ 最终 PPT


> **核心**:B 解法生成**视觉种子(设计 DNA:配色/字体/签名/排版/材质,不含具体内容)**;最终 PPT = **复用种子 DNA + 填主题内容**(扩展生成)。
>
> **种子 ≠ 完整 deck(成品)**,种子 = **视觉 DNA 中间态**(可复用到任意该主题 PPT)。同一 DNA 可扩展到多个该主题 PPT(如本草纲目 DNA → 人参专题/方剂专题/针灸专题)。

## 两阶段

1. **生成视觉种子(B 解法 7 步)**:web search A 级参照 → 审美意图 → 7 步生成 **visual-seed**(配色/字体/签名/排版/材质 CSS + 组件骨架,**内容用占位**)→ impeccable 打磨 → 视觉 DNA 成型
2. **扩展最终 PPT(复用种子 DNA)**:visual-seed DNA + 用户具体内容(大纲/数据/文字)→ 填内容保 DNA → 最终可交付 PPT

**为什么两阶段**:种子是 DNA(设计语法,复用),不是成品(一次性)。分离 DNA 与内容 → 同一 DNA 扩展多 PPT;也解决"种子=模板"矛盾(DNA 不是套用成品,是设计语法的可复用基底)。

## 为什么不套种子/模板

种子/模板(无论多精致)本质是"预定义设计集"——**套用 = 换皮**(换内容保设计),是枚举思维。B 解法是**设计能力**(任意主题 → 有设计感),不是套用。

**种子/voice 的正确角色**(不是套用依赖):
- **case 参考**:未来相似主题参考 master-ref 的 case.md(调研/决策/打磨),**学其决策,不套 HTML**
- **已覆盖兜底**:已覆盖主题可用种子 voice primitive 作配色/字体起点,但仍按 B 解法生成(不套种子 HTML)

## B 解法 7 步(任意主题,含未覆盖;天文 4 方向实证优化)

### 0. 审美轴探索 + 用户锚点(生成前——天文实证:突破靠这步)

**用户审美锚点**(最高价值输入):问/识别用户的**具体审美参考**(不只主题)。天文实证:用户说"纪念碑谷调性"→ 锚点 = Monument Valley 游戏(ustwo)→ 立刻突破。锚点越具体(作品/调性/设计师,不是领域),产出越准。**没锚点时主动问**:"你心里有参考吗?某游戏/电影/设计师/调性?"(如 nebula:NASA 海报;monument:纪念碑谷)。

**审美轴探索**(同主题多方向):同主题可有多审美轴(天文实证:dark atlas / 羊皮纸 Bayer / NASA 星云 / 纪念碑谷 4 轴,零共享字体/配色/原语)。生成前**列出 ≥2 审美轴**(不同大师/调性),选最贴用户锚点的;或并行试 2 个对比。**不要只产一个**——第一版可能基调撞车(见步骤 5),多轴探索是保险。

### 1. 审美意图先行(不填清单)
定**一个具体情绪**(不是泛主题:"凌晨 3 点 Chiba netrunner 孤独",不是"赛博朋克")+ **一个签名时刻**(满版巨字 / 极端留白一句主张 / 震撼 proof)+ **一个极端对比**(尺度 ≥5:1 / 明度深满版 vs 浅留白 / 密度密 vs 空)。

### 2. 外部大师参考(禁现有 template/种子套用)+ **web search 找参照物**

该主题的**现实视觉文化**:电影摄影 / 游戏 UI / 文学封面 / 专辑 / 现实场景。

**用户没审美锚点(步骤 0 没问到)→ 必须 web search 找参照物(A 级证据,不靠训练先验 B 级)**:
- **搜索**:`"<主题> design inspiration"` / `"<主题> poster / editorial / website visual language"` / `"<主题> best design examples"`
- **搜源**:Awwwards / Behance / Pinterest / Are.na / Siteinspire / 设计年刊 / 该主题专业出版物
- **web fetch 真实作品**(不只训练记忆):用 WebSearch / exa / deep-research 工具,fetch 实际设计作品,记录 URL + 视觉描述。**证据等级标注**(A=本会话 web fetch / B=训练先验+可追溯公共源 / C=主观)。
- **教训**:蒸汽波/data-viz case 之前靠训练先验(B 级),应 web search 提升到 A 级(真实作品参照,不靠记忆)。
- **没锚点 + 主题视觉文化不熟 → web search 是必选,不是可选**。

- cyberpunk ← Blade Runner 2049(Deakins)/ Cyberpunk 2077 UI / 东京香港雨夜
- data-viz ← FlowingData / distill.pub / Pew / OWID
- vaporwave ← Macintosh Plus / Aphex Twin / Win95 chrome / 80s mall
- **禁止读 `examples/template-*.html`**(会模仿,产出"像某 template 的换皮")。

### 3. 审美推导"为什么美"(不只列元素)
拆构图/配色/留白/情绪的**审美判断**。例:"Blade Runner 2049 为什么极端横向 + 雾霾 + 孤单霓虹点传达孤独?" 把"为什么"内化,不是抄元素。

### 4. 减法生成(不填 6 维)
只留情绪/签名/对比,不堆砌。**6 维改事后验收**(达标即可,不当事前清单——填清单产出"维度齐全的平产物")。去色去字体仍认得主题。验收门槛的机器化部分:`node scripts/check-seed-quality.js <seed.html>`(`--c-*` ≥8 / 签名 class ≥3 全仓唯一 / `<style>` ≥200 行 / 字体三元组,逐项 PASS/FAIL,FAIL exit 1)。

### 5. impeccable 打磨 + 反 slop + 基调撞车检查(非模板非 AI)

**反 slop(关键,防"AI 做的"感)**:impeccable absolute bans——无 side-stripe / gradient text / glassmorphism / hero-metric 卡网格 / eyebrow everywhere / numbered markers / overused-font。跑 **AI slop test + category-reflex**:从类别能猜主题+配色(技术→深蓝青)→ 训练反射,重做;从类别+反参考能猜美学(技术不 SaaS → 编辑排版)→ 更深陷阱,重做。

**基调撞车检查(天文实证:dark atlas "像 dark-tech" 教训)**:不只防配色/组件撞车(grep class/色相),要防**整体氛围/基调撞车**。生成后,**整体感受**对比现有 template(不只字段):"这个 deck 整体氛围像不像某 template?"(天文 dark 深色科学 vs dark-tech 深色 ops——配色/组件不同但**深色科学基调相似**,用户视觉抓到了,机器 grep 没抓到)。基调撞车 → 换审美轴(走步骤 0 探索的其它轴,如明亮/满版/几何)。**目标:不能被认出"AI 做的",也不能被认出"像某 template 换皮/同基调"**。

**打磨(bolder/overdrive/polish)**:放大签名/色彩/材质/细节,**Playwright 截图迭代**(rendered truth:每改截图验证)。到你判断"一打开 wow,且不像任何 template / 不像 AI 生成 / 不与现有 template 同基调"。

### 6. 沉淀 case(可选,产物化)
若主题会复用,产出 case(调研/决策/打磨记录)→ `SEED-CASE-INDEX.md` + `tokens/seed-cases.json` 注册(细节走 `seed-creation-workflow.md`)。注册后跑 `node scripts/check-seed-quality.js --registry` 验注册一致性(seed-cases.json 每条 ↔ INDEX 对应行 ↔ casePath/deckPath 文件存在,不一致 exit 1)。**case 是参考(学决策),不是套用模板**。

## 主题特别能力(不只是风格)

- **data-viz**:风格(B 解法)+ **数据可视化能力为核心**(8 种复杂图表系列:蜂群/桑基/热力/SPLOM/平行/网络/山脊 + 多变量 + 洞察 + 自定义编码)。不是基础 Tufte + FT 风格装饰。
- **其它主题**:B 解法(风格)+ 该主题的核心能力(clinical 的监管严谨 / launch 的舞台戏剧 / editorial 的策展档案)。

## 与种子/voice 库的关系(降级为 case/兜底)

- 生成时:**走 B 解法,不套种子**。
- 种子库(10 template + master-ref):**case 参考**(学决策)+ 已覆盖主题 voice primitive 起点。
- voice 库(voices.json):配色/字体 primitive(已覆盖兜底),不是完整设计。
- 主题不符任何种子/voice:**B 解法直接生成**(这是核心能力,不是兜底)。

## 关联文档

- `seed-quality-standard.md`:6 维验收尺(**事后用**,不当事前清单)。
- `seed-creation-workflow.md`:种子的沉淀细节(B 解法产物的 case 化流程,可选)。
- B 解法 case 示范:`references/seed-gallery/<theme>/`(永久 case 库,学决策不套)。每个 case 含 deck + case.md(审美意图/外部大师来源/审美推导/签名/打磨/不像 template 的理由)。

## 独立打磨阶段(生成后,B 解法 7 步之外)

> tcm-herbal 粗糙实证:B 解法 7 步(含步骤 5 一步打磨)产出"合格但不平庸"。astronomy-monument/nebula 惊艳,因为**额外跑了多轮打磨**。本阶段把打磨从"步骤 5 一步"独立为**多轮精化流程**。

### 打磨 5 步(每轮循环)

1. **截图审**(Playwright 每页渲染,视觉短板清单:哪页/哪元素弱)
2. **bolder**(放大签名时刻/极端对比/色彩浓度,防"安全平淡")
3. **overdrive**(超越常规:材质极限/动效/尺度突破,防"合格但无冲击")
4. **polish**(细节:间距/字重/材质过渡/对齐微张力)
5. **复检**(impeccable 反 slop + 基调撞车 + grade-gate 全绿)

### ⚠ 截图审的视觉判断通道(实测缺口 · tcm-herbal Round 1 教训)

步骤 1"截图审"依赖视觉判断,但视觉通道有三种失效,必须知道降级路径:

- **MCP vision(analyze_image / ZAI 类)会幻觉**:tcm-herbal 实测,给它本草纲目**占位版**截图,它编造了完整的"NEV 电动车行业封面"(全仓 grep 零命中)。"说得头头是道"但纯虚构,**不可单独信**。
- **visual-verdict 需 `OPENAI_API_KEY`**:无 key 时真实 vision model 跑不了(`--dry-run` 只准备输入)。
- **Read 截图**:某些环境只回 CDN URL,不呈现像素给执行者。

**降级路径(三通道全失效时)**:① 量化代理——`design-strength` 的 scaleContrast / colorCommit / innovation 可信;② **用户眼睛是唯一 ground truth**——把 r0/r1 截图目录(`open /tmp/...`)交给用户对比判断"惊艳了吗",别用 MCP vision 代替。

### ⚠ design-strength 量化的假阴性(别被分数误导刷分)

`design-strength` 对**非标准布局手法系统性失真**(同 grade-gate var 解析盲区 / 字形溢出检测局限同类教训):

- **tension(构图张力)只认 grid-fr / width% / 负 margin**。absolute 定位做的左文右栏非对称(tcm-herbal author 页 `.h-body 32ch` + `.stat-grid right:84px`)视觉非对称但 **tension=0 假阴性**。
- 见 tension 0 **先查布局手法**:absolute/flex 视觉非对称 → 假阴性,不是真短板。**别为刷 tension 硬塞 grid 非对称**——Goodhart,还会破坏刻本对称签名(四角朱印/等分分类网格是刻意对称)。
- visualExcellence 若被 tension 拖低,先判 tension 是否假阴性再下结论。
- **可靠信号**:scaleContrast / metaphor / innovation / colorCommit;tension / techCraft 需结合布局手法判读。

### 迭代判据

- 每轮截图后自问:"一打开 wow 了吗?" → 否,继续下一轮
- ≤3 轮(边际递减);3 轮后仍不平庸 → 主题/审美轴可能要换(回到步骤 0)
- **不是所有 PPT 都要打磨到惊艳**(快速模式合格即可;发布会级/用户要求惊艳才跑打磨)

### 与两阶段的关系

- 阶段①(生成视觉种子)后 → **打磨种子 DNA**(种子 DNA 要惊艳,因为复用基底)
- 阶段②(扩展 PPT)后 → **轻打磨**(内容填充后微调,不重做 DNA)
