# File Version Control System Build Script

param(
    [switch]$SkipNpmInstall
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "File Version Control System Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$OutputDir = Join-Path $ScriptDir "output"
if (Test-Path $OutputDir) {
    Remove-Item $OutputDir -Recurse -Force
}
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

Write-Host "`n[1/5] Checking Node.js..." -ForegroundColor Yellow

$nodeVersion = & node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "Error: Node.js not installed" -ForegroundColor Red
    exit 1
}
Write-Host "Node.js version: $nodeVersion"

if (-not $SkipNpmInstall) {
    Write-Host "`n[2/5] Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location (Join-Path $ScriptDir "frontend")
    & npm install
    if ($LASTEXITCODE -ne 0) { throw "Frontend install failed" }

    Write-Host "`n[3/5] Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location (Join-Path $ScriptDir "backend")
    & npm install
    if ($LASTEXITCODE -ne 0) { throw "Backend install failed" }

    Write-Host "`n[4/5] Installing client dependencies..." -ForegroundColor Yellow
    Set-Location (Join-Path $ScriptDir "client")
    & npm install
    if ($LASTEXITCODE -ne 0) { throw "Client install failed" }
}

Write-Host "`n[5/5] Building frontend..." -ForegroundColor Yellow
Set-Location (Join-Path $ScriptDir "frontend")
& npm run build
if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }

$FrontendDist = Join-Path $ScriptDir "frontend" "dist"
if (Test-Path $FrontendDist) {
    $WebDir = Join-Path $OutputDir "web"
    Copy-Item -Path $FrontendDist -Destination $WebDir -Recurse -Force
    Write-Host "Frontend built to: $WebDir" -ForegroundColor Green
}

Write-Host "`nCopying backend to output..." -ForegroundColor Yellow
$BackendDir = Join-Path $ScriptDir "backend"
$OutputBackendDir = Join-Path $OutputDir "backend"
Copy-Item -Path $BackendDir -Destination $OutputBackendDir -Recurse -Force -Exclude "node_modules"

Write-Host "`nCopying client to output..." -ForegroundColor Yellow
$ClientDir = Join-Path $ScriptDir "client"
$OutputClientDir = Join-Path $OutputDir "client"
Copy-Item -Path $ClientDir -Destination $OutputClientDir -Recurse -Force -Exclude "node_modules","dist"

$ReadmePath = Join-Path $ScriptDir "README.md"
Copy-Item -Path $ReadmePath -Destination $OutputDir -Force

Set-Location $ScriptDir

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Build completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nOutput directory: $OutputDir" -ForegroundColor White
Write-Host "`nContents:" -ForegroundColor White
Write-Host "  - web/: Frontend web files" -ForegroundColor Gray
Write-Host "  - backend/: Backend service" -ForegroundColor Gray
Write-Host "  - client/: Desktop client" -ForegroundColor Gray
Write-Host "`nUsage:" -ForegroundColor White
Write-Host "  1. Backend: cd backend" -ForegroundColor Gray
Write-Host "  2. Client: cd client" -ForegroundColor Gray
Write-Host "  3. Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
