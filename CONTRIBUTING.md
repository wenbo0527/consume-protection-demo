# Contributing · 贡献指南

感谢你对这个项目的关注。本指南说明如何提 Issue、做修改、提交 PR。

## 🐛 提 Issue 之前

**搜索一下**:在提之前先搜 [Issues](../../issues),看是否已有类似话题。

## 📝 提 Issue

本项目提供 3 种 Issue 模板:

| 类型        | 模板                 | 适用场景                     |
| ----------- | -------------------- | ---------------------------- |
| Bug 报告    | `bug_report.md`      | 跑不通、报错、行为异常       |
| 功能请求    | `feature_request.md` | 新页面 / 新 store / 新能力   |
| 架构 review | `arch_review.md`     | 数据归属、模块边界、类型安全 |

请选用**最匹配**的模板,缺失信息会影响 review。

## 🛠️ 本地开发

```bash
# 1. Fork & clone
git clone https://github.com/<your-username>/consume-protection-demo.git
cd consume-protection-demo

# 2. 安装依赖
pnpm install

# 3. 跑开发服务器
pnpm dev

# 4. 验证(等价于 CI)
pnpm ci
```

## 🌿 分支策略

| 分支                | 用途                                 |
| ------------------- | ------------------------------------ |
| `main`              | 主分支,CI 必须通过                   |
| `develop`           | 开发分支                             |
| `feature/<name>`    | 新功能(如 `feature/quality-mgmt`)    |
| `release/<version>` | 发布分支                             |
| `fix/<name>`        | Bug 修复(如 `fix/sim-history-empty`) |

## 📤 提交规范

推荐 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/):

```
feat(scope): 新功能描述
fix(scope): 修复描述
refactor(scope): 重构描述
docs(scope): 文档
chore: 杂项
```

示例:

```
feat(quality): 添加"质检与整改联动"闭环
fix(notification): 修正 dismissToast 误删 {
docs(arch): 更新架构 review 文档
```

## 🔍 提交之前

确保通过以下检查:

```bash
pnpm lint:no-emit   # TS strict 必须 0 错
pnpm build           # 类型 + 构建必须通过
```

涉页路由手动过一遍(本地跑 `pnpm preview`)。

## 📋 PR 流程

1. **创建分支**:`git checkout -b feature/xxx`
2. **提交 + 推**:`git push origin feature/xxx`
3. **发起 PR**:在 GitHub 上点击 "Compare & pull request"
4. **填写 PR 模板**(见 `.github/PULL_REQUEST_TEMPLATE.md`)
5. **CI 通过 + 至少一个 reviewer 批准**后合并

## 🏗️ 架构 PR 特别注意

如果改动涉及以下内容,请补充说明:

- [ ] **数据归属收敛**:之前是否直接 mutate mock 数组?
- [ ] **跨 store 写入**:是否走了 `useXxxStore().action()` 而不是监听事件?
- [ ] **事件名新引入**:是否在 `constants/events.ts` 中定义?

CI 的 `structure` job 会自动检查:

- 不允许在 `constants/events.ts` 之外直接用 `'cp-...'` 字符串
- 业务代码不允许 console.log 残留过多
- store 数量下限

## 📄 文档维护

如果改动涉及:

- 路由/菜单 → 同步 `router-meta.ts` 与本 README 的"路由"段
- 全局事件名 → 同步 `constants/events.ts` 与 `ARCHITECTURE.md § 6`
- 工具函数 → 同步 `utils/workflow-helpers.ts` 的导出注释
- 持久化 key → 在 `ARCHITECTURE.md § 7` 加上

## 🙋 提问

如果你对架构 / 改进有疑问,直接开 Issue 讨论,不必先写代码。
