<!--
  V2 状态机画布(基于 X6)
  - 节点:V2 状态(支持 UUID id,任意扩展)
  - 边:V2 transition(显示 event + categories)
  - 高亮 active 状态
  - 监管件 override 的边自动画橙色虚线
  - 节点徽标:onEnter/onExit/effects 数量小圆点
  - Props:
      states: StateNode[]
      transitions: StateTransition[]
      activeId?: string
      regulatorEdge?: { from: string; to: string }
  - Events:
      select(id)  节点点击
      transitionSelect(id)  边点击
-->
<template>
  <div class="cp-x6-canvas-wrap">
    <div ref="containerRef" class="cp-x6-canvas" />
    <div class="cp-legend">
      <span><span class="cp-legend-dot" style="background: #00b42a"></span>起始状态</span>
      <span><span class="cp-legend-dot" style="background: #165dff"></span>中间</span>
      <span><span class="cp-legend-dot" style="background: #86909c"></span>终态</span>
      <span><span class="cp-legend-line" style="background: #ff7d00"></span>监管件特殊流转</span>
      <span style="margin-left: auto; color: var(--cp-text-tertiary)">
        节点上小圆点表示配置了钩子(进入/离开/边效果)
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Graph, Shape } from '@antv/x6'
import type { NodeMetadata } from '@antv/x6'
import type { StateNode, StateTransition } from '@/stores/ticket-machine'
// 显式 side-effect import:独立模块里给 X6 Cell.prototype 装 setZIndex/removeZIndex
import '@/stores/x6-preserve'

const props = defineProps<{
  states: StateNode[]
  transitions: StateTransition[]
  activeId?: string
  regulatorEdge?: { from: string; to: string }
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'transitionSelect', id: string): void
}>()

// ============ X6 v3 setZIndex 兼容补丁(同 V1 画布) ============
// 攻击错误源:在 cell 上重写 toFront/toBack/bringToFront/sendToBack 包 try/catch,
// 同时拦截 model.batchUpdate(这是 toFront 真正调用的入口)。
// 详见 WorkflowStateCanvas.vue 中的注释。
let _patched = false
function installX6Polyfill(g: Graph) {
  if (_patched) return
  try {
    const safeWrap = (cell: any, method: string) => {
      const orig = cell[method]?.bind(cell)
      if (!orig || cell[`_patched${method}`]) return
      cell[method] = function (...args: any[]) {
        try {
          return orig(...args)
        } catch (e: any) {
          if (e?.message?.includes('setZIndex')) {
            // eslint-disable-next-line no-console
            console.warn(`[cp-v2-canvas polyfill] ${method} swallowed setZIndex error`)
            return cell
          }
          throw e
        }
      }
      cell[`_patched${method}`] = true
    }
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
        } catch {}
        return r
      }
      ;(g.model as any)._patchedAddCell = true
    }
    const cells = g.model?.getCells?.() || []
    cells.forEach((c: any) => {
      safeWrap(c, 'toFront')
      safeWrap(c, 'toBack')
      safeWrap(c, 'bringToFront')
      safeWrap(c, 'sendToBack')
    })
    const origBatchUpdate = g.model.batchUpdate?.bind(g.model)
    if (origBatchUpdate && !(g.model as any)._patchedBatchUpdate) {
      g.model.batchUpdate = function (name: any, fn: () => any) {
        try {
          return origBatchUpdate(name, fn)
        } catch (e: any) {
          if (e?.message?.includes('setZIndex')) {
            return undefined
          }
          throw e
        }
      } as any
      ;(g.model as any)._patchedBatchUpdate = true
    }
    _patched = true
    // eslint-disable-next-line no-console
    console.info(
      `[cp-v2-canvas polyfill] wrapped ${cells.length} cells + model.batchUpdate`
    )
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[cp-v2-canvas polyfill]', e)
  }
}

// ============ 布局 ============
const NODE_W = 220
const NODE_H = 70
const COL_GAP_X = 320
const ROW_GAP_Y = 140
const COLS = 3
const CANVAS_PAD = 40

function defaultPosition(idx: number): { x: number; y: number } {
  const col = idx % COLS
  const row = Math.floor(idx / COLS)
  return {
    x: CANVAS_PAD + col * COL_GAP_X,
    y: CANVAS_PAD + row * ROW_GAP_Y
  }
}

const HOOK_BADGE_COLORS = {
  onEnter: '#00b42a',
  onExit: '#ff7d00',
  effect: '#722ed1'
}

// ============ X6 ============
const containerRef = ref<HTMLDivElement | null>(null)
let graph: Graph | null = null
let mounted = false

function buildNodes(): NodeMetadata[] {
  return props.states.map((s, idx) => {
    const fill = s.category === 'start' ? '#e8f7e6' : s.category === 'end' ? '#f0f1f5' : '#fff'
    const stroke = s.color || '#165dff'
    const enterCount = s.onEnter?.length || 0
    const exitCount = s.onExit?.length || 0
    return {
      id: `n:${s.id}`,
      shape: 'rect',
      x: defaultPosition(idx).x,
      y: defaultPosition(idx).y,
      width: NODE_W,
      height: NODE_H,
      attrs: {
        body: {
          fill,
          stroke,
          strokeWidth: 2,
          rx: 6,
          ry: 6
        },
        label: {
          text: `${s.name}\n${s.id} · ${s.category}`,
          fill: '#1d2129',
          fontSize: 12,
          fontWeight: 600,
          textWrap: { width: NODE_W - 16, height: NODE_H - 12, ellipsis: false }
        }
      },
      data: { id: s.id, kind: 'state', enterCount, exitCount, stroke }
    } as NodeMetadata
  })
}

function buildEdges(): any[] {
  const result: any[] = []
  props.transitions.forEach((t) => {
    if (t.from === 'ANY' || t.from === t.to) return
    const isRegulator =
      props.regulatorEdge && props.regulatorEdge.from === t.from && props.regulatorEdge.to === t.to
    const stroke = isRegulator ? '#ff7d00' : '#94a3b8'
    const marker = isRegulator ? 'arr-orange' : 'arr'
    const effectCount = t.effects?.length || 0
    result.push({
      id: `e:${t.id}`,
      source: { cell: `n:${t.from}` },
      target: { cell: `n:${t.to}` },
      attrs: {
        line: {
          stroke,
          strokeWidth: 1.5,
          strokeDasharray: isRegulator ? '4 3' : undefined,
          targetMarker: { name: 'block', size: 6, fill: stroke }
        }
      },
      labels: [
        {
          attrs: {
            text: {
              text: `${t.event}${effectCount ? ' · ' + effectCount + 'fx' : ''}`,
              fill: isRegulator ? '#ff7d00' : '#86909c',
              fontSize: 10
            }
          },
          position: 0.5
        }
      ],
      data: { id: t.id, kind: 'transition', effectCount }
    })
  })
  return result
}

function buildMarkers() {
  // 在每个 state 节点的右上角画 3 个小圆点(进入/离开/边效果)
  // 用 rect + 文本 替代 shape: 'html'——html cell 在 X6 v3.1.7 不继承 Cell.prototype,
  // 调用 setZIndex 时会抛 "is not a function" 错误
  const markers: any[] = []
  props.states.forEach((s, idx) => {
    const enter = s.onEnter?.length || 0
    const exit = s.onExit?.length || 0
    const effect = props.transitions
      .filter((t) => t.from === s.id)
      .reduce((sum, t) => sum + (t.effects?.length || 0), 0)
    if (enter + exit + effect === 0) return
    const pos = defaultPosition(idx)
    const counts: Array<{ c: number; color: string }> = [
      { c: enter, color: HOOK_BADGE_COLORS.onEnter },
      { c: exit, color: HOOK_BADGE_COLORS.onExit },
      { c: effect, color: HOOK_BADGE_COLORS.effect }
    ]
    let xOffset = pos.x + NODE_W - 8
    // 倒序排列:从右到左
    counts.reverse().forEach((it) => {
      if (it.c > 0) {
        xOffset -= 20
        markers.push({
          id: `mk:${s.id}:${it.color}`,
          shape: 'circle',
          x: xOffset,
          y: pos.y + 8,
          width: 16,
          height: 16,
          attrs: {
            body: { fill: it.color, stroke: '#fff', strokeWidth: 1 },
            label: { text: String(it.c), fill: '#fff', fontSize: 9, fontWeight: 600 }
          },
          data: { kind: 'badge' }
        })
      }
    })
  })
  return markers
}

function syncGraph() {
  if (!graph) return
  const cells = [...buildNodes(), ...buildEdges(), ...buildMarkers()]
  graph.clearCells()
  cells.forEach((c) => graph!.addCell(c as any))
}

function highlightActive() {
  if (!graph) return
  graph.getNodes().forEach((n) => {
    const id = n.getData()?.id
    if (!id) return
    const isActive = id === props.activeId
    n.attr('body/filter', isActive ? { name: 'drop-shadow', args: { dx: 0, dy: 0, blur: 6, color: 'rgba(22,93,255,0.4)' } } : undefined)
  })
}

onMounted(() => {
  if (!containerRef.value) return
  graph = new Graph({
    container: containerRef.value,
    autoResize: true,
    background: { color: 'var(--cp-bg-soft)' },
    grid: { visible: true, type: 'dot', size: 12, args: { color: '#e5e6eb' } },
    panning: { enabled: true, modifiers: ['ctrl'] },
    mousewheel: { enabled: true, zoomAtMousePosition: true, modifiers: ['ctrl'] }
  })
  installX6Polyfill(graph)

  graph.on('node:click', ({ node }) => {
    const id = node.getData()?.id
    if (id) emit('select', id)
  })
  graph.on('edge:click', ({ edge }) => {
    const id = edge.getData()?.id
    if (id) emit('transitionSelect', id)
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

watch(
  () => [props.states, props.transitions, props.activeId, props.regulatorEdge],
  () => {
    if (!mounted) return
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
  height: 520px;
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
