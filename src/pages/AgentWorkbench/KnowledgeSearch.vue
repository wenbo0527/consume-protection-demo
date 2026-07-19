<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">知识检索</h1>
        <div class="cp-page-subtitle">搜索响应 ≤2 秒 · 支持引用到工单 · 审查归档后自动同步</div>
      </div>
      <a-space>
        <a-button>
          <icon-notification /> 更新提醒
          <a-badge :count="2" :offset="[4, -2]" />
        </a-button>
      </a-space>
    </div>

    <!-- 搜索框 -->
    <div class="cp-card" style="padding: 24px; margin-bottom: 16px">
      <a-input-search v-model="keyword" placeholder="输入关键词,如:催收频次 / 息费 / 征信异议" size="large" allow-clear style="width: 100%" />
      <div style="margin-top: 12px">
        <span style="color: var(--cp-text-tertiary); font-size: 12px; margin-right: 8px">热门:</span>
        <a-tag v-for="hot in hots" :key="hot" style="cursor: pointer" @click="keyword = hot">{{ hot }}</a-tag>
      </div>
      <a-divider style="margin: 16px 0" />
      <a-radio-group v-model="category" type="button">
        <a-radio value="">全部 ({{ knowledge.length }})</a-radio>
        <a-radio value="rule">业务规则 ({{ knowledge.filter(k => k.category === 'rule').length }})</a-radio>
        <a-radio value="script">话术模板 ({{ knowledge.filter(k => k.category === 'script').length }})</a-radio>
        <a-radio value="product">新产品知识 ({{ knowledge.filter(k => k.category === 'product').length }})</a-radio>
        <a-radio value="review">审查意见 ({{ knowledge.filter(k => k.category === 'review').length }})</a-radio>
      </a-radio-group>
    </div>

    <!-- 知识列表 -->
    <div class="cp-card" style="padding: 0">
      <a-list :data="filtered" :bordered="false">
        <template #item="{ item }">
          <a-list-item style="padding: 16px 24px">
            <a-list-item-meta>
              <template #title>
                <div style="display: flex; align-items: center; gap: 8px">
                  <a-link size="medium">{{ item.title }}</a-link>
                  <a-tag v-if="item.status === 'pending'" color="orange" size="small">待审核</a-tag>
                  <a-tag v-else-if="item.status === 'offline'" color="gray" size="small">已下架</a-tag>
                </div>
              </template>
              <template #description>
                <div style="color: var(--cp-text-secondary); font-size: 13px; margin-top: 4px">{{ item.content }}</div>
                <div style="margin-top: 8px; display: flex; gap: 12px; font-size: 12px; color: var(--cp-text-tertiary)">
                  <a-tag size="small">{{ item.categoryLabel }}</a-tag>
                  <span>来源: {{ item.source }}</span>
                  <span>更新: {{ item.updatedAt }}</span>
                  <span>浏览: {{ item.views }} 次</span>
                </div>
              </template>
            </a-list-item-meta>
            <template #actions>
              <a-space>
                <a-button size="small">查看详情</a-button>
                <a-button size="small" type="primary"><icon-link /> 引用到工单</a-button>
              </a-space>
            </template>
          </a-list-item>
        </template>
      </a-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { knowledge } from '@/mock/data'

const keyword = ref('')
const category = ref('')
const hots = ['催收频次', '征信异议', '协商还款', '扬言客户', '停催申请']

const filtered = computed(() => {
  return knowledge.filter(k => {
    if (category.value && k.category !== category.value) return false
    if (keyword.value && !k.title.includes(keyword.value) && !k.content.includes(keyword.value)) return false
    return true
  })
})
</script>