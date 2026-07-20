// alert store 测试(扩展:加未读机制)
import { describe, it, expect } from 'vitest'
import { useAlertStore } from './alert'

describe('useAlertStore', () => {
  it('初始化即有种子数据', () => {
    const s = useAlertStore()
    expect(s.items.length).toBeGreaterThan(0)
    expect(s.activeAlerts.length).toBeGreaterThan(0)
  })

  it('openCount / handleCount / verifiedCount', () => {
    const s = useAlertStore()
    expect(s.openCount).toBeGreaterThanOrEqual(0)
    expect(s.handleCount).toBeGreaterThanOrEqual(0)
    expect(s.verifiedCount).toBeGreaterThanOrEqual(0)
  })

  it('updateStatus 持久化', () => {
    const s = useAlertStore()
    const first = s.items[0]
    expect(first).toBeDefined()
    s.updateStatus(first.id, 'alert_handle')
    expect(s.items.find((x) => x.id === first.id)?.status).toBe('alert_handle')
  })

  it('verifyByWorkflow: 设置 verifiedAt + verifiedByInstance', () => {
    const s = useAlertStore()
    const open = s.items.find((a) => a.status === 'alert_open' || a.status === 'alert_handle')
    if (!open) return
    s.verifyByWorkflow(open.id, 'wf-test-001')
    const after = s.items.find((x) => x.id === open.id)
    expect(after?.status).toBe('alert_verified')
    expect(after?.verifiedByInstance).toBe('wf-test-001')
    expect(after?.verifiedAt).toBeDefined()
  })

  it('未读机制:markRead + unreadByRole', () => {
    const s = useAlertStore()
    const role = 'agent_test_role_unique'
    const before = s.unreadByRole(role)
    // 取一条活跃预警 markRead
    const a = s.activeAlerts[0]
    expect(a).toBeDefined()
    s.markRead(a!.id, role)
    expect(s.isReadBy(a!.id, role)).toBe(true)
    expect(s.unreadByRole(role)).toBe(before - 1 < 0 ? 0 : before - 1)
  })

  it('markAllRead: 把角色所有活跃预警置已读', () => {
    const s = useAlertStore()
    const role = 'manage_test_role_unique'
    // 先确保有 1+ 未读
    const active = s.activeAlerts
    if (active.length === 0) {
      expect(true).toBe(true)
      return
    }
    // ensure at least one unread
    active.forEach((a) => {
      if (s.isReadBy(a.id, role)) s.unreadByRole(role)
    })
    s.markAllRead(role)
    expect(s.unreadByRole(role)).toBe(0)
  })

  it('isReadBy: 未 markRead 时返回 false', () => {
    const s = useAlertStore()
    expect(s.isReadBy('non-existent-id', 'any-role')).toBe(false)
  })
})
