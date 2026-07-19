<template>
  <div class="cp-workflow">
    <div
      v-for="(step, idx) in steps"
      :key="step.key"
      class="cp-wf-step"
      :class="{
        'is-done': idx < currentIdx,
        'is-current': idx === currentIdx,
        'is-future': idx > currentIdx
      }"
    >
      <div class="cp-wf-dot">
        <icon-check v-if="idx < currentIdx" />
        <span v-else>{{ idx + 1 }}</span>
      </div>
      <div class="cp-wf-content">
        <div class="cp-wf-name">{{ step.name }}</div>
        <div class="cp-wf-meta" v-if="step.meta">{{ step.meta }}</div>
      </div>
      <div v-if="idx < steps.length - 1" class="cp-wf-line"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  steps: { key: string; name: string; meta?: string }[]
  current: string
}>()

const currentIdx = computed(() => props.steps.findIndex((s) => s.key === props.current))
</script>

<style scoped>
.cp-workflow {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
}
.cp-wf-step {
  display: flex;
  align-items: flex-start;
  flex: 1;
  position: relative;
}
.cp-wf-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f0f1f5;
  color: var(--cp-text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  border: 2px solid #f0f1f5;
  z-index: 2;
  transition: all 0.3s;
}
.is-done .cp-wf-dot {
  background: var(--cp-success);
  color: #fff;
  border-color: var(--cp-success);
}
.is-current .cp-wf-dot {
  background: var(--cp-brand);
  color: #fff;
  border-color: var(--cp-brand);
  box-shadow: 0 0 0 4px var(--cp-brand-soft);
}
.cp-wf-content {
  margin-left: 10px;
  padding-top: 1px;
}
.cp-wf-name {
  font-size: 13px;
  color: var(--cp-text);
  font-weight: 500;
}
.is-future .cp-wf-name {
  color: var(--cp-text-tertiary);
}
.cp-wf-meta {
  font-size: 11px;
  color: var(--cp-text-tertiary);
  margin-top: 2px;
}
.cp-wf-line {
  position: absolute;
  left: 11px;
  top: 24px;
  height: 2px;
  width: calc(100% - 24px);
  background: #f0f1f5;
  z-index: 1;
}
.is-done .cp-wf-line {
  background: var(--cp-success);
}
</style>
