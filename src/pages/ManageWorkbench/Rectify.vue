<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">溯源整改</h1>
        <div class="cp-page-subtitle">投诉数据 → 根因分析 → 下发整改 → 跟踪 → 验证 → 沉淀标准/知识</div>
      </div>
      <a-space>
        <a-button @click="showTrace = true" type="primary">
          <icon-plus /> 新建溯源报告
        </a-button>
      </a-space>
    </div>

    <!-- KPI -->
    <div class="cp-stat-row">
      <div class="cp-stat-card">
        <div class="cp-stat-label">待开始</div>
        <div class="cp-stat-value mono" style="color: var(--cp-warning)">{{ store.pendingTasks.length }}</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">进行中</div>
        <div class="cp-stat-value mono" style="color: var(--cp-brand)">{{ store.inProgressTasks.length }}</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">已完成</div>
        <div class="cp-stat-value mono">{{ store.doneTasks.length }}</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">已验证</div>
        <div class="cp-stat-value mono" style="color: var(--cp-success)">{{ store.verifiedTasks.length }}</div>
      </div>
    </div>

    <!-- Tabs -->
    <a-tabs default-active-key="reports">
      <a-tab-pane key="reports" title="溯源报告 ({{ store.reports.length }})">
        <div v-for="r in store.reports" :key="r.id" class="cp-card" style="padding: 16px 20px; margin-bottom: 12px">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px">
            <div>
              <h3 class="cp-section-title" style="margin: 0">
                {{ r.scene }}
                <a-tag size="small" style="margin-left: 6px">{{ r.rootCause }}</a-tag>
              </h3>
              <div style="font-size: 12px; color: var(--cp-text-tertiary); margin-top: 4px">
                报告编号 <span class="mono">{{ r.id }}</span> · {{ r.createdAt }} · 作者 {{ r.author }}
              </div>
            </div>
            <a-button size="small" type="primary" @click="openCreateTask(r)">
              <icon-send /> 下发整改任务
            </a-button>
          </div>
          <p style="color: var(--cp-text-secondary); margin: 4px 0">{{ r.description }}</p>
          <a-row :gutter="16" style="margin-top: 8px">
            <a-col :span="6">
              <div style="font-size: 11px; color: var(--cp-text-tertiary)">投诉量</div>
              <div class="mono" style="font-size: 16px">{{ r.data.complaintCount }}</div>
            </a-col>
            <a-col :span="6">
              <div style="font-size: 11px; color: var(--cp-text-tertiary)">涉及客户</div>
              <div class="mono" style="font-size: 16px">{{ r.data.customerAffected }}</div>
            </a-col>
            <a-col :span="6">
              <div style="font-size: 11px; color: var(--cp-text-tertiary)">统计周期</div>
              <div style="font-size: 13px">{{ r.data.period }}</div>
            </a-col>
            <a-col :span="6">
              <div style="font-size: 11px; color: var(--cp-text-tertiary)">期望下降率</div>
              <div class="mono" style="font-size: 16px; color: var(--cp-success)">{{ r.data.dropRate || 0 }}%</div>
            </a-col>
          </a-row>
          <a-alert type="info" show-icon style="margin-top: 8px">
            <template #title>整改方向建议</template>
            <template #content>{{ r.conclusion }}</template>
          </a-alert>
        </div>
      </a-tab-pane>

      <a-tab-pane key="tasks" title="整改任务 ({{ store.tasks.length }})">
        <div class="cp-card" style="padding: 0">
          <a-table :data="store.tasks" :pagination="{ pageSize: 10 }" row-key="id">
            <template #columns>
              <a-table-column title="任务编号" data-index="id" :width="160">
                <template #cell="{ record }">
                  <span class="mono" style="color: var(--cp-brand)">{{ record.id }}</span>
                </template>
              </a-table-column>
              <a-table-column title="整改场景" data-index="scene" :width="140" />
              <a-table-column title="责任部门" data-index="dept" :width="120" />
              <a-table-column title="责任人" data-index="owner" :width="120" />
              <a-table-column title="截止日期" data-index="deadline" :width="110" />
              <a-table-column title="状态" :width="90">
                <template #cell="{ record }">
                  <a-tag :color="statusColor(record.status)">{{ statusLabel(record.status) }}</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="整改要求" data-index="requirement">
                <template #cell="{ record }">
                  <a-tooltip :content="record.requirement">
                    <span style="font-size: 12px; color: var(--cp-text-secondary)">
                      {{ record.requirement.length > 30 ? record.requirement.slice(0, 30) + '...' : record.requirement }}
                    </span>
                  </a-tooltip>
                </template>
              </a-table-column>
              <a-table-column title="进度" :width="80">
                <template #cell="{ record }">
                  <a-tag size="small">{{ record.progress.length }} 条</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="操作" :width="220">
                <template #cell="{ record }">
                  <a-space :size="4">
                    <a-button size="small" @click="openDetail(record)">详情</a-button>
                    <a-button v-if="record.status === 'pending' || record.status === 'in_progress'" size="small" type="primary" @click="openProgress(record)">
                      填写进度
                    </a-button>
                    <a-button v-if="record.status === 'done'" size="small" status="success" @click="openVerify(record)">
                      验证
                    </a-button>
                  </a-space>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </a-tab-pane>
    </a-tabs>

    <!-- 新建溯源报告弹窗 -->
    <a-modal v-model:visible="showTrace" title="新建溯源报告" :width="640" :ok-text="'生成报告'" @ok="onCreateReport">
      <a-form :model="traceForm">
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="高发场景">
              <a-input v-model="traceForm.scene" placeholder="如:催收频次投诉" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="根因分类">
              <a-select v-model="traceForm.rootCause">
                <a-option>产品设计</a-option>
                <a-option>流程</a-option>
                <a-option>话术</a-option>
                <a-option>系统</a-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="数据描述">
          <a-textarea v-model="traceForm.description" :rows="3" placeholder="投诉数据描述、影响范围等" />
        </a-form-item>
        <a-row :gutter="12">
          <a-col :span="8">
            <a-form-item label="投诉量">
              <a-input-number v-model="traceForm.complaintCount" :min="0" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="涉及客户">
              <a-input-number v-model="traceForm.customerAffected" :min="0" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="期望下降率(%)">
              <a-input-number v-model="traceForm.dropRate" :min="0" :max="100" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="整改方向建议">
          <a-textarea v-model="traceForm.conclusion" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 下发整改任务弹窗 -->
    <a-modal v-model:visible="showTask" title="下发整改任务" :width="640" :ok-text="'下发'" @ok="onCreateTask">
      <a-alert v-if="activeReport" type="info" show-icon style="margin-bottom: 12px">
        <template #title>基于报告 · {{ activeReport.scene }}</template>
        <template #content>{{ activeReport.conclusion }}</template>
      </a-alert>
      <a-form :model="taskForm">
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="责任部门" required>
              <a-input v-model="taskForm.dept" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="责任人" required>
              <a-input v-model="taskForm.owner" placeholder="如:催收运营·李伟" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="整改要求" required>
          <a-textarea v-model="taskForm.requirement" :rows="4" />
        </a-form-item>
        <a-form-item label="截止日期" required>
          <a-input v-model="taskForm.deadline" placeholder="YYYY-MM-DD" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 进度填写弹窗 -->
    <a-modal v-model:visible="showProgress" title="填写进度" :ok-text="'提交'" @ok="onAddProgress">
      <a-form :model="progressForm">
        <a-form-item label="当前进展">
          <a-textarea v-model="progressForm.note" :rows="4" placeholder="说明当前完成情况、遇到的问题" />
        </a-form-item>
        <a-form-item>
          <a-checkbox v-model="progressForm.markDone">标记为已完成,等待管理层验证</a-checkbox>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 验证弹窗 -->
    <a-modal v-model:visible="showVerify" title="整改验证" :ok-text="'通过验证'" @ok="onVerify">
      <a-form :model="verifyForm">
        <a-form-item label="验证结果">
          <a-radio-group v-model="verifyForm.result">
            <a-radio value="pass">通过</a-radio>
            <a-radio value="fail">不通过</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="实际下降率(%)">
          <a-input-number v-model="verifyForm.metricDrop" :min="0" :max="100" />
        </a-form-item>
        <a-form-item label="验证说明">
          <a-textarea v-model="verifyForm.note" :rows="3" placeholder="说明验证依据、抽样结果等" />
        </a-form-item>

        <!-- OPT-2:验证通过时,一键生成标准项 -->
        <div v-if="verifyForm.result === 'pass'" style="margin-top: 16px; padding: 12px; background: rgba(20, 148, 232, 0.05); border: 1px solid rgba(20, 148, 232, 0.2); border-radius: 6px">
          <a-checkbox v-model="verifyForm.alsoGenerateStandard">
            <b>同步沉淀为审查标准(OPT-2 一键生成)</b>
          </a-checkbox>
          <div style="font-size: 12px; color: var(--cp-text-tertiary); margin: 4px 0 12px">
            验证通过的标准会自动带 `source: rectify` 标签,可在 `/review/standards` 中筛选查看。
          </div>
          <a-form-item v-if="verifyForm.alsoGenerateStandard" label="标准大类">
            <a-select v-model="verifyForm.stdCategory">
              <a-option>产品审查</a-option>
              <a-option>催收规范</a-option>
              <a-option>客户适当性</a-option>
              <a-option>信息披露</a-option>
              <a-option>应急预案</a-option>
            </a-select>
          </a-form-item>
          <a-form-item v-if="verifyForm.alsoGenerateStandard" label="标准条款">
            <a-input v-model="verifyForm.stdItem" placeholder="例:催收单日触达上限 3 次" />
          </a-form-item>
          <a-form-item v-if="verifyForm.alsoGenerateStandard" label="依据">
            <a-input v-model="verifyForm.stdBasis" placeholder="例:《商业银行互联网贷款管理办法》第18条" />
          </a-form-item>
          <a-form-item v-if="verifyForm.alsoGenerateStandard" label="适用范围">
            <a-input v-model="verifyForm.stdScope" placeholder="例:全部高风险客户" />
          </a-form-item>
          <a-form-item v-if="verifyForm.alsoGenerateStandard" label="是否必选">
            <a-switch v-model="verifyForm.stdRequired" />
          </a-form-item>
        </div>
      </a-form>
    </a-modal>

    <!-- 详情抽屉 -->
    <a-drawer v-model:visible="detailVisible" :width="560" :title="`整改任务 · ${currentTask?.id || ''}`">
      <div v-if="currentTask">
        <a-descriptions :column="1" bordered size="small" style="margin-bottom: 16px">
          <a-descriptions-item label="整改场景">{{ currentTask.scene }}</a-descriptions-item>
          <a-descriptions-item label="责任部门">{{ currentTask.dept }}</a-descriptions-item>
          <a-descriptions-item label="责任人">{{ currentTask.owner }}</a-descriptions-item>
          <a-descriptions-item label="截止日期">{{ currentTask.deadline }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="statusColor(currentTask.status)">{{ statusLabel(currentTask.status) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="整改要求">{{ currentTask.requirement }}</a-descriptions-item>
        </a-descriptions>

        <a-divider style="margin: 12px 0">进度时间线</a-divider>

        <a-timeline>
          <a-timeline-item v-for="(p, idx) in currentTask.progress" :key="idx" :label="p.time">
            <div style="font-weight: 500">{{ p.operator }}</div>
            <div style="font-size: 12px; color: var(--cp-text-secondary); margin-top: 2px">{{ p.note }}</div>
          </a-timeline-item>
        </a-timeline>

        <a-divider v-if="currentTask.verification" style="margin: 12px 0">验证结果</a-divider>
        <a-alert v-if="currentTask.verification"
          :type="currentTask.verification.result === 'pass' ? 'success' : 'error'" show-icon style="margin-bottom: 12px"
        >
          <template #title>
            {{ currentTask.verification.result === 'pass' ? '✓ 验证通过' : '✗ 验证不通过' }}
            <span v-if="currentTask.verification.metricDrop !== undefined" style="margin-left: 8px; font-weight: normal">
              实际下降率 {{ currentTask.verification.metricDrop }}%
            </span>
          </template>
          <template #content>
            <div style="margin-top: 4px">{{ currentTask.verification.operator }} · {{ currentTask.verification.time }}</div>
            <div style="margin-top: 4px">{{ currentTask.verification.note }}</div>
          </template>
        </a-alert>

        <a-alert v-if="currentTask.generatedStandardIds?.length || currentTask.generatedKbIds?.length" type="info" show-icon style="margin-bottom: 12px">
          <template #title>整改 → 标准/知识沉淀</template>
          <template #content>
            <div v-if="currentTask.generatedStandardIds?.length" style="margin-top: 4px">
              已生成审查标准:<span v-for="id in currentTask.generatedStandardIds" :key="id" class="mono" style="margin-right: 6px">{{ id }}</span>
            </div>
            <div v-if="currentTask.generatedKbIds?.length" style="margin-top: 4px">
              已生成知识条目:<span v-for="id in currentTask.generatedKbIds" :key="id" class="mono" style="margin-right: 6px">{{ id }}</span>
            </div>
          </template>
        </a-alert>
      </div>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRectifyStore, TraceReport, RectifyTask } from '@/stores/rectify'
import { useReviewStore } from '@/stores/review'
import { Message } from '@arco-design/web-vue'

const store = useRectifyStore()
const reviewStore = useReviewStore()

function statusColor(s: string) {
  return {
    pending: 'orange',
    in_progress: 'arcoblue',
    done: 'green',
    verified: 'green',
    rejected: 'red'
  }[s] || 'gray'
}
function statusLabel(s: string) {
  return {
    pending: '待开始',
    in_progress: '进行中',
    done: '已完成',
    verified: '已验证',
    rejected: '驳回'
  }[s] || s
}

// 新建报告
const showTrace = ref(false)
const traceForm = reactive({
  scene: '',
  rootCause: '流程',
  description: '',
  complaintCount: 0,
  customerAffected: 0,
  dropRate: 30,
  conclusion: ''
})

function onCreateReport() {
  if (!traceForm.scene) { Message.warning('请填写场景'); return }
  store.createReport({
    scene: traceForm.scene,
    rootCause: traceForm.rootCause,
    description: traceForm.description,
    data: {
      complaintCount: traceForm.complaintCount,
      customerAffected: traceForm.customerAffected,
      dropRate: traceForm.dropRate,
      period: '近 30 天'
    },
    conclusion: traceForm.conclusion,
    author: '陈强'
  })
  Message.success('溯源报告已生成')
  showTrace.value = false
  // 重置
  Object.assign(traceForm, {
    scene: '', rootCause: '流程', description: '', complaintCount: 0, customerAffected: 0, dropRate: 30, conclusion: ''
  })
}

// 下发任务
const showTask = ref(false)
const activeReport = ref<TraceReport | null>(null)
const taskForm = reactive({
  dept: '', owner: '', requirement: '', deadline: ''
})

function openCreateTask(r: TraceReport) {
  activeReport.value = r
  Object.assign(taskForm, {
    dept: '',
    owner: '',
    requirement: r.conclusion,
    deadline: ''
  })
  showTask.value = true
}

function onCreateTask() {
  if (!activeReport.value) return
  if (!taskForm.dept || !taskForm.owner || !taskForm.requirement || !taskForm.deadline) {
    Message.warning('请填写完整任务信息')
    return
  }
  const t = store.createTask({
    reportId: activeReport.value.id,
    scene: activeReport.value.scene,
    dept: taskForm.dept,
    owner: taskForm.owner,
    requirement: taskForm.requirement,
    deadline: taskForm.deadline
  })
  if (t) {
    Message.success(`整改任务 ${t.id} 已下发`)
    showTask.value = false
  }
}

// 进度填写
const showProgress = ref(false)
const progressForm = reactive({ note: '', markDone: false })
const progressTask = ref<RectifyTask | null>(null)

function openProgress(t: RectifyTask) {
  progressTask.value = t
  progressForm.note = ''
  progressForm.markDone = false
  showProgress.value = true
}

function onAddProgress() {
  if (!progressTask.value || !progressForm.note) {
    Message.warning('请填写进展')
    return
  }
  store.addProgress(progressTask.value.id, '责任人', progressForm.note)
  if (progressForm.markDone) {
    store.submitDone(progressTask.value.id, '责任人', progressForm.note)
    Message.success('已标记完成,等待管理层验证')
  } else {
    Message.success('进度已更新')
  }
  showProgress.value = false
}

// 验证
const showVerify = ref(false)
const verifyForm = reactive({
  result: 'pass' as 'pass' | 'fail',
  metricDrop: 30,
  note: '',
  // OPT-2:一键生成审查标准
  alsoGenerateStandard: false,
  stdCategory: '催收规范',
  stdItem: '',
  stdBasis: '',
  stdScope: '',
  stdRequired: true
})
const verifyTask = ref<RectifyTask | null>(null)

function openVerify(t: RectifyTask) {
  verifyTask.value = t
  verifyForm.result = 'pass'
  verifyForm.metricDrop = 30
  verifyForm.note = ''
  showVerify.value = true
}

function onVerify() {
  if (!verifyTask.value) return
  store.verify(verifyTask.value.id, '陈强', verifyForm.result, verifyForm.note, verifyForm.metricDrop)

  // OPT-2:如果勾选了同时沉淀为标准 → 写入 reviewStore
  let stdId: string | null = null
  if (verifyForm.result === 'pass' && verifyForm.alsoGenerateStandard && verifyForm.stdItem && verifyForm.stdBasis) {
    stdId = reviewStore.generateFromRectify({
      category: verifyForm.stdCategory,
      item: verifyForm.stdItem,
      basis: verifyForm.stdBasis,
      required: verifyForm.stdRequired,
      scope: verifyForm.stdScope || undefined,
      author: '陈强',
      rectifyTaskId: verifyTask.value.id,
      rectifyReportId: verifyTask.value.reportId
    }).id
  }

  // 重置 verifyForm 状态
  verifyForm.alsoGenerateStandard = false
  verifyForm.stdItem = ''
  verifyForm.stdBasis = ''
  verifyForm.stdScope = ''

  if (stdId) {
    Message.success(`验证通过,已沉淀为审查标准 ${stdId}`)
  } else {
    Message.success(verifyForm.result === 'pass' ? '验证通过,已自动沉淀到标准/知识' : '已驳回,等待责任人继续整改')
  }
  showVerify.value = false
}

// 详情
const detailVisible = ref(false)
const currentTask = ref<RectifyTask | null>(null)
function openDetail(t: RectifyTask) {
  currentTask.value = t
  detailVisible.value = true
}
</script>

<style scoped>
.cp-section-title { font-size: 14px; font-weight: 600; margin: 0 0 12px; color: var(--cp-text); }
</style>