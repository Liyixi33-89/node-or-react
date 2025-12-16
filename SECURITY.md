# 网站安全防护清单

## 🛡️ 安全检查清单

### ✅ 服务器安全

- [ ] **SSH 安全配置**
  - [ ] 禁用 root 直接登录
  - [ ] 使用 SSH 密钥认证
  - [ ] 修改默认 SSH 端口（可选）
  - [ ] 配置 Fail2Ban 防暴力破解

- [ ] **防火墙配置**
  - [ ] 只开放必要端口（22, 80, 443）
  - [ ] 配置 UFW/Firewalld
  - [ ] 限制 MongoDB 端口（27017）仅本地访问

- [ ] **系统更新**
  - [ ] 定期更新系统补丁
  - [ ] 更新 Node.js 和依赖包
  - [ ] 更新 Nginx 和 MongoDB

### ✅ 应用安全

- [ ] **环境变量保护**
  - [ ] 不在代码中硬编码敏感信息
  - [ ] 使用 .env 文件管理配置
  - [ ] .env 文件权限设置为 600

- [ ] **数据库安全**
  - [ ] 启用 MongoDB 认证
  - [ ] 创建专用数据库用户
  - [ ] 使用强密码
  - [ ] 定期备份数据

- [ ] **密码安全**
  - [ ] 使用 SHA256 双重加密
  - [ ] 密码长度限制（6-8位）
  - [ ] 密码复杂度要求

- [ ] **API 安全**
  - [ ] 实现请求限流
  - [ ] 添加 CORS 白名单
  - [ ] 验证输入参数
  - [ ] 防止 SQL/NoSQL 注入

### ✅ Nginx 安全

- [ ] **SSL/TLS 配置**
  - [ ] 使用 HTTPS（Let's Encrypt）
  - [ ] 强制 HTTP 跳转 HTTPS
  - [ ] 配置 HSTS 头部
  - [ ] 使用 TLS 1.2/1.3

- [ ] **安全头部**
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
  - [ ] X-XSS-Protection
  - [ ] Referrer-Policy
  - [ ] Content-Security-Policy（可选）

- [ ] **限流防护**
  - [ ] 配置请求速率限制
  - [ ] 限制请求体大小
  - [ ] 防止 DDoS 攻击

### ✅ 监控与日志

- [ ] **日志管理**
  - [ ] 启用访问日志
  - [ ] 启用错误日志
  - [ ] 定期清理旧日志
  - [ ] 日志轮转配置

- [ ] **监控告警**
  - [ ] 配置 PM2 监控
  - [ ] 监控服务器资源
  - [ ] 配置异常告警

- [ ] **备份策略**
  - [ ] 每日自动备份数据库
  - [ ] 保留至少7天备份
  - [ ] 测试备份恢复流程

---

## 🔐 详细安全配置

### 1. SSH 安全加固

```bash
# 编辑 SSH 配置
sudo nano /etc/ssh/sshd_config

# 修改以下配置：
Port 22                          # 可改为其他端口
PermitRootLogin no               # 禁止 root 登录
PasswordAuthentication no        # 禁用密码登录（使用密钥）
PubkeyAuthentication yes         # 启用密钥认证
MaxAuthTries 3                   # 最大认证尝试次数
ClientAliveInterval 300          # 5分钟无活动断开
ClientAliveCountMax 2

# 重启 SSH 服务
sudo systemctl restart sshd
```

### 2. 创建非 root 用户

```bash
# 创建新用户
sudo adduser deploy

# 添加到 sudo 组
sudo usermod -aG sudo deploy

# 配置 SSH 密钥
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys

# 切换到新用户
su - deploy
```

### 3. 配置 Fail2Ban

```bash
# 安装 Fail2Ban
sudo apt install -y fail2ban

# 创建配置文件
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
destemail = your-email@example.com
sendername = Fail2Ban
action = %(action_mwl)s

[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
```

```bash
# 启动 Fail2Ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# 查看状态
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

### 4. MongoDB 安全配置

```bash
# 编辑 MongoDB 配置
sudo nano /etc/mongod.conf
```

```yaml
# 网络配置
net:
  port: 27017
  bindIp: 127.0.0.1  # 只允许本地访问

# 安全配置
security:
  authorization: enabled

# 日志配置
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log
  logRotate: reopen
```

```bash
# 创建管理员用户
mongosh

use admin
db.createUser({
  user: "admin",
  pwd: passwordPrompt(),  // 会提示输入密码
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" }
  ]
})

# 创建应用用户
use attendance
db.createUser({
  user: "attendance_user",
  pwd: passwordPrompt(),
  roles: [
    { role: "readWrite", db: "attendance" }
  ]
})

exit

# 重启 MongoDB
sudo systemctl restart mongod
```

### 5. 环境变量保护

```bash
# 设置 .env 文件权限
chmod 600 /var/www/attendance/backend/.env

# 确保 .env 不被 Git 追踪
echo ".env" >> .gitignore
echo ".env.production" >> .gitignore
```

### 6. Nginx 安全头部（完整版）

```nginx
# 在 nginx.conf 的 server 块中添加

# HSTS（强制 HTTPS）
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# 防止点击劫持
add_header X-Frame-Options "SAMEORIGIN" always;

# 防止 MIME 类型嗅探
add_header X-Content-Type-Options "nosniff" always;

# XSS 保护
add_header X-XSS-Protection "1; mode=block" always;

# Referrer 策略
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# 内容安全策略（CSP）
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self';" always;

# 权限策略
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

### 7. API 限流配置

```nginx
# 在 nginx.conf 的 http 块中添加

# 限制请求速率
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

# 限制连接数
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

# 在 server 块中应用
location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    limit_conn conn_limit 10;
    # ... 其他配置
}

location /api/user/login {
    limit_req zone=login_limit burst=3 nodelay;
    # ... 其他配置
}
```

### 8. 定期备份脚本

```bash
# 创建备份脚本
sudo nano /usr/local/bin/full-backup.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/attendance"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

mkdir -p $BACKUP_DIR

echo "开始备份 - $DATE"

# 1. 备份 MongoDB
echo "备份数据库..."
mongodump --db attendance --out $BACKUP_DIR/db_$DATE
tar -czf $BACKUP_DIR/db_$DATE.tar.gz $BACKUP_DIR/db_$DATE
rm -rf $BACKUP_DIR/db_$DATE

# 2. 备份应用代码
echo "备份应用代码..."
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/attendance

# 3. 备份 Nginx 配置
echo "备份 Nginx 配置..."
tar -czf $BACKUP_DIR/nginx_$DATE.tar.gz /etc/nginx/sites-available/attendance

# 4. 删除旧备份
echo "清理旧备份..."
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "备份完成 - $DATE"
echo "备份位置: $BACKUP_DIR"
ls -lh $BACKUP_DIR/*$DATE*
```

```bash
# 添加执行权限
sudo chmod +x /usr/local/bin/full-backup.sh

# 添加到 crontab（每天凌晨2点）
sudo crontab -e
0 2 * * * /usr/local/bin/full-backup.sh >> /var/log/backup.log 2>&1
```

### 9. 监控脚本

```bash
# 创建监控脚本
sudo nano /usr/local/bin/health-check.sh
```

```bash
#!/bin/bash

# 检查后端服务
if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "后端服务异常，尝试重启..."
    pm2 restart attendance-backend
    # 发送告警邮件（需配置 mail 命令）
    # echo "后端服务异常" | mail -s "服务告警" your-email@example.com
fi

# 检查 Nginx
if ! systemctl is-active --quiet nginx; then
    echo "Nginx 服务异常，尝试重启..."
    systemctl restart nginx
fi

# 检查 MongoDB
if ! systemctl is-active --quiet mongod; then
    echo "MongoDB 服务异常，尝试重启..."
    systemctl restart mongod
fi

# 检查磁盘空间
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "磁盘空间不足: ${DISK_USAGE}%"
    # 发送告警
fi

# 检查内存使用
MEM_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2*100}')
if [ $MEM_USAGE -gt 90 ]; then
    echo "内存使用过高: ${MEM_USAGE}%"
    # 发送告警
fi
```

```bash
# 添加执行权限
sudo chmod +x /usr/local/bin/health-check.sh

# 添加到 crontab（每5分钟检查一次）
sudo crontab -e
*/5 * * * * /usr/local/bin/health-check.sh >> /var/log/health-check.log 2>&1
```

---

## 🚨 应急响应

### 发现异常访问

```bash
# 1. 查看访问日志
sudo tail -f /var/log/nginx/attendance_access.log

# 2. 查看异常 IP
sudo awk '{print $1}' /var/log/nginx/attendance_access.log | sort | uniq -c | sort -rn | head -20

# 3. 封禁恶意 IP
sudo ufw deny from <IP地址>

# 4. 使用 Fail2Ban 自动封禁
sudo fail2ban-client set nginx-limit-req banip <IP地址>
```

### 服务器被攻击

```bash
# 1. 立即断开网络（紧急情况）
sudo ifconfig eth0 down

# 2. 查看进程
ps aux | grep -v grep | sort -k3 -r | head -10

# 3. 查看网络连接
netstat -tulpn | grep ESTABLISHED

# 4. 恢复备份
mongorestore --db attendance /var/backups/attendance/db_latest/attendance/
```

---

## 📋 安全审计

### 定期检查项

```bash
# 1. 检查系统更新
sudo apt update && sudo apt list --upgradable

# 2. 检查开放端口
sudo netstat -tulpn

# 3. 检查登录日志
sudo last -20
sudo lastb -20  # 失败的登录尝试

# 4. 检查 Fail2Ban 状态
sudo fail2ban-client status

# 5. 检查文件权限
ls -la /var/www/attendance/backend/.env
ls -la /etc/nginx/sites-available/

# 6. 检查 MongoDB 用户
mongosh --eval "use admin; db.getUsers()"

# 7. 检查 PM2 进程
pm2 status
pm2 monit
```

---

## 🎯 安全最佳实践

1. **最小权限原则**：只授予必要的权限
2. **纵深防御**：多层安全防护
3. **定期更新**：及时更新系统和软件
4. **监控告警**：实时监控异常行为
5. **备份恢复**：定期备份，测试恢复
6. **安全审计**：定期检查安全配置
7. **文档记录**：记录所有安全配置

---

**保护好你的网站！🛡️**
