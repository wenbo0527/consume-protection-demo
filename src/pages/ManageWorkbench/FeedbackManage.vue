<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">满意度评价管理</h1>
        <div class="cp-page-subtitle">
          客户关单后评价 · 低分自动触发回退工单 · 标记已追访
        </div>
      </div>
      <a-space>
        <a-button @click="onExportFeedback">导出 CSV</a-button>
      </a-space>
    </div>

    <!-- KPI -->
    <div class="cp-stat-row">
      <div class="cp-stat-card">
        <div class="cp-stat-label">评价总数</div>
        <div class="cp-stat-value mono">{{ fbStore.items.length }}</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">平均评分</div>
        <div class="cp-stat-value mono" :style="{ color: fbStore.avgRating >= 4 ? 'var(--cp-success)' : 'var(--cp-warning)' }">
          {{ fbStore.avgRating.toFixed(1) }}
        </div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">差评(≤2)</div>
        <div class="cp-stat-value mono" style="color: var(--cp-danger)">{{ fbStore.bad.length }}</div>
        <div class="cp-stat-extra">差评率 {{ fbStore.badRate7d }}%</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">好评(≥4)</div>
        <div class="cp-stat-value mono" style="color: var(--cp-success)">{{ fbStore.good.length }}</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">已追访</div>
        <div class="cp-stat-value mono">{{ fbStore.followedUp.length }}</div>
      </div>
    </div>

    <a-tabs default-active-key="bad" v-model:active-key="activeTab">
      <a-tab-pane key="bad" title="差评({{ fbStore.bad.length }})">
        <div class="cp-card" style="padding: 0">
          <a-table :data="fbStore.bad" :pagination="{ pageSize: 8 }" row-key="id">
            <template #columns>
              <a-table-column title="工单号" data-index="ticketId" :width="170">
                <template #cell="{ record }">
                  <a-link @click="openTicket(record)">{{ record.ticketId }}</a-link>
                </template>
              </a-table-column>
              <a-table-column title="客户" data-index="customer" :width="100" />
              <a-table-column title="评分" :width="80">
                <template #cell="{ record }">
                  <a-rate :model-value="record.rating" readonly size="small" />
                </template>
              </a-table-column>
              <a-table-column title="处理人" data-index="handler" :width="80" />
              <a-table-column title="不满意原因" data-index="reason" />
              <a-table-column title="提交时间" data-index="submittedAt" :width="160" />
              <a-table-column title="状态" :width="80">
                <template #cell="{ record }">
                  <a-tag v-if="record.followedUp" color="green">已追访</a-tag>
                  <a-tag v-else-if="record.reverted" color="red">已回退</a-tag>
                  <a-tag v-else color="gray">未处理</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="操作" :width="160">
                <template #cell="{ record }">
                  <a-space :size="4">
                    <a-button size="small" type="primary" @click="markFollowedUp(record)" v-if="!record.followedUp">
                      标记追访
                    </a-button>
                    <a-button size="small" status="warning" @click="revertTicket(record)" v-if="!record.reverted">
                      回退工单
                    </a-button>
                    <a-button size="small" @click="openDetail(record)">详情</a-button>
                  </a-space>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </a-tab-pane>

      <a-tab-pane key="good" title="好评({{ fbStore.good.length }})">
        <div class="cp-card" style="padding: 0">
          <a-table :data="fbStore.good" :pagination="{ pageSize: 8 }" row-key="id">
            <template #columns>
              <a-table-column title="工单号" data-index="ticketId" :width="170">
                <template #cell="{ record }">
                  <a-link @click="openTicket(record)">{{ record.ticketId }}</a-link>
                </template>
              </a-table-column>
              <a-table-column title="客户" data-index="customer" :width="100" />
              <a-table-column title="评分" :width="80">
                <template #cell="{ record }">
                  <a-rate :model-value="record.rating" readonly size="small" />
                </template>
              </a-table-column>
              <a-table-column title="处理人" data-index="handler" :width="100" />
              <a-table-column title="好评内容" data-index="comment" />
              <a-table-column title="提交时间" data-index="submittedAt" :width="160" />
              <a-table-column title="操作" :width="100">
                <template #cell="{ record }">
                  <a-button size="small" @click="openDetail(record)">查看</a-button>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </a-tab-pane>

      <a-tab-pane key="all" title="全部({{ fbStore.items.length }})">
        <div class="cp-card" style="padding: 0">
          <a-table :data="fbStore.items" :pagination="{ pageSize: 8 }" row-key="id">
            <template #columns>
              <a-table-column title="工单号" data-index="ticketId" :width="170">
                <template #cell="{ record }">
                  <a-link @click="openTicket(record)">{{ record.ticketId }}</a-link>
                </template>
              </a-table-column>
              <a-table-column title="客户" data-index="customer" :width="100" />
              <a-table-column title="评分" :width="80">
                <template #cell="{ record }">
                  <a-rate :model-value="record.rating" readonly size="small" />
                </template>
              </a-table-column>
              <a-table-column title="原因" data-index="reason" />
              <a-table-column title="提交时间" data-index="submittedAt" :width="160" />
              <a-table-column title="操作" :width="200">
                <template #cell="{ record }">
                  <a-space :size="4">
                    <a-button size="small" @click="openDetail(record)">详情</a-button>
                    <a-button
                      size="small"
                      type="primary"
                      @click="markFollowedUp(record)"
                      v-if="!record.followedUp"
                    >
                      追访
                    </a-button>
                    <a-button
                      size="small"
                      status="warning"
                      @click="revertTicket(record)"
                      v-if="!record.reverted && record.rating <= 2"
                    >
                      回退
                    </a-button>
                  </a-space>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </a-tab-pane>
    </a-tabs>

    <!-- 详情弹窗 -->
    <a-modal v-model:visible="showDetail" title="评价详情" :width="540">
      <div v-if="current">
        <a-descriptions :column="1" bordered size="small">
          <a-descriptions-item label="评价编号">{{ current.id }}</a-descriptions-item>
          <a-descriptions-item label="工单号">
            <a-link @click="openTicket(current)">{{ current.ticketId }}</a-link>
          </a-descriptions-item>
          <a-descriptions-item label="客户">{{ current.customer }} · {{ current.customerPhone }}</a-descriptions-item>
          <a-descriptions-item label="评分">
            <a-rate :model-value="current.rating" readonly />
          </a-descriptions-item>
          <a-descriptions-item label="原因">{{ current.reason }}</a-descriptions-item>
          <a-descriptions-item label="处理人">{{ current.handler }} ({{ roleLabel(current.handlerRole) }})</a-descriptions-item>
          <a-descriptions-item label="提交时间">{{ current.submittedAt }}</a-descriptions-item>
          <a-descriptions-item label="追访">{{ current.followedUp ? '已追访' : '未追访' }}</a-descriptions-item>
          <a-descriptions-item label="回退">{{ current.reverted ? '已回退' : '未回退' }}</a-descriptions-item>
        </a-descriptions>
        <div class="cp-card" style="padding: 12px 16px; margin-top: 12px; background: var(--cp-bg-soft)">
          <div style="font-size: 12px; color: var(--cp-text-tertiary); margin-bottom: 4px">客户留言</div>
          <div>{{ current.comment }}</div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { useFeedbackStore } from '@/stores/feedback'
import { useWorkflowStore } from '@/stores/workflow'
import { useUserStore, getRoleInfo } from '@/stores/user'
import type { FeedbackItem } from '@/mock/feedback'

const router = useRouter()
const fbStore = useFeedbackStore()
const wf = useWorkflowStore()
const userStore = useUserStore()

const activeTab = ref('bad')

const showDetail = ref(false)
const current = ref<FeedbackItem | null>(null)

function openDetail(record: FeedbackItem) {
  current.value = record
  showDetail.value = true
}

function openTicket(record: FeedbackItem) {
  Message.info(`跳转到工单详情:${record.ticketId} - Phase 3 接入`)
  // 真实场景:router.push(`/agent/ticket/${record.ticketId}`)
  void router // 占位避免 lint
}

function roleLabel(role: 'agent' | 'business' | 'review'): string {
  return { agent: '坐席', business: '支撑岗', review: '审查' }[role] || role
}

function markFollowedUp(record: FeedbackItem) {
  fbStore.markFollowedUp(record.id)
  Message.success(`已标记追访:${record.id}`)
}

function revertTicket(record: FeedbackItem) {
  // 走 alert_directive 工作流:管理层确认回退
  const role = userStore.currentRole || 'manage'
  const operator = (role ? getRoleInfo(role)?.username : '陈强') || '陈强'
  const inst = wf.start({
    kind: 'alert_directive',
    initiator: operator,
    initiatorRole: 'manage',
    alertId: `RV-${record.ticketId}`,
    ticketId: record.ticketId,
    payload: {
      instruction: `客户评价差评(${record.rating}分),需要回退工单重新处理: ${record.ticketId}`,
      assignTo: record.handler,
      opinion: record.comment,
      alertTitle: `差评回退 - ${record.ticketId}`
    }
  })
  if (inst) {
    // 演示用:直接修改 reverted
    record.reverted = true
    fbStore.persist()
    Message.success(`已发起回退审批 ${inst.id},工单已被打回`)
  } else {
    Message.warning('工作流启动失败')
  }
}

function onExportFeedback() {
  const rows = [
    ['评价编号', '工单号', '客户', '处理人', '角色', '评分', '原因', '提交时间', '追访', '回退']
  ]
  fbStore.items.forEach((i) => {
    rows.push([
      i.id,
      i.ticketId,
      i.customer,
      i.handler,
      roleLabel(i.handlerRole),
      String(i.rating),
      i.reason,
      i.submittedAt,
      i.followedUp ? '是' : '否',
      i.reverted ? '是' : '否'
    ])
  })
  const csv = '\uFEFF' + rows.map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `feedback-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  Message.success(`已导出 ${fbStore.items.length} 条评价`)
}
</script>

<style scoped>
.cp-stat-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.cp-stat-card {
  flex: 1;
  padding: 16px 20px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid var(--cp-border-light);
}
.cp-stat-label {
  font-size: 12px;
  color: var(--cp-text-tertiary);
}
.cp-stat-value {
  font-size: 24px;
  font-weight: 600;
  margin-top: 4px;
}
.cp-stat-extra {
  font-size: 11px;
  color: var(--cp-text-tertiary);
  margin-top: 2px;
}
</style>
