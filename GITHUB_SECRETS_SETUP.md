# 🔐 GitHub Secrets 配置指南

## 📋 概述

为了让 GitHub Actions 自动部署功能正常工作，你需要在 GitHub 仓库中配置 3 个 Secrets。这些 Secrets 用于 GitHub Actions 连接到你的服务器并执行部署操作。

---

## 🚀 快速配置步骤

### 1️⃣ 访问 GitHub Secrets 配置页面

点击以下链接直接访问：

```
https://github.com/Liyixi33-89/node-or-react/settings/secrets/actions
```

或者手动导航：
1. 打开你的 GitHub 仓库
2. 点击 **Settings** 标签
3. 在左侧菜单找到 **Secrets and variables** → **Actions**
4. 点击 **New repository secret** 按钮

---

### 2️⃣ 添加 3 个必需的 Secrets

#### Secret 1: `SERVER_HOST`

- **Name**: `SERVER_HOST`
- **Value**: `39.108.91.231`
- **说明**: 服务器的 IP 地址

#### Secret 2: `SERVER_USER`

- **Name**: `SERVER_USER`
- **Value**: `root`
- **说明**: SSH 登录用户名

#### Secret 3: `SERVER_SSH_KEY`

- **Name**: `SERVER_SSH_KEY`
- **Value**: 你的 SSH 私钥内容（见下方获取方法）
- **说明**: 用于 SSH 免密登录的私钥

---

## 🔑 获取 SSH 私钥

### Windows 用户（PowerShell）

```powershell
# 方法 1: 复制到剪贴板（推荐）
Get-Content ~/.ssh/id_rsa | clip

# 方法 2: 显示在终端
Get-Content ~/.ssh/id_rsa
```

### Mac/Linux 用户

```bash
# 方法 1: 复制到剪贴板（Mac）
cat ~/.ssh/id_rsa | pbcopy

# 方法 2: 显示在终端
cat ~/.ssh/id_rsa

# 方法 3: 使用 xclip（Linux）
cat ~/.ssh/id_rsa | xclip -selection clipboard
```

---

## ⚠️ 重要注意事项

### ✅ 正确的私钥格式

私钥内容应该类似这样：

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
NhAAAAAwEAAQAAAYEAx1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO
PQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVW
... (更多行) ...
-----END OPENSSH PRIVATE KEY-----
```

### ⚠️ 必须包含的内容

- ✅ 开头的 `-----BEGIN ... KEY-----`
- ✅ 中间的所有密钥内容
- ✅ 结尾的 `-----END ... KEY-----`
- ✅ 所有换行符（完整复制）

### ❌ 常见错误

- ❌ 只复制了部分内容
- ❌ 复制了公钥（`id_rsa.pub`）而不是私钥（`id_rsa`）
- ❌ 删除了开头或结尾的标记行
- ❌ 添加了额外的空格或换行

---

## 🔍 验证配置

### 检查 Secrets 是否配置成功

1. 访问 `https://github.com/Liyixi33-89/node-or-react/settings/secrets/actions`
2. 确认看到 3 个 Secrets：
   - ✅ `SERVER_HOST`
   - ✅ `SERVER_USER`
   - ✅ `SERVER_SSH_KEY`

### 测试自动部署

1. 修改任意代码文件
2. 提交并推送到 `test` 分支：
   ```bash
   git add .
   git commit -m "test: 测试自动部署"
   git push origin test
   ```
3. 访问 `https://github.com/Liyixi33-89/node-or-react/actions`
4. 查看部署工作流是否成功运行

---

## 🛠️ 故障排查

### 问题 1: "Permission denied (publickey)"

**原因**: SSH 私钥配置错误

**解决方案**:
1. 确认复制了完整的私钥内容
2. 确认私钥格式正确（包含开头和结尾）
3. 确认私钥对应的公钥已添加到服务器的 `~/.ssh/authorized_keys`

### 问题 2: "Host key verification failed"

**原因**: 服务器 SSH 主机密钥未验证

**解决方案**:
在服务器上执行：
```bash
ssh-keyscan -H 39.108.91.231 >> ~/.ssh/known_hosts
```

### 问题 3: 部署工作流未触发

**原因**: 推送的分支不是 `test`

**解决方案**:
确认推送到正确的分支：
```bash
git branch  # 查看当前分支
git checkout test  # 切换到 test 分支
git push origin test  # 推送到 test 分支
```

---

## 📚 相关文档

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [GitHub Secrets 文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [SSH 密钥管理](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

---

## 🔒 安全建议

1. ✅ **不要**将私钥提交到代码仓库
2. ✅ **不要**在公开场合分享私钥
3. ✅ **定期**更换 SSH 密钥
4. ✅ **使用**强密码保护私钥
5. ✅ **限制**服务器 SSH 访问权限

---

## 📞 需要帮助？

如果配置过程中遇到问题，可以：

1. 查看 GitHub Actions 运行日志
2. 检查服务器 SSH 配置
3. 验证网络连接是否正常
4. 确认服务器防火墙设置

---

**配置完成后，每次推送代码到 `test` 分支，GitHub Actions 都会自动部署到服务器！** 🎉
