// 投诉管控承诺 store 测试
import { describe, it, expect } from 'vitest'
import { useCompliancePromiseStore } from './compliancePromise'

describe('useCompliancePromiseStore', () => {
  it('createWithFollowUp 一次返回 promise + ticketId', () => {
    const s = useCompliancePromiseStore()
    s.items.length = 0
    const result = s.createWithFollowUp({
      reviewProjectId: 'R-test',
      reviewer: '刘丽',
      reviewerRole: 'review',
      metric: 'complaint_new_rate',
      targetValue: '≤ 0.5%',
      currentValue: '0.62%',
      deadline: '2026-09-30',
      reason: '6 月达到 0.62%'
    })
    expect(result.promise.id).toMatch(/^PRC-/)
    expect(result.ticketId).toMatch(/^GD-/)
    expect(result.promise.status).toBe('ticket_created')
    expect(result.promise.followUpTicketId).toBe(result.ticketId)
  })

  it('addCheck 跟踪检查', () => {
    const s = useCompliancePromiseStore()
    s.items.length = 0
    const { promise } = s.createWithFollowUp({
      reviewProjectId: 'R-test',
      reviewer: '刘丽',
      reviewerRole: 'review',
      metric: 'repeat_complaint_rate',
      targetValue: '≤ 1%',
      deadline: '2026-12-31',
      reason: 'test'
    })
    expect(
      s.addCheck(promise.id, {
        operator: '陈强',
        result: 'warn',
        comment: '当前 1.1%'
      })
    ).toBe(true)
    expect(s.items[0].checks.length).toBe(1)
    expect(s.items[0].status).toBe('in_progress')
  })

  it('close 标记达成', () => {
    const s = useCompliancePromiseStore()
    s.items.length = 0
    const { promise } = s.createWithFollowUp({
      reviewProjectId: 'R-test',
      reviewer: '刘丽',
      reviewerRole: 'review',
      metric: 'handle_time',
      targetValue: '≤ 24h',
      deadline: '2026-12-31',
      reason: 'test'
    })
    expect(s.close(promise.id, '达成')).toBe(true)
    expect(s.items[0].status).toBe('closed')
    expect(s.closedCount).toBe(1)
  })

  it('markOverdue 扫描过期', () => {
    const s = useCompliancePromiseStore()
    s.items.length = 0
    const { promise } = s.createWithFollowUp({
      reviewProjectId: 'R-test',
      reviewer: '刘丽',
      reviewerRole: 'review',
      metric: 'complaint_new_rate',
      targetValue: '≤ 0.5%',
      deadline: '2020-01-01', // 已过期
      reason: 'test'
    })
    s.markOverdue()
    expect(s.items.find((p) => p.id === promise.id)?.status).toBe('overdue')
    expect(s.overdueCount).toBe(1)
  })
})
