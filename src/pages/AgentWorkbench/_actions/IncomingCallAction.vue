<template>
  <div class="cp-action">
    <div class="cp-action-head">
      <h2 class="cp-action-title">
        <icon-phone style="color: var(--cp-success)" />
        通话中 - {{ task?.customerName }}
      </h2>
      <a-tag color="green" size="small">通话 {{ duration }}</a-tag>
    </div>
    <div class="cp-action-body">
      <div v-if="customer" class="cp-call-banner">
        <div class="cp-call-name">{{ customer.name }}</div>
        <div class="cp-call-phone">{{ customer.phone }}</div>
        <div style="display: flex; gap: 4px; justify-content: center; margin-top: 8px">
          <risk-tag v-for="t in customer.riskTags" :key="t" :type="t" />
        </div>
      </div>

      <a-alert v-if="alertLevel" :type="alertLevel.type" show-icon style="margin-bottom: 12px">
        <template #title>{{ alertLevel.title }}</template>
        <template #content>
          <div style="margin-top: 6px"><b>推荐动作:</b>
            <a-tag v-for="a in alertLevel.actions" :key="a" color="red" size="small" style="margin-left: 4px">{{ a }}</a-tag>
          </div>
        </template>
      </a-alert>

      <div class="cp-call-actions">
        <a-button block @click="wb.hangup(); wb.removeTask(task.id)">
          <icon-close /> 通话结束 - 不建单
        </a-button>
        <a-button block type="primary" @click="createTicket">
          <icon-plus /> 通话结束 - 创建工单
        </a-button>
        <a-button block status="success" @click="hangupAndAssociate">
          <icon-link /> 关联已有工单
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue'
import { useWorkbenchStore } from '@/stores/workbench'
import { customers } from '@/mock/data'
import RiskTag from '@/components/RiskTag.vue'
import { Message } from '@arco-design/web-vue'

const props = defineProps<{ task: any }>()
const wb = useWorkbenchStore()
const sec = ref(0)
const timer = setInterval(() => sec.value++, 1000)
onUnmounted(() => clearInterval(timer))

const duration = computed(() => {
  const m = Math.floor(sec.value / 60)
  const s = sec.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const customer = computed(() => customers.find(c => c.id === props.task?.customerId))

const alertLevel = computed(() => {
  if (!customer.value) return null
  if (customer.value.riskTags.includes('threat')) return { type: 'error' as const, title: '紧急:扬言客户', actions: ['转紧急流程', '通知组长'] }
  if (customer.value.riskTags.includes('blacklist')) return { type: 'error' as const, title: '警示:黑名单', actions: ['转接组长'] }
  if (customer.value.riskTags.includes('agent')) return { type: 'warning' as const, title: '注意:异常代理', actions: ['开启录音'] }
  return null
})

function createTicket() {
  wb.hangup()
  Message.success('通话结束,跳转创建工单...')
}
function hangupAndAssociate() {
  wb.hangup()
  wb.removeTask(props.task.id)
  Message.success('已关联现有工单')
}
</script>

<style scoped>
.cp-action { display: flex; flex-direction: column; height: 100%; }
.cp-action-head { padding: 16px 20px; border-bottom: 1px solid var(--cp-border-light); display: flex; justify-content: space-between; align-items: center; }
.cp-action-title { font-size: 16px; font-weight: 600; margin: 0; display: flex; align-items: center; gap: 8px; }
.cp-action-body { padding: 20px; overflow-y: auto; }
.cp-call-banner { text-align: center; padding: 24px 0; border-bottom: 1px dashed var(--cp-border-light); margin-bottom: 16px; }
.cp-call-name { font-size: 24px; font-weight: 600; }
.cp-call-phone { font-size: 14px; color: var(--cp-text-tertiary); margin-top: 4px; font-family: 'DIN Alternate', monospace; }
.cp-call-actions { display: flex; flex-direction: column; gap: 8px; }
</style>