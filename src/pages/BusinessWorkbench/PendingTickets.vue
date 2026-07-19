<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">待办工单</h1>
        <div class="cp-page-subtitle">支撑岗视角 · 默认筛选业务执行类工单</div>
      </div>
    </div>

    <div class="cp-stat-row">
      <div class="cp-stat-card">
        <div class="cp-stat-label">我的待办</div>
        <div class="cp-stat-value mono">3</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">审批驳回待修改</div>
        <div class="cp-stat-value mono" style="color: var(--cp-warning)">1</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">即将到期</div>
        <div class="cp-stat-value mono" style="color: var(--cp-danger)">2</div>
      </div>
    </div>

    <div class="cp-card" style="padding: 0">
      <a-table :data="list" :pagination="false">
        <template #columns>
          <a-table-column title="工单号" data-index="id" />
          <a-table-column title="类型">
            <template #cell>
              <a-tag color="blue">业务执行</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="客户" data-index="customerName" />
          <a-table-column title="业务操作" data-index="action" />
          <a-table-column title="状态">
            <template #cell="{ record }">
              <status-badge :status="record.status" />
            </template>
          </a-table-column>
          <a-table-column title="到期时间" data-index="expire" />
          <a-table-column title="操作">
            <template #cell>
              <a-button size="small" type="primary">处理</a-button>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import StatusBadge from '@/components/StatusBadge.vue'

const list = [
  { id: 'GD-20260714-0008', customerName: '周志远', action: '停催申请审批', status: 'processing', expire: '2026-07-17' },
  { id: 'GD-20260712-0001', customerName: '刘建国', action: '协商还款试算', status: 'closing', expire: '2026-07-16' },
  { id: 'GD-20260710-0019', customerName: '孙丽华', action: '征信异议核实', status: 'processing', expire: '2026-07-20' }
]
</script>