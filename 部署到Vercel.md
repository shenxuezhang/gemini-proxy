# gemini-proxy 部署到 Vercel

## 前置条件

1. 已安装 Node.js
2. 已安装 Vercel CLI：`npm i -g vercel`
3. 已登录 Vercel：`vercel login`（首次需在浏览器完成）

## CMD 部署命令

```cmd
cd /d "g:\Html项目开发\eMAG市场海选系统\gemini-proxy"

REM 预览部署（测试用）
vercel

REM 生产部署（正式上线）
vercel --prod
```

或使用 npm 脚本：

```cmd
cd /d "g:\Html项目开发\eMAG市场海选系统\gemini-proxy"

REM 生产部署
npm run deploy:prod
```

## 环境变量

在 Vercel 控制台为项目配置 `GEMINI_API_KEY`：

1. 打开 https://vercel.com/sxz/kdm/settings/environment-variables
2. 添加 `GEMINI_API_KEY`，选择 Production / Preview / Development

## 当前状态

- 项目：sxz/kdm
- 自定义域名：https://kdm-zeta.vercel.app
- GitHub 仓库：https://github.com/shenxuezhang/KDM
- 若 CLI 部署失败，使用 **一键推送到 GitHub.bat** 或下方 Git 推送

## 一键脚本（推荐）

双击运行 `一键推送到GitHub.bat`，自动完成：
1. 配置 Git 身份（解决 "Author identity unknown"）
2. 添加、提交、推送到 https://github.com/shenxuezhang/KDM
3. Vercel 关联该仓库后会自动部署

首次推送若需登录 GitHub，按提示输入账号密码或 Token

## 依赖警告修复（2026-03）

已在 package.json 添加 `overrides` 和 `engines`，缓解 npm deprecated 警告：
- `glob` 升级至 ^11（修复安全漏洞）
- `node-domexception` 升级至 ^2
- `engines.node` 设为 >=20

若部署仍失败，多为 Vercel 平台内部错误，可稍后重试或联系 Vercel 支持

---

## 通过 Git Push 触发部署

当 CLI 部署失败时，可通过 Git 推送由 Vercel 自动构建部署。

### 一、前置条件

1. 已安装 Git：https://git-scm.com/download/win
2. 有 GitHub / GitLab / Bitbucket 账号
3. Vercel 项目已关联 Git 仓库（在 Vercel 控制台导入项目时选择）

### 二、首次配置（仅需一次）

**重要**：必须先执行 `git init`，否则 `git add` / `commit` / `push` 会报错 `fatal: not a git repository`。

```cmd
cd /d "g:\Html项目开发\eMAG市场海选系统\gemini-proxy"

REM 1. 初始化 Git（必须！否则后续命令会失败）
git init

REM 2. 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/你的仓库名.git

REM 3. 推送并关联远程分支
git add .
git commit -m "部署 gemini-proxy"
git branch -M main
git push -u origin main
```

### 三、日常部署流程

每次修改代码后，执行：

```cmd
cd /d "g:\Html项目开发\eMAG市场海选系统\gemini-proxy"

git add .
git commit -m "更新说明"
git push
```

推送成功后，Vercel 会自动检测并开始构建部署。

### 四、在 Vercel 控制台关联 Git

1. 打开 https://vercel.com/sxz/kdm/settings/git
2. 若未关联，点击「Connect Git Repository」
3. 选择 GitHub / GitLab / Bitbucket，授权并选择仓库
4. 配置分支：main 或 master 通常为生产分支

### 五、若项目已在 Vercel 关联 Git

直接推送即可：

```cmd
cd /d "g:\Html项目开发\eMAG市场海选系统\gemini-proxy"
git add .
git commit -m "部署更新"
git push origin main
```
