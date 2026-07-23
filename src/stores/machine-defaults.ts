// V2 状态机默认数据
// 把 V1 里的 12 条 trigger 文本规则,翻译为 V2 的结构化(状态+边+守卫+钩子)
// 这一份是 V2 的"演示机器",管理层在 ticket-state-v2 配置页维护

import type { StateMachine } from './ticket-machine'

export const DEFAULT_V2_MACHINE: StateMachine = {
  id: 'machine.ticket.complaint',
  name: '消保投诉工单状态机',
  version: '2.3.0',
  status: 'published',
  appliesTo: ['complaint', 'regulator', 'external', 'business'],
  priority: 1,

  states: [
    {
      id: 'pending',
      code: 'pending',
      name: '待分派',
      category: 'start',
      assignment: { kind: 'rule', ruleCode: 'rule.assign.basic' },
      sla: { duration: 'PT24H', businessHoursOnly: false, warnBefore: 'PT2H' },
      onEnter: [
        {
          kind: 'fetch',
          fetcher: 'kb.recommend',
          into: 'kbSuggest',
          onError: 'warn'
        }
      ],
      color: '#00b42a'
    },
    {
      id: 'todo',
      code: 'todo',
      name: '待接收',
      category: 'intermediate',
      assignment: { kind: 'role', role: 'agent' },
      sla: { duration: 'PT8H', businessHoursOnly: false, warnBefore: 'PT1H' },
      onEnter: [
        {
          kind: 'fetch',
          fetcher: 'call.history',
          into: 'lastCall',
          onError: 'continue'
        }
      ],
      color: '#165dff'
    },
    {
      id: 'processing',
      code: 'processing',
      name: '处理中',
      category: 'intermediate',
      assignment: { kind: 'role', role: 'agent' },
      // SLA 由 regulatorOverrides 覆盖
      sla: { duration: 'P15D', businessHoursOnly: false, warnBefore: 'P1D' },
      onEnter: [
        // 监管件:抓征信
        {
          kind: 'fetch',
          fetcher: 'credit.query',
          into: 'credit',
          onError: 'warn'
        },
        // 通知支撑岗
        {
          kind: 'notify',
          template: 'ticket.processing_started',
          channel: 'sys',
          target: 'role:business'
        }
      ],
      color: '#165dff'
    },
    {
      id: 'transfer',
      code: 'transfer',
      name: '待流转',
      category: 'intermediate',
      assignment: { kind: 'role', role: 'agent' },
      sla: { duration: 'PT4H', businessHoursOnly: false, warnBefore: 'PT30M' },
      color: '#722ed1'
    },
    {
      id: 'closing',
      code: 'closing',
      name: '待关单',
      category: 'intermediate',
      assignment: { kind: 'role', role: 'agent' },
      sla: { duration: 'P3D', businessHoursOnly: false, warnBefore: 'PT12H' },
      onEnter: [
        {
          kind: 'set-field',
          path: 'status',
          value: 'awaiting_close'
        }
      ],
      color: '#ff7d00'
    },
    {
      id: 'closed',
      code: 'closed',
      name: '已关单',
      category: 'end',
      assignment: { kind: 'system' },
      color: '#86909c'
    }
  ],

  transitions: [
    // V1 第 1 条:坐席接收规则  todo -> processing
    {
      id: 't.accept',
      from: 'todo',
      to: 'processing',
      event: 'agent_accept',
      priority: 10,
      label: '坐席主动接收'
    },
    // V1 第 2 条:转办  processing -> transfer
    {
      id: 't.transfer',
      from: 'processing',
      to: 'transfer',
      event: 'agent_transfer',
      priority: 10,
      label: '坐席选择转办',
      categories: ['complaint', 'external'],
      effects: [
        {
          kind: 'notify',
          template: 'ticket.transferred',
          channel: 'sys',
          target: 'role:business'
        }
      ]
    },
    // V1 第 3 条:升级  processing -> transfer
    {
      id: 't.escalate',
      from: 'processing',
      to: 'transfer',
      event: 'agent_escalate',
      priority: 9,
      label: '坐席选择升级',
      categories: ['complaint', 'regulator']
    },
    // V1 第 4 条:关单  closing -> closed
    {
      id: 't.close',
      from: 'closing',
      to: 'closed',
      event: 'agent_close',
      priority: 10,
      label: '坐席确认关单',
      effects: [
        {
          kind: 'webhook',
          url: 'https://reg-platform.example.com/api/report',
          method: 'POST',
          body: '{"ticketId":"{{ ticket.id }}","status":"closed"}'
        }
      ]
    },
    // V1 第 5 条:监管件直接归档  processing -> closed
    {
      id: 't.regulator.archive',
      from: 'processing',
      to: 'closed',
      event: 'regulator_archive',
      priority: 10,
      label: '监管件直接归档',
      categories: ['regulator'],
      effects: [
        {
          kind: 'invoke',
          functionCode: 'regulator.report',
          input: {
            ticketId: 'ticket.id',
            summary: 'fields.summary'
          },
          await: true,
          onError: 'warn'
        }
      ]
    },
    // V1 第 6 条:自动催办  todo -> todo(自环,V2 不画边,在 hook 实现)
    // 改为超时 onEnter 钩子:不在 transition 列表里
    // V1 第 7 条:超时升级  processing -> transfer(超时事件)
    {
      id: 't.timeout.escalate',
      from: 'processing',
      to: 'transfer',
      event: 'timeout',
      priority: 5,
      label: '超时升级',
      guard: { kind: 'sla', remaining: { lt: 'PT0S' } }
    },
    // V1 第 8 条:审批驳回  transfer -> processing
    {
      id: 't.approval.rejected',
      from: 'transfer',
      to: 'processing',
      event: 'approval_rejected',
      priority: 10,
      label: '审批驳回',
      categories: ['business']
    },
    // V1 第 9 条:客户不满意升级  closed -> processing
    {
      id: 't.satisfaction.low',
      from: 'closed',
      to: 'processing',
      event: 'satisfaction_low',
      priority: 10,
      label: '客户不满意升级',
      categories: ['complaint'],
      guard: { kind: 'expr', expr: 'fields.satisfaction <= 2' }
    },
    // V1 第 10 条:方案违约恢复  processing -> processing(自环,V2 用 set-field)
    // 在 processing onEnter 加 plan_breached 处理
    // V1 第 11 条:客户达成一致  processing -> closing
    {
      id: 't.customer.signed',
      from: 'processing',
      to: 'closing',
      event: 'customer_signed',
      priority: 10,
      label: '客户达成一致'
    },
    // V1 第 12 条:知识归档触发(在 closed 离开时)
    {
      id: 't.kb.archive',
      from: 'closed',
      to: 'closed',
      event: 'auto_advance',
      priority: 1,
      label: '知识归档触发',
      categories: ['business']
    }
  ],

  // 监管件覆盖:7d SLA + 6h 预警
  regulatorOverrides: {
    '12378': {
      stateOverrides: {
        processing: {
          sla: { duration: 'P7D', businessHoursOnly: true, warnBefore: 'PT6H', businessCalendar: 'cn-gov' }
        }
      }
    },
    '12345': {
      stateOverrides: {
        processing: {
          sla: { duration: 'P15D', businessHoursOnly: true, warnBefore: 'P1D', businessCalendar: 'cn-gov' }
        }
      }
    }
  }
}
