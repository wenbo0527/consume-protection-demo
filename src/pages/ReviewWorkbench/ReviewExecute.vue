<template>
  <div class="cp-page" v-if="project">
    <a-page-header :title="`审查执行 - ${project.productName}`" :subtitle="`立项编号 ${project.id} · 申请人 ${project.applicant}`">
      <template #back-icon><icon-left /></template>
      <template #extra>
        <a-space>
          <a-button @click="$router.back()">返回</a-button>
          <a-button type="primary" :disabled="!canSubmit" @click="showArchive = true">提交审查结论</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-alert type="info" show-icon style="margin-bottom: 16px">
      <template #title>审查执行规则</template>
      <template #content>
        根据审查标准强制关联要求,审查人进入"审查中"状态时,系统自动加载对应类别的标准清单,必须逐项确认通过/不通过,所有<strong>必选项</strong>确认后方可提交审查结论。
      </template>
    </a-alert>

    <!-- 立项基本信息 -->
    <div class="cp-card" style="padding: 20px 24px; margin-bottom: 16px">
      <h3 class="cp-section-title">立项基本信息</h3>
      <a-descriptions :column="3" size="small">
        <a-descriptions-item label="立项类型">
          <a-tag :color="typeColor(project.type)">{{ project.typeLabel }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="产品名称">{{ project.productName }}</a-descriptions-item>
        <a-descriptions-item label="申请部门">{{ project.dept }}</a-descriptions-item>
        <a-descriptions-item label="申请人">{{ project.applicant }}</a-descriptions-item>
        <a-descriptions-item label="申请时间">{{ project.applyTime }}</a-descriptions-item>
        <a-descriptions-item label="审查人">{{ project.reviewer }}</a-descriptions-item>
      </a-descriptions>

      <a-collapse style="margin-top: 12px">
        <a-collapse-item header="项目说明书" key="1">
          <p style="color: var(--cp-text-secondary)">速贷宝 Pro 是面向优质客户的循环额度产品,授信额度 1-30 万,年化利率 18%-24%...</p>
        </a-collapse-item>
        <a-collapse-item header="投诉管控目标" key="2">
          <p style="color: var(--cp-text-secondary)">新户投诉率 ≤0.5%, 重复投诉率 ≤8%, 监管件超时率 ≤5%</p>
        </a-collapse-item>
      </a-collapse>
    </div>

    <!-- 标准清单逐项确认(必填) -->
    <div class="cp-card" style="padding: 20px 24px; margin-bottom: 16px">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
        <h3 class="cp-section-title" style="margin: 0">
          审查标准清单
          <a-tag size="small" style="margin-left: 8px">{{ standards.length }} 项</a-tag>
          <a-tag v-if="requiredDone === requiredTotal" size="small" color="green" style="margin-left: 4px">必选已全确认</a-tag>
          <a-tag v-else size="small" color="orange" style="margin-left: 4px">必选待确认 {{ requiredTotal - requiredDone }}</a-tag>
        </h3>
        <a-space>
          <span style="font-size: 12px; color: var(--cp-text-tertiary)">
            已确认 {{ Object.keys(results).length }} / {{ standards.length }}
          </span>
        </a-space>
      </div>

      <a-table :data="standards" :pagination="false" row-key="id">
        <template #columns>
          <a-table-column title="类别" data-index="category" :width="120">
            <template #cell="{ record }">
              <a-tag size="small">{{ record.category }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="审查项" data-index="item" :width="160" />
          <a-table-column title="审查依据" data-index="basis" />
          <a-table-column title="必选" :width="70">
            <template #cell="{ record }">
              <a-tag v-if="record.required" color="red" size="small">必选</a-tag>
              <a-tag v-else color="gray" size="small">可选</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="审查结论" :width="220">
            <template #cell="{ record }">
              <a-radio-group v-model="results[record.id]" type="button" size="small">
                <a-radio-button value="pass">通过</a-radio-button>
                <a-radio-button value="reject">不通过</a-radio-button>
                <a-radio-button value="na">不适用</a-radio-button>
              </a-radio-group>
            </template>
          </a-table-column>
          <a-table-column title="备注" :width="180">
            <template #cell="{ record }">
              <a-input v-if="results[record.id]" v-model="notes[record.id]" placeholder="补充说明..." size="small" />
            </template>
          </a-table-column>
        </template>
      </a-table>
    </div>

    <!-- 整体审查意见 -->
    <div class="cp-card" style="padding: 20px 24px">
      <h3 class="cp-section-title">整体审查意见</h3>
      <div class="cp-form">
        <a-form-item label="审查结论" required>
          <a-radio-group v-model="conclusion">
            <a-radio value="pass">审查通过,同意上线</a-radio>
            <a-radio value="revise">需修改,补充材料后重新提交</a-radio>
            <a-radio value="reject">审查不通过,驳回</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="审查意见说明" required>
          <a-textarea v-model="comment" :rows="4" placeholder="请填写详细的审查意见,归档后将作为知识库内容自动同步..." />
        </a-form-item>
      </div>
    </div>

    <!-- 归档同步预览(SC-003) -->
    <a-modal v-model:visible="showArchive" title="审查归档 - 知识库同步预览" :width="720" :ok-text="'确认归档并同步知识库'">
      <a-alert type="info" show-icon style="margin-bottom: 16px">
        <template #title>SC-003 提取规则</template>
        <template #content>
          归档时系统将自动按规则提取信息推送至知识库(状态"待审核",管理员确认后生效)。
        </template>
      </a-alert>
      <div style="display: flex; flex-direction: column; gap: 12px">
        <div class="cp-extract-row">
          <div class="cp-extract-key">立项类型 + 产品名称 → 知识条目标题</div>
          <div class="cp-extract-val">{{ project.typeLabel }}: {{ project.productName }}</div>
        </div>
        <div class="cp-extract-row">
          <div class="cp-extract-key">审查结论 → 知识条目内容摘要</div>
          <div class="cp-extract-val">{{ comment || '需填写审查意见' }}</div>
        </div>
        <div class="cp-extract-row">
          <div class="cp-extract-key">审查标准通过/不通过项 → 知识条目风险提示</div>
          <div class="cp-extract-val">
            <a-tag v-for="(v, k) in results" :key="k" :color="v === 'pass' ? 'green' : v === 'reject' ? 'red' : 'gray'" size="small" style="margin: 2px">
              {{ getStandardItem(k) }}: {{ v === 'pass' ? '通过' : v === 'reject' ? '不通过' : '不适用' }}
            </a-tag>
          </div>
        </div>
      </div>
      <a-divider />
      <a-alert type="warning" show-icon>
        <template #title>归档后通知</template>
        <template #content>
          归档完成后,自动通知<strong>立项申请人</strong>和<strong>业务部门</strong>,通知内容包括审查结论与知识库更新摘要。
        </template>
      </a-alert>
      <template #footer>
        <a-button @click="showArchive = false">取消</a-button>
        <a-button type="primary" @click="doArchive">确认归档</a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { reviewProjects, reviewStandards, knowledge } from '@/mock/data'
import { useWorkflowStore } from '@/stores/workflow'
import { Message } from '@arco-design/web-vue'

const route = useRoute()
const router = useRouter()
const wf = useWorkflowStore()

const project = computed(() => reviewProjects.find(p => p.id === route.params.id))

const standards = computed(() => {
  if (!project.value) return []
  const typeMap: Record<string, string> = { newProduct: '产品审查', marketing: '营销审查', change: '变更审查' }
  return reviewStandards.filter(s => s.category === typeMap[project.value!.type])
})

const results = reactive<Record<string, string>>({})
const notes = reactive<Record<string, string>>({})
const conclusion = ref('')
const comment = ref('')
const showArchive = ref(false)

const requiredTotal = computed(() => standards.value.filter(s => s.required).length)
const requiredDone = computed(() => standards.value.filter(s => s.required && results[s.id]).length)

const canSubmit = computed(() => {
  return conclusion.value && comment.value && requiredDone.value === requiredTotal.value
})

function getStandardItem(id: string) {
  return standards.value.find(s => s.id === id)?.item || id
}

function typeColor(t: string) {
  if (t === 'newProduct') return 'blue'
  if (t === 'marketing') return 'orange'
  return 'purple'
}

function doArchive() {
  showArchive.value = false
  // 走工作流:归档动作 = 触发 review_archive 工作流
  // 节点1:审查人员归档(自动副作用 archive_to_kb,自动推进)
  // 节点2:管理层审核知识条目
  // 节点3:通知坐席(知识更新)
  const inst = wf.start({
    kind: 'review_archive',
    initiator: project.value?.reviewer || '审查人员',
    initiatorRole: 'review',
    reviewId: project.value!.id,
    payload: {
      title: `${project.value!.productName} (${project.value!.typeLabel})`,
      summary: comment.value.slice(0, 80) || `${project.value!.productName} 审查归档`,
      content: comment.value || '审查归档内容(由审查工作流自动生成)',
      category: '审查归档'
    }
  })

  // 同时在 mock knowledge 数组里也写入(让旧 KnowledgeManage 仍可见)
  const newItem = {
    id: `K${String(knowledge.length + 1).padStart(3, '0')}`,
    title: `${project.value!.productName} (${project.value!.typeLabel})`,
    category: 'review' as const,
    categoryLabel: '审查意见',
    content: comment.value,
    source: `消保审查·${project.value!.id}`,
    updatedAt: '2026-07-15',
    status: 'pending' as const,
    views: 0
  }
  knowledge.unshift(newItem as any)

  if (inst) {
    Message.success(`归档完成!已生成工作流实例 ${inst.id},知识条目进入待审核,待管理层审核后通知坐席`)
  } else {
    Message.success('归档完成!已通知申请人,知识库已自动同步(待审核)')
  }
  setTimeout(() => router.push('/review/pending'), 800)
}
</script>

<style scoped>
.cp-section-title { font-size: 14px; font-weight: 600; color: var(--cp-text); margin: 0; }
.cp-extract-row {
  display: grid; grid-template-columns: 200px 1fr; gap: 12px;
  padding: 10px 12px; background: var(--cp-bg-soft); border-radius: 6px;
  align-items: start;
}
.cp-extract-key { font-size: 12px; color: var(--cp-text-tertiary); font-weight: 500; }
.cp-extract-val { font-size: 13px; color: var(--cp-text); line-height: 1.6; }
</style>