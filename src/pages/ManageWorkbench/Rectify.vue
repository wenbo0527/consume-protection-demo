<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">溯源整改</h1>
        <div class="cp-page-subtitle">投诉数据 → 根因分析 → 下发整改 → 跟踪 → 验证 → 沉淀标准/知识</div>
      </div>
      <a-space>
        <a-button @click="showTrace = true" type="primary"> <icon-plus /> 新建溯源报告 </a-button>
      </a-space>
    </div>

    <!-- KPI -->
    <div class="cp-stat-row">
      <div class="cp-stat-card">
        <div class="cp-stat-label">待开始</div>
        <div class="cp-stat-value mono" style="color: var(--cp-warning)">{{ store.pendingTasks.length }}</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">进行中</div>
        <div class="cp-stat-value mono" style="color: var(--cp-brand)">{{ store.inProgressTasks.length }}</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">已完成</div>
        <div class="cp-stat-value mono">{{ store.doneTasks.length }}</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">已验证</div>
        <div class="cp-stat-value mono" style="color: var(--cp-success)">{{ store.verifiedTasks.length }}</div>
      </div>
    </div>

    <!-- ============ P3-A6:三级标签体系(投诉→根因→整改) ============ -->
    <a-card class="cp-card" style="margin-bottom: 16px; border-left: 4px solid var(--cp-brand)">
      <h3 class="cp-section-title" style="margin: 0 0 12px">
        🏷️ 三级标签体系(投诉标签 → 根因标签 → 整改标签)
        <a-tag color="arcoblue" size="small">Phase 2 · 5 大类 15 小类</a-tag>
      </h3>
      <a-row :gutter="16">
        <a-col :span="8">
          <div class="cp-tag-l1" style="border-color: #1494e8">
            <div class="cp-tag-l1-title">L1 投诉标签(场景)</div>
            <div class="cp-tag-l1-meta">基于工单投诉性质 / 业务类别 / 投诉原因</div>
            <div class="cp-tag-list">
              <a-tag
                v-for="t in tagL1"
                :key="t.code"
                color="arcoblue"
                size="small"
                style="margin: 2px; cursor: pointer"
                @click="activeL1 = t.code; activeL2 = null"
              >
                {{ t.name }}<span style="margin-left: 4px; opacity: 0.7">({{ t.count }})</span>
              </a-tag>
            </div>
          </div>
        </a-col>
        <a-col :span="8">
          <div class="cp-tag-l2" style="border-color: #722ed1">
            <div class="cp-tag-l2-title">L2 根因标签(下钻)</div>
            <div class="cp-tag-l2-meta">点击左侧投诉标签 → 下钻根因</div>
            <div v-if="activeL1" class="cp-tag-list">
              <a-tag
                v-for="t in tagL2"
                :key="t.code"
                color="purple"
                size="small"
                style="margin: 2px; cursor: pointer"
                @click="activeL2 = t.code"
              >
                {{ t.name }}<span style="margin-left: 4px; opacity: 0.7">({{ t.count }})</span>
              </a-tag>
            </div>
            <a-empty v-else description="请先选择投诉标签" :size="'small'" />
          </div>
        </a-col>
        <a-col :span="8">
          <div class="cp-tag-l3" style="border-color: #f5222d">
            <div class="cp-tag-l3-title">L3 整改标签(措施)</div>
            <div class="cp-tag-l3-meta">点击根因标签 → 下钻整改措施</div>
            <div v-if="activeL2" class="cp-tag-list">
              <a-tag
                v-for="t in tagL3"
                :key="t.code"
                color="red"
                size="small"
                style="margin: 2px"
              >
                {{ t.name }}<span style="margin-left: 4px; opacity: 0.7">({{ t.count }})</span>
              </a-tag>
            </div>
            <a-empty v-else-if="activeL1" description="请选择根因标签" :size="'small'" />
            <a-empty v-else description="请先选择投诉标签" :size="'small'" />
          </div>
        </a-col>
      </a-row>
      <a-alert type="info" show-icon style="margin-top: 12px">
        <template #content>
          <span style="font-size: 12px">
            📌 <b>同业参考</b>:TRS 浦发项目 6 大客服分析因子覆盖 3000+ 标签,识别准确率 90%。
            Phase 3 完整版将扩展至 9 大类 45 小类。
          </span>
        </template>
      </a-alert>
    </a-card>

    <!-- Tabs -->
    <a-tabs default-active-key="reports">
      <a-tab-pane key="reports" title="溯源报告 ({{ store.reports.length }})">
        <div v-for="r in store.reports" :key="r.id" class="cp-card" style="padding: 16px 20px; margin-bottom: 12px">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px">
            <div>
              <h3 class="cp-section-title" style="margin: 0">
                {{ r.scene }}
                <a-tag size="small" style="margin-left: 6px">{{ r.rootCause }}</a-tag>
              </h3>
              <div style="font-size: 12px; color: var(--cp-text-tertiary); margin-top: 4px">
                报告编号 <span class="mono">{{ r.id }}</span> · {{ r.createdAt }} · 作者 {{ r.author }}
              </div>
            </div>
            <a-button size="small" type="primary" @click="openCreateTask(r)"> <icon-send /> 下发整改任务 </a-button>
          </div>
          <p style="color: var(--cp-text-secondary); margin: 4px 0">{{ r.description }}</p>
          <a-row :gutter="16" style="margin-top: 8px">
            <a-col :span="6">
              <div style="font-size: 11px; color: var(--cp-text-tertiary)">投诉量</div>
              <div class="mono" style="font-size: 16px">{{ r.data.complaintCount }}</div>
            </a-col>
            <a-col :span="6">
              <div style="font-size: 11px; color: var(--cp-text-tertiary)">涉及客户</div>
              <div class="mono" style="font-size: 16px">{{ r.data.customerAffected }}</div>
            </a-col>
            <a-col :span="6">
              <div style="font-size: 11px; color: var(--cp-text-tertiary)">统计周期</div>
              <div style="font-size: 13px">{{ r.data.period }}</div>
            </a-col>
            <a-col :span="6">
              <div style="font-size: 11px; color: var(--cp-text-tertiary)">期望下降率</div>
              <div class="mono" style="font-size: 16px; color: var(--cp-success)">{{ r.data.dropRate || 0 }}%</div>
            </a-col>
          </a-row>
          <a-alert type="info" show-icon style="margin-top: 8px">
            <template #title>整改方向建议</template>
            <template #content>{{ r.conclusion }}</template>
          </a-alert>
        </div>
      </a-tab-pane>

      <a-tab-pane key="tasks" title="整改任务 ({{ store.tasks.length }})">
        <div class="cp-card" style="padding: 0">
          <a-table :data="store.tasks" :pagination="{ pageSize: 10 }" row-key="id">
            <template #columns>
              <a-table-column title="任务编号" data-index="id" :width="160">
                <template #cell="{ record }">
                  <span class="mono" style="color: var(--cp-brand)">{{ record.id }}</span>
                </template>
              </a-table-column>
              <a-table-column title="整改场景" data-index="scene" :width="140" />
              <a-table-column title="责任部门" data-index="dept" :width="120" />
              <a-table-column title="责任人" data-index="owner" :width="120" />
              <a-table-column title="截止日期" data-index="deadline" :width="110" />
              <a-table-column title="状态" :width="90">
                <template #cell="{ record }">
                  <a-tag :color="statusColor(record.status)">{{ statusLabel(record.status) }}</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="整改要求" data-index="requirement">
                <template #cell="{ record }">
                  <a-tooltip :content="record.requirement">
                    <span style="font-size: 12px; color: var(--cp-text-secondary)">
                      {{
                        record.requirement.length > 30 ? record.requirement.slice(0, 30) + '...' : record.requirement
                      }}
                    </span>
                  </a-tooltip>
                </template>
              </a-table-column>
              <a-table-column title="进度" :width="80">
                <template #cell="{ record }">
                  <a-tag size="small">{{ record.progress.length }} 条</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="操作" :width="220">
                <template #cell="{ record }">
                  <a-space :size="4">
                    <a-button size="small" @click="openDetail(record)">详情</a-button>
                    <a-button
                      v-if="record.status === 'pending' || record.status === 'in_progress'"
                      size="small"
                      type="primary"
                      @click="openProgress(record)"
                    >
                      填写进度
                    </a-button>
                    <a-button v-if="record.status === 'done'" size="small" status="success" @click="openVerify(record)">
                      验证
                    </a-button>
                  </a-space>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </a-tab-pane>
    </a-tabs>

    <!-- 新建溯源报告弹窗 -->
    <a-modal v-model:visible="showTrace" title="新建溯源报告" :width="640" :ok-text="'生成报告'" @ok="onCreateReport">
      <a-form :model="traceForm">
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="高发场景">
              <a-input v-model="traceForm.scene" placeholder="如:催收频次投诉" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="根因分类">
              <a-select v-model="traceForm.rootCause">
                <a-option>产品设计</a-option>
                <a-option>流程</a-option>
                <a-option>话术</a-option>
                <a-option>系统</a-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="数据描述">
          <a-textarea v-model="traceForm.description" :rows="3" placeholder="投诉数据描述、影响范围等" />
        </a-form-item>
        <a-row :gutter="12">
          <a-col :span="8">
            <a-form-item label="投诉量">
              <a-input-number v-model="traceForm.complaintCount" :min="0" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="涉及客户">
              <a-input-number v-model="traceForm.customerAffected" :min="0" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="期望下降率(%)">
              <a-input-number v-model="traceForm.dropRate" :min="0" :max="100" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="整改方向建议">
          <a-textarea v-model="traceForm.conclusion" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 下发整改任务弹窗 -->
    <a-modal v-model:visible="showTask" title="下发整改任务" :width="640" :ok-text="'下发'" @ok="onCreateTask">
      <a-alert v-if="activeReport" type="info" show-icon style="margin-bottom: 12px">
        <template #title>基于报告 · {{ activeReport.scene }}</template>
        <template #content>{{ activeReport.conclusion }}</template>
      </a-alert>
      <a-form :model="taskForm">
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="责任部门" required>
              <a-input v-model="taskForm.dept" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="责任人" required>
              <a-input v-model="taskForm.owner" placeholder="如:催收运营·李伟" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="整改要求" required>
          <a-textarea v-model="taskForm.requirement" :rows="4" />
        </a-form-item>
        <a-form-item label="截止日期" required>
          <a-input v-model="taskForm.deadline" placeholder="YYYY-MM-DD" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 进度填写弹窗 -->
    <a-modal v-model:visible="showProgress" title="填写进度" :ok-text="'提交'" @ok="onAddProgress">
      <a-form :model="progressForm">
        <a-form-item label="当前进展">
          <a-textarea v-model="progressForm.note" :rows="4" placeholder="说明当前完成情况、遇到的问题" />
        </a-form-item>
        <a-form-item>
          <a-checkbox v-model="progressForm.markDone">标记为已完成,等待管理层验证</a-checkbox>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 验证弹窗 -->
    <a-modal v-model:visible="showVerify" title="整改验证" :ok-text="'通过验证'" @ok="onVerify">
      <a-form :model="verifyForm">
        <a-form-item label="验证结果">
          <a-radio-group v-model="verifyForm.result">
            <a-radio value="pass">通过</a-radio>
            <a-radio value="fail">不通过</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="实际下降率(%)">
          <a-input-number v-model="verifyForm.metricDrop" :min="0" :max="100" />
        </a-form-item>
        <a-form-item label="验证说明">
          <a-textarea v-model="verifyForm.note" :rows="3" placeholder="说明验证依据、抽样结果等" />
        </a-form-item>

        <!-- OPT-2:验证通过时,一键生成标准项 -->
        <div
          v-if="verifyForm.result === 'pass'"
          style="
            margin-top: 16px;
            padding: 12px;
            background: rgba(20, 148, 232, 0.05);
            border: 1px solid rgba(20, 148, 232, 0.2);
            border-radius: 6px;
          "
        >
          <a-checkbox v-model="verifyForm.alsoGenerateStandard">
            <b>同步沉淀为审查标准(OPT-2 一键生成)</b>
          </a-checkbox>
          <div style="font-size: 12px; color: var(--cp-text-tertiary); margin: 4px 0 12px">
            验证通过的标准会自动带 `source: rectify` 标签,可在 `/review/standards` 中筛选查看。
          </div>
          <a-form-item v-if="verifyForm.alsoGenerateStandard" label="标准大类">
            <a-select v-model="verifyForm.stdCategory">
              <a-option>产品审查</a-option>
              <a-option>催收规范</a-option>
              <a-option>客户适当性</a-option>
              <a-option>信息披露</a-option>
              <a-option>应急预案</a-option>
            </a-select>
          </a-form-item>
          <a-form-item v-if="verifyForm.alsoGenerateStandard" label="标准条款">
            <a-input v-model="verifyForm.stdItem" placeholder="例:催收单日触达上限 3 次" />
          </a-form-item>
          <a-form-item v-if="verifyForm.alsoGenerateStandard" label="依据">
            <a-input v-model="verifyForm.stdBasis" placeholder="例:《商业银行互联网贷款管理办法》第18条" />
          </a-form-item>
          <a-form-item v-if="verifyForm.alsoGenerateStandard" label="适用范围">
            <a-input v-model="verifyForm.stdScope" placeholder="例:全部高风险客户" />
          </a-form-item>
          <a-form-item v-if="verifyForm.alsoGenerateStandard" label="是否必选">
            <a-switch v-model="verifyForm.stdRequired" />
          </a-form-item>
        </div>
      </a-form>
    </a-modal>

    <!-- 详情抽屉 -->
    <a-drawer v-model:visible="detailVisible" :width="560" :title="`整改任务 · ${currentTask?.id || ''}`">
      <div v-if="currentTask">
        <a-descriptions :column="1" bordered size="small" style="margin-bottom: 16px">
          <a-descriptions-item label="整改场景">{{ currentTask.scene }}</a-descriptions-item>
          <a-descriptions-item label="责任部门">{{ currentTask.dept }}</a-descriptions-item>
          <a-descriptions-item label="责任人">{{ currentTask.owner }}</a-descriptions-item>
          <a-descriptions-item label="截止日期">{{ currentTask.deadline }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="statusColor(currentTask.status)">{{ statusLabel(currentTask.status) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="整改要求">{{ currentTask.requirement }}</a-descriptions-item>
        </a-descriptions>

        <a-divider style="margin: 12px 0">进度时间线</a-divider>

        <a-timeline>
          <a-timeline-item v-for="(p, idx) in currentTask.progress" :key="idx" :label="p.time">
            <div style="font-weight: 500">{{ p.operator }}</div>
            <div style="font-size: 12px; color: var(--cp-text-secondary); margin-top: 2px">{{ p.note }}</div>
          </a-timeline-item>
        </a-timeline>

        <a-divider v-if="currentTask.verification" style="margin: 12px 0">验证结果</a-divider>

        <!-- ============ P3-C2 整改效果验证 · 投诉量对比图 ============ -->
        <div v-if="currentTask.verification" class="cp-rectify-effect">
          <h4 style="margin: 0 0 8px; font-size: 13px">
            📊 整改效果验证 · 投诉量对比
            <a-tag size="small" :color="effectDelta < 0 ? 'green' : 'red'" style="margin-left: 8px">
              {{ effectDelta > 0 ? '+' : '' }}{{ effectDelta }}%
            </a-tag>
          </h4>
          <div class="cp-rectify-effect-meta">
            整改前 <span class="mono">{{ effectData.before }}</span> 条/月 → 整改后
            <span class="mono">{{ effectData.after }}</span> 条/月
          </div>
          <!-- 简易条形对比(用 div 实现,无外部图表依赖) -->
          <div class="cp-rectify-bars">
            <div class="cp-rectify-bar-row">
              <div class="cp-rectify-bar-label">整改前</div>
              <div class="cp-rectify-bar-track">
                <div
                  class="cp-rectify-bar-fill"
                  :style="{ width: (effectData.before / maxBarValue) * 100 + '%', background: '#f5222d' }"
                ></div>
              </div>
              <div class="cp-rectify-bar-num mono">{{ effectData.before }}</div>
            </div>
            <div class="cp-rectify-bar-row">
              <div class="cp-rectify-bar-label">整改后</div>
              <div class="cp-rectify-bar-track">
                <div
                  class="cp-rectify-bar-fill"
                  :style="{ width: (effectData.after / maxBarValue) * 100 + '%', background: '#52c41a' }"
                ></div>
              </div>
              <div class="cp-rectify-bar-num mono">{{ effectData.after }}</div>
            </div>
          </div>
        </div>

        <a-alert
          v-if="currentTask.verification"
          :type="currentTask.verification.result === 'pass' ? 'success' : 'error'"
          show-icon
          style="margin-bottom: 12px"
        >
          <template #title>
            {{ currentTask.verification.result === 'pass' ? '✓ 验证通过' : '✗ 验证不通过' }}
            <span
              v-if="currentTask.verification.metricDrop !== undefined"
              style="margin-left: 8px; font-weight: normal"
            >
              实际下降率 {{ currentTask.verification.metricDrop }}%
            </span>
          </template>
          <template #content>
            <div style="margin-top: 4px">
              {{ currentTask.verification.operator }} · {{ currentTask.verification.time }}
            </div>
            <div style="margin-top: 4px">{{ currentTask.verification.note }}</div>
          </template>
        </a-alert>

        <a-alert
          v-if="currentTask.generatedStandardIds?.length || currentTask.generatedKbIds?.length"
          type="info"
          show-icon
          style="margin-bottom: 12px"
        >
          <template #title>整改 → 标准/知识沉淀</template>
          <template #content>
            <div v-if="currentTask.generatedStandardIds?.length" style="margin-top: 4px">
              已生成审查标准:<span
                v-for="id in currentTask.generatedStandardIds"
                :key="id"
                class="mono"
                style="margin-right: 6px"
                >{{ id }}</span
              >
            </div>
            <div v-if="currentTask.generatedKbIds?.length" style="margin-top: 4px">
              已生成知识条目:<span
                v-for="id in currentTask.generatedKbIds"
                :key="id"
                class="mono"
                style="margin-right: 6px"
                >{{ id }}</span
              >
            </div>
          </template>
        </a-alert>
      </div>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRectifyStore, TraceReport, RectifyTask } from '@/stores/rectify'
import { useReviewStore } from '@/stores/review'
import { Message } from '@arco-design/web-vue'

const store = useRectifyStore()
const reviewStore = useReviewStore()

/** ============ P3-A6:三级标签体系(投诉→根因→整改) ============
 *  对应旅程:管理层 §1.6 "标签体系未建" + §3.1 "溯源归因是独立动作,不是工单流转附属品"
 *  数据为 mock,Phase 2 起步 5 大类 15 小类,Phase 3 完整版 9 大类 45 小类
 */
interface TagNode {
  code: string
  name: string
  count: number
  children?: TagNode[]
}
const tagTree: TagNode[] = [
  {
    code: 'overdue',
    name: '逾期催收',
    count: 128,
    children: [
      {
        code: 'overdue_freq',
        name: '催收频次过高',
        count: 67,
        children: [
          { code: 'overdue_freq_law', name: '违反日触达上限', count: 23 },
          { code: 'overdue_freq_hr', name: '非工作时间外呼', count: 18 },
          { code: 'overdue_freq_relatives', name: '联系第三方', count: 26 }
        ]
      },
      {
        code: 'overdue_words',
        name: '催收话术违规',
        count: 38,
        children: [
          { code: 'overdue_words_threat', name: '威胁恐吓言语', count: 21 },
          { code: 'overdue_words_disclose', name: '泄露客户信息', count: 17 }
        ]
      },
      {
        code: 'overdue_proc',
        name: '催收流程不合规',
        count: 23,
        children: [
          { code: 'overdue_proc_nopost', name: '停催后仍外呼', count: 14 },
          { code: 'overdue_proc_misroute', name: '错客催收', count: 9 }
        ]
      }
    ]
  },
  {
    code: 'pricing',
    name: '定价收费',
    count: 86,
    children: [
      {
        code: 'pricing_fee',
        name: '息费收取',
        count: 52,
        children: [
          { code: 'pricing_fee_over', name: '超出综合 IRR 上限', count: 31 },
          { code: 'pricing_fee_calc', name: '罚息/违约金计算错误', count: 21 }
        ]
      },
      {
        code: 'pricing_disclose',
        name: '信息披露',
        count: 34,
        children: [
          { code: 'pricing_disclose_irr', name: 'IRR 未明示', count: 19 },
          { code: 'pricing_disclose_serv', name: '服务费未拆分', count: 15 }
        ]
      }
    ]
  },
  {
    code: 'data',
    name: '个人信息',
    count: 45,
    children: [
      {
        code: 'data_query',
        name: '信息查询',
        count: 21,
        children: [
          { code: 'data_query_credit', name: '征信异议处理超时', count: 13 },
          { code: 'data_query_self', name: '本人信息查询拒绝', count: 8 }
        ]
      },
      {
        code: 'data_change',
        name: '信息修改',
        count: 24,
        children: [
          { code: 'data_change_phone', name: '预留号码变更拒绝', count: 16 },
          { code: 'data_change_addr', name: '地址变更未更新', count: 8 }
        ]
      }
    ]
  },
  {
    code: 'service',
    name: '服务态度',
    count: 32,
    children: [
      {
        code: 'service_attitude',
        name: '坐席态度',
        count: 19,
        children: [
          { code: 'service_attitude_rude', name: '言语不礼貌', count: 11 },
          { code: 'service_attitude_no', name: '未回应客户诉求', count: 8 }
        ]
      },
      {
        code: 'service_response',
        name: '响应时效',
        count: 13,
        children: [
          { code: 'service_response_call', name: '5 秒未接听', count: 7 },
          { code: 'service_response_msg', name: '工单响应超时', count: 6 }
        ]
      }
    ]
  },
  {
    code: 'platform',
    name: '平台合作',
    count: 19,
    children: [
      {
        code: 'platform_transfer',
        name: '外部转接',
        count: 19,
        children: [
          { code: 'platform_transfer_jd', name: '京东投诉升级', count: 8 },
          { code: 'platform_transfer_mt', name: '美团投诉升级', count: 6 },
          { code: 'platform_transfer_12345', name: '12345 转办件', count: 5 }
        ]
      }
    ]
  }
]

const activeL1 = ref<string | null>(null)
const activeL2 = ref<string | null>(null)

const tagL1 = computed(() => tagTree.map((t) => ({ code: t.code, name: t.name, count: t.count })))
const tagL2 = computed(() => {
  if (!activeL1.value) return []
  const node = tagTree.find((t) => t.code === activeL1.value)
  return (node?.children || []).map((t) => ({ code: t.code, name: t.name, count: t.count }))
})
const tagL3 = computed(() => {
  if (!activeL2.value) return []
  for (const l1 of tagTree) {
    if (l1.code !== activeL1.value) continue
    const l2 = l1.children?.find((t) => t.code === activeL2.value)
    return (l2?.children || []).map((t) => ({ code: t.code, name: t.name, count: t.count }))
  }
  return []
})

function statusColor(s: string) {
  return (
    {
      pending: 'orange',
      in_progress: 'arcoblue',
      done: 'green',
      verified: 'green',
      rejected: 'red'
    }[s] || 'gray'
  )
}
function statusLabel(s: string) {
  return (
    {
      pending: '待开始',
      in_progress: '进行中',
      done: '已完成',
      verified: '已验证',
      rejected: '驳回'
    }[s] || s
  )
}

// 新建报告
const showTrace = ref(false)
const traceForm = reactive({
  scene: '',
  rootCause: '流程',
  description: '',
  complaintCount: 0,
  customerAffected: 0,
  dropRate: 30,
  conclusion: ''
})

function onCreateReport() {
  if (!traceForm.scene) {
    Message.warning('请填写场景')
    return
  }
  store.createReport({
    scene: traceForm.scene,
    rootCause: traceForm.rootCause,
    description: traceForm.description,
    data: {
      complaintCount: traceForm.complaintCount,
      customerAffected: traceForm.customerAffected,
      dropRate: traceForm.dropRate,
      period: '近 30 天'
    },
    conclusion: traceForm.conclusion,
    author: '陈强'
  })
  Message.success('溯源报告已生成')
  showTrace.value = false
  // 重置
  Object.assign(traceForm, {
    scene: '',
    rootCause: '流程',
    description: '',
    complaintCount: 0,
    customerAffected: 0,
    dropRate: 30,
    conclusion: ''
  })
}

// 下发任务
const showTask = ref(false)
const activeReport = ref<TraceReport | null>(null)
const taskForm = reactive({
  dept: '',
  owner: '',
  requirement: '',
  deadline: ''
})

function openCreateTask(r: TraceReport) {
  activeReport.value = r
  Object.assign(taskForm, {
    dept: '',
    owner: '',
    requirement: r.conclusion,
    deadline: ''
  })
  showTask.value = true
}

function onCreateTask() {
  if (!activeReport.value) return
  if (!taskForm.dept || !taskForm.owner || !taskForm.requirement || !taskForm.deadline) {
    Message.warning('请填写完整任务信息')
    return
  }
  const t = store.createTask({
    reportId: activeReport.value.id,
    scene: activeReport.value.scene,
    dept: taskForm.dept,
    owner: taskForm.owner,
    requirement: taskForm.requirement,
    deadline: taskForm.deadline
  })
  if (t) {
    Message.success(`整改任务 ${t.id} 已下发`)
    showTask.value = false
  }
}

// 进度填写
const showProgress = ref(false)
const progressForm = reactive({ note: '', markDone: false })
const progressTask = ref<RectifyTask | null>(null)

function openProgress(t: RectifyTask) {
  progressTask.value = t
  progressForm.note = ''
  progressForm.markDone = false
  showProgress.value = true
}

function onAddProgress() {
  if (!progressTask.value || !progressForm.note) {
    Message.warning('请填写进展')
    return
  }
  store.addProgress(progressTask.value.id, '责任人', progressForm.note)
  if (progressForm.markDone) {
    store.submitDone(progressTask.value.id, '责任人', progressForm.note)
    Message.success('已标记完成,等待管理层验证')
  } else {
    Message.success('进度已更新')
  }
  showProgress.value = false
}

// 验证
const showVerify = ref(false)
const verifyForm = reactive({
  result: 'pass' as 'pass' | 'fail',
  metricDrop: 30,
  note: '',
  // OPT-2:一键生成审查标准
  alsoGenerateStandard: false,
  stdCategory: '催收规范',
  stdItem: '',
  stdBasis: '',
  stdScope: '',
  stdRequired: true
})
const verifyTask = ref<RectifyTask | null>(null)

function openVerify(t: RectifyTask) {
  verifyTask.value = t
  verifyForm.result = 'pass'
  verifyForm.metricDrop = 30
  verifyForm.note = ''
  showVerify.value = true
}

function onVerify() {
  if (!verifyTask.value) return
  store.verify(verifyTask.value.id, '陈强', verifyForm.result, verifyForm.note, verifyForm.metricDrop)

  // OPT-2:如果勾选了同时沉淀为标准 → 写入 reviewStore
  let stdId: string | null = null
  if (verifyForm.result === 'pass' && verifyForm.alsoGenerateStandard && verifyForm.stdItem && verifyForm.stdBasis) {
    stdId = reviewStore.generateFromRectify({
      category: verifyForm.stdCategory,
      item: verifyForm.stdItem,
      basis: verifyForm.stdBasis,
      required: verifyForm.stdRequired,
      scope: verifyForm.stdScope || undefined,
      author: '陈强',
      rectifyTaskId: verifyTask.value.id,
      rectifyReportId: verifyTask.value.reportId
    }).id
  }

  // 重置 verifyForm 状态
  verifyForm.alsoGenerateStandard = false
  verifyForm.stdItem = ''
  verifyForm.stdBasis = ''
  verifyForm.stdScope = ''

  if (stdId) {
    Message.success(`验证通过,已沉淀为审查标准 ${stdId}`)
  } else {
    Message.success(verifyForm.result === 'pass' ? '验证通过,已自动沉淀到标准/知识' : '已驳回,等待责任人继续整改')
  }
  showVerify.value = false
}

// 详情
const detailVisible = ref(false)
const currentTask = ref<RectifyTask | null>(null)
function openDetail(t: RectifyTask) {
  currentTask.value = t
  detailVisible.value = true
}

/** ============ P3-C2:整改效果验证(投诉量对比图) ============
 *  对应旅程:管理层 §3.2 "整改后投诉量降了吗?不知道"
 *  数据来源:从当前 task 关联的 report.data.complaintCount 派生(整改前 vs 整改后)
 *  整改后数量按报告里的"期望下降率 + 实际下降率"综合计算
 */
const effectData = computed(() => {
  if (!currentTask.value?.verification) return { before: 0, after: 0 }
  const report = store.reports.find((r) => r.id === currentTask.value?.reportId)
  const before = report?.data?.complaintCount ?? 0
  const dropRate = currentTask.value.verification.metricDrop ?? 0
  const after = Math.max(0, Math.round(before * (1 - dropRate / 100)))
  return { before, after }
})
const effectDelta = computed(() => {
  const { before, after } = effectData.value
  if (!before) return 0
  return Math.round(((after - before) / before) * 100)
})
const maxBarValue = computed(() => Math.max(effectData.value.before, effectData.value.after, 1))
</script>

<style scoped>
.cp-section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--cp-text);
}

/* ============ P3-A6 三级标签体系 ============ */
.cp-tag-l1,
.cp-tag-l2,
.cp-tag-l3 {
  border-left: 3px solid;
  background: #fafbfc;
  border-radius: 4px;
  padding: 10px 12px;
  min-height: 160px;
}
.cp-tag-l1-title,
.cp-tag-l2-title,
.cp-tag-l3-title {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 4px;
}
.cp-tag-l1-meta,
.cp-tag-l2-meta,
.cp-tag-l3-meta {
  font-size: 11px;
  color: var(--cp-text-tertiary);
  margin-bottom: 8px;
}
.cp-tag-list {
  display: flex;
  flex-wrap: wrap;
}

/* ============ P3-C2 整改效果条形对比图 ============ */
.cp-rectify-effect {
  background: #fafbfc;
  border: 1px solid var(--cp-border-light);
  border-radius: 6px;
  padding: 12px 14px;
  margin-bottom: 12px;
}
.cp-rectify-effect-meta {
  font-size: 12px;
  color: var(--cp-text-secondary);
  margin-bottom: 12px;
}
.cp-rectify-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cp-rectify-bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cp-rectify-bar-label {
  width: 50px;
  font-size: 12px;
  color: var(--cp-text-secondary);
}
.cp-rectify-bar-track {
  flex: 1;
  height: 14px;
  background: #f0f1f2;
  border-radius: 3px;
  overflow: hidden;
}
.cp-rectify-bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}
.cp-rectify-bar-num {
  width: 50px;
  text-align: right;
  font-size: 12px;
  font-weight: 600;
}
</style>
