# Multi-Angle Skill Evaluation — revealjs-presentation (v15.3.0)

**Date:** 2026-07-27 · **Method:** 6 parallel read-only specialist agents (ralph-style: spawn wide → collect → synthesize). All findings carry file:line or command evidence. No agent modified the repo.

---

## Executive verdict

The **engineering substrate is sound and honest where it actually runs**: G1–G14 pass on real templates with a consistent fail-closed pattern, the e2e capstone drives the real pipeline with SHA-bound signoff, the require graph is acyclic, and several "known issues" in memory turned out to be **already patched** (G2 abs-SVG false-positive, G12 `tension` partially closed).

The problems cluster into **two patterns** and **one honesty gap about the headline claim**:

1. **"Built but not wired"** — defenses exist on disk but aren't connected to the delivery path (a PPTX-fidelity placeholder, an orphaned CSS-var check, an anti-contamination gate that doesn't run by default, a coverage gate not in `npm test`, three hard gates with zero tests).
2. **Doc / SSOT drift** — every headline count is stale (voices 14→12, arcs 8→9, failure gates 19→16), and the routing engine contradicts the skill's own canonical example.
3. **The combinatorial "design" claim doesn't hold** — 14 voices are color/font recolorings of one editorial skeleton the generator injects *unconditionally*; real design only happens on Path C, which is a manual Claude workflow with no generator script.

Net: **trustworthy as a template engine with strong QA gating; oversold as a design system.** The highest-leverage fixes are wiring + honesty passes, not new features.

---

## Findings by severity

### CRITICAL

**C1 — Voices are token recolorings, not structural designs.**
All 12 `tokens/*.css` voice files are pure `:root` declarations (`--c-bg/--c-fg/--c-accent/--f-display/--f-body/--f-mono`) — zero structural CSS. The generator's own diagnostic admits it: `generate-archetype-deck.js:269-273` ("同一骨架套 12 个 registry voice, 归一化色值后 diff 只剩 1 行"). The VOICE_SIGNATURES overlay (`:279-380`) is a real but shallow attempt (~5 lines each bolted onto the identical `deck-flex` + `kicker/pin/evidence-label` skeleton). **Impact:** the "14×12×8 combinatorial design space" collapses to ~14 colors on one skeleton. The headline value proposition is the weakest part of the system.

**C2 — The editorial skeleton is injected unconditionally by the generator.**
`generate-archetype-deck.js:572` injects `kicker` + `evidence-label` + `pin` into *every* assembled section; the global CSS (`:858-860`) hard-codes them as mono/uppercase/letter-spaced eyebrows — editorial-archive typography by definition. This is the "gravity center" the brief names, and **it is not bypassable by Path B**. Combined with C1, even off-library topics inherit an editorial bone structure.

### HIGH

**H1 — Fake-success placeholder in the production pipeline.**
`run-deck-pipeline.js:130-131` hardcodes the `pptx-fidelity` stage to `{ ok: true, note: 'placeholder — Task 8 wires analyze-pptx-fidelity.js' }`. `analyze-pptx-fidelity.js` exists on disk (2 KB) but is **never invoked anywhere**. A deck can exit the pipeline as `ready` with PPTX fidelity entirely unchecked — a direct violation of the project's own `no fake completion / placeholder success` guard.

**H2 — "完全可编辑 PPTX" is materially false.**
`references/pptx-export-strategies.json` marks A3 (timeline) / A8 (mechanism) / IMG (image-compare) as **hybrid** ("rasterize complex-visual"). `export-pptx-client.js:140-157`: `mapFont()` still returns `'Calibri'` for outfit/inter/unmatched fonts (the "Stop hardcoding Calibri" commit 187e9ee only replaced 29 refs via a helper, not the fallback). `SKILL.md:489` states "完全可编辑" with **no caveat**.

**H3 — Three hard fail-closed gates have ZERO behavioral tests.**
`check-editorial-contamination.js`, `check-arc-adherence.js`, `check-design-brief.js` are hard floor gates in `qa.js` (`:390-457`) but no test file references any of them. A regression could silently pass or wrongly block, undetected.

**H4 — Every headline count is stale (SSOT drift).**
- Voices: SKILL.md says "14 voice" (`:20, :33, :272, :273, :277, :558`) but `tokens/voices.json` (the declared "单一真相源") defines **12**. (`route-deck.js:12` docstring also says 14.)
- Arcs: SKILL.md says "8 条之一" (`:310, :514, :543`) but `narrative-arcs.md` defines N1–**N9**, and SKILL.md `:24` itself names "N9 舞台揭幕".
- Failure gates: SKILL.md says "19 条" (`:68, :531`) but the table (`:368-385`) enumerates only #1–#16.
**Impact:** a maintainer adding a voice/arc cannot trust the docs; the SSOT pattern is undermined because SKILL.md was never reconciled to the registries.

**H5 — `verifyVarDefinitions` is orphaned from the delivery pipeline.**
The CSS-var resolution defense exists (`test-style-coverage.js:50,77`) but is **not wired into `grade-gate.js` or `qa.js`** — grep shows it referenced only in its own file. Archetype vars (`--c-bg-paper`/`--c-rule`) silently vanish if undefined in `base.css` → deck ships with missing styling while every gate stays green. Fix is one `spawnSync` away.

**H6 — `check-editorial-contamination` is theater, and the skill evades its own gate.**
Matches a fixed 16-word `ARCHIVE_TOKENS` list by class name (`check-editorial-contamination.js:32-36`) — trivially bypassed by renaming `masthead`→`header-bar`. Direct self-evasion: the consulting voice renamed its seal from `stamp`/`archive-stamp` to `memo-seal`/`seal` to dodge the gate (`generate-archetype-deck.js:332-334`). It also **does not run in `grade-gate.js`** — only in `qa.js` with `--topic` (`qa.js:445`), so the default QA path skips it.

**H7 — Working-tree `npm test` is RED (mid-refactor).**
`npm test` bails at step 6/28 (`test-authoring-e2e`) in 57s because uncommitted `design-strength-check.js` (+122/-9: adds `craftDensity` + `structuralVariety`) makes G12 reject the e2e fixture deck. Commit HEAD is green. This is the e2e canary working correctly — but the tree is currently unshippable. *Note: the design-critic's `craftDensity` critique reflects this uncommitted version.*

**H8 — "Quick mode" carries the full ceremony.**
"做个PPT" still requires ghost deck + 7-line Theme-to-Design Router (`:304`) + 4-field design contract (`:318`) + craft pass (`:29`) + `qa.js` full pipeline incl. 14 gates + visual-verdict. There is no honest one-shot path; success criteria (`:542-549`) make the router + contract + arc-adherence effectively mandatory.

**H9 — The `--wow` footgun.**
`route-deck` routes from topic/keyword only; "惊艳/发布会级" is a quality axis the machine can't see (`SKILL.md:275`). A user saying "做个惊艳的赛博朋克PPT" gets Path B unless Claude *remembers* `--wow`. Worse, "惊艳" is *also* a Gate-mode trigger (`:95`), so it both enters Gate (STOP after P1) and *should* divert to Path C — but only if the flag is passed.

### MEDIUM

- **M1** — `--editorial-topic` exempts the contamination gate **without** entering `exemptions[]` or capping state (`qa.js:100` vs `:121-126` record only the 5 `--no-*`/`--allow-*` flags). The one unaudited hole in the "non-overridable" claim.
- **M2** — `design-strength` metric gameability: `tension`/`metaphor`/`craftDensity` all high gameability. `craftDensity` floor is only 10 (`design-strength-check.js:788`); template-04 hits 95 via 19 gradients + 7 shadows — high score, no judgment of quality. The skill's own docs admit the `tension` false-negative and warn "别为刷 tension 硬塞 grid 非对称——Goodhart".
- **M3** — Path C is a manual Claude workflow, not code. No bespoke generator script exists; `route-deck` returns `acceptance: ["node scripts/qa.js"]` — i.e. "read the doc, then run QA." Defensible only if "skill" = Claude instructions.
- **M4** — `route-deck` contradicts SKILL.md's canonical example. SKILL.md:277 says cyberpunk→Path B (technical voice); actual `route-deck.js --topic "做个赛博朋克PPT"` → **Path A, seed=template-02-dark-tech**.
- **M5** — G2 and G9 run the same scan in two browsers: `validate.js` (G2) and `check-overflow.js` (G9) each launch their own Playwright + `fs.readFileSync('overflow-detect.js')` + `addScriptTag`.
- **M6** — ~10 serial chromium cold-starts per QA run (validate, check-overflow, spatial-integrity, text-collision, pin-collision, text-break, label-overlap, canvas-fill, contrast-aa, color-role). High latency discourages local runs.
- **M7** — Contract tests are string-token, not behavioral. `test-qa-system-contract.js:42-51` requires `qa.js` to *contain the literal* "visual-verdict.js"/"audit-image-assets.js"; renaming breaks them, but gutting the gate while leaving the string passes them. False-confidence risk.
- **M8** — `visual-verdict` is never exercised end-to-end. `test-authoring-e2e.js:74-90` fabricates a SHA-256 signoff to bypass the blocked sensory layer; no test drives a real model verdict.
- **M9** — Deferred-plan honesty is weak: `docs/superpowers/plans/2026-07-24-...md` has **0/92 checkboxes** marked `[x]` despite Task 8/9/signoff commits existing (187e9ee, f0e9d6f, 3335c0f). No "deferred" section.
- **M10** — Gate meta-rule over-stop risk (`SKILL.md:106`): trigger keywords ("惊艳/keynote/专业") collide with everyday requests; no cheap "I trust you, just go" escape.

### LOW

- **L1** — 5 orphan scripts unreferenced anywhere: `fetch-assets`, `generate-param-variants`, `generate-style-examples`, `test-bp-regression`, `test-style-coverage`. The last two are coverage/regression gates **not in `npm test`** — coverage may be silently unenforced.
- **L2** — 3 prior bespoke cases lost: `SEED-CASE-INDEX.md` footer notes vaporwave/data-viz/cyberpunk master-refs were in a temp dir that was cleaned between sessions. Path C's case library is thinner than "累积越用越强" implies.
- **L3** — `references/layered-architecture.md` says "十四门禁" but enumerates only 12; treats pin-collision as a "专项脚本".
- **L4** — Routing table (`SKILL.md:504-537`) has 2 orphans: `deck-manifest.md`, `skill-healthcheck.md`.
- **L5** — `design-strength-check.js` `measure()` spans `:189-652` (~460 LOC) — a god-function.
- **L6** — G9 checks `result.status===0` (`grade-gate.js:254`) but G10/G13/G14 don't (`:282, :357, :382`). Harmless in practice but a real asymmetry.
- **L7** — `tcm-herbal` PNG deletions in `git status` are cosmetic (HTML + case.md intact, still registered/routable).

---

## Cross-cutting themes (the synthesis value)

**Theme A — "Built but not wired" (H1, H5, H6, L1).** A clear, recurring pattern: defenses exist on disk but aren't connected to the delivery path. `analyze-pptx-fidelity.js` written but never called; `verifyVarDefinitions` written but not attached to grade-gate; `check-editorial-contamination` written but not in grade-gate; `test-style-coverage` (a coverage gate) not in `npm test`; three hard gates with zero tests. **The defense surface is wider than the enforced surface, and nothing tracks the gap.** This is the single most actionable pattern.

**Theme B — Honesty / fake-success gaps (H1, H2, H6, M1, M7, M9).** Multiple places claim success/coverage that isn't real: the pptx-fidelity placeholder, the "完全可编辑" export claim, the self-evaded contamination gate, the unaudited `--editorial-topic` escape, the all-pending plan with done commits, the string-token contract tests. This matters most because it erodes trust in the *entire* gate system and directly violates the project's stated `no fake completion` guard.

**Theme C — The combinatorial design claim doesn't hold (C1, C2, M3).** Voices are color swaps; the editorial skeleton is unconditional; Path C is manual. The headline "14×12×8 adapts to any topic" presents template-engine output as design capability. Real design happens only on Path C, which sits outside the automated pipeline.

**Theme D — Doc drift / SSOT unmaintained (H4, M4, L3, L4).** Counts wrong everywhere; the routing engine contradicts the skill's own example; the architecture doc is stale. The SSOT pattern is undermined because SKILL.md is never reconciled to the registries.

**Theme E — Goodhart / proxy measurement (M2, H6).** `design-strength` measures class names, decoration counts, and panel density — all gameable. Gates reward measurability artifacts (renamable classes, addable gradients, one big numeral) over design intent, so a deck can pass all gates while remaining a reskin.

**Theme F — Ceremony tax vs skipping (H8, H9, M10).** Quick mode isn't quick; the gate density (justified by real past failures — the meta-rule shows the author's scars) has tipped from "enforced quality" into ceremony that pushes users toward skipping — which is the failure mode the gates were built to prevent.

---

## What's genuinely good (for balance)

- **P1** — G1–G14 genuinely work: both spot-check templates pass, fail-closed pattern (`detectScriptBug`/`parseFailed`) applied consistently.
- **P2** — Two "known issues" from memory were **already patched**: G2 abs-SVG false-positive (`overflow-detect.js:40-46 hasOutOfFlowDescendant`), G12 `tension` partial (z-diagonal detection, `:276-294`). The record was stale.
- **P3** — E2E capstone is genuinely strong — real `run-deck-pipeline.js`, real media staging, real QA floor, real SHA-256 signoff binding, ~13 assertions.
- **P4** — Production visual signoff is SHA-256–bound + human-attested; `detectSelfReviewReviewer` bans AI/agent/self signoff.
- **P5** — `0` TODO/FIXME/XXX/HACK in `scripts/`; acyclic require graph; no hardcoded paths in tests.
- **P6** — Overflow logic already consolidated under one shared scanner (`overflow-detect.js`).
- **P7** — `generate-deck.js` is single-responsibility (voice→content→assemble→optional gates); shells to `qa.js` rather than inlining QA.
- **P8** — Seed-template gap (9/10 unlanded) is honestly disclosed at `SKILL.md:404`.
- **P9** — The working-tree RED (H7) is itself evidence the e2e canary works.

---

## Prioritized recommendations

1. **Wire the orphaned defenses + add missing tests (Themes A+B).** Wire `analyze-pptx-fidelity.js` into the pipeline (or delete the placeholder `ok:true`); wire `verifyVarDefinitions` into `grade-gate`; add behavioral tests for `check-editorial-contamination` / `check-arc-adherence` / `check-design-brief`; add `test-style-coverage` to `npm test`. **Highest leverage, lowest risk.**
2. **Fix the honesty disclosures (Theme B).** Add PPTX hybrid/Calibri caveats to `SKILL.md §导出`; record `--editorial-topic` in `exemptions[]`; reconcile the deferred-plan checkboxes (or add a Deferred section); convert the string-token contract tests to behavioral ones.
3. **Reconcile doc counts to registries (Theme D).** Mechanical pass: 14→12 voices (or migrate the 2 legacy voices into `voices.json`), 8→9 arcs, 19→match the table; fix `route-deck` cyberpunk routing *or* SKILL.md:277; fix `layered-architecture.md`.
4. **Decide the working-tree state (H7).** Commit the `design-strength-check.js` hardening (and raise the e2e fixture deck to meet it) or stash it — the tree is currently red.
5. **Address the design-claim honesty (Theme C).** Either reframe Path B honestly as "templated output with voice recoloring" and Path C as the real design path, or invest in making voices structural (the harder fix). At minimum, stop selling combinatorial variety as design capability.
6. **Reduce ceremony for the common path (Theme F).** Add a real trivial mode (route-deck → generate → grade-gate floor → deliver, defer full QA unless polish requested); fix the `--wow`/Gate collision (auto-infer `--wow` from Gate triggers).

---

## Per-angle sources

| Angle | Agent | One-line verdict |
|---|---|---|
| 1 Architecture | architect | Sound acyclic layering; top risk = fake-success leakage + gate-set sprawl, not coupling. |
| 2 Design system | critic | Does NOT reliably produce *designed* decks; combinatorial claim is the weakest part. |
| 3 Gates | code-reviewer | Trustworthy for what they catch; biggest weakness is a wiring gap (orphaned var-check), not a lie. |
| 4 Completeness | analyst | Gap moderate and concentrated; Path C + PPTX "fully editable" are the real overstatements. |
| 5 Tests | test-engineer | Architecturally sound; weakest area = newer design-ceiling gates with zero/string-token tests. |
| 6 DX | critic | Usable but heavy; stale counts + full-ceremony quick mode are the top friction. |
