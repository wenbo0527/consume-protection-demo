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

export type NodeKind = 'apply' | 'approve' | 'execute' | 'notify' | 'auto' | 'archive'

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
}

export type InstanceStatus = 'running' | 'approved' | 'rejected' | 'expired' | 'finished'

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
}

function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const obj = JSON.parse(raw) as PersistedState
      if (Array.isArray(obj.templates) && Array.isArray(obj.instances)) return obj
    }
  } catch (e) {
    log('warn', 'load', 'parse localStorage failed', e)
  }
  return {
    templates: JSON.parse(JSON.stringify(DEFAULT_TEMPLATES)),
    instances: buildMockInstances()
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
      instances: init.instances as WorkflowInstance[]
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
      savePersisted({ templates: this.templates, instances: this.instances })
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
