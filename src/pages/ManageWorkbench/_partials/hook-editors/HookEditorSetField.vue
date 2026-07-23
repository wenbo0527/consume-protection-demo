<template>
  <div class="cp-editor">
    <a-form-item label="字段路径(支持 a.b.c)">
      <a-input :model-value="hook.path" @change="(v: string) => $emit('update', { path: v })" />
    </a-form-item>
    <a-form-item label="值(JSON,字面量或 { expr: 'fields.amount' })">
      <a-textarea
        :model-value="JSON.stringify(hook.value)"
        @change="(v: string) => $emit('update', { value: parseJson(v) })"
        :auto-size="{ minRows: 1, maxRows: 3 }"
      />
    </a-form-item>
  </div>
</template>
<script setup lang="ts">
import type { StateHook } from '@/stores/ticket-machine'
defineProps<{ hook: Extract<StateHook, { kind: 'set-field' }> }>()
defineEmits<{ (e: 'update', patch: Record<string, unknown>): void }>()
function parseJson(v: string): string | number | boolean | { expr: string } {
  try {
    return JSON.parse(v)
  } catch {
    return v
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
