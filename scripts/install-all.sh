#!/usr/bin/env bash
# install-all.sh — 一键安装所有可选依赖
# 生成的 HTML 文件通过 CDN 加载一切，无需本地安装。
# 此脚本仅为需要 CLI 工具的用户准备。

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ERRORS=0
INSTALLED=0
SKIPPED=0

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   revealjs-presentation: 一键安装可选依赖               ║"
echo "║                                                          ║"
echo "║   提示：生成的 HTML 无需任何安装即可使用                  ║"
echo "║   此脚本安装 CLI 工具、验证、预览等增强功能              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# -------------------------------------------------------
# Step 1: Check Node.js
# -------------------------------------------------------
echo "─── [1/5] 检查 Node.js ───"

if command -v node >/dev/null 2>&1; then
  NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
  if [[ "$NODE_MAJOR" -lt 18 ]]; then
    echo "    ⚠️  Node.js $(node -v) — 需要 18+，部分功能不可用"
    echo "       安装：https://nodejs.org/"
    ERRORS=$((ERRORS + 1))
  else
    echo "    ✅ Node.js $(node -v)"
  fi
else
  echo "    ⚠️  Node.js 未安装"
  echo "       安装：https://nodejs.org/"
  echo "       没有 Node.js 也可以使用 — 生成的 HTML 双击即可打开"
  ERRORS=$((ERRORS + 1))
fi

# -------------------------------------------------------
# Step 2: Install npm dependencies (CLI PPTX export)
# -------------------------------------------------------
echo ""
echo "─── [2/5] 安装 npm 依赖 ───"

if [[ -f package.json ]] && command -v npm >/dev/null 2>&1; then
  if [[ -d node_modules/pptxgenjs ]] && [[ -d node_modules/cheerio ]]; then
    echo "    ✅ pptxgenjs + cheerio 已安装"
  else
    echo "    📦 安装 pptxgenjs + cheerio（CLI PPTX 导出所需）..."
    if npm install --production 2>&1; then
      echo "    ✅ npm 依赖安装完成"
      INSTALLED=$((INSTALLED + 1))
    else
      echo "    ❌ npm install 失败，请手动运行: npm install"
      ERRORS=$((ERRORS + 1))
    fi
  fi
else
  echo "    ⏭️  跳过（需要 Node.js + package.json）"
  SKIPPED=$((SKIPPED + 1))
fi

# -------------------------------------------------------
# Step 3: Install Playwright (automated validation)
# -------------------------------------------------------
echo ""
echo "─── [3/5] 安装 Playwright（自动验证） ───"

if command -v npx >/dev/null 2>&1; then
  # 检查 playwright 是否已安装
  PLAYWRIGHT_READY=0
  if command -v node >/dev/null 2>&1; then
    PLAYWRIGHT_CHECK="$(node -e "try{require('playwright');console.log('ok')}catch(e){console.log('no')}" 2>/dev/null || echo 'no')"
    if [[ "$PLAYWRIGHT_CHECK" == "ok" ]]; then
      PLAYWRIGHT_READY=1
    fi
  fi

  if [[ $PLAYWRIGHT_READY -eq 1 ]]; then
    echo "    ✅ Playwright 已安装"
  else
    echo "    📦 安装 Playwright + 浏览器引擎..."
    if npm install --save-dev playwright 2>&1; then
      echo "    📦 下载 Chromium..."
      if npx playwright install chromium 2>&1; then
        echo "    ✅ Playwright 安装完成"
        INSTALLED=$((INSTALLED + 1))
      else
        echo "    ⚠️  Playwright 浏览器下载失败（网络问题？）"
        echo "       手动安装: npx playwright install chromium"
        ERRORS=$((ERRORS + 1))
      fi
    else
      echo "    ⚠️  Playwright 安装失败"
      echo "       手动安装: npm install --save-dev playwright && npx playwright install"
      ERRORS=$((ERRORS + 1))
    fi
  fi
else
  echo "    ⏭️  跳过（需要 npx）"
  SKIPPED=$((SKIPPED + 1))
fi

# -------------------------------------------------------
# Step 4: Install http-server (local preview)
# -------------------------------------------------------
echo ""
echo "─── [4/5] 安装 http-server（本地预览） ───"

if command -v npx >/dev/null 2>&1; then
  # 检查 http-server 是否可用
  if npx http-server --version >/dev/null 2>&1; then
    echo "    ✅ http-server 已可用"
  else
    echo "    📦 安装 http-server..."
    if npm install --save-dev http-server 2>&1; then
      echo "    ✅ http-server 安装完成"
      INSTALLED=$((INSTALLED + 1))
    else
      echo "    ⚠️  http-server 安装失败（非必需，跳过）"
    fi
  fi
else
  echo "    ⏭️  跳过（需要 npx）"
  SKIPPED=$((SKIPPED + 1))
fi

# -------------------------------------------------------
# Step 5: Check impeccable skill
# -------------------------------------------------------
echo ""
echo "─── [5/5] 检查 impeccable 设计技能 ───"

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
  if command -v npx >/dev/null 2>&1; then
    echo "    📦 安装 impeccable 设计技能..."
    if npx skills add pbakaus/impeccable 2>&1; then
      echo "    ✅ impeccable 安装完成"
      INSTALLED=$((INSTALLED + 1))
    else
      echo "    ⚠️  自动安装失败（不影响基本功能）"
      echo "       手动安装: npx skills add pbakaus/impeccable"
      echo "       或访问: https://impeccable.style/"
      ERRORS=$((ERRORS + 1))
    fi
  else
    echo "    ⏭️  跳过（需要 npx）"
    echo "       手动下载: https://impeccable.style/"
    SKIPPED=$((SKIPPED + 1))
  fi
fi

# -------------------------------------------------------
# Result
# -------------------------------------------------------
echo ""
echo "════════════════════════════════════════════════════════════"

if [[ $ERRORS -eq 0 ]]; then
  echo "  ✅ 全部完成！新安装 $INSTALLED 个组件，跳过 $SKIPPED 个"
else
  echo "  ⚠️  完成，但有 $ERRORS 个问题（见上方详情）"
  echo "     不影响核心功能 — HTML 双击即可使用"
fi

echo ""
echo "  下一步："
echo "    1. 打开 AI 助手"
echo "    2. 输入：做一个关于 X 的 PPT，受众是 Y"
echo "    3. 保存生成的 .html 文件，双击打开"
echo ""
echo "  导出选项："
echo "    PPTX：HTML 内置按钮（左下角）"
echo "    PDF：Chrome 打开 file.html?print-pdf → 打印"
echo "    CLI：node scripts/export-pptx.js your-slides.html"
echo ""
echo "  本地预览：npm run start → http://localhost:4173"
echo "════════════════════════════════════════════════════════════"
echo ""

# Exit with 0 even if there are errors — these are all optional
exit 0
