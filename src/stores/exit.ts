// 贷中清退 store(P2-6)
// 贷中清退:在贷存续期识别风险客户 → 多轮审批 → 客户告知 + 资产处置

import { defineStore } from 'pinia'

// ============ 类型 ============

export type ExitReason = 'high_risk' | 'regulator_blacklist' | 'overdue_extreme' | 'refinance_failed' | 'payment_dispute'
export type ExitStatus = 'pending_review' | 'approved' | 'rejected' | 'notified' | 'settled' | 'closed'
export type ExitTier = 'normal' | 'extra_review' | 'management_extra'
export type AssetAction = 'settle_all' | 'settle_remain' | 'refinance' | 'litigation' | 'writeoff'

export interface ExitApprovalStep {
  step: number
  role: 'business' | 'review' | 'manage'
  approver?: string
  approvedAt?: string
  approved?: boolean
  comment?: string
  pending?: boolean
}

export interface ExitCase {
  id: string                         // EC-20260715-0001
  customerId: string
  customerName: string
  loanId: string
  loanBalance: number
  remainingDays: number
  /** 触发原因 */
  reason: ExitReason
  /** 严重度分层:normal / extra_review / management_extra */
  tier: ExitTier
  /** 触发描述 */
  description: string
  status: ExitStatus
  /** 多轮审批(层级联签) */
  approvals: ExitApprovalStep[]
  /** 客户告知(短信/邮件/电话)结果 */
  notifies: { at: string; channel: '短信' | '邮件' | '电话'; result: '成功' | '失败'; note?: string }[]
  /** 处置方案 */
  assetAction: AssetAction
  /** 处置进度描述 */
  assetProgress: string
  /** 结算金额(最终) */
  settledAmount?: number
  /** 触发时间 */
  createdAt: string
  updatedAt: string
}

// ============ utils ============

function nowStr() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const STORAGE_KEY = 'cp_exit_data'

function loadPersisted(): ExitCase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) return arr
    }
  } catch { /* 静默 */ }
  return buildSeed()
}

function savePersisted(cases: ExitCase[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases))
  } catch { /* 静默 */ }
}

function buildSeed(): ExitCase[] {
  return [
    {
      id: 'EC-20260715-0001',
      customerId: 'C006',
      customerName: '赵建国',
      loanId: 'L-2024-0008',
      loanBalance: 268900,
      remainingDays: 18,
      reason: 'regulator_blacklist',
      tier: 'management_extra',
      description: '客户已被法院列入失信名单 + 6 个月内 6 次投诉(其中 2 次监管转办)',
      status: 'notified',
      approvals: [
        { step: 1, role: 'business', approver: '李伟', approvedAt: '2026-07-15 10:30', approved: true, comment: '同意进入清退流程' },
        { step: 2, role: 'review', approver: '王芳', approvedAt: '2026-07-15 14:20', approved: true, comment: '风险评估通过' },
        { step: 3, role: 'manage', approver: '陈强', approvedAt: '2026-07-15 16:40', approved: true, comment: '管理层批复,启动清退' }
      ],
      notifies: [
        { at: '2026-07-15 17:00', channel: '短信', result: '成功', note: '发送清退通知短信' },
        { at: '2026-07-15 17:00', channel: '邮件', result: '成功', note: '发送清退通知函电邮版' }
      ],
      assetAction: 'settle_all',
      assetProgress: '客户 7 天内可一次性结清;逾期 18 天将按法定程序处置抵押物',
      settledAmount: 268900,
      createdAt: '2026-07-15 09:00',
      updatedAt: '2026-07-15 17:00'
    },
    {
      id: 'EC-20260714-0002',
      customerId: 'C003',
      customerName: '周志远',
      loanId: 'L-2024-0021',
      loanBalance: 89600,
      remainingDays: 35,
      reason: 'overdue_extreme',
      tier: 'extra_review',
      description: '逾期 92 天 + 反复承诺不兑现 + 多次投诉催收频次',
      status: 'pending_review',
      approvals: [
        { step: 1, role: 'business', approver: '李伟', approvedAt: '2026-07-14 15:00', approved: true, comment: '同意进入清退审查' },
        { step: 2, role: 'review', pending: true }
      ],
      notifies: [],
      assetAction: 'settle_remain',
      assetProgress: '客户可结清剩余本金(¥89600);否则进入诉讼',
      createdAt: '2026-07-14 14:00',
      updatedAt: '2026-07-14 15:00'
    },
    {
      id: 'EC-20260712-0003',
      customerId: 'C001',
      customerName: '刘建国',
      loanId: 'L-2024-0035',
      loanBalance: 128400,
      remainingDays: 28,
      reason: 'payment_dispute',
      tier: 'normal',
      description: '客户对息费计算有异议 + 多次投诉 → 经审查,事实清楚无法和解',
      status: 'approved',
      approvals: [
        { step: 1, role: 'business', approver: '李伟', approvedAt: '2026-07-12 11:00', approved: true, comment: '同意走清退' },
        { step: 2, role: 'review', approver: '王芳', approvedAt: '2026-07-12 14:30', approved: true, comment: '审查通过' }
      ],
      notifies: [],
      assetAction: 'refinance',
      assetProgress: '已结清尾款 ¥128400,客户征信记录已更新',
      createdAt: '2026-07-12 09:00',
      updatedAt: '2026-07-12 14:30'
    }
  ]
}

// ============ Store ============

export const useExitStore = defineStore('exit', {
  state: () => ({
    cases: loadPersisted() as ExitCase[]
  }),
  getters: {
    pendingCount: (s) => s.cases.filter(c => c.status === 'pending_review').length,
    approvedCount: (s) => s.cases.filter(c => c.status === 'approved').length,
    notifiedCount: (s) => s.cases.filter(c => c.status === 'notified').length,
    settledCount: (s) => s.cases.filter(c => c.status === 'settled' || c.status === 'closed').length,
    totalExitAmount(s): number {
      return s.cases.reduce((a, c) => a + c.loanBalance, 0)
    }
  },
  actions: {
    persist() {
      savePersisted(this.cases)
    },

    /** 启动新清退 */
    create(input: Omit<ExitCase, 'id' | 'status' | 'approvals' | 'notifies' | 'createdAt' | 'updatedAt' | 'tier'> & { tier?: ExitTier }): ExitCase {
      const id = `EC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`
      // 根据原因自动分层
      let tier: ExitTier = input.tier || 'normal'
      if (input.reason === 'regulator_blacklist') tier = 'management_extra'
      else if (input.reason === 'overdue_extreme') tier = 'extra_review'

      // 多轮审批深度
      const approvals: ExitApprovalStep[] = tier === 'management_extra'
        ? [
          { step: 1, role: 'business', pending: true },
          { step: 2, role: 'review', pending: true },
          { step: 3, role: 'manage', pending: true }
        ]
        : tier === 'extra_review'
        ? [
          { step: 1, role: 'business', pending: true },
          { step: 2, role: 'review', pending: true }
        ]
        : [
          { step: 1, role: 'business', pending: true }
        ]
      const now = nowStr()
      const c: ExitCase = {
        ...input,
        id,
        tier,
        status: 'pending_review',
        approvals,
        notifies: [],
        assetAction: input.assetAction || 'settle_all',
        assetProgress: input.assetProgress || '处置中',
        createdAt: now,
        updatedAt: now
      }
      this.cases.unshift(c)
      this.persist()
      return c
    },

    /** 审批通过(任何步骤) */
    approve(id: string, role: 'business' | 'review' | 'manage', approver: string, comment: string, approved: boolean) {
      const c = this.cases.find(x => x.id === id)
      if (!c) return false
      const step = c.approvals.find(a => a.role === role && a.pending)
      if (!step) return false
      step.approver = approver
      step.approvedAt = nowStr()
      step.approved = approved
      step.comment = comment
      step.pending = false

      // 全部签批通过 → 转 approved 状态
      if (approved && c.approvals.every(a => a.approved === true)) {
        c.status = 'approved'
      } else if (!approved) {
        c.status = 'rejected'
      }
      c.updatedAt = nowStr()
      this.persist()
      return true
    },

    /** 客户告知 */
    notify(id: string, channel: '短信' | '邮件' | '电话', result: '成功' | '失败', note?: string) {
      const c = this.cases.find(x => x.id === id)
      if (!c) return false
      // 必须 approved 才能通知
      if (c.status !== 'approved' && c.status !== 'notified') return false
      c.notifies.push({ at: nowStr(), channel, result, note })
      c.status = 'notified'
      c.updatedAt = nowStr()
      this.persist()
      return true
    },

    /** 更新处置方案与进度 */
    updateAsset(id: string, action: AssetAction, progress: string, settledAmount?: number) {
      const c = this.cases.find(x => x.id === id)
      if (!c) return false
      c.assetAction = action
      c.assetProgress = progress
      if (settledAmount !== undefined) c.settledAmount = settledAmount
      c.updatedAt = nowStr()
      this.persist()
      return true
    },

    /** 关闭/结清 */
    close(id: string, settledAmount?: number) {
      const c = this.cases.find(x => x.id === id)
      if (!c) return false
      if (settledAmount !== undefined) c.settledAmount = settledAmount
      c.status = 'closed'
      c.updatedAt = nowStr()
      this.persist()
      return true
    }
  }
})