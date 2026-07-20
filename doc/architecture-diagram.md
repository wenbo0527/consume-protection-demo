# 🏗️ Architecture Diagram · 架构图

> 用 ASCII + 文字的方式描述系统架构。
> 一句话:**5 角色 · 17 store · 6 工作流 · 4 路由组 · 1 个事件总线**。

---

## 1. 高层架构(总览)

```
                          ┌─────────────────────────────────┐
                          │        🌐 Browser Stack        │
                          └─────────────────────────────────┘
                                            │
                ┌───────────────────────────┼───────────────────────────┐
                ▼                           ▼                           ▼
       ┌─────────────┐            ┌──────────────┐            ┌──────────────┐
       │  MainLayout  │            │  Pages (50+) │            │  Components  │
       │  + sidebar   │            │  by Role     │            │   (8)        │
       │  + role menu │            └──────┬───────┘            └──────┬───────┘
       └──────┬──────┘                   │                           │
              │ (render)                 │                           │
              └──────────┬───────────────┘                           │
                         ▼                                           │
                ┌─────────────────┐                                  │
                │    Pinia (17)   │◀─────────────────────────────────┘
                └────────┬────────┘     (NotificationCenter 订阅事件)
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
  UserStore       WorkflowStore     XxxStore
  (RoleKey)       (6 templates)    (业务数据)
        │                │
        └──── (Role 守卫)─┘
                         │
                         ▼
                ┌─────────────────┐
                │ Window Events   │
                │ (cp-* bus)      │
                └────────┬────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ localStorage (持久)  │
              └──────────────────────┘
```

---

## 2. 五角色 + 工作台

```
┌─────────────────────── 五角色 ───────────────────────────┐
│                                                          │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐ ┌────────┐  │
│   │  坐席   │  │ 业务执行 │  │ 管理层  │  │  审查   │ │ 消费者  │  │
│   │  agent  │  │ business │  │ manage │  │  review │ │consumer │  │
│   └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘ └───┬────┘  │
│        ▼            ▼            ▼            ▼          ▼      │
│    Agentwork    Businessw    Managew      Revieww    Consumerw │
│    bench/       bench/        bench/       bench/     bench/   │
└──────────────────────────────────────────────────────────────┘
```

| 角色              | 工作台目录                     | 主要页面                                                                                                               |
| ----------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 坐席 agent        | `src/pages/AgentWorkbench/`    | Desk · CustomerProfile · PhoneChannel · OnlineChat · TicketCreate                                                      |
| 业务执行 business | `src/pages/BusinessWorkbench/` | BusinessDesk · BusinessApply · Negotiate · StopCollection · Credit · Transfer                                          |
| 管理层 manage     | `src/pages/ManageWorkbench/`   | Dashboard · AlertHandle · Rectify · Quality · Ops · Billing · ExitCase · RuleConfig · WorkflowConfig · WorkflowMonitor |
| 审查 review       | `src/pages/ReviewWorkbench/`   | PendingReview · ReviewExecute · Standards · PromiseTracking · AuditTrail · CreateReview                                |
| 消费者 consumer   | `src/pages/ConsumerWorkbench/` | ProgressSearch · FeedbackSubmit                                                                                        |

---

## 3. Pinia Store 总览(17 个)

```
                       ┌──────────────────────────┐
                       │   useUserStore(认证)      │ ←── role key 全局唯一
                       └────────────┬─────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
[业务数据 store]              [流程 store]                    [调度 store]
   customers                    workflow(6 templates)          instruction(通知)
   tickets                       workflow.instances              businessApp(申请)
   knowledge (知识库)          tagRule(规则)                  callQueue(队列)
   alerts(预警)                 rectify(整改)                 ops(运营)
   quality(质检)                review(标准)
   exitCase(清退)
   billing(票据)
```

### 3.1 store 联动关系

```
useAlertStore           触发 ──► useWorkflowStore.start({ kind: 'alert_directive' })
                                      │
                                      ├─ 副作用:'notify_seat'  ─► window event
                                      └─ 节点推进              ─► useAlertStore.verifyByWorkflow()
                                                                    (回写状态)

useBusinessAppStore.approve(id, reviewer)  ─►  useWorkflowStore.start({ kind: 'negotiate' })
                                                  │
                                                  └─ 副作用:'negotiate_active' / 'notify_seat'

useReviewStore.generateFromRectify(prc)     ─►   useKnowledgeStore.upsertStandard(s)
                                                       └─ 知识条目同步沉淀

useTagRuleStore.applyToCustomer(tags)       ─►   弹屏展示给坐席
                                                      │
                                                      └─ useWorkflowStore.start({ kind: 'alert_directive' })

useCompliancePromiseStore.createWithFollowUp(input)  ──► ticketId 自动生成 + BusinessApply 联动
```

---

## 4. 数据流

### 4.1 写:页面 → Store → localStorage

```
<button @click="onSubmit">
      ↓
<script setup lang="ts">
function onSubmit() {
  // 1. 调用 store action
  ticketStore.create({ ...formData })
        ↓
src/stores/ticket.ts:
actions: {
  create(input) {
    this.items.push({ id: nextId(), ...input, status: 'pending' })
    this.persist()        ← 2. 同步写 localStorage
    return newItem
  }
}
        ↓
localStorage['cp_tickets'] = JSON.stringify(this.items)
```

### 4.2 读:localStorage → Store → 页面(getter/computed)

```
页面挂载 ──► useTicketStore()
                  ↓
                  ├─ state() 从 localStorage 读取
                  ↓
<template v-for="t in ticketStore.pendingTickets">
                  ↑
                  ├─ getters.pendingTickets (computed on state)
                  ↑
Vue reactivity ──► 触发重新渲染
```

### 4.3 跨 store + 跨页面

```
[页面 A:坐席]                [页面 B:管理层]                [页面 C:审查]
点击"发起申请"              实时看到新申请                  实时看到新审查
↓                            ↑                              ↑
useBusinessAppStore.create()  computed 引用它               computed 引用它
↓                            ↑                              ↑
items.unshift(newItem)        items 触发 reactivity         items 触发 reactivity
↓                            ↑
自动 persist 到 localStorage
```

---

## 5. 工作流引擎(6 个模板)

### 5.1 模板清单

| kind               | 名称     | 节点                                                               |
| ------------------ | -------- | ------------------------------------------------------------------ |
| `stop_collection`  | 停催停扣 | apply → approve → effective → notify → archive                     |
| `negotiate`        | 协商还款 | apply → trial_calc → approve → effective → notify → archive        |
| `credit_objection` | 征信异议 | apply → approve → investigate → resolve → notify                   |
| `transfer_mediate` | 转调解   | apply → match → approve → execute → notify → archive               |
| `review_archive`   | 审查归档 | archive → auto_archive_kb → kb_review → notify_seat → archive2     |
| `alert_directive`  | 预警指令 | create_alert → confirm → seat_exec → mark_alert_verified → archive |

### 5.2 节点推进状态机

```
        ┌──────────────────────────┐
        │     (instance created)   │
        │     inst.status:running  │
        │     currentNode=apply    │
        └──────────────┬───────────┘
                       ▼
        ┌──────────────────────────┐
        │     node = 'apply'       │ ← autoNext=true, 自动推进
        │     + sideEffect         │
        └──────────────┬───────────┘
                       ▼
        ┌──────────────────────────┐
        │     node = 'approve'     │ ← handlerRole='business'
        │     等待业务执行岗审批    │
        └──────────────┬───────────┘
                       ▼ wf.approve(instanceId, operator, note)
        ┌──────────────────────────┐
        │     node = 'effective'   │ ← autoNext
        └──────────────┬───────────┘
                       ▼
        ┌──────────────────────────┐
        │     node = 'notify'      │ ← 副作用 notify_seat
        │     (写 store + 派 event)│
        └──────────────┬───────────┘
                       ▼
        ┌──────────────────────────┐
        │     node = 'archive'     │ ← 终态
        │     inst.status:finished │
        └──────────────────────────┘
```

### 5.3 副作用(side effects)

每个节点可声明 `sideEffect`:

| sideEffect               | 自动行为                                                             |
| ------------------------ | -------------------------------------------------------------------- |
| `stop_collection_active` | 写 ticket.status='stopped'                                           |
| `negotiate_active`       | 写 ticket.status='negotiating' + 派 notify_seat                      |
| `archive_to_kb`          | 写 knowledge.items.push({source:'review_archive', status:'pending'}) |
| `notify_seat`            | 派 `cp-workflow-notify-seat` event                                   |
| `mark_alert_verified`    | 调 alertStore.verifyByWorkflow + 派 event                            |

---

## 6. 事件总线(`window.dispatchEvent`)

```
src/constants/events.ts:

export const EVT = {
  WORKFLOW_KB_ARCHIVE:     'cp-workflow-kb-archive',
  WORKFLOW_KB_REVIEWED:    'cp-workflow-kb-reviewed',
  WORKFLOW_NOTIFY_SEAT:    'cp-workflow-notify-seat',
  WORKFLOW_ALERT_VERIFIED: 'cp-workflow-alert-verified',
  WORKFLOW_OVERDUE:        'cp-workflow-overdue',
  RECTIFY_VERIFIED:        'cp-rectify-verified',
  INSTRUCTION_RECEIVED:    'cp-instruction-received'
}
```

### 6.1 订阅模式

```
[发送方 store]
useWorkflowStore._advance(inst, tpl, op)
       ↓
case 'archive_to_kb':
  useKnowledgeStore().upsertFromReview(...)
  window.dispatchEvent(new CustomEvent(EVT.WORKFLOW_KB_ARCHIVE))

[订阅方(组件或 store)]
window.addEventListener(EVT.WORKFLOW_KB_ARCHIVE, (e) => {
  console.log(e.detail)  // 可读 detail:{ title, content, source }
})
```

---

## 7. hash 路由策略

```
vue-router: createWebHashHistory()  ←── 不需要后端 try_files
                                      ←── gh-pages 静态托管完美适配

URL 形如:
  https://your-org.github.io/repo/#/agent/desk
                                  ▲
                               不会触发 HTTP 请求,前端 JS 处理
```

**好处**:

- gh-pages 友好(无需 nginx 配置)
- 不需要后端(都在前端 mock)
- 直接跳子路径不会 404(只是路由不命中,JS 拦截)

---

## 8. 角色守卫(P3-8)

```
                    ┌─────────────────────────────┐
                    │   wf.approve(inst, op)       │
                    └──────────────┬──────────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                ▼                  ▼                  ▼
          type=='apply'      type=='approve'     type=='auto'
        (autoNext)         (handlerRole==role?)   (system)
                            ┌──────┴──────┐
                            │ ✅ approved │
                            │ ❌ warn log │
                            └─────────────┘
```

具体见 `useWorkflowStore.canApproveFor(instanceId, role)` + `wf.approve(..., operatorRole)`。

---

## 9. 重复工单检测(P1-6)

```
[用户在 TicketCreate 输入客户 ID]
       ↓
lookupCustomer()                   recheckDup() (form.type 切换时)
       │
       ├─ 查 customer.ongoingTickets
       ├─ 查 wf.instances[customerId,running].kind.options includes form.type
       ├─ 查 mockTickets[customerId, not closed, type == form.type]
       │
       ▼
[命中] dupAlert.value = { source, id, type, node }
[未命中] dupAlert.value = null
```

---

## 10. 部署

```
┌──────────────┐ push main ┌─────────────────┐       ┌──────────────┐
│   本地仓库    │ ──────► │   GitHub main    │ ────► │ gh-pages     │
│  (你的 mac)   │           │ (CI 自动跑)     │       │ (CDN 在线)   │
└──────────────┘           │                  │       │              │
                          │ - ci.yml         │       │ 公开访问:    │
                          │ - deploy.yml     │       │ 仓库.spfx.   │
                          │ - release-drafter│       │ .io/<repo>/ │
                          │ - pr-preview.yml │       └──────────────┘
                          └─────────────────┘
                                   │
                                   ▼
                            ┌────────────┐
                            │  Releases   │
                            │ 自动 CH 草稿│
                            │ 7 天有效    │
                            └────────────┘
```

---

## 11. 一句话

> **本架构设计原则**:
>
> 1. **前端 mock + localStorage 持久化** —— 无需后端,gh-pages 即可
> 2. **Pinia 跨角色单例** —— 5 个页面实时联动,共享同一份 in-memory store
> 3. **Workflow 引擎统一** —— 6 类业务模板,统一 action API
> 4. **事件总线低耦合** —— CustomEvent 解耦跨 store 副作用
> 5. **路由 hash 模式** —— gh-pages 直链友好
>
> 单一真相源 + 单向数据流 + 异步副作用 + 事件总线 = 完整业务全链路在前端跑通。

---

## 12. 进阶

- 数据流详解:[architecture-product-alignment.md](./architecture-product-alignment.md)
- PRD 对账:[prd-final-coverage.md](./prd-final-coverage.md)
- 演示剧本:[demo-script.md](./demo-script.md)
- 启动指南:[setup.md](./setup.md)
- 贡献指南:[contributor-guide.md](./contributor-guide.md)
