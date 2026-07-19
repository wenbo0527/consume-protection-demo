// 标签联动规则 store
// 模型:
//   TagRule:命中客户标签后,触发一组动作(action)
// 动作类型:
//   - 'show_alert':客户画像弹窗显示预警(type + title + actions)
//   - 'restrict_call':限制呼入/呼出(给坐席提示)
//   - 'auto_upgrade':立即升级 + 通知管理层
//   - 'link_history':关联代理/工单历史
// 命中规则由 CustomerProfile / AgentDesk 调用 evaluate(tagList) 计算

import { defineStore } from 'pinia'

export type RiskTag = 'threat' | 'blacklist' | 'agent' | 'complaint' | 'normal'

export type RuleAction =
  | { kind: 'show_alert'; level: 'error' | 'warning'; title: string; actions: string[] }
  | { kind: 'restrict_call'; note: string }
  | { kind: 'auto_upgrade'; target: 'manage' | 'review'; note: string }
  | { kind: 'link_history'; note: string }

export interface TagRule {
  id: string
  /** 命中标签(任一即可) */
  tags: RiskTag[]
  /** 规则描述 */
  name: string
  desc: string
  actions: (RuleAction & { actionsText?: string })[]
  /** 优先级(高优先级先评估) */
  priority: number
  enabled: boolean
}

const STORAGE_KEY = 'cp_tag_rule_data'

function log(level: 'log' | 'warn' | 'error', tag: string, msg: string, extra?: unknown) {
  const line = `[cp-tag-rule][${tag}] ${msg}`
  if (extra !== undefined) {
    // eslint-disable-next-line no-console
    console[level](line, extra)
  } else {
    // eslint-disable-next-line no-console
    console[level](line)
  }
}

function buildMock(): TagRule[] {
  return [
    {
      id: 'RULE-001',
      tags: ['threat'],
      name: '扬言标签 → 紧急升级',
      desc: '客户含扬言标签时,弹屏预警 + 立即升级到管理层 + 开启录音',
      priority: 100,
      enabled: true,
      actions: [
        { kind: 'show_alert', level: 'error', title: '紧急:扬言标签客户', actions: ['转紧急流程', '通知组长', '开启录音'] },
        { kind: 'auto_upgrade', target: 'manage', note: '扬言客户进线,请立即关注' }
      ]
    },
    {
      id: 'RULE-002',
      tags: ['blacklist'],
      name: '黑名单 → 限制呼入',
      desc: '黑名单客户,限制呼入呼出 + 播放限制话术',
      priority: 90,
      enabled: true,
      actions: [
        { kind: 'show_alert', level: 'error', title: '警示:黑名单客户', actions: ['限制呼入/呼出', '播放限制话术'] },
        { kind: 'restrict_call', note: '黑名单客户:仅可接听不可主动外呼' }
      ]
    },
    {
      id: 'RULE-003',
      tags: ['agent'],
      name: '异常代理 → 关联历史',
      desc: '异常代理标签,开启录音 + 关联代理历史',
      priority: 70,
      enabled: true,
      actions: [
        { kind: 'show_alert', level: 'warning', title: '注意:异常代理', actions: ['开启录音', '关联代理历史'] },
        { kind: 'link_history', note: '请查看客户代理历史' }
      ]
    },
    {
      id: 'RULE-004',
      tags: ['complaint'],
      name: '投诉倾向 → 关联工单',
      desc: '投诉倾向客户,提示查看历史工单',
      priority: 50,
      enabled: true,
      actions: [
        { kind: 'show_alert', level: 'warning', title: '提示:投诉倾向客户', actions: ['查看历史工单', '关联本次工单'] }
      ]
    }
  ]
}

function loadPersisted(): TagRule[] {
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

function savePersisted(rules: TagRule[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
  } catch (e) {
    log('warn', 'save', 'write localStorage failed', e)
  }
}

export const useTagRuleStore = defineStore('tagRule', {
  state: () => ({
    rules: loadPersisted() as TagRule[]
  }),
  getters: {
    enabled: (s) => s.rules.filter(r => r.enabled).sort((a, b) => b.priority - a.priority)
  },
  actions: {
    persist() { savePersisted(this.rules) },

    /** 评估某客户的标签,返回触发的所有动作(按规则优先级) */
    evaluate(tags: RiskTag[]): { rule: TagRule; actions: RuleAction[] }[] {
      if (!tags?.length) return []
      const triggered: { rule: TagRule; actions: RuleAction[] }[] = []
      for (const rule of this.enabled) {
        const hit = rule.tags.some(t => tags.includes(t))
        if (hit) triggered.push({ rule, actions: rule.actions })
      }
      log('log', 'evaluate', `tags=${tags.join(',')} hit=${triggered.length}`)
      return triggered
    },

    /** 找出第一条 show_alert 动作(用于弹窗) */
    firstAlert(tags: RiskTag[]): { type: 'error' | 'warning'; title: string; actions: string[] } | null {
      for (const r of this.enabled) {
        const hit = r.tags.some(t => tags.includes(t))
        if (!hit) continue
        const a = r.actions.find(x => x.kind === 'show_alert') as any
        if (a) return { type: a.level, title: a.title, actions: a.actions }
      }
      return null
    },

    /** 所有 restrict_call 提示 */
    restrictNotes(tags: RiskTag[]): string[] {
      const notes: string[] = []
      for (const r of this.enabled) {
        if (!r.tags.some(t => tags.includes(t))) continue
        const a = r.actions.find(x => x.kind === 'restrict_call') as any
        if (a) notes.push(a.note)
      }
      return notes
    },

    /** 所有 auto_upgrade 触发(返回 note) */
    autoUpgradeNotes(tags: RiskTag[]): string[] {
      const notes: string[] = []
      for (const r of this.enabled) {
        if (!r.tags.some(t => tags.includes(t))) continue
        const a = r.actions.find(x => x.kind === 'auto_upgrade') as any
        if (a) notes.push(a.note)
      }
      return notes
    },

    updateRule(id: string, patch: Partial<TagRule>) {
      const r = this.rules.find(x => x.id === id)
      if (!r) return
      Object.assign(r, patch)
      log('log', 'update', id, patch)
      this.persist()
    },

    add(rule: Omit<TagRule, 'id'>): TagRule {
      const id = `RULE-${String(this.rules.length + 1).padStart(3, '0')}`
      const newRule: TagRule = { ...rule, id }
      this.rules.push(newRule)
      this.persist()
      return newRule
    },

    remove(id: string) {
      this.rules = this.rules.filter(r => r.id !== id)
      this.persist()
    }
  }
})