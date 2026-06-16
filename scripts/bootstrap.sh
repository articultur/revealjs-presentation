#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[bootstrap] Start dependency installation..."

if ! command -v node >/dev/null 2>&1; then
  echo "[bootstrap] Error: node is not installed. Please install Node.js 18+ first."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "[bootstrap] Error: npm is not installed. Please install npm first."
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [[ "$NODE_MAJOR" -lt 18 ]]; then
  echo "[bootstrap] Error: Node.js 18+ is required. Current: $(node -v)"
  exit 1
fi

echo "[bootstrap] Using Node $(node -v), npm $(npm -v)"

if [[ ! -f package.json ]]; then
  echo "[bootstrap] Error: package.json not found in $ROOT_DIR"
  exit 1
fi

npm install

# --- impeccable skill (auto-install) ---
IMPECCABLE_FOUND=0
SEARCH_PATHS=(
  "$ROOT_DIR/.agents/skills/impeccable"
  "$ROOT_DIR/.claude/skills/impeccable"
  "$HOME/.agents/skills/impeccable"
  "$HOME/.claude/skills/impeccable"
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
    echo "[bootstrap] impeccable already installed at $p"
    break
  fi
done

if [[ $IMPECCABLE_FOUND -eq 0 ]]; then
  echo "[bootstrap] Installing impeccable skill (npx skills add pbakaus/impeccable)..."
  if npx skills add pbakaus/impeccable 2>&1; then
    echo "[bootstrap] impeccable installed successfully"
  else
    echo "[bootstrap] WARN: auto-install failed. Install manually:"
    echo "[bootstrap]   npx skills add pbakaus/impeccable"
    echo "[bootstrap]   or visit https://impeccable.style/"
  fi
fi

bash scripts/doctor.sh

echo "[bootstrap] Done."
echo "[bootstrap] Next steps:"
echo "  1) npm run start"
echo "  2) open http://localhost:4173/examples/template-01-editorial-serif.html"
