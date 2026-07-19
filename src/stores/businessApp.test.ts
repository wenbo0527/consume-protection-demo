// 业务申请 store 测试
import { describe, it, expect } from 'vitest'
import { useBusinessAppStore } from './businessApp'

describe('useBusinessAppStore', () => {
  it('create + pendingCount', () => {
    const s = useBusinessAppStore()
    s.items.length = 0
    const a = s.create({
      type: 'negotiate',
      title: 'Test',
      applicantId: 'U1',
      applicantName: 'test',
      customerId: 'C003',
      customerName: 'C003 name',
      reason: 'Want 6 期',
      priority: 'high'
    })
    expect(a.id).toMatch(/^BA-/)
    expect(a.status).toBe('pending')
    expect(s.pendingCount).toBe(1)
  })

  it('approve → inProgress → complete 流程', () => {
    const s = useBusinessAppStore()
    s.items.length = 0
    const a = s.create({
      type: 'stop_collection',
      title: 'Test',
      applicantId: 'U1',
      applicantName: 't',
      customerId: 'C006',
      customerName: 'C006',
      reason: 'unemployed',
      priority: 'high'
    })

    expect(s.approve(a.id, 'reviewer', '同意')).toBe(true)
    expect(s.items[0].status).toBe('approved')
    expect(s.items[0].reviewer).toBe('reviewer')

    expect(s.markInProgress(a.id, 'wf-1')).toBe(true)
    expect(s.items[0].status).toBe('in_progress')
    expect(s.items[0].workflowInstanceId).toBe('wf-1')

    expect(s.complete(a.id, 'contract-1')).toBe(true)
    expect(s.items[0].status).toBe('executed')
    expect(s.items[0].contractId).toBe('contract-1')
  })

  it('reject + 状态机保护', () => {
    const s = useBusinessAppStore()
    s.items.length = 0
    const a = s.create({
      type: 'credit_objection',
      title: 'Test',
      applicantId: 'U1',
      applicantName: 't',
      customerId: 'C001',
      customerName: 'C001',
      reason: 'r',
      priority: 'low'
    })
    expect(s.reject(a.id, 'reviewer', '资料不齐')).toBe(true)
    expect(s.items[0].status).toBe('rejected')

    // 不能对已驳回的再次 approve
    expect(s.approve(a.id, 'r', 'n')).toBe(false)
  })

  it('listForApplicant 过滤', () => {
    const s = useBusinessAppStore()
    s.items.length = 0
    s.create({
      type: 'negotiate',
      title: 't',
      applicantId: 'A',
      applicantName: 'A',
      customerId: 'C',
      customerName: 'C',
      reason: 'r',
      priority: 'low'
    })
    s.create({
      type: 'negotiate',
      title: 't2',
      applicantId: 'B',
      applicantName: 'B',
      customerId: 'C',
      customerName: 'C',
      reason: 'r',
      priority: 'low'
    })
    expect(s.listForApplicant('A').length).toBe(1)
    expect(s.listForApplicant('B').length).toBe(1)
  })

  it('close 仅从 executed 改 closed', () => {
    const s = useBusinessAppStore()
    s.items.length = 0
    const a = s.create({
      type: 'negotiate',
      title: 't',
      applicantId: 'A',
      applicantName: 'A',
      customerId: 'C',
      customerName: 'C',
      reason: 'r',
      priority: 'low'
    })
    // pending 直接 close
    s.close(a.id)
    expect(s.items[0].status).toBe('closed')
  })
})
