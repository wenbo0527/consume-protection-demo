// ServiceRegistry —— 钩子执行的依赖注入层
// 实际生产环境会注入真实服务(征信 API/通知网关/工作流引擎等)
// 当前是前端 mock,演示钩子编排能力

import type { Ticket, StateEvent } from './ticket-machine'

// ============ 服务契约 ============

export interface FetcherSpec {
  code: string
  description: string
  inputSchema: Record<string, string>
  outputSchema: Record<string, string>
}

export interface Fetcher extends FetcherSpec {
  invoke(input: Record<string, unknown>, ticket: Ticket): Promise<Record<string, unknown>>
}

export interface BusinessFunction extends FetcherSpec {
  invoke(input: Record<string, unknown>, ticket: Ticket): Promise<{ ok: boolean; data?: unknown; message?: string }>
}

export interface Notifier {
  send(channel: 'sys' | 'sms' | 'email' | 'wechat', target: string, template: string, vars: Record<string, unknown>): Promise<{ ok: boolean; messageId?: string }>
}

export interface WebhookSender {
  send(url: string, method: 'POST' | 'PUT', headers: Record<string, string>, body: unknown): Promise<{ ok: boolean; statusCode?: number }>
}

export interface WorkflowStarter {
  start(kind: string, payload: Record<string, unknown>, ticket: Ticket): Promise<{ instanceId: string }>
}

export interface ServiceRegistry {
  fetchers: Map<string, Fetcher>
  functions: Map<string, BusinessFunction>
  notify: Notifier
  webhook: WebhookSender
  workflow: WorkflowStarter
}

// ============ Mock 实现 ============

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// 1. 征信抓取 mock
const creditFetcher: Fetcher = {
  code: 'credit.query',
  description: '查询客户征信报告',
  inputSchema: { idNumber: 'string', name: 'string' },
  outputSchema: { score: 'number', overdueCount: 'number', reportId: 'string' },
  async invoke(input) {
    await sleep(150)
    return {
      score: 720 + Math.floor(Math.random() * 80),
      overdueCount: Math.floor(Math.random() * 3),
      reportId: 'CR-' + Date.now()
    }
  }
}

// 2. 通话记录抓取 mock
const callRecordFetcher: Fetcher = {
  code: 'call.history',
  description: '查询最近一次通话记录',
  inputSchema: { customerId: 'string' },
  outputSchema: { lastCallAt: 'string', duration: 'number', agent: 'string' },
  async invoke(input) {
    await sleep(100)
    return {
      lastCallAt: new Date(Date.now() - 3600_000).toISOString(),
      duration: 320,
      agent: '坐席-张敏'
    }
  }
}

// 3. 知识库推荐 mock
const knowledgeFetcher: Fetcher = {
  code: 'kb.recommend',
  description: '根据工单内容推荐知识条目',
  inputSchema: { keywords: 'string[]' },
  outputSchema: { items: 'Array<{id, title, score}>' },
  async invoke(input) {
    await sleep(80)
    return {
      items: [
        { id: 'KB-001', title: '退费类投诉处理要点', score: 0.92 },
        { id: 'KB-007', title: '客户情绪安抚话术', score: 0.85 }
      ]
    }
  }
}

// 4. 启动停催停扣业务工作流
const startStopCollection: BusinessFunction = {
  code: 'stop_collection.activate',
  description: '激活停催停扣',
  inputSchema: { ticketId: 'string', period: 'string' },
  outputSchema: { activated: 'boolean' },
  async invoke(input) {
    await sleep(50)
    return { ok: true, data: { activated: true } }
  }
}

// 5. 报送监管平台
const reportToRegulator: BusinessFunction = {
  code: 'regulator.report',
  description: '向监管平台报送处理结果',
  inputSchema: { ticketId: 'string', summary: 'string' },
  outputSchema: { reportId: 'string' },
  async invoke(input) {
    await sleep(200)
    return { ok: true, data: { reportId: 'RPT-' + Date.now() } }
  }
}

// 6. 通知服务
const mockNotifier: Notifier = {
  async send(channel, target, template, vars) {
    await sleep(40)
    // eslint-disable-next-line no-console
    console.info(`[cp-notify] channel=${channel} target=${target} tpl=${template}`, vars)
    return { ok: true, messageId: 'N-' + Date.now() }
  }
}

// 7. Webhook
const mockWebhook: WebhookSender = {
  async send(url, method, headers, body) {
    await sleep(100)
    // eslint-disable-next-line no-console
    console.info(`[cp-webhook] ${method} ${url}`, { headers, body })
    return { ok: true, statusCode: 200 }
  }
}

// 8. 业务工作流启动器(占位,实际指向 workflowStore.start)
const mockWorkflowStarter: WorkflowStarter = {
  async start(kind, payload, ticket) {
    await sleep(30)
    return { instanceId: 'WF-' + Date.now() }
  }
}

// ============ 工厂 ============

let _registry: ServiceRegistry | null = null

export function getServiceRegistry(): ServiceRegistry {
  if (_registry) return _registry
  const fetchers = new Map<string, Fetcher>()
  fetchers.set(creditFetcher.code, creditFetcher)
  fetchers.set(callRecordFetcher.code, callRecordFetcher)
  fetchers.set(knowledgeFetcher.code, knowledgeFetcher)
  const functions = new Map<string, BusinessFunction>()
  functions.set(startStopCollection.code, startStopCollection)
  functions.set(reportToRegulator.code, reportToRegulator)
  _registry = {
    fetchers,
    functions,
    notify: mockNotifier,
    webhook: mockWebhook,
    workflow: mockWorkflowStarter
  }
  return _registry
}

// 测试可重置
export function resetServiceRegistry() {
  _registry = null
}
