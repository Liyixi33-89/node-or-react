#!/bin/bash

# ============================================
# 考勤系统部署脚本
# 用途：自动化部署前后端到生产服务器
# ============================================

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="attendance"
DEPLOY_USER="www-data"
DEPLOY_PATH="/var/www/attendance"
BACKEND_PATH="$DEPLOY_PATH/backend"
FRONTEND_PATH="$DEPLOY_PATH/frontend"
NGINX_CONFIG="/etc/nginx/sites-available/attendance"
BACKUP_PATH="/var/backups/attendance"

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}开始部署考勤系统${NC}"
echo -e "${GREEN}============================================${NC}"

# 1. 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用 root 用户或 sudo 运行此脚本${NC}"
    exit 1
fi

# 2. 创建备份
echo -e "${YELLOW}[1/10] 创建备份...${NC}"
mkdir -p $BACKUP_PATH
BACKUP_FILE="$BACKUP_PATH/backup_$(date +%Y%m%d_%H%M%S).tar.gz"
if [ -d "$DEPLOY_PATH" ]; then
    tar -czf $BACKUP_FILE $DEPLOY_PATH 2>/dev/null || echo "首次部署，跳过备份"
    echo -e "${GREEN}✓ 备份完成: $BACKUP_FILE${NC}"
else
    echo -e "${YELLOW}首次部署，跳过备份${NC}"
fi

# 3. 创建部署目录
echo -e "${YELLOW}[2/10] 创建部署目录...${NC}"
mkdir -p $DEPLOY_PATH
mkdir -p $BACKEND_PATH
mkdir -p $FRONTEND_PATH
mkdir -p $BACKEND_PATH/logs
echo -e "${GREEN}✓ 目录创建完成${NC}"

# 4. 安装系统依赖
echo -e "${YELLOW}[3/10] 检查系统依赖...${NC}"
if ! command -v node &> /dev/null; then
    echo "安装 Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

if ! command -v nginx &> /dev/null; then
    echo "安装 Nginx..."
    apt-get update
    apt-get install -y nginx
fi

if ! command -v mongod &> /dev/null; then
    echo "安装 MongoDB..."
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    apt-get update
    apt-get install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod
fi

if ! command -v pm2 &> /dev/null; then
    echo "安装 PM2..."
    npm install -g pm2
fi

echo -e "${GREEN}✓ 系统依赖检查完成${NC}"

# 5. 部署后端
echo -e "${YELLOW}[4/10] 部署后端代码...${NC}"
cp -r ./backend/* $BACKEND_PATH/
cd $BACKEND_PATH
npm install --production
echo -e "${GREEN}✓ 后端部署完成${NC}"

# 6. 配置环境变量
echo -e "${YELLOW}[5/10] 配置环境变量...${NC}"
if [ ! -f "$BACKEND_PATH/.env" ]; then
    cp $BACKEND_PATH/.env.production $BACKEND_PATH/.env
    echo -e "${YELLOW}⚠ 请编辑 $BACKEND_PATH/.env 配置数据库连接${NC}"
fi
echo -e "${GREEN}✓ 环境变量配置完成${NC}"

# 7. 构建前端
echo -e "${YELLOW}[6/10] 构建前端代码...${NC}"
cd ./frontend
npm install
npm run build
cp -r ./dist/* $FRONTEND_PATH/
echo -e "${GREEN}✓ 前端构建完成${NC}"

# 8. 配置 Nginx
echo -e "${YELLOW}[7/10] 配置 Nginx...${NC}"
cp ./nginx.conf $NGINX_CONFIG
ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/attendance
nginx -t
systemctl reload nginx
echo -e "${GREEN}✓ Nginx 配置完成${NC}"

# 9. 启动后端服务
echo -e "${YELLOW}[8/10] 启动后端服务...${NC}"
cd $BACKEND_PATH
pm2 delete attendance-backend 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
echo -e "${GREEN}✓ 后端服务启动完成${NC}"

# 10. 设置权限
echo -e "${YELLOW}[9/10] 设置文件权限...${NC}"
chown -R $DEPLOY_USER:$DEPLOY_USER $DEPLOY_PATH
chmod -R 755 $DEPLOY_PATH
echo -e "${GREEN}✓ 权限设置完成${NC}"

# 11. 健康检查
echo -e "${YELLOW}[10/10] 执行健康检查...${NC}"
sleep 3
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 后端服务健康检查通过${NC}"
else
    echo -e "${RED}✗ 后端服务健康检查失败${NC}"
    pm2 logs attendance-backend --lines 50
    exit 1
fi

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}部署完成！${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "后端服务: http://localhost:3000"
echo -e "前端地址: http://yourdomain.com"
echo -e ""
echo -e "常用命令:"
echo -e "  查看日志: pm2 logs attendance-backend"
echo -e "  重启服务: pm2 restart attendance-backend"
echo -e "  查看状态: pm2 status"
echo -e "  Nginx日志: tail -f /var/log/nginx/attendance_error.log"
echo -e "${GREEN}============================================${NC}"
