<template>
  <div class="cp-action">
    <div class="cp-action-head">
      <h2 class="cp-action-title">
        <icon-exclamation-circle style="color: var(--cp-danger)" />
        监管件即将超时
      </h2>
      <a-tag color="red" size="small" class="cp-pulse">剩余 2 天</a-tag>
    </div>
    <div class="cp-action-body">
      <a-alert type="error" show-icon style="margin-bottom: 16px">
        <template #title>规则引擎已自动升级至上级</template>
        <template #content> 监管件 GD-20260709-0015 处理时限到期前 1 天自动告警,系统已通知管理层。 </template>
      </a-alert>

      <div class="cp-action-row">
        <span class="cp-label">工单号</span>
        <span class="cp-link">GD-20260709-0015</span>
      </div>
      <div class="cp-action-row">
        <span class="cp-label">类型</span>
        <span>投诉 · 信息泄露</span>
      </div>
      <div class="cp-action-row">
        <span class="cp-label">处理人</span>
        <span>王芳</span>
      </div>
      <div class="cp-action-row">
        <span class="cp-label">已处理</span>
        <span>5 天 / 7 天</span>
      </div>

      <a-divider style="margin: 16px 0" />

      <a-alert type="warning" show-icon>
        <template #title>处置建议</template>
        <template #content>
          1. 立即联系客户核实信息<br />
          2. 提交处理意见并关单<br />
          3. 如超时未处理,将自动升级至消保管理层
        </template>
      </a-alert>
    </div>
    <div class="cp-action-foot">
      <a-button @click="wb.removeTask(task.id)">稍后处理</a-button>
      <a-button type="primary" status="danger" @click="urgentHandle">立即处理</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWorkbenchStore } from '@/stores/workbench'
import { Message } from '@arco-design/web-vue'

defineProps<{ task: any }>()
const wb = useWorkbenchStore()

function urgentHandle() {
  wb.removeTask(undefined as any)
  Message.success('已转入工单详情,开始加急处理')
}
</script>

<style scoped>
.cp-action {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.cp-action-head {
  padding: 16px 20px;
  border-bottom: 1px solid var(--cp-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.cp-action-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.cp-action-body {
  flex: 1;
  padding: 16px 20px;
  overflow-y: auto;
}
.cp-action-row {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
}
.cp-label {
  font-size: 12px;
  color: var(--cp-text-tertiary);
  min-width: 70px;
}
.cp-link {
  font-family: 'DIN Alternate', monospace;
  color: var(--cp-brand);
  cursor: pointer;
}
.cp-action-foot {
  padding: 12px 20px;
  border-top: 1px solid var(--cp-border-light);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
