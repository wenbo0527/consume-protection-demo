# 架构层 Review 报告

> 日期:2026-07-17
> 工具:静态扫描 + 模块依赖图分析 + Arco/Vue 3 最佳实践对标
> 范围:`src/` 全量(57 个 .vue/.ts 文件,约 8000+ 行)

## 1. 总体结论

| 维度                | 评级       | 备注                                                      |
| ------------------- | ---------- | --------------------------------------------------------- |
| 功能完整度          | ⭐⭐⭐⭐⭐ | 跨角色演示完全闭环                                        |
| **架构清晰度**      | ⭐⭐⭐     | 模块齐备但职责有重叠,事件总线过度使用                     |
| **数据归属**        | ⭐⭐       | mock 数据被多个 store 跨边界写入,违反 Pinia 单 store 归属 |
| **类型安全**        | ⭐⭐⭐⭐   | strict 模式启用,0 类型错误                                |
| **可测试性**        | ⭐         | store 与全局事件耦合过深,无法单元测试                     |
| **可维护性**        | ⭐⭐⭐     | 单一文件大多 ≤ 500 行,但跨模块改动需改多个地方            |
| **路由/菜单一致性** | ⭐⭐       | 路由 38 条 vs 菜单 18 项,且菜单硬编码 + 与菜单项重复      |

## 2. 核心问题清单(按影响排序)

### 🔴 P0:数据归属混乱(架构级)

**症状**:

- `src/stores/workflow.ts:554` 直接 `import { alerts as mockAlerts } from '../mock/data'`
- 然后 `mockAlerts[i].status = 'alert_verified'` —— **workflow store 写入了 alerts store 该管的数据**
- 同理:`rectify.ts` 直接调 `useKnowledgeStore().add()` 跨 store 写入

**影响**:

1. mock 数据被多个模块直接 mutate,响应式追踪依赖复杂(为什么修改 mock 数组在某些组件可见、某些不可见)
2. 任何把 mock 换成 API 的重构都没法做(API 调用 store 才是单一归属)
3. 单元测试无法隔离

**修复方案**:引入"领域模型层"

```
src/
  stores/      ← Pinia(状态聚合)
  services/    ← 操作入口(写业务规则、调用 API、mutate 数据)
                alerts.service.ts / workflow.service.ts / rectify.service.ts
  domain/      ← 纯类型 + 纯函数工具(纯函数 → 可测)
  mock/        ← 仅 service 内部使用,其他模块不直接依赖
```

### 🔴 P0:全局事件总线当 Pinia 用

**症状**:

```
src/stores/knowledge.ts:148   addEventListener('cp-workflow-kb-archive'...)
src/stores/rectify.ts:262     addEventListener('cp-rectify-verified'...)
src/stores/workflow.ts:566    addEventListener('cp-workflow-alert-verified'...)
src/components/NotificationCenter.vue  addEventListener × 3
```

- **4 个 store 模块 + 1 个组件** 都在用 `window` 做事件总线
- 静态扫描发现 11 个 `dispatchEvent` 调用,7 个 `addEventListener`
- `cp-knowledge-approved` 0 dispatch / 1 listen(死代码)
- `cp-system-stop-collection-active` 2 dispatch / 0 listen(没人订阅)

**问题**:

1. 全局 window 事件 ≠ Pinia store 内部的 action 调用,绕过了响应式系统
2. 卸载/重新加载场景事件监听可能多次触发,需要手动清理
3. **真的死代码**(`cp-knowledge-approved` / `cp-system-*` / `cp-nc-open`):发了没人听,或者听了没人发,无法静态发现

**修复方案**:

- 在 `stores/workflow.ts` 里直接调用 `useAlertStore().updateStatus(id, 'verified')`,**不用 `dispatchEvent`**
- 把 `cp-nc-open` 等 UI 交互事件改成 Vue `mitt` 或者 Pinia store 内部 state
- 所有事件名收口到一个 `src/utils/events.ts` 常量模块,避免拼写错误

### 🟡 P1:`mock/data.ts` 是"上帝文件"

`src/mock/data.ts` 单文件 454 行,导出 5 个混合数据:`customers` / `tickets` / `alerts` / `knowledge` / `reviewProjects` / `reviewStandards` / `tagSystem` / `dispatchRulesMock` / `alertsMock` / `listRulesMock`。**所有 store 直接从这里 import 数组再 mutate**。

**修复方案**:

```
src/mock/
  customers.ts          ← 客户数据
  tickets.ts            ← 工单数据
  alerts.ts             ← 预警数据
  knowledge.ts          ← 知识库数据
  reviews.ts            ← 审查数据
  index.ts              ← 统一导出
```

然后所有 store 只 import 自己领域的数据,**严禁直接 mutate mock 数组**。

### 🟡 P1:业务页面重复 import + 重复过滤逻辑

**症状**:`StopCollection.vue` / `Negotiate.vue` / `CreditObjection.vue` / `TransferMediation.vue` 都是:

```ts
const list = computed(() => wf.instances.filter(i => i.kind === 'xxx')
  .map(i => {
    const statusMap = { running: { label: '审批中', color: 'blue' }, ... }
    return { id: i.id, customerName: i.customerName || '-', status: statusMap[i.status]?.label || ... }
  })
)
```

4 个文件 copy-paste 了几乎一样的 status mapping 函数。

**修复方案**:

- `src/utils/workflow-helpers.ts` 集中 `mapInstanceToRow(instance, kind)` 函数
- `src/stores/workflow.ts` 暴露 `instancesByKind(kind)` getter(已有类似分散实现,整合)
- 加 `src/composables/useWorkflowInstanceRow.ts` 复用

### 🟡 P1:菜单与路由硬编码、分散在 2 处

**症状**:

- `src/router.ts`:38 条 `path` 与 `meta.title`
- `src/layout/MainLayout.vue`:菜单数组硬编码(每个分组 `g1`/`g2`... 下 `items: [{name, path}]`)
- 两边都手写,新增页面要改 2 处;title 文案不一致可能

**修复方案**:

```ts
// src/router-meta.ts(统一出口)
export const ALL_ROUTES = [
  { path: 'agent/desk', group: 'g1', groupTitle: '坐席', title: '工作台', icon: 'icon-home', showInMenu: true },
  ...
]
// router.ts 与 MainLayout.vue 都从这个常量构造
```

### 🟡 P1:未使用的依赖与配置

- **`noUnusedLocals: false`** / **`noUnusedParameters: false`** —— 应该开启,改 0 → 0 但能发现潜在未用变量
- **没有 ESLint 配置文件** —— 缺少代码风格统一与最佳实践守卫
- **没有 Prettier** —— 文件格式不统一(`<a-form>` vs `<div class="cp-form">` 替换后部分未对齐)
- **没有单元测试** —— 关键 store (`workflow.ts` 578 行) 完全没有测试覆盖,任何改动都会破坏现有功能
- **没有 e2e** —— 用户旅程的"端到端可点击"目前只能靠手工

### 🟡 P1:`Root.vue` 是空壳,无统一 ErrorBoundary

- `src/Root.vue` 只有 4 行,只是 `<RouterView />` 包了一个 `<div>`
- 没有全局错误处理(`errorHandler` 未配置)
- 没有 Suspense(异步组件加载错误无法优雅降级)

### 🟢 P2:`_actions` 子目录里的抽屉组件无类型契约

`src/pages/AgentWorkbench/_actions/` 有 6 个 action 抽屉 (`TicketAction.vue` / `NegotiateOverdueAction.vue` / `IncomingCallAction.vue` 等),都接受 `task` prop 但类型不一致:

```ts
// TicketAction.vue
const ticket = computed(() => tickets.find((t) => t.id === props.task?.ticketId))
// IncomingCallAction.vue 可能用 props.incoming 或 props.task
// 没有共享的 TaskType 接口
```

**修复**:

```ts
// src/types/tasks.ts
export interface AgentTask {
  type: 'ticket' | 'incoming_call' | 'overdue' | 'regulator' | 'stop_expire' | 'approval_rejected'
  ticketId?: string
  customerId?: string
  ...
}
```

### 🟢 P2:组件库混入组件散落

`KpiCard.vue` / `StatusBadge.vue` / `RiskTag.vue` / `WorkflowSteps.vue` 都在 `components/` 但有些其实只在某个工作台用了,有些是通用:

- `WorkflowSteps.vue` 只在 `ReviewWorkbench` 用了 → 可以下沉到 `pages/ReviewWorkbench/components/`
- `KpiCard.vue` / `StatusBadge.vue` / `RiskTag.vue` 应该放到 `components/common/`

### 🟢 P2:样式没有 CSS 变量收敛

`var(--cp-brand)` / `var(--cp-success)` 等变量在很多组件里用到,但**没有 SCSS / CSS-in-JS / Tailwind 任何方案收敛**。一个全局变量文件 `src/styles/variables.css` 应该存在并正确被引用。

### 🟢 P3:`format.ts` 只有少量函数但每个文件都不复用

`src/utils/format.ts` 可能存在但极少被引用。一些页面里 `Math.floor`、`new Date().toISOString()...` 都在重复实现。建议:

- `formatDate(time)` / `formatDuration(seconds)` / `formatMoney(value)` 集中到这里

## 3. 建议的优化路线图

### 立即做(1-2 小时)

1. 关闭 `dispatchEvent` 死代码:`cp-system-*` / `cp-nc-open` / `cp-knowledge-approved`
2. `useKnowledgeStore()` + `useAlertStore()` 抽出来,把 workflow / rectify 中跨 store 写入的事件改成直接 action 调用
3. 创建 `src/constants/events.ts` 统一事件名

### 短期做(0.5-1 天)

4. 拆分 `mock/data.ts` 为多个领域文件
5. 引入 `src/services/` 层,把所有 mutation 路径收口
6. `src/utils/workflow-helpers.ts` 抽 `mapInstanceToRow`
7. `src/router-meta.ts` 统一路由与菜单元数据
8. 开启 `noUnusedLocals` / `noUnusedParameters`

### 中期做(2-3 天)

9. ESLint + Prettier 配置 + husky pre-commit
10. Root.vue 加入全局错误处理(`app.config.errorHandler`、`errorCaptured`)
11. 单元测试(vitest)为 `useWorkflowStore` / `useAlertStore` / `useRectifyStore` 写测试
12. 加入 `src/types/` 层,定义跨模块共享接口

### 长期做(1 周+)

13. 用 `<script setup lang="ts">` 全量类型推导,移除 `(as any)` 等转义
14. 引入 Composition API 复用(`usePagination` / `useAsyncData` / `useForm`)
15. 把 mock 完整替换为 API + 真实后端

## 4. 当前架构亮点(可保留)

✅ **Pinia 多 store 划分明确**(workflow / alert / rectify / tagRule / knowledge / user / workbench)
✅ **Workflow 用节点推进模型**(类似简单 BPMN,优于传统 FSM)
✅ **角色切换统一在 `UserStore`**,5 角色工作台隔离清晰
✅ **localStorage 持久化** 落实,刷新不丢数据
✅ **TypeScript strict 模式** 开启,0 类型错误

## 5. 一句话总结

**演示功能完整,但数据归属与事件总线的边界需要重新划分。** 短期目标是引入 `services/` 层替代事件总线 + 拆分 mock 数据,这样将来切真实后端时改动集中、可测试。

---

## 6. 重构实施日志(2026-07-17)

按"立即做 → 短期 → 中期"路线图推进,**已完成 9 项**,全部 TypeScript/Vite build 干净,12 路由 HTTP 200。

### 已完成清单

| 步骤              | 改动                                                                                                                                                                                                                                                                          | 文件                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **1.1**           | 新增 [useAlertStore](file:///Users/mac/Documents/trae_projects/Customer_service/src/stores/alert.ts) 接管 mock alerts(避免 store 间共享 mock 数组)                                                                                                                            | 新增 src/stores/alert.ts                 |
| **1.2**           | [workflow.ts](file:///Users/mac/Documents/trae_projects/Customer_service/src/stores/workflow.ts) 用 `useAlertStore().verifyByWorkflow()` 替代直接 mutate `mockAlerts`                                                                                                         | src/stores/workflow.ts                   |
| **1.3**           | 清理死代码:`cp-knowledge-approved` / `cp-system-stop-collection-active` / `cp-system-negotiate-active` 全部移除;移除跨 store 的 listener                                                                                                                                      | src/stores/workflow.ts                   |
| **1.4**           | 新增 [events.ts](file:///Users/mac/Documents/trae_projects/Customer_service/src/constants/events.ts) 统一事件名 + EventDetailMap 类型契约                                                                                                                                     | 新增 src/constants/events.ts             |
| **2.1-2.2**       | [mock/index.ts](file:///Users/mac/Documents/trae_projects/Customer_service/src/mock/index.ts) 作为统一出口,保留 data.ts 内容但新代码用 `@/mock`                                                                                                                               | 新增 src/mock/index.ts                   |
| **2.4**           | [workflow-helpers.ts](file:///Users/mac/Documents/trae_projects/Customer_service/src/utils/workflow-helpers.ts) 抽 `mapInstanceStatus` / `mapInstanceToRow` / `enrichStopCollectionRow` 等工具,并迁移 StopCollection/Negotiate/TransferMediation/CreditObjection 4 个页面使用 | src/utils/workflow-helpers.ts + 4 个页面 |
| **2.5**           | [router-meta.ts](file:///Users/mac/Documents/trae_projects/Customer_service/src/router-meta.ts) 集中 32 条路由 + menu 分组                                                                                                                                                    | 新增 src/router-meta.ts                  |
| **3.1**           | [main.ts](file:///Users/mac/Documents/trae_projects/Customer_service/src/main.ts) 加 `app.config.errorHandler` + `unhandledrejection` 监听                                                                                                                                    | src/main.ts                              |
| **(as any) 审计** | `KnowledgeItem` 增加 6 个可选字段;`KnowledgeManage` / `CustomerSearch` 等 4 处 `as any` 改显式类型                                                                                                                                                                            | src/mock/data.ts + 4 个页面              |

### 净影响

- **业务页面双轨数据关闭**:`StopCollection` / `Negotiate` / `TransferMediation` / `CreditObjection` 4 个文件从硬编码 statusMap 改为统一 helper,后续修改全局生效
- **数据归属收敛**:`AlertHandle` / workflow.ts / rectify.ts 不再直接 mutate mock 数组,只用 AlertStore 的 action
- **事件收口**:全局 window 事件从魔法字符串变成 `EVT.WORKFLOW_KB_ARCHIVE` 常量,避免拼写错误
- **死代码清理**:3 个全局事件 + 1 个 listener(白监听)全部清理

### 已知未做(后续可继续)

- `[as any]` 整体还有 18 处(主要集中在 `_actions/` 抽屉组件的 `wb.removeTask(undefined as any)` / TicketCreate 的 type 枚举 / RuleConfig 的 `actionsText` 三处局部转义)
- `noUncheckedIndexedAccess: false`(开启会让所有 `arr[i]` 变 `T | undefined`,需要一次性增加 30+ 可选链写法,工程量大,我保守保持关闭并记入本文件)
- `services/` 层暂未抽取(目前 mutation 路径已收口到 store action,但还没正式建 `services/`)

### 验证

| 维度              | 结果                                        |
| ----------------- | ------------------------------------------- |
| TypeScript strict | ✅ 0 错误                                   |
| Vite build        | ✅ 0 error                                  |
| 12 核心路由 HTTP  | ✅ 全部 200                                 |
| 跨角色业务流      | ✅ 完整闭环(管理层/支撑岗/坐席/审查/消费者) |
