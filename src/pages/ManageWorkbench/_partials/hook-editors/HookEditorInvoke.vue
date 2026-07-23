<template>
  <div class="cp-editor">
    <a-form-item label="功能编码">
      <a-input :model-value="hook.functionCode" @change="(v: string) => $emit('update', { functionCode: v })" />
    </a-form-item>
    <a-form-item label="输入映射(JSON)">
      <a-textarea
        :model-value="JSON.stringify(hook.input || {}, null, 2)"
        @change="(v: string) => $emit('update', { input: parseJson(v) })"
        :auto-size="{ minRows: 2, maxRows: 6 }"
      />
    </a-form-item>
    <a-form-item label="等待完成">
      <a-switch :model-value="hook.await" @change="(v: any) => $emit('update', { await: !!v })" />
    </a-form-item>
    <a-form-item label="失败处理">
      <a-select :model-value="hook.onError" @change="(v: any) => $emit('update', { onError: v })">
        <a-option value="continue">跳过</a-option>
        <a-option value="warn">警告继续</a-option>
        <a-option value="fail">中断</a-option>
      </a-select>
    </a-form-item>
  </div>
</template>
<script setup lang="ts">
import type { StateHook } from '@/stores/ticket-machine'
defineProps<{ hook: Extract<StateHook, { kind: 'invoke' }> }>()
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
