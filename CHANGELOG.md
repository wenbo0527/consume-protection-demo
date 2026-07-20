# Changelog · 版本变更日志

所有项目重要变更都会记录在此文件。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/),
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [0.4.0] - 2026-07-19 · PRD 100% 完全闭环

**🎉 收口里程碑**:P0-P3 全部 34 项缺口完全实现(无任何部分实现)

### Added

- OPT-FIX-1/P3-3:`PhoneChannel.vue` + `OnlineChatChannel.vue` 菜单占位页
- OPT-P2-10:`useCallQueueStore` 来电队列 + 抢单 + 自动分单 + 坐席负载
- OPT-5/P1-7:`useBusinessAppStore` + `BusinessApply.vue` 业务申请双向闭环
- OPT-1:`useInstructionStore` + `InstructionCenter.vue` 跨角色指令
- OPT-2:`useReviewStore` 整改 → 审查标准沉淀 + Standards "整改沉淀" Tab
- OPT-3:`tagRule.applyToCustomer()` 标签联动坐席弹屏
- OPT-FIX-2/P3-8:`canApproveFor` getter + approve/reject role 守卫 + drawer 全禁用
- OPT-FIX-3/P3-10:`useCompliancePromiseStore` + `PromiseTracking.vue` 投诉管控承诺 + 自动 follow-up 工单 + main.ts 定时扫描
- OPT-FIX-4/P1-6:`TicketCreate.lookupCustomer` 三源查重(客户画像 + wf.instances + tickets)
- `.github/release-drafter.yml` + `release-drafter.yml` workflow
- `scripts/release-trigger.sh` 一键 release
- `MILESTONES.md` 推送交付清单

### Changed

- `workflow.ts` RoleKey 从 user.ts 单一来源(删自定义)
- `MainLayout.vue` 重构菜单路径
- `router.ts` + `router-meta.ts` 双层 metadata
- `vite.config.ts` base path 支持 gh-pages

### CI/CD

- 3 个 GitHub Actions workflow(ci / deploy / release-drafter)
- Husky pre-commit + commit-msg (commitlint)
- 推送脚本 `scripts/push-to-github.sh`

📦 详情见 [doc/releases/v0.4.0.md](doc/releases/v0.4.0.md)

---

## [0.3.0] - 2026-07-19

### Added

- OPT-FIX-2 P3-8:`canApproveFor` getter + approve/reject operatorRole 守卫
- OPT-FIX-3 P3-10:`useCompliancePromiseStore` + `PromiseTracking.vue` + `ReviewExecute` 同步承诺
- main.ts `markOverdue` 定时扫描

### Notes

- P3 全部 100% 闭环;P1-6 仍 partially

---

## [0.2.0] - 2026-07-19

### Added

- OPT-FIX-1 P3-3 PhoneChannel + OnlineChatChannel 占位页
- OPT-2 P2-10 抢单队列(callQueue store)
- OPT-FIX-3 P1-7 StopCollection banner
- OPT-FIX-4 P3-7 RoleKey 合并

---

## [0.1.0] - 2026-07-19

### Added

- 项目初始化(Vue3 + TS + Pinia + Arco Design)
- 14 GitHub 文件(README/CHANGELOG/ARCHITECTURE 等)
- Husky + commitlint
- 21 提交 + 双分支

---

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
