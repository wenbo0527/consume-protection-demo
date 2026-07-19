// 通话队列 store(OPT-FIX P2-10 + P3-3 共享)
// 提供来电队列 + 坐席负载 + 抢单/自动分单策略

import { defineStore } from 'pinia'

export type CallPriority = 'urgent' | 'high' | 'normal' | 'low'
export type CallStatus = 'waiting' | 'assigned' | 'connected' | 'finished' | 'dropped'
export type AgentLoadStatus = 'online' | 'busy' | 'offline'

export interface CallQueueEntry {
  id: string                     // CALL-20260715-0001
  customerId: string
  customerName: string
  channel: '电话' | '微信' | '邮件' | '12345'
  priority: CallPriority
  status: CallStatus
  queuedAt: string
  assignedAgentId?: string
  assignedAt?: string
  connectedAt?: string
  finishedAt?: string
}

export interface CallAgent {
  id: string                     // 与 useOpsStore 中的 agent.id 不同,callQueue 独立
  name: string
  status: AgentLoadStatus
  currentLoad: number            // 当前通话数(同时只能 1)
  maxConcurrent: number
  avgHandleSeconds: number
  skillTags: string[]
}

const STORAGE_KEY = 'cp_call_queue_data'

interface PersistedState {
  entries: CallQueueEntry[]
  agents: CallAgent[]
}

function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (arr && Array.isArray(arr.entries)) return arr
    }
  } catch { /* 静默 */ }
  return buildSeed()
}

function savePersisted(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* 静默 */ }
}

function buildSeed(): PersistedState {
  return {
    entries: [
      {
        id: 'CALL-20260715-0001',
        customerId: 'C003',
        customerName: '周志远',
        channel: '电话',
        priority: 'urgent',
        status: 'waiting',
        queuedAt: '2026-07-15 15:20'
      },
      {
        id: 'CALL-20260715-0002',
        customerId: 'C002',
        customerName: '孙丽华',
        channel: '12345',
        priority: 'high',
        status: 'assigned',
        queuedAt: '2026-07-15 14:50',
        assignedAgentId: '张敏',
        assignedAt: '2026-07-15 14:55'
      }
    ],
    agents: [
      { id: 'A001', name: '张敏', status: 'online', currentLoad: 1, maxConcurrent: 1, avgHandleSeconds: 480, skillTags: ['电话', '投诉'] },
      { id: 'A002', name: '王浩', status: 'online', currentLoad: 0, maxConcurrent: 1, avgHandleSeconds: 360, skillTags: ['电话', '在线客服'] },
      { id: 'A003', name: '赵雪', status: 'busy',   currentLoad: 1, maxConcurrent: 1, avgHandleSeconds: 420, skillTags: ['12345', '在线客服'] }
    ]
  }
}

function nowStr() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const useCallQueueStore = defineStore('callQueue', {
  state: () => {
    const init = loadPersisted()
    return {
      entries: init.entries as CallQueueEntry[],
      agents: init.agents as CallAgent[]
    }
  },
  getters: {
    waiting: (s) => s.entries.filter(e => e.status === 'waiting'),
    onlineAgents: (s) => s.agents.filter(a => a.status === 'online')
  },
  actions: {
    persist() {
      savePersisted({ entries: this.entries, agents: this.agents })
    },

    /**
     * 新来电入队
     * 自动按优先级 urgent → 自动分单给负载最低的空闲坐席(负载 ≤ 8)
     * 其他优先级 → 保持 waiting,等坐席抢单
     */
    incomingCall(input: Omit<CallQueueEntry, 'id' | 'status' | 'queuedAt'>): CallQueueEntry {
      const id = `CALL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`
      const entry: CallQueueEntry = {
        ...input,
        id,
        status: 'waiting',
        queuedAt: nowStr()
      }
      this.entries.push(entry)

      // urgent 自动分配
      if (entry.priority === 'urgent') {
        const target = this.agents
          .filter(a => a.status === 'online' && a.currentLoad < a.maxConcurrent)
          .sort((a, b) => a.currentLoad - b.currentLoad)[0]
        if (target) this.assignToAgent(entry.id, target.id)
      }

      this.persist()
      return entry
    },

    /** 手动/自动分配给坐席 */
    assignToAgent(entryId: string, agentId: string): boolean {
      const e = this.entries.find(x => x.id === entryId)
      const a = this.agents.find(x => x.id === agentId)
      if (!e || !a) return false
      if (e.status !== 'waiting') return false
      e.status = 'assigned'
      e.assignedAgentId = a.name
      e.assignedAt = nowStr()
      a.status = 'busy'
      a.currentLoad += 1
      this.persist()
      return true
    },

    /** 接通 */
    markConnected(entryId: string): boolean {
      const e = this.entries.find(x => x.id === entryId)
      if (!e || e.status !== 'assigned') return false
      e.status = 'connected'
      e.connectedAt = nowStr()
      this.persist()
      return true
    },

    /** 挂断 */
    markFinished(entryId: string): boolean {
      const e = this.entries.find(x => x.id === entryId)
      if (!e) return false
      e.status = 'finished'
      e.finishedAt = nowStr()
      // 释放坐席
      const a = this.agents.find(x => x.name === e.assignedAgentId)
      if (a && a.currentLoad > 0) {
        a.currentLoad -= 1
        if (a.currentLoad === 0) a.status = 'online'
      }
      this.persist()
      return true
    },

    /** 移除 */
    remove(entryId: string): boolean {
      const idx = this.entries.findIndex(e => e.id === entryId)
      if (idx === -1) return false
      this.entries.splice(idx, 1)
      this.persist()
      return true
    },

    /** 模拟新来电(测试用) */
    tickSimulation() {
      const customers = [
        { id: 'C001', name: '刘建国', priority: 'normal' as CallPriority },
        { id: 'C002', name: '孙丽华', priority: 'high' as CallPriority },
        { id: 'C003', name: '周志远', priority: 'urgent' as CallPriority },
        { id: 'C004', name: '吴芳', priority: 'normal' as CallPriority },
        { id: 'C005', name: '陈伟', priority: 'low' as CallPriority },
        { id: 'C006', name: '赵建国', priority: 'high' as CallPriority }
      ]
      const c = customers[Math.floor(Math.random() * customers.length)]
      const ch: CallQueueEntry['channel'] = (['电话', '微信', '12345', '邮件'] as const)[Math.floor(Math.random() * 4)] as any
      this.incomingCall({
        customerId: c.id,
        customerName: c.name,
        channel: ch,
        priority: c.priority
      })
    }
  }
})
