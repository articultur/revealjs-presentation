#!/usr/bin/env bash
# setup.sh — 快速环境检查（不安装任何东西）
# 如需安装所有可选依赖，运行：bash scripts/install-all.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo ""
echo "=== revealjs-presentation: 环境检查 ==="
echo ""

# -------------------------------------------------------
# Step 1: 项目结构
# -------------------------------------------------------
echo "[1/4] 检查项目结构..."

ALL_OK=1
for f in SKILL.md; do
  if [[ -f "$f" ]]; then
    echo "    ✅ $f"
  else
    echo "    ❌ 缺少 $f"
    ALL_OK=0
  fi
done
for d in examples references scripts; do
  if [[ -d "$d" ]]; then
    echo "    ✅ $d/"
  else
    echo "    ❌ 缺少 $d/"
    ALL_OK=0
  fi
done

# -------------------------------------------------------
# Step 2: Node.js（可选）
# -------------------------------------------------------
echo ""
echo "[2/4] 检查 Node.js..."

if command -v node >/dev/null 2>&1; then
  NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
  if [[ "$NODE_MAJOR" -lt 18 ]]; then
    echo "    ⚠️  Node.js $(node -v) — 建议 18+"
  else
    echo "    ✅ Node.js $(node -v)"
  fi
else
  echo "    ℹ️  Node.js 未安装（不影响使用 — HTML 双击即可打开）"
fi

# -------------------------------------------------------
# Step 3: npm 依赖（可选）
# -------------------------------------------------------
echo ""
echo "[3/4] 检查 npm 依赖..."

if command -v npm >/dev/null 2>&1 && [[ -f package.json ]]; then
  if [[ -d node_modules/pptxgenjs ]] && [[ -d node_modules/cheerio ]]; then
    echo "    ✅ pptxgenjs + cheerio（CLI PPTX 导出就绪）"
  else
    echo "    ⚠️  npm 依赖未安装（CLI PPTX 导出不可用）"
    echo "       安装：npm install"
  fi
else
  echo "    ℹ️  跳过（不需要 CLI 工具则忽略）"
fi

# -------------------------------------------------------
# Step 4: impeccable（可选）
# -------------------------------------------------------
echo ""
echo "[4/4] 检查 impeccable 设计技能..."

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
)
for p in "${SEARCH_PATHS[@]}"; do
  if [[ -f "$p/SKILL.md" ]]; then
    IMPECCABLE_FOUND=1
    echo "    ✅ impeccable 已安装 ($p)"
    break
  fi
done

if [[ $IMPECCABLE_FOUND -eq 0 ]]; then
  echo "    ℹ️  impeccable 未安装（不影响基本功能）"
  echo "       安装：npx skills add pbakaus/impeccable"
fi

# -------------------------------------------------------
# Result
# -------------------------------------------------------
echo ""
if [[ $ALL_OK -eq 1 ]]; then
  echo "=== ✅ 项目结构完整，可以正常使用 ==="
else
  echo "=== ⚠️  项目结构不完整，请检查上方标记 ❌ 的项目 ==="
fi

echo ""
echo "提示："
echo "  • 生成 HTML 无需安装任何东西 — CDN 自动加载"
echo "  • 安装全部可选工具：bash scripts/install-all.sh"
echo "  • 本地预览：npm run start → http://localhost:4173"
echo ""
