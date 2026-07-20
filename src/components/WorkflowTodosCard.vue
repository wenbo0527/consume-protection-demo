<!--
  工作流待办卡片
  通用组件:传入角色,从 useWorkflowStore 取出该角色待办节点
  显示实例 ID、当前节点、客户、发起时间,并提供"通过/驳回/执行"操作
-->
<template>
  <div class="cp-card cp-wf-todos">
    <div class="cp-wf-todos-head">
      <div>
        <h3 class="cp-section-title" style="margin: 0">工作流待办 · {{ roleLabel }}</h3>
        <div style="font-size: 12px; color: var(--cp-text-tertiary); margin-top: 2px">
          共 {{ todos.length }} 条 · 点击卡片查看节点详情
        </div>
      </div>
      <a-space :size="4">
        <a-button size="small" @click="emit('view-all')">查看全部</a-button>
        <a-button size="small" @click="refresh">刷新</a-button>
      </a-space>
    </div>

    <a-empty v-if="!todos.length" description="当前无待办工作流" />

    <div v-else class="cp-wf-list">
      <div v-for="inst in todos" :key="inst.id" class="cp-wf-row" @click="openDetail(inst)">
        <div class="cp-wf-row-left">
          <a-tag :color="kindColor(inst.kind)" size="small">{{ templateName(inst.kind) }}</a-tag>
          <span class="mono" style="font-size: 12px; color: var(--cp-brand)">{{ inst.id }}</span>
        </div>
        <div style="flex: 1; min-width: 0">
          <div style="font-size: 13px; font-weight: 500">
            客户:{{ inst.customerName || '-' }}
            <span v-if="inst.ticketId" style="color: var(--cp-text-tertiary); font-weight: 400">
              · 工单 {{ inst.ticketId }}</span
            >
          </div>
          <div style="font-size: 11px; color: var(--cp-text-tertiary); margin-top: 2px">
            节点:<b style="color: var(--cp-text)">{{ currentNodeName(inst) }}</b> · 发起人 {{ inst.initiator }} ·
            {{ inst.createdAt }}
          </div>
        </div>
        <div class="cp-wf-row-actions">
          <template v-if="canQuickAct(inst)">
            <a-button
              size="small"
              type="primary"
              status="success"
              :disabled="!canApproveInDrawer(inst)"
              @click.stop="quickApprove(inst)"
              >通过</a-button
            >
            <a-button size="small" status="danger" :disabled="!canApproveInDrawer(inst)" @click.stop="quickReject(inst)"
              >驳回</a-button
            >
            <a-tag v-if="!canApproveInDrawer(inst)" size="small" color="gray">
              需 {{ wf.templateByKind(inst.kind)?.nodes.find((n) => n.code === inst.currentNode)?.handlerRole }} 角色
            </a-tag>
          </template>
          <a-button v-else size="small" disabled>系统节点</a-button>
        </div>
      </div>
    </div>

    <!-- 详情抽屉 -->
    <a-drawer
      v-model:visible="detailVisible"
      :width="560"
      :title="detailInst ? `${detailInst.id} · ${templateName(detailInst.kind)}` : '工作流详情'"
    >
      <div v-if="detailInst" class="cp-wf-detail">
        <a-descriptions :column="1" bordered size="small" style="margin-bottom: 16px">
          <a-descriptions-item label="客户">{{ detailInst.customerName || '-' }}</a-descriptions-item>
          <a-descriptions-item label="关联工单">{{ detailInst.ticketId || '-' }}</a-descriptions-item>
          <a-descriptions-item label="发起人"
            >{{ detailInst.initiator }} ({{ roleLabelByKey(detailInst.initiatorRole) }})</a-descriptions-item
          >
          <a-descriptions-item label="发起时间">{{ detailInst.createdAt }}</a-descriptions-item>
          <a-descriptions-item label="当前状态">
            <a-tag :color="statusColor(detailInst.status)">{{ statusLabel(detailInst.status) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item v-if="detailInst.relatedTicketStatus" label="副作用回写">{{
            detailInst.relatedTicketStatus
          }}</a-descriptions-item>
        </a-descriptions>

        <a-divider style="margin: 12px 0">节点流转</a-divider>

        <a-timeline>
          <a-timeline-item
            v-for="(n, i) in templateNodes(detailInst.kind)"
            :key="n.code"
            :color="
              i === currentIndex(detailInst)
                ? 'var(--cp-brand)'
                : execStatus(detailInst, n.code) === 'approved'
                  ? 'var(--cp-success)'
                  : execStatus(detailInst, n.code) === 'rejected'
                    ? 'var(--cp-danger)'
                    : 'gray'
            "
          >
            <div style="display: flex; justify-content: space-between">
              <span style="font-weight: 500">{{ n.name }}</span>
              <a-tag size="small" :color="nodeKindColor(n.kind)">{{ kindShort(n.kind) }}</a-tag>
            </div>
            <div style="font-size: 11px; color: var(--cp-text-tertiary); margin-top: 2px">
              处置:{{ roleLabelByKey(n.handlerRole) }} · SLA {{ n.slaHours }}h
            </div>
            <div
              v-if="execPayload(detailInst, n.code)"
              style="
                font-size: 12px;
                margin-top: 4px;
                background: var(--cp-bg-soft);
                padding: 6px 8px;
                border-radius: 4px;
              "
            >
              <span v-for="(v, k) in execPayload(detailInst, n.code)" :key="k" style="margin-right: 12px">
                <span style="color: var(--cp-text-tertiary)">{{ k }}:</span> <b>{{ v }}</b>
              </span>
            </div>
            <div
              v-if="execComment(detailInst, n.code)"
              style="font-size: 11px; margin-top: 4px; color: var(--cp-text-secondary)"
            >
              {{ execOperator(detailInst, n.code) }} · {{ execAt(detailInst, n.code) }} ·
              {{ execComment(detailInst, n.code) }}
            </div>
          </a-timeline-item>
        </a-timeline>

        <a-divider style="margin: 16px 0">当前节点操作</a-divider>

        <div v-if="detailInst.status !== 'running'" style="color: var(--cp-text-tertiary); font-size: 12px">
          该工作流已 {{ statusLabel(detailInst.status) }},无法继续操作。
        </div>
        <template v-else>
          <!-- 节点为 auto/notify/archive 时,无需用户操作 -->
          <a-alert
            v-if="currentNodeKindStr === 'auto' || currentNodeKindStr === 'notify' || currentNodeKindStr === 'archive'"
            type="info"
            show-icon
          >
            <template #title>系统节点 · 自动推进</template>
            <template #content>该节点为系统自动处理节点,无需用户填写意见。</template>
          </a-alert>
          <a-form v-else :model="opForm">
            <a-form-item label="审批/执行意见">
              <a-textarea v-model="opForm.comment" :rows="3" placeholder="请输入意见" />
            </a-form-item>
            <a-space>
              <a-button
                type="primary"
                status="success"
                :disabled="detailInst ? !canApproveInDrawer(detailInst) : true"
                @click="doApprove"
                >通过 / 完成</a-button
              >
              <a-button
                status="danger"
                :disabled="detailInst ? !canApproveInDrawer(detailInst) : true"
                @click="doReject"
                >驳回</a-button
              >
              <span
                v-if="detailInst && !canApproveInDrawer(detailInst)"
                style="font-size: 12px; color: var(--cp-text-tertiary)"
              >
                (当前角色 {{ userStore.currentRole }} 无权审批,需
                {{
                  wf.templateByKind(detailInst.kind)?.nodes.find((n) => n.code === detailInst!.currentNode)
                    ?.handlerRole
                }})
              </span>
              <a-button @click="detailVisible = false">关闭</a-button>
            </a-space>
          </a-form>
        </template>
      </div>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useWorkflowStore, WorkflowInstance, RoleKey } from '@/stores/workflow'
import { useUserStore, getRoleInfo } from '@/stores/user'
import * as roleNameMod from '@/utils/role-name'
import { mapInstanceStatusColor, mapInstanceStatusLabel, mapNodeName } from '@/utils/workflow-helpers'

// ⚠️ Vue3 <script setup> 关键:import ... as alias 只在 JS 内可用,
// template 上下文里只暴露 **显式 const/function**。
// 改用 namespace import(对象)再提取,这样 setup scope 能正常收到,
// template 里 `{{ roleLabel }}` 拿到的是函数引用本身,调用后才能渲染字符串。
const { roleShortLabel: roleLabel, roleLabelByKey } = roleNameMod

const props = defineProps<{
  /** 当前角色,用于过滤待办 */
  role: RoleKey | 'review'
  /** 操作人姓名(用于审批时签名) */
  operatorName?: string
}>()

const emit = defineEmits<{ 'view-all': [] }>()

const wf = useWorkflowStore()
const userStore = useUserStore()
const refreshKey = ref(0)

function refresh() {
  refreshKey.value++
  Message.info('已刷新')
}

const todos = computed(() => {
  void refreshKey.value
  switch (props.role) {
    case 'agent':
      return wf.agentTodos
    case 'business':
      return wf.businessTodos
    case 'manage':
    case 'review':
      return wf.manageTodos
    default:
      return []
  }
})

function templateName(kind: WorkflowInstance['kind']) {
  return wf.templateByKind(kind)?.name || kind
}

function templateNodes(kind: WorkflowInstance['kind']) {
  return wf.templateByKind(kind)?.nodes || []
}

function currentNodeName(inst: WorkflowInstance) {
  return templateNodes(inst.kind).find((n) => n.code === inst.currentNode)?.name || inst.currentNode
}

const currentNodeKindStr = computed(() => {
  if (!detailInst.value) return 'auto'
  return templateNodes(detailInst.value.kind).find((n) => n.code === detailInst.value!.currentNode)?.kind || 'auto'
})

function currentIndex(inst: WorkflowInstance) {
  return templateNodes(inst.kind).findIndex((n) => n.code === inst.currentNode)
}

function execStatus(inst: WorkflowInstance, code: string) {
  return inst.executions.find((e) => e.nodeCode === code)?.status || 'pending'
}
function execPayload(inst: WorkflowInstance, code: string) {
  return inst.executions.find((e) => e.nodeCode === code)?.payload
}
function execComment(inst: WorkflowInstance, code: string) {
  return inst.executions.find((e) => e.nodeCode === code)?.comment
}
function execOperator(inst: WorkflowInstance, code: string) {
  return inst.executions.find((e) => e.nodeCode === code)?.operator || '-'
}
function execAt(inst: WorkflowInstance, code: string) {
  return inst.executions.find((e) => e.nodeCode === code)?.operatedAt || '-'
}

function kindColor(kind: WorkflowInstance['kind']) {
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
    {
      apply: 'arcoblue',
      approve: 'orange',
      execute: 'green',
      notify: 'gray',
      auto: 'gray',
      archive: 'gray'
    }[k] || 'gray'
  )
}

// 节点类型 → 中文名 · 复用 utils/workflow-helpers 真相源
const kindShort = mapNodeName

function statusColor(s: WorkflowInstance['status']) {
  return mapInstanceStatusColor(s)
}
function statusLabel(s: WorkflowInstance['status']) {
  return mapInstanceStatusLabel(s)
}

// SLA 进度信息
const slaInfo = computed(() => {
  if (!detailInst.value || detailInst.value.status !== 'running') return null
  const tpl = wf.templateByKind(detailInst.value.kind)
  if (!tpl) return null
  const node = tpl.nodes.find((n) => n.code === detailInst.value!.currentNode)
  if (!node || !node.slaHours) return null
  const start = new Date(detailInst.value.currentNodeStartedAt.replace(' ', 'T')).getTime()
  const now = Date.now()
  const elapsedHours = (now - start) / 3600000
  const progress = elapsedHours / node.slaHours
  return {
    progress,
    elapsedHours,
    slaHours: node.slaHours,
    overdue: progress >= 1,
    warning: progress >= 0.75
  }
})

// 详情
const detailVisible = ref(false)
const detailInst = ref<WorkflowInstance | null>(null)
const opForm = ref({ comment: '' })

function openDetail(inst: WorkflowInstance) {
  detailInst.value = inst
  opForm.value.comment = ''
  detailVisible.value = true
}

function getOperator() {
  return (
    props.operatorName ||
    (userStore.currentRole ? getRoleInfo(userStore.currentRole)?.username || userStore.currentRole : '操作员')
  )
}

/** 当前登录角色(没登录则返回 'guest',admin/escalation 强制放行) */
function getOperatorRole(): string {
  const role = userStore.currentRole || 'guest'
  // 管理层永远可以审批任意角色节点(行政特权)
  if (role === 'manage') return role
  return role
}

/**
 * OPT-FIX-2 / P3-8:角色守卫
 * 当前实例的当前节点对当前角色不可审批 → 完全禁用按钮
 */
function canApproveInDrawer(inst: WorkflowInstance): boolean {
  if (!userStore.currentRole) return false
  return wf.canApproveFor(inst.id, userStore.currentRole)
}

/** 兼容老接口:仍支持对所有非系统节点触发动作(但快速操作已收紧) */
function canQuickAct(inst: WorkflowInstance) {
  return canApproveInDrawer(inst)
}

function quickApprove(inst: WorkflowInstance) {
  // OPT-FIX-2 / P3-8: 传 role 给 workflow 守卫
  if (!canApproveInDrawer(inst)) {
    Message.warning(
      `当前角色无权审批 ${inst.id} (节点要求 ${wf.templateByKind(inst.kind)?.nodes.find((n) => n.code === inst.currentNode)?.handlerRole})`
    )
    return
  }
  wf.approve(inst.id, getOperator(), '快速通过', getOperatorRole())
  Message.success(`${inst.id} 已通过`)
}
function quickReject(inst: WorkflowInstance) {
  if (!canApproveInDrawer(inst)) {
    Message.warning(`当前角色无权驳回 ${inst.id}`)
    return
  }
  wf.reject(inst.id, getOperator(), '快速驳回', getOperatorRole())
  Message.warning(`${inst.id} 已驳回`)
}

function doApprove() {
  if (!detailInst.value) return
  // OPT-FIX-2 / P3-8 角色守卫
  if (!canApproveInDrawer(detailInst.value)) {
    Message.warning(
      `当前角色无权审批 (节点要求 ${wf.templateByKind(detailInst.value.kind)?.nodes.find((n) => n.code === detailInst.value!.currentNode)?.handlerRole})`
    )
    return
  }
  wf.approve(detailInst.value.id, getOperator(), opForm.value.comment || '通过', getOperatorRole())
  Message.success('已通过')
  detailVisible.value = false
}
function doReject() {
  if (!detailInst.value) return
  if (!opForm.value.comment) {
    Message.warning('驳回必须填写意见')
    return
  }
  if (!canApproveInDrawer(detailInst.value)) {
    Message.warning(`当前角色无权驳回`)
    return
  }
  wf.reject(detailInst.value.id, getOperator(), opForm.value.comment, getOperatorRole())
  Message.warning('已驳回')
  detailVisible.value = false
}
</script>

<style scoped>
.cp-wf-todos-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}
.cp-wf-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cp-wf-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--cp-border-light);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  background: #fff;
}
.cp-wf-row:hover {
  border-color: var(--cp-brand);
  background: var(--cp-brand-soft);
}
.cp-wf-row-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 90px;
}
.cp-wf-row-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.cp-wf-detail {
  padding: 0 4px;
}
</style>
