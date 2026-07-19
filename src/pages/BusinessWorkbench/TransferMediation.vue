<template>
  <div class="cp-page">
    <a-tabs default-active-key="transfer">
      <a-tab-pane key="transfer" title="转诉管理">
        <div class="cp-card" style="padding: 0">
          <a-table :data="transferList" :pagination="{ pageSize: 8 }">
            <template #columns>
              <a-table-column title="转诉编号" data-index="id" />
              <a-table-column title="客户" data-index="customerName" />
              <a-table-column title="案件类型" data-index="type" />
              <a-table-column title="紧急度">
                <template #cell="{ record }">
                  <status-badge :status="record.urgency" />
                </template>
              </a-table-column>
              <a-table-column title="提交时间" data-index="submitAt" />
              <a-table-column title="案件平台状态">
                <template #cell="{ record }">
                  <a-tag :color="record.platformStatus === '已结案' ? 'green' : 'blue'">{{ record.platformStatus }}</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="操作">
                <template #cell>
                  <a-button size="small">跟踪</a-button>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </a-tab-pane>

      <a-tab-pane key="mediate" title="调解工作区">
        <div class="cp-card" style="padding: 0">
          <a-table :data="mediateList" :pagination="{ pageSize: 8 }">
            <template #columns>
              <a-table-column title="调解编号" data-index="id" />
              <a-table-column title="客户" data-index="customerName" />
              <a-table-column title="是否有意调解">
                <template #cell="{ record }">
                  <a-tag :color="record.intent === '有意' ? 'green' : 'gray'">{{ record.intent }}</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="协议状态">
                <template #cell="{ record }">
                  <a-tag :color="record.agreement === '已生效' ? 'green' : 'orange'">{{ record.agreement }}</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="联动停催">
                <template #cell="{ record }">
                  <span v-if="record.stopColl" style="color: var(--cp-success)">已触发 · {{ record.stopCollDays }}天</span>
                  <span v-else style="color: var(--cp-text-tertiary)">未触发</span>
                </template>
              </a-table-column>
              <a-table-column title="操作">
                <template #cell>
                  <a-button size="small" type="primary">开具协议</a-button>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useWorkflowStore } from '@/stores/workflow'
import { enrichTransferMediateRow, mapInstanceStatus, mapNodeName } from '@/utils/workflow-helpers'
const wf = useWorkflowStore()

// 转诉调解统一从工作流实例里取(transfer_mediate 类型)
const transferList = computed(() => wf.instances
  .filter(i => i.kind === 'transfer_mediate')
  .map(i => {
    const row = enrichTransferMediateRow(i)
    // platformStatus:综合 status + currentNode 推导
    let platformStatus = row.status
    if (i.status === 'running') {
      platformStatus = i.currentNode === 'submit' ? '受理中' : '处理中'
    }
    return {
      ...row,
      type: row.platform,
      submitAt: row.createdAt,
      urgency: 'urgent' as const,
      platformStatus
    }
  })
)

const mediateList = computed(() => wf.instances
  .filter(i => i.kind === 'transfer_mediate' && i.relatedTicketStatus)
  .map(i => ({
    ...mapInstanceStatus(i.status),
    id: i.id,
    customerName: i.customerName || '-',
    intent: '有意',
    agreement: i.status === 'finished' ? '已生效' : '待签署',
    stopColl: true,
    stopCollDays: 30
  }))
)
</script>