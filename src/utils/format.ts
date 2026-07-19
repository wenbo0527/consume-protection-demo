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
