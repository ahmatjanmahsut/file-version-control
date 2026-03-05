#!/bin/bash

# 工艺文件版本控制系统部署脚本
# 适用于Debian服务器

set -e

echo "========================================"
echo "工艺文件版本控制系统部署脚本"
echo "========================================"

# 检查是否以root用户运行
if [ "$(id -u)" != "0" ]; then
    echo "错误: 请以root用户运行此脚本"
    exit 1
fi

# 定义变量
APP_DIR="/opt/file-version-control"
FRONTEND_DIR="$APP_DIR/frontend"
BACKEND_DIR="$APP_DIR/backend"
DB_NAME="FileVersionControl"
DB_USER="filecontrol"
DB_PASSWORD="filecontrol123"
JWT_SECRET="file_version_control_secret"
PORT=8000
GITHUB_REPO="https://github.com/ahmatjanmahsut/file-version-control.git"

# 安装必要的依赖
echo "安装必要的依赖..."
apt update
apt install -y curl wget gnupg2 apt-transport-https lsb-release ca-certificates

# 安装Node.js
echo "安装Node.js..."
# 使用NodeSource的正确URL格式
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 安装SQL Server
echo "安装SQL Server..."
# 使用新的方法添加Microsoft GPG密钥
curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft-archive-keyring.gpg

# 添加SQL Server仓库
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-archive-keyring.gpg] https://packages.microsoft.com/debian/$(lsb_release -rs)/prod $(lsb_release -cs) main" > /etc/apt/sources.list.d/mssql-release.list

# 更新包列表
apt update

# 安装SQL Server服务器和工具
echo "安装SQL Server服务器..."
ACCEPT_EULA=Y apt install -y mssql-server mssql-tools18 unixodbc-dev

# 配置SQL Server
echo "配置SQL Server..."
/opt/mssql/bin/mssql-conf set-sa-password "YourStrong!Passw0rd"
/opt/mssql/bin/mssql-conf set sqlagent.enabled true
systemctl enable mssql-server
systemctl start mssql-server

# 安装Git
echo "安装Git..."
apt install -y git

# 创建应用目录
echo "创建应用目录..."
mkdir -p $APP_DIR

# 从GitHub克隆代码
echo "从GitHub克隆代码..."
git clone $GITHUB_REPO $APP_DIR

# 进入应用目录
cd $APP_DIR

# 安装前端依赖
echo "安装前端依赖..."
cd $FRONTEND_DIR
npm install
npm run build

# 安装后端依赖
echo "安装后端依赖..."
cd $BACKEND_DIR
npm install

# 配置环境变量
echo "配置环境变量..."
cat > $BACKEND_DIR/.env << EOF
# 数据库配置
DB_SERVER=localhost
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# 服务器配置
PORT=$PORT

# JWT配置
JWT_SECRET=$JWT_SECRET
EOF

# 等待SQL Server启动
echo "等待SQL Server启动..."
sleep 15

# 配置数据库
echo "配置数据库..."
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrong!Passw0rd" -Q "CREATE LOGIN $DB_USER WITH PASSWORD = '$DB_PASSWORD', CHECK_POLICY = OFF;"
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrong!Passw0rd" -Q "CREATE DATABASE $DB_NAME;"
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrong!Passw0rd" -Q "USE $DB_NAME; CREATE USER $DB_USER FOR LOGIN $DB_USER;"
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrong!Passw0rd" -Q "USE $DB_NAME; ALTER ROLE db_owner ADD MEMBER $DB_USER;"

# 创建系统服务
echo "创建系统服务..."
cat > /etc/systemd/system/file-version-control.service << EOF
[Unit]
Description=File Version Control System
After=network.target mssql-server.service

[Service]
WorkingDirectory=$BACKEND_DIR
ExecStart=/usr/bin/node app.js
Restart=always
RestartSec=10
User=root
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
echo "启动服务..."
systemctl daemon-reload
systemctl start file-version-control
systemctl enable file-version-control

# 配置防火墙
echo "配置防火墙..."
if command -v ufw &> /dev/null; then
    ufw allow 8000/tcp
    ufw allow 3000/tcp
else
    echo "ufw未安装，跳过防火墙配置"
fi

# 创建控制面板
echo "创建控制面板..."
cat > $APP_DIR/control.sh << 'EOF'
#!/bin/bash

# 工艺文件版本控制系统控制面板

APP_DIR="/opt/file-version-control"
BACKEND_DIR="$APP_DIR/backend"

function show_menu() {
    clear
    echo "========================================"
    echo "工艺文件版本控制系统控制面板"
    echo "========================================"
    echo "1. 启动服务"
    echo "2. 停止服务"
    echo "3. 重启服务"
    echo "4. 查看服务状态"
    echo "5. 查看日志"
    echo "6. 查看配置"
    echo "7. 退出"
    echo "========================================"
    read -p "请选择操作: " choice
}

function start_service() {
    echo "启动服务..."
    systemctl start file-version-control
    echo "服务已启动"
    sleep 2
}

function stop_service() {
    echo "停止服务..."
    systemctl stop file-version-control
    echo "服务已停止"
    sleep 2
}

function restart_service() {
    echo "重启服务..."
    systemctl restart file-version-control
    echo "服务已重启"
    sleep 2
}

function check_status() {
    echo "查看服务状态..."
    systemctl status file-version-control
    read -p "按Enter键继续..."
}

function view_logs() {
    echo "查看日志..."
    journalctl -u file-version-control -n 50
    read -p "按Enter键继续..."
}

function view_config() {
    echo "查看配置..."
    cat $BACKEND_DIR/.env
    read -p "按Enter键继续..."
}

while true; do
    show_menu
    case $choice in
        1)
            start_service
            ;;
        2)
            stop_service
            ;;
        3)
            restart_service
            ;;
        4)
            check_status
            ;;
        5)
            view_logs
            ;;
        6)
            view_config
            ;;
        7)
            echo "退出控制面板"
            exit 0
            ;;
        *)
            echo "无效选择，请重新输入"
            sleep 2
            ;;
    esac
done
EOF

chmod +x $APP_DIR/control.sh

# 完成部署
echo "========================================"
echo "部署完成！"
echo "========================================"
echo "应用目录: $APP_DIR"
echo "前端地址: http://$(hostname -I | awk '{print $1}'):3000"
echo "后端地址: http://$(hostname -I | awk '{print $1}'):8000"
echo "控制面板: $APP_DIR/control.sh"
echo ""
echo "默认管理员账号: admin / admin123"
echo "SQL Server sa密码: YourStrong!Passw0rd"
echo "========================================"
