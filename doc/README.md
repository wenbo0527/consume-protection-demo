# 📚 Documentation Index · 文档索引

> 仓库所有文档的总入口。按"用户角色"分类。
> 改了一句话不熟?来这里找。

---

## 🎯 我是新人(没用过本项目)

按顺序读这 4 篇:

1. [setup.md](./setup.md) — 从 0 启动,15 分钟跑起来
2. [architecture-diagram.md](./architecture-diagram.md) — 看完架构图,5 分钟明白
3. [demo-script.md](./demo-script.md) — 跟 5 步,业务全链路走一遍
4. [contributor-guide.md](./contributor-guide.md) — 想提 PR?看这里

---

## 🔧 我是开发者(准备贡献代码)

| 需求                | 看哪个                                                     |
| ------------------- | ---------------------------------------------------------- |
| 克隆运行            | [setup.md](./setup.md)                                     |
| 分支 / commit 规范  | [contributor-guide.md](./contributor-guide.md) § 1 + § 2   |
| PR 模板(已自动加载) | `.github/PULL_REQUEST_TEMPLATE.md`                         |
| Issue 模板(3 种)    | `.github/ISSUE_TEMPLATE/`                                  |
| 架构图              | [architecture-diagram.md](./architecture-diagram.md)       |
| 数据流 + 工作流节点 | [architecture-diagram.md](./architecture-diagram.md) § 4-5 |
| 命名规范 / TS 严格  | [contributor-guide.md](./contributor-guide.md) § 5         |

---

## 📦 我是发布者(准备推 GitHub)

| 需求               | 看哪个                                             |
| ------------------ | -------------------------------------------------- |
| 推送命令(2 行)     | [MILESTONES.md](../MILESTONES.md) § "推送交付清单" |
| gh-pages 配置      | [gh-pages-deployment.md](./gh-pages-deployment.md) |
| 发布 release       | [MILESTONES.md](../MILESTONES.md) § "发布版本"     |
| release notes 分类 | `.github/release-drafter.yml`                      |

---

## 🎨 我是产品/运维

| 需求                 | 看哪个                                                                   |
| -------------------- | ------------------------------------------------------------------------ |
| PRD 是怎么对账的     | [prd-final-coverage.md](./prd-final-coverage.md)                         |
| 各项 OPT 的来龙去脉  | [architecture-product-alignment.md](./architecture-product-alignment.md) |
| 架构 Review 通过清单 | [architecture-review.md](./architecture-review.md)                       |
| 演示跟讲解员用       | [demo-script.md](./demo-script.md)                                       |

---

## 🔎 快速查找表

按文件第一级标题速查:

| 文件                                                                     | 主标题               | 用途                            |
| ------------------------------------------------------------------------ | -------------------- | ------------------------------- |
| **[setup.md](./setup.md)**                                               | 从 0 启动指南        | **新人必读**                    |
| [architecture-diagram.md](./architecture-diagram.md)                     | 架构图               | 5 分钟明白架构                  |
| [demo-script.md](./demo-script.md)                                       | Demo 实战演练剧本    | 业务演示 + 给讲解员             |
| [contributor-guide.md](./contributor-guide.md)                           | 贡献指南             | 分支 / commit / PR              |
| [prd-final-coverage.md](./prd-final-coverage.md)                         | PRD vs Demo 对账     | 100% 闭环证据                   |
| [architecture-product-alignment.md](./architecture-product-alignment.md) | 架构 + 产品对齐      | OPT 实施日志                    |
| [architecture-review.md](./architecture-review.md)                       | 架构 review          | 评估检查单                      |
| [gh-pages-deployment.md](./gh-pages-deployment.md)                       | gh-pages 部署深度    | hash mode + base path + GH 配置 |
| [review-checklist.md](./review-checklist.md)                             | 评审清单             | PR 评审模板                     |
| [releases/v0.4.0.md](./releases/v0.4.0.md)                               | v0.4.0 release notes | 推送后自动用                    |

---

## 🗺️ 仓库文档全貌

```
doc/
├── README.md                              ← 你正在读
├── setup.md                               ← Step 1:从 0 启动
├── architecture-diagram.md                ← Step 2:架构图
├── demo-script.md                         ← Step 3:5 步演示
├── contributor-guide.md                   ← Step 4:贡献指南
├── prd-final-coverage.md                  ← ★ 100% 闭环证据表
├── architecture-product-alignment.md      ← OPT-1/2/3/5/9/10/11/12 实施日志
├── architecture-review.md                 ← 架构评审
├── gh-pages-deployment.md                 ← gh-pages 深度
├── review-checklist.md                    ← 评审清单
└── releases/
    └── v0.4.0.md                          ← v0.4.0 release notes 模板

根目录其他文档:
├── README.md                              ← 项目入口(带 BADGES)
├── CHANGELOG.md                           ← 版本变更日志
├── MILESTONES.md                          ← 推送交付清单 + 版本历史
├── ARCHITECTURE.md                        ← 架构总览
├── CONTRIBUTING.md                        ← 顶部贡献指引(转 contributor-guide.md)
├── LICENSE                                ← MIT
├── SECURITY.md                            ← 漏洞反馈
└── .github/
    ├── release-drafter.yml                ← release notes config
    ├── ISSUE_TEMPLATE/                    ← 3 种 issue 模板
    ├── PULL_REQUEST_TEMPLATE.md           ← PR 模板
    └── workflows/                         ← 4 个 GH workflow
```

---

## 📊 文档统计

- 主仓库 README:1
- doc/ 索引:1
- 文档正文:10 篇
- release notes:1 篇
- 根目录 CHANGELOG/ARCHITECTURE 等:8 篇
- 总计:**21 篇文档 + 14 个项目根文件**

> 如有文档缺失/不准确,在 Issue 里提 `doc:` 前缀。
