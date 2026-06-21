# 验证脚本与门禁完整参考

> 本文件是 SKILL.md 「验证」节的完整展开。SKILL.md 只保留「三层 + 指针」摘要，所有脚本清单、阻断条件、门禁对照、覆盖映射在此。
>
> 配套流程上下文见 `pipeline-phases.md`，画布/溢出启发式见 `visual-check.md`。

## 三层验证心智模型（必记）

| 层 | 脚本 | 性质 | 失败处置 |
|---|---|---|---|
| **地板（合规）** | `grade-gate.js` 全绿（十门禁 G1-G10 合一） | 硬约束、机器判、不可人工放行 | 任一红灯 → 回 P5 重生成 |
| **天花板（设计强度）** | `design-strength-check.js` 四维（尺度/用色/张力/隐喻） | advisory（退出码恒 0），但任一维不达标 = 回炉重做骨架，**不是微调** | 退化信号：全 deck display ≤2.5em、无满版色块面板、全是通用卡片 |
| **元素级天花板** | `element-quality-check.js` 四子分（动画/图标/表格/流程图） | advisory，子分 ≥70 达标 | emoji 当图标 / 图标不主题跟随 / 表格违反 data-ink |
| **视觉语义评审** | `visual-verdict.js`（截图 + 视觉模型 + JSON verdict） | 模型辅助；抓固定脚本盲区 | blocker → 回 P5；无 key 只能 `--dry-run`，必须报告未执行模型判定 |

**关键认知（防止合规驱动退化）**：门禁是地板，设计强度是天花板，两者**不可互替**。当通过某门禁似乎要削弱设计时（如「满版面板怕对比度不足 → 干脆不做面板」），**正解是找一个既大胆又合规的选择**（深化专色到 AA / 用 `var(--c-fg)` 反相面板），**不是把设计改弱来求合规**。把数字软化为「约/持平」来躲 G5 证据门禁 = 失败；正解是保留真实数字 + 加 source label。参见 `design-fundamentals.md` §6。

**但满足地板不是目标**：一个 deck 可以零门禁违规却四维全默认（合规但平庸）。

## 十门禁（G1-G10，grade-gate.js 合一）

`grade-gate.js <file>` 一次跑完十门禁，退出码 1 = 任一红灯，**机器判 verdict，禁止人工放行**（案例：v15.0 把「15 页」压成 12 页时主观放行导致翻车）。

| 门禁 | 脚本 | 检查 | 阻断条件 |
|------|------|------|----------|
| **G1** | `lint-design.js` | P0/P1/P2 设计规则 + impeccable 禁令 | 退出码 1 = 存在 P0 违规 |
| **G2** | `validate.js` | Playwright 溢出检测 + 截图 | 输出 `total > 0` = 真实布局溢出 |
| **G3** | `test-label-overlap.js` | 标签互相重叠 + 跨 slide 泄露 | 退出码 1 = 标签跨 slide 泄露（section 非 positioned → pin 相对 BODY 全叠视口）或互相重叠 |
| **G4** | `test-lint-main-claim.js` | 主命题进场（pin/页码不能承担本页唯一主题） | 退出码 1 = pin/页码/脚注承担本页唯一主题（主视觉区缺少等价主张） |
| **G5** | `test-evidence-ledger.js` | 证据台账（精确数字必须有标签） | 退出码 1 = 精确数字缺少 `verified` / `user-provided` / `illustrative` 标签 |
| **G6** | `test-color-role.js` | 颜色角色（**相对**层级：主命题对比度必须高于 pin/页脚，OKLCH L 近似亮度） | 退出码 1 = 主命题对比度弱于 pin/页脚文本 |
| **G7** | `test-contrast-aa.js` | **绝对** WCAG AA（真 oklch→sRGB 相对亮度，遍历祖先 bg，大字阈值） | 退出码 1 = 文本 <4.5:1 / 大字 <3:1 |
| **G8** | `test-canvas-fill.js` | section 占满画布（对齐 visual-check 画布一致性） | 退出码 1 = section 未占满画布（内容高度矮盒 / 页间画布不一致） |
| **G9** | `check-overflow.js` | Playwright bbox 溢出/叠放专项：①文本越右界 ②元素越画布 ③时间线文字压条 ④**元素内文字溢出父容器**（`scrollWidth > clientWidth` + 父容器有显式宽度约束，抓 terminal/code/span 等 inline 文字越界；纯感官类如黑字黑底、装饰盒压 page furniture 留给 visual-verdict） | 退出码 1 = bbox issueCount > 0 |
| **G10** | `test-spatial-integrity.js` | proof object 与物理表面坐标系一致；读取 `template-invariants.json` 的 `physicalContract`；页标/北向标/pin 不压关键对象；图纸尺寸链对齐外墙；SVG `<text>` 不被 viewport 裁切、不继承可见描边；数据图曲线不使用易反射失真的 `T` 命令 | 退出码 1 = surface containment / physicalContract drift / page-label frame collision / north-mark heading collision / pin-object collision / plan aspect drift / dimension-wall mismatch / marker-label collision / SVG text clipping/stroke / data-curve smooth-T |

**G6 vs G7 分工**：G6 是**相对**层级检查——主命题对比度必须高于 pin/页脚，保证「最重要的事最醒目」；G7 是**绝对** WCAG AA——任何文本对它的实际底色必须 ≥4.5:1（大字 ≥3:1）。两者互补、不可互替：G6 过了不代表无障碍达标（这正是 2.96:1 白字粉卡能绿过的原因），G7 补上这个洞。

## 完整脚本清单（按用途分组）

```bash
# 地板（合规）—— 交付前必跑，全绿才放行
node scripts/grade-gate.js <file>                      # 十门禁合一 = 合规地板
node scripts/grade-gate.js --json <file>               # JSON 输出（供 eval 框架消费）

# 天花板（设计强度）—— advisory，但任一维不达标回炉重做骨架
node scripts/design-strength-check.js <file>           # 四维主度量（尺度/用色/张力/隐喻）+ contentSpecificity 子分（盯数字软化）
node scripts/design-strength-check.js <file> --golden <ref.html>   # 与金标准 deck 对比（回归守卫）
node scripts/element-quality-check.js <file>           # 元素四子分（动画/图标/表格/流程图）

# 设计规则 —— G1 的底层
node scripts/lint-design.js <file>                     # P0/P1/P2 设计规则 + impeccable 禁令
node scripts/lint-design.js <file> --verbose            # 含 P2 建议 + 精致度

# 溢出 —— G2 的底层
node scripts/validate.js <file>                         # Playwright 溢出检测 + 截图
node scripts/validate.js <file> --fix                   # 检测 + 自动修复 + 重检

# 十门禁单项（grade-gate 内部调用，也可单独跑）
node scripts/test-pin-collision.js <file>               # Pin/水印与正文重叠检测（失败门禁 #13）
node scripts/test-label-overlap.js <file>               # 标签互相重叠 + 跨 slide 泄露（G3）
node scripts/test-lint-main-claim.js <file>             # 主命题进场门禁（G4）
node scripts/test-evidence-ledger.js <file>             # 证据台账门禁（G5）
node scripts/test-color-role.js <file>                  # 颜色角色门禁（G6）
node scripts/test-contrast-aa.js <file>                 # 绝对 WCAG AA 对比度（G7）
node scripts/test-canvas-fill.js <file>                 # section 占满画布门禁（G8）
node scripts/check-overflow.js <file>                   # bbox 溢出/叠放专项（G9）
node scripts/test-spatial-integrity.js <file>           # 表面坐标系 / SVG text 裁切/描边 / 数据曲线 T 命令门禁（G10）

# 视觉评审 —— 逐页人工审阅（非机器门禁）
node scripts/visual-qa.js <file> --out /tmp/<deck>-visual
node scripts/visual-qa.js <file> --show-fragments --annotate-overflow --out /tmp/<deck>-visual-all
node scripts/visual-verdict.js <file> --out /tmp/<deck>-verdict  # LLM 视觉语义评审：图示不清/标签不可读/图表不解释主张
node scripts/visual-verdict.js <file> --dry-run                  # 无 key 时生成同一套截图+prompt，不等于通过
node scripts/visual-check.js <file>                      # 布局平衡启发式：重点重心/跨度/画布一致（非阻断；和 visual-qa 冲突时信 visual-qa）
node scripts/test-initial-slide-visible.js <file>        # fragment 首屏门禁

# 发布会级与契约
node scripts/test-launch-grade-contract.js              # 发布会级 skill 规则 + golden reference
node scripts/test-reference-contract.js                 # 种子模板对象契约（失败门禁 #11）
node scripts/lint-reference-docs.js                     # 参考文档代码示例自查（禁止负 tracking/vw-vh/Tailwind indigo）
```

**阻断含义汇总**（任一触发都不能交付）：

| 脚本 | 阻断条件 |
|------|----------|
| `grade-gate.js` | 退出码 1 = 十门禁任一红灯（机器判，不可人工放行） |
| `lint-design.js` | 退出码 1 = 存在 P0 违规 |
| `validate.js` | 输出 `total > 0` = 真实布局溢出 |
| `test-pin-collision.js` | 退出码 1 = Pin 与正文重叠 |
| `test-label-overlap.js` | 退出码 1 = 标签跨 slide 泄露或互相重叠 |
| `test-lint-main-claim.js` | 退出码 1 = pin/页码/脚注承担本页唯一主题 |
| `test-evidence-ledger.js` | 退出码 1 = 精确数字缺少 verified / user-provided / illustrative 标签 |
| `test-color-role.js` | 退出码 1 = 主命题对比度弱于 pin/页脚文本 |
| `test-contrast-aa.js` | 退出码 1 = 文本低于 WCAG AA（正常 <4.5:1 / 大字 <3:1） |
| `test-canvas-fill.js` | 退出码 1 = section 未占满画布 |
| `check-overflow.js` | 退出码 1 = bbox 溢出、右界截断或时间线叠放 |
| `test-spatial-integrity.js` | 退出码 1 = proof object 漂出承载面、physicalContract 违约、页标/北向标/pin 压关键对象、SVG 文字被 viewBox 裁切或继承描边、数据图使用 `T` 平滑曲线 |
| `test-reference-contract.js` | 退出码 1 = 种子模板对象契约被破坏 |
| `lint-reference-docs.js` | 退出码 1 = 参考文档代码示例违反 SKILL.md 硬规则（P0 阻断，P1 建议） |
| `visual-qa.js --annotate-overflow` 截图 | 红框标注页 = 溢出需修；残影/裁切/按钮污染/主标题弱化 = 回 P5 修 |
| `visual-verdict.js` | 退出码 1 = 视觉模型判定存在 blocker；退出码 2 = 未配置/调用失败，不能声称已通过视觉语义评审 |

## 各模式最低验证要求

| 模式 | 地板 | 天花板 | 视觉评审 |
|------|------|--------|----------|
| **快速模式** | `grade-gate.js` 全绿（必跑） | `design-strength-check.js` 四维达标（必跑） | ≥12 页、含密集数据/图表、或视觉结构调整时加跑 `visual-qa.js --annotate-overflow`；图表/图示页建议 `visual-verdict.js` |
| **专业模式** | P4 生成后立即跑 | P5/P6 跑 | P6 必跑 `visual-qa.js --annotate-overflow --show-fragments`；有模型 key 时必跑 `visual-verdict.js` |
| **发布会级** | 必跑 | 必跑 + `--golden` 对比 | 必跑逐页截图审阅 + LLM `visual-verdict.js` + PPTX 导出证明 + `test-launch-grade-contract.js` |

**调垂直平衡时**：`visual-check.js <file>` 报每页重点重心/跨度/画布一致性（启发式，**非阻断**）。它和 visual-qa 分工不同，冲突时信 visual-qa。指标解读、可接受取舍与假阳性见 `visual-check.md`。

**视觉语义盲区**：固定脚本只能稳定抓几何事实；当问题是“图示不知道在表达什么”“文字合法但读不清”“图表不解释 action title”时，跑 `visual-verdict.js`。它使用同一套截图与固定 rubric，把视觉模型输出保存为 `visual-verdict.json`。`--dry-run` 只证明截图和 prompt 已生成，不代表模型判定通过。**但若有视觉的会话模型（opus/sonnet）在场，可 Read dry-run 截图 + 按 rubric 判定，等价 visual-verdict 但用 Claude 视觉代替外部 API**——第 5 层在任何有视觉的 Claude Code 会话都可用，不必依赖外部 key。

## impeccable 审计覆盖映射

`/impeccable audit` 查的设计维度，哪些已被我们的门禁自动化、哪些仍是人工/建议：

| impeccable 规则 | 我们的覆盖 | 状态 |
|---|---|---|
| `low-contrast`（绝对 WCAG） | **G7 test-contrast-aa.js**（真 oklch→sRGB 亮度、大字阈值、祖先 bg 遍历） | 机器门禁 |
| `gradient-text` / `side-tab` / `over-rounding` / `ghost-card` / `gpt-thin-border` | lint-design.js（impeccable 禁令） | 机器门禁（G1） |
| `text-overflow` / `clipped-overflow` | validate.js | 机器门禁（G2） |
| `surface/proof-object drift` / `physicalContract drift` / `page-label frame collision` / `north-mark heading collision` / `pin-object collision` / `marker-label collision` / `svg text clipping/stroke` / `data curve smooth-T` | test-spatial-integrity.js | 机器门禁（G10） |
| `unclear-proof-object` / `unreadable-label` / `chart-does-not-explain-claim` / `weak-visual-hierarchy` | visual-verdict.js | LLM 视觉语义评审（专业/发布会级阻断，快速模式需报告） |
| `numbered-section-markers` / `dark-glow` | 幻灯片场景假阳性（章节索引合理 / 雷达·舞台光束是主题 voice） | 显式忽略 |
| `gray-on-color` / `flat-type-hierarchy` / `overused-font` / `cramped-padding` / `tight-leading` | 未自动化 | 人工建议（跑 `/impeccable audit` 补盲区） |

**可选 AI-tell 复查**：`node .agents/skills/impeccable/scripts/detect.mjs --json <file>` 补 lint 盲区（side-tab、em-dash overuse）。⚠️ detect 为 web 设计，演示场景部分命中是**假阳性**——`numbered-section-markers`（章节索引是合理用法）、`dark-glow`（雷达/舞台光束是主题 voice）通常忽略；只关注 side-tab、em-dash overuse 等真问题。

## 评估框架集成

eval runner 用 `grade-gate.js --json` 的 `passed` 字段作为客观断言——`passed: true` 仅当十门禁全部通过。禁止 grader 用主观判断覆盖机器 verdict（v15.0 把「15 页」压成 12 页时曾因主观放行翻车）。

如果未执行验证，在最终回复中**明确说明**。
