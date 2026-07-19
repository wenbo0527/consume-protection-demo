// 运营 store(P2-4)
// 排班 / 班次 / 请假 / 调班 / 作业量统计 / 绩效排行
// 与质检 store 联动:质检评分决定绩效里的"均分"

import { defineStore } from 'pinia'

// ============ 类型 ============

export type ShiftType = '早' | '中' | '晚' | '休' | '假'
export type AgentRole = 'agent' | 'business' | 'review' | 'manage' | 'system'
export type LeaveType = '事假' | '病假' | '年假' | '调休' | '婚假'

export interface ShiftEntry {
  /** 日期 'YYYY-MM-DD' */
  date: string
  /** 坐席 ID */
  agentId: string
  /** 班次类型 */
  shift: ShiftType
  /** 备注 */
  note?: string
}

export interface Agent {
  id: string
  name: string
  role: AgentRole
  /** 工号 */
  workNo: string
  /** 入职日期 */
  joinedAt: string
  /** 技能组 / 渠道 */
  skills: string[] // '电话' | '12345' | '在线客服' | '投诉' | '协商'
  /** 当月作业量(自动累加) */
  monthlyTicketCount: number
  /** 当月均分(由质检 store 计算后 push 进来) */
  monthlyAvgScore: number
  /** 当月待整改数(由质检 store 计算后 push 进来) */
  monthlyRectifyCount: number
  /** 当前状态(由 workbench store 控制也可) */
  status: 'oncall' | 'idle' | 'offline' | 'rest'
}

export interface LeaveRequest {
  id: string
  agentId: string
  type: LeaveType
  /** 'YYYY-MM-DD' 起始 */
  startDate: string
  /** 'YYYY-MM-DD' 结束(可同一天) */
  endDate: string
  reason: string
  /** 审批状态 */
  status: 'pending' | 'approved' | 'rejected'
  applicantAt: string
  approver?: string
  approvedAt?: string
}

// ============ mock 初始数据 ============

function nowStr() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const STORAGE_KEY = 'cp_ops_data'

function loadPersisted(): { agents: Agent[]; shifts: ShiftEntry[]; leaves: LeaveRequest[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (arr && Array.isArray(arr.agents)) return arr
    }
  } catch {
    /* 静默 */
  }
  return buildSeed()
}

function savePersisted(state: { agents: Agent[]; shifts: ShiftEntry[]; leaves: LeaveRequest[] }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* 静默 */
  }
}

function buildSeed() {
  const agents: Agent[] = [
    {
      id: 'U001',
      name: '张敏',
      role: 'agent',
      workNo: 'A001',
      joinedAt: '2024-03-15',
      skills: ['电话', '投诉'],
      monthlyTicketCount: 86,
      monthlyAvgScore: 0,
      monthlyRectifyCount: 0,
      status: 'oncall'
    },
    {
      id: 'U002',
      name: '王浩',
      role: 'agent',
      workNo: 'A002',
      joinedAt: '2024-05-20',
      skills: ['电话', '在线客服'],
      monthlyTicketCount: 92,
      monthlyAvgScore: 0,
      monthlyRectifyCount: 0,
      status: 'idle'
    },
    {
      id: 'U003',
      name: '李伟',
      role: 'business',
      workNo: 'B001',
      joinedAt: '2023-09-10',
      skills: ['协商还款', '停催停扣'],
      monthlyTicketCount: 45,
      monthlyAvgScore: 0,
      monthlyRectifyCount: 0,
      status: 'oncall'
    },
    {
      id: 'U004',
      name: '陈静',
      role: 'business',
      workNo: 'B002',
      joinedAt: '2024-07-01',
      skills: ['征信异议', '转调解'],
      monthlyTicketCount: 38,
      monthlyAvgScore: 0,
      monthlyRectifyCount: 0,
      status: 'idle'
    },
    {
      id: 'U005',
      name: '刘丽',
      role: 'review',
      workNo: 'R001',
      joinedAt: '2023-11-05',
      skills: ['消保审查', '工单审查'],
      monthlyTicketCount: 0,
      monthlyAvgScore: 0,
      monthlyRectifyCount: 0,
      status: 'oncall'
    },
    {
      id: 'U006',
      name: '王芳',
      role: 'review',
      workNo: 'R002',
      joinedAt: '2024-02-18',
      skills: ['消保审查'],
      monthlyTicketCount: 0,
      monthlyAvgScore: 0,
      monthlyRectifyCount: 0,
      status: 'offline'
    },
    {
      id: 'U007',
      name: '陈强',
      role: 'manage',
      workNo: 'M001',
      joinedAt: '2022-04-01',
      skills: ['管理驾驶舱'],
      monthlyTicketCount: 0,
      monthlyAvgScore: 0,
      monthlyRectifyCount: 0,
      status: 'oncall'
    },
    {
      id: 'U008',
      name: '赵雪',
      role: 'agent',
      workNo: 'A003',
      joinedAt: '2024-10-12',
      skills: ['12345', '在线客服'],
      monthlyTicketCount: 64,
      monthlyAvgScore: 0,
      monthlyRectifyCount: 0,
      status: 'idle'
    }
  ]

  // 生成未来 14 天的排班
  const shifts: ShiftEntry[] = []
  const today = new Date()
  for (let d = 0; d < 14; d++) {
    const dt = new Date(today)
    dt.setDate(today.getDate() + d)
    const dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
    // 给坐席轮流安排早/中/晚,管理层按需
    agents.forEach((a, idx) => {
      let shift: ShiftType = '早'
      const dow = dt.getDay()
      if (dow === 0 || dow === 6)
        shift = '休' // 周末休
      else if ((d + idx) % 3 === 0) shift = '早'
      else if ((d + idx) % 3 === 1) shift = '中'
      else shift = '晚'
      // 管理层 + 审查组不上班次
      if (a.role === 'manage') shift = '休'
      if (a.role === 'review') shift = dow === 5 ? '休' : '早'
      shifts.push({ date: dateStr, agentId: a.id, shift, note: shift === '休' ? '周末/休息' : undefined })
    })
  }

  const leaves: LeaveRequest[] = [
    {
      id: 'LV-20260715-0001',
      agentId: 'U002',
      type: '调休',
      startDate: '2026-07-16',
      endDate: '2026-07-16',
      reason: '处理家庭事务',
      status: 'approved',
      applicantAt: '2026-07-13 09:30',
      approver: '陈强',
      approvedAt: '2026-07-13 11:00'
    },
    {
      id: 'LV-20260714-0002',
      agentId: 'U008',
      type: '年假',
      startDate: '2026-07-20',
      endDate: '2026-07-24',
      reason: '年中休假',
      status: 'pending',
      applicantAt: '2026-07-14 16:00'
    }
  ]

  return { agents, shifts, leaves }
}

// ============ Store ============

export const useOpsStore = defineStore('ops', {
  state: () => {
    const init = loadPersisted()
    return {
      agents: init.agents as Agent[],
      shifts: init.shifts as ShiftEntry[],
      leaves: init.leaves as LeaveRequest[]
    }
  },
  getters: {
    /** 在线坐席 */
    onlineAgents(s): Agent[] {
      return s.agents.filter((a) => a.status === 'oncall')
    },
    /** 当月在岗的坐席/业务执行 */
    staffAgents(s): Agent[] {
      return s.agents.filter((a) => a.role === 'agent' || a.role === 'business')
    },
    /** 待审批请假 */
    pendingLeaveCount(s): number {
      return s.leaves.filter((l) => l.status === 'pending').length
    },
    /** 14 天排班 */
    shiftsByDate(s): Record<string, ShiftEntry[]> {
      const map: Record<string, ShiftEntry[]> = {}
      s.shifts.forEach((sh) => {
        if (!map[sh.date]) map[sh.date] = []
        map[sh.date].push(sh)
      })
      return map
    }
  },
  actions: {
    persist() {
      savePersisted({ agents: this.agents, shifts: this.shifts, leaves: this.leaves })
    },

    /** 排班调整 */
    updateShift(date: string, agentId: string, shift: ShiftType, note?: string) {
      const sh = this.shifts.find((s) => s.date === date && s.agentId === agentId)
      if (!sh) return false
      sh.shift = shift
      sh.note = note
      this.persist()
      return true
    },

    /** 批量换班 */
    swapShift(agent1Id: string, date1: string, agent2Id: string, date2: string) {
      const s1 = this.shifts.find((s) => s.date === date1 && s.agentId === agent1Id)
      const s2 = this.shifts.find((s) => s.date === date2 && s.agentId === agent2Id)
      if (!s1 || !s2) return false
      const tmp = s1.shift
      s1.shift = s2.shift
      s2.shift = tmp
      s1.note = `与 ${agent2Id} 换班`
      s2.note = `与 ${agent1Id} 换班`
      this.persist()
      return true
    },

    /** 请假申请 */
    applyLeave(input: Omit<LeaveRequest, 'id' | 'status' | 'applicantAt'>): LeaveRequest {
      const id = `LV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`
      const lv: LeaveRequest = {
        ...input,
        id,
        status: 'pending',
        applicantAt: nowStr()
      }
      this.leaves.unshift(lv)
      this.persist()
      return lv
    },

    /** 审批请假 */
    approveLeave(id: string, approver: string, approved: boolean) {
      const lv = this.leaves.find((l) => l.id === id)
      if (!lv) return false
      lv.status = approved ? 'approved' : 'rejected'
      lv.approver = approver
      lv.approvedAt = nowStr()

      // 审批通过 → 自动把对应日期的排班改为"假"
      if (approved) {
        const start = new Date(lv.startDate)
        const end = new Date(lv.endDate)
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          const sh = this.shifts.find((s) => s.date === dateStr && s.agentId === lv.agentId)
          if (sh) {
            sh.shift = '假'
            sh.note = `${lv.type}-${lv.id}`
          }
        }
      }

      this.persist()
      return true
    },

    /** 由质检 store 联动:刷新人均分 / 整改数 */
    refreshKpi(agentId: string, avgScore: number, rectifyCount: number) {
      const a = this.agents.find((x) => x.id === agentId)
      if (!a) return
      a.monthlyAvgScore = avgScore
      a.monthlyRectifyCount = rectifyCount
      this.persist()
    },

    /** 一次性从质检 store 全量刷新 */
    refreshAllFromQuality(qaCases: { agentName: string; totalScore?: number; status: string }[]) {
      const groups: Record<string, number[]> = {}
      const rectifyCount: Record<string, number> = {}
      qaCases.forEach((c) => {
        if (c.totalScore === undefined) return
        if (!groups[c.agentName]) groups[c.agentName] = []
        groups[c.agentName].push(c.totalScore)
        if (c.status === 'rectify') {
          rectifyCount[c.agentName] = (rectifyCount[c.agentName] || 0) + 1
        }
      })
      this.agents.forEach((a) => {
        const matched = groups[a.name]
        if (matched && matched.length) {
          a.monthlyAvgScore = Math.round(matched.reduce((x, y) => x + y, 0) / matched.length)
          a.monthlyRectifyCount = rectifyCount[a.name] || 0
        }
      })
      this.persist()
    }
  }
})
