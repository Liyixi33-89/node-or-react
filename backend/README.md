# 考勤系统后端

基于 Koa2 的考勤签到签退系统后端服务

## 技术栈

- Koa2 - Web框架
- PM2 - 生产环境进程管理
- cross-env - 跨平台环境变量设置

## 安装依赖

```bash
npm install
```

## 开发环境运行

```bash
npm run dev
```

## 生产环境运行

### 使用 Node 直接运行
```bash
npm start
```

### 使用 PM2 运行
```bash
npm run pm2:start    # 启动
npm run pm2:stop     # 停止
npm run pm2:restart  # 重启
npm run pm2:delete   # 删除
```

## API 接口

### 1. 签到
- **URL**: `POST /api/attendance/checkin`
- **Body**: 
  ```json
  {
    "userId": "user123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "签到成功",
    "data": {
      "userId": "user123",
      "date": "2025-12-10",
      "checkInTime": "2025-12-10 09:00:00",
      "checkOutTime": null,
      "status": "checked_in"
    }
  }
  ```

### 2. 签退
- **URL**: `POST /api/attendance/checkout`
- **Body**: 
  ```json
  {
    "userId": "user123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "签退成功",
    "data": {
      "userId": "user123",
      "date": "2025-12-10",
      "checkInTime": "2025-12-10 09:00:00",
      "checkOutTime": "2025-12-10 18:00:00",
      "status": "checked_out",
      "workDuration": {
        "hours": 9,
        "minutes": 0,
        "total": "9小时0分钟"
      }
    }
  }
  ```

### 3. 获取当前状态
- **URL**: `GET /api/attendance/status/:userId`
- **Response**:
  ```json
  {
    "success": true,
    "message": "获取状态成功",
    "data": {
      "status": "checked_in",
      "canCheckIn": false,
      "canCheckOut": true,
      "checkInTime": "2025-12-10 09:00:00"
    }
  }
  ```

### 4. 获取考勤记录
- **URL**: `GET /api/attendance/records/:userId?days=7`
- **Response**:
  ```json
  {
    "success": true,
    "message": "获取记录成功",
    "data": [...]
  }
  ```

## 端口配置

默认端口: 3000

可通过环境变量 `PORT` 修改
