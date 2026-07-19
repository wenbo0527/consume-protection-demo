<template>
  <span class="cp-risk-tag" :class="`cp-risk-${type}`" :title="title">
    <icon-exclamation-circle-fill v-if="type !== 'normal'" />
    <icon-check-circle-fill v-else />
    <span class="cp-risk-text">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  type: 'blacklist' | 'complaint' | 'agent' | 'threat' | 'normal'
  label?: string
  title?: string
}>()

const labelMap: Record<string, string> = {
  blacklist: '黑名单',
  complaint: '投诉倾向',
  agent: '异常代理',
  threat: '扬言',
  normal: '正常'
}
const label = computed(() => props.label || labelMap[props.type])
</script>

<style scoped>
.cp-risk-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
}
.cp-risk-blacklist { background: var(--cp-danger-soft); color: var(--cp-danger); }
.cp-risk-complaint { background: #fff3e0; color: var(--cp-warning); }
.cp-risk-agent { background: #fff7e6; color: #d48806; }
.cp-risk-threat { background: #ffecf0; color: #c41d7f; }
.cp-risk-normal { background: #e8f5e9; color: var(--cp-success); }
.cp-risk-text { line-height: 20px; }
</style>