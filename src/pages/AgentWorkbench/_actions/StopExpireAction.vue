<template>
  <div class="cp-action">
    <div class="cp-action-head">
      <h2 class="cp-action-title">
        <icon-pause-circle style="color: var(--cp-warning)" />
        停催即将到期
      </h2>
      <a-tag color="orange" size="small">明天到期</a-tag>
    </div>
    <div class="cp-action-body">
      <a-alert type="warning" show-icon style="margin-bottom: 16px">
        <template #title>到期前 24 小时提醒</template>
        <template #content>
          客户刘建国的停催申请 ST-20260710-0001 将于明天 11:00 到期,系统将自动恢复催收。建议提前与客户确认是否续期。
        </template>
      </a-alert>

      <div class="cp-action-row">
        <span class="cp-label">申请编号</span><span>ST-20260710-0001</span>
      </div>
      <div class="cp-action-row">
        <span class="cp-label">客户</span><span>刘建国</span>
      </div>
      <div class="cp-action-row">
        <span class="cp-label">期限</span><span>15 天</span>
      </div>
      <div class="cp-action-row">
        <span class="cp-label">到期时间</span><span class="mono">2026-07-16 11:00</span>
      </div>

      <a-divider style="margin: 16px 0" />

      <div style="font-size: 13px; font-weight: 500; margin-bottom: 8px">处置动作</div>
      <a-space direction="vertical" style="width: 100%">
        <a-radio-group v-model="choice" style="display: flex; flex-direction: column; gap: 8px">
          <a-radio value="renew">一键续期(自动填充上次申请信息)</a-radio>
          <a-radio value="end">到期自动恢复催收</a-radio>
          <a-radio value="contact">先与客户沟通再决定</a-radio>
        </a-radio-group>
      </a-space>
    </div>
    <div class="cp-action-foot">
      <a-button @click="wb.removeTask(task.id)">稍后处理</a-button>
      <a-button type="primary" @click="confirm">确认处置</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWorkbenchStore } from '@/stores/workbench'
import { Message } from '@arco-design/web-vue'

defineProps<{ task: any }>()
const wb = useWorkbenchStore()
const choice = ref('renew')

function confirm() {
  wb.removeTask(undefined as any)
  Message.success(`已${choice.value === 'renew' ? '续期' : '处理'}`)
}
</script>

<style scoped>
.cp-action { display: flex; flex-direction: column; height: 100%; }
.cp-action-head { padding: 16px 20px; border-bottom: 1px solid var(--cp-border-light); display: flex; justify-content: space-between; align-items: center; }
.cp-action-title { font-size: 16px; font-weight: 600; margin: 0; display: flex; align-items: center; gap: 8px; }
.cp-action-body { flex: 1; padding: 16px 20px; overflow-y: auto; }
.cp-action-row { display: flex; gap: 12px; margin-bottom: 10px; }
.cp-label { font-size: 12px; color: var(--cp-text-tertiary); min-width: 70px; }
.cp-action-foot { padding: 12px 20px; border-top: 1px solid var(--cp-border-light); display: flex; justify-content: flex-end; gap: 8px; }
</style>