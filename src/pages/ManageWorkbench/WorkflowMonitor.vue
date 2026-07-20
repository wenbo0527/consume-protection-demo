<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">工单流转监控</h1>
        <div class="cp-page-subtitle">实时监控所有工单流转状态 · 异常卡控 · 数据每 30 秒刷新</div>
      </div>
      <a-space>
        <a-radio-group v-model="period" type="button">
          <a-radio-button value="today">今日</a-radio-button>
          <a-radio-button value="week">本周</a-radio-button>
          <a-radio-button value="month">本月</a-radio-button>
        </a-radio-group>
        <a-button><icon-refresh /> 刷新</a-button>
        <a-button><icon-export /> 导出</a-button>
      </a-space>
    </div>

    <!-- 顶部 KPI -->
    <div class="cp-stat-row">
      <div class="cp-stat-card">
        <div class="cp-stat-label">在办工单</div>
        <div class="cp-stat-value mono">{{ inProgress }}</div>
        <div class="cp-stat-extra">较昨日 <span style="color: var(--cp-success)">+8</span></div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">即将超时</div>
        <div class="cp-stat-value mono" style="color: var(--cp-warning)">{{ soonOverdue }}</div>
        <div class="cp-stat-extra cp-pulse" style="color: var(--cp-warning)">需关注</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">已超时</div>
        <div class="cp-stat-value mono" style="color: var(--cp-danger)">{{ overdue }}</div>
        <div class="cp-stat-extra">超时率 {{ overdueRate }}%</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">平均流转时长</div>
        <div class="cp-stat-value mono">3.2 d</div>
        <div class="cp-stat-extra">较上周 <span style="color: var(--cp-success)">-0.3d</span></div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">今日关单</div>
        <div class="cp-stat-value mono" style="color: var(--cp-success)">{{ todayClosed }}</div>
        <div class="cp-stat-extra">关单率 {{ closeRate }}%</div>
      </div>
    </div>

    <!-- 异常预警条 -->
    <a-alert type="error" show-icon style="margin-bottom: 16px">
      <template #title>监管件超时预警 · 1 件</template>
      <template #content>
        <div style="margin-top: 4px">
          <a-link>GD-20260709-0015</a-link> 已处理 7 天 +1 天,超时未关单
          <a-button size="small" type="primary" status="danger" style="margin-left: 12px">立即处置</a-button>
        </div>
      </template>
    </a-alert>

    <!-- 状态分布看板 -->
    <div class="cp-card" style="padding: 16px 20px; margin-bottom: 16px">
      <h3 class="cp-section-title">状态分布(在办工单)</h3>
      <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px">
        <div v-for="s in statusDist" :key="s.code" class="cp-status-box" :style="{ borderColor: s.color }">
          <div :style="{ color: s.color }" class="cp-status-count mono">{{ s.count }}</div>
          <div class="cp-status-label">{{ s.name }}</div>
          <div class="cp-status-percent">{{ s.percent }}%</div>
          <div class="cp-status-bar"><div :style="{ width: s.percent + '%', background: s.color }"></div></div>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="cp-card" style="padding: 12px 16px; margin-bottom: 12px">
      <a-space>
        <a-input-search v-model="keyword" placeholder="工单号 / 客户" style="width: 240px" />
        <a-select v-model="statusFilter" placeholder="状态" style="width: 140px" allow-clear>
          <a-option value="processing">处理中</a-option>
          <a-option value="todo">待接收</a-option>
          <a-option value="transfer">待流转</a-option>
          <a-option value="closing">待关单</a-option>
        </a-select>
        <a-select v-model="urgencyFilter" placeholder="紧急度" style="width: 120px" allow-clear>
          <a-option value="special">特急</a-option>
          <a-option value="urgent">紧急</a-option>
          <a-option value="normal">普通</a-option>
        </a-select>
        <a-checkbox v-model="regOnly">仅监管件</a-checkbox>
        <a-checkbox v-model="overdueOnly">仅超时</a-checkbox>
        <a-button @click="resetFilter">重置</a-button>
      </a-space>
    </div>

    <!-- 工单流转追踪列表 -->
    <div class="cp-card" style="padding: 0">
      <a-table :data="filteredTickets" :pagination="{ pageSize: 10 }">
        <template #columns>
          <a-table-column title="工单号" data-index="id" :width="180">
            <template #cell="{ record }">
              <a-link @click="$router.push(`/agent/ticket/${record.id}`)">{{ record.id }}</a-link>
            </template>
          </a-table-column>
          <a-table-column title="客户" data-index="customerName" :width="100" />
          <a-table-column title="工单性质" data-index="typeLabel" :width="100">
            <template #cell="{ record }">
              <a-tag v-if="record.isRegulator" color="orangered" size="small">监管</a-tag>
              {{ record.typeLabel }}
            </template>
          </a-table-column>
          <a-table-column title="紧急度" data-index="urgency" :width="80">
            <template #cell="{ record }">
              <status-badge :status="record.urgency" />
            </template>
          </a-table-column>
          <a-table-column title="当前状态" data-index="status" :width="100">
            <template #cell="{ record }">
              <status-badge :status="record.status" />
            </template>
          </a-table-column>
          <a-table-column title="处理人" data-index="handler" :width="80" />
          <a-table-column title="流转时长" :width="100">
            <template #cell="{ record }">
              <span
                class="mono"
                :style="{
                  color: record.duration > 7 ? 'var(--cp-danger)' : record.duration > 5 ? 'var(--cp-warning)' : ''
                }"
              >
                {{ record.duration }} d
              </span>
            </template>
          </a-table-column>
          <a-table-column title="下一步" :width="140">
            <template #cell="{ record }">
              <span style="font-size: 12px">{{ record.nextStep }}</span>
            </template>
          </a-table-column>
          <a-table-column title="流转追踪" :width="120">
            <template #cell="{ record }">
              <a-button size="small" @click="showTimeline(record)">查看</a-button>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </div>

    <!-- 流转追踪 Drawer -->
    <a-drawer
      v-model:visible="timelineVisible"
      :width="520"
      :title="`流转追踪 · ${currentTicket?.id}`"
      placement="right"
    >
      <div v-if="currentTicket">
        <a-alert
          :type="currentTicket.duration > 7 ? 'error' : currentTicket.duration > 5 ? 'warning' : 'info'"
          show-icon
          style="margin-bottom: 16px"
        >
          <template #title>已流转 {{ currentTicket.duration }} 天</template>
          <template #content>当前 {{ currentTicket.customerName }} · 处理人 {{ currentTicket.handler }}</template>
        </a-alert>
        <a-timeline>
          <a-timeline-item v-for="(t, idx) in currentTicket.timeline" :key="idx" :label="t.time">
            <div style="font-weight: 500">{{ t.action }}</div>
            <div style="font-size: 12px; color: var(--cp-text-tertiary)">操作人:{{ t.operator }}</div>
          </a-timeline-item>
        </a-timeline>
      </div>
    </a-drawer>

    <!-- ========== 业务工作流实例(由 P0 引入) ========== -->
    <div class="cp-card" style="padding: 16px 20px; margin-top: 16px">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px">
        <h3 class="cp-section-title" style="margin: 0">业务工作流实例 ({{ bizInstances.length }})</h3>
        <a-space :size="4">
          <a-select v-model="bizKindFilter" placeholder="工作流类型" allow-clear style="width: 160px" size="small">
            <a-option v-for="tpl in wf.templates" :key="tpl.kind" :value="tpl.kind">{{ tpl.name }}</a-option>
          </a-select>
          <a-select v-model="bizStatusFilter" placeholder="状态" allow-clear style="width: 120px" size="small">
            <a-option value="running">进行中</a-option>
            <a-option value="approved">已通过</a-option>
            <a-option value="rejected">已驳回</a-option>
            <a-option value="finished">已完成</a-option>
          </a-select>
        </a-space>
      </div>
      <a-empty v-if="!bizInstances.length" description="暂无业务工作流实例" />
      <a-table v-else :data="bizInstances" :pagination="{ pageSize: 8 }" row-key="id">
        <template #columns>
          <a-table-column title="工作流实例" :width="170">
            <template #cell="{ record }">
              <span class="mono" style="color: var(--cp-brand)">{{ record.id }}</span>
              <div style="font-size: 11px; color: var(--cp-text-tertiary); margin-top: 2px">{{ record.createdAt }}</div>
            </template>
          </a-table-column>
          <a-table-column title="类型" :width="120">
            <template #cell="{ record }">
              <a-tag size="small" :color="kindColor(record.kind)">{{ wf.templateByKind(record.kind)?.name }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="客户" data-index="customerName" :width="100" />
          <a-table-column title="发起人" :width="100">
            <template #cell="{ record }">
              {{ record.initiator }}
              <div style="font-size: 11px; color: var(--cp-text-tertiary)">{{ roleLabel(record.initiatorRole) }}</div>
            </template>
          </a-table-column>
          <a-table-column title="当前节点">
            <template #cell="{ record }">
              <a-tag size="small" :color="nodeKindColor(currentNodeKind(record))">{{ currentNodeName(record) }}</a-tag>
              <span style="font-size: 11px; color: var(--cp-text-tertiary); margin-left: 6px"
                >{{ roleLabel(currentNodeRole(record)) }}处置</span
              >
              <a-tag
                v-if="slaProgressOf(record) >= 0.75"
                size="small"
                :color="slaProgressOf(record) >= 1 ? 'red' : 'orange'"
                style="margin-left: 4px"
              >
                SLA {{ Math.round(slaProgressOf(record) * 100) }}%
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="状态" :width="90">
            <template #cell="{ record }">
              <a-tag size="small" :color="statusColor(record.status)">{{ statusLabel(record.status) }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="副作用回写" data-index="relatedTicketStatus" :width="120">
            <template #cell="{ record }">
              <span v-if="record.relatedTicketStatus" style="color: var(--cp-success); font-size: 12px">{{
                record.relatedTicketStatus
              }}</span>
              <span v-else style="color: var(--cp-text-tertiary); font-size: 11px">-</span>
            </template>
          </a-table-column>
          <a-table-column title="操作" :width="80">
            <template #cell="{ record }">
              <a-button size="small" @click="openBizTimeline(record)">节点轨迹</a-button>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </div>

    <!-- 业务工作流节点轨迹 Drawer -->
    <a-drawer
      v-model:visible="bizTimelineVisible"
      :width="560"
      :title="bizCurrent ? `${bizCurrent.id} · ${wf.templateByKind(bizCurrent.kind)?.name || ''}` : '节点轨迹'"
    >
      <div v-if="bizCurrent">
        <a-descriptions :column="1" bordered size="small" style="margin-bottom: 16px">
          <a-descriptions-item label="客户">{{ bizCurrent.customerName || '-' }}</a-descriptions-item>
          <a-descriptions-item v-if="bizCurrent.ticketId" label="关联工单">{{
            bizCurrent.ticketId
          }}</a-descriptions-item>
          <a-descriptions-item label="发起"
            >{{ bizCurrent.initiator }} · {{ bizCurrent.createdAt }}</a-descriptions-item
          >
          <a-descriptions-item label="状态">
            <a-tag :color="statusColor(bizCurrent.status)">{{ statusLabel(bizCurrent.status) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item v-if="bizCurrent.relatedTicketStatus" label="副作用回写">{{
            bizCurrent.relatedTicketStatus
          }}</a-descriptions-item>
        </a-descriptions>
        <a-timeline>
          <a-timeline-item
            v-for="n in wf.templateByKind(bizCurrent.kind)?.nodes || []"
            :key="n.code"
            :color="
              n.code === bizCurrent.currentNode
                ? 'var(--cp-brand)'
                : execStatusOf(bizCurrent, n.code) === 'approved'
                  ? 'var(--cp-success)'
                  : execStatusOf(bizCurrent, n.code) === 'rejected'
                    ? 'var(--cp-danger)'
                    : 'gray'
            "
          >
            <div style="display: flex; justify-content: space-between">
              <span style="font-weight: 500">{{ n.name }}</span>
              <a-tag size="small">{{ nodeKindShort(n.kind) }}</a-tag>
            </div>
            <div style="font-size: 11px; color: var(--cp-text-tertiary); margin-top: 2px">
              处置 {{ roleLabel(n.handlerRole) }} · SLA {{ n.slaHours }}h
            </div>
            <div v-if="execOf(bizCurrent, n.code)?.comment" style="font-size: 12px; margin-top: 4px">
              <b style="color: var(--cp-text-secondary)">{{ execOf(bizCurrent, n.code)?.operator }}</b>
              · {{ execOf(bizCurrent, n.code)?.operatedAt }} · {{ execOf(bizCurrent, n.code)?.comment }}
            </div>
            <div
              v-if="execOf(bizCurrent, n.code)?.payload && Object.keys(execOf(bizCurrent, n.code)!.payload!).length"
              style="
                font-size: 11px;
                margin-top: 4px;
                background: var(--cp-bg-soft);
                padding: 6px 8px;
                border-radius: 4px;
              "
            >
              <span v-for="(v, k) in execOf(bizCurrent, n.code)!.payload" :key="k" style="margin-right: 12px">
                <span style="color: var(--cp-text-tertiary)">{{ k }}:</span> <b>{{ v }}</b>
              </span>
            </div>
          </a-timeline-item>
        </a-timeline>
      </div>
    </a-drawer>

    <!-- ========== 溯源整改任务(P2-1) ========== -->
    <div class="cp-card" style="padding: 16px 20px; margin-top: 16px">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px">
        <h3 class="cp-section-title" style="margin: 0">溯源整改任务 ({{ rectify.tasks.length }})</h3>
        <a-button size="small" type="primary" @click="$router.push('/manage/rectify')"> 进入整改工作台 → </a-button>
      </div>
      <a-empty v-if="!rectify.tasks.length" description="暂无整改任务" />
      <a-table v-else :data="rectify.tasks" :pagination="{ pageSize: 5 }" row-key="id">
        <template #columns>
          <a-table-column title="任务编号" :width="160">
            <template #cell="{ record }">
              <span class="mono" style="color: var(--cp-brand)">{{ record.id }}</span>
            </template>
          </a-table-column>
          <a-table-column title="整改场景" data-index="scene" :width="140" />
          <a-table-column title="责任部门" data-index="dept" :width="120" />
          <a-table-column title="责任人" data-index="owner" :width="120" />
          <a-table-column title="截止" data-index="deadline" :width="100" />
          <a-table-column title="状态" :width="90">
            <template #cell="{ record }">
              <a-tag size="small" :color="rectStatusColor(record.status)">{{ rectStatusLabel(record.status) }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="沉淀产出">
            <template #cell="{ record }">
              <a-space :size="4">
                <a-tag v-if="record.generatedStandardIds?.length" size="small" color="purple"
                  >{{ record.generatedStandardIds.length }} 标准</a-tag
                >
                <a-tag v-if="record.generatedKbIds?.length" size="small" color="arcoblue"
                  >{{ record.generatedKbIds.length }} 知识</a-tag
                >
                <span
                  v-if="!record.generatedStandardIds?.length && !record.generatedKbIds?.length"
                  style="color: var(--cp-text-tertiary); font-size: 11px"
                  >-</span
                >
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { tickets } from '@/mock/data'
import { useWorkflowStore, WorkflowInstance, WorkflowKind } from '@/stores/workflow'
import { useRectifyStore } from '@/stores/rectify'
import { roleShortLabel as baseRoleLabel } from '@/utils/role-name'
import StatusBadge from '@/components/StatusBadge.vue'

const period = ref('today')
const keyword = ref('')
const statusFilter = ref('')
const urgencyFilter = ref('')
const regOnly = ref(false)
const overdueOnly = ref(false)
const timelineVisible = ref(false)
const currentTicket = ref<any>(null)

// KPI 计算(基于 mock tickets)
const allTickets = computed(() => tickets)
const inProgress = computed(() => allTickets.value.filter((t) => t.status !== 'closed').length)
const overdue = computed(() => allTickets.value.filter((t) => t.urgency === 'special' && t.status !== 'closed').length)
const soonOverdue = computed(
  () => allTickets.value.filter((t) => t.urgency === 'urgent' && t.status !== 'closed').length
)
const todayClosed = computed(() => allTickets.value.filter((t) => t.status === 'closed').length)
const overdueRate = computed(() => (inProgress.value ? Math.round((overdue.value / inProgress.value) * 100) : 0))
const closeRate = computed(() => Math.round((todayClosed.value / allTickets.value.length) * 100))

// 状态分布
const statusDist = [
  { code: 'pending', name: '待分派', count: 2, percent: 8, color: '#00b42a' },
  { code: 'todo', name: '待接收', count: 4, percent: 16, color: '#165dff' },
  { code: 'processing', name: '处理中', count: 12, percent: 48, color: '#722ed1' },
  { code: 'transfer', name: '待流转', count: 3, percent: 12, color: '#ff7d00' },
  { code: 'closing', name: '待关单', count: 2, percent: 8, color: '#f53f3f' },
  { code: 'closed', name: '已关单', count: 2, percent: 8, color: '#86909c' }
]

// 流转时长 & 下一步(基于 mock 数据动态生成)
const enrichedTickets = computed(() =>
  allTickets.value.map((t, i) => ({
    ...t,
    duration: t.status === 'closed' ? Math.floor(Math.random() * 5) + 1 : Math.floor(Math.random() * 6) + 2,
    nextStep:
      t.status === 'todo'
        ? '分配坐席'
        : t.status === 'processing'
          ? '客户回复/转办'
          : t.status === 'closing'
            ? '坐席确认关单'
            : '已归档'
  }))
)

const filteredTickets = computed(() => {
  return enrichedTickets.value.filter((t) => {
    if (keyword.value && !(t.id.includes(keyword.value) || t.customerName.includes(keyword.value))) return false
    if (statusFilter.value && t.status !== statusFilter.value) return false
    if (urgencyFilter.value && t.urgency !== urgencyFilter.value) return false
    if (regOnly.value && !t.isRegulator) return false
    if (overdueOnly.value && t.duration <= 5) return false
    return true
  })
})

function resetFilter() {
  keyword.value = ''
  statusFilter.value = ''
  urgencyFilter.value = ''
  regOnly.value = false
  overdueOnly.value = false
}

function showTimeline(t: any) {
  currentTicket.value = t
  timelineVisible.value = true
}

// ============ 业务工作流实例(P0 引入) ============
const wf = useWorkflowStore()
const rectify = useRectifyStore()

function rectStatusColor(s: string) {
  return { pending: 'orange', in_progress: 'arcoblue', done: 'green', verified: 'green', rejected: 'red' }[s] || 'gray'
}
function rectStatusLabel(s: string) {
  return { pending: '待开始', in_progress: '进行中', done: '已完成', verified: '已验证', rejected: '驳回' }[s] || s
}

const bizKindFilter = ref<WorkflowKind | ''>('')
const bizStatusFilter = ref<string>('')
const bizTimelineVisible = ref(false)
const bizCurrent = ref<WorkflowInstance | null>(null)

const bizInstances = computed(() => {
  return wf.instances.filter((i) => {
    if (bizKindFilter.value && i.kind !== bizKindFilter.value) return false
    if (bizStatusFilter.value && i.status !== bizStatusFilter.value) return false
    return true
  })
})

function currentNodeName(inst: WorkflowInstance) {
  return wf.templateByKind(inst.kind)?.nodes.find((n) => n.code === inst.currentNode)?.name || inst.currentNode
}
function currentNodeKind(inst: WorkflowInstance) {
  return wf.templateByKind(inst.kind)?.nodes.find((n) => n.code === inst.currentNode)?.kind || 'auto'
}
function currentNodeRole(inst: WorkflowInstance): any {
  return wf.templateByKind(inst.kind)?.nodes.find((n) => n.code === inst.currentNode)?.handlerRole || 'system'
}
function execOf(inst: WorkflowInstance, code: string) {
  return inst.executions.find((e) => e.nodeCode === code)
}
function execStatusOf(inst: WorkflowInstance, code: string) {
  return execOf(inst, code)?.status || 'pending'
}
function slaProgressOf(inst: WorkflowInstance): number {
  if (inst.status !== 'running') return 0
  const tpl = wf.templateByKind(inst.kind)
  if (!tpl) return 0
  const node = tpl.nodes.find((n) => n.code === inst.currentNode)
  if (!node || !node.slaHours) return 0
  const start = new Date(inst.currentNodeStartedAt.replace(' ', 'T')).getTime()
  return (Date.now() - start) / 3600000 / node.slaHours
}
function openBizTimeline(inst: WorkflowInstance) {
  bizCurrent.value = inst
  bizTimelineVisible.value = true
}
function kindColor(kind: WorkflowKind) {
  return (
    {
      stop_collection: 'orange',
      negotiate: 'green',
      transfer_mediate: 'arcoblue',
      credit_objection: 'red',
      review_archive: 'purple',
      alert_directive: 'magenta'
    }[kind] || 'gray'
  )
}
function nodeKindColor(k: string) {
  return (
    { apply: 'arcoblue', approve: 'orange', execute: 'green', notify: 'gray', auto: 'gray', archive: 'gray' }[k] ||
    'gray'
  )
}
function nodeKindShort(k: string) {
  return { apply: '申请', approve: '审批', execute: '执行', notify: '通知', auto: '自动', archive: '归档' }[k] || k
}
function roleLabel(r: string) {
  if (r === 'system') return '系统'
  return baseRoleLabel(r)
}
function statusColor(s: WorkflowInstance['status']) {
  return { running: 'arcoblue', approved: 'green', rejected: 'red', expired: 'orange', finished: 'gray' }[s] || 'gray'
}
function statusLabel(s: WorkflowInstance['status']) {
  return { running: '进行中', approved: '已通过', rejected: '已驳回', expired: '已超时', finished: '已完成' }[s] || s
}
</script>

<style scoped>
.cp-section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--cp-text);
}

/* 状态分布卡片 */
.cp-status-box {
  border: 1px solid var(--cp-border-light);
  border-top: 3px solid var(--cp-brand);
  border-radius: 6px;
  padding: 14px 16px;
  text-align: center;
  background: #fff;
}
.cp-status-count {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}
.cp-status-label {
  font-size: 12px;
  color: var(--cp-text-secondary);
}
.cp-status-percent {
  font-size: 11px;
  color: var(--cp-text-tertiary);
  margin-top: 2px;
}
.cp-status-bar {
  margin-top: 8px;
  height: 4px;
  background: var(--cp-bg-soft);
  border-radius: 2px;
  overflow: hidden;
}
.cp-status-bar > div {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s;
}
</style>
