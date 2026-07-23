// 通用工具

export function nowIso(): string {
  return new Date().toISOString()
}

/**
 * 简易 ISO 8601 duration 解析 + 减法
 * 支持 PT4H / P7D / P1DT2H30M
 * 用于 SLA 评估
 */
export function parseIsoDuration(s: string): number {
  if (!s) return 0
  const m = s.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/)
  if (!m) return 0
  const [, d, h, mi, se] = m
  return (
    (parseInt(d || '0') * 86400 +
      parseInt(h || '0') * 3600 +
      parseInt(mi || '0') * 60 +
      parseInt(se || '0')) *
    1000
  )
}

export function formatIsoDuration(ms: number): string {
  if (ms <= 0) return 'P0D'
  const totalSec = Math.floor(ms / 1000)
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const mi = Math.floor((totalSec % 3600) / 60)
  const se = totalSec % 60
  let s = 'P'
  if (d) s += `${d}D`
  s += 'T'
  if (h) s += `${h}H`
  if (mi) s += `${mi}M`
  if (se) s += `${se}S`
  return s
}

/** 工单字段路径访问(支持 a.b.c 写法) */
export function getPath(obj: unknown, path: string): unknown {
  if (!obj) return undefined
  const parts = path.split('.')
  let cur: any = obj
  for (const p of parts) {
    if (cur == null) return undefined
    cur = cur[p]
  }
  return cur
}

export function setPath(obj: any, path: string, value: unknown): void {
  const parts = path.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]
    if (cur[p] == null || typeof cur[p] !== 'object') cur[p] = {}
    cur = cur[p]
  }
  cur[parts[parts.length - 1]] = value
}
