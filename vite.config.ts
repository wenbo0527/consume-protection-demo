import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// gh-pages 部署:GitHub Pages 会把项目放在 https://<org>.github.io/<repo>/
// 自动通过 VITE_BASE 环境变量传入(默认 '/')
const basePath = process.env.VITE_BASE || (process.env.GITHUB_ACTIONS ? '/consume-protection-demo/' : '/')

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5170,
    strictPort: true
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  },
  base: basePath
})
