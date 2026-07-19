<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">创建工单</h1>
        <div class="cp-page-subtitle">三维标签必选 · 自动分单 · 同类工单重复检测</div>
      </div>
      <a-space>
        <a-button @click="$router.back()">取消</a-button>
        <a-button type="primary" :disabled="!canSubmit" @click="submit">提交建单</a-button>
      </a-space>
    </div>

    <!-- 重复工单检测 -->
    <a-alert v-if="dupAlert" type="warning" style="margin-bottom: 16px" show-icon>
      <template #title>
        重复工单检测命中(来源:
        <a-tag size="small" :color="dupSourceColor">{{ dupSourceLabel }}</a-tag>)
      </template>
      <template #content>
        <div style="margin-top: 6px">
          客户 <b>{{ dupAlert.customerName }}</b>({{ dupAlert.type }}) 已有同类工单 <a-link>{{ dupAlert.id }}</a-link> 正在处理中({{ dupAlert.node }})
          <div style="font-size: 12px; color: var(--cp-text-tertiary); margin-top: 4px">
            检测来源:
            <span v-if="dupAlert.source === 'tickets'">工单池</span>
            <span v-else-if="dupAlert.source === 'workflow'">工作流实例</span>
            <span v-else>客户画像 ongoingTickets</span>
          </div>
          <div style="margin-top: 8px; display: flex; gap: 8px">
            <a-button size="small" type="primary" status="warning" @click="$router.push(`/agent/ticket/${dupAlert.id}`)">关联已有工单</a-button>
            <a-button size="small" @click="dupAlert = null">继续新建</a-button>
          </div>
        </div>
      </template>
    </a-alert>

    <div class="cp-card" style="padding: 24px 32px">
      <a-steps :current="step" style="margin-bottom: 28px">
        <a-step description="查询客户信息">客户信息</a-step>
        <a-step description="工单性质×业务类别×投诉原因">三维标签</a-step>
        <a-step description="诉求描述与材料">详细信息</a-step>
        <a-step description="确认并提交">完成</a-step>
      </a-steps>

      <!-- Step 1 -->
      <div v-show="step === 0">
        <a-form :model="form">
          <a-row :gutter="24">
            <a-col :span="12">
              <a-form-item label="客户标识" required>
                <a-input v-model="form.customerId" placeholder="输入身份证号或手机号" @blur="lookupCustomer">
                  <template #prefix><icon-user /></template>
                </a-input>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="紧急程度" required>
                <a-radio-group v-model="form.urgency">
                  <a-radio value="special">特急 (1天内)</a-radio>
                  <a-radio value="urgent">紧急 (3天内)</a-radio>
                  <a-radio value="normal">普通 (7天内)</a-radio>
                </a-radio-group>
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item label="渠道来源" required>
            <a-select v-model="form.channel">
              <a-option value="电话">电话</a-option>
              <a-option value="在线客服">在线客服</a-option>
              <a-option value="APP">APP</a-option>
              <a-option value="12378">12378 监管转办</a-option>
              <a-option value="12345">12345 市民热线</a-option>
            </a-select>
          </a-form-item>
          <a-form-item v-if="customer">
            <a-alert type="info" show-icon>
              <template #title>客户 {{ customer.name }} ({{ customer.idCardMask }})</template>
              <template #content>
                <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 6px">
                  <span>授信状态: <b>{{ statusMap[customer.creditStatus] }}</b></span>
                  <span>在贷余额: <b class="mono">{{ customer.loanBalance }} 元</b></span>
                  <span>历史投诉: <b>{{ customer.complaintCount6m }} 次</b></span>
                  <risk-tag v-for="tag in customer.riskTags" :key="tag" :type="tag" />
                </div>
              </template>
            </a-alert>
          </a-form-item>
        </a-form>
      </div>

      <!-- Step 2 -->
      <div v-show="step === 1">
        <a-form :model="form">
          <a-form-item label="工单性质" required>
            <a-radio-group v-model="form.type" @change="recheckDup">
              <a-radio value="consult">咨询</a-radio>
              <a-radio value="complaint">投诉</a-radio>
              <a-radio value="external">外部转办</a-radio>
              <a-radio value="mediate">调解</a-radio>
              <a-radio value="issue">信息开具</a-radio>
              <a-radio value="suggest">建议</a-radio>
              <a-radio value="praise">表扬</a-radio>
            </a-radio-group>
          </a-form-item>
          <a-row :gutter="24">
            <a-col :span="12">
              <a-form-item label="业务类别" required>
                <a-select v-model="form.category">
                  <a-option>贷款</a-option>
                  <a-option>债务催收</a-option>
                  <a-option>个人金融信息</a-option>
                  <a-option>定价收费</a-option>
                  <a-option>支付结算</a-option>
                  <a-option>其他</a-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="投诉原因" required>
                <a-select v-model="form.reason">
                  <a-option>催收频次</a-option>
                  <a-option>息费争议</a-option>
                  <a-option>协商还款</a-option>
                  <a-option>身份核验</a-option>
                  <a-option>额度查询</a-option>
                  <a-option>信息泄露</a-option>
                  <a-option>结清证明</a-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item label="关联借据">
            <a-select v-if="customer" multiple placeholder="可关联多个借据">
              <a-option :value="`${customer.id}-J01`">借据 J01 - 余额 {{ customer.loanBalance }} 元</a-option>
            </a-select>
          </a-form-item>
        </a-form>
      </div>

      <!-- Step 3 -->
      <div v-show="step === 2">
        <a-form :model="form">
          <a-form-item label="诉求描述" required>
            <a-textarea v-model="form.description" :rows="6" placeholder="请详细记录客户诉求..." :max-length="500" show-word-limit />
          </a-form-item>
          <a-form-item label="上传材料">
            <a-upload :auto-upload="false" list-type="picture-card" />
          </a-form-item>
          <a-form-item label="是否监管件">
            <a-switch v-model="form.isRegulator" />
            <span style="margin-left: 12px; color: var(--cp-text-tertiary)">监管件将自动升级处理优先级</span>
          </a-form-item>
        </a-form>
      </div>

      <!-- Step 4 -->
      <div v-show="step === 3">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="客户">{{ customer?.name || '-' }}</a-descriptions-item>
          <a-descriptions-item label="紧急度">{{ form.urgency }}</a-descriptions-item>
          <a-descriptions-item label="渠道">{{ form.channel }}</a-descriptions-item>
          <a-descriptions-item label="是否监管件">{{ form.isRegulator ? '是' : '否' }}</a-descriptions-item>
          <a-descriptions-item label="工单性质">{{ form.type }}</a-descriptions-item>
          <a-descriptions-item label="业务类别">{{ form.category }}</a-descriptions-item>
          <a-descriptions-item label="投诉原因">{{ form.reason }}</a-descriptions-item>
          <a-descriptions-item label="自动分单至">{{ dispatchResult?.assignee || '匹配中...' }}</a-descriptions-item>
          <a-descriptions-item :span="2" label="诉求描述">{{ form.description }}</a-descriptions-item>
        </a-descriptions>
      </div>

      <div style="margin-top: 24px; display: flex; justify-content: space-between">
        <a-button :disabled="step === 0" @click="step--">上一步</a-button>
        <a-button v-if="step < 3" type="primary" @click="step++">下一步</a-button>
        <a-button v-else type="primary" status="success" @click="onFinish">确认提交</a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { customers, tickets as mockTickets } from '@/mock/data'
import { dispatchRules } from '@/mock/data_ext'
import { useWorkflowStore } from '@/stores/workflow'
import RiskTag from '@/components/RiskTag.vue'
import { Message } from '@arco-design/web-vue'

const router = useRouter()
const wf = useWorkflowStore()
const step = ref(0)

const form = reactive({
  customerId: '',
  urgency: 'normal' as 'special' | 'urgent' | 'normal',
  channel: '电话',
  type: 'consult' as any,
  category: '贷款',
  reason: '',
  description: '',
  isRegulator: false
})

const customer = ref<any>(null)
const dupAlert = ref<any>(null)

// 分单规则引擎:按 渠道×类型×紧急度 自动匹配
const dispatchResult = computed(() => {
  if (!form.channel || !form.type) return null
  const urgencyMap: Record<string, string> = { special: '特急', urgent: '紧急', normal: '普通' }
  const u = urgencyMap[form.urgency]
  const typeMap: Record<string, string> = { consult: '咨询', complaint: '投诉', external: '外部转办', mediate: '调解' }
  const t = typeMap[form.type] || form.type
  const sorted = [...dispatchRules].filter(r => r.enabled).sort((a, b) => a.priority - b.priority)
  const hit = sorted.find(r =>
    (r.channel === form.channel || r.channel === '全部') &&
    (r.type === t || r.type === '全部') &&
    (r.urgency === u || r.urgency === '全部')
  )
  if (!hit) return null
  return {
    rule: `渠道=${hit.channel} × 类型=${hit.type} × 紧急度=${hit.urgency}`,
    assignee: hit.assign,
    priority: hit.priority
  }
})

const statusMap: Record<string, string> = { normal: '正常', overdue: '逾期', frozen: '冻结' }

/**
 * OPT-FIX-4 / P1-6:重复工单检测
 * 三源合一查重:
 * 1) customer.ongoingTickets(原能力,持续保留)
 * 2) workflow.instances 同客户的同 kind 的 running/approved 实例
 * 3) mock data tickets 中同客户的未关单 工单(priority 不限,只要 status 不是 closed)
 * 命中任一源 → 显示 alert;按钮可关联/继续新建
 */
function lookupCustomer() {
  customer.value = customers.find(c => c.idCardMask.includes(form.customerId.slice(-4)) || c.phone.includes(form.customerId.slice(-4))) || null
  if (!customer.value) {
    dupAlert.value = null
    return
  }

  const c = customer.value as any
  const customerId = c.id

  // 源 1:customer.ongoingTickets
  const fromCustomerTickets = c.ongoingTickets?.find((t: any) => t.type === form.type)

  // 源 2:workflow.instances 中同 customerId,排除 finished/expired
  const fromWf = wf.instances.find(w =>
    w.customerId === customerId
    && w.status === 'running'
    && wf.templateByKind(w.kind)?.nodes[0]?.fields?.some(f => f.options?.includes(form.type))
  )

  // 源 3:mock tickets 中同客户 + 同 type + 不在 closed 终态
  const fromMock = (mockTickets as any[])?.find(t =>
    t.customerId === customerId
    && t.type === form.type
    && t.status !== 'closed'
    && t.status !== 'finished'
  )

  // 选取优先级最高的一处作为 alert
  const hit = fromMock || fromWf || fromCustomerTickets
  if (hit) {
    dupAlert.value = {
      source: fromMock ? 'tickets' : fromWf ? 'workflow' : 'customer',
      customerName: c.name,
      id: hit.id,
      node: hit.node || hit.currentNode || '处理中',
      type: form.type
    }
    return
  }

  dupAlert.value = null
}

/** 当用户切换 form.type 时重新跑一遍查重(不重新查客户) */
function recheckDup() {
  if (!customer.value) return
  lookupCustomer()
}

const canSubmit = computed(() => form.customerId && form.type && form.category && form.description)

/** 重复工单检测来源标签颜色 + 名称(OPT-FIX-4) */
const dupSourceColor = computed(() => {
  if (!dupAlert.value) return 'gray'
  return ({ tickets: 'red', workflow: 'orange', customer: 'gray' } as Record<string, string>)[dupAlert.value.source] || 'gray'
})
const dupSourceLabel = computed(() => {
  if (!dupAlert.value) return ''
  return ({ tickets: '工单池', workflow: '工作流', customer: '客户档案' } as Record<string, string>)[dupAlert.value.source] || '未知'
})

function submit() {
  // 三维自动打标 + 客户标签联动:命中黑名单/扬言,自动生成 alert_directive 工作流给管理层
  // 这条工作流会由管理层处置后给坐席下达指令,坐席在工作流待办中执行
  if (customer.value) {
    const tags = customer.value.riskTags || []
    const newTicketId = `GD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`

    if (tags.includes('threat') || tags.includes('blacklist')) {
      const inst = wf.start({
        kind: 'alert_directive',
        initiator: '张敏',
        initiatorRole: 'agent',
        customerId: customer.value.id,
        customerName: customer.value.name,
        ticketId: newTicketId,
        payload: {
          instruction: `${customer.value.name}(${customer.value.id})提交了新工单 ${newTicketId},客户含${tags.includes('threat') ? '扬言' : '黑名单'}标签,请管理层确认处置方案。`,
          assignTo: '张敏',
          alertTitle: `新建工单含风险标签 · ${newTicketId}`,
          source: 'TicketCreate'
        }
      })
      Message.warning(`工单已提交,因客户含 ${tags.includes('threat') ? '扬言' : '黑名单'} 标签,已自动生成指令实例 ${inst?.id || ''} 通知管理层`)
    } else if (form.isRegulator) {
      // 监管件:生成 review_archive 工作流的简化版,或直接走预警
      const inst = wf.start({
        kind: 'alert_directive',
        initiator: '张敏',
        initiatorRole: 'agent',
        customerId: customer.value.id,
        customerName: customer.value.name,
        ticketId: newTicketId,
        payload: {
          instruction: `新建监管件 ${newTicketId},SLA 紧迫,请尽快处置。`,
          assignTo: '张敏',
          alertTitle: `新建监管件 · ${newTicketId}`,
          source: 'TicketCreate-regulator'
        }
      })
      Message.success(`监管件 ${newTicketId} 已提交,自动通知管理层(${inst?.id || ''})`)
    } else {
      Message.success('工单已提交,自动分单完成')
    }
  } else {
    Message.success('工单已提交,自动分单完成')
  }
  router.push('/agent/todo')
}

function onFinish() {
  submit()
}
</script>