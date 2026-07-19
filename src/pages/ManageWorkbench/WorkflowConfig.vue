<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">工单流程配置</h1>
        <div class="cp-page-subtitle">可视化配置工单状态机 · 监管件/普通件/外部转办差异配置 · 修改实时生效</div>
      </div>
      <a-space>
        <a-button><icon-import /> 导入模板</a-button>
        <a-button type="primary"><icon-save /> 保存草稿</a-button>
        <a-button type="primary" status="success"><icon-check /> 发布</a-button>
      </a-space>
    </div>

    <a-tabs default-active-key="design">
      <!-- Tab 1: 可视化状态机设计 -->
      <a-tab-pane key="design" title="流程设计">
        <a-row :gutter="16">
          <!-- 左:状态列表 -->
          <a-col :span="5">
            <div class="cp-card" style="padding: 16px">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px">
                <h3 class="cp-section-title" style="margin: 0">状态定义</h3>
                <a-button size="small" type="text" @click="addStatus">
                  <icon-plus />
                </a-button>
              </div>
              <div
                v-for="s in statusList"
                :key="s.code"
                class="cp-state-card"
                :class="{ 'is-active': activeState === s.code }"
                @click="activeState = s.code"
              >
                <div style="display: flex; align-items: center; gap: 8px">
                  <span class="cp-state-dot" :style="{ background: stateColor(s.code) }"></span>
                  <span style="font-weight: 500; font-size: 13px">{{ s.name }}</span>
                  <a-tag v-if="s.isStart" size="small" color="green">起始</a-tag>
                  <a-tag v-if="s.isEnd" size="small" color="gray">终态</a-tag>
                </div>
                <div style="font-size: 11px; color: var(--cp-text-tertiary); margin-top: 4px">
                  {{ s.handler }} · 超时 {{ s.timeout }}
                </div>
              </div>
            </div>
          </a-col>

          <!-- 中:状态机画布 -->
          <a-col :span="14">
            <div class="cp-card" style="padding: 24px; min-height: 540px">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
                <h3 class="cp-section-title" style="margin: 0">工单状态流转图</h3>
                <a-space :size="4">
                  <a-button size="small">缩小</a-button>
                  <a-button size="small">100%</a-button>
                  <a-button size="small">放大</a-button>
                  <a-divider direction="vertical" />
                  <a-button size="small"><icon-plus /> 新建流转</a-button>
                </a-space>
              </div>

              <!-- 可视化流程图 -->
              <div class="cp-canvas">
                <svg viewBox="0 0 800 460" width="100%">
                  <defs>
                    <marker
                      id="arrow"
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
                    </marker>
                    <marker
                      id="arrow-orange"
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff7d00" />
                    </marker>
                  </defs>

                  <!-- 状态节点 + 流转箭头 -->
                  <g v-for="(s, idx) in statusList" :key="s.code">
                    <rect
                      :x="100"
                      :y="40 + idx * 70"
                      width="180"
                      height="48"
                      rx="6"
                      :fill="s.isStart ? '#e8f7e6' : s.isEnd ? '#f0f1f5' : '#fff'"
                      :stroke="stateColor(s.code)"
                      stroke-width="2"
                    />
                    <text
                      :x="190"
                      :y="60 + idx * 70"
                      text-anchor="middle"
                      font-size="13"
                      font-weight="600"
                      fill="#1d2129"
                    >
                      {{ s.name }}
                    </text>
                    <text :x="190" :y="78 + idx * 70" text-anchor="middle" font-size="10" fill="#86909c">
                      {{ s.code }} · 超时 {{ s.timeout }}
                    </text>
                  </g>

                  <!-- 流转箭头(简化展示) -->
                  <g>
                    <line
                      x1="280"
                      y1="64"
                      x2="380"
                      y2="64"
                      stroke="#94a3b8"
                      stroke-width="1.5"
                      marker-end="url(#arrow)"
                    />
                    <text x="330" y="58" text-anchor="middle" font-size="10" fill="#86909c">自动分单</text>

                    <line
                      x1="280"
                      y1="134"
                      x2="380"
                      y2="134"
                      stroke="#94a3b8"
                      stroke-width="1.5"
                      marker-end="url(#arrow)"
                    />
                    <text x="330" y="128" text-anchor="middle" font-size="10" fill="#86909c">坐席接收</text>

                    <line
                      x1="280"
                      y1="204"
                      x2="380"
                      y2="204"
                      stroke="#94a3b8"
                      stroke-width="1.5"
                      marker-end="url(#arrow)"
                    />
                    <text x="330" y="198" text-anchor="middle" font-size="10" fill="#86909c">转办/协办</text>

                    <line
                      x1="280"
                      y1="274"
                      x2="380"
                      y2="274"
                      stroke="#94a3b8"
                      stroke-width="1.5"
                      marker-end="url(#arrow)"
                    />
                    <text x="330" y="268" text-anchor="middle" font-size="10" fill="#86909c">客户达成一致</text>

                    <line
                      x1="280"
                      y1="344"
                      x2="380"
                      y2="344"
                      stroke="#ff7d00"
                      stroke-width="1.5"
                      stroke-dasharray="4,3"
                      marker-end="url(#arrow-orange)"
                    />
                    <text x="330" y="338" text-anchor="middle" font-size="10" fill="#ff7d00">监管件自动报送</text>

                    <!-- 升级分支(返回) -->
                    <path
                      d="M 280 204 Q 470 204 470 274"
                      stroke="#94a3b8"
                      stroke-width="1.5"
                      fill="none"
                      marker-end="url(#arrow)"
                    />
                    <text x="475" y="240" font-size="10" fill="#86909c">升级返回</text>
                  </g>

                  <!-- 右侧流转规则配置 -->
                  <g>
                    <rect x="540" y="40" width="240" height="320" rx="6" fill="#fff" stroke="#e5e6eb" />
                    <text x="660" y="62" text-anchor="middle" font-size="13" font-weight="600" fill="#1d2129">
                      流转规则
                    </text>
                    <text x="560" y="90" font-size="11" fill="#86909c">源状态</text>
                    <text x="700" y="90" font-size="11" fill="#86909c">目标状态</text>
                    <text x="560" y="100" font-size="11" fill="#86909c">─────────</text>

                    <g v-for="(r, idx) in transitionRules" :key="idx">
                      <text x="560" :y="120 + idx * 36" font-size="11" fill="#4e5969">{{ r.from }}</text>
                      <text x="640" :y="120 + idx * 36" font-size="11" fill="#94a3b8">→</text>
                      <text x="660" :y="120 + idx * 36" font-size="11" fill="#4e5969">{{ r.to }}</text>
                      <text x="560" :y="135 + idx * 36" font-size="10" fill="#86909c">触发:{{ r.trigger }}</text>
                    </g>
                  </g>
                </svg>

                <!-- 图例 -->
                <div class="cp-legend">
                  <span><span class="cp-legend-dot" style="background: #00b42a"></span>起始</span>
                  <span><span class="cp-legend-dot" style="background: #165dff"></span>中间</span>
                  <span><span class="cp-legend-dot" style="background: #86909c"></span>终态</span>
                  <span><span class="cp-legend-line" style="background: #ff7d00"></span>监管件特殊流转</span>
                </div>
              </div>
            </div>
          </a-col>

          <!-- 右:当前状态属性 -->
          <a-col :span="5">
            <div class="cp-card" style="padding: 16px">
              <h3 class="cp-section-title">选中状态属性</h3>
              <div v-if="currentState" style="display: flex; flex-direction: column; gap: 12px">
                <div class="cp-form" style="display: flex; flex-direction: column; gap: 12px">
                  <a-form-item label="状态编码">
                    <a-input v-model="currentState.code" disabled />
                  </a-form-item>
                  <a-form-item label="状态名称">
                    <a-input v-model="currentState.name" />
                  </a-form-item>
                  <a-form-item label="处理人类型">
                    <a-select v-model="currentState.handlerType">
                      <a-option value="rule">规则引擎分单</a-option>
                      <a-option value="assignee">分配对象</a-option>
                      <a-option value="system">系统自动</a-option>
                    </a-select>
                  </a-form-item>
                  <a-form-item label="超时规则">
                    <a-input v-model="currentState.timeout" placeholder="如:8h / 7d / 监管件7d" />
                  </a-form-item>
                  <a-form-item label="超时动作">
                    <a-select v-model="currentState.timeoutAction">
                      <a-option>自动催办</a-option>
                      <a-option>升级上级</a-option>
                      <a-option>预警通知</a-option>
                      <a-option>无动作</a-option>
                    </a-select>
                  </a-form-item>
                  <a-form-item label="是否终态">
                    <a-switch v-model="currentState.isEnd" />
                  </a-form-item>
                </div>
                <a-divider style="margin: 0" />
                <div style="font-size: 12px; color: var(--cp-text-tertiary)">
                  <div>创建时间:2026-07-01</div>
                  <div>最近修改:2026-07-15 14:32</div>
                  <div>修改人:陈强(管理)</div>
                </div>
              </div>
              <a-empty v-else size="small" description="未选中状态" />
            </div>
          </a-col>
        </a-row>
      </a-tab-pane>

      <!-- Tab 2: 流转规则列表 -->
      <a-tab-pane key="rules" title="流转规则 (12 条)">
        <div class="cp-card" style="padding: 0">
          <div
            style="
              padding: 12px 16px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid var(--cp-border-light);
            "
          >
            <a-input-search placeholder="搜索流转规则" style="width: 280px" />
            <a-space>
              <a-button size="small">按类型筛选</a-button>
              <a-button type="primary" size="small"><icon-plus /> 新建规则</a-button>
            </a-space>
          </div>
          <a-table :data="transitionRulesList" :pagination="{ pageSize: 8 }">
            <template #columns>
              <a-table-column title="规则名称" data-index="name" />
              <a-table-column title="源状态">
                <template #cell="{ record }"
                  ><a-tag size="small">{{ record.from }}</a-tag></template
                >
              </a-table-column>
              <a-table-column title="目标状态">
                <template #cell="{ record }"
                  ><a-tag size="small" color="green">{{ record.to }}</a-tag></template
                >
              </a-table-column>
              <a-table-column title="触发条件" data-index="trigger" />
              <a-table-column title="适用工单">
                <template #cell="{ record }">
                  <a-tag v-for="t in record.scope" :key="t" size="small" style="margin: 1px">{{ t }}</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="状态">
                <template #cell>
                  <a-switch default-checked />
                </template>
              </a-table-column>
              <a-table-column title="操作">
                <template #cell>
                  <a-button size="small">编辑</a-button>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </a-tab-pane>

      <!-- Tab 3: 监管件特殊配置 -->
      <a-tab-pane key="regulator" title="监管件特殊规则">
        <a-alert type="warning" show-icon style="margin-bottom: 16px">
          <template #title>监管件处理时效强约束</template>
          <template #content>
            监管件(12378/12345/信访转办)时效 7 天,超时自动触发预警并升级。建议独立配置以避免与普通件混用。
          </template>
        </a-alert>
        <div class="cp-card" style="padding: 20px 24px">
          <div class="cp-form">
            <a-row :gutter="24">
              <a-col :span="12">
                <a-form-item label="处理总时限">
                  <a-input default-value="7 个工作日" disabled />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="到期前预警时间">
                  <a-input default-value="1 天" disabled />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="超时后自动动作">
                  <a-select default-value="预警通知+升级">
                    <a-option>仅预警通知</a-option>
                    <a-option>预警通知+升级</a-option>
                    <a-option>升级至消保管理层</a-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="处理优先级">
                  <a-select default-value="特急">
                    <a-option>特急</a-option>
                    <a-option>紧急</a-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="归档要求">
                  <a-checkbox-group :default-value="['summary', 'evidence']">
                    <a-checkbox value="summary">必须填写处理结论摘要</a-checkbox>
                    <a-checkbox value="evidence">必须上传证明材料</a-checkbox>
                    <a-checkbox value="review">必须经审查人员复核</a-checkbox>
                  </a-checkbox-group>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="报送要求">
                  <a-checkbox default-checked>处理完成后自动报送至监管平台</a-checkbox>
                </a-form-item>
              </a-col>
            </a-row>
          </div>
        </div>
      </a-tab-pane>

      <!-- Tab 4: 版本历史 -->
      <a-tab-pane key="versions" title="版本历史">
        <div class="cp-card" style="padding: 0">
          <a-table :data="versions" :pagination="false">
            <template #columns>
              <a-table-column title="版本号" data-index="version" />
              <a-table-column title="发布时间" data-index="time" />
              <a-table-column title="发布人" data-index="publisher" />
              <a-table-column title="变更说明" data-index="changes" />
              <a-table-column title="操作">
                <template #cell="{ record }">
                  <a-space>
                    <a-button size="small">查看差异</a-button>
                    <a-button size="small" v-if="record.version !== 'V2.3 当前'">回滚</a-button>
                    <a-tag v-else color="green" size="small">当前版本</a-tag>
                  </a-space>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </a-tab-pane>

      <!-- ========== 业务工作流(坐席/支撑岗/管理层联动) ========== -->
      <a-tab-pane key="bizflow" title="业务工作流 (6 个)">
        <a-row :gutter="16">
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

          <a-col :span="15">
            <div class="cp-card" style="padding: 16px">
              <div v-if="activeTemplate">
                <h3 class="cp-section-title">{{ activeTemplate.name }} · 节点配置</h3>
                <div style="font-size: 12px; color: var(--cp-text-tertiary); margin-bottom: 12px">
                  {{ activeTemplate.desc }}
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
            </div>
          </a-col>
        </a-row>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useWorkflowStore, WorkflowKind } from '@/stores/workflow'

const activeState = ref('todo')

const statusList = reactive([
  {
    code: 'pending',
    name: '待分派',
    handler: '规则引擎',
    timeout: '24h',
    isStart: true,
    isEnd: false,
    handlerType: 'rule',
    timeoutAction: '自动催办'
  },
  {
    code: 'todo',
    name: '待接收',
    handler: '分配对象',
    timeout: '8h',
    isStart: false,
    isEnd: false,
    handlerType: 'assignee',
    timeoutAction: '自动催办'
  },
  {
    code: 'processing',
    name: '处理中',
    handler: '分配对象',
    timeout: '监管件7d / 普通件15d',
    isStart: false,
    isEnd: false,
    handlerType: 'assignee',
    timeoutAction: '升级上级'
  },
  {
    code: 'transfer',
    name: '待流转',
    handler: '分配对象',
    timeout: '4h',
    isStart: false,
    isEnd: false,
    handlerType: 'assignee',
    timeoutAction: '预警通知'
  },
  {
    code: 'closing',
    name: '待关单',
    handler: '分配对象',
    timeout: '72h',
    isStart: false,
    isEnd: false,
    handlerType: 'assignee',
    timeoutAction: '自动催办'
  },
  {
    code: 'closed',
    name: '已关单',
    handler: '系统自动',
    timeout: '-',
    isStart: false,
    isEnd: true,
    handlerType: 'system',
    timeoutAction: '无动作'
  }
])

const currentState = computed(() => statusList.find((s) => s.code === activeState.value))

function stateColor(code: string) {
  const map: Record<string, string> = {
    pending: '#00b42a',
    todo: '#165dff',
    processing: '#165dff',
    transfer: '#722ed1',
    closing: '#ff7d00',
    closed: '#86909c'
  }
  return map[code] || '#165dff'
}

function addStatus() {
  // 演示用
}

const transitionRules = [
  { from: '待分派', to: '待接收', trigger: '分单规则命中' },
  { from: '待接收', to: '处理中', trigger: '坐席主动接收' },
  { from: '处理中', to: '待流转', trigger: '转办/协办/升级' },
  { from: '处理中', to: '待关单', trigger: '客户达成一致' },
  { from: '待关单', to: '已关单', trigger: '坐席确认关单' },
  { from: '处理中', to: '已关单', trigger: '监管件直接归档' }
]

const transitionRulesList = [
  { name: '坐席接收规则', from: '待接收', to: '处理中', trigger: '坐席点击接收', scope: ['全部'] },
  { name: '转办规则', from: '处理中', to: '待流转', trigger: '坐席选择转办', scope: ['投诉', '外部转办'] },
  { name: '升级规则', from: '处理中', to: '待流转', trigger: '坐席选择升级', scope: ['投诉', '监管件'] },
  { name: '关单规则', from: '待关单', to: '已关单', trigger: '坐席确认关单', scope: ['全部'] },
  { name: '监管件归档', from: '处理中', to: '已关单', trigger: '监管件直接归档', scope: ['监管件'] },
  { name: '自动催办', from: '待接收', to: '待接收', trigger: '8h 超时', scope: ['全部'] },
  { name: '超时升级', from: '处理中', to: '待流转', trigger: '监管件 7d / 普通件 15d 超时', scope: ['全部'] },
  { name: '审批驳回', from: '待流转', to: '处理中', trigger: 'OA 审批驳回', scope: ['业务执行类'] },
  { name: '客户不满意升级', from: '已关单', to: '处理中', trigger: '≤2 星评价', scope: ['投诉'] },
  { name: '方案违约恢复', from: '处理中', to: '处理中', trigger: '协商方案违约,自动恢复催收', scope: ['业务执行类'] },
  { name: '到期自动恢复', from: '处理中', to: '已关单', trigger: '停催到期前 1 天提醒', scope: ['业务执行类'] },
  { name: '知识归档触发', from: '已关单', to: '已关单', trigger: '审查归档自动同步知识库', scope: ['审查立项'] }
]

const versions = [
  {
    version: 'V2.3 当前',
    time: '2026-07-15 14:32',
    publisher: '陈强(管理)',
    changes: '优化监管件超时升级规则,新增"客户不满意升级"流转'
  },
  { version: 'V2.2', time: '2026-06-28 10:15', publisher: '陈强(管理)', changes: '新增审批驳回回流规则' },
  {
    version: 'V2.1',
    time: '2026-05-15 16:00',
    publisher: '陈强(管理)',
    changes: '工单状态拆分为 6 态,增加"待关单"节点'
  },
  { version: 'V2.0', time: '2026-04-01 09:00', publisher: '陈强(管理)', changes: 'PRD V2.0 发布,流程重构' },
  { version: 'V1.5', time: '2026-02-10 14:00', publisher: '陈强(管理)', changes: 'Phase 0 试运行版本' }
]

// ============ 业务工作流(联动坐席/支撑岗/管理层) ============
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
function kindShort(k: string) {
  return { apply: '申请', approve: '审批', execute: '执行', notify: '通知', auto: '自动', archive: '归档' }[k] || k
}
</script>

<style scoped>
/* 业务工作流模板选择 */
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

/* 状态卡片 */
.cp-state-card {
  padding: 10px 12px;
  border: 1px solid var(--cp-border-light);
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.cp-state-card:hover {
  background: var(--cp-bg-hover);
}
.cp-state-card.is-active {
  border-color: var(--cp-brand);
  background: var(--cp-brand-soft);
}
.cp-state-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

/* 画布 */
.cp-canvas {
  background: var(--cp-bg-soft);
  border-radius: 6px;
  padding: 16px;
  position: relative;
}
.cp-legend {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  font-size: 12px;
  color: var(--cp-text-tertiary);
  padding-top: 12px;
  border-top: 1px dashed var(--cp-border);
}
.cp-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  vertical-align: middle;
  margin-right: 4px;
}
.cp-legend-line {
  width: 16px;
  height: 2px;
  display: inline-block;
  vertical-align: middle;
  margin-right: 4px;
}
</style>
