// 角色名 · 单一真相源
//
// 之前每个组件 / 页面 都各自复制贴 `{ agent: '坐席', business: '支撑岗', ... }`
// 导致:
//   - 一处改全处遗漏(OpsManage 写成了"业务执行",其他都是"支撑岗")
//   - 同义不同字,grep 不出来
//   - 改流程名字要去 5+ 个文件
//
// 现在集中在这里。

import type { RoleKey } from '@/stores/user'

/** 简写 · 顶部徽章 / 工作流节点 / 处理人维度使用 */
export const ROLE_SHORT_LABEL: Readonly<Record<RoleKey, string>> = Object.freeze({
  agent: '坐席',
  business: '支撑岗',
  review: '审查人员',
  manage: '管理层',
  consumer: '消费者'
})

/** 长名 · 弹窗卡片、欢迎页维度使用(从 user store ROLE_LIST 自动派生) */
import { ROLE_LIST } from '@/stores/user'
export const ROLE_FULL_LABEL: Readonly<Record<RoleKey, string>> = Object.freeze(
  ROLE_LIST.reduce(
    (acc, r) => {
      acc[r.key] = r.name
      return acc
    },
    {} as Record<RoleKey, string>
  )
)

/** 兼容性兜底(传给一个不认识的 key 比如 'system' / 'unknown' / null) */
function fallback(r: string): string {
  return r
}

/** 简写:坐席 / 支撑岗 / 审查人员 / 管理层 / 消费者(无值时原样返回) */
export function roleShortLabel(r: string | null | undefined): string {
  if (!r) return ''
  return (ROLE_SHORT_LABEL as Record<string, string>)[r] ?? fallback(r)
}

/** 长名:一线客服坐席 / 业务支撑岗 / 消保审查人员 / 消保管理层(无值时原样返回) */
export function roleFullLabel(r: string | null | undefined): string {
  if (!r) return ''
  return (ROLE_FULL_LABEL as Record<string, string>)[r] ?? fallback(r)
}

/** 兼容旧 API:`roleLabelByKey(r)`(坐席/支撑岗/审查人员/管理层 简写) */
export const roleLabelByKey = roleShortLabel
