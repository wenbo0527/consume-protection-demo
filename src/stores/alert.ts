// 预警 store
// 从 mock/data.ts 接管 alerts 数据,提供 updateStatus 等动作
// 替代"业务 store 直接 mutate mock 数组"的反模式

import { defineStore } from 'pinia'
import { alerts as mockAlerts, AlertItem } from '../mock/data'

const STORAGE_KEY = 'cp_alerts_data'

function log(level: 'log' | 'warn', tag: string, msg: string, extra?: unknown) {
  // eslint-disable-next-line no-console
  if (extra !== undefined) console[level](`[cp-alert][${tag}] ${msg}`, extra)
  else
    // eslint-disable-next-line no-console
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

const READ_STORAGE_KEY = 'cp_alert_read_roles'
/** 已读集合 { alertId: { role: true } } */
function loadReadRoles(): Record<string, Record<string, boolean>> {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY)
    if (raw) {
      const o = JSON.parse(raw)
      if (o && typeof o === 'object') return o
    }
  } catch {
    /* ignore */
  }
  return {}
}
function saveReadRoles(map: Record<string, Record<string, boolean>>) {
  try {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(map))
  } catch (e) {
    log('warn', 'save', 'write readRoles localStorage failed', e)
  }
}

export const useAlertStore = defineStore('alert', {
  state: () => ({
    items: loadPersisted() as AlertItem[],
    readRoles: loadReadRoles() as Record<string, Record<string, boolean>>
  }),
  getters: {
    /** 全部 open / handle / upgrade 状态都算"活跃" */
    activeAlerts: (s) => s.items.filter((a) => ['alert_open', 'alert_handle', 'alert_upgrade'].includes(a.status)),
    openCount: (s) => s.items.filter((a) => a.status === 'alert_open').length,
    handleCount: (s) => s.items.filter((a) => a.status === 'alert_handle').length,
    verifiedCount: (s) => s.items.filter((a) => a.status === 'alert_verified').length,
    /** 当前角色未读预警数 */
    unreadCountForCurrentRole(): number {
      // 不能直接引 user store(循环),由组件层传入 role 计算
      return 0
    }
  },
  actions: {
    persist() {
      savePersisted(this.items)
    },
    persistRead() {
      saveReadRoles(this.readRoles)
    },

    /** 计算某角色某 alert 是否已读 */
    isReadBy(id: string, role: string): boolean {
      return !!this.readRoles[id]?.[role]
    },

    /** 给某角色的某预警标已读 */
    markRead(id: string, role: string) {
      if (!this.readRoles[id]) this.readRoles[id] = {}
      this.readRoles[id][role] = true
      log('log', 'read', `${id} <- ${role}`)
      this.persistRead()
    },

    /** 给某角色批量标所有活跃预警已读 */
    markAllRead(role: string) {
      this.activeAlerts.forEach((a) => {
        if (!this.readRoles[a.id]) this.readRoles[a.id] = {}
        this.readRoles[a.id][role] = true
      })
      log('log', 'read-all', `${role} clear unread`)
      this.persistRead()
    },

    /** 计算指定角色的未读数 */
    unreadByRole(role: string): number {
      return this.activeAlerts.filter((a) => !this.isReadBy(a.id, role)).length
    },

    /** 通用:更新某条预警的状态 */
    updateStatus(id: string, status: AlertItem['status'], extra?: Partial<AlertItem>) {
      const a = this.items.find((x) => x.id === id)
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
