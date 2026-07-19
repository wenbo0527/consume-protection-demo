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
import { computed } from 'vue'
import { useWorkflowStore } from '@/stores/workflow'
import { enrichNegotiateRow, getPayload } from '@/utils/workflow-helpers'
const wf = useWorkflowStore()

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
