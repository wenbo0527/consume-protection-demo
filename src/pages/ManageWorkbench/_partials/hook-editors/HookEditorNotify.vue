<template>
  <div class="cp-editor">
    <a-form-item label="模板">
      <a-input :model-value="hook.template" @change="(v: string) => $emit('update', { template: v })" />
    </a-form-item>
    <a-form-item label="渠道">
      <a-select :model-value="hook.channel" @change="(v: any) => $emit('update', { channel: v })">
        <a-option value="sys">系统消息</a-option>
        <a-option value="sms">短信</a-option>
        <a-option value="email">邮件</a-option>
        <a-option value="wechat">微信</a-option>
      </a-select>
    </a-form-item>
    <a-form-item label="目标(角色:xxx / user:xxx / group:xxx)">
      <a-input :model-value="hook.target" @change="(v: string) => $emit('update', { target: v })" />
    </a-form-item>
  </div>
</template>
<script setup lang="ts">
import type { StateHook } from '@/stores/ticket-machine'
defineProps<{ hook: Extract<StateHook, { kind: 'notify' }> }>()
defineEmits<{ (e: 'update', patch: Record<string, unknown>): void }>()
</script>
<style scoped>
.cp-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
