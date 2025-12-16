#!/bin/bash

###############################################################################
# TaskManager 服务器快速初始化脚本
# 服务器: 39.108.91.231
# 用途: 一键配置自动化部署环境
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
echo "  TaskManager 服务器初始化"
echo "  服务器: 39.108.91.231"
echo "=========================================="
echo -e "${NC}"

# 1. 更新系统
echo -e "${YELLOW}[1/9] 更新系统...${NC}"
yum update -y

# 2. 安装基础工具
echo -e "${YELLOW}[2/9] 安装基础工具...${NC}"
yum install -y git curl wget vim

# 3. 安装 Node.js 18
echo -e "${YELLOW}[3/9] 安装 Node.js 18...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
fi
echo "Node.js 版本: $(node -v)"
echo "NPM 版本: $(npm -v)"

# 4. 安装 PM2
echo -e "${YELLOW}[4/9] 安装 PM2...${NC}"
npm install -g pm2
pm2 startup systemd -u root --hp /root
systemctl enable pm2-root

# 5. 安装 MongoDB
echo -e "${YELLOW}[5/9] 安装 MongoDB...${NC}"
if ! command -v mongod &> /dev/null; then
    # 检测系统版本
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS_NAME=$ID
        OS_VERSION=$VERSION_ID
    fi
    
    echo "检测到系统: $OS_NAME $OS_VERSION"
    
    # 根据系统选择合适的 MongoDB 版本
    if [[ "$OS_NAME" == "alinux" ]] || [[ "$OS_NAME" == "alios" ]]; then
        # 阿里云 Linux 使用 CentOS 7 的仓库
        REDHAT_VERSION=7
    elif [[ "$OS_NAME" == "centos" ]] || [[ "$OS_NAME" == "rhel" ]]; then
        REDHAT_VERSION=${OS_VERSION%%.*}
    else
        # 默认使用 7
        REDHAT_VERSION=7
    fi
    
    echo "使用 Red Hat $REDHAT_VERSION 的 MongoDB 仓库"
    
    # 创建 MongoDB 仓库配置
    cat > /etc/yum.repos.d/mongodb-org-6.0.repo <<EOF
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$REDHAT_VERSION/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
EOF
    
    # 尝试安装 MongoDB
    if ! yum install -y mongodb-org; then
        echo -e "${YELLOW}MongoDB 6.0 安装失败，尝试安装 MongoDB 5.0...${NC}"
        
        # 尝试 MongoDB 5.0
        cat > /etc/yum.repos.d/mongodb-org-5.0.repo <<EOF
[mongodb-org-5.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$REDHAT_VERSION/mongodb-org/5.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-5.0.asc
EOF
        
        if ! yum install -y mongodb-org; then
            echo -e "${RED}MongoDB 官方仓库安装失败，使用 EPEL 仓库安装...${NC}"
            yum install -y epel-release
            yum install -y mongodb-server mongodb
        fi
    fi
fi

# 启动 MongoDB
systemctl start mongod 2>/dev/null || systemctl start mongodb 2>/dev/null
systemctl enable mongod 2>/dev/null || systemctl enable mongodb 2>/dev/null

# 验证 MongoDB 是否运行
if systemctl is-active --quiet mongod || systemctl is-active --quiet mongodb; then
    echo "✅ MongoDB 已启动"
else
    echo -e "${RED}⚠️  MongoDB 启动失败，请手动检查${NC}"
fi

# 6. 安装 Nginx
echo -e "${YELLOW}[6/9] 安装 Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    yum install -y nginx
fi
systemctl start nginx
systemctl enable nginx
echo "✅ Nginx 已启动"

# 7. 配置防火墙
echo -e "${YELLOW}[7/9] 配置防火墙...${NC}"
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload
echo "✅ 防火墙已配置"

# 8. 创建项目目录
echo -e "${YELLOW}[8/9] 创建项目目录...${NC}"
mkdir -p /var/www/taskmanager
mkdir -p /var/www/backups
mkdir -p /var/log/taskmanager

# 9. 配置 Nginx
echo -e "${YELLOW}[9/9] 配置 Nginx...${NC}"
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

echo -e "${GREEN}"
echo "=========================================="
echo "✅ 服务器初始化完成！"
echo "=========================================="
echo -e "${NC}"

echo -e "${BLUE}下一步操作：${NC}"
echo ""
echo "1️⃣  克隆项目代码："
echo "   cd /var/www"
echo "   git clone https://github.com/Liyixi33-89/node-or-react.git taskmanager"
echo "   cd taskmanager"
echo "   git checkout test"
echo ""
echo "2️⃣  配置环境变量："
echo "   cd /var/www/taskmanager/backend"
echo "   vim .env"
echo ""
echo "   添加以下内容："
echo "   NODE_ENV=production"
echo "   PORT=3000"
echo "   MONGODB_URI=mongodb://localhost:27017/taskmanager"
echo "   JWT_SECRET=$(openssl rand -base64 32)"
echo ""
echo "3️⃣  安装依赖并启动："
echo "   cd /var/www/taskmanager/backend"
echo "   npm install"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo ""
echo "4️⃣  构建前端："
echo "   cd /var/www/taskmanager/frontend"
echo "   npm install"
echo "   npm run build"
echo ""
echo "5️⃣  配置 GitHub Secrets："
echo "   进入: https://github.com/Liyixi33-89/node-or-react/settings/secrets/actions"
echo "   添加以下 Secrets:"
echo "   - SERVER_HOST: 39.108.91.231"
echo "   - SERVER_USER: root"
echo "   - SERVER_SSH_KEY: (你的 SSH 私钥)"
echo ""
echo "6️⃣  测试访问："
echo "   http://39.108.91.231"
echo ""
echo -e "${GREEN}🎉 准备就绪！现在可以推送代码触发自动部署了！${NC}"
