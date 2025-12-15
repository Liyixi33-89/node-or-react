@echo off
chcp 65001 >nul
echo ================================
echo 考勤系统 API 测试脚本
echo ================================
echo.

set BASE_URL=http://localhost:3000/api/attendance
set USER_ID=test_user_123

echo 测试用户ID: %USER_ID%
echo.

echo [1/5] 测试健康检查...
curl -s http://localhost:3000/health
echo.
echo.

echo [2/5] 获取初始状态...
curl -s "%BASE_URL%/status/%USER_ID%"
echo.
echo.

echo [3/5] 执行签到...
curl -s -X POST "%BASE_URL%/checkin" -H "Content-Type: application/json" -d "{\"userId\":\"%USER_ID%\"}"
echo.
echo.

echo [4/5] 获取签到后状态...
curl -s "%BASE_URL%/status/%USER_ID%"
echo.
echo.

echo 等待3秒...
timeout /t 3 /nobreak >nul

echo [5/5] 执行签退...
curl -s -X POST "%BASE_URL%/checkout" -H "Content-Type: application/json" -d "{\"userId\":\"%USER_ID%\"}"
echo.
echo.

echo ================================
echo 测试完成！
echo ================================
pause
