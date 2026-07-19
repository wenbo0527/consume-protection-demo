<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">质检管理</h1>
        <div class="cp-page-subtitle">抽检任务 · 评分表 · 复检确认 · 整改闭环</div>
      </div>
      <a-space>
        <a-button @click="autoPick">自动抽检 5%</a-button>
        <a-button type="primary" @click="showCreate = true">手工建检</a-button>
      </a-space>
    </div>

    <!-- KPI 看板 -->
    <div class="cp-kpi-row">
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">待评分</div>
        <div class="cp-kpi-value" style="color: var(--cp-warning)">{{ qa.pendingCount }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">评分中</div>
        <div class="cp-kpi-value" style="color: var(--cp-brand)">{{ qa.scoringCount }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">需整改</div>
        <div class="cp-kpi-value" style="color: var(--cp-danger)">{{ qa.rectifyCount }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">均分</div>
        <div class="cp-kpi-value" :style="{ color: qa.avgScore >= 80 ? 'var(--cp-success)' : 'var(--cp-warning)' }">{{ qa.avgScore }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">高严重</div>
        <div class="cp-kpi-value" style="color: var(--cp-danger)">{{ qa.severeCount }}</div>
      </div>
    </div>

    <!-- 状态过滤 -->
    <div class="cp-card" style="padding: 12px 16px; margin-bottom: 12px">
      <a-radio-group v-model="statusFilter" type="button">
        <a-radio value="">全部 ({{ qa.cases.length }})</a-radio>
        <a-radio value="pending">待评分 ({{ qa.pendingCount }})</a-radio>
        <a-radio value="scoring">评分中 ({{ qa.scoringCount }})</a-radio>
        <a-radio value="rectify">整改中 ({{ qa.rectifyCount }})</a-radio>
        <a-radio value="closed">已闭环 ({{ closedCount }})</a-radio>
      </a-radio-group>
    </div>

    <!-- 质检列表 -->
    <div class="cp-card" style="padding: 0">
      <a-table :data="filteredList" :pagination="{ pageSize: 10 }" :columns="columns" row-key="id">
        <template #id="{ record }">
          <a-link @click="openDetail(record)">{{ record.id }}</a-link>
        </template>
        <template #severity="{ record }">
          <a-tag v-if="record.severity" :color="severityColor(record.severity)">{{ severityLabel(record.severity) }}</a-tag>
          <span v-else style="color: var(--cp-text-tertiary)">-</span>
        </template>
        <template #totalScore="{ record }">
          <span v-if="record.totalScore !== undefined" :style="{ color: record.totalScore >= 80 ? 'var(--cp-success)' : 'var(--cp-warning)', fontWeight: 600 }">
            {{ record.totalScore }}
          </span>
          <span v-else style="color: var(--cp-text-tertiary)">未评分</span>
        </template>
        <template #status="{ record }">
          <a-tag :color="statusColor(record.status)">{{ statusLabel(record.status) }}</a-tag>
        </template>
        <template #actions="{ record }">
          <a-space :size="4">
            <a-button size="small" type="text" @click="openDetail(record)">详情</a-button>
            <a-button v-if="record.status === 'pending' || record.status === 'scoring'" size="small" type="text" status="success" @click="openScore(record)">评分</a-button>
            <a-button v-if="record.status === 'rectify'" size="small" type="text" status="warning" @click="pushToRectify(record)">推整改</a-button>
            <a-button v-if="record.status === 'rectify' && record.recheckLog && record.recheckLog.length" size="small" type="text" @click="openRecheck(record)">复检</a-button>
          </a-space>
        </template>
      </a-table>
    </div>

    <!-- 详情抽屉 -->
    <a-drawer v-model:visible="detailVisible" :width="640" :title="`质检详情 ${currentCase?.id || ''}`">
      <div v-if="currentCase" style="padding: 0 8px">
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item label="客户">{{ currentCase.customerName }} ({{ currentCase.customerId }})</a-descriptions-item>
          <a-descriptions-item label="坐席">{{ currentCase.agentName }}</a-descriptions-item>
          <a-descriptions-item label="关联工单">{{ currentCase.ticketId }}</a-descriptions-item>
          <a-descriptions-item label="触发原因">{{ currentCase.reason }}</a-descriptions-item>
          <a-descriptions-item label="质检员">{{ currentCase.inspector || '-' }}</a-descriptions-item>
          <a-descriptions-item label="严重程度">
            <a-tag v-if="currentCase.severity" :color="severityColor(currentCase.severity)">{{ severityLabel(currentCase.severity) }}</a-tag>
            <span v-else>-</span>
          </a-descriptions-item>
          <a-descriptions-item label="总分" :span="2">
            <span v-if="currentCase.totalScore !== undefined" :style="{ fontSize: '20px', fontWeight: 700, color: currentCase.totalScore >= 80 ? 'var(--cp-success)' : 'var(--cp-warning)' }">
              {{ currentCase.totalScore }} / 100
            </span>
            <span v-else>未评分</span>
          </a-descriptions-item>
        </a-descriptions>

        <h3 style="margin: 16px 0 8px">评分明细</h3>
        <a-table v-if="currentCase.scores.length" :data="currentCase.scores" :pagination="false" :columns="scoreColumns" />
        <a-empty v-else description="尚未评分" />

        <h3 style="margin: 16px 0 8px">问题点</h3>
        <div v-if="currentCase.issues?.length">
          <a-tag v-for="(it, i) in currentCase.issues" :key="i" color="orange" style="margin-bottom: 6px">{{ it }}</a-tag>
        </div>
        <a-empty v-else description="无问题点" />

        <h3 v-if="currentCase.recheckLog?.length" style="margin: 16px 0 8px">复检记录</h3>
        <a-timeline v-if="currentCase.recheckLog?.length">
          <a-timeline-item v-for="(r, i) in currentCase.recheckLog" :key="i">
            <div>
              <b>{{ r.operator }}</b> · {{ r.at }} · 复检分 {{ r.score }}
              <a-tag :color="r.passed ? 'green' : 'red'" style="margin-left: 6px">{{ r.passed ? '通过' : '未通过' }}</a-tag>
            </div>
            <div v-if="r.note" style="font-size: 12px; color: var(--cp-text-tertiary); margin-top: 2px">{{ r.note }}</div>
          </a-timeline-item>
        </a-timeline>

        <div v-if="currentCase.rectifyTaskId" style="margin-top: 16px; padding: 8px 12px; background: var(--cp-warning-soft); border-radius: 4px; font-size: 13px">
          已推送整改任务:<b>{{ currentCase.rectifyTaskId }}</b>
        </div>
      </div>
    </a-drawer>

    <!-- 评分弹窗 -->
    <a-modal v-model:visible="scoreVisible" title="质检评分" :width="640" :ok-text="'提交评分'" @ok="onSubmitScore">
      <div v-if="scoreTarget">
        <a-alert style="margin-bottom: 12px">
          <template #content>
            <div>客户:<b>{{ scoreTarget.customerName }}</b>({{ scoreTarget.customerId }}) · 工单 {{ scoreTarget.ticketId }} · 坐席 {{ scoreTarget.agentName }}</div>
            <div style="margin-top: 4px">触发原因:{{ scoreTarget.reason }}</div>
          </template>
        </a-alert>

        <h4 style="margin: 8px 0">评分项</h4>
        <div v-for="(s, idx) in scoreForm.scores" :key="idx" style="margin-bottom: 12px; padding: 8px 12px; border: 1px solid var(--cp-border-light); border-radius: 4px">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px">
            <span><b>{{ s.dimension }}</b>(满分 {{ s.maxScore }})</span>
            <a-input-number v-model="s.score" :min="0" :max="s.maxScore" size="small" style="width: 80px" />
          </div>
          <a-input v-model="s.comment" placeholder="评分说明(可选)" size="small" />
        </div>

        <a-divider />

        <h4 style="margin: 8px 0">问题点(逗号分隔)</h4>
        <a-input v-model="scoreForm.issuesText" placeholder="例:催收频次过高,未告知分期方案" />
        <h4 style="margin: 12px 0 4px">严重程度</h4>
        <a-radio-group v-model="scoreForm.severity">
          <a-radio value="low">轻微</a-radio>
          <a-radio value="mid">中等</a-radio>
          <a-radio value="high">较重</a-radio>
          <a-radio value="severe">严重</a-radio>
        </a-radio-group>
      </div>
    </a-modal>

    <!-- 复检弹窗 -->
    <a-modal v-model:visible="recheckVisible" title="复检" :width="480" :ok-text="'提交复检'" @ok="onSubmitRecheck">
      <div v-if="recheckTarget">
        <p>质检:<b>{{ recheckTarget.id }}</b>(原分 {{ recheckTarget.totalScore }})</p>
        <p>复检分:<a-input-number v-model="recheckForm.score" :min="0" :max="100" /></p>
        <p>结果:
          <a-radio-group v-model="recheckForm.passed">
            <a-radio :value="true">通过</a-radio>
            <a-radio :value="false">未通过</a-radio>
          </a-radio-group>
        </p>
        <a-textarea v-model="recheckForm.note" placeholder="复检说明" :rows="3" />
      </div>
    </a-modal>

    <!-- 手工建检 -->
    <a-modal v-model:visible="showCreate" title="新建质检任务" :width="560" :ok-text="'创建'" @ok="onCreate">
      <a-form :model="createForm">
        <a-form-item label="关联工单 ID" required>
          <a-input v-model="createForm.ticketId" placeholder="例:GD-20260715-0009" />
        </a-form-item>
        <a-form-item label="客户" required>
          <a-input v-model="createForm.customerName" placeholder="客户姓名" />
        </a-form-item>
        <a-form-item label="坐席" required>
          <a-input v-model="createForm.agentName" placeholder="坐席姓名" />
        </a-form-item>
        <a-form-item label="触发原因" required>
          <a-select v-model="createForm.reason">
            <a-option>高风险抽检</a-option>
            <a-option>客户投诉触发复检</a-option>
            <a-option>定期人工复检</a-option>
            <a-option>管理层指派</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="通话/录音引用">
          <a-input v-model="createForm.recordRef" placeholder="可选" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useQualityStore, QaCase, QaSeverity, QaScoreItem } from '@/stores/quality'
import { useRectifyStore } from '@/stores/rectify'
import { useOpsStore } from '@/stores/ops'
import { tickets } from '@/mock/data'

const qa = useQualityStore()
const rectify = useRectifyStore()
const ops = useOpsStore()

const statusFilter = ref<string>('')
const closedCount = computed(() => qa.cases.filter(c => c.status === 'closed' || c.status === 'rechecked').length)

const filteredList = computed(() => {
  if (!statusFilter.value) return qa.cases
  return qa.cases.filter(c => c.status === statusFilter.value)
})

// 表格列
const columns: any[] = [
  { title: '质检单号', dataIndex: 'id', slotName: 'id', width: 180 },
  { title: '客户', dataIndex: 'customerName', width: 100 },
  { title: '坐席', dataIndex: 'agentName', width: 90 },
  { title: '触发原因', dataIndex: 'reason', width: 180 },
  { title: '严重', dataIndex: 'severity', slotName: 'severity', width: 80 },
  { title: '总分', dataIndex: 'totalScore', slotName: 'totalScore', width: 80 },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 100 },
  { title: '更新时间', dataIndex: 'updatedAt', width: 140 },
  { title: '操作', slotName: 'actions', width: 220, fixed: 'right' }
]

const scoreColumns: any[] = [
  { title: '维度', dataIndex: 'dimension', width: 110 },
  { title: '满分', dataIndex: 'maxScore', width: 60 },
  { title: '得分', dataIndex: 'score', width: 60 },
  { title: '说明', dataIndex: 'comment' }
]

// 详情抽屉
const detailVisible = ref(false)
const currentCase = ref<QaCase | null>(null)
function openDetail(c: QaCase) {
  currentCase.value = c
  detailVisible.value = true
}

// 评分弹窗
const scoreVisible = ref(false)
const scoreTarget = ref<QaCase | null>(null)
const scoreForm = reactive({
  scores: [] as QaScoreItem[],
  issuesText: '',
  severity: 'mid' as QaSeverity
})

const SCORE_DIMENSIONS: QaScoreItem[] = [
  { dimension: '话术规范', maxScore: 25, score: 20 },
  { dimension: '流程合规', maxScore: 30, score: 25 },
  { dimension: '情绪管理', maxScore: 20, score: 18 },
  { dimension: '合规性', maxScore: 25, score: 20 }
]

function openScore(c: QaCase) {
  scoreTarget.value = c
  scoreForm.scores = SCORE_DIMENSIONS.map(d => ({ ...d }))
  scoreForm.issuesText = ''
  scoreForm.severity = 'mid'
  scoreVisible.value = true
}

function onSubmitScore() {
  if (!scoreTarget.value) return
  const issues = scoreForm.issuesText.split(/[,，]/).map(s => s.trim()).filter(Boolean)
  qa.score(scoreTarget.value.id, '刘丽', scoreForm.scores, issues, scoreForm.severity)
  const total = scoreForm.scores.reduce((a, s) => a + s.score, 0)
  // 联动 ops:把当前质检刷新到坐席绩效
  ops.refreshAllFromQuality(qa.cases.map(c => ({
    agentName: c.agentName,
    totalScore: c.totalScore,
    status: c.status
  })))
  Message.success(`评分完成,总分 ${total}${total < 80 ? ',自动转整改' : ''}`)
  scoreVisible.value = false
}

// 推整改
function pushToRectify(c: QaCase) {
  const issues = c.issues || []
  const scene = issues[0] || '质检整改'
  // 整改 store 需要 reportId,先建一个"质检触发"的溯源报告,再下发任务
  const report = rectify.createReport({
    scene,
    rootCause: `质检单 ${c.id} 触发(总分 ${c.totalScore},严重程度:${c.severity || '-'})`,
    description: issues.join(';') || `质检单 ${c.id} 触发整改`,
    data: {
      complaintCount: 1,
      customerAffected: 1,
      period: '本期'
    },
    conclusion: `按质检反馈整改,达标线:总分 ≥ 90`,
    author: '质检员·刘丽'
  })
  const t = rectify.createTask({
    reportId: report.id,
    scene,
    dept: c.agentName + ' 所在组',
    owner: c.agentName,
    requirement: `按质检单 ${c.id} 反馈整改;达标要求:总分 ≥ 90`,
    deadline: nextWeekStr()
  })
  if (!t) {
    Message.error('整改任务创建失败')
    return
  }
  qa.attachRectify(c.id, t.id)
  Message.success(`已推送整改任务 ${t.id}`)
}

function nextWeekStr() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 18:00`
}

// 复检
const recheckVisible = ref(false)
const recheckTarget = ref<QaCase | null>(null)
const recheckForm = reactive({ score: 85, passed: true as boolean, note: '' })

function openRecheck(c: QaCase) {
  recheckTarget.value = c
  recheckForm.score = c.totalScore || 85
  recheckForm.passed = true
  recheckForm.note = ''
  recheckVisible.value = true
}

function onSubmitRecheck() {
  if (!recheckTarget.value) return
  qa.recheck(recheckTarget.value.id, '刘丽', recheckForm.score, recheckForm.passed, recheckForm.note)
  Message.success(recheckForm.passed ? '复检通过,已闭环' : '复检未通过,保持整改')
  recheckVisible.value = false
}

// 自动抽检 5%
function autoPick() {
  // 找到最近 7 天未质检的工单
  const qaTicketIds = new Set(qa.cases.map(c => c.ticketId))
  const candidates = tickets.filter(t => !qaTicketIds.has(t.id))
  const pickCount = Math.max(1, Math.floor(candidates.length * 0.05))
  const picked = candidates.slice(0, pickCount)
  picked.forEach(t => {
    qa.create({
      ticketId: t.id,
      customerId: (t as any).customerId || 'C003',
      customerName: (t as any).customerName || '客户',
      agentName: t.handler || '坐席',
      reason: '自动抽检 5%',
      ticketCreatedAt: t.createdAt || '2026-07-15'
    })
  })
  Message.success(`已抽检 ${picked.length} 个工单`)
}

// 手工建检
const showCreate = ref(false)
const createForm = reactive({
  ticketId: '',
  customerName: '',
  agentName: '',
  reason: '定期人工复检',
  recordRef: ''
})

function onCreate() {
  if (!createForm.ticketId || !createForm.customerName || !createForm.agentName) {
    Message.warning('工单/客户/坐席 必填')
    return
  }
  qa.create({
    ticketId: createForm.ticketId,
    customerId: '',
    customerName: createForm.customerName,
    agentName: createForm.agentName,
    reason: createForm.reason,
    recordRef: createForm.recordRef,
    ticketCreatedAt: '2026-07-15'
  })
  Message.success('质检任务已创建')
  showCreate.value = false
  Object.assign(createForm, { ticketId: '', customerName: '', agentName: '', reason: '定期人工复检', recordRef: '' })
}

// 工具函数
function severityLabel(s: QaSeverity) {
  return { low: '轻微', mid: '中等', high: '较重', severe: '严重' }[s] || s
}
function severityColor(s: QaSeverity) {
  return { low: 'gray', mid: 'blue', high: 'orange', severe: 'red' }[s] || 'gray'
}
function statusLabel(s: QaCase['status']) {
  return {
    pending: '待评分',
    scoring: '评分中',
    scored: '已评分',
    rectify: '整改中',
    rechecked: '已复检',
    closed: '已闭环'
  }[s] || s
}
function statusColor(s: QaCase['status']) {
  return {
    pending: 'gray',
    scoring: 'blue',
    scored: 'green',
    rectify: 'orange',
    rechecked: 'cyan',
    closed: 'gray'
  }[s] || 'gray'
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