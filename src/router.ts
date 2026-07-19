import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import MainLayout from './layout/MainLayout.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: () => import('./pages/Login.vue'), meta: { title: '登录' } },
  {
    path: '/',
    component: MainLayout,
    children: [
      // 坐席工作台
      { path: 'agent', redirect: '/agent/desk' },
      { path: 'agent/desk', name: 'AgentDesk', component: () => import('./pages/AgentWorkbench/AgentDesk.vue'), meta: { title: '工作台' } },
      { path: 'agent/todo', name: 'AgentTodo', component: () => import('./pages/AgentWorkbench/TicketsTodo.vue'), meta: { title: '工单列表' } },
      { path: 'agent/ticket-create', name: 'AgentTicketCreate', component: () => import('./pages/AgentWorkbench/TicketCreate.vue'), meta: { title: '创建工单' } },
      { path: 'agent/ticket/:id', name: 'AgentTicketDetail', component: () => import('./pages/AgentWorkbench/TicketDetail.vue'), meta: { title: '工单详情' } },
      { path: 'agent/customer-search', name: 'AgentCustomerSearch', component: () => import('./pages/AgentWorkbench/CustomerSearch.vue'), meta: { title: '客户画像查询' } },
      { path: 'agent/customer/:id', name: 'AgentCustomer', component: () => import('./pages/AgentWorkbench/CustomerProfile.vue'), meta: { title: '客户画像' } },
      { path: 'agent/knowledge', name: 'AgentKnowledge', component: () => import('./pages/AgentWorkbench/KnowledgeSearch.vue'), meta: { title: '知识检索' } },
      { path: 'agent/reg-import', name: 'AgentRegImport', component: () => import('./pages/AgentWorkbench/RegImport.vue'), meta: { title: '监管转诉建单' } },
      { path: 'agent/batch', name: 'AgentBatch', component: () => import('./pages/AgentWorkbench/BatchJob.vue'), meta: { title: '批量作业' } },

      // 业务执行台
      { path: 'business', redirect: '/business/desk' },
      { path: 'business/desk', name: 'BusinessDesk', component: () => import('./pages/BusinessWorkbench/BusinessDesk.vue'), meta: { title: '业务执行工作台' } },
      { path: 'business/apply', name: 'BusinessApply', component: () => import('./pages/BusinessWorkbench/BusinessApply.vue'), meta: { title: '业务申请审批' } },
      { path: 'agent/phone', name: 'AgentPhoneChannel', component: () => import('./pages/AgentWorkbench/PhoneChannel.vue'), meta: { title: '电话工作台' } },
      { path: 'agent/online-chat', name: 'AgentOnlineChat', component: () => import('./pages/AgentWorkbench/OnlineChatChannel.vue'), meta: { title: '在线客服' } },
      { path: 'business/pending', name: 'BusinessPending', component: () => import('./pages/BusinessWorkbench/PendingTickets.vue'), meta: { title: '待办列表' } },
      { path: 'business/stop-coll', name: 'BusinessStopColl', component: () => import('./pages/BusinessWorkbench/StopCollection.vue'), meta: { title: '停催停扣' } },
      { path: 'business/negotiate', name: 'BusinessNegotiate', component: () => import('./pages/BusinessWorkbench/Negotiate.vue'), meta: { title: '协商还款' } },
      { path: 'business/credit', name: 'BusinessCredit', component: () => import('./pages/BusinessWorkbench/CreditObjection.vue'), meta: { title: '征信异议' } },
      { path: 'business/transfer', name: 'BusinessTransfer', component: () => import('./pages/BusinessWorkbench/TransferMediation.vue'), meta: { title: '转诉与调解' } },

      // 审查工作台
      { path: 'review', redirect: '/review/pending' },
      { path: 'review/pending', name: 'ReviewPending', component: () => import('./pages/ReviewWorkbench/PendingReview.vue'), meta: { title: '待审查立项' } },
      { path: 'review/create', name: 'ReviewCreate', component: () => import('./pages/ReviewWorkbench/CreateReview.vue'), meta: { title: '创建立项' } },
      { path: 'review/execute/:id', name: 'ReviewExecute', component: () => import('./pages/ReviewWorkbench/ReviewExecute.vue'), meta: { title: '审查执行' } },
      { path: 'review/standards', name: 'ReviewStandards', component: () => import('./pages/ReviewWorkbench/Standards.vue'), meta: { title: '审查标准' } },
      { path: 'review/audit-trail', name: 'ReviewAuditTrail', component: () => import('./pages/ReviewWorkbench/AuditTrail.vue'), meta: { title: '审查追溯' } },

      // 管理工作台
      { path: 'manage', redirect: '/manage/dashboard' },
      { path: 'manage/dashboard', name: 'ManageDashboard', component: () => import('./pages/ManageWorkbench/Dashboard.vue'), meta: { title: '驾驶舱' } },
      { path: 'manage/alert', name: 'ManageAlert', component: () => import('./pages/ManageWorkbench/AlertHandle.vue'), meta: { title: '预警处置' } },
      { path: 'manage/rules', name: 'ManageRules', component: () => import('./pages/ManageWorkbench/RuleConfig.vue'), meta: { title: '规则配置' } },
      { path: 'manage/lists', name: 'ManageLists', component: () => import('./pages/ManageWorkbench/ListManage.vue'), meta: { title: '名单管理' } },
      { path: 'manage/knowledge', name: 'ManageKnowledge', component: () => import('./pages/ManageWorkbench/KnowledgeManage.vue'), meta: { title: '知识管理' } },
      { path: 'manage/workflow-config', name: 'ManageWorkflowConfig', component: () => import('./pages/ManageWorkbench/WorkflowConfig.vue'), meta: { title: '工单流程配置' } },
      { path: 'manage/workflow-monitor', name: 'ManageWorkflowMonitor', component: () => import('./pages/ManageWorkbench/WorkflowMonitor.vue'), meta: { title: '工单流转监控' } },
      { path: 'manage/quality', name: 'ManageQuality', component: () => import('./pages/ManageWorkbench/QualityManage.vue'), meta: { title: '质检管理' } },
      { path: 'manage/ops', name: 'ManageOps', component: () => import('./pages/ManageWorkbench/OpsManage.vue'), meta: { title: '运营管理' } },
      { path: 'manage/exit', name: 'ManageExit', component: () => import('./pages/ManageWorkbench/ExitCaseManage.vue'), meta: { title: '贷中清退' } },
      { path: 'manage/billing', name: 'ManageBilling', component: () => import('./pages/ManageWorkbench/BillingManage.vue'), meta: { title: '票据合同' } },
      { path: 'manage/rectify', name: 'ManageRectify', component: () => import('./pages/ManageWorkbench/Rectify.vue'), meta: { title: '溯源整改' } },

      // 消费者之家
      { path: 'consumer', redirect: '/consumer/complaints' },
      { path: 'consumer/complaints', name: 'ConsumerComplaints', component: () => import('./pages/ConsumerHome/MyComplaints.vue'), meta: { title: '我的投诉' } },
      { path: 'consumer/feedback', name: 'ConsumerFeedback', component: () => import('./pages/ConsumerHome/Satisfaction.vue'), meta: { title: '满意度评价' } }
    ]
  }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

router.beforeEach((to, _from, next) => {
  if (to.meta?.title) document.title = `${to.meta.title} - 消保投诉管理系统`

  // 未登录用户访问工作台 → 跳转到登录页
  if (to.path !== '/login') {
    let role: string | null = null
    try {
      role = localStorage.getItem('cp_user_role')
    } catch (e) {
      console.warn('[cp-router] read localStorage failed', e)
    }
    // eslint-disable-next-line no-console
    console.log('[cp-router] beforeEach', {
      to: to.fullPath,
      hasRole: !!role,
      role
    })
    if (!role) {
      console.warn('[cp-router] no role found, redirect to /login')
      return next({ path: '/login' })
    }
  }

  next()
})

export default router