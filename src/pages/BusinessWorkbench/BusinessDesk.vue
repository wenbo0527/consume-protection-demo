<template>
  <div class="cp-desk">
    <div class="cp-desk-header">
      <div class="cp-desk-status">
        <span class="cp-status-dot cp-status-idle"></span>
        <span class="cp-status-label">支撑岗 - 业务执行台</span>
      </div>
      <a-space :size="8">
        <a-button size="small" @click="pushBusinessEvent('approval', '审批结果:ST-20260715-0012 通过')">
          模拟审批结果
        </a-button>
        <a-button size="small" @click="pushBusinessEvent('negotiate_overdue', '协商方案 NX-20260601-0080 违约')">
          模拟方案违约
        </a-button>
        <a-button size="small" @click="pushBusinessEvent('stop_expire', 'ST-20260708-0009 今天到期')">
          模拟到期提醒
        </a-button>
      </a-space>
    </div>

    <!-- 工作流待办提示 -->
    <a-alert type="info" show-icon style="margin: 8px 12px">
      <template #title>工作流待办</template>
      <template #content>
        待办已绑定到具体业务申请(如停催/协商),在工单详情内联处理。
        <a-link style="margin-left: 8px" @click="$router.push('/manage/workflow-monitor')">
          跳转到工单流转监控 →
        </a-link>
      </template>
    </a-alert>

    <div class="cp-desk-body">
      <!-- 任务流 -->
      <div class="cp-desk-stream">
        <div class="cp-stream-head">
          <span>待办任务</span>
          <a-badge :count="stream.length" :offset="[4, -2]" />
        </div>
        <div class="cp-stream-list">
          <div
            v-for="t in stream"
            :key="t.id"
            class="cp-task-item"
            :class="[`pri-${t.priority}`, { 'is-active': active?.id === t.id }]"
            @click="active = t"
          >
            <div class="cp-task-head">
              <component :is="iconOf(t.type)" class="cp-task-icon" />
              <span class="cp-task-title">{{ t.title }}</span>
              <a-tag v-if="t.priority === 'critical'" color="red" size="small" class="cp-pulse">紧急</a-tag>
              <a-tag v-else-if="t.priority === 'high'" color="orange" size="small">高</a-tag>
            </div>
            <div class="cp-task-desc">{{ t.desc }}</div>
            <div class="cp-task-meta">
              <span>{{ t.source }}</span>
              <span>·</span>
              <span>{{ t.createdAt }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作区 -->
      <div class="cp-desk-action">
        <div v-if="active" class="cp-biz-action">
          <div class="cp-biz-head">
            <h2 class="cp-action-title">{{ active.title }}</h2>
            <a-tag :color="active.priority === 'critical' ? 'red' : 'orange'" size="small">
              {{ active.type }}
            </a-tag>
          </div>
          <div class="cp-biz-body">
            <a-alert :type="active.priority === 'critical' ? 'error' : 'warning'" show-icon style="margin-bottom: 16px">
              <template #title>{{ active.desc }}</template>
            </a-alert>

            <a-descriptions :column="2" bordered size="small">
              <a-descriptions-item label="任务编号">{{ active.id }}</a-descriptions-item>
              <a-descriptions-item label="来源">{{ active.source }}</a-descriptions-item>
              <a-descriptions-item label="客户">{{ active.customerName || '-' }}</a-descriptions-item>
              <a-descriptions-item label="触发时间">{{ active.createdAt }}</a-descriptions-item>
            </a-descriptions>

            <a-divider style="margin: 16px 0" />

            <div style="font-size: 13px; font-weight: 500; margin-bottom: 8px">操作</div>
            <a-space wrap>
              <a-button type="primary" @click="handle">立即处理</a-button>
              <a-button @click="handle">查看详情</a-button>
              <a-button @click="handle">关联工单</a-button>
            </a-space>
          </div>
          <div class="cp-biz-foot">
            <a-button @click="active = null">稍后处理</a-button>
            <a-button type="primary" status="success" @click="finish">完成并关闭</a-button>
          </div>
        </div>
        <div v-else class="cp-desk-empty">
          <icon-tool style="font-size: 48px; color: var(--cp-text-quaternary)" />
          <div style="margin-top: 12px; color: var(--cp-text-tertiary)">从左侧任务流选择一项开始处理</div>
        </div>
      </div>

      <!-- 上下文 -->
      <div class="cp-desk-context">
        <div class="cp-biz-context">
          <h3 class="cp-section-title">业务执行概览</h3>
          <div class="cp-stat-row" style="margin: 0; grid-template-columns: 1fr 1fr">
            <div class="cp-stat-card">
              <div class="cp-stat-label">待办业务</div>
              <div class="cp-stat-value mono">{{ stream.length }}</div>
            </div>
            <div class="cp-stat-card">
              <div class="cp-stat-label">本月处理</div>
              <div class="cp-stat-value mono" style="color: var(--cp-success)">42</div>
            </div>
            <div class="cp-stat-card">
              <div class="cp-stat-label">审批驳回</div>
              <div class="cp-stat-value mono" style="color: var(--cp-warning)">3</div>
            </div>
            <div class="cp-stat-card">
              <div class="cp-stat-label">违约记录</div>
              <div class="cp-stat-value mono" style="color: var(--cp-danger)">1</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'

interface BizTask {
  id: string
  type: string
  title: string
  desc: string
  priority: 'critical' | 'high' | 'medium'
  source: string
  createdAt: string
  customerName?: string
}

const stream = ref<BizTask[]>([
  {
    id: 'B001',
    type: '停催申请',
    title: 'GD-20260714-0008 停催审批',
    desc: '周志远·扬言客户·申请 7 天停催',
    priority: 'critical',
    source: '工单系统',
    createdAt: '2026-07-15 09:30',
    customerName: '周志远'
  },
  {
    id: 'B002',
    type: '协商方案',
    title: '刘建国·协商试算',
    desc: '客户已确认还款意向,试算 6 期方案',
    priority: 'high',
    source: '工单系统',
    createdAt: '2026-07-15 11:00',
    customerName: '刘建国'
  },
  {
    id: 'B003',
    type: '征信异议',
    title: '孙丽华·征信异议核实',
    desc: '需调取征信报告,5 个工作日内反馈',
    priority: 'high',
    source: '工单系统',
    createdAt: '2026-07-15 14:20',
    customerName: '孙丽华'
  },
  {
    id: 'B004',
    type: '审批驳回',
    title: 'ST-20260708-0009 停催被驳回',
    desc: '材料不全,请补充催收频次证据',
    priority: 'medium',
    source: 'OA系统',
    createdAt: '2026-07-13 14:00'
  },
  {
    id: 'B005',
    type: '方案违约',
    title: 'NX-20260601-0078 违约',
    desc: '王某某·已逾期 5 天·催收已恢复',
    priority: 'high',
    source: '规则引擎',
    createdAt: '2026-07-15 08:00',
    customerName: '王某某'
  }
])

const active = ref<BizTask | null>(null)

function iconOf(type: string) {
  if (type.includes('驳回')) return 'icon-close-circle'
  if (type.includes('到期')) return 'icon-clock-circle'
  if (type.includes('违约')) return 'icon-warning'
  if (type.includes('停催')) return 'icon-pause-circle'
  if (type.includes('协商')) return 'icon-handshake'
  if (type.includes('征信')) return 'icon-credit-card'
  return 'icon-tag'
}

function colorOf(type: string) {
  if (type.includes('驳回')) return 'red'
  if (type.includes('到期')) return 'orange'
  if (type.includes('违约')) return 'red'
  if (type.includes('停催')) return 'blue'
  if (type.includes('协商')) return 'cyan'
  if (type.includes('征信')) return 'purple'
  return 'gray'
}

function pushBusinessEvent(type: string, desc: string) {
  stream.value.unshift({
    id: 'B-NEW-' + Date.now(),
    type: type === 'approval' ? '审批结果' : type === 'negotiate_overdue' ? '方案违约' : '停催到期',
    title: '【新任务】' + desc,
    desc,
    priority: 'critical',
    source: '系统推送',
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
  })
  Message.success('已推送到任务流')
}

function handle() {
  Message.success('已打开操作详情')
}

// 关单弹窗的响应式选择(P0-1 兼容)
const expiringChoice = ref<'renew' | 'dispose'>('renew')
const overdueAction = ref<'re_negotiate' | 'restart' | 'archive'>('re_negotiate')

function finish() {
  if (active.value) {
    let msg = '任务已完成'
    if (active.value.type === '审批驳回') msg = '已修改并重新提交申请'
    else if (active.value.type === '停催到期') msg = expiringChoice.value === 'renew' ? '已一键续期' : '已确认处置'
    else if (active.value.type === '方案违约') msg = '已处置该违约方案'
    stream.value = stream.value.filter((t) => t.id !== active.value!.id)
    Message.success(msg)
    active.value = null
    expiringChoice.value = 'renew'
    overdueAction.value = 're_negotiate'
  }
}
</script>

<style scoped>
.cp-desk {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 56px);
}
.cp-desk-header {
  background: #fff;
  padding: 10px 24px;
  border-bottom: 1px solid var(--cp-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}
.cp-desk-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.cp-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.cp-status-idle {
  background: var(--cp-brand);
}
.cp-status-label {
  font-weight: 500;
}

.cp-desk-body {
  flex: 1;
  display: grid;
  grid-template-columns: 300px 1fr 320px;
  gap: 12px;
  padding: 12px 16px;
  overflow: hidden;
}

.cp-desk-stream {
  background: #fff;
  border: 1px solid var(--cp-border-light);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.cp-stream-head {
  padding: 12px 16px;
  border-bottom: 1px solid var(--cp-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
}
.cp-stream-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
}

.cp-task-item {
  padding: 10px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 4px;
  border-left: 3px solid transparent;
  transition: all 0.15s;
}
.cp-task-item:hover {
  background: var(--cp-bg-hover);
}
.cp-task-item.is-active {
  background: var(--cp-brand-soft);
  border-left-color: var(--cp-brand);
}
.cp-task-item.pri-critical {
  border-left-color: var(--cp-danger);
  background: var(--cp-danger-soft);
}
.cp-task-item.pri-high {
  border-left-color: var(--cp-warning);
}
.cp-task-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.cp-task-icon {
  color: var(--cp-brand);
  font-size: 14px;
}
.cp-task-title {
  font-size: 13px;
  font-weight: 500;
  flex: 1;
}
.cp-task-desc {
  font-size: 12px;
  color: var(--cp-text-secondary);
  line-height: 1.4;
}
.cp-task-meta {
  font-size: 11px;
  color: var(--cp-text-tertiary);
  margin-top: 4px;
  display: flex;
  gap: 4px;
}

.cp-desk-action {
  background: #fff;
  border: 1px solid var(--cp-border-light);
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.cp-desk-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.cp-biz-action {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.cp-biz-head {
  padding: 16px 20px;
  border-bottom: 1px solid var(--cp-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.cp-action-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}
.cp-biz-body {
  flex: 1;
  padding: 16px 20px;
  overflow-y: auto;
}
.cp-biz-foot {
  padding: 12px 20px;
  border-top: 1px solid var(--cp-border-light);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.cp-desk-context {
  background: #fff;
  border: 1px solid var(--cp-border-light);
  border-radius: 6px;
  overflow: hidden;
}
.cp-biz-context {
  padding: 16px 20px;
}
.cp-section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--cp-text);
}
</style>
