<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">名单管理</h1>
        <div class="cp-page-subtitle">
          黑名单 {{ listStore.count.blacklist }} 条 · 投诉信息库 {{ listStore.count.complaintDB }} 条 ·
          异常代理库 {{ listStore.count.abnormalAgent }} 条 · 含有效期管理
        </div>
      </div>
      <a-space>
        <a-button @click="onBatchImport">
          <icon-upload /> 批量导入
        </a-button>
        <a-button type="primary" @click="showAddDrawer = true">
          <icon-plus /> 新增名单
        </a-button>
      </a-space>
    </div>

    <a-tabs default-active-key="blacklist" v-model:active-key="activeType">
      <a-tab-pane key="blacklist" title="黑名单">
        <div class="cp-card" style="padding: 0">
          <a-table :data="listStore.byType('blacklist')" :pagination="{ pageSize: 8 }" row-key="id">
            <template #columns>
              <a-table-column title="姓名" data-index="name" />
              <a-table-column title="身份证" data-index="idCardMask" />
              <a-table-column title="手机号" data-index="phone" />
              <a-table-column title="原因" data-index="reason" />
              <a-table-column title="来源" data-index="source" />
              <a-table-column title="生效时间" data-index="effectiveAt" />
              <a-table-column title="到期时间">
                <template #cell="{ record }">
                  <span v-if="record.isPermanent" style="color: var(--cp-text-tertiary)">永久</span>
                  <span
                    v-else
                    :class="{ 'cp-pulse': record.status === 'expiring' }"
                    :style="{ color: record.status === 'expiring' ? 'var(--cp-warning)' : 'inherit' }"
                  >
                    {{ record.expireAt }}
                  </span>
                </template>
              </a-table-column>
              <a-table-column title="状态">
                <template #cell="{ record }">
                  <a-tag v-if="record.status === 'active'" color="green">生效中</a-tag>
                  <a-tag v-else-if="record.status === 'expiring'" color="orange">即将到期</a-tag>
                  <a-tag v-else color="gray">已失效</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="操作">
                <template #cell="{ record }">
                  <a-space :size="4">
                    <a-button size="small" @click="onRenew(record)">续期</a-button>
                    <a-button size="small" status="danger" @click="onRequestRemove(record)">删除(需审批)</a-button>
                  </a-space>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </a-tab-pane>
      <a-tab-pane key="complaintDB" title="投诉信息库">
        <a-table :data="listStore.byType('complaintDB')" :pagination="{ pageSize: 8 }" row-key="id">
          <template #columns>
            <a-table-column title="姓名" data-index="name" />
            <a-table-column title="身份证" data-index="idCardMask" />
            <a-table-column title="原因" data-index="reason" />
            <a-table-column title="到期时间" data-index="expireAt" />
            <a-table-column title="状态">
              <template #cell="{ record }">
                <a-tag v-if="record.status === 'active'" color="green">生效</a-tag>
                <a-tag v-else-if="record.status === 'expiring'" color="orange">即将到期</a-tag>
                <a-tag v-else color="gray">已失效</a-tag>
              </template>
            </a-table-column>
            <a-table-column title="操作">
              <template #cell="{ record }">
                <a-space :size="4">
                  <a-button size="small" @click="onRenew(record)">续期</a-button>
                  <a-button size="small" status="danger" @click="onRequestRemove(record)">删除</a-button>
                </a-space>
              </template>
            </a-table-column>
          </template>
        </a-table>
      </a-tab-pane>
      <a-tab-pane key="abnormalAgent" title="异常代理库">
        <a-table :data="listStore.byType('abnormalAgent')" :pagination="{ pageSize: 8 }" row-key="id">
          <template #columns>
            <a-table-column title="姓名" data-index="name" />
            <a-table-column title="身份证" data-index="idCardMask" />
            <a-table-column title="原因" data-index="reason" />
            <a-table-column title="到期时间" data-index="expireAt" />
            <a-table-column title="状态">
              <template #cell="{ record }">
                <a-tag v-if="record.status === 'active'" color="green">生效</a-tag>
                <a-tag v-else-if="record.status === 'expiring'" color="orange">即将到期</a-tag>
                <a-tag v-else color="red">已失效</a-tag>
              </template>
            </a-table-column>
            <a-table-column title="操作">
              <template #cell="{ record }">
                <a-space :size="4">
                  <a-button size="small" @click="onRenew(record)">续期</a-button>
                  <a-button size="small" status="danger" @click="onRequestRemove(record)">删除</a-button>
                </a-space>
              </template>
            </a-table-column>
          </template>
        </a-table>
      </a-tab-pane>
    </a-tabs>

    <!-- 新增名单抽屉 -->
    <a-drawer v-model:visible="showAddDrawer" :width="480" title="新增名单">
      <a-form :model="addForm" layout="vertical" size="small">
        <a-form-item label="姓名" required>
          <a-input v-model="addForm.name" placeholder="如:张三" />
        </a-form-item>
        <a-form-item label="身份证号" required>
          <a-input v-model="addForm.idCardMask" placeholder="如:510104********8801" />
        </a-form-item>
        <a-form-item label="手机号">
          <a-input v-model="addForm.phone" placeholder="如:188****9090" />
        </a-form-item>
        <a-form-item label="名单类别" required>
          <a-select v-model="addForm.type">
            <a-option value="blacklist">黑名单</a-option>
            <a-option value="complaintDB">投诉信息库</a-option>
            <a-option value="abnormalAgent">异常代理库</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="入库原因" required>
          <a-textarea v-model="addForm.reason" :rows="2" placeholder="说明入库原因" />
        </a-form-item>
        <a-form-item label="来源">
          <a-input v-model="addForm.source" placeholder="如:人工标注" />
        </a-form-item>
        <a-form-item label="到期时间">
          <a-row :gutter="8">
            <a-col :span="12">
              <a-input-number v-model="addForm.days" :min="1" :max="3650" placeholder="N天后到期" />
            </a-col>
            <a-col :span="12">
              <a-checkbox v-model="addForm.isPermanent">永久生效</a-checkbox>
            </a-col>
          </a-row>
        </a-form-item>
      </a-form>
      <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px">
        <a-button @click="showAddDrawer = false">取消</a-button>
        <a-button type="primary" @click="onAdd">确认新增</a-button>
      </div>
    </a-drawer>

    <!-- 续期弹窗 -->
    <a-modal v-model:visible="renewVisible" title="续期名单" :ok-text="'续期'" @ok="onConfirmRenew">
      <p style="margin-top: 0">
        将续期 <b>{{ currentItem?.name }}</b
        >({{ currentItem?.id }})
      </p>
      <p>当前到期:{{ currentItem?.expireAt }} · 状态:{{ currentItem?.status }}</p>
      <a-form-item label="续期天数">
        <a-input-number v-model="renewDays" :min="1" :max="3650" />
      </a-form-item>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useListStore, type ListType } from '@/stores/list'
import { useWorkflowStore } from '@/stores/workflow'
import { useUserStore, getRoleInfo } from '@/stores/user'
import type { BlackListItem } from '@/mock/data'

const listStore = useListStore()
const wf = useWorkflowStore()
const userStore = useUserStore()

const activeType = ref<ListType>('blacklist')

const showAddDrawer = ref(false)
const addForm = reactive({
  name: '',
  idCardMask: '',
  phone: '',
  type: 'blacklist' as ListType,
  typeLabel: '黑名单',
  reason: '',
  source: '人工录入',
  days: 90,
  isPermanent: false
})

function onAdd() {
  if (!addForm.name || !addForm.idCardMask || !addForm.reason) {
    Message.warning('姓名 / 身份证号 / 入库原因 必填')
    return
  }
  const labels: Record<ListType, string> = {
    blacklist: '黑名单',
    complaintDB: '投诉信息库',
    abnormalAgent: '异常代理'
  }
  addForm.typeLabel = labels[addForm.type]
  listStore.add({ ...addForm })
  Message.success(`已新增 ${addForm.name} 到 ${addForm.typeLabel}`)
  // 重置
  Object.assign(addForm, {
    name: '',
    idCardMask: '',
    phone: '',
    type: activeType.value,
    typeLabel: labels[activeType.value],
    reason: '',
    source: '人工录入',
    days: 90,
    isPermanent: false
  })
  showAddDrawer.value = false
}

function onBatchImport() {
  // 演示用:手动注入 2 条 mock 数据
  const sample: Array<Omit<BlackListItem, 'id' | 'effectiveAt' | 'status'>> = [
    {
      name: '测试导入A',
      idCardMask: '510104********9901',
      phone: '188****0001',
      type: 'blacklist',
      typeLabel: '黑名单',
      reason: '批量导入演示 · 法院失信',
      source: '法院对接',
      expireAt: '永久',
      isPermanent: true
    },
    {
      name: '测试导入B',
      idCardMask: '440305********8802',
      phone: '136****0002',
      type: 'abnormalAgent',
      typeLabel: '异常代理',
      reason: '批量导入演示 · 身份核验异常',
      source: '人工标注',
      expireAt: '2026-12-31',
      isPermanent: false
    }
  ]
  const n = listStore.bulkImport(sample)
  Message.success(`批量导入成功,新增 ${n} 条`)
}

const renewVisible = ref(false)
const renewDays = ref(90)
const currentItem = ref<BlackListItem | null>(null)

function onRenew(item: BlackListItem) {
  currentItem.value = item
  renewDays.value = 90
  renewVisible.value = true
}
function onConfirmRenew() {
  if (!currentItem.value) return
  if (currentItem.value.isPermanent) {
    Message.warning('永久生效名单不需要续期')
    renewVisible.value = false
    return
  }
  listStore.renew(currentItem.value.id, renewDays.value)
  Message.success(`已续期 ${currentItem.value.name} ${renewDays.value} 天`)
  renewVisible.value = false
}

function onRequestRemove(item: BlackListItem) {
  const req = listStore.requestRemove(item.id)
  if (!req) return
  // 走 alert_directive 工作流:管理层二次确认 → 通过后真删
  const role = userStore.currentRole || 'manage'
  const operator = (role ? getRoleInfo(role)?.username : '陈强') || '陈强'
  const inst = wf.start({
    kind: 'alert_directive',
    initiator: operator,
    initiatorRole: 'manage',
    alertId: `RM-${item.id}`,
    ticketId: undefined,
    payload: {
      instruction: `删除名单: ${item.name} (${item.id}),原因: ${item.reason}`,
      assignTo: operator,
      opinion: req.reason,
      alertTitle: `名单删除审批 - ${item.name}`
    }
  })
  if (inst) {
    // 模拟审批通过(演示用)→ 直接删;真实场景由审批回调触发
    setTimeout(() => {
      listStore.remove(item.id)
      Message.success(
        `删除审批已通过(模拟),${item.name} 已从名单移除`
      )
    }, 800)
    Message.info(`已发起审批流 ${inst.id},1s 内自动通过(演示)`)
  } else {
    Message.warning('工作流启动失败,请稍后重试')
  }
}
</script>
