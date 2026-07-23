// 路由 + 菜单 统一元数据
// 后续可以把 router.ts 和 MainLayout.vue 都从这个常量构造
// 当前阶段:MIGRATE-1 建立出口,菜单/路由仍各自维护;后续 PR 替换为完全由本文件驱动

import type { Component } from 'vue'

export interface RouteMetaDef {
  path: string // 'agent/desk'(相对 path,不含 root '/')
  name: string
  title: string // menu 显示名 & meta.title
  /** null = 容器(无 menu entry), undefined = 不在 menu */
  menuParent?: string
  menuOrder?: number
  showInMenu: boolean
  icon?: string
  /** 权限:role key 列表(空 = 所有人) */
  roles?: string[]
}

export const ROUTE_META: RouteMetaDef[] = [
  // 公共
  { path: 'login', name: 'Login', title: '登录', showInMenu: false },

  // 坐席侧
  { path: 'agent/desk', name: 'AgentDesk', title: '工作台', showInMenu: true, menuParent: '坐席', menuOrder: 1 },
  { path: 'agent/todo', name: 'AgentTodo', title: '工单列表', showInMenu: true, menuParent: '坐席', menuOrder: 2 },
  {
    path: 'agent/customer-search',
    name: 'AgentCustomerSearch',
    title: '客户画像查询',
    showInMenu: true,
    menuParent: '客户',
    menuOrder: 1
  },
  { path: 'agent/customer/:id', name: 'AgentCustomer', title: '客户画像', showInMenu: false },
  {
    path: 'agent/ticket-create',
    name: 'AgentTicketCreate',
    title: '创建工单',
    showInMenu: true,
    menuParent: '工单',
    menuOrder: 1
  },
  { path: 'agent/ticket/:id', name: 'AgentTicketDetail', title: '工单详情', showInMenu: false },
  {
    path: 'agent/knowledge',
    name: 'AgentKnowledge',
    title: '知识检索',
    showInMenu: true,
    menuParent: '知识',
    menuOrder: 1
  },
  {
    path: 'agent/reg-import',
    name: 'AgentRegImport',
    title: '监管转诉建单',
    showInMenu: true,
    menuParent: '工单',
    menuOrder: 2
  },
  { path: 'agent/batch', name: 'AgentBatch', title: '批量作业', showInMenu: true, menuParent: '工单', menuOrder: 3 },

  // 业务执行
  {
    path: 'business/desk',
    name: 'BusinessDesk',
    title: '业务执行工作台',
    showInMenu: true,
    menuParent: '业务执行',
    menuOrder: 1
  },
  {
    path: 'business/apply',
    name: 'BusinessApply',
    title: '业务申请审批',
    showInMenu: true,
    menuParent: '业务执行',
    menuOrder: 0
  },
  {
    path: 'agent/phone',
    name: 'AgentPhoneChannel',
    title: '电话工作台',
    showInMenu: true,
    menuParent: '坐席',
    menuOrder: 4
  },
  {
    path: 'agent/online-chat',
    name: 'AgentOnlineChat',
    title: '在线客服',
    showInMenu: true,
    menuParent: '坐席',
    menuOrder: 5
  },
  {
    path: 'business/pending',
    name: 'BusinessPending',
    title: '待办列表',
    showInMenu: true,
    menuParent: '业务',
    menuOrder: 2
  },
  {
    path: 'business/stop-coll',
    name: 'BusinessStopColl',
    title: '停催停扣',
    showInMenu: true,
    menuParent: '业务',
    menuOrder: 3
  },
  {
    path: 'business/negotiate',
    name: 'BusinessNegotiate',
    title: '协商还款',
    showInMenu: true,
    menuParent: '业务',
    menuOrder: 4
  },
  {
    path: 'business/credit',
    name: 'BusinessCredit',
    title: '征信异议',
    showInMenu: true,
    menuParent: '业务',
    menuOrder: 5
  },
  {
    path: 'business/transfer',
    name: 'BusinessTransfer',
    title: '转诉与调解',
    showInMenu: true,
    menuParent: '业务',
    menuOrder: 6
  },

  // 管理
  {
    path: 'manage/dashboard',
    name: 'ManageDashboard',
    title: '驾驶舱',
    showInMenu: true,
    menuParent: '管理',
    menuOrder: 1
  },
  { path: 'manage/alert', name: 'ManageAlert', title: '预警处置', showInMenu: true, menuParent: '管理', menuOrder: 2 },
  { path: 'manage/rule', name: 'ManageRule', title: '规则配置', showInMenu: true, menuParent: '管理', menuOrder: 3 },
  {
    path: 'manage/knowledge',
    name: 'ManageKnowledge',
    title: '知识管理',
    showInMenu: true,
    menuParent: '管理',
    menuOrder: 4
  },
  {
    path: 'manage/workflow-monitor',
    name: 'ManageWorkflowMonitor',
    title: '工单流转监控',
    showInMenu: true,
    menuParent: '管理',
    menuOrder: 5
  },
  {
    path: 'manage/quality',
    name: 'ManageQuality',
    title: '质检管理',
    showInMenu: true,
    menuParent: '运营',
    menuOrder: 1
  },
  { path: 'manage/ops', name: 'ManageOps', title: '运营管理', showInMenu: true, menuParent: '运营', menuOrder: 2 },
  { path: 'manage/exit', name: 'ManageExit', title: '贷中清退', showInMenu: true, menuParent: '运营', menuOrder: 3 },
  {
    path: 'manage/billing',
    name: 'ManageBilling',
    title: '票据合同',
    showInMenu: true,
    menuParent: '运营',
    menuOrder: 4
  },
  {
    path: 'manage/rectify',
    name: 'ManageRectify',
    title: '整改工作台',
    showInMenu: true,
    menuParent: '溯源整改',
    menuOrder: 1
  },
  { path: 'manage/lists', name: 'ManageList', title: '名单管理', showInMenu: true, menuParent: '管理', menuOrder: 6 },
  { path: 'manage/feedback', name: 'ManageFeedback', title: '满意度评价', showInMenu: true, menuParent: '管理', menuOrder: 5.5 },
  { path: 'manage/workflow-config', name: 'ManageWorkflowConfig', title: '工单流程配置(已迁移)', showInMenu: false },
  {
    path: 'manage/ticket-state',
    name: 'ManageTicketState',
    title: '工单状态机配置',
    showInMenu: true,
    menuParent: '流程管理',
    menuOrder: 1
  },
  {
    path: 'manage/bizflow',
    name: 'ManageBizFlow',
    title: '业务工作流配置',
    showInMenu: true,
    menuParent: '流程管理',
    menuOrder: 2
  },

  // 审查
  {
    path: 'review/pending',
    name: 'ReviewPending',
    title: '待审查',
    showInMenu: true,
    menuParent: '审查',
    menuOrder: 1
  },
  {
    path: 'review/create',
    name: 'ReviewCreate',
    title: '创建立项',
    showInMenu: true,
    menuParent: '审查',
    menuOrder: 2
  },
  { path: 'review/execute/:id', name: 'ReviewExecute', title: '审查执行', showInMenu: false },
  {
    path: 'review/standards',
    name: 'ReviewStandards',
    title: '审查标准',
    showInMenu: true,
    menuParent: '审查',
    menuOrder: 3
  },
  {
    path: 'review/promises',
    name: 'ReviewPromises',
    title: '投诉管控承诺',
    showInMenu: true,
    menuParent: '审查',
    menuOrder: 4
  },
  {
    path: 'review/audit-trail',
    name: 'ReviewAuditTrail',
    title: '审查追溯',
    showInMenu: true,
    menuParent: '审查',
    menuOrder: 5
  },

  // 消费者
  { path: 'consumer/complaints', name: 'ConsumerComplaints', title: '我的投诉', showInMenu: false },
  { path: 'consumer/feedback', name: 'ConsumerFeedback', title: '满意度', showInMenu: false }
]

/** 按 showInMenu 过滤 + 按 menuParent 分组 */
export function groupMenuByParent(): Record<string, RouteMetaDef[]> {
  const result: Record<string, RouteMetaDef[]> = {}
  ROUTE_META.filter((r) => r.showInMenu && r.menuParent)
    .sort((a, b) => (a.menuOrder || 99) - (b.menuOrder || 99))
    .forEach((r) => {
      const k = r.menuParent!
      if (!result[k]) result[k] = []
      result[k].push(r)
    })
  return result
}
