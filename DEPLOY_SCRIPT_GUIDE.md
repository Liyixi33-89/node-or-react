# 自动化部署脚本使用说明

## 📦 脚本文件

- **文件名**: `deploy-rebuild.sh`
- **位置**: `/root/deploy-rebuild.sh`
- **大小**: 8.5 KB

---

## 🚀 快速开始

### 基本使用（最常用）

```bash
# 在服务器上执行
cd /root
./deploy-rebuild.sh
```

这将自动完成：
1. ✅ 备份当前版本
2. ✅ 拉取最新代码（test 分支）
3. ✅ 构建后端并重启服务
4. ✅ 构建前端
5. ✅ 删除前端 node_modules
6. ✅ 重载 Nginx
7. ✅ 健康检查

---

## 📋 命令选项

### 1. 指定分支部署

```bash
# 部署 main 分支
./deploy-rebuild.sh -b main

# 部署 dev 分支
./deploy-rebuild.sh -b dev
```

### 2. 跳过备份（加快部署速度）

```bash
./deploy-rebuild.sh -s
# 或
./deploy-rebuild.sh --skip-backup
```

### 3. 强制重置本地更改

```bash
# 如果有本地修改冲突，强制重置
./deploy-rebuild.sh -f
# 或
./deploy-rebuild.sh --force
```

### 4. 组合使用

```bash
# 部署 dev 分支，跳过备份，强制重置
./deploy-rebuild.sh -b dev -s -f
```

### 5. 查看帮助

```bash
./deploy-rebuild.sh -h
# 或
./deploy-rebuild.sh --help
```

---

## 🔍 脚本功能详解

### 1️⃣ 备份功能
- 自动备份到 `/var/www/backups/`
- 备份文件格式：`taskmanager_YYYYMMDD_HHMMSS.tar.gz`
- 自动保留最近 5 个备份
- 排除 `node_modules`、`dist`、`.git` 目录

### 2️⃣ 代码拉取
- 显示当前 Git 状态
- 拉取指定分支最新代码
- 显示最新提交信息

### 3️⃣ 后端构建
- 安装生产依赖（`npm install --production`）
- 使用 PM2 重启服务
- 自动保存 PM2 配置

### 4️⃣ 前端构建
- 安装所有依赖
- 执行 Vite 构建
- 显示构建文件大小
- **构建完成后自动删除 node_modules**

### 5️⃣ Nginx 重载
- 自动检测 Nginx 位置
- 测试配置文件
- 平滑重载服务

### 6️⃣ 健康检查
- 检查后端服务（http://localhost:3000/health）
- 检查前端页面
- 显示端口监听状态

---

## 📊 执行示例

### 示例 1：标准部署

```bash
[root@server ~]# ./deploy-rebuild.sh

============================================
  TaskManager 自动化部署脚本
============================================

[INFO] 检查项目目录...
[SUCCESS] 项目目录存在
[INFO] 备份当前版本...
[SUCCESS] 备份完成: /var/www/backups/taskmanager_20251217_141000.tar.gz
[INFO] 拉取最新代码 (分支: test)...
[SUCCESS] 代码拉取完成
[INFO] 开始构建后端...
[SUCCESS] 后端构建完成
[INFO] 重启后端服务...
[SUCCESS] 后端服务已重启
[INFO] 开始构建前端...
[SUCCESS] 前端构建完成
[INFO] 清理 node_modules...
[SUCCESS] 前端 node_modules 已删除
[INFO] 重载 Nginx 配置...
[SUCCESS] Nginx 已重载
[INFO] 执行健康检查...
[SUCCESS] 后端服务健康
[SUCCESS] 前端页面正常

============================================
[SUCCESS] 部署完成！
============================================

📦 部署信息:
   - 分支: test
   - 项目目录: /var/www/taskmanager
   - 部署时间: 2025-12-17 14:10:30

🔍 服务状态:
┌─────┬────────────────────────┬─────────┬─────────┬──────────┐
│ id  │ name                   │ status  │ restart │ uptime   │
├─────┼────────────────────────┼─────────┼─────────┼──────────┤
│ 0   │ attendance-backend     │ online  │ 15      │ 2m       │
│ 1   │ attendance-backend     │ online  │ 15      │ 2m       │
└─────┴────────────────────────┴─────────┴─────────┴──────────┘

🌐 访问地址:
   - 前端: http://39.108.91.231/
   - 后端健康检查: http://39.108.91.231/health

[SUCCESS] 总耗时: 45 秒
```

---

## ⚠️ 注意事项

### 1. 权限要求
- 脚本需要 root 权限或具有相应目录的写权限
- 确保脚本有执行权限：`chmod +x deploy-rebuild.sh`

### 2. 依赖检查
脚本会自动检查以下依赖：
- Git
- Node.js & NPM
- PM2
- Nginx
- curl

### 3. 错误处理
- 脚本使用 `set -e`，遇到错误会立即退出
- 所有错误都会显示红色提示
- 可以查看详细错误信息进行排查

### 4. 备份恢复
如果部署出现问题，可以恢复备份：

```bash
# 查看备份列表
ls -lh /var/www/backups/

# 恢复备份
cd /var/www
tar -xzf /var/www/backups/taskmanager_20251217_141000.tar.gz
```

---

## 🛠️ 常见问题

### Q1: 如何只重新构建前端？
```bash
cd /var/www/taskmanager/frontend
npm install
npm run build
rm -rf node_modules
/usr/local/nginx/sbin/nginx -s reload
```

### Q2: 如何只重启后端？
```bash
cd /var/www/taskmanager/backend
pm2 restart ecosystem.config.js
```

### Q3: 如何查看部署日志？
```bash
# 查看后端日志
pm2 logs attendance-backend

# 查看 Nginx 日志
tail -f /var/log/nginx/taskmanager_access.log
tail -f /var/log/nginx/taskmanager_error.log
```

### Q4: 部署失败如何回滚？
```bash
# 1. 停止当前服务
pm2 stop all

# 2. 恢复备份
cd /var/www
rm -rf taskmanager
tar -xzf /var/www/backups/taskmanager_YYYYMMDD_HHMMSS.tar.gz

# 3. 重启服务
cd /var/www/taskmanager/backend
pm2 start ecosystem.config.js
```

---

## 📈 性能优化建议

### 1. 跳过备份（开发环境）
```bash
./deploy-rebuild.sh -s
```
可节省 5-10 秒

### 2. 使用 npm ci 替代 npm install
修改脚本中的 `npm install` 为 `npm ci`（需要 package-lock.json）

### 3. 启用构建缓存
在 CI/CD 环境中可以缓存 node_modules

---

## 🔗 相关文件

- **项目目录**: `/var/www/taskmanager/`
- **备份目录**: `/var/www/backups/`
- **Nginx 配置**: `/usr/local/nginx/conf/conf.d/taskmanager.conf`
- **PM2 配置**: `/var/www/taskmanager/backend/ecosystem.config.js`

---

## 📞 技术支持

如有问题，请检查：
1. Git 仓库连接是否正常
2. Node.js 版本是否兼容
3. PM2 服务是否正常
4. Nginx 配置是否正确
5. 磁盘空间是否充足

---

**最后更新**: 2025-12-17
