<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">审查追溯</h1>
        <div class="cp-page-subtitle">立项 → 审查 → 归档 → 复盘 的全链路时间轴与可点击反向跳转</div>
      </div>
      <a-space>
        <a-select v-model="filterType" placeholder="事件类型" allow-clear style="width: 160px">
          <a-option value="">全部</a-option>
          <a-option value="created">立项</a-option>
          <a-option value="scoring">评分中</a-option>
          <a-option value="concluded">结论</a-option>
          <a-option value="archived">归档</a-option>
          <a-option value="quality">质检</a-option>
          <a-option value="rectify">整改</a-option>
        </a-select>
        <a-button @click="rebuildTrail">重新生成追溯链</a-button>
      </a-space>
    </div>

    <!-- KPI -->
    <div class="cp-kpi-row">
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">追溯事件</div>
        <div class="cp-kpi-value">{{ filteredEvents.length }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">涉及审查项目</div>
        <div class="cp-kpi-value">{{ projects.length }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">已归档</div>
        <div class="cp-kpi-value" style="color: var(--cp-success)">{{ archivedCount }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">关联整改</div>
        <div class="cp-kpi-value" style="color: var(--cp-warning)">{{ rectifyLinkedCount }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">关联质检</div>
        <div class="cp-kpi-value" style="color: var(--cp-brand)">{{ qualityLinkedCount }}</div>
      </div>
    </div>

    <!-- 时间轴 + 详情 -->
    <div style="display: flex; gap: 16px">
      <!-- 左:全链路时间轴 -->
      <div class="cp-card" style="padding: 20px; flex: 1; min-width: 0">
        <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 12px">全链路时间轴</h3>
        <a-empty v-if="!filteredEvents.length" description="暂无追溯事件" />
        <a-timeline v-else>
          <a-timeline-item v-for="(e, i) in filteredEvents" :key="i" :label="e.at">
            <div style="display: flex; align-items: center; gap: 8px">
              <a-tag :color="eventColor(e.type)" size="small">{{ eventLabel(e.type) }}</a-tag>
              <b>{{ e.title }}</b>
              <a-tag v-if="e.refType" size="small" color="gray">{{ e.refType }}</a-tag>
              <a-link v-if="e.jumpPath" size="small" @click="$router.push(e.jumpPath)">{{ e.refId }}</a-link>
              <span v-else-if="e.refId" class="mono" style="font-size: 12px; color: var(--cp-text-tertiary)">{{
                e.refId
              }}</span>
            </div>
            <div
              v-if="e.detail"
              style="font-size: 12px; color: var(--cp-text-secondary); margin-top: 4px; line-height: 1.5"
            >
              {{ e.detail }}
            </div>
            <div v-if="e.meta" style="font-size: 12px; color: var(--cp-text-tertiary); margin-top: 2px">
              {{ e.meta }}
            </div>
          </a-timeline-item>
        </a-timeline>
      </div>

      <!-- 右:审查项目 → 关联事件(反向追溯) -->
      <div class="cp-card" style="padding: 20px; flex: 0 0 380px; max-height: 70vh; overflow: auto">
        <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 12px">审查项目反向追溯</h3>
        <a-input-search v-model="searchProject" placeholder="搜项目编号/标题" />
        <div
          v-for="p in filteredProjects"
          :key="p.id"
          style="margin-top: 12px; padding: 10px 12px; border: 1px solid var(--cp-border-light); border-radius: 6px"
        >
          <div style="display: flex; justify-content: space-between; align-items: center">
            <span class="mono" style="font-size: 12px; color: var(--cp-text-tertiary)">{{ p.id }}</span>
            <a-tag :color="projectStatusColor(p.status)" size="small">{{ projectStatusLabel(p.status) }}</a-tag>
          </div>
          <div style="font-weight: 600; margin-top: 4px">{{ p.title }}</div>
          <div style="font-size: 12px; color: var(--cp-text-tertiary); margin-top: 2px">
            {{ p.applyTime }} · 审查人 {{ p.reviewer || '-' }}
          </div>
          <a-divider style="margin: 10px 0" />
          <div style="font-size: 12px">
            反向追溯到 <b>{{ eventsByProject(p.id).length }}</b> 个事件:
          </div>
          <div
            v-for="e in eventsByProject(p.id).slice(0, 4)"
            :key="e.id"
            style="margin-top: 6px; padding-left: 8px; border-left: 2px solid var(--cp-brand-light); font-size: 12px"
          >
            <a-tag size="small" :color="eventColor(e.type)">{{ eventLabel(e.type) }}</a-tag>
            {{ e.title }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { reviewProjects } from '@/mock/data'
import { useWorkflowStore } from '@/stores/workflow'
import { useQualityStore } from '@/stores/quality'
import { useRectifyStore } from '@/stores/rectify'
import { useKnowledgeStore } from '@/stores/knowledge'

interface AuditEvent {
  id: string
  at: string
  type: 'created' | 'scoring' | 'concluded' | 'archived' | 'quality' | 'rectify'
  title: string
  detail?: string
  meta?: string
  refType?: string // '审查项目' | '工单' | '知识' | '整改' | '质检'
  refId?: string
  projectId?: string // 反向追溯键
  jumpPath?: string
}

const wf = useWorkflowStore()
const qa = useQualityStore()
const rectify = useRectifyStore()
const kb = useKnowledgeStore()

const filterType = ref<string>('')
const searchProject = ref('')
const events = ref<AuditEvent[]>(buildTrail())

const projects = reviewProjects

function buildTrail(): AuditEvent[] {
  const list: AuditEvent[] = []

  // 1) 审查项目事件
  for (const p of projects) {
    list.push({
      id: `EVT-CREATED-${p.id}`,
      at: p.applyTime,
      type: 'created',
      title: `立项:${p.title || p.productName}`,
      detail: `${p.dept} · ${p.applicant} 提交,关联工单 ${p.ticketId || '无'}`,
      refType: '审查项目',
      refId: p.id,
      projectId: p.id,
      jumpPath: `/review/execute/${p.id}`
    })
    if (p.status === 'inReview' || p.status === 'archive' || p.status === 'revise') {
      list.push({
        id: `EVT-SCORING-${p.id}`,
        at: p.applyTime,
        type: 'scoring',
        title: `审查中:${p.title || p.productName}`,
        detail: `审查人 ${p.reviewer || '未分配'} · ${p.reviewStage || '受理阶段'}`,
        refType: '审查项目',
        refId: p.id,
        projectId: p.id,
        jumpPath: `/review/execute/${p.id}`
      })
    }
    if (p.status === 'archive' || p.status === 'revise') {
      list.push({
        id: `EVT-ARCHIVED-${p.id}`,
        at: p.applyTime,
        type: 'archived',
        title: `归档:${p.title || p.productName}`,
        detail: '审查完成,触发知识库归档',
        refType: '审查项目',
        refId: p.id,
        projectId: p.id,
        jumpPath: `/review/standards`
      })
    }
  }

  // 2) 工作流实例(归档类)
  for (const inst of wf.instances.filter((i) => i.kind === 'review_archive')) {
    list.push({
      id: `EVT-WF-${inst.id}`,
      at: inst.createdAt,
      type: 'archived',
      title: `审查归档实例:${inst.id}`,
      detail: `${inst.initiator} 发起 · 当前节点 ${inst.currentNode} · 状态 ${inst.status}`,
      refType: '工作流',
      refId: inst.id,
      projectId: inst.reviewId
    })
  }

  // 3) 质检事件
  for (const c of qa.cases) {
    if (c.totalScore !== undefined) {
      list.push({
        id: `EVT-QA-${c.id}`,
        at: c.updatedAt,
        type: 'quality',
        title: `质检 ${c.totalScore >= 80 ? '通过' : '需整改'}:${c.id}`,
        detail: `客户 ${c.customerName}(${c.customerId}) · 坐席 ${c.agentName} · 总分 ${c.totalScore} · 严重度 ${c.severity || '-'}`,
        refType: '质检',
        refId: c.id,
        projectId: undefined,
        jumpPath: '/manage/quality'
      })
    }
  }

  // 4) 整改事件
  for (const r of rectify.tasks) {
    list.push({
      id: `EVT-RECTIFY-${r.id}`,
      at: r.deadline || '-',
      type: 'rectify',
      title: `整改任务:${r.title || r.scene}`,
      detail: `${r.owner} · 状态 ${r.status} · 关联报告 ${r.reportId || '-'}`,
      refType: '整改',
      refId: r.id,
      projectId: undefined,
      jumpPath: '/manage/rectify'
    })
  }

  // 5) 知识库条目(由审查归档生成的)
  for (const k of kb.items.filter((x) => x.source?.includes('消保审查'))) {
    const reviewId = k.source?.split('·')[1]?.trim()
    list.push({
      id: `EVT-KB-${k.id}`,
      at: k.updatedAt,
      type: 'archived',
      title: `知识归档:${k.title}`,
      detail: `状态 ${k.status} · 浏览 ${k.views} · 关联审查 ${reviewId || '-'}`,
      refType: '知识',
      refId: k.id,
      projectId: reviewId,
      jumpPath: '/manage/knowledge'
    })
  }

  return list.sort((a, b) => (a.at < b.at ? 1 : -1))
}

function rebuildTrail() {
  events.value = buildTrail()
}

const filteredEvents = computed(() => {
  if (!filterType.value) return events.value
  return events.value.filter((e) => e.type === filterType.value)
})

const filteredProjects = computed(() => {
  const k = searchProject.value.trim().toLowerCase()
  if (!k) return projects
  return projects.filter((p) => p.id.toLowerCase().includes(k) || (p.title || '').toLowerCase().includes(k))
})

function eventsByProject(projectId: string) {
  return events.value.filter((e) => e.projectId === projectId)
}

const archivedCount = computed(() => projects.filter((p) => p.status === 'archive').length)
const rectifyLinkedCount = computed(() => rectify.tasks.length)
const qualityLinkedCount = computed(() => qa.cases.filter((c) => c.totalScore !== undefined).length)

function eventColor(t: string) {
  return (
    {
      created: 'blue',
      scoring: 'orange',
      concluded: 'green',
      archived: 'gray',
      quality: 'arcoblue',
      rectify: 'magenta'
    }[t] || 'gray'
  )
}
function eventLabel(t: string) {
  return (
    { created: '立项', scoring: '评分中', concluded: '结论', archived: '归档', quality: '质检', rectify: '整改' }[t] ||
    t
  )
}
function dotType(t: string) {
  return { concluded: 'success', archived: 'default', rectify: 'warning', quality: 'primary' }[t] as any
}
function projectStatusColor(s: string) {
  return { draft: 'gray', fill: 'blue', inReview: 'orange', revise: 'red', archive: 'green' }[s] || 'gray'
}
function projectStatusLabel(s: string) {
  return { draft: '草稿', fill: '填写中', inReview: '审查中', revise: '待修改', archive: '已归档' }[s] || s
}
</script>

<style scoped>
.cp-kpi-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.cp-kpi-card {
  padding: 12px 16px;
  background: #fff;
  border: 1px solid var(--cp-border-light);
  border-radius: 6px;
}
.cp-kpi-label {
  font-size: 12px;
  color: var(--cp-text-tertiary);
  margin-bottom: 4px;
}
.cp-kpi-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}
</style>
