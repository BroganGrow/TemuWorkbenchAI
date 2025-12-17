@echo off
chcp 65001 >nul
echo ====================================
echo Temu 素材管理系统 - 自动启动脚本
echo ====================================
echo.

:: 检查 Node.js 是否安装
echo [1/4] 检查 Node.js 环境...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

node -v
npm -v
echo ✅ Node.js 环境正常
echo.

:: 检查 node_modules 是否存在
echo [2/4] 检查依赖...
if not exist "node_modules\" (
    echo ⚠️  未检测到 node_modules，开始安装依赖...
    echo.
    
    :: 配置镜像
    echo [3/4] 配置国内镜像...
    set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
    call npm config set registry https://registry.npmmirror.com
    echo ✅ 镜像配置完成
    echo.
    
    :: 安装依赖
    echo [4/4] 安装依赖（首次运行需要几分钟）...
    call npm install
    
    if %errorlevel% neq 0 (
        echo.
        echo ❌ 依赖安装失败！
        echo 请检查网络连接或查看错误信息
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已存在
    echo [3/4] 跳过镜像配置
    echo [4/4] 跳过依赖安装
)

echo.
echo ====================================
echo 🚀 启动开发服务器...
echo ====================================
echo.
echo 提示：
echo - Electron 窗口将自动打开
echo - 按 Ctrl+C 可停止服务器
echo - 修改代码会自动热重载
echo.

:: 启动开发服务器
call npm run dev

pause

