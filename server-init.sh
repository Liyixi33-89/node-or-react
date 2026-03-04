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

# 环境检查函数
check_installed() {
    echo -e "${BLUE}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  🔍 检查已安装的服务"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${NC}"
    
    # 检查 Git
    if command -v git &> /dev/null; then
        echo "✅ Git: $(git --version | awk '{print $3}')"
    else
        echo "❌ Git: 未安装"
    fi
    
    # 检查 Node.js
    if command -v node &> /dev/null; then
        echo "✅ Node.js: $(node -v)"
        echo "✅ NPM: $(npm -v)"
    else
        echo "❌ Node.js: 未安装"
    fi
    
    # 检查 PM2
    if command -v pm2 &> /dev/null; then
        echo "✅ PM2: $(pm2 -v)"
    else
        echo "❌ PM2: 未安装"
    fi
    
    # 检查 MongoDB
    if command -v mongod &> /dev/null || command -v mongo &> /dev/null; then
        if systemctl is-active --quiet mongod 2>/dev/null; then
            echo "✅ MongoDB: 已安装并运行 (mongod)"
        elif systemctl is-active --quiet mongodb 2>/dev/null; then
            echo "✅ MongoDB: 已安装并运行 (mongodb)"
        else
            echo "⚠️  MongoDB: 已安装但未运行"
        fi
    else
        echo "❌ MongoDB: 未安装"
    fi
    
    # 检查 Nginx
    if command -v nginx &> /dev/null; then
        if systemctl is-active --quiet nginx; then
            echo "✅ Nginx: $(nginx -v 2>&1 | awk '{print $3}') - 运行中"
        else
            echo "⚠️  Nginx: $(nginx -v 2>&1 | awk '{print $3}') - 未运行"
        fi
    else
        echo "❌ Nginx: 未安装"
    fi
    
    # 检查防火墙
    if command -v firewall-cmd &> /dev/null; then
        if systemctl is-active --quiet firewalld; then
            echo "✅ Firewalld: 运行中"
        else
            echo "⚠️  Firewalld: 未运行"
        fi
    else
        echo "❌ Firewalld: 未安装"
    fi
    
    # 检查项目目录
    if [ -d "/var/www/taskmanager" ]; then
        echo "✅ 项目目录: /var/www/taskmanager 已存在"
    else
        echo "❌ 项目目录: 未创建"
    fi
    
    echo ""
}

# 执行环境检查
check_installed

echo -e "${YELLOW}开始初始化...${NC}"
echo ""

# 1. 更新系统
echo -e "${YELLOW}[1/9] 更新系统...${NC}"

# 检查并修复 Docker CE 仓库问题
if [ -f /etc/yum.repos.d/docker-ce.repo ]; then
    echo "  检测到 Docker CE 仓库配置..."
    # 测试 Docker 仓库是否可访问
    if ! curl -s --connect-timeout 5 https://download.docker.com/linux/centos/8/x86_64/stable/repodata/repomd.xml > /dev/null 2>&1; then
        echo "  ⚠️  Docker 官方仓库无法访问，替换为阿里云镜像..."
        # 备份原配置
        cp /etc/yum.repos.d/docker-ce.repo /etc/yum.repos.d/docker-ce.repo.bak 2>/dev/null || true
        # 替换为阿里云镜像
        cat > /etc/yum.repos.d/docker-ce.repo <<'EOF'
[docker-ce-stable]
name=Docker CE Stable - $basearch
baseurl=https://mirrors.aliyun.com/docker-ce/linux/centos/$releasever/$basearch/stable
enabled=1
gpgcheck=1
gpgkey=https://mirrors.aliyun.com/docker-ce/linux/centos/gpg

[docker-ce-stable-debuginfo]
name=Docker CE Stable - Debuginfo $basearch
baseurl=https://mirrors.aliyun.com/docker-ce/linux/centos/$releasever/debug-$basearch/stable
enabled=0
gpgcheck=1
gpgkey=https://mirrors.aliyun.com/docker-ce/linux/centos/gpg

[docker-ce-stable-source]
name=Docker CE Stable - Sources
baseurl=https://mirrors.aliyun.com/docker-ce/linux/centos/$releasever/source/stable
enabled=0
gpgcheck=1
gpgkey=https://mirrors.aliyun.com/docker-ce/linux/centos/gpg
EOF
        echo "  ✅ 已替换为阿里云 Docker 镜像"
        yum clean all > /dev/null 2>&1
    else
        echo "  ✓ Docker 仓库可访问"
    fi
fi

# 执行系统更新
echo "  更新系统软件包..."
if yum update -y 2>/dev/null; then
    echo "  ✅ 系统更新完成"
else
    echo -e "  ${YELLOW}⚠️  系统更新遇到问题，尝试跳过有问题的软件包...${NC}"
    yum update -y --skip-broken
    echo "  ✅ 系统更新完成（已跳过部分软件包）"
fi

# 2. 安装基础工具
echo -e "${YELLOW}[2/9] 安装基础工具...${NC}"
TOOLS_TO_INSTALL=""
for tool in git curl wget vim; do
    if ! command -v $tool &> /dev/null; then
        TOOLS_TO_INSTALL="$TOOLS_TO_INSTALL $tool"
    else
        echo "  ✓ $tool 已安装，跳过"
    fi
done

if [ -n "$TOOLS_TO_INSTALL" ]; then
    echo "  安装:$TOOLS_TO_INSTALL"
    yum install -y $TOOLS_TO_INSTALL
else
    echo "  ✅ 所有基础工具已安装"
fi

# 3. 安装 Node.js 18
echo -e "${YELLOW}[3/9] 安装 Node.js 18...${NC}"
if ! command -v node &> /dev/null; then
    echo "  安装 Node.js 18..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
    echo "  ✅ Node.js 安装完成"
else
    NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo "  ⚠️  当前 Node.js 版本 $(node -v) 低于 18，建议升级"
        read -p "  是否升级到 Node.js 18? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
            yum install -y nodejs
        fi
    else
        echo "  ✅ Node.js $(node -v) 已安装，跳过"
    fi
fi
echo "  Node.js 版本: $(node -v)"
echo "  NPM 版本: $(npm -v)"

# 4. 安装 PM2
echo -e "${YELLOW}[4/9] 安装 PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo "  安装 PM2..."
    npm install -g pm2
    pm2 startup systemd -u root --hp /root
    systemctl enable pm2-root
    echo "  ✅ PM2 安装完成"
else
    echo "  ✅ PM2 $(pm2 -v) 已安装，跳过"
    # 确保 PM2 开机自启动已配置
    if ! systemctl is-enabled pm2-root &> /dev/null; then
        echo "  配置 PM2 开机自启动..."
        pm2 startup systemd -u root --hp /root
        systemctl enable pm2-root
    fi
fi

# 5. 安装 MongoDB
echo -e "${YELLOW}[5/9] 安装 MongoDB...${NC}"
if command -v mongod &> /dev/null || command -v mongo &> /dev/null; then
    echo "  ✅ MongoDB 已安装，跳过安装步骤"
else
    echo "  安装 MongoDB..."
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
    elif [[ "$OS_NAME" == "opencloudos" ]] || [[ "$OS_NAME" == "openEuler" ]] || [[ "$OS_NAME" == "anolis" ]]; then
        # OpenCloudOS / openEuler / Anolis 使用主版本号对应的 RHEL 仓库
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

    echo "  ✅ MongoDB 安装完成"
fi

# 确保 MongoDB 正在运行（统一处理）
if ! systemctl is-active --quiet mongod 2>/dev/null && ! systemctl is-active --quiet mongodb 2>/dev/null; then
    echo "  启动 MongoDB..."
    if systemctl start mongod 2>/dev/null || systemctl start mongodb 2>/dev/null; then
        systemctl enable mongod 2>/dev/null || systemctl enable mongodb 2>/dev/null
        echo "  ✅ MongoDB 启动成功"
    else
        echo -e "  ${RED}⚠️  MongoDB 启动失败，请手动检查${NC}"
    fi
else
    echo "  ✅ MongoDB 运行正常"
fi

# 函数：创建 Nginx 官方仓库配置
create_nginx_repo() {
    # 检测系统版本，阿里云 Linux 3 兼容 RHEL 8
    local centos_ver="8"
    if [ -f /etc/os-release ]; then
        if grep -q "Alibaba Cloud Linux" /etc/os-release; then
            centos_ver="8"
        elif grep -q "CentOS Linux 7" /etc/os-release; then
            centos_ver="7"
        fi
    fi
    
    # 优先尝试清华大学镜像（国内速度快且稳定）
    cat > /etc/yum.repos.d/nginx.repo <<EOF
[nginx-stable]
name=nginx stable repo
baseurl=https://mirrors.tuna.tsinghua.edu.cn/nginx/centos/${centos_ver}/\$basearch/
gpgcheck=1
enabled=1
gpgkey=https://nginx.org/keys/nginx_signing.key
module_hotfixes=true
priority=1

[nginx-stable-official]
name=nginx stable repo (official)
baseurl=http://nginx.org/packages/centos/${centos_ver}/\$basearch/
gpgcheck=1
enabled=0
gpgkey=https://nginx.org/keys/nginx_signing.key
module_hotfixes=true
EOF
}

# 6. 安装 Nginx
echo -e "${YELLOW}[6/9] 安装 Nginx...${NC}"

# 检查 Nginx 是否已安装并运行
if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1 | awk '{print $3}')
    if systemctl is-active --quiet nginx; then
        echo "  ✅ Nginx $NGINX_VERSION 已安装并运行，跳过安装和配置"
    else
        echo "  ✅ Nginx $NGINX_VERSION 已安装但未运行"
        echo "  启动 Nginx..."
        systemctl start nginx
        systemctl enable nginx
        echo "  ✅ Nginx 已启动"
    fi
else
    # Nginx 未安装，执行安装流程
    echo "  Nginx 未安装，开始安装..."
    
    # 检查是否是阿里云服务器（已有 epel-aliyuncs-release）
    if rpm -qa | grep -q epel-aliyuncs-release; then
        echo "  ✓ 检测到阿里云 EPEL 仓库"
        echo "  快速刷新 yum 缓存..."
        yum clean expire-cache > /dev/null 2>&1
        timeout 30 yum makecache fast > /dev/null 2>&1 || echo "  ⚠️  缓存刷新超时，继续安装..."
        
        echo "  安装 Nginx（使用阿里云 EPEL）..."
        # 如果存在 Docker 仓库，禁用它以避免安装被阻塞
        DISABLE_REPOS=""
        if [ -f /etc/yum.repos.d/docker-ce.repo ]; then
            DISABLE_REPOS="--disablerepo=docker-ce-stable"
        fi
        
        if timeout 120 yum install -y nginx $DISABLE_REPOS; then
            echo "  ✅ Nginx 安装完成（使用阿里云 EPEL）"
        else
            echo -e "  ${YELLOW}⚠️  阿里云 EPEL 安装失败，尝试使用官方仓库...${NC}"
            create_nginx_repo
            timeout 120 yum install -y nginx $DISABLE_REPOS
            echo "  ✅ Nginx 安装完成（使用官方仓库）"
        fi
    else
        # 非阿里云服务器
        # 如果存在 Docker 仓库，禁用它以避免安装被阻塞
        DISABLE_REPOS=""
        if [ -f /etc/yum.repos.d/docker-ce.repo ]; then
            DISABLE_REPOS="--disablerepo=docker-ce-stable"
        fi

        # 检测是否为 OpenCloudOS / openEuler / Anolis（不支持 epel-release）
        SKIP_EPEL=false
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            if [[ "$ID" == "opencloudos" ]] || [[ "$ID" == "openEuler" ]] || [[ "$ID" == "anolis" ]]; then
                SKIP_EPEL=true
                echo "  检测到 $ID，跳过 EPEL，直接使用 dnf/官方仓库安装 Nginx..."
            fi
        fi

        if [ "$SKIP_EPEL" = false ]; then
            # 标准 EPEL 安装流程
            echo "  检查 EPEL 仓库..."
            if ! rpm -qa | grep -q epel-release; then
                echo "  安装 EPEL 仓库..."
                yum install -y epel-release
                echo "  ✅ EPEL 仓库安装完成"
            else
                echo "  ✓ EPEL 仓库已安装"
            fi
        fi

        echo "  安装 Nginx..."
        if yum install -y nginx $DISABLE_REPOS 2>/dev/null || dnf install -y nginx $DISABLE_REPOS 2>/dev/null; then
            echo "  ✅ Nginx 安装完成"
        else
            echo -e "  ${YELLOW}⚠️  直接安装失败，尝试使用 Nginx 官方仓库...${NC}"
            create_nginx_repo
            if yum install -y nginx $DISABLE_REPOS || dnf install -y nginx $DISABLE_REPOS; then
                echo "  ✅ Nginx 安装完成（使用官方仓库）"
            else
                echo -e "  ${RED}❌ Nginx 安装失败，请手动安装${NC}"
            fi
        fi
    fi
    
    # 确保 Nginx 正在运行
    if ! systemctl is-active --quiet nginx; then
        echo "  启动 Nginx..."
        systemctl start nginx
    fi
    systemctl enable nginx
    echo "  ✅ Nginx 运行正常"
fi

# 7. 配置防火墙
echo -e "${YELLOW}[7/9] 配置防火墙...${NC}"
if command -v firewall-cmd &> /dev/null; then
    if ! systemctl is-active --quiet firewalld; then
        echo "  启动 firewalld..."
        systemctl start firewalld
        systemctl enable firewalld
    fi
    
    # 检查端口是否已开放
    NEED_RELOAD=false
    
    if ! firewall-cmd --list-services | grep -q "http"; then
        echo "  开放 HTTP 端口..."
        firewall-cmd --permanent --add-service=http
        NEED_RELOAD=true
    else
        echo "  ✓ HTTP 端口已开放"
    fi
    
    if ! firewall-cmd --list-services | grep -q "https"; then
        echo "  开放 HTTPS 端口..."
        firewall-cmd --permanent --add-service=https
        NEED_RELOAD=true
    else
        echo "  ✓ HTTPS 端口已开放"
    fi
    
    if ! firewall-cmd --list-ports | grep -q "3000/tcp"; then
        echo "  开放 3000 端口..."
        firewall-cmd --permanent --add-port=3000/tcp
        NEED_RELOAD=true
    else
        echo "  ✓ 3000 端口已开放"
    fi
    
    if [ "$NEED_RELOAD" = true ]; then
        firewall-cmd --reload
        echo "  ✅ 防火墙配置已更新"
    else
        echo "  ✅ 防火墙已正确配置"
    fi
else
    echo "  ⚠️  firewalld 未安装，跳过防火墙配置"
fi

# 8. 创建项目目录
echo -e "${YELLOW}[8/9] 创建项目目录...${NC}"
DIRS_CREATED=0
for dir in /var/www/taskmanager /var/www/backups /var/log/taskmanager; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        echo "  ✓ 创建目录: $dir"
        DIRS_CREATED=$((DIRS_CREATED + 1))
    else
        echo "  ✓ 目录已存在: $dir"
    fi
done

if [ $DIRS_CREATED -gt 0 ]; then
    echo "  ✅ 创建了 $DIRS_CREATED 个新目录"
else
    echo "  ✅ 所有目录已存在"
fi

# 函数：创建 Nginx 配置文件
create_nginx_config() {
    # 动态检测 Nginx 配置目录
    local nginx_conf_dir=""
    local nginx_bin=$(which nginx 2>/dev/null)
    
    if [ -z "$nginx_bin" ]; then
        echo "  ❌ 无法找到 Nginx 可执行文件"
        return 1
    fi
    
    # 获取 Nginx 配置文件路径
    local nginx_conf=$(nginx -V 2>&1 | grep -o 'conf-path=[^ ]*' | cut -d= -f2)
    
    if [ -z "$nginx_conf" ]; then
        # 如果无法获取，使用默认路径
        if [ -d "/etc/nginx/conf.d" ]; then
            nginx_conf_dir="/etc/nginx/conf.d"
        elif [ -d "/usr/local/nginx/conf/conf.d" ]; then
            nginx_conf_dir="/usr/local/nginx/conf/conf.d"
        else
            # 创建 conf.d 目录
            local base_conf_dir=$(dirname "$nginx_conf" 2>/dev/null || echo "/usr/local/nginx/conf")
            nginx_conf_dir="${base_conf_dir}/conf.d"
        fi
    else
        # 从主配置文件路径推导 conf.d 目录
        local base_conf_dir=$(dirname "$nginx_conf")
        nginx_conf_dir="${base_conf_dir}/conf.d"
    fi
    
    # 确保 conf.d 目录存在
    if [ ! -d "$nginx_conf_dir" ]; then
        echo "  创建配置目录: $nginx_conf_dir"
        mkdir -p "$nginx_conf_dir"
    fi
    
    # 确保主配置文件包含 conf.d 目录
    if [ -n "$nginx_conf" ] && [ -f "$nginx_conf" ]; then
        if ! grep -q "include.*conf.d/\*.conf" "$nginx_conf"; then
            echo "  配置主配置文件包含 conf.d 目录..."
            # 在 http 块中添加 include 指令
            sed -i '/http {/a\    include '"$nginx_conf_dir"'/*.conf;' "$nginx_conf"
        fi
    fi
    
    echo "  使用配置目录: $nginx_conf_dir"
    
    # 创建配置文件
    cat > "${nginx_conf_dir}/taskmanager.conf" <<'EOF'
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
}

# 9. 配置 Nginx
echo -e "${YELLOW}[9/9] 配置 Nginx...${NC}"

# 检查 Nginx 是否已安装
if ! command -v nginx &> /dev/null; then
    echo "  ⚠️  Nginx 未安装，跳过配置步骤"
else
    # 动态检测 Nginx 路径
    NGINX_BIN=$(which nginx)
    echo "  检测到 Nginx: $NGINX_BIN"
    
    # 获取配置文件路径
    NGINX_CONF=$(nginx -V 2>&1 | grep -o 'conf-path=[^ ]*' | cut -d= -f2)
    if [ -z "$NGINX_CONF" ]; then
        NGINX_CONF="/usr/local/nginx/conf/nginx.conf"
    fi
    echo "  主配置文件: $NGINX_CONF"
    
    # 推导 conf.d 目录
    NGINX_CONF_DIR=$(dirname "$NGINX_CONF")/conf.d
    TASKMANAGER_CONF="${NGINX_CONF_DIR}/taskmanager.conf"
    
    if [ -f "$TASKMANAGER_CONF" ]; then
        echo "  ⚠️  Nginx 配置文件已存在: $TASKMANAGER_CONF"
        read -p "  是否覆盖现有配置? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "  ✓ 保留现有配置"
        else
            echo "  更新 Nginx 配置..."
            if create_nginx_config; then
                # 测试 Nginx 配置
                if nginx -t 2>/dev/null; then
                    # 尝试使用 systemctl，如果失败则使用 nginx -s reload
                    if systemctl reload nginx 2>/dev/null; then
                        echo "  ✅ Nginx 配置已更新（systemctl）"
                    else
                        nginx -s reload 2>/dev/null && echo "  ✅ Nginx 配置已更新（nginx -s reload）" || echo "  ⚠️  请手动重载 Nginx"
                    fi
                else
                    echo -e "  ${RED}❌ Nginx 配置测试失败${NC}"
                    nginx -t
                fi
            fi
        fi
    else
        echo "  创建 Nginx 配置..."
        if create_nginx_config; then
            # 测试 Nginx 配置
            if nginx -t 2>/dev/null; then
                # 尝试使用 systemctl，如果失败则使用 nginx -s reload
                if systemctl reload nginx 2>/dev/null; then
                    echo "  ✅ Nginx 配置已创建（systemctl）"
                else
                    nginx -s reload 2>/dev/null && echo "  ✅ Nginx 配置已创建（nginx -s reload）" || echo "  ⚠️  请手动重载 Nginx"
                fi
            else
                echo -e "  ${RED}❌ Nginx 配置测试失败${NC}"
                nginx -t
            fi
        fi
    fi
fi

echo ""
echo -e "${GREEN}"
echo "=========================================="
echo "✅ 服务器初始化完成！"
echo "=========================================="
echo -e "${NC}"

# 最终环境检查
echo -e "${BLUE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📊 最终环境状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"
echo ""
echo "✅ Node.js: $(node -v)"
echo "✅ NPM: $(npm -v)"
echo "✅ PM2: $(pm2 -v)"
echo "✅ Nginx: $(nginx -v 2>&1 | awk '{print $3}')"
if systemctl is-active --quiet mongod 2>/dev/null; then
    echo "✅ MongoDB: 运行中 (mongod)"
elif systemctl is-active --quiet mongodb 2>/dev/null; then
    echo "✅ MongoDB: 运行中 (mongodb)"
else
    echo "⚠️  MongoDB: 未运行"
fi
echo "✅ 项目目录: /var/www/taskmanager"
echo ""

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
