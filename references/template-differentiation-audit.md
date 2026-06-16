# Template Differentiation Audit

> ⚠️ 历史审计记录：本文档记录了从 15 套规划模板收敛到 5 套已实现种子模板（01-05）的设计审查过程。下文 template-06-15 的审计条目是**规划阶段记录**，这些模板尚未落地为种子 HTML（见 SKILL.md 种子模板节与 `template-invariants.json`）。方法论（Audit Standard、contact-sheet 去色对比法、escalation path）仍然适用，是失败门禁 #9/#10 的依据。

Fresh evidence captured with:

```sh
for f in examples/template-*.html; do
  base=$(basename "$f" .html)
  node scripts/visual-qa.js "$f" --out "/private/tmp/${base}-visual" --wait=300
done
```

## Audit Standard

High-quality seed templates must differ in design method, not only in palette,
typeface, or decorative objects.

A template passes the differentiation bar when:

- the cover reads as a domain-native interface or physical scene;
- the proof slide uses a domain-specific proof object;
- the mechanism slide changes the composition rhythm;
- the closing slide is not just centered large text;
- class names expose real domain objects instead of generic `card`, `panel`,
  `hero`, or `section` grammar;
- a screenshot review can distinguish the template even after mentally removing
  color.

## Current Verdict

Strong differentiation:

- `template-06-financial-terminal`: terminal cockpit with quote board,
  price ladder, and ticker tape.
- `template-08-civic-infrastructure`: GIS/city-ops map with corridor readouts
  and service rings.
- `template-13-system-flow`: runtime board with handoff bus, nodes, and failure
  rail.
- `template-14-code-walkthrough`: editor/debugging surface with visible code
  and claim overlay.
- `template-15-data-visual-studio`: notebook-like question rail, chart wall,
  and insight panel.

Moderate differentiation, needs inner-slide strengthening:

- `template-01-editorial-serif`: archive desk is clear, but several pages still
  lean on paper-card composition.
- `template-02-dark-tech`: control-room direction is clear; ensure later pages
  do not collapse into generic dashboard panels.
- `template-03-minimal-spatial`: repaired into an architectural plate with
  title block, dimension chain, measured plan, notes, and north mark.
- `template-04-vibrant-gradient`: repaired into a live keynote stage with
  giant screen, camera frame, audience floor, ticker, beams, and product drop.

Weakest / highest-priority redesign:

- `template-07-clinical-lab`: evidence tray is relevant but the cover still has
  a large headline plus sample circles. It should become a lab bench interface
  with assay status, endpoint strip, patient/sample rail, and evidence grade.
- `template-09-legal-casefile`: casefile grammar is relevant but close to the
  editorial/archive template. It needs docket tabs, exhibit stamping, clause
  margin, and judge-facing issue matrix.
- `template-10-luxury-atelier`: material palette is relevant but currently looks
  like a color swatch board. It needs stronger atelier/showroom expression:
  lookbook spread, material callouts, ritual sequence, and product window.
- `template-11-cinematic-storyboard`: frame cards are relevant but still too
  close to generic title-plus-strip. It needs a timeline/film leader, active
  frame, shot metadata, and cut marks that dominate the cover.
- `template-12-motion-sequence`: rhythm dots are relevant but sparse. It needs
  a motion timeline with cue stack, frame states, easing curve, and reduced
  motion note built into the visual system.

## Required G004 Changes

Redesign at least the high-priority six covers and one inner-slide rhythm per
template:

- 05: field notebook cover + workshop canvas proof.
- 07: clinical bench cover + endpoint/assay proof.
- 09: docket cover + IRAC/issue matrix proof.
- 10: atelier/lookbook cover + ritual/material proof.
- 11: film-leader cover + shot timeline proof.
- 12: motion-timeline cover + cue/easing proof.

## Post-G004 Verdict

The six high-priority templates were redesigned so their cover grammar is no
longer a color-only or single-object variant:

- `template-05-nature-fresh`: field notebook / workshop table with notebook
  spread, pinned route map, sample tags, twine line, and specimen envelope.
- `template-07-clinical-lab`: clinical bench with sample rail, endpoint strip,
  assay board, and evidence grade.
- `template-09-legal-casefile`: docket surface with tabs, clause margin, IRAC
  issue grid, and judge-facing note.
- `template-10-luxury-atelier`: showroom window with product plinth, lookbook
  strip, material chips, and restraint-led product claim.
- `template-11-cinematic-storyboard`: film leader with shot metadata, active
  frame, take stack, and cut marks.
- `template-12-motion-sequence`: cue sheet with timing stack, motion workbench,
  timeline stage, easing curve, and reduced-motion note.

All 5 implemented template native object checklist entries must remain present in
`references/template-invariants.json`, and `scripts/test-reference-contract.js`
must read that manifest as the canonical machine-checkable source. A seed
template is not acceptable if it can pass by keeping the same cover skeleton and
changing palette, typography, or decorative texture only.

Future audits should use contact-sheet evidence: place the first slide
screenshots side-by-side, mentally remove color and type, and reject any pair
that still shares the same information skeleton.

## Final Contact-Sheet Repair

The final side-by-side cover review found two remaining moderate risks and they
were repaired:

- `template-03-minimal-spatial` moved from an information-board structure into
  a full architectural drawing sheet with measured plan, title block, scale,
  dimension chain, and embedded labels.
- `template-04-vibrant-gradient` moved from a dashboard-like launch surface into
  a theatrical opener with giant screen, audience floor, camera frame, ticker,
  stage beams, and product drop.
- `template-05-nature-fresh` moved from a ledger/board/card composition into a
  physical desk scene with notebook spread, pinned map, sample tags, twine, and
  specimen envelope.

This is the intended escalation path: visual contact-sheet review is allowed to
force template edits even after static lint passes, because the failure mode is
cross-template sameness rather than a single-slide syntax error.

## Required G005 Gates

Automated checks should require:

- domain-native cover markers for every template, not just templates 06-15;
- a canonical `references/template-invariants.json` manifest for all seed
  template cover/proof/mechanism/close role markers;
- forbidden fallback markers for the known weak old objects;
- at least four named domain objects per high-risk template;
- no shared fallback cover class names across unrelated domains;
- design docs to require screenshot contact-sheet review before accepting a new
  seed template.
