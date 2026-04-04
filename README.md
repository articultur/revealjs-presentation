# Reveal.js Presentation Skill

This repository contains a Codex skill for creating stylized presentation decks with `reveal.js`.

The skill is centered on one job: turn a topic or outline into a presentation that feels designed, not generic. It ships with five visual templates, a small set of browser-side validation scripts, and focused references for layout, motion, and technical constraints.

## First-Time Setup

After placing this folder in your skills directory, **run setup once**:

```bash
bash scripts/setup.sh
```

Or if you have Node.js:

```bash
npm run setup
```

Setup will: check if impeccable is installed, auto-install it via `npx skills add pbakaus/impeccable` if Node.js is available, and print next steps. It is idempotent — safe to run multiple times.

### No Node.js? Manual path:

1. Go to [impeccable.style](https://impeccable.style/), download the ZIP for your AI tool
2. Extract to `~/.claude/skills/` or `~/.agents/skills/`
3. Open chat and type `/audit` — if it responds, impeccable is active

### What needs installing vs what doesn't

| What | Requires installation? | How |
|---|---|---|
| This skill | Yes — place folder in skills path | One-time copy |
| impeccable | Yes — `npx skills add pbakaus/impeccable` or ZIP download | One-time, via setup |
| reveal.js | **No** — loaded from CDN at runtime | Nothing to do |
| Node.js | Optional — needed only for `npm run setup` / local server | Only if you want CLI convenience |

## Using The Skill

Once setup is done, open chat and type:

> 做一个有设计感的 PPT，主题是 X，受众是 Y，页数 8 页，输出 reveal.js

Save the generated `.html` file and double-click to open in a browser.

Navigation: arrow keys. `S` speaker notes. `F` fullscreen.

Export to PDF: open `yourfile.html?print-pdf` in Chrome → print to PDF.

## Validation (Optional, Browser Only)

Both validation tools are browser console scripts. No installation required.

- Open the deck in browser → press `F12` to open DevTools console
- Paste contents of `scripts/overflow-detect.js` to check for overflow
- Paste contents of `scripts/auto-fix-css.js` to auto-fix flex/grid/text overflow

## Advanced: Local Dev Server (Optional, Needs Node.js)

Only needed if you prefer `http://localhost` over `file://` (matters for some browser security policies).

Requires Node.js 18+ and npm.

```bash
npm run bootstrap   # install dependencies + run checks
npm run start       # start server at http://localhost:4173
```

Skip this entirely if opening the HTML directly in browser works for you.

## Common Beginner Failure Points

- Thinking you need npm to use this skill (you don't, for basic use)
- Asking for `.pptx` output (this skill produces reveal.js HTML only)
- Too much text per slide, causing overflow
- CDN unavailable in restricted network environment (solution: use local reveal.js assets)

## Structure

```text
revealjs-presentation/
├── SKILL.md
├── examples/
├── references/
└── scripts/
```

## What It Produces

- A single runnable HTML slide deck
- Stronger visual direction than default slide generators
- Reveal.js output that can be presented in browser or exported to PDF

## Included Assets

- `examples/template-01-editorial-serif.html`
- `examples/template-02-dark-tech.html`
- `examples/template-03-minimal-spatial.html`
- `examples/template-04-vibrant-gradient.html`
- `examples/template-05-nature-fresh.html`

## Supporting Files

- `references/design-principles.md`: typography, color, anti-patterns
- `references/layout-patterns.md`: reusable layout snippets
- `references/motion-delight.md`: animation guidance
- `references/technical-specs.md`: reveal.js setup and CSS rules
- `scripts/overflow-detect.js`: overflow inspection in browser console
- `scripts/auto-fix-css.js`: common CSS fixes in browser console
