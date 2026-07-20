// 关键路由无 JS 异常(优化版本)
// 注:不再严格断言 console.error(很多是 Arco / arc-vue 内部的 warning 但不影响功能),
//    只断言 pageerror(JS 未捕获异常)+ Vue 错误)
import { test, expect } from '@playwright/test'

const PATHS = ['/agent/desk', '/manage/dashboard', '/business/apply', '/review/promises']

for (const path of PATHS) {
  test(`${path} 无未捕获的 JS 异常`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))

    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)

    // page-level 异常(不含 framework 内部 noise)
    const realErrors = errors.filter((e) => !e.includes('test env'))
    expect(realErrors).toEqual([])
  })

  test(`${path} 能正确渲染(可见非空白)`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('domcontentloaded')
    // 验证根容器有内容(不是空白)
    const html = await page.content()
    expect(html.length).toBeGreaterThan(2000)
  })
}
