# 考勤打卡系统

一个基于 Node.js + MongoDB + React 的考勤打卡系统，支持用户登录、签到签退、工作时长统计和加班记录。

## 功能特性

### 用户系统
- ✅ 用户注册和登录
- ✅ 快速登录（开发模式，自动创建用户）
- ✅ 用户信息持久化到数据库
- ✅ 退出登录功能

### 考勤功能
- ✅ 每日签到（每天只能签到一次）
- ✅ 签退（可多次更新）
- ✅ 实时工作时长显示
- ✅ 自动计算工作时长
- ✅ 加班时长统计（晚上7点后）
- ✅ 考勤记录查询

### 技术特点
- ✅ 前后端分离架构
- ✅ MongoDB 数据库存储
- ✅ RESTful API 设计
- ✅ 响应式界面设计
- ✅ 实时数据更新

## 技术栈

### 后端
- **框架**: Koa.js
- **数据库**: MongoDB + Mongoose
- **工具**: nodemon, cross-env

### 前端
- **框架**: React 18
- **UI库**: Ant Design Mobile
- **构建工具**: Vite
- **时间处理**: Moment.js

## 项目结构

```
TaskManager/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── models/         # 数据模型
│   │   │   ├── User.js     # 用户模型
│   │   │   └── Attendance.js # 考勤模型
│   │   ├── services/       # 业务逻辑
│   │   │   ├── userService.js
│   │   │   └── attendanceService.js
│   │   ├── routes/         # 路由
│   │   │   ├── user.js     # 用户路由
│   │   │   └── attendance.js # 考勤路由
│   │   ├── config/         # 配置
│   │   │   └── database.js # 数据库配置
│   │   └── app.js          # 应用入口
│   └── package.json
│
└── frontend/               # 前端应用
    ├── src/
    │   ├── components/     # 组件
    │   │   ├── Login.jsx   # 登录组件
    │   │   └── Login.css
    │   ├── api/            # API接口
    │   │   └── index.js
    │   ├── App.jsx         # 主应用
    │   └── App.css
    └── package.json
```

## 快速开始

### 环境要求
- Node.js >= 16.x
- MongoDB >= 4.x

### 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 启动服务

```bash
# 启动后端服务（端口3000）
cd backend
npm run dev

# 启动前端服务（端口5173）
cd frontend
npm run dev
```

### 访问应用
打开浏览器访问：http://localhost:5173

## API 接口

### 用户接口

#### 1. 用户注册
```
POST /api/user/register
Body: { username, password, name }
```

#### 2. 用户登录
```
POST /api/user/login
Body: { username, password }
```

#### 3. 快速登录（开发模式）
```
POST /api/user/quick-login
Body: { username }
```

#### 4. 获取用户信息
```
GET /api/user/info/:userId
```

### 考勤接口

#### 1. 签到
```
POST /api/attendance/checkin
Body: { userId }
```

#### 2. 签退
```
POST /api/attendance/checkout
Body: { userId }
```

#### 3. 获取当天状态
```
GET /api/attendance/status/:userId
```

#### 4. 获取考勤记录
```
GET /api/attendance/records/:userId?days=7
```

## 使用说明

### 登录
1. 首次访问会显示登录页面
2. 输入用户名，点击"快速登录"（自动创建账号）
3. 或点击"使用演示账号"快速体验

### 签到签退
1. 登录后进入考勤页面
2. 点击"签到"按钮进行签到
3. 签到后会显示实时工作时长
4. 点击"签退"按钮进行签退
5. 签退后可以多次点击更新工作时长

### 加班统计
- 晚上7点（19:00）后签退会自动记录为加班
- 系统会自动计算加班时长

## 数据模型

### User（用户）
```javascript
{
  username: String,      // 用户名（唯一）
  password: String,      // 密码（SHA256加密）
  name: String,          // 姓名
  createdAt: Date,       // 创建时间
  lastLoginAt: Date      // 最后登录时间
}
```

### Attendance（考勤）
```javascript
{
  userId: String,        // 用户ID
  date: String,          // 日期（YYYY-MM-DD）
  checkInTime: Date,     // 签到时间
  checkOutTime: Date,    // 签退时间
  status: String,        // 状态（not_checked_in/checked_in/checked_out）
  workDuration: Object,  // 工作时长
  isOvertime: Boolean,   // 是否加班
  overtimeDuration: Object // 加班时长
}
```

## 开发说明

### 环境变量
后端支持以下环境变量：
- `MONGODB_URI`: MongoDB连接字符串（默认：mongodb://localhost:27017/attendance）
- `PORT`: 服务端口（默认：3000）
- `NODE_ENV`: 运行环境（development/production）

### 数据库
- 数据库名称：`attendance`
- 集合：`users`, `attendances`

### 前端代理配置
前端开发时通过 Vite 代理转发 API 请求到后端：
```javascript
// vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true
  }
}
```

## 核心改进

### 相比 localStorage 方案的优势

#### 之前（localStorage）
- ❌ 用户ID随机生成，刷新页面会变化
- ❌ 数据只存在浏览器本地
- ❌ 无法跨设备使用
- ❌ 清除浏览器数据会丢失所有记录

#### 现在（数据库）
- ✅ 用户信息存储在数据库中
- ✅ 真实的用户系统，支持登录验证
- ✅ 数据持久化，不会丢失
- ✅ 支持多设备登录
- ✅ 可以查询历史记录
- ✅ 便于后续扩展（权限管理、统计报表等）

## 后续扩展

可以继续添加的功能：
- [ ] 完整的注册登录流程（密码加密、验证码）
- [ ] 用户权限管理（管理员、普通用户）
- [ ] 考勤统计报表
- [ ] 请假申请功能
- [ ] 导出考勤记录
- [ ] 邮件/短信通知
- [ ] 移动端适配优化

## 许可证
MIT
