<!--
  工作流节点图(工单详情专用)
  按工单类型(kind)展示对应模板的完整节点流,并标记当前节点 + 已执行节点
  对应需求:工作流节点展示应与具体工单类型绑定,而非在通用待办卡片中展示

  Props:
    - kind: WorkflowKind(必填) — 从工单 type 映射得到
    - currentNode?: string — 当前所在节点 code(可选,高亮显示)
    - executions?: NodeExecution[] — 已执行节点历史(可选)
-->
<template>
  <div v-if="template" class="cp-flow-graph">
    <div class="cp-flow-graph-head">
      <a-tag :color="kindColor(template.kind)" size="small">{{ template.name }}</a-tag>
      <span class="cp-flow-graph-count">{{ template.nodes.length }} 个节点</span>
      <span v-if="currentNode" class="cp-flow-graph-current">
        当前节点:<b>{{ currentNodeName }}</b>
      </span>
    </div>

    <div class="cp-flow-graph-nodes">
      <template v-for="(node, idx) in template.nodes" :key="node.code">
        <div
          class="cp-flow-node"
          :class="[
            `handler-${node.handlerRole}`,
            { 'is-current': node.code === currentNode, 'is-done': isDone(node.code) }
          ]"
        >
          <div class="cp-flow-node-no">{{ idx + 1 }}</div>
          <div class="cp-flow-node-body">
            <div class="cp-flow-node-name">
              {{ node.name }}
              <a-tag v-if="node.code === currentNode" color="arcoblue" size="small">进行中</a-tag>
              <a-tag v-else-if="isDone(node.code)" color="green" size="small">已完成</a-tag>
            </div>
            <div class="cp-flow-node-meta">
              <a-tag :color="roleColor(node.handlerRole)" size="small">
                {{ nodeRoleLabel(node.handlerRole) }}
              </a-tag>
              <a-tag size="small" color="gray">{{ node.kind }}</a-tag>
              <span v-if="node.slaHours" class="cp-flow-node-sla">
                SLA {{ node.slaHours }}h
              </span>
            </div>
            <div v-if="execComment(node.code)" class="cp-flow-node-comment">
              💬 {{ execComment(node.code) }}
            </div>
          </div>
        </div>
        <div v-if="idx < template.nodes.length - 1" class="cp-flow-arrow">↓</div>
      </template>
    </div>
  </div>
  <div v-else class="cp-flow-graph-empty">
    <a-empty :size="'small'" description="该工单类型暂无对应工作流模板" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWorkflowStore } from '@/stores/workflow'
import type { NodeExecution, WorkflowKind } from '@/stores/workflow'

const props = defineProps<{
  kind: WorkflowKind
  currentNode?: string
  executions?: NodeExecution[]
}>()

const wf = useWorkflowStore()

const template = computed(() => wf.templateByKind(props.kind))
const currentNodeName = computed(() => {
  const n = template.value?.nodes.find((x) => x.code === props.currentNode)
  return n?.name || props.currentNode || '-'
})

function isDone(code: string): boolean {
  return props.executions?.some((e) => e.nodeCode === code && e.status !== 'pending') ?? false
}
function execComment(code: string): string {
  const exec = props.executions?.find((e) => e.nodeCode === code)
  return exec?.comment || ''
}

function kindColor(kind: WorkflowKind): string {
  const map: Record<string, string> = {
    stop_collection: 'red',
    negotiate: 'orange',
    transfer_mediate: 'purple',
    credit_objection: 'blue',
    review_archive: 'green',
    alert_directive: 'orangered',
    callback: 'gray'
  }
  return map[kind] || 'gray'
}
function roleColor(role: string): string {
  return {
    agent: 'arcoblue',
    business: 'orange',
    manage: 'red',
    review: 'purple',
    system: 'gray'
  }[role] || 'gray'
}
function nodeRoleLabel(role: string): string {
  return {
    agent: '一线坐席',
    business: '业务支撑',
    manage: '管理层',
    review: '审查',
    system: '系统自动'
  }[role] || role
}
</script>

<style scoped>
.cp-flow-graph {
  border: 1px solid var(--cp-border-light);
  border-radius: 6px;
  padding: 12px 16px;
  background: #fafbfc;
}
.cp-flow-graph-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--cp-border-light);
}
.cp-flow-graph-count {
  font-size: 11px;
  color: var(--cp-text-tertiary);
}
.cp-flow-graph-current {
  font-size: 12px;
  color: var(--cp-text-secondary);
  margin-left: auto;
}

.cp-flow-graph-nodes {
  display: flex;
  flex-direction: column;
}
.cp-flow-node {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 14px;
  background: #fff;
  border-left: 3px solid var(--cp-brand);
  border-radius: 4px;
  transition: all 0.15s;
}
.cp-flow-node.handler-business {
  border-left-color: var(--cp-warning);
}
.cp-flow-node.handler-manage {
  border-left-color: var(--cp-danger);
}
.cp-flow-node.handler-review {
  border-left-color: #722ed1;
}
.cp-flow-node.handler-system {
  border-left-color: var(--cp-text-quaternary);
  background: #f5f7fa;
}
.cp-flow-node.is-current {
  background: var(--cp-brand-soft);
  box-shadow: 0 0 0 2px rgba(20, 148, 232, 0.15);
}
.cp-flow-node.is-done {
  opacity: 0.7;
}
.cp-flow-node.is-done .cp-flow-node-no {
  background: #52c41a;
}
.cp-flow-node-no {
  background: var(--cp-brand);
  color: #fff;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
}
.cp-flow-node-body {
  flex: 1;
  min-width: 0;
}
.cp-flow-node-name {
  font-weight: 500;
  font-size: 13px;
  color: var(--cp-text);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.cp-flow-node-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  font-size: 11px;
}
.cp-flow-node-sla {
  font-size: 11px;
  color: var(--cp-text-tertiary);
}
.cp-flow-node-comment {
  margin-top: 4px;
  font-size: 11px;
  color: var(--cp-text-secondary);
  font-style: italic;
}

.cp-flow-arrow {
  text-align: center;
  color: var(--cp-text-quaternary);
  font-size: 14px;
  margin: 4px 0;
  height: 16px;
  line-height: 16px;
}

.cp-flow-graph-empty {
  padding: 12px 0;
}
</style>