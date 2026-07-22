// 通话队列 store(OPT-FIX P2-10 + P3-3 共享)
// 提供来电队列 + 坐席负载 + 抢单/自动分单策略
// v3 新增:未接/拒绝/超时打标 + 自动生成回访工单

import { defineStore } from 'pinia'
import { generateId } from '@/utils/format'
import { useWorkflowStore } from './workflow'

export type CallPriority = 'urgent' | 'high' | 'normal' | 'low'
export type CallStatus = 'waiting' | 'assigned' | 'connected' | 'finished' | 'dropped'
export type AgentLoadStatus = 'online' | 'busy' | 'offline'

/** v3 新增:打标类型 */
export type TagType = 'missed' | 'rejected' | 'timeout'
/** v3 新增:打标原因(枚举 + 自定义) */
export type TagReason = 'busy' | 'away' | 'wrong_number' | 'other'

export interface CallQueueEntry {
  id: string // CALL-20260715-0001
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
  /** v3 新增:打标状态(未接/拒绝/超时) */
  taggedStatus?: TagType
  /** v3 新增:打标原因(枚举值或自定义文本) */
  taggedReason?: string
  /** v3 新增:打标时间 */
  taggedAt?: string
  /** v3 新增:坐席响应时长(秒),用于质检/绩效统计 */
  responseTimeSec?: number
}

export interface CallAgent {
  id: string // 与 useOpsStore 中的 agent.id 不同,callQueue 独立
  name: string
  status: AgentLoadStatus
  currentLoad: number // 当前通话数(同时只能 1)
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
  } catch {
    /* 静默 */
  }
  return buildSeed()
}

function savePersisted(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* 静默 */
  }
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
      {
        id: 'A001',
        name: '张敏',
        status: 'online',
        currentLoad: 1,
        maxConcurrent: 1,
        avgHandleSeconds: 480,
        skillTags: ['电话', '投诉']
      },
      {
        id: 'A002',
        name: '王浩',
        status: 'online',
        currentLoad: 0,
        maxConcurrent: 1,
        avgHandleSeconds: 360,
        skillTags: ['电话', '在线客服']
      },
      {
        id: 'A003',
        name: '赵雪',
        status: 'busy',
        currentLoad: 1,
        maxConcurrent: 1,
        avgHandleSeconds: 420,
        skillTags: ['12345', '在线客服']
      }
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
    waiting: (s) => s.entries.filter((e) => e.status === 'waiting'),
    onlineAgents: (s) => s.agents.filter((a) => a.status === 'online')
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
      const id = generateId('CALL')
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
          .filter((a) => a.status === 'online' && a.currentLoad < a.maxConcurrent)
          .sort((a, b) => a.currentLoad - b.currentLoad)[0]
        if (target) this.assignToAgent(entry.id, target.id)
      }

      this.persist()
      return entry
    },

    /** 手动/自动分配给坐席 */
    assignToAgent(entryId: string, agentId: string): boolean {
      const e = this.entries.find((x) => x.id === entryId)
      const a = this.agents.find((x) => x.id === agentId)
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
      const e = this.entries.find((x) => x.id === entryId)
      if (!e || e.status !== 'assigned') return false
      e.status = 'connected'
      e.connectedAt = nowStr()
      this.persist()
      return true
    },

    /** 挂断 */
    markFinished(entryId: string): boolean {
      const e = this.entries.find((x) => x.id === entryId)
      if (!e) return false
      e.status = 'finished'
      e.finishedAt = nowStr()
      // 释放坐席
      const a = this.agents.find((x) => x.name === e.assignedAgentId)
      if (a && a.currentLoad > 0) {
        a.currentLoad -= 1
        if (a.currentLoad === 0) a.status = 'online'
      }
      this.persist()
      return true
    },

    /** 移除 */
    remove(entryId: string): boolean {
      const idx = this.entries.findIndex((e) => e.id === entryId)
      if (idx === -1) return false
      this.entries.splice(idx, 1)
      this.persist()
      return true
    },

    /** ============ v3 新增:未接听打标 ============
     * 坐席手动标记:客户来电但未接听
     * 自动联动:生成回访工单(callback 工作流),落到坐席外呼待办
     */
    markMissed(entryId: string, reason: string): { ok: boolean; callbackInstanceId?: string } {
      const e = this.entries.find((x) => x.id === entryId)
      if (!e) return { ok: false }
      const taggedAt = nowStr()
      const responseTimeSec = e.connectedAt
        ? Math.floor((new Date(taggedAt).getTime() - new Date(e.connectedAt).getTime()) / 1000)
        : undefined
      e.taggedStatus = 'missed'
      e.taggedReason = reason
      e.taggedAt = taggedAt
      e.responseTimeSec = responseTimeSec
      e.status = 'finished' // 未接 → 移出待处理池(保留记录)
      this.persist()
      const inst = this._createCallbackInstance(e, 'missed', reason)
      return { ok: true, callbackInstanceId: inst?.id }
    },

    /** ============ v3 新增:拒绝打标 ============
     * 坐席主动拒接,需填原因(弹窗强制填)
     */
    markRejected(entryId: string, reason: string): { ok: boolean; callbackInstanceId?: string } {
      const e = this.entries.find((x) => x.id === entryId)
      if (!e) return { ok: false }
      const taggedAt = nowStr()
      e.taggedStatus = 'rejected'
      e.taggedReason = reason
      e.taggedAt = taggedAt
      e.status = 'finished'
      this.persist()
      const inst = this._createCallbackInstance(e, 'rejected', reason)
      return { ok: true, callbackInstanceId: inst?.id }
    },

    /** ============ v3 新增:超时自动打标 ============
     * 系统自动触发:来电后 5 秒未接听
     * 响应时长固定传 5(秒)
     */
    markTimeout(entryId: string, responseTimeSec = 5): { ok: boolean; callbackInstanceId?: string } {
      const e = this.entries.find((x) => x.id === entryId)
      if (!e) return { ok: false }
      const taggedAt = nowStr()
      e.taggedStatus = 'timeout'
      e.taggedReason = `坐席 ${responseTimeSec} 秒内未接听(系统自动)`
      e.taggedAt = taggedAt
      e.responseTimeSec = responseTimeSec
      e.status = 'finished'
      this.persist()
      const inst = this._createCallbackInstance(e, 'timeout', e.taggedReason)
      return { ok: true, callbackInstanceId: inst?.id }
    },

    /** 私有:为来电打标后,自动创建一条 callback 工作流实例(回访工单) */
    _createCallbackInstance(
      e: CallQueueEntry,
      tagType: TagType,
      reason: string
    ): { id: string } | null {
      try {
        const wf = useWorkflowStore()
        const inst = wf.start({
          kind: 'callback',
          initiator: '系统(来电打标联动)',
          initiatorRole: 'agent',
          customerId: e.customerId,
          customerName: e.customerName,
          payload: {
            tagType,
            tagReason: reason,
            fromCallId: e.id
          }
        })
        return inst ? { id: inst.id } : null
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[cp-call-queue] create callback workflow failed', err)
        return null
      }
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
      const ch: CallQueueEntry['channel'] = (['电话', '微信', '12345', '邮件'] as const)[
        Math.floor(Math.random() * 4)
      ] as any
      this.incomingCall({
        customerId: c.id,
        customerName: c.name,
        channel: ch,
        priority: c.priority
      })
    }
  }
})
