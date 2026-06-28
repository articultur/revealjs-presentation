# Off-Template Style Gap Contract

> 当内容不属于现有 template 覆盖范围时,不要找最近模板硬套。先承认 style gap,再补齐「内容语义 + 风格 token + layout archetype + 验证问题」四件套。

## 目标

PPT 服务于内容,不是内容服务于模板。模板外内容的高质量输出必须同时满足四件事:

1. **有设计感和视觉冲击力**:尺度、用色、张力、隐喻都做了明确选择。
2. **没有排版硬伤**:文字、图标、图片、pin、标签、图表、proof object 无重叠、超框、裁切、低对比或坐标漂移。
3. **主题与内容匹配**:视觉系统来自主题的现实隐喻和 proof object,不是行业关键词或最近模板外观。
4. **可验证交付**:单文件 Reveal.js HTML、可编辑 PPTX 导出、`grade-gate` 全绿、`design-strength` 达标、视觉 QA 无 blocker。

## 判定 Style Gap

满足任一条件即进入 style-gap 路径:

- 主题不属于现有 9 个 seed template 的动作形状。
- 主题属于某个形状,但该 seed 的现实隐喻会误导内容。例如临床试验不应被包装成普通 editorial,法律案卷不应被包装成 dark-tech。
- 用户给了明确风格/品牌/参考图,但现有 token 或 layout 只能覆盖表层颜色字体。
- 去掉颜色和字体后,页面结构可以用于任意主题,没有该内容独有的对象。
- visual-verdict 或人工审阅指出「风格冲突 / 内容被硬塞进模板 / 图像或版式不解释主张」。

## 四件套扩展

Style gap 不是只加 token。必须形成一个可执行 bundle:

| 件 | 必须产物 | 作用 | 验证问题 |
|---|---|---|---|
| 1. Inspiration case | 从 `references/inspiration/` 选择 1-2 个 case;没有则新增一条文字拆解 | 让生成见过该风格的满分样片 | 这个 case 的技法是否真的解释本内容,而不是只好看? |
| 2. Token primitive | 选择或新增 `tokens/<style>.css` | 提供颜色、字体、背景材质、强调色角色 | 浅底/深底文字是否 AA? 字体 fallback 是否安全? |
| 3. Content rewrite | 重写 action title、标签、proof object 语言 | 让文案语义进入该主题媒介 | 每页是否有一个内容原生的 exhibit,而不是 bullet? |
| 4. Layout archetype variants | 从 A1-A12 组合并至少发明 1 个主题变体 | 让版面结构服务内容 | 去色去字体后,这页是否仍属于这个主题? |

缺任一件都不能声称「模板外高质量」。token 只能换肤;content rewrite 和 layout variant 才能让主题成立。

## 输出合同

进入 style-gap 路径时,Theme-to-Design Router 必须额外输出:

```text
Style gap: 是/否;原因:____。
参考样片:____ / ____;借用技法:____。
Token:使用 ____;如新建,说明 AA 配对和字体 fallback。
内容语义改写:____(action title / label / proof object 如何改成主题语言)。
Layout 变体:____(A# 基础 + 本主题改造点)。
不和谐风险:____(最可能重叠/超框/错配的对象与验证命令)。
```

## 通过线

模板外 deck 交付前最低通过线:

- `node scripts/grade-gate.js <file>` 全绿。
- `node scripts/design-strength-check.js <file>` qualityScore >= 75,且四维没有明显退化。
- `node scripts/visual-qa.js <file> --annotate-overflow --out <dir>` 产出逐页截图,无可见重叠、裁切、按钮污染、主题错配。
- `node scripts/visual-verdict.js <file>` 无 blocker;无 key 时必须 `--dry-run` 并由有视觉能力的会话模型按同一 rubric 判定,否则最终说明未执行视觉语义判定。
- 图像驱动或照片 proof deck 必跑 `node scripts/audit-image-assets.js <file>`。
- PPTX 导出合同通过:HTML 内联 `pptxgenjs` 与 `scripts/export-pptx-client.js`,或相应 export contract 测试通过。

## 失败处置

- `grade-gate` 失败:先修硬伤,不可主观放行。
- `design-strength` 不达标:回炉重做骨架,不要只微调字号颜色。
- 视觉 verdict 指出错配:回到四件套,优先修 content rewrite 或 layout variant,不要继续换 token。
- 图片廉价/错配:换图、换图像角色或改为非图像 proof object。
