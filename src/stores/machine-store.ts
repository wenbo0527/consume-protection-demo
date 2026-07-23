// V2 状态机 store
// - 持久化到 localStorage(schemeVersion: 2)
// - 草稿/发布/回滚机制:每发布一个版本就存一条历史,可回滚
// - 兼容老数据:localStorage 没东西时从 DEFAULT_V2_MACHINE 初始化

import { defineStore } from 'pinia'
import { reactive, computed } from 'vue'
import type {
  StateMachine,
  StateNode,
  StateTransition,
  StateHook
} from './ticket-machine'
import { MACHINE_SCHEMA_VERSION } from './ticket-machine'
import { DEFAULT_V2_MACHINE } from './machine-defaults'

const STORAGE_KEY = 'cp_ticket_machine_v2'

interface PersistedShape {
  schemaVersion: number
  draft: StateMachine
  published: StateMachine
  history: StateMachine[]
}

function loadPersisted(): PersistedShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const obj = JSON.parse(raw) as PersistedShape
      if (obj.schemaVersion === MACHINE_SCHEMA_VERSION && obj.draft && obj.published) {
        return obj
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[cp-machine-store] load failed', e)
  }
  // 首次:草稿和发布都用同一份默认数据,但 published 用更深一档版本号区分
  const initial: StateMachine = JSON.parse(JSON.stringify(DEFAULT_V2_MACHINE))
  initial.status = 'published'
  return {
    schemaVersion: MACHINE_SCHEMA_VERSION,
    draft: JSON.parse(JSON.stringify(DEFAULT_V2_MACHINE)),
    published: initial,
    history: []
  }
}

function savePersisted(state: PersistedShape) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[cp-machine-store] save failed', e)
  }
}

export const useMachineStore = defineStore('machine', {
  state: () => {
    const init = loadPersisted()
    return {
      schemaVersion: init.schemaVersion as number,
      draft: init.draft as StateMachine,
      published: init.published as StateMachine,
      history: init.history as StateMachine[]
    }
  },

  getters: {
    /** 当前生效的机器(发布版) */
    activeMachine: (s): StateMachine => s.published,
    /** 编辑中的机器 */
    editableMachine: (s): StateMachine => s.draft,
    /** 草稿相对发布版是否已修改 */
    hasDraftChanges: (s) => JSON.stringify(s.draft) !== JSON.stringify(s.published),
    /** 草稿版本号自增(用于 UI 提示) */
    draftVersionLabel: (s) => `DRAFT ${s.draft.version}`,
    publishedVersionLabel: (s) => `V${s.published.version}`
  },

  actions: {
    persist() {
      savePersisted({
        schemaVersion: this.schemaVersion,
        draft: this.draft,
        published: this.published,
        history: this.history
      })
    },

    /** 整体替换草稿(导入) */
    replaceDraft(machine: StateMachine) {
      this.draft = JSON.parse(JSON.stringify(machine))
      this.draft.status = 'draft'
      this.persist()
    },

    /** 状态编辑 */
    updateState(stateId: string, patch: Partial<StateNode>) {
      const s = this.draft.states.find((x) => x.id === stateId)
      if (!s) return
      Object.assign(s, patch)
      this.persist()
    },

    addState(node: StateNode) {
      if (this.draft.states.some((s) => s.id === node.id)) return
      this.draft.states.push(node)
      this.persist()
    },

    removeState(stateId: string) {
      // 1. 移除状态
      this.draft.states = this.draft.states.filter((s) => s.id !== stateId)
      // 2. 移除所有以该状态为 from/to 的 transition
      this.draft.transitions = this.draft.transitions.filter(
        (t) => t.from !== stateId && t.to !== stateId
      )
      this.persist()
    },

    /** 边编辑 */
    updateTransition(transitionId: string, patch: Partial<StateTransition>) {
      const t = this.draft.transitions.find((x) => x.id === transitionId)
      if (!t) return
      Object.assign(t, patch)
      this.persist()
    },

    addTransition(t: StateTransition) {
      if (this.draft.transitions.some((x) => x.id === t.id)) return
      this.draft.transitions.push(t)
      this.persist()
    },

    removeTransition(transitionId: string) {
      this.draft.transitions = this.draft.transitions.filter((t) => t.id !== transitionId)
      this.persist()
    },

    /** 钩子编辑(给指定状态/边的 hooks 数组) */
    setStateHooks(stateId: string, phase: 'onEnter' | 'onExit', hooks: StateHook[]) {
      const s = this.draft.states.find((x) => x.id === stateId)
      if (!s) return
      if (phase === 'onEnter') s.onEnter = hooks
      else s.onExit = hooks
      this.persist()
    },

    addStateHook(stateId: string, phase: 'onEnter' | 'onExit', hook: StateHook) {
      const s = this.draft.states.find((x) => x.id === stateId)
      if (!s) return
      const arr = (s[phase] ||= [])
      arr.push(hook)
      this.persist()
    },

    removeStateHook(stateId: string, phase: 'onEnter' | 'onExit', index: number) {
      const s = this.draft.states.find((x) => x.id === stateId)
      if (!s || !s[phase]) return
      s[phase]!.splice(index, 1)
      this.persist()
    },

    setTransitionEffects(transitionId: string, hooks: StateHook[]) {
      const t = this.draft.transitions.find((x) => x.id === transitionId)
      if (!t) return
      t.effects = hooks
      this.persist()
    },

    addTransitionEffect(transitionId: string, hook: StateHook) {
      const t = this.draft.transitions.find((x) => x.id === transitionId)
      if (!t) return
      t.effects = t.effects || []
      t.effects.push(hook)
      this.persist()
    },

    removeTransitionEffect(transitionId: string, index: number) {
      const t = this.draft.transitions.find((x) => x.id === transitionId)
      if (!t || !t.effects) return
      t.effects.splice(index, 1)
      this.persist()
    },

    /** 版本管理 */
    publishDraft(changeNote?: string, publisher = '陈强(管理)') {
      // 1. 旧 published 入历史
      this.history.unshift(JSON.parse(JSON.stringify(this.published)))
      if (this.history.length > 20) this.history.length = 20
      // 2. 草稿转 published(版本号自增)
      const newPublished: StateMachine = JSON.parse(JSON.stringify(this.draft))
      const parts = newPublished.version.split('.').map((n) => parseInt(n, 10) || 0)
      parts[2] = (parts[2] || 0) + 1
      newPublished.version = parts.join('.')
      newPublished.status = 'published'
      newPublished.publishedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
      newPublished.publishedBy = publisher
      newPublished.changeNote = changeNote || ''
      this.published = newPublished
      this.persist()
    },

    rollbackTo(historyIndex: number) {
      const target = this.history[historyIndex]
      if (!target) return
      this.published = JSON.parse(JSON.stringify(target))
      this.persist()
    },

    discardDraft() {
      this.draft = JSON.parse(JSON.stringify(this.published))
      this.draft.status = 'draft'
      this.persist()
    },

    /** 调试用:导出草稿 JSON */
    exportDraft(): string {
      return JSON.stringify(this.draft, null, 2)
    }
  }
})
