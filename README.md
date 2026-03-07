# eMAG Gemini API 代理服务

为 emag_xpkb 搜品助手提供 Gemini 图片/视频生成 API 代理，API Key 安全存储于服务端。

## 快速开始

### 1. 安装依赖

```bash
cd gemini-proxy
npm install
```

### 2. 配置 API Key

复制 `.env.example` 为 `.env.local`，填入 Gemini API Key：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```
GEMINI_API_KEY=你的API密钥
```

### 3. 启动开发服务器

```bash
npm run dev
```

服务运行在 http://localhost:3001

### 4. 测试

- 健康检查：http://localhost:3001/api/health
- 首页：http://localhost:3001

## API 列表

| 路径 | 方法 | 说明 |
|------|------|------|
| /api/health | GET | 健康检查 |
| /api/gemini/generate | POST | 图片生成（Gemini 2.5 Flash Image） |
| /api/gemini/edit | POST | 图片编辑/合成 |
| /api/imagen/generate | POST | Imagen 4 图片生成 |
| /api/veo/generate | POST | Veo 3 视频生成 |
| /api/veo/operation | POST | 视频状态轮询 |
| /api/veo/download | POST | 视频下载 |

## 部署到 Vercel（推荐：解决本地 fetch failed）

本地出现 `fetch failed` 通常是因为无法访问 Google API（如网络限制）。**部署到 Vercel 后，服务在云端运行，可正常调用 Google API。**

**简化版部署**：参见 [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)。

**使用搜品助手**：部署完成后，运行 `emag_xpkb/启动开发服务器.bat`，打开 http://127.0.0.1:5173 即可。

### 快速命令

```bash
cd gemini-proxy
npm run deploy        # 预览部署
npm run deploy:prod   # 生产部署
```

首次需在 Vercel 控制台配置 `GEMINI_API_KEY` 环境变量后重新部署。

### 本地代理（可选）

若本机有 HTTP 代理（如 Clash、V2Ray），可设置环境变量后启动：

```bash
set HTTPS_PROXY=http://127.0.0.1:7890
set HTTP_PROXY=http://127.0.0.1:7890
npm run dev
```

（端口 7890 需替换为实际代理端口）
