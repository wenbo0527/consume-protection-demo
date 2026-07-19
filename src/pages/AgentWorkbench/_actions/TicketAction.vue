<template>
  <div class="cp-action">
    <div class="cp-action-head">
      <h2 class="cp-action-title">处理工单</h2>
      <div class="cp-action-meta">
        <a-tag color="blue" size="small">{{ task?.source }}</a-tag>
        <a-tag size="small">{{ task?.customerName }}</a-tag>
      </div>
    </div>

    <div v-if="ticket" class="cp-action-body">
      <div class="cp-action-row">
        <span class="cp-label">工单号</span>
        <span class="cp-link">{{ ticket.id }}</span>
      </div>
      <div class="cp-action-row">
        <span class="cp-label">诉求描述</span>
        <span class="cp-value">{{ ticket.description }}</span>
      </div>

      <!-- 场景化知识推荐 -->
      <div v-if="relatedKnowledge.length" class="cp-know-box">
        <div class="cp-know-head">
          <icon-book style="color: var(--cp-brand)" />
          <span>相关知识推荐</span>
          <a-tag size="small" color="arcoblue">{{ ticket.category }} / {{ ticket.reason }}</a-tag>
        </div>
        <div v-for="k in relatedKnowledge" :key="k.id" class="cp-know-row">
          <div style="flex: 1; min-width: 0">
            <div style="font-size: 12px; font-weight: 500">{{ k.title }}</div>
            <div style="font-size: 11px; color: var(--cp-text-tertiary); margin-top: 2px">
              {{ k.content.slice(0, 60) }}...
            </div>
          </div>
          <a-button size="small" type="primary" @click="cite(k)">引用</a-button>
        </div>
      </div>

      <a-divider style="margin: 16px 0" />
      <div class="cp-action-row" style="flex-direction: column; align-items: stretch; gap: 8px">
        <span class="cp-label">处理意见</span>
        <a-textarea v-model="opinion" :rows="4" placeholder="请填写处理意见..." />
        <div v-if="cited.length" class="cp-cite-list">
          <icon-link />
          <a-tag v-for="c in cited" :key="c.id" size="small" closable @close="cited.splice(cited.indexOf(c), 1)">{{
            c.title
          }}</a-tag>
        </div>
      </div>

      <div class="cp-action-row" style="flex-direction: column; align-items: stretch; gap: 8px">
        <span class="cp-label">流转操作</span>
        <a-space>
          <a-button
            @click="
              wb.removeTask(task.id)
              Message.success('已转办')
            "
            >转办</a-button
          >
          <a-button
            @click="
              wb.removeTask(task.id)
              Message.success('已协办')
            "
            >协办</a-button
          >
          <a-button
            status="warning"
            @click="
              wb.removeTask(task.id)
              Message.success('已升级')
            "
            >升级</a-button
          >
        </a-space>
      </div>
    </div>

    <div class="cp-action-foot">
      <a-button @click="wb.removeTask(task.id)">稍后处理</a-button>
      <a-button type="primary" status="success" @click="close">关单</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWorkbenchStore } from '@/stores/workbench'
import { tickets, knowledge } from '@/mock/data'
import { Message } from '@arco-design/web-vue'

const props = defineProps<{ task: any }>()
const wb = useWorkbenchStore()
const opinion = ref('')
const cited = ref<any[]>([])

const ticket = computed(() => tickets.find((t) => t.id === props.task?.ticketId))
const relatedKnowledge = computed(() => {
  const t = ticket.value
  if (!t) return []
  return knowledge
    .filter((k) => k.relatedCategories?.includes(t.category) || k.relatedReasons?.includes(t.reason))
    .slice(0, 2)
})

function cite(k: any) {
  if (cited.value.find((c) => c.id === k.id)) return
  cited.value.push(k)
  opinion.value += `\n[引用 ${k.title}]`
  Message.success('已引用')
}

function close() {
  wb.removeTask(props.task.id)
  Message.success('工单已关单')
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
}
.cp-action-meta {
  display: flex;
  gap: 6px;
}
.cp-action-body {
  flex: 1;
  padding: 16px 20px;
  overflow-y: auto;
}
.cp-action-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  align-items: flex-start;
}
.cp-label {
  font-size: 12px;
  color: var(--cp-text-tertiary);
  min-width: 70px;
  padding-top: 4px;
}
.cp-value {
  font-size: 13px;
  color: var(--cp-text);
  flex: 1;
  line-height: 1.6;
}
.cp-link {
  font-size: 13px;
  color: var(--cp-brand);
  font-family: 'DIN Alternate', monospace;
  cursor: pointer;
}
.cp-action-foot {
  padding: 12px 20px;
  border-top: 1px solid var(--cp-border-light);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.cp-know-box {
  background: var(--cp-brand-soft);
  border-radius: 6px;
  padding: 12px;
  border-left: 3px solid var(--cp-brand);
}
.cp-know-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
}
.cp-know-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #fff;
  border-radius: 4px;
  margin-bottom: 6px;
}
.cp-cite-list {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 6px 8px;
  background: var(--cp-bg-soft);
  border-radius: 4px;
  font-size: 12px;
  color: var(--cp-text-tertiary);
}
</style>
