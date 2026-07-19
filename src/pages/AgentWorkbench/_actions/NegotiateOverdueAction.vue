<template>
  <div class="cp-action">
    <div class="cp-action-head">
      <h2 class="cp-action-title">
        <icon-warning style="color: var(--cp-danger)" />
        协商方案违约处理
      </h2>
      <a-tag color="red" size="small">已违约 5 天</a-tag>
    </div>
    <div class="cp-action-body">
      <a-alert type="error" show-icon style="margin-bottom: 16px">
        <template #title>系统已自动处理</template>
        <template #content>
          协商方案 NX-20260601-0078 已到期违约,催收系统已自动恢复。请尽快联系客户或升级处理。
        </template>
      </a-alert>

      <div class="cp-action-row"><span class="cp-label">方案编号</span><span>NX-20260601-0078</span></div>
      <div class="cp-action-row"><span class="cp-label">客户</span><span>王某某</span></div>
      <div class="cp-action-row">
        <span class="cp-label">违约记录</span><span style="color: var(--cp-danger)">已逾期 5 天</span>
      </div>
      <div class="cp-action-row">
        <span class="cp-label">催收状态</span><span style="color: var(--cp-success)">已恢复</span>
      </div>

      <a-divider style="margin: 16px 0" />

      <a-radio-group v-model="action" style="display: flex; flex-direction: column; gap: 8px">
        <a-radio value="re_negotiate">重新协商方案</a-radio>
        <a-radio value="upgrade">升级至管理层处理</a-radio>
        <a-radio value="record">仅记录违约,继续催收</a-radio>
      </a-radio-group>
    </div>
    <div class="cp-action-foot">
      <a-button @click="wb.removeTask(task.id)">稍后处理</a-button>
      <a-button type="primary" status="danger" @click="confirm">确认处置</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWorkbenchStore } from '@/stores/workbench'
import { Message } from '@arco-design/web-vue'

defineProps<{ task: any }>()
const wb = useWorkbenchStore()
const action = ref('re_negotiate')

function confirm() {
  wb.removeTask(undefined as any)
  Message.success(`已${action.value === 're_negotiate' ? '发起重新协商' : '处置'}该违约方案`)
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
.cp-action-foot {
  padding: 12px 20px;
  border-top: 1px solid var(--cp-border-light);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
