<template>
  <div class="cp-desk">
    <!-- 顶部状态栏 -->
    <div class="cp-desk-header">
      <div class="cp-desk-status">
        <span :class="['cp-status-dot', `cp-status-${wb.agentStatus}`]"></span>
        <span class="cp-status-label">{{ statusText }}</span>
        <span v-if="wb.call" class="cp-call-time mono">{{ formatDuration(wb.call.duration) }}</span>
        <span v-if="wb.call" class="cp-call-name">· 通话中:{{ wb.call.customerName }}</span>
      </div>
      <a-space :size="8">
        <a-button
          size="small"
          :type="ready ? 'primary' : 'outline'"
          :disabled="wb.agentStatus === 'oncall'"
          @click="toggleReady"
        >
          <icon-phone v-if="!ready" /> <icon-pause v-else />
          {{ ready ? '已开启接线 - 停止' : '开启接线' }}
        </a-button>
        <a-button size="small" @click="simulateIncoming">
          <icon-plus /> 模拟来电
        </a-button>
      </a-space>
    </div>

    <!-- 客户列表 -->
    <div class="cp-desk-body">
      <div class="cp-desk-main">
        <div class="cp-main-head">
          <h2 class="cp-main-title">
            客户待办列表
            <a-tag size="small">{{ todoCustomers.length }} 位客户 · {{ totalTickets }} 张工单</a-tag>
          </h2>
          <a-input-search
            v-model="searchKey"
            placeholder="搜索客户姓名/手机号/工单号"
            style="width: 280px"
            allow-clear
          />
        </div>

        <!-- 4 个统计 -->
        <div class="cp-stat-row" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 12px">
          <div class="cp-stat-card">
            <div class="cp-stat-label">待办客户</div>
            <div class="cp-stat-value mono">{{ todoCustomers.length }}</div>
          </div>
          <div class="cp-stat-card">
            <div class="cp-stat-label">监管件</div>
            <div class="cp-stat-value mono" style="color: var(--cp-warning)">{{ regCount }}</div>
          </div>
          <div class="cp-stat-card">
            <div class="cp-stat-label">扬言/黑名单</div>
            <div class="cp-stat-value mono" style="color: var(--cp-danger)">{{ dangerCount }}</div>
          </div>
          <div class="cp-stat-card">
            <div class="cp-stat-label">今日已处理</div>
            <div class="cp-stat-value mono" style="color: var(--cp-success)">12</div>
          </div>
        </div>

        <!-- 列表 -->
        <div class="cp-customer-list">
          <div
            v-for="c in filteredCustomers"
            :key="c.id"
            class="cp-customer-row"
            :class="{ 'is-danger': hasDanger(c) }"
          >
            <div class="cp-row-avatar" :class="{ 'is-danger': hasDanger(c) }">
              {{ c.name.charAt(0) }}
            </div>

            <!-- 客户名 → 跳画像 -->
            <div class="cp-row-name-block">
              <a-link class="cp-row-name" @click="$router.push(`/agent/customer/${c.id}`)">{{ c.name }}</a-link>
              <risk-tag v-for="t in c.riskTags" :key="t" :type="t" />
            </div>

            <!-- 客户基本信息 -->
            <div class="cp-row-info">
              <div class="cp-row-meta">
                <span class="mono">{{ c.phone }}</span>
                <span>·</span>
                <span>在贷 <b class="mono">¥{{ c.loanBalance.toLocaleString() }}</b></span>
                <span>·</span>
                <span>逾期 {{ c.maxOverdueDays }} 天</span>
                <span>·</span>
                <span>近 6 月投诉 {{ c.complaintCount6m }} 次</span>
              </div>
              <div class="cp-row-tickets">
                <a-tag
                  v-for="t in c.ongoingTickets"
                  :key="t.id"
                  size="small"
                  :color="ticketTagColor(t)"
                  class="cp-ticket-pill"
                  @click="openTicket(t.id)"
                >
                  {{ t.id }} · {{ t.type }} · {{ t.node }}
                </a-tag>
              </div>
            </div>

            <!-- 操作 -->
            <div class="cp-row-actions">
              <a-space direction="vertical" :size="4">
                <a-button
                  size="small"
                  type="primary"
                  :disabled="wb.agentStatus === 'oncall'"
                  @click="manualCall(c)"
                >
                  <icon-phone /> 拨号
                </a-button>
                <a-button size="small" @click="openStartWorkflow(c)">
                  <icon-send /> 发起业务
                </a-button>
              </a-space>
            </div>
          </div>
        </div>

        <a-empty v-if="!filteredCustomers.length" description="暂无待办客户" />
      </div>
    </div>

    <!-- 来电弹屏 -->
    <a-modal
      :visible="!!wb.incoming"
      :footer="false"
      :closable="false"
      :mask-closable="false"
      width="460px"
      wrap-class-name="cp-incoming-modal"
    >
      <div v-if="wb.incoming" class="cp-incoming">
        <div class="cp-incoming-pulse">
          <icon-phone :size="36" />
        </div>
        <div class="cp-incoming-title">{{ wb.incoming.title }}</div>
        <div class="cp-incoming-desc">{{ wb.incoming.desc }}</div>
        <div v-if="incomingCustomer" style="display: flex; gap: 4px; justify-content: center; margin-top: 10px">
          <risk-tag v-for="t in incomingCustomer.riskTags" :key="t" :type="t" />
        </div>
        <!-- OPT-3:命中标签规则时的预览 -->
        <div v-if="incomingAlert" style="margin-top: 14px; padding: 10px 12px; border-radius: 6px; background: rgba(245, 34, 45, 0.08); border: 1px solid rgba(245, 34, 45, 0.2)">
          <div style="font-weight: 600; color: #f5222d; font-size: 13px">
            <icon-warning /> {{ incomingAlert.title }}
          </div>
          <div style="font-size: 12px; color: var(--cp-text-secondary); margin-top: 4px">
            <template v-for="(a, i) in incomingAlert.actions" :key="i">
              <a-tag color="red" size="small" style="margin-right: 4px">{{ a }}</a-tag>
            </template>
          </div>
          <div v-if="incomingHitRules.length" style="font-size: 11px; color: var(--cp-text-tertiary); margin-top: 4px">
            命中 {{ incomingHitRules.length }} 条规则:
            <span style="margin-left: 4px">{{ incomingHitRules.map(r => r.ruleName).join(' · ') }}</span>
          </div>
        </div>
        <div class="cp-incoming-actions">
          <a-button size="large" @click="declineCall">拒接</a-button>
          <a-button size="large" type="primary" status="success" @click="answerCall">
            <icon-phone /> 接通
          </a-button>
        </div>
      </div>
    </a-modal>

    <!-- 工单详情 Modal(接通后跳转前的兜底,保留但不再自动弹出) -->
    <a-modal
      v-model:visible="ticketModalVisible"
      :footer="false"
      width="880px"
      wrap-class-name="cp-ticket-modal"
    >
      <TicketDetail v-if="ticketModalVisible" :ticket-id="activeTicketId" :embedded="true" @close="ticketModalVisible = false" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkbenchStore } from '@/stores/workbench'
import { useTagRuleStore, RiskTag as RiskTagType } from '@/stores/tagRule'
import { customers, tickets } from '@/mock/data'
import RiskTag from '@/components/RiskTag.vue'
import TicketDetail from './TicketDetail.vue'
import StartWorkflowModal from '@/components/StartWorkflowModal.vue'
import WorkflowTodosCard from '@/components/WorkflowTodosCard.vue'
import { Message } from '@arco-design/web-vue'

const router = useRouter()
const wb = useWorkbenchStore()

const ready = ref(true)

const searchKey = ref('')
const ticketModalVisible = ref(false)
const activeTicketId = ref('')

let timer: any = null
let isMounted = false
onMounted(() => {
  isMounted = true
  timer = setInterval(() => {
    if (!isMounted) {
      if (timer) { clearInterval(timer); timer = null }
      return
    }
    if (wb.call) wb.call.duration = Math.floor((Date.now() - wb.call.startAt) / 1000)
  }, 1000)
})
onUnmounted(() => {
  isMounted = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})

// 当前坐席
const ME = '张敏'

// 工作流发起弹窗状态(放在 ME 之后以便引用)
const workflowModalVisible = ref(false)
const workflowTarget = ref<any>(null)
function openStartWorkflow(c?: any) {
  workflowTarget.value = c || null
  workflowModalVisible.value = true
}
function onWorkflowStarted(_inst: any) {
  // 发起后无需特别处理,store 自动更新,WorkflowTodosCard 会自动刷新
}
function goWorkflowMonitor() {
  router.push('/manage/workflow-monitor')
}

const todoCustomers = computed(() =>
  customers.filter(c => c.ongoingTickets.length > 0 && c.ongoingTickets.some(t => t.handler === ME || t.handler === '待分派'))
)

const totalTickets = computed(() => todoCustomers.value.reduce((sum, c) => sum + c.ongoingTickets.length, 0))
const regCount = computed(() => tickets.filter(t => t.isRegulator && t.handler === ME && t.status !== 'closed').length)
const dangerCount = computed(() => todoCustomers.value.filter(c => c.riskTags.includes('threat') || c.riskTags.includes('blacklist')).length)

const filteredCustomers = computed(() => {
  if (!searchKey.value) return todoCustomers.value
  const k = searchKey.value.toLowerCase()
  return todoCustomers.value.filter(c =>
    c.name.includes(k) || c.phone.includes(k) ||
    c.ongoingTickets.some(t => t.id.toLowerCase().includes(k))
  )
})

function hasDanger(c: any) {
  return c.riskTags.includes('threat') || c.riskTags.includes('blacklist')
}

function ticketTagColor(t: any) {
  if (t.type === '外部转办') return 'orangered'
  if (t.type === '投诉') return 'red'
  if (t.type === '咨询') return 'arcoblue'
  return 'gray'
}

function openTicket(id: string) {
  activeTicketId.value = id
  ticketModalVisible.value = true
}

function toggleReady() {
  ready.value = !ready.value
  if (!ready.value) {
    wb.setIdle()
    Message.info('已停止接线')
  } else {
    Message.success('已开启接线,等待来电')
  }
}

function manualCall(c: any) {
  if (c.ongoingTickets.length > 0) {
    openTicket(c.ongoingTickets[0].id)
  } else {
    Message.info('该客户暂无待办工单')
  }
}

const incomingCustomer = computed(() => {
  const cid = wb.incoming?.customerId
  return cid ? customers.find(c => c.id === cid) : null
})

// OPT-3:来电客户命中的标签规则(给坐席接通前预览)
const tagRuleStore = useTagRuleStore()
const incomingAlert = computed(() => {
  if (!incomingCustomer.value) return null
  return tagRuleStore.firstAlert(incomingCustomer.value.riskTags as RiskTagType[])
})
const incomingHitRules = computed(() => {
  if (!incomingCustomer.value) return []
  return tagRuleStore.applyToCustomer(incomingCustomer.value.riskTags as RiskTagType[]).hitRules
})

function simulateIncoming() {
  if (!ready.value) {
    Message.warning('当前未开启接线,请先开启')
    return
  }
  const target = todoCustomers.value[Math.floor(Math.random() * todoCustomers.value.length)]
  if (!target) {
    Message.warning('暂无待办客户可模拟')
    return
  }
  wb.triggerIncoming({
    id: 'INC-' + Date.now(),
    type: 'incoming_call',
    title: `来电:${target.name}`,
    desc: `${target.phone} · ${target.riskTags.length ? '高风险客户' : '普通客户'}`,
    priority: hasDanger(target) ? 'critical' : 'high',
    customerId: target.id,
    customerName: target.name,
    createdAt: new Date().toISOString(),
    source: '呼叫中心'
  })
}

function answerCall() {
  const custId = wb.incoming?.customerId
  if (!custId) {
    Message.warning('来电信息缺失,无法接通')
    return
  }
  // eslint-disable-next-line no-console
  console.log('[cp-agent-desk] answerCall', { custId })
  wb.answerCall()
  Message.success('通话已接通,跳转客户详情')
  // 跳转到带 call=1 的客户详情页,接通后的工作菜单在该页承载
  router.push(`/agent/customer/${custId}?call=1`)
}

function declineCall() {
  wb.incoming = null
  wb.setIdle()
}

const statusText = computed(() => {
  const map: Record<string, string> = {
    idle: ready.value ? '空闲 · 接线中' : '休息',
    ringing: '振铃中',
    oncall: '通话中',
    wrapup: '话后整理',
    break: '休息'
  }
  return map[wb.agentStatus] || '空闲'
})

function formatDuration(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
</script>

<style scoped>
.cp-desk { display: flex; flex-direction: column; height: calc(100vh - 56px); }

/* 顶部 */
.cp-desk-header {
  background: #fff; padding: 10px 24px;
  border-bottom: 1px solid var(--cp-border-light);
  display: flex; justify-content: space-between; align-items: center;
  flex-shrink: 0;
}
.cp-desk-status { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.cp-status-dot { width: 8px; height: 8px; border-radius: 50%; }
.cp-status-idle { background: #c9cdd4; }
.cp-status-ringing { background: var(--cp-warning); animation: cp-pulse 1s infinite; }
.cp-status-oncall { background: var(--cp-success); box-shadow: 0 0 0 4px rgba(0, 180, 42, 0.15); }
.cp-status-wrapup { background: var(--cp-brand); }
.cp-status-label { font-weight: 500; }
.cp-call-time { font-size: 13px; color: var(--cp-success); font-weight: 600; font-family: 'DIN Alternate', monospace; }
.cp-call-name { font-size: 12px; color: var(--cp-text-secondary); }

/* 主体:仅客户列表 */
.cp-desk-body {
  flex: 1;
  padding: 12px 16px;
  overflow: hidden;
  display: flex;
}
.cp-desk-main {
  flex: 1;
  background: #fff;
  border: 1px solid var(--cp-border-light);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.cp-main-head {
  padding: 14px 20px;
  border-bottom: 1px solid var(--cp-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.cp-main-title {
  font-size: 15px; font-weight: 600; margin: 0;
  display: flex; align-items: center; gap: 10px;
}

.cp-customer-list { flex: 1; overflow-y: auto; }

/* 列表行:头像 + 客户名(可跳画像) + 信息 + 操作 */
.cp-customer-row {
  display: grid;
  grid-template-columns: 40px 220px 1fr 100px;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--cp-border-light);
  transition: background 0.15s;
}
.cp-customer-row:hover { background: var(--cp-bg-hover); }
.cp-customer-row.is-danger { background: #fff8f5; border-left: 3px solid var(--cp-danger); }
.cp-customer-row.is-danger:hover { background: #ffefe8; }

.cp-row-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--cp-brand-soft);
  color: var(--cp-brand);
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 14px;
  flex-shrink: 0;
}
.cp-row-avatar.is-danger { background: var(--cp-danger-soft); color: var(--cp-danger); }

.cp-row-name-block {
  display: flex; flex-direction: column; gap: 6px;
}
.cp-row-name { font-size: 14px; font-weight: 600; color: var(--cp-text); }

.cp-row-info { min-width: 0; }
.cp-row-meta { font-size: 12px; color: var(--cp-text-tertiary); display: flex; gap: 6px; flex-wrap: wrap; }
.cp-row-tickets { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px; }
.cp-ticket-pill { cursor: pointer; }
.cp-ticket-pill:hover { opacity: 0.8; }

.cp-row-actions { flex-shrink: 0; padding-top: 6px; text-align: right; }

/* 来电弹屏 */
:global(.cp-incoming-modal .arco-modal-content) { padding: 32px 24px; text-align: center; }
.cp-incoming-pulse {
  width: 72px; height: 72px; border-radius: 50%;
  background: linear-gradient(135deg, var(--cp-brand), var(--cp-brand-hover));
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 14px;
  animation: cp-pulse 1.5s ease-in-out infinite;
  box-shadow: 0 0 0 8px var(--cp-brand-soft);
}
.cp-incoming-title { font-size: 18px; font-weight: 600; color: var(--cp-text); }
.cp-incoming-desc { font-size: 13px; color: var(--cp-text-tertiary); margin-top: 4px; }
.cp-incoming-actions {
  display: flex; gap: 12px; justify-content: center;
  margin-top: 24px;
}
.cp-incoming-actions .arco-btn { min-width: 100px; }

@keyframes cp-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 工单 Modal */
:global(.cp-ticket-modal .arco-modal-content) { padding: 0; }
:global(.cp-ticket-modal .arco-modal-header) { display: none; }
</style>