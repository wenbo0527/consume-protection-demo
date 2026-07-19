<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">审查标准维护</h1>
        <div class="cp-page-subtitle">
          审查执行时强制关联标准清单,逐项确认后方可提交。
          <a-tag color="arcoblue" size="small">OPT-2:支持整改任务自动沉淀</a-tag>
        </div>
      </div>
      <a-button type="primary"><icon-plus /> 新增审查标准</a-button>
    </div>

    <!-- KPI 来源统计 -->
    <div class="cp-kpi-row">
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">系统内置</div>
        <div class="cp-kpi-value">{{ reviewStore.bySource.system }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">手工录入</div>
        <div class="cp-kpi-value">{{ reviewStore.bySource.manual }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">整改沉淀</div>
        <div class="cp-kpi-value" style="color: var(--cp-warning)">{{ reviewStore.bySource.rectify }}</div>
      </div>
      <div class="cp-kpi-card">
        <div class="cp-kpi-label">监管要求</div>
        <div class="cp-kpi-value">{{ reviewStore.bySource.regulator }}</div>
      </div>
    </div>

    <a-tabs default-active-key="all">
      <a-tab-pane key="all" title="全部标准">
        <div class="cp-card" style="padding: 0">
          <a-table :data="reviewStore.standards" :pagination="false" row-key="id">
            <a-table-column title="标准号" data-index="id" :width="100" />
            <a-table-column title="类别" data-index="category" :width="120" />
            <a-table-column title="审查项" data-index="item" />
            <a-table-column title="依据" data-index="basis" />
            <a-table-column title="来源" :width="120">
              <template #cell="{ record }">
                <a-tag :color="sourceColor(record.source)" size="small">{{ sourceLabel(record.source) }}</a-tag>
              </template>
            </a-table-column>
            <a-table-column title="必选" :width="60">
              <template #cell="{ record }">
                <a-tag v-if="record.required" color="red" size="small">必</a-tag>
                <a-tag v-else color="gray" size="small">选</a-tag>
              </template>
            </a-table-column>
            <a-table-column title="更新时间" data-index="createdAt" :width="150" />
            <a-table-column title="操作" :width="200">
              <template #cell="{ record }">
                <a-button size="mini">查看</a-button>
                <a-button v-if="record.source === 'rectify'" size="mini" type="text" @click="jumpRectify(record)">
                  看原整改
                </a-button>
              </template>
            </a-table-column>
          </a-table>
        </div>
      </a-tab-pane>

      <a-tab-pane key="rectify" title="整改沉淀 (OPT-2)">
        <a-alert v-if="!reviewStore.rectifyStandards.length" type="info">
          还没有整改任务沉淀的标准项。可前往「/manage/rectify」对已验证的整改任务勾选"同步沉淀为审查标准"。
        </a-alert>
        <div v-else class="cp-card" style="padding: 0">
          <a-table :data="reviewStore.rectifyStandards" :pagination="false" row-key="id">
            <a-table-column title="标准号" data-index="id" :width="100" />
            <a-table-column title="审查项" data-index="item" />
            <a-table-column title="依据" data-index="basis" />
            <a-table-column title="适用范围" data-index="scope" />
            <a-table-column title="源整改任务" data-index="rectifyTaskId" :width="180">
              <template #cell="{ record }">
                <a-link @click="jumpRectify(record)">{{ record.rectifyTaskId }}</a-link>
              </template>
            </a-table-column>
            <a-table-column title="创建人" data-index="author" :width="100" />
            <a-table-column title="创建时间" data-index="createdAt" :width="150" />
          </a-table>
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { useReviewStore, ReviewStandard } from '@/stores/review'
import { useRouter } from 'vue-router'

const reviewStore = useReviewStore()
const router = useRouter()

function sourceColor(s: string) {
  return ({ system: 'gray', manual: 'blue', rectify: 'orange', regulator: 'red' })[s] || 'gray'
}
function sourceLabel(s: string) {
  return ({ system: '系统', manual: '手工', rectify: '整改沉淀', regulator: '监管' })[s] || s
}
function jumpRectify(rec: ReviewStandard) {
  if (rec.rectifyTaskId) {
    router.push('/manage/rectify')
  } else {
    router.push('/manage/rectify')
  }
}
</script>

<style scoped>
.cp-kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.cp-kpi-card {
  padding: 12px 16px;
  background: #fff;
  border: 1px solid var(--cp-border-light);
  border-radius: 6px;
}
.cp-kpi-label { font-size: 12px; color: var(--cp-text-tertiary); margin-bottom: 4px; }
.cp-kpi-value { font-size: 24px; font-weight: 700; line-height: 1; }
</style>
