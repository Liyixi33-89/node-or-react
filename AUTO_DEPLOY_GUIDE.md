# 🚀 自动化部署快速指南

## 📋 当前配置

- **服务器IP**: `39.108.91.231`
- **Git仓库**: `https://github.com/Liyixi33-89/node-or-react`
- **分支策略**: `dev` → `test` (触发自动部署)

---

## ⚡ 快速开始（3步完成）

### 第一步：在服务器上执行初始化脚本

```bash
# 你现在已经连接到服务器了，直接执行：

# 1. 下载初始化脚本
curl -o server-init.sh https://raw.githubusercontent.com/Liyixi33-89/node-or-react/dev/server-init.sh

# 2. 添加执行权限
chmod +x server-init.sh

# 3. 运行脚本
./server-init.sh
```

**脚本会自动安装**：
- ✅ Node.js 18
- ✅ PM2 (进程管理)
- ✅ MongoDB (数据库)
- ✅ Nginx (反向代理)
- ✅ 配置防火墙
- ✅ 创建项目目录

---

### 第二步：手动完成首次部署

初始化脚本完成后，执行以下命令：

```bash
# 1. 克隆项目
cd /var/www
git clone https://github.com/Liyixi33-89/node-or-react.git taskmanager
cd taskmanager
git checkout test

# 2. 配置后端环境变量
cd backend
cat > .env <<EOF
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/taskmanager
JWT_SECRET=$(openssl rand -base64 32)
LOG_LEVEL=info
EOF

# 3. 安装后端依赖并启动
npm install
pm2 start ecosystem.config.js
pm2 save

# 4. 构建前端
cd ../frontend
npm install
npm run build

# 5. 重启 Nginx
systemctl reload nginx

# 6. 检查服务状态
pm2 status
systemctl status nginx
```

---

### 第三步：配置 GitHub Secrets

1. **生成 SSH 密钥对**（在你的本地电脑上）：

```bash
# 生成密钥
ssh-keygen -t rsa -b 4096 -C "deploy@taskmanager"

# 查看公钥（添加到服务器）
cat ~/.ssh/id_rsa.pub

# 查看私钥（添加到 GitHub Secrets）
cat ~/.ssh/id_rsa
```

2. **在服务器上添加公钥**（你现在已经连接到服务器了）：

```bash
# 在服务器上执行
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 将你的公钥内容添加到这个文件
vim ~/.ssh/authorized_keys
# 粘贴公钥内容，保存退出

chmod 600 ~/.ssh/authorized_keys
```

3. **在 GitHub 上配置 Secrets**：

访问：`https://github.com/Liyixi33-89/node-or-react/settings/secrets/actions`

点击 **New repository secret**，添加以下 Secrets：

| Name | Value |
|------|-------|
| `SERVER_HOST` | `39.108.91.231` |
| `SERVER_USER` | `root` |
| `SERVER_SSH_KEY` | 你的私钥完整内容（包括 BEGIN 和 END 行） |

---

## 🔄 触发自动部署

配置完成后，有两种方式触发自动部署：

### 方式 1：通过 Pull Request（推荐）

```bash
# 1. 在 dev 分支开发
git checkout dev
git add .
git commit -m "feat: 新功能"
git push origin dev

# 2. 在 GitHub 上创建 PR: dev → test
# 3. 审核并合并 PR
# 4. 自动触发部署 ✨
```

### 方式 2：直接合并到 test 分支

```bash
# 1. 切换到 test 分支
git checkout test

# 2. 合并 dev 分支
git merge dev

# 3. 推送到远程
git push origin test

# 4. 自动触发部署 ✨
```

---

## 📊 查看部署状态

### 在 GitHub 上查看

1. 进入仓库：`https://github.com/Liyixi33-89/node-or-react`
2. 点击 **Actions** 标签
3. 查看最新的工作流运行状态

### 在服务器上查看

```bash
# 查看 PM2 进程
pm2 status
pm2 logs taskmanager-backend

# 查看 Nginx 日志
tail -f /var/log/nginx/taskmanager_access.log
tail -f /var/log/nginx/taskmanager_error.log

# 查看备份
ls -lh /var/www/backups/
```

---

## 🧪 测试部署

### 1. 测试后端 API

```bash
# 在服务器上测试
curl http://localhost:3000/api/health

# 从外部测试
curl http://39.108.91.231/api/health
```

### 2. 测试前端页面

在浏览器中访问：`http://39.108.91.231`

### 3. 测试完整流程

```bash
# 1. 创建测试提交
git checkout dev
echo "test deploy" > test.txt
git add test.txt
git commit -m "test: 测试自动部署"
git push origin dev

# 2. 合并到 test 分支
git checkout test
git merge dev
git push origin test

# 3. 查看 GitHub Actions 是否触发
# 4. 等待部署完成（约2-3分钟）
# 5. 访问 http://39.108.91.231 验证
```

---

## 🔍 部署流程详解

```
开发者提交代码到 dev 分支
    ↓
合并到 test 分支
    ↓
GitHub Actions 自动触发
    ↓
1. 检出代码
2. 构建前端 (npm run build)
3. SSH 连接服务器
4. 备份当前版本
5. 拉取最新代码 (git pull)
6. 安装后端依赖 (npm install)
7. 重启后端服务 (pm2 restart)
8. 上传前端构建文件
9. 重启 Nginx
10. 健康检查
    ↓
部署完成！🎉
```

---

## ❓ 常见问题

### 1. SSH 连接失败

**错误信息**：`Permission denied (publickey)`

**解决方案**：
```bash
# 在服务器上检查
cat ~/.ssh/authorized_keys  # 确认公钥已添加
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# 在 GitHub Secrets 中确认私钥完整
# 包括 -----BEGIN RSA PRIVATE KEY----- 和 -----END RSA PRIVATE KEY-----
```

### 2. PM2 服务未启动

**错误信息**：`502 Bad Gateway`

**解决方案**：
```bash
# 查看 PM2 日志
pm2 logs taskmanager-backend

# 检查环境变量
cat /var/www/taskmanager/backend/.env

# 手动启动
cd /var/www/taskmanager/backend
pm2 start ecosystem.config.js
```

### 3. 前端页面 404

**错误信息**：前端页面显示 404

**解决方案**：
```bash
# 检查前端文件是否存在
ls -la /var/www/taskmanager/frontend/dist/

# 如果不存在，手动构建
cd /var/www/taskmanager/frontend
npm install
npm run build

# 重启 Nginx
systemctl reload nginx
```

### 4. MongoDB 连接失败

**错误信息**：`MongoNetworkError`

**解决方案**：
```bash
# 检查 MongoDB 状态
systemctl status mongod

# 启动 MongoDB
systemctl start mongod

# 测试连接
mongo --eval "db.version()"
```

---

## 🔒 安全建议

### 1. 修改 SSH 端口（可选）

```bash
# 编辑 SSH 配置
vim /etc/ssh/sshd_config

# 修改端口
Port 2222

# 重启 SSH
systemctl restart sshd

# 更新防火墙
firewall-cmd --permanent --add-port=2222/tcp
firewall-cmd --reload

# 更新 GitHub Secrets 中的 SERVER_PORT
```

### 2. 配置 HTTPS（推荐）

```bash
# 安装 Certbot
yum install -y certbot python3-certbot-nginx

# 获取证书（需要域名）
certbot --nginx -d yourdomain.com

# 自动续期
echo "0 0,12 * * * root certbot renew --quiet" >> /etc/crontab
```

### 3. 配置 MongoDB 认证

```bash
# 进入 MongoDB
mongo

# 创建管理员用户
use admin
db.createUser({
  user: "admin",
  pwd: "strong_password",
  roles: ["userAdminAnyDatabase"]
})

# 创建应用用户
use taskmanager
db.createUser({
  user: "taskmanager_user",
  pwd: "strong_password",
  roles: ["readWrite"]
})

# 退出并编辑配置
vim /etc/mongod.conf

# 启用认证
security:
  authorization: enabled

# 重启 MongoDB
systemctl restart mongod

# 更新 .env 文件
MONGODB_URI=mongodb://taskmanager_user:strong_password@localhost:27017/taskmanager
```

---

## 📝 检查清单

### 部署前检查

- [ ] 服务器已初始化（运行 server-init.sh）
- [ ] 项目已克隆到 /var/www/taskmanager
- [ ] 后端环境变量已配置（.env 文件）
- [ ] 后端服务已启动（pm2 status）
- [ ] 前端已构建（dist 目录存在）
- [ ] Nginx 配置正确（nginx -t）
- [ ] SSH 密钥已配置
- [ ] GitHub Secrets 已设置

### 部署后检查

- [ ] GitHub Actions 运行成功
- [ ] 后端服务正常（pm2 status）
- [ ] 前端页面可访问（http://39.108.91.231）
- [ ] API 接口正常（/api/health）
- [ ] 数据库连接正常
- [ ] 日志无错误

---

## 🎯 下一步

1. **推送代码到 GitHub**：
   ```bash
   git add .
   git commit -m "chore: 配置自动化部署"
   git push origin dev
   ```

2. **合并到 test 分支触发部署**：
   ```bash
   git checkout test
   git merge dev
   git push origin test
   ```

3. **查看部署状态**：
   访问 `https://github.com/Liyixi33-89/node-or-react/actions`

4. **访问应用**：
   `http://39.108.91.231`

---

## 📞 获取帮助

如果遇到问题：

1. 查看 GitHub Actions 日志
2. 查看服务器日志（`pm2 logs`）
3. 查看 Nginx 日志（`/var/log/nginx/`）
4. 提交 Issue 到 GitHub 仓库

---

**祝部署顺利！🚀**
