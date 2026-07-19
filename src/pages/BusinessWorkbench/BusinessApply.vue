<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">业务申请审批</h1>
        <div class="cp-page-subtitle">坐席发起的业务申请收件箱 · 审批/驳回 → 走工作流实例</div>
      </div>
      <a-space>
        <a-radio-group v-model="statusFilter" type="button">
          <a-radio value="all">全部</a-radio>
          <a-radio value="pending">待审批 ({{ businessApp.pendingCount }})</a-radio>
          <a-radio value="inProgress">执行中 ({{ businessApp.inProgressCount }})</a-radio>
          <a-radio value="executed">已执行 ({{ businessApp.doneCount }})</a-radio>
          <a-radio value="rejected">已驳回</a-radio>
        </a-radio-group>
      </a-space>
    </div>

    <!-- KPI -->
    <div class="cp-kpi-row">
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">总申请数</div>
        <div class="cp-kpi-value">{{ businessApp.items.length }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">待审批</div>
        <div class="cp-kpi-value" style="color: var(--cp-warning)">{{ businessApp.pendingCount }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">执行中</div>
        <div class="cp-kpi-value" style="color: var(--cp-brand)">{{ businessApp.inProgressCount }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">已执行</div>
        <div class="cp-kpi-value" style="color: var(--cp-success)">{{ businessApp.doneCount }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">通过率</div>
        <div class="cp-kpi-value">{{ passRate }}%</div>
      </div>
    </div>

    <!-- 主列表 -->
    <div class="cp-card" style="padding: 0">
      <a-table :data="filteredList" :pagination="{ pageSize: 10 }" row-key="id">
        <a-table-column title="申请单号" data-index="id" :width="180">
          <template #cell="{ record }">
            <a-link @click="openDetail(record)">{{ record.id }}</a-link>
          </template>
        </a-table-column>
        <a-table-column title="类型" :width="100">
          <template #cell="{ record }">
            <a-tag :color="typeColor(record.type)">{{ typeLabel(record.type) }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="标题" data-index="title" />
        <a-table-column title="申请人(坐席)" :width="120">
          <template #cell="{ record }">
            {{ record.applicantName }}
            <div style="font-size: 11px; color: var(--cp-text-tertiary)">{{ record.createdAt }}</div>
          </template>
        </a-table-column>
        <a-table-column title="客户" :width="140">
          <template #cell="{ record }">
            <div>{{ record.customerName }}</div>
            <div style="font-size: 11px; color: var(--cp-text-tertiary)">{{ record.customerId }}</div>
          </template>
        </a-table-column>
        <a-table-column title="工单" data-index="ticketId" :width="140">
          <template #cell="{ record }">
            <span v-if="record.ticketId" class="mono">{{ record.ticketId }}</span>
            <span v-else style="color: var(--cp-text-tertiary)">-</span>
          </template>
        </a-table-column>
        <a-table-column title="优先级" :width="80">
          <template #cell="{ record }">
            <a-tag :color="priorityColor(record.priority)" size="small">{{ priorityLabel(record.priority) }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="状态" :width="100">
          <template #cell="{ record }">
            <a-tag :color="statusColor(record.status)">{{ statusLabel(record.status) }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="操作" :width="220" fixed="right">
          <template #cell="{ record }">
            <a-space :size="4">
              <a-button size="mini" type="text" @click="openDetail(record)">详情</a-button>
              <template v-if="record.status === 'pending'">
                <a-button size="mini" type="text" status="success" @click="onApprove(record)">批准</a-button>
                <a-button size="mini" type="text" status="danger" @click="onReject(record)">驳回</a-button>
              </template>
              <a-button
                v-if="record.status === 'approved' || record.status === 'in_progress'"
                size="mini"
                type="text"
                @click="onMarkInProgress(record)"
              >
                {{ record.status === 'approved' ? '启动执行' : '标记完成' }}
              </a-button>
            </a-space>
          </template>
        </a-table-column>
      </a-table>
    </div>

    <!-- 详情抽屉 -->
    <a-drawer v-model:visible="detailVisible" :width="640" :title="`申请详情 · ${currentApp?.id || ''}`">
      <div v-if="currentApp" style="padding: 0 8px">
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item label="申请类型">
            <a-tag :color="typeColor(currentApp.type)">{{ typeLabel(currentApp.type) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="优先级">
            <a-tag :color="priorityColor(currentApp.priority)">{{ priorityLabel(currentApp.priority) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="状态" :span="2">
            <a-tag :color="statusColor(currentApp.status)">{{ statusLabel(currentApp.status) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="申请人">{{ currentApp.applicantName }}</a-descriptions-item>
          <a-descriptions-item label="客户">{{ currentApp.customerName }} ({{ currentApp.customerId }})</a-descriptions-item>
          <a-descriptions-item label="工单" :span="2">
            <span v-if="currentApp.ticketId">{{ currentApp.ticketId }}</span>
            <span v-else style="color: var(--cp-text-tertiary)">-</span>
          </a-descriptions-item>
          <a-descriptions-item label="标题" :span="2">{{ currentApp.title }}</a-descriptions-item>
          <a-descriptions-item label="申请说明" :span="2">{{ currentApp.reason }}</a-descriptions-item>
          <a-descriptions-item v-if="currentApp.context" label="前情提要" :span="2">{{ currentApp.context }}</a-descriptions-item>
          <a-descriptions-item v-if="currentApp.reviewer" label="审批人">{{ currentApp.reviewer }}</a-descriptions-item>
          <a-descriptions-item v-if="currentApp.reviewedAt" label="审批时间">{{ currentApp.reviewedAt }}</a-descriptions-item>
          <a-descriptions-item v-if="currentApp.reviewNote" label="审批意见" :span="2">{{ currentApp.reviewNote }}</a-descriptions-item>
          <a-descriptions-item v-if="currentApp.workflowInstanceId" label="工作流实例" :span="2">
            <a-link @click="goWorkflow(currentApp.workflowInstanceId)">{{ currentApp.workflowInstanceId }}</a-link>
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-drawer>

    <!-- 审批弹窗 -->
    <a-modal v-model:visible="approveVisible" :title="`审批 · ${approveAction === 'pass' ? '批准' : '驳回'}`" :width="480" :ok-text="'提交'" @ok="onSubmitApprove">
      <div v-if="approveTarget">
        <p>申请:<b>{{ approveTarget.id }}</b></p>
        <p>客户:<b>{{ approveTarget.customerName }}</b></p>
        <p>申请说明:<b style="font-weight: normal">{{ approveTarget.reason }}</b></p>
        <p v-if="approveAction === 'pass'" style="font-size: 12px; color: var(--cp-text-tertiary)">
          批准后将自动启动对应工作流(停催/协商/异议等)。
        </p>
        <a-form-item label="审批意见" required>
          <a-textarea v-model="approveNote" :rows="3" placeholder="请说明理由" />
        </a-form-item>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useRouter } from 'vue-router'
import {
  useBusinessAppStore,
  APP_TYPE_LABEL,
  AppType,
  AppStatus,
  AppPriority
} from '@/stores/businessApp'
import { useWorkflowStore, WorkflowKind } from '@/stores/workflow'
import { useUserStore, getRoleInfo } from '@/stores/user'

const businessApp = useBusinessAppStore()
const wf = useWorkflowStore()
const userStore = useUserStore()
const router = useRouter()

const statusFilter = ref<'all' | 'pending' | 'inProgress' | 'executed' | 'rejected'>('pending')

const filteredList = computed(() => {
  if (statusFilter.value === 'all') return businessApp.items
  if (statusFilter.value === 'pending') return businessApp.items.filter(a => a.status === 'pending')
  if (statusFilter.value === 'inProgress') return businessApp.items.filter(a => a.status === 'approved' || a.status === 'in_progress')
  if (statusFilter.value === 'executed') return businessApp.items.filter(a => a.status === 'executed' || a.status === 'closed')
  if (statusFilter.value === 'rejected') return businessApp.items.filter(a => a.status === 'rejected')
  return businessApp.items
})

const passRate = computed(() => {
  const finish = businessApp.items.filter(a => a.status === 'approved' || a.status === 'in_progress' || a.status === 'executed' || a.status === 'rejected')
  if (!finish.length) return 0
  const passed = businessApp.items.filter(a => a.status === 'approved' || a.status === 'in_progress' || a.status === 'executed')
  return Math.round(passed.length / finish.length * 100)
})

// 详情
const detailVisible = ref(false)
const currentApp = ref<typeof businessApp.items[0] | null>(null)
function openDetail(a: typeof businessApp.items[0]) {
  currentApp.value = a
  detailVisible.value = true
}

// 审批弹窗
const approveVisible = ref(false)
const approveTarget = ref<typeof businessApp.items[0] | null>(null)
const approveAction = ref<'pass' | 'reject'>('pass')
const approveNote = ref('')

function onApprove(a: typeof businessApp.items[0]) {
  approveTarget.value = a
  approveAction.value = 'pass'
  approveNote.value = '同意启动'
  approveVisible.value = true
}
function onReject(a: typeof businessApp.items[0]) {
  approveTarget.value = a
  approveAction.value = 'reject'
  approveNote.value = ''
  approveVisible.value = true
}

function getCurrentOperator(): string {
  return userStore.currentRole
    ? (getRoleInfo(userStore.currentRole)?.username || '业务执行岗')
    : '李伟'
}

function onSubmitApprove() {
  if (!approveTarget.value || !approveNote.value) {
    Message.warning('请填写意见')
    return
  }
  const reviewer = getCurrentOperator()
  const app = approveTarget.value

  if (approveAction.value === 'pass') {
    // 启动对应类型的工作流实例(简化版:只创建 instance 不渲染 stop_collection 的子节点)
    const map: Record<AppType, WorkflowKind> = {
      stop_collection: 'stop_collection',
      negotiate: 'negotiate',
      credit_objection: 'credit_objection',
      transfer_mediate: 'transfer_mediate',
      extended_repayment: 'negotiate'
    }
    const kind = map[app.type]
    const inst = wf.start({
      kind,
      initiator: reviewer,
      initiatorRole: 'business',
      customerId: app.customerId,
      customerName: app.customerName,
      ticketId: app.ticketId,
      payload: {
        title: app.title,
        reason: app.reason,
        context: app.context,
        loanId: '',
        agentName: app.applicantName,
        ticketId: app.ticketId,
        businessAppId: app.id
      }
    })
    if (!inst) {
      Message.warning('工作流模板未找到,已仅保存审批结论')
      businessApp.approve(app.id, reviewer, approveNote.value, undefined)
      approveVisible.value = false
      return
    }
    businessApp.approve(app.id, reviewer, approveNote.value, inst.id)
    Message.success(`已批准并启动工作流 ${inst.id}`)
  } else {
    businessApp.reject(app.id, reviewer, approveNote.value)
    Message.success('已驳回')
  }
  approveVisible.value = false
}

function onMarkInProgress(a: typeof businessApp.items[0]) {
  if (a.status === 'approved') {
    businessApp.markInProgress(a.id, a.workflowInstanceId || 'n/a')
    Message.success('已进入执行状态')
  } else if (a.status === 'in_progress') {
    businessApp.complete(a.id)
    Message.success('已标记完成')
  }
}

function goWorkflow(instId: string) {
  if (instId.startsWith('stop_collection')) {
    router.push('/business/stop-coll')
  } else if (instId.startsWith('negotiate')) {
    router.push('/business/negotiate')
  } else if (instId.startsWith('credit_objection')) {
    router.push('/business/credit')
  } else if (instId.startsWith('transfer_mediate')) {
    router.push('/business/transfer')
  } else {
    router.push('/business/desk')
  }
  detailVisible.value = false
}

// tools
function typeColor(t: AppType) {
  return ({
    stop_collection: 'cyan',
    negotiate: 'arcoblue',
    credit_objection: 'purple',
    transfer_mediate: 'magenta',
    extended_repayment: 'gold'
  } as const)[t] || 'gray'
}
function typeLabel(t: AppType) { return APP_TYPE_LABEL[t] || t }
function priorityColor(p: AppPriority) {
  return ({ low: 'gray', normal: 'arcoblue', high: 'orange' })[p] || 'gray'
}
function priorityLabel(p: AppPriority) {
  return ({ low: '低', normal: '普通', high: '紧急' })[p] || p
}
function statusColor(s: AppStatus) {
  return ({ pending: 'orange', approved: 'arcoblue', rejected: 'red', in_progress: 'blue', executed: 'green', closed: 'gray' })[s] || 'gray'
}
function statusLabel(s: AppStatus) {
  return ({ pending: '待审批', approved: '已批准', rejected: '已驳回', in_progress: '执行中', executed: '已执行', closed: '已关闭' })[s] || s
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
