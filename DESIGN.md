# Reveal PPT Design Contract

## Purpose

This repository produces launch-grade Reveal.js presentation decks. The target quality is closer to a keynote opener, editorial feature, architectural plate, or product launch room than to a generic slide template.

The system must generate decks whose structure, proof objects, typography, motion, and visual language are native to the topic. A new color palette is not a new design.

## Evidence Surfaces

- `examples/template-01-editorial-serif.html` through `examples/template-08-isometric.html` are the current seed examples (01-05 original grammars; 06-08 brutalist / memphis / isometric — three orthogonal styles added for maximum cross-template differentiation).
- `SKILL.md` is the generation workflow contract.
- `references/design-principles.md` and `references/design-polish.md` define the visual quality bar.
- `references/layered-architecture.md` defines the six-layer generation contract across production, style, argument, taste, QA, and task governance.
- `references/template-invariants.json` is the machine-readable contract for template-native objects.
- `scripts/lint-design.js`, `scripts/validate.js`, `scripts/visual-qa.js`, and `scripts/grade-gate.js` are required verification surfaces.

## Layered Contract

Deck generation follows the six-layer model in `references/layered-architecture.md`:

1. Production pipeline turns structured content into Reveal.js HTML and PPTX-ready artifacts.
2. Style system selects visual grammar, chart language, Bento/grid logic, and reference quality.
3. Expression logic protects action titles, ghost-deck argument flow, chart annotation, and citations.
4. Taste constraints reject AI-template tells and tune bolder/quieter/distilled/polished variants.
5. Quality review checks hierarchy, readability, alignment, crowding, accessibility, responsive behavior, and export risk.
6. Task governance keeps brief, goals, ledger, checkpoints, steering, and final gate evidence explicit.

## Non-Negotiable Standard

Every template must declare a design method before it declares colors:

1. Domain metaphor: what real-world surface is this deck imitating?
2. Proof object: what object on the page carries the main claim?
3. Layout logic: how does the audience's eye move?
4. Material system: what textures, rules, labels, or artifacts make it credible?
5. Motion grammar: how should the page enter, reveal, or behave?

If two templates still read as the same skeleton after colors and fonts are mentally removed, they fail the design standard.

## Anti-Patterns

Avoid these unless a specific domain genuinely requires them:

- Left rail + center board + right claim panel as a reusable default.
- Generic dashboard grids, ghost cards, soft rounded panels, and side-stripe emphasis.
- Outfit / DM Sans / Inter-style neutral SaaS monoculture.
- Generic gradient text, generic purple-blue hero gradients, and decorative glow blobs.
- Mermaid-default diagrams when a bespoke SVG, diagram, chart, or physical metaphor would carry the claim better.
- Slides whose proof lives in explanatory text instead of a visible object.

## Template 03 Method: Architectural Drawing

Use an architecture-native system:

- Full drawing sheet, title block, dimension chains, plan rooms, section markers, grid ticks, scale bars.
- The proof object is the plan or section drawing itself.
- Labels are embedded around the drawing perimeter, not isolated in a side dashboard.
- The layout should read like a printed architectural plate: paper, rules, annotations, measured space.

Do not use a left level rail plus right claim board on the cover.

## Template 04 Method: Live Keynote Stage

Use a launch-event system:

- Full-bleed stage, giant screen, countdown/ticker, audience floor, light beams, camera frame, product drop.
- The proof object is the moment of reveal on the main stage.
- Supporting data should behave like stage props, lower thirds, call sheets, or live cues.
- The layout should feel temporal and performative rather than analytical.

Do not use an audience rail plus signal column as the cover skeleton.

## Template 05 Method: Field Desk / Workshop Table

Use a physical research table system:

- Notebook spread, corkboard/map, sample tags, envelopes, tape, route marks, handwritten annotations.
- The proof object is the working surface where observation becomes method.
- Composition may overlap, rotate slightly, and feel tactile while staying legible.
- The layout should feel like a real table used for collecting and sorting evidence.

Do not use a sample ledger plus route board plus specimen claim in rigid columns on the cover.

## Template 06-08 Methods

Templates 06 (brutalist), 07 (memphis), 08 (isometric) each push one orthogonal style to its limit and give every page a distinct spatial primitive rather than repeating a single skeleton. See the seed table in `SKILL.md` and the per-template `designGrammar` / `coverObjects` / `deckObjects` in `references/template-invariants.json`. The same non-negotiable standard applies: after mentally removing colors and fonts, no two templates may share a skeleton.

## Verification Gate

Before claiming a template improvement:

1. Run `node scripts/grade-gate.js <file>` (all eight gates: G1 lint + G2 validate + G3 label-overlap + G4 lint-main-claim + G5 evidence-ledger + G6 color-role + G7 contrast-aa + G8 canvas-fill).
2. Run `node scripts/visual-qa.js <file> --annotate-overflow --out <dir>`.
3. Compare contact sheets with colors mentally removed. Similar skeletons fail even if lint passes.

Resolved: the seed set is `template-01..08` (8 implemented). `references/template-invariants.json` is the canonical machine-readable contract for all eight. The 10 design grammars in `references/design-polish.md` (financial-terminal, clinical-lab, …) are unimplemented references with logical chapter numbering — they do not correspond to `examples/` filenames.
