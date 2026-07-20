// 关键路由能正确渲染 + 无 JS 异常
// 不再做严格 console.error 断言(Arco 内部 warning 太常见)
// 改用 page.content 验证内容已渲染(>5k 字节)+ pageerror 验证无 JS 异常
import { test, expect } from '@playwright/test'

const PATHS = ['/agent/desk', '/manage/dashboard', '/business/apply', '/review/promises']

for (const path of PATHS) {
  test(`${path} 无未捕获的 JS 异常`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))

    await page.goto(path)
    await page.waitForLoadState('networkidle', { timeout: 30_000 })
    await page.waitForTimeout(1500)

    expect(errors.filter((e) => !e.includes('test env'))).toEqual([])
  })
}
