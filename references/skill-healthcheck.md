# Skill 健康体检报告 · 2026-07-22

> 由 `/skill-creator` 触发的整体体检。只诊断 + 随后做语义无损瘦身,不删任何防线。
> 方法:全文读取 SKILL.md(534 行)+ 33 references + 54 scripts,机器核对指针/计数/重复串。

## 一、体检总览

| 维度 | 状态 | 证据 |
|---|---|---|
| 指针完整性 | ✅ 健康 | 31 references + 22 scripts 引用**零死指针**;`seed-quality-standard.md` 在 L495 线索化引用 |
| 门禁命名一致 | ✅ 健康 | 全仓统一使用“十四门禁/G1-G14”,旧门禁计数残留由 `npm run test:doc-counts` 阻断 |
| references TOC | ✅ 健康 | 所有 >300 行 reference 都有目录标记 |
| description 触发 | ✅ 较强 | 1055 字,中英触发词全覆盖 + 负面边界(NOT for...),符合 skill-creator "pushy" 要求 |
| **SKILL.md 体积** | 🔴 超标 | 534 行 / 64KB,超 skill-creator 推荐(≤500 行) |
| **内容重复** | 🟠 偏重 | 操作细节在 SKILL.md 与 references 双写(见 §三) |
| **scar-tissue 堆积** | 🟠 根因 | 每次过往 bug 加防御段、无退出机制(见 §四) |

## 二、结构:最胖的段

| 段 | 行数 | 性质 |
|---|---|---|
| Theme-to-Design Router | 139 | 核心路由逻辑,应留 |
| 关键约束 §1–§9 | 86 | §1 的 19 行 CSS 坑大量与 references 重复 |
| 流程(模式/Phase/Gate) | 61 | 核心,应留 |

已有 78 处"详见 references"指针(渐进披露结构在位),但**摘要本身写得太密**,故 SKILL.md 仍 534 行。

## 三、重复冗余(按杠杆排序)

1. **visual-verdict 规则 ×10 处复述** — L24/83/162/244/351/448/454/459/461/463。L454 最完整,其余应收敛为指针。对应记忆 `[[analyze-image-vision-mcp-hallucination]]` `[[playwright-binary-gate-failures]]`。
2. **§1 输出形态硬约束(19 行 CSS 坑)** — deck-flex→`css-skeleton.md`;vw/vh→`technical-specs.md`;section reset margin-top→`layout-patterns.md` 等。双写。
3. **失败门禁速查表(L335–351,§1-15)** — 与 `failure-gates.md`(343 行)互补。**注:§1-15 是语义失败模式编号,≠ G1-G14 脚本门禁**,两套互补非重复,结构保留。
4. **设计规则 10 条硬规则** — 与 `design-polish`/`design-principles`/`design-fundamentals` 重叠。硬规则清单可留,细节指针化。
5. **动效段(~35 行)** — 与 `motion-delight.md`(734)互补,可压到 ~15 行。
6. **成功标准清单(20 行)** — 重述全文,可保留为最终 gate。

## 四、scar-tissue 堆积(根因)

密度来自**每次真实 bug 加一段防御**且无退出:

- `Gate 模式硬约束`(L87–100)+ 元规则自白 ← Claude 曾跳 Gate
- §1 字体 fallback / section reset ← 字形溢出(`[[glyph-overflow-detection-limit]]`)
- visual-verdict ×10 ← 幻觉 + 浏览器缺失
- G13/G14 ← 碰撞缺陷(`[[canonical-template-hidden-defects]]`)

**不是坏设计,是有效血泪防线**。当前问题是"把防线全文铺在入口",每次触发付全量 token。优化 = **集中权威定义 + 各处指针**,非删防线。

## 五、一致性 / 触发风险

- 🟠 **"8 套死模板"(L264)措辞过时**:现已是 10 套。改"死模板"。
- ✅ voice=14 / template=10 / archetype=A1-A12 计数全仓一致。
- 🟡 **张力**(非矛盾):快速模式自检(L24)说必跑 visual-verdict,而该脚本默认 opt-in 关 + 无 key exit 2 → 快速用户无 OPENAI_API_KEY 会直接 blocked。设计意图(防谎报),但快速模式可考虑 signoff 快通道。

## 六、本次执行的瘦身(语义无损)

| # | 动作 | 状态 |
|---|---|---|
| 1 | visual-verdict 收敛为 1 权威 + 指针 | 本次 |
| 2 | §1 CSS 坑下沉,留契约级硬约束 | 本次 |
| 3 | 动效段压缩至 ~15 行 | 本次 |
| 4 | "8 套"→"死模板" | 本次 |
| 5 | 失败门禁速查表(核查为互补两套,保留) | 不动 |
| 6 | description optimization loop(需 claude -p + 用户审 eval) | 待办 |

安全网:SKILL.md 改动前为 git 干净提交,`git diff SKILL.md` 可审,`git checkout -- SKILL.md` 可回滚。
