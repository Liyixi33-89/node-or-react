# 安装和运行指南

## 前置要求

在开始之前，请确保您的系统已安装：

- **Node.js** (版本 >= 16.0.0)
  - 下载地址: https://nodejs.org/
  - 验证安装: `node --version`

- **npm** (通常随 Node.js 一起安装)
  - 验证安装: `npm --version`

## 方式一：使用快速启动脚本（推荐）

### Windows 系统

1. 双击运行 `start.bat` 文件
2. 脚本会自动：
   - 检查并安装依赖
   - 启动后端服务
   - 启动前端服务
3. 等待服务启动完成
4. 在浏览器中访问: http://localhost:5173

## 方式二：手动启动

### 步骤 1: 安装后端依赖

打开终端（命令提示符或 PowerShell），执行：

```bash
cd backend
npm install
```

### 步骤 2: 安装前端依赖

打开新的终端窗口，执行：

```bash
cd frontend
npm install
```

### 步骤 3: 启动后端服务

在后端目录的终端中执行：

```bash
npm run dev
```

看到以下信息表示启动成功：
```
Server is running on port 3000
Environment: development
```

### 步骤 4: 启动前端服务

在前端目录的终端中执行：

```bash
npm run dev
```

看到以下信息表示启动成功：
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### 步骤 5: 访问应用

在浏览器中打开: http://localhost:5173

**建议**: 按 F12 打开开发者工具，点击设备工具栏图标（或按 Ctrl+Shift+M），选择移动设备模拟器查看效果

## 生产环境部署

### 后端部署

#### 使用 PM2（推荐）

1. 全局安装 PM2:
```bash
npm install -g pm2
```

2. 启动服务:
```bash
cd backend
npm install --production
npm run pm2:start
```

3. 查看状态:
```bash
pm2 status
```

4. 查看日志:
```bash
pm2 logs attendance-backend
```

5. 其他命令:
```bash
npm run pm2:stop      # 停止服务
npm run pm2:restart   # 重启服务
npm run pm2:delete    # 删除服务
```

### 前端部署

1. 构建生产版本:
```bash
cd frontend
npm install
npm run build
```

2. 构建产物在 `frontend/dist` 目录

3. 部署到静态服务器（如 Nginx）:

**Nginx 配置示例:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /path/to/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 常见问题排查

### 问题 1: 端口被占用

**错误信息**: `Error: listen EADDRINUSE: address already in use :::3000`

**解决方案**:
- 方式1: 关闭占用端口的程序
- 方式2: 修改端口号
  - 后端: 在 `backend/src/app.js` 中修改 PORT
  - 前端: 在 `frontend/vite.config.js` 中修改 server.port

### 问题 2: 依赖安装失败

**解决方案**:
1. 清除 npm 缓存:
```bash
npm cache clean --force
```

2. 删除 node_modules 和 package-lock.json:
```bash
rm -rf node_modules package-lock.json
```

3. 重新安装:
```bash
npm install
```

4. 如果还是失败，尝试使用淘宝镜像:
```bash
npm install --registry=https://registry.npmmirror.com
```

### 问题 3: 前端无法连接后端

**检查清单**:
1. 确认后端服务已启动（访问 http://localhost:3000/health 应返回 OK）
2. 检查 `frontend/vite.config.js` 中的代理配置
3. 检查浏览器控制台是否有错误信息
4. 确认防火墙没有阻止连接

### 问题 4: PM2 命令不存在

**解决方案**:
全局安装 PM2:
```bash
npm install -g pm2
```

如果还是不行，检查 npm 全局路径是否在系统 PATH 中:
```bash
npm config get prefix
```

### 问题 5: 移动端样式显示异常

**解决方案**:
1. 确保使用浏览器的移动设备模拟器
2. 清除浏览器缓存
3. 在真实移动设备上测试

## 开发建议

### 推荐的开发工具

- **VS Code** - 代码编辑器
  - 推荐插件: ESLint, Prettier, Vetur
- **Postman** - API 测试工具
- **Chrome DevTools** - 浏览器调试工具

### 代码规范

- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 遵循 JavaScript Standard Style

## 技术支持

如遇到其他问题，请：
1. 查看项目 README.md
2. 检查后端和前端的 README.md
3. 查看控制台错误信息
4. 检查日志文件（backend/logs/）

## 下一步

系统启动成功后，您可以：
1. 在移动端界面进行签到操作
2. 测试签退功能
3. 查看工作时长统计
4. 根据需求进行二次开发

祝您使用愉快！
