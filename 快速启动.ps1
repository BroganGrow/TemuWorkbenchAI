# Temu 素材管理系统 - PowerShell 启动脚本
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Temu 素材管理系统 - 自动启动脚本" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js
Write-Host "[1/4] 检查 Node.js 环境..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    $npmVersion = npm -v
    Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "npm: $npmVersion" -ForegroundColor Green
    Write-Host "✅ Node.js 环境正常" -ForegroundColor Green
} catch {
    Write-Host "❌ 错误: 未检测到 Node.js" -ForegroundColor Red
    Write-Host "请先安装 Node.js: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "按回车键退出"
    exit 1
}
Write-Host ""

# 检查依赖
Write-Host "[2/4] 检查依赖..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  未检测到 node_modules，开始安装依赖..." -ForegroundColor Yellow
    Write-Host ""
    
    # 配置镜像
    Write-Host "[3/4] 配置国内镜像..." -ForegroundColor Yellow
    $env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
    npm config set registry https://registry.npmmirror.com
    Write-Host "✅ 镜像配置完成" -ForegroundColor Green
    Write-Host ""
    
    # 安装依赖
    Write-Host "[4/4] 安装依赖（首次运行需要几分钟）..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ 依赖安装失败！" -ForegroundColor Red
        Write-Host "请检查网络连接或查看错误信息" -ForegroundColor Yellow
        Read-Host "按回车键退出"
        exit 1
    }
    Write-Host "✅ 依赖安装完成" -ForegroundColor Green
} else {
    Write-Host "✅ 依赖已存在" -ForegroundColor Green
    Write-Host "[3/4] 跳过镜像配置" -ForegroundColor Gray
    Write-Host "[4/4] 跳过依赖安装" -ForegroundColor Gray
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "🚀 启动开发服务器..." -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "提示：" -ForegroundColor Yellow
Write-Host "- Electron 窗口将自动打开" -ForegroundColor Gray
Write-Host "- 按 Ctrl+C 可停止服务器" -ForegroundColor Gray
Write-Host "- 修改代码会自动热重载" -ForegroundColor Gray
Write-Host ""

# 启动开发服务器
npm run dev

