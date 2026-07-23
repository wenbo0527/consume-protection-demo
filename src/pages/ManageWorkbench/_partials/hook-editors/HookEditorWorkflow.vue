<template>
  <div class="cp-editor">
    <a-form-item label="工作流类型">
      <a-select :model-value="hook.workflowKind" @change="(v: any) => $emit('update', { workflowKind: v })">
        <a-option value="stop_collection">停催停扣</a-option>
        <a-option value="negotiate">协商还款</a-option>
        <a-option value="transfer_mediate">转诉调解</a-option>
        <a-option value="credit_objection">征信异议</a-option>
        <a-option value="review_archive">审查归档</a-option>
        <a-option value="alert_directive">预警指令</a-option>
        <a-option value="callback">回访</a-option>
      </a-select>
    </a-form-item>
    <a-form-item label="Payload(JSON)">
      <a-textarea
        :model-value="JSON.stringify(hook.payload || {}, null, 2)"
        @change="(v: string) => $emit('update', { payload: parseJson(v) })"
        :auto-size="{ minRows: 2, maxRows: 5 }"
      />
    </a-form-item>
  </div>
</template>
<script setup lang="ts">
import type { StateHook } from '@/stores/ticket-machine'
defineProps<{ hook: Extract<StateHook, { kind: 'start-workflow' }> }>()
defineEmits<{ (e: 'update', patch: Record<string, unknown>): void }>()
function parseJson(v: string): Record<string, string> {
  try {
    const obj = JSON.parse(v)
    return obj && typeof obj === 'object' ? obj : {}
  } catch {
    return {}
  }
}
</script>
<style scoped>
.cp-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
