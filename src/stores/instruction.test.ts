// 指令 store 测试
import { describe, it, expect } from 'vitest'
import { useInstructionStore } from './instruction'

describe('useInstructionStore', () => {
  it('create + ack + done 状态机', () => {
    const s = useInstructionStore()
    s.items.length = 0

    const inst = s.create({
      fromRole: 'manage',
      fromOperator: '陈强',
      toRole: 'agent',
      title: '安抚客户',
      content: '请尽快联系 C003 客户',
      priority: 'high',
      deadline: '2026-09-30'
    })
    expect(inst.status).toBe('pending')
    expect(inst.id).toMatch(/^IN-/)

    expect(s.ack(inst.id, '张敏')).toBe(true)
    expect(s.items.find((x) => x.id === inst.id)?.status).toBe('ack')

    expect(s.done(inst.id, '已联系客户')).toBe(true)
    expect(s.items.find((x) => x.id === inst.id)?.status).toBe('done')
  })

  it('cancel: 把 pending 改 canceled', () => {
    const s = useInstructionStore()
    s.items.length = 0
    const inst = s.create({
      fromRole: 'manage',
      fromOperator: 'X',
      toRole: 'agent',
      title: 'T',
      content: 'C',
      priority: 'low',
      deadline: '2026-12-31'
    })
    expect(s.cancel(inst.id)).toBe(true)
    expect(s.items.find((x) => x.id === inst.id)?.status).toBe('canceled')
  })

  it('add 重复创建 ID 自增', () => {
    const s = useInstructionStore()
    s.items.length = 0
    const a = s.create({
      fromRole: 'manage',
      fromOperator: 'X',
      toRole: 'agent',
      title: 'A',
      content: '',
      priority: 'low',
      deadline: '2026-12-31'
    })
    const b = s.create({
      fromRole: 'manage',
      fromOperator: 'X',
      toRole: 'agent',
      title: 'B',
      content: '',
      priority: 'low',
      deadline: '2026-12-31'
    })
    expect(a.id).not.toBe(b.id)
  })

  it('pendingCount + listForRole', () => {
    const s = useInstructionStore()
    s.items.length = 0
    s.create({
      fromRole: 'manage',
      fromOperator: 'X',
      toRole: 'agent',
      title: 'T1',
      content: 'C',
      priority: 'high',
      deadline: '2026-12-31'
    })
    s.create({
      fromRole: 'manage',
      fromOperator: 'X',
      toRole: 'agent',
      title: 'T2',
      content: 'C',
      priority: 'normal',
      deadline: '2026-12-31'
    })
    expect(s.pendingCount).toBe(2)
    expect(s.listForRole('agent').length).toBe(2)
  })
})
