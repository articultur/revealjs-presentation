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
# Step 1: Check Node.js
# -------------------------------------------------------
echo "[1/3] Checking Node.js..."

if command -v node >/dev/null 2>&1; then
  NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
  if [[ "$NODE_MAJOR" -lt 18 ]]; then
    echo "    WARN Node.js 18+ recommended, current: $(node -v)"
    echo "         Some features (CLI export, validation) may not work"
  else
    echo "    OK  Node.js $(node -v)"
  fi
else
  echo "    WARN Node.js not found. Browser-based features still work."
  echo "         Install Node.js 18+ for CLI export and validation."
fi

# -------------------------------------------------------
# Step 2: Install npm dependencies
# -------------------------------------------------------
echo "[2/3] Checking npm dependencies..."

if [[ -f package.json ]] && command -v npm >/dev/null 2>&1; then
  # 检查是否需要安装
  NEEDS_INSTALL=0

  # 检查关键依赖
  if [[ ! -d node_modules/pptxgenjs ]]; then
    NEEDS_INSTALL=1
    echo "    ... pptxgenjs (PPTX 导出) 未安装"
  fi
  if [[ ! -d node_modules/cheerio ]]; then
    NEEDS_INSTALL=1
    echo "    ... cheerio (HTML 解析) 未安装"
  fi

  if [[ $NEEDS_INSTALL -eq 1 ]]; then
    echo "    Installing dependencies..."
    if npm install --production 2>&1; then
      echo "    OK  npm dependencies installed"
    else
      echo "    FAIL npm install failed. Run manually: npm install"
      ERRORS=$((ERRORS + 1))
    fi
  else
    echo "    OK  all npm dependencies present"
  fi
elif [[ ! -f package.json ]]; then
  echo "    WARN package.json not found, skipping npm install"
else
  echo "    WARN npm not available, skipping dependency install"
  echo "         Browser-based PPTX export still works (uses CDN)"
fi

# -------------------------------------------------------
# Step 3: Check impeccable skill
# -------------------------------------------------------
echo "[3/3] Checking impeccable skill..."

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
  echo "  Export options:"
  echo "    Browser: open HTML → click 📥 PPTX button (bottom-left)"
  echo "    CLI:      node scripts/export-pptx.js your-slides.html"
  echo "    PDF:      open yourfile.html?print-pdf in Chrome → print to PDF"
  echo ""
else
  echo "=== Setup finished with $ERRORS issue(s). See above for instructions. ==="
  echo ""
  echo "Once issues are resolved, re-run:  bash scripts/setup.sh"
  echo ""
fi
