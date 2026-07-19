<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">新建审查立项</h1>
        <div class="cp-page-subtitle">三类立项:新产品 / 营销活动 / 产品变更</div>
      </div>
    </div>

    <div class="cp-card" style="padding: 24px 32px">
      <a-form :model="form">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="立项类型" required>
              <a-select v-model="form.type">
                <a-option value="newProduct">新产品立项</a-option>
                <a-option value="marketing">营销活动立项</a-option>
                <a-option value="change">产品变更立项</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="产品/活动名称" required>
              <a-input v-model="form.name" placeholder="如:速贷宝 Pro" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="申请部门" required>
              <a-select v-model="form.dept">
                <a-option>零售金融部</a-option>
                <a-option>市场部</a-option>
                <a-option>风控部</a-option>
                <a-option>信用卡部</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="申请人" required>
              <a-input v-model="form.applicant" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-divider><span style="font-size: 13px; color: var(--cp-text-tertiary)">{{ form.type === 'marketing' ? '营销活动专项' : '立项材料' }}</span></a-divider>

        <a-form-item v-if="form.type === 'newProduct'" label="项目说明书 (附件)" required>
          <a-upload :auto-upload="false" />
        </a-form-item>

        <a-form-item label="知识库内容" required>
          <a-textarea v-if="form.type === 'newProduct'" v-model="form.knowledge" :rows="6" placeholder="请输入新产品涉及的业务规则、定价、客户权益等知识库内容..." />
          <a-textarea v-else-if="form.type === 'change'" v-model="form.knowledge" :rows="6" placeholder="请输入本次变更的规则更新内容..." />
          <a-radio-group v-else v-model="form.needKnowledge">
            <a-radio :value="true">需要新增知识库</a-radio>
            <a-radio :value="false">不需要新增</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item label="投诉管控目标">
          <a-textarea v-model="form.target" :rows="3" placeholder="如:新户投诉率 ≤0.5%, 重复投诉率 ≤8%..." />
        </a-form-item>

        <a-divider />

        <div style="display: flex; justify-content: flex-end; gap: 8px">
          <a-button>保存草稿</a-button>
          <a-button type="primary" @click="submit">提交审查</a-button>
        </div>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { Message } from '@arco-design/web-vue'

const form = reactive({
  type: 'newProduct', name: '', dept: '', applicant: '',
  knowledge: '', target: '', needKnowledge: true
})

function submit() {
  Message.success('立项已提交,系统自动转入"待审查"状态')
}
</script>