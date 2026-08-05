# Reveal.js 可编辑创作与可验证交付平台 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在保留现有 Reveal.js 单文件 HTML、A/B/C 路由、voice × archetype 设计空间和 G1–G14 质量门禁的前提下，补齐统一 Deck Manifest、浏览器编辑工作台、可复现素材链、PPTX 保真度报告和可核验事实证据链。

**Architecture:** 以 `deck.manifest.json` 作为唯一可编辑状态，CLI 生成器、浏览器工作台、媒体入库、QA 和 PPTX 导出都读取同一份 manifest。现有 `generate-deck.js`、`content-router.js` 和 `generate-archetype-deck.js` 保留为渲染核心，通过薄适配层接入 manifest；工作台只修改已声明字段，不允许任意 DOM/CSS 编辑，从而继续受现有设计和质量门禁约束。

**Tech Stack:** Node.js CommonJS、Reveal.js 4.6.0、原生浏览器 JavaScript、Node 内置 `http` / `crypto` / `fs` / `fetch`、Cheerio、Playwright、PptxGenJS 4.0.1。

## Status (reconciled 2026-07-27)

> 本计划的 task 级 checkbox（下方共 92 项 `- [ ]`）未按 commit 持续勾选，不能作为进度真相。以下 git 历史是已交付工作的真相来源；本计划应视为**部分已交付**。下方 checkbox 与 task 的逐项映射未重建，不要据此猜测单项状态。

**Done（已交付，以 commit 为准）:**

- `187e9ee` — Task 8 landing layer：PPTX 导出不再硬编码 Calibri，按 computed font 映射。
- `f0e9d6f` — Task 9 evidence-stamp：把证据可追溯性盖印进生成的 HTML。
- `3335c0f` — 落地基于文件的视觉签字 + 结构化 qa-summary（可审计的 readiness）。
- `f809932` — 收口证据可追溯性闭环：严格 `--manifest` ledger + schema + 文档。
- `d0edcde` — Task 11 capstone：端到端打通创作→交付管线。

**Deferred / pending（未逐项追踪）:**

- 下方各 Task 的 `- [ ]` 步骤没有按 commit 逐条勾选；上面的 Done 清单是已确认交付的范围，其余 task 的落地状态需对照仓库当前实现单独核实，不能从 checkbox 推断完成度。

## Global Constraints

- 不新增 npm 依赖；优先复用 Node 内置模块和仓库现有依赖。
- 保留一个可直接打开的自包含 HTML 作为核心交付物。
- 保留 Reveal.js 4.6.0 与 PptxGenJS 4.0.1 的现有兼容边界。
- 保留 A/B/C 路由、10 个 seed template、14 个 voice、A1–A12 archetype 和 G1–G14 门禁。
- 工作台只能修改 manifest 中公开的 `props`、`mediaSlots`、`variantParams`、`motionIntent` 和允许的 deck 元数据。
- 不允许工作台直接编辑任意 HTML、className、CSS 或脚本。
- 生产视觉签字必须落盘为带审核人、时间和截图摘要哈希的证据文件；环境变量只能用于测试。
- 原有 HTML 入口和旧版 `deck.json` 在迁移期继续可用，但所有新功能只承诺支持 `manifestVersion: "1.0"`。
- 每个任务先写失败测试，再做最小实现，再运行目标测试和相关回归测试。
- 不覆盖当前工作树中用户已有的 `SKILL.md`、`scripts/qa.js`、`scripts/build-voice-tokens.js` 或种子图库改动；实施前先在隔离 worktree 中执行。

---

## File Structure

### 新建文件

- `references/deck-manifest.schema.json`：Deck Manifest v1 的机器可读结构契约。
- `references/deck-manifest.md`：字段语义、迁移策略和示例。
- `references/layout-registry.json`：A1–A12 与 IMG 的角色、必填槽位、禁用槽位、媒体能力和 PPTX 策略。
- `references/pptx-export-strategies.json`：每类 archetype 的 PPTX 可编辑、混合或位图降级策略。
- `scripts/deck-manifest.js`：加载、规范化、验证和旧 `deck.json` 转换。
- `scripts/test-deck-manifest.js`：Manifest 单元和兼容测试。
- `scripts/layout-registry.js`：加载布局注册表并提供查询接口。
- `scripts/layout-query.js`：按 role、媒体需求和 archetype 查询候选。
- `scripts/inspect-layout.js`：输出单个布局的槽位契约。
- `scripts/test-layout-registry.js`：注册表、路由和模板契约一致性测试。
- `scripts/run-manifest.js`：创建、更新和原子写入每次运行的交付清单。
- `scripts/run-deck-pipeline.js`：生成、校验、视觉审核和导出的状态机入口。
- `scripts/test-run-deck-pipeline.js`：状态转换和失败关闭测试。
- `scripts/media-stage.js`：本地/远程媒体入库、哈希命名、尺寸记录和 manifest 重写。
- `scripts/test-media-stage.js`：媒体安全边界、去重和路径重写测试。
- `scripts/analyze-pptx-fidelity.js`：逐页生成 PPTX 保真策略与降级报告。
- `scripts/test-pptx-fidelity-contract.js`：PPTX 策略覆盖与导出报告测试。
- `scripts/test-evidence-sources.js`：验证精确数字、claim 和真实来源之间的一一映射。
- `scripts/test-browser-viewport.js`：在真实 Reveal 视口中逐页验证当前页与主标题可见。
- `scripts/test-workbench-server.js`：工作台 API、并发写入和路径安全测试。
- `scripts/test-workbench-contract.js`：工作台 UI 必备控件和禁止自由编辑的静态契约测试。
- `tests/fixtures/deck-manifest-valid.json`：最小有效 manifest。
- `tests/fixtures/deck-manifest-invalid.json`：缺失 audience、slide id 和 proof object 的无效 manifest。
- `tests/fixtures/deck-manifest-evidence-invalid.json`：标记为 verified 但无来源的无效 manifest。
- `tests/fixtures/media/tiny-source.svg`：媒体入库去重测试素材。
- `workbench/server.js`：本地 HTTP 服务、manifest API、渲染 API、QA API 和导出 API。
- `workbench/index.html`：工作台页面骨架。
- `workbench/app.js`：状态加载、字段编辑、自动保存、重新渲染和 QA 状态展示。
- `workbench/styles.css`：工作台布局与可访问状态样式。

### 修改文件

- `references/skill-healthcheck.md`：修复当前门禁计数自相矛盾。
- `scripts/content-router.js`：从布局注册表读取 archetype 元数据。
- `scripts/generate-deck.js`：接受 manifest、输出 run manifest，并调用统一状态机。
- `scripts/generate-archetype-deck.js`：将 manifest 元数据和证据 ID 写入 HTML。
- `scripts/qa.js`：输出结构化 QA 摘要并验证视觉签字文件。
- `scripts/test-evidence-ledger.js`：旧 HTML 继续做标签检查；manifest 路径调用严格来源校验。
- `scripts/export-pptx-client.js`：优先按 `data-archetype` 和导出策略分派，记录降级项。
- `scripts/export-pptx.js`：输出 PPTX 后附带 fidelity report。
- `scripts/test-pptx-export.js`：增加导出保真报告断言。
- `package.json`：增加 manifest、workbench、pipeline、媒体和保真度测试命令。
- `SKILL.md`：把新入口收敛为短指针，避免继续扩张入口文档。
- `README.md`：增加 manifest、工作台和新交付流程。
- `references/validation.md`：登记新门禁、状态模型和签字证据格式。

## Stable Interfaces

```js
// scripts/deck-manifest.js
function loadDeckManifest(filePath) {}
function normalizeDeckManifest(input) {}
function validateDeckManifest(manifest) {}
function manifestToGeneratorInput(manifest) {}
function writeDeckManifest(filePath, manifest) {}

// scripts/layout-registry.js
function getLayout(layoutCode) {}
function queryLayouts(filters) {}
function validateLayoutRegistry() {}

// scripts/run-manifest.js
function createRunManifest({ runId, sourceManifest, outputRoot }) {}
function recordStage(runManifest, stageName, result) {}
function finalizeRun(runManifest, state) {}
function writeRunManifest(filePath, runManifest) {}

// scripts/media-stage.js
async function stageMedia({ source, outputDir, allowRoot }) {}
async function stageManifestMedia({ manifest, manifestPath, outputDir, allowRoot }) {}

// scripts/analyze-pptx-fidelity.js
function analyzeDeckFidelity({ manifest, html }) {}

// workbench/server.js
function createWorkbenchServer({ manifestPath, outputRoot, port }) {}
```

---

### Task 1: Restore the Test Baseline

**Files:**
- Modify: `references/skill-healthcheck.md:11`
- Test: `scripts/lint-doc-counts.js`

**Interfaces:**
- Consumes: existing `npm run test:doc-counts`
- Produces: a green documentation-count baseline required by every later task

- [ ] **Step 1: Run the existing regression and capture the failure**

Run:

```bash
npm run test:doc-counts
```

Expected: FAIL naming `references/skill-healthcheck.md:11` because the report itself contains the obsolete count phrase.

- [ ] **Step 2: Replace the self-contradictory evidence sentence**

Replace line 11 with:

```markdown
| 门禁命名一致 | ✅ 健康 | 全仓统一使用“十四门禁/G1-G14”，旧门禁计数残留由 `npm run test:doc-counts` 阻断 |
```

- [ ] **Step 3: Verify the focused regression**

Run:

```bash
npm run test:doc-counts
```

Expected: PASS with zero old-count findings.

- [ ] **Step 4: Verify no unrelated documentation lint regressed**

Run:

```bash
npm run lint:docs
```

Expected: PASS.

- [ ] **Step 5: Commit the baseline repair**

```bash
git add references/skill-healthcheck.md
git commit -m "Keep the quality contract internally truthful" \
  -m "Constraint: G1-G14 is the current canonical gate count" \
  -m "Rejected: weakening lint-doc-counts | it correctly caught the drift" \
  -m "Confidence: high" \
  -m "Scope-risk: narrow" \
  -m "Directive: future health reports must not contain the legacy count token" \
  -m "Tested: npm run test:doc-counts; npm run lint:docs" \
  -m "Not-tested: full browser QA"
```

---

### Task 2: Introduce Deck Manifest v1

**Files:**
- Create: `references/deck-manifest.schema.json`
- Create: `references/deck-manifest.md`
- Create: `scripts/deck-manifest.js`
- Create: `scripts/test-deck-manifest.js`
- Create: `tests/fixtures/deck-manifest-valid.json`
- Create: `tests/fixtures/deck-manifest-invalid.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: legacy `{ topic, voice, styleKeywords, sections }` generator input
- Produces: `loadDeckManifest(filePath)`, `validateDeckManifest(manifest)`, and `manifestToGeneratorInput(manifest)`

- [ ] **Step 1: Add valid and invalid fixtures**

Create `tests/fixtures/deck-manifest-valid.json`:

```json
{
  "manifestVersion": "1.0",
  "deckId": "annual-mobility-2026",
  "title": "社区慢行交通年度报告",
  "topic": "社区慢行交通",
  "audience": "城市规划与交通管理团队",
  "language": "zh-CN",
  "voice": "auto",
  "route": {
    "path": "B",
    "wow": false
  },
  "output": {
    "html": "ppt/index.html",
    "pptx": "ppt/社区慢行交通年度报告.pptx"
  },
  "slides": [
    {
      "id": "cover",
      "role": "cover",
      "contentType": "cover",
      "archetype": "A1",
      "variantParams": {},
      "props": {
        "title": "社区慢行交通年度报告",
        "subtitle": "步行与骑行友好社区的年度体检"
      },
      "proofObject": {
        "type": "statement",
        "claim": "慢行交通正在成为社区更新的基础设施"
      },
      "mediaSlots": [],
      "evidence": [],
      "motionIntent": "none"
    },
    {
      "id": "share",
      "role": "proof",
      "contentType": "data-anchor",
      "archetype": "A5",
      "variantParams": {
        "anchor_scale": 5.6
      },
      "props": {
        "title": "慢行出行分担率",
        "number": "38%",
        "body": "中心城区慢行出行分担率达到 38%"
      },
      "proofObject": {
        "type": "metric",
        "claim": "慢行交通已成为主要出行方式之一"
      },
      "mediaSlots": [],
      "evidence": [
        {
          "id": "ev-share-38",
          "claimId": "share",
          "status": "user-provided",
          "label": "38%",
          "note": "用户提供的年度汇报数据"
        }
      ],
      "motionIntent": "count-in"
    }
  ]
}
```

Create `tests/fixtures/deck-manifest-invalid.json`:

```json
{
  "manifestVersion": "1.0",
  "deckId": "invalid-deck",
  "title": "缺失关键字段",
  "topic": "测试",
  "language": "zh-CN",
  "voice": "auto",
  "route": {
    "path": "B",
    "wow": false
  },
  "output": {
    "html": "ppt/index.html"
  },
  "slides": [
    {
      "role": "proof",
      "contentType": "data-anchor",
      "archetype": "A5",
      "variantParams": {},
      "props": {
        "number": "42%"
      },
      "mediaSlots": [],
      "evidence": [],
      "motionIntent": "none"
    }
  ]
}
```

- [ ] **Step 2: Write the failing manifest test**

Create `scripts/test-deck-manifest.js`:

```js
#!/usr/bin/env node
'use strict';

const path = require('path');
const {
  loadDeckManifest,
  validateDeckManifest,
  manifestToGeneratorInput,
} = require('./deck-manifest');

const root = path.resolve(__dirname, '..');
const valid = loadDeckManifest(path.join(root, 'tests/fixtures/deck-manifest-valid.json'));
const invalid = loadDeckManifest(path.join(root, 'tests/fixtures/deck-manifest-invalid.json'));

const validResult = validateDeckManifest(valid);
if (!validResult.ok) {
  console.error(validResult.errors.join('\n'));
  process.exit(1);
}

const invalidResult = validateDeckManifest(invalid);
if (invalidResult.ok) {
  console.error('invalid fixture must fail validation');
  process.exit(1);
}

const generatorInput = manifestToGeneratorInput(valid);
if (generatorInput.topic !== valid.topic || generatorInput.sections.length !== valid.slides.length) {
  console.error('manifest conversion lost topic or slides');
  process.exit(1);
}

if (generatorInput.sections[1].content_type !== 'data-anchor') {
  console.error('contentType must map to content_type');
  process.exit(1);
}

console.log('Deck Manifest contract: PASS');
```

- [ ] **Step 3: Run the test and verify the module is missing**

Run:

```bash
node scripts/test-deck-manifest.js
```

Expected: FAIL with `Cannot find module './deck-manifest'`.

- [ ] **Step 4: Add the manifest schema**

Create `references/deck-manifest.schema.json` with:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://revealjs-presentation.local/schemas/deck-manifest-v1.json",
  "title": "Reveal.js Presentation Deck Manifest",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "manifestVersion",
    "deckId",
    "title",
    "topic",
    "audience",
    "language",
    "voice",
    "route",
    "output",
    "slides"
  ],
  "properties": {
    "manifestVersion": { "const": "1.0" },
    "deckId": { "type": "string", "pattern": "^[a-z0-9][a-z0-9-]{2,63}$" },
    "title": { "type": "string", "minLength": 1, "maxLength": 120 },
    "topic": { "type": "string", "minLength": 1, "maxLength": 160 },
    "audience": { "type": "string", "minLength": 1, "maxLength": 160 },
    "language": { "enum": ["zh-CN", "en"] },
    "voice": { "type": "string", "minLength": 1 },
    "route": {
      "type": "object",
      "additionalProperties": false,
      "required": ["path", "wow"],
      "properties": {
        "path": { "enum": ["A", "B", "C"] },
        "wow": { "type": "boolean" }
      }
    },
    "output": {
      "type": "object",
      "additionalProperties": false,
      "required": ["html"],
      "properties": {
        "html": { "type": "string", "minLength": 1 },
        "pptx": { "type": "string", "minLength": 1 }
      }
    },
    "slides": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "role",
          "contentType",
          "archetype",
          "variantParams",
          "props",
          "proofObject",
          "mediaSlots",
          "evidence",
          "motionIntent"
        ],
        "properties": {
          "id": { "type": "string", "pattern": "^[a-z0-9][a-z0-9-]{1,63}$" },
          "role": { "enum": ["cover", "context", "proof", "mechanism", "decision", "close"] },
          "contentType": {
            "enum": [
              "cover",
              "thesis",
              "chronology",
              "chapter",
              "data-anchor",
              "comparison",
              "kpi",
              "mechanism",
              "evidence-table",
              "quote",
              "takeaways",
              "closing",
              "image-compare"
            ]
          },
          "archetype": {
            "enum": ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10", "A11", "A12", "IMG"]
          },
          "variantParams": { "type": "object" },
          "props": { "type": "object" },
          "proofObject": {
            "type": "object",
            "additionalProperties": false,
            "required": ["type", "claim"],
            "properties": {
              "type": { "enum": ["statement", "metric", "table", "diagram", "image", "quote", "code"] },
              "claim": { "type": "string", "minLength": 1 }
            }
          },
          "mediaSlots": { "type": "array" },
          "evidence": { "type": "array" },
          "motionIntent": { "enum": ["none", "fragment", "loop", "count-in", "draw", "grow"] }
        }
      }
    }
  }
}
```

- [ ] **Step 5: Implement the manifest loader and validator without adding a dependency**

Create `scripts/deck-manifest.js`:

```js
#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const CONTENT_TYPES = new Set([
  'cover', 'thesis', 'chronology', 'chapter', 'data-anchor', 'comparison',
  'kpi', 'mechanism', 'evidence-table', 'quote', 'takeaways', 'closing',
  'image-compare',
]);
const ARCHETYPES = new Set([
  'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7',
  'A8', 'A9', 'A10', 'A11', 'A12', 'IMG',
]);
const MOTION_INTENTS = new Set(['none', 'fragment', 'loop', 'count-in', 'draw', 'grow']);

function loadDeckManifest(filePath) {
  const absolute = path.resolve(filePath);
  return JSON.parse(fs.readFileSync(absolute, 'utf8'));
}

function normalizeDeckManifest(input) {
  return JSON.parse(JSON.stringify(input));
}

function validateDeckManifest(manifest) {
  const errors = [];
  const requiredStrings = ['deckId', 'title', 'topic', 'audience', 'language', 'voice'];
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return { ok: false, errors: ['manifest must be an object'] };
  }
  if (manifest.manifestVersion !== '1.0') errors.push('manifestVersion must equal "1.0"');
  for (const key of requiredStrings) {
    if (typeof manifest[key] !== 'string' || !manifest[key].trim()) {
      errors.push(`${key} must be a non-empty string`);
    }
  }
  if (!manifest.route || !['A', 'B', 'C'].includes(manifest.route.path)) {
    errors.push('route.path must be A, B, or C');
  }
  if (!manifest.output || typeof manifest.output.html !== 'string' || !manifest.output.html.trim()) {
    errors.push('output.html must be a non-empty string');
  }
  if (!Array.isArray(manifest.slides) || manifest.slides.length === 0) {
    errors.push('slides must contain at least one slide');
  } else {
    const ids = new Set();
    manifest.slides.forEach((slide, index) => {
      const prefix = `slides[${index}]`;
      if (!slide.id || typeof slide.id !== 'string') errors.push(`${prefix}.id is required`);
      if (slide.id && ids.has(slide.id)) errors.push(`${prefix}.id must be unique`);
      if (slide.id) ids.add(slide.id);
      if (!CONTENT_TYPES.has(slide.contentType)) errors.push(`${prefix}.contentType is invalid`);
      if (!ARCHETYPES.has(slide.archetype)) errors.push(`${prefix}.archetype is invalid`);
      if (!slide.proofObject || typeof slide.proofObject.claim !== 'string' || !slide.proofObject.claim.trim()) {
        errors.push(`${prefix}.proofObject.claim is required`);
      }
      if (!MOTION_INTENTS.has(slide.motionIntent)) errors.push(`${prefix}.motionIntent is invalid`);
      if (!slide.props || typeof slide.props !== 'object' || Array.isArray(slide.props)) {
        errors.push(`${prefix}.props must be an object`);
      }
      if (!Array.isArray(slide.mediaSlots)) errors.push(`${prefix}.mediaSlots must be an array`);
      if (!Array.isArray(slide.evidence)) errors.push(`${prefix}.evidence must be an array`);
    });
  }
  return { ok: errors.length === 0, errors };
}

function manifestToGeneratorInput(manifest) {
  const result = validateDeckManifest(manifest);
  if (!result.ok) throw new Error(result.errors.join('\n'));
  return {
    topic: manifest.topic,
    voice: manifest.voice,
    sections: manifest.slides.map((slide) => ({
      ...slide.props,
      id: slide.id,
      role: slide.role,
      title: slide.props.title || slide.proofObject.claim,
      content_type: slide.contentType,
      variant_params: slide.variantParams,
      evidence: slide.evidence,
      evidence_status: slide.evidence[0]?.status || 'illustrative',
      media_slots: slide.mediaSlots,
      motion_intent: slide.motionIntent,
    })),
  };
}

function writeDeckManifest(filePath, manifest) {
  const result = validateDeckManifest(manifest);
  if (!result.ok) throw new Error(result.errors.join('\n'));
  const absolute = path.resolve(filePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  const temporary = `${absolute}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`);
  fs.renameSync(temporary, absolute);
}

module.exports = {
  loadDeckManifest,
  normalizeDeckManifest,
  validateDeckManifest,
  manifestToGeneratorInput,
  writeDeckManifest,
};
```

- [ ] **Step 6: Document the manifest as the canonical state**

Create `references/deck-manifest.md` with these mandatory sections:

```markdown
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
```

- [ ] **Step 7: Wire the focused test into package scripts**

Add:

```json
"test:deck-manifest": "node scripts/test-deck-manifest.js"
```

Insert `npm run test:deck-manifest` near the start of the aggregate `test` command.

- [ ] **Step 8: Run focused and compatibility tests**

Run:

```bash
npm run test:deck-manifest
npm run test:off-template-regression
npm run test:route-deck
```

Expected: all PASS.

- [ ] **Step 9: Commit the canonical state contract**

```bash
git add references/deck-manifest.schema.json references/deck-manifest.md scripts/deck-manifest.js scripts/test-deck-manifest.js tests/fixtures/deck-manifest-valid.json tests/fixtures/deck-manifest-invalid.json package.json
git commit -m "Give every deck one durable source of truth" \
  -m "Constraint: existing deck.json inputs remain supported during migration" \
  -m "Rejected: storing browser DOM as authoring state | it bypasses the quality contracts" \
  -m "Confidence: high" \
  -m "Scope-risk: moderate" \
  -m "Directive: new authoring features must mutate Deck Manifest v1, not generated HTML" \
  -m "Tested: npm run test:deck-manifest; npm run test:off-template-regression; npm run test:route-deck" \
  -m "Not-tested: browser workbench"
```

---

### Task 3: Make Layout Contracts Queryable

**Files:**
- Create: `references/layout-registry.json`
- Create: `scripts/layout-registry.js`
- Create: `scripts/layout-query.js`
- Create: `scripts/inspect-layout.js`
- Create: `scripts/test-layout-registry.js`
- Modify: `scripts/content-router.js:30-45`
- Modify: `package.json`

**Interfaces:**
- Consumes: `contentType`, `role`, `needsMedia`, and current A1–A12 definitions
- Produces: `getLayout(code)`, `queryLayouts(filters)`, and a stable registry consumed by routing, editing, validation, and PPTX analysis

- [ ] **Step 1: Write the failing registry contract test**

Create `scripts/test-layout-registry.js`:

```js
#!/usr/bin/env node
'use strict';

const { ARCHETYPE_MAP } = require('./content-router');
const { getLayout, queryLayouts, validateLayoutRegistry } = require('./layout-registry');

const result = validateLayoutRegistry();
if (!result.ok) {
  console.error(result.errors.join('\n'));
  process.exit(1);
}

for (const [contentType, entry] of Object.entries(ARCHETYPE_MAP)) {
  const layout = getLayout(entry.code);
  if (!layout || layout.contentType !== contentType) {
    console.error(`registry mismatch for ${contentType}/${entry.code}`);
    process.exit(1);
  }
}

const mediaLayouts = queryLayouts({ needsMedia: true });
if (!mediaLayouts.some((layout) => layout.code === 'IMG')) {
  console.error('media query must include IMG');
  process.exit(1);
}

const proofLayouts = queryLayouts({ role: 'proof' });
if (!proofLayouts.some((layout) => layout.code === 'A5')) {
  console.error('proof query must include A5');
  process.exit(1);
}

console.log('Layout registry contract: PASS');
```

- [ ] **Step 2: Run the test and verify the registry module is missing**

Run:

```bash
node scripts/test-layout-registry.js
```

Expected: FAIL with `Cannot find module './layout-registry'`.

- [ ] **Step 3: Add the layout registry**

Create `references/layout-registry.json` with one object per current layout. Every object must include:

```json
{
  "version": 1,
  "layouts": [
    {
      "code": "A1",
      "name": "Masthead Cover",
      "contentType": "cover",
      "roles": ["cover"],
      "requiredProps": ["title"],
      "optionalProps": ["subtitle", "meta", "body", "facts"],
      "forbiddenProps": ["rows", "headers"],
      "mediaSlots": [],
      "pptxStrategy": "editable"
    },
    {
      "code": "A2",
      "name": "Manifesto Statement",
      "contentType": "thesis",
      "roles": ["context", "decision"],
      "requiredProps": ["title", "body"],
      "optionalProps": ["emphasis", "support"],
      "forbiddenProps": ["rows", "headers", "img_a", "img_b"],
      "mediaSlots": [],
      "pptxStrategy": "editable"
    },
    {
      "code": "A3",
      "name": "Register Axis",
      "contentType": "chronology",
      "roles": ["context", "mechanism"],
      "requiredProps": ["title", "nodes"],
      "optionalProps": ["subtitle"],
      "forbiddenProps": ["rows", "headers"],
      "mediaSlots": [],
      "pptxStrategy": "hybrid"
    },
    {
      "code": "A4",
      "name": "Full-Bleed Split",
      "contentType": "chapter",
      "roles": ["context"],
      "requiredProps": ["title", "body"],
      "optionalProps": ["subtitle"],
      "forbiddenProps": ["rows", "headers"],
      "mediaSlots": [],
      "pptxStrategy": "editable"
    },
    {
      "code": "A5",
      "name": "Anchor Numeral",
      "contentType": "data-anchor",
      "roles": ["proof"],
      "requiredProps": ["title", "number"],
      "optionalProps": ["label", "event", "note", "source", "evidence"],
      "forbiddenProps": ["rows", "headers"],
      "mediaSlots": [],
      "pptxStrategy": "editable"
    },
    {
      "code": "A6",
      "name": "Face-Off Compare",
      "contentType": "comparison",
      "roles": ["proof", "decision"],
      "requiredProps": ["title", "a_value", "b_value"],
      "optionalProps": ["a_label", "a_unit", "a_details", "b_label", "b_unit", "b_details", "verdict", "verdict_note"],
      "forbiddenProps": ["rows", "headers"],
      "mediaSlots": [],
      "pptxStrategy": "editable"
    },
    {
      "code": "A7",
      "name": "KPI Grid",
      "contentType": "kpi",
      "roles": ["proof"],
      "requiredProps": ["title", "items"],
      "optionalProps": ["subtitle"],
      "forbiddenProps": ["rows", "headers"],
      "mediaSlots": [],
      "pptxStrategy": "editable"
    },
    {
      "code": "A8",
      "name": "Mechanism Diagram",
      "contentType": "mechanism",
      "roles": ["mechanism"],
      "requiredProps": ["title", "before_items", "after_items"],
      "optionalProps": ["subtitle", "before_label", "after_label", "reduction"],
      "forbiddenProps": ["rows", "headers"],
      "mediaSlots": [],
      "pptxStrategy": "hybrid"
    },
    {
      "code": "A9",
      "name": "Evidence Table",
      "contentType": "evidence-table",
      "roles": ["proof", "decision"],
      "requiredProps": ["title", "headers", "rows"],
      "optionalProps": ["subtitle", "highlight_col"],
      "forbiddenProps": ["img_a", "img_b"],
      "mediaSlots": [],
      "pptxStrategy": "editable"
    },
    {
      "code": "A10",
      "name": "Pullquote",
      "contentType": "quote",
      "roles": ["context", "proof"],
      "requiredProps": ["title", "quote"],
      "optionalProps": ["number", "who", "role"],
      "forbiddenProps": ["rows", "headers"],
      "mediaSlots": [],
      "pptxStrategy": "editable"
    },
    {
      "code": "A11",
      "name": "Takeaway Roster",
      "contentType": "takeaways",
      "roles": ["decision"],
      "requiredProps": ["title", "items"],
      "optionalProps": ["subtitle"],
      "forbiddenProps": ["rows", "headers"],
      "mediaSlots": [],
      "pptxStrategy": "editable"
    },
    {
      "code": "A12",
      "name": "Masthead Closing",
      "contentType": "closing",
      "roles": ["close"],
      "requiredProps": ["title"],
      "optionalProps": ["topic", "body", "stamp"],
      "forbiddenProps": ["rows", "headers"],
      "mediaSlots": [],
      "pptxStrategy": "editable"
    },
    {
      "code": "IMG",
      "name": "Image Face-Off",
      "contentType": "image-compare",
      "roles": ["proof"],
      "requiredProps": ["title", "img_a", "img_b"],
      "optionalProps": ["a_label", "a_value", "a_detail", "b_label", "b_value", "b_detail"],
      "forbiddenProps": ["rows", "headers"],
      "mediaSlots": [
        { "id": "img_a", "accept": ["image/jpeg", "image/png", "image/webp"], "required": true },
        { "id": "img_b", "accept": ["image/jpeg", "image/png", "image/webp"], "required": true }
      ],
      "pptxStrategy": "hybrid"
    }
  ]
}
```

- [ ] **Step 4: Implement registry loading and querying**

Create `scripts/layout-registry.js`:

```js
#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const registryPath = path.join(__dirname, '..', 'references', 'layout-registry.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

function getLayout(code) {
  return registry.layouts.find((layout) => layout.code === code) || null;
}

function queryLayouts(filters = {}) {
  return registry.layouts.filter((layout) => {
    if (filters.role && !layout.roles.includes(filters.role)) return false;
    if (filters.contentType && layout.contentType !== filters.contentType) return false;
    if (filters.needsMedia && layout.mediaSlots.length === 0) return false;
    if (filters.pptxStrategy && layout.pptxStrategy !== filters.pptxStrategy) return false;
    return true;
  });
}

function validateLayoutRegistry() {
  const errors = [];
  const codes = new Set();
  for (const layout of registry.layouts) {
    if (!layout.code || codes.has(layout.code)) errors.push(`duplicate or missing code: ${layout.code}`);
    codes.add(layout.code);
    if (!layout.contentType) errors.push(`${layout.code}.contentType is required`);
    if (!Array.isArray(layout.roles) || layout.roles.length === 0) errors.push(`${layout.code}.roles is required`);
    if (!Array.isArray(layout.requiredProps)) errors.push(`${layout.code}.requiredProps must be an array`);
    if (!Array.isArray(layout.optionalProps)) errors.push(`${layout.code}.optionalProps must be an array`);
    if (!Array.isArray(layout.forbiddenProps)) errors.push(`${layout.code}.forbiddenProps must be an array`);
    if (!Array.isArray(layout.mediaSlots)) errors.push(`${layout.code}.mediaSlots must be an array`);
    if (!['editable', 'hybrid', 'raster-fallback'].includes(layout.pptxStrategy)) {
      errors.push(`${layout.code}.pptxStrategy is invalid`);
    }
  }
  return { ok: errors.length === 0, errors };
}

module.exports = { getLayout, queryLayouts, validateLayoutRegistry };
```

- [ ] **Step 5: Add query and inspect CLIs**

`layout-query.js` accepts `--role`, `--content-type`, `--needs-media`, `--pptx-strategy`, and `--json`; `inspect-layout.js` accepts an A-code and prints its exact registry object. Both commands must exit 2 for unknown flags or missing layout codes.

Core CLI output code:

```js
const result = queryLayouts(filters);
if (args.json) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  result.forEach((layout) => {
    console.log(`${layout.code}\t${layout.contentType}\t${layout.roles.join(',')}\t${layout.pptxStrategy}`);
  });
}
```

- [ ] **Step 6: Make content routing consume registry metadata**

Keep `DETECT_RULES` and `VARIANT_RULES` in `content-router.js`, but replace the duplicated name/content-type metadata with registry lookup:

```js
const { getLayout } = require('./layout-registry');

const CONTENT_TYPE_TO_CODE = {
  cover: 'A1',
  thesis: 'A2',
  chronology: 'A3',
  chapter: 'A4',
  'data-anchor': 'A5',
  comparison: 'A6',
  kpi: 'A7',
  mechanism: 'A8',
  'evidence-table': 'A9',
  quote: 'A10',
  takeaways: 'A11',
  closing: 'A12',
  'image-compare': 'IMG',
};

const ARCHETYPE_MAP = Object.fromEntries(
  Object.entries(CONTENT_TYPE_TO_CODE).map(([contentType, code]) => {
    const layout = getLayout(code);
    return [contentType, {
      code,
      name: layout.name,
      reason: `内容类型 ${contentType} 使用已登记布局 ${code}`,
    }];
  }),
);
```

- [ ] **Step 7: Add package scripts and run focused tests**

Add:

```json
"layout:query": "node scripts/layout-query.js",
"layout:inspect": "node scripts/inspect-layout.js",
"test:layout-registry": "node scripts/test-layout-registry.js"
```

Run:

```bash
npm run test:layout-registry
npm run test:route-deck
npm run test:off-template-regression
```

Expected: all PASS.

- [ ] **Step 8: Commit the queryable layout contract**

```bash
git add references/layout-registry.json scripts/layout-registry.js scripts/layout-query.js scripts/inspect-layout.js scripts/test-layout-registry.js scripts/content-router.js package.json
git commit -m "Make layout decisions inspectable before rendering" \
  -m "Constraint: A1-A12 and IMG retain their current routing semantics" \
  -m "Rejected: duplicating slot knowledge in the editor | it would drift from the renderer" \
  -m "Confidence: high" \
  -m "Scope-risk: moderate" \
  -m "Directive: routing, workbench, validation, and export must consume layout-registry.json" \
  -m "Tested: npm run test:layout-registry; npm run test:route-deck; npm run test:off-template-regression" \
  -m "Not-tested: visual rendering"
```

---

### Task 4: Add a Fail-Closed Delivery State Machine

**Files:**
- Create: `scripts/run-manifest.js`
- Create: `scripts/run-deck-pipeline.js`
- Create: `scripts/test-run-deck-pipeline.js`
- Modify: `scripts/generate-deck.js:138-182`
- Modify: `package.json`

**Interfaces:**
- Consumes: validated Deck Manifest v1
- Produces: `run.json` with `draft | rendered | needs-visual-signoff | ready | blocked` states and per-stage evidence

- [ ] **Step 1: Write the failing state-transition test**

The test must assert:

```js
const run = createRunManifest({
  runId: 'run-test-001',
  sourceManifest: 'tests/fixtures/deck-manifest-valid.json',
  outputRoot: '/tmp/reveal-run-test',
});
recordStage(run, 'manifest-validation', { ok: true, artifact: 'deck.manifest.json' });
recordStage(run, 'render', { ok: true, artifact: 'ppt/index.html' });
finalizeRun(run, 'needs-visual-signoff');

if (run.state !== 'needs-visual-signoff') process.exit(1);
if (run.stages.length !== 2) process.exit(1);
if (!run.updatedAt) process.exit(1);
```

It must also assert that `finalizeRun(run, 'ready')` throws when manifest validation or render failed.

- [ ] **Step 2: Run the test and verify the run-manifest module is missing**

Run:

```bash
node scripts/test-run-deck-pipeline.js
```

Expected: FAIL with `Cannot find module './run-manifest'`.

- [ ] **Step 3: Implement run manifest transitions**

Use this state set:

```js
const RUN_STATES = new Set([
  'draft',
  'rendered',
  'needs-visual-signoff',
  'ready',
  'blocked',
]);
```

`finalizeRun(run, 'ready')` must require successful stages named `manifest-validation`, `render`, `qa-floor`, `pptx-fidelity`, and either `visual-model` or `visual-human-signoff`.

- [ ] **Step 4: Implement the pipeline command**

`run-deck-pipeline.js` command:

```bash
node scripts/run-deck-pipeline.js \
  --manifest output/client-review/deck.manifest.json \
  --out output/client-review \
  --visual-mode pending
```

Exact stage order:

1. validate manifest;
2. stage media;
3. convert manifest to generator input;
4. render HTML;
5. run `qa.js --no-visual`;
6. run PPTX fidelity analysis;
7. run model visual review, accept a signed human review file, or end in `needs-visual-signoff`;
8. write `run.json` atomically after every stage.

The command exits:

- `0` only for `ready`;
- `1` for `blocked` or `needs-visual-signoff`;
- `2` for usage/setup errors.

- [ ] **Step 5: Make `generate-deck.js` accept `--manifest`**

Add argument parsing:

```js
else if (k === '--manifest') a.manifest = argv[++i];
```

Before the legacy `--input` branch:

```js
if (a.manifest) {
  const manifest = loadDeckManifest(a.manifest);
  input = manifestToGeneratorInput(manifest);
  outFile = a.out || path.resolve(path.dirname(a.manifest), manifest.output.html);
}
```

Reject simultaneous `--manifest` and `--input` with exit code 2.

- [ ] **Step 6: Add package scripts**

```json
"pipeline": "node scripts/run-deck-pipeline.js",
"test:pipeline": "node scripts/test-run-deck-pipeline.js"
```

- [ ] **Step 7: Run focused regression tests**

Run:

```bash
npm run test:pipeline
npm run test:deck-manifest
npm run test:off-template-regression
```

Expected: all PASS; the pipeline fixture ends in `needs-visual-signoff`, not `ready`, when no visual evidence is supplied.

- [ ] **Step 8: Commit the delivery state machine**

```bash
git add scripts/run-manifest.js scripts/run-deck-pipeline.js scripts/test-run-deck-pipeline.js scripts/generate-deck.js package.json
git commit -m "Make delivery readiness explicit and fail closed" \
  -m "Constraint: visual review remains unskippable for production readiness" \
  -m "Rejected: treating generate-deck --gates as final delivery proof | it omits sensory review" \
  -m "Confidence: high" \
  -m "Scope-risk: moderate" \
  -m "Directive: automation must read run.json state before claiming a deck is ready" \
  -m "Tested: npm run test:pipeline; npm run test:deck-manifest; npm run test:off-template-regression" \
  -m "Not-tested: real model visual review"
```

---

### Task 5: Build a Reproducible Media Staging Layer

**Files:**
- Create: `scripts/media-stage.js`
- Create: `scripts/test-media-stage.js`
- Create: `tests/fixtures/media/tiny-source.svg`
- Modify: `scripts/run-deck-pipeline.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: local paths under an explicit allow-root or public `http` / `https` URLs
- Produces: staged relative media paths, SHA-256 hashes, MIME types and byte sizes written back to manifest

- [ ] **Step 1: Write failing media tests**

Tests must cover:

```js
const first = await stageMedia({
  source: fixture,
  outputDir,
  allowRoot: fixturesRoot,
});
const second = await stageMedia({
  source: fixture,
  outputDir,
  allowRoot: fixturesRoot,
});

assert.equal(first.relativePath, second.relativePath);
assert.match(first.sha256, /^[a-f0-9]{64}$/);
assert.equal(first.mimeType, 'image/svg+xml');
await assert.rejects(
  () => stageMedia({ source: '/etc/passwd', outputDir, allowRoot: fixturesRoot }),
  /outside allowRoot/,
);
await assert.rejects(
  () => stageMedia({ source: 'http://127.0.0.1:3000/private.png', outputDir, allowRoot: fixturesRoot }),
  /private network/,
);
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
node scripts/test-media-stage.js
```

Expected: FAIL with a missing module.

- [ ] **Step 3: Implement local media staging**

Implementation requirements:

- resolve and realpath both source and allow-root;
- reject sources outside allow-root;
- hash bytes with SHA-256;
- store as `assets/media/<first-12-hash>.<extension>`;
- reuse an existing identical file;
- return `{ source, relativePath, sha256, bytes, mimeType }`.

Core naming code:

```js
const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
const fileName = `${sha256.slice(0, 12)}${extension}`;
const target = path.join(outputDir, 'assets', 'media', fileName);
```

- [ ] **Step 4: Implement remote media staging safely**

Rules:

- allow only `http:` and `https:`;
- resolve hostname and reject loopback, link-local, RFC1918 and IPv6 local addresses;
- follow at most three redirects and repeat the address check after each redirect;
- cap response body at 20 MB;
- reject non-image MIME types for image slots;
- store original URL and final URL in the media record.

- [ ] **Step 5: Rewrite manifest media slots**

For every populated slot, replace:

```json
{
  "slotId": "hero",
  "source": "/absolute/source/image.png"
}
```

with:

```json
{
  "slotId": "hero",
  "source": "assets/media/4b62f1c8a930.png",
  "sha256": "4b62f1c8a930ab6cbddf8f3103e62c045e9d872ba2f4ac1e634570854d9d9cb5",
  "mimeType": "image/png",
  "bytes": 184220
}
```

- [ ] **Step 6: Insert media staging before render**

In `run-deck-pipeline.js`, record a `media-stage` stage even when the manifest has no media. An empty media set is a successful stage with `count: 0`.

- [ ] **Step 7: Run focused tests**

```bash
node scripts/test-media-stage.js
npm run test:pipeline
node scripts/audit-image-assets.js tests/fixtures/public-ready-patterns.html --json
```

Expected: media tests and pipeline PASS; existing image audit behavior remains unchanged.

- [ ] **Step 8: Commit the reproducible asset boundary**

```bash
git add scripts/media-stage.js scripts/test-media-stage.js tests/fixtures/media/tiny-source.svg scripts/run-deck-pipeline.js package.json
git commit -m "Keep every delivered visual reproducible and local" \
  -m "Constraint: no new dependency and no unrestricted network fetch" \
  -m "Rejected: leaving remote URLs in final decks | exports drift and can silently lose media" \
  -m "Confidence: high" \
  -m "Scope-risk: moderate" \
  -m "Directive: all manifest media must pass through media-stage before render" \
  -m "Tested: node scripts/test-media-stage.js; npm run test:pipeline; image audit fixture" \
  -m "Not-tested: authenticated remote media"
```

---

### Task 6: Add the Local Workbench Server

**Files:**
- Create: `workbench/server.js`
- Create: `workbench/index.html`
- Create: `workbench/app.js`
- Create: `workbench/styles.css`
- Create: `scripts/test-workbench-server.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: a Deck Manifest v1 file and an output root
- Produces: a localhost-only authoring API with optimistic concurrency and atomic saves

- [ ] **Step 1: Write the failing server test**

The test starts the server on port `0` and asserts:

```js
const server = await createWorkbenchServer({ manifestPath, outputRoot, port: 0 });
const base = `http://127.0.0.1:${server.address().port}`;

const first = await fetch(`${base}/api/manifest`);
assert.equal(first.status, 200);
const etag = first.headers.get('etag');
const manifest = await first.json();
manifest.title = '更新后的标题';

const saved = await fetch(`${base}/api/manifest`, {
  method: 'PUT',
  headers: { 'content-type': 'application/json', 'if-match': etag },
  body: JSON.stringify(manifest),
});
assert.equal(saved.status, 200);

const stale = await fetch(`${base}/api/manifest`, {
  method: 'PUT',
  headers: { 'content-type': 'application/json', 'if-match': etag },
  body: JSON.stringify(manifest),
});
assert.equal(stale.status, 409);
```

Also assert `/../../package.json` and encoded traversal return 404.

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
node scripts/test-workbench-server.js
```

Expected: FAIL with missing `workbench/server.js`.

- [ ] **Step 3: Implement the localhost-only server**

Use Node `http.createServer`. Bind only to `127.0.0.1`. Export:

```js
async function createWorkbenchServer({ manifestPath, outputRoot, port = 0 }) {
  const server = http.createServer((request, response) => {
    handleRequest({ request, response, manifestPath, outputRoot });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return server;
}
```

Required routes:

- `GET /api/manifest`
- `PUT /api/manifest`
- `POST /api/render`
- `POST /api/qa`
- `POST /api/export/pptx`
- `GET /api/run`
- `GET /preview/`
- static `GET /`, `/app.js`, `/styles.css`

- [ ] **Step 4: Implement optimistic concurrency**

ETag is the SHA-256 of canonical JSON:

```js
function manifestEtag(manifest) {
  return `"${crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex')}"`;
}
```

`PUT /api/manifest` requires `If-Match`; return:

- 428 when missing;
- 409 when stale;
- 422 with validation errors when invalid;
- 200 with the new ETag after an atomic save.

- [ ] **Step 5: Keep command execution closed**

The API must call imported functions from `deck-manifest.js`, `run-deck-pipeline.js` and export modules. It must never accept arbitrary command names, shell strings, output paths or script paths from the request body.

- [ ] **Step 6: Add the package entry**

```json
"workbench": "node workbench/server.js",
"test:workbench-server": "node scripts/test-workbench-server.js"
```

CLI usage:

```bash
npm run workbench -- --manifest output/client-review/deck.manifest.json --port 4173
```

- [ ] **Step 7: Run focused tests**

```bash
npm run test:workbench-server
npm run test:deck-manifest
npm run test:pipeline
```

Expected: all PASS.

- [ ] **Step 8: Commit the local authoring boundary**

```bash
git add workbench/server.js workbench/index.html workbench/app.js workbench/styles.css scripts/test-workbench-server.js package.json
git commit -m "Put deck iteration behind one safe local authoring boundary" \
  -m "Constraint: the service binds only to 127.0.0.1 and accepts no shell commands" \
  -m "Rejected: editing generated HTML directly | it breaks reproducibility and validation" \
  -m "Confidence: high" \
  -m "Scope-risk: broad" \
  -m "Directive: all workbench saves require ETag concurrency and manifest validation" \
  -m "Tested: npm run test:workbench-server; npm run test:deck-manifest; npm run test:pipeline" \
  -m "Not-tested: multi-user collaboration"
```

---

### Task 7: Implement the Controlled Browser Editor

**Files:**
- Modify: `workbench/index.html`
- Modify: `workbench/app.js`
- Modify: `workbench/styles.css`
- Create: `scripts/test-workbench-contract.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: manifest API, layout query/inspect API and run status
- Produces: controlled edits for deck metadata, text props, media slots, layout variants and motion intent

- [ ] **Step 1: Write the failing UI contract test**

Using existing Cheerio, assert:

```js
const requiredIds = [
  'deck-title',
  'route-summary',
  'slide-list',
  'property-panel',
  'media-panel',
  'evidence-panel',
  'qa-status',
  'preview-frame',
  'save-status',
];
for (const id of requiredIds) {
  if ($(`#${id}`).length !== 1) fail(`missing #${id}`);
}
if ($('[contenteditable]').length > 0) fail('free contenteditable is forbidden');
```

Also inspect `app.js` for `If-Match`, a 500 ms debounced save, and no use of `eval`, `new Function` or `innerHTML = userValue`.

- [ ] **Step 2: Run the test and verify failure**

```bash
node scripts/test-workbench-contract.js
```

Expected: FAIL because required controls are not present.

- [ ] **Step 3: Add the workbench layout**

The page contains:

```html
<header class="app-header">
  <input id="deck-title" aria-label="演示标题">
  <div id="route-summary" aria-live="polite"></div>
  <div id="save-status" aria-live="polite">已同步</div>
</header>
<main class="workspace">
  <nav id="slide-list" aria-label="幻灯片列表"></nav>
  <section class="preview-column">
    <iframe id="preview-frame" title="演示预览"></iframe>
  </section>
  <aside id="property-panel" aria-label="页面属性">
    <section id="media-panel"></section>
    <section id="evidence-panel"></section>
    <section id="qa-status"></section>
  </aside>
</main>
```

- [ ] **Step 4: Render forms from the layout registry**

For the selected slide:

- show only `requiredProps` and `optionalProps`;
- never show `forbiddenProps`;
- render `motionIntent` as a fixed select;
- render `variantParams` only for keys already declared by the selected layout;
- render media controls from `mediaSlots`;
- show role and archetype as visible metadata.

Core safe setter:

```js
function updateSlideProp(slideId, key, value) {
  const slide = state.manifest.slides.find((item) => item.id === slideId);
  if (!slide) throw new Error(`unknown slide: ${slideId}`);
  if (!state.allowedProps.has(key)) throw new Error(`prop is not editable: ${key}`);
  slide.props[key] = value;
  scheduleSave();
}
```

- [ ] **Step 5: Add debounced optimistic saving**

```js
function scheduleSave() {
  window.clearTimeout(state.saveTimer);
  state.saveTimer = window.setTimeout(saveManifest, 500);
}

async function saveManifest() {
  setSaveStatus('保存中');
  const response = await fetch('/api/manifest', {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      'if-match': state.etag,
    },
    body: JSON.stringify(state.manifest),
  });
  if (response.status === 409) {
    setSaveStatus('检测到外部修改，请重新加载');
    return;
  }
  if (!response.ok) {
    const error = await response.json();
    setSaveStatus(error.errors?.join('；') || '保存失败');
    return;
  }
  state.etag = response.headers.get('etag');
  setSaveStatus('已同步');
}
```

- [ ] **Step 6: Add explicit render, QA and export actions**

Buttons call fixed endpoints only. After successful render, reload `/preview/` with a cache-busting run ID. After QA, display every stage and do not collapse `needs-visual-signoff` into PASS.

- [ ] **Step 7: Run UI and server tests**

```bash
npm run test:workbench-server
node scripts/test-workbench-contract.js
```

Expected: PASS.

- [ ] **Step 8: Perform one manual browser smoke check**

Run:

```bash
npm run workbench -- --manifest tests/fixtures/deck-manifest-valid.json --port 4173
```

Verify:

- title edit persists to the manifest;
- stale ETag yields a visible conflict;
- preview reloads after render;
- arbitrary HTML is rendered as text, not executed;
- QA status distinguishes blocked, pending and ready.

- [ ] **Step 9: Commit the controlled editor**

```bash
git add workbench/index.html workbench/app.js workbench/styles.css scripts/test-workbench-contract.js package.json
git commit -m "Make deck iteration fast without weakening design contracts" \
  -m "Constraint: the editor exposes only registry-approved fields" \
  -m "Rejected: general contenteditable and CSS editors | they bypass layout and QA guarantees" \
  -m "Confidence: medium" \
  -m "Scope-risk: broad" \
  -m "Directive: new editor controls require a manifest field and layout-registry declaration first" \
  -m "Tested: workbench server test; workbench contract test; manual localhost smoke check" \
  -m "Not-tested: touch-device authoring"
```

---

### Task 8: Make PPTX Fidelity Explicit

**Files:**
- Create: `references/pptx-export-strategies.json`
- Create: `scripts/analyze-pptx-fidelity.js`
- Create: `scripts/test-pptx-fidelity-contract.js`
- Modify: `scripts/generate-archetype-deck.js:671-717`
- Modify: `scripts/export-pptx-client.js:157-168`
- Modify: `scripts/export-pptx-client.js:545-577`
- Modify: `scripts/export-pptx.js`
- Modify: `scripts/test-pptx-export.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: manifest archetype, generated HTML and layout registry strategy
- Produces: per-slide `{ strategy, editableObjects, rasterObjects, warnings }` and a deck-level fidelity report

- [ ] **Step 1: Write the failing fidelity contract test**

The test must:

- load every layout code from `layout-registry.json`;
- require an export strategy for every code;
- generate the valid manifest fixture;
- assert the report contains one entry per slide;
- fail if a slide silently uses `unknown`.

Expected report shape:

```json
{
  "version": 1,
  "deckId": "annual-mobility-2026",
  "summary": {
    "editable": 2,
    "hybrid": 0,
    "rasterFallback": 0,
    "unsupported": 0
  },
  "slides": [
    {
      "slideId": "cover",
      "archetype": "A1",
      "strategy": "editable",
      "editableObjects": ["title", "subtitle"],
      "rasterObjects": [],
      "warnings": []
    }
  ]
}
```

- [ ] **Step 2: Run the test and verify failure**

```bash
node scripts/test-pptx-fidelity-contract.js
```

Expected: FAIL because the analyzer does not exist.

- [ ] **Step 3: Add export strategies**

Create `references/pptx-export-strategies.json`:

```json
{
  "version": 1,
  "strategies": {
    "A1": { "mode": "editable", "adapter": "hero" },
    "A2": { "mode": "editable", "adapter": "statement" },
    "A3": { "mode": "hybrid", "adapter": "timeline" },
    "A4": { "mode": "editable", "adapter": "split" },
    "A5": { "mode": "editable", "adapter": "metric" },
    "A6": { "mode": "editable", "adapter": "comparison" },
    "A7": { "mode": "editable", "adapter": "grid" },
    "A8": { "mode": "hybrid", "adapter": "mechanism" },
    "A9": { "mode": "editable", "adapter": "table" },
    "A10": { "mode": "editable", "adapter": "quote" },
    "A11": { "mode": "editable", "adapter": "grid" },
    "A12": { "mode": "editable", "adapter": "closing" },
    "IMG": { "mode": "hybrid", "adapter": "image-compare" }
  }
}
```

- [ ] **Step 4: Stamp semantic export metadata into HTML**

Every generated section must include:

```html
<section
  data-slide-id="share"
  data-archetype="A5"
  data-pptx-strategy="editable">
```

The values must come from manifest and registry, not class-name heuristics.

- [ ] **Step 5: Make the client exporter dispatch by archetype first**

Replace `getSlideType` priority with:

```js
function getSlideType(sec) {
  var archetype = sec.getAttribute('data-archetype');
  var byArchetype = {
    A1: 'hero',
    A2: 'statement',
    A3: 'timeline',
    A4: 'split',
    A5: 'metric',
    A6: 'comparison',
    A7: 'grid',
    A8: 'mechanism',
    A9: 'table',
    A10: 'quote',
    A11: 'grid',
    A12: 'closing',
    IMG: 'image-compare',
  };
  if (archetype && byArchetype[archetype]) return byArchetype[archetype];
  return 'content';
}
```

Unknown legacy HTML may still use `content`, but manifest-generated HTML must never do so.

- [ ] **Step 6: Stop hardcoding Calibri for known semantic text**

For known elements, replace hardcoded `fontFace: 'Calibri'` with:

```js
fontFace: mapFont(getComputedStyle(el).fontFamily)
```

Preserve the current fallback mapping only when the computed font is unavailable in PowerPoint.

- [ ] **Step 7: Emit fidelity reports from browser and CLI export paths**

The local workbench export endpoint writes:

- `<deck>.pptx`
- `<deck>.pptx-fidelity.json`

If `unsupported > 0`, export may complete but the pipeline state becomes `blocked`. If `hybrid > 0`, state may become `ready` only when every raster object is listed in the report.

- [ ] **Step 8: Run export tests**

```bash
node scripts/test-pptx-fidelity-contract.js
npm run test:pptx-export
```

Expected: PASS; no manifest-generated slide uses unknown fallback.

- [ ] **Step 9: Commit the explicit export contract**

```bash
git add references/pptx-export-strategies.json scripts/analyze-pptx-fidelity.js scripts/test-pptx-fidelity-contract.js scripts/generate-archetype-deck.js scripts/export-pptx-client.js scripts/export-pptx.js scripts/test-pptx-export.js package.json
git commit -m "Tell users exactly what remains editable after export" \
  -m "Constraint: complex visuals may degrade only through declared hybrid strategies" \
  -m "Rejected: claiming blanket PPTX fidelity from a generic text fallback | it hides visual loss" \
  -m "Confidence: medium" \
  -m "Scope-risk: broad" \
  -m "Directive: every new archetype requires an explicit PPTX strategy and adapter test" \
  -m "Tested: PPTX fidelity contract; PPTX export smoke suite" \
  -m "Not-tested: pixel parity in every PowerPoint desktop version"
```

---

### Task 9: Upgrade Evidence Labels to Verifiable Sources

**Files:**
- Create: `tests/fixtures/deck-manifest-evidence-invalid.json`
- Create: `scripts/test-evidence-sources.js`
- Modify: `scripts/deck-manifest.js`
- Modify: `scripts/generate-archetype-deck.js`
- Modify: `scripts/test-evidence-ledger.js`
- Modify: `references/deck-manifest.schema.json`
- Modify: `references/validation.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: per-slide `evidence[]`
- Produces: strict source validation for manifest decks and `data-evidence-id` traceability in HTML

- [ ] **Step 1: Add a verified-without-source fixture**

Evidence item:

```json
{
  "id": "ev-missing-source",
  "claimId": "share",
  "status": "verified",
  "label": "38%"
}
```

The fixture must otherwise be a valid Deck Manifest v1.

- [ ] **Step 2: Write the failing evidence-source test**

Rules:

```js
if (item.status === 'verified') {
  requireString(item.source?.url, `${path}.source.url`);
  requireString(item.source?.locator, `${path}.source.locator`);
  requireDate(item.source?.checkedAt, `${path}.source.checkedAt`);
}
if (item.status === 'user-provided') {
  requireString(item.note, `${path}.note`);
}
if (item.status === 'illustrative' && item.source) {
  errors.push(`${path}.source is forbidden for illustrative evidence`);
}
```

Also assert each `claimId` matches the owning slide ID or a declared claim ID.

- [ ] **Step 3: Run the test and verify it fails**

```bash
node scripts/test-evidence-sources.js
```

Expected: FAIL because strict source validation is not implemented.

- [ ] **Step 4: Extend the schema and validator**

Evidence schema:

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["id", "claimId", "status", "label"],
  "properties": {
    "id": { "type": "string", "minLength": 1 },
    "claimId": { "type": "string", "minLength": 1 },
    "status": { "enum": ["verified", "user-provided", "illustrative", "needs-source"] },
    "label": { "type": "string", "minLength": 1 },
    "note": { "type": "string", "minLength": 1 },
    "source": {
      "type": "object",
      "additionalProperties": false,
      "required": ["url", "locator", "checkedAt"],
      "properties": {
        "url": { "type": "string", "pattern": "^https?://" },
        "locator": { "type": "string", "minLength": 1 },
        "checkedAt": { "type": "string", "format": "date" }
      }
    }
  }
}
```

- [ ] **Step 5: Stamp evidence IDs into generated HTML**

For visible evidence:

```html
<span
  class="evidence-label"
  data-evidence-id="ev-share-38"
  data-evidence-status="user-provided">
  user-provided
</span>
```

The strict test must confirm every precise-number slide has at least one mapped evidence ID, not merely any matching word anywhere on the slide.

- [ ] **Step 6: Preserve legacy HTML compatibility**

`test-evidence-ledger.js legacy.html` keeps the current label-only behavior. When passed `--manifest path/to/deck.manifest.json`, it invokes strict evidence validation and checks HTML `data-evidence-id` mappings.

- [ ] **Step 7: Document the truth boundary**

Add to `references/validation.md`:

```markdown
### Evidence levels

- `verified`: requires URL, locator and checkedAt; means the source was actually checked.
- `user-provided`: requires a note; means the system preserves user-supplied data without independently verifying it.
- `illustrative`: synthetic/example content; must not carry a real-source object.
- `needs-source`: delivery blocker for any precise factual claim.
```

- [ ] **Step 8: Run evidence and regression tests**

```bash
node scripts/test-evidence-sources.js
node scripts/test-evidence-ledger.js examples/template-*.html
npm run gate
```

Expected: all PASS for current templates; invalid manifest fixture fails only in the dedicated negative assertion.

- [ ] **Step 9: Commit the auditable evidence chain**

```bash
git add tests/fixtures/deck-manifest-evidence-invalid.json scripts/test-evidence-sources.js scripts/deck-manifest.js scripts/generate-archetype-deck.js scripts/test-evidence-ledger.js references/deck-manifest.schema.json references/validation.md package.json
git commit -m "Make factual confidence traceable to real evidence" \
  -m "Constraint: legacy HTML keeps label-only compatibility during migration" \
  -m "Rejected: treating a nearby verified word as source proof | it cannot be audited" \
  -m "Confidence: high" \
  -m "Scope-risk: moderate" \
  -m "Directive: verified evidence requires URL, locator, and checkedAt" \
  -m "Tested: evidence-source test; legacy evidence-ledger templates; npm run gate" \
  -m "Not-tested: automatic source retrieval"
```

---

### Task 10: Persist Visual Signoff and QA Summaries

**Files:**
- Modify: `scripts/qa.js:263-334`
- Modify: `scripts/run-deck-pipeline.js`
- Modify: `workbench/app.js`
- Modify: `references/validation.md`
- Modify: `scripts/test-qa-system-contract.js`

**Interfaces:**
- Consumes: model verdict or signed human review file
- Produces: `qa-summary.json`, immutable signoff evidence and visible workbench readiness

- [ ] **Step 1: Extend the QA contract test**

Require:

- `--visual-signoff-file`;
- rejection of bare `--visual-signoff` in production mode;
- signoff JSON fields `reviewer`, `reviewedAt`, `screenshotsManifestSha256`, `decision`;
- structured `qa-summary.json`;
- `ready` only when decision is `pass`.

Valid signoff:

```json
{
  "version": 1,
  "reviewer": "human:nonon",
  "reviewedAt": "2026-07-24T10:00:00+08:00",
  "screenshotsManifestSha256": "5c6d48fb33c4f9a4a7c3b079177618057a8784cbbdece72d5b3bb7ca98238ef1",
  "decision": "pass",
  "notes": "逐页检查标题、主 proof object、图片清晰度与底部安全区"
}
```

- [ ] **Step 2: Run the QA contract test and verify failure**

```bash
npm run test:qa-system-contract
```

Expected: FAIL until file-backed signoff is implemented.

- [ ] **Step 3: Add file-backed visual signoff**

Add CLI parsing:

```js
const visualSignoffFileIndex = optionIndex(['--visual-signoff-file']);
const visualSignoffFile = visualSignoffFileIndex >= 0
  ? args[visualSignoffFileIndex + 1]
  : null;
```

Validate the file, verify the screenshot manifest hash, copy it into the run output, and record the copied path in `qa-summary.json`.

- [ ] **Step 4: Restrict environment-variable signoff**

Allow `VISUAL_VERDICT_SIGNOFF=1` only when `NODE_ENV === 'test'`. In every other environment it must end in `needs-visual-signoff`.

- [ ] **Step 5: Write a structured QA summary**

Output:

```json
{
  "version": 1,
  "deck": "ppt/index.html",
  "passed": true,
  "state": "ready",
  "qualityScore": 82,
  "gates": {
    "grade": "pass",
    "designStrength": "pass",
    "elementQuality": "pass",
    "editorialContamination": "pass",
    "imageAudit": "pass",
    "visual": "human-signoff"
  },
  "artifacts": {
    "visualVerdict": "qa/visual-verdict.json",
    "visualSignoff": "qa/visual-signoff.json",
    "pptxFidelity": "qa/pptx-fidelity.json"
  }
}
```

- [ ] **Step 6: Show QA stages in the workbench**

The UI must display:

- floor gates;
- design strength;
- element quality;
- image audit;
- evidence sources;
- visual model/human signoff;
- PPTX fidelity;
- final run state.

Do not render a green top-level status when any required stage is pending.

- [ ] **Step 7: Run focused tests**

```bash
npm run test:qa-system-contract
npm run test:pipeline
npm run test:workbench-server
node scripts/test-workbench-contract.js
```

Expected: all PASS.

- [ ] **Step 8: Commit durable visual approval**

```bash
git add scripts/qa.js scripts/run-deck-pipeline.js workbench/app.js references/validation.md scripts/test-qa-system-contract.js
git commit -m "Make visual approval durable enough to audit" \
  -m "Constraint: production readiness cannot depend on an unrecorded environment flag" \
  -m "Rejected: boolean visual signoff without reviewer or screenshot identity | it cannot prove what was reviewed" \
  -m "Confidence: high" \
  -m "Scope-risk: moderate" \
  -m "Directive: every ready run must reference model or human visual evidence" \
  -m "Tested: QA system contract; pipeline test; workbench tests" \
  -m "Not-tested: remote review workflows"
```

---

### Task 11: Integrate, Simplify the Skill Entry, and Release

**Files:**
- Modify: `package.json`
- Modify: `SKILL.md`
- Modify: `README.md`
- Modify: `references/validation.md`
- Modify: `references/skill-healthcheck.md`
- Create: `tests/fixtures/workbench-e2e.manifest.json`
- Create: `scripts/test-authoring-e2e.js`
- Create: `scripts/test-browser-viewport.js`

**Interfaces:**
- Consumes: all previous tasks
- Produces: one documented authoring path and a full regression proof

- [ ] **Step 1: Add an end-to-end fixture**

The fixture must contain:

- eight slides;
- at least six archetypes;
- one media slot;
- one verified evidence item with source;
- one user-provided evidence item;
- one hybrid PPTX slide;
- one motion intent;
- a closing slide.

- [ ] **Step 2: Add a real Reveal viewport regression test**

Create `scripts/test-browser-viewport.js`:

```js
#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const htmlFile = process.argv[2];
if (!htmlFile) {
  console.error('Usage: node scripts/test-browser-viewport.js <deck.html>');
  process.exit(2);
}

const absolute = path.resolve(htmlFile);
if (!fs.existsSync(absolute)) {
  console.error(`File not found: ${absolute}`);
  process.exit(2);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`file://${absolute}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.Reveal && window.Reveal.isReady(), null, { timeout: 10000 });

  const failures = await page.evaluate(async () => {
    const slides = window.Reveal.getSlides();
    const problems = [];
    for (let index = 0; index < slides.length; index += 1) {
      const slide = slides[index];
      const indices = window.Reveal.getIndices(slide);
      window.Reveal.slide(indices.h, indices.v || 0, 0);
      window.Reveal.layout();
      await new Promise((resolve) => setTimeout(resolve, 120));
      const current = window.Reveal.getCurrentSlide();
      const rect = current.getBoundingClientRect();
      const heading = current.querySelector('h1, h2, [data-main-claim], .hero-title');
      const headingRect = heading ? heading.getBoundingClientRect() : null;
      const visible = rect.bottom > 0
        && rect.right > 0
        && rect.top < window.innerHeight
        && rect.left < window.innerWidth;
      const headingVisible = !headingRect || (
        headingRect.bottom > 0
        && headingRect.right > 0
        && headingRect.top < window.innerHeight
        && headingRect.left < window.innerWidth
      );
      if (!visible || !headingVisible) {
        problems.push({
          slide: index + 1,
          visible,
          headingVisible,
          rect: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          },
          headingRect: headingRect ? {
            x: headingRect.x,
            y: headingRect.y,
            width: headingRect.width,
            height: headingRect.height
          } : null
        });
      }
    }
    return problems;
  });

  await browser.close();
  if (failures.length) {
    console.error(JSON.stringify(failures, null, 2));
    process.exit(1);
  }
  console.log('Browser viewport contract: PASS');
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(2);
});
```

Run:

```bash
node scripts/test-browser-viewport.js examples/template-10-clinical-trial.html
```

Expected: PASS with every current slide and its main heading inside the 1280×720 viewport.

- [ ] **Step 3: Write the authoring E2E test**

The test must:

1. copy the fixture into a temporary run root;
2. stage media;
3. validate manifest;
4. render HTML;
5. assert eight sections and matching `data-slide-id`;
6. run QA floor without visual;
7. create a test-only signed visual artifact;
8. analyze PPTX fidelity;
9. export PPTX;
10. assert `run.json.state === "ready"`;
11. assert every artifact path in `run.json` exists.

- [ ] **Step 4: Run the E2E test and fix only product defects**

Run:

```bash
node scripts/test-authoring-e2e.js
```

Expected: PASS. Do not weaken assertions to accommodate missing artifacts.

- [ ] **Step 5: Add all new tests to the aggregate command**

Add the focused viewport script:

```json
"test:browser-viewport": "node scripts/test-browser-viewport.js examples/template-10-clinical-trial.html"
```

Add, in dependency order:

```json
"test": "npm run test:deck-stats && npm run test:doc-counts && npm run test:deck-manifest && npm run test:layout-registry && npm run test:pipeline && npm run test:workbench-server && node scripts/test-workbench-contract.js && node scripts/test-media-stage.js && node scripts/test-evidence-sources.js && node scripts/test-pptx-fidelity-contract.js && node scripts/test-authoring-e2e.js && npm run test:validate-overflow && npm run test:reference-contract && npm run test:launch-grade-contract && npm run test:qa-system-contract && npm run gate && npm run test:off-template-regression && npm run test:lint-main-claim && npm run test:initial-slide-visible && npm run test:browser-viewport && npm run test:text-collision && npm run test:pin-collision && npm run test:text-break && npm run test:font-loading && npm run test:pptx-export && npm run test:route-deck && npm run test:skeleton-diff && npm run seed:quality"
```

- [ ] **Step 6: Compress SKILL.md to the new happy path**

The quick path becomes:

```markdown
1. 创建或转换 `deck.manifest.json`，字段契约见 `references/deck-manifest.md`。
2. 运行 `node scripts/run-deck-pipeline.js --manifest <file> --out <run-root>`。
3. 需要人工改稿时，运行 `npm run workbench -- --manifest <file>`。
4. 只在 `run.json.state` 为 `ready` 时交付；其他状态按 `references/validation.md` 处理。
```

Keep A/B/C routing and Gate mode summaries, but move field-level, media, evidence, workbench and export details to their authoritative references. Target: `SKILL.md` below 500 lines without deleting safety rules.

- [ ] **Step 7: Update README**

Document two user journeys:

```markdown
## 快速生成

node scripts/run-deck-pipeline.js --manifest output/demo/deck.manifest.json --out output/demo

## 浏览器改稿

npm run workbench -- --manifest output/demo/deck.manifest.json --port 4173
```

Explain that generated HTML remains self-contained, while the workbench is an optional authoring surface.

- [ ] **Step 8: Run self-review checks on documentation**

```bash
npm run lint:doc-counts
npm run lint:docs
npm run test:reference-contract
```

Expected: all PASS and no dead file pointers.

- [ ] **Step 9: Run the complete verification suite**

```bash
npm test
```

Expected: PASS with all existing and new tests green.

- [ ] **Step 10: Run a real browser and export verification**

Generate one representative deck, then run:

```bash
node scripts/visual-qa.js output/demo/ppt/index.html --out output/demo/qa/screenshots
node scripts/test-browser-viewport.js output/demo/ppt/index.html
node scripts/export-pptx.js output/demo/ppt/index.html -o output/demo/ppt/demo.pptx
node scripts/test-pptx-export.js output/demo/ppt/index.html
```

Expected:

- all slides visible in the real 1280×720 browser viewport;
- screenshot manifest exists;
- PPTX slide count equals HTML section count;
- PPTX fidelity report contains no unsupported slide;
- final run state is `ready` only after visual evidence is present.

- [ ] **Step 11: Commit the integrated authoring release**

```bash
git add package.json SKILL.md README.md references/validation.md references/skill-healthcheck.md tests/fixtures/workbench-e2e.manifest.json scripts/test-authoring-e2e.js scripts/test-browser-viewport.js
git commit -m "Turn the presentation skill into a complete authoring and delivery system" \
  -m "Constraint: self-contained HTML and existing visual quality gates remain first-class" \
  -m "Rejected: adding more templates before fixing authoring and delivery state | templates do not reduce revision cost" \
  -m "Confidence: high" \
  -m "Scope-risk: broad" \
  -m "Directive: future features must preserve manifest ownership, fail-closed readiness, and explicit export fidelity" \
  -m "Tested: npm test; browser viewport verification; visual QA screenshots; PPTX export verification" \
  -m "Not-tested: collaborative multi-user editing and cloud hosting"
```

---

## Milestones

| 周期 | 可独立验收的交付物 | 对应任务 |
|---|---|---|
| Week 1 | 测试恢复、Deck Manifest v1、可查询布局契约 | Task 1–3 |
| Week 2 | 统一状态机、run manifest、可复现素材入库 | Task 4–5 |
| Week 3 | 本地工作台和受控浏览器编辑 | Task 6–7 |
| Week 4 | PPTX 保真报告、严格证据链、视觉签字和完整发布 | Task 8–11 |

## Completion Criteria

- `npm test` 全绿。
- 一个 manifest 可以稳定生成 HTML、QA 报告、PPTX 和 fidelity report。
- 浏览器工作台修改后，manifest、HTML 和导出结果保持一致。
- 未进行视觉审核时，最终状态明确为 `needs-visual-signoff`，不能宣称 ready。
- 所有 verified 数据可追溯到 URL、定位和检查日期。
- 所有 manifest 生成页面都有明确 PPTX 策略，不出现无报告的通用降级。
- 最终 HTML 保持自包含，并继续支持 Reveal.js 演示、PDF 和 PPTX 导出。
