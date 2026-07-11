---
description: Run the full reveal.js deck QA gates on a deck HTML file and fix failures iteratively
argument-hint: <path-to-deck.html>
---

Run the reveal.js quality gates on **$ARGUMENTS** and fix every failure before reporting done.

## Per-file gate sequence (re-run after ANY change; all must be green)
1. `node scripts/lint-design.js $ARGUMENTS` — design lint (overflow, contrast, structure)
2. `node scripts/grade-gate.js $ARGUMENTS` — G1–G12 hard gate (floor: overflow, contrast, pin, spatial completeness)
3. `node scripts/design-strength-check.js $ARGUMENTS` — 4-dimension ceiling (scale ≥3:1, full-bleed color panel, asymmetric split, theme-native form)
4. **Only if image-driven** (city / travel / food / product photos): `node scripts/audit-image-assets.js $ARGUMENTS` — broken/low-res images, over-wide images, cover/section repetition, background drift
5. `node scripts/visual-verdict.js $ARGUMENTS` — sensory issues the hard gates can't catch (unreadable labels, charts that don't support the claim, cheap image mismatches, repeated hero images, theme fragmentation). **Always run last; re-run after every visual edit.**

## If you also touched scripts/ or examples/templates
6. `npm test` — the contract suite (doc-counts, validate-overflow, reference-contract, launch-grade, qa-system, off-template-regression, lint-main-claim, initial-slide-visible, text-collision, text-break, pptx-export).

## Rules
- Fix the **root cause** in the HTML / tokens, not the symptom. Read the failure output, patch minimally, re-run just the failing gate, then re-run `visual-verdict` if the change was visual.
- **Do NOT launch sub-agents, parallel evaluations, or unsolicited quality reviews** — do this directly in this session (per the global `## Git Workflow` / no-unsolicited-sub-agents rule in CLAUDE.md).
- Reach for a Playwright screenshot only when a gate failure is genuinely visual and the script verdict is ambiguous.
- Report: which gates went red→green, what you changed, and the final all-green state. If a gate can't reach green, say so explicitly — never claim success on a still-failing gate.
