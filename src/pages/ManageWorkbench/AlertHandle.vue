<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">预警处置中心</h1>
        <div class="cp-page-subtitle">未处置预警 · 超时 24 小时自动升级 · 处置后自动验证</div>
      </div>
    </div>

    <div class="cp-stat-row">
      <div class="cp-stat-card">
        <div class="cp-stat-label">未处置</div>
        <div class="cp-stat-value mono" style="color: var(--cp-danger)">2</div>
        <div class="cp-stat-extra cp-pulse" style="color: var(--cp-danger)">超时 0</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">处置中</div>
        <div class="cp-stat-value mono" style="color: var(--cp-warning)">1</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">已处置/验证</div>
        <div class="cp-stat-value mono" style="color: var(--cp-success)">2</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">本月处置率</div>
        <div class="cp-stat-value mono">92%</div>
        <div class="cp-stat-extra">目标 ≥95%</div>
      </div>
    </div>

    <!-- 工作流待办入口 -->
    <a-alert type="info" show-icon style="margin-bottom: 16px">
      <template #title>工作流待办说明</template>
      <template #content>
        管理层下达的指令会进入坐席端工作流待办。
        <a-link style="margin-left: 8px" @click="$router.push('/manage/workflow-monitor')">
          跳转到工单流转监控 →
        </a-link>
      </template>
    </a-alert>

    <div class="cp-card" style="padding: 0">
      <a-table :data="alerts" :pagination="false">
        <template #columns>
          <a-table-column title="预警编号" data-index="id" />
          <a-table-column title="类型">
            <template #cell="{ record }">
              <a-tag :color="typeColor(record.type)">{{ record.typeLabel }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="标题" data-index="title" />
          <a-table-column title="等级">
            <template #cell="{ record }">
              <a-tag :color="record.level === 'urgent' ? 'red' : record.level === 'warning' ? 'orange' : 'blue'">
                {{ record.level === 'urgent' ? '紧急' : record.level === 'warning' ? '警告' : '提示' }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="触发时间" data-index="triggerTime" />
          <a-table-column title="状态">
            <template #cell="{ record }">
              <status-badge :status="record.status" />
            </template>
          </a-table-column>
          <a-table-column title="操作">
            <template #cell="{ record }">
              <a-space :size="4">
                <a-button v-if="record.status === 'alert_open'" size="small" type="primary" @click="openHandle(record)"
                  >处置</a-button
                >
                <a-button size="small">详情</a-button>
                <a-button v-if="record.relatedTicket" size="small">查看工单</a-button>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </div>

    <!-- 处置抽屉 -->
    <a-drawer v-model:visible="showDrawer" :width="520" title="预警处置">
      <div v-if="current">
        <a-descriptions :column="1" bordered size="small">
          <a-descriptions-item label="预警编号">{{ current.id }}</a-descriptions-item>
          <a-descriptions-item label="类型">{{ current.typeLabel }}</a-descriptions-item>
          <a-descriptions-item label="标题">{{ current.title }}</a-descriptions-item>
          <a-descriptions-item label="描述">{{ current.desc }}</a-descriptions-item>
        </a-descriptions>

        <h4 style="margin: 20px 0 12px; font-size: 14px">处置动作</h4>
        <a-radio-group v-model="action" style="display: flex; flex-direction: column; gap: 8px">
          <a-radio value="confirm">确认 - 填写处置意见并关联工单</a-radio>
          <a-radio value="upgrade">升级 - 转交上级处理</a-radio>
          <a-radio value="ignore">忽略 - 仅限低优先级预警</a-radio>
        </a-radio-group>

        <a-divider style="margin: 16px 0" />
        <h4 style="margin: 0 0 8px; font-size: 14px">快速指令(OPT-1 · 实时)</h4>
        <div style="font-size: 12px; color: var(--cp-text-tertiary); margin-bottom: 8px">
          不走工作流,直接给坐席/业务执行/审查下达指令。坐席可在 AgentDesk 顶部 banner 接收。
        </div>
        <a-form :model="instructionForm" layout="vertical" size="small">
          <a-row :gutter="8">
            <a-col :span="12">
              <a-form-item label="接收方">
                <a-select v-model="instructionForm.toRole">
                  <a-option value="agent">坐席</a-option>
                  <a-option value="business">业务执行</a-option>
                  <a-option value="review">审查</a-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="紧急度">
                <a-select v-model="instructionForm.priority">
                  <a-option value="urgent">紧急</a-option>
                  <a-option value="high">高</a-option>
                  <a-option value="normal">普通</a-option>
                  <a-option value="low">低</a-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item label="标题">
            <a-input v-model="instructionForm.title" placeholder="例:严防催收红线" />
          </a-form-item>
          <a-form-item label="内容">
            <a-textarea v-model="instructionForm.content" :rows="3" placeholder="例:客户已被列入失信,杜绝上门" />
          </a-form-item>
          <a-form-item label="截止时间(可选)">
            <a-input v-model="instructionForm.deadline" placeholder="例:2026-07-15 18:00" />
          </a-form-item>
          <a-button type="primary" size="small" long status="warning" @click="sendInstruction"> 下达指令 </a-button>
        </a-form>

        <div class="cp-form" style="margin-top: 16px">
          <a-form-item label="处置意见" required>
            <a-textarea v-model="opinion" :rows="4" placeholder="请填写处置意见..." />
          </a-form-item>
          <a-form-item v-if="action === 'confirm'" label="关联工单">
            <a-select v-model="relatedTicket" placeholder="选择关联工单">
              <a-option v-for="t in ticketOptions" :key="t" :value="t">{{ t }}</a-option>
            </a-select>
          </a-form-item>
          <a-form-item v-if="action === 'confirm'" label="指令下达">
            <a-input v-model="instruction" placeholder="备注处置要求,通知对应坐席/支撑岗" />
          </a-form-item>
          <a-form-item v-if="action === 'upgrade'" label="升级原因" required>
            <a-textarea v-model="upgradeReason" :rows="2" />
          </a-form-item>
          <a-form-item v-if="action === 'ignore'" label="忽略原因" required>
            <a-textarea v-model="ignoreReason" :rows="2" />
          </a-form-item>
        </div>

        <div
          style="
            margin-top: 16px;
            padding: 12px;
            background: var(--cp-bg-soft);
            border-radius: 6px;
            font-size: 12px;
            color: var(--cp-text-secondary);
          "
        >
          <icon-info-circle /> 关联工单关单后,本预警将自动标记为"已验证"。
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px">
          <a-button @click="showDrawer = false">取消</a-button>
          <a-button type="primary" @click="confirm">确认处置</a-button>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useWorkflowStore } from '@/stores/workflow'
import { useAlertStore } from '@/stores/alert'
import { useInstructionStore, InstructionPriority, InstructionRole } from '@/stores/instruction'
import { useUserStore, getRoleInfo } from '@/stores/user'
import { Message } from '@arco-design/web-vue'

const wf = useWorkflowStore()
const alertStore = useAlertStore()
const instructionStore = useInstructionStore()
const userStore = useUserStore()

// OPT-1:快速指令表单(管理层下达)
const instructionForm = ref({
  toRole: 'agent' as InstructionRole,
  priority: 'high' as InstructionPriority,
  title: '',
  content: '',
  deadline: ''
})

function sendInstruction() {
  if (!current.value) {
    Message.warning('请先选中一个预警')
    return
  }
  if (!instructionForm.value.title || !instructionForm.value.content) {
    Message.warning('标题与内容必填')
    return
  }
  const fromRole = userStore.currentRole || 'manage'
  const fromOperator = (userStore.currentRole ? getRoleInfo(userStore.currentRole)?.username : '管理层') || '管理层'
  const ins = instructionStore.create({
    fromRole,
    fromOperator,
    toRole: instructionForm.value.toRole,
    title: instructionForm.value.title,
    content: instructionForm.value.content,
    priority: instructionForm.value.priority,
    alertId: current.value.id,
    ticketId: current.value.relatedTicket,
    deadline: instructionForm.value.deadline || undefined
  })
  Message.success(`指令已下达:${ins.id},接收方 ${instructionForm.value.toRole}`)
  // 清空
  instructionForm.value.title = ''
  instructionForm.value.content = ''
  instructionForm.value.deadline = ''
}
const alerts = alertStore.items

const showDrawer = ref(false)
const current = ref<any>(null)
const action = ref('confirm')
const opinion = ref('')
const relatedTicket = ref('')
const instruction = ref('')
const upgradeReason = ref('')
const ignoreReason = ref('')
const ticketOptions = ['GD-20260712-0001', 'GD-20260714-0008', 'GD-20260709-0015']

function typeColor(t: string) {
  if (t === 'volume') return 'blue'
  if (t === 'regulator') return 'red'
  if (t === 'collection') return 'orange'
  return 'gray'
}

function openHandle(record: any) {
  current.value = record
  action.value = 'confirm'
  opinion.value = ''
  relatedTicket.value = ''
  showDrawer.value = true
}

function confirm() {
  if (!opinion.value) {
    Message.warning('请填写处置意见')
    return
  }
  if (!current.value) {
    showDrawer.value = false
    return
  }
  // 走 alert_directive 工作流
  // 节点1:管理层确认预警(含指令内容/指派坐席) → 自动推进
  // 节点2:坐席执行指令
  // 节点3:预警标记已验证(副作用 mark_alert_verified)
  const inst = wf.start({
    kind: 'alert_directive',
    initiator: '陈强',
    initiatorRole: 'manage',
    alertId: current.value.id,
    ticketId: relatedTicket.value || undefined,
    payload: {
      instruction: instruction.value || '请尽快处置关联工单',
      assignTo: '张敏',
      opinion: opinion.value,
      alertTitle: current.value.title
    }
  })
  if (inst) {
    Message.success(`已生成指令实例 ${inst.id},坐席端可在工作台"工作流待办"中查看并执行`)
  } else {
    Message.success('处置完成,指令已下达')
  }
  // 走 alertStore action(持久化 + 状态机正确状态)
  // dispose: alert_open(未处置) → alert_handle(处置中) → alert_done(已处置) → alert_verified(已验证,需工单关单)
  alertStore.updateStatus(current.value.id, action.value === 'ignore' ? 'alert_done' : 'alert_handle', {
    // 关联工单写回 store
    relatedTicket: relatedTicket.value || current.value.relatedTicket
  })
  showDrawer.value = false
}
</script>
