// 投诉管控承诺 store(OPT-FIX-3 / P3-10)
// 审查归档时提交的同步承诺 → 自动生成 follow-up 工单草稿
// 提供后续跟踪:承诺闭环跟工单双向链接

import { defineStore } from 'pinia'

export type PromiseStatus = 'open' | 'ticket_created' | 'in_progress' | 'closed' | 'overdue'
export type PromiseMetric =
  | 'complaint_new_rate' // 新户投诉率
  | 'repeat_complaint_rate' // 重复投诉率
  | 'handle_time' // 平均处理时长
  | 'satisfaction_score' // 满意度评分
  | 'overdue_complaint_count' // 超时投诉数
  | 'custom' // 自定义指标

export interface CompliancePromise {
  id: string // PRC-20260715-0001
  /** 关联审查项目 */
  reviewProjectId: string
  /** 关联审查执行实例 */
  reviewInstanceId?: string
  /** 关联标准条目 */
  standardId?: string
  /** 触发承诺的审查人 */
  reviewer: string
  reviewerRole: 'review' | 'manage'
  /** 业务类型(消保相关) */
  metric: PromiseMetric
  /** 目标值,如 ≤0.5% */
  targetValue: string
  /** 当前值(可选,展示趋势用) */
  currentValue?: string
  /** 承诺开始时间 */
  promiseFrom: string
  /** 承诺截止时间 */
  deadline: string
  /** 关联的 follow-up 工单 ID */
  followUpTicketId?: string
  /** 状态 */
  status: PromiseStatus
  /** 描述:为什么设这个目标 */
  reason: string
  /** 跟踪节点 */
  checks: PromiseCheck[]
  createdAt: string
  updatedAt: string
}

export interface PromiseCheck {
  at: string // 跟踪时点
  operator: string // 检查人
  result: 'good' | 'warn' | 'fail'
  comment: string
}

const STORAGE_KEY = 'cp_compliance_promise'

function loadPersisted(): CompliancePromise[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) return arr
    }
  } catch {
    /* 静默 */
  }
  return buildSeed()
}

function savePersisted(items: CompliancePromise[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* 静默 */
  }
}

function buildSeed(): CompliancePromise[] {
  return [
    {
      id: 'PRC-20260715-0001',
      reviewProjectId: 'R-2026-Q2-007',
      reviewInstanceId: 'rev-2026-2c-007',
      standardId: 'R-002',
      reviewer: '刘丽',
      reviewerRole: 'review',
      metric: 'complaint_new_rate',
      targetValue: '新户 ≤ 0.5%',
      currentValue: '0.62%',
      promiseFrom: '2026-07-15',
      deadline: '2026-09-30',
      followUpTicketId: 'GD-20260715-0099',
      status: 'in_progress',
      reason: '新户投诉率 6 月份达到 0.62%,超出 0.5% 阈值。审查归档时承诺 9 月底前降低至 0.5% 以下。',
      checks: [{ at: '2026-07-30', operator: '陈强', result: 'warn', comment: '当前 0.55%,需持续跟进' }],
      createdAt: '2026-07-15 16:30',
      updatedAt: '2026-07-30 09:00'
    }
  ]
}

function nowStr() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const useCompliancePromiseStore = defineStore('compliancePromise', {
  state: () => ({
    items: loadPersisted() as CompliancePromise[]
  }),
  getters: {
    openCount: (s) => s.items.filter((p) => p.status === 'open' || p.status === 'in_progress').length,
    overdueCount: (s) => s.items.filter((p) => p.status === 'overdue').length,
    closedCount: (s) => s.items.filter((p) => p.status === 'closed').length
  },
  actions: {
    persist() {
      savePersisted(this.items)
    },

    /**
     * 创建承诺并自动生成 follow-up 工单(草稿)
     * @returns { promise, ticketId }
     */
    createWithFollowUp(input: {
      reviewProjectId: string
      reviewInstanceId?: string
      standardId?: string
      reviewer: string
      reviewerRole: 'review' | 'manage'
      metric: PromiseMetric
      targetValue: string
      currentValue?: string
      deadline: string
      reason: string
      daysToDeadline?: number // 默认 60 天
    }): { promise: CompliancePromise; ticketId: string } {
      const id = `PRC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`
      const ticketId = `GD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`
      const now = nowStr()
      const today = new Date().toISOString().slice(0, 10)

      const promise: CompliancePromise = {
        id,
        reviewProjectId: input.reviewProjectId,
        reviewInstanceId: input.reviewInstanceId,
        standardId: input.standardId,
        reviewer: input.reviewer,
        reviewerRole: input.reviewerRole,
        metric: input.metric,
        targetValue: input.targetValue,
        currentValue: input.currentValue,
        promiseFrom: today,
        deadline: input.deadline,
        followUpTicketId: ticketId,
        status: 'ticket_created',
        reason: input.reason,
        checks: [],
        createdAt: now,
        updatedAt: now
      }
      this.items.unshift(promise)
      this.persist()
      return { promise, ticketId }
    },

    /** 跟踪检查 */
    addCheck(promiseId: string, check: Omit<PromiseCheck, 'at'>) {
      const p = this.items.find((x) => x.id === promiseId)
      if (!p) return false
      p.checks.push({ ...check, at: nowStr() })
      p.status = 'in_progress'
      p.updatedAt = nowStr()
      this.persist()
      return true
    },

    /** 关闭承诺(目标达成) */
    close(promiseId: string, note: string) {
      const p = this.items.find((x) => x.id === promiseId)
      if (!p) return false
      p.status = 'closed'
      p.updatedAt = nowStr()
      p.checks.push({ at: nowStr(), operator: p.reviewer, result: 'good', comment: `承诺达成: ${note}` })
      this.persist()
      return true
    },

    /** 标记超时 */
    markOverdue() {
      const now = nowStr()
      const today = new Date().toISOString().slice(0, 10)
      this.items.forEach((p) => {
        if (p.status !== 'closed' && p.status !== 'overdue' && p.deadline < today) {
          p.status = 'overdue'
          p.updatedAt = now
        }
      })
      this.persist()
    }
  }
})

export const METRIC_LABEL: Record<PromiseMetric, string> = {
  complaint_new_rate: '新户投诉率',
  repeat_complaint_rate: '重复投诉率',
  handle_time: '平均处理时长',
  satisfaction_score: '满意度评分',
  overdue_complaint_count: '超时投诉数',
  custom: '自定义指标'
}
