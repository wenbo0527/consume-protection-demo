// format 单测
import { describe, it, expect } from 'vitest'
import { formatMoney, formatDate, fromNow, generateId, nowStr } from './format'

describe('format util', () => {
  it('formatMoney: 带 ¥ 符号', () => {
    expect(formatMoney(1234.5)).toBe('¥1,234.50')
    expect(formatMoney(0)).toBe('¥0.00')
  })

  it('formatMoney: 不带符号', () => {
    expect(formatMoney(1234.5, false)).toBe('1,234.50')
  })

  it('formatDate: 接受 string / Date', () => {
    expect(formatDate('2026-07-15')).toBe('2026-07-15 00:00')
    expect(formatDate('2026-07-15T14:00', 'YYYY-MM-DD')).toBe('2026-07-15')
  })

  it('fromNow: 各种时间格式', () => {
    const now = new Date().toISOString()
    expect(fromNow(now)).toBe('刚刚')
  })

  it('generateId: 格式 PREFIX-YYYYMMDD-XXXX(4 位)', () => {
    const id = generateId('BA')
    expect(id).toMatch(/^BA-\d{8}-\d{4}$/)
  })

  it('generateId: 不同 prefix', () => {
    expect(generateId('WF').startsWith('WF-')).toBe(true)
    expect(generateId('IN').startsWith('IN-')).toBe(true)
  })

  it('generateId: randomLen 自定义', () => {
    const id = generateId('TEST', 6)
    expect(id).toMatch(/^TEST-\d{8}-\d{6}$/)
  })

  it('nowStr: 当前时间 YYYY-MM-DD HH:mm', () => {
    const s = nowStr()
    expect(s).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  })
})
