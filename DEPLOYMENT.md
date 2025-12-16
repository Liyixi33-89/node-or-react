# 考勤系统 - 生产环境部署指南

## 📋 目录

- [系统要求](#系统要求)
- [部署架构](#部署架构)
- [快速部署](#快速部署)
- [手动部署](#手动部署)
- [数据库部署](#数据库部署)
- [Nginx 配置](#nginx-配置)
- [安全加固](#安全加固)
- [监控与维护](#监控与维护)
- [常见问题](#常见问题)

---

## 🖥️ 系统要求

### 服务器配置

**最低配置**：
- CPU: 1核
- 内存: 2GB
- 硬盘: 20GB
- 操作系统: Ubuntu 20.04+ / CentOS 7+

**推荐配置**：
- CPU: 2核+
- 内存: 4GB+
- 硬盘: 50GB+
- 操作系统: Ubuntu 22.04 LTS

### 软件依赖

- Node.js 18.x+
- MongoDB 6.0+
- Nginx 1.18+
- PM2 5.x+
- Git

---

## 🏗️ 部署架构

```
┌─────────────────────────────────────────────────────────┐
│                        用户浏览器                         │
└─────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS (443)
                            ↓
┌─────────────────────────────────────────────────────────┐
│                      Nginx 反向代理                       │
│  - SSL/TLS 加密                                          │
│  - 静态文件服务                                           │
│  - API 请求转发                                          │
│  - 安全头部                                              │
│  - 限流防护                                              │
└─────────────────────────────────────────────────────────┘
            │                           │
            │ 静态文件                   │ API 请求
            ↓                           ↓
┌──────────────────────┐    ┌──────────────────────────┐
│   前端静态文件         │    │   Node.js 后端服务        │
│   /var/www/frontend   │    │   PM2 进程管理            │
│   - React 应用        │    │   - Koa2 框架            │
│   - 打包后的资源      │    │   - RESTful API          │
└──────────────────────┘    │   - 定时任务              │
                            └──────────────────────────┘
                                        │
                                        │ MongoDB 连接
                                        ↓
                            ┌──────────────────────────┐
                            │   MongoDB 数据库          │
                            │   - 用户数据              │
                            │   - 考勤记录              │
                            │   - 自动备份              │
                            └──────────────────────────┘
```

---

## 🚀 快速部署

### 方式一：使用自动化脚本（推荐）

```bash
# 1. 上传项目到服务器
scp -r TaskManager root@your-server-ip:/root/

# 2. 登录服务器
ssh root@your-server-ip

# 3. 进入项目目录
cd /root/TaskManager

# 4. 给脚本添加执行权限
chmod +x deploy.sh

# 5. 运行部署脚本
./deploy.sh

# 6. 编辑环境变量（根据提示）
nano /var/www/attendance/backend/.env

# 7. 重启后端服务
pm2 restart attendance-backend
```

### 方式二：Docker 部署（待实现）

```bash
# 使用 Docker Compose 一键部署
docker-compose up -d
```

---

## 🔧 手动部署

### 1. 安装系统依赖

#### Ubuntu/Debian

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# 启动 MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# 安装 Nginx
sudo apt install -y nginx

# 安装 PM2
sudo npm install -g pm2

# 安装 Git
sudo apt install -y git
```

#### CentOS/RHEL

```bash
# 安装 Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 安装 MongoDB
sudo tee /etc/yum.repos.d/mongodb-org-6.0.repo <<EOF
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/\$releasever/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
EOF

sudo yum install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# 安装 Nginx
sudo yum install -y nginx

# 安装 PM2
sudo npm install -g pm2
```

### 2. 创建部署目录

```bash
# 创建项目目录
sudo mkdir -p /var/www/attendance/{backend,frontend}
sudo mkdir -p /var/www/attendance/backend/logs

# 设置权限
sudo chown -R $USER:$USER /var/www/attendance
```

### 3. 部署后端

```bash
# 上传后端代码
cd /var/www/attendance/backend
git clone <your-repo-url> .
# 或者使用 scp 上传

# 安装依赖
npm install --production

# 配置环境变量
cp .env.production .env
nano .env

# 修改以下配置：
# NODE_ENV=production
# PORT=3000
# MONGODB_URI=mongodb://localhost:27017/attendance

# 启动服务
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 4. 部署前端

```bash
# 在本地构建前端
cd frontend
npm install
npm run build

# 上传构建产物到服务器
scp -r dist/* root@your-server-ip:/var/www/attendance/frontend/

# 或者在服务器上构建
cd /var/www/attendance/frontend
npm install
npm run build
cp -r dist/* /var/www/attendance/frontend/
```

### 5. 配置 Nginx

```bash
# 复制 Nginx 配置
sudo cp nginx.conf /etc/nginx/sites-available/attendance

# 修改配置文件中的域名
sudo nano /etc/nginx/sites-available/attendance
# 将 yourdomain.com 替换为你的实际域名

# 创建软链接
sudo ln -s /etc/nginx/sites-available/attendance /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

---

## 🗄️ 数据库部署

### MongoDB 配置

#### 1. 基础配置

```bash
# 编辑 MongoDB 配置文件
sudo nano /etc/mongod.conf
```

```yaml
# 网络配置
net:
  port: 27017
  bindIp: 127.0.0.1  # 只允许本地访问（安全）

# 存储配置
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true

# 日志配置
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

# 安全配置（推荐启用）
security:
  authorization: enabled
```

#### 2. 创建数据库用户（推荐）

```bash
# 进入 MongoDB Shell
mongosh

# 切换到 admin 数据库
use admin

# 创建管理员用户
db.createUser({
  user: "admin",
  pwd: "your-strong-password",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})

# 切换到应用数据库
use attendance

# 创建应用用户
db.createUser({
  user: "attendance_user",
  pwd: "your-app-password",
  roles: [ { role: "readWrite", db: "attendance" } ]
})

# 退出
exit
```

#### 3. 更新后端配置

```bash
# 编辑环境变量
nano /var/www/attendance/backend/.env

# 修改数据库连接字符串
MONGODB_URI=mongodb://attendance_user:your-app-password@localhost:27017/attendance?authSource=attendance
```

#### 4. 重启服务

```bash
# 重启 MongoDB
sudo systemctl restart mongod

# 重启后端
pm2 restart attendance-backend
```

### MongoDB 备份策略

#### 自动备份脚本

```bash
# 创建备份脚本
sudo nano /usr/local/bin/mongodb-backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份数据库
mongodump --db attendance --out $BACKUP_DIR/backup_$DATE

# 压缩备份
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/backup_$DATE
rm -rf $BACKUP_DIR/backup_$DATE

# 删除7天前的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/backup_$DATE.tar.gz"
```

```bash
# 添加执行权限
sudo chmod +x /usr/local/bin/mongodb-backup.sh

# 添加到 crontab（每天凌晨2点备份）
sudo crontab -e
# 添加以下行：
0 2 * * * /usr/local/bin/mongodb-backup.sh >> /var/log/mongodb-backup.log 2>&1
```

---

## 🔒 安全加固

### 1. 配置防火墙

```bash
# Ubuntu (UFW)
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable

# CentOS (Firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. 配置 SSL/TLS 证书

#### 使用 Let's Encrypt（免费）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 自动续期（Certbot 会自动添加 cron 任务）
sudo certbot renew --dry-run
```

#### 手动配置证书

```bash
# 将证书文件上传到服务器
sudo mkdir -p /etc/nginx/ssl
sudo cp your-cert.crt /etc/nginx/ssl/
sudo cp your-key.key /etc/nginx/ssl/

# 修改 Nginx 配置
sudo nano /etc/nginx/sites-available/attendance
# 更新证书路径：
# ssl_certificate /etc/nginx/ssl/your-cert.crt;
# ssl_certificate_key /etc/nginx/ssl/your-key.key;
```

### 3. 配置 Nginx 安全头部

已在 `nginx.conf` 中配置：

```nginx
# HSTS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# 防止点击劫持
add_header X-Frame-Options "SAMEORIGIN" always;

# 防止 MIME 类型嗅探
add_header X-Content-Type-Options "nosniff" always;

# XSS 保护
add_header X-XSS-Protection "1; mode=block" always;

# Referrer 策略
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

### 4. 限流防护

```nginx
# 在 nginx.conf 中已配置
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req zone=api_limit burst=20 nodelay;
```

### 5. 禁用不必要的服务

```bash
# 禁用 MongoDB 远程访问（如果不需要）
sudo nano /etc/mongod.conf
# 确保 bindIp: 127.0.0.1

# 重启 MongoDB
sudo systemctl restart mongod
```

### 6. 定期更新系统

```bash
# Ubuntu
sudo apt update && sudo apt upgrade -y

# CentOS
sudo yum update -y
```

### 7. 配置 Fail2Ban（防止暴力破解）

```bash
# 安装 Fail2Ban
sudo apt install -y fail2ban

# 配置 SSH 保护
sudo nano /etc/fail2ban/jail.local
```

```ini
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
```

```bash
# 启动 Fail2Ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

---

## 📊 监控与维护

### 1. PM2 监控

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs attendance-backend

# 查看实时日志
pm2 logs attendance-backend --lines 100

# 查看错误日志
pm2 logs attendance-backend --err

# 监控面板
pm2 monit
```

### 2. Nginx 日志

```bash
# 访问日志
tail -f /var/log/nginx/attendance_access.log

# 错误日志
tail -f /var/log/nginx/attendance_error.log

# 分析访问日志
sudo apt install -y goaccess
goaccess /var/log/nginx/attendance_access.log -o report.html --log-format=COMBINED
```

### 3. MongoDB 监控

```bash
# 查看数据库状态
mongosh --eval "db.serverStatus()"

# 查看数据库大小
mongosh attendance --eval "db.stats()"

# 查看集合统计
mongosh attendance --eval "db.attendances.stats()"
```

### 4. 系统资源监控

```bash
# 安装 htop
sudo apt install -y htop

# 查看系统资源
htop

# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看网络连接
netstat -tulpn
```

### 5. 配置监控告警（可选）

#### 使用 PM2 Plus（免费版）

```bash
# 注册 PM2 Plus
pm2 link <secret_key> <public_key>

# 在 https://app.pm2.io 查看监控数据
```

---

## 🔄 常用运维命令

### 后端服务管理

```bash
# 启动服务
pm2 start ecosystem.config.js --env production

# 停止服务
pm2 stop attendance-backend

# 重启服务
pm2 restart attendance-backend

# 删除服务
pm2 delete attendance-backend

# 查看日志
pm2 logs attendance-backend

# 清空日志
pm2 flush

# 保存配置
pm2 save

# 开机自启
pm2 startup
```

### Nginx 管理

```bash
# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx

# 重新加载配置（不中断服务）
sudo systemctl reload nginx

# 查看状态
sudo systemctl status nginx

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

### MongoDB 管理

```bash
# 启动 MongoDB
sudo systemctl start mongod

# 停止 MongoDB
sudo systemctl stop mongod

# 重启 MongoDB
sudo systemctl restart mongod

# 查看状态
sudo systemctl status mongod

# 进入 MongoDB Shell
mongosh

# 备份数据库
mongodump --db attendance --out /backup/

# 恢复数据库
mongorestore --db attendance /backup/attendance/
```

---

## ❓ 常见问题

### 1. 后端服务无法启动

**问题**：`pm2 start` 后服务立即退出

**解决方案**：
```bash
# 查看详细日志
pm2 logs attendance-backend --lines 100

# 常见原因：
# 1. MongoDB 未启动
sudo systemctl start mongod

# 2. 端口被占用
sudo lsof -i :3000
sudo kill -9 <PID>

# 3. 环境变量配置错误
nano /var/www/attendance/backend/.env
```

### 2. Nginx 502 Bad Gateway

**问题**：访问网站显示 502 错误

**解决方案**：
```bash
# 1. 检查后端服务是否运行
pm2 status

# 2. 检查端口是否正确
curl http://localhost:3000/health

# 3. 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/attendance_error.log

# 4. 检查 SELinux（CentOS）
sudo setenforce 0
```

### 3. 前端页面空白

**问题**：访问网站显示空白页面

**解决方案**：
```bash
# 1. 检查前端文件是否存在
ls -la /var/www/attendance/frontend/

# 2. 检查 Nginx 配置
sudo nginx -t

# 3. 查看浏览器控制台错误

# 4. 检查 API 地址配置
# 确保前端 API 地址指向正确的后端
```

### 4. MongoDB 连接失败

**问题**：后端无法连接 MongoDB

**解决方案**：
```bash
# 1. 检查 MongoDB 是否运行
sudo systemctl status mongod

# 2. 检查连接字符串
nano /var/www/attendance/backend/.env

# 3. 测试连接
mongosh "mongodb://localhost:27017/attendance"

# 4. 检查防火墙
sudo ufw status
```

### 5. SSL 证书问题

**问题**：HTTPS 无法访问或证书错误

**解决方案**：
```bash
# 1. 检查证书文件
sudo ls -la /etc/letsencrypt/live/yourdomain.com/

# 2. 续期证书
sudo certbot renew

# 3. 检查 Nginx 配置
sudo nginx -t

# 4. 重启 Nginx
sudo systemctl restart nginx
```

---

## 📞 技术支持

如遇到其他问题，请：

1. 查看日志文件
2. 检查系统资源
3. 验证配置文件
4. 搜索错误信息

---

## 📝 更新日志

- **v1.0.0** (2025-12-16)
  - 初始版本
  - 完整的部署文档
  - 自动化部署脚本
  - 安全加固指南

---

**祝部署顺利！🎉**
