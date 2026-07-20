// role-name 单测
import { describe, it, expect } from 'vitest'
import { roleShortLabel, roleFullLabel, ROLE_SHORT_LABEL } from './role-name'

describe('role-name util', () => {
  it('简写映射正确(支撑岗 · 不是业务执行!)', () => {
    expect(roleShortLabel('agent')).toBe('坐席')
    expect(roleShortLabel('business')).toBe('支撑岗') // ← 不要写成"业务执行"
    expect(roleShortLabel('review')).toBe('审查人员')
    expect(roleShortLabel('manage')).toBe('管理层')
    expect(roleShortLabel('consumer')).toBe('消费者')
  })

  it('长名派生自 ROLE_LIST', () => {
    expect(roleFullLabel('business')).toBe('业务支撑岗')
    expect(roleFullLabel('agent')).toBe('一线客服坐席')
    expect(roleFullLabel('manage')).toBe('消保管理层')
  })

  it('未知 key 透传原始字符串', () => {
    expect(roleShortLabel('system')).toBe('system')
    expect(roleShortLabel('unknown')).toBe('unknown')
    expect(roleFullLabel('system')).toBe('system')
  })

  it('null / undefined 返回空串', () => {
    expect(roleShortLabel(null)).toBe('')
    expect(roleShortLabel(undefined)).toBe('')
  })

  it('ROLE_SHORT_LABEL 被冻结(防运行期修改)', () => {
    expect(() => {
      ;(ROLE_SHORT_LABEL as any).business = '篡改'
    }).toThrow()
  })
})
