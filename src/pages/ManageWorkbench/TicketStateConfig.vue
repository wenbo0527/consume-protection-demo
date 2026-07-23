<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">
          工单状态机配置(V2)
          <a-tag :color="ms.hasDraftChanges ? 'orange' : 'green'" size="small" style="margin-left: 8px">
            {{ ms.hasDraftChanges ? ms.draftVersionLabel : ms.publishedVersionLabel }}
          </a-tag>
        </h1>
        <div class="cp-page-subtitle">
          状态机引擎 + Guard 表达式 + 钩子编排 + 草稿/发布/回滚 · schemaVersion {{ ms.schemaVersion }}
        </div>
      </div>
      <a-space>
        <a-button @click="onDiscardDraft" :disabled="!ms.hasDraftChanges">放弃草稿</a-button>
        <a-button type="primary" @click="onPublish" :disabled="!ms.hasDraftChanges">
          <icon-check /> 发布新版本
        </a-button>
      </a-space>
    </div>

    <a-tabs :active-key="activeTab" @change="onTabChange">
      <!-- ============ Tab 1: 流程设计(V1 旧) ============ -->
      <a-tab-pane key="design" title="流程设计">
        <a-row :gutter="16">
          <a-col :span="5">
            <div class="cp-card" style="padding: 16px">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px">
                <h3 class="cp-section-title" style="margin: 0">状态定义</h3>
                <a-button size="small" type="text" @click="addStatus">
                  <icon-plus />
                </a-button>
              </div>
              <div
                v-for="s in ticketStates"
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
                  处理人:{{ handlerLabel(s.handlerType) }} · 超时 {{ s.timeout }}
                </div>
              </div>
            </div>
          </a-col>

          <a-col :span="14">
            <div class="cp-card" style="padding: 24px; min-height: 540px">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
                <h3 class="cp-section-title" style="margin: 0">工单状态流转图(V1 旧画布)</h3>
                <a-space :size="4">
                  <a-button size="small" @click="goBizFlow">业务工作流配置</a-button>
                </a-space>
              </div>
              <workflow-state-canvas
                :states="ticketStates"
                :rules="transitionRules"
                :active-code="activeState"
                regulator-code="processing"
                @select="(c) => (activeState = c)"
                @rule-add="onRuleAdd"
              />
            </div>
          </a-col>

          <a-col :span="5">
            <div class="cp-card" style="padding: 16px">
              <h3 class="cp-section-title">选中状态属性</h3>
              <div v-if="currentState" style="display: flex; flex-direction: column; gap: 12px">
                <a-form-item label="状态编码">
                  <a-input :model-value="currentState.code" disabled />
                </a-form-item>
                <a-form-item label="状态名称">
                  <a-input :model-value="currentState.name" @change="(v: string) => updateState({ name: v })" />
                </a-form-item>
                <a-form-item label="处理人类型">
                  <a-select
                    :model-value="currentState.handlerType"
                    @change="(v: any) => updateState({ handlerType: v })"
                  >
                    <a-option value="rule">规则引擎分单</a-option>
                    <a-option value="assignee">分配对象</a-option>
                    <a-option value="system">系统自动</a-option>
                  </a-select>
                </a-form-item>
                <a-form-item label="超时规则">
                  <a-input
                    :model-value="currentState.timeout"
                    placeholder="如:8h / 7d / 监管件7d"
                    @change="(v: string) => updateState({ timeout: v })"
                  />
                </a-form-item>
                <a-form-item label="超时动作">
                  <a-select
                    :model-value="currentState.timeoutAction"
                    @change="(v: any) => updateState({ timeoutAction: v })"
                  >
                    <a-option>自动催办</a-option>
                    <a-option>升级上级</a-option>
                    <a-option>预警通知</a-option>
                    <a-option>无动作</a-option>
                  </a-select>
                </a-form-item>
                <a-form-item label="是否终态">
                  <a-switch
                    :model-value="currentState.isEnd"
                    @change="(v: any) => updateState({ isEnd: !!v })"
                  />
                </a-form-item>
                <a-divider style="margin: 0" />
                <div style="font-size: 12px; color: var(--cp-text-tertiary)">
                  <div>状态机 V1 · 兼容模式</div>
                  <div>新版(V2)在"状态机引擎"Tab</div>
                </div>
              </div>
              <a-empty v-else size="small" description="未选中状态" />
            </div>
          </a-col>
        </a-row>
      </a-tab-pane>

      <!-- ============ Tab 2: 流转规则(V1) ============ -->
      <a-tab-pane key="rules" title="流转规则">
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
          <a-table :data="transitionRules" :pagination="{ pageSize: 8 }">
            <template #columns>
              <a-table-column title="规则名称" data-index="name" />
              <a-table-column title="源状态">
                <template #cell="{ record }">
                  <a-tag size="small">{{ stateName(record.from) }}</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="目标状态">
                <template #cell="{ record }">
                  <a-tag size="small" color="green">{{ stateName(record.to) }}</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="触发条件" data-index="trigger" />
              <a-table-column title="适用工单">
                <template #cell="{ record }">
                  <a-tag v-for="t in record.scope" :key="t" size="small" style="margin: 1px">{{ t }}</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="状态">
                <template #cell="{ record }">
                  <a-switch
                    :model-value="record.enabled"
                    @change="(v: any) => wf.updateTransitionRule(transitionRules.indexOf(record), { enabled: !!v })"
                  />
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

      <!-- ============ Tab 3: 监管件特殊规则(V1) ============ -->
      <a-tab-pane key="regulator" title="监管件特殊规则">
        <a-alert type="warning" show-icon style="margin-bottom: 16px">
          <template #title>监管件处理时效强约束</template>
          <template #content>
            监管件(12378/12345/信访转办)时效 7 天,超时自动触发预警并升级。建议独立配置以避免与普通件混用。
          </template>
        </a-alert>
        <div class="cp-card" style="padding: 20px 24px">
          <a-row :gutter="24">
            <a-col :span="12">
              <a-form-item label="处理总时限">
                <a-input
                  :model-value="wf.regulatorPolicy.totalSla"
                  @change="(v: string) => wf.updateRegulatorPolicy({ totalSla: v })"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="到期前预警时间">
                <a-input
                  :model-value="wf.regulatorPolicy.warnBefore"
                  @change="(v: string) => wf.updateRegulatorPolicy({ warnBefore: v })"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="超时后自动动作">
                <a-select
                  :model-value="wf.regulatorPolicy.overdueAction"
                  @change="(v: any) => wf.updateRegulatorPolicy({ overdueAction: v })"
                >
                  <a-option>仅预警通知</a-option>
                  <a-option>预警通知+升级</a-option>
                  <a-option>升级至消保管理层</a-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="处理优先级">
                <a-select
                  :model-value="wf.regulatorPolicy.priority"
                  @change="(v: any) => wf.updateRegulatorPolicy({ priority: v })"
                >
                  <a-option>特急</a-option>
                  <a-option>紧急</a-option>
                  <a-option>普通</a-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="归档要求">
                <a-checkbox-group
                  :model-value="archiveCheckValue"
                  @change="(v: any) => onArchiveCheckChange(v as string[])"
                >
                  <a-checkbox value="summary">必须填写处理结论摘要</a-checkbox>
                  <a-checkbox value="evidence">必须上传证明材料</a-checkbox>
                  <a-checkbox value="review">必须经审查人员复核</a-checkbox>
                </a-checkbox-group>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="报送要求">
                <a-checkbox
                  :model-value="wf.regulatorPolicy.autoReport"
                  @change="(v: any) => wf.updateRegulatorPolicy({ autoReport: !!v })"
                >
                  处理完成后自动报送至监管平台
                </a-checkbox>
              </a-form-item>
            </a-col>
          </a-row>
        </div>
      </a-tab-pane>

      <!-- ============ Tab 4: 状态机引擎(V2) ============ -->
      <a-tab-pane key="v2-engine" title="状态机引擎 (V2)">
        <!-- 上方:画布 + 状态选择 -->
        <div class="cp-card" style="padding: 16px 20px; margin-bottom: 12px">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px">
            <h3 class="cp-section-title" style="margin: 0">V2 状态机可视化</h3>
            <a-space :size="4">
              <a-tag size="small">{{ v2States.length }} 状态</a-tag>
              <a-tag size="small">{{ v2Transitions.length }} 流转</a-tag>
              <a-button size="mini" @click="goImpactAnalysis">影响分析</a-button>
            </a-space>
          </div>
          <WorkflowStateCanvasV2
            :states="v2States"
            :transitions="v2Transitions"
            :active-id="activeV2State"
            :regulator-edge="{ from: 'processing', to: 'closed' }"
            @select="(id) => (activeV2State = id)"
            @transition-select="onSelectTransition"
          />
        </div>

        <a-row :gutter="16">
          <a-col :span="6">
            <div class="cp-card" style="padding: 12px">
              <h3 class="cp-section-title">V2 状态</h3>
              <div
                v-for="s in v2States"
                :key="s.id"
                class="cp-state-card"
                :class="{ 'is-active': activeV2State === s.id }"
                @click="activeV2State = s.id"
              >
                <div style="display: flex; align-items: center; gap: 6px">
                  <span class="cp-state-dot" :style="{ background: s.color || '#165dff' }"></span>
                  <span style="font-weight: 500; font-size: 13px">{{ s.name }}</span>
                </div>
                <div style="font-size: 11px; color: var(--cp-text-tertiary); margin-top: 4px">
                  {{ s.id }} · {{ s.category }} · {{ countHooks(s) }} 钩子
                </div>
              </div>
            </div>
          </a-col>

          <a-col :span="18">
            <div v-if="activeV2StateObj" class="cp-card" style="padding: 20px 24px">
              <h3 class="cp-section-title">{{ activeV2StateObj.name }} · 钩子配置</h3>
              <a-row :gutter="24">
                <a-col :span="12">
                  <HookConfigList
                    title="onEnter · 进入时执行"
                    :hooks="activeV2StateObj.onEnter || []"
                    @update="(hooks) => ms.setStateHooks(activeV2State!, 'onEnter', hooks)"
                  />
                </a-col>
                <a-col :span="12">
                  <HookConfigList
                    title="onExit · 离开时执行"
                    :hooks="activeV2StateObj.onExit || []"
                    @update="(hooks) => ms.setStateHooks(activeV2State!, 'onExit', hooks)"
                  />
                </a-col>
              </a-row>
              <a-divider />
              <h3 class="cp-section-title">本状态的 Transition 钩子</h3>
              <a-empty v-if="v2StateTransitions.length === 0" size="small" description="没有出边" />
              <div v-else style="display: flex; flex-direction: column; gap: 12px">
                <div v-for="t in v2StateTransitions" :key="t.id" class="cp-tx-card">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px">
                    <span>
                      <a-tag color="arcoblue">{{ t.event }}</a-tag>
                      <span style="margin: 0 4px">→</span>
                      <a-tag color="green">{{ t.to }}</a-tag>
                      <span v-if="t.label" style="margin-left: 8px; color: var(--cp-text-tertiary); font-size: 12px">
                        {{ t.label }}
                      </span>
                    </span>
                    <a-button
                      size="mini"
                      type="text"
                      :disabled="impactFor(t.id) === 0"
                      @click="showImpact(t.id)"
                    >
                      影响 {{ impactFor(t.id) }} 条
                    </a-button>
                  </div>
                  <HookConfigList
                    title="边 effects · 过桥时执行"
                    :hooks="t.effects || []"
                    @update="(hooks) => ms.setTransitionEffects(t.id, hooks)"
                  />
                </div>
              </div>
            </div>
            <a-empty v-else description="请选择左侧状态" />
          </a-col>
        </a-row>
      </a-tab-pane>

      <!-- ============ Tab 5: 测试沙箱(V2) ============ -->
      <a-tab-pane key="sandbox" title="测试沙箱">
        <a-row :gutter="16">
          <a-col :span="10">
            <div class="cp-card" style="padding: 16px">
              <h3 class="cp-section-title">Mock 工单</h3>
              <a-form-item label="工单 ID">
                <a-input v-model="sandbox.ticketId" />
              </a-form-item>
              <a-form-item label="分类">
                <a-select v-model="sandbox.category">
                  <a-option value="complaint">投诉</a-option>
                  <a-option value="regulator">监管件</a-option>
                  <a-option value="external">外部转办</a-option>
                  <a-option value="business">业务执行</a-option>
                </a-select>
              </a-form-item>
              <a-form-item v-if="sandbox.category === 'regulator'" label="监管子类型">
                <a-select v-model="sandbox.regulatorSubType">
                  <a-option value="12378">12378</a-option>
                  <a-option value="12345">12345</a-option>
                  <a-option value="xinfang">信访</a-option>
                </a-select>
              </a-form-item>
              <a-form-item label="金额">
                <a-input-number v-model="sandbox.amount" :min="0" />
              </a-form-item>
              <a-form-item label="优先级">
                <a-input-number v-model="sandbox.priority" :min="1" :max="4" />
              </a-form-item>
              <a-form-item label="满意度(1-5)">
                <a-input-number v-model="sandbox.satisfaction" :min="1" :max="5" />
              </a-form-item>
              <a-form-item label="当前状态">
                <a-select v-model="sandbox.currentState">
                  <a-option v-for="s in v2States" :key="s.id" :value="s.id">{{ s.name }}</a-option>
                </a-select>
              </a-form-item>
              <a-button type="primary" @click="onResetSandbox" style="margin-top: 8px">重置工单</a-button>
            </div>
          </a-col>

          <a-col :span="14">
            <div class="cp-card" style="padding: 16px">
              <h3 class="cp-section-title">发送事件</h3>
              <a-space wrap>
                <a-button v-for="e in COMMON_EVENTS" :key="e" @click="onSendEvent(e)" size="small">
                  <icon-send /> {{ e }}
                </a-button>
              </a-space>

              <a-divider />

              <h3 class="cp-section-title">执行轨迹</h3>
              <a-empty v-if="sandbox.trace.length === 0" size="small" description="尚未发送事件" />
              <a-timeline v-else>
                <a-timeline-item v-for="(t, idx) in sandbox.trace" :key="idx">
                  <div style="font-weight: 500">
                    <a-tag :color="t.transitioned ? 'green' : 'red'">
                      {{ t.transitioned ? '✓ ' + (t.fromState || '?') + ' → ' + t.toState : '× 未转换' }}
                    </a-tag>
                    <span style="margin-left: 4px">{{ t.eventType }}</span>
                  </div>
                  <div v-if="t.matchedTransitionId" style="font-size: 12px; color: var(--cp-text-tertiary)">
                    匹配: {{ t.matchedTransitionId }}
                  </div>
                  <div v-if="t.rejectedBy?.length" style="font-size: 12px; color: var(--cp-danger)">
                    拒绝原因:
                    <span v-for="r in t.rejectedBy" :key="r.transitionId">
                      [{{ r.transitionId }}] {{ r.reason }}
                    </span>
                  </div>
                  <div v-if="t.hookResults?.length" style="margin-top: 4px; font-size: 12px">
                    <div v-for="(h, hi) in t.hookResults" :key="hi">
                      <a-tag :color="hookResultColor(h.status)" size="small">
                        {{ h.status }}
                      </a-tag>
                      <span style="font-family: monospace">{{ h.kind }} </span>
                      <span style="color: var(--cp-text-tertiary)">{{ h.duration }}ms</span>
                    </div>
                  </div>
                  <div v-if="t.errors?.length" style="margin-top: 4px; color: var(--cp-danger); font-size: 12px">
                    {{ t.errors.join('; ') }}
                  </div>
                </a-timeline-item>
              </a-timeline>

              <a-divider />
              <h3 class="cp-section-title">工单当前字段</h3>
              <pre style="font-size: 11px; background: var(--cp-bg-soft); padding: 8px; border-radius: 4px; max-height: 200px; overflow: auto">{{ JSON.stringify(sandbox.ticket?.fields, null, 2) }}</pre>
            </div>
          </a-col>
        </a-row>
      </a-tab-pane>

      <!-- ============ Tab 6: 影响分析(V2) ============ -->
      <a-tab-pane key="impact" title="影响分析">
        <a-alert type="info" show-icon style="margin-bottom: 16px">
          <template #title>扫描当前 mock 数据中所有进行中工单,展示状态机修改可能影响哪些工单</template>
          <template #content>
            改 transition / 钩子 / 状态属性前,先用此 Tab 预演影响范围。
            <div style="margin-top: 4px">统计逻辑:工单.status 等于 V2 状态 id 且 != 'closed' 的视为进行中。</div>
          </template>
        </a-alert>

        <a-row :gutter="16">
          <a-col :span="12">
            <div class="cp-card" style="padding: 16px 20px">
              <h3 class="cp-section-title">状态影响统计</h3>
              <a-table :data="statusImpactRows" :pagination="false" size="small">
                <template #columns>
                  <a-table-column title="状态">
                    <template #cell="{ record }">
                      <a-tag :color="record.color || '#165dff'">{{ record.name }}</a-tag>
                    </template>
                  </a-table-column>
                  <a-table-column title="进行中工单数" :width="140">
                    <template #cell="{ record }">
                      <span :style="{ color: record.count > 0 ? 'var(--cp-warning)' : 'var(--cp-text-tertiary)' }">
                        {{ record.count }} 条
                      </span>
                    </template>
                  </a-table-column>
                  <a-table-column title="操作" :width="100">
                    <template #cell="{ record }">
                      <a-button size="mini" @click="impactDrillDown(record.id)">查看工单</a-button>
                    </template>
                  </a-table-column>
                </template>
              </a-table>
              <a-divider />
              <div style="font-size: 12px; color: var(--cp-text-tertiary)">
                总进行中工单:<b>{{ totalInProgress }}</b> · 总已关单:<b>{{ totalClosed }}</b> · 总数:<b>{{ allTickets.length }}</b>
              </div>
            </div>
          </a-col>
          <a-col :span="12">
            <div class="cp-card" style="padding: 16px 20px">
              <h3 class="cp-section-title">流转路径影响</h3>
              <a-empty v-if="selectedTransition === null" size="small" description="在 V2 引擎 Tab 选一条 transition 后,这里会显示它会影响的工单" />
              <div v-else>
                <a-tag color="arcoblue">{{ selectedTransition.event }}</a-tag>
                <span style="margin: 0 4px">{{ selectedTransition.from }} → {{ selectedTransition.to }}</span>
                <a-divider style="margin: 12px 0" />
                <div style="font-size: 13px; margin-bottom: 8px">
                  该 transition 会从 <b>{{ stateNameOf(selectedTransition.from) }}</b>
                  推进到 <b>{{ stateNameOf(selectedTransition.to) }}</b>。
                </div>
                <div v-if="impactedTickets.length === 0" style="color: var(--cp-text-tertiary); font-size: 12px">
                  当前没有处于 {{ stateNameOf(selectedTransition.from) }} 状态的进行中工单,修改此 transition 暂不直接影响现网工单。
                </div>
                <a-table v-else :data="impactedTickets" :pagination="{ pageSize: 6 }" size="small">
                  <template #columns>
                    <a-table-column title="工单号" data-index="id" :width="160" />
                    <a-table-column title="客户" data-index="customerName" :width="80" />
                    <a-table-column title="类型" data-index="typeLabel" :width="100" />
                    <a-table-column title="处理人" data-index="handler" :width="80" />
                  </template>
                </a-table>
              </div>
            </div>
          </a-col>
        </a-row>
      </a-tab-pane>

      <!-- ============ Tab 7: 版本管理(V2) ============ -->
      <a-tab-pane key="versions" title="版本管理">
        <a-row :gutter="16">
          <a-col :span="12">
            <div class="cp-card" style="padding: 16px 20px">
              <h3 class="cp-section-title">当前发布版</h3>
              <a-descriptions :column="1" size="small" bordered>
                <a-descriptions-item label="版本号">{{ ms.published.version }}</a-descriptions-item>
                <a-descriptions-item label="状态">
                  <a-tag color="green">published</a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="发布时间">{{ ms.published.publishedAt || '-' }}</a-descriptions-item>
                <a-descriptions-item label="发布人">{{ ms.published.publishedBy || '-' }}</a-descriptions-item>
                <a-descriptions-item label="变更说明">{{ ms.published.changeNote || '-' }}</a-descriptions-item>
                <a-descriptions-item label="状态数">{{ ms.published.states.length }}</a-descriptions-item>
                <a-descriptions-item label="边数">{{ ms.published.transitions.length }}</a-descriptions-item>
              </a-descriptions>
            </div>
          </a-col>
          <a-col :span="12">
            <div class="cp-card" style="padding: 16px 20px">
              <h3 class="cp-section-title">历史版本(可回滚)</h3>
              <a-empty v-if="ms.history.length === 0" size="small" description="尚无历史" />
              <a-table v-else :data="versionRows" :pagination="{ pageSize: 5 }" size="small">
                <template #columns>
                  <a-table-column title="版本" data-index="version" />
                  <a-table-column title="发布人" data-index="publisher" />
                  <a-table-column title="变更" data-index="changeNote" />
                  <a-table-column title="操作">
                    <template #cell="{ record }">
                      <a-button size="mini" @click="onRollback(record.idx)">回滚到此版</a-button>
                    </template>
                  </a-table-column>
                </template>
              </a-table>
            </div>
          </a-col>
        </a-row>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorkflowStore, type TicketState, type TicketStateCode } from '@/stores/workflow'
import { useMachineStore } from '@/stores/machine-store'
import { createRunner } from '@/stores/machine-runner'
import { getServiceRegistry } from '@/stores/machine-services'
import type { Ticket, StateEvent, StateHook, HookResult, StateTransition } from '@/stores/ticket-machine'
import { tickets as mockTickets, type Ticket as MockTicket } from '@/mock/data'
import WorkflowStateCanvas from '@/components/WorkflowStateCanvas.vue'
import WorkflowStateCanvasV2 from '@/components/WorkflowStateCanvasV2.vue'
import HookConfigList from './_partials/HookConfigList.vue'

const route = useRoute()
const router = useRouter()
const wf = useWorkflowStore()
const ms = useMachineStore()

// ============ URL 同步 Tab ============
const TAB_KEYS = ['design', 'rules', 'regulator', 'v2-engine', 'sandbox', 'impact', 'versions'] as const
type TabKey = (typeof TAB_KEYS)[number]
const activeTab = ref<TabKey>(((route.query.tab as TabKey) || 'design') as TabKey)

watch(
  () => route.query.tab,
  (q) => {
    const v = (q as TabKey) || 'design'
    if (TAB_KEYS.includes(v as TabKey)) activeTab.value = v as TabKey
  }
)

function onTabChange(k: string | number) {
  const next = String(k) as TabKey
  activeTab.value = next
  router.replace({ query: { ...route.query, tab: next } })
}

// ============ V1 数据 ============
const ticketStates = computed(() => wf.ticketStates)
const transitionRules = computed(() => wf.transitionRules)
const activeState = ref<TicketStateCode>('todo')
const currentState = computed(() => ticketStates.value.find((s) => s.code === activeState.value))

const COLOR_MAP: Record<TicketStateCode, string> = {
  pending: '#00b42a',
  todo: '#165dff',
  processing: '#165dff',
  transfer: '#722ed1',
  closing: '#ff7d00',
  closed: '#86909c'
}
function stateColor(code: TicketStateCode) {
  return COLOR_MAP[code] || '#165dff'
}
function stateName(code: TicketStateCode) {
  return ticketStates.value.find((s) => s.code === code)?.name || code
}
function handlerLabel(t: TicketState['handlerType']) {
  return t === 'rule' ? '规则引擎' : t === 'assignee' ? '分配对象' : '系统自动'
}

function updateState(patch: Partial<TicketState>) {
  if (!currentState.value) return
  wf.updateTicketState(currentState.value.code, patch)
}
function addStatus() {
  const newCode = ('custom_' + Date.now()) as TicketStateCode
  wf.addTicketState({
    code: newCode,
    name: '自定义状态',
    handlerType: 'assignee',
    timeout: '24h',
    timeoutAction: '自动催办',
    isStart: false,
    isEnd: false
  })
}
function goBizFlow() {
  router.push('/manage/bizflow')
}
function onRuleAdd(rule: { name: string; from: TicketStateCode; to: TicketStateCode; trigger: string; scope: string[]; enabled?: boolean }) {
  wf.addTransitionRule({
    name: rule.name,
    from: rule.from,
    to: rule.to,
    trigger: rule.trigger,
    scope: rule.scope,
    enabled: rule.enabled !== false
  })
}

const archiveCheckValue = computed<string[]>(() => {
  const r = wf.regulatorPolicy.archiveRequires
  const out: string[] = []
  if (r.summary) out.push('summary')
  if (r.evidence) out.push('evidence')
  if (r.review) out.push('review')
  return out
})
function onArchiveCheckChange(v: string[]) {
  wf.updateRegulatorPolicy({
    archiveRequires: {
      summary: v.includes('summary'),
      evidence: v.includes('evidence'),
      review: v.includes('review')
    }
  })
}

// ============ V2 数据 ============
const v2States = computed(() => ms.draft.states)
const v2Transitions = computed(() => ms.draft.transitions)
const activeV2State = ref<string>(ms.draft.states[0]?.id || '')
const activeV2StateObj = computed(() => v2States.value.find((s) => s.id === activeV2State.value))
const v2StateTransitions = computed(() => v2Transitions.value.filter((t) => t.from === activeV2State.value))

// ============ 版本管理 ============
const versionRows = computed(() =>
  ms.history.map((m, idx) => ({
    idx,
    version: m.version,
    publisher: m.publishedBy || '-',
    changeNote: m.changeNote || '-'
  }))
)
function onPublish() {
  const note = window.prompt('变更说明', '') || ''
  ms.publishDraft(note)
}
function onDiscardDraft() {
  if (window.confirm('放弃草稿,恢复到当前发布版?')) ms.discardDraft()
}
function onRollback(idx: number) {
  if (window.confirm(`确认回滚到 V${ms.history[idx].version}?当前发布版会被覆盖。`)) ms.rollbackTo(idx)
}

// ============ 测试沙箱 ============
const COMMON_EVENTS = [
  'agent_accept',
  'agent_transfer',
  'agent_escalate',
  'customer_signed',
  'regulator_archive',
  'approval_rejected',
  'satisfaction_low',
  'timeout'
]

interface TraceItem {
  eventType: string
  transitioned: boolean
  fromState?: string
  toState?: string
  matchedTransitionId?: string
  rejectedBy?: Array<{ transitionId: string; reason: string }>
  hookResults?: Array<{ kind: string; status: string; duration: number }>
  errors?: string[]
}

const sandbox = reactive<{
  ticketId: string
  category: 'complaint' | 'regulator' | 'external' | 'business'
  regulatorSubType?: '12378' | '12345' | 'xinfang' | 'court'
  amount: number
  priority: number
  satisfaction: number
  currentState: string
  ticket: Ticket | null
  trace: TraceItem[]
}>({
  ticketId: 'T-SANDBOX-001',
  category: 'complaint',
  amount: 5000,
  priority: 2,
  satisfaction: 5,
  currentState: 'pending',
  ticket: null,
  trace: []
})

function buildSandboxTicket(): Ticket {
  return {
    id: sandbox.ticketId,
    category: sandbox.category,
    regulatorSubType: sandbox.regulatorSubType,
    fields: { amount: sandbox.amount, priority: sandbox.priority, satisfaction: sandbox.satisfaction },
    currentState: sandbox.currentState,
    machineId: ms.draft.id,
    machineVersion: ms.draft.version,
    createdAt: new Date().toISOString(),
    currentStateEnteredAt: new Date().toISOString(),
    history: []
  }
}

function onResetSandbox() {
  sandbox.ticket = buildSandboxTicket()
  sandbox.trace = []
}

async function onSendEvent(eventType: string) {
  if (!sandbox.ticket) sandbox.ticket = buildSandboxTicket()
  const runner = createRunner(ms.draft, { services: getServiceRegistry() })
  const event: StateEvent = {
    type: eventType,
    source: 'user',
    occurredAt: new Date().toISOString()
  }
  const r = await runner.dispatch(sandbox.ticket, event, { user: { role: 'agent' } })
  sandbox.currentState = sandbox.ticket.currentState
  sandbox.trace.unshift({
    eventType,
    transitioned: r.transitioned,
    fromState: r.fromState,
    toState: r.toState,
    matchedTransitionId: r.matchedTransitionId,
    rejectedBy: r.rejectedBy,
    hookResults: r.hookResults.map((h: HookResult) => ({
      kind: h.hook.kind,
      status: h.status,
      duration: h.durationMs
    })),
    errors: r.errors
  })
}

function hookResultColor(status: string): string {
  const m: Record<string, string> = { ok: 'green', warn: 'orange', fail: 'red', skipped: 'gray' }
  return m[status] || 'gray'
}

// ============ V2 引擎辅助 ============
function countHooks(s: { onEnter?: StateHook[]; onExit?: StateHook[] }): number {
  return (s.onEnter?.length || 0) + (s.onExit?.length || 0)
}
function onSelectTransition(id: string) {
  selectedTransitionId.value = id
  router.replace({ query: { ...route.query, tab: 'impact' } })
}
function goImpactAnalysis() {
  router.replace({ query: { ...route.query, tab: 'impact' } })
}

// ============ 影响分析 ============
const allTickets = computed<MockTicket[]>(() => mockTickets)

const statusImpactRows = computed(() =>
  v2States.value.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    count: allTickets.value.filter((t) => t.status === s.id && t.status !== 'closed').length
  }))
)

const totalInProgress = computed(
  () => allTickets.value.filter((t) => t.status !== 'closed').length
)
const totalClosed = computed(
  () => allTickets.value.filter((t) => t.status === 'closed').length
)

const selectedTransitionId = ref<string | null>(null)
const selectedTransition = computed<StateTransition | null>(() => {
  if (!selectedTransitionId.value) return null
  return v2Transitions.value.find((t) => t.id === selectedTransitionId.value) || null
})

function impactFor(transitionId: string): number {
  const t = v2Transitions.value.find((x) => x.id === transitionId)
  if (!t) return 0
  return allTickets.value.filter((tk) => tk.status === t.from && tk.status !== 'closed').length
}

function showImpact(transitionId: string) {
  selectedTransitionId.value = transitionId
  router.replace({ query: { ...route.query, tab: 'impact' } })
}

const impactedTickets = computed(() => {
  if (!selectedTransition.value) return []
  return allTickets.value.filter((t) => t.status === selectedTransition.value!.from && t.status !== 'closed')
})

function stateNameOf(id: string): string {
  return v2States.value.find((s) => s.id === id)?.name || id
}

function impactDrillDown(stateId: string) {
  // 简单 demo:弹窗列出该状态的工单
  const list = allTickets.value.filter((t) => t.status === stateId && t.status !== 'closed')
  // eslint-disable-next-line no-console
  console.log(`[cp-impact] 状态 ${stateId} 的进行中工单(${list.length}条)`, list)
  window.alert(`状态「${stateNameOf(stateId)}」进行中工单 ${list.length} 条,详情已打印到控制台`)
}

// 首次进入时自动建一个工单
onResetSandbox()
</script>

<style scoped>
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
.cp-section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--cp-text);
}
.cp-tx-card {
  border: 1px solid var(--cp-border-light);
  border-radius: 6px;
  padding: 10px 12px;
  background: #fff;
}
</style>
