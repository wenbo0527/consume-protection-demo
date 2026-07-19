<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">运营管理</h1>
        <div class="cp-page-subtitle">排班 · 请假 · 作业量 · 绩效 · 质检联动</div>
      </div>
      <a-space>
        <a-button @click="refreshFromQuality">从质检刷新绩效</a-button>
        <a-button type="primary" @click="showLeaveApply = true">请假申请</a-button>
      </a-space>
    </div>

    <!-- KPI -->
    <div class="cp-kpi-row">
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">在线坐席</div>
        <div class="cp-kpi-value" style="color: var(--cp-success)">{{ ops.onlineAgents.length }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">在岗总人数</div>
        <div class="cp-kpi-value">{{ ops.staffAgents.length }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">月作业总量</div>
        <div class="cp-kpi-value" style="color: var(--cp-brand)">{{ monthlyTotal }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">均分</div>
        <div class="cp-kpi-value" :style="{ color: opsAvgScore >= 80 ? 'var(--cp-success)' : 'var(--cp-warning)' }">
          {{ opsAvgScore || '-' }}
        </div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">待审批请假</div>
        <div class="cp-kpi-value" style="color: var(--cp-warning)">{{ ops.pendingLeaveCount }}</div>
      </div>
    </div>

    <!-- 主:4 Tab -->
    <a-tabs default-active-key="ranking" type="rounded">
      <!-- 1. 绩效排行 -->
      <a-tab-pane key="ranking" title="绩效排行">
        <div class="cp-card" style="padding: 20px">
          <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 12px">当月作业量 · 质检均分综合排行</h3>
          <a-table :data="rankingList" :pagination="false" row-key="id">
            <a-table-column title="排名" :width="70">
              <template #cell="{ rowIndex }">
                <div :style="{ display: 'flex', alignItems: 'center', gap: 6 }">
                  <a-tag v-if="rowIndex === 0" color="red">🥇 第 1</a-tag>
                  <a-tag v-else-if="rowIndex === 1" color="orange">🥈 第 2</a-tag>
                  <a-tag v-else-if="rowIndex === 2" color="gold">🥉 第 3</a-tag>
                  <span v-else>{{ rowIndex + 1 }}</span>
                </div>
              </template>
            </a-table-column>
            <a-table-column title="姓名" data-index="name" :width="100" />
            <a-table-column title="工号" data-index="workNo" :width="100" />
            <a-table-column title="角色" :width="120">
              <template #cell="{ record }">
                <a-tag :color="roleColor(record.role)">{{ roleLabel(record.role) }}</a-tag>
              </template>
            </a-table-column>
            <a-table-column title="技能" data-index="skills" :width="180">
              <template #cell="{ record }">
                <a-tag v-for="s in record.skills" :key="s" color="arcoblue" size="small" style="margin-right: 4px">{{
                  s
                }}</a-tag>
              </template>
            </a-table-column>
            <a-table-column title="作业量" :width="100">
              <template #cell="{ record }">
                <span
                  :style="{
                    color: record.monthlyTicketCount >= 80 ? 'var(--cp-success)' : 'var(--cp-text)',
                    fontWeight: 600
                  }"
                >
                  {{ record.monthlyTicketCount }}
                </span>
                <span style="font-size: 12px; color: var(--cp-text-tertiary); margin-left: 4px">件/月</span>
              </template>
            </a-table-column>
            <a-table-column title="质检均分" :width="110">
              <template #cell="{ record }">
                <span
                  v-if="record.monthlyAvgScore > 0"
                  :style="{
                    color: record.monthlyAvgScore >= 80 ? 'var(--cp-success)' : 'var(--cp-warning)',
                    fontWeight: 600
                  }"
                >
                  {{ record.monthlyAvgScore }}
                </span>
                <span v-else style="color: var(--cp-text-tertiary)">未评分</span>
              </template>
            </a-table-column>
            <a-table-column title="需整改" :width="90">
              <template #cell="{ record }">
                <a-tag v-if="record.monthlyRectifyCount > 0" color="red">{{ record.monthlyRectifyCount }}</a-tag>
                <span v-else style="color: var(--cp-text-tertiary)">-</span>
              </template>
            </a-table-column>
            <a-table-column title="当前状态" :width="110">
              <template #cell="{ record }">
                <a-tag :color="statusColor(record.status)">{{ statusLabel(record.status) }}</a-tag>
              </template>
            </a-table-column>
          </a-table>
        </div>
      </a-tab-pane>

      <!-- 2. 14天排班 -->
      <a-tab-pane key="schedule" title="14 天排班">
        <div class="cp-card" style="padding: 12px">
          <div style="margin-bottom: 8px; font-size: 12px; color: var(--cp-text-tertiary)">
            点击班次格子可调整;同列内"换班"按钮可批量互换
          </div>
          <div class="cp-shift-table">
            <div class="cp-shift-row cp-shift-row-header">
              <div class="cp-shift-cell cp-shift-cell-header" style="width: 130px">姓名 \\ 日期</div>
              <div
                v-for="d in dates"
                :key="d"
                class="cp-shift-cell cp-shift-cell-header"
                :class="{ 'cp-shift-cell-today': d === todayStr }"
              >
                <div>{{ d.slice(5) }}</div>
                <div style="font-size: 11px; color: var(--cp-text-tertiary)">{{ dayOfWeekLabel(d) }}</div>
              </div>
            </div>
            <div v-for="agent in ops.agents" :key="agent.id" class="cp-shift-row">
              <div class="cp-shift-cell cp-shift-cell-name">
                <div style="font-weight: 600">{{ agent.name }}</div>
                <div style="font-size: 11px; color: var(--cp-text-tertiary)">{{ roleLabel(agent.role) }}</div>
              </div>
              <div
                v-for="d in dates"
                :key="d"
                class="cp-shift-cell"
                :class="[`cp-shift-${shiftAt(agent.id, d)}`, { 'cp-shift-cell-today': d === todayStr }]"
                @click="openShiftEditor(agent, d)"
              >
                {{ shiftLabel(shiftAt(agent.id, d)) }}
                <div
                  v-if="shiftNote(agent.id, d)"
                  style="font-size: 10px; color: var(--cp-text-tertiary); margin-top: 2px"
                >
                  {{ shiftNote(agent.id, d) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </a-tab-pane>

      <!-- 3. 请假审批 -->
      <a-tab-pane key="leave" title="请假审批">
        <div class="cp-card" style="padding: 20px">
          <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 12px">请假申请列表</h3>
          <a-table :data="ops.leaves" :pagination="{ pageSize: 10 }" row-key="id">
            <a-table-column title="申请人" :width="100">
              <template #cell="{ record }">{{ agentName(record.agentId) }}</template>
            </a-table-column>
            <a-table-column title="类型" data-index="type" :width="100">
              <template #cell="{ record }">
                <a-tag :color="leaveTypeColor(record.type)">{{ record.type }}</a-tag>
              </template>
            </a-table-column>
            <a-table-column title="区间" :width="240">
              <template #cell="{ record }">
                <span v-if="record.startDate === record.endDate">{{ record.startDate }}</span>
                <span v-else>{{ record.startDate }} ~ {{ record.endDate }}</span>
                <span style="font-size: 12px; color: var(--cp-text-tertiary); margin-left: 6px"
                  >({{ daysBetween(record) }} 天)</span
                >
              </template>
            </a-table-column>
            <a-table-column title="事由" data-index="reason" />
            <a-table-column title="申请时间" data-index="applicantAt" :width="160" />
            <a-table-column title="状态" :width="100">
              <template #cell="{ record }">
                <a-tag :color="leaveStatusColor(record.status)">{{ leaveStatusLabel(record.status) }}</a-tag>
              </template>
            </a-table-column>
            <a-table-column title="操作" :width="200" v-if="canApprove">
              <template #cell="{ record }">
                <a-space>
                  <a-button
                    v-if="record.status === 'pending'"
                    size="small"
                    status="success"
                    @click="approveLeave(record, true)"
                    >批准</a-button
                  >
                  <a-button
                    v-if="record.status === 'pending'"
                    size="small"
                    status="danger"
                    @click="approveLeave(record, false)"
                    >驳回</a-button
                  >
                  <a-tag v-else color="gray">已处理</a-tag>
                </a-space>
              </template>
            </a-table-column>
          </a-table>
        </div>
      </a-tab-pane>

      <!-- 4. 作业量统计 -->
      <a-tab-pane key="volume" title="作业量统计">
        <div class="cp-card" style="padding: 20px">
          <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 12px">当月坐席作业量</h3>
          <a-table :data="volumeList" :pagination="false" row-key="id">
            <a-table-column title="坐席" data-index="name" :width="100" />
            <a-table-column title="工号" data-index="workNo" :width="100" />
            <a-table-column title="角色" :width="100">
              <template #cell="{ record }">
                <a-tag :color="roleColor(record.role)">{{ roleLabel(record.role) }}</a-tag>
              </template>
            </a-table-column>
            <a-table-column title="处理工单" :width="180">
              <template #cell="{ record }">
                <span
                  :style="{
                    fontWeight: 600,
                    color: record.monthlyTicketCount >= 80 ? 'var(--cp-success)' : 'var(--cp-text)'
                  }"
                >
                  {{ record.monthlyTicketCount }}
                </span>
                <span style="margin-left: 8px; color: var(--cp-text-tertiary); font-size: 12px">件</span>
              </template>
            </a-table-column>
            <a-table-column title="占比图示">
              <template #cell="{ record }">
                <div style="display: flex; align-items: center; gap: 8px">
                  <div
                    style="
                      width: 200px;
                      height: 8px;
                      background: var(--cp-bg-soft);
                      border-radius: 4px;
                      overflow: hidden;
                    "
                  >
                    <div
                      :style="{
                        width: Math.min((record.monthlyTicketCount / topCount) * 100, 100) + '%',
                        height: '100%',
                        background: 'var(--cp-brand)'
                      }"
                    />
                  </div>
                  <span style="font-size: 12px; color: var(--cp-text-tertiary)"
                    >{{ Math.round((record.monthlyTicketCount / topCount) * 100) }}% of {{ topName }}</span
                  >
                </div>
              </template>
            </a-table-column>
          </a-table>
        </div>
      </a-tab-pane>
    </a-tabs>

    <!-- 班次编辑弹窗 -->
    <a-modal v-model:visible="shiftEditVisible" title="调整班次" :width="420" :ok-text="'保存'" @ok="saveShift">
      <div v-if="shiftEditTarget">
        <p>
          <b>{{ shiftEditTarget.agent.name }}</b> · {{ shiftEditTarget.date }} ({{
            dayOfWeekLabel(shiftEditTarget.date)
          }})
        </p>
        <p>
          当前班次:<a-tag :color="shiftColor(currentShift)">{{ shiftLabel(currentShift) }}</a-tag>
        </p>
        <p>
          调整为:
          <a-select v-model="newShift">
            <a-option value="早">早班</a-option>
            <a-option value="中">中班</a-option>
            <a-option value="晚">晚班</a-option>
            <a-option value="休">休息</a-option>
            <a-option value="假">请假</a-option>
          </a-select>
        </p>
        <p>备注:<a-input v-model="newShiftNote" placeholder="可选" /></p>
      </div>
    </a-modal>

    <!-- 请假申请 -->
    <a-modal v-model:visible="showLeaveApply" title="请假申请" :width="480" :ok-text="'提交'" @ok="onLeaveApply">
      <a-form :model="leaveForm">
        <a-form-item label="申请人" required>
          <a-select v-model="leaveForm.agentId">
            <a-option v-for="a in ops.staffAgents" :key="a.id" :value="a.id">{{ a.name }} ({{ a.workNo }})</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="类型" required>
          <a-radio-group v-model="leaveForm.type">
            <a-radio value="事假">事假</a-radio>
            <a-radio value="病假">病假</a-radio>
            <a-radio value="年假">年假</a-radio>
            <a-radio value="调休">调休</a-radio>
            <a-radio value="婚假">婚假</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="起始日期" required>
              <a-input v-model="leaveForm.startDate" placeholder="YYYY-MM-DD" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="结束日期" required>
              <a-input v-model="leaveForm.endDate" placeholder="YYYY-MM-DD" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="事由" required>
          <a-textarea v-model="leaveForm.reason" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useOpsStore, Agent, ShiftType, ShiftEntry, LeaveType } from '@/stores/ops'
import { useUserStore, getRoleInfo } from '@/stores/user'
import { useQualityStore } from '@/stores/quality'

const ops = useOpsStore()
const userStore = useUserStore()
const qa = useQualityStore()

const todayStr = (() => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
})()

const dates = computed<string[]>(() => {
  const list: string[] = []
  const today = new Date()
  for (let i = 0; i < 14; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const pad = (n: number) => String(n).padStart(2, '0')
    list.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
  }
  return list
})

// 排行:作业量 + 质检均分综合
const rankingList = computed(() => {
  return [...ops.agents]
    .filter((a) => a.role !== 'manage')
    .map((a) => {
      // 综合得分 = 作业量归一 + 均分权重
      const ticketScore = Math.min(a.monthlyTicketCount / 100, 1) * 50
      const qaScore = a.monthlyAvgScore > 0 ? a.monthlyAvgScore * 0.5 : 25 // 未评分给中性分
      return { ...a, _score: ticketScore + qaScore }
    })
    .sort((a, b) => (b as any)._score - (a as any)._score)
})

const topCount = computed(() => {
  const t = rankingList.value[0]?.monthlyTicketCount || 1
  return t
})
const topName = computed(() => rankingList.value[0]?.name || '-')

const monthlyTotal = computed(() => ops.agents.reduce((a, c) => a + (c.monthlyTicketCount || 0), 0))

const opsAvgScore = computed(() => {
  const scored = ops.agents.filter((a) => a.monthlyAvgScore > 0)
  if (!scored.length) return 0
  return Math.round(scored.reduce((a, c) => a + c.monthlyAvgScore, 0) / scored.length)
})

const volumeList = computed(() =>
  ops.agents.filter((a) => a.role !== 'manage').sort((a, b) => b.monthlyTicketCount - a.monthlyTicketCount)
)

// 排班格子数据
function shiftAt(agentId: string, date: string): ShiftType {
  const sh = ops.shifts.find((s) => s.date === date && s.agentId === agentId)
  return sh?.shift || '休'
}
function shiftLabel(s: ShiftType) {
  return { 早: '早', 中: '中', 晚: '晚', 休: '休', 假: '假' }[s] || s
}
function shiftColor(s: ShiftType) {
  return { 早: 'orange', 中: 'arcoblue', 晚: 'purple', 休: 'gray', 假: 'red' }[s] || 'gray'
}
function shiftNote(agentId: string, date: string) {
  const sh = ops.shifts.find((s) => s.date === date && s.agentId === agentId)
  return sh?.note
}
function dayOfWeekLabel(date: string) {
  const dow = new Date(date + 'T00:00:00').getDay()
  return ['日', '一', '二', '三', '四', '五', '六'][dow]
}

// 班次编辑
const shiftEditVisible = ref(false)
const shiftEditTarget = ref<{ agent: Agent; date: string } | null>(null)
const newShift = ref<ShiftType>('早')
const newShiftNote = ref('')
const currentShift = computed<ShiftType>(() =>
  shiftEditTarget.value ? shiftAt(shiftEditTarget.value.agent.id, shiftEditTarget.value.date) : '休'
)

function openShiftEditor(agent: Agent, date: string) {
  shiftEditTarget.value = { agent, date }
  newShift.value = shiftAt(agent.id, date)
  newShiftNote.value = shiftNote(agent.id, date) || ''
  shiftEditVisible.value = true
}

function saveShift() {
  if (!shiftEditTarget.value) return
  ops.updateShift(
    shiftEditTarget.value.date,
    shiftEditTarget.value.agent.id,
    newShift.value,
    newShiftNote.value || undefined
  )
  Message.success('班次已保存')
  shiftEditVisible.value = false
}

// 请假
const showLeaveApply = ref(false)
const leaveForm = reactive({
  agentId: '',
  type: '事假' as LeaveType,
  startDate: todayStr,
  endDate: todayStr,
  reason: ''
})

function onLeaveApply() {
  if (!leaveForm.agentId || !leaveForm.reason) {
    Message.warning('申请人和事由必填')
    return
  }
  ops.applyLeave({
    agentId: leaveForm.agentId,
    type: leaveForm.type,
    startDate: leaveForm.startDate,
    endDate: leaveForm.endDate,
    reason: leaveForm.reason
  })
  Message.success('请假申请已提交,等待审批')
  showLeaveApply.value = false
  Object.assign(leaveForm, { agentId: '', type: '事假', startDate: todayStr, endDate: todayStr, reason: '' })
}

const canApprove = computed(() => userStore.currentRole === 'manage')

function approveLeave(record: { id: string }, approved: boolean) {
  const approver = userStore.currentRole ? getRoleInfo(userStore.currentRole)?.username || '管理层' : '管理层'
  ops.approveLeave(record.id, approver, approved)
  Message.success(approved ? '已批准' : '已驳回')
}

function agentName(id: string) {
  return ops.agents.find((a) => a.id === id)?.name || id
}

function daysBetween(record: { startDate: string; endDate: string }) {
  const a = new Date(record.startDate).getTime()
  const b = new Date(record.endDate).getTime()
  return Math.round((b - a) / 86400000) + 1
}

function leaveTypeColor(t: LeaveType) {
  return { 事假: 'gray', 病假: 'red', 年假: 'arcoblue', 调休: 'orange', 婚假: 'magenta' }[t] || 'gray'
}
function leaveStatusColor(s: string) {
  return { pending: 'orange', approved: 'green', rejected: 'red' }[s] || 'gray'
}
function leaveStatusLabel(s: string) {
  return { pending: '待审批', approved: '已批准', rejected: '已驳回' }[s] || s
}

function roleColor(r: string) {
  return { agent: 'arcoblue', business: 'orange', review: 'purple', manage: 'red', system: 'gray' }[r] || 'gray'
}
function roleLabel(r: string) {
  return { agent: '坐席', business: '业务执行', review: '审查', manage: '管理层', system: '系统' }[r] || r
}
function statusColor(s: string) {
  return { oncall: 'green', idle: 'arcoblue', offline: 'gray', rest: 'orange' }[s] || 'gray'
}
function statusLabel(s: string) {
  return { oncall: '通话中', idle: '待命', offline: '离线', rest: '休息' }[s] || s
}

// 从质检刷新所有绩效
function refreshFromQuality() {
  ops.refreshAllFromQuality(
    qa.cases.map((c) => ({
      agentName: c.agentName,
      totalScore: c.totalScore,
      status: c.status
    }))
  )
  Message.success('已从质检刷新绩效')
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

.cp-shift-table {
  width: 100%;
  font-size: 12px;
  border-collapse: collapse;
}
.cp-shift-row {
  display: flex;
  border-bottom: 1px solid var(--cp-border-light);
}
.cp-shift-row-header {
  background: var(--cp-bg-soft);
  font-weight: 600;
  position: sticky;
  top: 0;
}
.cp-shift-cell {
  flex: 1;
  min-width: 56px;
  padding: 8px 4px;
  text-align: center;
  border-right: 1px solid var(--cp-border-light);
  cursor: pointer;
  transition: all 0.2s;
}
.cp-shift-cell:hover {
  filter: brightness(0.95);
}
.cp-shift-cell-header {
  cursor: default;
}
.cp-shift-cell-header:hover {
  filter: none;
}
.cp-shift-cell-name {
  flex: 0 0 130px;
  text-align: left;
  cursor: default;
}
.cp-shift-cell-today {
  background: rgba(20, 148, 232, 0.04);
}
.cp-shift-早 {
  background: rgba(255, 165, 0, 0.06);
  color: #d97706;
}
.cp-shift-中 {
  background: rgba(20, 148, 232, 0.06);
  color: #1494e8;
}
.cp-shift-晚 {
  background: rgba(151, 71, 187, 0.06);
  color: #9747bb;
}
.cp-shift-休 {
  background: rgba(180, 180, 180, 0.06);
  color: #999;
}
.cp-shift-假 {
  background: rgba(245, 34, 45, 0.06);
  color: #f5222d;
}
</style>
