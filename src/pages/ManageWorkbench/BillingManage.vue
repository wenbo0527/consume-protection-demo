<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">票据合同</h1>
        <div class="cp-page-subtitle">合同模板 · 合同生成 · 票开具据 · 贷后发送 · 归档</div>
      </div>
      <a-space>
        <a-button @click="activeTab = 'templates'">管理模板</a-button>
        <a-button type="primary" @click="openCreate">开具票据</a-button>
      </a-space>
    </div>

    <!-- KPI -->
    <div class="cp-kpi-row">
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">合同总数</div>
        <div class="cp-kpi-value" style="color: var(--cp-brand)">{{ bill.contractCount }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">结清证明</div>
        <div class="cp-kpi-value" style="color: var(--cp-success)">{{ bill.invoiceCount }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">清退通知</div>
        <div class="cp-kpi-value" style="color: var(--cp-warning)">{{ bill.noticeCount }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">已发送</div>
        <div class="cp-kpi-value">{{ bill.sentCount }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">合同总额</div>
        <div class="cp-kpi-value">¥{{ (bill.totalContractAmount / 10000).toFixed(1) }}w</div>
      </div>
    </div>

    <a-tabs v-model:active-key="activeTab" type="rounded">
      <!-- 文档列表 -->
      <a-tab-pane key="docs" title="文档列表">
        <div class="cp-card" style="padding: 12px 16px; margin-bottom: 12px">
          <a-radio-group v-model="typeFilter" type="button">
            <a-radio value="">全部 ({{ bill.docs.length }})</a-radio>
            <a-radio value="contract">合同</a-radio>
            <a-radio value="notice">通知</a-radio>
            <a-radio value="invoice">票据</a-radio>
          </a-radio-group>
        </div>
        <div class="cp-card" style="padding: 0">
          <a-table :data="filteredDocs" :pagination="{ pageSize: 10 }" row-key="id">
            <a-table-column title="文档号" data-index="id" :width="180" />
            <a-table-column title="类型" :width="100">
              <template #cell="{ record }">
                <a-tag :color="typeColor(record.type)">{{ typeLabel(record.type) }}</a-tag>
              </template>
            </a-table-column>
            <a-table-column title="客户" data-index="customerName" :width="100" />
            <a-table-column title="关联单" :width="180">
              <template #cell="{ record }">
                <a-tag size="small">{{ refTypeLabel(record.refType) }}</a-tag>
                <span class="mono" style="margin-left: 4px">{{ record.refId }}</span>
              </template>
            </a-table-column>
            <a-table-column title="摘要" :width="240">
              <template #cell="{ record }">
                <span style="font-size: 12px; color: var(--cp-text-secondary)">
                  <span v-if="record.type === 'contract'"
                    >{{ record.fields.loanAmount }} · {{ record.fields.term }}</span
                  >
                  <span v-else-if="record.type === 'notice'"
                    >{{ record.fields.loanBalance }} · 宽限至 {{ record.fields.deadline }}</span
                  >
                  <span v-else-if="record.type === 'invoice'"
                    >{{ record.fields.loanId }} · 金额 {{ record.fields.settledAmount }}</span
                  >
                </span>
              </template>
            </a-table-column>
            <a-table-column title="发送" :width="200">
              <template #cell="{ record }">
                <span v-if="record.delivery" style="font-size: 12px">
                  <a-tag color="green" size="small">{{ channelLabel(record.delivery.channel) }}</a-tag>
                  <span style="color: var(--cp-text-tertiary); margin-left: 4px">{{ record.delivery.target }}</span>
                </span>
                <span v-else style="color: var(--cp-text-tertiary); font-size: 12px">未发送</span>
              </template>
            </a-table-column>
            <a-table-column title="状态" :width="100">
              <template #cell="{ record }">
                <a-tag :color="statusColor(record.status)">{{ statusLabel(record.status) }}</a-tag>
              </template>
            </a-table-column>
            <a-table-column title="操作" :width="280" fixed="right">
              <template #cell="{ record }">
                <a-space :size="4">
                  <a-button size="small" type="text" @click="openPreview(record)">预览</a-button>
                  <a-button
                    v-if="record.status === 'issued'"
                    size="small"
                    type="text"
                    status="warning"
                    @click="openSend(record)"
                    >发送</a-button
                  >
                  <a-button
                    v-if="record.status === 'sent'"
                    size="small"
                    type="text"
                    status="success"
                    @click="signDoc(record)"
                    >登记签字</a-button
                  >
                  <a-button
                    v-if="record.status === 'signed' || record.status === 'sent'"
                    size="small"
                    type="text"
                    @click="archiveDoc(record)"
                    >归档</a-button
                  >
                </a-space>
              </template>
            </a-table-column>
          </a-table>
        </div>
      </a-tab-pane>

      <!-- 模板管理 -->
      <a-tab-pane key="templates" title="合同模板">
        <div class="cp-card" style="padding: 20px">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px">
            <h3 style="margin: 0">已有模板</h3>
            <a-button type="primary" @click="showTplCreate = true">新建模板</a-button>
          </div>
          <a-row :gutter="[12, 12]">
            <a-col v-for="t in bill.templates" :key="t.id" :xs="24" :md="12" :lg="8">
              <a-card :title="t.name">
                <template #extra>
                  <a-tag :color="typeColor(t.type)">{{ typeLabel(t.type) }}</a-tag>
                </template>
                <div style="font-size: 12px; color: var(--cp-text-tertiary); margin-bottom: 8px">
                  创建于 {{ t.createdAt }} · {{ t.fields.length }} 个字段
                </div>
                <a-space wrap>
                  <a-tag v-for="(f, idx) in t.fields.slice(0, 4)" :key="idx" size="small">{{ f.label }}</a-tag>
                </a-space>
                <template #actions>
                  <a-link @click="openTplPreview(t)">查看模板</a-link>
                </template>
              </a-card>
            </a-col>
          </a-row>
        </div>
      </a-tab-pane>
    </a-tabs>

    <!-- 创建票据弹窗 -->
    <a-modal v-model:visible="showCreate" title="开具票据/合同" :width="700" :ok-text="'开具并预览'" @ok="onCreate">
      <a-form :model="createForm" layout="vertical">
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="文档类型" required>
              <a-select v-model="createForm.templateId" @change="onTemplateChange">
                <a-option v-for="t in bill.templates" :key="t.id" :value="t.id"
                  >{{ typeLabel(t.type) }} · {{ t.name }}</a-option
                >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="关联" required>
              <a-radio-group v-model="createForm.refType">
                <a-radio value="loan">借据</a-radio>
                <a-radio value="ticket">工单</a-radio>
                <a-radio value="exit_case">清退单</a-radio>
                <a-radio value="review">审查</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="关联单 ID" required>
              <a-input v-model="createForm.refId" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="客户" required>
              <a-select v-model="createForm.customerId" @change="onCustomerChange">
                <a-option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }} ({{ c.id }})</a-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-divider>字段填充</a-divider>
        <a-row :gutter="12">
          <a-col v-for="f in currentTplFields" :key="f.key" :span="12">
            <a-form-item :label="f.label" required>
              <a-input v-model="createForm.fields[f.key]" :placeholder="f.example" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <!-- 文档预览 -->
    <a-modal v-model:visible="previewVisible" title="文档预览" :width="720" :footer="false">
      <div v-if="previewDoc">
        <a-descriptions :column="2" bordered size="small" style="margin-bottom: 12px">
          <a-descriptions-item label="文档号">{{ previewDoc.id }}</a-descriptions-item>
          <a-descriptions-item label="类型">
            <a-tag :color="typeColor(previewDoc.type)">{{ typeLabel(previewDoc.type) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="客户">{{ previewDoc.customerName }}</a-descriptions-item>
          <a-descriptions-item label="关联单">{{ previewDoc.refId }}</a-descriptions-item>
          <a-descriptions-item label="状态" :span="2">
            <a-tag :color="statusColor(previewDoc.status)">{{ statusLabel(previewDoc.status) }}</a-tag>
            <span v-if="previewDoc.delivery" style="margin-left: 8px; font-size: 12px; color: var(--cp-text-tertiary)">
              通过 {{ channelLabel(previewDoc.delivery.channel) }} 发送至 {{ previewDoc.delivery.target }}
            </span>
          </a-descriptions-item>
        </a-descriptions>
        <pre
          style="
            white-space: pre-wrap;
            font-family: monospace;
            background: var(--cp-bg-soft);
            padding: 12px;
            border-radius: 4px;
            max-height: 400px;
            overflow: auto;
            font-size: 12px;
            line-height: 1.6;
          "
          >{{ previewDoc.renderedBody }}</pre>
      </div>
    </a-modal>

    <!-- 模板预览 -->
    <a-modal v-model:visible="tplPreviewVisible" title="模板预览" :width="720" :footer="false">
      <div v-if="previewTpl">
        <div style="margin-bottom: 12px">
          <a-tag :color="typeColor(previewTpl.type)" size="large"
            >{{ typeLabel(previewTpl.type) }} · {{ previewTpl.name }}</a-tag
          >
        </div>
        <h4 style="margin: 0 0 6px">字段定义</h4>
        <a-table :data="previewTpl.fields" :pagination="false" size="small" style="margin-bottom: 12px">
          <a-table-column title="Key" data-index="key" :width="140" />
          <a-table-column title="标签" data-index="label" :width="120" />
          <a-table-column title="示例" data-index="example" />
        </a-table>
        <h4 style="margin: 0 0 6px">模板正文</h4>
        <pre
          style="
            white-space: pre-wrap;
            font-family: monospace;
            background: var(--cp-bg-soft);
            padding: 12px;
            border-radius: 4px;
            max-height: 400px;
            overflow: auto;
            font-size: 12px;
            line-height: 1.6;
          "
          >{{ previewTpl.body }}</pre>
      </div>
    </a-modal>

    <!-- 发送弹窗 -->
    <a-modal v-model:visible="sendVisible" title="发送文档" :width="480" :ok-text="'提交'" @ok="onSubmitSend">
      <div v-if="sendTarget">
        <p>
          文档:<b>{{ sendTarget.id }}</b>
        </p>
        <p>
          渠道:
          <a-radio-group v-model="sendForm.channel">
            <a-radio value="email">邮件</a-radio>
            <a-radio value="wechat">微信</a-radio>
            <a-radio value="hand">面交</a-radio>
            <a-radio value="registered_mail">挂号信</a-radio>
          </a-radio-group>
        </p>
        <p>收件:<a-input v-model="sendForm.target" placeholder="邮箱/手机/地址" /></p>
      </div>
    </a-modal>

    <!-- 新建模板 -->
    <a-modal v-model:visible="showTplCreate" title="新建合同模板" :width="640" :ok-text="'提交'" @ok="onCreateTpl">
      <a-form :model="tplForm">
        <a-form-item label="模板名称" required>
          <a-input v-model="tplForm.name" />
        </a-form-item>
        <a-form-item label="文档类型" required>
          <a-radio-group v-model="tplForm.type">
            <a-radio value="contract">合同</a-radio>
            <a-radio value="notice">通知</a-radio>
            <a-radio value="invoice">票据</a-radio>
            <a-radio value="receipt">收据</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="字段定义(逗号分隔)">
          <a-input v-model="tplForm.fieldsRaw" placeholder="例: customerName,loanAmount,deadline" />
        </a-form-item>
        <a-form-item label="正文(用 {{key}} 占位)">
          <a-textarea v-model="tplForm.body" :rows="8" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useBillingStore, BillingDoc, ContractTemplate, DocType, DocStatus, DeliveryChannel } from '@/stores/billing'
import { customers as customersMock } from '@/mock/data'

const bill = useBillingStore()
const customers = customersMock

const activeTab = ref('docs')
const typeFilter = ref<string>('')
const filteredDocs = computed(() => {
  if (!typeFilter.value) return bill.docs
  return bill.docs.filter((d) => d.type === typeFilter.value)
})

// 创建文档
const showCreate = ref(false)
const createForm = reactive({
  templateId: '',
  refType: 'loan' as BillingDoc['refType'],
  refId: '',
  customerId: '',
  fields: {} as Record<string, string>
})

const currentTplFields = computed(() => {
  const tpl = bill.templates.find((t) => t.id === createForm.templateId)
  return tpl?.fields || []
})

function onTemplateChange() {
  // 重置字段默认值
  currentTplFields.value.forEach((f) => {
    if (!(f.key in createForm.fields)) {
      createForm.fields[f.key] = ''
    }
  })
}

function onCustomerChange() {
  const c = customers.find((c) => c.id === createForm.customerId)
  if (c) {
    if ('customerName' in createForm.fields) createForm.fields['customerName'] = c.name
    if ('idCardMask' in createForm.fields) createForm.fields['idCardMask'] = (c as any).idCardMask || ''
    if ('loanAmount' in createForm.fields)
      createForm.fields['loanAmount'] = `¥${((c as any).loanBalance || 0).toLocaleString()}`
  }
}

function openCreate() {
  if (!bill.templates.length) {
    Message.warning('没有可用模板')
    return
  }
  Object.assign(createForm, {
    templateId: '',
    refType: 'loan',
    refId: '',
    customerId: '',
    fields: {}
  })
  showCreate.value = true
}

function onCreate() {
  if (!createForm.templateId || !createForm.refId || !createForm.customerId) {
    Message.warning('请填写完整')
    return
  }
  // 校验必填字段
  const missing = currentTplFields.value.filter((f) => !createForm.fields[f.key])
  if (missing.length) {
    Message.warning(`必填字段缺失:${missing.map((f) => f.label).join(', ')}`)
    return
  }
  const customer = customers.find((c) => c.id === createForm.customerId)
  const doc = bill.create({
    templateId: createForm.templateId,
    customerId: createForm.customerId,
    customerName: customer?.name || '-',
    refType: createForm.refType,
    refId: createForm.refId,
    fields: { ...createForm.fields }
  })
  if (!doc) {
    Message.error('创建失败')
    return
  }
  previewDoc.value = doc
  previewVisible.value = true
  showCreate.value = false
  Message.success('文档已开具,可预览并发送')
}

// 预览
const previewVisible = ref(false)
const previewDoc = ref<BillingDoc | null>(null)
function openPreview(doc: BillingDoc) {
  previewDoc.value = doc
  previewVisible.value = true
}

// 模板预览
const tplPreviewVisible = ref(false)
const previewTpl = ref<ContractTemplate | null>(null)
function openTplPreview(t: ContractTemplate) {
  previewTpl.value = t
  tplPreviewVisible.value = true
}

// 发送
const sendVisible = ref(false)
const sendTarget = ref<BillingDoc | null>(null)
const sendForm = reactive({ channel: 'email' as DeliveryChannel, target: '' })

function openSend(d: BillingDoc) {
  sendTarget.value = d
  const c = customers.find((c) => c.id === d.customerId)
  sendForm.target = c?.id ? `customer${c.id}@mail.com` : ''
  sendVisible.value = true
}

function onSubmitSend() {
  if (!sendTarget.value || !sendForm.target) {
    Message.warning('请填写收件信息')
    return
  }
  bill.send(sendTarget.value.id, sendForm.channel, sendForm.target)
  Message.success('已发送')
  sendVisible.value = false
}

// 签字 / 归档
function signDoc(d: BillingDoc) {
  bill.sign(d.id)
  Message.success('已登记客户签字')
}
function archiveDoc(d: BillingDoc) {
  bill.archive(d.id)
  Message.success('已归档')
}

// 新建模板
const showTplCreate = ref(false)
const tplForm = reactive({
  name: '',
  type: 'notice' as DocType,
  fieldsRaw: '',
  body: ''
})

function onCreateTpl() {
  if (!tplForm.name || !tplForm.body || !tplForm.fieldsRaw) {
    Message.warning('请填写完整')
    return
  }
  const keys = tplForm.fieldsRaw
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean)
  const fields = keys.map((k) => ({ key: k, label: k, example: '' }))
  bill.addTemplate({
    name: tplForm.name,
    type: tplForm.type,
    fields,
    body: tplForm.body
  })
  Message.success('模板已新增')
  showTplCreate.value = false
  Object.assign(tplForm, { name: '', type: 'notice', fieldsRaw: '', body: '' })
}

// tools
function typeColor(t: DocType) {
  return (
    { contract: 'blue', notice: 'orange', invoice: 'green', receipt: 'arcoblue', settlement: 'purple' }[t] || 'gray'
  )
}
function typeLabel(t: DocType) {
  return { contract: '合同', notice: '通知', invoice: '结清证明', receipt: '收据', settlement: '结算单' }[t] || t
}
function statusColor(s: DocStatus) {
  return { drafting: 'gray', issued: 'blue', signed: 'arcoblue', sent: 'green', archived: 'gray' }[s] || 'gray'
}
function statusLabel(s: DocStatus) {
  return { drafting: '拟定中', issued: '已开具', signed: '已签字', sent: '已发送', archived: '已归档' }[s] || s
}
function refTypeLabel(r: BillingDoc['refType']) {
  return { loan: '借据', ticket: '工单', exit_case: '清退单', review: '审查' }[r] || r
}
function channelLabel(c: DeliveryChannel) {
  return { email: '邮件', wechat: '微信', hand: '面交', registered_mail: '挂号信' }[c] || c
}
</script>

<style scoped>
.cp-kpi-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.cp-kpi-card {
  padding: 12px 16px;
  background: #fff;
  border: 1px solid var(--cp-border-light);
  border-radius: 6px;
}
.cp-kpi-label {
  font-size: 12px;
  color: var(--cp-text-tertiary);
  margin-bottom: 4px;
}
.cp-kpi-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}
</style>
