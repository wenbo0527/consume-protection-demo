// 指令 store(OPT-1)
// 跨角色实时指令:管理层在预警处置时下达指令 → 坐席 ack/done
// 也可用于业务执行岗 / 审查之间的指令传递

import { defineStore } from 'pinia'

// ============ 类型 ============

export type InstructionStatus = 'pending' | 'ack' | 'done' | 'expired' | 'canceled'
export type InstructionPriority = 'low' | 'normal' | 'high' | 'urgent'
/** 'manage' | 'business' | 'review' | 'agent' | 'system' */
export type InstructionRole = string

export interface Instruction {
  id: string                                     // IN-20260715-0001
  /** 下达人 */
  fromRole: InstructionRole
  fromOperator: string
  /** 接收人 - 当前按角色下发(支持全员/角色) */
  toRole: InstructionRole
  /** 也可以指定单人(可选,与 toRole 配合) */
  toOperator?: string
  title: string
  content: string
  priority: InstructionPriority
  status: InstructionStatus
  /** 关联的预警 ID(可选) */
  alertId?: string
  /** 关联的工单 ID(可选) */
  ticketId?: string
  /** 关联的清退单 ID(可选) */
  exitCaseId?: string
  /** 截止时间 */
  deadline?: string
  /** ack/done 时的时间戳 */
  ackAt?: string
  ackNote?: string
  doneAt?: string
  doneNote?: string
  createdAt: string
  updatedAt: string
}

// ============ utils ============

function nowStr() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const STORAGE_KEY = 'cp_instruction_data'

function loadPersisted(): Instruction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) return arr
    }
  } catch { /* 静默 */ }
  return buildSeed()
}

function savePersisted(items: Instruction[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch { /* 静默 */ }
}

function buildSeed(): Instruction[] {
  return [
    {
      id: 'IN-20260715-0001',
      fromRole: 'manage',
      fromOperator: '陈强',
      toRole: 'agent',
      toOperator: '张敏',
      title: '对客户 C006 严防催收红线',
      content: '客户已被列入失信 + 监管已转办。今日工单全量自查:杜绝上门、骚扰通讯录。回退到合规话术。',
      priority: 'urgent',
      status: 'pending',
      alertId: 'A006-1',
      ticketId: 'GD-20260714-0033',
      deadline: '2026-07-15 18:00',
      createdAt: '2026-07-15 10:30',
      updatedAt: '2026-07-15 10:30'
    },
    {
      id: 'IN-20260714-0002',
      fromRole: 'manage',
      fromOperator: '陈强',
      toRole: 'business',
      toOperator: '李伟',
      title: '处置 C003 极高欠款流程',
      content: 'C003 逾期 92 天 + 反复承诺不兑现。已派单到处置岗,请在 24h 内启动清退 / 重组评估。',
      priority: 'high',
      status: 'ack',
      alertId: 'A003-1',
      ackAt: '2026-07-14 11:20',
      ackNote: '已收到,启动评估',
      createdAt: '2026-07-14 11:00',
      updatedAt: '2026-07-14 11:20'
    },
    {
      id: 'IN-20260713-0003',
      fromRole: 'review',
      fromOperator: '刘丽',
      toRole: 'business',
      title: '审查标准更新通知',
      content: '消保审查 v3.2 已发布:催收红线增加"单日触达上限 3 次"。请业务执行岗本周内同步到 SOP。',
      priority: 'normal',
      status: 'done',
      ackAt: '2026-07-13 14:00',
      ackNote: '已同步',
      doneAt: '2026-07-13 17:30',
      doneNote: '3 个坐席组同步完成',
      createdAt: '2026-07-13 13:30',
      updatedAt: '2026-07-13 17:30'
    }
  ]
}

// ============ Store ============

export const useInstructionStore = defineStore('instruction', {
  state: () => ({
    items: loadPersisted() as Instruction[]
  }),
  getters: {
    pendingCount(s): number {
      return s.items.filter(i => i.status === 'pending').length
    },
    ackCount(s): number {
      return s.items.filter(i => i.status === 'ack').length
    },
    doneCount(s): number {
      return s.items.filter(i => i.status === 'done').length
    },
    /** 某角色当前 pending 指令数 */
    pendingForRole: (s) => (role: InstructionRole) => {
      return s.items.filter(i => i.status === 'pending' && i.toRole === role).length
    },
    /** 给指定角色的指令列表(pending 在前) */
    listForRole: (s) => (role: InstructionRole, operator?: string) => {
      return [...s.items]
        .filter(i => i.toRole === role && (!operator || !i.toOperator || i.toOperator === operator))
        .sort((a, b) => {
          const pOrder: Record<InstructionPriority, number> = { urgent: 0, high: 1, normal: 2, low: 3 }
          if (a.status === 'pending' && b.status !== 'pending') return -1
          if (b.status === 'pending' && a.status !== 'pending') return 1
          return pOrder[a.priority] - pOrder[b.priority]
        })
    }
  },
  actions: {
    persist() {
      savePersisted(this.items)
    },

    /** 下达指令(由管理层发起) */
    create(input: Omit<Instruction, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Instruction {
      const id = `IN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`
      const now = nowStr()
      const ins: Instruction = {
        ...input,
        id,
        status: 'pending',
        createdAt: now,
        updatedAt: now
      }
      this.items.unshift(ins)
      this.persist()
      return ins
    },

    /** 接收方确认接收(ack) */
    ack(id: string, operator: string, note?: string) {
      const i = this.items.find(x => x.id === id)
      if (!i) return false
      if (i.status !== 'pending') return false
      i.status = 'ack'
      i.ackAt = nowStr()
      i.ackNote = note
      i.toOperator = operator
      i.updatedAt = nowStr()
      this.persist()
      return true
    },

    /** 完成 */
    done(id: string, note?: string) {
      const i = this.items.find(x => x.id === id)
      if (!i) return false
      if (i.status === 'done' || i.status === 'canceled') return false
      i.status = 'done'
      i.doneAt = nowStr()
      i.doneNote = note
      i.updatedAt = nowStr()
      this.persist()
      return true
    },

    /** 撤回/取消(由下达人执行) */
    cancel(id: string) {
      const i = this.items.find(x => x.id === id)
      if (!i) return false
      if (i.status === 'done') return false
      i.status = 'canceled'
      i.updatedAt = nowStr()
      this.persist()
      return true
    },

    /** 标记过期(由调度器调用) */
    expireOverdue() {
      const now = nowStr()
      this.items.forEach(i => {
        if (i.deadline && i.status === 'pending' && i.deadline < now) {
          i.status = 'expired'
          i.updatedAt = now
        }
      })
      this.persist()
    }
  }
})
