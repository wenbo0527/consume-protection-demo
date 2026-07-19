#!/usr/bin/env bash
# 触发现有版本 release(走 GitHub Release 自动流程)
#
# 前置:
#   - 已 git push origin main + vX.Y.Z tag
#   - Release Drafter workflow 已就绪(release-drafter.yml)
#
# 使用:
#   bash scripts/release-trigger.sh v0.4.0
#
# 流程:
#   1. 本地校验 tag 存在
#   2. 把一个空 commit(消息含 [release] vX.Y.Z) 推到 main
#      → Release Drafter workflow 看到此标记后会自动创建一个正式的 release

set -euo pipefail

VERSION="${1:-}"
if [ -z "$VERSION" ]; then
  echo "❌ 用法: $0 <version>"
  echo "   例: $0 v0.4.0"
  exit 1
fi

echo "🚀 触发现有版本 release:$VERSION"
echo ""

# 校验 tag 存在
if ! git tag -l "$VERSION" | grep -q .; then
  echo "⚠️  本地没有 $VERSION tag,先 push tag:"
  echo "    git push origin $VERSION"
  exit 2
fi

# 校验 origin 存在
if ! git remote | grep -q origin; then
  echo "⚠️  没找到 origin,请先配置 remote"
  exit 3
fi

echo "📍 提交一个空 trigger commit(消息含 [release] $VERSION)"
git commit --allow-empty -m "[release] $VERSION"
echo ""

echo "📍 push 到 main(触发 Release Drafter workflow)"
git push origin main
echo ""

echo "📍 push 标记 tag"
git push origin "$VERSION"
echo ""

echo "✅ 完成"
echo ""
echo "📝 下一步:在 GitHub Releases 页面查看 release 草稿"
echo "   - Release Drafter 自动生成的草稿"
echo "   - 你可以 'Edit' 后点 'Publish release'"
echo "   - 或等待管理员审核"
