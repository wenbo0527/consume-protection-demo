<!--
  发起业务工作流弹窗
  用法:
    <start-workflow-modal
      v-model:visible="visible"
      :customer-id="customerId"
      :customer-name="customerName"
      :ticket-id="ticketId"
      :initiator-name="me"
      :initiator-role="'agent'"
      @started="onStarted"
    />
-->
<template>
  <a-modal
    :visible="visible"
    :title="`发起业务工作流 · ${customerName || '客户'}`"
    :width="640"
    :ok-text="canSubmit ? '提交发起' : '请选择模板'"
    :ok-button-props="{ disabled: !canSubmit }"
    @ok="onSubmit"
    @cancel="onCancel"
  >
    <a-alert type="info" show-icon style="margin-bottom: 12px">
      <template #title>选择工作流类型</template>
      <template #content> 工作流将按模板逐节点推进:申请 → 审批 → 执行 → 归档;坐席可在"我的待办"中跟踪进度。 </template>
    </a-alert>

    <a-radio-group v-model="kind" style="display: flex; flex-direction: column; gap: 8px; width: 100%">
      <a-radio v-for="tpl in templates" :key="tpl.kind" :value="tpl.kind" :disabled="!tpl.enabled">
        <div style="display: flex; flex-direction: column">
          <span style="font-weight: 600"
            >{{ tpl.name }}
            <a-tag v-if="!tpl.enabled" size="small" color="gray">已停用</a-tag>
          </span>
          <span style="font-size: 12px; color: var(--cp-text-tertiary); margin-top: 2px">{{ tpl.desc }}</span>
        </div>
      </a-radio>
    </a-radio-group>

    <a-divider style="margin: 16px 0">节点预览</a-divider>

    <div v-if="currentTpl" class="cp-flow-preview">
      <div v-for="(n, i) in currentTpl.nodes" :key="n.code" class="cp-flow-node">
        <span class="cp-flow-node-dot" :style="{ background: nodeColor(n.kind) }">{{ i + 1 }}</span>
        <div style="flex: 1; min-width: 0">
          <div style="font-weight: 500">{{ n.name }}</div>
          <div style="font-size: 11px; color: var(--cp-text-tertiary); margin-top: 2px">
            处置:{{ roleLabel(n.handlerRole) }} · SLA {{ n.slaHours }}h
            <span v-if="n.autoNext"> · 自动推进</span>
            <span v-if="n.sideEffect"> · 副作用 {{ n.sideEffect }}</span>
          </div>
        </div>
      </div>
    </div>

    <a-divider style="margin: 16px 0">申请信息</a-divider>

    <a-form :model="form">
      <a-row :gutter="12">
        <a-col :span="12">
          <a-form-item label="客户编号">
            <a-input v-model="form.customerId" :readonly="!!customerId" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="关联工单">
            <a-input v-model="form.ticketId" :readonly="!!ticketId" placeholder="如:GD-20260715-0001" />
          </a-form-item>
        </a-col>
      </a-row>
      <a-form-item v-for="f in currentFields" :key="f.key" :label="f.label">
        <a-select v-if="f.type === 'select'" v-model="form.payload[f.key]">
          <a-option v-for="o in f.options" :key="o" :value="o">{{ o }}</a-option>
        </a-select>
        <a-input v-else v-model="form.payload[f.key]" />
      </a-form-item>
      <a-form-item label="备注">
        <a-textarea v-model="form.remark" :rows="2" placeholder="可选,补充说明" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useWorkflowStore, WorkflowKind, RoleKey, WorkflowInstance, WorkflowNode } from '@/stores/workflow'
import { roleShortLabel as baseRoleLabel } from '@/utils/role-name'

const props = defineProps<{
  visible: boolean
  customerId?: string
  customerName?: string
  ticketId?: string
  initiatorName: string
  initiatorRole: RoleKey
}>()

const emit = defineEmits<{
  'update:visible': [v: boolean]
  started: [inst: WorkflowInstance]
}>()

const wf = useWorkflowStore()
const kind = ref<WorkflowKind>('stop_collection')

const form = reactive({
  customerId: props.customerId || '',
  ticketId: props.ticketId || '',
  remark: '',
  payload: {} as Record<string, any>
})

watch(
  () => props.visible,
  (v) => {
    if (v) {
      form.customerId = props.customerId || ''
      form.ticketId = props.ticketId || ''
      form.remark = ''
      form.payload = {}
      // 默认选择第一个启用的模板
      const first = wf.templates.find((t) => t.enabled)
      if (first) kind.value = first.kind
    }
  }
)

const templates = computed(() => wf.templates)
const currentTpl = computed(() => wf.templates.find((t) => t.kind === kind.value))
const currentFields = computed<WorkflowNode['fields']>(() => currentTpl.value?.nodes[0]?.fields || [])
const canSubmit = computed(() => !!currentTpl.value && currentTpl.value.enabled)

function nodeColor(k: WorkflowNode['kind']) {
  return {
    apply: 'var(--cp-brand)',
    approve: 'var(--cp-warning)',
    execute: 'var(--cp-success)',
    notify: '#909399',
    auto: '#909399',
    archive: '#909399'
  }[k]
}

function roleLabel(r: WorkflowNode['handlerRole']) {
  // 原生数据里 system 不是 RoleKey,不能裸用 roleShortLabel,加入兜底映射
  if (r === 'system') return '系统'
  return baseRoleLabel(r)
}

function onCancel() {
  emit('update:visible', false)
}

function onSubmit() {
  if (!canSubmit.value) return
  // 取客户名(若 props 已传入)
  const inst = wf.start({
    kind: kind.value,
    initiator: props.initiatorName,
    initiatorRole: props.initiatorRole,
    customerId: form.customerId || undefined,
    customerName: props.customerName,
    ticketId: form.ticketId || undefined,
    payload: { ...form.payload, remark: form.remark }
  })
  if (inst) {
    Message.success(`工作流已发起:${inst.id}`)
    emit('started', inst)
    emit('update:visible', false)
  } else {
    Message.error('工作流发起失败,请查看控制台')
  }
}
</script>

<style scoped>
.cp-flow-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 12px;
  background: var(--cp-bg-soft);
  border-radius: 6px;
}
.cp-flow-node {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: #fff;
  border: 1px solid var(--cp-border-light);
  border-radius: 4px;
}
.cp-flow-node-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
