# Deck Manifest v1

`deck.manifest.json` 是内容、设计路由、媒体、证据、动效与交付状态的唯一可编辑真相。

## Ownership

- Agent 负责初始内容规划、route、archetype 和 props。
- 工作台只允许修改 schema 公开字段。
- HTML、PPTX、截图和 QA 报告都是 manifest 的派生产物。

## Compatibility

- 旧 `deck.json` 继续由 `generate-deck.js` 接受。
- 新工作台、run manifest、严格证据链和 fidelity report 只支持 `manifestVersion: "1.0"`。

## Mutation rule

任何编辑都先原子写回 manifest，再重新渲染 HTML；禁止把浏览器 DOM 当作持久状态。

## 字段语义

- `manifestVersion`: `"1.0"`,迁移期唯一承诺版本。
- `deckId`: 小写 kebab-case,3-64 字符,跨 run 稳定标识。
- `route.path`: `"A" | "B" | "C"`,与 `scripts/route-deck.js` 三路径一致;`route.wow` 对应惊艳轴。
- `slides[].archetype`: `A1-A12 | IMG`,与 `references/layout-registry.json` 一致(后续 Task)。
- `slides[].contentType`: 映射到 `scripts/content-router.js` 的 content_type。
- `slides[].proofObject.claim`: 每页主命题,空 = 验证失败。
- `slides[].evidence[]`: 精确数字的证据链;`status` 分级见 `references/validation.md`(Task 9 升级为严格来源)。
- `slides[].motionIntent`: `none | fragment | loop | count-in | draw | grow`,对应 `references/motion-delight.md`。
- `designBrief`(可选): 设计契约,人/LLM 在 authoring 期写;存在时八字段必须齐全(`scripts/check-design-brief.js::validateBrief`),生成器 pass-through 内嵌进 HTML(`<script id="design-brief">`),供 qa.js 的 design-brief / arc-adherence 门禁校验。缺省 = 机器路径产物无 brief,QA 设计门禁会 fail(交付级 deck 应始终携带)。

## 迁移

`scripts/deck-manifest.js::manifestToGeneratorInput(manifest)` 把 manifest 转成现有 `generate-deck.js` 接受的 legacy input,保留旧生成器不变。
