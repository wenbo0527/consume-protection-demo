// 知识库 store
// 1. 知识条目列表(坐席检索 + 管理层维护)
// 2. 审查归档副作用通过 CustomEvent 'cp-workflow-kb-archive' 自动新增"待审核"条目
// 3. 知识管理员审核后状态从 pending → active,触发 'cp-workflow-notify-seat' 通知坐席

import { defineStore } from 'pinia'
import { EVT } from '@/constants/events'

export type KBStatus = 'pending' | 'active' | 'archived'

export interface KBItem {
  id: string
  title: string
  category: string
  tags: string[]
  /** 来源:人工录入 / 审查归档 / 溯源整改 */
  source: 'manual' | 'review_archive' | 'rectify'
  /** 关联审查项目 ID(从审查归档写入时携带) */
  reviewId?: string
  summary: string
  content: string
  status: KBStatus
  updatedAt: string
  author: string
  /** 浏览次数(审计追溯用) */
  views?: number
}

const STORAGE_KEY = 'cp_knowledge_data'

function log(level: 'log' | 'warn' | 'error', tag: string, msg: string, extra?: unknown) {
  const line = `[cp-knowledge][${tag}] ${msg}`
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

function buildMock(): KBItem[] {
  return [
    {
      id: 'KB-20260610-0001',
      title: '速贷宝 Pro 产品介绍标准话术',
      category: '产品介绍',
      tags: ['速贷宝', '产品介绍'],
      source: 'manual',
      summary: '速贷宝 Pro 产品的标准介绍话术与费率说明',
      content: '速贷宝 Pro 是我行主推的个人消费信贷产品...',
      status: 'active',
      updatedAt: '2026-06-10 10:00',
      author: '王芳'
    },
    {
      id: 'KB-20260705-0002',
      title: '催收频次投诉处置规范',
      category: '催收合规',
      tags: ['催收', '投诉'],
      source: 'review_archive',
      reviewId: 'RV-20260705-0003',
      summary: '针对客户投诉"催收频次过高"的标准处置流程',
      content: '1. 受理客户投诉... 2. 调取近 30 天催收记录...',
      status: 'active',
      updatedAt: '2026-07-05 14:20',
      author: '王芳'
    },
    {
      id: 'KB-20260714-0003',
      title: '征信异议申诉话术模板',
      category: '征信',
      tags: ['征信异议'],
      source: 'review_archive',
      reviewId: 'RV-20260714-0008',
      summary: '客户提出征信异议时的受理与解释话术',
      content: '您好,关于您提出的征信异议...',
      status: 'active',
      updatedAt: '2026-07-14 16:30',
      author: '王芳'
    },
    {
      id: 'KB-20260716-0004',
      title: '扬言客户分级处置预案(草稿)',
      category: '风险预警',
      tags: ['扬言', '风险'],
      source: 'review_archive',
      summary: '扬言投诉的客户分级与升级路径',
      content: '一级:一般扬言... 二级:涉及监管/媒体...',
      status: 'pending',
      updatedAt: '2026-07-16 09:00',
      author: '王芳'
    }
  ]
}

function loadPersisted(): KBItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) return arr
    }
  } catch (e) {
    log('warn', 'load', 'parse localStorage failed', e)
  }
  return buildMock()
}

function savePersisted(items: KBItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (e) {
    log('warn', 'save', 'write localStorage failed', e)
  }
}

export const useKnowledgeStore = defineStore('knowledge', {
  state: () => ({
    items: loadPersisted() as KBItem[]
  }),
  getters: {
    active: (s) => s.items.filter((i) => i.status === 'active'),
    pending: (s) => s.items.filter((i) => i.status === 'pending'),
    byCategory: (s) => (cat: string) => s.items.filter((i) => i.category === cat && i.status === 'active')
  },
  actions: {
    persist() {
      savePersisted(this.items)
    },
    /** 审查归档副作用:新建一个待审核条目 */
    upsertFromReview(input: { reviewId?: string; title: string; summary: string; content: string; category?: string }) {
      const id = `KB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`
      const item: KBItem = {
        id,
        title: input.title,
        category: input.category || '审查归档',
        tags: ['审查归档'],
        source: 'review_archive',
        reviewId: input.reviewId,
        summary: input.summary,
        content: input.content,
        status: 'pending',
        updatedAt: nowStr(),
        author: '审查归档'
      }
      this.items.unshift(item)
      log('log', 'upsertFromReview', id, item.title)
      this.persist()
      return item
    },
    /** 知识管理员审核通过 */
    approve(id: string, reviewer: string) {
      const item = this.items.find((i) => i.id === id)
      if (!item) return
      item.status = 'active'
      item.updatedAt = nowStr()
      item.author = reviewer
      log('log', 'approve', id)
      this.persist()
    },
    /** 知识管理员驳回(下架) */
    reject(id: string) {
      const item = this.items.find((i) => i.id === id)
      if (!item) return
      item.status = 'archived'
      log('log', 'reject', id)
      this.persist()
    },
    /** 新增(人工录入) */
    add(input: Omit<KBItem, 'id' | 'updatedAt' | 'status'> & { status?: KBStatus }) {
      const id = `KB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`
      this.items.unshift({ ...input, id, updatedAt: nowStr(), status: input.status || 'pending' })
      this.persist()
    },
    update(id: string, patch: Partial<KBItem>) {
      const item = this.items.find((i) => i.id === id)
      if (!item) return
      Object.assign(item, patch, { updatedAt: nowStr() })
      this.persist()
    },
    remove(id: string) {
      this.items = this.items.filter((i) => i.id !== id)
      this.persist()
    }
  }
})

// 在模块加载时挂全局监听:审查归档工作流触发 → 知识库自动新增
if (typeof window !== 'undefined') {
  window.addEventListener(EVT.WORKFLOW_KB_ARCHIVE, (e: any) => {
    const { reviewId, kind } = e.detail || {}
    const titleByKind: Record<string, string> = {
      newProduct: '新产品审查归档·要点速查',
      marketing: '营销活动审查归档·合规要点',
      change: '产品变更审查归档·变更要点'
    }
    const fallbackTitle = '审查归档·知识条目'
    const title = titleByKind[kind] || fallbackTitle
    // 模块内直接调用
    useKnowledgeStore().upsertFromReview({
      reviewId,
      title,
      summary: `由审查工作流自动归档,ID: ${reviewId || '-'}`,
      content: `本条目由审查归档工作流自动生成,关联审查项目:${reviewId || '-'}。请知识管理员补充完整内容并审核生效。`
    })
  })

  // 注意:'cp-knowledge-approved' 事件名已废弃(原 KnowledgeManage 审批后只更新本地状态,无外部动作)
  // 若后续需要通知,可重新引入并写明 dispatch + listen 两侧
}
