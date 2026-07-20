import dayjs from 'dayjs'

export function formatMoney(n: number, withSymbol = true): string {
  const str = n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return withSymbol ? `¥${str}` : str
}

export function formatDate(d: string | Date, fmt = 'YYYY-MM-DD HH:mm'): string {
  return dayjs(d).format(fmt)
}

export function fromNow(d: string): string {
  const diff = Date.now() - new Date(d).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} 小时前`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day} 天前`
  return dayjs(d).format('YYYY-MM-DD')
}

/**
 * 生成业务 ID · 格式: PREFIX-YYYYMMDD-XXXX
 * 例如: `BA-20260720-1234`、`WF-20260720-5678`
 *
 * 之前各 store 各自复制贴过 `new Date().toISOString().slice(0,10).replace(/-/g,'')`
 * 加 4 位随机——共 6 处。现在统一收敛。
 *
 * @param prefix 业务前缀(如 'BA' / 'WF' / 'IN' / 'LV' / 'CALL' / 'BD')
 * @param randomLen 随机位数,默认 4(collision 概率足够低)
 */
export function generateId(prefix: string, randomLen = 4): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  // 用 Math.random 拼位数,通过 1000-9999 范围避免前导 0
  const base = randomLen === 4 ? 1000 : Math.pow(10, randomLen - 1)
  const rand = Math.floor(Math.random() * 9 * base) + base
  return `${prefix}-${date}-${rand}`
}

/** YYYY-MM-DD HH:mm 格式的当前时间(供各 store 复用) */
export function nowStr(fmt = 'YYYY-MM-DD HH:mm'): string {
  return dayjs().format(fmt)
}
