<template>
  <div class="cp-editor">
    <a-form-item label="Fetcher 编码">
      <a-input :model-value="hook.fetcher" @change="(v: string) => $emit('update', { fetcher: v })" />
    </a-form-item>
    <a-form-item label="写入路径">
      <a-input :model-value="hook.into" @change="(v: string) => $emit('update', { into: v })" placeholder="如 credit / lastCall" />
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
defineProps<{ hook: Extract<StateHook, { kind: 'fetch' }> }>()
defineEmits<{ (e: 'update', patch: Record<string, unknown>): void }>()
</script>
<style scoped>
.cp-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
