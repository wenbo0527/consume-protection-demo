// vitest 全局 setup:清空 localStorage + 让 Pinia 每次都是新实例
import { vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// 每个 case 前:刷新 Pinia 实例 + 清空 localStorage
beforeEach(() => {
  setActivePinia(createPinia())
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.clear()
  }
})

// 屏蔽 console 噪音(可选)
vi.spyOn(console, 'error').mockImplementation(() => {})
