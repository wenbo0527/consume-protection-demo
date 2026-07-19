<template>
  <div class="cp-action">
    <div class="cp-action-head">
      <h2 class="cp-action-title">
        <icon-close-circle style="color: var(--cp-warning)" />
        审批驳回通知
      </h2>
      <a-tag color="orange" size="small">需修改重提</a-tag>
    </div>
    <div class="cp-action-body">
      <a-alert type="warning" show-icon style="margin-bottom: 16px">
        <template #title>OA 审批结果已回写</template>
        <template #content> 您的停催申请 ST-20260708-0009 被驳回,驳回原因已同步到工单,可直接修改后重新提交。 </template>
      </a-alert>

      <a-descriptions :column="1" bordered size="small">
        <a-descriptions-item label="申请编号">ST-20260708-0009</a-descriptions-item>
        <a-descriptions-item label="客户">周志远</a-descriptions-item>
        <a-descriptions-item label="申请类型">停催</a-descriptions-item>
        <a-descriptions-item label="驳回原因">材料不全,缺少催收频次证据</a-descriptions-item>
        <a-descriptions-item label="驳回人">组长·赵</a-descriptions-item>
        <a-descriptions-item label="驳回时间">2026-07-13 14:00</a-descriptions-item>
      </a-descriptions>

      <a-divider style="margin: 16px 0" />

      <div style="font-size: 13px; margin-bottom: 8px">建议:补充客户投诉录音频次截图后重新提交</div>
    </div>
    <div class="cp-action-foot">
      <a-button @click="wb.removeTask(task.id)">稍后处理</a-button>
      <a-button type="primary" @click="confirm">修改并重新提交</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWorkbenchStore } from '@/stores/workbench'
import { Message } from '@arco-design/web-vue'

defineProps<{ task: any }>()
const wb = useWorkbenchStore()

function confirm() {
  wb.removeTask(undefined as any)
  Message.success('已打开修改页面')
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
.cp-action-foot {
  padding: 12px 20px;
  border-top: 1px solid var(--cp-border-light);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
