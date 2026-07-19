<template>
  <a-tag :color="color" :class="{ 'cp-pulse': pulse }" size="small">
    <slot>{{ text }}</slot>
  </a-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: string
  pulse?: boolean
}>()

const config: Record<string, { color: string; text: string }> = {
  // 工单状态
  pending: { color: 'gray', text: '待分派' },
  todo: { color: 'arcoblue', text: '待接收' },
  processing: { color: 'blue', text: '处理中' },
  transfer: { color: 'orange', text: '待流转' },
  closing: { color: 'cyan', text: '待关单' },
  closed: { color: 'green', text: '已关单' },
  // 紧急度
  urgent: { color: 'red', text: '紧急' },
  special: { color: 'orangered', text: '特急' },
  normal: { color: 'gray', text: '普通' },
  // 风险等级
  blacklist: { color: 'red', text: '黑名单' },
  complaint: { color: 'orange', text: '投诉标签' },
  agent: { color: 'gold', text: '代理标签' },
  threat: { color: 'magenta', text: '扬言标签' },
  // 审查状态
  draft: { color: 'gray', text: '草稿' },
  fill: { color: 'cyan', text: '任务填写' },
  inReview: { color: 'blue', text: '审查中' },
  revise: { color: 'orange', text: '待修改' },
  archive: { color: 'green', text: '已归档' },
  // 预警状态
  alert_open: { color: 'red', text: '未处置' },
  alert_handle: { color: 'orange', text: '处置中' },
  alert_done: { color: 'green', text: '已处置' },
  alert_ignore: { color: 'gray', text: '已忽略' },
  alert_upgrade: { color: 'magenta', text: '已升级' },
  alert_verified: { color: 'green', text: '已验证' }
}

const color = computed(() => config[props.status]?.color || 'gray')
const text = computed(() => config[props.status]?.text || props.status)
</script>
