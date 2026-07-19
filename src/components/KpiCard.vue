<template>
  <div class="cp-kpi-card" :class="{ 'cp-kpi-alert': alert }">
    <div class="cp-kpi-head">
      <span class="cp-kpi-label">{{ label }}</span>
      <icon-arrow-rise v-if="trend === 'up'" class="cp-kpi-trend cp-trend-up" />
      <icon-arrow-fall v-else-if="trend === 'down'" class="cp-kpi-trend cp-trend-down" />
    </div>
    <div class="cp-kpi-value mono">{{ display }}</div>
    <div class="cp-kpi-foot">
      <span class="cp-kpi-extra">{{ extra }}</span>
      <a-tag v-if="tag" :color="tagColor" size="small">{{ tag }}</a-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect, onMounted } from 'vue'

const props = defineProps<{
  label: string
  value: number
  extra?: string
  trend?: 'up' | 'down' | 'flat'
  alert?: boolean
  tag?: string
  tagColor?: string
}>()

const display = ref(0)

function animate() {
  const start = performance.now()
  const dur = 800
  const from = 0
  const to = props.value
  function tick(t: number) {
    const p = Math.min(1, (t - start) / dur)
    const eased = 1 - Math.pow(1 - p, 3)
    display.value = Math.round(from + (to - from) * eased)
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

onMounted(animate)
watchEffect(() => {
  if (props.value) animate()
})
</script>

<style scoped>
.cp-kpi-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  border: 1px solid var(--cp-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s;
}
.cp-kpi-card:hover {
  box-shadow: var(--cp-shadow-md);
  transform: translateY(-1px);
}
.cp-kpi-alert {
  border-color: var(--cp-danger);
}
.cp-kpi-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.cp-kpi-label {
  font-size: 13px;
  color: var(--cp-text-tertiary);
}
.cp-kpi-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--cp-text);
  letter-spacing: -0.5px;
}
.cp-kpi-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.cp-kpi-extra {
  font-size: 12px;
  color: var(--cp-text-tertiary);
}
.cp-trend-up {
  color: var(--cp-success);
}
.cp-trend-down {
  color: var(--cp-danger);
}
</style>
