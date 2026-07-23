// 影响分析单测
// 验证:工单.status 等于 transition.from 且 != closed 时,该 transition 会影响这张工单

import { describe, it, expect } from 'vitest'
import type { StateMachine } from './ticket-machine'
import { DEFAULT_V2_MACHINE } from './machine-defaults'
import { tickets as mockTickets } from '@/mock/data'

interface ImpactRow {
  stateId: string
  count: number
}

/** 状态影响统计 */
function statusImpactRows(machine: StateMachine): ImpactRow[] {
  return machine.states.map((s) => ({
    stateId: s.id,
    count: mockTickets.filter((t) => t.status === s.id && t.status !== 'closed').length
  }))
}

/** 流转影响工单数 */
function impactForTransition(transitionId: string, machine: StateMachine): number {
  const t = machine.transitions.find((x) => x.id === transitionId)
  if (!t) return 0
  return mockTickets.filter((tk) => tk.status === t.from && tk.status !== 'closed').length
}

describe('影响分析', () => {
  it('statusImpactRows 覆盖 V2 所有状态', () => {
    const rows = statusImpactRows(DEFAULT_V2_MACHINE)
    expect(rows.length).toBe(DEFAULT_V2_MACHINE.states.length)
    // 每行有合法 stateId
    rows.forEach((r) => {
      expect(DEFAULT_V2_MACHINE.states.find((s) => s.id === r.stateId)).toBeDefined()
    })
  })

  it('总进行中工单数 等于 mockTickets 中非 closed 的数量', () => {
    const expected = mockTickets.filter((t) => t.status !== 'closed').length
    const rows = statusImpactRows(DEFAULT_V2_MACHINE)
    const total = rows.reduce((s, r) => s + r.count, 0)
    expect(total).toBe(expected)
  })

  it('closed 状态的影响数为 0(工单不属于"进行中")', () => {
    const n = impactForTransition('t.close', DEFAULT_V2_MACHINE)
    // t.close: closing -> closed,统计 closing 状态的非 closed 工单
    // 我们的计算只看 status != 'closed',所以 closing 工单仍计入
    // 这符合预期:即使是"待关单"工单,关单规则改变也会影响
    const closingCount = mockTickets.filter((t) => (t.status as string) === 'closing' && (t.status as string) !== 'closed').length
    expect(n).toBe(closingCount)
  })

  it('不存在的 transition 返回 0', () => {
    expect(impactForTransition('not-exist', DEFAULT_V2_MACHINE)).toBe(0)
  })

  it('受理规则(agent_accept)影响的工单数等于 todo 状态工单数', () => {
    const n = impactForTransition('t.accept', DEFAULT_V2_MACHINE)
    const todoCount = mockTickets.filter((t) => (t.status as string) === 'todo' && (t.status as string) !== 'closed').length
    expect(n).toBe(todoCount)
  })
})
