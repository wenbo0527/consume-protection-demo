<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">投诉管控承诺跟踪</h1>
        <div class="cp-page-subtitle">审查归档时提交的同步承诺 · 自动 follow-up 工单 · 跟踪检查闭环</div>
      </div>
      <a-tag color="orange">进行中 {{ cpStore.openCount }} 条</a-tag>
      <a-tag color="red">超时 {{ cpStore.overdueCount }} 条</a-tag>
      <a-tag color="green">已关闭 {{ cpStore.closedCount }} 条</a-tag>
    </div>

    <!-- KPI -->
    <div class="cp-kpi-row">
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">承诺总数</div>
        <div class="cp-kpi-value">{{ cpStore.items.length }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">已发 follow-up 工单</div>
        <div class="cp-kpi-value">{{ withTicketCount }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">即将到期 (≤ 14 天)</div>
        <div class="cp-kpi-value" style="color: var(--cp-warning)">{{ nearDeadlineCount }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">总检查次数</div>
        <div class="cp-kpi-value">{{ totalChecks }}</div>
      </div>
    </div>

    <a-card title="承诺列表">
      <a-table :data="sortedItems" :pagination="{ pageSize: 10 }" row-key="id">
        <a-table-column title="承诺 ID" data-index="id" :width="200">
          <template #cell="{ record }">
            <a-link @click="openDetail(record)">{{ record.id }}</a-link>
          </template>
        </a-table-column>
        <a-table-column title="审查项目" data-index="reviewProjectId" :width="160" />
        <a-table-column title="指标" :width="140">
          <template #cell="{ record }">
            {{ metricLabel(record.metric) }}
          </template>
        </a-table-column>
        <a-table-column title="目标 vs 当前" :width="160">
          <template #cell="{ record }">
            <b>{{ record.targetValue }}</b>
            <span style="color: var(--cp-text-tertiary)"> · 当前 {{ record.currentValue || '-' }}</span>
          </template>
        </a-table-column>
        <a-table-column title="承诺人" :width="100">
          <template #cell="{ record }">
            {{ record.reviewer }}
            <a-tag size="small" color="arcoblue" style="margin-left: 4px">{{
              record.reviewerRole === 'manage' ? '管理层' : '审查'
            }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="截止" :width="120">
          <template #cell="{ record }">
            <span
              :style="
                daysToDeadline(record.deadline) <= 14 && record.status !== 'closed'
                  ? 'color:#fa8c16;font-weight:600'
                  : ''
              "
            >
              {{ record.deadline }}
            </span>
            <div style="font-size: 11px; color: var(--cp-text-tertiary)">
              还剩 {{ daysToDeadline(record.deadline) }} 天
            </div>
          </template>
        </a-table-column>
        <a-table-column title="follow-up 工单" :width="200">
          <template #cell="{ record }">
            <a-link v-if="record.followUpTicketId" @click="jumpTicket(record)">
              {{ record.followUpTicketId }}
            </a-link>
            <span v-else style="color: var(--cp-text-tertiary)">-</span>
          </template>
        </a-table-column>
        <a-table-column title="状态" :width="100">
          <template #cell="{ record }">
            <a-tag :color="statusColor(record.status)">{{ statusLabel(record.status) }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="操作" :width="160" fixed="right">
          <template #cell="{ record }">
            <a-space :size="4">
              <a-button size="mini" type="text" @click="openDetail(record)">详情</a-button>
              <a-button
                v-if="record.status !== 'closed'"
                size="mini"
                type="text"
                status="success"
                @click="onClose(record)"
                >标记达成</a-button
              >
            </a-space>
          </template>
        </a-table-column>
      </a-table>
    </a-card>

    <!-- 详情 -->
    <a-drawer v-model:visible="detailVisible" :width="720" :title="`承诺详情 · ${current?.id || ''}`">
      <div v-if="current">
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item label="承诺指标">{{ metricLabel(current.metric) }}</a-descriptions-item>
          <a-descriptions-item label="目标值"
            ><b>{{ current.targetValue }}</b></a-descriptions-item
          >
          <a-descriptions-item label="当前值">{{ current.currentValue || '-' }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="statusColor(current.status)">{{ statusLabel(current.status) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="承诺人">
            {{ current.reviewer }}
            <a-tag size="small" color="arcoblue">{{ current.reviewerRole === 'manage' ? '管理层' : '审查' }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="截止日">{{ current.deadline }}</a-descriptions-item>
          <a-descriptions-item label="follow-up 工单" :span="2">
            <a-link v-if="current.followUpTicketId" @click="jumpTicket(current)">{{ current.followUpTicketId }}</a-link>
            <span v-else style="color: var(--cp-text-tertiary)">未生成</span>
          </a-descriptions-item>
          <a-descriptions-item label="关联审查项目" :span="2">
            <a-link @click="jumpReview(current)">{{ current.reviewProjectId }}</a-link>
          </a-descriptions-item>
          <a-descriptions-item label="承诺理由" :span="2">{{ current.reason }}</a-descriptions-item>
          <a-descriptions-item label="创建时间" :span="2">{{ current.createdAt }}</a-descriptions-item>
        </a-descriptions>

        <a-divider />

        <h3 style="font-size: 14px; margin: 0 0 12px">跟踪检查时间线</h3>
        <a-empty v-if="!current.checks.length" description="暂无检查记录,点击下方发起检查" />
        <div v-else>
          <div
            v-for="(c, i) in current.checks"
            :key="i"
            style="
              position: relative;
              padding: 8px 0 8px 24px;
              border-left: 2px solid var(--cp-border-light);
              margin-left: 8px;
            "
          >
            <div
              style="
                position: absolute;
                left: -8px;
                top: 12px;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: var(--cp-brand);
              "
            />
            <div>
              <a-tag :color="checkColor(c.result)" size="small">
                {{ c.result === 'good' ? '达标' : c.result === 'warn' ? '预警' : '失败' }}
              </a-tag>
              <span style="margin-left: 8px">{{ c.operator }} · {{ c.at }}</span>
            </div>
            <div style="font-size: 13px; color: var(--cp-text-secondary); margin-top: 4px; line-height: 1.6">
              {{ c.comment }}
            </div>
          </div>
        </div>

        <a-divider />

        <h3 style="font-size: 14px; margin: 0 0 12px">发起新检查</h3>
        <a-form :model="checkForm" layout="vertical" size="small">
          <a-form-item label="结果">
            <a-radio-group v-model="checkForm.result">
              <a-radio value="good">达标</a-radio>
              <a-radio value="warn">预警(趋势恶化)</a-radio>
              <a-radio value="fail">失败(未达标)</a-radio>
            </a-radio-group>
          </a-form-item>
          <a-form-item label="说明">
            <a-textarea v-model="checkForm.comment" :rows="2" placeholder="例:本月投诉率 0.53%,仍在目标 0.5% 之上" />
          </a-form-item>
          <a-form-item label="操作人">
            <a-input v-model="checkForm.operator" placeholder="刘丽" />
          </a-form-item>
          <a-button type="primary" @click="onAddCheck">提交检查</a-button>
        </a-form>
      </div>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useRouter } from 'vue-router'
import { useCompliancePromiseStore, CompliancePromise, PromiseStatus, METRIC_LABEL } from '@/stores/compliancePromise'

const cpStore = useCompliancePromiseStore()
const router = useRouter()

const detailVisible = ref(false)
const current = ref<CompliancePromise | null>(null)

const checkForm = ref({ result: 'good' as 'good' | 'warn' | 'fail', comment: '', operator: '刘丽' })

const sortedItems = computed(() =>
  [...cpStore.items].sort((a, b) => {
    // overdue / in_progress 优先
    const order: Record<PromiseStatus, number> = { overdue: 0, in_progress: 1, ticket_created: 2, open: 3, closed: 4 }
    return order[a.status] - order[b.status]
  })
)

const withTicketCount = computed(() => cpStore.items.filter((i) => i.followUpTicketId).length)
const totalChecks = computed(() => cpStore.items.reduce((sum, i) => sum + i.checks.length, 0))
const nearDeadlineCount = computed(
  () =>
    cpStore.items.filter(
      (i) => i.status !== 'closed' && daysToDeadline(i.deadline) <= 14 && daysToDeadline(i.deadline) >= 0
    ).length
)

function daysToDeadline(deadline: string): number {
  const today = new Date()
  const deadlineDate = new Date(deadline)
  const ms = deadlineDate.getTime() - today.setHours(0, 0, 0, 0)
  return Math.floor(ms / 86400000)
}

function metricLabel(m: string): string {
  return (METRIC_LABEL as any)[m] || m
}

function statusColor(s: PromiseStatus): string {
  return (
    { open: 'orange', ticket_created: 'arcoblue', in_progress: 'arcoblue', closed: 'green', overdue: 'red' }[s] ||
    'gray'
  )
}
function statusLabel(s: PromiseStatus): string {
  return (
    { open: '待发起', ticket_created: '工单已生成', in_progress: '跟踪中', closed: '已达成', overdue: '已超时' }[s] || s
  )
}
function checkColor(r: string): string {
  return { good: 'green', warn: 'orange', fail: 'red' }[r] || 'gray'
}

function openDetail(c: CompliancePromise) {
  current.value = c
  detailVisible.value = true
}

function onClose(c: CompliancePromise) {
  cpStore.close(c.id, '目标已达成,工单可关')
  Message.success(`承诺 ${c.id} 已标记达成`)
}

function onAddCheck() {
  if (!current.value || !checkForm.value.comment || !checkForm.value.operator) {
    Message.warning('请填写完整')
    return
  }
  cpStore.addCheck(current.value.id, {
    result: checkForm.value.result,
    comment: checkForm.value.comment,
    operator: checkForm.value.operator
  })
  Message.success('检查已记录')
  checkForm.value = { result: 'good', comment: '', operator: '刘丽' }
  // 刷新 current
  current.value = cpStore.items.find((p) => p.id === current.value!.id) || current.value
}

function jumpTicket(c: CompliancePromise) {
  if (c.followUpTicketId) {
    router.push('/manage/tickets')
  }
}
function jumpReview(c: CompliancePromise) {
  router.push(`/review/${c.reviewProjectId}`)
}
</script>

<style scoped>
.cp-kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.cp-kpi-card {
  padding: 12px 16px;
  background: #fff;
  border: 1px solid var(--cp-border-light);
  border-radius: 6px;
}
.cp-kpi-label {
  font-size: 12px;
  color: var(--cp-text-tertiary);
  margin-bottom: 4px;
}
.cp-kpi-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}
</style>
