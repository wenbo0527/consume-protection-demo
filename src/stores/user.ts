import { defineStore } from 'pinia'

const STORAGE_KEY = 'cp_user_role'

function log(level: 'log' | 'warn' | 'error', tag: string, msg: string, extra?: unknown) {
  const line = `[cp-user-store][${tag}] ${msg}`
  if (extra !== undefined) {
    // eslint-disable-next-line no-console
    console[level](line, extra)
  } else {
    // eslint-disable-next-line no-console
    console[level](line)
  }
}

function loadRole(): RoleKey | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    log('log', 'loadRole', `read localStorage key="${STORAGE_KEY}"`, v)
    if (v && ['agent', 'business', 'review', 'manage', 'consumer'].includes(v)) {
      return v as RoleKey
    }
  } catch (e) {
    log('warn', 'loadRole', 'localStorage unavailable', e)
  }
  return null
}

function saveRole(role: RoleKey | null) {
  try {
    if (role) {
      localStorage.setItem(STORAGE_KEY, role)
      log('log', 'saveRole', `write localStorage key="${STORAGE_KEY}"`, role)
    } else {
      localStorage.removeItem(STORAGE_KEY)
      log('log', 'saveRole', `remove localStorage key="${STORAGE_KEY}"`)
    }
  } catch (e) {
    log('warn', 'saveRole', 'localStorage write failed', e)
  }
}

export type RoleKey = 'agent' | 'business' | 'review' | 'manage' | 'consumer'

export interface RoleInfo {
  key: RoleKey
  name: string
  username: string
  workbench: string
  icon: string
  desc: string
}

export const ROLE_LIST: RoleInfo[] = [
  {
    key: 'agent',
    name: '一线客服坐席',
    username: '张敏',
    workbench: '坐席工作台',
    icon: 'icon-headset',
    desc: '快速接听、准确建单、高效处置'
  },
  {
    key: 'business',
    name: '业务支撑岗',
    username: '李伟',
    workbench: '业务执行台',
    icon: 'icon-tool',
    desc: '规范执行业务操作、审批流程清晰'
  },
  {
    key: 'manage',
    name: '消保管理层',
    username: '陈强',
    workbench: '管理工作台',
    icon: 'icon-dashboard',
    desc: '看清全局、预警处置、溯源整改'
  },
  {
    key: 'consumer',
    name: '客户',
    username: '赵先生',
    workbench: '消费者之家',
    icon: 'icon-user',
    desc: '自助办理、投诉进度查询'
  }
]

export const useUserStore = defineStore('user', {
  state: () => ({
    // 初始化时尝试从 localStorage 恢复,实现刷新/直链仍保持登录态
    currentRole: loadRole() as RoleKey | null
  }),
  actions: {
    login(role: RoleKey) {
      log('log', 'login', 'login called', role)
      this.currentRole = role
      saveRole(role)
      log('log', 'login', 'state after login', { currentRole: this.currentRole })
    },
    logout() {
      log('log', 'logout', 'logout called')
      this.currentRole = null
      saveRole(null)
    }
  }
})

export function getRoleInfo(key: RoleKey): RoleInfo | undefined {
  return ROLE_LIST.find((r) => r.key === key)
}
