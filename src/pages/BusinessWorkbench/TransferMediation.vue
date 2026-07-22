<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">转诉调解</h1>
        <div class="cp-page-subtitle">外部转接(京东/美团/蚂蚁/12345) · 司法调解 · 案件管理</div>
      </div>
    </div>

    <!-- ============ P3-B7:12345 政务平台每日人工统计面板 ============ -->
    <a-card class="cp-card" style="margin-bottom: 16px; border-left: 4px solid var(--cp-warning)">
      <h3 class="cp-section-title" style="margin: 0 0 12px">
        📥 12345 政务平台工单 · 每日人工统计
        <a-tag color="orange" size="small">支撑岗痛点 · 现状:每日人工抄录</a-tag>
      </h3>
      <a-row :gutter="12">
        <a-col :span="6">
          <div class="cp-stat-card">
            <div class="cp-stat-label">今日接收</div>
            <div class="cp-stat-value mono">{{ hot12345.todayCount }}</div>
            <div class="cp-stat-extra cp-pulse" style="color: var(--cp-warning)">
              需人工登记至工单系统
            </div>
          </div>
        </a-col>
        <a-col :span="6">
          <div class="cp-stat-card">
            <div class="cp-stat-label">已登记工单系统</div>
            <div class="cp-stat-value mono" style="color: var(--cp-success)">{{ hot12345.registered }}</div>
            <div class="cp-stat-extra">未登记 {{ hot12345.todayCount - hot12345.registered }} 条</div>
          </div>
        </a-col>
        <a-col :span="6">
          <div class="cp-stat-card">
            <div class="cp-stat-label">已回复 12345</div>
            <div class="cp-stat-value mono">{{ hot12345.replied }}</div>
            <div class="cp-stat-extra">回复率 {{ Math.round((hot12345.replied / hot12345.todayCount) * 100) }}%</div>
          </div>
        </a-col>
        <a-col :span="6">
          <div class="cp-stat-card">
            <div class="cp-stat-label">平均登记耗时</div>
            <div class="cp-stat-value mono" style="color: var(--cp-danger)">{{ hot12345.avgTime }}min</div>
            <div class="cp-stat-extra">每个工单手工抄录</div>
          </div>
        </a-col>
      </a-row>
      <a-alert type="warning" show-icon style="margin-top: 12px">
        <template #title>⚠️ 痛点:目前由同事每日人工统计 — 容易漏单 / 延迟登记</template>
        <template #content>
          <span style="font-size: 12px">
            理想路径:Phase 2 起 12345 工单自动同步至工单系统,
            支撑岗直接在工单系统处理,不再人工抄录。
            对应支撑岗旅程 §3g"向内转:接收 12345 政务平台工单"。
          </span>
          <div style="margin-top: 8px">
            <a-button size="mini" type="primary" status="warning" @click="manualRegister">
              一键登记今日未登记工单
            </a-button>
            <a-button size="mini" style="margin-left: 8px">查看登记历史</a-button>
          </div>
        </template>
      </a-alert>
    </a-card>

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
                  <a-tag :color="record.platformStatus === '已结案' ? 'green' : 'blue'">{{
                    record.platformStatus
                  }}</a-tag>
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
                  <span v-if="record.stopColl" style="color: var(--cp-success)"
                    >已触发 · {{ record.stopCollDays }}天</span
                  >
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
import { computed, reactive } from 'vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useWorkflowStore } from '@/stores/workflow'
import { enrichTransferMediateRow, mapInstanceStatus, mapNodeName } from '@/utils/workflow-helpers'
import { Message } from '@arco-design/web-vue'
const wf = useWorkflowStore()

/** ============ P3-B7:12345 政务平台每日人工统计 ============
 *  对应旅程:支撑岗 §3g "向内转:接收 12345 政务平台工单 - 现状由同事每日人工统计"
 *  数据为 mock,演示痛点场景;Phase 2 将自动同步
 */
const hot12345 = reactive({
  todayCount: 28, // 今日接收
  registered: 9, // 已登记
  replied: 6, // 已回复
  avgTime: 8 // 平均登记耗时(分钟)
})
function manualRegister() {
  if (hot12345.registered >= hot12345.todayCount) {
    Message.info('今日工单已全部登记')
    return
  }
  hot12345.registered = hot12345.todayCount
  Message.success(`已一键登记 ${hot12345.todayCount} 条 12345 工单至工单系统`)
}

// 转诉调解统一从工作流实例里取(transfer_mediate 类型)
const transferList = computed(() =>
  wf.instances
    .filter((i) => i.kind === 'transfer_mediate')
    .map((i) => {
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

const mediateList = computed(() =>
  wf.instances
    .filter((i) => i.kind === 'transfer_mediate' && i.relatedTicketStatus)
    .map((i) => ({
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
