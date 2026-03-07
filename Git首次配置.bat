@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo [1/4] 初始化 Git 仓库...
git init
if %errorlevel% neq 0 (
    echo 错误：请确保已安装 Git
    pause
    exit /b 1
)

echo.
echo [2/5] 配置 Git 身份（解决 commit 失败）...
git config user.email "deploy@kdm.local"
git config user.name "KDM Deploy"

echo.
echo [3/5] 添加所有文件...
git add .

echo.
echo [4/5] 提交...
git commit -m "部署 gemini-proxy" --allow-empty

echo.
echo [5/5] 请手动添加远程仓库并推送：
echo   git remote add origin https://github.com/你的用户名/你的仓库名.git
echo   git branch -M main
echo   git push -u origin main
echo.
echo 若已添加远程，直接执行：git push -u origin main
echo.
pause
