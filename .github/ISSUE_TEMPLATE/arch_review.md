---
name: 🏗️ Architecture Review
about: 提交架构层(数据归属、模块边界、复用、类型安全)的改进建议
title: 'arch: '
labels: ['architecture']
assignees: []

---

## 现状

描述当前架构问题或可优化点。

**模块 / 路径:**

**问题类型(可多选):**

- [ ] 数据归属(mock 数据被多 store 直接 mutate)
- [ ] 模块边界(职责重叠、跨边界调用)
- [ ] 复用(业务页面 copy-paste)
- [ ] 类型安全(`as any` / `as unknown`)
- [ ] 事件总线(全局 window.dispatch)
- [ ] 测试覆盖(关键 store 无单测)
- [ ] 其他

## 建议

## 影响范围

列出受影响的 store / page / store 数量。

## 验收标准

- [ ] TS 0 错
- [ ] Vite build 0 错
- [ ] 路由 HTTP 200
