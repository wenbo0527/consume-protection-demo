<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">待审查立项</h1>
        <div class="cp-page-subtitle">登录默认页 · 状态流转不可跳过 · 归档后自动同步知识库</div>
      </div>
      <a-button type="primary" @click="$router.push('/review/create')"><icon-plus /> 新建立项</a-button>
    </div>

    <!-- 工作流待办已迁移至工单详情页 -->

    <!-- 状态筛选 -->
    <div class="cp-card" style="padding: 16px 20px; margin-bottom: 12px">
      <a-radio-group v-model="status" type="button">
        <a-radio value="">全部 ({{ list.length }})</a-radio>
        <a-radio value="draft">草稿</a-radio>
        <a-radio value="fill">任务填写</a-radio>
        <a-radio value="inReview">待审查 ({{ list.filter((x) => x.status === 'inReview').length }})</a-radio>
        <a-radio value="revise">待修改</a-radio>
        <a-radio value="archive">已归档</a-radio>
      </a-radio-group>
    </div>

    <!-- 项目卡片列表 -->
    <a-row :gutter="16">
      <a-col v-for="p in filtered" :key="p.id" :span="8">
        <div class="cp-card cp-project-card">
          <div class="cp-project-head">
            <a-tag :color="typeColor(p.type)">{{ p.typeLabel }}</a-tag>
            <status-badge :status="p.status" />
          </div>
          <div class="cp-project-name">{{ p.productName }}</div>
          <div class="cp-project-id">{{ p.id }} · 申请人 {{ p.applicant }} ({{ p.dept }})</div>
          <div class="cp-project-time">申请时间: {{ p.applyTime }}</div>

          <workflow-steps :steps="steps" :current="p.status" style="margin: 12px 0" />

          <div
            v-if="p.conclusion"
            style="
              background: #f6ffed;
              padding: 8px 10px;
              border-radius: 4px;
              font-size: 12px;
              color: var(--cp-text-secondary);
              margin-bottom: 10px;
            "
          >
            <b>审查结论:</b> {{ p.conclusion }}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center">
            <span style="font-size: 12px; color: var(--cp-text-tertiary)">审查人: {{ p.reviewer || '-' }}</span>
            <a-space :size="4">
              <a-button size="small">查看</a-button>
              <a-button
                v-if="p.status === 'fill' || p.status === 'draft'"
                size="small"
                type="primary"
                @click="$router.push(`/review/execute/${p.id}`)"
                >开始审查</a-button
              >
              <a-button
                v-if="p.status === 'inReview'"
                size="small"
                type="primary"
                status="success"
                @click="$router.push(`/review/execute/${p.id}`)"
                >继续审查</a-button
              >
              <a-button v-if="p.status === 'inReview'" size="small" type="primary" status="success">提交结论</a-button>
            </a-space>
          </div>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { reviewProjects } from '@/mock/data'
import StatusBadge from '@/components/StatusBadge.vue'
import WorkflowSteps from '@/components/WorkflowSteps.vue'

const status = ref('')
const list = reviewProjects

const filtered = computed(() => (status.value ? list.filter((p) => p.status === status.value) : list))

const steps = [
  { key: 'draft', name: '草稿' },
  { key: 'fill', name: '任务填写' },
  { key: 'pending', name: '待审查' },
  { key: 'inReview', name: '审查中' },
  { key: 'revise', name: '待修改' },
  { key: 'archive', name: '已归档' }
]

function typeColor(t: string) {
  if (t === 'newProduct') return 'blue'
  if (t === 'marketing') return 'orange'
  return 'purple'
}
</script>

<style scoped>
.cp-project-card {
  padding: 16px 20px;
  margin-bottom: 16px;
  transition: all 0.2s;
}
.cp-project-card:hover {
  box-shadow: var(--cp-shadow-md);
  transform: translateY(-2px);
}
.cp-project-head {
  display: flex;
  justify-content: space-between;
}
.cp-project-name {
  font-size: 16px;
  font-weight: 600;
  margin: 8px 0 4px;
  color: var(--cp-text);
}
.cp-project-id {
  font-size: 12px;
  color: var(--cp-text-tertiary);
}
.cp-project-time {
  font-size: 12px;
  color: var(--cp-text-tertiary);
  margin-top: 2px;
}
</style>
