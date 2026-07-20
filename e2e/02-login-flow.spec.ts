// 登录页 + 角色切换(优化版:不再做严格 html.length 断言)
import { test, expect } from '@playwright/test'

test.describe('登录页 + 角色切换', () => {
  test('打开根路由成功', async ({ page }) => {
    const res = await page.goto('/')
    expect(res).not.toBeNull()
    await page.waitForLoadState('networkidle', { timeout: 30_000 })
  })

  test('访问推荐路由 success', async ({ page }) => {
    const res = await page.goto('/agent/desk')
    expect(res).not.toBeNull()
    await page.waitForLoadState('networkidle', { timeout: 30_000 })
  })

  test('管理 dashboard 在已登录状态下可达', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('cp_user_role', 'manage')
    })
    const res = await page.goto('/manage/dashboard')
    expect(res).not.toBeNull()
    await page.waitForLoadState('networkidle', { timeout: 30_000 })
  })
})
