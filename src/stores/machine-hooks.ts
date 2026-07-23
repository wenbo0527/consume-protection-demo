// StateHook 评估器
// 串行执行钩子,根据 onError 配置决定容错策略

import type { StateHook, HookResult, Ticket, StateEvent } from './ticket-machine'
import type { ServiceRegistry } from './machine-services'
import { getServiceRegistry } from './machine-services'
import { getPath, setPath, nowIso } from './machine-utils'

export interface RunHookContext {
  ticket: Ticket
  event: StateEvent
  services?: ServiceRegistry
  mode: 'enter' | 'exit' | 'effect'
}

export async function runHook(hook: StateHook, ctx: RunHookContext): Promise<HookResult> {
  const start = Date.now()
  const services = ctx.services ?? getServiceRegistry()
  try {
    switch (hook.kind) {
      case 'fetch': {
        const f = services.fetchers.get(hook.fetcher)
        if (!f) {
          return fail(hook, start, `fetcher-not-found:${hook.fetcher}`)
        }
        const input = resolveInputFromPath(ctx.ticket, hook.into) // 让 fetcher 看到上下文
        const out = await f.invoke(input, ctx.ticket)
        // 写入工单字段: hook.into 是目标路径
        if (hook.into) setPath(ctx.ticket.fields, hook.into, out)
        return ok(hook, start, out)
      }
      case 'invoke': {
        const fn = services.functions.get(hook.functionCode)
        if (!fn) return fail(hook, start, `function-not-found:${hook.functionCode}`)
        const input = mapInput(hook.input, ctx.ticket, ctx.event)
        const r = await fn.invoke(input, ctx.ticket)
        if (!r.ok) return fail(hook, start, r.message ?? 'invoke-failed')
        return ok(hook, start, r.data)
      }
      case 'notify': {
        const vars = collectVars(ctx.ticket, ctx.event)
        const r = await services.notify.send(hook.channel, hook.target, hook.template, vars)
        if (!r.ok) return fail(hook, start, 'notify-failed')
        return ok(hook, start, { messageId: r.messageId })
      }
      case 'start-workflow': {
        const payload = mapInput(hook.payload, ctx.ticket, ctx.event)
        const r = await services.workflow.start(hook.workflowKind, payload, ctx.ticket)
        return ok(hook, start, r)
      }
      case 'set-field': {
        let value: any = hook.value
        if (typeof value === 'object' && value !== null && 'expr' in (value as any)) {
          // 表达式求值(简单实现:从 ticket.fields 取)
          const expr = (value as any).expr
          // 不在这里引 expr-eval,避免循环依赖;简单属性路径
          value = getPath(ctx.ticket.fields, expr.replace(/^fields\./, ''))
        }
        setPath(ctx.ticket.fields, hook.path, value)
        return ok(hook, start, { path: hook.path, value })
      }
      case 'webhook': {
        const body = hook.body
          ? safeParseJSON(hook.body, ctx.ticket)
          : { ticketId: ctx.ticket.id, fields: ctx.ticket.fields, event: ctx.event }
        const r = await services.webhook.send(hook.url, hook.method, hook.headers ?? {}, body)
        if (!r.ok) return fail(hook, start, `webhook-status-${r.statusCode}`)
        return ok(hook, start, r)
      }
    }
  } catch (e: any) {
    return fail(hook, start, e?.message ?? String(e))
  }
}

function ok(hook: StateHook, start: number, data?: unknown): HookResult {
  return { hook, status: 'ok', data, durationMs: Date.now() - start }
}
function fail(hook: StateHook, start: number, message: string): HookResult {
  // 失败时根据 onError 决定级别
  const onError = (hook as any).onError ?? 'fail'
  return {
    hook,
    status: onError === 'continue' ? 'skipped' : onError === 'warn' ? 'warn' : 'fail',
    message,
    durationMs: Date.now() - start
  }
}

/** 把 { "a.b.c": "ticket.x" } 映射成 { a: { b: { c: <x 值> } } } */
function mapInput(
  spec: Record<string, string> | undefined,
  ticket: Ticket,
  event: StateEvent
): Record<string, unknown> {
  if (!spec) return {}
  const out: Record<string, unknown> = {}
  for (const [k, path] of Object.entries(spec)) {
    if (path.startsWith('ticket.')) {
      out[k] = getPath(ticket, path.slice('ticket.'.length))
    } else if (path.startsWith('fields.')) {
      out[k] = getPath(ticket.fields, path.slice('fields.'.length))
    } else if (path.startsWith('event.')) {
      out[k] = getPath(event, path.slice('event.'.length))
    } else {
      out[k] = path // 字面量
    }
  }
  return out
}

function resolveInputFromPath(ticket: Ticket, into: string): Record<string, unknown> {
  // 简单约定:fetcher 期望的输入是 into 路径所在的对象
  // 这里只把整个 fields 给它,fetcher 自己挑
  return { fields: ticket.fields, ticketId: ticket.id, category: ticket.category }
}

function collectVars(ticket: Ticket, event: StateEvent): Record<string, unknown> {
  return {
    ticketId: ticket.id,
    category: ticket.category,
    currentState: ticket.currentState,
    eventType: event.type,
    ...flatten(ticket.fields, 'fields')
  }
}

function flatten(obj: any, prefix: string, out: Record<string, unknown> = {}): Record<string, unknown> {
  if (obj == null || typeof obj !== 'object') return out
  for (const [k, v] of Object.entries(obj)) {
    const key = `${prefix}.${k}`
    if (v != null && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out)
    else out[key] = v
  }
  return out
}

function safeParseJSON(tpl: string, ticket: Ticket): unknown {
  // 简单模板: {{ ticket.id }} / {{ fields.amount }} / {{ event.type }}
  const replaced = tpl.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, p) => {
    const path = p.trim()
    let v: unknown
    if (path.startsWith('ticket.')) {
      v = getPath(ticket, path.slice('ticket.'.length))
    } else if (path.startsWith('fields.')) {
      v = getPath(ticket.fields, path.slice('fields.'.length))
    } else {
      v = getPath(ticket, path)
    }
    if (v == null) return ''
    if (typeof v === 'string') return v
    return JSON.stringify(v)
  })
  try {
    return JSON.parse(replaced)
  } catch {
    return { raw: replaced }
  }
}
