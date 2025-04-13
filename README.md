# 考勤管理系统

一个基于人脸识别和刷卡功能的现代化考勤管理系统，适用于学校、企业等组织的上下班打卡和出勤统计。

## 功能特点

- **多种考勤方式**：支持人脸识别打卡和传统刷卡记录
- **灵活的考勤规则**：管理员可自定义考勤日期和时间
- **个人考勤查询**：学生/员工可查看个人的出勤和缺勤记录
- **统计报表**：生成个人或团队的考勤统计数据
- **用户友好界面**：简洁直观的操作界面

## 技术栈

### 后端

- Node.js (v16+)
- Express.js 
- Sequelize ORM
- JWT认证
- 集群模式部署

### 前端

- Vue.js 3
- Vue Router
- Vuex/Pinia
- Element Plus UI
- OpenCV.js (人脸识别)

### 数据库

- MySQL/PostgreSQL

## 系统架构

系统采用前后端分离架构：

- 前端：基于Vue.js的SPA应用
- 后端：基于Express的RESTful API
- 数据库：关系型数据库存储用户和考勤数据

## 安装说明

### 前提条件

- Node.js (v16.0.0+)
- MySQL/PostgreSQL
- npm 或 yarn

### 安装步骤

1. 克隆仓库
   ```
   git clone https://github.com/The-ESAP-Project/attendance-system.git
   cd attendance-system
   ```

2. 安装依赖
   ```
   yarn install
   ```

3. 配置环境变量
   ```
   cp .env.examples .env
   ```
   然后编辑`.env`文件，添加所需的配置信息，包括：
   - 数据库连接信息
   - JWT密钥
   - 服务端口
   - API基础路径
   - 允许的跨域源

4. 启动服务
   ```
   yarn start
   ```

## 前端开发

前端项目基于Vue.js 3开发，位于单独的仓库中。要设置前端开发环境：

1. 克隆前端仓库
   ```
   git clone https://github.com/yourusername/attendance-system-frontend.git
   cd attendance-system-frontend
   ```

2. 安装依赖
   ```
   yarn install
   ```

3. 启动开发服务器
   ```
   yarn dev
   ```

4. 构建生产版本
   ```
   yarn build
   ```

## API文档

系统API遵循RESTful设计原则，主要包含以下几个部分：

- 认证 (`/api/v1/auth/`)
- 用户管理 (`/api/v1/user/`)
- 学生信息 (`/api/v1/student/`)
- 考勤记录 (`/api/v1/attendance/`)

完整API文档请参考 [API.md](./API.md)

## 人脸识别功能

系统使用OpenCV.js实现前端人脸识别功能，支持：

- 人脸检测
- 人脸特征提取
- 人脸比对验证

详细的人脸识别模块说明请参考 `face_recognize_test` 目录中的示例代码。

## 依赖项

主要依赖包括：

```json
{
  "dependencies": {
    "body-parser": "^1.20.0",
    "dotenv": "^16.0.0",
    "express": "^4.18.0",
    "helmet": "^6.0.0",
    "jsonwebtoken": "^9.0.0",
    "sequelize": "^6.20.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.15"
  }
}
```

## 环境配置

系统通过`.env`文件进行配置，主要配置项包括：

- `PORT`: 服务端口号
- `DB_DIALECT`: 数据库类型 (mysql/postgres)
- `DB_HOST`: 数据库主机
- `DB_PORT`: 数据库端口
- `DB_NAME`: 数据库名称
- `DB_USER`: 数据库用户名
- `DB_PASSWORD`: 数据库密码
- `JWT_SECRET`: JWT密钥
- `API_BASE_ROUTE`: API基础路径
- `ALLOWED_ORIGINS`: 允许的跨域源

## 部署指南

系统支持多核心部署，自动利用服务器所有CPU核心：

1. 设置环境变量
   ```
   NODE_ENV=production
   ```

2. 启动服务
   ```
   node index.js
   ```

3. 使用PM2进行进程管理（推荐）
   ```
   pm2 start index.js
   ```

## 贡献指南

欢迎提交问题和功能请求！如果您想贡献代码，请遵循以下步骤：

1. Fork 这个仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建一个 Pull Request

## 版本信息

当前版本: v0.0.0-SNAPSHOT

## 许可证

本项目基于 GPL-3.0 许可证发布。请查看 [LICENSE](./LICENSE) 文件以获取更多信息。
