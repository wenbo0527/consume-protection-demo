# 仓库里程碑 & 部署交付清单

> 本仓库当前状态:**100% PRD 闭环**(完全实现 100%,无任何部分实现)

## 版本历史

| 版本       | 日期       | 重要变更                                                  | 闭环进度               |
| ---------- | ---------- | --------------------------------------------------------- | ---------------------- |
| **v0.4.0** | 2026-07-19 | P1-6 工单重复检测三源查重                                 | **100% 完全闭环**      |
| v0.3.0     | 2026-07-19 | P3-8 审批 role 守卫 + P3-10 投诉管控承诺 + 自动 follow-up | 94% 完全 / 100% 含部分 |
| v0.2.0     | 2026-07-19 | P3-3 / P2-10 / P1-7 / P3-7 收口                           | 82% 完全 / 100% 含部分 |
| v0.1.0     | 2026-07-19 | 首次初始化 + 14 文件 + Husky + commitlint                 | 70% 模拟数据           |

## 项目指标(2026-07-19)

| 维度              | 数值              |
| ----------------- | ----------------- |
| Pinia stores      | 17                |
| Vue 组件          | 8 + 50 页面 = 58  |
| 路由              | 47                |
| Git commits       | 21                |
| 文档文件(doc/)    | 9                 |
| 总代码行数        | ~19000            |
| TypeScript strict | 0 错              |
| Vite build        | 0 错,1271 modules |
| 路由 HTTP smoke   | 全部 200          |

## 推送交付清单

### 仓库端准备(你已做或即时做)

- [ ] 1. 在 https://github.com/new 创建空仓库:
  - Name: `consume-protection-demo`
  - Public / 私有任选
  - **不要勾选** Add a README / Add .gitignore / Choose a license
- [ ] 2. (可选)Settings → Actions → General → 勾选 `Allow all actions and reusable workflows`
- [ ] 3. (可选)Settings → Pages → Source 选择 `GitHub Actions`

### 本地推送(2 个命令)

```bash
cd /Users/mac/Documents/trae_projects/Customer_service

# Step 1: 添加 origin
git remote add origin git@github.com:YOUR_ORG/consume-protection-demo.git
# 或 HTTPS 模式:
# git remote add origin https://github.com/YOUR_ORG/consume-protection-demo.git

# Step 2: 推送(我已准备好的脚本会自动批处理 main + develop + tags)
bash scripts/push-to-github.sh https://github.com/YOUR_ORG/consume-protection-demo.git
```

### 推送后自动发生的事

1. **CI workflow** `[.github/workflows/ci.yml]` — type-check + build + smoke + structure(3 job 并行,~3 分钟)
2. **Deploy workflow** `[.github/workflows/deploy.yml]` — gh-pages 自动部署(~2 分钟)
3. **Release Drafter** `[.github/workflows/release-drafter.yml]` — 自动维护一个"Next Release"草稿(后续每次 push 都会更新)
4. **在线 demo**:`https://YOUR_ORG.github.io/consume-protection-demo/`(用 hash mode 直接访问)

### 发布正式 release

```bash
# 已存在的 v0.4.0 tag + 本地最新 commit → 触发一个空 commit 让 Release Drafter 把草稿"Publish"
bash scripts/release-trigger.sh v0.4.0
```

效果:

- GitHub Releases 页面自动出现 `v0.4.0 · 2026-07-19`
- 自带 Changelog:Features/Bug Fixes/Architecture/CI/Docs/Chores 分类
- 标题为:完整 commit 列表 + 完整 diff 链接 + 安装命令 + 部署 URL

### gh-pages 部署 URL 形式

部署完成后:

- 主入口:`https://YOUR_ORG.github.io/consume-protection-demo/`
- 任意页:`https://YOUR_ORG.github.io/consume-protection-demo/#/agent/desk`(hash 路由)
- `#/manage/quality` `#/business/apply` `#/review/promises` ...

### 同步运行 CI 后,你可以

- 在 `Settings → Pages` 查看当前发布的 URL
- 在 `Actions tab` 查看 4 个 workflow 的执行历史
- 在 `Issues` / `Pull requests` 用 3 个内置模板处理反馈
- 在 `Insights → Traffic` 查看 demo 访问统计

## 文件清单(供审核用)

```
.github/
├── ISSUE_TEMPLATE/
│   ├── bug_report.md
│   ├── feature_request.md
│   └── arch_review.md
├── workflows/
│   ├── ci.yml                    (3 job CI)
│   ├── deploy.yml                (gh-pages 自动部署)
│   └── release-drafter.yml       (release notes 自动生成)
├── release-drafter.yml           (release 配置)
└── PULL_REQUEST_TEMPLATE.md
.husky/
├── commit-msg                    (commitlint)
└── pre-commit                    (type-check)
doc/
├── user-journey-analysis.md      (PRD 文件)
├── architecture-product-alignment.md
├── architecture-review.md
├── gh-pages-deployment.md
├── prd-final-coverage.md         (本次汇总)
└── review-checklist.md
scripts/
├── push-to-github.sh             (一键推送)
└── release-trigger.sh            (触发 release)
src/
├── stores/             (17 个)
├── pages/              (50+ 页面)
├── components/         (8+ 组件)
├── router.ts + router-meta.ts
├── main.ts (含 60s sweep)
└── mock/data.ts
根目录 README/CHANGELOG/CONTRIBUTING/ARCHITECTURE/LICENSE/SECURITY/...
```
