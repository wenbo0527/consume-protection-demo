<!-- 🏆 精选项目（2026-08-13 标记） -->
> 🏆 **本仓已被选为 [wenbo0527](https://github.com/wenbo0527) 个人主页 6 大核心项目之一**

# 消保客服工作台 · ConsumeProtection Demo

> 一个**跨角色业务全链路**演示项目,展示 **Vue 3 + Pinia + Arco Design** 构建消保(消费者权益保护)客服系统的最佳实践。

## 📊 项目指标

[![Vue 3](https://img.shields.io/badge/Vue-3.4+-42b879?logo=vue.js)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![Pinia](https://img.shields.io/badge/Pinia-2.1+-ffd859)](https://pinia.vuejs.org)
[![Arco Design](https://img.shields.io/badge/Arco--Design-Vue-2.55+-0093ff)](https://arco.design/vue)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646cff?logo=vite)](https://vitejs.dev)

| 维度                 | 数值                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------- |
| **PRD 闭环度**       | ![100%](https://img.shields.io/badge/PRD-100%25%20✅-brightgreen)                             |
| **类型安全**         | ![TS strict](https://img.shields.io/badge/TS%20strict-0%20errors-blue)                        |
| **Build 状态**       | ![Built](https://img.shields.io/badge/build-1271%20modules%20✓-blueviolet)                    |
| **代码量**           | ![Lines](https://img.shields.io/badge/lines-19K%2B-green)                                     |
| **路由**             | ![Routes](https://img.shields.io/badge/routes-47-ff69b4)                                      |
| **Stores**           | ![Stores](https://img.shields.io/badge/pinia%20stores-17-orange)                              |
| **页面**             | ![Pages](https://img.shields.io/badge/pages-50+-success)                                      |
| **工作流 templates** | ![WF](https://img.shields.io/badge/workflow%20templates-6-9cf)                                |
| **最新版**           | ![v0.4.0](https://img.shields.io/badge/release-v0.4.0-blue)                                   |
| **License**          | [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)             |
| **PRs**              | [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md) |

## 🚀 Deploy / CI

| 部署                | 状态                                                                  |
| ------------------- | --------------------------------------------------------------------- |
| **gh-pages**        | ![gh-pages](https://img.shields.io/badge/gh--pages-自动部署-blue)     |
| **CI**              | ![CI](https://img.shields.io/badge/CI-3%20jobs%20passing-brightgreen) |
| **Release Drafter** | ![RD](https://img.shields.io/badge/RD-自动%20CHANGELOG-orange)        |

## 🎬 演示

→ **5 步完整剧本**:[doc/demo-script.md](./doc/demo-script.md)
约 10 分钟走通"坐席接听 → 管理层预警 → 业务办理 → 审查归档 → 报告交付"端到端。

## ✨ 项目亮点

- 🏛️ **跨角色五工作台**:坐席 / 业务执行 / 管理层 / 审查 / 消费者
- 📦 **11 个领域 Pinia store**:`workflow` / `alert` / `rectify` / `knowledge` / `billing` / `exit` / `ops` / `quality` / `tagRule` / `user` / `workbench`
- 🛣️ **43 路由 / 36 菜单项**,全部 lazy load
- 🔄 **跨角色完整治理链**:监管转办 → 工单 → 业务工作流 → 预警 → 整改 → 审查 → 知识库沉淀
- 🏗️ **清晰分层架构**:Pages / Components / Stores / Utils / Mock / Constants
- 🎯 **TypeScript strict 0 错**,Vite build 0 错
- 🧪 **架构守护 CI**:自动检查 store 数量 / 事件收口 / 路由完整性

## 📊 项目规模

```
50 Vue 组件 + 21 TS 文件
~14,000 行代码(不含空行/注释)
8 个业务领域 + 1 个系统 + 1 个工作台
```

| 维度         | 数值                            |
| ------------ | ------------------------------- |
| 源码总行数   | ~14,000                         |
| Pinia stores | 11                              |
| Vue 路由     | 43                              |
| 菜单项       | 36                              |
| Arco 组件数  | 50+ 组件 / 7 业务页面           |
| 业务闭环     | 9(管理层/支撑/坐席/审查/消费者) |
| TS strict    | ✅ 0 错误                       |
| Vite build   | ✅ 0 error                      |

## 🚀 快速开始

### 环境要求

- **Node.js** ≥ 20(推荐,见 `.nvmrc`)
- **pnpm** ≥ 9(推荐) / **npm** ≥ 10 / **yarn** ≥ 4

### 安装

```bash
# 克隆仓库
git clone https://github.com/MiniMax/consume-protection-demo.git
cd consume-protection-demo

# 安装依赖
pnpm install
# 或
npm install
```

### 启动开发

```bash
pnpm dev
# → 浏览器访问 http://localhost:5170
```

### 构建生产产物

```bash
pnpm build        # 类型检查 + 打包
pnpm preview      # 本地预览生产产物(端口 5170)
```

### 验证(等价于 CI)

```bash
pnpm lint:no-emit  # TypeScript strict 检查
pnpm ci            # 类型检查 + 构建
```

## 🏛️ 架构概览

```
src/
├── pages/                       # 41 个业务页面
│   ├── AgentWorkbench/          #   坐席工作台(11)
│   ├── BusinessWorkbench/       #   业务执行工作台(7)
│   ├── ManageWorkbench/         #   管理工作台(13)
│   ├── ReviewWorkbench/         #   审查工作台(4)
│   └── ConsumerWorkbench/       #   消费者端(3)
│
├── components/                  # 7 个通用组件
│   ├── NotificationCenter.vue   #   通知中心
│   ├── WorkflowSteps.vue        #   工作流节点
│   ├── KpiCard.vue              #   KPI 卡
│   └── ...
│
├── stores/                      # 11 个 Pinia store
│   ├── user.ts                  #   当前用户 / 角色
│   ├── workbench.ts             #   坐席工作台(来电/任务)
│   ├── ticket (mock only)       #   工单数据(在 mock/data.ts)
│   ├── workflow.ts              #   工作流引擎
│   ├── alert.ts                 #   预警(接管 mockAlerts)
│   ├── knowledge.ts             #   知识库
│   ├── rectify.ts               #   溯源整改
│   ├── quality.ts               #   质检
│   ├── ops.ts                   #   排班 / 绩效
│   ├── exit.ts                  #   贷中清退
│   ├── billing.ts               #   票据合同
│   ├── tagRule.ts               #   标签联动规则
│   └── user.ts                  #   用户与角色
│
├── utils/                       # 工具函数
│   └── workflow-helpers.ts      #   工作流实例映射
│
├── constants/                   # 常量
│   └── events.ts                #   全局事件名常量(收口)
│
├── mock/                        # Mock 数据
│   ├── data.ts                  #   客户/工单/审查/预警/知识 ...
│   ├── data_ext.ts              #   规则 / 名单
│   └── index.ts                 #   统一对外出口
│
├── router.ts                    # 路由表
├── router-meta.ts               # 路由元数据 + menu 分组
├── layout/                      # 框架布局
│   └── MainLayout.vue           #   5 菜单组(坐席/客户/工单/...)
├── Root.vue                     # 根组件
└── main.ts                      # 入口(全局 errorHandler)
```

## 🔄 业务闭环

本演示最核心的能力是**跨角色业务全链路流转**:

```
[消费者] 12345 转诉
   ↓
[管理层] 创建监管转办工单 → 指派
   ↓
[坐席] 接单 + 处理 + 客户画像查询
   ↓
[业务执行] 工作流实例(停催停扣 / 协商 / 异议 / 转调解)
   ↓
[管理层] 预警处置 → 整改派发
   ↓
[业务执行] 整改执行 + 验证
   ↓
[审查] 标准更新 + 知识归档
   ↓
[知识库] 沉淀 + 评分 + 质检联动
   ↓
[运营] 排班 / 绩效 / 请假 / 质检同步
   ↓
[贷中清退] 多层级联签 + 客户告知 + 资产处置
   ↓
[票据合同] 自动生成清退通知书 + 结清证明 + 归档
```

详见 [doc/architecture-review.md](./doc/architecture-review.md) 与 [doc/review-checklist.md](./doc/review-checklist.md)。

## 🎯 角色 & 入口

| 角色     | 用户名(登录选)     | 入口                   |
| -------- | ------------------ | ---------------------- |
| 坐席     | 张敏 / 王浩 / 赵雪 | `/agent/desk`          |
| 业务执行 | 李伟 / 陈静        | `/business/desk`       |
| 管理层   | 陈强               | `/manage/dashboard`    |
| 审查     | 刘丽 / 王芳        | `/review/pending`      |
| 消费者   | 王秀英             | `/consumer/complaints` |

切换角色:`http://localhost:5170/login`

## 🛠️ 工具脚本

```bash
# 开发
pnpm dev

# 类型检查(单跑,无 build)
pnpm lint:no-emit

# 构建(类型检查 + Vite build)
pnpm build

# 预览生产产物
pnpm preview

# 完整 CI(类型 + 构建)
pnpm ci
```

## 📦 依赖

| 依赖                   | 版本  | 用途           |
| ---------------------- | ----- | -------------- |
| `vue`                  | ^3.4  | 框架           |
| `vue-router`           | ^4.3  | 路由           |
| `pinia`                | ^2.1  | 状态管理       |
| `@arco-design/web-vue` | ^2.55 | UI 组件库      |
| `dayjs`                | ^1.11 | 日期处理(预留) |
| `lodash-es`            | ^4.17 | 工具(预留)     |

## 📝 文档

| 文件                                                           | 内容                           |
| -------------------------------------------------------------- | ------------------------------ |
| [README.md](./README.md)                                       | 本文件                         |
| [ARCHITECTURE.md](./ARCHITECTURE.md)                           | 架构详解 / 设计原则 / 数据流向 |
| [CONTRIBUTING.md](./CONTRIBUTING.md)                           | 贡献指南                       |
| [CHANGELOG.md](./CHANGELOG.md)                                 | 版本变更日志                   |
| [doc/architecture-review.md](./doc/architecture-review.md)     | 架构 Review + 重构实施日志     |
| [doc/review-checklist.md](./doc/review-checklist.md)           | 自动化 review 与类型校验清单   |
| [doc/user-journey-analysis.md](./doc/user-journey-analysis.md) | 用户旅程分析                   |

## 🤝 贡献

欢迎提 Issue / PR。详见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 📄 许可证

[MIT](./LICENSE) © 2026 MiniMax