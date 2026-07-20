# GitHub Pages 部署说明(gh-pages)

> 本项目支持一键部署到 GitHub Pages,所有页面可在 https://<org>.github.io/consume-protection-demo/ 在线访问。

## 配置步骤

### Step 1 · GitHub 端首次配置

1. 在 GitHub 仓库主页:`Settings` → `Pages`
2. **Source**:选择 `GitHub Actions`(不是 `Deploy from a branch`)
3. 保存后会自动让 `.github/workflows/deploy.yml` 生效

### Step 2 · 仓库权限(可选)

如果想要手动触发部署,需要:

1. `Settings` → `Actions` → `General` → 勾选 `Allow all actions and reusable workflows`
2. 同样位置下:`Workflow permissions`:勾选 `Allow GitHub Actions to create and approve pull requests`

### Step 3 · 推送 main 分支

```bash
git push origin main
```

GitHub Actions 会自动触发 deploy.yml,执行:

1. checkout(下载 main 分支代码)
2. setup Node + pnpm
3. type-check(验证 TS strict)
4. 设置 `VITE_BASE=/consume-protection-demo/`(SPA 子路径 base)
5. build(Vite 打包到 `dist/`)
6. upload artifact
7. deploy-pages(GitHub Pages 部署)

### Step 4 · 查看部署 URL

推送完成后:

1. 在仓库主页找到 environment:"github-pages",点击查看
2. 或访问:`Settings` → `Pages` → 显示当前发布的 URL
3. 示例:`https://<your-org>.github.io/consume-protection-demo/`

## 在 demo 内部访问的方式

构建完的 SPA 用 hash 路由(#/agent/desk),所以访问任意子路径都能解析:

```
https://<your-org>.github.io/consume-protection-demo/#/agent/desk
https://<your-org>.github.io/consume-protection-demo/#/manage/quality
https://<your-org>.github.io/consume-protection-demo/#/business/apply
```

## 自定义域名(可选)

`Settings` → `Pages` → `Custom domain` → 输入 `your-domain.com` → Save。
会自动生成 CNAME 文件并签发 SSL 证书。

## 本地模拟 gh-pages 构建

```bash
# 模拟子路径 base
VITE_BASE=/consume-protection-demo/ pnpm build

# 输出会出现在 dist/ 下,静态文件中的 asset 引用的 base path 已替换
```

## 路由细节说明

项目已用 **hash mode** 路由:

```typescript
// src/router.ts
createRouter({
  history: createWebHashHistory(),  // ← 关键:hash mode 适合 gh-pages
  routes: ...
})
```

hash 模式好处:

- 不需要后端 SPA fallback(GitHub Pages 不支持 nginx try_files)
- 直接访问子路径 `/agent/desk` 会重定向到 `/index.html#/agent/desk` → 404(GH Pages 静态托管默认行为)
- 但 hash 路由访问 `#/agent/desk` 会在前端正确解析
- 用户从根入口进入则通过 JS 路由到 `#/xxx`

## 故障排查

| 现象                 | 排查                                                                 |
| -------------------- | -------------------------------------------------------------------- |
| 部署后页面 404       | 检查 `vite.config.ts` 的 `basePath` 是否设置正确,GitHub Actions 日志 |
| asset 路径错乱       | 说明 basePath 与部署路径不匹配,vite 必须用 `/repo-name/` 结尾        |
| 部署成功但登录后白屏 | 检查 router mode 是 `createWebHashHistory` 而非 `createWebHistory`   |
| Action 跑不了        | 确认 `Permissions` → `pages: write` + `id-token: write` 已启用       |
