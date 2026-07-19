<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">停催停扣管理</h1>
        <div class="cp-page-subtitle">申请 → 审批 → 生效 → 反馈催收系统 → 到期自动恢复</div>
      </div>
      <a-button type="primary" @click="showForm = true"><icon-plus /> 新建停催申请</a-button>
    </div>

    <!-- 到期提醒 -->
    <a-alert type="warning" show-icon style="margin-bottom: 16px">
      <template #title>2 笔停催将于 24 小时内到期</template>
      <template #content>
        <a-space>
          <a-tag color="orange" style="cursor: pointer" @click="$message.info('查看详情')">GD-20260710-0019 (明天到期)</a-tag>
          <a-tag color="orange" style="cursor: pointer" @click="$message.info('查看详情')">GD-20260708-0099 (后天到期)</a-tag>
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
import { enrichStopCollectionRow, mapInstanceStatus } from '@/utils/workflow-helpers'
import StartWorkflowModal from '@/components/StartWorkflowModal.vue'

const wf = useWorkflowStore()

const showForm = ref(false)
const form = reactive({ customer: '', ticket: '', reason: '', period: '30 天', urgency: 'normal', withhold: true })

// 从工作流实例中取停催停扣类
const list = computed(() => wf.instances
  .filter(i => i.kind === 'stop_collection')
  .map(i => {
    const row = enrichStopCollectionRow(i)
    const approveExec = i.executions.find(e => e.nodeCode === 'approve')
    return {
      ...row,
      approval: approveExec?.operator ? `${approveExec.operator}${approveExec.comment ? ' · ' + approveExec.comment : ''}` : (approveExec?.status === 'pending' ? '待审批' : '-'),
      effectiveAt: i.relatedTicketStatus ? i.createdAt : '-'
    }
  })
)

function statusColor(s: string) {
  return mapInstanceStatus(s).color === 'green' ? 'green'
    : mapInstanceStatus(s).color === 'red' ? 'red'
    : s === '已恢复' ? 'gray' : 'blue'
}

function onSubmit() {
  // 走工作流:由 StartWorkflowModal 接管
  showForm.value = false
  Message.success('请使用页面顶部"发起业务工作流"按钮创建停催申请')
}
</script>