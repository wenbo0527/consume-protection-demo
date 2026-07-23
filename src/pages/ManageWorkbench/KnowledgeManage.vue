<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">知识管理(场景视图)</h1>
        <div class="cp-page-subtitle">审查归档自动同步 · 按工单场景聚合 · 同步后"待审核"需管理员确认生效</div>
      </div>
      <a-button type="primary" @click="onAddKnowledge"><icon-plus /> 新增知识条目</a-button>
    </div>

    <div class="cp-stat-row">
      <div class="cp-stat-card">
        <div class="cp-stat-label">生效中</div>
        <div class="cp-stat-value mono" style="color: var(--cp-success)">{{ activeCount }}</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">待审核</div>
        <div class="cp-stat-value mono" style="color: var(--cp-warning)">{{ pendingCount }}</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">场景数</div>
        <div class="cp-stat-value mono">{{ scenes.length }}</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">本月新增</div>
        <div class="cp-stat-value mono">5</div>
      </div>
    </div>

    <!-- 场景聚合视图 -->
    <a-tabs default-active-key="scene" type="rounded">
      <a-tab-pane key="scene" title="按场景聚合">
        <a-row :gutter="16">
          <a-col v-for="s in scenes" :key="s" :span="8">
            <div class="cp-card cp-scene-card">
              <div class="cp-scene-head">
                <icon-book style="color: var(--cp-brand)" />
                <span class="cp-scene-title">{{ s }}</span>
                <a-tag size="small" style="margin-left: auto">{{ groupByScene(s).length }} 条</a-tag>
              </div>
              <div style="display: flex; flex-direction: column; gap: 8px">
                <div v-for="k in groupByScene(s)" :key="k.id" class="cp-scene-item">
                  <div style="display: flex; justify-content: space-between; align-items: center">
                    <a-link size="small" @click="openKbItem(k)">{{ k.title }}</a-link>
                    <a-tag v-if="k.status === 'pending'" color="orange" size="small">待审核</a-tag>
                    <a-tag v-else color="green" size="small">生效</a-tag>
                  </div>
                  <div style="font-size: 11px; color: var(--cp-text-tertiary); margin-top: 2px">
                    {{ k.categoryLabel }} · 浏览 {{ k.views }}
                  </div>
                </div>
              </div>
            </div>
          </a-col>
        </a-row>
      </a-tab-pane>

      <a-tab-pane key="all" title="全部条目">
        <div class="cp-card" style="padding: 0">
          <a-table :data="items" :pagination="{ pageSize: 10 }">
            <template #columns>
              <a-table-column title="标题" data-index="title" />
              <a-table-column title="类别">
                <template #cell="{ record }">
                  <a-tag>{{ record.categoryLabel }}</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="场景" data-index="scene">
                <template #cell="{ record }"
                  ><a-tag color="arcoblue" size="small">{{ record.scene }}</a-tag></template
                >
              </a-table-column>
              <a-table-column title="来源" data-index="source" />
              <a-table-column title="更新时间" data-index="updatedAt" />
              <a-table-column title="浏览" data-index="views" />
              <a-table-column title="状态">
                <template #cell="{ record }">
                  <a-tag v-if="record.status === 'active'" color="green">生效</a-tag>
                  <a-tag v-else-if="record.status === 'pending'" color="orange">待审核</a-tag>
                  <a-tag v-else color="gray">已下架</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="操作">
                <template #cell="{ record }">
                  <a-space :size="4">
                    <a-button v-if="record.status === 'pending'" size="small" type="primary" @click="approve(record)"
                      >审核生效</a-button
                    >
                    <a-button v-if="record.status === 'active'" size="small" status="warning" @click="archive(record)">下架</a-button>
                    <a-button size="small" @click="edit(record)">编辑</a-button>
                  </a-space>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </a-tab-pane>

      <a-tab-pane key="sync" title="同步记录">
        <div class="cp-card" style="padding: 0">
          <a-table :data="syncLogs" :pagination="false">
            <template #columns>
              <a-table-column title="触发时间" data-index="time" />
              <a-table-column title="来源">
                <template #cell="{ record }">
                  <a-tag color="purple" size="small">SC-{{ record.source }}</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="同步类型" data-index="type" />
              <a-table-column title="知识条目" data-index="target" />
              <a-table-column title="结果">
                <template #cell="{ record }">
                  <a-tag v-if="record.result === 'success'" color="green" size="small">同步成功 · 待审核</a-tag>
                  <a-tag v-else-if="record.result === 'approved'" color="blue" size="small">已审核生效</a-tag>
                  <a-tag v-else color="red" size="small">同步失败</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="操作">
                <template #cell>
                  <a-button size="small" @click="viewSyncDetail">查看详情</a-button>
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
import { knowledge as mockKnowledge } from '@/mock/data'
import { useWorkflowStore } from '@/stores/workflow'
import { useKnowledgeStore } from '@/stores/knowledge'
import { Message } from '@arco-design/web-vue'

const wf = useWorkflowStore()
const kbStore = useKnowledgeStore()

/**
 * 统一视图:
 * - 真实数据源:kbStore.items(支持 add/approve/reject/edit/remove)
 * - mock 数据保留兼容,以便场景视图能拿到 scene 字段
 * 合并两条数据流,scene/view 等展示字段以 mock 为基准
 */
const items = computed<any[]>(() => {
  // 把 store 已有同 id 的项目合并,并把 store 项目以额外形式带 scene
  const map = new Map<string, any>()
  mockKnowledge.forEach((m: any) => map.set(m.id, m))
  // 把 store 的 pending 项目叠加(可能 mock 没有)
  kbStore.pending.forEach((k: any) => {
    if (!map.has(k.id)) {
      // 取一个伪 scene,以便场景视图能展示
      map.set(k.id, { ...k, scene: '审查归档', categoryLabel: k.category })
    }
  })
  return Array.from(map.values())
})

const activeCount = computed(() => items.value.filter((k: any) => k.status === 'active').length)
const pendingCount = computed(() => items.value.filter((k: any) => k.status === 'pending').length)
const scenes = computed(() =>
  Array.from(new Set(items.value.map((k: any) => k.scene).filter(Boolean))) as string[]
)

function groupByScene(scene: string) {
  return items.value.filter((k: any) => k.scene === scene)
}

/** 审核生效:走 store */
function approve(record: any) {
  const id = record.id
  // 1) 调 store approve
  kbStore.approve(id, '陈强(管理)')
  // 2) 推动关联 review 工作流(若 record.source 标了 reviewId)
  const reviewId = record.reviewId || (record.source?.includes('消保审查') ? record.source.split('·')[1] : undefined)
  if (reviewId) {
    const inst = wf.instances.find(
      (i: any) => i.kind === 'review_archive' && i.reviewId === reviewId && i.status === 'running'
    )
    if (inst) {
      wf.approve(inst.id, '知识管理员', `审核通过知识条目:${record.title}`)
      // 副作用 notify_seat 在 store._advance 中自动触发
    }
  }
  Message.success(`"${record.title}" 已生效,坐席将收到系统通知`)
}

/** 下架:走 store */
function archive(record: any) {
  kbStore.reject(record.id)
  Message.info(`"${record.title}" 已下架`)
}

/** 编辑:弹出抽屉 */
function edit(record: any) {
  Message.info(`编辑「${record.title}」- 该功能将进入 Phase 3 知识编辑面`)
}

/** 同步记录详情 */
function viewSyncDetail() {
  Message.info('同步记录详情面板 - 后续将接入审查归档详情')
}

/** 知识标题点击 → 进入详情 */
function openKbItem(record: any) {
  Message.info(`打开知识条目「${record.title}」详情`)
}

/** 新增知识条目 */
function onAddKnowledge() {
  const title = window.prompt('新增知识条目标题', '')
  if (!title) return
  kbStore.add({
    title,
    category: '人工录入',
    tags: ['人工录入'],
    source: 'manual',
    summary: '人工录入的知识条目,待管理员补充内容',
    content: '请补充正文内容',
    author: '陈强(管理)'
  })
  Message.success(`已创建「${title}」,状态:待审核`)
}

const syncLogs = [
  {
    time: '2026-07-14 16:32',
    source: '2026-0078',
    type: '审查归档→知识库',
    target: '速贷宝 Pro 产品介绍',
    result: 'success'
  },
  {
    time: '2026-07-14 16:32',
    source: '2026-0078',
    type: '审查归档→投诉信息库',
    target: '投诉管控目标:新户≤0.5%',
    result: 'success'
  },
  {
    time: '2026-07-10 14:20',
    source: '2026-0075',
    type: '审查归档→知识库',
    target: '催收频次合规标准',
    result: 'approved'
  },
  {
    time: '2026-07-08 11:15',
    source: '2026-0072',
    type: '审查归档→知识库',
    target: '征信异议处理话术模板',
    result: 'approved'
  }
]
</script>

<style scoped>
.cp-scene-card {
  padding: 16px 20px;
  margin-bottom: 16px;
  transition: all 0.2s;
}
.cp-scene-card:hover {
  box-shadow: var(--cp-shadow-md);
  transform: translateY(-2px);
}
.cp-scene-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--cp-border);
  margin-bottom: 12px;
}
.cp-scene-title {
  font-size: 14px;
  font-weight: 600;
}
.cp-scene-item {
  padding: 8px 10px;
  background: var(--cp-bg-soft);
  border-radius: 4px;
  transition: background 0.2s;
}
.cp-scene-item:hover {
  background: var(--cp-brand-soft);
}
</style>
