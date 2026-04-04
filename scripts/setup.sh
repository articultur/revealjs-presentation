#!/usr/bin/env bash
# setup.sh — one-time initialization for new users of revealjs-presentation skill
# Run this once after placing the skill in your AI tool's skills directory.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ERRORS=0

echo ""
echo "=== revealjs-presentation: first-time setup ==="
echo ""

# -------------------------------------------------------
# Step 1: Check impeccable skill
# -------------------------------------------------------
echo "[1/2] Checking impeccable skill..."

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
    echo "    OK  impeccable already installed ($p)"
    break
  fi
done

if [[ $IMPECCABLE_FOUND -eq 0 ]]; then
  if command -v npx >/dev/null 2>&1; then
    echo "    ... impeccable not found. Installing via npx skills CLI..."
    if npx skills add pbakaus/impeccable 2>&1; then
      echo "    OK  impeccable installed"
    else
      echo "    FAIL npx install failed. Install manually:"
      echo ""
      echo "         Option A (if you have Node.js):"
      echo "           npx skills add pbakaus/impeccable"
      echo ""
      echo "         Option B (no Node.js):"
      echo "           1. Go to https://impeccable.style/"
      echo "           2. Download the ZIP for your AI tool"
      echo "           3. Extract to ~/.claude/skills/ or ~/.agents/skills/"
      echo ""
      ERRORS=$((ERRORS + 1))
    fi
  else
    echo "    WARN npx not available — install impeccable manually:"
    echo ""
    echo "         Option A (install Node.js first, then):"
    echo "           npx skills add pbakaus/impeccable"
    echo ""
    echo "         Option B (no Node.js required):"
    echo "           1. Go to https://impeccable.style/"
    echo "           2. Download the ZIP for your AI tool"
    echo "           3. Extract to ~/.claude/skills/ or ~/.agents/skills/"
    echo ""
    ERRORS=$((ERRORS + 1))
  fi
fi

# -------------------------------------------------------
# Step 2: Verify skill structure
# -------------------------------------------------------
echo "[2/2] Checking skill structure..."

STRUCT_OK=1
for f in SKILL.md examples references scripts; do
  if [[ ! -e "$ROOT_DIR/$f" ]]; then
    echo "    FAIL missing: $f"
    STRUCT_OK=0
    ERRORS=$((ERRORS + 1))
  fi
done
[[ $STRUCT_OK -eq 1 ]] && echo "    OK  skill files present"

# -------------------------------------------------------
# Result
# -------------------------------------------------------
echo ""
if [[ $ERRORS -eq 0 ]]; then
  echo "=== Setup complete. You are ready to use this skill. ==="
  echo ""
  echo "Next steps:"
  echo "  1. Open your AI assistant chat"
  echo "  2. Verify impeccable: type /audit — it should respond with a command description"
  echo "  3. Generate your first deck:"
  echo "     > 做一个有设计感的 PPT，主题是 X，受众是 Y，页数 8 页，输出 reveal.js"
  echo "  4. Save the generated .html file and open it in any browser"
  echo ""
  echo "  Export to PDF: open yourfile.html?print-pdf in Chrome → print to PDF"
  echo ""
else
  echo "=== Setup finished with $ERRORS issue(s). See above for instructions. ==="
  echo ""
  echo "Once impeccable is installed, re-run:  bash scripts/setup.sh"
  echo ""
fi
