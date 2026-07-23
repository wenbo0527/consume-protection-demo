// 名单管理 store:黑名单 / 投诉信息库 / 异常代理库
// 1. 持久化到 localStorage
// 2. 增/删/续期/批量导入 actions
// 3. 按 type 过滤的 getter
// 4. 删除走 store 而不是直接改 mock(原断点)

import { defineStore } from 'pinia'
import { blackList, type BlackListItem } from '@/mock/data'

export type ListType = 'blacklist' | 'complaintDB' | 'abnormalAgent'

const STORAGE_KEY = 'cp_list_data'

function log(level: 'log' | 'warn', tag: string, msg: string, extra?: unknown) {
  const line = `[cp-list][${tag}] ${msg}`
  // eslint-disable-next-line no-console
  if (extra !== undefined) console[level](line, extra)
  else {
    // eslint-disable-next-line no-console
    console[level](line)
  }
}

function loadPersisted(): BlackListItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr) && arr.length > 0) return arr
    }
  } catch (e) {
    log('warn', 'load', 'parse localStorage failed', e)
  }
  // 深拷贝(避免外部修改影响 store)
  return JSON.parse(JSON.stringify(blackList))
}

function savePersisted(items: BlackListItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (e) {
    log('warn', 'save', 'write localStorage failed', e)
  }
}

function nowDate() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function genId() {
  const n = Math.floor(Math.random() * 9000) + 1000
  return `BL-${nowDate().replace(/-/g, '')}-${n}`
}

export const useListStore = defineStore('list', {
  state: () => ({
    items: loadPersisted() as BlackListItem[]
  }),
  getters: {
    byType: (s) => (type: ListType) => s.items.filter((i) => i.type === type),
    count: (s) => ({
      blacklist: s.items.filter((i) => i.type === 'blacklist').length,
      complaintDB: s.items.filter((i) => i.type === 'complaintDB').length,
      abnormalAgent: s.items.filter((i) => i.type === 'abnormalAgent').length
    })
  },
  actions: {
    persist() {
      savePersisted(this.items)
    },
    add(input: Omit<BlackListItem, 'id' | 'effectiveAt' | 'expireAt' | 'status'> & {
      expireAt?: string
      isPermanent?: boolean
    }) {
      const id = genId()
      const item: BlackListItem = {
        ...input,
        id,
        effectiveAt: nowDate(),
        expireAt: input.expireAt ?? '永久',
        isPermanent: input.isPermanent ?? false,
        status: 'active'
      }
      this.items.push(item)
      log('log', 'add', id, item.name)
      this.persist()
      return item
    },
    /** 续期:N 天,重新计算 expireAt */
    renew(id: string, days: number) {
      const item = this.items.find((i) => i.id === id)
      if (!item) return
      if (item.isPermanent) {
        // 永久生效:不需要续期,直接提示
        return
      }
      const base = new Date()
      base.setDate(base.getDate() + days)
      const pad = (n: number) => String(n).padStart(2, '0')
      item.expireAt = `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`
      item.status = 'active'
      log('log', 'renew', id, days)
      this.persist()
      return item
    },
    /**
     * 删除走审批流
     * - 发起 alert_directive 工作流给消保管理层确认
     * - 审批通过后真正删除
     * 注意:此函数返回审批请求 ID,不立即删除
     */
    requestRemove(id: string) {
      const item = this.items.find((i) => i.id === id)
      if (!item) return null
      log('log', 'requestRemove', id, item.name)
      // 真实流程:此处应启动工作流,审批通过后再 remove
      // 此 demo 直接返回删除请求 ID;UI 层应调用 workflowStore.start 后再决定是否删
      return { id, reason: `${item.name} 删除审批请求`, operator: '陈强(管理)' }
    },
    /** 真正删除(审批通过后由工作流回调触发) */
    remove(id: string) {
      this.items = this.items.filter((i) => i.id !== id)
      log('log', 'remove', id)
      this.persist()
    },
    /** 批量导入(JSON 数组) */
    bulkImport(rows: Array<Omit<BlackListItem, 'id' | 'effectiveAt' | 'status'>>) {
      let inserted = 0
      rows.forEach((r) => {
        const item: BlackListItem = {
          ...r,
          id: genId(),
          effectiveAt: nowDate(),
          status: 'active'
        }
        this.items.push(item)
        inserted++
      })
      log('log', 'bulkImport', `inserted=${inserted}`)
      this.persist()
      return inserted
    },
    /** 编辑条目 */
    update(id: string, patch: Partial<BlackListItem>) {
      const item = this.items.find((i) => i.id === id)
      if (!item) return
      Object.assign(item, patch)
      log('log', 'update', id)
      this.persist()
    }
  }
})
