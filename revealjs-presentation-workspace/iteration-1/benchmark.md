# Skill Benchmark: revealjs-presentation

**Model**: MiniMax-M3
**Date**: 2026-06-16
**Evals**: 1, 2, 3 (1 run each per configuration)

## Summary

| Metric | With Skill | Without Skill | Delta |
|--------|------------|---------------|-------|
| **Pass Rate (assertions)** | 89% ± 11% | 76% ± 13% | **+0.13** |
| **Lint P0 violations** | 0 | 4 | **-4** |
| **Layout overflows (validate.js)** | 71 | 52 | +19 |
| **Time** | 514.1s ± 146.4s | 319.9s ± 61.2s | +194.2s (+61%) |
| **Tokens** | 112,454 ± 14,786 | 12,565 ± 21,775 | +99,889 (~9x) |

## Per-Eval Results

### Eval 1: security-training-zh (Chinese new-hire security training, target ~15 slides)

| | Pass | Pages | Lint P0 | Overflow | Time | Output |
|---|---|---|---|---|---|---|
| **with_skill** | 78% (7/9) | **12** | **0** ✓ | **62** ✗ | 680s | 84,098 bytes |
| **without_skill** | 67% (6/9) | 15 ✓ | 3 ✗ | **0** ✓ | 269s | 23,019 bytes |

**Conflict**: with_skill wins on P0 + design language + content depth, but FAILS on overflow (62) and undershoots page count (12 vs 15). 
Visual: with_skill cover is "FIELD KIT" stamp aesthetic (strong), but slide 3 screenshot shows email content overflowing past viewport bottom — page counter "3 / 12" overlapped by 05·心理 flag.

### Eval 2: sustainable-fashion-pitch-en (English seed-round pitch, target ~12 slides)

| | Pass | Pages | Lint P0 | Overflow | Time | Output |
|---|---|---|---|---|---|---|
| **with_skill** | 90% (9/10) | **9** | **0** ✓ | 7 | 409s | 55,122 bytes |
| **without_skill** | 70% (7/10) | 12 ✓ | 0 | **52** ✗ | 302s | 33,824 bytes |

**Conflict**: with_skill wins on assertions, P0 (tied), and overflow (7 vs 52). Visually, with_skill cover is the strongest of the 6 outputs — 12 fabric swatches with dye codes, archive stamp, "Clothes worth the wearing-in." in italic Cormorant Garamond. BUT: with_skill cover has 4+ page markers stacked/overlapping at the bottom (CRAFT · MECHANISM / 08 · LEDGER / 05 · ROOSTER / 09 · CLOSING), AND undershoots page count (9 vs 12).

### Eval 3: clinical-trial-academic (Chinese Phase III results, target 8 slides)

| | Pass | Pages | Lint P0 | Overflow | Time | Output |
|---|---|---|---|---|---|---|
| **with_skill** | **100%** (11/11) | 8 ✓ | **0** ✓ | 2 | 453s | 50,055 bytes |
| **without_skill** | 91% (10/11) | 8 ✓ | 1 ✗ | **0** ✓ | 389s | 37,888 bytes |

**Both strong**. with_skill wins on assertions (100% vs 91%) and P0 (0 vs 1), ties on overflow (2 vs 0 — both clean), and page count (8/8). Visually, with_skill cover is bespoke (archive stamp, registration code, swatch grid). This is the case where the skill's value is clearest.

## Cost-Benefit

- with_skill: 2.6x slower, 9x more tokens, +0.13 pass rate
- with_skill prevents 4 P0 design rule violations (would be auto-blocked by skill gates)
- with_skill's content budget causes 19 more overflows (61% in security-training alone)
- with_skill's content budget causes 2 of 3 page count undershoots (12/9 vs 15/12)
- **Net assessment**: the skill delivers real value (P0 enforcement, design language, content depth) but its 14em content budget and 3-col card recipes are too tight for dense content (security-training) and too aggressive in compressing page count (fashion, security).

## Issues Not Caught by Current Lint

1. **Pin/page-marker overlap on cover** (sustainable-fashion with_skill): 4 section markers stack on each other at the bottom of the cover. Lint passes.
2. **Stamp text overlap** (security-training with_skill cover): "内训版 07 · INTERNAL" text overlaps stamp number.
3. **Page count undershoot**: No automated check that user-requested page count was actually hit.

## Recommended Skill Improvements (for v15.1)

1. **Loosen 14em content budget for training/educational content** — security-training needs more density per page than pitch decks
2. **Add page-count assertion** — agent must hit user-requested page count ±1, not stop early
3. **Strengthen pin-collision detection** — cover-level pin/marker overlap (sustainable-fashion) is not caught
4. **Add validate.js as P0 gate (not just informational)** — overflow is a real P0 visual issue; skill should require validate.js total ≤ N before declaring done
5. **Add visual cover QA script** — render cover at 1280x720, check for stamp/text overlap
