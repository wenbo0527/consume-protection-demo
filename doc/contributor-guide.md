# 🤝 Contributor Guide · 贡献指南

> 给想贡献代码的开发者。读完这份文档,你应该能在 5 分钟内知道"怎么提一个 PR"。

---

## 1. Git 工作流

### 1.1 分支策略

```
main     ←─── 发布保护分支(只能从 release/* merge)
develop  ←─── 日常集成分支(默认分支)
release/vX.Y.Z ←─── 版本归档分支
feat/<scope>   ←─── 你的工作分支
fix/<scope>    ←─── Bug 修复分支
chore/<scope>  ←─── 工程性分支(doc / ci / refactor)
```

### 1.2 开发流程

```bash
# 1. 同步 develop
git checkout develop
git pull origin develop

# 2. 切新分支
git checkout -b feat/my-feature

# 3. 开发(Hot Reload 自动验证)
pnpm dev

# 4. 提交(commitlint + Husky 自动校验)
git add .
git commit -m "feat(cart): 加购物车规格切换"

# 5. 推送 + 开 PR
git push origin feat/my-feature
# 浏览器自动打开 GitHub PR 创建页
```

### 1.3 紧急修复

```bash
# 直接从 main 切 hotfix 分支
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug
# ...
# 修完后开 PR to main(自动触发紧急发布)
```

---

## 2. 提交规范(commitlint 强制)

格式:

```
<type>(<scope>): <subject>
```

**type**(必填,枚举):

| type | 用途 | 触发版本 |
| --- | --- | --- |
| `feat` | 新功能 | minor |
| `fix` | 修 Bug | patch |
| `chore` | 工程性(无产品改动) | patch |
| `docs` | 纯文档 | patch |
| `style` | 格式(无逻辑) | patch |
| `refactor` | 重构(无功能变化) | patch |
| `perf` | 性能优化 | patch |
| `test` | 测试 | patch |
| `ci` | CI workflow | patch |
| `arch` | 架构变更 | minor |

**scope**(选填):`role` 或 `module`

- `feat(customer-profile): 加风险弹屏`
- `fix(workflow): 解决 SLA 超时不刷新`
- `chore(release): 加 release-drafter`

**subject**(必填):50 字符以内,"说明 + 动机"

✅ `feat(sla): 加超时自动归档`
❌ `update` / `修复 bug` / `feat: 一些改动`

### 2.1 commitlint 校验失败怎么办?

```bash
# 临时跳过钩子(不推荐)
git commit -m "..." --no-verify

# 修正消息重提(推荐)
git commit -m "feat(real): 中文 / English ok" -S
```

---

## 3. PR 模板

PR 创建时会自动加载模板。

### 3.1 模板要求

```markdown
## 改动描述
(1-3 句话说明做了什么)

## 关联 Issue
- close #123
- (or) 关联但不 close #456

## 截图(可选)
(对 UI 改动贴 1-2 张图)

## 自检清单
- [ ] pnpm run build:type-check 通过
- [ ] pnpm dev 自测新功能
- [ ] 已有功能未破坏
- [ ] 文档已更新(若改了行为)

## 类型

- [ ] Bug 修复
- [ ] 新功能
- [ ] 重构
- [ ] 文档
- [ ] CI/CD
```

### 3.2 PR Preview 自动触发

每开个 PR, [.github/workflows/pr-preview.yml](../../.github/workflows/pr-preview.yml) 会:
- 自动跑 `pnpm build`
- 上传 artifact(7 天有效)
- 在 PR 底部评论预览状态

下载 artifact → 解压 → `python -m http.server` 即可本地预览。

### 3.3 Review 流程

- 至少 1 个 maintainer review 通过
- 所有 conversation 解决
- CI 全绿

---

## 4. Issue 模板

3 种 issue 模板:[bug_report](../../.github/ISSUE_TEMPLATE/bug_report.md) · [feature_request](../../.github/ISSUE_TEMPLATE/feature_request.md) · [arch_review](../../.github/ISSUE_TEMPLATE/arch_review.md)。

### 4.1 Bug 报告

请贴:

1. 复现步骤
2. 预期 vs 实际
3. 浏览器 + 操作系统
4. 截图 / Console 错误

### 4.2 Feature 请求

请贴:

1. 用户故事(谁是用户,他们想做什么)
2. 验收标准(可量化)
3. P0/P1/P2 优先级(参考 PRD § 6)

### 4.3 架构评审

请贴:

1. 当前架构图(可 ASCII)
2. 痛点
3. 提议方案 + 利弊

---

## 5. 代码风格

### 5.1 命名约定

```
文件名:        kebab-case 或 PascalCase(Vue 强制 PascalCase)
变量/函数:     camelCase
常量/枚举:     UPPER_CASE 或 PascalCase(枚举)
类型/接口:     PascalCase
组件:          PascalCase
store:         defineStore('xxxStore', ...)
方法/事件:     handleXxx / onXxx
生命周期钩子:  onXxx
```

### 5.2 文件结构

```
.vue:
<template>
  ...
</template>

<script setup lang="ts">
  import { ... } from 'vue'
  import { ... } from '@/stores/...'

  const router = useRouter()
  const myStore = useMyStore()

  // 状态
  const state = ref(initialState)

  // 计算
  const computedThing = computed(() => ...)

  // 监听
  watch(thing, () => ...)

  // 生命周期
  onMounted(() => ...)

  // 方法
  function doSomething() { ... }

  // 副作用暴露(无需)
</script>

<style scoped>
  /* 组件级样式 */
</style>
```

### 5.3 TypeScript

- ✅ strict: true(强制)
- ✅ 所有 props / emit 用 `defineProps<T>()` / `defineEmits<T>()`
- ❌ 禁止 `any`(用 `unknown` + 类型守卫代替)
- ❌ 禁止 `@ts-ignore`(用 `as unknown as T` 显式转换)

### 5.4 Pinia store 写法

```ts
import { defineStore } from 'pinia'

export const useXxxStore = defineStore('xxx', {
  state: () => ({
    items: []
  }),
  getters: {
    count: (s) => s.items.length
  },
  actions: {
    add(item: Item) {
      this.items.push(item)
    }
  }
})
```

> 我们用 options style(不是 setup style),便于阅读和持久化。

---

## 6. 测试与验证

### 6.1 提交前的"三件套"

```bash
pnpm run build:type-check    # 1. 类型必须 0 error
pnpm build                   # 2. 构建必须成功
pnpm dev                     # 3. 自测功能正常
```

### 6.2 自动测试(尚无,推荐后续加)

未来 v0.5+ 计划接入 `vitest`,覆盖:
- workflow 状态机
- instruction 通知
- tagRule 联动
- compliancePromise 超时

> 写测试时,`*.test.ts` 与源文件同目录。

---

## 7. 文档贡献

项目文档位于 `doc/`。

### 7.1 何时加新文档?

| 触发 | 新增 |
| --- | --- |
| 新页面类型页(OP-FIX 块做完后) | 更新 `prd-final-coverage.md` |
| 新增 architecture 决策 | 更新 `architecture-product-alignment.md` |
| 新增业务模式/演示 | 加到 `demo-script.md` |
| 新 commit | 跟 `CHANGELOG.md` |

### 7.2 文档规范

- 使用 `## / ### / ####`(最多 4 级)
- 代码块用语言标签 ` ```ts ` / ` ```bash ` / ` ```vue `
- 链接用相对路径(`./demo-script.md`)便于本地阅读

---

## 8. 常见错误

### 8.1 修改了 router.ts 忘了同步 router-meta.ts

```ts
// router.ts 有:
{ path: 'foo', component: () => import('./pages/Foo.vue') }
// router-meta.ts 也要加:
{ path: 'foo', title: 'Foo', showInMenu: true, menuParent: 'X', menuOrder: N }
```

否则页面不显示菜单。

### 8.2 store 之间互相 import

```ts
// ❌ 循环 import
import { useAStore } from './a'
export const useBStore = defineStore('b', {
  state: () => ({})
  // ...
})

// ✅ 在 action 内调用
export const useBStore = defineStore('b', {
  actions: {
    someAction() {
      const a = useAStore()  // 在 action 内动态 import 是 OK 的
    }
  }
})
```

### 8.3 不小心直接修改 mock data

```ts
// ❌ mock/data.ts 应该是 const
import { customers } from '@/mock/data'
customers[0].name = 'xx'  // 会污染整个 demo

// ✅ 通过 store 改
import { useCustomerStore } from '@/stores/customer'
customerStore.update(...)
```

### 8.4 中文 commit

commit 主题可以用中文,但 commitlint 通过(ascii 范围)。

### 8.5 role key 写错

```ts
import { RoleKey } from '@/stores/user'

const r: RoleKey = 'review'    // ✅
const r: RoleKey = 'Reviewer'  // ❌ TS 编译失败
```

`RoleKey` 已存在 `['agent' | 'business' | 'review' | 'manage' | 'consumer']`,新增角色先在 `user.ts` 改这个联合类型。

---

## 9. 仓库角色

| 角色 | 权限 |
| --- | --- |
| **maintainer** | merge main / 创建 release tag |
| **reviewer** | 强制 1 个人 review 才能 merge |
| **contributor** | 开 PR / 写 issue |

---

## 10. 一句话清单

✅ 跑 `pnpm dev` 自测 · ✅ type-check 通过 · ✅ commitlint 通过 · ✅ PR 有复现步骤 + 截图 · ✅ Reviewer 通过

→ merge → release 自动。

---

需要其他说明吗?建议:
- 详细看下 [architecture-product-alignment.md](./architecture-product-alignment.md) — 了解为何本项目是这样设计
- 跟 [demo-script.md](./demo-script.md) 走一遍 5 步 — 理解系统怎么运作
- 对比 [prd-final-coverage.md](./prd-final-coverage.md) — 看每个 commit 对应哪个 PRD 缺口
