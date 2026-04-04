#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

WARN=0

echo "[doctor] Running environment checks..."

# --- Project structure ---
[[ -f SKILL.md ]]     || { echo "[doctor] ERROR: Missing SKILL.md"; exit 1; }
[[ -d examples ]]     || { echo "[doctor] ERROR: Missing examples/"; exit 1; }
[[ -d references ]]   || { echo "[doctor] ERROR: Missing references/"; exit 1; }
[[ -d scripts ]]      || { echo "[doctor] ERROR: Missing scripts/"; exit 1; }

# --- Runtime (optional) ---
if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
  if [[ ! -d node_modules/reveal.js ]]; then
    echo "[doctor] WARN: reveal.js not installed locally (run npm run bootstrap for local dev server)"
    echo "[doctor]       Note: generated HTML loads reveal.js from CDN — no local install needed for basic use"
    WARN=$((WARN+1))
  fi
  if [[ ! -d node_modules/http-server ]]; then
    echo "[doctor] WARN: http-server not installed (run npm run bootstrap to enable npm run start)"
    WARN=$((WARN+1))
  fi
else
  echo "[doctor] INFO: node/npm not found — local dev server unavailable (not required for basic use)"
fi

# --- impeccable skill ---
IMPECCABLE_FOUND=0
SEARCH_PATHS=(
  "$HOME/.claude/skills/frontend-design"
  "$HOME/.agents/skills/frontend-design"
  "$ROOT_DIR/.claude/skills/frontend-design"
  "$ROOT_DIR/.agents/skills/frontend-design"
  "$ROOT_DIR/../.claude/skills/frontend-design"
  "$ROOT_DIR/../.agents/skills/frontend-design"
)
for p in "${SEARCH_PATHS[@]}"; do
  if [[ -f "$p/SKILL.md" ]]; then
    IMPECCABLE_FOUND=1
    echo "[doctor] OK: impeccable frontend-design skill found at $p"
    break
  fi
done

if [[ $IMPECCABLE_FOUND -eq 0 ]]; then
  echo "[doctor] WARN: impeccable skill not found in any expected path"
  echo "[doctor]       This skill is required for quality visual output"
  echo "[doctor]       Auto-install: npx skills add pbakaus/impeccable"
  echo "[doctor]       Manual download: https://impeccable.style/"
  WARN=$((WARN+1))
fi

# --- Result ---
if [[ $WARN -eq 0 ]]; then
  echo "[doctor] OK: all checks passed."
else
  echo "[doctor] Done with $WARN warning(s). Warnings do not block usage."
fi
