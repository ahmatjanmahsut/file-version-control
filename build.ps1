# 工艺文件版本控制系统构建脚本
# 自动编译前端、后端和客户端程序

param(
    [switch]$SkipNpmInstall
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "工艺文件版本控制系统构建脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 获取脚本所在目录
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# 定义输出目录
$OutputDir = Join-Path $ScriptDir "output"
if (Test-Path $OutputDir) {
    Remove-Item $OutputDir -Recurse -Force
}
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

Write-Host "`n[1/5] 检查并安装Node.js..." -ForegroundColor Yellow

# 检查Node.js
$nodeVersion = & node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "错误: 未安装Node.js，请先安装Node.js 18或更高版本" -ForegroundColor Red
    exit 1
}
Write-Host "Node.js版本: $nodeVersion"

# 安装依赖
if (-not $SkipNpmInstall) {
    Write-Host "`n[2/5] 安装前端依赖..." -ForegroundColor Yellow
    Set-Location (Join-Path $ScriptDir "frontend")
    & npm install
    if ($LASTEXITCODE -ne 0) { throw "前端依赖安装失败" }

    Write-Host "`n[3/5] 安装后端依赖..." -ForegroundColor Yellow
    Set-Location (Join-Path $ScriptDir "backend")
    & npm install --production
    if ($LASTEXITCODE -ne 0) { throw "后端依赖安装失败" }

    Write-Host "`n[4/5] 安装客户端依赖..." -ForegroundColor Yellow
    Set-Location (Join-Path $ScriptDir "client")
    & npm install
    if ($LASTEXITCODE -ne 0) { throw "客户端依赖安装失败" }
}

# 构建前端
Write-Host "`n[5/5] 构建前端..." -ForegroundColor Yellow
Set-Location (Join-Path $ScriptDir "frontend")
& npm run build
if ($LASTEXITCODE -ne 0) { throw "前端构建失败" }

# 复制前端构建产物到输出目录
$FrontendDist = Join-Path $ScriptDir "frontend\dist"
if (Test-Path $FrontendDist) {
    Copy-Item -Path $FrontendDist -Destination (Join-Path $OutputDir "web") -Recurse -Force
    Write-Host "前端构建产物已复制到: $OutputDir\web" -ForegroundColor Green
}

# 复制后端到输出目录
Write-Host "`n复制后端到输出目录..." -ForegroundColor Yellow
$BackendDir = Join-Path $ScriptDir "backend"
$OutputBackendDir = Join-Path $OutputDir "backend"
Copy-Item -Path $BackendDir -Destination $OutputBackendDir -Recurse -Force -Exclude "node_modules"

# 复制客户端到输出目录
Write-Host "`n复制客户端到输出目录..." -ForegroundColor Yellow
$ClientDir = Join-Path $ScriptDir "client"
$OutputClientDir = Join-Path $OutputDir "client"
Copy-Item -Path $ClientDir -Destination $OutputClientDir -Recurse -Force -Exclude "node_modules","dist"

# 复制配置文件
Copy-Item -Path (Join-Path $ScriptDir "README.md") -Destination $OutputDir -Force

# 返回主目录
Set-Location $ScriptDir

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "构建完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n输出目录: $OutputDir" -ForegroundColor White
Write-Host "`n包含内容:" -ForegroundColor White
Write-Host "  - web/: 前端Web页面 (复制到Web服务器)" -ForegroundColor Gray
Write-Host "  - backend/: 后端服务程序" -ForegroundColor Gray
Write-Host "  - client/: 桌面管理客户端" -ForegroundColor Gray
Write-Host "`n运行说明:" -ForegroundColor White
Write-Host "  1. 后端: cd backend && npm start" -ForegroundColor Gray
Write-Host "  2. 客户端: cd client && npm start" -ForegroundColor Gray
Write-Host "  3. 前端访问: http://localhost:3000" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
