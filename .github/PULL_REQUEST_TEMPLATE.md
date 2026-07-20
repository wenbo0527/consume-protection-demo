# Pull Request 模板

## 类型

请勾选修改类型(可多选):

- [ ] 🐛 Bug 修复(bug fix)
- [ ] ✨ 新功能(new feature)
- [ ] 🔨 重构(refactor)
- [ ] 📝 文档(docs)
- [ ] 🏗️ 架构改进(arch)
- [ ] 🎨 样式 / 交互优化(style / UI)
- [ ] 🧪 测试(test)

## 描述

清晰描述本次 PR 解决的问题 + 主要改动。

## 变更

### 修改的文件

列主要变更:

- `src/stores/xxx.ts` — 添加新 action ...
- `src/pages/yyy.vue` — 接入 xx store ...

## 自测

- [ ] `npm run build` 通过
- [ ] `npm run lint:no-emit` 通过(TS strict 0 错)
- [ ] 涉页路由 HTTP 200
- [ ] 手动验证主流程

## 截图 / 录屏

如果改动涉及 UI,提供截图。

## 关联 Issue

Closes #xxx / Refs #xxx

## 影响范围(架构 PR 必填)

如果改动涉及 store / module 边界,说明:

- [ ] 数据归属收敛到单一 store
- [ ] 旧数据(本地状态)影响排查已列出
- [ ] 跨边界调用已通过 type contract 保护
