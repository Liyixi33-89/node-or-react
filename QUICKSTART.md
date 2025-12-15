# 快速开始指南

本指南将帮助您在 5 分钟内启动考勤系统。

## 📋 前置要求

在开始之前，请确保已安装：

- ✅ **Node.js** (>= 16.0.0)
  - 下载：https://nodejs.org/
  - 验证：`node --version`

- ✅ **MongoDB** (>= 4.0)
  - 下载：https://www.mongodb.com/try/download/community
  - 或使用 MongoDB Atlas（云数据库，免费）

## 🚀 快速启动（3步）

### 步骤 1: 安装 MongoDB

#### Windows 用户（推荐方式）

**方式 A: 本地安装**
```bash
# 1. 下载 MongoDB Community Server
# 访问: https://www.mongodb.com/try/download/community

# 2. 安装后启动服务
net start MongoDB

# 3. 验证安装
mongosh --version
```

**方式 B: 使用 MongoDB Atlas（云数据库）**
```bash
# 1. 注册账号: https://www.mongodb.com/cloud/atlas/register
# 2. 创建免费集群
# 3. 获取连接字符串
# 4. 在 backend/.env 中配置连接字符串
```

### 步骤 2: 安装项目依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 步骤 3: 启动应用

#### 方式 A: 使用启动脚本（最简单）

```bash
# 回到项目根目录
cd ..

# Windows 用户
start.bat

# 脚本会自动：
# - 检查并安装依赖
# - 启动后端服务（端口 3000）
# - 启动前端应用（端口 5173）
```

#### 方式 B: 手动启动

**终端 1 - 启动后端**
```bash
cd backend
npm run dev
```

看到以下信息表示成功：
```
MongoDB connected successfully
Server is running on port 3000
```

**终端 2 - 启动前端**
```bash
cd frontend
npm run dev
```

看到以下信息表示成功：
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### 步骤 4: 访问应用

在浏览器中打开：**http://localhost:5173**

💡 **建议**：按 F12 打开开发者工具，切换到移动设备模拟器查看最佳效果！

## ✅ 验证安装

### 1. 测试 MongoDB 连接

```bash
cd backend
npm run test:db
```

成功输出：
```
✅ MongoDB 连接成功！
数据库名: attendance
主机: localhost
端口: 27017
```

### 2. 测试后端 API

访问：http://localhost:3000/health

应该返回：
```json
{
  "status": "ok",
  "timestamp": "2025-12-10T..."
}
```

### 3. 测试前端界面

访问：http://localhost:5173

应该看到：
- 实时时钟
- 签到/签退按钮
- 状态显示

## 🎯 开始使用

### 1. 签到

1. 点击 **"签到"** 按钮
2. 看到 "签到成功" 提示
3. 状态变为 "已签到"（绿色指示器）
4. 显示签到时间

### 2. 签退

1. 点击 **"签退"** 按钮
2. 看到 "签退成功" 提示
3. 状态变为 "已签退"（灰色指示器）
4. 显示工作时长
5. 如果是晚上 7 点后签退，会显示加班时长

### 3. 查看记录

考勤记录自动保存到 MongoDB，可以通过以下方式查看：

**方式 1: 使用 API**
```bash
# 查看状态
curl http://localhost:3000/api/attendance/status/user_xxx

# 查看记录
curl http://localhost:3000/api/attendance/records/user_xxx?days=7
```

**方式 2: 使用 MongoDB Compass**
1. 打开 MongoDB Compass
2. 连接到 `mongodb://localhost:27017`
3. 选择数据库 `attendance`
4. 查看集合 `attendances`

**方式 3: 使用命令行**
```bash
mongosh
use attendance
db.attendances.find().pretty()
```

## 📱 功能说明

### 每日重置规则
- ⏰ 每天早上 **6:00** 开始新的考勤周期
- 🌙 6:00 之前算作前一天
- ☀️ 6:00 之后算作当天

**示例**：
```
2025-12-10 05:30 签到 → 记录为 2025-12-09
2025-12-10 06:00 签到 → 记录为 2025-12-10
```

### 加班判定规则
- 🌆 晚上 **19:00（7点）** 为分界点
- ✅ 19:00 前签退：正常下班
- 🌙 19:00 后签退：记录为加班

**示例**：
```
18:30 签退 → 不算加班
19:00 签退 → 加班 0 小时 0 分钟
20:30 签退 → 加班 1 小时 30 分钟
22:00 签退 → 加班 3 小时 0 分钟
```

### 工作流程
```
1. 签到（任意时间）
   ↓
2. 工作中...
   ↓
3. 签退
   ↓
4. 自动计算工作时长
   ↓
5. 判断是否加班
   ↓
6. 保存到数据库
```

## 🔧 常见问题

### Q1: MongoDB 连接失败？

**错误信息**：
```
❌ MongoDB 连接失败！
MongoServerError: connect ECONNREFUSED
```

**解决方案**：
```bash
# 1. 检查 MongoDB 服务是否启动
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod

# 2. 验证 MongoDB 是否运行
mongosh

# 3. 检查端口是否被占用
netstat -ano | findstr :27017
```

### Q2: 端口被占用？

**错误信息**：
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案**：
```bash
# 方式 1: 关闭占用端口的程序
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# 方式 2: 修改端口
# 在 backend/.env 中设置
PORT=3001
```

### Q3: 依赖安装失败？

**解决方案**：
```bash
# 1. 清除缓存
npm cache clean --force

# 2. 删除 node_modules
rm -rf node_modules package-lock.json

# 3. 重新安装
npm install

# 4. 使用淘宝镜像（可选）
npm install --registry=https://registry.npmmirror.com
```

### Q4: 前端无法连接后端？

**检查清单**：
- ✅ 后端服务已启动（http://localhost:3000/health 返回 OK）
- ✅ 前端代理配置正确（vite.config.js）
- ✅ 防火墙未阻止连接
- ✅ 浏览器控制台无错误

### Q5: MongoDB Compass 无法连接？

**解决方案**：
```bash
# 1. 确认 MongoDB 服务运行中
net start MongoDB

# 2. 使用正确的连接字符串
mongodb://localhost:27017

# 3. 检查防火墙设置
```

## 📚 下一步

### 学习更多
- 📖 [完整文档](README.md)
- 🗄️ [MongoDB 配置指南](MONGODB.md)
- 📝 [更新日志](CHANGELOG.md)
- ✨ [功能特性](FEATURES.md)

### 开发建议
- 🔐 添加用户认证系统
- 📊 实现数据统计报表
- 📱 开发移动端 App
- 🎨 自定义主题样式

### 生产部署
- 🚀 使用 PM2 部署后端
- 🌐 配置 Nginx 反向代理
- 🔒 启用 HTTPS
- 📦 使用 Docker 容器化

## 💡 提示

### 开发技巧
1. 使用 `nodemon` 自动重启后端（已配置）
2. 使用 Vite HMR 热更新前端（已配置）
3. 使用 MongoDB Compass 可视化管理数据
4. 使用浏览器开发者工具调试

### 最佳实践
1. 定期备份 MongoDB 数据
2. 使用环境变量管理配置
3. 编写单元测试
4. 使用 Git 版本控制

## 🎉 完成！

恭喜！您已成功启动考勤系统。

现在可以：
- ✅ 进行签到签退操作
- ✅ 查看考勤记录
- ✅ 测试加班功能
- ✅ 进行二次开发

如有问题，请查看详细文档或提交 Issue。

祝您使用愉快！ 🚀
