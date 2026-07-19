<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">批量作业</h1>
        <div class="cp-page-subtitle">批量建单 / 批量开票 / 批量开证明 · 单次 ≤1000 条 · 失败重试上限 3 次</div>
      </div>
      <a-space>
        <a-button @click="showImport = true"><icon-upload /> 新建批量任务</a-button>
      </a-space>
    </div>

    <div class="cp-stat-row">
      <div class="cp-stat-card">
        <div class="cp-stat-label">本月任务总数</div>
        <div class="cp-stat-value mono">42</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">成功率</div>
        <div class="cp-stat-value mono" style="color: var(--cp-success)">98.6%</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">需人工处理</div>
        <div class="cp-stat-value mono" style="color: var(--cp-warning)">3</div>
      </div>
    </div>

    <div class="cp-card" style="padding: 0">
      <a-table :data="jobs" :pagination="{ pageSize: 10 }">
        <template #columns>
          <a-table-column title="任务编号" data-index="id" />
          <a-table-column title="类型" data-index="type">
            <template #cell="{ record }"><a-tag color="blue">{{ record.type }}</a-tag></template>
          </a-table-column>
          <a-table-column title="总数" data-index="totalCount" />
          <a-table-column title="成功">
            <template #cell="{ record }">
              <span class="mono" style="color: var(--cp-success)">{{ record.successCount }}</span>
            </template>
          </a-table-column>
          <a-table-column title="失败">
            <template #cell="{ record }">
              <a-link v-if="record.failedCount" style="color: var(--cp-danger)">{{ record.failedCount }}</a-link>
              <span v-else>0</span>
            </template>
          </a-table-column>
          <a-table-column title="状态">
            <template #cell="{ record }">
              <a-tag :color="statusColor(record.status)">{{ statusText(record.status) }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="创建时间" data-index="createdAt" />
          <a-table-column title="创建人" data-index="creator" />
          <a-table-column title="操作">
            <template #cell="{ record }">
              <a-space :size="4">
                <a-button v-if="record.failedCount" size="small" type="primary" @click="showRetry(record)">处理失败</a-button>
                <a-button size="small">详情</a-button>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </div>

    <!-- 失败条目重试弹窗 -->
    <a-modal v-model:visible="showRetryModal" :title="`失败条目处理 - ${current?.id}`" :width="720" :footer="false">
      <a-alert v-if="current?.failedItems?.length" type="warning" show-icon style="margin-bottom: 16px">
        <template #title>共 {{ current.failedItems.length }} 条失败,系统将自动重试 (上限 3 次)</template>
        <template #content>
          失败条目已尝试 {{ current.failedItems[0].retryCount }} 次,继续重试可能仍然失败,3 次后仍未成功将标记为"需人工处理"并告警。
        </template>
      </a-alert>

      <a-table v-if="current?.failedItems?.length" :data="current.failedItems" :pagination="false">
        <template #columns>
          <a-table-column title="序号" data-index="idx" :width="80" />
          <a-table-column title="失败原因" data-index="reason" />
          <a-table-column title="已重试次数" :width="120">
            <template #cell="{ record }">
              <a-tag :color="record.retryCount >= 3 ? 'red' : record.retryCount >= 2 ? 'orange' : 'blue'">
                {{ record.retryCount }} / 3
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="操作" :width="220">
            <template #cell="{ record }">
              <a-space :size="4">
                <a-button v-if="record.retryCount < 3" size="small" type="primary" @click="retryOne(record)">
                  <icon-refresh /> 重试
                </a-button>
                <a-button v-if="record.retryCount >= 3" size="small" status="warning">标记人工处理</a-button>
                <a-button size="small">查看明细</a-button>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>

      <div v-if="current?.failedItems?.length" style="margin-top: 16px; padding: 12px; background: var(--cp-bg-soft); border-radius: 6px; font-size: 12px">
        <div><icon-info-circle /> 已尝试重试 {{ current.failedItems[0].retryCount }} 次 / 上限 3 次</div>
        <a-progress :percent="(current.failedItems[0].retryCount / 3) * 100" :show-text="false" style="margin-top: 8px" />
      </div>

      <div style="margin-top: 16px; display: flex; justify-content: flex-end; gap: 8px">
        <a-button>导出失败清单</a-button>
        <a-button type="primary" @click="batchRetry">一键重试全部</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { batchJobs } from '@/mock/data'
import { Message } from '@arco-design/web-vue'

const jobs = batchJobs
const showRetryModal = ref(false)
const current = ref<any>(null)

function statusColor(s: string) {
  if (s === 'done') return 'green'
  if (s === 'partial') return 'orange'
  if (s === 'warning') return 'red'
  return 'blue'
}
function statusText(s: string) {
  return { done: '全部成功', partial: '部分失败', warning: '需人工处理', processing: '执行中' }[s] || s
}

function showRetry(job: any) {
  current.value = job
  showRetryModal.value = true
}

function retryOne(item: any) {
  if (item.retryCount >= 3) {
    Message.warning('已达重试上限,请标记人工处理')
    return
  }
  item.retryCount++
  Message.success(`序号 ${item.idx} 重试成功`)
}

function batchRetry() {
  Message.success('已发起批量重试,结果将通过系统消息通知')
  showRetryModal.value = false
}

const showImport = ref(false)
</script>