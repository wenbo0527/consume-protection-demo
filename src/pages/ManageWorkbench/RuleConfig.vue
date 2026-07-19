<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">规则配置中心</h1>
        <div class="cp-page-subtitle">分单 / 预警 / 标签联动 / 名单 · 规则优先级可拖拽排序</div>
      </div>
    </div>

    <a-tabs default-active-key="dispatch" type="rounded">
      <a-tab-pane key="dispatch" title="分单规则">
        <div class="cp-card" style="padding: 0">
          <a-table :data="dispatch" :pagination="false" row-key="id" :draggable="{ title: '拖动排序', width: 40 }">
            <template #columns>
              <a-table-column title="优先级" :width="80">
                <template #cell="{ record }">
                  <a-tag :color="record.priority <= 2 ? 'red' : record.priority <= 4 ? 'orange' : 'gray'">P{{ record.priority }}</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="渠道" data-index="channel">
                <template #cell="{ record }">
                  <a-tag size="small" color="blue">{{ record.channel }}</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="工单类型" data-index="type">
                <template #cell="{ record }">
                  <a-tag size="small">{{ record.type }}</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="紧急度" data-index="urgency">
                <template #cell="{ record }">
                  <a-tag size="small" :color="record.urgency === '特急' ? 'red' : record.urgency === '紧急' ? 'orange' : 'gray'">
                    {{ record.urgency }}
                  </a-tag>
                </template>
              </a-table-column>
              <a-table-column title="分配至" data-index="assign">
                <template #cell="{ record }">
                  <a-tag color="green">{{ record.assign }}</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="状态" :width="100 as any">
                <template #cell="{ record }">
                  <a-switch v-model="record.enabled" />
                </template>
              </a-table-column>
              <a-table-column title="操作" :width="160 as any">
                <template #cell>
                  <a-space :size="4">
                    <a-button size="small">编辑</a-button>
                    <a-button size="small" status="danger">删除</a-button>
                  </a-space>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
        <div style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center">
          <span style="font-size: 12px; color: var(--cp-text-tertiary)">支持 ≥20 条规则 · 当前 {{ dispatch.length }} 条 · 优先级数字越小越优先匹配</span>
          <a-button type="primary" @click="showAddRule = true"><icon-plus /> 新增分单规则</a-button>
        </div>
      </a-tab-pane>

      <a-tab-pane key="alert" title="预警规则 (GL-001)">
        <div class="cp-card" style="padding: 0">
          <a-table :data="alertRules" :pagination="false">
            <template #columns>
              <a-table-column title="规则名称" data-index="name" />
              <a-table-column title="监测类型">
                <template #cell="{ record }">
                  <a-tag :color="typeColor(record.type)">{{ record.typeLabel }}</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="触发条件" data-index="condition" />
              <a-table-column title="通知方式" data-index="notify" />
              <a-table-column title="状态" :width="100 as any">
                <template #cell="{ record }">
                  <a-switch v-model="record.enabled" />
                </template>
              </a-table-column>
              <a-table-column title="操作" :width="120">
                <template #cell>
                  <a-button size="small">编辑阈值</a-button>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </a-tab-pane>

      <a-tab-pane key="tag" title="标签体系 (GL-003)">
        <div class="cp-card" style="padding: 0">
          <a-table :data="tags" :pagination="false">
            <template #columns>
              <a-table-column title="标签名称" data-index="name">
                <template #cell="{ record }">
                  <a-tag :color="record.category === '风险标签' ? 'red' : 'blue'">{{ record.name }}</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="类别" data-index="category" />
              <a-table-column title="标签定义" data-index="definition" />
              <a-table-column title="触发规则" data-index="triggerRule" />
              <a-table-column title="执行动作" data-index="action" />
              <a-table-column title="添加需审批" :width="100 as any">
                <template #cell="{ record }">
                  <a-tag v-if="record.needApproval" color="orange" size="small">是</a-tag>
                  <a-tag v-else color="green" size="small">否</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="操作" :width="160 as any">
                <template #cell>
                  <a-space :size="4">
                    <a-button size="small">编辑</a-button>
                    <a-button size="small">联动日志</a-button>
                  </a-space>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </a-tab-pane>

      <!-- ========== 标签联动规则(P2-9 引入) ========== -->
      <a-tab-pane key="tag-rule" title="标签联动规则 (P2-9)">
        <a-row :gutter="16">
          <a-col :span="9">
            <div class="cp-card" style="padding: 12px">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px">
                <h3 class="cp-section-title" style="margin: 0">规则列表</h3>
                <a-button size="small" type="primary" @click="openNewRule">
                  <icon-plus /> 新建规则
                </a-button>
              </div>
              <div v-for="r in tagRules.rules" :key="r.id"
                :class="['cp-bizflow-item', { 'is-active': activeRuleId === r.id }]"
                @click="activeRuleId = r.id">
                <div style="display: flex; justify-content: space-between; align-items: center">
                  <span style="font-weight: 600">{{ r.name }}</span>
                  <a-switch :model-value="r.enabled" size="small" @change="(v: any) => toggleRule(r.id, v as boolean)" />
                </div>
                <div style="font-size: 11px; color: var(--cp-text-tertiary); margin-top: 4px; line-height: 1.5">
                  命中标签:
                  <a-tag v-for="t in r.tags" :key="t" size="small" color="red" style="margin-left: 2px">{{ t }}</a-tag>
                  · 优先级 {{ r.priority }}
                </div>
              </div>
            </div>
          </a-col>

          <a-col :span="15">
            <div class="cp-card" style="padding: 16px">
              <div v-if="activeRule">
                <h3 class="cp-section-title">{{ activeRule.name }}</h3>
                <div style="font-size: 12px; color: var(--cp-text-tertiary); margin-bottom: 12px">{{ activeRule.desc }}</div>

                <a-form :model="activeRule">
                  <a-row :gutter="12">
                    <a-col :span="12">
                      <a-form-item label="规则名称">
                        <a-input v-model="activeRule.name" @blur="persistActive" />
                      </a-form-item>
                    </a-col>
                    <a-col :span="12">
                      <a-form-item label="优先级">
                        <a-input-number v-model="activeRule.priority" :min="0" :max="100" @change="persistActive" />
                      </a-form-item>
                    </a-col>
                  </a-row>
                  <a-form-item label="描述">
                    <a-textarea v-model="activeRule.desc" :rows="2" @blur="persistActive" />
                  </a-form-item>

                  <a-form-item label="命中标签(可多选)">
                    <a-checkbox-group v-model="activeRule.tags" @change="persistActive">
                      <a-checkbox value="threat">扬言倾向 (threat)</a-checkbox>
                      <a-checkbox value="blacklist">黑名单 (blacklist)</a-checkbox>
                      <a-checkbox value="agent">异常代理 (agent)</a-checkbox>
                      <a-checkbox value="complaint">投诉倾向 (complaint)</a-checkbox>
                    </a-checkbox-group>
                  </a-form-item>

                  <a-divider style="margin: 12px 0">执行动作</a-divider>

                  <div v-for="(act, idx) in activeRule.actions" :key="idx" class="cp-rule-action-row">
                    <a-space wrap>
                      <a-tag :color="actionColor(act.kind)">{{ actionLabel(act.kind) }}</a-tag>
                      <a-button size="small" status="danger" @click="removeAction(idx)">移除</a-button>
                    </a-space>
                    <div v-if="act.kind === 'show_alert'" style="margin-top: 6px">
                      <a-radio-group v-model="act.level" @change="persistActive">
                        <a-radio value="error">错误</a-radio>
                        <a-radio value="warning">警告</a-radio>
                      </a-radio-group>
                      <a-input v-model="act.title" placeholder="弹屏标题" @blur="persistActive" style="margin-top: 4px" />
                      <a-input v-model="act.actionsText" placeholder="推荐动作,逗号分隔" @blur="onActionsText(idx)" style="margin-top: 4px" />
                    </div>
                    <div v-else-if="act.kind === 'restrict_call'" style="margin-top: 6px">
                      <a-input v-model="act.note" placeholder="限制说明" @blur="persistActive" />
                    </div>
                    <div v-else-if="act.kind === 'auto_upgrade'" style="margin-top: 6px">
                      <a-radio-group v-model="act.target" @change="persistActive">
                        <a-radio value="manage">管理层</a-radio>
                        <a-radio value="review">审查</a-radio>
                      </a-radio-group>
                      <a-input v-model="act.note" placeholder="升级说明" @blur="persistActive" style="margin-top: 4px" />
                    </div>
                    <div v-else-if="act.kind === 'link_history'" style="margin-top: 6px">
                      <a-input v-model="act.note" placeholder="关联说明" @blur="persistActive" />
                    </div>
                  </div>

                  <a-button size="small" @click="showAddAction = true">
                    <icon-plus /> 添加动作
                  </a-button>

                  <a-alert type="info" show-icon style="margin-top: 12px">
                    <template #title>配置即时生效</template>
                    <template #content>
                      标签联动规则保存后,所有客户画像页和 AgentDesk 弹屏的预警/限制/升级逻辑会立即按新规则生效。
                    </template>
                  </a-alert>
                </a-form>
              </div>
            </div>
          </a-col>
        </a-row>

        <!-- 添加动作弹窗 -->
        <a-modal v-model:visible="showAddAction" title="添加动作" :ok-text="'添加'" @ok="confirmAddAction">
          <div class="cp-form">
            <a-form-item label="动作类型">
              <a-radio-group v-model="newActionKind">
                <a-radio value="show_alert">弹屏预警</a-radio>
                <a-radio value="restrict_call">限制呼入</a-radio>
                <a-radio value="auto_upgrade">自动升级</a-radio>
                <a-radio value="link_history">关联历史</a-radio>
              </a-radio-group>
            </a-form-item>
          </div>
        </a-modal>
      </a-tab-pane>
                   

      <a-tab-pane key="list" title="名单规则 (ZN-003)">
        <div class="cp-card" style="padding: 20px">
          <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 12px">名单自动匹配规则</h3>
          <div v-for="r in listRules" :key="r.name" style="padding: 12px; border-bottom: 1px dashed var(--cp-border); display: flex; justify-content: space-between; align-items: center">
            <div>
              <div style="font-weight: 500">{{ r.name }}</div>
              <div style="font-size: 12px; color: var(--cp-text-tertiary); margin-top: 4px">{{ r.condition }} → {{ r.action }}</div>
            </div>
            <a-switch v-model="r.enabled" />
          </div>
        </div>
      </a-tab-pane>

      <a-tab-pane key="simulation" title="规则试算 (P2-8)">
        <div style="display: flex; gap: 16px">
          <!-- 左侧:输入样本 -->
          <div class="cp-card" style="padding: 20px; flex: 0 0 380px">
            <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 12px">输入样本</h3>
            <a-form :model="simForm" layout="vertical">
              <a-form-item label="客户">
                <a-select v-model="simForm.customerId" @change="onSimCustomerChange">
                  <a-option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }} ({{ c.id }})</a-option>
                </a-select>
              </a-form-item>
              <a-form-item label="触发工单">
                <a-select v-model="simForm.ticketId" placeholder="可选">
                  <a-option v-for="t in customerTickets" :key="t.id" :value="t.id">{{ t.id }} · {{ t.typeLabel }}</a-option>
                </a-select>
              </a-form-item>
              <a-form-item label="渠道">
                <a-radio-group v-model="simForm.channel">
                  <a-radio value="电话">电话</a-radio>
                  <a-radio value="12345">12345</a-radio>
                  <a-radio value="在线客服">在线客服</a-radio>
                </a-radio-group>
              </a-form-item>
              <a-form-item label="工单类型">
                <a-radio-group v-model="simForm.type">
                  <a-radio value="投诉">投诉</a-radio>
                  <a-radio value="咨询">咨询</a-radio>
                  <a-radio value="协商还款">协商还款</a-radio>
                  <a-radio value="监管转办">监管转办</a-radio>
                </a-radio-group>
              </a-form-item>
              <a-form-item label="紧急程度">
                <a-radio-group v-model="simForm.urgency">
                  <a-radio value="special">特别</a-radio>
                  <a-radio value="urgent">紧急</a-radio>
                  <a-radio value="normal">一般</a-radio>
                </a-radio-group>
              </a-form-item>
              <a-form-item label="在贷金额(元)">
                <a-input-number v-model="simForm.loanBalance" :min="0" :step="1000" />
              </a-form-item>
              <a-form-item label="最大逾期天数">
                <a-input-number v-model="simForm.maxOverdueDays" :min="0" />
              </a-form-item>
              <a-button type="primary" long @click="runSimulation">运行试算</a-button>
              <a-button long style="margin-top: 8px" @click="clearSimForm">清空</a-button>
            </a-form>
          </div>

          <!-- 右侧:命中详情 -->
          <div style="flex: 1; min-width: 0">
            <div class="cp-card" style="padding: 20px">
              <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 12px">试算结果</h3>
              <a-empty v-if="!simResult" description="点击左侧「运行试算」查看分单/预警/标签规则命中详情" />
              <div v-else>
                <a-descriptions :column="2" bordered size="small" style="margin-bottom: 12px">
                  <a-descriptions-item label="分单结果">{{ simResult.assignTo }}</a-descriptions-item>
                  <a-descriptions-item label="命中分单规则">{{ simResult.dispatchHit?.name || '命中默认分单' }}</a-descriptions-item>
                  <a-descriptions-item label="触发的预警">
                    <a-tag v-for="a in simResult.alerts" :key="a.id" :color="a.level === 'urgent' ? 'red' : 'orange'" style="margin-right: 4px">{{ a.name }}</a-tag>
                    <span v-if="!simResult.alerts.length" style="color: var(--cp-text-tertiary)">无</span>
                  </a-descriptions-item>
                  <a-descriptions-item label="命中的标签">
                    <a-tag v-for="t in simResult.tagRuleHits" :key="t.ruleId" color="arcoblue" style="margin-right: 4px">{{ t.ruleName }} · {{ t.actions }}</a-tag>
                    <span v-if="!simResult.tagRuleHits.length" style="color: var(--cp-text-tertiary)">无</span>
                  </a-descriptions-item>
                  <a-descriptions-item label="命中的名单" :span="2">
                    <a-tag v-for="l in simResult.listHits" :key="l.listType" color="purple" style="margin-right: 4px">{{ l.listType }}</a-tag>
                    <span v-if="!simResult.listHits.length" style="color: var(--cp-text-tertiary)">无</span>
                  </a-descriptions-item>
                </a-descriptions>

                <a-divider>执行顺序</a-divider>
                <a-timeline>
                  <a-timeline-item v-for="(s, i) in simResult.steps" :key="i">
                    <b>{{ s.stage }}</b>
                    <div style="font-size: 12px; color: var(--cp-text-secondary); margin-top: 2px">{{ s.detail }}</div>
                  </a-timeline-item>
                </a-timeline>
              </div>
            </div>

            <!-- 历史 -->
            <div class="cp-card" style="padding: 20px; margin-top: 12px">
              <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 12px">试算历史</h3>
              <a-table v-if="simHistory.length" :data="simHistory.slice(0, 8)" :pagination="false" size="small">
                <a-table-column title="时间" data-index="at" :width="160">
                  <template #cell="{ record }">{{ (record as any).at }}</template>
                </a-table-column>
                <a-table-column title="客户" data-index="customerName" :width="100">
                  <template #cell="{ record }">{{ (record as any).customerName }}</template>
                </a-table-column>
                <a-table-column title="分单">
                  <template #cell="{ record }">
                    <span :style="{ color: record.result?.assignTo === '已转出' ? 'var(--cp-warning)' : 'var(--cp-text)' }">{{ record.result?.assignTo }}</span>
                  </template>
                </a-table-column>
                <a-table-column title="命中规则数">
                  <template #cell="{ record }">
                    {{ (record.result?.alerts.length || 0) + (record.result?.tagRuleHits.length || 0) + (record.result?.listHits.length || 0) }}
                  </template>
                </a-table-column>
              </a-table>
              <a-empty v-else description="暂无试算记录" />
            </div>
          </div>
        </div>
      </a-tab-pane>
    </a-tabs>

    <!-- 新增规则弹窗 -->
    <a-modal v-model:visible="showAddRule" title="新增分单规则" :width="640" :ok-text="'保存规则'">
      <div class="cp-form">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="优先级" required>
              <a-input-number :min="1" :max="99" :default-value="8" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="渠道" required>
              <a-select>
                <a-option>电话</a-option>
                <a-option>在线客服</a-option>
                <a-option>APP</a-option>
                <a-option>12378</a-option>
                <a-option>12345</a-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="工单类型" required>
              <a-select>
                <a-option>咨询</a-option>
                <a-option>投诉</a-option>
                <a-option>外部转办</a-option>
                <a-option>调解</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="紧急度">
              <a-select multiple :default-value="['全部']">
                <a-option>特急</a-option>
                <a-option>紧急</a-option>
                <a-option>普通</a-option>
                <a-option>全部</a-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="分配至" required>
          <a-select>
            <a-option>张敏 (客服一组)</a-option>
            <a-option>李伟 (业务执行)</a-option>
            <a-option>王芳 (审查组)</a-option>
          </a-select>
        </a-form-item>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { tagSystem, customers as customersMock, tickets as ticketsMock, blackList } from '@/mock/data'
import { dispatchRules, alertRules, listRules as listRulesMock } from '@/mock/data_ext'
import { useTagRuleStore, TagRule, RuleAction } from '@/stores/tagRule'
import { Message } from '@arco-design/web-vue'

const dispatch = reactive(dispatchRules)
const alertRulesData = reactive(alertRules)
const tags = reactive(tagSystem)
const listRules = reactive(listRulesMock)
const showAddRule = ref(false)

// ============ 标签联动规则(P2-9) ============
const tagRules = useTagRuleStore()
const activeRuleId = ref<string>(tagRules.rules[0]?.id || '')

// 为了让表单可编辑,deep-clone 一份 activeRule
const editing = reactive<{ rule: TagRule | null }>({ rule: null })
const activeRule = computed<TagRule | null>(() => {
  // 编辑时优先使用 editing.rule;否则从 store 派生
  if (editing.rule && editing.rule.id === activeRuleId.value) return editing.rule
  const r = tagRules.rules.find(x => x.id === activeRuleId.value) || null
  if (r && (!editing.rule || editing.rule.id !== activeRuleId.value)) {
    // 切换时同步拷贝
    Object.assign(editing, { rule: JSON.parse(JSON.stringify(r)) })
  }
  return editing.rule
})

function persistActive() {
  if (!activeRule.value) return
  tagRules.updateRule(activeRule.value.id, activeRule.value)
  Message.success('规则已保存')
}

function toggleRule(id: string, enabled: boolean) {
  tagRules.updateRule(id, { enabled })
}

function removeAction(idx: number) {
  if (!activeRule.value) return
  activeRule.value.actions.splice(idx, 1)
  persistActive()
}

const showAddAction = ref(false)
const newActionKind = ref<RuleAction['kind']>('show_alert')
function confirmAddAction() {
  if (!activeRule.value) return
  const k = newActionKind.value
  let action: RuleAction
  if (k === 'show_alert') action = { kind: 'show_alert', level: 'warning', title: '新预警', actions: [] }
  else if (k === 'restrict_call') action = { kind: 'restrict_call', note: '限制说明' }
  else if (k === 'auto_upgrade') action = { kind: 'auto_upgrade', target: 'manage', note: '升级说明' }
  else action = { kind: 'link_history', note: '关联说明' }
  activeRule.value.actions.push(action)
  showAddAction.value = false
  persistActive()
}

function onActionsText(idx: number) {
  if (!activeRule.value) return
  const a = activeRule.value.actions[idx] as any
  if (a && a.actionsText !== undefined) {
    a.actions = a.actionsText.split(/[,，]/).map((s: string) => s.trim()).filter(Boolean)
    persistActive()
  }
}

function openNewRule() {
  const r = tagRules.add({
    tags: ['complaint'],
    name: '新规则',
    desc: '',
    priority: 10,
    enabled: false,
    actions: [{ kind: 'show_alert', level: 'warning', title: '新预警', actions: [] }]
  })
  activeRuleId.value = r.id
  Message.success('规则已创建,请编辑并启用')
}

function actionColor(k: string) {
  return { show_alert: 'orange', restrict_call: 'red', auto_upgrade: 'magenta', link_history: 'arcoblue' }[k] || 'gray'
}
function actionLabel(k: string) {
  return { show_alert: '弹屏预警', restrict_call: '限制呼入', auto_upgrade: '自动升级', link_history: '关联历史' }[k] || k
}

function typeColor(t: string) {
  if (t === 'complaint_volume') return 'blue'
  if (t === 'regulator') return 'red'
  if (t === 'collection') return 'orange'
  return 'gray'
}

// ============ P2-8 规则试算 ============
const customers = customersMock
const allTickets = ticketsMock
const allBlackList = blackList
const tagRuleStore = useTagRuleStore()

interface SimForm {
  customerId: string
  ticketId?: string
  channel: string
  type: string
  urgency: 'special' | 'urgent' | 'normal'
  loanBalance: number
  maxOverdueDays: number
}

interface SimStep {
  stage: string
  detail: string
}

interface SimResult {
  assignTo: string
  dispatchHit: { name: string } | null
  alerts: { id: string; name: string; level: string }[]
  tagRuleHits: { ruleId: string; ruleName: string; actions: string }[]
  listHits: { listType: string }[]
  steps: SimStep[]
}

const simForm = reactive<SimForm>({
  customerId: 'C001',
  ticketId: '',
  channel: '电话',
  type: '投诉',
  urgency: 'normal',
  loanBalance: 50000,
  maxOverdueDays: 0
})

const customerTickets = computed(() => {
  const c = customers.find(c => c.id === simForm.customerId)
  if (!c) return []
  return allTickets.filter(t => (t as any).customerId === c.id || (t as any).customerName === c.name)
})

function onSimCustomerChange() {
  simForm.ticketId = ''
  const c = customers.find(c => c.id === simForm.customerId)
  if (c) {
    simForm.loanBalance = c.loanBalance || simForm.loanBalance
    simForm.maxOverdueDays = (c as any).maxOverdueDays || 0
  }
}

function clearSimForm() {
  simForm.ticketId = ''
  simForm.loanBalance = 0
  simForm.maxOverdueDays = 0
  simResult.value = null
}

const simResult = ref<SimResult | null>(null)
const simHistory = ref<{ at: string; customerName: string; result: SimResult }[]>([])

function runSimulation() {
  const customer = customers.find(c => c.id === simForm.customerId)
  if (!customer) {
    Message.warning('请选择客户')
    return
  }
  const steps: SimStep[] = []
  const result: SimResult = {
    assignTo: '',
    dispatchHit: null,
    alerts: [],
    tagRuleHits: [],
    listHits: [],
    steps
  }

  // 1) 分单规则匹配
  steps.push({ stage: '① 分单规则', detail: `按渠道 ${simForm.channel} + 类型 ${simForm.type} + 紧急度 ${simForm.urgency} 匹配分单规则...` })
  const dispatchHit = dispatchRules.find(r => {
    if (!r.enabled) return false
    if (r.channel !== simForm.channel && r.channel !== '全部') return false
    if (r.type !== simForm.type && r.type !== '全部') return false
    if (r.urgency !== simForm.urgency && r.urgency !== '全部') return false
    return true
  })
  if (dispatchHit) {
    result.assignTo = dispatchHit.assign
    result.dispatchHit = { name: `分单规则 R-${dispatchHit.id}(${dispatchHit.priority})` }
    steps.push({ stage: '✓ 分单命中', detail: `命中规则 R-${dispatchHit.id}(优先级 ${dispatchHit.priority})→ 分配至 ${dispatchHit.assign}` })
  } else {
    result.assignTo = '默认池(坐席·张敏)'
    steps.push({ stage: '✓ 默认分单', detail: '未命中任何规则,进入默认分单池' })
  }

  // 2) 预警规则匹配
  steps.push({ stage: '② 预警规则', detail: `基于在贷 ¥${simForm.loanBalance.toLocaleString()} / 逾期 ${simForm.maxOverdueDays} 天 评估预警触发...` })
  if (simForm.maxOverdueDays > 30) {
    result.alerts.push({ id: 'A001', name: '长时间逾期预警', level: 'urgent' })
    steps.push({ stage: '⚠ 预警触发', detail: `逾期 ${simForm.maxOverdueDays} 天 > 30 天阈值,触发 [长时间逾期预警]` })
  }
  if (simForm.loanBalance > 200000) {
    result.alerts.push({ id: 'A002', name: '大额贷款风险预警', level: 'warning' })
    steps.push({ stage: '⚠ 预警触发', detail: `在贷 ¥${simForm.loanBalance.toLocaleString()} > 20w 阈值,触发 [大额贷款风险预警]` })
  }
  if (simForm.type === '投诉' && simForm.urgency === 'urgent') {
    result.alerts.push({ id: 'A003', name: '紧急投诉升级', level: 'urgent' })
    steps.push({ stage: '⚠ 预警触发', detail: '紧急投诉类型 → 升级至管理层' })
  }
  if (!result.alerts.length) {
    steps.push({ stage: '✓ 无预警触发', detail: '当前样本未触发任何预警规则' })
  }

  // 3) 标签联动规则命中
  steps.push({ stage: '③ 标签联动', detail: '基于客户既有标签 + 本次事件,评估联动规则...' })
  const customerTags = (customer as any).riskTags || []
  for (const rule of tagRuleStore.rules) {
    if (!rule.enabled) continue
    if (rule.tags.some((t: string) => customerTags.includes(t))) {
      const acts = rule.actions.map((a: any) => a.title || a.kind).join(', ')
      result.tagRuleHits.push({ ruleId: rule.id, ruleName: rule.name, actions: acts })
      steps.push({ stage: '✓ 标签规则命中', detail: `规则「${rule.name}」 → 动作:${acts}` })
    }
  }
  if (!result.tagRuleHits.length) {
    steps.push({ stage: '✓ 无标签规则命中', detail: '客户标签与规则未匹配' })
  }

  // 4) 名单匹配
  steps.push({ stage: '④ 名单匹配', detail: '检查黑名单 / 投诉库 / 代理库...' })
  for (const item of allBlackList) {
    if ((customer as any).phone && (customer as any).phone.startsWith(item.phone.slice(0, 3))) {
      result.listHits.push({ listType: item.typeLabel })
      steps.push({ stage: '⚠ 名单命中', detail: `命中 [${item.typeLabel}] - ${item.name}` })
    }
  }
  if (!result.listHits.length) {
    steps.push({ stage: '✓ 无名单命中', detail: '客户不在任何名单中' })
  }

  // 5) 总结
  steps.push({
    stage: '⑤ 结论',
    detail: `分单:${result.assignTo} | 预警:${result.alerts.length} 条 | 标签规则:${result.tagRuleHits.length} 条 | 名单:${result.listHits.length} 条`
  })

  simResult.value = result
  simHistory.value.unshift({
    at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    customerName: customer.name,
    result
  })
  Message.success('试算完成')
}
</script>

<style scoped>
.cp-rule-action-row {
  padding: 10px 12px;
  margin-bottom: 8px;
  background: var(--cp-bg-soft);
  border-radius: 4px;
  border: 1px solid var(--cp-border-light);
}
</style>