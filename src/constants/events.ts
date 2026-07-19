// 全局事件名常量(防止散落 + 拼写错误)
// 用法:import { EVT } from '@/constants/events';
//      window.addEventListener(EVT.WORKFLOW_NOTIFY_SEAT, handler)
//      window.dispatchEvent(new CustomEvent(EVT.WORKFLOW_KB_ARCHIVE, ...))

export const EVT = {
  // 工作流 → 知识库:写入归档条目
  WORKFLOW_KB_ARCHIVE: 'cp-workflow-kb-archive',
  // 工作流 → 通知中心:通知坐席
  WORKFLOW_NOTIFY_SEAT: 'cp-workflow-notify-seat',
  // 工作流 → 通知中心:预警已验证
  WORKFLOW_ALERT_VERIFIED: 'cp-workflow-alert-verified',
  // 工作流 → 通知中心:实例过期升级
  WORKFLOW_OVERDUE: 'cp-workflow-overdue',
  // 整改 → 知识库:验证后沉淀
  RECTIFY_VERIFIED: 'cp-rectify-verified',
  // 整改派发(责任提醒)
  RECTIFY_TASK_CREATED: 'cp-rectify-task-created',
  RECTIFY_TASK_DONE: 'cp-rectify-task-done'
} as const

export type EventName = (typeof EVT)[keyof typeof EVT]

/** 自定义事件 detail 的类型契约(派发 + 监听都用) */
export interface EventDetailMap {
  [EVT.WORKFLOW_KB_ARCHIVE]: { reviewId: string; kind: string }
  [EVT.WORKFLOW_NOTIFY_SEAT]: { instanceId: string; kind: string; ticketId?: string }
  [EVT.WORKFLOW_ALERT_VERIFIED]: { alertId?: string; instanceId: string }
  [EVT.WORKFLOW_OVERDUE]: { instanceId: string; kind: string; ticketId?: string; customerId?: string }
  [EVT.RECTIFY_VERIFIED]: { taskId: string; scene: string; requirement: string; owner: string }
  [EVT.RECTIFY_TASK_CREATED]: { taskId: string; owner: string }
  [EVT.RECTIFY_TASK_DONE]: { taskId: string; owner: string }
}
