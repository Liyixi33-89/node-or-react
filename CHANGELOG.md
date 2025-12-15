# 更新日志

## v2.0.0 - MongoDB 集成版本 (2025-12-10)

### 🎉 重大更新

#### 数据持久化
- ✅ 集成 MongoDB 数据库
- ✅ 使用 Mongoose ODM 进行数据建模
- ✅ 所有考勤记录持久化保存
- ✅ 服务重启后数据不丢失

#### 每日重置机制
- ✅ 实现每天早上 6:00 自动重置
- ✅ 6:00 之前算作前一天
- ✅ 6:00 之后可以进行新一天的签到
- ✅ 智能判断跨日情况

#### 加班功能
- ✅ 晚上 19:00（7点）后签退自动记录为加班
- ✅ 自动计算加班时长（小时+分钟）
- ✅ 前端显示加班信息
- ✅ 加班记录带动画效果

#### 数据模型优化
- ✅ 创建 Attendance 数据模型
- ✅ 添加唯一索引（userId + date）
- ✅ 自动时间戳（createdAt, updatedAt）
- ✅ 实例方法和静态方法

#### 前端优化
- ✅ 显示加班时长信息
- ✅ 加班标识带渐变动画
- ✅ 更新温馨提示内容
- ✅ 优化状态显示

### 📝 技术改进

#### 后端
- 新增 `src/config/database.js` - 数据库连接配置
- 新增 `src/models/Attendance.js` - 数据模型定义
- 重构 `src/services/attendanceService.js` - 使用 MongoDB
- 更新 `src/app.js` - 添加数据库连接
- 更新 `src/routes/attendance.js` - 异步方法调用
- 添加 `mongoose` 依赖

#### 前端
- 更新 `src/App.jsx` - 显示加班信息
- 更新 `src/App.css` - 加班样式和动画
- 优化用户提示信息

#### 文档
- 新增 `MONGODB.md` - MongoDB 安装和配置指南
- 更新 `README.md` - 添加 MongoDB 相关说明
- 更新 `.env.example` - MongoDB 配置示例

### 🔧 配置变更

#### 环境变量
```env
# 新增
MONGODB_URI=mongodb://localhost:27017/attendance
```

#### 依赖更新
```json
{
  "mongoose": "^8.0.3"
}
```

### 📊 数据库结构

#### 集合：attendances
```javascript
{
  userId: String,
  date: String,
  checkInTime: Date,
  checkOutTime: Date,
  status: String,
  workHours: Number,
  workMinutes: Number,
  isOvertime: Boolean,
  overtimeHours: Number,
  overtimeMinutes: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### 索引
- `{ userId: 1, date: 1 }` - 唯一索引

### 🎯 业务规则

#### 每日重置规则
- 早上 6:00 为分界点
- 6:00 前算前一天
- 6:00 后算当天

#### 加班判定规则
- 晚上 19:00 为分界点
- 19:00 前签退：正常下班
- 19:00 后签退：记录加班
- 自动计算加班时长

### 🐛 Bug 修复
- 修复内存存储数据丢失问题
- 修复跨日期签到问题
- 优化错误处理机制

### ⚠️ 破坏性变更
- 需要安装 MongoDB 才能运行
- Service 方法改为异步（async/await）
- 数据结构有变化

### 📚 文档更新
- 新增 MongoDB 安装指南
- 更新快速开始步骤
- 更新 API 文档
- 添加业务规则说明

---

## v1.0.0 - 初始版本 (2025-12-10)

### ✨ 核心功能

#### 签到签退
- ✅ 签到功能
- ✅ 签退功能
- ✅ 状态查询
- ✅ 记录查询

#### 前端界面
- ✅ React 移动端界面
- ✅ 实时时钟显示
- ✅ 状态指示器
- ✅ 渐变色设计
- ✅ 响应式布局

#### 后端服务
- ✅ Koa2 框架
- ✅ RESTful API
- ✅ 错误处理
- ✅ CORS 支持

#### 部署支持
- ✅ PM2 配置
- ✅ cross-env 环境管理
- ✅ 开发/生产环境分离

### 📦 技术栈

#### 后端
- Koa2
- Koa Router
- Koa Bodyparser
- Moment.js
- PM2
- cross-env

#### 前端
- React 18
- Vite
- Antd Mobile
- Axios
- Moment.js

### 📝 初始文件
- 完整的项目结构
- 详细的文档
- 快速启动脚本
- API 测试脚本

### 🎨 界面特性
- 移动端优化
- 渐变色背景
- 动画效果
- 大按钮设计
- Toast 提示

---

## 升级指南

### 从 v1.0.0 升级到 v2.0.0

#### 1. 安装 MongoDB
参考 [MONGODB.md](MONGODB.md) 安装 MongoDB

#### 2. 更新依赖
```bash
cd backend
npm install
```

#### 3. 配置环境变量
```bash
# 创建 .env 文件
cp .env.example .env

# 编辑 .env
MONGODB_URI=mongodb://localhost:27017/attendance
```

#### 4. 启动 MongoDB
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

#### 5. 启动应用
```bash
npm run dev
```

#### 6. 数据迁移（如需要）
v1.0.0 使用内存存储，数据无法迁移到 v2.0.0
建议重新开始使用

---

## 路线图

### v2.1.0 (计划中)
- [ ] 用户登录系统
- [ ] 权限管理
- [ ] 迟到/早退判定

### v2.2.0 (计划中)
- [ ] 管理员后台
- [ ] 数据统计报表
- [ ] 数据导出功能

### v3.0.0 (计划中)
- [ ] 微服务架构
- [ ] Docker 容器化
- [ ] CI/CD 自动化
- [ ] 单元测试覆盖

---

## 贡献者
- TaskManager Team

## 许可证
MIT License
