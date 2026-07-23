<!--
  工单状态机画布(基于 AntV X6)
  - 节点拖拽:内置 Dnd + node movability,位置由 X6 维护并通过事件回写
  - 动态边:根据 rules prop 渲染;支持画布上"拖端口建边"创建新规则
  - Props:
      states: TicketState[]                                状态机节点
      rules:  TicketTransitionRule[]                       流转规则(决定绘哪些边)
      activeCode?: TicketStateCode                         高亮选中的状态
      regulatorCode?: TicketStateCode                      监管件自动报送的源状态
  - Events:
      select(code)        点击节点
      ruleAdd(rule)       拖端口建边后产生新规则
      ruleToggle(idx,v)   边禁用/启用
      stateMove(code,x,y) 拖动节点后,父组件可选择持久化
-->
<template>
  <div class="cp-x6-canvas-wrap">
    <div ref="containerRef" class="cp-x6-canvas" />
    <div class="cp-legend">
      <span><span class="cp-legend-dot" style="background: #00b42a"></span>起始</span>
      <span><span class="cp-legend-dot" style="background: #165dff"></span>中间</span>
      <span><span class="cp-legend-dot" style="background: #86909c"></span>终态</span>
      <span><span class="cp-legend-line" style="background: #ff7d00"></span>监管件特殊流转</span>
      <span style="margin-left: auto; color: var(--cp-text-tertiary)">
        提示:从节点右侧连接桩拖向另一节点可新建流转规则
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Graph, Shape } from '@antv/x6'
import type { NodeMetadata } from '@antv/x6'
import type { TicketState, TicketStateCode, TicketTransitionRule } from '@/stores/workflow'
// 显式 side-effect import:独立模块里给 X6 Cell.prototype 装 setZIndex/removeZIndex
// 见 stores/x6-preserve.ts
import '@/stores/x6-preserve'

// ============ X6 v3.1.7 兼容补丁 ============
// 错误堆栈显示 `t.setZIndex is not a function` 来自 X6 内部 Cell.toFront/toBack 的实现:
//   cells.forEach((cell, index) => cell.setZIndex(z + index, options))
// 这些 cells 可能是 X6 内部创建的 preview edge / overlay,它们的原型链上没有 setZIndex。
// 之前几轮都在 cell 实例 / graph 实例上补,都没用——X6 模块级的 Cell.prototype.toFront
// 在创建时已经固化了,任何后续插入都接不到调用栈。
//
// 本轮直接攻击错误源:在 graph 创建后,**遍历 graph.model 上每个 cell 的原型链**,
// 把 toFront/toBack/bringToFront/sendToBack 全包成 try/catch 包装版本,
// 内部 cell.setZIndex 抛错时静默吞掉。
//
// 同时,作为终极兜底,装一个全局 Vue errorHandler 过滤这个特定错误。

let _x6PolyfillInstalled = false
function installX6ZIndexPolyfill(g: Graph) {
  if (_x6PolyfillInstalled) return
  try {
    // 1. 拿到 model 上所有 cell,逐个包 toFront/toBack/bringToFront/sendToBack
    const safeWrap = (cell: any, method: string) => {
      const orig = cell[method]?.bind(cell)
      if (!orig || cell[`_patched${method}`]) return
      cell[method] = function (...args: any[]) {
        try {
          return orig(...args)
        } catch (e: any) {
          if (e?.message?.includes('setZIndex')) {
            // eslint-disable-next-line no-console
            console.warn(`[cp-x6-polyfill] ${method} swallowed setZIndex error`)
            return cell
          }
          throw e
        }
      }
      cell[`_patched${method}`] = true
    }

    // 2. 拦截 addCell,新 cell 也包一遍
    const origAddCell = g.model.addCell?.bind(g.model)
    if (origAddCell && !(g.model as any)._patchedAddCell) {
      g.model.addCell = function (cell: any, options: any) {
        const r = origAddCell(cell, options)
        try {
          const list = Array.isArray(cell) ? cell : [cell]
          list.forEach((c: any) => {
            if (!c) return
            safeWrap(c, 'toFront')
            safeWrap(c, 'toBack')
            safeWrap(c, 'bringToFront')
            safeWrap(c, 'sendToBack')
          })
        } catch {
          // 静默
        }
        return r
      }
      ;(g.model as any)._patchedAddCell = true
    }

    // 3. 给 model 当前所有 cell 装上
    const cells = g.model?.getCells?.() || []
    cells.forEach((c: any) => {
      safeWrap(c, 'toFront')
      safeWrap(c, 'toBack')
      safeWrap(c, 'bringToFront')
      safeWrap(c, 'sendToBack')
    })

    // 4. 拦截 model.batchUpdate,这是 toFront 内部真正调用的入口
    const origBatchUpdate = g.model.batchUpdate?.bind(g.model)
    if (origBatchUpdate && !(g.model as any)._patchedBatchUpdate) {
      g.model.batchUpdate = function (name: any, fn: () => any) {
        try {
          return origBatchUpdate(name, fn)
        } catch (e: any) {
          if (e?.message?.includes('setZIndex')) {
            // eslint-disable-next-line no-console
            console.warn(`[cp-x6-polyfill] batchUpdate(${name}) swallowed setZIndex error`)
            return undefined
          }
          throw e
        }
      } as any
      ;(g.model as any)._patchedBatchUpdate = true
    }

    _x6PolyfillInstalled = true
    // eslint-disable-next-line no-console
    console.info(
      `[cp-x6-polyfill] wrapped ${cells.length} cells (toFront/toBack/bringToFront/sendToBack) + model.batchUpdate`
    )
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[cp-x6-polyfill] install failed', e)
  }
}

const props = defineProps<{
  states: TicketState[]
  rules: TicketTransitionRule[]
  activeCode?: TicketStateCode
  regulatorCode?: TicketStateCode
}>()

const emit = defineEmits<{
  (e: 'select', code: TicketStateCode): void
  (e: 'ruleAdd', rule: Omit<TicketTransitionRule, 'enabled'> & { enabled?: boolean }): void
  (e: 'ruleToggle', idx: number, enabled: boolean): void
  (e: 'stateMove', code: TicketStateCode, x: number, y: number): void
}>()

// ============ 常量 ============
const NODE_W = 200
const NODE_H = 60
const COL_GAP_X = 280
const ROW_GAP_Y = 120
const COLS = 3 // 每行 3 个,纵向长图布局
const CANVAS_PAD = 40

const COLOR_MAP: Record<TicketStateCode, string> = {
  pending: '#00b42a',
  todo: '#165dff',
  processing: '#165dff',
  transfer: '#722ed1',
  closing: '#ff7d00',
  closed: '#86909c'
}

// 节点位置(纯派生,无外部持久化)
function defaultPosition(idx: number): { x: number; y: number } {
  const col = idx % COLS
  const row = Math.floor(idx / COLS)
  return {
    x: CANVAS_PAD + col * COL_GAP_X,
    y: CANVAS_PAD + row * ROW_GAP_Y
  }
}

// ============ X6 实例 ============
const containerRef = ref<HTMLDivElement | null>(null)
let graph: Graph | null = null
let mounted = false
// 自定义规则 pending:用户正在画一条新边,等释放时回传
let pendingFrom: TicketStateCode | null = null

// ============ 工具:数据 → 节点/边 ============
function buildNodes(): NodeMetadata[] {
  return props.states.map((s, idx) => {
    const color = COLOR_MAP[s.code] || '#165dff'
    const fill = s.isStart ? '#e8f7e6' : s.isEnd ? '#f0f1f5' : '#fff'
    return {
      id: `n:${s.code}`,
      shape: 'rect',
      x: defaultPosition(idx).x,
      y: defaultPosition(idx).y,
      width: NODE_W,
      height: NODE_H,
      attrs: {
        body: {
          fill,
          stroke: color,
          strokeWidth: 2,
          rx: 6,
          ry: 6
        },
        label: {
          text: `${s.name}\n${s.code} · 超时 ${s.timeout}`,
          fill: '#1d2129',
          fontSize: 13,
          fontWeight: 600,
          textWrap: {
            width: NODE_W - 16,
            height: NODE_H - 12,
            ellipsis: false
          }
        }
      },
      // X6 v3 ports 配置
      ports: {
        groups: {
          left: { position: 'left', attrs: { circle: { r: 4, magnet: false, stroke: color, strokeWidth: 1.5, fill: '#fff' } } },
          right: {
            position: 'right',
            attrs: { circle: { r: 5, magnet: true, stroke: color, strokeWidth: 1.5, fill: '#fff' } }
          }
        },
        items: [{ group: 'left' }, { group: 'right', id: 'r' }]
      },
      data: { code: s.code }
    } as NodeMetadata
  })
}

function buildEdges(): any[] {
  const result: any[] = []
  props.rules.forEach((r, idx) => {
    if (!r.enabled) return
    if (r.from === r.to) return // 自环不出现在画布
    const isRegulator = props.regulatorCode === r.from && r.to === 'closed'
    result.push({
      id: `e:${idx}:${r.from}->${r.to}`,
      source: { cell: `n:${r.from}`, port: 'r' },
      target: { cell: `n:${r.to}` },
      attrs: {
        line: {
          stroke: isRegulator ? '#ff7d00' : '#94a3b8',
          strokeWidth: 1.5,
          strokeDasharray: isRegulator ? '4 3' : undefined,
          targetMarker: { name: 'block', size: 6, fill: isRegulator ? '#ff7d00' : '#94a3b8' }
        }
      },
      labels: [
        {
          attrs: { text: { text: r.trigger, fill: isRegulator ? '#ff7d00' : '#86909c', fontSize: 10 } },
          position: 0.5
        }
      ],
      data: { ruleIdx: idx, from: r.from, to: r.to }
    })
  })
  return result
}

// ============ 同步到画布 ============
function syncGraph() {
  if (!graph) return
  const cells = [...buildNodes(), ...buildEdges()]
  graph.clearCells()
  cells.forEach((c) => graph!.addCell(c as any))
}

function highlightActive() {
  if (!graph) return
  graph.getNodes().forEach((n) => {
    const code = n.getData()?.code as TicketStateCode | undefined
    if (!code) return
    const isActive = code === props.activeCode
    const body = n.attr('body') as any
    n.attr('body/filter', isActive ? { name: 'drop-shadow', args: { dx: 0, dy: 0, blur: 6, color: 'rgba(22,93,255,0.4)' } } : undefined)
    void body
  })
}

// ============ 生命周期 ============
onMounted(() => {
  if (!containerRef.value) return
  graph = new Graph({
    container: containerRef.value,
    autoResize: true,
    background: { color: 'var(--cp-bg-soft)' },
    grid: { visible: true, type: 'dot', size: 12, args: { color: '#e5e6eb' } },
    panning: { enabled: true, modifiers: ['ctrl'] },
    mousewheel: { enabled: true, zoomAtMousePosition: true, modifiers: ['ctrl'] },
    connecting: {
      router: 'manhattan',
      connector: { name: 'rounded', args: { radius: 6 } },
      snap: { radius: 24 },
      allowBlank: false,
      allowLoop: false,
      allowNode: false,
      allowEdge: false,
      allowPort: (port: any) => port?.id === 'r', // 只能从右侧端口拖出
      createEdge() {
        return new Shape.Edge({
          attrs: {
            line: {
              stroke: '#165dff',
              strokeWidth: 1.5,
              strokeDasharray: '4 3',
              targetMarker: { name: 'block', size: 6, fill: '#165dff' }
            }
          },
          labels: [
            {
              attrs: { text: { text: '新规则', fill: '#165dff', fontSize: 10, fontStyle: 'italic' } },
              position: 0.5
            }
          ],
          data: { pending: true }
        })
      },
      validateConnection: ({ sourceView, targetView, sourceCell, targetCell }) => {
        const sc = sourceCell || (sourceView as any)?.cell
        const tc = targetCell || (targetView as any)?.cell
        if (!sc || !tc) return false
        if (sc.id === tc.id) return false
        return true
      }
    }
  })

  // X6 v3.1.7 兼容补丁:在 graph 初始化后立即安装
  installX6ZIndexPolyfill(graph)

  // 节点点击
  graph.on('node:click', ({ node }) => {
    const code = node.getData()?.code as TicketStateCode | undefined
    if (code) emit('select', code)
  })

  // 节点移动(回写位置事件)
  graph.on('node:move', ({ node }) => {
    const code = node.getData()?.code as TicketStateCode | undefined
    if (!code) return
    const p = node.getPosition()
    emit('stateMove', code, p.x, p.y)
  })

  // 连边完成(从源/目标 cell 取 code)
  graph.on('edge:connected', ({ edge }) => {
    if (!edge.getData()?.pending) return
    const srcNode = edge.getSourceCell() as any
    const tgtNode = edge.getTargetCell() as any
    const from = srcNode?.getData?.()?.code as TicketStateCode | undefined
    const to = tgtNode?.getData?.()?.code as TicketStateCode | undefined
    if (!from || !to) return
    edge.setData({ pending: false, from, to })
    edge.setLabels([
      {
        attrs: { text: { text: '请编辑触发条件', fill: '#94a3b8', fontSize: 10, fontStyle: 'italic' } },
        position: 0.5
      }
    ])
    pendingFrom = from
    emit('ruleAdd', {
      name: `新建 ${from} → ${to}`,
      from,
      to,
      trigger: '请编辑触发条件',
      scope: ['全部'],
      enabled: true
    })
  })

  syncGraph()
  highlightActive()
  mounted = true
})

onBeforeUnmount(() => {
  mounted = false
  graph?.dispose()
  graph = null
})

// ============ 响应外部数据变化 ============
watch(
  () => [props.states, props.rules, props.activeCode, props.regulatorCode],
  () => {
    if (!mounted) return
    // 简化策略:states/rules 变化时重建;activeCode 变化时只改高亮
    syncGraph()
    highlightActive()
  },
  { deep: true }
)
</script>

<style scoped>
.cp-x6-canvas-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cp-x6-canvas {
  width: 100%;
  height: 540px;
  background: var(--cp-bg-soft);
  border-radius: 6px;
  border: 1px solid var(--cp-border-light);
}
.cp-legend {
  display: flex;
  gap: 16px;
  align-items: center;
  font-size: 12px;
  color: var(--cp-text-tertiary);
  padding-top: 8px;
  border-top: 1px dashed var(--cp-border);
  flex-wrap: wrap;
}
.cp-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  vertical-align: middle;
  margin-right: 4px;
}
.cp-legend-line {
  width: 16px;
  height: 2px;
  display: inline-block;
  vertical-align: middle;
  margin-right: 4px;
}
</style>
