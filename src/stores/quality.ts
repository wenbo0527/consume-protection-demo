// 质检 store(P2-3)
// 质检用例 / 评分表 / 抽检任务 / 评分 / 复检确认 / 与整改联动

import { defineStore } from 'pinia'

// ============ 类型 ============

export type QaStatus = 'pending' | 'scoring' | 'scored' | 'rectify' | 'rechecked' | 'closed'
export type QaSeverity = 'low' | 'mid' | 'high' | 'severe'

export interface QaScoreItem {
  /** 维度(如:话术规范/流程合规/情绪管理/合规性) */
  dimension: string
  /** 满分 */
  maxScore: number
  /** 实际得分 */
  score: number
  /** 评分说明 */
  comment?: string
}

export interface QaCase {
  id: string // QA-20260715-0001
  /** 关联工单 ID */
  ticketId: string
  /** 关联客户 ID */
  customerId: string
  /** 关联客户姓名 */
  customerName: string
  /** 关联坐席 ID */
  agentName: string
  /** 质检员 */
  inspector?: string
  /** 触发原因(自动抽检 / 高风险 / 客户投诉等) */
  reason: string
  /** 录音/通话引用 */
  recordRef?: string
  /** 工单创建时间 */
  ticketCreatedAt: string
  /** 质检状态 */
  status: QaStatus
  /** 总分(满分 100) */
  totalScore?: number
  /** 评分明细 */
  scores: QaScoreItem[]
  /** 问题点(一句话) */
  issues?: string[]
  /** 严重程度 */
  severity?: QaSeverity
  /** 关联的整改任务 ID */
  rectifyTaskId?: string
  /** 复检记录 */
  recheckLog?: { operator: string; at: string; score: number; passed: boolean; note?: string }[]
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

// ============ mock 初始数据 ============

function nowStr() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const STORAGE_KEY = 'cp_quality_cases'

function loadPersisted(): QaCase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) return arr
    }
  } catch {
    /* 静默 */
  }
  return buildSeed()
}

function savePersisted(cases: QaCase[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases))
  } catch {
    /* 静默 */
  }
}

function buildSeed(): QaCase[] {
  return [
    {
      id: 'QA-20260715-0001',
      ticketId: 'GD-20260714-0008',
      customerId: 'C003',
      customerName: '周志远',
      agentName: '张敏',
      inspector: '刘丽',
      reason: '高风险抽检(扬言投诉)',
      recordRef: 'rec_20260714_153028.wav',
      ticketCreatedAt: '2026-07-14 09:30',
      status: 'scored',
      totalScore: 62,
      scores: [
        { dimension: '话术规范', maxScore: 25, score: 16, comment: '开头/结束语不规范' },
        { dimension: '流程合规', maxScore: 30, score: 14, comment: '未主动告知分期方案' },
        { dimension: '情绪管理', maxScore: 20, score: 17 },
        { dimension: '合规性', maxScore: 25, score: 15, comment: '催收频次触碰红线' }
      ],
      issues: ['未规范开头语', '催收频次过高', '未充分了解客户困难'],
      severity: 'high',
      createdAt: '2026-07-15 09:00',
      updatedAt: '2026-07-15 11:20'
    },
    {
      id: 'QA-20260715-0002',
      ticketId: 'GD-20260712-0021',
      customerId: 'C001',
      customerName: '刘建国',
      agentName: '张敏',
      reason: '自动抽检(每月 5% 比例)',
      ticketCreatedAt: '2026-07-12 15:30',
      status: 'rectify',
      totalScore: 78,
      scores: [
        { dimension: '话术规范', maxScore: 25, score: 20 },
        { dimension: '流程合规', maxScore: 30, score: 22, comment: '流程合规,语速稍快' },
        { dimension: '情绪管理', maxScore: 20, score: 17 },
        { dimension: '合规性', maxScore: 25, score: 19 }
      ],
      issues: ['语速稍快'],
      severity: 'mid',
      rectifyTaskId: 'GD-20260715-0001',
      createdAt: '2026-07-15 10:00',
      updatedAt: '2026-07-15 14:30'
    },
    {
      id: 'QA-20260713-0003',
      ticketId: 'GD-20260710-0019',
      customerId: 'C002',
      customerName: '孙丽华',
      agentName: '王浩',
      inspector: '刘丽',
      reason: '客户投诉触发复检',
      ticketCreatedAt: '2026-07-10 14:20',
      status: 'pending',
      scores: [],
      createdAt: '2026-07-13 09:30',
      updatedAt: '2026-07-13 09:30'
    }
  ]
}

// ============ Store ============

export const useQualityStore = defineStore('quality', {
  state: () => ({
    cases: loadPersisted() as QaCase[]
  }),
  getters: {
    pendingCount: (s) => s.cases.filter((c) => c.status === 'pending').length,
    scoringCount: (s) => s.cases.filter((c) => c.status === 'scoring').length,
    rectifyCount: (s) => s.cases.filter((c) => c.status === 'rectify').length,
    avgScore: (s) => {
      const scored = s.cases.filter((c) => c.totalScore !== undefined)
      if (!scored.length) return 0
      return Math.round(scored.reduce((a, c) => a + (c.totalScore || 0), 0) / scored.length)
    },
    severeCount: (s) => s.cases.filter((c) => c.severity === 'severe' || c.severity === 'high').length
  },
  actions: {
    persist() {
      savePersisted(this.cases)
    },

    /** 创建质检任务(通常由抽检触发) */
    create(input: Omit<QaCase, 'id' | 'status' | 'scores' | 'createdAt' | 'updatedAt'>): QaCase {
      const id = `QA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`
      const now = nowStr()
      const c: QaCase = {
        ...input,
        id,
        status: 'pending',
        scores: [],
        createdAt: now,
        updatedAt: now
      }
      this.cases.unshift(c)
      this.persist()
      return c
    },

    /** 提交评分 */
    score(id: string, inspector: string, scores: QaScoreItem[], issues: string[], severity: QaSeverity) {
      const c = this.cases.find((x) => x.id === id)
      if (!c) return
      const total = scores.reduce((a, s) => a + s.score, 0)
      c.inspector = inspector
      c.scores = scores
      c.issues = issues
      c.severity = severity
      c.totalScore = total
      // < 80 分需要整改
      c.status = total < 80 ? 'rectify' : 'scored'
      c.updatedAt = nowStr()
      this.persist()
      return c
    },

    /** 关联整改任务(由整改模块回调) */
    attachRectify(qaId: string, rectifyTaskId: string) {
      const c = this.cases.find((x) => x.id === qaId)
      if (!c) return
      c.rectifyTaskId = rectifyTaskId
      c.updatedAt = nowStr()
      this.persist()
    },

    /** 复检(由整改完成后触发) */
    recheck(qaId: string, operator: string, score: number, passed: boolean, note?: string) {
      const c = this.cases.find((x) => x.id === qaId)
      if (!c) return
      if (!c.recheckLog) c.recheckLog = []
      c.recheckLog.push({ operator, at: nowStr(), score, passed, note })
      c.status = passed ? 'closed' : 'rectify'
      c.totalScore = score
      c.updatedAt = nowStr()
      this.persist()
    }
  }
})
