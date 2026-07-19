<template>
  <div class="cp-consumer-page">
    <div class="cp-consumer-header">
      <a-avatar :size="48" style="background: var(--cp-brand)">赵</a-avatar>
      <div style="flex: 1">
        <div style="font-size: 16px; font-weight: 600">赵先生</div>
        <div style="font-size: 12px; color: var(--cp-text-tertiary)">客户编号 C001 · 138****5621</div>
      </div>
      <a-button type="text"><icon-notification /></a-button>
    </div>

    <h2 class="cp-c-title">我的投诉</h2>

    <a-empty v-if="!list.length" description="暂无投诉记录" />

    <div v-for="c in list" :key="c.id" class="cp-complaint-card">
      <div style="display: flex; justify-content: space-between; align-items: flex-start">
        <div>
          <div class="cp-c-id">{{ c.id }}</div>
          <div class="cp-c-name">{{ c.title }}</div>
          <div style="margin-top: 4px">
            <a-tag :color="c.status === 'closed' ? 'green' : c.status === 'mediating' ? 'orange' : 'blue'">{{ c.statusLabel }}</a-tag>
            <span style="font-size: 12px; color: var(--cp-text-tertiary); margin-left: 8px">{{ c.type }}</span>
          </div>
        </div>
        <span style="font-size: 12px; color: var(--cp-text-tertiary)">{{ c.submitTime }}</span>
      </div>

      <div style="margin-top: 12px">
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--cp-text-tertiary); margin-bottom: 4px">
          <span>处理进度</span>
          <span class="mono">{{ c.progress }}%</span>
        </div>
        <a-progress :percent="c.progress / 100" :show-text="false" :color="c.status === 'closed' ? '#00b42a' : '#165dff'" />
      </div>

      <div v-if="c.status !== 'closed'" style="margin-top: 12px; font-size: 12px; color: var(--cp-text-tertiary)">
        预计处理完成: {{ c.expectedTime }}
      </div>

      <div style="margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end">
        <a-button size="small"><icon-edit /> 补充信息</a-button>
        <a-button size="small" type="primary"><icon-notification /> 催办</a-button>
        <a-button size="small"><icon-eye /> 详情</a-button>
      </div>
    </div>

    <a-alert type="info" style="margin-top: 16px">
      <template #title>温馨提示</template>
      <template #content>
        · 催办功能:同一工单 7 天内限催办 1 次<br>
        · 补充信息将自动关联工单并通知处理人
      </template>
    </a-alert>
  </div>
</template>

<script setup lang="ts">
import { myComplaints } from '@/mock/data'

const list = myComplaints
</script>

<style scoped>
.cp-consumer-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 20px;
}
.cp-consumer-header {
  display: flex; align-items: center; gap: 12px;
  background: #fff; border-radius: 8px; padding: 16px 20px;
  border: 1px solid var(--cp-border);
}
.cp-c-title { font-size: 18px; font-weight: 600; margin: 24px 0 16px; color: var(--cp-text); }
.cp-complaint-card {
  background: #fff; border-radius: 8px;
  border: 1px solid var(--cp-border);
  padding: 18px 20px; margin-bottom: 12px;
  transition: all 0.2s;
}
.cp-complaint-card:hover { box-shadow: var(--cp-shadow-md); }
.cp-c-id { font-size: 11px; color: var(--cp-text-tertiary); font-family: 'DIN Alternate', monospace; }
.cp-c-name { font-size: 15px; font-weight: 600; color: var(--cp-text); margin-top: 4px; }
</style>