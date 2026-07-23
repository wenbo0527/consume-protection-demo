// 工作流 store:
// 1. 工作流模板(由管理层在 WorkflowConfig 配置)
// 2. 工作流实例(每次"发起业务申请"产生一个实例)
// 3. 节点推进:实例上的节点按顺序流转;每节点可被特定角色/操作人推进
// 4. 副作用:节点完成时调用 onComplete(如停催通过→催收系统停止触达;协商通过→自动触发停催;审查归档→写知识库)

import { defineStore } from 'pinia'
import { generateId } from '@/utils/format'
import { useAlertStore } from './alert'
import { EVT } from '@/constants/events'

export type WorkflowKind =
  | 'stop_collection' // 停催停扣
  | 'negotiate' // 协商还款
  | 'transfer_mediate' // 转诉调解
  | 'credit_objection' // 征信异议
  | 'review_archive' // 审查归档→知识库
  | 'alert_directive' // 管理层下达指令(预警→坐席)
  | 'callback' // 未接/拒绝回访(v3 新增:呼入打标自动生成)

export type NodeKind = 'apply' | 'approve' | 'execute' | 'notify' | 'auto' | 'archive' | 'start' | 'end'

import { RoleKey } from './user'

// 兼容旧代码
export type { RoleKey }

export interface WorkflowNode {
  /** 节点编号(模板内唯一) */
  code: string
  name: string
  kind: NodeKind
  /** 该节点由哪个角色处置 */
  handlerRole: RoleKey | 'system'
  /** SLA(小时) */
  slaHours: number
  /** 完成后是否自动触发下一节点 */
  autoNext: boolean
  /** 完成时触发的副作用 key(在副作用表中查找) */
  sideEffect?: 'stop_collection_active' | 'negotiate_active' | 'archive_to_kb' | 'notify_seat' | 'mark_alert_verified'
  /** 可选:节点上的字段说明(表单渲染用) */
  fields?: { key: string; label: string; type: 'text' | 'select' | 'date'; options?: string[] }[]
}

export interface WorkflowTemplate {
  kind: WorkflowKind
  name: string
  desc: string
  nodes: WorkflowNode[]
  /** 是否启用(管理层可在 WorkflowConfig 关闭) */
  enabled: boolean
  /** 适用场景(可空,空表示全部) */
  applicableScenes?: string[]
}

export type InstanceStatus = 'running' | 'approved' | 'rejected' | 'expired' | 'finished'

// ============ 工单状态机(独立于业务工作流模板) ============
// 与 WorkflowTemplate 平行:状态机描述"一张工单从建单到关单的阶段",由管理层在 ticket-state 配置页维护。
export type TicketStateCode =
  | 'pending' // 待分派
  | 'todo' // 待接收
  | 'processing' // 处理中
  | 'transfer' // 待流转
  | 'closing' // 待关单
  | 'closed' // 已关单(终态)

export type HandlerType = 'rule' | 'assignee' | 'system'
export type TimeoutAction = '自动催办' | '升级上级' | '预警通知' | '无动作'

export interface TicketState {
  code: TicketStateCode
  name: string
  handlerType: HandlerType
  /** 超时规则(可读字符串,如 "8h" / "监管件7d / 普通件15d") */
  timeout: string
  /** 超时后的系统动作 */
  timeoutAction: TimeoutAction
  isStart: boolean
  isEnd: boolean
}

export interface TicketTransitionRule {
  /** 规则名 */
  name: string
  from: TicketStateCode
  to: TicketStateCode
  trigger: string
  /** 适用工单范围 */
  scope: string[]
  enabled: boolean
}

export interface RegulatorPolicy {
  /** 处理总时限(自然语言,如 "7 个工作日") */
  totalSla: string
  /** 到期前预警时间 */
  warnBefore: string
  /** 超时后动作 */
  overdueAction: '仅预警通知' | '预警通知+升级' | '升级至消保管理层'
  /** 处理优先级 */
  priority: '特急' | '紧急' | '普通'
  /** 归档要求 */
  archiveRequires: { summary: boolean; evidence: boolean; review: boolean }
  /** 处理完成后自动报送监管平台 */
  autoReport: boolean
}

export interface NodeExecution {
  nodeCode: string
  status: 'pending' | 'running' | 'approved' | 'rejected' | 'skipped' | 'done'
  /** 操作人/角色 */
  operator?: string
  /** 操作时间 */
  operatedAt?: string
  /** 审批意见 */
  comment?: string
  /** 节点表单数据 */
  payload?: Record<string, any>
}

export interface WorkflowInstance {
  id: string
  kind: WorkflowKind
  /** 业务关联:客户/工单/审查项目/预警 */
  customerId?: string
  customerName?: string
  ticketId?: string
  reviewId?: string
  alertId?: string
  /** 发起人 */
  initiator: string
  initiatorRole: RoleKey
  createdAt: string
  /** 当前节点进入时间(用于 SLA 倒计时) */
  currentNodeStartedAt: string
  /** 整个工作流实例的到期时间(可空,某些工作流无到期) */
  expireAt?: string
  /** 当前节点 code */
  currentNode: string
  status: InstanceStatus
  /** 节点执行历史 */
  executions: NodeExecution[]
  /** 关联工单回写 */
  relatedTicketStatus?: string
}

const STORAGE_KEY = 'cp_workflow_data'

// ============ 工单状态机默认数据 ============

const DEFAULT_TICKET_STATES: TicketState[] = [
  {
    code: 'pending',
    name: '待分派',
    handlerType: 'rule',
    timeout: '24h',
    timeoutAction: '自动催办',
    isStart: true,
    isEnd: false
  },
  {
    code: 'todo',
    name: '待接收',
    handlerType: 'assignee',
    timeout: '8h',
    timeoutAction: '自动催办',
    isStart: false,
    isEnd: false
  },
  {
    code: 'processing',
    name: '处理中',
    handlerType: 'assignee',
    timeout: '监管件7d / 普通件15d',
    timeoutAction: '升级上级',
    isStart: false,
    isEnd: false
  },
  {
    code: 'transfer',
    name: '待流转',
    handlerType: 'assignee',
    timeout: '4h',
    timeoutAction: '预警通知',
    isStart: false,
    isEnd: false
  },
  {
    code: 'closing',
    name: '待关单',
    handlerType: 'assignee',
    timeout: '72h',
    timeoutAction: '自动催办',
    isStart: false,
    isEnd: false
  },
  {
    code: 'closed',
    name: '已关单',
    handlerType: 'system',
    timeout: '-',
    timeoutAction: '无动作',
    isStart: false,
    isEnd: true
  }
]

const DEFAULT_TRANSITION_RULES: TicketTransitionRule[] = [
  { name: '坐席接收规则', from: 'todo', to: 'processing', trigger: '坐席点击接收', scope: ['全部'], enabled: true },
  { name: '转办规则', from: 'processing', to: 'transfer', trigger: '坐席选择转办', scope: ['投诉', '外部转办'], enabled: true },
  { name: '升级规则', from: 'processing', to: 'transfer', trigger: '坐席选择升级', scope: ['投诉', '监管件'], enabled: true },
  { name: '关单规则', from: 'closing', to: 'closed', trigger: '坐席确认关单', scope: ['全部'], enabled: true },
  { name: '监管件归档', from: 'processing', to: 'closed', trigger: '监管件直接归档', scope: ['监管件'], enabled: true },
  { name: '自动催办', from: 'todo', to: 'todo', trigger: '8h 超时', scope: ['全部'], enabled: true },
  { name: '超时升级', from: 'processing', to: 'transfer', trigger: '监管件 7d / 普通件 15d 超时', scope: ['全部'], enabled: true },
  { name: '审批驳回', from: 'transfer', to: 'processing', trigger: 'OA 审批驳回', scope: ['业务执行类'], enabled: true },
  { name: '客户不满意升级', from: 'closed', to: 'processing', trigger: '≤2 星评价', scope: ['投诉'], enabled: true },
  { name: '方案违约恢复', from: 'processing', to: 'processing', trigger: '协商方案违约,自动恢复催收', scope: ['业务执行类'], enabled: true },
  { name: '到期自动恢复', from: 'processing', to: 'closed', trigger: '停催到期前 1 天提醒', scope: ['业务执行类'], enabled: true },
  { name: '知识归档触发', from: 'closed', to: 'closed', trigger: '审查归档自动同步知识库', scope: ['审查立项'], enabled: true }
]

const DEFAULT_REGULATOR_POLICY: RegulatorPolicy = {
  totalSla: '7 个工作日',
  warnBefore: '1 天',
  overdueAction: '预警通知+升级',
  priority: '特急',
  archiveRequires: { summary: true, evidence: true, review: false },
  autoReport: true
}

// ============ 副作用实现 ============
// 由节点 onComplete 触发,这里用 store action 实现
function log(level: 'log' | 'warn' | 'error', tag: string, msg: string, extra?: unknown) {
  const line = `[cp-workflow][${tag}] ${msg}`
  if (extra !== undefined) {
    // eslint-disable-next-line no-console
    console[level](line, extra)
  } else {
    // eslint-disable-next-line no-console
    console[level](line)
  }
}

// ============ 默认工作流模板 ============

const DEFAULT_TEMPLATES: WorkflowTemplate[] = [
  {
    kind: 'stop_collection',
    name: '停催停扣',
    desc: '坐席发起 → 支撑岗审批 → 通过后自动生效催收/扣款系统 → 到期前 1 天提醒',
    enabled: true,
    nodes: [
      {
        code: 'apply',
        name: '坐席发起申请',
        kind: 'apply',
        handlerRole: 'agent',
        slaHours: 1,
        autoNext: true,
        fields: [
          { key: 'reason', label: '停催原因', type: 'text' },
          { key: 'period', label: '期限', type: 'select', options: ['7 天', '15 天', '30 天', '协商期'] },
          { key: 'syncStopDeduct', label: '同步停扣', type: 'select', options: ['是', '否'] }
        ]
      },
      {
        code: 'approve',
        name: '支撑岗审批',
        kind: 'approve',
        handlerRole: 'business',
        slaHours: 4,
        autoNext: false,
        sideEffect: 'stop_collection_active'
      },
      {
        code: 'effective',
        name: '催收/扣款系统生效',
        kind: 'auto',
        handlerRole: 'system',
        slaHours: 0,
        autoNext: true
      },
      {
        code: 'notify',
        name: '通知原坐席',
        kind: 'notify',
        handlerRole: 'system',
        slaHours: 0,
        autoNext: true,
        sideEffect: 'notify_seat'
      },
      { code: 'archive', name: '归档', kind: 'archive', handlerRole: 'system', slaHours: 0, autoNext: false }
    ]
  },
  {
    kind: 'negotiate',
    name: '协商还款',
    desc: '坐席/支撑岗发起 → 试算 → 审批 → 通过自动触发停催停扣 → 到期前 3 天提醒',
    enabled: true,
    nodes: [
      {
        code: 'apply',
        name: '坐席/支撑岗发起',
        kind: 'apply',
        handlerRole: 'agent',
        slaHours: 1,
        autoNext: true,
        fields: [
          { key: 'loanId', label: '借据编号', type: 'text' },
          { key: 'plan', label: '还款方案', type: 'text' }
        ]
      },
      { code: 'trial_calc', name: '系统试算', kind: 'auto', handlerRole: 'system', slaHours: 0, autoNext: true },
      {
        code: 'approve',
        name: '支撑岗审批',
        kind: 'approve',
        handlerRole: 'business',
        slaHours: 4,
        autoNext: false,
        sideEffect: 'negotiate_active'
      },
      {
        code: 'effective',
        name: '自动触发停催停扣',
        kind: 'auto',
        handlerRole: 'system',
        slaHours: 0,
        autoNext: true,
        sideEffect: 'stop_collection_active'
      },
      { code: 'archive', name: '归档', kind: 'archive', handlerRole: 'system', slaHours: 0, autoNext: false }
    ]
  },
  {
    kind: 'transfer_mediate',
    name: '转诉调解',
    desc: '坐席/支撑岗提交 → 外部平台对接 → 状态同步 → 超时催办 → 结案',
    enabled: true,
    nodes: [
      {
        code: 'apply',
        name: '坐席/支撑岗提交',
        kind: 'apply',
        handlerRole: 'agent',
        slaHours: 2,
        autoNext: true,
        fields: [
          {
            key: 'platform',
            label: '调解平台',
            type: 'select',
            options: ['金融调解委员会', '仲裁机构', '法院诉前调解']
          },
          { key: 'caseNo', label: '案件编号', type: 'text' }
        ]
      },
      { code: 'submit', name: '提交外部平台', kind: 'execute', handlerRole: 'business', slaHours: 4, autoNext: true },
      { code: 'sync', name: '平台状态同步', kind: 'auto', handlerRole: 'system', slaHours: 24, autoNext: false },
      { code: 'overdue_remind', name: '超时催办', kind: 'notify', handlerRole: 'system', slaHours: 0, autoNext: true },
      {
        code: 'close',
        name: '结案关联工单',
        kind: 'archive',
        handlerRole: 'business',
        slaHours: 0,
        autoNext: false,
        sideEffect: 'notify_seat'
      }
    ]
  },
  {
    kind: 'credit_objection',
    name: '征信异议',
    desc: '坐席接收异议 → 核实 → 提交征信系统 → 跟踪结果 → 不满意升级',
    enabled: true,
    nodes: [
      {
        code: 'apply',
        name: '坐席登记异议',
        kind: 'apply',
        handlerRole: 'agent',
        slaHours: 1,
        autoNext: true,
        fields: [{ key: 'dispute', label: '异议内容', type: 'text' }]
      },
      { code: 'verify', name: '支撑岗核实', kind: 'execute', handlerRole: 'business', slaHours: 8, autoNext: true },
      { code: 'submit', name: '提交征信系统', kind: 'execute', handlerRole: 'business', slaHours: 4, autoNext: true },
      { code: 'track', name: '跟踪处理结果', kind: 'auto', handlerRole: 'system', slaHours: 72, autoNext: false },
      { code: 'archive', name: '归档', kind: 'archive', handlerRole: 'business', slaHours: 0, autoNext: false }
    ]
  },
  {
    kind: 'review_archive',
    name: '审查归档→知识库',
    desc: '审查人员归档 → 自动同步知识库(待审核) → 知识管理员审核 → 生效 → 通知坐席',
    enabled: true,
    nodes: [
      {
        code: 'archive',
        name: '审查人员归档',
        kind: 'archive',
        handlerRole: 'review',
        slaHours: 1,
        autoNext: true,
        sideEffect: 'archive_to_kb'
      },
      {
        code: 'kb_review',
        name: '知识管理员审核',
        kind: 'approve',
        handlerRole: 'manage',
        slaHours: 8,
        autoNext: true
      },
      {
        code: 'notify',
        name: '通知坐席(知识更新)',
        kind: 'notify',
        handlerRole: 'system',
        slaHours: 0,
        autoNext: true,
        sideEffect: 'notify_seat'
      }
    ]
  },
  {
    kind: 'alert_directive',
    name: '预警处置→指令下达',
    desc: '管理层确认预警 → 下达指令给坐席 → 坐席执行 → 关单后预警标记已验证',
    enabled: true,
    nodes: [
      {
        code: 'confirm',
        name: '管理层确认预警',
        kind: 'approve',
        handlerRole: 'manage',
        slaHours: 2,
        autoNext: true,
        fields: [
          { key: 'instruction', label: '指令内容', type: 'text' },
          { key: 'assignTo', label: '指派坐席', type: 'text' }
        ]
      },
      { code: 'execute', name: '坐席执行指令', kind: 'execute', handlerRole: 'agent', slaHours: 24, autoNext: false },
      {
        code: 'verify',
        name: '预警标记已验证',
        kind: 'archive',
        handlerRole: 'system',
        slaHours: 0,
        autoNext: false,
        sideEffect: 'mark_alert_verified'
      }
    ]
  },
  {
    kind: 'callback',
    name: '未接/拒绝回访',
    desc: 'v3 新增:呼入来电未接听/拒绝坐席后,自动生成回访工单,落到坐席外呼待办',
    enabled: true,
    nodes: [
      {
        code: 'pending',
        name: '待回访',
        kind: 'apply',
        handlerRole: 'agent',
        slaHours: 24,
        autoNext: false,
        fields: [
          { key: 'tagType', label: '打标类型', type: 'select', options: ['missed', 'rejected', 'timeout'] },
          { key: 'tagReason', label: '打标原因', type: 'text' },
          { key: 'fromCallId', label: '来源来电', type: 'text' }
        ]
      },
      {
        code: 'callback_done',
        name: '已回访',
        kind: 'archive',
        handlerRole: 'agent',
        slaHours: 0,
        autoNext: false
      }
    ]
  }
]

// ============ Mock 实例 ============

function nowStr() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function buildMockInstances(): WorkflowInstance[] {
  return [
    {
      id: 'WF-20260715-0001',
      kind: 'stop_collection',
      customerId: 'C003',
      customerName: '周志远',
      ticketId: 'GD-20260714-0008',
      initiator: '张敏',
      initiatorRole: 'agent',
      createdAt: '2026-07-15 14:20',
      currentNodeStartedAt: '2026-07-15 14:20',
      expireAt: '2026-07-15 18:20',
      currentNode: 'approve',
      status: 'running',
      executions: [
        {
          nodeCode: 'apply',
          status: 'done',
          operator: '张敏',
          operatedAt: '2026-07-15 14:20',
          comment: '客户扬言投诉,协商前停催',
          payload: { reason: '客户扬言投诉', period: '15 天', syncStopDeduct: '是' }
        }
      ]
    },
    {
      id: 'WF-20260712-0003',
      kind: 'negotiate',
      customerId: 'C001',
      customerName: '刘建国',
      ticketId: 'GD-20260712-0021',
      initiator: '李伟',
      initiatorRole: 'business',
      createdAt: '2026-07-12 09:30',
      currentNodeStartedAt: '2026-07-12 13:31',
      expireAt: '2026-07-12 17:30',
      currentNode: 'effective',
      status: 'approved',
      executions: [
        {
          nodeCode: 'apply',
          status: 'done',
          operator: '李伟',
          operatedAt: '2026-07-12 09:30',
          payload: { loanId: 'LN-2024-001', plan: '分 6 期,前低后高' }
        },
        { nodeCode: 'trial_calc', status: 'done', operator: '系统', operatedAt: '2026-07-12 09:31' },
        {
          nodeCode: 'approve',
          status: 'approved',
          operator: '陈强',
          operatedAt: '2026-07-12 10:15',
          comment: '同意,按方案执行'
        }
      ]
    },
    {
      id: 'WF-20260710-0002',
      kind: 'transfer_mediate',
      customerId: 'C005',
      customerName: '王秀英',
      initiator: '张敏',
      initiatorRole: 'agent',
      createdAt: '2026-07-10 11:00',
      currentNodeStartedAt: '2026-07-11 11:00',
      expireAt: '2026-07-12 11:00',
      currentNode: 'sync',
      status: 'running',
      executions: [
        {
          nodeCode: 'apply',
          status: 'done',
          operator: '张敏',
          operatedAt: '2026-07-10 11:00',
          payload: { platform: '金融调解委员会', caseNo: 'JD-202607-088' }
        },
        { nodeCode: 'submit', status: 'done', operator: '李伟', operatedAt: '2026-07-10 15:00', comment: '已提交平台' }
      ]
    }
  ]
}

// ============ Store ============

interface PersistedState {
  templates: WorkflowTemplate[]
  instances: WorkflowInstance[]
  ticketStates: TicketState[]
  transitionRules: TicketTransitionRule[]
  regulatorPolicy: RegulatorPolicy
}

function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const obj = JSON.parse(raw) as PersistedState
      if (Array.isArray(obj.templates) && Array.isArray(obj.instances)) {
        // 老数据兜底:状态机字段缺失时填默认值
        return {
          templates: obj.templates,
          instances: obj.instances,
          ticketStates: obj.ticketStates?.length ? obj.ticketStates : JSON.parse(JSON.stringify(DEFAULT_TICKET_STATES)),
          transitionRules: obj.transitionRules?.length
            ? obj.transitionRules
            : JSON.parse(JSON.stringify(DEFAULT_TRANSITION_RULES)),
          regulatorPolicy: obj.regulatorPolicy ?? JSON.parse(JSON.stringify(DEFAULT_REGULATOR_POLICY))
        }
      }
    }
  } catch (e) {
    log('warn', 'load', 'parse localStorage failed', e)
  }
  return {
    templates: JSON.parse(JSON.stringify(DEFAULT_TEMPLATES)),
    instances: buildMockInstances(),
    ticketStates: JSON.parse(JSON.stringify(DEFAULT_TICKET_STATES)),
    transitionRules: JSON.parse(JSON.stringify(DEFAULT_TRANSITION_RULES)),
    regulatorPolicy: JSON.parse(JSON.stringify(DEFAULT_REGULATOR_POLICY))
  }
}

function savePersisted(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    log('warn', 'save', 'write localStorage failed', e)
  }
}

export const useWorkflowStore = defineStore('workflow', {
  state: () => {
    const init = loadPersisted()
    return {
      templates: init.templates as WorkflowTemplate[],
      instances: init.instances as WorkflowInstance[],
      ticketStates: init.ticketStates as TicketState[],
      transitionRules: init.transitionRules as TicketTransitionRule[],
      regulatorPolicy: init.regulatorPolicy as RegulatorPolicy
    }
  },

  getters: {
    templateByKind: (s) => (kind: WorkflowKind) => s.templates.find((t) => t.kind === kind),
    instanceById: (s) => (id: string) => s.instances.find((i) => i.id === id),
    /**
     * OPT-FIX-2 / P3-8:角色守卫
     * 判断给定角色 + 操作者是否可以对指定实例的当前节点执行 approve/reject
     * - 当前节点 handlerRole 必须 === role
     * - instance 必须 running
     * - 当前节点 kind 必须 === approve(其他 kind 是 auto/notify/archive 不应让手动操作)
     */
    canApproveFor:
      (s) =>
      (instanceId: string, role: string): boolean => {
        const inst = s.instances.find((i) => i.id === instanceId)
        if (!inst) return false
        if (inst.status !== 'running') return false
        const tpl = s.templates.find((t) => t.kind === inst.kind)
        if (!tpl) return false
        const node = tpl.nodes.find((n) => n.code === inst.currentNode)
        if (!node) return false
        if (node.kind !== 'approve') return false
        return node.handlerRole === role
      },
    /** 坐席端待办(节点指派给 agent 且未完成) */
    agentTodos: (s) =>
      s.instances.filter((i) => {
        if (i.status !== 'running') return false
        const tpl = s.templates.find((t) => t.kind === i.kind)
        if (!tpl) return false
        const node = tpl.nodes.find((n) => n.code === i.currentNode)
        return node?.handlerRole === 'agent'
      }),
    /** 支撑岗待办 */
    businessTodos: (s) =>
      s.instances.filter((i) => {
        if (i.status !== 'running') return false
        const tpl = s.templates.find((t) => t.kind === i.kind)
        if (!tpl) return false
        const node = tpl.nodes.find((n) => n.code === i.currentNode)
        return node?.handlerRole === 'business'
      }),
    /** 管理层待办(指令接收 / 知识审核) */
    manageTodos: (s) =>
      s.instances.filter((i) => {
        if (i.status !== 'running') return false
        const tpl = s.templates.find((t) => t.kind === i.kind)
        if (!tpl) return false
        const node = tpl.nodes.find((n) => n.code === i.currentNode)
        return node?.handlerRole === 'manage' || node?.handlerRole === 'review'
      })
  },

  actions: {
    persist() {
      savePersisted({
        templates: this.templates,
        instances: this.instances,
        ticketStates: this.ticketStates,
        transitionRules: this.transitionRules,
        regulatorPolicy: this.regulatorPolicy
      })
    },

    /** 发起工作流 */
    start(input: {
      kind: WorkflowKind
      initiator: string
      initiatorRole: RoleKey
      customerId?: string
      customerName?: string
      ticketId?: string
      reviewId?: string
      alertId?: string
      payload?: Record<string, any>
    }): WorkflowInstance | null {
      const tpl = this.templates.find((t) => t.kind === input.kind)
      if (!tpl) {
        log('warn', 'start', `template not found: ${input.kind}`)
        return null
      }
      if (!tpl.enabled) {
        log('warn', 'start', `template disabled: ${input.kind}`)
        return null
      }
      const id = generateId('WF')
      const firstNode = tpl.nodes[0]
      const now = nowStr()
      // 实例总 SLA = 所有节点的 slaHours 之和(粗略估算;真实场景按节点切换逐段计时)
      const totalSlaHours = tpl.nodes.reduce((s, n) => s + (n.slaHours || 0), 0)
      const expireAt =
        totalSlaHours > 0
          ? new Date(Date.now() + totalSlaHours * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' ')
          : undefined
      const inst: WorkflowInstance = {
        id,
        kind: input.kind,
        customerId: input.customerId,
        customerName: input.customerName,
        ticketId: input.ticketId,
        reviewId: input.reviewId,
        alertId: input.alertId,
        initiator: input.initiator,
        initiatorRole: input.initiatorRole,
        createdAt: now,
        currentNodeStartedAt: now,
        expireAt,
        currentNode: firstNode.code,
        status: 'running',
        executions: [
          {
            nodeCode: firstNode.code,
            status:
              firstNode.kind === 'auto' || firstNode.kind === 'notify' || firstNode.kind === 'archive'
                ? 'done'
                : 'running',
            operator: input.initiator,
            operatedAt: now,
            payload: input.payload
          }
        ]
      }
      log('log', 'start', `instance created: ${id}`, { kind: input.kind, customer: input.customerName, expireAt })

      // 如果首节点是 auto/notify/archive,直接推进到下一节点
      if (firstNode.autoNext && tpl.nodes.length > 1) {
        this._advance(inst, tpl, '系统', 'auto')
      }
      this.instances.unshift(inst)
      this.persist()
      return inst
    },

    /** 内部:推进到下一节点 */
    _advance(inst: WorkflowInstance, tpl: WorkflowTemplate, operator: string, _reason: 'approve' | 'reject' | 'auto') {
      const idx = tpl.nodes.findIndex((n) => n.code === inst.currentNode)
      if (idx < 0) return
      const cur = tpl.nodes[idx]
      // 副作用
      if (cur.sideEffect) this._runSideEffect(cur.sideEffect, inst, tpl)

      // 找下一节点
      const next = tpl.nodes[idx + 1]
      if (!next) {
        inst.status = 'finished'
        log('log', 'advance', `instance finished: ${inst.id}`)
        return
      }
      const nextTime = nowStr()
      inst.currentNode = next.code
      inst.currentNodeStartedAt = nextTime
      inst.executions.push({
        nodeCode: next.code,
        status: next.kind === 'auto' || next.kind === 'notify' || next.kind === 'archive' ? 'done' : 'running',
        operator: next.kind === 'auto' ? '系统' : undefined,
        operatedAt: next.kind === 'auto' ? nextTime : undefined
      })
      // 如果新节点也是 auto/notify/archive 且 autoNext,递归推进
      if ((next.kind === 'auto' || next.kind === 'notify' || next.kind === 'archive') && next.autoNext) {
        this._advance(inst, tpl, '系统', 'auto')
      }
    },

    /** 内部:副作用 */
    _runSideEffect(effect: NonNullable<WorkflowNode['sideEffect']>, inst: WorkflowInstance, tpl: WorkflowTemplate) {
      log('log', 'sideEffect', `${effect} for ${inst.id}`)
      switch (effect) {
        case 'stop_collection_active':
          inst.relatedTicketStatus = '停催生效'
          // (此处原本发 'cp-system-stop-collection-active' 事件,但全网无监听 - 收紧)
          break
        case 'negotiate_active':
          inst.relatedTicketStatus = '协商方案生效'
          // (原本发 'cp-system-negotiate-active' + 'cp-system-stop-collection-active',全网无监听 - 收紧)
          break
        case 'archive_to_kb': {
          // 触发知识库新增:通过事件总线通知 knowledgeStore
          window.dispatchEvent(
            new CustomEvent(EVT.WORKFLOW_KB_ARCHIVE, {
              detail: { instanceId: inst.id, reviewId: inst.reviewId, kind: inst.kind }
            })
          )
          break
        }
        case 'notify_seat':
          window.dispatchEvent(
            new CustomEvent(EVT.WORKFLOW_NOTIFY_SEAT, {
              detail: { instanceId: inst.id, kind: inst.kind, ticketId: inst.ticketId }
            })
          )
          break
        case 'mark_alert_verified':
          // 直接调用 AlertStore(避免全局事件链 + Vue 响应式会自动更新 AlertHandle 等)
          if (inst.alertId) {
            try {
              useAlertStore().verifyByWorkflow(inst.alertId, inst.id)
            } catch (e) {
              log('warn', 'side-effect', 'alert.verifyByWorkflow failed', e)
            }
          }
          // 同时派发通知事件(NotificationCenter 仍需要)
          window.dispatchEvent(
            new CustomEvent(EVT.WORKFLOW_ALERT_VERIFIED, {
              detail: { alertId: inst.alertId, instanceId: inst.id }
            })
          )
          break
      }
      // 静默 tpl 引用,防止 lint 警告
      void tpl
    },

    /** 审批通过(任意审批/执行节点)
     *  OPT-FIX-2 / P3-8:可选 operatorRole 参数,等于 handlerRole 才允许审批
     *  (不传则保留兼容 - 但新代码应该传)
     */
    approve(instanceId: string, operator: string, comment?: string, operatorRole?: string) {
      const inst = this.instances.find((i) => i.id === instanceId)
      if (!inst) return
      const tpl = this.templates.find((t) => t.kind === inst.kind)
      if (!tpl) return
      const cur = tpl.nodes.find((n) => n.code === inst.currentNode)
      if (!cur) return
      // 角色守卫(可选):传入 operatorRole 时校验
      if (operatorRole && cur.kind === 'approve' && cur.handlerRole !== operatorRole) {
        log('warn', 'approve', `拒绝:${inst.id} 由 ${operatorRole} 越权审批 ${cur.handlerRole} 节点`)
        return
      }
      const exec = inst.executions.find(
        (e) => e.nodeCode === inst.currentNode && (e.status === 'running' || e.status === 'pending')
      )
      if (exec) {
        exec.status = 'approved'
        exec.operator = operator
        exec.operatedAt = nowStr()
        exec.comment = comment
      }
      inst.status = 'running'
      log(
        'log',
        'approve',
        `${inst.id} node=${inst.currentNode} by ${operator}${operatorRole ? ` (${operatorRole})` : ''}`
      )
      this._advance(inst, tpl, operator, 'approve')
      this.persist()
    },

    /** 审批驳回(同 approve 加角色守卫) */
    reject(instanceId: string, operator: string, comment: string, operatorRole?: string) {
      const inst = this.instances.find((i) => i.id === instanceId)
      if (!inst) return
      const tpl = this.templates.find((t) => t.kind === inst.kind)
      if (!tpl) return
      const cur = tpl.nodes.find((n) => n.code === inst.currentNode)
      if (!cur) return
      if (operatorRole && cur.kind === 'approve' && cur.handlerRole !== operatorRole) {
        log('warn', 'reject', `拒绝驳回:${inst.id} 由 ${operatorRole} 越权驳回 ${cur.handlerRole} 节点`)
        return
      }
      const exec = inst.executions.find(
        (e) => e.nodeCode === inst.currentNode && (e.status === 'running' || e.status === 'pending')
      )
      if (exec) {
        exec.status = 'rejected'
        exec.operator = operator
        exec.operatedAt = nowStr()
        exec.comment = comment
      }
      inst.status = 'rejected'
      log('log', 'reject', `${inst.id} node=${inst.currentNode} by ${operator}: ${comment}`)
      this.persist()
    },

    /** 坐席/支撑岗"完成执行"(适用于 execute 节点,如提交平台) */
    completeExecute(instanceId: string, operator: string, comment?: string) {
      this.approve(instanceId, operator, comment)
    },

    /** 更新模板(管理层在 WorkflowConfig 修改) */
    updateTemplate(kind: WorkflowKind, patch: Partial<WorkflowTemplate>) {
      const tpl = this.templates.find((t) => t.kind === kind)
      if (!tpl) return
      Object.assign(tpl, patch)
      log('log', 'template.update', kind, patch)
      this.persist()
    },

    /** 更新单个节点的 SLA / 处置角色 */
    updateNode(kind: WorkflowKind, code: string, patch: Partial<WorkflowNode>) {
      const tpl = this.templates.find((t) => t.kind === kind)
      if (!tpl) return
      const node = tpl.nodes.find((n) => n.code === code)
      if (!node) return
      Object.assign(node, patch)
      log('log', 'template.node.update', `${kind}/${code}`, patch)
      this.persist()
    },

    /**
     * 新建工作流模板(管理层)
     * 会在 templates 末尾追加,持久化
     */
    addTemplate(input: {
      kind: string
      name: string
      desc?: string
      nodes?: WorkflowNode[]
      enabled?: boolean
      applicableScenes?: string[]
    }) {
      if (this.templates.some((t) => t.kind === input.kind)) {
        log('warn', 'template.add', `kind=${input.kind} 已存在,忽略`)
        return null
      }
      const tpl: WorkflowTemplate = {
        kind: input.kind as WorkflowKind,
        name: input.name,
        desc: input.desc || '',
        enabled: input.enabled ?? true,
        nodes: input.nodes && input.nodes.length > 0 ? input.nodes : [this._defaultStartNode(input.kind)],
        applicableScenes: input.applicableScenes || []
      }
      this.templates.push(tpl)
      log('log', 'template.add', input.kind, input.name)
      this.persist()
      return tpl
    },
    /** 默认起始节点(用于新建模板) */
    _defaultStartNode(kind: string): WorkflowNode {
      return {
        code: `${kind}_start`,
        name: '受理',
        kind: 'start',
        handlerRole: 'agent',
        slaHours: 4,
        autoNext: false
      }
    },
    /** 删除模板 */
    removeTemplate(kind: WorkflowKind) {
      this.templates = this.templates.filter((t) => t.kind !== kind)
      log('log', 'template.remove', kind)
      this.persist()
    },
    /**
     * 导入模板(从 JSON 字符串)
     * - 解析失败抛错
     * - kind 重复覆盖
     */
    importTemplatesFromJson(json: string) {
      const obj = JSON.parse(json)
      if (!Array.isArray(obj)) throw new Error('需要数组')
      let added = 0
      let updated = 0
      obj.forEach((raw: any) => {
        const existing = this.templates.find((t) => t.kind === raw.kind)
        if (existing) {
          Object.assign(existing, raw)
          updated++
        } else {
          this.addTemplate(raw)
          added++
        }
      })
      this.persist()
      return { added, updated }
    },
    /**
     * 发布:占位。当前实现等价于保存草稿(已 persist),
     * 真实环境应记录"已发布快照"用于回滚
     */
    publishAll(publisher = '陈强(管理)') {
      log('log', 'template.publish', `${this.templates.length} templates`, publisher)
      this.persist()
    },

    /** 计算某实例当前节点的 SLA 进度(0~1,>1 即超时) */
    slaProgress(inst: WorkflowInstance): number {
      const tpl = this.templates.find((t) => t.kind === inst.kind)
      if (!tpl) return 0
      const node = tpl.nodes.find((n) => n.code === inst.currentNode)
      if (!node || !node.slaHours) return 0
      const start = new Date(inst.currentNodeStartedAt.replace(' ', 'T')).getTime()
      const now = Date.now()
      const elapsedHours = (now - start) / 3600000
      return elapsedHours / node.slaHours
    },

    /** 扫描所有 running 实例,把过期的标记为 expired(并 dispatch 升级事件) */
    tickOverdue() {
      const now = Date.now()
      this.instances.forEach((inst) => {
        if (inst.status !== 'running') return
        if (!inst.expireAt) return
        const exp = new Date(inst.expireAt.replace(' ', 'T')).getTime()
        if (now > exp) {
          inst.status = 'expired'
          log('warn', 'tick', `instance expired: ${inst.id} (expireAt=${inst.expireAt})`)
          window.dispatchEvent(
            new CustomEvent(EVT.WORKFLOW_OVERDUE, {
              detail: { instanceId: inst.id, kind: inst.kind, ticketId: inst.ticketId, customerId: inst.customerId }
            })
          )
        }
      })
      this.persist()
    },

    // ============ 工单状态机(独立配置面) ============
    updateTicketState(code: TicketStateCode, patch: Partial<TicketState>) {
      const s = this.ticketStates.find((x) => x.code === code)
      if (!s) return
      Object.assign(s, patch)
      log('log', 'ticketState.update', `${code} patched`, patch)
      this.persist()
    },
    addTicketState(s: TicketState) {
      if (this.ticketStates.some((x) => x.code === s.code)) return
      this.ticketStates.push(s)
      log('log', 'ticketState.add', `code=${s.code}`)
      this.persist()
    },
    updateTransitionRule(idx: number, patch: Partial<TicketTransitionRule>) {
      const r = this.transitionRules[idx]
      if (!r) return
      Object.assign(r, patch)
      log('log', 'transition.update', `#${idx} patched`, patch)
      this.persist()
    },
    addTransitionRule(r: TicketTransitionRule) {
      this.transitionRules.push(r)
      log('log', 'transition.add', `name=${r.name}`)
      this.persist()
    },
    updateRegulatorPolicy(patch: Partial<RegulatorPolicy>) {
      Object.assign(this.regulatorPolicy, patch)
      log('log', 'regulatorPolicy.update', 'patched', patch)
      this.persist()
    }
  }
})

// ============ P1-10:定时扫描超时实例 ============
if (typeof window !== 'undefined') {
  setInterval(() => {
    try {
      useWorkflowStore().tickOverdue()
    } catch (e) {
      // 静默
    }
  }, 60_000)
}
