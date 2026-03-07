@echo off
chcp 65001 >nul
title 工艺文件版本控制系统 - 主控制面板

set "SCRIPT_DIR=%~dp0"

:menu
cls
echo ========================================
echo   工艺文件版本控制系统 - 主控制面板
echo ========================================
echo.
echo   [后端服务]
echo   1. 启动后端服务
echo   2. 停止后端服务
echo   3. 重启后端服务
echo.
echo   [前端服务]
echo   4. 启动前端服务
echo   5. 停止前端服务
echo.
echo   [客户端]
echo   6. 启动桌面客户端
echo.
echo   [工具]
echo   7. 安装所有依赖
echo   8. 查看服务状态
echo   0. 退出
echo ========================================
echo.

set /p choice=请选择操作 (0-8):

if "%choice%"=="1" goto start_backend
if "%choice%"=="2" goto stop_backend
if "%choice%"=="3" goto restart_backend
if "%choice%"=="4" goto start_frontend
if "%choice%"=="5" goto stop_frontend
if "%choice%"=="6" goto start_client
if "%choice%"=="7" goto install_all
if "%choice%"=="8" goto check_status
if "%choice%"=="0" goto exit

echo 无效选择，请重新选择
timeout /t 2 >nul
goto menu

:start_backend
cls
echo ========================================
echo 启动后端服务
echo ========================================
echo.
cd /d "%SCRIPT_DIR%backend"
if not exist "node_modules" (
    echo 正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo 依赖安装失败
        pause
        goto menu
    )
)
echo 正在启动后端服务...
start "Backend API" cmd /k "cd /d "%SCRIPT_DIR%backend" && npm start"
echo 后端服务已启动 (端口: 8000)
echo.
echo 按任意键返回...
pause >nul
goto menu

:stop_backend
cls
echo ========================================
echo 停止后端服务
echo ========================================
echo.
echo 正在停止后端服务...
taskkill /F /IM node.exe >nul 2>&1
echo 后端服务已停止
echo.
echo 按任意键返回...
pause >nul
goto menu

:restart_backend
cls
echo ========================================
echo 重启后端服务
echo ========================================
echo.
echo 正在重启后端服务...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul
cd /d "%SCRIPT_DIR%backend"
start "Backend API" cmd /k "cd /d "%SCRIPT_DIR%backend" && npm start"
echo 后端服务已重启 (端口: 8000)
echo.
echo 按任意键返回...
pause >nul
goto menu

:start_frontend
cls
echo ========================================
echo 启动前端服务
echo ========================================
echo.
cd /d "%SCRIPT_DIR%frontend"
if not exist "node_modules" (
    echo 正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo 依赖安装失败
        pause
        goto menu
    )
)
echo 正在启动前端服务...
start "Frontend Web" cmd /k "cd /d "%SCRIPT_DIR%frontend" && npm run dev"
echo 前端服务已启动 (端口: 3000)
echo.
echo 按任意键返回...
pause >nul
goto menu

:stop_frontend
cls
echo ========================================
echo 停止前端服务
echo ========================================
echo.
echo 正在停止前端服务...
taskkill /F /FI "WINDOWTITLE eq Frontend Web*" >nul 2>&1
echo 前端服务已停止
echo.
echo 按任意键返回...
pause >nul
goto menu

:start_client
cls
echo ========================================
echo 启动桌面客户端
echo ========================================
echo.
cd /d "%SCRIPT_DIR%client"
if not exist "node_modules" (
    echo 正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo 依赖安装失败
        pause
        goto menu
    )
)
echo 正在启动桌面客户端...
start "Desktop Client" cmd /k "cd /d "%SCRIPT_DIR%client" && npm start"
echo 桌面客户端已启动
echo.
echo 按任意键返回...
pause >nul
goto menu

:install_all
cls
echo ========================================
echo 安装所有依赖
echo ========================================
echo.
echo 安装后端依赖...
cd /d "%SCRIPT_DIR%backend"
call npm install
echo.
echo 安装桌面客户端依赖...
cd /d "%SCRIPT_DIR%client"
call npm install
echo.
echo 依赖安装完成
echo.
echo 按任意键返回...
pause >nul
goto menu

:check_status
cls
echo ========================================
echo 查看服务状态
echo ========================================
echo.

echo [后端服务]
tasklist /FI "IMAGENAME eq node.exe" 2>nul | findstr /I "node.exe" >nul
if %errorlevel%==0 (
    echo   状态: [运行中]
    curl -s -o nul -w "   API响应: %%{http_code}\n" http://localhost:8000/api/health 2>nul
) else (
    echo   状态: [未运行]
)

echo.
echo [前端服务]
tasklist /FI "WINDOWTITLE eq Frontend Web*" 2>nul | findstr /I "cmd.exe" >nul
if %errorlevel%==0 (
    echo   状态: [运行中]
    echo   地址: http://localhost:3000
) else (
    echo   状态: [未运行]
)

echo.
echo ========================================
echo 按任意键返回...
pause >nul
goto menu

:exit
exit
