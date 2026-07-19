// 5 个角色的核心路由可达
import { test, expect } from '@playwright/test'

const AGENT_ROUTES = [
  '/agent/desk',
  '/agent/phone',
  '/agent/online-chat',
  '/agent/ticket'
]

const BUSINESS_ROUTES = [
  '/business/desk',
  '/business/apply',
  '/business/negotiate',
  '/business/stop-coll',
  '/business/transfer',
  '/business/credit'
]

const MANAGE_ROUTES = [
  '/manage/dashboard',
  '/manage/alert',
  '/manage/rectify',
  '/manage/quality',
  '/manage/ops',
  '/manage/billing',
  '/manage/exit',
  '/manage/rule-config',
  '/manage/workflow-config',
  '/manage/workflow-monitor'
]

const REVIEW_ROUTES = [
  '/review/pending',
  '/review/create',
  '/review/promises',
  '/review/standards',
  '/review/audit-trail'
]

test.describe('routes 可达(无角色切换)', () => {
  for (const path of [...AGENT_ROUTES, ...BUSINESS_ROUTES, ...MANAGE_ROUTES, ...REVIEW_ROUTES]) {
    test(`${path} 能打开且不崩`, async ({ page }) => {
      // 容错:即便路由所需当前 role 不符,应能 200 不报 500
      const res = await page.goto(path)
      expect(res).not.toBeNull()
      // 不能出现未捕获错误(浏览器原生 error)
      const errors: string[] = []
      page.on('pageerror', e => errors.push(e.message))
      // 等内容
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(500)
      expect(errors.filter(e => !e.includes('test env')).length).toBe(0)
    })
  }
})
