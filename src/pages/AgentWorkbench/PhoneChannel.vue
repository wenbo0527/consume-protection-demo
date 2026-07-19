<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">电话工作台</h1>
        <div class="cp-page-subtitle">来电队列 · 自动分配 · 抢单 · 通话中监控</div>
      </div>
      <a-space>
        <a-tag :color="queueStore.onlineAgents.length >= 8 ? 'red' : 'orange'">
          在线坐席 {{ queueStore.onlineAgents.length }} 人
        </a-tag>
        <a-button @click="queueStore.tickSimulation" type="primary">
          <icon-plus /> 模拟新来电(给队列)
        </a-button>
      </a-space>
    </div>

    <!-- KPI -->
    <div class="cp-kpi-row">
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">来电总数(今日)</div>
        <div class="cp-kpi-value">{{ queueStore.entries.length }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">待分配</div>
        <div class="cp-kpi-value" style="color: var(--cp-warning)">{{ waitingCount }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">已分配</div>
        <div class="cp-kpi-value" style="color: var(--cp-brand)">{{ assignedCount }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">接通中</div>
        <div class="cp-kpi-value" style="color: var(--cp-success)">{{ connectedCount }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">坐席负载</div>
        <div class="cp-kpi-value">
          {{ avgLoad }}%
        </div>
      </div>
    </div>

    <a-row :gutter="16">
      <a-col :span="14">
        <a-card title="来电队列">
          <a-table :data="sortedEntries" :pagination="false" row-key="id">
            <a-table-column title="来电 ID" data-index="id" :width="120" />
            <a-table-column title="客户" :width="180">
              <template #cell="{ record }">
                <span>{{ record.customerName }}</span>
                <div style="font-size: 11px; color: var(--cp-text-tertiary)">{{ record.customerId }}</div>
              </template>
            </a-table-column>
            <a-table-column title="紧急度" :width="100">
              <template #cell="{ record }">
                <a-tag :color="priorityColor(record.priority)">{{ priorityLabel(record.priority) }}</a-tag>
              </template>
            </a-table-column>
            <a-table-column title="渠道" :width="80">
              <template #cell="{ record }">{{ record.channel }}</template>
            </a-table-column>
            <a-table-column title="等待时长" :width="100">
              <template #cell="{ record }">
                {{ waitingMinutes(record) }} 分钟
              </template>
            </a-table-column>
            <a-table-column title="分配情况" :width="160">
              <template #cell="{ record }">
                <a-tag v-if="record.assignedAgentId" color="arcoblue" size="small">
                  → {{ record.assignedAgentId }}
                </a-tag>
                <span v-else style="color: var(--cp-text-tertiary); font-size: 12px">未分配</span>
              </template>
            </a-table-column>
            <a-table-column title="状态" :width="100">
              <template #cell="{ record }">
                <a-tag :color="statusColor(record.status)">{{ statusLabel(record.status) }}</a-tag>
              </template>
            </a-table-column>
            <a-table-column title="操作" :width="200" fixed="right">
              <template #cell="{ record }">
                <a-space :size="4">
                  <a-button
                    v-if="record.status === 'waiting'"
                    size="mini"
                    type="text"
                    status="success"
                    @click="onClaim(record)"
                  >抢单</a-button>
                  <a-button
                    v-if="record.status === 'waiting'"
                    size="mini"
                    type="text"
                    @click="onAutoAssign(record)"
                  >自动分单</a-button>
                  <a-button
                    v-if="record.status === 'assigned'"
                    size="mini"
                    type="text"
                    status="success"
                    @click="onConnect(record)"
                  >接通</a-button>
                  <a-button
                    v-if="record.status === 'connected'"
                    size="mini"
                    type="text"
                    status="warning"
                    @click="onHangup(record)"
                  >挂断</a-button>
                  <a-button
                    v-if="record.status === 'finished'"
                    size="mini"
                    type="text"
                    @click="onDrop(record)"
                  >移除</a-button>
                </a-space>
              </template>
            </a-table-column>
          </a-table>
          <a-empty v-if="!queueStore.entries.length" description="队列空,点击右上「模拟新来电」按钮" />
        </a-card>
      </a-col>
      <a-col :span="10">
        <a-card title="坐席负载">
          <div v-for="a in queueStore.agents" :key="a.id" style="margin-bottom: 12px">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px">
              <span><b>{{ a.name }}</b> <a-tag size="small" :color="a.skillTags.length ? 'arcoblue' : 'gray'">{{ a.skillTags.join('·') || '通用' }}</a-tag></span>
              <a-tag size="small" :color="a.status === 'online' ? 'green' : a.status === 'busy' ? 'orange' : 'gray'">
                {{ a.status === 'online' ? '空闲' : a.status === 'busy' ? '通话中' : '离线' }}
              </a-tag>
            </div>
            <div style="height: 6px; background: var(--cp-bg-soft); border-radius: 3px; overflow: hidden">
              <div :style="{ width: a.currentLoad * 10 + '%', height: '100%', background: a.currentLoad >= 8 ? '#f5222d' : a.currentLoad >= 5 ? '#fa8c16' : '#52c41a', transition: 'width 0.3s' }" />
            </div>
            <div style="font-size: 11px; color: var(--cp-text-tertiary); margin-top: 2px">
              通话数 {{ a.currentLoad }} / 上限 10 · 平均处理时长 {{ a.avgHandleSeconds }}s
            </div>
          </div>
        </a-card>

        <a-card title="规则说明" style="margin-top: 16px">
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 2">
            <li>优先级 <b style="color:#f5222d">紧急</b> 来电 → 自动分配给负载最低的空闲坐席</li>
            <li>其他优先级 → 抢单模式,坐席手动接</li>
            <li>坐席负载 ≥ 8 时不再分配新单</li>
            <li>等待时长 &gt; 5 分钟 → 红色高亮提示</li>
          </ul>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useCallQueueStore, CallQueueEntry, CallPriority, CallStatus } from '@/stores/callQueue'
import { useWorkbenchStore } from '@/stores/workbench'

const queueStore = useCallQueueStore()
const wb = useWorkbenchStore()

const sortedEntries = computed(() =>
  [...queueStore.entries].sort((a, b) => {
    // 等待 > 紧急 > 已分配
    if (a.status === 'waiting' && b.status !== 'waiting') return -1
    if (b.status === 'waiting' && a.status !== 'waiting') return 1
    const order: Record<CallPriority, number> = { urgent: 0, high: 1, normal: 2, low: 3 }
    return order[a.priority] - order[b.priority]
  })
)

const waitingCount = computed(() => queueStore.entries.filter(e => e.status === 'waiting').length)
const assignedCount = computed(() => queueStore.entries.filter(e => e.status === 'assigned').length)
const connectedCount = computed(() => queueStore.entries.filter(e => e.status === 'connected').length)
const avgLoad = computed(() => {
  const online = queueStore.agents.filter(a => a.status !== 'offline')
  if (!online.length) return 0
  return Math.round(online.reduce((sum, a) => sum + a.currentLoad, 0) / online.length * 10)
})

function waitingMinutes(e: CallQueueEntry): number {
  const waited = Date.now() - new Date(e.queuedAt).getTime()
  return Math.floor(waited / 60000)
}

function onClaim(e: CallQueueEntry) {
  const agent = queueStore.agents.find(a => a.status === 'online')
  if (!agent) {
    Message.warning('暂无可用坐席')
    return
  }
  queueStore.assignToAgent(e.id, agent.id)
  Message.success(`坐席 ${agent.name} 抢单 ${e.id}`)
}

function onAutoAssign(e: CallQueueEntry) {
  // 按负载最低分配
  const target = [...queueStore.agents]
    .filter(a => a.status === 'online' && a.currentLoad < 8)
    .sort((a, b) => a.currentLoad - b.currentLoad)[0]
  if (!target) {
    Message.warning('没有空闲坐席可分配')
    return
  }
  queueStore.assignToAgent(e.id, target.id)
  Message.success(`自动分单给 ${target.name}(负载 ${target.currentLoad})`)
}

function onConnect(e: CallQueueEntry) {
  if (!e.assignedAgentId) return
  // 调用 workbench store 接通
  wb.triggerIncoming({
    id: e.id,
    type: 'incoming_call',
    title: `来电:${e.customerName}`,
    desc: `${e.channel} · ${e.priority}`,
    priority: e.priority === 'urgent' ? 'critical' : e.priority === 'high' ? 'high' : 'medium',
    customerId: e.customerId,
    customerName: e.customerName,
    createdAt: e.queuedAt,
    source: 'call_queue'
  } as any)
  wb.answerCall()
  queueStore.markConnected(e.id)
  Message.success(`已接通 ${e.customerName}`)
}

function onHangup(e: CallQueueEntry) {
  queueStore.markFinished(e.id)
  wb.hangup()
  Message.success(`已挂断 ${e.customerName}`)
}

function onDrop(e: CallQueueEntry) {
  queueStore.remove(e.id)
}

function priorityColor(p: CallPriority) {
  return ({ urgent: 'red', high: 'orange', normal: 'arcoblue', low: 'gray' })[p] || 'gray'
}
function priorityLabel(p: CallPriority) {
  return ({ urgent: '紧急', high: '高', normal: '普通', low: '低' })[p] || p
}
function statusColor(s: CallStatus) {
  return ({ waiting: 'orange', assigned: 'arcoblue', connected: 'green', finished: 'gray', dropped: 'red' })[s] || 'gray'
}
function statusLabel(s: CallStatus) {
  return ({ waiting: '待分配', assigned: '已分配', connected: '接通中', finished: '已完成', dropped: '已丢弃' })[s] || s
}
</script>

<style scoped>
.cp-kpi-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.cp-kpi-card {
  padding: 12px 16px;
  background: #fff;
  border: 1px solid var(--cp-border-light);
  border-radius: 6px;
}
.cp-kpi-label { font-size: 12px; color: var(--cp-text-tertiary); margin-bottom: 4px; }
.cp-kpi-value { font-size: 24px; font-weight: 700; line-height: 1; }
</style>
