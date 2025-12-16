# 🚀 快速部署检查清单

## 部署前准备

### 服务器准备
- [ ] 购买云服务器（阿里云/腾讯云/AWS等）
- [ ] 配置服务器（2核4G以上推荐）
- [ ] 获取服务器 IP 地址
- [ ] 配置 SSH 密钥登录
- [ ] 购买域名（可选）
- [ ] 域名解析到服务器 IP

### 本地准备
- [ ] 代码已提交到 Git 仓库9

- [ ] 前端代码已测试通过
- [ ] 后端代码已测试通过
- [ ] 数据库连接配置正确

---

## 部署步骤（30分钟）

### 第一步：连接服务器（2分钟）

```bash
# 使用 SSH 连接服务器
ssh root@your-server-ip

# 或使用密钥
ssh -i ~/.ssh/your-key.pem root@your-server-ip
```

- [ ] 成功连接到服务器

---

### 第二步：安装依赖（10分钟）

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node -v  # 应显示 v18.x.x
npm -v   # 应显示 9.x.x

# 安装 MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# 启动 MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# 验证 MongoDB
sudo systemctl status mongod

# 安装 Nginx
sudo apt install -y nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 安装 PM2
sudo npm install -g pm2

# 验证安装
pm2 -v
```

**检查点**：
- [ ] Node.js 安装成功
- [ ] MongoDB 运行正常
- [ ] Nginx 运行正常
- [ ] PM2 安装成功

---

### 第三步：上传代码（5分钟）

#### 方式一：使用 Git（推荐）

```bash
# 在服务器上克隆代码
cd /var/www
sudo git clone https://github.com/your-username/TaskManager.git attendance
cd attendance
```

#### 方式二：使用 SCP 上传

```bash
# 在本地执行
scp -r TaskManager root@your-server-ip:/var/www/attendance
```

**检查点**：
- [ ] 代码已上传到服务器
- [ ] 目录结构正确

---

### 第四步：部署后端（5分钟）

```bash
# 进入后端目录
cd /var/www/attendance/backend

# 安装依赖
npm install --production

# 配置环境变量
cp .env.production .env
nano .env

# 修改以下配置：
# NODE_ENV=production
# PORT=3000
# MONGODB_URI=mongodb://localhost:27017/attendance

# 保存并退出（Ctrl+X, Y, Enter）

# 启动服务
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# 验证服务
pm2 status
curl http://localhost:3000/health
```

**检查点**：
- [ ] 依赖安装成功
- [ ] 环境变量配置正确
- [ ] 后端服务启动成功
- [ ] 健康检查通过

---

### 第五步：部署前端（5分钟）

```bash
# 进入前端目录
cd /var/www/attendance/frontend

# 安装依赖
npm install

# 构建生产版本
npm run build

# 创建前端目录
sudo mkdir -p /var/www/attendance/frontend-dist

# 复制构建产物
sudo cp -r dist/* /var/www/attendance/frontend-dist/

# 验证文件
ls -la /var/www/attendance/frontend-dist/
```

**检查点**：
- [ ] 前端构建成功
- [ ] 文件已复制到正确位置

---

### 第六步：配置 Nginx（3分钟）

```bash
# 复制 Nginx 配置
sudo cp /var/www/attendance/nginx.conf /etc/nginx/sites-available/attendance

# 编辑配置文件
sudo nano /etc/nginx/sites-available/attendance

# 修改以下内容：
# 1. 将 yourdomain.com 替换为你的域名（或服务器IP）
# 2. 将前端路径改为：root /var/www/attendance/frontend-dist;
# 3. 如果暂时不用 HTTPS，注释掉 SSL 相关配置

# 创建软链接
sudo ln -s /etc/nginx/sites-available/attendance /etc/nginx/sites-enabled/

# 删除默认配置（可选）
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

**检查点**：
- [ ] Nginx 配置正确
- [ ] 配置测试通过
- [ ] Nginx 重启成功

---

### 第七步：配置防火墙（2分钟）

```bash
# 启用防火墙
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# 查看状态
sudo ufw status
```

**检查点**：
- [ ] 防火墙配置完成
- [ ] 必要端口已开放

---

### 第八步：测试访问（3分钟）

```bash
# 在服务器上测试
curl http://localhost
curl http://localhost/api/health

# 在本地浏览器访问
# http://your-server-ip
# http://your-server-ip/api/health
```

**检查点**：
- [ ] 前端页面可以访问
- [ ] API 接口正常
- [ ] 可以注册登录
- [ ] 可以签到签退

---

## 部署后配置（可选）

### 配置 HTTPS（推荐）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书（需要域名）
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 测试自动续期
sudo certbot renew --dry-run
```

- [ ] SSL 证书安装成功
- [ ] HTTPS 访问正常

### 配置 MongoDB 认证（推荐）

```bash
# 进入 MongoDB
mongosh

# 创建管理员
use admin
db.createUser({
  user: "admin",
  pwd: "your-strong-password",
  roles: ["userAdminAnyDatabase"]
})

# 创建应用用户
use attendance
db.createUser({
  user: "attendance_user",
  pwd: "your-app-password",
  roles: ["readWrite"]
})

exit

# 启用认证
sudo nano /etc/mongod.conf
# 添加：
# security:
#   authorization: enabled

# 重启 MongoDB
sudo systemctl restart mongod

# 更新后端配置
nano /var/www/attendance/backend/.env
# 修改：
# MONGODB_URI=mongodb://attendance_user:your-app-password@localhost:27017/attendance

# 重启后端
pm2 restart attendance-backend
```

- [ ] MongoDB 认证配置完成
- [ ] 后端连接正常

### 配置自动备份

```bash
# 创建备份脚本
sudo nano /usr/local/bin/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/attendance"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份数据库
mongodump --db attendance --out $BACKUP_DIR/backup_$DATE
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/backup_$DATE
rm -rf $BACKUP_DIR/backup_$DATE

# 删除7天前的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

```bash
# 添加执行权限
sudo chmod +x /usr/local/bin/backup.sh

# 添加定时任务
sudo crontab -e
# 添加：0 2 * * * /usr/local/bin/backup.sh
```

- [ ] 备份脚本创建完成
- [ ] 定时任务配置完成

---

## 常用命令速查

### 查看服务状态

```bash
# 后端服务
pm2 status
pm2 logs attendance-backend

# Nginx
sudo systemctl status nginx
sudo tail -f /var/log/nginx/attendance_error.log

# MongoDB
sudo systemctl status mongod
```

### 重启服务

```bash
# 重启后端
pm2 restart attendance-backend

# 重启 Nginx
sudo systemctl restart nginx

# 重启 MongoDB
sudo systemctl restart mongod
```

### 更新代码

```bash
# 拉取最新代码
cd /var/www/attendance
git pull

# 更新后端
cd backend
npm install --production
pm2 restart attendance-backend

# 更新前端
cd ../frontend
npm install
npm run build
sudo cp -r dist/* /var/www/attendance/frontend-dist/
```

---

## 故障排查

### 后端无法启动

```bash
# 查看日志
pm2 logs attendance-backend --lines 100

# 检查 MongoDB
sudo systemctl status mongod

# 检查端口占用
sudo lsof -i :3000

# 检查环境变量
cat /var/www/attendance/backend/.env
```

### 前端无法访问

```bash
# 检查 Nginx 配置
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 检查文件权限
ls -la /var/www/attendance/frontend-dist/
```

### 502 错误

```bash
# 检查后端是否运行
pm2 status
curl http://localhost:3000/health

# 检查 Nginx 配置
sudo nginx -t

# 重启服务
pm2 restart attendance-backend
sudo systemctl restart nginx
```

---

## 性能优化建议

- [ ] 启用 Gzip 压缩（已在 nginx.conf 中配置）
- [ ] 配置静态资源缓存（已在 nginx.conf 中配置）
- [ ] 使用 CDN 加速静态资源
- [ ] 配置 PM2 集群模式（已在 ecosystem.config.js 中配置）
- [ ] 定期清理日志文件
- [ ] 监控服务器资源使用

---

## 安全加固建议

- [ ] 修改 SSH 默认端口
- [ ] 禁用 root 登录
- [ ] 配置 Fail2Ban
- [ ] 启用 MongoDB 认证
- [ ] 配置 HTTPS
- [ ] 定期更新系统
- [ ] 配置自动备份

---

## 完成！🎉

恭喜你完成部署！现在你的考勤系统已经在线上运行了。

**访问地址**：
- 前端：http://your-server-ip 或 https://yourdomain.com
- 后端 API：http://your-server-ip/api 或 https://yourdomain.com/api

**下一步**：
1. 测试所有功能
2. 配置 HTTPS（如果还没有）
3. 配置自动备份
4. 设置监控告警
5. 阅读 [SECURITY.md](./SECURITY.md) 加固安全

**需要帮助？**
- 查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 详细文档
- 查看 [SECURITY.md](./SECURITY.md) 安全指南
- 检查日志文件排查问题

---

**祝你部署顺利！🚀**
