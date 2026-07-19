import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ArcoVue from '@arco-design/web-vue'
import ArcoVueIcon from '@arco-design/web-vue/es/icon'
import { Message } from '@arco-design/web-vue'
import '@arco-design/web-vue/es/index.css'
import Root from './Root.vue'
import router from './router'
import './styles/global.css'

const app = createApp(Root)

/** 全局错误处理:P3-1 引入
 * 1) 同步错误(setup / render)→ errorHandler 收到
 * 2) 异步 promise 错误 → onUnhandledRejection 捕获
 * 3) 来源(log + 友好提示 + 上报占位)
 */
app.config.errorHandler = (err, instance, info) => {
  // eslint-disable-next-line no-console
  console.error('[cp-global-error]', info, err)
  Message.error(`应用错误:${(err as Error)?.message || err}`)
  // TODO: 上报到 sentry / 后端 metric
}

window.addEventListener('unhandledrejection', (e) => {
  // eslint-disable-next-line no-console
  console.error('[cp-global-error][unhandled-promise]', e.reason)
  Message.warning('后台任务出错,请刷新或重试')
  // TODO: 上报
})

app.use(createPinia())
app.use(ArcoVue)
app.use(ArcoVueIcon)
app.use(router)
app.mount('#app')