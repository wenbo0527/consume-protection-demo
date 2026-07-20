// 审查 store 测试
import { describe, it, expect } from 'vitest'
import { useReviewStore, StandardSource } from './review'

describe('useReviewStore', () => {
  it('addStandard + source 分类', () => {
    const s = useReviewStore()
    s.standards.length = 0
    const std = s.add({
      category: '产品审查',
      item: '测试标准',
      basis: '依据',
      required: true,
      source: 'manual' as StandardSource,
      author: 'test'
    })
    expect(std.id).toBeDefined()
    expect(std.source).toBe('manual')
  })

  it('generateFromRectify: source=rectify', () => {
    const s = useReviewStore()
    s.standards.length = 0
    const std = s.generateFromRectify({
      category: '运营审查',
      item: '来源于整改',
      basis: '整改沉淀',
      required: true,
      author: 'test',
      rectifyTaskId: 'RT-001',
      rectifyReportId: 'RP-001'
    })
    expect(std.source).toBe('rectify')
    expect(std.rectifyTaskId).toBe('RT-001')
    expect(std.rectifyReportId).toBe('RP-001')
  })

  it('seed + add 重复 source', () => {
    const s = useReviewStore()
    s.standards.length = 0
    const std = s.add({
      category: 't',
      item: 't',
      basis: 't',
      required: false,
      source: 'system',
      author: 't'
    })
    expect(s.standards.length).toBe(1)
    // store 没 remove action 但 add 重复也 OK
    const std2 = s.add({
      category: 't',
      item: 't2',
      basis: 't',
      required: false,
      source: 'system',
      author: 't'
    })
    expect(std.id).not.toBe(std2.id)
    expect(s.standards.length).toBe(2)
  })

  it('bySource 计数器(返回 map)', () => {
    const s = useReviewStore()
    s.standards.length = 0
    s.add({ category: 'a', item: 't', basis: 'b', required: false, source: 'manual', author: 'x' })
    s.add({ category: 'a', item: 't2', basis: 'b2', required: true, source: 'system', author: 'x' })
    // bySource 返回 { manual: 1, system: 1, ... } 形式 map
    const map = s.bySource
    expect(map.manual).toBe(1)
    expect(map.system).toBe(1)
  })

  it('rectifyStandards 过滤 source=rectify', () => {
    const s = useReviewStore()
    s.standards.length = 0
    s.generateFromRectify({
      category: 'c',
      item: 't',
      basis: 'd',
      required: false,
      author: 'x',
      rectifyTaskId: 'RT-002',
      rectifyReportId: 'RP-002'
    })
    expect(s.rectifyStandards.length).toBe(1)
  })
})
