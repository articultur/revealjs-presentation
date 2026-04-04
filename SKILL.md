---
name: revealjs-presentation
description: Create stylized reveal.js presentation decks when the user asks for PPT, slides, keynote-style decks, talk decks, courseware, pitch decks, or HTML presentations with a strong visual direction. Also handles first-time setup and initialization — use when the user says "setup", "初始化", "帮我安装依赖", "check dependencies", "is this ready", or "run setup". Use it for requests like "做一个有设计感的 PPT", "生成演示文稿", "create slides from this outline", "make a stylish presentation", "build a deck for a talk", or when the user provides a topic, outline, audience, and desired tone.
---

# Reveal.js Presentation

Use this skill to produce presentation-quality slides with a clear visual identity, not generic AI decks. The primary output is a single runnable `reveal.js` HTML file that can be presented in browser and exported to PDF.

## Setup

Run this when the user says "setup", "初始化", "帮我安装依赖", "is this ready", "check dependencies", or any equivalent.

Steps:

1. Run `bash scripts/setup.sh` in the terminal from the skill root directory
2. Report the output back to the user verbatim
3. If setup exits with errors, explain what is missing and what the user needs to do
4. If setup exits cleanly, confirm the skill is ready and show the example trigger phrase:
   > 做一个有设计感的 PPT，主题是 X，受众是 Y，页数 8 页，输出 reveal.js

Do not skip this section when the user's intent is clearly about initialization, even if they also mention a topic.

## Dependency Stack And Role Boundaries

This skill depends on two external resources that must each be set up separately:

### 1. pbakaus/impeccable (required for visual quality)

`impeccable` is a skill repository — not an npm package. It ships a `frontend-design` skill with 7 reference files and 20 design commands (`/audit`, `/polish`, `/critique`, etc.) that guide the AI toward better visual decisions.

**One-command install (recommended):**

```bash
npx skills add pbakaus/impeccable
```

The `skills` CLI auto-detects your AI tool (Claude Code, VS Code Copilot, Cursor, Gemini CLI, Codex CLI, etc.) and copies the files to the correct path automatically.

To update later:

```bash
npx skills update
```

Alternative (manual): visit [impeccable.style](https://impeccable.style/), download the ZIP for your AI tool, extract to your project or home directory.

Once installed, this skill's design steps automatically benefit from impeccable's `frontend-design` context.

### 2. reveal.js (loaded from CDN — no installation)

The generated HTML loads reveal.js directly from `cdn.jsdelivr.net`. Users do not need to install anything. Opening the HTML in a browser with internet access is sufficient.

If you need to work offline or run a local server, `npm run bootstrap` installs reveal.js locally. The local copy is used only by `npm run start` (the dev server). It has no effect on the generated HTML.

### Responsibility split

- Visual quality and style distinctiveness: impeccable `frontend-design` skill + 20 design commands
- Slide runtime correctness and delivery format: this skill + reveal.js CDN

## Installation And Enablement (From Zero To Ready)

### First-Time Initialization

After placing this skill folder in the correct path, run setup once:

```bash
bash scripts/setup.sh    # works without Node.js for structure checks
npm run setup            # same, also auto-installs impeccable if Node.js available
```

Setup checks: impeccable installation, skill file structure. It prints a clear next-step summary and is safe to re-run.

Setup is a **one-time operation**. After it completes, no further initialization is needed — just open chat and start generating.

**Without Node.js:** install impeccable manually — visit [impeccable.style](https://impeccable.style/), download the ZIP for your AI tool, extract to `~/.claude/skills/` or `~/.agents/skills/`.

**reveal.js:** never needs installation — loaded from CDN in generated HTML.

### 1. Place The Skill In A Valid Location

Use one of the supported paths:

- Project scope: `.github/skills/revealjs-presentation/`, `.agents/skills/revealjs-presentation/`, or `.claude/skills/revealjs-presentation/`
- Personal scope: `~/.agents/skills/revealjs-presentation/` or `~/.claude/skills/revealjs-presentation/`

Hard requirements:

- Folder name must match frontmatter `name: revealjs-presentation`
- `SKILL.md` must exist at the skill root
- Asset references must use relative paths like `./examples/...`

Optional local dev setup (Node.js 18+ required):

- Run `npm run bootstrap` to install dev dependencies and run structure checks

### 2. Install impeccable Skill

Impeccable must be installed separately. It is a skill package, not an npm dependency.

Quick install:

1. Visit [impeccable.style](https://impeccable.style/) and download the ZIP for your AI tool
2. Extract to your project (project-scoped) or home directory (globally available)
3. Verify: type `/frontend-design` or `/audit` in chat — if the skill loads, impeccable is active

Without impeccable, visual quality defaults to the AI's baseline, which produces generic output.

Verification:

- `/audit` command is available in chat
- Generating a slide produces non-generic font choices and color restraint

### 3. Sanity Check Discovery

Trigger with phrases such as:

- "做一个有设计感的 PPT"
- "create stylish reveal.js slides"
- "根据这个大纲生成演示文稿"

If discovery fails, improve frontmatter `description` keywords before changing workflow logic.

## What This Skill Is For

- Turning a topic, outline, memo, or document into a polished deck
- Creating a deck with a specific mood such as editorial, dark tech, spatial minimal, vibrant gradient, or fresh natural
- Refreshing an existing reveal.js deck so it feels more distinctive and less template-like
- Building Chinese or bilingual slides with better typography than default web-slide output

## Default Output

Deliver one self-contained HTML presentation that includes:

- Reveal.js 4.6.x CDN links
- `Reveal.initialize(...)`
- A coherent color system and typography pair
- Complete slide `<section>` markup
- Speaker notes where helpful

If the user says "PPT", you can still use this skill unless they explicitly require `.pptx`. State that the deliverable is reveal.js HTML that can be presented or exported to PDF.

## Workflow

### 0. Beginner Mode Detection (Mandatory)

If user signals they are new, uncertain, or "just installed", switch to beginner mode.

Beginner mode rules:

- Ask for only four essentials: topic, audience, slide count, language
- Default to 6-10 slides if not provided
- Default to one template and avoid advanced transitions
- Keep each slide to one core message
- Always run validation and explicitly report pass/fail

### 1. Intake Brief And Intent

Before writing slides, quickly resolve these points from user context or by asking concise follow-up questions only if necessary:

- Topic and goal
- Audience
- Expected length
- Language
- Desired tone or visual direction
- Output constraint (`reveal.js` HTML only, or HTML plus PDF export guidance)

Decision point:

- If user explicitly requires `.pptx`, state limitation early and proceed with reveal.js HTML plus export-compatible structure.
- If user has no tooling knowledge, avoid optional technical branches and keep to the shortest runnable path.

If the user gives very little guidance, assume a concise deck with 6-10 slides and propose a style direction while proceeding.

### 2. Establish Visual Direction With Dependencies

Invoke `frontend-design` thinking first, then enforce impeccable-level consistency checks before content lock.

Decision point:

- If user gave a clear brand/style: adapt template and typography to that direction
- If user did not specify: propose one direction with rationale and proceed

Do not skip this stage. Most low-quality decks fail here, not in HTML syntax.

### 3. Pick a Style Direction

Choose one of the bundled templates as the base visual language:

- `examples/template-01-editorial-serif.html`: elegant, formal, editorial, serif-led
- `examples/template-02-dark-tech.html`: high-contrast, technical, product launch, modern
- `examples/template-03-minimal-spatial.html`: grid-based, spacious, architectural, explanatory
- `examples/template-04-vibrant-gradient.html`: bold, energetic, creative, marketing-friendly
- `examples/template-05-nature-fresh.html`: soft, calm, light, internal sharing or education

Do not pick randomly if the user already hinted at a style. Match the template to the audience and message.

### 4. Shape the Narrative Before Writing HTML

Build the deck around a clean slide arc:

1. Cover slide
2. Context or problem
3. Core ideas or framework
4. Evidence, examples, or breakdown
5. Recommendation, summary, or call to action

Rules:

- One strong idea per slide
- Prefer short headings with clear hierarchy
- Split overloaded slides instead of shrinking everything
- Avoid turning every page into a card grid
- Use asymmetry, whitespace, and contrast to create rhythm

### 5. Generate The Deck

When creating or editing the HTML:

- Start from the chosen example template instead of writing from nothing
- Preserve the template's visual system and only adapt what the content requires
- Use CSS variables for colors, spacing, and typography
- Keep text left-aligned by default unless there is a strong reason to center it
- Use restrained motion: fade, stagger, slide-up, progressive emphasis
- Support `prefers-reduced-motion`

### 6. Keep It Distinctive

The deck should feel designed, not merely filled in. Prefer:

- Strong headline-to-body contrast
- Tinted neutrals instead of pure gray
- One main accent color with disciplined usage
- Intentional spacing changes across slides
- A few memorable slides with visual tension or surprise

Avoid:

- Interchangeable SaaS gradients everywhere
- Default font stacks unless constrained
- Pure black or pure white without tint
- Centering every element
- Nested cards and decorative glassmorphism
- Dense bullet walls

Read `references/design-principles.md` when you need color, typography, or anti-pattern guidance.

## Layout Guidance

Reach for these patterns first:

- Two-column comparison
- Big-number or statement slide
- Process flow
- Architecture overview
- Compact badge list
- Image-plus-argument split layout

Read `references/layout-patterns.md` when you need concrete layout snippets or overflow-safe structure patterns.

## Motion Guidance

Motion should support comprehension, not perform for its own sake.

- Use progressive reveal for steps, comparisons, and sequencing
- Favor `fade` page transitions
- Keep stagger timing subtle
- Reserve "delight" moments for 1-2 slides, not the whole deck

Read `references/motion-delight.md` when the presentation depends heavily on animation or stagecraft.

## Technical Rules

Read `references/technical-specs.md` when you need exact CDN imports, Reveal config, sizing, or CSS guardrails.

Always make sure:

- Slides fit within the viewport at presentation scale
- Flex and grid content can shrink safely
- Long text wraps instead of overflowing
- Code blocks and diagrams are sized conservatively

Decision points:

- If network access is stable: use CDN-based Reveal.js setup
- If network access is restricted: switch to local Reveal.js assets and avoid runtime dependency on external CDNs

## Validation

### 7. Validate Before Delivery

Validation requires only a browser. No installation needed.

1. Open the generated HTML file directly in a browser (double-click or `open yourfile.html`)
2. Step through every slide with arrow keys
3. Check for overflow, awkward scale, and animation issues

Automated browser validation (headless Playwright):

```bash
node scripts/validate.js <HTML文件>      # 检测溢出并截图
node scripts/validate.js <HTML文件> --fix  # 检测 + 自动修复 + 重新验证
```

手动验证（备用）：
1. 双击 HTML 文件在浏览器中打开
2. 用方向键逐页检查
3. 检查溢出、比例失调、动画问题

If you did not validate in a browser, say so explicitly in the final response.

Decision points during validation:

- If overflow exists: run `node scripts/validate.js <file> --fix` to attempt auto-fix
- If auto-fix fails: apply targeted CSS fixes manually
- If animation harms readability: reduce stagger/transition intensity and re-check with reduced motion
- If visual quality drops after fitting content: split the slide instead of shrinking all typography

### 8. Deliverables And Handoff

Always provide:

- One runnable reveal.js HTML file (no installation required to view)
- Usage note: open file in any browser, arrow keys to navigate, `S` for speaker notes, `F` for fullscreen
- Export note: open `yourfile.html?print-pdf` in Chrome, then print to PDF
- Explicit statement on whether runtime validation was executed

For beginner mode, also include:

- One sentence "next step" instruction
- Troubleshooting hint if overflow or blank fonts are possible

Optional local server (only if `file://` causes security issues in browser):

- `npm run start` (requires Node.js 18+) → open `http://localhost:4173/yourfile.html`

## Design Pipeline (7 Phases)

执行 7 阶段顺序流程：

| Phase | 名称 | 类型 | 说明 |
|:-----:|------|:----:|------|
| P0 | 设计上下文 | ● 强制 | 确认设计风格、色彩、字体方向 |
| P1 | 需求+模板 | ● 强制 | 确认场景、时长、听众、选择模板 |
| P2 | 输出方案 | ◐ 条件 | 确认内容结构、视觉方向 |
| P3 | 设计评审 | ● 强制 | `/critique` 评审 + 优化方向 |
| P4 | 生成初稿 | ● 强制 | 生成 HTML 文件 |
| P5 | 优化迭代 | ● 强制 | 根据 slide 数量执行对应 skills |
| P6 | 最终检查 | ◐ 条件 | 溢出检测 + 截图验证 + 交付确认 |

**执行规则**：
- **● 标记**：必须完成，不可跳过
- **◐ 标记**：上下文已存在时可跳过
- **Gate 是 BLOCKER**：每阶段必须向用户展示输出，获得确认后才能进入下一阶段

### Gate 速查表

| Gate | 阶段 | 必须向用户确认的内容 |
|:----:|------|---------------------|
| 0 | 设计上下文 | 设计风格/色彩/字体方向 |
| 1 | 需求+模板 | 场景、时长、听众、模板选择 |
| 2 | 方案 | 内容结构、视觉方向 |
| 3 | 设计评审 | `/critique` 报告 + 优化方向确认 |
| 4 | 生成初稿 | HTML 文件路径 |
| 5 | 优化迭代 | 执行的 skills 列表和结果 |
| 6 | 最终检查 | Phase 6 检查报告 + 用户交付确认 |

**Phase 5 Tier 详情**：见 `references/pipeline-phases.md`

## Resource Map

- `examples/`: 5 个模板（editorial-serif, dark-tech, minimal-spatial, vibrant-gradient, nature-fresh）
- `references/design-principles.md`: 颜色、字体、反模式
- `references/layout-patterns.md`: 布局代码示例、溢出处理
- `references/motion-delight.md`: 动画时序、缓动曲线
- `references/technical-specs.md`: CDN 配置、CSS 约束
- `references/pipeline-phases.md`: Phase 5 Tier 详情、Phase 6 完整执行步骤
- `scripts/overflow-detect.js`: 浏览器溢出检测
- `scripts/auto-fix-css.js`: CSS 自动修复
- `scripts/setup.sh`: 环境检查脚本

## PDF 导出

1. 在 Chrome 中打开 HTML 文件
2. 访问 `yourfile.html?print-pdf`
3. `Cmd + P` 打印
4. 选择"另存为 PDF"

## Success Criteria

A strong result from this skill should:

- Look intentionally designed on first impression
- Match the user's audience and tone
- Stay readable from a distance
- Avoid obvious template fatigue
- Be runnable as a reveal.js deck without layout breakage

Completion checks (must pass before done):

1. Discovery check: prompt intent clearly maps to this skill description
2. Dependency check: visual direction reflects `frontend-design` and impeccable-quality constraints
3. Technical check: reveal.js structure and initialization are valid
4. Readability check: no dense bullet walls and no critical overflow
5. Delivery check: handoff includes run/export instructions and validation status
6. Pipeline check: Gate 0-3 confirmed with user before Phase 4
