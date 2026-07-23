// Guard 评估器
// 把 V2 的 Guard 结构化条件,转换为可执行的布尔结果
// 表达式部分委托给 expr-eval,白名单只允许访问 ticket.* / sla.* / ctx.user.*

import { Parser, type Expression } from 'expr-eval'
import type {
  Guard,
  Ticket,
  StateEvent,
  DispatchResult,
  StateMachine,
  StateNode,
  StateTransition,
  StateHook,
  HookResult,
  TransitionRecord
} from './ticket-machine'
import { runHook } from './machine-hooks'
import { nowIso } from './machine-utils'

const parser = new Parser({
  operators: {
    add: true,
    concatenate: true,
    conditional: true,
    divide: true,
    factorial: false, // 关掉,防止数学滥用
    multiply: true,
    power: false,
    remainder: true,
    subtract: true,
    logical: true,
    comparison: true,
    in: true,
    assignment: false // 关键:禁止赋值
  }
})

// 表达式沙箱:仅暴露白名单字段
export interface GuardContext {
  ticket: Ticket
  event: StateEvent
  /** 剩余 SLA,格式 'PT4H30M',由调用方注入 */
  sla?: { remaining: string; expired: boolean }
  ctx: {
    user: { id?: string; role?: string }
    now: string
  }
}

/**
 * 把 GuardContext 转成 expr-eval 能理解的嵌套对象
 * 让 `fields.amount > 5000` 能直接解析
 */
export function buildExprVars(ctx: GuardContext): Record<string, unknown> {
  return {
    ticket: {
      id: ctx.ticket.id,
      category: ctx.ticket.category,
      regulatorSubType: ctx.ticket.regulatorSubType,
      currentState: ctx.ticket.currentState,
      createdAt: ctx.ticket.createdAt,
      fields: ctx.ticket.fields
    },
    fields: ctx.ticket.fields, // 字段快捷访问
    sla: {
      remaining: ctx.sla?.remaining ?? 'P0D',
      expired: ctx.sla?.expired ?? false
    },
    ctx: {
      user: ctx.ctx.user,
      now: ctx.ctx.now
    },
    event: {
      type: ctx.event.type,
      payload: ctx.event.payload ?? {}
    }
  }
}

let _exprCache = new Map<string, Expression>()

function getExpr(expr: string): Expression | null {
  if (_exprCache.has(expr)) return _exprCache.get(expr)!
  try {
    const e = parser.parse(expr)
    _exprCache.set(expr, e)
    return e
  } catch {
    return null
  }
}

export function evaluateExpr(expr: string, ctx: GuardContext): boolean {
  const e = getExpr(expr)
  if (!e) return false
  try {
    // expr-eval 的 evaluate 接受 Record<string, Value>,但我们的 vars 是 unknown
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = e.evaluate(buildExprVars(ctx) as any)
    return Boolean(result)
  } catch {
    return false
  }
}

export function evaluateGuard(
  guard: Guard | undefined,
  ctx: GuardContext
): { ok: boolean; reason: string } {
  if (!guard) return { ok: true, reason: 'no-guard' }
  switch (guard.kind) {
    case 'always':
      return { ok: true, reason: 'always' }
    case 'expr':
      return evaluateExpr(guard.expr, ctx)
        ? { ok: true, reason: `expr:${guard.expr}` }
        : { ok: false, reason: `expr-miss:${guard.expr}` }
    case 'category':
      return guard.in.includes(ctx.ticket.category)
        ? { ok: true, reason: `category-in:${ctx.ticket.category}` }
        : { ok: false, reason: `category-out:${ctx.ticket.category}` }
    case 'regulator':
      if (ctx.ticket.category !== 'regulator')
        return { ok: false, reason: 'not-regulator' }
      if (!guard.subTypes || guard.subTypes.length === 0)
        return { ok: true, reason: 'regulator-any' }
      return guard.subTypes.includes(ctx.ticket.regulatorSubType as any)
        ? { ok: true, reason: `regulator-in:${ctx.ticket.regulatorSubType}` }
        : { ok: false, reason: `regulator-out:${ctx.ticket.regulatorSubType}` }
    case 'sla': {
      if (!ctx.sla || !guard.remaining) return { ok: true, reason: 'no-sla' }
      const rem = ctx.sla.remaining
      if (guard.remaining.lt && rem >= guard.remaining.lt)
        return { ok: false, reason: `sla-not-lt:${rem}>=${guard.remaining.lt}` }
      if (guard.remaining.gt && rem <= guard.remaining.gt)
        return { ok: false, reason: `sla-not-gt:${rem}<=${guard.remaining.gt}` }
      return { ok: true, reason: `sla-ok:${rem}` }
    }
    case 'and':
      for (const it of guard.items) {
        const r = evaluateGuard(it, ctx)
        if (!r.ok) return { ok: false, reason: `and:${r.reason}` }
      }
      return { ok: true, reason: 'and-ok' }
    case 'or': {
      const last = guard.items[guard.items.length - 1]
      const r = evaluateGuard(last, ctx)
      return r.ok ? { ok: true, reason: `or:${r.reason}` } : { ok: false, reason: `or-all-miss` }
    }
    case 'not':
      return evaluateGuard(guard.item, ctx).ok
        ? { ok: false, reason: 'not-fail' }
        : { ok: true, reason: 'not-ok' }
  }
}

// ============ 状态机 Runner ============

export interface RunnerOptions {
  /** 注入服务注册表(钩子执行需要) */
  services?: import('./machine-services').ServiceRegistry
  /** 注入 SLA 评估器 */
  computeSla?: (ticket: Ticket, state: StateNode) => { remaining: string; expired: boolean }
}

export function createRunner(machine: StateMachine, opts: RunnerOptions = {}) {
  const stateById = new Map(machine.states.map((s) => [s.id, s]))

  function findMatchingTransition(
    currentStateId: string,
    event: StateEvent,
    ctx: GuardContext
  ): { transition: StateTransition; reason: string } | null {
    const candidates: StateTransition[] = []
    for (const t of machine.transitions) {
      if (t.event !== event.type && t.event !== 'manual') continue
      if (t.from === 'ANY') {
        candidates.push(t)
        continue
      }
      if (t.from === currentStateId) candidates.push(t)
    }
    // 排序:priority 降序
    candidates.sort((a, b) => b.priority - a.priority)
    const rejected: Array<{ transitionId: string; reason: string }> = []
    for (const t of candidates) {
      // categories 过滤(transition 级别的 scope)
      if (t.categories && t.categories.length > 0) {
        if (!t.categories.includes(ctx.ticket.category as any)) {
          rejected.push({ transitionId: t.id, reason: `category-miss` })
          continue
        }
      }
      const g = evaluateGuard(t.guard, ctx)
      if (g.ok) return { transition: t, reason: g.reason }
      rejected.push({ transitionId: t.id, reason: g.reason })
    }
    // 把 rejected 挂到 ctx 让上层知道
    ;(ctx as any).__rejected = rejected
    return null
  }

  async function dispatch(
    ticket: Ticket,
    event: StateEvent,
    userCtx: { user: { id?: string; role?: string } } = { user: {} }
  ): Promise<DispatchResult> {
    const ctx: GuardContext = {
      ticket,
      event,
      sla: opts.computeSla
        ? opts.computeSla(ticket, stateById.get(ticket.currentState)!)
        : undefined,
      ctx: { user: userCtx.user, now: nowIso() }
    }

    const currentState = stateById.get(ticket.currentState)
    if (!currentState) {
      return {
        transitioned: false,
        hookResults: [],
        warnings: [],
        errors: [`unknown-current-state:${ticket.currentState}`]
      }
    }

    const match = findMatchingTransition(ticket.currentState, event, ctx)
    if (!match) {
      return {
        transitioned: false,
        fromState: ticket.currentState,
        hookResults: [],
        warnings: [],
        errors: [],
        rejectedBy: (ctx as any).__rejected
      }
    }

    const targetState = stateById.get(match.transition.to)
    if (!targetState) {
      return {
        transitioned: false,
        fromState: ticket.currentState,
        hookResults: [],
        warnings: [],
        errors: [`unknown-target-state:${match.transition.to}`]
      }
    }

    const hookResults: HookResult[] = []
    const warnings: string[] = []
    const errors: string[] = []

    // 1. onExit
    if (currentState.onExit) {
      for (const h of currentState.onExit) {
        const r = await runHook(h, { ticket, event, services: opts.services, mode: 'exit' })
        hookResults.push(r)
        if (r.status === 'fail') errors.push(`onExit:${r.message}`)
        else if (r.status === 'warn') warnings.push(`onExit:${r.message}`)
      }
    }

    // 2. transition.effects
    if (match.transition.effects) {
      for (const h of match.transition.effects) {
        const r = await runHook(h, { ticket, event, services: opts.services, mode: 'effect' })
        hookResults.push(r)
        if (r.status === 'fail') errors.push(`effect:${r.message}`)
        else if (r.status === 'warn') warnings.push(`effect:${r.message}`)
      }
    }

    // 3. 切换状态
    ticket.currentState = targetState.id
    ticket.currentStateEnteredAt = nowIso()

    // 4. onEnter
    if (targetState.onEnter) {
      for (const h of targetState.onEnter) {
        const r = await runHook(h, { ticket, event, services: opts.services, mode: 'enter' })
        hookResults.push(r)
        if (r.status === 'fail') errors.push(`onEnter:${r.message}`)
        else if (r.status === 'warn') warnings.push(`onEnter:${r.message}`)
      }
    }

    // 5. 写历史
    const record: TransitionRecord = {
      from: currentState.id,
      to: targetState.id,
      event,
      hookResults,
      occurredAt: nowIso()
    }
    ticket.history.push(record)

    return {
      transitioned: true,
      fromState: currentState.id,
      toState: targetState.id,
      matchedTransitionId: match.transition.id,
      hookResults,
      warnings,
      errors
    }
  }

  return { dispatch, machine, findState: (id: string) => stateById.get(id) }
}
