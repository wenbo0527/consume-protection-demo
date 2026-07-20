<!--
  顶部预警面板(全局可见)
  - 接入 useAlertStore,按当前角色计算未读数
  - 点徽章 → 弹出 380px 面板
  - 面板内容:
      · 顶部统计(未处置 / 处置中 / 已验证)
      · 筛选 chip(全部 / 紧急 / 警告 / 提示)
      · 活跃预警列表(level 色标 + 未读高亮)
      · 每个预警可点击跳转 AlertHandle + 自动 markRead
      · 顶部"全部标已读"按钮
  - 与 AlertHandle 详情页双向打通:面板"处理"等于 markRead + 跳管理页面
-->
<template>
  <a-popover
    :visible="popVisible"
    trigger="click"
    position="bottom"
    :arrow-width="0"
    :content-style="{ padding: 0, width: '380px' }"
    @visible-change="(v: boolean) => (popVisible = v)"
  >
    <a-badge :count="unread" :dot="unread === 0" :offset="[-2, 2]" :max-count="99">
      <a-tooltip content="预警中心(点击查看当前预警)">
        <a-button
          shape="circle"
          size="medium"
          :class="{ 'cp-flash-alert': unread > 0 }"
          @click="popVisible = !popVisible"
        >
          <icon-exclamation-circle />
        </a-button>
      </a-tooltip>
    </a-badge>
    <template #content>
      <div class="cp-ac">
        <!-- 头部 -->
        <div class="cp-ac-head">
          <div class="cp-ac-title">
            <icon-exclamation-circle style="color: var(--cp-warning); font-size: 16px" />
            <span>预警中心</span>
            <a-tag v-if="unread > 0" size="small" color="orange">{{ unread }} 条未读</a-tag>
          </div>
          <a-space :size="4">
            <a-link size="small" @click="markAllRead">全部已读</a-link>
          </a-space>
        </div>

        <!-- 统计 -->
        <div class="cp-ac-stats">
          <div class="cp-ac-stat is-danger">
            <div class="cp-ac-stat-label">未处置</div>
            <div class="cp-ac-stat-num">{{ store.openCount }}</div>
          </div>
          <div class="cp-ac-stat is-warning">
            <div class="cp-ac-stat-label">处置中</div>
            <div class="cp-ac-stat-num">{{ store.handleCount }}</div>
          </div>
          <div class="cp-ac-stat is-success">
            <div class="cp-ac-stat-label">已验证</div>
            <div class="cp-ac-stat-num">{{ store.verifiedCount }}</div>
          </div>
        </div>

        <!-- 筛选 -->
        <div class="cp-ac-filter">
          <span
            v-for="chip in chips"
            :key="chip.value"
            class="cp-ac-chip"
            :class="{ 'is-active': activeLevel === chip.value }"
            @click="activeLevel = chip.value"
          >
            {{ chip.label }}
          </span>
        </div>

        <!-- 列表 -->
        <div v-if="!visibleAlerts.length" class="cp-ac-empty">
          <a-empty description="无未处置预警" :image-size="60" />
        </div>
        <div v-else class="cp-ac-list">
          <div
            v-for="a in visibleAlerts"
            :key="a.id"
            class="cp-ac-item"
            :class="{
              'is-unread': !store.isReadBy(a.id, currentRole),
              'is-urgent': a.level === 'urgent',
              'is-warning': a.level === 'warning',
              'is-info': a.level === 'info'
            }"
            @click="onAlertClick(a.id)"
          >
            <div class="cp-ac-dot"></div>
            <div class="cp-ac-body">
              <div class="cp-ac-row1">
                <span class="cp-ac-tag">{{ a.typeLabel }}</span>
                <a-tag
                  size="small"
                  :color="levelChipColor(a.level)"
                  style="margin-left: 4px"
                >
                  {{ levelLabel(a.level) }}
                </a-tag>
                <span class="cp-ac-time">{{ formatTime(a.triggerTime) }}</span>
              </div>
              <div class="cp-ac-title-text">{{ a.title }}</div>
              <div class="cp-ac-desc">{{ a.desc }}</div>
              <div v-if="a.relatedTicket" class="cp-ac-meta">
                关联工单: <a class="cp-link" @click.stop="openTicket(a.relatedTicket)">{{ a.relatedTicket }}</a>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部 -->
        <div class="cp-ac-foot">
          <span class="cp-ac-tip">点击任一条目跳转到「预警处置中心」并自动标记已读</span>
          <a-link size="small" @click="goAlertCenter">
            查看全部 ({{ store.activeAlerts.length }}) →
          </a-link>
        </div>
      </div>
    </template>
  </a-popover>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAlertStore } from '@/stores/alert'
import { useUserStore } from '@/stores/user'
import type { AlertItem } from '@/mock/data'

const router = useRouter()
const store = useAlertStore()
const user = useUserStore()

const popVisible = ref(false)
const activeLevel = ref<'all' | 'urgent' | 'warning' | 'info'>('all')

type Level = AlertItem['level']
const chips: { value: 'all' | Level; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'urgent', label: '紧急' },
  { value: 'warning', label: '警告' },
  { value: 'info', label: '提示' }
]

const currentRole = computed(() => user.currentRole || 'guest')

const unread = computed(() => store.unreadByRole(currentRole.value))

const visibleAlerts = computed(() => {
  const all = store.activeAlerts
  if (activeLevel.value === 'all') return all
  return all.filter((a) => a.level === activeLevel.value)
})

function levelChipColor(l: Level) {
  return l === 'urgent' ? 'red' : l === 'warning' ? 'orange' : 'blue'
}
function levelLabel(l: Level) {
  return l === 'urgent' ? '紧急' : l === 'warning' ? '警告' : '提示'
}
function formatTime(t: string) {
  // 2026-07-15 14:00 → 07-15 14:00
  return t.length >= 16 ? t.slice(5, 16) : t
}

function onAlertClick(id: string) {
  store.markRead(id, currentRole.value)
  popVisible.value = false
  router.push('/manage/alert')
}

function openTicket(tid: string) {
  popVisible.value = false
  router.push(`/agent/ticket/${tid}`)
}

function goAlertCenter() {
  popVisible.value = false
  router.push('/manage/alert')
}

function markAllRead() {
  store.markAllRead(currentRole.value)
}
</script>

<style scoped>
.cp-ac {
  width: 380px;
  max-height: 540px;
  display: flex;
  flex-direction: column;
}

/* 闪烁效果提醒(顶部按钮) */
:deep(.cp-flash-alert),
.cp-flash-alert {
  animation: cp-flash-alert 1.6s ease-in-out infinite;
  box-shadow: 0 0 0 0 rgba(245, 154, 35, 0.6);
}
@keyframes cp-flash-alert {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(245, 154, 35, 0);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(245, 154, 35, 0.18);
  }
}

.cp-ac-head {
  padding: 12px 16px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--cp-border-light);
}
.cp-ac-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
}

/* 统计 3 列 */
.cp-ac-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  padding: 12px 16px 8px;
  border-bottom: 1px solid var(--cp-border-light);
}
.cp-ac-stat {
  border-radius: 6px;
  padding: 8px 10px;
  text-align: center;
  background: var(--cp-bg);
}
.cp-ac-stat.is-danger {
  background: rgba(245, 63, 77, 0.06);
  border: 1px solid rgba(245, 63, 77, 0.18);
}
.cp-ac-stat.is-warning {
  background: rgba(245, 154, 35, 0.06);
  border: 1px solid rgba(245, 154, 35, 0.18);
}
.cp-ac-stat.is-success {
  background: rgba(2, 184, 117, 0.06);
  border: 1px solid rgba(2, 184, 117, 0.18);
}
.cp-ac-stat-label {
  font-size: 11px;
  color: var(--cp-text-tertiary);
}
.cp-ac-stat-num {
  font-size: 18px;
  font-weight: 600;
  margin-top: 2px;
  line-height: 1.2;
}

/* 筛选 chip */
.cp-ac-filter {
  padding: 8px 16px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--cp-border-light);
}
.cp-ac-chip {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 12px;
  background: var(--cp-bg);
  color: var(--cp-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}
.cp-ac-chip:hover {
  background: var(--cp-bg-hover);
}
.cp-ac-chip.is-active {
  background: var(--cp-brand);
  color: #fff;
}

/* 列表 */
.cp-ac-list {
  overflow-y: auto;
  max-height: 320px;
}
.cp-ac-empty {
  padding: 24px 0;
}
.cp-ac-item {
  display: flex;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--cp-border-light);
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}
.cp-ac-item:hover {
  background: var(--cp-bg-hover);
}
.cp-ac-item.is-unread {
  background: var(--cp-brand-soft);
}
.cp-ac-item.is-unread::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 10px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--cp-danger);
  box-shadow: 0 0 0 4px rgba(245, 63, 77, 0.18);
}
.cp-ac-dot {
  width: 4px;
  align-self: stretch;
  border-radius: 2px;
  background: var(--cp-warning);
  flex-shrink: 0;
  margin-top: 2px;
}
.cp-ac-item.is-urgent .cp-ac-dot {
  background: var(--cp-danger);
}
.cp-ac-item.is-warning .cp-ac-dot {
  background: var(--cp-warning);
}
.cp-ac-item.is-info .cp-ac-dot {
  background: var(--cp-brand);
}
.cp-ac-body {
  flex: 1;
  min-width: 0;
}
.cp-ac-row1 {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.cp-ac-tag {
  font-size: 11px;
  padding: 1px 6px;
  background: var(--cp-bg-hover);
  color: var(--cp-text-secondary);
  border-radius: 3px;
}
.cp-ac-time {
  margin-left: auto;
  font-size: 11px;
  color: var(--cp-text-tertiary);
}
.cp-ac-title-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--cp-text);
  margin: 4px 0 2px;
  line-height: 1.4;
}
.cp-ac-desc {
  font-size: 12px;
  color: var(--cp-text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cp-ac-meta {
  margin-top: 4px;
  font-size: 11px;
  color: var(--cp-text-tertiary);
}
.cp-link {
  color: var(--cp-brand);
  text-decoration: none;
}
.cp-link:hover {
  text-decoration: underline;
}

/* 底部 */
.cp-ac-foot {
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--cp-border-light);
  background: var(--cp-bg);
}
.cp-ac-tip {
  font-size: 11px;
  color: var(--cp-text-tertiary);
}
</style>
