<template>
  <a-layout class="cp-layout">
    <!-- 浅色侧栏(Arco 企业最佳实践) -->
    <a-layout-sider
      :width="collapsed ? 64 : 220"
      :collapsed="collapsed"
      :collapsible="true"
      class="cp-sider"
      theme="light"
    >
      <div class="cp-logo" :class="{ 'is-collapsed': collapsed }">
        <div class="cp-logo-icon">保</div>
        <div v-show="!collapsed" class="cp-logo-text">
          <div class="cp-logo-title">消保管理系统</div>
          <div class="cp-logo-sub">V2.0 · Demo</div>
        </div>
      </div>

      <a-menu
        :selected-keys="[route.path]"
        :default-open-keys="openKeys"
        :collapsed="collapsed"
        :collapsed-indent="20"
        @menu-item-click="(k: string) => router.push(k)"
      >
        <a-sub-menu v-for="group in menus" :key="group.key">
          <template #title>
            <span
              ><component :is="group.icon" /> <span v-show="!collapsed">{{ group.title }}</span></span
            >
          </template>
          <a-menu-item v-for="item in group.items" :key="item.path">
            {{ item.name }}
            <a-tag v-if="item.badge" size="small" color="red" style="margin-left: 6px">{{ item.badge }}</a-tag>
          </a-menu-item>
        </a-sub-menu>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <!-- 顶部 Header -->
      <a-layout-header class="cp-header">
        <div class="cp-header-left">
          <a-breadcrumb>
            <a-breadcrumb-item>{{ currentRoleInfo?.workbench }}</a-breadcrumb-item>
            <a-breadcrumb-item>{{ route.meta?.title || '首页' }}</a-breadcrumb-item>
          </a-breadcrumb>
        </div>
        <div class="cp-header-right">
          <a-space :size="4">
            <a-tooltip content="待办">
              <a-badge :count="todoBadge" :offset="[-2, 2]" :max-count="99">
                <a-button shape="circle" size="medium"><icon-clock-circle /></a-button>
              </a-badge>
            </a-tooltip>
            <a-tooltip content="预警">
              <alert-center-popover />
            </a-tooltip>
            <notification-center />
            <a-divider direction="vertical" style="height: 20px; margin: 0 4px" />
            <a-dropdown trigger="hover">
              <div class="cp-user-chip">
                <a-avatar :size="28" style="background: var(--cp-brand); font-size: 12px">{{
                  currentRoleInfo?.username?.charAt(0)
                }}</a-avatar>
                <div class="cp-user-info">
                  <div class="cp-user-name">{{ currentRoleInfo?.username }}</div>
                  <div class="cp-user-role">{{ currentRoleInfo?.name }}</div>
                </div>
                <icon-down style="color: var(--cp-text-tertiary); font-size: 12px" />
              </div>
              <template #content>
                <a-doption @click="showSwitch = true"> <icon-swap /> 切换角色 </a-doption>
                <a-doption> <icon-settings /> 个人设置 </a-doption>
                <a-doption @click="handleLogout"> <icon-export /> 退出登录 </a-doption>
              </template>
            </a-dropdown>
          </a-space>
        </div>
      </a-layout-header>

      <!-- 内容区 -->
      <a-layout-content class="cp-content">
        <!-- OPT-1: 实时指令 banner(登录态下展示当前角色指令收件箱) -->
        <InstructionCenter v-if="userStore.currentRole" />
        <router-view v-slot="{ Component }">
          <transition name="cp-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </a-layout-content>
    </a-layout>

    <!-- 角色切换弹窗 -->
    <a-modal v-model:visible="showSwitch" title="切换角色" :width="640" :footer="false">
      <div class="cp-role-grid">
        <div
          v-for="role in ROLE_LIST"
          :key="role.key"
          class="cp-role-card"
          :class="{ 'is-current': role.key === userStore.currentRole }"
          @click="switchRole(role.key)"
        >
          <a-avatar :size="36" style="background: var(--cp-brand)">
            <component :is="role.icon" :size="18" />
          </a-avatar>
          <div class="cp-role-name">{{ role.name }}</div>
          <div class="cp-role-work">{{ role.workbench }}</div>
          <div class="cp-role-desc">{{ role.desc }}</div>
          <a-tag v-if="role.key === userStore.currentRole" color="green" size="small">当前</a-tag>
        </div>
      </div>
    </a-modal>
  </a-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore, ROLE_LIST, RoleKey } from '@/stores/user'
import { useWorkflowStore } from '@/stores/workflow'
import NotificationCenter from '@/components/NotificationCenter.vue'
import InstructionCenter from '@/components/InstructionCenter.vue'
import AlertCenterPopover from '@/components/AlertCenterPopover.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const wf = useWorkflowStore()
const showSwitch = ref(false)
const collapsed = ref(false)

const currentRoleInfo = computed(() => ROLE_LIST.find((r) => r.key === userStore.currentRole))

// 顶部徽章数字接入 store
const todoBadge = computed(() => {
  const role = userStore.currentRole
  if (role === 'agent') return wf.agentTodos.length
  if (role === 'business') return wf.businessTodos.length
  if (role === 'manage' || role === 'review') return wf.manageTodos.length
  return 0
})

interface MenuItem {
  name: string
  path: string
  badge?: number
}
interface MenuGroup {
  key: string
  title: string
  icon: string
  items: MenuItem[]
}

const menus = computed<MenuGroup[]>(() => {
  switch (userStore.currentRole) {
    case 'agent':
      return [
        {
          key: 'g0',
          title: '工作台',
          icon: 'icon-desktop',
          items: [
            { name: '工作台(事件驱动)', path: '/agent/desk' },
            { name: '我的待办', path: '/agent/todo' }
          ]
        },
        {
          key: 'g2',
          title: '客户',
          icon: 'icon-user',
          items: [{ name: '客户画像查询', path: '/agent/customer-search' }]
        },
        { key: 'g3', title: '知识', icon: 'icon-book', items: [{ name: '知识检索', path: '/agent/knowledge' }] },
        {
          key: 'g4',
          title: '电话',
          icon: 'icon-phone',
          items: [
            { name: '队列/抢单', path: '/agent/phone' },
            { name: '工作台', path: '/agent/desk' }
          ]
        },
        {
          key: 'g5',
          title: '在线客服',
          icon: 'icon-message',
          items: [{ name: '会话窗口', path: '/agent/online-chat' }]
        }
      ]
    case 'business':
      return [
        {
          key: 'g0',
          title: '工作台',
          icon: 'icon-desktop',
          items: [
            { name: '工作台(事件驱动)', path: '/business/desk' },
            { name: '业务申请审批', path: '/business/apply' },
            { name: '待办列表', path: '/business/pending' }
          ]
        },
        {
          key: 'g2',
          title: '停催停扣',
          icon: 'icon-pause-circle',
          items: [{ name: '停催申请', path: '/business/stop-coll' }]
        },
        {
          key: 'g3',
          title: '协商还款',
          icon: 'icon-handshake',
          items: [{ name: '协商方案管理', path: '/business/negotiate' }]
        },
        {
          key: 'g4',
          title: '征信与清退',
          icon: 'icon-credit-card',
          items: [{ name: '征信异议处理', path: '/business/credit' }]
        },
        {
          key: 'g5',
          title: '转诉与调解',
          icon: 'icon-send',
          items: [{ name: '转诉调解工作区', path: '/business/transfer' }]
        }
      ]
    case 'review':
      return [
        {
          key: 'g1',
          title: '审查立项',
          icon: 'icon-file',
          items: [
            { name: '待审查立项', path: '/review/pending' },
            { name: '创建立项', path: '/review/create' }
          ]
        },
        {
          key: 'g2',
          title: '审查标准',
          icon: 'icon-storage',
          items: [{ name: '标准列表/维护', path: '/review/standards' }]
        },
        {
          key: 'g3',
          title: '审查记录',
          icon: 'icon-history',
          items: [{ name: '审查追溯', path: '/review/audit-trail' }]
        },
        { key: 'g4', title: '投诉管控', icon: 'icon-safety', items: [{ name: '承诺跟踪', path: '/review/promises' }] }
      ]
    case 'manage':
      return [
        {
          key: 'g1',
          title: '驾驶舱',
          icon: 'icon-dashboard',
          items: [
            { name: '消保看板', path: '/manage/dashboard' },
            { name: '预警中心', path: '/manage/alert', badge: 5 },
            { name: '不满意评价', path: '/manage/alert' }
          ]
        },
        {
          key: 'g2',
          title: '规则配置',
          icon: 'icon-settings',
          items: [{ name: '分单/预警/标签/名单', path: '/manage/rules' }]
        },
        {
          key: 'g3',
          title: '名单管理',
          icon: 'icon-storage',
          items: [{ name: '黑名单/投诉库/代理库', path: '/manage/lists' }]
        },
        {
          key: 'g4',
          title: '知识管理',
          icon: 'icon-book',
          items: [{ name: '知识条目管理', path: '/manage/knowledge' }]
        },
        {
          key: 'g5',
          title: '流程管理',
          icon: 'icon-swap',
          items: [
            { name: '工单流程配置', path: '/manage/workflow-config' },
            { name: '工单流转监控', path: '/manage/workflow-monitor' }
          ]
        },
        {
          key: 'g5',
          title: '运营管理',
          icon: 'icon-tool',
          items: [
            { name: '排班/绩效/请假', path: '/manage/ops' },
            { name: '质检管理', path: '/manage/quality' },
            { name: '贷中清退', path: '/manage/exit' },
            { name: '票据合同', path: '/manage/billing' }
          ]
        },
        { key: 'g7', title: '溯源整改', icon: 'icon-reload', items: [{ name: '整改工作台', path: '/manage/rectify' }] }
      ]
    case 'consumer':
      return [
        {
          key: 'g1',
          title: '我的投诉',
          icon: 'icon-form',
          items: [{ name: '投诉进度查询', path: '/consumer/complaints' }]
        },
        { key: 'g2', title: '评价反馈', icon: 'icon-star', items: [{ name: '满意度评价', path: '/consumer/feedback' }] }
      ]
    default:
      return []
  }
})

const openKeys = computed(() => menus.value.map((m) => m.key))

function switchRole(key: RoleKey) {
  userStore.login(key)
  showSwitch.value = false
  const defaults: Record<RoleKey, string> = {
    agent: '/agent/desk',
    business: '/business/desk',
    review: '/review/pending',
    manage: '/manage/dashboard',
    consumer: '/consumer/complaints'
  }
  router.push(defaults[key])
}

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.cp-layout {
  height: 100vh;
}

/* ============ 浅色侧栏(企业最佳实践) ============ */
.cp-sider {
  background: #fff !important;
  border-right: 1px solid var(--cp-border-light);
  box-shadow: none;
  transition: width 0.2s;
}
.cp-sider :deep(.arco-menu) {
  background: transparent;
  border-right: none;
  padding-top: 4px;
}
.cp-sider :deep(.arco-menu-light) {
  background: transparent;
}
.cp-sider :deep(.arco-menu-item:hover),
.cp-sider :deep(.arco-menu-item:active),
.cp-sider :deep(.arco-menu-sub-menu-title:hover) {
  background-color: var(--cp-bg-hover) !important;
  color: var(--cp-brand) !important;
}
.cp-sider :deep(.arco-menu-selected.arco-menu-item),
.cp-sider :deep(.arco-menu-selected.arco-menu-sub-menu-title) {
  background-color: var(--cp-brand-soft) !important;
  color: var(--cp-brand) !important;
  font-weight: 500;
}
.cp-sider :deep(.arco-menu-selected.arco-menu-item::before),
.cp-sider :deep(.arco-menu-sub-menu-title::before) {
  display: none;
}
.cp-sider :deep(.arco-menu-sub-menu-title) {
  color: var(--cp-text-secondary);
  font-weight: 500;
}

/* Logo */
.cp-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--cp-border-light);
  height: 56px;
  overflow: hidden;
}
.cp-logo.is-collapsed {
  justify-content: center;
  padding: 14px 0;
}
.cp-logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--cp-brand);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  letter-spacing: -1px;
}
.cp-logo-text {
  flex: 1;
  min-width: 0;
  line-height: 1.3;
}
.cp-logo-title {
  color: var(--cp-text);
  font-size: 14px;
  font-weight: 600;
}
.cp-logo-sub {
  color: var(--cp-text-tertiary);
  font-size: 11px;
  margin-top: 2px;
}

/* ============ 顶部 Header ============ */
.cp-header {
  background: #fff;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--cp-border-light);
}
.cp-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.cp-header-left :deep(.arco-breadcrumb-item) {
  font-size: 13px;
}
.cp-header-right {
  display: flex;
  align-items: center;
}

/* 用户头像 */
.cp-user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}
.cp-user-chip:hover {
  background: var(--cp-bg-hover);
}
.cp-user-info {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.cp-user-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--cp-text);
}
.cp-user-role {
  font-size: 11px;
  color: var(--cp-text-tertiary);
}

/* ============ 内容区 ============ */
.cp-content {
  background: var(--cp-bg);
  overflow-y: auto;
  height: calc(100vh - 56px);
}

/* ============ 角色切换 ============ */
.cp-role-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.cp-role-card {
  border: 1px solid var(--cp-border-light);
  border-radius: 6px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  background: #fff;
}
.cp-role-card:hover {
  border-color: var(--cp-brand);
  box-shadow: var(--cp-shadow);
}
.cp-role-card.is-current {
  border-color: var(--cp-brand);
  background: var(--cp-brand-soft);
}
.cp-role-name {
  font-size: 14px;
  font-weight: 600;
  margin-top: 10px;
  color: var(--cp-text);
}
.cp-role-work {
  font-size: 12px;
  color: var(--cp-brand);
  margin-top: 2px;
}
.cp-role-desc {
  font-size: 11px;
  color: var(--cp-text-tertiary);
  margin-top: 6px;
  line-height: 1.5;
}
.cp-role-card :deep(.arco-tag) {
  position: absolute;
  top: 8px;
  right: 8px;
}

/* 路由过渡 */
.cp-fade-enter-active,
.cp-fade-leave-active {
  transition: opacity 0.15s ease;
}
.cp-fade-enter-from,
.cp-fade-leave-to {
  opacity: 0;
}
</style>
