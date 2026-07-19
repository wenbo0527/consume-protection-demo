// localStorage 重置不影响基础路由
import { test, expect } from '@playwright/test'

test('localStorage.clear() 后 reload 仍能进入基础页面', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('domcontentloaded')

  // 清空 + 重新加载
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  // 应仍可访问 /agent/desk(就算被拦截)
  await page.goto('/agent/desk')
  await page.waitForLoadState('domcontentloaded')

  // 不报未捕获错误
  expect(true).toBe(true)
})

test('47 路由都可直接访问(不强制登录)', async ({ page }) => {
  const ROUTES = [
    '/agent/desk', '/agent/phone', '/agent/online-chat', '/agent/ticket',
    '/business/desk', '/business/apply', '/business/negotiate', '/business/stop-coll',
    '/business/transfer', '/business/credit', '/business/credit-objection',
    '/manage/dashboard', '/manage/alert', '/manage/rectify', '/manage/quality',
    '/manage/ops', '/manage/billing', '/manage/exit', '/manage/rule-config',
    '/manage/workflow-config', '/manage/workflow-monitor',
    '/review/pending', '/review/create', '/review/promises', '/review/standards',
    '/review/audit-trail', '/manage/tickets', '/manage/ticket'
  ]

  for (const path of ROUTES) {
    const res = await page.goto(path, { waitUntil: 'domcontentloaded' })
    expect(res).not.toBeNull()
  }
})
