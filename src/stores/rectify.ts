// 溯源整改 store
// 模型:
//   TraceReport(溯源报告):根据投诉数据发现高发场景 → 追溯至产品/流程/话术/系统 → 形成报告
//   RectifyTask(整改任务):基于报告下发到业务部门 → 跟踪 → 验证效果
//   整改任务完成 → 可一键生成审查标准更新 + 知识库条目

import { defineStore } from 'pinia'
import { EVT } from '@/constants/events'

export type RectifyStatus = 'pending' | 'in_progress' | 'done' | 'verified' | 'rejected'

export interface TraceReport {
  id: string
  scene: string // 高发场景(如:催收频次投诉)
  rootCause: string // 根因分类:产品设计 / 流程 / 话术 / 系统
  description: string // 报告描述
  data: {
    complaintCount: number // 期间投诉量
    dropRate?: number // 期望下降率
    customerAffected: number // 涉及客户数
    period: string // 统计周期
  }
  conclusion: string // 结论(给业务部门的方向)
  createdAt: string
  author: string
}

export interface RectifyTask {
  id: string
  reportId: string // 关联溯源报告
  title?: string // 整改标题(审计追溯用)
  scene: string
  dept: string // 负责部门
  owner: string // 责任人
  requirement: string // 整改要求
  deadline: string // 截止日期
  status: RectifyStatus
  /** 进度备注(管理层/责任人填写) */
  progress: { time: string; operator: string; note: string }[]
  /** 验证结果(管理层) */
  verification?: { time: string; operator: string; result: 'pass' | 'fail'; note: string; metricDrop?: number }
  /** 关联产出:整改 → 审查标准更新 */
  generatedStandardIds?: string[]
  /** 关联产出:整改 → 知识库条目 */
  generatedKbIds?: string[]
  createdAt: string
}

const STORAGE_KEY = 'cp_rectify_data'

function log(level: 'log' | 'warn' | 'error', tag: string, msg: string, extra?: unknown) {
  const line = `[cp-rectify][${tag}] ${msg}`
  if (extra !== undefined) {
    // eslint-disable-next-line no-console
    console[level](line, extra)
  } else {
    // eslint-disable-next-line no-console
    console[level](line)
  }
}

function nowStr() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function buildMock(): { reports: TraceReport[]; tasks: RectifyTask[] } {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10)
  return {
    reports: [
      {
        id: 'TR-20260714-0001',
        scene: '催收频次投诉',
        rootCause: '流程',
        description: '近 30 天投诉数据显示,客户对催收频次过高的投诉量上升 42%,主要集中在 M2+ 阶段客户。',
        data: { complaintCount: 87, dropRate: 30, customerAffected: 76, period: '2026-06-14 ~ 2026-07-14' },
        conclusion: '建议优化催收频次规则:M2+ 阶段每日外呼 ≤3 次,短信 ≤2 条;协商期间自动降频。',
        createdAt: '2026-07-14 16:30',
        author: '陈强'
      },
      {
        id: 'TR-20260710-0002',
        scene: '息费争议',
        rootCause: '话术',
        description: '近 30 天息费争议投诉 35 起,集中在贷后管理环节,客户对综合年化利率计算方式不理解。',
        data: { complaintCount: 35, dropRate: 25, customerAffected: 32, period: '2026-06-10 ~ 2026-07-10' },
        conclusion: '建议话术标准化:贷后首次沟通必须明示 IRR 计算公式,并提供纸质费率说明。',
        createdAt: '2026-07-10 14:00',
        author: '陈强'
      }
    ],
    tasks: [
      {
        id: 'RC-20260715-0001',
        reportId: 'TR-20260714-0001',
        scene: '催收频次投诉',
        dept: '催收运营部',
        owner: '催收运营·李伟',
        requirement: '1) M2+ 阶段日外呼降至 ≤3 次,短信 ≤2 条;2) 协商期间自动降频 50%;3) 7 月底前完成规则上线',
        deadline: '2026-07-31',
        status: 'in_progress',
        progress: [
          { time: '2026-07-15 10:00', operator: '陈强', note: '下发整改任务' },
          { time: '2026-07-16 14:20', operator: '李伟', note: '已制定规则方案,本周内联调测试' }
        ],
        createdAt: '2026-07-15 10:00'
      },
      {
        id: 'RC-20260710-0002',
        reportId: 'TR-20260710-0002',
        scene: '息费争议',
        dept: '客户运营部',
        owner: '客户运营·张敏',
        requirement: '1) 贷后首次沟通话术增加 IRR 说明;2) 提供纸质费率说明模板;3) 8 月底前完成培训',
        deadline: '2026-08-31',
        status: 'pending',
        progress: [{ time: '2026-07-10 15:00', operator: '陈强', note: '下发整改任务' }],
        createdAt: '2026-07-10 15:00'
      }
    ]
  }
}

function loadPersisted(): { reports: TraceReport[]; tasks: RectifyTask[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const obj = JSON.parse(raw)
      if (Array.isArray(obj.reports) && Array.isArray(obj.tasks)) return obj
    }
  } catch (e) {
    log('warn', 'load', 'parse localStorage failed', e)
  }
  return buildMock()
}

function savePersisted(d: { reports: TraceReport[]; tasks: RectifyTask[] }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d))
  } catch (e) {
    log('warn', 'save', 'write localStorage failed', e)
  }
}

export const useRectifyStore = defineStore('rectify', {
  state: () => {
    const init = loadPersisted()
    return {
      reports: init.reports as TraceReport[],
      tasks: init.tasks as RectifyTask[]
    }
  },
  getters: {
    pendingTasks: (s) => s.tasks.filter((t) => t.status === 'pending'),
    inProgressTasks: (s) => s.tasks.filter((t) => t.status === 'in_progress'),
    doneTasks: (s) => s.tasks.filter((t) => t.status === 'done'),
    verifiedTasks: (s) => s.tasks.filter((t) => t.status === 'verified'),
    reportById: (s) => (id: string) => s.reports.find((r) => r.id === id),
    taskById: (s) => (id: string) => s.tasks.find((t) => t.id === id)
  },
  actions: {
    persist() {
      savePersisted({ reports: this.reports, tasks: this.tasks })
    },

    /** 新建溯源报告 */
    createReport(input: Omit<TraceReport, 'id' | 'createdAt'>): TraceReport {
      const id = `TR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`
      const r: TraceReport = { ...input, id, createdAt: nowStr() }
      this.reports.unshift(r)
      log('log', 'report.create', id, r.scene)
      this.persist()
      return r
    },

    /** 基于报告下发整改任务 */
    createTask(input: {
      reportId: string
      scene: string
      dept: string
      owner: string
      requirement: string
      deadline: string
    }): RectifyTask | null {
      const report = this.reports.find((r) => r.id === input.reportId)
      if (!report) {
        log('warn', 'task.create', `report ${input.reportId} not found`)
        return null
      }
      const id = `RC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`
      const t: RectifyTask = {
        id,
        reportId: input.reportId,
        scene: input.scene,
        dept: input.dept,
        owner: input.owner,
        requirement: input.requirement,
        deadline: input.deadline,
        status: 'pending',
        progress: [{ time: nowStr(), operator: '陈强', note: '下发整改任务' }],
        createdAt: nowStr()
      }
      this.tasks.unshift(t)
      log('log', 'task.create', id, t.scene)
      this.persist()
      // 派发事件:责任人可能收到通知
      window.dispatchEvent(new CustomEvent(EVT.RECTIFY_TASK_CREATED, { detail: { taskId: id, owner: input.owner } }))
      return t
    },

    /** 责任人填写进度 */
    addProgress(taskId: string, operator: string, note: string) {
      const t = this.tasks.find((x) => x.id === taskId)
      if (!t) return
      t.progress.push({ time: nowStr(), operator, note })
      if (t.status === 'pending') t.status = 'in_progress'
      log('log', 'task.progress', taskId, note)
      this.persist()
    },

    /** 责任人提交完成,等待管理层验证 */
    submitDone(taskId: string, operator: string, note: string) {
      const t = this.tasks.find((x) => x.id === taskId)
      if (!t) return
      t.status = 'done'
      t.progress.push({ time: nowStr(), operator, note: `[完成] ${note}` })
      log('log', 'task.done', taskId, note)
      this.persist()
      window.dispatchEvent(new CustomEvent(EVT.RECTIFY_TASK_DONE, { detail: { taskId, owner: t.owner } }))
    },

    /** 管理层验证整改效果 */
    verify(taskId: string, operator: string, result: 'pass' | 'fail', note: string, metricDrop?: number) {
      const t = this.tasks.find((x) => x.id === taskId)
      if (!t) return
      t.status = result === 'pass' ? 'verified' : 'rejected'
      t.verification = { time: nowStr(), operator, result, note, metricDrop }
      log('log', 'task.verify', taskId, { result, metricDrop })
      this.persist()
      // 验证通过后,可一键生成审查标准 + 知识库条目(由 UI 调用)
      if (result === 'pass') {
        window.dispatchEvent(
          new CustomEvent(EVT.RECTIFY_VERIFIED, {
            detail: { taskId, scene: t.scene, requirement: t.requirement, owner: t.owner }
          })
        )
      }
    },

    /** 整改验证后,记录关联产出的标准/知识条目 */
    attachGenerated(taskId: string, standardIds?: string[], kbIds?: string[]) {
      const t = this.tasks.find((x) => x.id === taskId)
      if (!t) return
      t.generatedStandardIds = standardIds || t.generatedStandardIds
      t.generatedKbIds = kbIds || t.generatedKbIds
      log('log', 'task.attach', taskId, { standardIds, kbIds })
      this.persist()
    }
  }
})

// 模块加载时:监听验证通过事件,自动生成对应的审查标准 + 知识条目(模拟"整改→标准/知识"闭环)
if (typeof window !== 'undefined') {
  window.addEventListener(EVT.RECTIFY_VERIFIED, (e: any) => {
    const { taskId, scene, requirement } = e.detail || {}
    log('log', 'listener', `rectify verified: ${taskId} → ${scene}`)
    // 动态生成:1 个审查标准项 + 1 个知识条目
    const stdId = `STD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 900) + 100)}`
    const kbId = `KB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`

    // 模块内直接调用(避免自引用动态 import)
    useRectifyStore().attachGenerated(taskId, [stdId], [kbId])

    // 知识库写入
    import('./knowledge')
      .then(({ useKnowledgeStore }) => {
        const kbStore = useKnowledgeStore()
        kbStore.add({
          title: `${scene} · 整改复盘`,
          category: '溯源整改',
          tags: [scene, '整改复盘'],
          source: 'rectify',
          summary: `整改任务 ${taskId} 验证通过,沉淀为知识条目`,
          content: `整改要求:${requirement}\n\n复盘结论:已验证整改措施有效,纳入知识库供后续参考。`,
          author: '陈强(管理)',
          status: 'active'
        })
      })
      .catch((err) => log('warn', 'listener', 'failed to write KB', err))
  })
}
