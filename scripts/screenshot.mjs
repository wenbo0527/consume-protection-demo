// DEMO 自动截图脚本
// 启动 dev server → 截每个 demo-script 里提到的关键路由 → 输出到 screenshots/
//
// 用法:
//   1) pnpm dev  (单独 terminal)
//   2) pnpm screenshot  (本脚本)
//
// 输出:
//   screenshots/<route-slug>.png   每张 1440x900
//   screenshots/index.json         列表 + 时间戳

import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const BASE = process.env.SCREENSHOT_URL || 'http://localhost:5170'
const OUT_DIR = path.resolve('screenshots')

const ROUTES = [
  { slug: 'login', path: '/' },
  { slug: 'agent-desk', path: '/agent/desk' },
  { slug: 'agent-phone', path: '/agent/phone' },
  { slug: 'agent-online-chat', path: '/agent/online-chat' },
  { slug: 'business-apply', path: '/business/apply' },
  { slug: 'business-stop-coll', path: '/business/stop-coll' },
  { slug: 'manage-dashboard', path: '/manage/dashboard' },
  { slug: 'manage-alert', path: '/manage/alert' },
  { slug: 'manage-quality', path: '/manage/quality' },
  { slug: 'manage-rectify', path: '/manage/rectify' },
  { slug: 'manage-billing', path: '/manage/billing' },
  { slug: 'manage-rule-config', path: '/manage/rule-config' },
  { slug: 'manage-workflow-monitor', path: '/manage/workflow-monitor' },
  { slug: 'review-pending', path: '/review/pending' },
  { slug: 'review-standards', path: '/review/standards' },
  { slug: 'review-promises', path: '/review/promises' },
  { slug: 'review-audit-trail', path: '/review/audit-trail' }
]

async function main() {
  if (!existsSync(OUT_DIR)) {
    await mkdir(OUT_DIR, { recursive: true })
  }
  console.log(`📸 Screenshot demo script`)
  console.log(`   Base URL: ${BASE}`)
  console.log(`   Output:   ${OUT_DIR}`)
  console.log(``)

  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()

  const results = []
  for (const { slug, path: route } of ROUTES) {
    const url = `${BASE}${route}`
    process.stdout.write(`  → ${slug} (${route}) ... `)
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 10_000 })
      // 等内容渲染
      await page.waitForTimeout(800)
      const file = path.join(OUT_DIR, `${slug}.png`)
      await page.screenshot({ path: file, fullPage: false })
      results.push({ slug, path: route, file, status: 'ok' })
      process.stdout.write(`✓\n`)
    } catch (e) {
      process.stdout.write(`✗ ${e.message}\n`)
      results.push({ slug, path: route, status: 'fail', error: String(e.message) })
    }
  }

  await browser.close()
  await import('node:fs/promises').then(fs => fs.writeFile(
    path.join(OUT_DIR, 'index.json'),
    JSON.stringify(results, null, 2)
  ))

  const ok = results.filter(r => r.status === 'ok').length
  console.log(``)
  console.log(`✅ ${ok} / ${results.length} screenshotted`)
  console.log(`📁 screenshots/  (含 index.json)`)
}

main().catch(e => {
  console.error(`❌ ${e.message}`)
  process.exit(1)
})
