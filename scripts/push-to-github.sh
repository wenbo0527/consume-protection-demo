#!/usr/bin/env bash
# Push 本地仓库到 GitHub
#
# 前置:
# 1. 在 GitHub 上已经手动创建空仓库(不要 init README/.gitignore)
# 2. 准备好 PAT token(如果用 HTTPS)或者配 SSH key(如果用 SSH)
#
# 使用方法:
#   # 把下方变量改为你的实际值
#   bash scripts/push-to-github.sh https://github.com/MiniMax/consume-protection-demo.git
#   或
#   bash scripts/push-to-github.sh git@github.com:MiniMax/consume-protection-demo.git

set -euo pipefail

# ============ 参数校验 ============
if [ $# -lt 1 ]; then
  echo "❌ 用法: $0 <remote-url>"
  echo "   例: $0 https://github.com/your-org/consume-protection-demo.git"
  exit 1
fi

REMOTE_URL="$1"

echo "📦 准备推送到:$REMOTE_URL"
echo ""

# ============ 检查 git 状态 ============
echo "=== 当前 git 状态 ==="
git status --short
echo ""

if ! git status --short | grep -q .; then
  echo "✓ working tree 干净"
else
  echo "⚠️  有未提交的内容,先 commit"
  exit 1
fi

# ============ 检查 remote ============
if git remote | grep -q origin; then
  echo "ℹ️  origin 已存在:"
  git remote -v | grep origin
  read -p "替换为新 URL? [y/N]: " replace
  if [[ "$replace" =~ ^[Yy]$ ]]; then
    git remote set-url origin "$REMOTE_URL"
    echo "✓ origin URL 已更新"
  fi
else
  git remote add origin "$REMOTE_URL"
  echo "✓ 已添加 origin"
fi
echo ""

# ============ 推送 ============
echo "=== 推送 main 分支 ==="
git push -u origin main

echo ""
echo "=== 推送 develop 分支 ==="
git push -u origin develop

echo ""
echo "=== 推送 v0.1.0 tag ==="
git push origin v0.1.0

echo ""
echo "=== 推送所有 tag(如有多) ==="
git push origin --tags

echo ""
echo "✅ 完成!"
echo ""
echo "下一步:"
echo "1. 打开 https://github.com/MiniMax/consume-protection-demo 查看"
echo "2. 在 Settings → Branches 设置默认分支为 main,把 develop 设为保护分支"
echo "3. 在 Actions tab 等待 CI 跑通"
echo "4. 在 repository 主页点 ⭐ Star"
echo ""
echo "📦 若要发布版本(自动生成 release notes):"
echo "   bash scripts/release-trigger.sh v0.4.0"
