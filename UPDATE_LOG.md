# 功能更新说明

## 📋 更新内容

### 1. ❌ 去除加班功能

**修改原因**：简化考勤系统，专注于基础的签到签退和工作时长统计。

**后端修改**：
- 文件：`backend/src/services/attendanceService.js`
- 删除了 `isOvertimeCheckout()` 方法
- 删除了 `calculateOvertime()` 方法
- 签退时不再判断和计算加班时长
- 简化了签退成功的提示消息

**前端修改**：
- 文件：`frontend/src/App.jsx`
- 删除了加班时长的显示组件
- 更新了温馨提示，移除加班相关说明

**影响**：
- ✅ 签到签退功能正常
- ✅ 工作时长计算正常
- ❌ 不再显示加班时长
- ❌ 不再判断是否加班

---

### 2. ⏰ 每日早上6点自动重置

**功能说明**：系统会在每天早上6点自动处理前一天未签退的记录，为新的一天做准备。

**实现方式**：

#### 新增文件：`backend/src/services/schedulerService.js`

**核心功能**：
```javascript
// 每天早上6点执行
schedule.scheduleJob('0 6 * * *', async () => {
  await resetDailyAttendance();
});
```

**处理逻辑**：
1. 查找昨天所有未签退的记录（状态为 `checked_in`）
2. 自动为这些记录签退，使用昨天 23:59:59 作为签退时间
3. 计算并保存工作时长
4. 更新记录状态为 `checked_out`

**日志输出**：
```
[2025-12-15 06:00:00] 开始执行每日重置任务...
发现 3 条未签退记录，开始处理...
已自动签退用户 user001 的记录
已自动签退用户 user002 的记录
已自动签退用户 user003 的记录
成功处理 3 条未签退记录
[2025-12-15 06:00:00] 每日重置任务执行完成
```

#### 修改文件：`backend/src/app.js`

**改动内容**：
1. 引入 `schedulerService`
2. 在数据库连接后启动定时任务服务
3. 添加优雅关闭处理（SIGTERM、SIGINT）

**启动日志**：
```
Server is running on port 3000
Environment: development
启动定时任务服务...
已设置每日早上6点重置任务
定时任务服务已启动
```

#### 新增依赖：`node-schedule`

**安装命令**：
```bash
cd backend
npm install
```

**版本**：`^2.1.1`

---

## 🎯 工作流程

### 正常流程
```
用户签到 → 工作中 → 用户签退 → 记录完成
```

### 异常流程（忘记签退）
```
用户签到 → 工作中 → 忘记签退 → 第二天早上6点自动签退
```

### 时间线示例

**12月14日**：
- 09:00 - 用户签到
- 18:00 - 用户忘记签退，直接下班
- 23:59 - 记录状态仍为 `checked_in`

**12月15日**：
- 06:00 - 系统自动执行重置任务
  - 发现用户未签退
  - 自动签退，使用 12月14日 23:59:59 作为签退时间
  - 计算工作时长：14小时59分钟
  - 更新状态为 `checked_out`
- 09:00 - 用户可以正常签到新的一天

---

## 🔧 技术细节

### Cron 表达式说明

```
'0 6 * * *'
 │ │ │ │ │
 │ │ │ │ └─ 星期几 (0-7, 0和7都表示周日)
 │ │ │ └─── 月份 (1-12)
 │ │ └───── 日期 (1-31)
 │ └─────── 小时 (0-23)
 └───────── 分钟 (0-59)
```

**示例**：
- `'0 6 * * *'` - 每天早上6点
- `'0 */2 * * *'` - 每2小时执行一次
- `'0 0 * * 0'` - 每周日午夜执行

### 定时任务管理

**启动**：
```javascript
schedulerService.start();
```

**停止**：
```javascript
schedulerService.stop();
```

**手动触发**（用于测试）：
```javascript
schedulerService.triggerDailyReset();
```

---

## 🧪 测试方法

### 测试1：正常签到签退
```bash
# 1. 签到
curl -X POST http://localhost:3000/api/attendance/checkin \
  -H "Content-Type: application/json" \
  -d '{"userId": "test001"}'

# 2. 签退
curl -X POST http://localhost:3000/api/attendance/checkout \
  -H "Content-Type: application/json" \
  -d '{"userId": "test001"}'

# 3. 查看状态
curl http://localhost:3000/api/attendance/status/test001
```

### 测试2：忘记签退（自动重置）
```bash
# 1. 签到但不签退
curl -X POST http://localhost:3000/api/attendance/checkin \
  -H "Content-Type: application/json" \
  -d '{"userId": "test002"}'

# 2. 等待到第二天早上6点（或手动触发）
# 在 Node.js 控制台执行：
# require('./src/services/schedulerService').triggerDailyReset()

# 3. 查看记录是否自动签退
curl http://localhost:3000/api/attendance/records/test002
```

### 测试3：验证定时任务
```bash
# 查看服务器日志，确认定时任务已启动
# 应该看到：
# "启动定时任务服务..."
# "已设置每日早上6点重置任务"
# "定时任务服务已启动"
```

---

## 📊 数据库变化

### 自动签退前
```json
{
  "userId": "user001",
  "date": "2025-12-14",
  "checkInTime": "2025-12-14T09:00:00.000Z",
  "checkOutTime": null,
  "status": "checked_in",
  "workHours": 0,
  "workMinutes": 0
}
```

### 自动签退后
```json
{
  "userId": "user001",
  "date": "2025-12-14",
  "checkInTime": "2025-12-14T09:00:00.000Z",
  "checkOutTime": "2025-12-14T23:59:59.999Z",
  "status": "checked_out",
  "workHours": 14,
  "workMinutes": 59
}
```

---

## ⚠️ 注意事项

1. **时区问题**：
   - 确保服务器时区设置正确
   - 定时任务使用服务器本地时间

2. **服务重启**：
   - 服务重启后定时任务会自动重新注册
   - 不会丢失定时任务配置

3. **性能考虑**：
   - 每天只执行一次，性能影响极小
   - 处理记录数量取决于前一天未签退的用户数

4. **数据准确性**：
   - 自动签退使用 23:59:59 作为签退时间
   - 可能导致工作时长偏长，需要人工审核

5. **日志监控**：
   - 建议监控定时任务执行日志
   - 及时发现异常情况

---

## 🚀 部署说明

### 开发环境
```bash
cd backend
npm install
npm run dev
```

### 生产环境
```bash
cd backend
npm install
npm start

# 或使用 PM2
npm run pm2:start
```

### 使用 PM2 的优势
- 自动重启
- 日志管理
- 进程监控
- 定时任务持久化

---

## 📝 未来优化方向

1. **灵活的重置时间**：
   - 支持配置不同的重置时间
   - 支持不同部门设置不同的重置时间

2. **通知功能**：
   - 自动签退后发送通知给用户
   - 提醒用户确认工作时长

3. **审核机制**：
   - 自动签退的记录标记为"待审核"
   - 管理员可以手动调整时间

4. **统计报表**：
   - 统计每天自动签退的用户数量
   - 分析用户忘记签退的频率

5. **多种重置策略**：
   - 按工作日/周末设置不同规则
   - 按节假日设置特殊规则

---

## 📞 技术支持

如有问题或建议，请联系开发团队。

**更新日期**：2025-12-15
**版本**：v2.0.0
