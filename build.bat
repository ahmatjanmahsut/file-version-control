@echo off
chcp 65001 >nul
echo ========================================
echo 工艺文件版本控制系统构建脚本
echo ========================================

cd /d "%~dp0"

powershell -ExecutionPolicy Bypass -File build.ps1

pause
