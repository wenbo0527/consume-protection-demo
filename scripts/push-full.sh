#!/usr/bin/env bash
# 一体化:创建 GitHub 仓库 + push main + push develop + push tags + publish release + gh-pages 自动化
#
# 前置:
#   1. 你的 mac 已装 gh CLI 且 gh auth login 完毕
#   2. working tree 干净(v0.6.0)
#
# 使用:
#   bash scripts/push-full.sh [ORG_OR_USER] [REPO_NAME] [VISIBILITY]
#   默认:ORG_OR_USER=当前 gh 用户,REPO_NAME=consume-protection-demo,VISIBILITY=public
#
# 例:
#   bash scripts/push-full.sh
#   bash scripts/push-full.sh myname my-repo private

set -euo pipefail

ORG="${1:-}"
REPO="${2:-consume-protection-demo}"
VISIBILITY="${3:-public}"

# ============ 1. 准备变量 ============
echo "📦 一体化 push 启动"
echo "   Repo:   $REPO"
echo "   Visibility: $VISIBILITY"
echo ""

# 检查 gh 登录
if ! gh auth status > /dev/null 2>&1; then
  echo "❌ gh CLI 未登录,请先:gh auth login"
  exit 1
fi

# 取当前用户
if [ -z "$ORG" ]; then
  ORG=$(gh api user --jq '.login')
fi
REMOTE_URL="https://github.com/$ORG/$REPO.git"
echo "   Remote URL: $REMOTE_URL"
echo ""

# 工作目录
cd "$(git rev-parse --show-toplevel)"

# ============ 2. 检查 git 状态 ============
echo "=== 检查 working tree ==="
if ! git status --short | grep -q .; then
  echo "✓ working tree 干净"
else
  echo "⚠️  working tree 不干净:"
  git status --short | head -10
  exit 1
fi
echo ""

# ============ 3. 创建 GitHub 仓库 ============
echo "=== 创建 GitHub 仓库 $ORG/$REPO ==="
if gh repo view "$ORG/$REPO" > /dev/null 2>&1; then
  echo "ℹ️  仓库 $ORG/$REPO 已存在,跳过创建"
else
  gh repo create "$ORG/$REPO" \
    --"$VISIBILITY" \
    --description "消保客服工作台 · Vue 3 + Pinia + Arco Design · 100% PRD 闭环" \
    --homepage "https://$ORG.github.io/$REPO/" \
    --source=. \
    --remote=origin
  echo "✓ 仓库已创建"
fi
echo ""

# ============ 4. 配置 origin 并 push ============
echo "=== 配置 origin 并推送 ==="
if git remote | grep -q origin; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi

git push -u origin main
git push -u origin develop
echo ""

# ============ 5. 推送所有 tag ============
echo "=== 推送所有 tag ==="
git push origin --tags
echo ""

# ============ 6. 触发 release(自动创建 release) ============
echo "=== 触发 Next Release 自动发布 ==="
git commit --allow-empty -m "[release] auto-trigger next release" || true
git push origin main
echo ""

# ============ 7. 完成 + URL ============
echo "✅ 完成!"
echo ""
echo "📍 仓库地址:    https://github.com/$ORG/$REPO"
echo "📍 Demo URL:    https://$ORG.github.io/$REPO/"
echo "📍 Actions:     https://github.com/$ORG/$REPO/actions"
echo "📍 Releases:    https://github.com/$ORG/$REPO/releases"
echo ""
echo "🕒 等 3-5 分钟让以下流程跑完:"
echo "   1. CI workflow(单测 / e2e / smoke / structure)→ 绿"
echo "   2. deploy workflow → gh-pages 自动部署"
echo "   3. release-drafter 自动维护 v0.6.0 release 草稿"
echo ""
echo "下一步可选:"
echo "   - 在 Releases 页面点 Publish release(把草稿转正)"
echo "   - 在 Settings → Pages 确认部署 URL"
echo "   - 把仓库设为 Public / 加 topics:vue3 typescript pinia arco-design"
