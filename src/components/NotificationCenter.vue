<!--
  全局通知中心(坐席/支撑岗/管理层通用)
  订阅以下事件:
    - cp-workflow-notify-seat: 工作流通知(知识更新/审批结果/到期提醒)
    - cp-workflow-alert-verified: 预警已验证
  把事件压入本地列表,顶部 toast 弹出,抽屉里查看历史
  任意角色登录都能看到,不挑角色
-->
<template>
  <a-popover
    :visible="popVisible"
    trigger="click"
    position="bottom"
    :arrow-width="0"
    :content-style="{ padding: 0, width: '360px' }"
    @visible-change="(v: boolean) => (popVisible = v)"
  >
    <a-badge :count="unread" :max-count="99" :dot="false" :offset="[-4, 4]">
      <a-tooltip content="通知中心">
        <a-button shape="circle" size="medium" @click="popVisible = !popVisible">
          <icon-notification />
        </a-button>
      </a-tooltip>
    </a-badge>
    <template #content>
      <div class="cp-nc">
        <div class="cp-nc-head">
          <span style="font-weight: 600">通知中心</span>
          <a-space :size="4">
            <a-link size="small" @click="markAllRead">全部标已读</a-link>
            <a-link size="small" @click="clearAll">清空</a-link>
          </a-space>
        </div>
        <a-empty v-if="!items.length" description="暂无通知" />
        <div v-else class="cp-nc-list">
          <div
            v-for="n in items"
            :key="n.id"
            class="cp-nc-item"
            :class="{ 'is-unread': !n.read }"
            @click="handleClick(n)"
          >
            <span class="cp-nc-dot" :style="{ background: levelColor(n.level) }"></span>
            <div style="flex: 1; min-width: 0">
              <div style="display: flex; justify-content: space-between; align-items: center">
                <span style="font-weight: 500; font-size: 13px">{{ n.title }}</span>
                <span style="font-size: 11px; color: var(--cp-text-tertiary)">{{ n.time }}</span>
              </div>
              <div style="font-size: 12px; color: var(--cp-text-secondary); margin-top: 2px; line-height: 1.5">
                {{ n.content }}
              </div>
              <a-tag v-if="n.tag" size="small" style="margin-top: 4px">{{ n.tag }}</a-tag>
            </div>
          </div>
        </div>
      </div>
    </template>
  </a-popover>

  <!-- 最新通知:顶部 toast(避免 transition-group 在快速增删时撞到卸载节点) -->
  <div class="cp-nc-toasts">
    <div
      v-for="n in toasts"
      :key="n.id"
      class="cp-nc-toast"
      :style="{ borderLeftColor: levelColor(n.level) }"
      @click="onToastClick(n)"
    >
      <div style="display: flex; justify-content: space-between; align-items: center">
        <span style="font-weight: 600">{{ n.title }}</span>
        <a-button size="small" type="text" @click.stop="onToastClose(n.id)"><icon-close /></a-button>
      </div>
      <div style="font-size: 12px; color: var(--cp-text-secondary); margin-top: 4px; line-height: 1.5">
        {{ n.content }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { EVT } from '@/constants/events'

const isMounted = ref(true)

interface NotifItem {
  id: string
  title: string
  content: string
  level: 'info' | 'success' | 'warning' | 'error'
  tag?: string
  time: string
  read: boolean
  /** 关联跳转 */
  link?: string
  /** 点击后的额外回调 key(供 handleClick 派发) */
  cbKey?: string
  cbPayload?: any
}

const items = ref<NotifItem[]>([])
const toasts = ref<NotifItem[]>([])
const popVisible = ref(false)
let toastTimers = new Map<string, any>()

const unread = computed(() => items.value.filter((n) => !n.read).length)

function nowStr() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function uid() {
  return `N-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

function levelColor(l: NotifItem['level']) {
  return {
    info: 'var(--cp-brand)',
    success: 'var(--cp-success)',
    warning: 'var(--cp-warning)',
    error: 'var(--cp-danger)'
  }[l]
}

function push(n: Omit<NotifItem, 'id' | 'time' | 'read'>) {
  const item: NotifItem = { ...n, id: uid(), time: nowStr(), read: false }
  items.value.unshift(item)
  // 限制最多保留 50 条
  if (items.value.length > 50) items.value = items.value.slice(0, 50)
  // toast
  toasts.value.unshift(item)
  const t = setTimeout(() => dismissToast(item.id), 6000)
  toastTimers.set(item.id, t)
}

function dismissToast(id: string) {
  if (!isMounted) return
  try {
    toasts.value = toasts.value.filter((n) => n.id !== id)
  } catch (e) {
    // 静默:组件卸载中
  }
  if (toastTimers.has(id)) {
    clearTimeout(toastTimers.get(id))
    toastTimers.delete(id)
  }
}

function onToastClick(n: NotifItem) {
  try {
    n.read = true
    popVisible.value = true
    dismissToast(n.id)
  } catch (e) {
    /* 卸载中 */
  }
}

function onToastClose(id: string) {
  dismissToast(id)
}

function markAllRead() {
  items.value.forEach((n) => (n.read = true))
}

function clearAll() {
  items.value = []
}

function handleClick(n: NotifItem) {
  n.read = true
  popVisible.value = false
  if (n.link) {
    window.location.hash = ''
    // 通过 hash 触发 router 跳转
    setTimeout(() => {
      window.location.href = n.link!
    }, 0)
  }
}

let onNotify: any
let onVerified: any
let onOverdue: any

onMounted(() => {
  onNotify = (e: any) => {
    const { instanceId, kind, ticketId } = e.detail || {}
    const titleByKind: Record<string, string> = {
      stop_collection: '停催停扣已生效',
      negotiate: '协商还款方案已生效',
      transfer_mediate: '转诉调解已结案',
      credit_objection: '征信异议已归档',
      review_archive: '知识库已更新'
    }
    push({
      title: titleByKind[kind] || '工作流通知',
      content: `工作流 ${instanceId} 已通知到您${ticketId ? `,关联工单 ${ticketId}` : ''}。`,
      level: 'success',
      tag: kind,
      link: ticketId ? `/agent/ticket/${ticketId}` : '/agent/desk'
    })
  }
  onVerified = (e: any) => {
    const { alertId, instanceId } = e.detail || {}
    push({
      title: '预警已验证',
      content: `预警 ${alertId || '-'} 经指令执行后已自动标记为已验证(工作流 ${instanceId})。`,
      level: 'success',
      tag: 'alert_verified',
      cbKey: 'open-alert-handle',
      cbPayload: { alertId, instanceId }
    })
  }
  onOverdue = (e: any) => {
    const { instanceId, kind } = e.detail || {}
    push({
      title: '工作流已超时,自动升级',
      content: `工作流 ${instanceId} 超出 SLA,已升级到上层。请尽快处理。`,
      level: 'error',
      tag: 'overdue',
      link: '/manage/workflow-monitor'
    })
  }
  window.addEventListener(EVT.WORKFLOW_NOTIFY_SEAT, onNotify)
  window.addEventListener(EVT.WORKFLOW_ALERT_VERIFIED, onVerified)
  window.addEventListener(EVT.WORKFLOW_OVERDUE, onOverdue)
})

onUnmounted(() => {
  isMounted.value = false
  if (onNotify) window.removeEventListener(EVT.WORKFLOW_NOTIFY_SEAT, onNotify)
  if (onVerified) window.removeEventListener(EVT.WORKFLOW_ALERT_VERIFIED, onVerified)
  if (onOverdue) window.removeEventListener(EVT.WORKFLOW_OVERDUE, onOverdue)
  toastTimers.forEach((t) => clearTimeout(t))
  toastTimers.clear()
})
</script>

<style scoped>
.cp-nc {
  width: 360px;
  max-height: 480px;
  display: flex;
  flex-direction: column;
}
.cp-nc-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid var(--cp-border-light);
}
.cp-nc-list {
  overflow-y: auto;
  max-height: 420px;
}
.cp-nc-item {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--cp-border-light);
  cursor: pointer;
  transition: background 0.15s;
}
.cp-nc-item:hover {
  background: var(--cp-bg-hover);
}
.cp-nc-item.is-unread {
  background: var(--cp-brand-soft);
}
.cp-nc-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}

/* 顶部 toast */
.cp-nc-toasts {
  position: fixed;
  top: 70px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}
.cp-nc-toast {
  width: 320px;
  background: #fff;
  border-radius: 6px;
  padding: 10px 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border-left: 4px solid var(--cp-brand);
  pointer-events: auto;
  cursor: pointer;
}

.cp-nc-toast-enter-active,
.cp-nc-toast-leave-active {
  transition: all 0.25s;
}
.cp-nc-toast-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.cp-nc-toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
