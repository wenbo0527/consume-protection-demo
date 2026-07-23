// 满意度评价 store(管理层视角)
// 1. 客户在工单关单后提交满意度
// 2. 管理层查看、打标回退工单、追访

import { defineStore } from 'pinia'
import { mockFeedbacks, type FeedbackItem } from '@/mock/feedback'

const STORAGE_KEY = 'cp_feedback_data'

function log(level: 'log' | 'warn', tag: string, msg: string, extra?: unknown) {
  const line = `[cp-feedback][${tag}] ${msg}`
  // eslint-disable-next-line no-console
  if (extra !== undefined) console[level](line, extra)
  else {
    // eslint-disable-next-line no-console
    console[level](line)
  }
}

function loadPersisted(): FeedbackItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr) && arr.length > 0) return arr
    }
  } catch (e) {
    log('warn', 'load', 'parse localStorage failed', e)
  }
  return JSON.parse(JSON.stringify(mockFeedbacks))
}

function savePersisted(items: FeedbackItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (e) {
    log('warn', 'save', 'write localStorage failed', e)
  }
}

export const useFeedbackStore = defineStore('feedback', {
  state: () => ({
    items: loadPersisted() as FeedbackItem[]
  }),
  getters: {
    /** 不满意(rating <= 2) */
    bad: (s) => s.items.filter((i) => i.rating <= 2),
    /** 差评率(最近 7 天) */
    badRate7d: (s) => {
      const list = s.items
      const total = list.length || 1
      return Math.round((list.filter((i) => i.rating <= 2).length / total) * 100)
    },
    /** 满意(>= 4) */
    good: (s) => s.items.filter((i) => i.rating >= 4),
    /** 已追访 */
    followedUp: (s) => s.items.filter((i) => i.followedUp),
    /** 平均分 */
    avgRating: (s) => {
      if (s.items.length === 0) return 0
      const sum = s.items.reduce((a, b) => a + b.rating, 0)
      return Math.round((sum / s.items.length) * 10) / 10
    }
  },
  actions: {
    persist() {
      savePersisted(this.items)
    },
    /** 标记追访 */
    markFollowedUp(id: string) {
      const fb = this.items.find((i) => i.id === id)
      if (!fb) return
      fb.followedUp = true
      log('log', 'markFollowedUp', id)
      this.persist()
    },
    /** 添加评价(客户提交) */
    add(input: Omit<FeedbackItem, 'id' | 'followedUp' | 'reverted'> & { reverted?: boolean }) {
      const id = `FB-${Date.now()}`
      const fb: FeedbackItem = {
        ...input,
        id,
        followedUp: false,
        reverted: input.reverted ?? input.rating <= 2
      }
      this.items.unshift(fb)
      log('log', 'add', `${id} ticket=${fb.ticketId} rating=${fb.rating}`)
      this.persist()
      return fb
    },
    /** 删除 */
    remove(id: string) {
      this.items = this.items.filter((i) => i.id !== id)
      log('log', 'remove', id)
      this.persist()
    }
  }
})
