# 🔧 MongoDB 404 错误解决方案

## ❌ 错误信息

```bash
[5/9] 安装 MongoDB...
MongoDB Repository                                        609  B/s | 422  B     00:00    
Errors during downloading metadata for repository 'mongodb-org-6.0':
  - Status code: 404 for https://repo.mongodb.org/yum/redhat/3/mongodb-org/6.0/x86_64/repodata/repomd.xml
错误：为仓库 'mongodb-org-6.0' 下载元数据失败 : Cannot download repomd.xml
```

---

## 🔍 问题原因

1. **系统版本检测错误**：脚本使用了 `$releasever` 变量，在阿里云 Linux 上可能返回错误的值（如 `3`）
2. **MongoDB 仓库不存在**：MongoDB 官方没有为 Red Hat 3 提供仓库
3. **阿里云 Linux 兼容性**：阿里云 Linux 基于 CentOS，但版本号不同

---

## ✅ 解决方案

### 方案1：使用修复脚本（推荐）⭐

在服务器上执行以下命令：

```bash
# 下载修复脚本
curl -o fix-mongodb.sh https://raw.githubusercontent.com/Liyixi33-89/node-or-react/dev/fix-mongodb.sh

# 添加执行权限
chmod +x fix-mongodb.sh

# 执行修复脚本
./fix-mongodb.sh
```

**脚本会自动：**
- ✅ 检测系统版本
- ✅ 选择合适的 MongoDB 版本（6.0 → 5.0 → EPEL）
- ✅ 配置正确的仓库
- ✅ 安装并启动 MongoDB
- ✅ 验证安装结果

---

### 方案2：手动安装 MongoDB

#### 步骤1：检测系统版本

```bash
cat /etc/os-release
```

#### 步骤2：清理旧配置

```bash
rm -f /etc/yum.repos.d/mongodb-org-*.repo
```

#### 步骤3：配置正确的仓库

**对于阿里云 Linux / CentOS 7：**

```bash
cat > /etc/yum.repos.d/mongodb-org-6.0.repo <<EOF
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/7/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
EOF
```

**对于 CentOS 8 / Rocky Linux 8：**

```bash
cat > /etc/yum.repos.d/mongodb-org-6.0.repo <<EOF
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/8/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
EOF
```

#### 步骤4：安装 MongoDB

```bash
yum install -y mongodb-org
```

#### 步骤5：启动 MongoDB

```bash
systemctl start mongod
systemctl enable mongod
systemctl status mongod
```

---

### 方案3：使用 EPEL 仓库（备选）

如果官方仓库都失败，可以使用 EPEL：

```bash
# 安装 EPEL 仓库
yum install -y epel-release

# 安装 MongoDB
yum install -y mongodb-server mongodb

# 启动服务
systemctl start mongodb
systemctl enable mongodb
```

**注意**：EPEL 版本可能较旧（通常是 MongoDB 3.x 或 4.x）

---

## 🚀 完整部署流程

### 1. 推送更新的脚本到 GitHub

```bash
# 在本地执行
cd c:\Users\v_liyixili\Desktop\2025\TaskManager

git add server-init.sh fix-mongodb.sh MONGODB_FIX.md
git commit -m "fix: 修复 MongoDB 404 安装错误"
git push origin dev
```

### 2. 在服务器上使用修复脚本

```bash
# 连接到服务器
ssh root@39.108.91.231

# 下载并执行修复脚本
curl -fsSL https://raw.githubusercontent.com/Liyixi33-89/node-or-react/dev/fix-mongodb.sh | bash
```

### 3. 继续执行初始化脚本

```bash
# 下载更新后的初始化脚本
curl -o server-init.sh https://raw.githubusercontent.com/Liyixi33-89/node-or-react/dev/server-init.sh

chmod +x server-init.sh

# 执行初始化（MongoDB 已安装，会跳过）
./server-init.sh
```

---

## 🔍 验证 MongoDB 安装

### 检查服务状态

```bash
# 检查服务是否运行
systemctl status mongod

# 或者
systemctl status mongodb
```

### 测试连接

```bash
# MongoDB 6.x 使用 mongosh
mongosh

# MongoDB 5.x 及以下使用 mongo
mongo
```

### 查看版本

```bash
mongod --version
```

### 查看日志

```bash
# 查看系统日志
journalctl -u mongod -n 50

# 查看 MongoDB 日志
tail -f /var/log/mongodb/mongod.log
```

---

## 📊 不同系统的 MongoDB 仓库对照表

| 系统 | Red Hat 版本 | MongoDB 6.0 仓库 URL |
|------|-------------|---------------------|
| 阿里云 Linux 2 | 7 | `https://repo.mongodb.org/yum/redhat/7/mongodb-org/6.0/x86_64/` |
| 阿里云 Linux 3 | 8 | `https://repo.mongodb.org/yum/redhat/8/mongodb-org/6.0/x86_64/` |
| CentOS 7 | 7 | `https://repo.mongodb.org/yum/redhat/7/mongodb-org/6.0/x86_64/` |
| CentOS 8 | 8 | `https://repo.mongodb.org/yum/redhat/8/mongodb-org/6.0/x86_64/` |
| Rocky Linux 8 | 8 | `https://repo.mongodb.org/yum/redhat/8/mongodb-org/6.0/x86_64/` |
| RHEL 7 | 7 | `https://repo.mongodb.org/yum/redhat/7/mongodb-org/6.0/x86_64/` |
| RHEL 8 | 8 | `https://repo.mongodb.org/yum/redhat/8/mongodb-org/6.0/x86_64/` |

---

## 🐛 常见问题

### Q1: 如何确定我的系统应该使用哪个版本？

```bash
# 查看系统信息
cat /etc/os-release

# 查看 Red Hat 版本
cat /etc/redhat-release

# 查看内核版本
uname -r
```

**阿里云 Linux 对照：**
- Alibaba Cloud Linux 2 → 使用 Red Hat 7 仓库
- Alibaba Cloud Linux 3 → 使用 Red Hat 8 仓库

### Q2: MongoDB 启动失败怎么办？

```bash
# 查看详细错误
journalctl -u mongod -n 100 --no-pager

# 检查配置文件
cat /etc/mongod.conf

# 检查数据目录权限
ls -la /var/lib/mongo

# 修复权限
chown -R mongod:mongod /var/lib/mongo
chown -R mongod:mongod /var/log/mongodb
```

### Q3: 端口被占用怎么办？

```bash
# 查看 27017 端口占用
netstat -tulpn | grep 27017

# 或者
lsof -i :27017

# 杀死占用进程
kill -9 <PID>
```

### Q4: 如何卸载重装？

```bash
# 停止服务
systemctl stop mongod

# 卸载 MongoDB
yum remove -y mongodb-org*

# 删除数据（可选，会丢失数据）
rm -rf /var/lib/mongo
rm -rf /var/log/mongodb

# 删除配置
rm -f /etc/mongod.conf
rm -f /etc/yum.repos.d/mongodb-org-*.repo

# 重新安装
./fix-mongodb.sh
```

---

## 📝 修改说明

### 更新的文件

1. **[server-init.sh](./server-init.sh)**
   - ✅ 自动检测系统版本
   - ✅ 使用正确的 Red Hat 版本号
   - ✅ 多版本降级安装（6.0 → 5.0 → EPEL）
   - ✅ 更好的错误处理

2. **[fix-mongodb.sh](./fix-mongodb.sh)** (新增)
   - ✅ 独立的 MongoDB 修复脚本
   - ✅ 自动检测和修复
   - ✅ 详细的日志输出
   - ✅ 验证安装结果

3. **[MONGODB_FIX.md](./MONGODB_FIX.md)** (本文档)
   - ✅ 详细的问题分析
   - ✅ 多种解决方案
   - ✅ 完整的部署流程
   - ✅ 常见问题解答

---

## 🎯 推荐操作流程

### 快速修复（最简单）

```bash
# 在服务器上执行
ssh root@39.108.91.231
curl -fsSL https://raw.githubusercontent.com/Liyixi33-89/node-or-react/dev/fix-mongodb.sh | bash
```

### 完整部署

```bash
# 1. 修复 MongoDB
curl -fsSL https://raw.githubusercontent.com/Liyixi33-89/node-or-react/dev/fix-mongodb.sh | bash

# 2. 执行初始化脚本
curl -fsSL https://raw.githubusercontent.com/Liyixi33-89/node-or-react/dev/server-init.sh | bash

# 3. 克隆项目
cd /var/www/taskmanager
git clone -b dev https://github.com/Liyixi33-89/node-or-react.git .

# 4. 配置环境变量
cd backend
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/taskmanager
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
EOF

# 5. 启动后端
npm install --production
pm2 start ecosystem.config.js
pm2 save

# 6. 构建前端
cd ../frontend
npm install
npm run build

# 7. 重启 Nginx
systemctl restart nginx

# 8. 访问应用
# http://39.108.91.231
```

---

## ✅ 验证清单

- [ ] MongoDB 服务运行正常
- [ ] 可以连接到 MongoDB
- [ ] Node.js 和 NPM 已安装
- [ ] PM2 已安装并配置
- [ ] Nginx 已安装并运行
- [ ] 防火墙已配置
- [ ] 项目代码已克隆
- [ ] 后端服务已启动
- [ ] 前端已构建
- [ ] 可以通过浏览器访问

---

## 📚 相关文档

- [SERVER_DEPLOY_COMMANDS.md](./SERVER_DEPLOY_COMMANDS.md) - 服务器部署命令
- [AUTO_DEPLOY_GUIDE.md](./AUTO_DEPLOY_GUIDE.md) - 自动化部署指南
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 完整部署文档
- [SECURITY.md](./SECURITY.md) - 安全配置指南

---

## 🎉 总结

**问题**：MongoDB 仓库 404 错误

**原因**：系统版本检测不准确

**解决**：
1. ✅ 自动检测系统版本
2. ✅ 使用正确的仓库 URL
3. ✅ 多版本降级安装
4. ✅ 提供独立修复脚本

**现在可以正常部署了！🚀**
