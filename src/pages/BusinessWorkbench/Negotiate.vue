<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">协商还款管理</h1>
        <div class="cp-page-subtitle">自动试算 → 审批 → 执行停催停扣 → 到期提醒 → 违约处理</div>
      </div>
      <a-button type="primary"><icon-plus /> 新建协商方案</a-button>
    </div>

    <!-- 违约提醒 -->
    <a-alert type="error" show-icon style="margin-bottom: 16px">
      <template #title>1 笔方案已违约,系统已自动恢复催收</template>
      <template #content>
        方案 <a-link>NX-20260601-0078</a-link> 于 2026-07-10 到期,客户未按约定还款
        <a-button size="small" type="primary" status="danger" style="margin-left: 12px">重新协商</a-button>
        <a-button size="small">升级处理</a-button>
      </template>
    </a-alert>

    <!-- ============ P3-B6:试算数据时效 · T-2 vs 当天 切换器 ============ -->
    <a-card class="cp-card" style="margin-bottom: 16px; border-left: 4px solid var(--cp-warning)">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px">
        <h3 class="cp-section-title" style="margin: 0">
          💰 试算数据时效(支撑岗第三大痛点)
          <a-tag color="orange" size="small">T-2 数据 vs 当天核心数据</a-tag>
        </h3>
        <a-radio-group v-model="dataMode" type="button">
          <a-radio-button value="t-2">📉 T-2 数仓数据</a-radio-button>
          <a-radio-button value="today">📈 当天核心数据</a-radio-button>
        </a-radio-group>
      </div>
      <a-row :gutter="12">
        <a-col :span="6">
          <div class="cp-stat-card">
            <div class="cp-stat-label">剩余本金</div>
            <div class="cp-stat-value mono">¥{{ trialData.principal.toLocaleString() }}</div>
            <div class="cp-stat-extra" :style="{ color: diffDiff.principal > 0 ? 'var(--cp-warning)' : 'var(--cp-success)' }">
              {{ diffDiff.principal > 0 ? '+' : '' }}¥{{ diffDiff.principal }} vs {{ dataMode === 't-2' ? '当天' : 'T-2' }}
            </div>
          </div>
        </a-col>
        <a-col :span="6">
          <div class="cp-stat-card">
            <div class="cp-stat-label">累计利息</div>
            <div class="cp-stat-value mono">¥{{ trialData.interest.toLocaleString() }}</div>
            <div class="cp-stat-extra" :style="{ color: diffDiff.interest > 0 ? 'var(--cp-warning)' : 'var(--cp-success)' }">
              {{ diffDiff.interest > 0 ? '+' : '' }}¥{{ diffDiff.interest }} vs {{ dataMode === 't-2' ? '当天' : 'T-2' }}
            </div>
          </div>
        </a-col>
        <a-col :span="6">
          <div class="cp-stat-card">
            <div class="cp-stat-label">累计罚息</div>
            <div class="cp-stat-value mono" style="color: var(--cp-danger)">¥{{ trialData.penalty.toLocaleString() }}</div>
            <div class="cp-stat-extra" :style="{ color: diffDiff.penalty > 0 ? 'var(--cp-danger)' : 'var(--cp-success)' }">
              {{ diffDiff.penalty > 0 ? '+' : '' }}¥{{ diffDiff.penalty }} vs {{ dataMode === 't-2' ? '当天' : 'T-2' }}
            </div>
          </div>
        </a-col>
        <a-col :span="6">
          <div class="cp-stat-card">
            <div class="cp-stat-label">合计应还</div>
            <div class="cp-stat-value mono" style="color: var(--cp-brand)">¥{{ trialData.total.toLocaleString() }}</div>
            <div class="cp-stat-extra" :style="{ color: diffDiff.total > 0 ? 'var(--cp-warning)' : 'var(--cp-success)' }">
              {{ diffDiff.total > 0 ? '+' : '' }}¥{{ diffDiff.total }} vs {{ dataMode === 't-2' ? '当天' : 'T-2' }}
            </div>
          </div>
        </a-col>
      </a-row>
      <a-alert
        :type="dataMode === 't-2' ? 'warning' : 'success'"
        show-icon
        style="margin-top: 12px"
      >
        <template #title>
          {{ dataMode === 't-2' ? '⚠️ 当前使用 T-2 数仓数据 — 试算金额可能与最终结果不一致' : '✅ 使用当天核心数据 — 试算精确' }}
        </template>
        <template #content>
          <span style="font-size: 12px">
            {{ dataMode === 't-2'
              ? '⚠️ 痛点:监管要求 15 个工作日内处理完毕,T-2 数据无法满足审批时效。需登录堡垒机手工核对核心数据(极繁琐)。'
              : '✅ 痛点已解决:工单系统直连核心系统,审批时效精确到元,无需人工核对。' }}
          </span>
        </template>
      </a-alert>
    </a-card>

    <div class="cp-card" style="padding: 0">
      <a-table :data="list" :pagination="{ pageSize: 10 }">
        <template #columns>
          <a-table-column title="方案编号" data-index="id" />
          <a-table-column title="客户" data-index="customerName" />
          <a-table-column title="借据" data-index="loanId" />
          <a-table-column title="分期" data-index="period" />
          <a-table-column title="应还总额" data-index="total">
            <template #cell="{ record }"
              ><span class="mono">¥{{ record.total }}</span></template
            >
          </a-table-column>
          <a-table-column title="状态">
            <template #cell="{ record }">
              <a-tag :color="record.statusColor || color(record.status)">{{ record.status }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="到期时间" data-index="expireAt" />
          <a-table-column title="违约记录" data-index="violation" />
          <a-table-column title="操作">
            <template #cell>
              <a-space :size="4">
                <a-button size="small">试算详情</a-button>
                <a-button size="small" type="primary">处理</a-button>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWorkflowStore } from '@/stores/workflow'
import { enrichNegotiateRow, getPayload } from '@/utils/workflow-helpers'
const wf = useWorkflowStore()

/** ============ P3-B6:试算数据时效切换 ============
 *  对应旅程:支撑岗 §3f "T+2 数据无法满足实时试算,审批需当天最新"
 *  数据为 mock:T-2 数仓(滞后) vs 当天核心(实时)
 */
const dataMode = ref<'t-2' | 'today'>('t-2')
const trialToday = { principal: 85320, interest: 4820, penalty: 1240, total: 91380 }
const trialT2 = { principal: 85000, interest: 4600, penalty: 980, total: 90580 }
const trialData = computed(() => (dataMode.value === 'today' ? trialToday : trialT2))
const diffDiff = computed(() => {
  const a = trialData.value
  const b = dataMode.value === 'today' ? trialT2 : trialToday
  return {
    principal: a.principal - b.principal,
    interest: a.interest - b.interest,
    penalty: a.penalty - b.penalty,
    total: a.total - b.total
  }
})

const list = computed(() =>
  wf.instances
    .filter((i) => i.kind === 'negotiate')
    .map((i) => {
      const row = enrichNegotiateRow(i)
      const payload = getPayload(i)
      return {
        ...row,
        loanId: payload?.loanId || '-',
        total: '-',
        violation: '无'
      }
    })
)

function color(s: string) {
  if (s === '执行中') return 'green'
  if (s === '审批中') return 'blue'
  if (s === '已违约') return 'red'
  if (s === '已完成') return 'gray'
  return 'blue'
}
</script>
