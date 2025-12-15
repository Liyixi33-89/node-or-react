# 考勤签到签出系统

一个完整的考勤管理系统，包含后端API服务和移动端前端界面。

## 项目结构

```
TaskManager/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── app.js          # Koa2 应用入口
│   │   ├── routes/         # 路由定义
│   │   │   └── attendance.js
│   │   └── services/       # 业务逻辑
│   │       └── attendanceService.js
│   ├── package.json
│   ├── ecosystem.config.js # PM2 配置
│   └── README.md
│
└── frontend/               # 前端应用
    ├── src/
    │   ├── api/           # API 封装
    │   │   └── index.js
    │   ├── App.jsx        # 主组件
    │   ├── App.css        # 样式文件
    │   ├── main.jsx       # 入口文件
    │   └── index.css      # 全局样式
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── README.md
```

## 技术栈

### 后端
- **Koa2** - 轻量级 Node.js Web 框架
- **MongoDB** - NoSQL 数据库（数据持久化）
- **Mongoose** - MongoDB ODM
- **PM2** - 生产环境进程管理
- **cross-env** - 跨平台环境变量设置
- **Moment.js** - 时间处理

### 前端
- **React 18** - UI 框架
- **Vite** - 快速构建工具
- **Antd Mobile** - 移动端 UI 组件库
- **Axios** - HTTP 请求库

## ⚠️ 重要提示

**本系统已集成 MongoDB 数据库，使用前请先安装并启动 MongoDB！**

详细安装和配置指南请查看：[MONGODB.md](MONGODB.md)

### 核心功能
- ✅ **数据持久化** - 使用 MongoDB 保存考勤记录
- ✅ **每日重置** - 每天早上 6:00 开始新的考勤周期
- ✅ **加班判定** - 晚上 19:00（7点）后签退自动记录为加班
- ✅ **时长统计** - 自动计算工作时长和加班时长

## 快速开始

### 0. 安装 MongoDB（必需）

**Windows 用户**：
1. 下载：https://www.mongodb.com/try/download/community
2. 安装并启动服务
3. 或使用 MongoDB Atlas 云数据库（免费）

**详细步骤**：请查看 [MONGODB.md](MONGODB.md)

### 1. 安装依赖

#### 后端
```bash
cd backend
npm install
```

#### 前端
```bash
cd frontend
npm install
```

### 2. 启动开发环境

#### 启动后端（终端1）
```bash
cd backend
npm run dev
```
后端服务运行在: http://localhost:3000

#### 启动前端（终端2）
```bash
cd frontend
npm run dev
```
前端应用运行在: http://localhost:5173

### 3. 访问应用

在浏览器中打开: http://localhost:5173

建议使用浏览器的移动设备模拟器查看效果（F12 -> 切换设备工具栏）

## 生产环境部署

### 后端部署

#### 方式1: 使用 PM2（推荐）
```bash
cd backend
npm install
npm run pm2:start
```

#### 方式2: 直接运行
```bash
cd backend
npm install
npm start
```

### 前端部署

```bash
cd frontend
npm install
npm run build
```

构建产物在 `frontend/dist` 目录，可以部署到任何静态服务器（Nginx、Apache等）

## 功能说明

### 签到功能
- 每天早上 6:00 开始新的考勤周期
- 用户每天只能签到一次
- 签到成功后记录签到时间
- 签到后才能进行签退操作
- 数据持久化保存到 MongoDB

### 签退功能
- 必须先签到才能签退
- 签退成功后记录签退时间
- 自动计算工作时长
- **加班判定**：晚上 19:00（7点）后签退自动记录为加班
- 自动计算加班时长

### 状态查询
- 实时显示当前签到状态
- 显示签到/签退时间
- 显示工作时长
- 显示加班时长（如有）

### 数据管理
- MongoDB 数据持久化
- 支持历史记录查询
- 每日自动重置（早上6点）
- 加班记录统计

## API 接口

### 1. 签到
```
POST /api/attendance/checkin
Body: { "userId": "user123" }
```

### 2. 签退
```
POST /api/attendance/checkout
Body: { "userId": "user123" }
```

### 3. 获取状态
```
GET /api/attendance/status/:userId
```

### 4. 获取记录
```
GET /api/attendance/records/:userId?days=7
```

详细API文档请查看 [backend/README.md](backend/README.md)

## 界面预览

### 主界面特性
- 🎨 渐变色背景设计
- ⏰ 实时时钟显示
- 📅 日期显示
- 🔵 状态指示器（动画效果）
- 🎯 大按钮设计，易于点击
- 📱 完美适配移动端

### 状态说明
- **未签到** - 红色指示器，可以签到
- **已签到** - 绿色指示器，可以签退
- **已签退** - 灰色指示器，显示工作时长

## 注意事项

1. **MongoDB 必需**: 系统已集成 MongoDB，使用前必须先安装并启动 MongoDB 服务

2. **数据持久化**: 所有考勤记录保存在 MongoDB 中，重启后数据不会丢失

3. **每日重置**: 每天早上 6:00 开始新的考勤周期，6:00 之前算作前一天

4. **加班规则**: 晚上 19:00（7点）后签退自动记录为加班并计算加班时长

5. **用户认证**: 当前使用随机生成的用户ID，实际项目中应该集成完整的用户认证系统

6. **时区处理**: 使用服务器本地时间，如需支持多时区请进行相应调整

## 开发建议

### 已实现功能
- [x] 数据库持久化存储（MongoDB）
- [x] 每日自动重置（早上6点）
- [x] 加班判定和统计（晚上7点）
- [x] 考勤记录查询

### 后续可扩展功能
- [ ] 用户登录/注册系统
- [ ] 迟到/早退判定
- [ ] 请假申请功能
- [ ] 管理员后台
- [ ] 数据导出功能（Excel/PDF）
- [ ] 考勤统计报表
- [ ] 地理位置打卡
- [ ] 人脸识别打卡
- [ ] 邮件/短信通知

## 常见问题

### Q: 前端无法连接后端？
A: 确保后端服务已启动，检查 `vite.config.js` 中的代理配置

### Q: PM2 启动失败？
A: 确保已全局安装 PM2: `npm install -g pm2`

### Q: 移动端样式异常？
A: 确保浏览器开启了移动设备模拟模式，或在真实移动设备上测试

## 许可证

MIT

## 作者

TaskManager Team
