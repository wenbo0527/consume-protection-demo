// X6 v3.1.7 setZIndex 强保留补丁(独立模块,避免被 tree-shake 删掉)
//
// 为什么需要这个文件:
//  X6 v3.1.7 在 vite+rollup 构建时,Cell.prototype.setZIndex 方法被 minify 删掉。
//  X6 内部还有 `cell.setZIndex(...)` 的调用,运行时就 "is not a function" 错误。
//
// 解法原理:
//  1. 顶层 import Cell 类(从 X6 顶层),让 rollup 把 Cell 类完整打进 chunk
//  2. 在 prototype 上挂一个真实可执行的 setZIndex 方法
//  3. 这个模块被 WorkflowStateCanvas.vue/V2.vue 各 import 一次
//  4. 由于方法体内引用了 this.store 等属性,rollup 视为有副作用,会保留整个方法
//
// 同时,这个 polyfill 不依赖 X6 内部 API,即便 X6 重构也照样工作。

import { Cell } from '@antv/x6'

// 防止 Cell 未定义(X6 改名时 fallback 留口子)
const _Cell: any = (Cell as any) || {}

if (_Cell && _Cell.prototype) {
  // 只有当 setZIndex 不存在时才装(X6 修复后就不会重复装)
  if (typeof _Cell.prototype.setZIndex !== 'function') {
    _Cell.prototype.setZIndex = function setZIndex(
      this: any,
      z: number,
      options: Record<string, unknown> = {}
    ) {
      if (this.store && typeof this.store.set === 'function') {
        this.store.set('zIndex', z, options)
      }
      return this
    }
    // 同步 hasZIndex/removeZIndex 也装上(它们也调 setZIndex 链)
    if (typeof _Cell.prototype.removeZIndex !== 'function') {
      _Cell.prototype.removeZIndex = function removeZIndex(
        this: any,
        options: Record<string, unknown> = {}
      ) {
        if (this.store && typeof this.store.remove === 'function') {
          this.store.remove('zIndex', options)
        }
        return this
      }
    }
    // eslint-disable-next-line no-console
    console.info('[cp-x6-preserve] setZIndex/removeZIndex polyfill installed (X6 v3.1.7 tree-shake fix)')
  }
}

export default _Cell
