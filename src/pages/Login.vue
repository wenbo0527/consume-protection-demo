<template>
  <div class="cp-login">
    <!-- 左侧品牌展示 -->
    <div class="cp-login-left">
      <div class="cp-login-brand">
        <div class="cp-login-logo">
          <div class="cp-login-logo-icon">保</div>
          <div>
            <div class="cp-login-brand-title">消保投诉管理系统</div>
            <div class="cp-login-brand-sub">Consumer Protection Complaint Management</div>
          </div>
        </div>

        <div class="cp-login-features">
          <h2 class="cp-login-feature-title">合规 · 高效 · 闭环</h2>
          <p class="cp-login-feature-desc">
            覆盖消保审查立项、投诉全流程处置、溯源整改闭环的<br />
            统一作业平台,把消保工作从"散装"变成"闭环"。
          </p>

          <div class="cp-login-feature-grid">
            <div class="cp-login-feature">
              <icon-check-circle class="cp-feat-icon" />
              <div>
                <div class="cp-feat-name">投诉处理 ≤15 工作日</div>
                <div class="cp-feat-sub">监管件超时率 ≤5%</div>
              </div>
            </div>
            <div class="cp-login-feature">
              <icon-check-circle class="cp-feat-icon" />
              <div>
                <div class="cp-feat-name">一次性解决率 ≥70%</div>
                <div class="cp-feat-sub">重复投诉率 ≤10%</div>
              </div>
            </div>
            <div class="cp-login-feature">
              <icon-check-circle class="cp-feat-icon" />
              <div>
                <div class="cp-feat-name">审查覆盖率 100%</div>
                <div class="cp-feat-sub">新产品/营销上线前审查</div>
              </div>
            </div>
            <div class="cp-login-feature">
              <icon-check-circle class="cp-feat-icon" />
              <div>
                <div class="cp-feat-name">预警处置率 ≥95%</div>
                <div class="cp-feat-sub">24h 未处置自动升级</div>
              </div>
            </div>
          </div>
        </div>

        <div class="cp-login-foot">
          <span>V2.0 · Phase 1</span>
          <i>·</i>
          <span>原型 Demo</span>
        </div>
      </div>
    </div>

    <!-- 右侧角色选择 -->
    <div class="cp-login-right">
      <div class="cp-login-form">
        <h1 class="cp-login-h1">欢迎登录</h1>
        <p class="cp-login-p">请选择您的角色进入对应工作台</p>

        <div class="cp-role-grid">
          <div v-for="role in ROLE_LIST" :key="role.key" class="cp-role-card" @click="enter(role.key)">
            <div class="cp-role-icon-wrap">
              <component :is="role.icon" :size="20" />
            </div>
            <div style="flex: 1; min-width: 0">
              <div class="cp-role-name">{{ role.name }}</div>
              <div class="cp-role-work">{{ role.workbench }} · {{ role.username }}</div>
              <div class="cp-role-desc">{{ role.desc }}</div>
            </div>
            <icon-right class="cp-role-arrow" />
          </div>
        </div>

        <a-divider style="margin: 24px 0 16px">技术栈</a-divider>
        <div class="cp-login-tech">
          <span>Vue 3</span>
          <span>TypeScript</span>
          <span>Arco Design Vue</span>
          <span>Pinia</span>
          <span>Vite 5</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore, ROLE_LIST, RoleKey } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const defaults: Record<RoleKey, string> = {
  agent: '/agent/desk',
  business: '/business/desk',
  review: '/review/pending',
  manage: '/manage/dashboard',
  consumer: '/consumer/complaints'
}

async function enter(key: RoleKey) {
  // eslint-disable-next-line no-console
  console.log('[cp-login] enter click', { key, target: defaults[key] })
  try {
    userStore.login(key)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[cp-login] userStore.login threw', e)
    return
  }
  // 等待下一个 tick,确保 store 状态变更完成
  await new Promise((resolve) => setTimeout(resolve, 0))
  try {
    // eslint-disable-next-line no-console
    console.log('[cp-login] before router.push', {
      currentRole: userStore.currentRole,
      ls: localStorage.getItem('cp_user_role')
    })
    await router.push(defaults[key])
    // eslint-disable-next-line no-console
    console.log('[cp-login] after router.push, route =', router.currentRoute.value.fullPath)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[cp-login] router.push failed', e)
  }
}
</script>

<style scoped>
.cp-login {
  height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #fff;
  overflow: hidden;
}

/* ============ 左侧品牌 ============ */
.cp-login-left {
  background: linear-gradient(135deg, #165dff 0%, #0e42d2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  position: relative;
  overflow: hidden;
}
.cp-login-left::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.08), transparent 40%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.05), transparent 40%);
  pointer-events: none;
}
.cp-login-brand {
  max-width: 480px;
  position: relative;
  z-index: 1;
}

.cp-login-logo {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 60px;
}
.cp-login-logo-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
}
.cp-login-brand-title {
  font-size: 20px;
  font-weight: 600;
}
.cp-login-brand-sub {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
  letter-spacing: 0.5px;
}

.cp-login-feature-title {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 16px;
  letter-spacing: -1px;
  line-height: 1.2;
}
.cp-login-feature-desc {
  font-size: 14px;
  opacity: 0.85;
  line-height: 1.7;
  margin: 0 0 40px;
}

.cp-login-feature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.cp-login-feature {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
}
.cp-feat-icon {
  color: #fff;
  flex-shrink: 0;
  margin-top: 2px;
}
.cp-feat-name {
  font-size: 13px;
  font-weight: 500;
}
.cp-feat-sub {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 2px;
}

.cp-login-foot {
  position: absolute;
  bottom: 24px;
  left: 60px;
  font-size: 11px;
  opacity: 0.6;
  display: flex;
  gap: 8px;
  align-items: center;
}
.cp-login-foot i {
  font-style: normal;
  opacity: 0.4;
}

/* ============ 右侧表单 ============ */
.cp-login-right {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: #fff;
}
.cp-login-form {
  width: 100%;
  max-width: 480px;
}
.cp-login-h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px;
  color: var(--cp-text);
}
.cp-login-p {
  font-size: 13px;
  color: var(--cp-text-tertiary);
  margin: 0 0 32px;
}

.cp-role-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cp-role-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid var(--cp-border-light);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fff;
}
.cp-role-card:hover {
  border-color: var(--cp-brand);
  background: var(--cp-brand-soft);
  transform: translateX(2px);
}
.cp-role-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: var(--cp-brand-soft);
  color: var(--cp-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}
.cp-role-card:hover .cp-role-icon-wrap {
  background: var(--cp-brand);
  color: #fff;
}
.cp-role-name {
  font-size: 14px;
  font-weight: 600;
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
  margin-top: 4px;
  line-height: 1.5;
}
.cp-role-arrow {
  color: var(--cp-text-tertiary);
  flex-shrink: 0;
  transition:
    transform 0.2s,
    color 0.2s;
}
.cp-role-card:hover .cp-role-arrow {
  color: var(--cp-brand);
  transform: translateX(2px);
}

.cp-login-tech {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}
.cp-login-tech span {
  font-size: 11px;
  color: var(--cp-text-tertiary);
  padding: 3px 10px;
  background: var(--cp-bg-soft);
  border-radius: 10px;
  border: 1px solid var(--cp-border-light);
}

/* 响应式 - 窄屏隐藏左侧 */
@media (max-width: 960px) {
  .cp-login {
    grid-template-columns: 1fr;
  }
  .cp-login-left {
    display: none;
  }
}
</style>
