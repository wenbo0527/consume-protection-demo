<template>
  <div class="cp-editor">
    <a-form-item label="URL">
      <a-input :model-value="hook.url" @change="(v: string) => $emit('update', { url: v })" />
    </a-form-item>
    <a-form-item label="Method">
      <a-radio-group :model-value="hook.method" @change="(v: any) => $emit('update', { method: v })">
        <a-radio value="POST">POST</a-radio>
        <a-radio value="PUT">PUT</a-radio>
      </a-radio-group>
    </a-form-item>
    <a-form-item label="Body(支持 {{ ticket.id }} / {{ fields.amount }})">
      <a-textarea
        :model-value="hook.body || ''"
        @change="(v: string) => $emit('update', { body: v })"
        :auto-size="{ minRows: 2, maxRows: 5 }"
      />
    </a-form-item>
  </div>
</template>
<script setup lang="ts">
import type { StateHook } from '@/stores/ticket-machine'
defineProps<{ hook: Extract<StateHook, { kind: 'webhook' }> }>()
defineEmits<{ (e: 'update', patch: Record<string, unknown>): void }>()
</script>
<style scoped>
.cp-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
