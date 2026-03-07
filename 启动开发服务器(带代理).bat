@echo off
chcp 65001 >nul
cd /d "%~dp0"

REM 若需代理访问 Google API，请修改下方代理地址
REM 常见端口: Clash 7890 | V2Ray 10809 | 其他请查看代理软件设置
set HTTPS_PROXY=http://127.0.0.1:7890
set HTTP_PROXY=http://127.0.0.1:7890

if not exist "node_modules" (
    echo [Gemini Proxy] 首次运行，正在安装依赖...
    call npm install
)

echo.
echo [Gemini Proxy] 启动开发服务器 http://localhost:3001
echo [Gemini Proxy] 已启用代理: %HTTPS_PROXY%
echo [Gemini Proxy] 健康检查: http://localhost:3001/api/health
echo.

npm run dev
