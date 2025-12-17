#!/bin/bash

###############################################################################
# 服务器端快速命令脚本
# 在服务器上执行此脚本可以快速完成所有配置
###############################################################################

echo "=========================================="
echo "TaskManager 一键部署脚本"
echo "=========================================="
echo ""

# 1. 初始化服务器环境
echo "步骤 1/4: 初始化服务器环境..."
curl -o /tmp/server-init.sh https://raw.githubusercontent.com/Liyixi33-89/node-or-react/dev/server-init.sh
chmod +x /tmp/server-init.sh
/tmp/server-init.sh

# 2. 克隆项目
echo ""
echo "步骤 2/4: 克隆项目..."
cd /var/www
if [ -d "taskmanager" ]; then
    echo "项目已存在，跳过克隆"
else
    git clone https://github.com/Liyixi33-89/node-or-react.git taskmanager
fi
cd taskmanager
git checkout test
git pull origin test

# 3. 配置并启动后端
echo ""
echo "步骤 3/4: 配置并启动后端..."
cd backend

# 生成环境变量文件
cat > .env <<EOF
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/taskmanager
JWT_SECRET=$(openssl rand -base64 32)
LOG_LEVEL=info
LOG_DIR=/var/log/taskmanager
EOF

echo "✅ 环境变量已生成"

# 安装依赖
npm install

# 启动服务
pm2 delete taskmanager-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo "✅ 后端服务已启动"

# 4. 构建前端
echo ""
echo "步骤 4/4: 构建前端..."
cd ../frontend
npm install
npm run build

echo "✅ 前端构建完成"

# 重启 Nginx
systemctl reload nginx

echo ""
echo "=========================================="
echo "✅ 部署完成！"
echo "=========================================="
echo ""
echo "📊 服务状态："
pm2 status
echo ""
echo "🌐 访问地址："
echo "   http://39.108.91.231"
echo ""
echo "=========================================="
echo "📝 重要：配置 GitHub Secrets（必须完成）"
echo "=========================================="
echo ""
echo "5️⃣  配置 GitHub Secrets："
echo ""
echo "   🔗 访问地址："
echo "   https://github.com/Liyixi33-89/node-or-react/settings/secrets/actions"
echo ""
echo "   📋 需要添加以下 3 个 Secrets："
echo ""
echo "   1️⃣  SERVER_HOST"
echo "      值: 39.108.91.231"
echo ""
echo "   2️⃣  SERVER_USER"
echo "      值: root"
echo ""
echo "   3️⃣  SERVER_SSH_KEY"
echo "      值: (你的 SSH 私钥内容)"
echo ""
echo "   💡 获取 SSH 私钥："
echo "   在本地电脑执行以下命令："
echo ""
echo "   Windows PowerShell:"
echo "   Get-Content ~/.ssh/id_rsa | clip"
echo "   (私钥已复制到剪贴板，直接粘贴到 GitHub)"
echo ""
echo "   Mac/Linux:"
echo "   cat ~/.ssh/id_rsa | pbcopy"
echo "   或"
echo "   cat ~/.ssh/id_rsa"
echo "   (手动复制输出的内容)"
echo ""
echo "   ⚠️  注意事项："
echo "   - 私钥内容包括 '-----BEGIN ... KEY-----' 和 '-----END ... KEY-----'"
echo "   - 必须复制完整的私钥内容（包括开头和结尾）"
echo "   - 不要泄露私钥给任何人"
echo ""
echo "=========================================="
echo "📝 配置完成后的下一步："
echo "=========================================="
echo ""
echo "   1. ✅ 确认 GitHub Secrets 已配置"
echo "   2. 📤 推送代码到 test 分支"
echo "   3. 👀 查看 GitHub Actions 自动部署"
echo "   4. 🎉 访问网站验证部署效果"
echo ""
echo "   🔍 查看部署日志："
echo "   https://github.com/Liyixi33-89/node-or-react/actions"
echo ""
