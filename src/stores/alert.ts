// 预警 store
// 从 mock/data.ts 接管 alerts 数据,提供 updateStatus 等动作
// 替代"业务 store 直接 mutate mock 数组"的反模式

import { defineStore } from 'pinia'
import { alerts as mockAlerts, AlertItem } from '../mock/data'

const STORAGE_KEY = 'cp_alerts_data'

function log(level: 'log' | 'warn', tag: string, msg: string, extra?: unknown) {
  // eslint-disable-next-line no-console
  if (extra !== undefined) console[level](`[cp-alert][${tag}] ${msg}`, extra)
  else // eslint-disable-next-line no-console
    console[level](`[cp-alert][${tag}] ${msg}`)
}

function nowStr() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function loadPersisted(): AlertItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) return arr
    }
  } catch (e) {
    log('warn', 'load', 'parse localStorage failed', e)
  }
  // 拷贝而非引用,避免外部直接 mutate mock 数组
  return JSON.parse(JSON.stringify(mockAlerts))
}

function savePersisted(alerts: AlertItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts))
  } catch (e) {
    log('warn', 'save', 'write localStorage failed', e)
  }
}

export const useAlertStore = defineStore('alert', {
  state: () => ({
    items: loadPersisted() as AlertItem[]
  }),
  getters: {
    openCount: (s) => s.items.filter(a => a.status === 'alert_open').length,
    handleCount: (s) => s.items.filter(a => a.status === 'alert_handle').length,
    verifiedCount: (s) => s.items.filter(a => a.status === 'alert_verified').length
  },
  actions: {
    persist() {
      savePersisted(this.items)
    },

    /** 通用:更新某条预警的状态 */
    updateStatus(id: string, status: AlertItem['status'], extra?: Partial<AlertItem>) {
      const a = this.items.find(x => x.id === id)
      if (!a) {
        log('warn', 'update', `alert ${id} not found`)
        return
      }
      a.status = status
      if (status === 'alert_verified') {
        a.verifiedAt = nowStr()
      }
      if (extra) Object.assign(a, extra)
      log('log', 'update', `${id} -> ${status}`)
      this.persist()
    },

    /** 由工作流回调:坐席执行后自动标记预警已验证 */
    verifyByWorkflow(id: string, instanceId: string) {
      this.updateStatus(id, 'alert_verified', { verifiedByInstance: instanceId })
    }
  }
})