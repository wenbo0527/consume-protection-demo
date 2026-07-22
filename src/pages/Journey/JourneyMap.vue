<template>
  <a-drawer
    v-model:visible="drawerVisible"
    :width="drawerWidth"
    placement="right"
    :footer="false"
    :closable="true"
    :mask-closable="true"
    :mask="false"
    unmount-on-close
    class="cp-journey-drawer"
    :popup-container="'.cp-journey-drawer-host'"
    @close="onDrawerClose"
  >
    <template #title>
      <div class="cp-drawer-title">
        <span class="cp-drawer-title-main">📍 消保系统 · 用户旅程说明</span>
        <span class="cp-drawer-title-sub">讲解辅助 · 不触发业务 · 可关闭</span>
      </div>
    </template>

    <!-- ========== 抽屉内容 ========== -->
    <div class="cp-page cp-journey">

    <!-- ========== 抽屉内顶部操作条(返回/打印/关闭) ========== -->
    <div class="cp-journey-actions">
      <a-space>
        <a-button type="primary" size="small" @click="backToApp">
          <icon-arrow-left />
          返回主应用
          <span v-if="currentRole" style="margin-left: 4px; opacity: 0.85">
            ({{ currentRole.roleName }})
          </span>
        </a-button>
        <a-button size="small" @click="handlePrint"> <icon-printer /> 打印 </a-button>
        <a-dropdown trigger="hover">
          <a-button size="small">
            <icon-expand /> 宽度:{{ widthModeLabel }}
            <icon-down />
          </a-button>
          <template #content>
            <a-doption @click="switchWidth('full')">全屏覆盖(默认)</a-doption>
            <a-doption @click="switchWidth('half')">半屏(50vw)</a-doption>
            <a-doption @click="switchWidth('780')">右侧抽屉(780px)</a-doption>
          </template>
        </a-dropdown>
        <a-button size="small" @click="drawerVisible = false">
          <icon-close /> 关闭
        </a-button>
      </a-space>
      <div class="cp-journey-actions-meta">
        🪟 当前宽度:<b>{{ widthModeLabel }}</b> · 讲解完按 <b>×</b> 或 <b>关闭</b> 即可,不影响当前页面
      </div>
    </div>

    <!-- ========== 顶部提醒横幅 ========== -->
    <a-alert type="warning" show-icon style="margin-bottom: 16px">
      <template #title>讲解辅助页</template>
      <template #content>
        本页是讲解说明,所有"对应演示位置"按钮仅做<b>只读跳转</b>(router.push),
        <b style="color: var(--cp-danger)">不会</b>触发来电弹屏、建工单、发起工作流等任何业务副作用,
        可放心用于讲解与对账。
      </template>
    </a-alert>

    <!-- ========== 角色 Tab ========== -->
    <div class="cp-journey-tabs">
      <div
        v-for="rk in JOURNEY_ORDER"
        :key="rk"
        :class="['cp-journey-tab', { 'is-active': activeRole === rk }]"
        :style="{ borderColor: roleColor(rk) }"
        @click="activeRole = rk"
      >
        <span class="cp-journey-tab-dot" :style="{ background: roleColor(rk) }"></span>
        <span class="cp-journey-tab-name">{{ JOURNEY_MAP[rk].roleName }}</span>
        <span class="cp-journey-tab-user">@{{ JOURNEY_MAP[rk].username }}</span>
      </div>
    </div>

    <!-- ========== 角色心智模型(讲解头部,只读) ========== -->
    <div v-if="currentMentalModel" class="cp-mental-model" :style="{ borderColor: roleColor(activeRole) }">
      <div class="cp-mental-model-head">
        <span class="cp-mental-model-label">💡 角色心智模型</span>
        <a-tag size="small" color="gray">{{ currentMentalModel.scope }}</a-tag>
      </div>
      <div class="cp-mental-model-line">{{ currentMentalModel.oneLiner }}</div>
      <div class="cp-mental-model-actions">
        <a-tag
          v-for="(a, i) in currentMentalModel.actions"
          :key="i"
          :color="roleColor(activeRole)"
          size="small"
        >
          {{ i + 1 }}. {{ a }}
        </a-tag>
      </div>
    </div>

    <!-- ========== 角色头部 ========== -->
    <div v-if="currentRole" class="cp-journey-role-head">
      <div>
        <h2 class="cp-journey-role-title">
          <span class="cp-journey-role-tag" :style="{ background: roleColor(activeRole) }">
            {{ currentRole.roleName }}
          </span>
          <span class="cp-journey-role-user">@{{ currentRole.username }}</span>
        </h2>
      </div>
      <div v-if="currentRole.keyPains.length" class="cp-journey-pains-summary">
        <span style="font-size: 12px; color: var(--cp-text-tertiary); margin-right: 6px">
          痛点共 {{ currentRole.keyPains.length }} 条
        </span>
        <a-tag
          v-for="(p, i) in currentRole.keyPains"
          :key="i"
          :color="p.level === '🔴' ? 'red' : 'orange'"
          size="small"
          style="margin: 2px"
        >
          {{ p.level }} {{ p.title }}
        </a-tag>
      </div>
    </div>

    <!-- ========== 章节渲染 ========== -->
    <div v-for="section in currentRole?.sections" :key="section.code" class="cp-journey-section">
      <div class="cp-section-header">
        <h3 class="cp-section-title">{{ section.title }}</h3>
        <span class="cp-section-desc">{{ section.desc }}</span>
      </div>

      <a-row :gutter="[16, 16]">
        <a-col v-for="phase in section.phases" :key="phase.code" :xs="24" :sm="24" :md="12" :lg="8">
          <div class="cp-phase-card">
            <div class="cp-phase-head">
              <span class="cp-phase-code">{{ phase.code }}</span>
              <span class="cp-phase-title">{{ phase.title }}</span>
            </div>

            <div class="cp-phase-summary">{{ phase.summary }}</div>

            <!-- 现状卡点 -->
            <div v-if="phase.pains?.length" class="cp-phase-pains">
              <div class="cp-phase-pains-label">
                <icon-exclamation-circle /> 现状卡点
              </div>
              <ul class="cp-phase-pains-list">
                <li v-for="(p, i) in phase.pains" :key="i">{{ p }}</li>
              </ul>
            </div>

            <!-- 对应演示位置 -->
            <div v-if="phase.demos?.length" class="cp-phase-demos">
              <div class="cp-phase-demos-label">
                <icon-location /> 对应演示位置
              </div>
              <div class="cp-phase-demos-list">
                <a-button
                  v-for="(d, i) in phase.demos"
                  :key="i"
                  size="small"
                  type="outline"
                  @click="goto(d.path)"
                >
                  <icon-right /> {{ d.label }}
                </a-button>
              </div>
            </div>
          </div>
        </a-col>
      </a-row>
    </div>
  </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { Message } from '@arco-design/web-vue'
import {
  JOURNEY_MAP,
  JOURNEY_ORDER,
  ROLE_MENTAL_MODELS,
  type JourneyRole,
  type RoleKey
} from '@/constants/journey'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

/** ============ 抽屉显隐 ============
 *  - /journey 路由访问 → 抽屉默认打开
 *  - 任意页面打开 /journey → 抽屉打开
 *  - 点击 ×/关闭/返回主应用 → 抽屉关闭
 */
const drawerVisible = ref(true)

/** 抽屉宽度:
 *  - 默认 100vw 全屏覆盖(讲解体验更好)
 *  - ?w=half  → 半屏(50vw,留主页面一半)
 *  - ?w=780   → 780px(右侧抽屉)
 *  - ?w=<数字> → 自定义 px
 */
const drawerWidth = computed<string>(() => {
  const w = (route.query.w as string) || 'full'
  if (w === 'full') return '100vw'
  if (w === 'half') return '50vw'
  if (/^\d+$/.test(w)) return `${w}px`
  return '100vw'
})
/** 当前宽度模式标签 */
const widthModeLabel = computed(() => {
  const w = (route.query.w as string) || 'full'
  if (w === 'full') return '全屏覆盖'
  if (w === 'half') return '半屏'
  return `${w}px`
})

/** 当前激活角色:支持 ?role=xxx query 强制指定(讲解时方便切到任意角色) */
function resolveInitialRole(): RoleKey {
  const q = (route.query.role as string) || ''
  if (q && JOURNEY_MAP[q as RoleKey]) return q as RoleKey
  if (userStore.currentRole && JOURNEY_MAP[userStore.currentRole as RoleKey])
    return userStore.currentRole as RoleKey
  return 'agent'
}
const activeRole = ref<RoleKey>(resolveInitialRole())

onMounted(() => {
  // 默认打开
  drawerVisible.value = true
})

/** 当前角色配置 */
const currentRole = computed<JourneyRole | undefined>(() => JOURNEY_MAP[activeRole.value])

/** 当前角色心智模型 */
const currentMentalModel = computed(() =>
  ROLE_MENTAL_MODELS.find((m) => m.roleKey === activeRole.value)
)

/** 角色配色(与现有角色色系保持一致) */
function roleColor(role: RoleKey): string {
  const map: Record<RoleKey, string> = {
    agent: '#1494e8',
    business: '#ff7d00',
    review: '#722ed1',
    manage: '#f5222d',
    consumer: '#52c41a'
  }
  return map[role]
}

/** 只读跳转(严格不携带任何 ?demo=,不触发任何副作用) */
function goto(path: string) {
  // 跳转前检查登录态:工作台需要登录,如果未登录则引导到登录页
  let role: string | null = null
  try {
    role = localStorage.getItem('cp_user_role')
  } catch (e) {
    /* ignore */
  }
  if (!role && path !== '/login' && path !== '/journey') {
    Message.warning('该演示页面需要登录后访问,即将跳转到登录页')
    // 登录后跳回旅程页 + 目标页(由登录页处理)
    try {
      sessionStorage.setItem('cp_jump_after_login', path)
    } catch (e) {
      /* ignore */
    }
    router.push('/login')
    return
  }
  router.push(path)
}

/** 打印 */
function handlePrint() {
  window.print()
}

/** 抽屉关闭回调 */
function onDrawerClose() {
  // 关闭后,跳回上一页或工作台
  const from = route.query.from as string
  if (from) {
    router.push(from)
  } else {
    router.back()
  }
}

/** 切换抽屉宽度(改 URL query,drawerWidth 自动跟随) */
function switchWidth(mode: 'full' | 'half' | '780') {
  router.replace({ path: '/journey', query: { ...route.query, w: mode } })
}

/** ============ 返回主应用 ============
 *  智能跳转:
 *  - 已登录 + 选中角色 → 跳到对应角色的工作台
 *  - 已登录 + 未选角色 → 跳到登录页(默认角色)
 *  - 未登录 → 跳到登录页
 *  跳转走 router.push,不触发任何业务副作用
 */
const ROLE_HOME: Record<RoleKey, string> = {
  agent: '/agent/desk',
  business: '/business/desk',
  review: '/review/pending',
  manage: '/manage/dashboard',
  consumer: '/consumer/complaints'
}
function backToApp() {
  let role: string | null = null
  try {
    role = localStorage.getItem('cp_user_role')
  } catch (e) {
    /* ignore */
  }
  if (role && ROLE_HOME[activeRole.value]) {
    // 已登录 → 跳到当前激活角色的工作台
    router.push(ROLE_HOME[activeRole.value])
  } else {
    // 未登录 → 跳登录页;登录成功后会进默认工作台
    router.push('/login')
  }
}
</script>

<style scoped>
/* ============ 抽屉标题 ============ */
.cp-drawer-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.cp-drawer-title-main {
  font-size: 16px;
  font-weight: 600;
  color: var(--cp-text);
}
.cp-drawer-title-sub {
  font-size: 11px;
  color: var(--cp-text-tertiary);
  font-weight: normal;
}

/* ============ 抽屉内顶部操作条 ============ */
.cp-journey-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  flex-wrap: wrap;
}
.cp-journey-actions-meta {
  font-size: 11px;
  color: var(--cp-text-tertiary);
}

/* 抽屉 body 内容滚动 */
:deep(.cp-journey-drawer .arco-drawer-body) {
  padding: 16px 20px;
  max-height: calc(100vh - 60px);
  overflow-y: auto;
}

/* 全屏覆盖模式下,dialog 占满且无圆角,贴合整页 */
:deep(.cp-journey-drawer .arco-drawer) {
  border-radius: 0;
}
</style>

<style scoped>
.cp-journey {
  max-width: 1280px;
  margin: 0 auto;
}

/* 角色 Tab */
.cp-journey-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.cp-journey-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 2px solid transparent;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
  min-width: 160px;
}
.cp-journey-tab:hover {
  box-shadow: var(--cp-shadow);
  transform: translateY(-1px);
}
.cp-journey-tab.is-active {
  background: var(--cp-brand-soft);
}
.cp-journey-tab-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.cp-journey-tab-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--cp-text);
}
.cp-journey-tab-user {
  font-size: 11px;
  color: var(--cp-text-tertiary);
  margin-left: 4px;
}

/* 角色头部 */

/* ============ 角色心智模型(讲解头部) ============ */
.cp-mental-model {
  background: linear-gradient(135deg, var(--cp-brand-soft) 0%, #fff 100%);
  border-left: 4px solid var(--cp-brand);
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 16px;
}
.cp-mental-model-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.cp-mental-model-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--cp-text-secondary);
}
.cp-mental-model-line {
  font-size: 14px;
  font-weight: 500;
  color: var(--cp-text);
  margin-bottom: 8px;
  line-height: 1.6;
}
.cp-mental-model-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.cp-journey-role-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid var(--cp-border-light);
}
.cp-journey-role-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}
.cp-journey-role-tag {
  padding: 4px 12px;
  border-radius: 4px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}
.cp-journey-role-user {
  font-size: 13px;
  color: var(--cp-text-secondary);
}
.cp-journey-pains-summary {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

/* 章节 */
.cp-journey-section {
  margin-bottom: 24px;
}
.cp-section-header {
  margin-bottom: 12px;
}
.cp-section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--cp-text);
  margin: 0 0 4px;
}
.cp-section-desc {
  font-size: 12px;
  color: var(--cp-text-tertiary);
}

/* 阶段卡片 */
.cp-phase-card {
  background: #fff;
  border: 1px solid var(--cp-border-light);
  border-radius: 6px;
  padding: 14px 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.15s;
}
.cp-phase-card:hover {
  box-shadow: var(--cp-shadow);
  border-color: var(--cp-brand);
}
.cp-phase-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cp-phase-code {
  background: var(--cp-brand-soft);
  color: var(--cp-brand);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  flex-shrink: 0;
}
.cp-phase-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--cp-text);
}
.cp-phase-summary {
  font-size: 12px;
  color: var(--cp-text-secondary);
  line-height: 1.6;
}
.cp-phase-pains-label,
.cp-phase-demos-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--cp-text-tertiary);
  margin-bottom: 4px;
}
.cp-phase-pains-list {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  color: var(--cp-text-secondary);
  line-height: 1.7;
}
.cp-phase-demos-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* 打印样式:隐藏非必要元素 */
@media print {
  .cp-page-header .a-space,
  :deep(.arco-alert) {
    display: none !important;
  }
}
</style>