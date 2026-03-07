@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ========== 一键推送到 GitHub（触发 Vercel 部署）==========
echo.

REM 1. 配置 Git 身份（解决 "Author identity unknown" 错误）
echo [1/6] 配置 Git 身份...
git config user.email "deploy@kdm.local"
git config user.name "KDM Deploy"
if %errorlevel% neq 0 (
    echo 错误：请确保已安装 Git
    pause
    exit /b 1
)

REM 2. 确保已初始化
if not exist ".git" (
    echo [2/6] 初始化 Git 仓库...
    git init
) else (
    echo [2/6] Git 仓库已存在
)

REM 3. 添加文件
echo [3/6] 添加文件...
git add .

REM 4. 提交（--allow-empty 允许空提交）
echo [4/6] 提交...
git commit -m "部署 gemini-proxy 更新" --allow-empty
if %errorlevel% neq 0 (
    echo 提示：无新变更或提交已存在，继续推送...
)

REM 5. 确保 main 分支
echo [5/6] 设置 main 分支...
git branch -M main

REM 6. 添加远程并推送
echo [6/6] 推送到 GitHub...
git remote remove origin 2>nul
git remote add origin https://github.com/shenxuezhang/KDM.git
git push -u origin main

if %errorlevel% neq 0 (
    echo 首次推送失败，尝试拉取后合并...
    git pull origin main --allow-unrelated-histories --no-edit 2>nul
    git push -u origin main
)

if %errorlevel% equ 0 (
    echo.
    echo ========== 推送成功！Vercel 将自动开始部署 ==========
    echo 查看部署：https://vercel.com/sxz/kdm/deployments
) else (
    echo.
    echo ========== 推送失败 ==========
    echo 若 GitHub 仓库已有内容，可尝试：
    echo   git pull origin main --allow-unrelated-histories
    echo   git push -u origin main
    echo.
    echo 或检查：1) 网络 2) GitHub 登录 3) 仓库权限
)
echo.
pause
