// 标签规则 store 测试
import { describe, it, expect } from 'vitest'
import { useTagRuleStore } from './tagRule'

describe('useTagRuleStore', () => {
  it('evaluate: 用真实规则里的 threat / blacklist 标签', () => {
    const s = useTagRuleStore()
    const result = s.applyToCustomer(['threat', 'blacklist'])
    // hitRules 一定有,firstAlert 一定 not null
    expect(result.hitRules.length).toBeGreaterThan(0)
    expect(result.firstAlert).not.toBeNull()
  })

  it('firstAlert 返回 type / title / actions', () => {
    const s = useTagRuleStore()
    const alert = s.firstAlert(['threat'])
    expect(alert).toHaveProperty('type')
    expect(alert).toHaveProperty('title')
    expect(alert).toHaveProperty('actions')
    expect(Array.isArray(alert?.actions)).toBe(true)
  })

  it('rules seed 数据完整性', () => {
    const s = useTagRuleStore()
    expect(s.rules.length).toBeGreaterThan(0)
    s.rules.forEach((r) => {
      expect(r).toHaveProperty('name')
      expect(r).toHaveProperty('tags')
      expect(r).toHaveProperty('actions')
      expect(Array.isArray(r.tags)).toBe(true)
      expect(Array.isArray(r.actions)).toBe(true)
    })
  })

  it('firstAlert 空标签 → null', () => {
    const s = useTagRuleStore()
    expect(s.firstAlert([])).toBeNull()
  })

  it('enabled 为 false 时该规则不命中', () => {
    const s = useTagRuleStore()
    const first = s.rules[0]
    if (!first) return
    const orig = first.enabled
    first.enabled = false
    const result = s.applyToCustomer(first.tags)
    first.enabled = orig
    const ids = result.hitRules.map((r) => r.ruleId)
    expect(ids).not.toContain(first.id)
  })

  it('updateRule / 持久化', () => {
    const s = useTagRuleStore()
    const first = s.rules[0]
    if (!first) return
    const origName = first.name
    s.updateRule(first.id, { name: 'MUTATED' })
    expect(s.rules.find((r) => r.id === first.id)?.name).toBe('MUTATED')
    s.updateRule(first.id, { name: origName }) // 还原
  })
})
