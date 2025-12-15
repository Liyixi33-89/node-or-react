@echo off
echo ================================
echo 考勤签到系统 - 快速启动脚本
echo ================================
echo.

echo [1/4] 检查后端依赖...
cd backend
if not exist "node_modules" (
    echo 安装后端依赖...
    call npm install
) else (
    echo 后端依赖已存在
)
echo.

echo [2/4] 检查前端依赖...
cd ..\frontend
if not exist "node_modules" (
    echo 安装前端依赖...
    call npm install
) else (
    echo 前端依赖已存在
)
echo.

echo [3/4] 启动后端服务...
cd ..\backend
start "后端服务" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul
echo.

echo [4/4] 启动前端服务...
cd ..\frontend
start "前端服务" cmd /k "npm run dev"
echo.

echo ================================
echo 启动完成！
echo ================================
echo 后端服务: http://localhost:3000
echo 前端应用: http://localhost:5173
echo.
echo 请在浏览器中访问前端地址
echo 建议使用移动设备模拟器查看效果
echo ================================
pause
