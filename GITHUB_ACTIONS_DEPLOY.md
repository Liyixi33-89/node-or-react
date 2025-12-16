# 🚀 GitHub Actions 自动化部署指南

## 📋 目录

- [部署架构](#部署架构)
- [前置准备](#前置准备)
- [服务器配置](#服务器配置)
- [GitHub 配置](#github-配置)
- [自动化部署流程](#自动化部署流程)
- [常见问题](#常见问题)

---

## 🏗️ 部署架构

```
GitHub (dev分支) 
    ↓ 合并
GitHub (test分支)
    ↓ 触发 GitHub Actions
自动化部署流程
    ↓
阿里云服务器 (39.108.91.231)
    ├── Nginx (反向代理)
    ├── Node.js + PM2 (后端服务)
    ├── MongoDB (数据库)
    └── 前端静态文件
```

---

## 📦 前置准备

### 1. 服务器信息

- **IP地址**: `39.108.91.231`
- **操作系统**: CentOS/AliyunLinux
- **SSH端口**: `22`（默认）
- **用户**: `root`

### 2. 本地准备

需要在本地生成 SSH 密钥对（如果还没有）：

```bash
# 生成 SSH 密钥对
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 查看公钥
cat ~/.ssh/id_rsa.pub

# 查看私钥（用于 GitHub Secrets）
cat ~/.ssh/id_rsa
```

---

## 🖥️ 服务器配置

### 步骤 1: 连接到服务器

```bash
ssh root@39.108.91.231
```

### 步骤 2: 添加 SSH 公钥

```bash
# 创建 .ssh 目录（如果不存在）
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 添加公钥到 authorized_keys
echo "你的公钥内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 步骤 3: 运行初始化脚本

```bash
# 下载初始化脚本
curl -O https://raw.githubusercontent.com/Liyixi33-89/node-or-react/test/server-setup.sh

# 或者手动创建脚本
vim server-setup.sh
# 粘贴 server-setup.sh 的内容

# 添加执行权限
chmod +x server-setup.sh

# 运行脚本
./server-setup.sh
```

**脚本会自动完成以下操作**：
- ✅ 更新系统
- ✅ 安装 Node.js 18
- ✅ 安装 PM2
- ✅ 安装 MongoDB
- ✅ 安装 Nginx
- ✅ 配置防火墙
- ✅ 克隆项目代码
- ✅ 配置 Nginx 反向代理

### 步骤 4: 配置环境变量

```bash
cd /var/www/taskmanager/backend
cp .env.production .env
vim .env
```

修改以下配置：

```env
# 服务器配置
NODE_ENV=production
PORT=3000

# MongoDB 配置（使用初始化脚本创建的用户）
MONGODB_URI=mongodb://taskmanager_user:你的密码@localhost:27017/taskmanager

# JWT 密钥（生成一个随机字符串）
JWT_SECRET=你的随机密钥

# 日志配置
LOG_LEVEL=info
LOG_DIR=/var/log/taskmanager
```

### 步骤 5: 首次部署

```bash
# 安装后端依赖
cd /var/www/taskmanager/backend
npm install --production

# 启动后端服务
pm2 start ecosystem.config.js
pm2 save

# 构建前端
cd /var/www/taskmanager/frontend
npm install
npm run build

# 重启 Nginx
systemctl reload nginx
```

### 步骤 6: 验证部署

```bash
# 检查服务状态
pm2 status
systemctl status nginx
systemctl status mongod

# 测试后端 API
curl http://localhost:3000/api/health

# 测试前端页面
curl http://39.108.91.231
```

---

## 🔧 GitHub 配置

### 步骤 1: 配置 GitHub Secrets

进入你的 GitHub 仓库：`https://github.com/Liyixi33-89/node-or-react`

1. 点击 **Settings** → **Secrets and variables** → **Actions**
2. 点击 **New repository secret**
3. 添加以下 Secrets：

| Name | Value | 说明 |
|------|-------|------|
| `SERVER_HOST` | `39.108.91.231` | 服务器IP地址 |
| `SERVER_USER` | `root` | SSH用户名 |
| `SERVER_PORT` | `22` | SSH端口 |
| `SERVER_SSH_KEY` | `你的私钥内容` | SSH私钥（完整内容） |

**获取私钥内容**：

```bash
# 在本地执行
cat ~/.ssh/id_rsa
```

复制完整输出（包括 `-----BEGIN RSA PRIVATE KEY-----` 和 `-----END RSA PRIVATE KEY-----`）

### 步骤 2: 配置可选的通知 Secrets（可选）

如果需要 Telegram 通知，添加：

| Name | Value | 说明 |
|------|-------|------|
| `TELEGRAM_TO` | `你的ChatID` | Telegram Chat ID |
| `TELEGRAM_TOKEN` | `你的BotToken` | Telegram Bot Token |

---

## 🔄 自动化部署流程

### 工作流程

```
1. 开发者在 dev 分支开发
    ↓
2. 提交代码到 dev 分支
    ↓
3. 创建 Pull Request: dev → test
    ↓
4. 合并 PR 到 test 分支
    ↓
5. GitHub Actions 自动触发
    ↓
6. 执行部署流程：
   - 检出代码
   - 构建前端
   - SSH 连接服务器
   - 备份当前版本
   - 拉取最新代码
   - 安装依赖
   - 重启服务
   - 上传前端文件
   - 健康检查
   - 发送通知
    ↓
7. 部署完成！
```

### 触发部署的方式

#### 方式 1: 通过 Pull Request（推荐）

```bash
# 1. 在 dev 分支开发
git checkout dev
git add .
git commit -m "feat: 新功能"
git push origin dev

# 2. 在 GitHub 上创建 PR: dev → test

# 3. 审核并合并 PR

# 4. 自动触发部署
```

#### 方式 2: 直接推送到 test 分支

```bash
# 1. 切换到 test 分支
git checkout test

# 2. 合并 dev 分支
git merge dev

# 3. 推送到远程
git push origin test

# 4. 自动触发部署
```

### 查看部署状态

1. 进入 GitHub 仓库
2. 点击 **Actions** 标签
3. 查看最新的工作流运行状态

---

## 📊 部署监控

### 在服务器上查看日志

```bash
# PM2 日志
pm2 logs taskmanager-backend

# Nginx 访问日志
tail -f /var/log/nginx/taskmanager_access.log

# Nginx 错误日志
tail -f /var/log/nginx/taskmanager_error.log

# 应用日志
tail -f /var/log/taskmanager/app.log
```

### 查看服务状态

```bash
# PM2 进程状态
pm2 status

# 系统资源使用
pm2 monit

# Nginx 状态
systemctl status nginx

# MongoDB 状态
systemctl status mongod
```

---

## 🔒 安全配置

### 1. 配置 HTTPS（推荐）

```bash
# 安装 Certbot
yum install -y certbot python3-certbot-nginx

# 获取 SSL 证书（需要域名）
certbot --nginx -d yourdomain.com

# 自动续期
echo "0 0,12 * * * root certbot renew --quiet" >> /etc/crontab
```

### 2. 配置防火墙规则

```bash
# 只允许必要的端口
firewall-cmd --permanent --remove-service=ssh
firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="你的IP" port port="22" protocol="tcp" accept'
firewall-cmd --reload
```

### 3. 配置 fail2ban（防暴力破解）

```bash
# 安装 fail2ban
yum install -y fail2ban

# 配置
cat > /etc/fail2ban/jail.local <<EOF
[sshd]
enabled = true
port = 22
maxretry = 3
bantime = 3600
EOF

# 启动服务
systemctl start fail2ban
systemctl enable fail2ban
```

---

## ❓ 常见问题

### 1. 部署失败：SSH 连接超时

**原因**：服务器防火墙阻止了 GitHub Actions 的 IP

**解决方案**：
```bash
# 临时允许所有 SSH 连接（不推荐生产环境）
firewall-cmd --permanent --add-service=ssh
firewall-cmd --reload

# 或者添加 GitHub Actions 的 IP 段
# 参考：https://api.github.com/meta
```

### 2. 部署失败：权限不足

**原因**：SSH 密钥权限问题

**解决方案**：
```bash
# 在服务器上检查权限
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### 3. 前端页面 404

**原因**：前端文件未正确上传

**解决方案**：
```bash
# 手动构建并复制
cd /var/www/taskmanager/frontend
npm run build
# 检查 dist 目录是否存在
ls -la dist/
```

### 4. 后端 API 502 错误

**原因**：后端服务未启动

**解决方案**：
```bash
# 检查 PM2 状态
pm2 status

# 查看错误日志
pm2 logs taskmanager-backend --err

# 重启服务
pm2 restart taskmanager-backend
```

### 5. MongoDB 连接失败

**原因**：MongoDB 认证配置错误

**解决方案**：
```bash
# 检查 MongoDB 状态
systemctl status mongod

# 测试连接
mongo -u taskmanager_user -p --authenticationDatabase taskmanager

# 检查环境变量
cat /var/www/taskmanager/backend/.env
```

---

## 🔄 回滚部署

如果部署出现问题，可以快速回滚：

```bash
# 1. 查看备份
ls -lh /var/www/backups/

# 2. 停止当前服务
pm2 stop taskmanager-backend

# 3. 恢复备份
cd /var/www
rm -rf taskmanager
tar -xzf backups/taskmanager_20251216_143000.tar.gz

# 4. 重启服务
cd taskmanager/backend
pm2 start ecosystem.config.js
```

---

## 📝 部署检查清单

### 部署前检查

- [ ] 服务器 SSH 密钥已配置
- [ ] GitHub Secrets 已设置
- [ ] 服务器环境已初始化
- [ ] MongoDB 已配置认证
- [ ] Nginx 配置已测试
- [ ] 防火墙规则已配置

### 部署后检查

- [ ] 后端服务正常运行（`pm2 status`）
- [ ] 前端页面可访问（`http://39.108.91.231`）
- [ ] API 接口正常（`curl http://39.108.91.231/api/health`）
- [ ] 数据库连接正常
- [ ] 日志无错误信息
- [ ] SSL 证书有效（如果配置了 HTTPS）

---

## 🎯 快速开始

### 一键部署命令

```bash
# 在服务器上执行
curl -fsSL https://raw.githubusercontent.com/Liyixi33-89/node-or-react/test/server-setup.sh | bash
```

### 测试自动化部署

```bash
# 在本地执行
git checkout dev
echo "test" > test.txt
git add test.txt
git commit -m "test: 测试自动化部署"
git push origin dev

# 在 GitHub 上创建 PR: dev → test
# 合并 PR
# 查看 Actions 标签页的部署状态
```

---

## 📚 相关文档

- [部署文档](./DEPLOYMENT.md)
- [安全指南](./SECURITY.md)
- [快速部署](./QUICK_DEPLOY.md)
- [Nginx 配置](./nginx.conf)
- [PM2 配置](./backend/ecosystem.config.js)

---

## 🆘 获取帮助

如果遇到问题：

1. 查看 GitHub Actions 日志
2. 查看服务器日志（`pm2 logs`）
3. 查看 Nginx 日志（`/var/log/nginx/`）
4. 提交 Issue 到 GitHub 仓库

---

**祝部署顺利！🚀**
