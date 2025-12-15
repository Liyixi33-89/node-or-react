#!/bin/bash

echo "================================"
echo "考勤系统 API 测试脚本"
echo "================================"
echo ""

BASE_URL="http://localhost:3000/api/attendance"
USER_ID="test_user_123"

echo "测试用户ID: $USER_ID"
echo ""

# 测试健康检查
echo "[1/5] 测试健康检查..."
curl -s http://localhost:3000/health
echo -e "\n"

# 测试获取状态（签到前）
echo "[2/5] 获取初始状态..."
curl -s "$BASE_URL/status/$USER_ID"
echo -e "\n"

# 测试签到
echo "[3/5] 执行签到..."
curl -s -X POST "$BASE_URL/checkin" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\"}"
echo -e "\n"

# 测试获取状态（签到后）
echo "[4/5] 获取签到后状态..."
curl -s "$BASE_URL/status/$USER_ID"
echo -e "\n"

# 等待3秒
echo "等待3秒..."
sleep 3

# 测试签退
echo "[5/5] 执行签退..."
curl -s -X POST "$BASE_URL/checkout" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\"}"
echo -e "\n"

echo "================================"
echo "测试完成！"
echo "================================"
