# Unfazed Admin

基于 Ant Design Pro 构建的现代化企业级中后台管理系统，使用 React 18 + TypeScript + Umi 4 + Ant Design 5 技术栈。

## 如何使用

- 需要配合 [Unfazed](https://github.com/unfazed-eco/unfazed) 使用, 如何使用 Unfazed 创建 Web 后端项目，请查询 Unfazed 相关文档

#### 下载 admin 静态文件

- 在 [Unfazed Admin Release](https://github.com/unfazed-eco/unfazed-admin/releases) 页面获取最新的静态文件
- 把文件解压，并修改文件名（例如：`frontend`），然后把静态文件放到项目路径下（例如：`UnfazedProject/src`）

#### 配置静态文件路由

- 打开 `UnfazedProject/src/backend/routes.py`，在根路由添加以下配置
  - 地址不做强制要求，请根据实际路径配置
  ```python
  static("/admin", directory="/var/www/src/frontend/", html=True)
  ```

#### 如何访问

- 把 Unfazed 服务启动后，在浏览器访问 http://domain/admin/ 即可访问

#### 如何配置动态路由，请查看 Unfazed Admin 部分的文档（待更新）

#### 如何修改 website name / logo，请查看 Unfazed Admin 部分的文档（待更新）

## 如何二次开发

### 环境要求

- Node.js >= 20.0.0
- npm 或 yarn 或 pnpm

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm start
```

### 代码检查

```bash
npm run lint
```

### 项目结构

```
src/
├── components/           # 全局组件
├── pages/               # 页面组件
│   ├── user/           # 用户相关页面（登录、注册）
│   ├── exception/      # 异常页面（403、404、500）
│   ├── result/         # 结果页面（成功、失败）
│   └── Admin.tsx       # 管理页面
├── services/           # API 服务
├── locales/           # 国际化文件
└── app.tsx            # 应用入口配置
```

### 添加新页面

1. 在 `src/pages/` 目录下创建新的页面组件
2. 在 `config/routes.ts` 中添加路由配置
3. 如需权限控制，在 `src/access.ts` 中配置权限

### 添加新接口

1. 在 `src/services/api.ts` 中添加新的 API 接口
2. 使用 TypeScript 定义接口类型
3. 在页面组件中调用接口

### 国际化

1. 在 `src/locales/zh-CN/` 和 `src/locales/en-US/` 中添加翻译文件
2. 在组件中使用 `useIntl()` 或 `formatMessage()` 进行国际化

### 主题定制

在 `config/defaultSettings.ts` 中修改主题配置，支持：

- 主色调配置
- 布局模式（侧边栏、顶部导航等）
- 暗黑模式切换

### 代理配置

开发环境代理配置位于 `config/proxy.ts`，可以配置 API 代理。

### 国际化配置

国际化文件位于 `src/locales/` 目录，支持多语言切换。

## 📖 更多文档

- [Ant Design Pro 官方文档](https://pro.ant.design/)
- [Umi 官方文档](https://umijs.org/)
- [Ant Design 官方文档](https://ant.design/)

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进项目。

## 📄 许可证

本项目基于 MIT 许可证开源。
