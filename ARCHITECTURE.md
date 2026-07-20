# 架构 · ARCHITECTURE

> 消保客服工作台 · 架构详解

## 1. 设计目标

| 维度           | 目标                                      |
| -------------- | ----------------------------------------- |
| **业务完整度** | 跨角色业务全链路,演示完整治理闭环         |
| **架构清晰度** | 严格分层 · 数据归属明确 · 事件名收口      |
| **类型安全**   | TypeScript strict · 0 类型错误            |
| **可维护性**   | 路由/菜单元数据统一 · 业务规则集中        |
| **可测试性**   | store 可独立单元测试 · 业务规则可独立复用 |

## 2. 分层架构

```
┌──────────────────────────────────────────────────────────────┐
│  Pages (业务页面 · 41 个)                                    │  ← UI 层
│  AgentWorkbench / BusinessWorkbench / ManageWorkbench / ...  │
├──────────────────────────────────────────────────────────────┤
│  Components (通用组件 · 7 个)                                │  ← 复用 UI
│  NotificationCenter / WorkflowSteps / KpiCard / ...        │
├──────────────────────────────────────────────────────────────┤
│  Stores (领域 Pinia · 11 个)                                  │  ← 业务状态层
│  user / workbench / workflow / alert / knowledge / ...      │
├──────────────────────────────────────────────────────────────┤
│  Utils + Constants (规则集中)                                │  ← 基础设施
│  workflow-helpers / events / format (未来)                   │
├──────────────────────────────────────────────────────────────┤
│  Mock (mock 数据层)                                          │  ← 数据层
│  customers / tickets / alerts / knowledge / ...             │
└──────────────────────────────────────────────────────────────┘
```

## 3. 数据归属原则

**单一归属 + 显式 action,禁止跨 store 直接 mutate mock 数组。**

```
mock/data.ts  ──→ store.items (拷贝初始) ──→ store actions ──→ 响应式视图更新
                  (持久化 localStorage)    (validate + persist)
```

实际每个领域 store 都按这个模式:

```typescript
export const useAlertStore = defineStore('alert', {
  state: () => ({
    items: loadPersisted() // ← 拷贝,不是引用
  }),
  actions: {
    updateStatus(id, status) {
      // 唯一修改入口
      const a = this.items.find((x) => x.id === id)
      if (a) {
        a.status = status
        this.persist()
      }
    }
  }
})
```

### 历史教训

> **反模式**(项目早期):

```typescript
// ❌ 在 workflow store 中直接改 alerts:
import { alerts as mockAlerts } from '../mock/data'
mockAlerts[i].status = 'alert_verified' // 跨 store mutate mock
```

> **正模式**(当前):

```typescript
// ✅ 调用 alert store:
import { useAlertStore } from './alert'
useAlertStore().verifyByWorkflow(alertId, instanceId)
```

详见 [doc/architecture-review.md § 2.1](./doc/architecture-review.md)。

## 4. 工作流引擎

`workflow.ts` 是一个轻量的节点推进引擎:

```typescript
interface WorkflowInstance {
  id: string
  kind: 'negotiate' | 'stop_collection' | 'credit_objection' | 'transfer_mediate' | 'review_archive'
  status: 'running' | 'approved' | 'finished' | 'rejected' | 'expired'
  currentNode: string // 当前节点
  currentNodeStartedAt: string // 节点推进时间,用于超时检测
  expireAt: string // SLA 截止时间
  executions: WorkflowExecution[] // 节点执行历史
}

// 操作
;-startWorkflowInstance(kind, payload) - // 发起
  approve(id, approver, comment) - // 审批
  reject(id, approver, comment) - // 驳回
  advanceTo(id, nodeCode, payload) - // 推进节点
  tickOverdue() // 定时扫描超时
```

### 节点流转示意

```
[apply] → [approve] → [execute] → [effective]
                       ↓
                  [notify_seat]   ← 关联坐席
                       ↓
                  [archive/auto]  ← 关联知识库
```

### 联动(副作用入口收口)

```
[workflow.ts]                    ↘
  side-effect: notify_seat        → NotificationCenter (event)
  side-effect: mark_alert_verified → AlertStore.updateStatus (直接调用)
  side-effect: archive_to_kb       → KnowledgeStore (event)

[rectify.ts]                     ↘
  side-effect: verified            → KnowledgeStore (event) + Standards (直接调用)
```

## 5. 路由 & 菜单统一元数据

`router-meta.ts` 是路由 + 菜单的**唯一真相源**:

```typescript
export const ROUTE_META: RouteMetaDef[] = [
  {
    path: 'agent/desk',
    name: 'AgentDesk',
    title: '工作台',
    showInMenu: true,
    menuParent: '坐席',    // 一级菜单分组
    menuOrder: 1          // 同组内排序
  },
  ...
]

export function groupMenuByParent() {
  // 返回 { 坐席: [...], 客户: [...], ... }
  // 后续 MainLayout.vue 可改为从这一份构造菜单
}
```

**未来**:把 `router.ts` 与 `MainLayout.vue` 的菜单数组都改为由本文件驱动(目前两个文件独立维护)。

## 6. 事件总线收口

`constants/events.ts` 是全局事件名的**唯一来源**:

```typescript
export const EVT = {
  WORKFLOW_KB_ARCHIVE: 'cp-workflow-kb-archive',
  WORKFLOW_NOTIFY_SEAT: 'cp-workflow-notify-seat',
  WORKFLOW_ALERT_VERIFIED: 'cp-workflow-alert-verified',
  WORKFLOW_OVERDUE: 'cp-workflow-overdue',
  RECTIFY_VERIFIED: 'cp-rectify-verified',
  RECTIFY_TASK_CREATED: 'cp-rectify-task-created',
  RECTIFY_TASK_DONE: 'cp-rectify-task-done'
} as const
```

**规则**:

- ✅ 允许:`dispatchEvent(EVT.WORKFLOW_NOTIFY_SEAT, ...)` / `addEventListener(EVT.WORKFLOW_NOTIFY_SEAT, ...)`
- ❌ 禁止:业务代码直接写字符串 `'cp-workflow-notify-seat'`

CI 中有自动化检查守卫这条规则,详见 [.github/workflows/ci.yml](./.github/workflows/ci.yml)。

### 已废弃的事件(清理后保留文档)

| 事件名                             | 状态                      | 原因                               |
| ---------------------------------- | ------------------------- | ---------------------------------- |
| `cp-knowledge-approved`            | 删除(监听 0 dispatch 1)   | 知识审批无外部动作,无需事件        |
| `cp-system-stop-collection-active` | 删除(2 dispatch 0 listen) | 死代码,系统联动改由 store 直接调用 |
| `cp-system-negotiate-active`       | 删除(1 dispatch 0 listen) | 同上                               |
| `cp-nc-open`                       | 删除(1 dispatch 0 listen) | 通知中心改用 link 字段跳转         |

## 7. 持久化策略

每个领域 store 都用 localStorage 持久化:

```typescript
const STORAGE_KEY = 'cp_<模块>_data'

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return buildSeed() // 回退到初始 mock
}

function savePersisted(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}
```

优势:

- 刷新页面数据不丢失
- 演示期间每一步操作可即时反馈
- 切换角色互不影响
- `localStorage.clear()` 一键回到初始状态

## 8. 业务规则集中(utils)

[utils/workflow-helpers.ts](./src/utils/workflow-helpers.ts) 集中工作流状态映射规则:

```typescript
export function mapInstanceStatus(s: string) {
  return STATUS_MAP[s] || { label: s, color: 'gray' }
}

export function enrichStopCollectionRow(inst) {
  // 仅这里写「停催停扣」表特有字段,业务页只引用
  ...
}
```

效果:原本 4 个业务页面 copy-paste `statusMap` 的反模式消除。

## 9. 类型安全策略

| 级别                         | 状态    | 备注                                      |
| ---------------------------- | ------- | ----------------------------------------- |
| `strict: true`               | ✅ 开启 | 全套 strict 子项                          |
| `noUnusedLocals: false`      | ⚠️ 关闭 | 可逐步开启                                |
| `noUnusedParameters: false`  | ⚠️ 关闭 | 可逐步开启                                |
| `useUnknownInCatchVariables` | ✅ 开启 | catch 默认 unknown                        |
| `noUncheckedIndexedAccess`   | ⚠️ 关闭 | 开启会让所有 `arr[i]` 变 `T \| undefined` |

外加使用 `interface` 而非 `type` 描述领域对象,显式 `export type Foo = ...` 作为联合字面量。

## 10. 工具链

```
TypeScript   5.5+     类型检查
Vite         5.0+     构建
Vue          3.4+     框架
Pinia        2.1+     状态
Arco Design  2.55+    UI 库(企业级,深色模式完善)
Dayjs        1.11+    日期处理(预留,可在 utils/format 中)
```

## 11. 后续演进路线图

- [ ] **`services/` 层正式抽取**:把所有 mutation 路径收口到 `services/`
- [ ] **vitest 单测**:关键 store + 关键业务规则
- [ ] **ESLint + Prettier**:统一代码风格
- [ ] **`router.ts` 与 `MainLayout.vue` 改为完全由 `router-meta.ts` 驱动**
- [ ] **e2e 自动化**:Playwright 覆盖关键用户旅程
- [ ] **对接真实后端**:mock → services → API

详见 [doc/architecture-review.md § 路线图](./doc/architecture-review.md)。
