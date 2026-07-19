<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">贷中清退</h1>
        <div class="cp-page-subtitle">在贷存续期客户清退 · 多轮审批 · 客户告知 · 资产处置</div>
      </div>
      <a-space>
        <a-button @click="showHighRiskList">查看高风险客户</a-button>
        <a-button type="primary" @click="showCreate = true">启动清退</a-button>
      </a-space>
    </div>

    <!-- KPI -->
    <div class="cp-kpi-row">
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">待审批</div>
        <div class="cp-kpi-value" style="color: var(--cp-warning)">{{ exitStore.pendingCount }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">已批准</div>
        <div class="cp-kpi-value" style="color: var(--cp-brand)">{{ exitStore.approvedCount }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">已告知</div>
        <div class="cp-kpi-value" style="color: var(--cp-warning)">{{ exitStore.notifiedCount }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">已结清</div>
        <div class="cp-kpi-value" style="color: var(--cp-success)">{{ exitStore.settledCount }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">涉贷总额</div>
        <div class="cp-kpi-value">¥{{ (exitStore.totalExitAmount / 10000).toFixed(1) }}w</div>
      </div>
    </div>

    <!-- 状态过滤 -->
    <div class="cp-card" style="padding: 12px 16px; margin-bottom: 12px">
      <a-radio-group v-model="statusFilter" type="button">
        <a-radio value="">全部 ({{ exitStore.cases.length }})</a-radio>
        <a-radio value="pending_review">待审批 ({{ exitStore.pendingCount }})</a-radio>
        <a-radio value="approved">已批准 ({{ exitStore.approvedCount }})</a-radio>
        <a-radio value="notified">已告知 ({{ exitStore.notifiedCount }})</a-radio>
        <a-radio value="closed">已结清/关闭 ({{ exitStore.settledCount }})</a-radio>
      </a-radio-group>
    </div>

    <!-- 主列表 -->
    <div class="cp-card" style="padding: 0">
      <a-table :data="filteredList" :pagination="{ pageSize: 10 }" row-key="id">
        <a-table-column title="清退单号" data-index="id" :width="180" />
        <a-table-column title="客户" data-index="customerName" :width="100" />
        <a-table-column title="剩余/总余额" :width="170">
          <template #cell="{ record }">
            <div>¥{{ record.loanBalance.toLocaleString() }}</div>
            <div style="font-size: 11px; color: var(--cp-text-tertiary)">{{ record.loanId }} · 余 {{ record.remainingDays }} 天</div>
          </template>
        </a-table-column>
        <a-table-column title="触发原因" :width="180">
          <template #cell="{ record }">
            <a-tag :color="reasonColor(record.reason)">{{ reasonLabel(record.reason) }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="层级" :width="130">
          <template #cell="{ record }">
            <a-tag :color="tierColor(record.tier)">{{ tierLabel(record.tier) }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="审批进度" :width="200">
          <template #cell="{ record }">
            <div style="display: flex; align-items: center; gap: 4px">
              <template v-for="(a, idx) in record.approvals" :key="idx">
                <a-tag
                  :color="a.approved ? 'green' : (a.pending ? 'orange' : 'red')"
                  size="small"
                  style="font-weight: 600"
                >
                  {{ a.approved ? '✓' : (a.pending ? '…' : '✗') }}
                  {{ roleShort(a.role) }}
                </a-tag>
                <span v-if="idx < record.approvals.length - 1" style="color: var(--cp-text-tertiary)">›</span>
              </template>
            </div>
          </template>
        </a-table-column>
        <a-table-column title="状态" :width="100">
          <template #cell="{ record }">
            <a-tag :color="statusColor(record.status)">{{ statusLabel(record.status) }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="触发时间" data-index="createdAt" :width="140" />
        <a-table-column title="操作" :width="240" fixed="right">
          <template #cell="{ record }">
            <a-space :size="4">
              <a-button size="small" type="text" @click="openDetail(record)">详情</a-button>
              <a-button v-if="canApproveFor(record, 'business')" size="small" type="text" status="success" @click="openApprove(record, 'business')">业务批</a-button>
              <a-button v-if="canApproveFor(record, 'review')" size="small" type="text" status="success" @click="openApprove(record, 'review')">审查批</a-button>
              <a-button v-if="canApproveFor(record, 'manage')" size="small" type="text" status="success" @click="openApprove(record, 'manage')">管理批</a-button>
              <a-button v-if="canNotify(record)" size="small" type="text" status="warning" @click="openNotify(record)">告知</a-button>
              <a-button v-if="canSettle(record)" size="small" type="text" status="success" @click="openSettle(record)">结清</a-button>
            </a-space>
          </template>
        </a-table-column>
      </a-table>
    </div>

    <!-- 详情抽屉 -->
    <a-drawer v-model:visible="detailVisible" :width="640" :title="`清退详情 ${currentCase?.id || ''}`">
      <div v-if="currentCase" style="padding: 0 8px">
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item label="客户">{{ currentCase.customerName }} ({{ currentCase.customerId }})</a-descriptions-item>
          <a-descriptions-item label="剩余余额">¥{{ currentCase.loanBalance.toLocaleString() }}</a-descriptions-item>
          <a-descriptions-item label="借据号">{{ currentCase.loanId }}</a-descriptions-item>
          <a-descriptions-item label="剩余天数">{{ currentCase.remainingDays }} 天</a-descriptions-item>
          <a-descriptions-item label="触发原因">
            <a-tag :color="reasonColor(currentCase.reason)">{{ reasonLabel(currentCase.reason) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="严重度">
            <a-tag :color="tierColor(currentCase.tier)">{{ tierLabel(currentCase.tier) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="触发描述" :span="2">{{ currentCase.description }}</a-descriptions-item>
        </a-descriptions>

        <h3 style="margin: 16px 0 8px">审批流程</h3>
        <a-timeline>
          <a-timeline-item v-for="(a, idx) in currentCase.approvals" :key="idx" :label="a.approvedAt || (a.pending ? '待审批' : '已拒绝')">
            <div>
              <b>{{ roleLabel(a.role) }}</b>
              <a-tag v-if="a.approved" color="green" style="margin-left: 6px">通过</a-tag>
              <a-tag v-else-if="a.approved === false" color="red" style="margin-left: 6px">驳回</a-tag>
              <a-tag v-else color="orange" style="margin-left: 6px">待签</a-tag>
            </div>
            <div style="font-size: 12px; color: var(--cp-text-tertiary); margin-top: 4px">
              {{ a.approver || '—' }} · {{ a.comment || '—' }}
            </div>
          </a-timeline-item>
        </a-timeline>

        <h3 style="margin: 16px 0 8px">客户告知记录</h3>
        <a-empty v-if="!currentCase.notifies.length" description="尚无告知记录" />
        <a-timeline v-else>
          <a-timeline-item v-for="(n, idx) in currentCase.notifies" :key="idx" :label="n.at">
            <div>
              <a-tag :color="n.result === '成功' ? 'green' : 'red'">{{ n.channel }} · {{ n.result }}</a-tag>
              <span v-if="n.note" style="margin-left: 6px; font-size: 12px; color: var(--cp-text-tertiary)">{{ n.note }}</span>
            </div>
          </a-timeline-item>
        </a-timeline>

        <h3 style="margin: 16px 0 8px">资产处置</h3>
        <div style="padding: 10px 12px; border: 1px solid var(--cp-border-light); border-radius: 4px">
          <div><b>方案:</b><a-tag color="arcoblue">{{ assetLabel(currentCase.assetAction) }}</a-tag></div>
          <div style="margin-top: 6px; font-size: 13px">{{ currentCase.assetProgress }}</div>
          <div v-if="currentCase.settledAmount !== undefined" style="margin-top: 6px; font-size: 13px; color: var(--cp-success); font-weight: 600">
            已结算:¥{{ currentCase.settledAmount.toLocaleString() }}
          </div>
        </div>
      </div>
    </a-drawer>

    <!-- 启动清退 -->
    <a-modal v-model:visible="showCreate" title="启动清退" :width="560" :ok-text="'启动'" @ok="onCreate">
      <a-form :model="createForm">
        <a-form-item label="客户" required>
          <a-select v-model="createForm.customerId" @change="onCreateCustomerChange">
            <a-option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }} ({{ c.id }}) - 余 ¥{{ ((c as any).loanBalance || 0).toLocaleString() }}</a-option>
          </a-select>
        </a-form-item>
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="借据号" required>
              <a-input v-model="createForm.loanId" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="剩余余额" required>
              <a-input-number v-model="createForm.loanBalance" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="触发原因" required>
          <a-radio-group v-model="createForm.reason">
            <a-radio value="high_risk">高风险</a-radio>
            <a-radio value="regulator_blacklist">监管/失信黑名单</a-radio>
            <a-radio value="overdue_extreme">极度逾期</a-radio>
            <a-radio value="refinance_failed">重组失败</a-radio>
            <a-radio value="payment_dispute">严重支付争议</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="触发描述">
          <a-textarea v-model="createForm.description" :rows="3" placeholder="如:客户已被法院列入失信 + 6 个月内 6 次投诉..." />
        </a-form-item>
        <a-form-item label="处置方案">
          <a-select v-model="createForm.assetAction">
            <a-option value="settle_all">要求结清全部</a-option>
            <a-option value="settle_remain">结清剩余本金</a-option>
            <a-option value="refinance">重组/再融资</a-option>
            <a-option value="litigation">诉讼程序</a-option>
            <a-option value="writeoff">核销</a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 审批弹窗 -->
    <a-modal v-model:visible="approveVisible" :title="`签批(${roleLabel(approveRole)})`" :width="480" :ok-text="'提交'" @ok="onSubmitApprove">
      <div v-if="approveTarget">
        <p>清退单:<b>{{ approveTarget.id }}</b></p>
        <p>客户:<b>{{ approveTarget.customerName }}</b></p>
        <p>层级:<a-tag :color="tierColor(approveTarget.tier)">{{ tierLabel(approveTarget.tier) }}</a-tag></p>
        <p>审批意见:</p>
        <a-radio-group v-model="approveResult">
          <a-radio :value="true">通过</a-radio>
          <a-radio :value="false">驳回</a-radio>
        </a-radio-group>
        <a-textarea v-model="approveComment" :rows="3" placeholder="请填写意见" />
      </div>
    </a-modal>

    <!-- 客户告知 -->
    <a-modal v-model:visible="notifyVisible" title="客户告知" :width="480" :ok-text="'提交'" @ok="onSubmitNotify">
      <div v-if="notifyTarget">
        <p>清退单:<b>{{ notifyTarget.id }}</b> · 客户 {{ notifyTarget.customerName }}</p>
        <p>渠道:<a-radio-group v-model="notifyChannel">
          <a-radio value="短信">短信</a-radio>
          <a-radio value="邮件">邮件</a-radio>
          <a-radio value="电话">电话</a-radio>
        </a-radio-group></p>
        <p>结果:<a-radio-group v-model="notifyResult">
          <a-radio value="成功">成功</a-radio>
          <a-radio value="失败">失败</a-radio>
        </a-radio-group></p>
        <a-textarea v-model="notifyNote" :rows="2" placeholder="备注(可选)" />
      </div>
    </a-modal>

    <!-- 结清 -->
    <a-modal v-model:visible="settleVisible" title="结算 / 结清" :width="480" :ok-text="'提交'" @ok="onSubmitSettle">
      <div v-if="settleTarget">
        <p>清退单:<b>{{ settleTarget.id }}</b> · 客户 {{ settleTarget.customerName }}</p>
        <p>最终结算金额:¥<a-input-number v-model="settleAmount" :min="0" /></p>
        <a-textarea v-model="settleNote" :rows="3" placeholder="结清说明(将作为资产进度记录)" />
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useExitStore, ExitCase, ExitReason, ExitStatus, ExitTier, AssetAction } from '@/stores/exit'
import { useUserStore, getRoleInfo } from '@/stores/user'
import { customers as customersMock } from '@/mock/data'

const exitStore = useExitStore()
const userStore = useUserStore()
const customers = customersMock

const statusFilter = ref<string>('')
const filteredList = computed(() => {
  if (!statusFilter.value) return exitStore.cases
  return exitStore.cases.filter(c => c.status === statusFilter.value)
})

// 权限判断
const currentRole = computed(() => userStore.currentRole)
function canApproveFor(c: ExitCase, role: 'business' | 'review' | 'manage') {
  if (c.status !== 'pending_review') return false
  if (!c.approvals.some(a => a.role === role && a.pending)) return false
  if (role === 'business') return currentRole.value === 'business' || currentRole.value === 'manage'
  if (role === 'review') return currentRole.value === 'review' || currentRole.value === 'manage'
  if (role === 'manage') return currentRole.value === 'manage'
  return false
}
function canNotify(c: ExitCase) {
  return c.status === 'approved' || c.status === 'notified'
}
function canSettle(c: ExitCase) {
  return c.status === 'notified'
}

const detailVisible = ref(false)
const currentCase = ref<ExitCase | null>(null)
function openDetail(c: ExitCase) {
  currentCase.value = c
  detailVisible.value = true
}

// 创建
const showCreate = ref(false)
const createForm = reactive({
  customerId: '',
  loanId: '',
  loanBalance: 0,
  reason: 'high_risk' as ExitReason,
  description: '',
  assetAction: 'settle_all' as AssetAction,
  remainingDays: 30
})

function onCreateCustomerChange() {
  const c = customers.find(c => c.id === createForm.customerId)
  if (c) {
    createForm.loanBalance = (c as any).loanBalance || 0
    createForm.loanId = `L-2024-${String(Math.floor(Math.random() * 9000) + 1000)}`
  }
}

function onCreate() {
  if (!createForm.customerId || !createForm.loanId || !createForm.loanBalance) {
    Message.warning('请填写完整')
    return
  }
  const customer = customers.find(c => c.id === createForm.customerId)
  exitStore.create({
    customerId: createForm.customerId,
    customerName: customer?.name || '-',
    loanId: createForm.loanId,
    loanBalance: createForm.loanBalance,
    remainingDays: createForm.remainingDays,
    reason: createForm.reason,
    description: createForm.description,
    assetAction: createForm.assetAction,
    assetProgress: '审批中,处置方案待审批通过后启动'
  })
  Message.success('清退已启动')
  showCreate.value = false
  Object.assign(createForm, {
    customerId: '', loanId: '', loanBalance: 0,
    reason: 'high_risk', description: '', assetAction: 'settle_all', remainingDays: 30
  })
}

function showHighRiskList() {
  Message.info('已根据客户风险标签自动选客户(red_threat/blacklist)')
}

// 审批
const approveVisible = ref(false)
const approveTarget = ref<ExitCase | null>(null)
const approveRole = ref<'business' | 'review' | 'manage'>('business')
const approveResult = ref(true)
const approveComment = ref('')

function openApprove(c: ExitCase, role: 'business' | 'review' | 'manage') {
  approveTarget.value = c
  approveRole.value = role
  approveResult.value = true
  approveComment.value = ''
  approveVisible.value = true
}

function onSubmitApprove() {
  if (!approveTarget.value) return
  const approver = userStore.currentRole ? (getRoleInfo(userStore.currentRole)?.username || '审批人') : '审批人'
  exitStore.approve(approveTarget.value.id, approveRole.value, approver, approveComment.value, approveResult.value)
  Message.success(approveResult.value ? '已通过' : '已驳回')
  approveVisible.value = false
}

// 客户告知
const notifyVisible = ref(false)
const notifyTarget = ref<ExitCase | null>(null)
const notifyChannel = ref<'短信' | '邮件' | '电话'>('短信')
const notifyResult = ref<'成功' | '失败'>('成功')
const notifyNote = ref('')

function openNotify(c: ExitCase) {
  notifyTarget.value = c
  notifyChannel.value = '短信'
  notifyResult.value = '成功'
  notifyNote.value = '清退通知 + 7 天宽限期说明'
  notifyVisible.value = true
}

function onSubmitNotify() {
  if (!notifyTarget.value) return
  exitStore.notify(notifyTarget.value.id, notifyChannel.value, notifyResult.value, notifyNote.value)
  Message.success('已记录告知结果')
  notifyVisible.value = false
}

// 结清
const settleVisible = ref(false)
const settleTarget = ref<ExitCase | null>(null)
const settleAmount = ref(0)
const settleNote = ref('')

function openSettle(c: ExitCase) {
  settleTarget.value = c
  settleAmount.value = c.loanBalance
  settleNote.value = ''
  settleVisible.value = true
}

function onSubmitSettle() {
  if (!settleTarget.value) return
  // 更新资产进度
  exitStore.updateAsset(settleTarget.value.id, settleTarget.value.assetAction, `结清完成:${settleNote.value || '客户一次性结清'}`, settleAmount.value)
  exitStore.close(settleTarget.value.id, settleAmount.value)
  Message.success('已结清')
  settleVisible.value = false
}

// 工具
function reasonColor(r: ExitReason) {
  return ({ high_risk: 'orange', regulator_blacklist: 'red', overdue_extreme: 'red', refinance_failed: 'gray', payment_dispute: 'magenta' })[r] || 'gray'
}
function reasonLabel(r: ExitReason) {
  return ({ high_risk: '高风险', regulator_blacklist: '监管/失信', overdue_extreme: '极度逾期', refinance_failed: '重组失败', payment_dispute: '支付争议' })[r] || r
}
function tierColor(t: ExitTier) {
  return ({ normal: 'gray', extra_review: 'orange', management_extra: 'red' })[t] || 'gray'
}
function tierLabel(t: ExitTier) {
  return ({ normal: '一审', extra_review: '二审', management_extra: '三审(管理层)' })[t] || t
}
function statusColor(s: ExitStatus) {
  return ({ pending_review: 'orange', approved: 'arcoblue', rejected: 'red', notified: 'warning', settled: 'cyan', closed: 'gray' })[s] || 'gray'
}
function statusLabel(s: ExitStatus) {
  return ({ pending_review: '待审批', approved: '已批准', rejected: '已驳回', notified: '已告知', settled: '已处置', closed: '已关闭' })[s] || s
}
function roleLabel(r: string) {
  return ({ business: '业务执行', review: '消保审查', manage: '管理层' })[r] || r
}
function roleShort(r: string) {
  return ({ business: '业', review: '审', manage: '管' })[r] || r
}
function assetLabel(a: AssetAction) {
  return ({ settle_all: '要求结清全部', settle_remain: '结清剩余本金', refinance: '重组/再融资', litigation: '诉讼程序', writeoff: '核销' })[a] || a
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