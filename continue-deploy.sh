#!/bin/bash

###############################################################################
# TaskManager 继续部署脚本
# 用途: MongoDB 已安装后，继续完成剩余的初始化步骤
###############################################################################

set -e

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}"
echo "=========================================="
echo "  TaskManager 继续部署"
echo "  服务器: 39.108.91.231"
echo "=========================================="
echo -e "${NC}"

echo -e "${BLUE}检测已安装的服务...${NC}"
echo ""

# 检测 MongoDB
if systemctl is-active --quiet mongod || systemctl is-active --quiet mongodb; then
    echo "✅ MongoDB 已运行"
else
    echo "⚠️  MongoDB 未运行，尝试启动..."
    systemctl start mongod 2>/dev/null || systemctl start mongodb 2>/dev/null
fi

# 检测 Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js $(node -v) 已安装"
else
    echo "❌ Node.js 未安装"
fi

# 检测 PM2
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 已安装"
else
    echo "❌ PM2 未安装"
fi

# 检测 Nginx
if command -v nginx &> /dev/null; then
    echo "✅ Nginx 已安装"
else
    echo "❌ Nginx 未安装"
fi

echo ""
echo -e "${YELLOW}开始继续部署...${NC}"
echo ""

# 1. 更新系统（可选，如果已执行可跳过）
echo -e "${YELLOW}[1/8] 更新系统...${NC}"
yum update -y

# 2. 安装基础工具
echo -e "${YELLOW}[2/8] 安装基础工具...${NC}"
yum install -y git curl wget vim

# 3. 安装 Node.js 18（如果未安装）
echo -e "${YELLOW}[3/8] 检查 Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "安装 Node.js 18..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
fi
echo "Node.js 版本: $(node -v)"
echo "NPM 版本: $(npm -v)"

# 4. 安装 PM2（如果未安装）
echo -e "${YELLOW}[4/8] 检查 PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo "安装 PM2..."
    npm install -g pm2
    pm2 startup systemd -u root --hp /root
    systemctl enable pm2-root
else
    echo "PM2 已安装，跳过"
fi

# 5. 安装 Nginx
echo -e "${YELLOW}[5/8] 安装 Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    yum install -y nginx
fi
systemctl start nginx
systemctl enable nginx
echo "✅ Nginx 已启动"

# 6. 配置防火墙
echo -e "${YELLOW}[6/8] 配置防火墙...${NC}"
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --permanent --add-port=3000/tcp
    firewall-cmd --reload
    echo "✅ 防火墙已配置"
else
    echo "⚠️  firewalld 未安装，跳过防火墙配置"
fi

# 7. 创建项目目录
echo -e "${YELLOW}[7/8] 创建项目目录...${NC}"
mkdir -p /var/www/taskmanager
mkdir -p /var/www/backups
mkdir -p /var/log/taskmanager
echo "✅ 项目目录已创建"

# 8. 配置 Nginx
echo -e "${YELLOW}[8/8] 配置 Nginx...${NC}"
cat > /etc/nginx/conf.d/taskmanager.conf <<'EOF'
# TaskManager Nginx 配置

# 限流配置
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

# 上游后端服务器
upstream backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name 39.108.91.231;
    
    # 日志
    access_log /var/log/nginx/taskmanager_access.log;
    error_log /var/log/nginx/taskmanager_error.log;
    
    # 安全头部
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # 前端静态文件
    location / {
        root /var/www/taskmanager/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # 后端 API 代理
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # 登录接口限流
    location /api/user/login {
        limit_req zone=login_limit burst=3 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# 测试 Nginx 配置
nginx -t
systemctl reload nginx
echo "✅ Nginx 配置已更新"

echo ""
echo -e "${GREEN}"
echo "=========================================="
echo "✅ 继续部署完成！"
echo "=========================================="
echo -e "${NC}"

echo -e "${BLUE}环境检查：${NC}"
echo ""
echo "✅ Node.js: $(node -v)"
echo "✅ NPM: $(npm -v)"
echo "✅ PM2: $(pm2 -v)"
echo "✅ Nginx: $(nginx -v 2>&1)"
echo "✅ MongoDB: $(systemctl is-active mongod 2>/dev/null || systemctl is-active mongodb 2>/dev/null || echo '未运行')"
echo ""

echo -e "${BLUE}下一步操作：${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 1. 克隆项目代码"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "cd /var/www/taskmanager"
echo "git clone -b dev https://github.com/Liyixi33-89/node-or-react.git ."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚙️  2. 配置后端环境变量"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "cd /var/www/taskmanager/backend"
echo "cat > .env << 'ENVEOF'"
echo "NODE_ENV=production"
echo "PORT=3000"
echo "MONGODB_URI=mongodb://localhost:27017/taskmanager"
echo "JWT_SECRET=\$(openssl rand -base64 32)"
echo "JWT_EXPIRES_IN=7d"
echo "ENVEOF"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 3. 启动后端服务"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "cd /var/www/taskmanager/backend"
echo "npm install --production"
echo "pm2 start ecosystem.config.js"
echo "pm2 save"
echo "pm2 list"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 4. 构建前端"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "cd /var/www/taskmanager/frontend"
echo "npm install"
echo "npm run build"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 5. 重启 Nginx"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "systemctl restart nginx"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 6. 访问应用"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "浏览器访问: http://39.108.91.231"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 常用命令"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "# 查看后端日志"
echo "pm2 logs taskmanager-backend"
echo ""
echo "# 查看 Nginx 日志"
echo "tail -f /var/log/nginx/taskmanager_error.log"
echo ""
echo "# 查看 MongoDB 状态"
echo "systemctl status mongod"
echo ""
echo "# 重启后端"
echo "pm2 restart taskmanager-backend"
echo ""
echo -e "${GREEN}🎉 准备就绪！现在可以部署应用了！${NC}"
