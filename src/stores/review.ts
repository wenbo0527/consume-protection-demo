// 审查标准 store(OPT-2 引入)
// 维护审查标准的"来源",便于事后追溯"标准条目由何而来"

import { defineStore } from 'pinia'
import { reviewStandards as seedStandards } from '@/mock/data'

export type StandardSource = 'manual' | 'rectify' | 'regulator' | 'system'

export interface ReviewStandard {
  id: string // 'S001' 或新生成的 'R-001'
  category: string
  item: string
  basis: string
  required: boolean
  /** 来源 */
  source: StandardSource
  /** 关联的整改任务 ID(当 source === 'rectify') */
  rectifyTaskId?: string
  /** 关联的整改报告 ID */
  rectifyReportId?: string
  /** 适用范围 / 备注(整改来源时携带) */
  scope?: string
  /** 创建时间 */
  createdAt?: string
  /** 创建人 */
  author?: string
}

const STORAGE_KEY = 'cp_review_standards_data'

function loadPersisted(): ReviewStandard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) return arr
    }
  } catch {
    /* 静默 */
  }
  // 从 seed 重建:确保所有 seed 项被标注 source = 'system'(原始规则)
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  return (seedStandards as any[]).map((s, idx) => ({
    ...s,
    source: 'system' as StandardSource,
    createdAt: '2026-01-01 00:00',
    author: '系统'
  }))
}

function savePersisted(items: ReviewStandard[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* 静默 */
  }
}

export const useReviewStore = defineStore('review', {
  state: () => ({
    standards: loadPersisted() as ReviewStandard[],
    /** 来源为 rectify 的项目 */
    rectifyLinked: 0
  }),
  getters: {
    /** 按来源统计 */
    bySource: (s) => {
      const result: Record<StandardSource, number> = { manual: 0, rectify: 0, regulator: 0, system: 0 }
      s.standards.forEach((st) => {
        result[st.source] = (result[st.source] || 0) + 1
      })
      return result
    },
    /** 来源为 rectify 的标准 */
    rectifyStandards(s): ReviewStandard[] {
      return s.standards.filter((st) => st.source === 'rectify')
    }
  },
  actions: {
    persist() {
      savePersisted(this.standards)
    },

    /** 通用添加标准 */
    add(input: Omit<ReviewStandard, 'id' | 'createdAt'>): ReviewStandard {
      const id = `R-${String(this.standards.length + 1).padStart(3, '0')}`
      const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
      const std: ReviewStandard = {
        ...input,
        id,
        createdAt: now
      }
      this.standards.push(std)
      this.persist()
      return std
    },

    /** OPT-2:整改完成后"一键生成标准项" */
    generateFromRectify(input: {
      category: string
      item: string
      basis: string
      required: boolean
      scope?: string
      author: string
      rectifyTaskId: string
      rectifyReportId: string
    }): ReviewStandard {
      const std = this.add({
        category: input.category,
        item: input.item,
        basis: input.basis,
        required: input.required,
        source: 'rectify',
        scope: input.scope,
        author: input.author,
        rectifyTaskId: input.rectifyTaskId,
        rectifyReportId: input.rectifyReportId
      })
      return std
    }
  }
})
