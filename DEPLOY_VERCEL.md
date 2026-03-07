# 简化版 Vercel 部署

本地 `fetch failed` 通常因无法访问 Google API，部署到 Vercel 后可在云端正常调用。

## 方式一：命令行一键部署（推荐）

### 1. 进入项目目录

```powershell
cd gemini-proxy
```

### 2. 首次部署

```powershell
npx vercel
```

首次会提示：
- 登录 Vercel（浏览器打开链接）
- 是否关联现有项目：选 **N** 新建
- 项目名：直接回车（使用默认）或输入自定义名
- 目录：直接回车（当前目录即可）

### 3. 配置环境变量

部署完成后，在 [Vercel 控制台](https://vercel.com/dashboard) 中：

1. 进入对应项目 → **Settings** → **Environment Variables**
2. 添加 `GEMINI_API_KEY`，值为你的 API 密钥
3. 勾选 Production / Preview / Development
4. 保存后点击 **Redeploy** 重新部署

### 4. 生产部署

```powershell
npx vercel --prod
```

部署完成后会输出域名，如 `https://emag-gemini-proxy-xxx.vercel.app`。

---

## 方式二：网页导入（需先推送到 GitHub）

1. 将仓库推送到 GitHub
2. 登录 [vercel.com](https://vercel.com) → **New Project** → 导入仓库
3. **Root Directory** 设为 `gemini-proxy`
4. **Environment Variables** 添加 `GEMINI_API_KEY`
5. 点击 **Deploy**

---

## 部署后

- 健康检查：`https://你的域名.vercel.app/api/health`（应返回 JSON，含 `ok: true`）

### 若 /api/health 返回 404

说明项目根目录配置错误。在 Vercel 控制台：

1. 进入项目 → **Settings** → **General**
2. 找到 **Root Directory**，设为 `gemini-proxy`（若从 GitHub 导入）
3. 保存后点击 **Redeploy**

或从命令行重新部署（必须在 gemini-proxy 目录内执行）：

```powershell
cd gemini-proxy
npx vercel --prod
```
- 将 emag_xpkb 的 `scripts/config/geminiProxyConfig.js` 中 `GEMINI_PROXY_BASE` 改为你的 Vercel 域名

## 使用搜品助手

**推荐方式**：直接运行 `emag_xpkb/启动开发服务器.bat`（需 Node.js），在浏览器打开 `http://127.0.0.1:8181`，进入搜品助手即可使用图片生成。

若无 Node.js，会回退到 Python 5173 端口，可能遇 CORS；可单独运行 `启动开发服务器(带代理).bat` 使用 8181 代理。
