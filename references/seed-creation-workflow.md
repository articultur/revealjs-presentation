# 种子沉淀 Workflow · Seed Case Creation

> **定位**:**`design-generation-workflow.md`(B 解法)的子流程**。B 解法生成任意主题的有设计感 deck(核心能力);本 workflow 管"**生成后要不要沉淀为可复用种子 case**"(可选,主题会复用时才跑)。
>
> **deck 生成走 `design-generation-workflow.md`**(审美意图 + 外部大师 + 审美推导 + 减法 + 打磨)。本 workflow 只管沉淀:诊断要不要沉淀 → 6 维验收(事后)→ case 记录 → 独立 reviewer → 注册 voice primitive(可选)。

## 什么是"好主题"(值得为之造种子的主题)

好主题 = 在现实世界有**可识别视觉文化**的主题。判据:
- 该主题在书籍/电影/行业报告/艺术品/博物馆藏品中有 **≥5 个反复出现的视觉元素**可调研
- 去掉文字,视觉本身能让人 3 秒认出主题

**反例(不值得造种子)**:"通用商务汇报 / 季度总结 / 述职"——没有独特视觉文化,用通用 deck 即可,强行造种子反而换皮。

> 即:先判主题"有没有视觉文化",再决定造不造。不是所有主题都该有专属种子。

## 创建 Workflow(7 步,步骤 0-6,可执行)

### 0. 诊断(要不要造)
- 跑 `node scripts/voice-router.js "<主题>"`。
- 命中种子(`matchType: seed`)→ **用种子,不造**。
- 命中 voice(`keyword/dimension/mood`)→ 评估该 voice 是否够精致(过 6 维?);够则用,不够走创建。
- 兜底 `editorial` + 主题有视觉文化 → **走创建流程**。

### 1. 生成 deck:走 B 解法(`design-generation-workflow.md`)

**deck 生成本身走 B 解法**(审美意图先行 + 外部大师参考禁 template + 审美推导 + 减法 + impeccable 打磨),完整 7 步(步骤 0-6)见 [`design-generation-workflow.md`](design-generation-workflow.md),此处不重复。

本 workflow 关注生成**之后**的沉淀(下面步骤 2-6)。

### 2. 6 维生成(按 `seed-quality-standard.md`)
| 维 | 做什么 |
|---|---|
| ① 签名原语 | 从调研的视觉元素里选 ≥1 个,做成 HTML/CSS 组件,**去色后仍辨识** |
| ② 多色系统 | 主 accent + ≥1 角色副色(warn/alarm/ctrl)+ ≥2 层 elevation(反查现有种子撞车线) |
| ③ 主题原生组件 | ≥3 个从主题现实隐喻抽的组件(不是通用卡片),≥1 主题独有 |
| ④ 字体三元组 | display+body+mono,grep 现有 10 种子**不撞车**,每个有主题理由 |
| ⑤ 材质纹理 | ≥1 可命名材质(纸纹/网格/扫描线/压暗),≥3 页共享 |
| ⑥ 内容词表 | ≥10 主题术语,从该主题专业书/报告直摘(不造词),含 verified/illustrative |

### 3. 四重验证(不通过不沉淀)
- **去色测试**:`* { filter: grayscale(1) }` 后,3 秒能认出主题?(签名/组件/材质承载,不靠配色)
- **词表测试**:让 domain expert(或自查)看术语准不准?(如 clinical 的 RECIST/ITT/mPFS 是否用对)
- **撞车测试**:`node scripts/check-seed-collision.js references/seed-gallery/<theme>/seed.html`(字体零撞车=维④硬约束,exit 0;色相近似=warning 人工判基调)。替代手工 grep 字体表(表易过期)。
- **版面碰撞测试**(吸收 canonical template 缺陷教训):`node scripts/test-text-collision.js seed.html` + `node scripts/test-pin-collision.js seed.html` 全 exit 0。10 canonical template 曾因没强制跑这俩暴露 text-collision / pin-collision 缺陷(详见 `references/failure-gates.md`「任何 collision 报告视为阻断项」)——新种子不能继承"有碰撞缺陷"的标杆。
- **门槛脚本**(自动化部分):`node scripts/check-seed-quality.js references/seed-gallery/<theme>/seed.html`——`--c-*` 自定义色 token ≥8、签名 class ≥3 个全仓唯一、`<style>` ≥200 行、字体三元组(display/body/mono)声明,逐项 PASS/FAIL,FAIL exit 1(同名 class 碰撞 = warning 人工判,不硬拦现存标杆)

### 4. 沉淀(关键——记录过程,不只产物)+ 可路由注册

三份产物,缺一不可:
- **case study**(记录创建过程)→ 存 `references/seed-gallery/<theme>/case.md`,用下方模板
- **种子 deck**(DNA 载体)→ 存 `references/seed-gallery/<theme>/seed.html`(完整 DNA:独立字体三元组 + 签名原语 + 材质)
- **可路由元数据**(打通"沉淀 → 复用"闭环)→ 在 `tokens/seed-cases.json` 加一条(name / keywords / dimensions / dna 摘要 / casePath / deckPath)。这是 `voice-router.js` 命中 case 的唯一入口——**不注册 = case 不可路由 = 沉淀失败**(未来相似主题无法命中复用,等于白沉淀)。

**撞车机器闭环(注册前必跑)**:
```
node scripts/check-seed-collision.js references/seed-gallery/<theme>/seed.html
```
- 字体零撞车(维④ 硬约束)= exit 0;有撞车 = exit 1(必须改字体三元组)
- 色相近似(case 间 <15°)= warning(人工判整体基调是否撞,见 design-generation-workflow 步骤 5)
- 替代了过去靠人 grep + 人读 SEED-CASE-INDEX 字体占用表(表易过期)

**注册一致性闭环(注册后必跑)**:
```
node scripts/check-seed-quality.js --registry
```
- 验 `tokens/seed-cases.json` 每条 ↔ `SEED-CASE-INDEX.md` 有对应行 ↔ casePath/deckPath 文件存在;反向查"INDEX 提到 / 磁盘有产物但没注册"(= 沉淀失败:不可路由)。不一致 exit 1。

> **层次区分(重要)**:case(完整 DNA,独立字体三元组)进 `seed-cases.json`;voice primitive(tokens/*.css,配色肤色,共享 fontPool 字体池)进 `voices.json`。两者正交——case 是参考 DNA(走 B 解法参考决策),voice primitive 是配色肤色(走 generate-deck 管线注入)。**不要把 case 塞进 voices.json**:`build-voice-tokens.js` 的 fontPool 让所有 voice 共享字体栈,塞进去会丢 case 的独立字体 DNA。

### 5. 自动化(累积,越用越强)
- workflow 是可执行流程(Claude 按上面 7 步跑),不靠人工灵感。
- **case 库累积**:每次创建沉淀一份 case。未来遇到相似主题,先翻 case 库(复用/变异),不用从零调研。
- 遇全新领域:诊断不覆盖 → 调研 → 6 维 → 验证 → 沉淀新种子 + 新 case → 库变厚。

### 6. 独立 reviewer(注册前必跑,authoring/review 分离)

设计者自评会漏——蒸汽波首次实践证明:作者自报"em-dash/side-tab 已修"实测**未修**,且漏了 glitch-text CSS bug(动画 92% 失效)。所以种子注册进 skill 前,必须两道独立审查(不信 case.md 自评):

- **code-reviewer / verifier agent**(验 6 维质量):独立跑 6 维 audit + 门槛脚本(`check-seed-quality.js`),验签名去色辨识、字体 grep 零撞、`--c-*` 数/style 行数/签名 class 唯一。
- **impeccable**(验 AI-tell):跑 side-tab/em-dash/numbered/overused-font 检测,验作者**真修了**(不只自报)。
- **两者互补**:reviewer 验质量 6 维,impeccable 验 AI tell。双通过才注册。
- 蒸汽波首次实践结果:reviewer APPROVE-WITH-NITS(抓 N1 CSS bug,作者漏);impeccable 实测 side-tab/em-dash 未修(自报不准)。→ 强化 reviewer + impeccable 双检必要。

## case study 模板(每次创建必填)

```markdown
# <主题> 种子创建 case · <日期>

> 主题转向:____(本 case 相对现有种子/template 的位置;禁读 examples/template-*.html)

## 诊断
- 主题形状:____
- voice-router 结果:____(seed/voice/fallback)
- 为什么需要新种子:____(现有不覆盖 / 视觉文化独特)
- category-reflex 默认路径:____(LLM 看见该主题的 slop 默认);本次走相反方向:____

## 审美意图三件套(减法,先于生成)
- 一个具体情绪(不是泛主题):____
- 一个签名时刻(满版巨字 / 极端留白一句主张 / 震撼 proof):____
- 一个极端对比(尺度 ≥5:1 / 明度 / 密度):____

## 外部大师参照来源表(≥5 来源,必填;每条带 URL + 证据等级)
| # | 来源(作品/大师/出版物) | URL | 证据等级 | 签名元素 | 为什么美 |
|---|---|---|---|---|---|
| 1 | ____ | ____ | A/B/C | ____ | ____ |
| 2 | ... | | | | |

证据等级:A=本会话 web fetch 真实作品 / B=训练先验+可追溯公共源 / C=主观。没用户锚点必须 web search 提到 A 级(见 design-generation-workflow 步骤 2)。
**严禁参考的来源**:____(Tailwind/Dribbble 通用套路 / 会撞车的现有 template)

## 审美推导"为什么美"(不只列元素)
- 为什么"<元素组合>"传达<情绪>:____(拆构图/配色/留白/情绪的审美判断,内化不抄元素)

## 6 维设计决策(每个写"为什么")
- ① 签名原语:____ —— 为什么这个承载主题:____
- ② 多色:主____ 副____ —— 角色理由:____;反查不撞:____
- ③ 主题组件:____ —— 隐喻来源:____
- ④ 字体:____ —— 主题理由:____;反查不撞现有:____
- ⑤ 材质:____
- ⑥ 词表:____ —— 从<哪本专业书/报告>摘

## 不像任何现有 template / seed 的理由
| 现有 template / seed / token | 不像的理由 |
|---|---|
| ____ | ____ |

去色去字体后仍独有:____

## 打磨决策(impeccable bolder / overdrive / polish)
- 放大的签名:____
- 色彩/材质/细节决策:____
- 迭代记录(每轮问题 → fix):____

## 验证证据
- 去色测试:____(grayscale 后描述/截图)
- 词表测试:____
- 撞车规避:远离 ____(现有种子)
- check-seed-quality.js:____(逐项 PASS)
- check-seed-collision.js:____(exit 0)
- test-text-collision / test-pin-collision:____(全 exit 0)

## 复用指引(给未来类似主题)
- 相似主题(____)可复用:____ / 需变异:____
```

## 与现有文档关系

- `seed-quality-standard.md`:6 维**标准**(验收尺,答"什么叫好种子")。本 workflow 答"怎么造出好种子"。
- `style-space.md`:voice 库(固定集 + 速查)。本 workflow 是"扩库的 meta 能力"。
- `off-template-style-gap.md`:四件套(单次适配)。本 workflow 是四件套的**系统化 + 可记录版**(每次四件套沉淀成 case,不再一次性)。
- `seed-gallery/` 已沉淀 case(tcm-herbal / astronomy-nebula / astronomy-monument,各有 `case.md` + `seed.html`):种子创建实证(标准的依据,原 `research/seed-analysis.md` 已丢失)。

## 调用时机

- 用户新主题 voice-router 兜底 editorial + 主题有视觉文化 → 跑本 workflow
- 现有 voice 被反馈"平淡"(如本次 cyberpunk→technical)→ 跑本 workflow 重造该 voice 为合格种子
- 用户明确要"造一个 X 风格的板式"且 X 不在库 → 跑本 workflow
