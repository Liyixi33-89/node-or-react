#!/bin/bash

# ============================================
# TaskManager 项目自动化部署脚本
# 功能：拉取代码、构建前后端、重启服务
# ============================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_DIR="/var/www/taskmanager"
BACKEND_DIR="${PROJECT_DIR}/backend"
FRONTEND_DIR="${PROJECT_DIR}/frontend"
BRANCH="test"  # 默认分支，可以通过参数修改
BACKUP_DIR="/var/www/backups"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助信息
show_help() {
    cat << EOF
使用方法: $0 [选项]

选项:
    -b, --branch <分支名>    指定要拉取的分支 (默认: test)
    -s, --skip-backup        跳过备份步骤
    -f, --force              强制重置本地更改
    -h, --help               显示此帮助信息

示例:
    $0                       # 使用默认配置部署
    $0 -b main               # 部署 main 分支
    $0 -f                    # 强制重置并部署
    $0 -b dev -s             # 部署 dev 分支且跳过备份

EOF
}

# 解析命令行参数
SKIP_BACKUP=false
FORCE_RESET=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--branch)
            BRANCH="$2"
            shift 2
            ;;
        -s|--skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        -f|--force)
            FORCE_RESET=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
done

# 检查项目目录是否存在
check_project_dir() {
    log_info "检查项目目录..."
    if [ ! -d "$PROJECT_DIR" ]; then
        log_error "项目目录不存在: $PROJECT_DIR"
        exit 1
    fi
    log_success "项目目录存在"
}

# 备份当前版本
backup_current_version() {
    if [ "$SKIP_BACKUP" = true ]; then
        log_warning "跳过备份步骤"
        return
    fi

    log_info "备份当前版本..."
    mkdir -p "$BACKUP_DIR"
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="${BACKUP_DIR}/taskmanager_${TIMESTAMP}.tar.gz"
    
    cd "$PROJECT_DIR"
    tar -czf "$BACKUP_FILE" \
        --exclude='node_modules' \
        --exclude='dist' \
        --exclude='.git' \
        backend/ frontend/ 2>/dev/null || true
    
    if [ -f "$BACKUP_FILE" ]; then
        log_success "备份完成: $BACKUP_FILE"
        
        # 只保留最近5个备份
        cd "$BACKUP_DIR"
        ls -t taskmanager_*.tar.gz | tail -n +6 | xargs -r rm -f
        log_info "已清理旧备份，保留最近5个"
    else
        log_warning "备份失败，但继续部署"
    fi
}

# 拉取最新代码
pull_latest_code() {
    log_info "拉取最新代码 (分支: $BRANCH)..."
    cd "$PROJECT_DIR"
    
    # 显示当前状态
    log_info "当前 Git 状态:"
    git status --short
    
    if [ "$FORCE_RESET" = true ]; then
        log_warning "强制重置本地更改..."
        git reset --hard
        git clean -fd
    fi
    
    # 拉取代码
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
    
    # 显示最新提交
    log_success "代码拉取完成"
    log_info "最新提交:"
    git log -1 --oneline
}

# 构建后端
build_backend() {
    log_info "开始构建后端..."
    cd "$BACKEND_DIR"
    
    # 安装依赖
    log_info "安装后端依赖..."
    npm install --production
    
    log_success "后端构建完成"
}

# 重启后端服务
restart_backend() {
    log_info "重启后端服务..."
    cd "$BACKEND_DIR"
    
    # 检查 PM2 是否已安装
    if ! command -v pm2 &> /dev/null; then
        log_error "PM2 未安装，请先安装: npm install -g pm2"
        exit 1
    fi
    
    # 重启服务
    if pm2 list | grep -q "attendance-backend"; then
        pm2 restart ecosystem.config.js
        log_success "后端服务已重启"
    else
        pm2 start ecosystem.config.js
        log_success "后端服务已启动"
    fi
    
    # 保存 PM2 配置
    pm2 save
    
    # 显示服务状态
    log_info "后端服务状态:"
    pm2 list
}

# 构建前端
build_frontend() {
    log_info "开始构建前端..."
    cd "$FRONTEND_DIR"
    
    # 安装依赖
    log_info "安装前端依赖..."
    npm install
    
    # 构建前端
    log_info "执行前端构建..."
    npm run build
    
    # 检查构建结果
    if [ ! -d "dist" ]; then
        log_error "前端构建失败: dist 目录不存在"
        exit 1
    fi
    
    log_success "前端构建完成"
    
    # 显示构建文件大小
    log_info "构建文件大小:"
    du -sh dist/
    ls -lh dist/
}

# 清理 node_modules
cleanup_node_modules() {
    log_info "清理 node_modules..."
    
    # 清理前端 node_modules
    if [ -d "$FRONTEND_DIR/node_modules" ]; then
        log_info "删除前端 node_modules..."
        rm -rf "$FRONTEND_DIR/node_modules"
        log_success "前端 node_modules 已删除"
    fi
    
    # 可选：清理后端 node_modules（生产环境通常保留）
    # if [ -d "$BACKEND_DIR/node_modules" ]; then
    #     log_info "删除后端 node_modules..."
    #     rm -rf "$BACKEND_DIR/node_modules"
    #     log_success "后端 node_modules 已删除"
    # fi
    
    log_success "清理完成"
}

# 重载 Nginx
reload_nginx() {
    log_info "重载 Nginx 配置..."
    
    # 查找 Nginx 可执行文件
    NGINX_BIN=""
    if [ -f "/usr/local/nginx/sbin/nginx" ]; then
        NGINX_BIN="/usr/local/nginx/sbin/nginx"
    elif command -v nginx &> /dev/null; then
        NGINX_BIN="nginx"
    else
        log_warning "未找到 Nginx，跳过重载"
        return
    fi
    
    # 测试配置
    if $NGINX_BIN -t 2>&1 | grep -q "successful"; then
        $NGINX_BIN -s reload
        log_success "Nginx 已重载"
    else
        log_error "Nginx 配置测试失败"
        $NGINX_BIN -t
        exit 1
    fi
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 检查后端服务
    log_info "检查后端服务 (http://localhost:3000/health)..."
    if curl -s http://localhost:3000/health | grep -q "ok"; then
        log_success "后端服务健康"
    else
        log_error "后端服务异常"
        exit 1
    fi
    
    # 检查前端页面
    log_info "检查前端页面 (http://localhost/)..."
    if curl -s http://localhost/ | grep -q "考勤签到系统"; then
        log_success "前端页面正常"
    else
        log_warning "前端页面可能异常，请手动检查"
    fi
    
    # 显示端口监听状态
    log_info "端口监听状态:"
    netstat -tlnp | grep -E "(80|3000)" || true
}

# 显示部署摘要
show_summary() {
    echo ""
    echo "============================================"
    log_success "部署完成！"
    echo "============================================"
    echo ""
    echo "📦 部署信息:"
    echo "   - 分支: $BRANCH"
    echo "   - 项目目录: $PROJECT_DIR"
    echo "   - 部署时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    echo "🔍 服务状态:"
    pm2 list
    echo ""
    echo "🌐 访问地址:"
    echo "   - 前端: http://$(hostname -I | awk '{print $1}')/"
    echo "   - 后端健康检查: http://$(hostname -I | awk '{print $1}')/health"
    echo ""
    echo "📊 有用的命令:"
    echo "   - 查看后端日志: pm2 logs attendance-backend"
    echo "   - 查看 Nginx 日志: tail -f /var/log/nginx/taskmanager_access.log"
    echo "   - 重启后端: pm2 restart ecosystem.config.js"
    echo "   - 查看服务状态: pm2 status"
    echo ""
}

# 主流程
main() {
    echo ""
    echo "============================================"
    echo "  TaskManager 自动化部署脚本"
    echo "============================================"
    echo ""
    
    START_TIME=$(date +%s)
    
    # 执行部署步骤
    check_project_dir
    backup_current_version
    pull_latest_code
    build_backend
    restart_backend
    build_frontend
    cleanup_node_modules
    reload_nginx
    health_check
    
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    show_summary
    
    log_success "总耗时: ${DURATION} 秒"
    echo ""
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 运行主流程
main
