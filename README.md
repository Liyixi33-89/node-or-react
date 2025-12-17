# 📋 TaskManager - 任务管理系统

一个基于 React + Node.js + MongoDB 的现代化任务管理系统，支持考勤打卡、任务管理等功能。

## 🚀 功能特性

- ✅ 用户认证与授权
- ✅ 考勤打卡管理
- ✅ 任务创建与跟踪
- ✅ 数据统计与报表
- ✅ 响应式设计
- ✅ 自动化部署

## 🛠️ 技术栈

### 前端
- React 18
- Vite
- Axios
- CSS3

### 后端
- Node.js
- Express
- MongoDB
- JWT 认证
- PM2 进程管理

### 部署
- Nginx
- GitHub Actions
- 阿里云服务器

## 📦 项目结构

```
TaskManager/
├── frontend/              # 前端项目
│   ├── src/
│   │   ├── components/   # React 组件
│   │   ├── pages/        # 页面组件
│   │   └── api/          # API 接口
│   └── package.json
├── backend/              # 后端项目
│   ├── src/
│   │   ├── models/       # 数据模型
│   │   ├── routes/       # 路由
│   │   ├── services/     # 业务逻辑
│   │   └── config/       # 配置文件
│   └── package.json
├── .github/
│   └── workflows/
│       └── deploy.yml    # 自动部署配置
├── server-init.sh        # 服务器初始化脚本
├── quick-deploy.sh       # 快速部署脚本
└── nginx.conf            # Nginx 配置

```

## 🚀 快速开始

### 1️⃣ 服务器初始化

在服务器上执行一键部署脚本：

```bash
# 下载并执行快速部署脚本
curl -fsSL https://raw.githubusercontent.com/Liyixi33-89/node-or-react/dev/quick-deploy.sh | bash
```

或者分步执行：

```bash
# 1. 初始化服务器环境
curl -o server-init.sh https://raw.githubusercontent.com/Liyixi33-89/node-or-react/dev/server-init.sh
chmod +x server-init.sh
./server-init.sh

# 2. 克隆项目
cd /var/www
git clone https://github.com/Liyixi33-89/node-or-react.git taskmanager
cd taskmanager
git checkout test

# 3. 配置后端
cd backend
npm install
pm2 start ecosystem.config.js

# 4. 构建前端
cd ../frontend
npm install
npm run build

# 5. 重启 Nginx
systemctl reload nginx
```

### 2️⃣ 配置 GitHub Secrets（必须完成）

为了启用自动部署功能，你需要配置 GitHub Secrets。

#### 📋 需要配置的 Secrets

访问：https://github.com/Liyixi33-89/node-or-react/settings/secrets/actions

添加以下 3 个 Secrets：

| Name | Value | 说明 |
|------|-------|------|
| `SERVER_HOST` | `39.108.91.231` | 服务器 IP 地址 |
| `SERVER_USER` | `root` | SSH 登录用户名 |
| `SERVER_SSH_KEY` | (你的 SSH 私钥) | SSH 私钥内容 |

#### 🔑 获取 SSH 私钥

**Windows PowerShell:**
```powershell
# 复制到剪贴板
Get-Content ~/.ssh/id_rsa | clip
```

**Mac/Linux:**
```bash
# 复制到剪贴板（Mac）
cat ~/.ssh/id_rsa | pbcopy

# 显示在终端
cat ~/.ssh/id_rsa
```

#### ⚠️ 重要提示

- ✅ 必须复制完整的私钥内容（包括 `-----BEGIN ... KEY-----` 和 `-----END ... KEY-----`）
- ✅ 确保私钥对应的公钥已添加到服务器的 `~/.ssh/authorized_keys`
- ❌ 不要泄露私钥给任何人

**详细配置指南**: 查看 [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)

### 3️⃣ 自动部署

配置完成后，每次推送代码到 `test` 分支，GitHub Actions 会自动部署到服务器：

```bash
# 提交代码
git add .
git commit -m "feat: 新功能"

# 推送到 test 分支触发自动部署
git push origin test
```

查看部署状态：https://github.com/Liyixi33-89/node-or-react/actions

## 🔧 本地开发

### 前端开发

```bash
cd frontend
npm install
npm run dev
```

访问：http://localhost:5173

### 后端开发

```bash
cd backend
npm install
npm run dev
```

API 地址：http://localhost:3000

## 📝 环境变量配置

### 后端环境变量 (backend/.env)

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/taskmanager
JWT_SECRET=your-secret-key
LOG_LEVEL=info
LOG_DIR=/var/log/taskmanager
```

## 🌐 访问地址

- **生产环境**: http://39.108.91.231
- **后端 API**: http://39.108.91.231:3000
- **本地前端**: http://localhost:5173
- **本地后端**: http://localhost:3000

## 📊 部署流程

```mermaid
graph LR
    A[推送代码到 test 分支] --> B[触发 GitHub Actions]
    B --> C[构建前端]
    C --> D[连接服务器]
    D --> E[拉取最新代码]
    E --> F[安装依赖]
    F --> G[重启后端服务]
    G --> H[上传前端文件]
    H --> I[重启 Nginx]
    I --> J[健康检查]
    J --> K[部署完成]
```

## 🔍 常用命令

### 服务器管理

```bash
# 查看 PM2 进程
pm2 list
pm2 logs taskmanager-backend
pm2 restart taskmanager-backend

# 查看 Nginx 状态
systemctl status nginx
nginx -t
systemctl reload nginx

# 查看日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
tail -f ~/.pm2/logs/taskmanager-backend-out.log
```

### 部署检查

```bash
# 查看部署状态
/root/check-deploy.sh

# 查看 Git 状态
cd /var/www/taskmanager
git log -5 --oneline
git status

# 查看备份
ls -lht /var/www/backups/
```

## 🐛 故障排查

### 问题 1: GitHub Actions 部署失败

**可能原因**:
- GitHub Secrets 配置错误
- SSH 私钥不正确
- 服务器网络问题

**解决方案**:
1. 检查 GitHub Secrets 配置
2. 验证 SSH 私钥是否正确
3. 查看 GitHub Actions 日志

### 问题 2: 后端服务无法启动

**可能原因**:
- MongoDB 未启动
- 端口被占用
- 环境变量配置错误

**解决方案**:
```bash
# 检查 MongoDB
systemctl status mongod

# 检查端口占用
ss -tlnp | grep 3000

# 查看 PM2 日志
pm2 logs taskmanager-backend
```

### 问题 3: 前端页面无法访问

**可能原因**:
- Nginx 配置错误
- 前端文件未构建
- 防火墙阻止

**解决方案**:
```bash
# 检查 Nginx 配置
nginx -t

# 检查前端文件
ls -lh /var/www/taskmanager/frontend/dist/

# 检查防火墙
firewall-cmd --list-all
```

## 📚 相关文档

- [GitHub Secrets 配置指南](./GITHUB_SECRETS_SETUP.md)
- [前端 README](./frontend/README.md)
- [后端 README](./backend/README.md)
- [Nginx 配置说明](./nginx.conf)

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

MIT License

## 👥 作者

- **Liyixi33-89** - [GitHub](https://github.com/Liyixi33-89)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

**⭐ 如果这个项目对你有帮助，请给个 Star！**
