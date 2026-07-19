<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">我的待办</h1>
        <div class="cp-page-subtitle">按紧急程度排序,监管件置顶 · 数据每 30 秒刷新</div>
      </div>
      <a-space>
        <a-dropdown trigger="click">
          <a-button type="primary"> <icon-plus /> 高级操作 <icon-down /> </a-button>
          <template #content>
            <a-doption @click="$router.push('/agent/ticket-create')"> <icon-file /> 手动创建工单 </a-doption>
            <a-doption @click="$router.push('/agent/reg-import')"> <icon-upload /> 监管转诉批量建单 </a-doption>
            <a-doption @click="$router.push('/agent/batch')"> <icon-swap /> 批量作业(开票/开证明) </a-doption>
          </template>
        </a-dropdown>
        <a-button><icon-download /> 导出</a-button>
      </a-space>
    </div>

    <!-- 顶部统计 -->
    <div class="cp-stat-row">
      <div class="cp-stat-card">
        <div class="cp-stat-label">待办工单总数</div>
        <div class="cp-stat-value mono">{{ todoList.length }}</div>
        <div class="cp-stat-extra">较昨日 <span style="color: var(--cp-success)">+2</span></div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">紧急工单</div>
        <div class="cp-stat-value mono" style="color: var(--cp-danger)">{{ urgentCount }}</div>
        <div class="cp-stat-extra cp-pulse" style="color: var(--cp-danger)">需立即处理</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">监管件</div>
        <div class="cp-stat-value mono" style="color: var(--cp-warning)">{{ regCount }}</div>
        <div class="cp-stat-extra">处理时限 ≤7 天</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">今日已处理</div>
        <div class="cp-stat-value mono" style="color: var(--cp-success)">12</div>
        <div class="cp-stat-extra">一次性解决率 75%</div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="cp-card" style="padding: 16px 20px; margin-bottom: 12px">
      <a-space>
        <a-input-search v-model="filter.keyword" placeholder="工单号 / 客户姓名" style="width: 220px" />
        <a-select v-model="filter.urgency" placeholder="紧急度" style="width: 120px" allow-clear>
          <a-option value="special">特急</a-option>
          <a-option value="urgent">紧急</a-option>
          <a-option value="normal">普通</a-option>
        </a-select>
        <a-select v-model="filter.type" placeholder="工单类型" style="width: 140px" allow-clear>
          <a-option value="consult">咨询</a-option>
          <a-option value="complaint">投诉</a-option>
          <a-option value="external">外部转办</a-option>
          <a-option value="mediate">调解</a-option>
        </a-select>
        <a-checkbox v-model="filter.regOnly">仅监管件</a-checkbox>
        <a-button @click="reset">重置</a-button>
      </a-space>
    </div>

    <!-- 工单列表 -->
    <div class="cp-card" style="padding: 0">
      <a-table
        :columns="columns"
        :data="filtered"
        :pagination="{ pageSize: 10 }"
        row-key="id"
        :row-class-name="rowClass"
      >
        <template #id="{ record }">
          <a-link @click="$router.push(`/agent/ticket/${record.id}`)">{{ record.id }}</a-link>
        </template>
        <template #urgency="{ record }">
          <status-badge :status="record.urgency" />
        </template>
        <template #typeLabel="{ record }">
          <a-tag v-if="record.isRegulator" color="orangered" size="small">监管</a-tag>
          {{ record.typeLabel }}
        </template>
        <template #customerName="{ record }">
          <a-link @click="$router.push(`/agent/customer/${record.customerId}`)">{{ record.customerName }}</a-link>
        </template>
        <template #status="{ record }">
          <status-badge :status="record.status" />
        </template>
        <template #actions="{ record }">
          <a-space :size="4">
            <a-button type="text" size="small" @click="$router.push(`/agent/ticket/${record.id}`)">查看</a-button>
            <a-divider direction="vertical" />
            <a-button type="text" size="small" status="success">接收</a-button>
            <a-divider direction="vertical" />
            <a-button type="text" size="small">流转</a-button>
          </a-space>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { tickets } from '@/mock/data'
import StatusBadge from '@/components/StatusBadge.vue'
import { fromNow } from '@/utils/format'

const todoList = tickets.filter((t) => t.status !== 'closed')
const urgentCount = todoList.filter((t) => t.urgency === 'urgent' || t.urgency === 'special').length
const regCount = todoList.filter((t) => t.isRegulator).length

const filter = reactive({ keyword: '', urgency: '', type: '', regOnly: false })

const filtered = computed(() => {
  return todoList.filter((t) => {
    if (filter.keyword && !(t.id.includes(filter.keyword) || t.customerName.includes(filter.keyword))) return false
    if (filter.urgency && t.urgency !== filter.urgency) return false
    if (filter.type && t.type !== filter.type) return false
    if (filter.regOnly && !t.isRegulator) return false
    return true
  })
})

function rowClass(record: any) {
  if (record.urgency === 'special') return 'cp-row-special'
  if (record.urgency === 'urgent') return 'cp-row-urgent'
  return ''
}

function reset() {
  filter.keyword = ''
  filter.urgency = ''
  filter.type = ''
  filter.regOnly = false
}

const columns: any[] = [
  { title: '工单号', dataIndex: 'id', slotName: 'id', width: 180 },
  { title: '紧急度', dataIndex: 'urgency', slotName: 'urgency', width: 80 },
  { title: '类型', dataIndex: 'typeLabel', slotName: 'typeLabel', width: 110 },
  { title: '客户', dataIndex: 'customerName', slotName: 'customerName', width: 100 },
  { title: '业务类别', dataIndex: 'category', width: 100 },
  { title: '投诉原因', dataIndex: 'reason', width: 110 },
  { title: '渠道', dataIndex: 'channel', width: 80 },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 90 },
  { title: '受理时间', dataIndex: 'createdAt', width: 130 },
  { title: '处理人', dataIndex: 'handler', width: 80 },
  { title: '操作', slotName: 'actions', width: 170, fixed: 'right' }
]
</script>

<style scoped>
:deep(.cp-row-special) {
  background: #fff7e6 !important;
}
:deep(.cp-row-urgent) {
  background: #fff1f0 !important;
}
:deep(.cp-row-special:hover .arco-table-td),
:deep(.cp-row-urgent:hover .arco-table-td) {
  filter: brightness(0.97);
}
</style>
