// 业务申请 store(OPT-5)
// 反向流程:坐席发起申请 → 业务执行岗审批 → 走工作流实例
// 完成 4.5「坐席↔支撑岗」双向闭环

import { defineStore } from 'pinia'

// ============ 类型 ============

export type AppType =
  | 'stop_collection'    // 停催停扣
  | 'negotiate'          // 协商还款
  | 'credit_objection'   // 征信异议
  | 'transfer_mediate'   // 转调解
  | 'extended_repayment' // 延期还款

export type AppStatus = 'pending' | 'approved' | 'rejected' | 'in_progress' | 'executed' | 'closed'
export type AppPriority = 'low' | 'normal' | 'high'

export interface BusinessApplication {
  id: string                                 // BA-20260715-0001
  type: AppType
  /** 标题(自动生成可覆盖) */
  title: string
  /** 申请人 - 坐席 */
  applicantId: string
  applicantName: string
  /** 关联客户 */
  customerId: string
  customerName: string
  /** 关联工单(可选) */
  ticketId?: string
  /** 申请说明 */
  reason: string
  /** 申请条件(坐席告诉业务岗,前情提要) */
  context?: string
  priority: AppPriority
  status: AppStatus
  /** 业务岗审批人 */
  reviewer?: string
  reviewedAt?: string
  reviewNote?: string
  /** 走的工作流实例 ID(审批通过后) */
  workflowInstanceId?: string
  /** 工单/工单的关闭时间 */
  executedAt?: string
  /** 关联最终交付的票据合同(可选) */
  contractId?: string
  createdAt: string
  updatedAt: string
}

// ============ utils ============

function nowStr() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const STORAGE_KEY = 'cp_business_app'

function loadPersisted(): BusinessApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) return arr
    }
  } catch { /* 静默 */ }
  return buildSeed()
}

function savePersisted(items: BusinessApplication[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch { /* 静默 */ }
}

function buildSeed(): BusinessApplication[] {
  return [
    {
      id: 'BA-20260715-0001',
      type: 'stop_collection',
      title: '为客户 C006 申请停催 14 天',
      applicantId: 'U001',
      applicantName: '张敏',
      customerId: 'C006',
      customerName: '赵建国',
      ticketId: 'GD-20260714-0033',
      reason: '客户已表明失业,提出请愿',
      context: '客户连续 3 次承诺还款均未兑现,失信名单在案。今日来电提到失业证明正在办,申请停催宽限 14 天让他处理。',
      priority: 'high',
      status: 'executed',
      reviewer: '李伟',
      reviewedAt: '2026-07-15 10:30',
      reviewNote: '同意启动停催流程',
      workflowInstanceId: 'stopcoll-EC-20260715-0001',
      executedAt: '2026-07-15 11:00',
      createdAt: '2026-07-15 10:00',
      updatedAt: '2026-07-15 11:00'
    },
    {
      id: 'BA-20260714-0002',
      type: 'negotiate',
      title: '为客户 C003 申请协商还款方案',
      applicantId: 'U002',
      applicantName: '王浩',
      customerId: 'C003',
      customerName: '周志远',
      ticketId: 'GD-20260713-0015',
      reason: '客户希望分 6 期还款',
      context: '客户逾期 92 天,但态度配合,提出 6 期还款。请业务岗评估可分期方案。',
      priority: 'high',
      status: 'approved',
      reviewer: '李伟',
      reviewedAt: '2026-07-14 14:30',
      reviewNote: '同意进入协商流程',
      workflowInstanceId: 'negotiate-20260714-001',
      createdAt: '2026-07-14 14:00',
      updatedAt: '2026-07-14 14:30'
    },
    {
      id: 'BA-20260713-0003',
      type: 'credit_objection',
      title: '客户 C001 申请征信异议',
      applicantId: 'U001',
      applicantName: '张敏',
      customerId: 'C001',
      customerName: '刘建国',
      ticketId: 'GD-20260712-0019',
      reason: '客户征信显示曾逾期,但记录有误',
      context: '客户反映 2024 年有一次实际未逾期的合同记录出现在征信中。请业务岗启动征信异议流程。',
      priority: 'normal',
      status: 'pending',
      createdAt: '2026-07-13 16:00',
      updatedAt: '2026-07-13 16:00'
    }
  ]
}

// ============ Store ============

export const useBusinessAppStore = defineStore('businessApp', {
  state: () => ({
    items: loadPersisted() as BusinessApplication[]
  }),
  getters: {
    pendingCount: (s) => s.items.filter(a => a.status === 'pending').length,
    inProgressCount: (s) => s.items.filter(a => a.status === 'approved' || a.status === 'in_progress').length,
    doneCount: (s) => s.items.filter(a => a.status === 'executed' || a.status === 'closed').length,
    /** 给指定坐席的申请列表 */
    listForApplicant: (s) => (id: string) => s.items.filter(a => a.applicantId === id)
      .sort((a, b) => (b.createdAt < a.createdAt ? -1 : 1)),
    /** 全部待审批(业务执行岗用) */
    pendingAll: (s) => s.items.filter(a => a.status === 'pending'),
    /** 按类型统计 */
    typeStats: (s) => {
      const map: Record<string, number> = {}
      s.items.forEach(a => { map[a.type] = (map[a.type] || 0) + 1 })
      return map
    }
  },
  actions: {
    persist() { savePersisted(this.items) },

    /** 坐席发起申请 */
    create(input: Omit<BusinessApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>): BusinessApplication {
      const id = `BA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`
      const now = nowStr()
      const app: BusinessApplication = { ...input, id, status: 'pending', createdAt: now, updatedAt: now }
      this.items.unshift(app)
      this.persist()
      return app
    },

    /** 业务执行岗审批 */
    approve(id: string, reviewer: string, note: string, workflowInstanceId?: string): boolean {
      const a = this.items.find(x => x.id === id)
      if (!a) return false
      if (a.status !== 'pending') return false
      a.status = 'approved'
      a.reviewer = reviewer
      a.reviewedAt = nowStr()
      a.reviewNote = note
      if (workflowInstanceId) a.workflowInstanceId = workflowInstanceId
      a.updatedAt = nowStr()
      this.persist()
      return true
    },

    /** 驳回 */
    reject(id: string, reviewer: string, note: string): boolean {
      const a = this.items.find(x => x.id === id)
      if (!a) return false
      if (a.status !== 'pending') return false
      a.status = 'rejected'
      a.reviewer = reviewer
      a.reviewedAt = nowStr()
      a.reviewNote = note
      a.updatedAt = nowStr()
      this.persist()
      return true
    },

    /** 业务执行:申请已开始执行 */
    markInProgress(id: string, workflowInstanceId: string): boolean {
      const a = this.items.find(x => x.id === id)
      if (!a) return false
      a.status = 'in_progress'
      a.workflowInstanceId = workflowInstanceId
      a.updatedAt = nowStr()
      this.persist()
      return true
    },

    /** 完成(终态) */
    complete(id: string, contractId?: string): boolean {
      const a = this.items.find(x => x.id === id)
      if (!a) return false
      a.status = 'executed'
      a.executedAt = nowStr()
      if (contractId) a.contractId = contractId
      a.updatedAt = nowStr()
      this.persist()
      return true
    },

    close(id: string) {
      const a = this.items.find(x => x.id === id)
      if (!a) return
      a.status = 'closed'
      a.updatedAt = nowStr()
      this.persist()
    }
  }
})

// 申请类型 → 工作流 kind 映射
export const APP_TYPE_TO_WF: Record<AppType, string> = {
  stop_collection: 'stop_collection',
  negotiate: 'negotiate',
  credit_objection: 'credit_objection',
  transfer_mediate: 'transfer_mediate',
  extended_repayment: 'negotiate' // 复用
}

export const APP_TYPE_LABEL: Record<AppType, string> = {
  stop_collection: '停催停扣',
  negotiate: '协商还款',
  credit_objection: '征信异议',
  transfer_mediate: '转调解',
  extended_repayment: '延期还款'
}
