<template>
  <!-- 仅在登录后,根据当前角色展示该角色的"待办指令 + 收件箱" -->
  <div v-if="myList.length" class="cp-instruction-bar">
    <div class="cp-instruction-bar-inner">
      <div class="cp-instruction-bar-title">
        <a-badge :count="pendingCount" :offset="[6, 2]">
          <a-tag color="red" size="small">实时指令</a-tag>
        </a-badge>
        <span style="font-weight: 600">{{ greeting }}</span>
        <span style="color: var(--cp-text-tertiary); font-size: 12px">
          当前待办 {{ pendingCount }} 条
        </span>
      </div>

      <div class="cp-instruction-list">
        <div
          v-for="(i, idx) in myList.slice(0, 3)"
          :key="i.id"
          class="cp-instruction-card"
          :class="`cp-instruction-${i.priority}`"
        >
          <div class="cp-instruction-card-head">
            <a-tag :color="priorityColor(i.priority)" size="small">{{ priorityLabel(i.priority) }}</a-tag>
            <span class="cp-instruction-card-title">{{ i.title }}</span>
            <span class="cp-instruction-card-time">{{ relativeTime(i.createdAt) }}</span>
          </div>
          <div class="cp-instruction-card-content">{{ i.content }}</div>
          <div v-if="i.alertId || i.ticketId" style="font-size: 12px; color: var(--cp-text-tertiary); margin-bottom: 6px">
            <span v-if="i.alertId">预警 <a-link>{{ i.alertId }}</a-link></span>
            <span v-if="i.ticketId" style="margin-left: 8px">工单 <a-link>{{ i.ticketId }}</a-link></span>
          </div>
          <div style="display: flex; gap: 8px">
            <a-button
              v-if="i.status === 'pending'"
              type="primary"
              size="mini"
              @click="ack(i)"
            >确认接收</a-button>
            <a-button
              v-if="i.status === 'pending' || i.status === 'ack'"
              type="primary"
              size="mini"
              status="success"
              @click="done(i)"
            >{{ i.status === 'pending' ? '直接完成' : '标记完成' }}</a-button>
            <a-tag v-if="i.status === 'ack'" color="arcoblue" size="small">已 ack 待执行</a-tag>
            <a-tag v-if="i.status === 'done'" color="green" size="small">已完成</a-tag>
          </div>
        </div>
      </div>
      <div v-if="myList.length > 3" class="cp-instruction-more">
        <a-link @click="showAll = true">查看全部 {{ myList.length }} 条</a-link>
      </div>
    </div>

    <!-- 查看全部 -->
    <a-modal v-model:visible="showAll" :title="`指令收件箱(${myList.length})`" :width="640" :footer="false">
      <a-list :data="myList" :pagination="{ pageSize: 10 }">
        <template #item="{ item: ins, index }">
          <a-list-item :key="index">
            <div style="width: 100%">
              <div style="display: flex; justify-content: space-between">
                <span>
                  <a-tag :color="priorityColor(ins.priority)" size="small">{{ priorityLabel(ins.priority) }}</a-tag>
                  <b>{{ ins.title }}</b>
                </span>
                <a-tag :color="statusColor(ins.status)" size="small">{{ statusLabel(ins.status) }}</a-tag>
              </div>
              <div style="font-size: 13px; color: var(--cp-text-secondary); margin-top: 6px">{{ ins.content }}</div>
              <div style="font-size: 12px; color: var(--cp-text-tertiary); margin-top: 6px">
                下达人:{{ ins.fromOperator }} · {{ ins.createdAt }}
                <span v-if="ins.deadline"> · 截止 {{ ins.deadline }}</span>
              </div>
              <div v-if="ins.ackAt" style="font-size: 12px; color: var(--cp-text-tertiary); margin-top: 2px">ack {{ ins.ackAt }} · {{ ins.ackNote || '' }}</div>
              <div v-if="ins.doneAt" style="font-size: 12px; color: var(--cp-success); margin-top: 2px">done {{ ins.doneAt }} · {{ ins.doneNote || '' }}</div>
              <div style="display: flex; gap: 6px; margin-top: 8px">
                <a-button v-if="ins.status === 'pending'" type="primary" size="mini" @click="ack(ins)">确认</a-button>
                <a-button v-if="ins.status === 'pending' || ins.status === 'ack'" type="primary" size="mini" status="success" @click="done(ins)">完成</a-button>
              </div>
            </div>
          </a-list-item>
        </template>
      </a-list>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useInstructionStore, Instruction, InstructionStatus } from '@/stores/instruction'
import { useUserStore, getRoleInfo } from '@/stores/user'

const insStore = useInstructionStore()
const userStore = useUserStore()

const showAll = ref(false)

// 当前登录人的"姓名"(从 getRoleInfo 派生,避免扩展 user store 接口)
const currentOperator = computed(() => {
  const info = userStore.currentRole ? getRoleInfo(userStore.currentRole) : undefined
  return info?.username || '?'
})

const myList = computed(() => {
  if (!userStore.currentRole) return []
  return insStore.listForRole(userStore.currentRole, currentOperator.value)
})

const pendingCount = computed(() =>
  myList.value.filter(i => i.status === 'pending').length
)

const greeting = computed(() => {
  const roleMap: Record<string, string> = {
    agent: '坐席',
    business: '业务执行',
    review: '审查',
    manage: '管理层',
    system: '系统'
  }
  const role = userStore.currentRole ? (roleMap[userStore.currentRole] || userStore.currentRole) : ''
  return `${role} ${currentOperator.value} 的指令收件箱`
})

function ack(ins: Instruction) {
  insStore.ack(ins.id, currentOperator.value)
  Message.success('已确认接收')
}

function done(ins: Instruction) {
  insStore.done(ins.id, '已完成,无需后续说明')
  Message.success('指令已完成')
}

// helpers
function priorityColor(p: string) {
  return ({ urgent: 'red', high: 'orange', normal: 'arcoblue', low: 'gray' })[p] || 'gray'
}
function priorityLabel(p: string) {
  return ({ urgent: '紧急', high: '高', normal: '普通', low: '低' })[p] || p
}
function statusColor(s: InstructionStatus) {
  return ({ pending: 'red', ack: 'arcoblue', done: 'green', expired: 'gray', canceled: 'gray' })[s] || 'gray'
}
function statusLabel(s: InstructionStatus) {
  return ({ pending: '待接收', ack: '已接收', done: '已完成', expired: '已过期', canceled: '已取消' })[s] || s
}
function relativeTime(at: string) {
  // 简化版本:只展示 HH:MM 部分
  const t = at.split(' ')
  return t[1] ? `今天 ${t[1]}` : t[0]
}
</script>

<style scoped>
.cp-instruction-bar {
  background: linear-gradient(135deg, rgba(245, 34, 45, 0.06), rgba(255, 165, 0, 0.06));
  border-bottom: 1px solid var(--cp-border-light);
  padding: 10px 24px 12px;
}
.cp-instruction-bar-inner {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cp-instruction-bar-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}
.cp-instruction-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 10px;
}
.cp-instruction-card {
  background: #fff;
  border-radius: 6px;
  padding: 10px 12px;
  border-left: 3px solid var(--cp-brand);
}
.cp-instruction-urgent { border-left-color: #f5222d; background: rgba(245, 34, 45, 0.03); }
.cp-instruction-high { border-left-color: #ff7d00; background: rgba(255, 125, 0, 0.03); }
.cp-instruction-normal { border-left-color: #1494e8; background: rgba(20, 148, 232, 0.03); }
.cp-instruction-low { border-left-color: #999; }

.cp-instruction-card-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.cp-instruction-card-title {
  flex: 1;
  font-weight: 600;
  font-size: 13px;
}
.cp-instruction-card-time {
  font-size: 11px;
  color: var(--cp-text-tertiary);
}
.cp-instruction-card-content {
  font-size: 12px;
  line-height: 1.5;
  color: var(--cp-text-secondary);
  margin-bottom: 6px;
}
.cp-instruction-more {
  text-align: right;
  font-size: 12px;
}
</style>
