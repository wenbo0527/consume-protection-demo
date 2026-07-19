<template>
  <div class="cp-consumer-page">
    <div class="cp-satisfaction-card">
      <h2 class="cp-c-title" style="margin-top: 0">满意度评价</h2>
      <div style="font-size: 13px; color: var(--cp-text-tertiary); margin-bottom: 16px">
        工单 GD-20260712-0001 · 电话催收时间过早
      </div>

      <div class="cp-rate-block">
        <div style="margin-bottom: 8px; font-size: 13px">整体满意度</div>
        <a-rate v-model="satisfaction" :size="32" />
        <div style="margin-top: 6px; font-size: 12px; color: var(--cp-text-tertiary)">
          {{ rateText[satisfaction - 1] }}
        </div>
      </div>

      <div class="cp-rate-block">
        <div style="margin-bottom: 8px; font-size: 13px">问题是否解决</div>
        <a-radio-group v-model="solved">
          <a-radio :value="true">已解决</a-radio>
          <a-radio :value="false">未解决</a-radio>
        </a-radio-group>
      </div>

      <div class="cp-rate-block">
        <div style="margin-bottom: 8px; font-size: 13px">是否愿意推荐</div>
        <a-radio-group v-model="recommend">
          <a-radio :value="true">愿意</a-radio>
          <a-radio :value="false">不愿意</a-radio>
        </a-radio-group>
      </div>

      <div class="cp-rate-block">
        <div style="margin-bottom: 8px; font-size: 13px">补充说明 (选填)</div>
        <a-textarea
          v-model="comment"
          :rows="3"
          placeholder="您的反馈对我们非常重要..."
          :max-length="200"
          show-word-limit
        />
      </div>

      <a-alert v-if="satisfaction <= 2" type="warning" show-icon style="margin-bottom: 16px">
        <template #title>您的反馈已记录,系统将自动创建回访工单</template>
        <template #content>评分 ≤2 星时,系统会自动创建"满意度回访"类型工单,分配原处理人跟进。</template>
      </a-alert>

      <a-button type="primary" long @click="submit">提交评价</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Message } from '@arco-design/web-vue'

const satisfaction = ref(5)
const solved = ref(true)
const recommend = ref(true)
const comment = ref('')
const rateText = ['非常不满意', '不满意', '一般', '满意', '非常满意']

function submit() {
  Message.success('评价已提交,感谢您的反馈')
}
</script>

<style scoped>
.cp-consumer-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 20px;
}
.cp-satisfaction-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid var(--cp-border);
  padding: 24px 28px;
}
.cp-rate-block {
  margin-bottom: 20px;
}
</style>
