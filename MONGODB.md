# MongoDB 集成指南

## 数据持久化说明

系统已集成 MongoDB 数据库，实现以下功能：

### ✨ 新增功能

1. **数据持久化**
   - 所有考勤记录保存到 MongoDB
   - 服务重启后数据不丢失
   - 支持历史记录查询

2. **每日重置机制**
   - 每天早上 6:00 开始新的考勤周期
   - 6:00 之前算作前一天
   - 6:00 之后可以进行新一天的签到

3. **加班判定**
   - 晚上 19:00（7点）后签退自动记录为加班
   - 自动计算加班时长
   - 前端显示加班信息（带动画效果）

4. **工作时长统计**
   - 自动计算总工作时长
   - 单独统计加班时长
   - 友好的时长显示格式

## MongoDB 安装

### Windows 系统

#### 方式一：使用 MongoDB Community Server（推荐）

1. **下载 MongoDB**
   - 访问：https://www.mongodb.com/try/download/community
   - 选择 Windows 版本
   - 下载 MSI 安装包

2. **安装 MongoDB**
   ```
   - 双击 MSI 文件
   - 选择 "Complete" 完整安装
   - 勾选 "Install MongoDB as a Service"
   - 勾选 "Install MongoDB Compass"（可选，图形化管理工具）
   ```

3. **验证安装**
   ```bash
   # 打开命令提示符
   mongod --version
   ```

4. **启动 MongoDB 服务**
   ```bash
   # MongoDB 会自动作为服务启动
   # 如需手动启动：
   net start MongoDB
   ```

#### 方式二：使用 MongoDB Atlas（云数据库，免费）

1. **注册账号**
   - 访问：https://www.mongodb.com/cloud/atlas/register
   - 注册免费账号

2. **创建集群**
   - 选择 Free Shared Cluster
   - 选择离你最近的区域
   - 点击 "Create Cluster"

3. **配置访问**
   - 创建数据库用户
   - 添加 IP 白名单（0.0.0.0/0 允许所有IP）
   - 获取连接字符串

4. **更新配置**
   ```bash
   # 在 backend/.env 文件中设置
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/attendance
   ```

### Linux/Mac 系统

#### Ubuntu/Debian
```bash
# 导入公钥
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# 添加源
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# 安装
sudo apt-get update
sudo apt-get install -y mongodb-org

# 启动服务
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### macOS
```bash
# 使用 Homebrew
brew tap mongodb/brew
brew install mongodb-community

# 启动服务
brew services start mongodb-community
```

## 配置说明

### 1. 环境变量配置

在 `backend` 目录创建 `.env` 文件：

```bash
# 复制示例文件
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 本地 MongoDB
MONGODB_URI=mongodb://localhost:27017/attendance

# 或使用 MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/attendance

PORT=3000
NODE_ENV=development
```

### 2. 数据库结构

**集合名称**: `attendances`

**文档结构**:
```javascript
{
  userId: String,           // 用户ID
  date: String,            // 日期 (YYYY-MM-DD)
  checkInTime: Date,       // 签到时间
  checkOutTime: Date,      // 签退时间
  status: String,          // 状态: checked_in | checked_out
  workHours: Number,       // 工作小时数
  workMinutes: Number,     // 工作分钟数
  isOvertime: Boolean,     // 是否加班
  overtimeHours: Number,   // 加班小时数
  overtimeMinutes: Number, // 加班分钟数
  createdAt: Date,         // 创建时间
  updatedAt: Date          // 更新时间
}
```

**索引**:
- `{ userId: 1, date: 1 }` - 唯一索引，确保每个用户每天只有一条记录

## 业务规则详解

### 1. 每日重置规则（早上6点）

```javascript
// 示例场景
当前时间: 2025-12-10 05:30
有效日期: 2025-12-09  // 6点前算前一天

当前时间: 2025-12-10 06:00
有效日期: 2025-12-10  // 6点后算当天

当前时间: 2025-12-10 23:00
有效日期: 2025-12-10  // 当天
```

### 2. 加班判定规则（晚上7点）

```javascript
// 示例场景
签退时间: 18:30 → 不算加班
签退时间: 19:00 → 开始算加班（0小时0分钟）
签退时间: 20:30 → 加班1小时30分钟
签退时间: 22:00 → 加班3小时0分钟
```

### 3. 工作流程

```
1. 用户签到（任意时间）
   ↓
2. 记录签到时间
   ↓
3. 用户签退
   ↓
4. 记录签退时间
   ↓
5. 计算工作时长
   ↓
6. 判断是否加班（>= 19:00）
   ↓
7. 如果加班，计算加班时长
   ↓
8. 保存到数据库
```

## 启动系统

### 1. 确保 MongoDB 运行

```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl status mongod
```

### 2. 安装依赖

```bash
cd backend
npm install
```

### 3. 启动后端

```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

### 4. 查看日志

启动时会显示：
```
MongoDB connected successfully
Database: mongodb://localhost:27017/attendance
Server is running on port 3000
```

## 数据管理

### 使用 MongoDB Compass（图形化工具）

1. 打开 MongoDB Compass
2. 连接到：`mongodb://localhost:27017`
3. 选择数据库：`attendance`
4. 查看集合：`attendances`

### 使用命令行

```bash
# 连接到 MongoDB
mongosh

# 切换数据库
use attendance

# 查看所有记录
db.attendances.find().pretty()

# 查询特定用户
db.attendances.find({ userId: "user_xxx" })

# 查询今天的记录
db.attendances.find({ date: "2025-12-10" })

# 查询加班记录
db.attendances.find({ isOvertime: true })

# 统计记录数
db.attendances.countDocuments()

# 删除所有记录（慎用）
db.attendances.deleteMany({})
```

## 常见问题

### Q1: MongoDB 连接失败？

**检查清单**:
1. MongoDB 服务是否启动
2. 端口 27017 是否被占用
3. 连接字符串是否正确
4. 防火墙是否阻止连接

**解决方案**:
```bash
# Windows 检查服务
sc query MongoDB

# 重启服务
net stop MongoDB
net start MongoDB
```

### Q2: 数据没有保存？

**可能原因**:
1. MongoDB 未连接成功
2. 数据验证失败
3. 索引冲突

**查看日志**:
```bash
# 后端控制台会显示错误信息
# 检查 MongoDB 日志
```

### Q3: 如何备份数据？

```bash
# 导出数据
mongodump --db attendance --out ./backup

# 导入数据
mongorestore --db attendance ./backup/attendance
```

### Q4: 如何清空测试数据？

```bash
# 方式1: 使用 mongosh
mongosh
use attendance
db.attendances.deleteMany({})

# 方式2: 使用 MongoDB Compass
# 在 attendances 集合中选择所有文档并删除
```

## 性能优化建议

### 1. 索引优化
```javascript
// 已创建的索引
{ userId: 1, date: 1 }  // 唯一索引

// 可选的额外索引
db.attendances.createIndex({ createdAt: -1 })  // 按创建时间排序
db.attendances.createIndex({ isOvertime: 1 })  // 加班查询
```

### 2. 查询优化
- 使用索引字段进行查询
- 限制返回字段
- 使用分页查询大量数据

### 3. 连接池配置
```javascript
// 在 database.js 中可以添加
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 10,
  minPoolSize: 2,
  socketTimeoutMS: 45000,
});
```

## 监控和维护

### 1. 查看数据库状态
```bash
mongosh
use attendance
db.stats()
```

### 2. 查看集合统计
```bash
db.attendances.stats()
```

### 3. 定期备份
建议每天自动备份数据：
```bash
# 创建备份脚本 backup.sh
#!/bin/bash
DATE=$(date +%Y%m%d)
mongodump --db attendance --out ./backups/$DATE
```

## 升级到生产环境

### 1. 使用副本集
```javascript
MONGODB_URI=mongodb://host1:27017,host2:27017,host3:27017/attendance?replicaSet=rs0
```

### 2. 启用认证
```bash
# 创建管理员用户
use admin
db.createUser({
  user: "admin",
  pwd: "password",
  roles: ["root"]
})

# 启用认证
mongod --auth
```

### 3. 配置连接字符串
```env
MONGODB_URI=mongodb://username:password@localhost:27017/attendance?authSource=admin
```

## 总结

✅ MongoDB 已成功集成
✅ 数据持久化已实现
✅ 每日6点重置机制已实现
✅ 加班判定（晚上7点）已实现
✅ 工作时长和加班时长自动计算

现在您的考勤系统具备完整的数据持久化能力，可以在生产环境中使用！
