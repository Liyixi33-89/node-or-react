#!/bin/bash

###############################################################################
# MongoDB 安装修复脚本
# 用途: 修复 MongoDB 404 错误，自动检测系统并安装合适的版本
###############################################################################

set -e

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}"
echo "=========================================="
echo "  MongoDB 安装修复脚本"
echo "=========================================="
echo -e "${NC}"

# 检测系统版本
echo -e "${YELLOW}检测系统版本...${NC}"
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_NAME=$ID
    OS_VERSION=$VERSION_ID
    echo "系统: $NAME $VERSION"
else
    echo -e "${RED}无法检测系统版本${NC}"
    exit 1
fi

# 确定 Red Hat 版本
if [[ "$OS_NAME" == "alinux" ]] || [[ "$OS_NAME" == "alios" ]]; then
    REDHAT_VERSION=7
    echo "检测到阿里云 Linux，使用 Red Hat 7 仓库"
elif [[ "$OS_NAME" == "centos" ]]; then
    REDHAT_VERSION=${OS_VERSION%%.*}
    echo "检测到 CentOS $REDHAT_VERSION"
elif [[ "$OS_NAME" == "rhel" ]]; then
    REDHAT_VERSION=${OS_VERSION%%.*}
    echo "检测到 Red Hat Enterprise Linux $REDHAT_VERSION"
else
    REDHAT_VERSION=7
    echo "未知系统，默认使用 Red Hat 7 仓库"
fi

# 清理旧的仓库配置
echo -e "${YELLOW}清理旧的 MongoDB 仓库配置...${NC}"
rm -f /etc/yum.repos.d/mongodb-org-*.repo

# 方法1: 尝试安装 MongoDB 6.0
echo -e "${YELLOW}方法1: 尝试安装 MongoDB 6.0...${NC}"
cat > /etc/yum.repos.d/mongodb-org-6.0.repo <<EOF
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$REDHAT_VERSION/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
EOF

if yum install -y mongodb-org 2>/dev/null; then
    echo -e "${GREEN}✅ MongoDB 6.0 安装成功${NC}"
    MONGODB_INSTALLED=true
else
    echo -e "${YELLOW}MongoDB 6.0 安装失败${NC}"
    MONGODB_INSTALLED=false
fi

# 方法2: 尝试安装 MongoDB 5.0
if [ "$MONGODB_INSTALLED" = false ]; then
    echo -e "${YELLOW}方法2: 尝试安装 MongoDB 5.0...${NC}"
    cat > /etc/yum.repos.d/mongodb-org-5.0.repo <<EOF
[mongodb-org-5.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$REDHAT_VERSION/mongodb-org/5.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-5.0.asc
EOF
    
    if yum install -y mongodb-org 2>/dev/null; then
        echo -e "${GREEN}✅ MongoDB 5.0 安装成功${NC}"
        MONGODB_INSTALLED=true
    else
        echo -e "${YELLOW}MongoDB 5.0 安装失败${NC}"
        MONGODB_INSTALLED=false
    fi
fi

# 方法3: 使用 EPEL 仓库
if [ "$MONGODB_INSTALLED" = false ]; then
    echo -e "${YELLOW}方法3: 使用 EPEL 仓库安装 MongoDB...${NC}"
    yum install -y epel-release
    
    if yum install -y mongodb-server mongodb 2>/dev/null; then
        echo -e "${GREEN}✅ MongoDB (EPEL) 安装成功${NC}"
        MONGODB_INSTALLED=true
    else
        echo -e "${RED}❌ 所有安装方法都失败了${NC}"
        exit 1
    fi
fi

# 配置 MongoDB
echo -e "${YELLOW}配置 MongoDB...${NC}"

# 创建数据目录
mkdir -p /var/lib/mongo
mkdir -p /var/log/mongodb
chown -R mongod:mongod /var/lib/mongo 2>/dev/null || chown -R mongodb:mongodb /var/lib/mongo 2>/dev/null
chown -R mongod:mongod /var/log/mongodb 2>/dev/null || chown -R mongodb:mongodb /var/log/mongodb 2>/dev/null

# 启动 MongoDB
echo -e "${YELLOW}启动 MongoDB...${NC}"
if systemctl start mongod 2>/dev/null; then
    systemctl enable mongod
    SERVICE_NAME="mongod"
elif systemctl start mongodb 2>/dev/null; then
    systemctl enable mongodb
    SERVICE_NAME="mongodb"
else
    echo -e "${RED}❌ MongoDB 启动失败${NC}"
    exit 1
fi

# 验证 MongoDB
echo -e "${YELLOW}验证 MongoDB...${NC}"
sleep 3

if systemctl is-active --quiet $SERVICE_NAME; then
    echo -e "${GREEN}✅ MongoDB 运行正常${NC}"
    
    # 显示版本信息
    if command -v mongod &> /dev/null; then
        MONGO_VERSION=$(mongod --version | head -n 1)
        echo "MongoDB 版本: $MONGO_VERSION"
    fi
    
    # 显示状态
    systemctl status $SERVICE_NAME --no-pager | head -n 10
else
    echo -e "${RED}❌ MongoDB 未运行${NC}"
    echo "查看日志:"
    echo "  journalctl -u $SERVICE_NAME -n 50"
    exit 1
fi

echo -e "${GREEN}"
echo "=========================================="
echo "✅ MongoDB 安装完成！"
echo "=========================================="
echo -e "${NC}"

echo -e "${YELLOW}常用命令:${NC}"
echo "  启动: systemctl start $SERVICE_NAME"
echo "  停止: systemctl stop $SERVICE_NAME"
echo "  重启: systemctl restart $SERVICE_NAME"
echo "  状态: systemctl status $SERVICE_NAME"
echo "  连接: mongosh (MongoDB 6.x) 或 mongo (MongoDB 5.x)"
echo ""
echo -e "${GREEN}🎉 现在可以继续部署应用了！${NC}"
