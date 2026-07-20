// workflow-helpers 单测
import { describe, it, expect } from 'vitest'
import { mapInstanceStatus, mapInstanceStatusColor, mapInstanceStatusLabel, mapNodeName } from './workflow-helpers'

describe('workflow-helpers', () => {
  it('mapInstanceStatus:5 个标准状态', () => {
    expect(mapInstanceStatus('running')).toEqual({ label: '审批中', color: 'arcoblue' })
    expect(mapInstanceStatus('approved')).toEqual({ label: '已审批', color: 'green' })
    expect(mapInstanceStatus('rejected')).toEqual({ label: '已驳回', color: 'red' })
    expect(mapInstanceStatus('expired')).toEqual({ label: '已超时', color: 'orange' })
    expect(mapInstanceStatus('finished')).toEqual({ label: '已完成', color: 'gray' })
  })

  it('mapInstanceStatus:未知 status → gray 兜底', () => {
    expect(mapInstanceStatus('unknown-xyz')).toEqual({ label: 'unknown-xyz', color: 'gray' })
  })

  it('mapInstanceStatusColor / Label:独立函数', () => {
    expect(mapInstanceStatusColor('running')).toBe('arcoblue')
    expect(mapInstanceStatusLabel('running')).toBe('审批中')
    expect(mapInstanceStatusColor('nope')).toBe('gray')
    expect(mapInstanceStatusLabel('nope')).toBe('nope')
  })

  it('mapNodeName:9 个节点 code', () => {
    expect(mapNodeName('apply')).toBe('申请')
    expect(mapNodeName('approve')).toBe('审批')
    expect(mapNodeName('execute')).toBe('执行')
    expect(mapNodeName('notify')).toBe('通知')
    expect(mapNodeName('auto')).toBe('自动')
    expect(mapNodeName('archive')).toBe('归档')
    expect(mapNodeName('sync')).toBe('同步')
    expect(mapNodeName('effective')).toBe('生效')
    expect(mapNodeName('submit')).toBe('受理')
  })

  it('mapNodeName:未知 code 透传', () => {
    expect(mapNodeName('xxx')).toBe('xxx')
  })
})
