// 关键路由无 console error
import { test, expect } from '@playwright/test'

const PATHS = ['/agent/desk', '/manage/dashboard', '/business/apply', '/review/promises']

for (const path of PATHS) {
  test(`${path} 无未捕获错误`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('test env')) {
        errors.push(msg.text())
      }
    })

    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)

    // 过滤 noise(常见的 Arco 内部 warning / network 错误等)
    const realErrors = errors.filter(
      (e) =>
        !e.includes('Vue Devtools') &&
        !e.includes('Download the Vue Devtools') &&
        !e.includes('socket.io') &&
        !e.includes('manifest')
    )
    expect(realErrors.length).toBe(0)
  })
}
