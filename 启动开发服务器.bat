@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist "node_modules" (
    echo [Gemini Proxy] 首次运行，正在安装依赖...
    call npm install
)

echo.
echo [Gemini Proxy] 启动开发服务器 http://localhost:3001
echo [Gemini Proxy] 健康检查: http://localhost:3001/api/health
echo.

npm run dev
