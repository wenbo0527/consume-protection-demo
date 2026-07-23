// 工单状态机 V2 模型
// ----------------------------------------------------------------------------
// V1 (在 stores/workflow.ts) 是字符串硬编码:V1 走"硬编码 6 态 + trigger 文本"路径
// V2 (本文件) 走"结构化数据 + Guard 评估 + Hooks 引擎"路径
// V1/V2 双轨运行:工单带 machineVersion 字段,V1 工单继续走 V1,V2 工单走 V2
// ----------------------------------------------------------------------------

import type { RoleKey } from './user'

export const MACHINE_SCHEMA_VERSION = 2

// ============ 1. 分类与角色 ============

export type TicketCategory = 'complaint' | 'regulator' | 'external' | 'business' | 'callback'
export type RegulatorSubType = '12378' | '12345' | 'xinfang' | 'court'

export type Role = RoleKey | 'system'

// 分配策略——取代 V1 的 handlerType 字符串
export type AssignmentStrategy =
  | { kind: 'role'; role: Role }
  | { kind: 'user'; userIds: string[] }
  | { kind: 'group'; groupId: string }
  | { kind: 'rule'; ruleCode: string }
  | { kind: 'system' }

// ============ 2. 事件契约 ============

export type EventType =
  | 'agent_accept' // 坐席主动接收
  | 'agent_transfer' // 转办
  | 'agent_escalate' // 升级
  | 'agent_close' // 坐席确认关单
  | 'customer_signed' // 客户达成一致
  | 'regulator_archive' // 监管件直接归档
  | 'approval_rejected' // 审批驳回
  | 'satisfaction_low' // 客户不满意
  | 'plan_breached' // 方案违约
  | 'auto_advance' // 系统自动推进
  | 'manual' // 手动指定目标状态
  | 'timeout' // 超时
  | 'custom'

export interface StateEvent {
  type: EventType | string
  payload?: Record<string, unknown>
  source: 'user' | 'system' | 'external' | 'timeout'
  occurredAt: string
  /** 用于幂等去重(同一 eventId 重放返回原结果) */
  eventId?: string
}

// ============ 3. Guard 守卫条件 ============
// 取代 V1 的 trigger 字符串
// expr-eval 表达式:可访问 ticket.* / sla.* / ctx.user.*

export type Guard =
  | { kind: 'always' }
  | { kind: 'expr'; expr: string }
  | { kind: 'category'; in: TicketCategory[] }
  | { kind: 'regulator'; subTypes?: RegulatorSubType[] }
  | { kind: 'sla'; remaining?: { lt?: string; gt?: string } }
  | { kind: 'and'; items: Guard[] }
  | { kind: 'or'; items: Guard[] }
  | { kind: 'not'; item: Guard }

// ============ 4. SLA ============

export interface SlaRule {
  /** ISO 8601 duration: 'PT4H' / 'P7D' */
  duration: string
  /** 是否仅工作日(监管件关键) */
  businessHoursOnly: boolean
  /** 到期前多久预警 'PT1H' */
  warnBefore: string
  /** 业务日历: 'cn-banking' / 'cn-gov' */
  businessCalendar?: string
}

// ============ 5. 超时动作 ============

export type TimeoutAction =
  | { kind: 'remind'; target: 'assignee' | 'manager' | 'role'; channel: 'sys' | 'sms' | 'phone' }
  | { kind: 'escalate'; toState: string; level: 1 | 2 | 3 }
  | { kind: 'alert'; alertTemplate: string }
  | { kind: 'auto-advance'; transitionId: string }
  | { kind: 'noop' }

// ============ 6. 钩子(数据抓取 / 功能接入) ============
// 这是用户问的"数据抓取"和"功能接入"的标准答案

export type StateHook =
  // 6.1 数据抓取
  | { kind: 'fetch'; fetcher: string; into: string; onError: 'continue' | 'fail' | 'warn' }
  // 6.2 功能调用(有副作用)
  | {
      kind: 'invoke'
      functionCode: string
      input?: Record<string, string>
      await: boolean
      onError: 'continue' | 'fail' | 'warn'
    }
  // 6.3 通知
  | {
      kind: 'notify'
      template: string
      channel: 'sys' | 'sms' | 'email' | 'wechat'
      target: string
    }
  // 6.4 业务工作流触发(打通状态机 ↔ 业务工作流)
  | { kind: 'start-workflow'; workflowKind: string; payload?: Record<string, string> }
  // 6.5 工单字段回写
  | { kind: 'set-field'; path: string; value: string | number | boolean | { expr: string } }
  // 6.6 Webhook(外部系统)
  | {
      kind: 'webhook'
      url: string
      method: 'POST' | 'PUT'
      headers?: Record<string, string>
      body?: string
    }

// ============ 7. 状态机定义 ============

export interface FormField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'checkbox'
  required?: boolean
  options?: string[]
}

export interface StateNode {
  id: string
  code: string
  name: string
  category: 'start' | 'intermediate' | 'end'
  assignment: AssignmentStrategy
  sla?: SlaRule
  onEnter?: StateHook[]
  onExit?: StateHook[]
  formSchema?: FormField[]
  color?: string
  position?: { x: number; y: number }
}

export interface StateTransition {
  id: string
  from: string // 源状态 id(支持 'ANY' 通配)
  to: string // 目标状态 id
  event: string
  guard?: Guard
  priority: number
  effects?: StateHook[]
  label?: string
  /** 适用工单分类;为空表示全部 */
  categories?: TicketCategory[]
}

export interface StateMachineOverride {
  stateOverrides?: Record<
    string,
    {
      sla?: SlaRule
      assignment?: AssignmentStrategy
      onEnter?: StateHook[]
    }
  >
  transitionOverrides?: Record<string, { guard?: Guard }>
}

export interface StateMachine {
  id: string
  name: string
  version: string // 'v2.3.0'
  status: 'draft' | 'published' | 'archived'
  states: StateNode[]
  transitions: StateTransition[]
  /** 适用范围 */
  appliesTo: TicketCategory[]
  /** 多套机器时的优先级 */
  priority: number
  /** 监管件覆盖层(取代 V1 单例 RegulatorPolicy) */
  regulatorOverrides?: Partial<Record<RegulatorSubType, StateMachineOverride>>
  publishedAt?: string
  publishedBy?: string
  changeNote?: string
}

// ============ 8. 工单运行时形态(供 runner 使用) ============

export interface Ticket {
  id: string
  category: TicketCategory
  regulatorSubType?: RegulatorSubType
  /** 任意扩展字段,供 fetcher 写入/Guard 引用 */
  fields: Record<string, unknown>
  currentState: string
  machineId: string
  machineVersion: string
  /** 实例创建时间 ISO */
  createdAt: string
  /** 当前状态进入时间 */
  currentStateEnteredAt: string
  history: TransitionRecord[]
}

export interface TransitionRecord {
  from: string
  to: string
  event: StateEvent
  hookResults: HookResult[]
  occurredAt: string
}

export interface HookResult {
  hook: StateHook
  status: 'ok' | 'warn' | 'fail' | 'skipped'
  message?: string
  data?: unknown
  durationMs: number
}

// ============ 9. 引擎返回值 ============

export interface DispatchResult {
  transitioned: boolean
  fromState?: string
  toState?: string
  matchedTransitionId?: string
  hookResults: HookResult[]
  warnings: string[]
  errors: string[]
  /** 若未发生转换,说明哪个 Guard 拒绝 */
  rejectedBy?: Array<{ transitionId: string; reason: string }>
}

// ============ 10. 持久化包装 ============

export interface PersistedMachineState {
  schemaVersion: number
  machines: StateMachine[]
  /** V1 数据继续保留(老工单仍走 V1) */
  v1: {
    ticketStates: unknown[]
    transitionRules: unknown[]
    regulatorPolicy: unknown
  }
}
