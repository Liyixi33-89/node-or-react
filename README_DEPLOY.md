# 📦 部署文件总览

## 🎯 部署准备完成！

我已经为你创建了完整的生产环境部署方案，包括所有必要的配置文件和文档。

---

## 📁 新增文件列表

### 1. 配置文件

| 文件 | 说明 | 用途 |
|------|------|------|
| `backend/ecosystem.config.js` | PM2 配置文件 | 进程管理和集群配置 |
| `backend/.env.production` | 生产环境变量 | 数据库连接等配置 |
| `nginx.conf` | Nginx 配置文件 | 反向代理和静态文件服务 |
| `.gitignore` | Git 忽略文件 | 防止敏感信息提交 |

### 2. 部署脚本

| 文件 | 说明 | 用途 |
|------|------|------|
| `deploy.sh` | 自动化部署脚本 | 一键部署到服务器 |

### 3. 文档

| 文件 | 说明 | 内容 |
|------|------|------|
| `DEPLOYMENT.md` | 完整部署文档 | 详细的部署步骤和配置说明 |
| `SECURITY.md` | 安全防护指南 | 安全配置和最佳实践 |
| `QUICK_DEPLOY.md` | 快速部署清单 | 30分钟快速部署指南 |
| `README_DEPLOY.md` | 本文件 | 部署文件总览 |

---

## 🚀 快速开始

### 方式一：自动化部署（推荐）

```bash
# 1. 上传项目到服务器
scp -r TaskManager root@your-server-ip:/root/

# 2. 登录服务器
ssh root@your-server-ip

# 3. 运行部署脚本
cd /root/TaskManager
chmod +x deploy.sh
./deploy.sh

# 4. 配置环境变量
nano /var/www/attendance/backend/.env

# 5. 重启服务
pm2 restart attendance-backend
```

### 方式二：手动部署

请参考 [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) 中的详细步骤。

---

## 📚 文档导航

### 新手入门
1. 先阅读 [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - 快速部署清单
2. 遇到问题查看 [DEPLOYMENT.md](./DEPLOYMENT.md) - 完整部署文档
3. 部署完成后阅读 [SECURITY.md](./SECURITY.md) - 安全加固指南

### 进阶配置
- **数据库配置**：参考 [DEPLOYMENT.md#数据库部署](./DEPLOYMENT.md#数据库部署)
- **Nginx 配置**：参考 [DEPLOYMENT.md#nginx-配置](./DEPLOYMENT.md#nginx-配置)
- **HTTPS 配置**：参考 [SECURITY.md#ssl-证书](./SECURITY.md#ssl证书)
- **监控告警**：参考 [DEPLOYMENT.md#监控与维护](./DEPLOYMENT.md#监控与维护)

---

## 🔧 配置文件说明

### 1. ecosystem.config.js

**位置**：`backend/ecosystem.config.js`

**用途**：PM2 进程管理配置

**关键配置**：
```javascript
{
  instances: 2,              // 进程数量（根据CPU核心数调整）
  exec_mode: 'cluster',      // 集群模式
  max_memory_restart: '500M', // 内存限制
  env_production: {
    NODE_ENV: 'production',
    PORT: 3000,
    MONGODB_URI: 'mongodb://localhost:27017/attendance'
  }
}
```

**使用方法**：
```bash
pm2 start ecosystem.config.js --env production
```

---

### 2. .env.production

**位置**：`backend/.env.production`

**用途**：生产环境变量模板

**需要修改的配置**：
```bash
# 数据库连接（必须修改）
MONGODB_URI=mongodb://localhost:27017/attendance

# 如果启用了 MongoDB 认证
MONGODB_URI=mongodb://username:password@localhost:27017/attendance

# 如果使用 MongoDB Atlas（云数据库）
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/attendance
```

**部署时操作**：
```bash
# 复制模板
cp .env.production .env

# 编辑配置
nano .env

# 重启服务
pm2 restart attendance-backend
```

---

### 3. nginx.conf

**位置**：`nginx.conf`

**用途**：Nginx 反向代理配置

**需要修改的配置**：
```nginx
# 1. 域名（必须修改）
server_name yourdomain.com www.yourdomain.com;

# 2. SSL 证书路径（如果使用 HTTPS）
ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

# 3. 前端静态文件路径
root /var/www/attendance/frontend/dist;

# 4. 后端 API 代理
proxy_pass http://127.0.0.1:3000;
```

**部署时操作**：
```bash
# 复制配置
sudo cp nginx.conf /etc/nginx/sites-available/attendance

# 编辑配置
sudo nano /etc/nginx/sites-available/attendance

# 启用配置
sudo ln -s /etc/nginx/sites-available/attendance /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

---

### 4. deploy.sh

**位置**：`deploy.sh`

**用途**：自动化部署脚本

**功能**：
- ✅ 自动安装系统依赖（Node.js、MongoDB、Nginx、PM2）
- ✅ 创建部署目录
- ✅ 部署后端代码
- ✅ 构建前端代码
- ✅ 配置 Nginx
- ✅ 启动服务
- ✅ 健康检查

**使用方法**：
```bash
# 添加执行权限
chmod +x deploy.sh

# 运行脚本
sudo ./deploy.sh
```

**注意事项**：
- 需要 root 权限
- 首次运行会安装所有依赖（约10分钟）
- 会自动创建备份

---

## ⚠️ 重要注意事项

### 1. 环境变量保护

```bash
# 确保 .env 文件不被提交到 Git
echo ".env" >> .gitignore
echo ".env.production" >> .gitignore

# 设置文件权限
chmod 600 /var/www/attendance/backend/.env
```

### 2. 数据库安全

```bash
# 启用 MongoDB 认证（强烈推荐）
# 参考 SECURITY.md 中的详细步骤
```

### 3. HTTPS 配置

```bash
# 使用 Let's Encrypt 免费证书
sudo certbot --nginx -d yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

### 4. 防火墙配置

```bash
# 只开放必要端口
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 5. 定期备份

```bash
# 配置自动备份（参考 SECURITY.md）
sudo crontab -e
# 添加：0 2 * * * /usr/local/bin/backup.sh
```

---

## 🎯 部署检查清单

### 部署前
- [ ] 代码已测试通过
- [ ] 已购买服务器
- [ ] 已配置域名（可选）
- [ ] 已准备 SSL 证书（可选）

### 部署中
- [ ] 系统依赖安装完成
- [ ] 后端服务启动成功
- [ ] 前端构建完成
- [ ] Nginx 配置正确
- [ ] 防火墙配置完成

### 部署后
- [ ] 前端页面可访问
- [ ] API 接口正常
- [ ] 注册登录功能正常
- [ ] 签到签退功能正常
- [ ] 配置 HTTPS（推荐）
- [ ] 配置数据库认证（推荐）
- [ ] 配置自动备份（推荐）
- [ ] 配置监控告警（推荐）

---

## 🔍 故障排查

### 后端无法启动
```bash
# 查看日志
pm2 logs attendance-backend --lines 100

# 检查 MongoDB
sudo systemctl status mongod

# 检查端口
sudo lsof -i :3000
```

### 前端无法访问
```bash
# 检查 Nginx
sudo nginx -t
sudo systemctl status nginx

# 查看日志
sudo tail -f /var/log/nginx/error.log
```

### 502 错误
```bash
# 检查后端
pm2 status
curl http://localhost:3000/health

# 重启服务
pm2 restart attendance-backend
sudo systemctl restart nginx
```

---

## 📞 获取帮助

### 文档资源
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 完整部署文档
- [SECURITY.md](./SECURITY.md) - 安全防护指南
- [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - 快速部署清单

### 常用命令
```bash
# 查看服务状态
pm2 status
sudo systemctl status nginx
sudo systemctl status mongod

# 查看日志
pm2 logs attendance-backend
sudo tail -f /var/log/nginx/error.log

# 重启服务
pm2 restart attendance-backend
sudo systemctl restart nginx
```

---

## 🎉 部署完成后

恭喜！你已经准备好部署到生产环境了。

**下一步**：
1. 选择部署方式（自动化或手动）
2. 按照 [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) 执行部署
3. 完成后阅读 [SECURITY.md](./SECURITY.md) 加固安全
4. 配置监控和备份

**访问你的网站**：
- 前端：http://your-server-ip 或 https://yourdomain.com
- 后端 API：http://your-server-ip/api

---

**祝你部署顺利！🚀**

如有问题，请查看相关文档或检查日志文件。
