# 消保投诉管理系统 · 用户旅程与功能缺口分析

> 基于当前仓库代码(`src/`、`stores/`、`router.ts`、`mock/data.ts`、路由表、菜单结构、组件实现)与需求文档比对生成。
> 目的:对齐"用户旅程"与"实际 Demo 已实现能力",输出一份可执行的功能缺口清单,作为后续迭代的输入。
> 生成日期:2026-07-17

---

## 1. 评估方法

1. **用户旅程侧**:依据提供的"角色-工作类型-工作流-菜单路径"描述,梳理 5 类角色的高频/中频/低频任务。
2. **代码侧**:逐一对照路由表([src/router.ts](file:///Users/mac/Documents/trae_projects/Customer_service/src/router.ts))、菜单生成([src/layout/MainLayout.vue](file:///Users/mac/Documents/trae_projects/Customer_service/src/layout/MainLayout.vue#L136-L225))、Mock 数据([src/mock/data.ts](file:///Users/mac/Documents/trae_projects/Customer_service/src/mock/data.ts))、Pinia store([src/stores/user.ts](file:///Users/mac/Documents/trae_projects/Customer_service/src/stores/user.ts)、[src/stores/workbench.ts](file:///Users/mac/Documents/trae_projects/Customer_service/src/stores/workbench.ts))。
3. **对每条工作流标注**:✅ 已实现 / 🟡 部分实现(有占位但流程未闭环) / ❌ 未实现。

---

## 2. 当前 Demo 实际形态(代码侧快照)

### 2.1 已实现页面(共 24 个 + Login + MainLayout)

| 工作台 | 路由 | 文件 | 状态 |
| --- | --- | --- | --- |
| 登录 | `/login` | `pages/Login.vue` | ✅ 5 个角色卡片,带日志 |
| 坐席工作台 | `/agent/desk` | `pages/AgentWorkbench/AgentDesk.vue` | ✅ 模拟来电/挂断/接通跳客户详情(已修复) |
| 坐席 | `/agent/todo` | `TicketsTodo.vue` | ✅ |
| 坐席 | `/agent/ticket-create` | `TicketCreate.vue` | ✅ |
| 坐席 | `/agent/ticket/:id` | `TicketDetail.vue` | ✅ |
| 坐席 | `/agent/customer/:id` | `CustomerProfile.vue` | ✅ + 通话中 Banner(已新增) |
| 坐席 | `/agent/knowledge` | `KnowledgeSearch.vue` | ✅ |
| 坐席 | `/agent/reg-import` | `RegImport.vue` | ✅ |
| 坐席 | `/agent/batch` | `BatchJob.vue` | ✅ |
| 业务执行台 | `/business/desk`、`/business/pending` | `BusinessDesk.vue`、`PendingTickets.vue` | ✅ |
| 业务 | `/business/stop-coll` | `StopCollection.vue` | ✅ |
| 业务 | `/business/negotiate` | `Negotiate.vue` | ✅ |
| 业务 | `/business/credit` | `CreditObjection.vue` | ✅ |
| 业务 | `/business/transfer` | `TransferMediation.vue` | ✅ |
| 审查 | `/review/pending`、`/review/create`、`/review/execute/:id`、`/review/standards` | 对应 4 个文件 | ✅ |
| 管理 | `/manage/dashboard` | `Dashboard.vue` | ✅ |
| 管理 | `/manage/alert` | `AlertHandle.vue` | ✅ |
| 管理 | `/manage/rules` | `RuleConfig.vue` | ✅ |
| 管理 | `/manage/lists` | `ListManage.vue` | ✅ |
| 管理 | `/manage/knowledge` | `KnowledgeManage.vue` | ✅ |
| 管理 | `/manage/workflow-config`、`/manage/workflow-monitor` | `WorkflowConfig.vue`、`WorkflowMonitor.vue` | ✅ |
| 消费者 | `/consumer/complaints`、`/consumer/feedback` | `MyComplaints.vue`、`Satisfaction.vue` | ✅ |

### 2.2 状态/数据模型现状

- **`useUserStore`**:仅保存 `currentRole`,**未实现**用户基础信息(token、姓名、权限列表)。
- **`useWorkbenchStore`**:任务流(`incoming`/`call`/`activeTask`/`stream`)、坐席状态机(`idle/ringing/oncall/wrapup/break`)、通话计时。
- **Mock 数据**:客户、工单、审查项目、预警、名单;**没有**:知识库条目、停催/停扣申请记录、协商方案、调解记录、规则配置实例、坐席排班/绩效、监管转诉待办池、消费者投诉进度。

---

## 3. 角色 × 工作流 × 实现状态矩阵

### 3.1 角色一:一线客服坐席

| 工作类型 | 旅程要点 | 代码现状 | 评级 |
| --- | --- | --- | --- |
| **来电受理** | 接听→弹屏画像→确认预警→建单→处理→关单 | `AgentDesk` 模拟来电 + 接通跳转 `CustomerProfile?call=1`;`CustomerProfile` 含预警 Alert、工单 Modal;`TicketDetail` 含关单 | ✅ 主链路通 |
| **业务操作发起**(停催/停扣/协商/转诉/征信异议/贷中清退) | 坐席可发起申请,转入支撑岗审批 | 当前 `AgentDesk` 列表只有"拨号"按钮;**没有**坐席侧"业务申请"入口与表单 | 🟡/❌ 部分缺失 |
| **知识检索** | 检索→引用到工单 | `KnowledgeSearch.vue` 已实现 | ✅ |
| **批量作业**(监管转诉建单/批量建单/批量开票开证明) | Excel 解析+批量处理 | `RegImport.vue`、`BatchJob.vue` 已实现 | ✅ |
| **快捷操作**(短信/邮件/试算) | 一键调用 | **未实现**(`CustomerProfile` "拨号"按钮已是快捷拨号,但短信/邮件/试算未做) | ❌ |

### 3.2 角色二:业务支撑岗

| 工作类型 | 旅程要点 | 代码现状 | 评级 |
| --- | --- | --- | --- |
| 停催停扣处理 | 审核→审批→生效→到期恢复 | `StopCollection.vue` 已实现(单页面承担所有操作) | ✅ |
| 协商方案 | 试算→审批→触发停催→到期 | `Negotiate.vue` 已实现 | ✅ |
| 转诉管理 | 提交平台→状态同步→超时催办 | `TransferMediation.vue` 已实现 | ✅ |
| 征信异议 | 接收→核实→提交→跟踪 | `CreditObjection.vue` 已实现 | ✅ |
| 贷中清退 | 修复/清除/关闭 | **无独立页** | ❌ |
| 票据合同开具 | 证明/发票/合同/协议 | **无** | ❌ |
| 调解工作 | 协议开具→执行跟踪 | 暂由 `TransferMediation.vue` 部分覆盖 | 🟡 |
| 工单处理 | 接收流转工单 | `PendingTickets.vue` 已实现 | ✅ |

### 3.3 角色三:消保审查人员

| 工作类型 | 旅程要点 | 代码现状 | 评级 |
| --- | --- | --- | --- |
| 新产品/营销/变更审查 | 立项→填写→审查→归档 | `PendingReview.vue`、`CreateReview.vue`、`ReviewExecute.vue` 已有 | ✅ |
| 审查标准维护 | 新增/修改/停用 | `Standards.vue` 已实现 | ✅ |
| 审查归档→知识库同步 | 归档后自动同步 | `KnowledgeManage.vue` 在管理层,**审查归档触发同步**的链路未串通(没有写回 store / mock) | 🟡 |
| 审查追溯 | 历史查询 | 菜单里有"审查追溯",但路由指向 `/review/standards`,未独立实现 | ❌ |
| **审查执行 → 客户投诉管控目标更新** | 同步投诉信息库 | **未实现** | ❌ |

### 3.4 角色四:消保管理层

| 工作类型 | 旅程要点 | 代码现状 | 评级 |
| --- | --- | --- | --- |
| 全局监控 | KPI + 趋势 + 报表 | `Dashboard.vue` 已实现 | ✅ |
| 预警处置 | 确认/升级/忽略+关联工单 | `AlertHandle.vue` 已实现 | ✅ |
| 规则配置 | 分单/预警/标签联动/名单 | `RuleConfig.vue` 已实现(集中在一个页面) | ✅ |
| 黑灰产治理 | 黑名单/投诉库/代理库 | `ListManage.vue` 已实现 | ✅ |
| 质检管理 | 质检→整改→复检 | **未实现** | ❌ |
| 溯源整改 | 溯源→整改→考核 | **未实现** | ❌ |
| 运营管理 | 排班+坐席绩效 | 菜单项存在,页面导向 `/manage/workflow-monitor`,**实质未做** | ❌ |
| 标签联动规则 | 标签→规则→动作 | 列表内有占位,**配置 UI 未实现** | 🟡 |

### 3.5 角色五:消费者

| 工作类型 | 旅程要点 | 代码现状 | 评级 |
| --- | --- | --- | --- |
| 投诉进度查询 | 进度条+阶段+预计时间 | `MyComplaints.vue` 已实现 | ✅ |
| 补充材料 | 上传+自动关联 | 列表里有"补充信息"按钮,**表单未实现** | 🟡 |
| 催办(7 天 1 次) | 限频+提示 | **未实现** | ❌ |
| 满意度评价 | 评分→低分回访 | `Satisfaction.vue` 已实现;低分回访工单自动创建未做 | 🟡 |

---

## 4. 跨角色协作(三道防线)对账

### 4.1 事前→事中:审查归档同步知识库

- **现状**:`KnowledgeManage.vue`(管理侧)提供 CRUD,`KnowledgeSearch.vue`(坐席侧)展示搜索结果。**没有任何代码路径在审查归档时把"审查结论"写进知识库**。
- **缺口**:
  - `useReviewStore` 不存在;归档动作(在 `ReviewExecute.vue` 里)没有 dispatch 知识库更新事件。
  - 知识条目没有"来源"字段(审查/人工录入),无法反向追溯。
- **影响**:无法验证"审查归档→坐席检索到新知识→投诉处置时引用"的闭环。

### 4.2 事中→事后:溯源整改

- **现状**:`Dashboard` 提供投诉趋势、监管件超时看板;**没有任何溯源页面或整改任务追踪**。
- **缺口**:
  - 缺 `/manage/trace`(溯源归因)与 `/manage/rectify`(整改任务)页面。
  - 缺整改任务与工单的关联模型。
  - 缺整改 → 审查标准更新的回写。

### 4.3 事后→事前:溯源整改→审查标准更新

- **现状**:`Standards.vue` 提供标准维护,但没有"来自整改任务"的数据来源字段。
- **缺口**:标准条目应携带 `source: 'manual' | 'rectify' | 'regulator'`,整改任务完成后可一键生成新标准项(目前未实现)。

### 4.4 标签联动 → 坐席弹屏

- **现状**:`CustomerProfile` 与 `AgentDesk` 的预警 Alert 都是基于 `riskTags` 硬编码计算,**没有任何"标签联动规则配置"实际生效的链路**。
- **缺口**:
  - 缺 `useTagRuleStore`,RuleConfig 里的"标签联动规则"是静态占位。
  - 缺规则试算/发布流程 UI。

### 4.5 坐席↔支撑岗:业务操作申请流转

- **现状**:支撑岗各页面独立运行;**坐席侧没有任何"发起业务申请"的入口**。
- **缺口**:
  - `AgentDesk`/`CustomerProfile` 缺少"申请停催/停扣/协商/转诉/征信异议"按钮。
  - 缺申请工单与审批工单的关联。
  - 缺 OA 审批的 mock 流程(目前是前端一次性"通过/驳回"按钮,无审批历史/审批人)。

### 4.6 管理层下达指令 → 坐席

- **现状**:`AlertHandle` 处置预警时只能填写意见,**没有"下达指令给坐席"的动作**。
- **缺口**:缺"指令"模型、坐席端的"指令中心"(`AgentDesk`/`TicketsTodo` 顶部 banner 没有"待办指令")。

---

## 5. 用户旅程 × 代码现状 详细对账

### 5.1 坐席工作流1:来电受理→建单→关单(最高频)

| 旅程节点 | 是否实现 | 备注 |
| --- | --- | --- |
| 系统自动弹屏客户画像 | ✅ | 接通跳转 `CustomerProfile?call=1` |
| 风险标签+预警提示 | ✅ | `alertLevel` 计算属性 |
| 通话中创建工单(三维打标) | 🟡 | `TicketCreate` 存在但**通话中 modal 入口未串**;之前接通会同时弹 modal + drawer,现在改为跳转客户详情,需确认 `TicketCreate` 仍可由客户详情页触发 |
| 查重提示 | ❌ | PRD 提到"重复工单检测",`TicketCreate` 未实现 |
| 通话结束→工单处理 | ✅ | `TicketDetail` |
| 服务总结模板(诉求分类/满意度自评等) | 🟡 | `TicketDetail` 含"关单"按钮,模板化字段未细化 |
| 关单归档不可回退 | 🟡 | 演示层面成立,后端校验缺失 |

### 5.2 坐席工作流2:业务操作发起→审批→生效→到期

- ❌ 坐席侧缺"发起申请"入口(旅程要求 1 次点击可达,目前需要切到支撑岗页才能看到申请,不符合旅程)。
- ❌ 缺申请与审批双向关联(申请工单与审批流 mock)。
- ❌ 缺到期前 1 天/3 天提醒 banner(纯前端无法做真实定时,但需要 mock 状态字段)。

### 5.3 坐席工作流3:监管转诉建单

- ✅ `RegImport.vue` 实现 Excel 上传+解析+失败补录区。
- ❌ 未实现"自动匹配客户信息+自动打三维标签+自动分单"的真实逻辑(目前是 mock 显示)。

### 5.4 支撑岗工作流1:停催停扣联动

- ✅ `StopCollection.vue` 页面化呈现。
- ❌ 缺"同步勾选停扣"的展开交互细节。
- 🟡 "到期自动恢复"为静态 mock,无定时器驱动状态切换。

### 5.5 支撑岗工作流3:转诉管理

- ✅ 提交平台、状态同步、超时催办均以列表形式 mock。
- 🟡 平台状态回写靠按钮模拟,无时间线联动。

### 5.6 审查工作流1:审查全流程

- ✅ 立项/任务填写/审查/归档主链路通。
- ❌ 归档未触发知识库同步(无 store dispatch)。
- ❌ 归档未触发投诉管控目标更新(无 mock 字段)。

### 5.7 审查工作流2:审查标准维护

- ✅ `Standards.vue` CRUD。
- 🟡 缺"版本管理"与"停用"软删除。

### 5.8 管理层工作流1:预警处置

- ✅ 列表+处置抽屉(确认/升级/忽略)。
- ❌ 缺"下达指令给坐席"的写动作。
- ❌ 缺"工单关单→预警自动标记已验证"的反向联动(目前是单向手动)。

### 5.9 管理层工作流2:规则配置

- ✅ 一站式页面,但四个规则集中在 Tab 切换。
- ❌ 缺"规则试算"(对历史数据回放校验)。
- ❌ 缺"发布→生效→坐席端可见"的端到端链路。

### 5.10 管理层工作流3:溯源整改

- ❌ 整条工作流缺失。

### 5.11 管理层工作流4:运营管理(排班/绩效)

- ❌ 缺失。

### 5.12 消费者工作流

- ✅ 进度查询 + 满意度评价。
- ❌ 催办(限频)、补充材料上传、低分回访工单自动创建。

---

## 6. 功能缺口清单(按优先级)

### P0(主流程闭环,影响核心体验)

| # | 缺口 | 影响范围 | 建议工作量 |
| --- | --- | --- | --- |
| P0-1 | **坐席侧"发起业务申请"入口缺失** | 旅程工作流2 全链路断开 | 中:复用支撑岗页面 + 在 `AgentDesk`/`CustomerProfile` 加按钮 |
| P0-2 | **审查归档 → 知识库同步** 无链路 | 三道防线事前→事中断裂 | 中:新增 `useReviewStore`、在 `ReviewExecute.vue` 归档时 dispatch `knowledgeStore.upsert()` |
| P0-3 | **预警处置 → 指令下达** 缺失 | 管理层→坐席链路断开 | 中:新增指令模型,`AgentDesk`/`TicketsTodo` 顶部加 banner |
| P0-4 | **坐席接通跳转后,创建工单 modal 未保留** | 来电受理工作流(接通后能否直接建单) | 小:在 `CustomerProfile` 通话中 banner 加"快速建单"按钮 |

### P1(高频但非阻断)

| # | 缺口 | 建议工作量 |
| --- | --- | --- |
| P1-1 | 工单创建"重复工单检测"提示 | 小 |
| P1-2 | 通话结束"服务总结模板"字段化(诉求分类/满意度自评/处理结果) | 中 |
| P1-3 | 监管转诉建单"自动匹配+自动打标+自动分单"mock 实现 | 小 |
| P1-4 | 消费者端"补充材料上传"表单 | 小 |
| P1-5 | 消费者端"催办(7 天 1 次)"按钮 | 小 |
| P1-6 | 低分满意度 → 自动创建回访工单 | 中 |
| P1-7 | 停催/停扣/协商"到期自动恢复"定时器 | 小 |
| P1-8 | 标签联动规则真实生效(规则→弹屏) | 中 |

### P2(治理闭环与运营)

| # | 缺口 | 建议工作量 |
| --- | --- | --- |
| P2-1 | 溯源整改模块(`/manage/trace` + `/manage/rectify`) | 大 |
| P2-2 | 整改 → 审查标准更新回写 | 中 |
| P2-3 | 质检管理模块 | 大 |
| P2-4 | 运营管理(排班+绩效) | 大 |
| P2-5 | 审查追溯独立页面 | 小 |
| P2-6 | 贷中清退独立页面 | 小 |
| P2-7 | 票据合同开具模块 | 大 |
| P2-8 | 规则试算与发布流 | 中 |
| P2-9 | 审查标准版本管理 | 中 |

### P3(细节与体验)

- 顶部 Header "待办/预警/知识更新" 数字是硬编码 badge,应接入 store。
- `MainLayout` 中 `客户/电话/在线客服` 菜单项路径都是 `/agent/todo`,需为电话和在线会话建独立占位页。
- 角色切换器"个人设置"为占位。

---

## 7. 验证结论

- **主链路 70% 已通**:五大工作台 + 24 个页面、模拟来电/接通/挂断/跳转客户详情、坐席/业务/审查/管理/消费者基本可点击。
- **协作链路 30%**:三道防线、跨角色通知/指令、整改回写、规则联动几乎全部为静态占位。
- **优先补齐 4 项 P0 后,可形成"坐席受理 → 业务执行 → 管理层预警 → 指令 → 关单"的端到端 demo 主轴。**
- **治理与运营层(P2)需要更大投入,建议下一版本再排期。**

---

## 8. 增量更新(2026-07-17 · P0 补齐后)

### 8.1 本轮新增

| 资产 | 路径 | 作用 |
| --- | --- | --- |
| `useWorkflowStore` | [src/stores/workflow.ts](file:///Users/mac/Documents/trae_projects/Customer_service/src/stores/workflow.ts) | 6 个工作流模板(停催/协商/转诉/征信异议/审查归档/预警指令);节点推进 + 副作用 + localStorage 持久化 |
| `useKnowledgeStore` | [src/stores/knowledge.ts](file:///Users/mac/Documents/trae_projects/Customer_service/src/stores/knowledge.ts) | 知识库 CRUD + 监听 `cp-workflow-kb-archive` 自动归档 |
| `StartWorkflowModal` | [src/components/StartWorkflowModal.vue](file:///Users/mac/Documents/trae_projects/Customer_service/src/components/StartWorkflowModal.vue) | 通用发起弹窗 |
| `WorkflowTodosCard` | [src/components/WorkflowTodosCard.vue](file:///Users/mac/Documents/trae_projects/Customer_service/src/components/WorkflowTodosCard.vue) | 通用待办卡片,坐席/支撑岗/管理层通用 |
| `WorkflowConfig` 业务工作流 Tab | [WorkflowConfig.vue](file:///Users/mac/Documents/trae_projects/Customer_service/src/pages/ManageWorkbench/WorkflowConfig.vue) | 节点级配置(角色/SLA/自动推进/启用) |
| `WorkflowMonitor` 实例卡 | [WorkflowMonitor.vue](file:///Users/mac/Documents/trae_projects/Customer_service/src/pages/ManageWorkbench/WorkflowMonitor.vue) | 业务工作流实例流转列表 + 节点轨迹 |

### 8.2 三道防线现状

| 链路 | 状态 | 备注 |
| --- | --- | --- |
| 审查归档 → 知识库(待审核) → 审核生效 → 通知坐席 | ✅ 通 | `ReviewExecute → wf.start(review_archive) → 副作用 archive_to_kb → KnowledgeManage 审核 → wf.approve → 副作用 notify_seat` |
| 预警 → 管理层处置 → 指令下达 → 坐席执行 → 预警验证 | ✅ 通 | `AlertHandle → wf.start(alert_directive) → 坐席在 AgentDesk 工作流待办中执行 → 副作用 mark_alert_verified` |
| 坐席 → 支撑岗(停催/协商/转诉/征信异议) | ✅ 通 | `AgentDesk/CustomerProfile 发起 → wf 实例落到支撑岗待办 → 通过后副作用回写 relatedTicketStatus` |
| 整改 → 审查标准更新 | ❌ 未实现 | 整改模块整体缺失 |
| 整改 → 知识库更新 | 🟡 部分 | `useKnowledgeStore.upsertFromReview` 仅接审查归档,整改→知识库未接 |

### 8.3 P0 补齐后剩余缺口(按优先级)

#### P1 · 短期补齐(影响演示流畅度)

| # | 缺口 | 证据 |
| --- | --- | --- |
| P1-1 | **通知中心缺失**:`notify_seat` 副作用只 dispatch CustomEvent,**没有任何组件订阅并展示** | `workflow.ts:415` dispatchEvent 但无 listener(只有 `kb-archive` 被知识库订阅) |
| P1-2 | **`mark_alert_verified` 副作用无消费者** | `workflow.ts:425` dispatch 后 `alerts` 数组状态没回写;管理层 AlertHandle 看到的还是 `alert_handle` 状态 |
| P1-3 | **支撑岗入口未挂工作流待办**:`BusinessDesk.vue` 没接 `WorkflowTodosCard`,工作流实例对支撑岗不可见 | grep `useWorkflowStore` 在 `BusinessWorkbench` 下为 0 命中 |
| P1-4 | **管理层入口未挂工作流待办**:`Dashboard.vue` / `AlertHandle.vue` 都没接 `WorkflowTodosCard` | grep `WorkflowTodosCard` 在 `ManageWorkbench` 下为 0 命中 |
| P1-5 | **审查人员入口未挂工作流待办**:`PendingReview.vue` / `CreateReview.vue` 没接 `WorkflowTodosCard` | grep `WorkflowTodosCard` 在 `ReviewWorkbench` 下为 0 命中 |
| P1-6 | **工单创建页未接工作流**:`TicketCreate.vue` 的"重复工单检测"和三维打标仍是 mock,工作流的 `apply` 节点没有反向生成工单 | `TicketCreate` 自身走独立流程,与 `useWorkflowStore` 无关联 |
| P1-7 | **业务工作流与现有业务页面(`StopCollection`/`Negotiate` 等)并存**:支撑岗既能在原页面操作,也能在工作流卡片操作,**两边数据不互通** | mock `StopCollection.vue` 仍维护独立表单,与 `useWorkflowStore` 数据隔离 |
| P1-8 | **`sideEffect: 'negotiate_active'` 在 store 里没有落地动作**(只有 stop_collection_active 写入 `relatedTicketStatus`) | `workflow.ts:404` case 为空 |
| P1-9 | **`AgentDesk` 的"工作流待办"卡片没显示支撑岗/管理层可处理的工作流**(只显示 `agent` 待办) | 设计上是对的(按 role 过滤),但反过来意味着支撑岗桌面完全看不到这些实例 |
| P1-10 | **`startAt/expireAt` 字段缺失,无法计算 SLA 倒计时/超时升级** | `WorkflowInstance` 接口无时间字段 |

#### P2 · 中期(治理闭环)

| # | 缺口 | 备注 |
| --- | --- | --- |
| P2-1 | **溯源整改模块缺失**:`/manage/trace` `/manage/rectify` 页面无;无整改任务模型 | 旅程要求闭环 |
| P2-2 | **整改 → 审查标准更新回写**:`Standards` 没有来源 `rectify` 字段 | `WorkflowNode` 也无 `rectify_to_standards` 副作用 |
| P2-3 | **质检管理模块缺失**:旅程要求"质检 → 整改推送 → 复检确认" | |
| P2-4 | **运营管理缺失**:排班/绩效/坐席工作量统计 | `MainLayout` 菜单项指向 `/manage/workflow-monitor` 占位 |
| P2-5 | **审查追溯独立页**:`MainLayout` 菜单"审查追溯"指向 `/review/standards`,未独立 | |
| P2-6 | **贷中清退独立页**:`MainLayout` 业务菜单未列,工作流模板 `credit_objection` 名字也偏窄 | |
| P2-7 | **票据合同开具模块缺失**:旅程要求独立菜单项 | |
| P2-8 | **规则试算与发布流**:`RuleConfig` 仍是占位,无规则实例化、无试算 UI | |
| P2-9 | **标签联动规则真实生效**:`RuleConfig` 中标签规则是占位,`CustomerProfile` 的 `alertLevel` 仍是硬编码 | 旅程要求"规则可配置" |
| P2-10 | **坐席轮询/负载均衡分派策略**:`ManualCall` 是按钮直达,无队列/抢单/超时升级 | |

#### P3 · 细节与体验

| # | 缺口 | 备注 |
| --- | --- | --- |
| P3-1 | **顶部 Header 数字仍是硬编码**(待办 3、预警 dot、知识更新 2) | 应该读 `wf.agentTodos.length` 等 |
| P3-2 | **`MainLayout` 角色切换器 "个人设置" 是占位** | 无功能 |
| P3-3 | **`MainLayout` 菜单 `电话` `在线客服` 都指向 `/agent/todo`** | 应有独立占位页 |
| P3-4 | **`StartWorkflowModal` 中"备注"字段写到了 `payload.remark`,但模板没声明此字段** | 当前可用,但模板改造后未声明字段会失效 |
| P3-5 | **重复工单检测未接**:发起业务申请时未先查 `wf.instances` 里同客户同类型未结实例 | 会重复申请 |
| P3-6 | **工作流超时未驱动状态**:SLA 小时已配置,但无定时器把超时实例变 `expired` | |
| P3-7 | **`RoleKey` 在 `user.ts` 与 `workflow.ts` 各自定义,无统一来源** | 类型重复,后续易脱节 |
| P3-8 | **工作流节点类型 `notify/auto/archive` 在审批 drawer 中误让用户填写意见**(模板里 agent role 才会到这一步) | drawer 没按节点 kind 切换 UI |
| P3-9 | **`WorkflowMonitor` KPI 仍按 mock 工单计算,工作流实例数未计入** | |
| P3-10 | **审查归档的"投诉管控目标"同步承诺无落地** | 旅程承诺,代码未实现 |

### 8.4 一句话总结

- **核心闭环已跑通**(坐席 → 业务执行 → 管理层指令 → 关单,以及 审查 → 知识库 → 坐席)。
- **主要缺口是"通知回不来"和"支撑岗/管理层桌面看不到工作流"**,这两点不补齐,跨角色联动的演示效果会断在视觉层。
- **整改/质检/运营/规则试算**仍是空白,需要单独排期。

---

## 9. 附录:代码参考

- [src/router.ts](file:///Users/mac/Documents/trae_projects/Customer_service/src/router.ts) — 全量路由
- [src/layout/MainLayout.vue](file:///Users/mac/Documents/trae_projects/Customer_service/src/layout/MainLayout.vue#L136-L225) — 角色菜单生成
- [src/stores/user.ts](file:///Users/mac/Documents/trae_projects/Customer_service/src/stores/user.ts) — 用户角色 + localStorage 持久化
- [src/stores/workbench.ts](file:///Users/mac/Documents/trae_projects/Customer_service/src/stores/workbench.ts) — 工作台任务流 + 通话状态
- [src/mock/data.ts](file:///Users/mac/Documents/trae_projects/Customer_service/src/mock/data.ts) — Mock 模型定义
- [src/pages/AgentWorkbench/AgentDesk.vue](file:///Users/mac/Documents/trae_projects/Customer_service/src/pages/AgentWorkbench/AgentDesk.vue) — 接通跳转 + 挂断修复
- [src/pages/AgentWorkbench/CustomerProfile.vue](file:///Users/mac/Documents/trae_projects/Customer_service/src/pages/AgentWorkbench/CustomerProfile.vue) — 通话中 banner