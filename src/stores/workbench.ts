import { defineStore } from 'pinia'

// 工作台任务类型(驱动坐席/业务执行台)
export type WorkbenchTaskType =
  | 'incoming_call'      // 来电
  | 'incoming_message'   // 在线会话
  | 'todo_ticket'        // 待办工单
  | 'regulator_urgent'   // 监管件即将超时
  | 'approval_rejected'  // 审批驳回
  | 'stop_expire'        // 停催/停扣即将到期
  | 'negotiate_overdue'  // 协商方案到期/违约
  | 'knowledge_update'   // 知识库更新

export interface WorkbenchTask {
  id: string
  type: WorkbenchTaskType
  title: string
  desc: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  customerId?: string
  customerName?: string
  ticketId?: string
  createdAt: string
  source: string         // 来源:来电/系统/规则引擎
  meta?: Record<string, any>
}

// 状态:坐席当前通话中
export type AgentStatus = 'idle' | 'ringing' | 'oncall' | 'wrapup' | 'break'

export const useWorkbenchStore = defineStore('workbench', {
  state: () => ({
    // 当前选中的任务(决定主区显示什么)
    activeTask: null as WorkbenchTask | null,

    // 来电/事件弹屏(最高优先级,Modal 形式)
    incoming: null as WorkbenchTask | null,

    // 任务流(左侧列表)
    stream: [] as WorkbenchTask[],

    // 坐席状态
    agentStatus: 'idle' as AgentStatus,

    // 当前通话信息
    call: null as { customerId: string; customerName: string; phone: string; duration: number; startAt: number } | null
  }),

  getters: {
    criticalTasks: (s) => s.stream.filter(t => t.priority === 'critical'),
    highTasks: (s) => s.stream.filter(t => t.priority === 'high'),
    todoTasks: (s) => s.stream.filter(t => t.type === 'todo_ticket')
  },

  actions: {
    // 触发来电(模拟)
    triggerIncoming(task: WorkbenchTask) {
      this.incoming = task
      this.agentStatus = 'ringing'
    },

    // 接听电话
    answerCall() {
      const inc = this.incoming
      if (!inc) return
      this.incoming = null
      this.agentStatus = 'oncall'
      this.call = {
        customerId: inc.customerId || '',
        customerName: inc.customerName || '',
        phone: '138****5621',
        duration: 0,
        startAt: Date.now()
      }
      // 自动选中该任务进入操作区
      this.activeTask = inc
    },

    // 挂断/整理
    hangup() {
      this.agentStatus = 'wrapup'
      this.call = null
    },

    // 设置空闲
    setIdle() {
      this.agentStatus = 'idle'
      this.activeTask = null
    },

    // 选中任务(主区切换)
    selectTask(task: WorkbenchTask) {
      this.activeTask = task
    },

    // 刷新任务流(模拟从后端拉取)
    refreshStream(tasks: WorkbenchTask[]) {
      this.stream = tasks
    },

    // 从流中移除任务
    removeTask(taskId: string) {
      this.stream = this.stream.filter(t => t.id !== taskId)
      if (this.activeTask?.id === taskId) this.activeTask = null
    }
  }
})

// 工作台初始任务流 Mock
export const INITIAL_STREAM: WorkbenchTask[] = [
  {
    id: 'T-INCOMING', type: 'incoming_call', title: '来电:周志远',
    desc: '138****2233 · 扬言标签 · 历史投诉 6 次',
    priority: 'critical', customerId: 'C003', customerName: '周志远',
    createdAt: '2026-07-15 16:48', source: '呼叫中心'
  },
  {
    id: 'T-001', type: 'regulator_urgent', title: '监管件即将超时',
    desc: 'GD-20260709-0015 剩余 2 天 · 客户信息泄露',
    priority: 'critical', ticketId: 'GD-20260709-0015',
    createdAt: '2026-07-15 09:00', source: '规则引擎'
  },
  {
    id: 'T-002', type: 'todo_ticket', title: '待办工单(3)',
    desc: 'GD-20260714-0008 投诉 · 扬言投诉',
    priority: 'high', ticketId: 'GD-20260714-0008', customerId: 'C003', customerName: '周志远',
    createdAt: '2026-07-14 16:48', source: '工单系统'
  },
  {
    id: 'T-003', type: 'stop_expire', title: '停催即将到期',
    desc: 'ST-20260710-0001 明天到期 · 刘建国',
    priority: 'high', customerId: 'C001', customerName: '刘建国',
    createdAt: '2026-07-14 10:00', source: '规则引擎',
    meta: { expireAt: '2026-07-16' }
  },
  {
    id: 'T-004', type: 'approval_rejected', title: '审批驳回',
    desc: 'ST-20260708-0009 停催申请被驳回 · 材料不全',
    priority: 'medium', customerId: 'C003', customerName: '周志远',
    createdAt: '2026-07-13 14:00', source: 'OA系统'
  },
  {
    id: 'T-005', type: 'negotiate_overdue', title: '协商方案违约',
    desc: 'NX-20260601-0078 已逾期 5 天 · 催收已自动恢复',
    priority: 'high', ticketId: 'GD-20260610-0015',
    createdAt: '2026-07-15 08:00', source: '规则引擎'
  },
  {
    id: 'T-006', type: 'knowledge_update', title: '知识库更新',
    desc: '速贷宝 Pro 产品介绍已审核生效',
    priority: 'low', createdAt: '2026-07-14 16:30', source: '审查归档'
  }
]