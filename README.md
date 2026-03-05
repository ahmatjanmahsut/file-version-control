# 工艺文件版本控制系统

## 项目简介

工艺文件版本控制系统是一个用于管理工艺文件的Web应用，支持文件上传、下载、预览和版本控制等功能。系统采用前后端分离架构，前端使用React + TypeScript + Ant Design，后端使用Express + SQL Server。

## 功能特性

- **用户管理**：支持用户注册、登录和权限控制
- **文件管理**：支持Word和Excel文件的上传、下载和预览
- **版本控制**：自动保存文件的每一个版本，支持版本历史查看
- **权限控制**：管理员可以上传、删除文件，普通用户只能查看和下载文件

## 技术栈

- **前端**：React、TypeScript、Ant Design、React Router、Axios
- **后端**：Express、SQL Server、Multer、JWT、Bcrypt
- **构建工具**：Vite

## 部署指南

### 1. 从GitHub克隆代码

```bash
git clone https://github.com/yourusername/file-version-control.git
cd file-version-control
```

### 2. 本地开发

#### 前端

```bash
cd frontend
npm install
npm run dev
```

#### 后端

```bash
cd backend
npm install
npm start
```

### 3. 一键部署到Debian服务器

```bash
chmod +x deploy.sh
./deploy.sh
```

部署脚本会自动：
- 安装必要的依赖（Node.js、SQL Server、Git等）
- 从GitHub克隆代码
- 配置数据库
- 安装应用依赖
- 构建前端
- 创建系统服务
- 配置防火墙
- 生成控制面板

### 4. 访问系统

- 前端：http://服务器IP:3000
- 后端：http://服务器IP:8000
- 控制面板：/opt/file-version-control/control.sh

### 5. 默认账号

- 管理员：admin / admin123

## 目录结构

```
file-version-control/
├── frontend/         # 前端代码
│   ├── src/          # 源代码
│   │   ├── pages/    # 页面组件
│   │   ├── App.tsx   # 应用主组件
│   │   └── main.tsx  # 应用入口
│   ├── package.json  # 项目配置
│   └── vite.config.ts # Vite配置
├── backend/          # 后端代码
│   ├── routes/       # 路由
│   ├── app.js        # 后端主应用
│   ├── config.js     # 配置文件
│   ├── db.js         # 数据库连接
│   └── package.json  # 项目配置
├── deploy.sh         # 部署脚本
└── README.md         # 项目说明
```

## 数据库结构

- **Users**：用户表
- **Files**：文件表
- **FileVersions**：文件版本表

## 控制面板

部署完成后，可以通过运行 `/opt/file-version-control/control.sh` 进入控制面板，提供以下功能：

- 启动服务
- 停止服务
- 重启服务
- 查看服务状态
- 查看日志
- 查看配置
