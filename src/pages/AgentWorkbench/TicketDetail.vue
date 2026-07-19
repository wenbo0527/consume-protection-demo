<template>
  <div class="cp-ticket" v-if="ticket">
    <!-- ============== 顶部操作栏 ============== -->
    <div class="cp-tk-header">
      <div class="cp-tk-meta">
        <a-link v-if="!embedded" @click="$router.back()"><icon-left /></a-link>
        <a-link v-else @click="$emit('close')"><icon-left /></a-link>
        <span class="cp-tk-id">{{ ticket.id }}</span>
        <a-tag :color="typeColor(ticket.type)" size="small">{{ ticket.typeLabel }}</a-tag>
        <status-badge :status="ticket.urgency" />
        <a-tag v-if="ticket.isRegulator" color="orangered" size="small">监管件</a-tag>
        <status-badge :status="ticket.status" />
      </div>
      <div class="cp-tk-actions">
        <a-dropdown trigger="click">
          <a-button>
            流转 <icon-down />
          </a-button>
          <template #content>
            <a-doption @click="showTransfer = true">
              <icon-swap /> 转办给他人
            </a-doption>
            <a-doption @click="showAssist = true">
              <icon-user-group /> 协办
            </a-doption>
            <a-doption @click="showUpgrade = true">
              <icon-up /> 升级上级
            </a-doption>
          </template>
        </a-dropdown>
        <a-button type="primary" status="success" :disabled="ticket.status === 'closed'" @click="close">
          关单
        </a-button>
      </div>
    </div>

    <!-- ============== 第一段:客户 + 工单摘要(2 列紧凑) ============== -->
    <div class="cp-tk-summary">
      <!-- 左:客户行 -->
      <div class="cp-summary-row">
        <icon-user style="color: var(--cp-brand); flex-shrink: 0" />
        <span class="cp-summary-key">客户</span>
        <a-link style="font-weight: 600" @click="goCustomer">{{ customer?.name }}</a-link>
        <span class="cp-summary-sep">·</span>
        <span class="mono">{{ customer?.phone }}</span>
        <risk-tag v-for="t in customer?.riskTags || []" :key="t" :type="t" />
      </div>
      <!-- 右:工单要点行 -->
      <div class="cp-summary-row">
        <icon-tag style="color: var(--cp-brand); flex-shrink: 0" />
        <span class="cp-summary-key">工单</span>
        <span>{{ ticket.category }} / {{ ticket.reason }}</span>
        <span class="cp-summary-sep">·</span>
        <span>渠道 {{ ticket.channel }}</span>
        <span class="cp-summary-sep">·</span>
        <span>受理 {{ ticket.createdAt }}</span>
        <span class="cp-summary-sep">·</span>
        <span>处理人 {{ ticket.handler }}</span>
      </div>
    </div>

    <!-- ============== 第二段:诉求描述 ============== -->
    <div class="cp-tk-section">
      <div class="cp-section-label">诉求描述</div>
      <div class="cp-description">{{ ticket.description }}</div>
    </div>

    <!-- ============== 第三段:相关知识 + 处理意见(并排) ============== -->
    <div class="cp-tk-work">
      <!-- 左:相关知识推荐 -->
      <div class="cp-knowledge">
        <div class="cp-section-label">
          <icon-book style="color: var(--cp-brand)" />
          <span>相关知识</span>
          <a-tag size="small" color="arcoblue">{{ relatedKnowledge.length }}</a-tag>
        </div>
        <div v-if="relatedKnowledge.length" class="cp-kw-list">
          <div v-for="k in relatedKnowledge" :key="k.id" class="cp-kw-item">
            <div style="flex: 1; min-width: 0">
              <div class="cp-kw-title">{{ k.title }}</div>
              <div class="cp-kw-content">{{ k.content.slice(0, 60) }}...</div>
            </div>
            <a-button size="small" type="primary" @click="cite(k)">
              <icon-link /> 引用
            </a-button>
          </div>
        </div>
        <a-empty v-else size="small" description="暂无相关知识" />
      </div>

      <!-- 右:处理意见 -->
      <div class="cp-opinion">
        <div class="cp-section-label">
          <icon-edit style="color: var(--cp-brand)" />
          <span>处理意见</span>
          <a-tag v-if="cited.length" color="green" size="small">已引用 {{ cited.length }} 条</a-tag>
        </div>
        <a-textarea
          v-model="opinion"
          :rows="6"
          placeholder="请填写处理意见,引用知识将自动追加到意见并记录来源..."
          :max-length="500"
          show-word-limit
        />
        <div v-if="cited.length" class="cp-cite-list">
          <icon-link style="color: var(--cp-brand)" />
          <a-tag v-for="c in cited" :key="c.id" size="small" closable @close="cited = cited.filter(x => x.id !== c.id)" style="margin: 2px">
            {{ c.title }}
          </a-tag>
        </div>
      </div>
    </div>

    <!-- ============== 底部固定操作栏 ============== -->
    <div class="cp-tk-footer">
      <a-link @click="showHistory = !showHistory" style="font-size: 12px">
        <icon-history /> {{ showHistory ? '隐藏' : '查看' }}处理历史 ({{ ticket.timeline.length }})
      </a-link>
      <a-space>
        <a-button v-if="!embedded" @click="$router.back()">取消</a-button>
        <a-button v-else @click="$emit('close')">取消</a-button>
        <a-button type="primary" @click="save">保存</a-button>
        <a-button type="primary" status="success" @click="close">保存并关单</a-button>
      </a-space>
    </div>

    <!-- 处理历史(可折叠) -->
    <a-drawer v-model:visible="showHistory" title="处理历史" :width="480" placement="right">
      <a-timeline>
        <a-timeline-item v-for="(item, idx) in extendedTimeline" :key="idx" :label="item.time">
          <div style="font-weight: 500">{{ item.action }}</div>
          <div style="font-size: 12px; color: var(--cp-text-tertiary)">操作人:{{ item.operator }}</div>
          <div v-if="(item as any).ref" style="font-size: 12px; color: var(--cp-brand); margin-top: 2px">
            <icon-link /> 引用:{{ (item as any).ref }}
          </div>
        </a-timeline-item>
      </a-timeline>
    </a-drawer>

    <!-- 转办 Modal -->
    <a-modal v-model:visible="showTransfer" title="转办给他人" :width="480" :ok-text="'确认转办'">
      <div class="cp-form">
        <a-form-item label="转给" required>
          <a-select v-model="transferForm.assignee" placeholder="选择接收人">
            <a-option>李伟(业务执行)</a-option>
            <a-option>王芳(审查组)</a-option>
            <a-option>陈强(管理层)</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="转办原因" required>
          <a-textarea v-model="transferForm.reason" :rows="3" placeholder="接收人会看到该原因..." />
        </a-form-item>
      </div>
      <template #footer>
        <a-button @click="showTransfer = false">取消</a-button>
        <a-button type="primary" @click="doFlow('转办')">确认</a-button>
      </template>
    </a-modal>

    <!-- 协办 Modal -->
    <a-modal v-model:visible="showAssist" title="协办" :width="480" :ok-text="'发起协办'">
      <div class="cp-form">
        <a-form-item label="协办人" required>
          <a-select v-model="assistForm.users" multiple placeholder="可多选">
            <a-option>王芳(审查)</a-option>
            <a-option>陈强(管理)</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="协办事项" required>
          <a-textarea v-model="assistForm.task" :rows="3" />
        </a-form-item>
      </div>
      <template #footer>
        <a-button @click="showAssist = false">取消</a-button>
        <a-button type="primary" @click="doFlow('协办')">确认</a-button>
      </template>
    </a-modal>

    <!-- 升级 Modal -->
    <a-modal v-model:visible="showUpgrade" title="升级上级" :width="480" :ok-text="'确认升级'">
      <a-alert type="warning" show-icon style="margin-bottom: 16px">
        升级后处理时限重新计算,工单转交上级处理。
      </a-alert>
      <div class="cp-form">
        <a-form-item label="升级至" required>
          <a-radio-group v-model="upgradeForm.target">
            <a-radio>组长</a-radio>
            <a-radio>部门经理</a-radio>
            <a-radio>消保管理层</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="升级原因" required>
          <a-textarea v-model="upgradeForm.reason" :rows="3" />
        </a-form-item>
      </div>
      <template #footer>
        <a-button @click="showUpgrade = false">取消</a-button>
        <a-button type="primary" status="warning" @click="doFlow('升级')">确认</a-button>
      </template>
    </a-modal>
  </div>
  <a-empty v-else description="工单不存在" />
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tickets, customers, knowledge } from '@/mock/data'
import StatusBadge from '@/components/StatusBadge.vue'
import RiskTag from '@/components/RiskTag.vue'
import { Message } from '@arco-design/web-vue'

const props = defineProps<{ ticketId?: string; embedded?: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const route = useRoute()
const router = useRouter()

const ticket = computed(() => tickets.find(t => t.id === (props.ticketId || route.params.id)))
const customer = computed(() => customers.find(c => c.id === ticket.value?.customerId))

const opinion = ref('')
const cited = ref<any[]>([])
const showHistory = ref(false)

const showTransfer = ref(false)
const showAssist = ref(false)
const showUpgrade = ref(false)
// 关单流程(服务总结模板 · P1-2 补齐)
const closeConfirmVisible = ref(false)
const closeResult = ref<'resolved' | 'unresolved'>('resolved')
const closeUnresolvedReason = ref('')

const transferForm = reactive({ assignee: '', reason: '' })
const assistForm = reactive({ users: [] as string[], task: '' })
const upgradeForm = reactive({ target: '组长', reason: '' })

// 场景化知识匹配
const relatedKnowledge = computed(() => {
  if (!ticket.value) return []
  return knowledge.filter(k =>
    k.relatedCategories?.includes(ticket.value!.category) ||
    k.relatedReasons?.includes(ticket.value!.reason)
  ).slice(0, 3)
})

function typeColor(t: string) {
  return t === 'complaint' ? 'red' : t === 'external' ? 'orangered' : t === 'consult' ? 'arcoblue' : 'gray'
}

function cite(k: any) {
  if (cited.value.find(c => c.id === k.id)) {
    Message.warning('该知识已引用')
    return
  }
  cited.value.push(k)
  opinion.value += `\n[引用 ${k.title}]`
  Message.success('已引用,来源将记录到处理历史')
}

const extendedTimeline = computed(() => {
  if (!ticket.value) return []
  const items = [...ticket.value.timeline]
  cited.value.forEach(c => {
    items.push({ time: '刚刚', action: `引用知识:${c.title}`, operator: '坐席', ref: c.source } as any)
  })
  return items
})

function goCustomer() {
  if (customer.value) router.push(`/agent/customer/${customer.value.id}`)
}

function save() {
  if (opinion.value.trim()) {
    const now = new Date()
    const ts = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    ticket.value!.timeline.push({ time: ts, action: '保存处理意见', operator: '张敏' })
    cited.value.forEach(c => {
      if (!ticket.value!.timeline.find((t: any) => t.action === `引用知识:${c.title}`)) {
        ticket.value!.timeline.push({ time: ts, action: `引用知识:${c.title}`, operator: '张敏' } as any)
      }
    })
  }
  Message.success('处理意见已保存' + (cited.value.length ? `,引用 ${cited.value.length} 条知识` : ''))
}

function close() {
  // 高优 3 + 高优 2:关单时持久化引用和处理意见到工单时间轴
  const now = new Date()
  const ts = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  ticket.value!.timeline.push({ time: ts, action: `关单 · 处理结果:${closeResult.value}`, operator: '张敏' })
  if (cited.value.length) {
    cited.value.forEach((c, i) => {
      ticket.value!.timeline.push({ time: ts, action: `引用知识:${c.title}`, operator: '张敏' } as any)
    })
  }
  if (closeResult.value === 'unresolved') {
    ticket.value!.timeline.push({ time: ts, action: `≤2星自动创建回访工单 · 原因:${closeUnresolvedReason.value}`, operator: '系统' })
  }

  closeConfirmVisible.value = false
  Message.success('工单已关单' + (closeResult.value === 'unresolved' ? ',已自动创建回访工单' : ''))
  if (props.embedded) {
    setTimeout(() => emit('close'), 500)
  } else {
    setTimeout(() => router.push('/agent/desk'), 500)
  }
}

function doFlow(action: string) {
  showTransfer.value = showAssist.value = showUpgrade.value = false
  Message.success(`${action}成功,指令已下达`)
}
</script>

<style scoped>
/* ============ 三段式紧凑布局 ============ */
.cp-ticket {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

/* 顶部操作栏 */
.cp-tk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid var(--cp-border-light);
  flex-shrink: 0;
}
.cp-tk-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.cp-tk-id {
  font-family: 'DIN Alternate', monospace;
  font-weight: 600;
  font-size: 14px;
  color: var(--cp-text);
}
.cp-tk-actions {
  display: flex;
  gap: 8px;
}

/* 摘要区 */
.cp-tk-summary {
  padding: 10px 20px;
  background: var(--cp-bg-soft);
  border-bottom: 1px solid var(--cp-border-light);
  flex-shrink: 0;
}
.cp-summary-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--cp-text-secondary);
  padding: 4px 0;
}
.cp-summary-key {
  color: var(--cp-text-tertiary);
  font-size: 12px;
  min-width: 32px;
}
.cp-summary-sep {
  color: var(--cp-text-quaternary);
}

/* 诉求描述 */
.cp-tk-section {
  padding: 16px 20px;
  border-bottom: 1px solid var(--cp-border-light);
  flex-shrink: 0;
}
.cp-section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--cp-text);
  margin-bottom: 8px;
}
.cp-description {
  font-size: 13px;
  color: var(--cp-text-secondary);
  line-height: 1.7;
  padding: 8px 12px;
  background: var(--cp-bg-soft);
  border-radius: 4px;
  border-left: 3px solid var(--cp-brand);
}

/* 工作区:左知识 + 右意见 */
.cp-tk-work {
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  padding: 16px 20px;
  overflow-y: auto;
  min-height: 0;
}

.cp-knowledge {
  background: var(--cp-bg-soft);
  border-radius: 6px;
  padding: 12px;
  border-left: 3px solid var(--cp-brand);
}
.cp-kw-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cp-kw-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #fff;
  border-radius: 4px;
  transition: all 0.15s;
}
.cp-kw-item:hover { box-shadow: var(--cp-shadow); }
.cp-kw-title { font-size: 12px; font-weight: 500; color: var(--cp-text); }
.cp-kw-content {
  font-size: 11px;
  color: var(--cp-text-tertiary);
  margin-top: 4px;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.cp-opinion { display: flex; flex-direction: column; min-width: 0; }
.cp-cite-list {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
  padding: 6px 8px;
  background: var(--cp-bg-soft);
  border-radius: 4px;
  font-size: 12px;
  color: var(--cp-text-tertiary);
}

/* 底部固定操作栏 */
.cp-tk-footer {
  padding: 10px 20px;
  border-top: 1px solid var(--cp-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  background: #fff;
}

/* 响应式 */
@media (max-width: 880px) {
  .cp-tk-work { grid-template-columns: 1fr; }
}
</style>