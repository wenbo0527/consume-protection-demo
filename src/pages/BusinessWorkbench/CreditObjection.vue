<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">征信异议处理</h1>
        <div class="cp-page-subtitle">异议登记 → 信息调整 → 审批 → 回写征信系统</div>
      </div>
    </div>

    <div class="cp-card" style="padding: 0; margin-bottom: 16px">
      <a-table :data="list" :pagination="{ pageSize: 8 }">
        <template #columns>
          <a-table-column title="异议编号" data-index="id" />
          <a-table-column title="客户" data-index="customerName" />
          <a-table-column title="异议类型" data-index="type" />
          <a-table-column title="登记时间" data-index="createdAt" />
          <a-table-column title="状态">
            <template #cell="{ record }">
              <a-tag :color="record.statusColor || color(record.status)">{{ record.status }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="操作">
            <template #cell="{ record }">
              <a-space>
                <a-button size="small">详情</a-button>
                <a-button v-if="record.status === '审批驳回'" size="small" type="primary">修改重提</a-button>
                <a-button v-if="record.status === '客户不满意'" size="small" type="primary" status="warning">创建升级工单</a-button>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </div>

    <a-alert type="info" show-icon>
      <template #title>客户不满意升级路径</template>
      <template #content>
        当客户对征信异议处理结果不满意时,坐席可记录不满意原因并创建升级工单,转交征信管理岗复核。
      </template>
    </a-alert>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWorkflowStore } from '@/stores/workflow'
import { enrichCreditObjectionRow, mapInstanceStatus } from '@/utils/workflow-helpers'
const wf = useWorkflowStore()

// 信用异议业务专有的状态 label/color 映射(覆盖 helper 默认)
const CUSTOM_STATUS: Record<string, { label: string; color: string }> = {
  rejected: { label: '客户不满意', color: 'orange' },
  finished: { label: '已完成', color: 'gray' }
}

const list = computed(() => wf.instances
  .filter(i => i.kind === 'credit_objection')
  .map(i => {
    const row = enrichCreditObjectionRow(i)
    const custom = CUSTOM_STATUS[i.status]
    return {
      ...row,
      type: row.dispute,
      createdAt: row.createdAt.slice(0, 10),
      status: custom?.label || row.status,
      statusColor: custom?.color || row.statusColor
    }
  })
)

function color(s: string) {
  return mapInstanceStatus(s).color
}
</script>