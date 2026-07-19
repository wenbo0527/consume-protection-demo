<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">客户画像查询</h1>
        <div class="cp-page-subtitle">支持姓名 / 手机号 / 身份证号 / 客户编号 · 命中即跳转画像详情</div>
      </div>
    </div>

    <!-- 搜索区 -->
    <div class="cp-card" style="padding: 24px; margin-bottom: 16px">
      <a-input-search
        v-model="keyword"
        placeholder="输入客户姓名 / 手机号 / 身份证号 / 客户编号,按回车搜索"
        size="large"
        allow-clear
        search-button
        @search="onSearch"
        @clear="onClear"
      />
      <div style="margin-top: 12px">
        <span style="color: var(--cp-text-tertiary); font-size: 12px; margin-right: 8px">快速查询:</span>
        <a-tag v-for="c in quickList" :key="c.id" style="cursor: pointer" @click="goDetail(c)">
          {{ c.name }} · {{ c.id }}
        </a-tag>
      </div>
      <div style="margin-top: 12px">
        <span style="color: var(--cp-text-tertiary); font-size: 12px; margin-right: 8px">风险筛选:</span>
        <a-checkbox-group v-model="tagFilter">
          <a-checkbox value="threat">扬言</a-checkbox>
          <a-checkbox value="blacklist">黑名单</a-checkbox>
          <a-checkbox value="agent">异常代理</a-checkbox>
          <a-checkbox value="complaint">投诉倾向</a-checkbox>
        </a-checkbox-group>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div v-if="searched" class="cp-card" style="padding: 0">
      <div
        style="
          padding: 12px 20px;
          border-bottom: 1px solid var(--cp-border-light);
          display: flex;
          justify-content: space-between;
          align-items: center;
        "
      >
        <span style="font-size: 13px">
          共 <b style="color: var(--cp-brand)">{{ results.length }}</b> 位客户匹配
          <span v-if="keyword" style="color: var(--cp-text-tertiary)">关键词:{{ keyword }}</span>
          <span v-if="tagFilter.length" style="color: var(--cp-text-tertiary); margin-left: 8px">
            风险标签:{{ tagFilter.join(' / ') }}
          </span>
        </span>
        <a-button size="small" @click="onClear">重置</a-button>
      </div>
      <a-empty v-if="!results.length" description="无匹配客户" />
      <div v-else>
        <div v-for="c in results" :key="c.id" class="cp-search-row" @click="goDetail(c)">
          <a-avatar :size="40" :style="{ background: hasDanger(c) ? 'var(--cp-danger)' : 'var(--cp-brand)' }">
            {{ c.name.charAt(0) }}
          </a-avatar>
          <div style="flex: 1; min-width: 0">
            <div style="display: flex; align-items: center; gap: 8px">
              <span style="font-size: 14px; font-weight: 600">{{ c.name }}</span>
              <span class="mono" style="font-size: 12px; color: var(--cp-text-tertiary)">{{ c.id }}</span>
              <risk-tag v-for="t in c.riskTags" :key="t" :type="t" />
            </div>
            <div
              style="
                font-size: 12px;
                color: var(--cp-text-secondary);
                margin-top: 4px;
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
              "
            >
              <span class="mono">{{ c.phone }}</span>
              <span>{{ c.idCardMask }}</span>
              <span
                >在贷 <b class="mono">¥{{ c.loanBalance.toLocaleString() }}</b></span
              >
              <span>逾期 {{ c.maxOverdueDays }} 天</span>
              <span>近 6 月投诉 {{ c.complaintCount6m }} 次</span>
              <span>在办工单 {{ c.ongoingTickets.length }} 张</span>
            </div>
          </div>
          <icon-right style="color: var(--cp-text-tertiary)" />
        </div>
      </div>
    </div>

    <!-- 未搜索时,显示待办客户清单 + 全量客户列表 -->
    <div v-else>
      <!-- 待办客户 -->
      <div class="cp-card" style="padding: 16px 20px; margin-bottom: 16px">
        <h3 class="cp-section-title" style="margin: 0 0 12px">我的待办客户 ({{ todoCustomers.length }})</h3>
        <div class="cp-quick-grid">
          <div v-for="c in todoCustomers" :key="c.id" class="cp-quick-card" @click="goDetail(c)">
            <a-avatar :size="36" :style="{ background: hasDanger(c) ? 'var(--cp-danger)' : 'var(--cp-brand)' }">
              {{ c.name.charAt(0) }}
            </a-avatar>
            <div style="flex: 1; min-width: 0">
              <div style="font-weight: 600; font-size: 13px">{{ c.name }}</div>
              <div style="font-size: 11px; color: var(--cp-text-tertiary); margin-top: 2px">
                {{ c.id }} · {{ c.ongoingTickets.length }} 张工单
              </div>
            </div>
            <risk-tag v-for="t in c.riskTags.slice(0, 1)" :key="t" :type="t" />
          </div>
        </div>
      </div>

      <!-- 全量客户列表 -->
      <div class="cp-card" style="padding: 16px 20px">
        <h3 class="cp-section-title" style="margin: 0 0 12px">全量客户 ({{ customers.length }})</h3>
        <a-empty v-if="!customers.length" description="暂无客户数据" />
        <div v-else class="cp-quick-grid">
          <div v-for="c in customers" :key="c.id" class="cp-quick-card" @click="goDetail(c)">
            <a-avatar :size="36" :style="{ background: hasDanger(c) ? 'var(--cp-danger)' : 'var(--cp-brand)' }">
              {{ c.name.charAt(0) }}
            </a-avatar>
            <div style="flex: 1; min-width: 0">
              <div style="font-weight: 600; font-size: 13px">{{ c.name }}</div>
              <div style="font-size: 11px; color: var(--cp-text-tertiary); margin-top: 2px">
                <span class="mono">{{ c.phone }}</span> · {{ c.id }}
              </div>
            </div>
            <risk-tag v-for="t in c.riskTags" :key="t" :type="t" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { customers } from '@/mock/data'
import RiskTag from '@/components/RiskTag.vue'

const router = useRouter()

const keyword = ref('')
const tagFilter = ref<string[]>([])
const searched = ref(false)

// 待办客户:在办工单数 > 0
const todoCustomers = computed(() => customers.filter((c) => c.ongoingTickets.length > 0))

const quickList = computed(() => customers.slice(0, 6))

const results = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  return customers.filter((c) => {
    // 关键词匹配
    if (k) {
      const matchK =
        c.name.toLowerCase().includes(k) ||
        c.phone.includes(k) ||
        c.id.toLowerCase().includes(k) ||
        c.idCardMask.includes(k)
      if (!matchK) return false
    }
    // 风险标签筛选(AND 关系:所有选中的标签都要有)
    if (tagFilter.value.length > 0) {
      const hasAll = tagFilter.value.every((t) => (c.riskTags as readonly string[]).includes(t))
      if (!hasAll) return false
    }
    return true
  })
})

function hasDanger(c: any) {
  return c.riskTags.includes('threat') || c.riskTags.includes('blacklist')
}

function onSearch(v: string) {
  keyword.value = v
  searched.value = true
}

function onClear() {
  keyword.value = ''
  tagFilter.value = []
  searched.value = false
}

function goDetail(c: any) {
  router.push(`/agent/customer/${c.id}`)
}
</script>

<style scoped>
.cp-section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--cp-text);
}

.cp-search-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--cp-border-light);
  cursor: pointer;
  transition: background 0.15s;
}
.cp-search-row:hover {
  background: var(--cp-bg-hover);
}
.cp-search-row:last-child {
  border-bottom: none;
}

.cp-quick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
}
.cp-quick-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--cp-border-light);
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
}
.cp-quick-card:hover {
  border-color: var(--cp-brand);
  background: var(--cp-brand-soft);
  transform: translateX(2px);
}
</style>
