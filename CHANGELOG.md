# Changelog · 版本变更日志

所有项目重要变更都会记录在此文件。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/),
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added

- **架构 review 与重构**:完整 review,清理所有运行时错误 / 类型错误
- **架构改进(按方向)**:数据归属收敛 / 事件名收口 / 工作流 helper 抽象 / mock 数据统一出口
- **GitHub 化**:README + LICENSE + CONTRIBUTING + Issue / PR 模板 + CI
- **业务新增**:
  - P2-3 质检管理(`/manage/quality`)
  - P2-4 运营管理(`/manage/ops`):排班 / 绩效 / 请假
  - P2-5 审查追溯(`/review/audit-trail`)
  - P2-6 贷中清退(`/manage/exit`)
  - P2-7 票据合同(`/manage/billing`)
  - P2-8 规则试算(RuleConfig Tab)

### Fixed

- 移除所有运行时 reference 错误(`useQualityStore`, `mockTicket.closing`, etc.)
- mock `WorkbenchStore.incoming.customerId` 类型 narrow
- mock 数据补全 `currentNodeStartedAt` / `expireAt` 字段
- 29 处 `size="mini"` → `size="small"` 类型修复
- `a-form` + `a-radio` 属性类型约束修复
- `<a-radio-button>` 改 `<a-radio>`(Arco 类型)
- `:width="160"` + `(record as any)` 转义收紧
- 全球审计 `(as any)`:从 ~20 → ~18,收尾用 `as Ref<T>` / `(record as KnowledgeItem)` 等收紧

### Changed

- **跨 store 调用规范**:`useAlertStore.verifyByWorkflow(id, instanceId)` 替代 `mockAlerts[i].status = ...`
- **事件名常量**:`constants/events.ts` 收口所有 `cp-*` 事件,业务代码改用 `EVT.*`
- **业务页面解耦**:`StopCollection` / `Negotiate` / `TransferMediation` / `CreditObjection` 改用 `workflow-helpers.ts` 共享状态映射

### Removed

- `cp-knowledge-approved` listener(原知识审批无外部动作)
- `cp-system-stop-collection-active` + `cp-system-negotiate-active` events(死代码)
- `cp-nc-open` dispatch(NotificationCenter 改用 link 字段)

### Security

- 全局 `app.config.errorHandler` + `unhandledrejection` 拦截,避免白屏无反馈

## [0.1.0] - 2026-07-17

### Added · 初始发布

- ✅ 5 个工作台(坐席/业务执行/管理层/审查/消费者)
- ✅ 11 个 Pinia store
- ✅ 43 路由 / 36 菜单项
- ✅ 工作流引擎(5 种业务类型)
- ✅ 预警 + 整改 + 审查 + 知识库 闭环
- ✅ TypeScript strict 0 错误
- ✅ Vite build 0 错误

[Unreleased]: https://github.com/MiniMax/consume-protection-demo/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/MiniMax/consume-protection-demo/releases/tag/v0.1.0
