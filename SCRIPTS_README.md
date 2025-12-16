# 📜 Shell 脚本使用说明

本项目包含 2 个核心部署脚本，用于服务器初始化和快速部署。

---

## 📁 脚本列表

### 1. server-init.sh - 服务器初始化脚本

**用途**：在全新的阿里云服务器上一键配置完整的运行环境

**功能**：
- ✅ 安装 Node.js 18
- ✅ 安装 PM2 进程管理器
- ✅ 安装 MongoDB 数据库
- ✅ 安装 Nginx 反向代理
- ✅ 配置防火墙规则
- ✅ 创建项目目录
- ✅ 配置 Nginx 反向代理

**使用方法**：

```bash
# 在服务器上执行
curl -o server-init.sh https://raw.githubusercontent.com/Liyixi33-89/node-or-react/dev/server-init.sh
chmod +x server-init.sh
./server-init.sh
```

**适用场景**：
- 🆕 首次部署到新服务器
- 🔄 服务器环境重置后重新配置

---

### 2. quick-deploy.sh - 一键快速部署脚本

**用途**：在已初始化的服务器上快速部署/更新项目

**功能**：
- ✅ 调用 server-init.sh 初始化环境
- ✅ 克隆/更新项目代码
- ✅ 配置环境变量
- ✅ 安装后端依赖
- ✅ 启动后端服务（PM2）
- ✅ 构建前端代码
- ✅ 重启 Nginx

**使用方法**：

```bash
# 在服务器上执行（一键完成所有步骤）
curl -fsSL https://raw.githubusercontent.com/Liyixi33-89/node-or-react/dev/quick-deploy.sh | bash
```

**适用场景**：
- 🚀 首次部署（包含初始化）
- 🔄 快速更新部署
- 🐛 部署失败后重新部署

---

## 🔄 部署流程

### 首次部署（推荐使用 quick-deploy.sh）

```bash
# 连接到服务器
ssh root@39.108.91.231

# 执行一键部署
curl -fsSL https://raw.githubusercontent.com/Liyixi33-89/node-or-react/dev/quick-deploy.sh | bash
```

### 分步部署（更可控）

```bash
# 1. 初始化服务器环境
./server-init.sh

# 2. 手动配置环境变量
cd /var/www/taskmanager/backend
vim .env

# 3. 启动服务
npm install
pm2 start ecosystem.config.js
pm2 save

# 4. 构建前端
cd ../frontend
npm install
npm run build

# 5. 重启 Nginx
systemctl reload nginx
```

---

## 🎯 自动化部署（推荐）

配置 GitHub Actions 后，只需推送代码即可自动部署：

```bash
# 开发完成后
git checkout dev
git add .
git commit -m "feat: 新功能"
git push origin dev

# 合并到 test 分支触发自动部署
git checkout test
git merge dev
git push origin test

# GitHub Actions 会自动：
# 1. 构建前端
# 2. 连接服务器
# 3. 备份当前版本
# 4. 拉取最新代码
# 5. 安装依赖
# 6. 重启服务
# 7. 健康检查
```

详见：[AUTO_DEPLOY_GUIDE.md](./AUTO_DEPLOY_GUIDE.md)

---

## 📊 脚本对比

| 特性 | server-init.sh | quick-deploy.sh | GitHub Actions |
|------|----------------|-----------------|----------------|
| 初始化环境 | ✅ | ✅ | ❌ |
| 部署代码 | ❌ | ✅ | ✅ |
| 自动触发 | ❌ | ❌ | ✅ |
| 备份功能 | ❌ | ❌ | ✅ |
| 健康检查 | ❌ | ❌ | ✅ |
| 适用场景 | 首次初始化 | 快速部署 | 持续部署 |

---

## ⚠️ 注意事项

### 1. 执行权限

```bash
# 如果脚本无法执行，添加执行权限
chmod +x server-init.sh
chmod +x quick-deploy.sh
```

### 2. 环境变量

脚本会自动生成 `.env` 文件，但需要手动配置：

```bash
cd /var/www/taskmanager/backend
vim .env

# 修改以下配置
MONGODB_URI=mongodb://localhost:27017/taskmanager
JWT_SECRET=your_secret_key
```

### 3. 防火墙

确保服务器防火墙开放了必要的端口：

```bash
# 查看防火墙状态
firewall-cmd --list-all

# 如果端口未开放，手动添加
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload
```

### 4. MongoDB 认证

如果启用了 MongoDB 认证，需要更新连接字符串：

```bash
MONGODB_URI=mongodb://username:password@localhost:27017/taskmanager
```

---

## 🔍 故障排查

### 脚本执行失败

```bash
# 查看详细错误信息
bash -x server-init.sh

# 或
bash -x quick-deploy.sh
```

### 服务启动失败

```bash
# 查看 PM2 日志
pm2 logs taskmanager-backend

# 查看 Nginx 日志
tail -f /var/log/nginx/taskmanager_error.log

# 查看 MongoDB 日志
tail -f /var/log/mongodb/mongod.log
```

### 端口被占用

```bash
# 查看端口占用
netstat -tulpn | grep :3000

# 杀死占用进程
kill -9 <PID>
```

---

## 📚 相关文档

- [AUTO_DEPLOY_GUIDE.md](./AUTO_DEPLOY_GUIDE.md) - 自动化部署完整指南
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 部署文档
- [SECURITY.md](./SECURITY.md) - 安全配置指南

---

## 🗑️ 已删除的脚本

以下脚本已被删除（功能重复或已过时）：

- ❌ **server-setup.sh** - 与 server-init.sh 功能重复
- ❌ **deploy.sh** - 已被 GitHub Actions 替代
- ❌ **test-api.sh** - 简单的 API 测试脚本（可用 Postman 替代）

---

## 🎉 快速开始

```bash
# 1. 连接到服务器
ssh root@39.108.91.231

# 2. 一键部署
curl -fsSL https://raw.githubusercontent.com/Liyixi33-89/node-or-react/dev/quick-deploy.sh | bash

# 3. 访问应用
# http://39.108.91.231
```

**就这么简单！🚀**
