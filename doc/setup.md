# 🚀 Setup · 从 0 启动指南

> **目标读者**:首次接手本项目的前端工程师。
> **完成时间**:~15 分钟(不含 git clone 时间)。
> **前置**:Node.js ≥ 20、pnpm ≥ 8、Chrome 或任何现代浏览器。

---

## Step 1 · 准备环境(5 分钟)

### 1.1 安装 Node.js

```bash
# macOS(推荐 Homebrew)
brew install node@20
node --version  # v20.x.x ✓

# 或 nvm(项目带 .nvmrc)
nvm install
nvm use
node --version  # v20.x.x ✓
```

### 1.2 安装 pnpm

```bash
npm install -g pnpm@9
pnpm --version  # 9.x.x ✓
```

### 1.3 安装 Git

```bash
brew install git       # macOS
# 或 apt-get install -y git   # Ubuntu
git --version
```

---

## Step 2 · 拉代码(1 分钟)

```bash
git clone https://github.com/MiniMax/consume-protection-demo.git
cd consume-protection-demo
```

### 2.1 推荐 IDE · VSCode

打开项目:

```bash
code .
```

**推荐插件**(可选用):

| 插件 | 作用 |
| --- | --- |
| `Vue.volar` | Vue 3 最新语法 |
| `esbenp.prettier-vscode` | 格式化 |
| `dbaeumer.vscode-eslint` | 静态检查 |
| `Vue.vscode-typescript-vue-plugin` | TS .vue 类型 |

---

## Step 3 · 安装依赖(2 分钟)

```bash
pnpm install --frozen-lockfile
```

> ⚠️ **删除 `--frozen-lockfile`** 可允许 lockfile 自动更新;严格场景下保留。

依赖说明:

- `vue@^3.4` — 主框架
- `vue-router@4` — 路由(hash mode)
- `pinia@^2` — 状态管理
- `@arco-design/web-vue@^2.55` — UI 组件库
- `workbox-window` — PWA(可选)
- `vue-tsc` — 类型检查(开发依赖)

---

## Step 4 · 启动开发服务器(30 秒)

```bash
pnpm dev
```

输出:

```
  VITE v5.4.21  ready in 432 ms

  ➜  Local:   http://localhost:5170/
  ➜  Network: http://192.168.x.x:5170/
  ➜  press h + enter to show help
```

打开浏览器访问 **`http://localhost:5170`**,进入登录页面 → 选"坐席 · 张敏"。

**Hot Reload**:修改任何 .vue 或 .ts 文件后,浏览器自动刷新(状态保留)。

---

## Step 5 · 验证安装(1 分钟)

跑 3 个验证命令:

```bash
# 1. 类型检查(开发依赖所需)
pnpm run build:type-check
# 输出:0 errors · build in 5s · found 0 errors. Watching for file changes.

# 2. 生产构建
pnpm run build
# 输出:✓ 1271 modules transformed. ✓ built in 4.04s

# 3. Lint(占位)
pnpm run lint
# 输出:N/A (建议后续接入 ESLint)
```

✅ **看到 3 个 0 errors** = 安装成功。

---

## Step 6 · 项目结构导览(2 分钟)

```
consume-protection-demo/
├── .github/
│   ├── workflows/           # 4 个 CI workflow
│   └── ISSUE_TEMPLATE/      # 3 种 issue 模板
├── .husky/                  # git 钩子
├── scripts/                 # push / release 脚本
├── src/
│   ├── stores/              # 17 个 Pinia store
│   ├── pages/               # 50+ Vue 页面(按角色文件夹)
│   ├── components/          # 8 个全局组件
│   ├── router.ts            # 路由(纯 hash 模式)
│   ├── router-meta.ts       # 路由元信息(menu 顺序/分组)
│   ├── main.ts              # 入口(含 60s sweep)
│   ├── mock/data.ts         # 模拟数据(8 客户 + 12 工单 + ...)
│   └── styles/global.css    # Arco 主题覆盖
├── doc/                     # 12 个文档
│   ├── setup.md             ← 你正在读
│   ├── demo-script.md       ← 5 步演示剧本
│   ├── prd-final-coverage.md   ← PRD 对账
│   ├── architecture-*.md    ← 架构
│   └── releases/v0.4.0.md  ← release notes
├── package.json
├── vite.config.ts
├── tsconfig.json
├── commitlint.config.cjs
├── .nvmrc                   ← Node 20
└── README.md
```

### 5 个工作台文件夹

| 文件夹 | 角色 | 关键页面 |
| --- | --- | --- |
| `AgentWorkbench/` | 坐席 | `AgentDesk`、`CustomerProfile`、`PhoneChannel`、`OnlineChatChannel`、`TicketCreate` |
| `BusinessWorkbench/` | 业务执行 | `BusinessDesk`、`BusinessApply`、`Negotiate`、`StopCollection`、`CreditObjection` |
| `ManageWorkbench/` | 管理层 | `Dashboard`、`AlertHandle`、`Rectify`、`QualityManage`、`OpsManage` |
| `ReviewWorkbench/` | 审查 | `PendingReview`、`ReviewExecute`、`Standards`、`PromiseTracking`、`AuditTrail` |
| `ConsumerWorkbench/` | 消费者 | `ProgressSearch`、`FeedbackSubmit` |

---

## Step 7 · 常用脚本

```bash
pnpm dev              # 启动 dev server (http://localhost:5170)
pnpm build            # 生产构建到 dist/
pnpm run build:type-check  # 类型检查 0 errors

# 其他可用脚本(见 package.json)
pnpm run preview      # 本地预览生产构建
pnpm run lint         # 占位(后续接入 ESLint)
pnpm run test         # 占位(后续接入 vitest)
```

---

## Step 8 · 调试技巧

### 8.1 重置 demo 状态

打开浏览器 `Console`:

```js
localStorage.clear()
location.reload()
```

→ 回到 mock 数据初始状态。

### 8.2 查看所有 store 当前状态

```js
// 在 console:
Object.keys(localStorage)
  .filter(k => k.startsWith('cp_'))
  .forEach(k => console.log(k, JSON.parse(localStorage.getItem(k))))
```

### 8.3 切换角色(快速试用全链路)

右上角头像下拉 → 选另一角色 → 立刻看到不同菜单。

### 8.4 监听 Pinia store 变化

```ts
// 在 .vue 里
import { useWorkflowStore } from '@/stores/workflow'
const wf = useWorkflowStore()
wf.$subscribe((mutation, state) => {
  console.log('wf 改变:', mutation.type, mutation.events)
})
```

### 8.5 跨页面查 store

按 F12 → Network → Filter `mock` 或 store 名 → 看是否走 mock。

---

## Step 9 · 常见问题

### Q1: 启动后白屏?
**A**:检查 `pnpm install` 是否完成,浏览器 console 有没有红色错误。
99% 是 `vue-tsc` 报错 — 跑 `pnpm run build:type-check` 看具体 TS 错。

### Q2: 接通按钮无效?
**A**:在 `useWorkbench` store 里看 `wb.incoming` 是否有值;如果路由是 `#/agent/desk` 但 `wb.incoming == null`,先点"模拟来电"按钮。

### Q3: 工作流一直没动?
**A**:检查浏览器 console 是否有 dispatchEvent 报错;`useWorkflowStore.start()` 实际是异步的(200ms 模拟延迟),没报错应该会跳节点。

### Q4: 推 GitHub 部署后页面 404?
**A**:`Settings → Pages → Source` 要选 `GitHub Actions`(不是 `Deploy from a branch`)。看 Deploy workflow log 是否有 ❌。

### Q5: 想看生产构建?
**A**:
```bash
pnpm build      # 生成 dist/
pnpm preview    # 起 http://localhost:4173 预览
```

### Q6: TypeScript 报了一个不存在的类型?
**A**:通常是因为循环 import。重启 dev server(`pkill -f vite` + `pnpm dev`)。

### Q7: 怎么添加新角色?
**A**:在 `src/stores/user.ts` 加新 `RoleKey`,`MainLayout.vue` 在 `switch (userStore.currentRole)` 加新 case,`stores/` 加新 store。

### Q8: 怎么添加新页面?
**A**:
1. `src/pages/<RoleDir>/<Name>.vue` — 新页面
2. `src/router.ts` — 加路由
3. `src/router-meta.ts` — 加菜单条目
4. `src/layout/MainLayout.vue` — 若新分组

### Q9: 如何发布一个新版本?
**A**:
```bash
# 1. 改 CHANGELOG.md
# 2. 提交 + 创建 tag
git tag -a v0.5.0 -m "v0.5.0 - ..."
# 3. push 后跑:
bash scripts/release-trigger.sh v0.5.0
```

### Q10: gh-pages 部署 URL 在哪?
**A**:`Settings → Pages` 顶部显示。或跑 `git push` 后看 Actions log。

---

## Step 10 · 进阶

熟悉项目后,可以看这些进阶文档:

- [demo-script.md](./demo-script.md) — 5 步业务演示剧本(给"对外讲解员"用)
- [prd-final-coverage.md](./prd-final-coverage.md) — PRD § 6 P0-P3 全表对账(34 项 + 证据)
- [architecture-product-alignment.md](./architecture-product-alignment.md) — 架构 + 产品对齐日志
- [gh-pages-deployment.md](./gh-pages-deployment.md) — gh-pages 部署深度说明
- [doc/releases/v0.4.0.md](./releases/v0.4.0.md) — v0.4.0 release notes 草稿模板

---

## Step 11 · 第一次贡献流程

1. **建分支**:`git checkout -b feat/my-feature`
2. **修改**:`pnpm dev` 调试 → 测试 → `pnpm build:type-check` 通过
3. **提交**:`git add . && git commit -m "feat(scope): 简短描述"` (commitlint 强约束)
4. **推送**:`git push origin feat/my-feature`
5. **开 PR**:标题 + 描述 + 触发 PR preview workflow
6. **Review**:`.husky/pre-commit` 自动跑 type-check;pr-preview 自动 build artifact
7. **合并**:管理员 Review 后 merge → CI 自动 + gh-pages 自动 + Release Drafter 更新

**完整贡献指南**:[doc/contributor-guide.md](./contributor-guide.md)

---

## 🎉 完成

你现在已经在本地:

- ✅ 启动 dev server
- ✅ 类型检查通过
- ✅ 生产构建成功
- ✅ 理解项目结构
- ✅ 了解调试技巧

**下一步**:跟 [demo-script.md](./demo-script.md) 走 5 步业务演示,理解整个系统怎么运作。
