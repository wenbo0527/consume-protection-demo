<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px">
      <h4 class="cp-section-title" style="margin: 0">
        {{ title }} <a-tag size="small" color="arcoblue">{{ hooks.length }} 条</a-tag>
      </h4>
      <a-button size="mini" type="primary" @click="onAdd">
        <icon-plus /> 添加钩子
      </a-button>
    </div>

    <a-empty v-if="hooks.length === 0" size="small" description="尚未配置钩子" />

    <div v-else style="display: flex; flex-direction: column; gap: 8px">
      <div v-for="(h, idx) in hooks" :key="idx" class="cp-hook-item">
        <div class="cp-hook-head">
          <a-tag :color="hookColor(h)">{{ hookLabel(h) }}</a-tag>
          <a-button size="mini" type="text" status="danger" @click="onRemove(idx)">
            <icon-delete />
          </a-button>
        </div>
        <component
          :is="getEditor(h)"
          :hook="h as any"
          @update="(patch: any) => onUpdate(idx, patch)"
        />
      </div>
    </div>

    <!-- 添加钩子选择 -->
    <a-modal
      v-model:visible="showPicker"
      title="选择钩子类型"
      :width="520"
      :footer="false"
    >
      <div class="cp-hook-picker">
        <div
          v-for="opt in HOOK_OPTIONS"
          :key="opt.kind"
          class="cp-hook-pick"
          @click="onPick(opt.kind)"
        >
          <div class="cp-hook-pick-title">
            <a-tag :color="hookColor(opt.kind)">{{ opt.label }}</a-tag>
          </div>
          <div class="cp-hook-pick-desc">{{ opt.desc }}</div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { StateHook } from '@/stores/ticket-machine'
import HookEditorFetch from './hook-editors/HookEditorFetch.vue'
import HookEditorInvoke from './hook-editors/HookEditorInvoke.vue'
import HookEditorNotify from './hook-editors/HookEditorNotify.vue'
import HookEditorWorkflow from './hook-editors/HookEditorWorkflow.vue'
import HookEditorSetField from './hook-editors/HookEditorSetField.vue'
import HookEditorWebhook from './hook-editors/HookEditorWebhook.vue'

const props = defineProps<{ title: string; hooks: StateHook[] }>()
const emit = defineEmits<{
  (e: 'update', hooks: StateHook[]): void
}>()

const showPicker = ref(false)
const onAdd = () => {
  showPicker.value = true
}

const HOOK_OPTIONS: Array<{ kind: StateHook['kind']; label: string; desc: string }> = [
  { kind: 'fetch', label: '数据抓取', desc: '调外部 fetcher 拉数据(征信/通话/知识)写入工单字段' },
  { kind: 'invoke', label: '功能调用', desc: '调业务功能(停催激活/监管报送)' },
  { kind: 'notify', label: '通知', desc: '通过系统/短信/邮件/微信发送通知' },
  { kind: 'start-workflow', label: '启动业务工作流', desc: '触发停催/协商等业务工作流' },
  { kind: 'set-field', label: '设置工单字段', desc: '回写工单字段,支持路径 + 值' },
  { kind: 'webhook', label: 'Webhook', desc: '调外部 HTTP 接口' }
]

function defaultHook(kind: StateHook['kind']): StateHook {
  switch (kind) {
    case 'fetch':
      return { kind: 'fetch', fetcher: 'credit.query', into: 'credit', onError: 'warn' }
    case 'invoke':
      return {
        kind: 'invoke',
        functionCode: 'regulator.report',
        input: { ticketId: 'ticket.id', summary: 'fields.summary' },
        await: true,
        onError: 'warn'
      }
    case 'notify':
      return { kind: 'notify', template: 'ticket.notify', channel: 'sys', target: 'role:agent' }
    case 'start-workflow':
      return { kind: 'start-workflow', workflowKind: 'stop_collection' }
    case 'set-field':
      return { kind: 'set-field', path: 'status', value: 'custom' }
    case 'webhook':
      return {
        kind: 'webhook',
        url: 'https://example.com/api',
        method: 'POST',
        body: '{"ticketId":"{{ ticket.id }}"}'
      }
  }
}

function onPick(kind: StateHook['kind']) {
  const newHook = defaultHook(kind)
  emit('update', [...props.hooks, newHook])
  showPicker.value = false
}

function onUpdate(idx: number, patch: Partial<StateHook>) {
  const next = [...props.hooks]
  next[idx] = { ...next[idx], ...patch } as StateHook
  emit('update', next)
}

function onRemove(idx: number) {
  const next = [...props.hooks]
  next.splice(idx, 1)
  emit('update', next)
}

function hookColor(h: StateHook | StateHook['kind']): string {
  const k = typeof h === 'string' ? h : h.kind
  const map: Record<string, string> = {
    fetch: 'cyan',
    invoke: 'purple',
    notify: 'blue',
    'start-workflow': 'green',
    'set-field': 'orange',
    webhook: 'magenta'
  }
  return map[k] || 'gray'
}

function hookLabel(h: StateHook | StateHook['kind']): string {
  const k = typeof h === 'string' ? h : h.kind
  const map: Record<string, string> = {
    fetch: '数据抓取',
    invoke: '功能调用',
    notify: '通知',
    'start-workflow': '工作流',
    'set-field': '字段',
    webhook: 'Webhook'
  }
  return map[k] || k
}

function getEditor(h: StateHook) {
  switch (h.kind) {
    case 'fetch':
      return HookEditorFetch
    case 'invoke':
      return HookEditorInvoke
    case 'notify':
      return HookEditorNotify
    case 'start-workflow':
      return HookEditorWorkflow
    case 'set-field':
      return HookEditorSetField
    case 'webhook':
      return HookEditorWebhook
  }
}
</script>

<style scoped>
.cp-hook-item {
  border: 1px solid var(--cp-border-light);
  border-radius: 6px;
  padding: 10px 12px;
  background: #fff;
}
.cp-hook-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.cp-hook-picker {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.cp-hook-pick {
  border: 1px solid var(--cp-border-light);
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.cp-hook-pick:hover {
  border-color: var(--cp-brand);
  background: var(--cp-brand-soft);
}
.cp-hook-pick-title {
  margin-bottom: 6px;
}
.cp-hook-pick-desc {
  font-size: 12px;
  color: var(--cp-text-tertiary);
  line-height: 1.5;
}
.cp-section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--cp-text);
}
</style>
