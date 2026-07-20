import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// gh-pages 部署:GitHub Pages 会把项目放在 https://<org>.github.io/<repo>/
// 自动通过 VITE_BASE 环境变量传入(默认 '/')
const basePath = process.env.VITE_BASE || (process.env.GITHUB_ACTIONS ? '/consume-protection-demo/' : '/')

/**
 * Vite dev server 中间件:所有响应强制 no-cache。
 *
 * 背景:Chrome 等浏览器会缓存 SPA 的 index.html,即使 chunk hash 已变。
 * 当用户从"另一个 host"(如 https://internal.example/)切到本机 dev URL 时,
 * 浏览器仍会从缓存取出旧 index.html 并按其内嵌 hash 去找 chunk,
 * 形成 "Failed to fetch dynamically imported module" 类错。
 *
 * 此中间件给 dev server 的所有响应打 `Cache-Control: no-store`,让浏览器:
 *   - 不缓存任何中间产物
 *   - 用户硬刷新即可立即看到最新 chunk
 */
function noCacheMiddleware(req, res, next) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  next()
}

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5170,
    strictPort: true,
    // 开发服务器插入 no-cache middleware,避免浏览器缓存 old SPA chunk hash。
    // 注:此配置仅 dev server 生效,生产 build 仍由 vite 自身的 hash + long cache 配合。
    // 通过 configureServer 钩子注入,确保早于 vue 插件
    configureServer(server) {
      server.middlewares.use(noCacheMiddleware)
    }
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  },
  base: basePath
})
