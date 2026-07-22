<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">停催停扣管理</h1>
        <div class="cp-page-subtitle">申请 → 审批 → 生效 → 反馈催收系统 → 到期自动恢复</div>
      </div>
      <a-button type="primary" @click="showForm = true"><icon-plus /> 新建停催申请</a-button>
    </div>

    <!-- ============ P3-B4:纾困复杂度分流(简单/较长/重组/司法调解) ============ -->
    <a-card class="cp-card" style="margin-bottom: 16px; border-left: 4px solid var(--cp-brand)">
      <h3 class="cp-section-title" style="margin: 0 0 12px">
        🔀 纾困分流 · 按复杂度自动分配处理路径
        <a-tag color="orange" size="small">支撑岗第二大痛点 · 线下 WPS → 系统内流转</a-tag>
      </h3>
      <a-row :gutter="12">
        <a-col :span="6">
          <div class="cp-route-card" style="border-color: #52c41a">
            <div class="cp-route-title">
              <a-tag color="green" size="small">🟢 简单</a-tag> 短期停催 ≤ 7 天
            </div>
            <div class="cp-route-desc">客服直接操作 → 不流转支撑岗</div>
            <div class="cp-route-stat mono">{{ simpleCount }} 条运行中</div>
            <a-button size="mini" type="outline" @click="filterByComplexity('simple')">查看</a-button>
          </div>
        </a-col>
        <a-col :span="6">
          <div class="cp-route-card" style="border-color: #faad14">
            <div class="cp-route-title">
              <a-tag color="orange" size="small">🟡 中等</a-tag> 较长停催 8-30 天
            </div>
            <div class="cp-route-desc">流转指定人员 → 提交审批</div>
            <div class="cp-route-stat mono">{{ midCount }} 条运行中</div>
            <a-button size="mini" type="outline" @click="filterByComplexity('mid')">查看</a-button>
          </div>
        </a-col>
        <a-col :span="6">
          <div class="cp-route-card" style="border-color: #f5222d">
            <div class="cp-route-title">
              <a-tag color="red" size="small">🔴 复杂</a-tag> 重组/分期方案
            </div>
            <div class="cp-route-desc">支撑组评估 → OA 审批 → 执行</div>
            <div class="cp-route-stat mono">{{ complexCount }} 条运行中</div>
            <a-button size="mini" type="outline" @click="filterByComplexity('complex')">查看</a-button>
          </div>
        </a-col>
        <a-col :span="6">
          <div class="cp-route-card" style="border-color: #722ed1">
            <div class="cp-route-title">
              <a-tag color="purple" size="small">🟣 司法</a-tag> 司法调解
            </div>
            <div class="cp-route-desc">转案件管理系统(案件号 Y-XXX)</div>
            <div class="cp-route-stat mono">{{ judicialCount }} 条运行中</div>
            <a-button size="mini" type="outline" @click="filterByComplexity('judicial')">查看</a-button>
          </div>
        </a-col>
      </a-row>
      <a-alert type="info" show-icon style="margin-top: 12px">
        <template #content>
          <span style="font-size: 12px">
            📌 当前实现路径:新工单系统 → 复杂度自动识别 → 落到对应处理组。
            对应支撑岗旅程 §3d"纾困方案处理"。
          </span>
        </template>
      </a-alert>
    </a-card>

    <!-- OPT-5 联动横幅:展示由坐席在 AgentDesk 发起、正在此页生效的业务申请 -->
    <a-alert v-if="businessAppsForStop.length" type="info" show-icon style="margin-bottom: 16px">
      <template #title> 来自坐席的业务申请({{ businessAppsForStop.length }} 条) </template>
      <template #content>
        <div style="font-size: 13px">
          这些申请由坐席在 `/agent/desk` 发起,审批通过后自动启动工作流实例并落到下方表中。 当前运行实例
          <b>{{ runningInstances }}</b> 条 / 总 {{ list.length }} 条。
        </div>
        <div v-for="a in businessAppsForStop.slice(0, 3)" :key="a.id" style="margin-top: 4px; font-size: 12px">
          <a-tag size="small" :color="baStatusColor(a.status)">{{ appStatusLabel(a.status) }}</a-tag>
          <span>{{ a.id }}</span>
          <span style="color: var(--cp-text-tertiary); margin-left: 6px"
            >{{ a.title }} · 客户 {{ a.customerName }}</span
          >
        </div>
      </template>
    </a-alert>

    <!-- 到期提醒 -->
    <a-alert type="warning" show-icon style="margin-bottom: 16px">
      <template #title>2 笔停催将于 24 小时内到期</template>
      <template #content>
        <a-space>
          <a-tag color="orange" style="cursor: pointer" @click="$message.info('查看详情')"
            >GD-20260710-0019 (明天到期)</a-tag
          >
          <a-tag color="orange" style="cursor: pointer" @click="$message.info('查看详情')"
            >GD-20260708-0099 (后天到期)</a-tag
          >
          <a-button size="small" type="primary">一键续期</a-button>
        </a-space>
      </template>
    </a-alert>

    <div class="cp-card" style="padding: 0">
      <a-table :data="list" :pagination="{ pageSize: 10 }">
        <template #columns>
          <a-table-column title="申请编号" data-index="id" />
          <a-table-column title="客户" data-index="customerName" />
          <a-table-column title="类型">
            <template #cell="{ record }">
              <a-tag :color="record.type === '停催+停扣' ? 'red' : 'blue'">{{ record.type }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="期限" data-index="period" />
          <a-table-column title="复杂度" :width="120">
            <template #cell="{ record }">
              <a-tag :color="complexityColor(classifyComplexity(record))" size="small">
                {{ complexityLabel(classifyComplexity(record)) }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="状态">
            <template #cell="{ record }">
              <a-tag :color="record.statusColor || statusColor(record.status)">{{ record.status }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="审批结果" data-index="approval" />
          <a-table-column title="生效时间" data-index="effectiveAt" />
          <a-table-column title="到期时间" data-index="expireAt" />
          <a-table-column title="操作">
            <template #cell="{ record }">
              <a-space :size="4">
                <a-button v-if="record.status === '审批驳回'" size="small" type="primary">修改重提</a-button>
                <a-button v-if="record.status === '已恢复'" size="small" type="primary">续期</a-button>
                <a-button size="small">详情</a-button>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </div>

    <!-- 申请表单 -->
    <a-modal v-model:visible="showForm" title="新建停催停扣申请" :width="640" :ok-text="'提交OA审批'" @ok="onSubmit">
      <a-form :model="form">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="客户" required>
              <a-input v-model="form.customer" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="关联工单" required>
              <a-input v-model="form.ticket" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="停催原因" required>
          <a-textarea v-model="form.reason" :rows="3" placeholder="如:客户投诉催收频次过高,协商还款期间..." />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="停催期限" required>
              <a-select v-model="form.period">
                <a-option>7 天</a-option>
                <a-option>15 天</a-option>
                <a-option>30 天</a-option>
                <a-option>协商期</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="紧急程度">
              <a-radio-group v-model="form.urgency">
                <a-radio value="urgent">紧急 (3天)</a-radio>
                <a-radio value="normal">普通 (7天)</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item>
          <a-checkbox v-model="form.withhold">同步勾选停扣 (联动生效)</a-checkbox>
        </a-form-item>
        <a-form-item label="上传证明材料">
          <a-upload :auto-upload="false" list-type="text" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useWorkflowStore } from '@/stores/workflow'
import { useBusinessAppStore } from '@/stores/businessApp'
import { enrichStopCollectionRow, mapInstanceStatus } from '@/utils/workflow-helpers'
import StartWorkflowModal from '@/components/StartWorkflowModal.vue'

const wf = useWorkflowStore()

const showForm = ref(false)
const form = reactive({ customer: '', ticket: '', reason: '', period: '30 天', urgency: 'normal', withhold: true })

// 从工作流实例中取停催停扣类
const allList = computed(() =>
  wf.instances
    .filter((i) => i.kind === 'stop_collection')
    .map((i) => {
      const row = enrichStopCollectionRow(i)
      const approveExec = i.executions.find((e) => e.nodeCode === 'approve')
      return {
        ...row,
        approval: approveExec?.operator
          ? `${approveExec.operator}${approveExec.comment ? ' · ' + approveExec.comment : ''}`
          : approveExec?.status === 'pending'
            ? '待审批'
            : '-',
        effectiveAt: i.relatedTicketStatus ? i.createdAt : '-'
      }
    })
)

/** ============ P3-B4:按复杂度过滤(mock 实现,从 period/类型推导) ============ */
type Complexity = 'simple' | 'mid' | 'complex' | 'judicial'
const activeFilter = ref<Complexity | null>(null)
function classifyComplexity(record: any): Complexity {
  // mock 规则:period 包含 "7" → simple;包含 "30" → mid;type 含"重组/分期" → complex;否则按客户 ID 末位奇偶 mock
  const period = (record.period || '').toString()
  const type = (record.type || '').toString()
  if (type.includes('司法') || type.includes('调解')) return 'judicial'
  if (period.includes('7') || period.includes('短期')) return 'simple'
  if (period.includes('30') || period.includes('15')) return 'mid'
  if (type.includes('重组') || type.includes('分期')) return 'complex'
  // fallback:id 末位
  const id = (record.id || '').toString()
  const last = parseInt(id.slice(-1) || '0')
  return last % 4 === 0 ? 'judicial' : last % 3 === 0 ? 'complex' : last % 2 === 0 ? 'mid' : 'simple'
}
const list = computed(() => {
  if (!activeFilter.value) return allList.value
  return allList.value.filter((r) => classifyComplexity(r) === activeFilter.value)
})
function filterByComplexity(c: Complexity) {
  activeFilter.value = activeFilter.value === c ? null : c
}
const simpleCount = computed(() => allList.value.filter((r) => classifyComplexity(r) === 'simple' && r.status === 'running').length)
const midCount = computed(() => allList.value.filter((r) => classifyComplexity(r) === 'mid' && r.status === 'running').length)
const complexCount = computed(() => allList.value.filter((r) => classifyComplexity(r) === 'complex' && r.status === 'running').length)
const judicialCount = computed(() => allList.value.filter((r) => classifyComplexity(r) === 'judicial' && r.status === 'running').length)

// OPT-5 业务申请来源(由坐席在 AgentDesk 发起)
const ba = useBusinessAppStore()
const businessAppsForStop = computed(() =>
  ba.items.filter((a) => a.type === 'stop_collection' || a.type === 'negotiate')
)
const runningInstances = computed(() => list.value.filter((r) => r.status === 'running').length)

function statusColor(s: string) {
  return mapInstanceStatus(s).color === 'green'
    ? 'green'
    : mapInstanceStatus(s).color === 'red'
      ? 'red'
      : s === '已恢复'
        ? 'gray'
        : 'blue'
}

function baStatusColor(s: string) {
  return (
    {
      pending: 'orange',
      approved: 'arcoblue',
      rejected: 'red',
      in_progress: 'blue',
      executed: 'green',
      closed: 'gray'
    }[s] || 'gray'
  )
}
function appStatusLabel(s: string) {
  return (
    {
      pending: '待审批',
      approved: '已批准',
      rejected: '已驳回',
      in_progress: '执行中',
      executed: '已执行',
      closed: '已关闭'
    }[s] || s
  )
}

function onSubmit() {
  // 走工作流:由 StartWorkflowModal 接管
  showForm.value = false
  Message.success('请使用页面顶部"发起业务工作流"按钮创建停催申请')
}

/** ============ P3-B4:复杂度徽章 ============ */
function complexityColor(c: Complexity): string {
  return { simple: 'green', mid: 'orange', complex: 'red', judicial: 'purple' }[c]
}
function complexityLabel(c: Complexity): string {
  return { simple: '🟢 简单', mid: '🟡 中等', complex: '🔴 复杂', judicial: '🟣 司法' }[c]
}
</script>

<style scoped>
.cp-route-card {
  border: 1px solid;
  border-radius: 6px;
  padding: 10px 12px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cp-route-title {
  font-weight: 600;
  font-size: 13px;
}
.cp-route-desc {
  font-size: 11px;
  color: var(--cp-text-tertiary);
}
.cp-route-stat {
  font-size: 14px;
  font-weight: 600;
  color: var(--cp-brand);
}
</style>
