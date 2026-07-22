<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">消保驾驶舱</h1>
        <div class="cp-page-subtitle">登录默认页 · 全局状态总览 · 数据 T+1 延迟</div>
      </div>
      <a-space>
        <a-radio-group v-model="period" type="button">
          <a-radio-button value="day">今日</a-radio-button>
          <a-radio-button value="week">本周</a-radio-button>
          <a-radio-button value="month">本月</a-radio-button>
        </a-radio-group>
        <a-button><icon-export /> 导出报表</a-button>
      </a-space>
    </div>

    <!-- KPI 卡片 -->
    <div class="cp-stat-row">
      <kpi-card
        label="当日投诉量"
        :value="162"
        extra="阈值 120 · 超 35%"
        trend="up"
        alert
        tag="超阈值"
        tag-color="red"
      />
      <kpi-card label="处理时效" :value="4.2" extra="目标 ≤15 工作日" trend="flat" tag="达标" tag-color="green" />
      <kpi-card label="监管件超时率" :value="3.8" extra="目标 ≤5%" trend="down" tag="达标" tag-color="green" />
      <kpi-card label="一次性解决率" :value="76" extra="目标 ≥70%" trend="up" tag="达标" tag-color="green" />
      <kpi-card label="预警处置率" :value="92" extra="目标 ≥95%" trend="up" tag="待提升" tag-color="orange" />
    </div>

    <!-- 工作流待办已迁移至工单详情页 -->

    <a-row :gutter="16" style="margin-top: 4px">
      <!-- 投诉趋势 -->
      <a-col :span="16">
        <div class="cp-card" style="padding: 20px 24px">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
            <h3 class="cp-section-title" style="margin: 0">投诉量趋势</h3>
            <a-space :size="4">
              <a-link>查看详细报表 →</a-link>
            </a-space>
          </div>
          <div class="cp-chart">
            <svg viewBox="0 0 700 240" width="100%" preserveAspectRatio="none">
              <!-- 网格 -->
              <line
                v-for="i in 5"
                :key="'g' + i"
                x1="40"
                :y1="40 + i * 30"
                x2="680"
                :y2="40 + i * 30"
                stroke="#eef0f4"
                stroke-width="1"
              />
              <!-- Y 轴 -->
              <text
                v-for="(label, i) in yLabels"
                :key="'y' + i"
                x="30"
                :y="44 + i * 30"
                text-anchor="end"
                font-size="11"
                fill="#86909c"
              >
                {{ label }}
              </text>
              <!-- X 轴 -->
              <text
                v-for="(label, i) in xLabels"
                :key="'x' + i"
                :x="40 + i * (640 / (xLabels.length - 1))"
                y="225"
                text-anchor="middle"
                font-size="11"
                fill="#86909c"
              >
                {{ label }}
              </text>
              <!-- 折线 -->
              <polyline :points="linePoints" fill="none" stroke="#165dff" stroke-width="2.5" />
              <polyline :points="areaPoints" fill="url(#areaGrad)" opacity="0.3" />
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#165dff" stop-opacity="0.4" />
                  <stop offset="100%" stop-color="#165dff" stop-opacity="0" />
                </linearGradient>
              </defs>
              <!-- 数据点 -->
              <circle v-for="(p, i) in dataPoints" :key="'d' + i" :cx="p.x" :cy="p.y" r="4" fill="#165dff" />
              <!-- 阈值线 -->
              <line x1="40" y1="100" x2="680" y2="100" stroke="#f53f3f" stroke-dasharray="4,4" stroke-width="1" />
              <text x="680" y="96" text-anchor="end" font-size="11" fill="#f53f3f">阈值 120</text>
            </svg>
          </div>
          <div style="display: flex; gap: 24px; margin-top: 12px; font-size: 12px; color: var(--cp-text-secondary)">
            <span
              ><span
                style="display: inline-block; width: 10px; height: 2px; background: #165dff; vertical-align: middle"
              ></span>
              投诉量</span
            >
            <span
              ><span
                style="
                  display: inline-block;
                  width: 10px;
                  height: 2px;
                  background: #f53f3f;
                  border-top: 1px dashed;
                  vertical-align: middle;
                "
              ></span>
              阈值线</span
            >
            <span style="margin-left: auto; color: var(--cp-text-tertiary)">数据更新: 2026-07-15 14:00</span>
          </div>
        </div>
      </a-col>

      <!-- 渠道分布 -->
      <a-col :span="8">
        <div class="cp-card" style="padding: 20px 24px">
          <h3 class="cp-section-title">渠道分布</h3>
          <div class="cp-channel-list">
            <div v-for="ch in channels" :key="ch.name" class="cp-channel-item">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px">
                <span style="font-size: 13px">{{ ch.name }}</span>
                <span class="mono" style="font-size: 13px; font-weight: 500">{{ ch.value }} ({{ ch.percent }}%)</span>
              </div>
              <div style="height: 6px; background: #f0f1f5; border-radius: 3px; overflow: hidden">
                <div :style="{ width: ch.percent + '%', height: '100%', background: ch.color, borderRadius: 3 }"></div>
              </div>
            </div>
          </div>
        </div>
      </a-col>
    </a-row>

    <a-row :gutter="16" style="margin-top: 16px">
      <!-- 监管件处理进度 -->
      <a-col :span="12">
        <div class="cp-card" style="padding: 20px 24px">
          <div style="display: flex; justify-content: space-between; align-items: center">
            <h3 class="cp-section-title" style="margin: 0">监管件处理进度</h3>
            <a-link @click="$router.push('/manage/alert')">查看全部 →</a-link>
          </div>
          <div style="display: flex; gap: 16px; margin-top: 16px">
            <div class="cp-reg-stat">
              <div class="cp-reg-num mono">8</div>
              <div class="cp-reg-label">处理中</div>
            </div>
            <div class="cp-reg-stat">
              <div class="cp-reg-num mono" style="color: var(--cp-danger)">2</div>
              <div class="cp-reg-label">临近超时</div>
            </div>
            <div class="cp-reg-stat">
              <div class="cp-reg-num mono" style="color: var(--cp-success)">23</div>
              <div class="cp-reg-label">本月已结</div>
            </div>
            <div class="cp-reg-stat">
              <div class="cp-reg-num mono">95.7%</div>
              <div class="cp-reg-label">按时结案率</div>
            </div>
          </div>
        </div>
      </a-col>

      <!-- 不满意评价 -->
      <a-col :span="12">
        <div class="cp-card" style="padding: 20px 24px">
          <div style="display: flex; justify-content: space-between; align-items: center">
            <h3 class="cp-section-title" style="margin: 0">不满意评价</h3>
            <a-tag color="red" size="small">7 天内 5 条</a-tag>
          </div>
          <div style="margin-top: 12px">
            <div v-for="fb in feedback" :key="fb.id" class="cp-fb-item">
              <div style="display: flex; justify-content: space-between">
                <a-link size="small">{{ fb.id }}</a-link>
                <a-rate :model-value="fb.score" readonly size="small" />
              </div>
              <div style="font-size: 12px; color: var(--cp-text-tertiary); margin-top: 2px">
                {{ fb.handler }} · {{ fb.time }} · {{ fb.reason }}
              </div>
            </div>
          </div>
          <div style="text-align: center; margin-top: 12px">
            <a-button size="small">查看全部</a-button>
          </div>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import KpiCard from '@/components/KpiCard.vue'

const period = ref('day')

const xLabels = ['07-09', '07-10', '07-11', '07-12', '07-13', '07-14', '07-15']
const yLabels = ['200', '150', '100', '50', '0']
const data = [80, 95, 88, 110, 92, 128, 162]
const dataPoints = computed(() =>
  data.map((v, i) => ({
    x: 40 + i * (640 / (xLabels.length - 1)),
    y: 190 - (v / 200) * 150
  }))
)
const linePoints = computed(() => dataPoints.value.map((p) => `${p.x},${p.y}`).join(' '))
const areaPoints = computed(() => {
  const pts = dataPoints.value
  return `40,190 ${pts.map((p) => `${p.x},${p.y}`).join(' ')} 680,190`
})

const channels = [
  { name: '电话', value: 78, percent: 48, color: '#165dff' },
  { name: '在线客服', value: 42, percent: 26, color: '#00b42a' },
  { name: 'APP', value: 24, percent: 15, color: '#722ed1' },
  { name: '12378/12345', value: 18, percent: 11, color: '#ff7d00' }
]

const feedback = [
  { id: 'GD-20260714-0008', score: 1, handler: '李伟', time: '07-14', reason: '客户对处理结果不满' },
  { id: 'GD-20260713-0021', score: 2, handler: '李伟', time: '07-13', reason: '处理速度慢' },
  { id: 'GD-20260712-0001', score: 2, handler: '张敏', time: '07-12', reason: '未解决核心问题' }
]
</script>

<style scoped>
.cp-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--cp-text);
}
.cp-chart {
  background: var(--cp-bg-soft);
  border-radius: 6px;
  padding: 8px 4px;
}
.cp-channel-item {
  margin-bottom: 14px;
}
.cp-channel-item:last-child {
  margin-bottom: 0;
}
.cp-reg-stat {
  flex: 1;
  text-align: center;
  padding: 12px;
  background: var(--cp-bg-soft);
  border-radius: 6px;
}
.cp-reg-num {
  font-size: 22px;
  font-weight: 600;
  color: var(--cp-brand);
}
.cp-reg-label {
  font-size: 12px;
  color: var(--cp-text-tertiary);
  margin-top: 4px;
}
.cp-fb-item {
  padding: 10px 0;
  border-bottom: 1px dashed var(--cp-border);
}
.cp-fb-item:last-child {
  border-bottom: none;
}
</style>
