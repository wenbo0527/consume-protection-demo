<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">业务工作流配置</h1>
        <div class="cp-page-subtitle">停催 / 协商 / 征信异议 / 转调解 等业务流程模板 · 节点角色与 SLA 即时生效</div>
      </div>
      <a-space>
        <a-button @click="onImportTemplate"><icon-import /> 导入模板</a-button>
        <a-button type="primary" @click="showCreateTpl = true"><icon-plus /> 新建模板</a-button>
        <a-button @click="onSaveDraft"><icon-save /> 保存草稿</a-button>
        <a-button type="primary" status="success" @click="onPublish"><icon-check /> 发布</a-button>
      </a-space>
    </div>

    <a-row :gutter="16">
      <!-- 左:模板列表 -->
      <a-col :span="9">
        <div class="cp-card" style="padding: 12px">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px">
            <h3 class="cp-section-title" style="margin: 0">工作流模板</h3>
            <a-switch v-model="bizFlowEnabled[activeTpl]" @change="onToggleBiz(activeTpl)" />
          </div>
          <div
            v-for="tpl in bizFlowTemplates"
            :key="tpl.kind"
            :class="['cp-bizflow-item', { 'is-active': activeTpl === tpl.kind }]"
            @click="activeTpl = tpl.kind"
          >
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span style="font-weight: 600">{{ tpl.name }}</span>
              <a-tag size="small" :color="tpl.enabled ? 'green' : 'gray'">{{
                tpl.enabled ? '启用' : '停用'
              }}</a-tag>
            </div>
            <div style="font-size: 11px; color: var(--cp-text-tertiary); margin-top: 4px; line-height: 1.5">
              {{ tpl.desc }}
            </div>
          </div>
        </div>
      </a-col>

      <!-- 右:节点配置 -->
      <a-col :span="15">
        <div class="cp-card" style="padding: 16px">
          <div v-if="activeTemplate">
            <div style="display: flex; justify-content: space-between; align-items: flex-start">
              <div style="flex: 1">
                <h3 class="cp-section-title">{{ activeTemplate.name }} · 节点配置</h3>
                <div style="font-size: 12px; color: var(--cp-text-tertiary); margin-bottom: 12px">
                  {{ activeTemplate.desc || '无描述' }}
                </div>
              </div>
              <a-button size="mini" status="danger" @click="onDeleteActive">删除模板</a-button>
            </div>
          <a-table :data="activeTemplate.nodes" :pagination="false" row-key="code">
              <template #columns>
                <a-table-column title="#" :width="40">
                  <template #cell="{ rowIndex }">{{ rowIndex + 1 }}</template>
                </a-table-column>
                <a-table-column title="节点" data-index="name" />
                <a-table-column title="类型" :width="80">
                  <template #cell="{ record }">
                    <a-tag size="small">{{ kindShort(record.kind) }}</a-tag>
                  </template>
                </a-table-column>
                <a-table-column title="处置角色" :width="180">
                  <template #cell="{ record }">
                    <a-select
                      :model-value="record.handlerRole"
                      size="small"
                      @change="(v: any) => onRoleChange(activeTpl, record.code, v)"
                    >
                      <a-option value="agent">坐席</a-option>
                      <a-option value="business">支撑岗</a-option>
                      <a-option value="review">审查</a-option>
                      <a-option value="manage">管理层</a-option>
                      <a-option value="system">系统</a-option>
                    </a-select>
                  </template>
                </a-table-column>
                <a-table-column title="SLA(小时)" :width="110">
                  <template #cell="{ record }">
                    <a-input-number
                      :model-value="record.slaHours"
                      size="small"
                      :min="0"
                      :max="240"
                      @change="(v: number | undefined) => onSlaChange(activeTpl, record.code, v ?? 0)"
                      style="width: 90px"
                    />
                  </template>
                </a-table-column>
                <a-table-column title="自动推进" :width="80">
                  <template #cell="{ record }">
                    <a-switch
                      :model-value="record.autoNext"
                      size="small"
                      @change="(v: any) => onAutoChange(activeTpl, record.code, v as boolean)"
                    />
                  </template>
                </a-table-column>
                <a-table-column title="副作用">
                  <template #cell="{ record }">
                    <a-tag v-if="record.sideEffect" size="small" color="purple">{{ record.sideEffect }}</a-tag>
                    <span v-else style="color: var(--cp-text-tertiary); font-size: 11px">-</span>
                  </template>
                </a-table-column>
              </template>
            </a-table>

            <a-alert type="info" show-icon style="margin-top: 12px">
              <template #title>配置即时生效</template>
              <template #content>
                修改后保存到 localStorage,所有角色的工作流待办立即按新规则过滤。
                <div style="margin-top: 6px">启用开关(右上)关闭后,坐席发起申请时该工作流不可选。</div>
              </template>
            </a-alert>
          </div>
          <a-empty v-else size="small" description="请选择左侧工作流模板" />
        </div>
      </a-col>
    </a-row>

    <!-- 新建模板弹窗 -->
    <a-modal v-model:visible="showCreateTpl" title="新建业务工作流模板" :width="520" :ok-text="'创建并编辑'" @ok="onCreateTpl">
      <a-form :model="tplForm" layout="vertical" size="small">
        <a-form-item label="模板代码(kind,英文,小写字母开头)" required>
          <a-input v-model="tplForm.kind" placeholder="如 stop_collection" />
        </a-form-item>
        <a-form-item label="模板名称" required>
          <a-input v-model="tplForm.name" placeholder="如 停催停扣" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model="tplForm.desc" :rows="2" placeholder="模板用途/适用场景" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { useWorkflowStore, WorkflowKind } from '@/stores/workflow'
import { mapNodeName } from '@/utils/workflow-helpers'

const wf = useWorkflowStore()
const bizFlowTemplates = computed(() => wf.templates)
const activeTpl = ref<WorkflowKind>('stop_collection')
const activeTemplate = computed(() => wf.templates.find((t) => t.kind === activeTpl.value))

// 启用开关的双向绑定(拷贝一份便于 v-model)
const bizFlowEnabled = reactive<Record<string, boolean>>({})
function refreshBizFlowEnabled() {
  wf.templates.forEach((t) => {
    bizFlowEnabled[t.kind] = t.enabled
  })
}
refreshBizFlowEnabled()

function onToggleBiz(kind: WorkflowKind) {
  wf.updateTemplate(kind, { enabled: !!bizFlowEnabled[kind] })
}
function onRoleChange(kind: WorkflowKind, code: string, v: any) {
  wf.updateNode(kind, code, { handlerRole: v })
}
function onSlaChange(kind: WorkflowKind, code: string, v: number) {
  if (typeof v === 'number') wf.updateNode(kind, code, { slaHours: v })
}
function onAutoChange(kind: WorkflowKind, code: string, v: boolean) {
  wf.updateNode(kind, code, { autoNext: v })
}
const kindShort = mapNodeName

// ============ P0-4: 顶部 3 个按钮 + P2-2: 新建模板 ============

/** 导入:演示用 JSON,实际应弹文件选择器 */
function onImportTemplate() {
  const sample = JSON.stringify(
    [
      {
        kind: 'imported_demo',
        name: '导入示例模板',
        desc: '演示用 JSON 导入',
        enabled: true,
        nodes: [
          { code: 'start', name: '受理', kind: 'start', handlerRole: 'agent', slaHours: 4, autoNext: false },
          { code: 'execute', name: '执行', kind: 'execute', handlerRole: 'business', slaHours: 24, autoNext: true, sideEffect: 'notify_seat' }
        ],
        applicableScenes: ['demo']
      }
    ],
    null,
    2
  )
  try {
    const r = wf.importTemplatesFromJson(sample)
    Message.success(`导入完成:新增 ${r.added} 条,覆盖 ${r.updated} 条`)
    refreshBizFlowEnabled()
  } catch (e: any) {
    Message.error(`导入失败:${e?.message || e}`)
  }
}

/** 保存草稿:当前所有 on-change 已经 persist,这里给个明显的反馈 */
function onSaveDraft() {
  wf.persist?.()
  Message.success(`草稿已保存,共 ${wf.templates.length} 个模板`)
}

/** 发布 */
function onPublish() {
  wf.publishAll('陈强(管理)')
  Message.success('已发布,所有角色的工作流待办立即按新规则过滤')
}

// ============ 新建模板弹窗 ============
const showCreateTpl = ref(false)
const tplForm = reactive({
  kind: '',
  name: '',
  desc: ''
})

function onCreateTpl() {
  if (!tplForm.kind || !tplForm.name) {
    Message.warning('模板代码和名称为必填')
    return
  }
  // kind 仅允许字母/数字/下划线
  if (!/^[a-z][a-z0-9_]{1,30}$/.test(tplForm.kind)) {
    Message.warning('模板代码需小写字母开头,仅含字母/数字/下划线,2-30 位')
    return
  }
  const tpl = wf.addTemplate({
    kind: tplForm.kind,
    name: tplForm.name,
    desc: tplForm.desc
  })
  if (tpl) {
    refreshBizFlowEnabled()
    activeTpl.value = tplForm.kind as WorkflowKind
    Message.success(`已创建模板「${tplForm.name}」,并选中进入编辑`)
    showCreateTpl.value = false
    // 重置
    tplForm.kind = ''
    tplForm.name = ''
    tplForm.desc = ''
  }
}

function onDeleteActive() {
  if (!activeTemplate.value) return
  Modal?.confirm?.({
    title: `确认删除模板「${activeTemplate.value.name}」?`,
    content: '删除后该模板将不可被业务申请选择,已发起的实例不受影响。',
    okText: '删除',
    cancelText: '取消',
    okButtonProps: { status: 'danger' },
    onOk: () => {
      const kind = activeTemplate.value!.kind
      wf.removeTemplate(kind)
      Message.success(`已删除 ${activeTemplate.value!.name}`)
      refreshBizFlowEnabled()
      activeTpl.value = 'stop_collection'
    }
  }) ?? Message.warning('请确认删除')
}

// Arco 的 Modal 在浏览器未挂载时无法使用,做个 fallback
</script>

<style scoped>
.cp-bizflow-item {
  padding: 10px 12px;
  border: 1px solid var(--cp-border-light);
  border-radius: 6px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.15s;
  background: #fff;
}
.cp-bizflow-item:hover {
  border-color: var(--cp-brand);
  background: var(--cp-brand-soft);
}
.cp-bizflow-item.is-active {
  border-color: var(--cp-brand);
  background: var(--cp-brand-soft);
}
.cp-section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--cp-text);
}
</style>
