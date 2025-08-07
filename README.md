# Unfazed Admin - 企业级中后台管理系统

基于 Ant Design Pro 构建的现代化企业级中后台管理系统，使用 React 18 + TypeScript + Umi 4 + Ant Design 5 技术栈。

## 📝 最近更新

### 2024-12-19 - API 接口清理
- 根据 OpenAPI 规范清理了项目中的接口代码
- 删除了 16 个不在 OpenAPI 规范中的 service 文件
- 清理了主要 API 服务文件中的无用接口
- 保留了符合 OpenAPI 规范的接口：
  - `/api/auth/login` - 用户登录
  - `/api/auth/logout` - 用户登出  
  - `/api/auth/register` - 用户注册
  - `/api/admin/settings` - 管理员设置
- 移除了所有假数据接口和 demo 接口，使项目更加简洁

## 🎯 项目概览

本项目是一个功能完整的中后台管理系统模板，提供了丰富的业务组件和页面模板，可以快速构建企业级应用。

## 📁 项目结构

```
unfazed-admin/
├── config/                    # 项目配置目录
│   ├── config.ts             # 主要配置文件，包含路由、插件等配置
│   ├── defaultSettings.ts    # 默认主题和布局设置
│   ├── oneapi.json           # OpenAPI 接口描述文件
│   ├── proxy.ts              # 开发环境代理配置
│   └── routes.ts             # 路由配置文件
├── mock/                      # Mock 数据目录
│   ├── analysis.mock.ts      # 分析页面 Mock 数据
│   ├── listTableList.ts      # 表格列表 Mock 数据
│   ├── monitor.mock.ts       # 监控页面 Mock 数据
│   ├── notices.ts            # 通知 Mock 数据
│   ├── requestRecord.mock.js # 请求记录 Mock 数据
│   ├── route.ts              # 路由 Mock 数据
│   ├── user.ts               # 用户相关 Mock 数据
│   └── workplace.mock.ts     # 工作台 Mock 数据
├── public/                    # 静态资源目录
│   ├── favicon.ico           # 网站图标
│   ├── logo.svg              # 项目 Logo
│   ├── icons/                # PWA 图标
│   └── scripts/              # 静态脚本
├── src/                       # 源代码目录
│   ├── components/           # 全局组件
│   │   ├── Footer/           # 页脚组件
│   │   ├── HeaderDropdown/   # 头部下拉组件
│   │   ├── RightContent/     # 右侧内容组件（用户头像、语言切换等）
│   │   └── index.ts          # 组件统一导出
│   ├── locales/              # 国际化文件
│   │   ├── zh-CN/            # 中文语言包
│   │   ├── en-US/            # 英文语言包
│   │   ├── ja-JP/            # 日文语言包
│   │   ├── pt-BR/            # 葡萄牙语语言包
│   │   ├── fa-IR/            # 波斯语语言包
│   │   ├── id-ID/            # 印尼语语言包
│   │   └── bn-BD/            # 孟加拉语语言包
│   ├── pages/                # 页面组件
│   │   ├── account/          # 账户相关页面
│   │   │   ├── center/       # 个人中心
│   │   │   └── settings/     # 账户设置
│   │   ├── dashboard/        # 仪表板页面
│   │   │   ├── analysis/     # 分析页面
│   │   │   ├── monitor/      # 监控页面
│   │   │   └── workplace/    # 工作台页面
│   │   ├── form/             # 表单页面
│   │   │   ├── basic-form/   # 基础表单
│   │   │   ├── step-form/    # 分步表单
│   │   │   └── advanced-form/ # 高级表单
│   │   ├── list/             # 列表页面
│   │   │   ├── table-list/   # 查询表格
│   │   │   ├── basic-list/   # 标准列表
│   │   │   ├── card-list/    # 卡片列表
│   │   │   └── search/       # 搜索列表
│   │   ├── profile/          # 详情页面
│   │   │   ├── basic/        # 基础详情页
│   │   │   └── advanced/     # 高级详情页
│   │   ├── result/           # 结果页面
│   │   │   ├── success/      # 成功页
│   │   │   └── fail/         # 失败页
│   │   ├── exception/        # 异常页面
│   │   │   ├── 403/          # 403 页面
│   │   │   ├── 404/          # 404 页面
│   │   │   └── 500/          # 500 页面
│   │   ├── user/             # 用户相关页面
│   │   │   ├── login/        # 登录页面
│   │   │   ├── register/     # 注册页面
│   │   │   └── register-result/ # 注册结果页
│   │   ├── Admin.tsx         # 管理员页面
│   │   ├── Welcome.tsx       # 欢迎页面
│   │   └── 404.tsx           # 全局 404 页面
│   ├── services/             # API 服务
│   │   ├── ant-design-pro/   # Ant Design Pro 相关 API
│   │   │   ├── api.ts        # 主要 API 接口
│   │   │   ├── login.ts      # 登录相关 API
│   │   │   └── typings.d.ts  # 类型定义
│   │   └── swagger/          # Swagger 生成的 API
│   ├── access.ts             # 权限配置
│   ├── app.tsx               # 应用入口配置（运行时配置）
│   ├── global.tsx            # 全局配置（PWA、Service Worker）
│   ├── global.less           # 全局样式
│   ├── global.style.ts       # 全局样式（antd-style）
│   ├── loading.tsx           # 全局加载组件
│   ├── manifest.json         # PWA 清单文件
│   ├── requestErrorConfig.ts # 请求错误配置
│   ├── service-worker.js     # Service Worker
│   └── typings.d.ts          # 全局类型定义
├── tests/                     # 测试配置
├── types/                     # 类型缓存
├── biome.json                # Biome 代码检查配置
├── jest.config.ts            # Jest 测试配置
├── package.json              # 项目依赖和脚本
├── tsconfig.json             # TypeScript 配置
└── README.md                 # 项目说明文档
```

## 🚀 技术栈

### 核心技术
- **React 18** - 前端框架
- **TypeScript** - 类型安全的 JavaScript
- **Umi 4** - 企业级前端应用框架
- **Ant Design 5** - 企业级 UI 组件库
- **Ant Design Pro Components** - 高级业务组件

### 开发工具
- **Biome** - 现代化的代码检查和格式化工具
- **Jest** - JavaScript 测试框架
- **Mock.js** - 模拟数据生成
- **OpenAPI** - API 文档和代码生成

### 特性支持
- **国际化 (i18n)** - 支持 8 种语言
- **PWA** - 渐进式 Web 应用
- **权限管理** - 基于角色的访问控制
- **主题配置** - 支持暗黑模式和主题定制
- **响应式设计** - 适配移动端和桌面端

## 📋 页面功能

### 🏠 仪表板 (Dashboard)
- **分析页面** - 数据分析和图表展示
- **监控页面** - 系统监控和实时数据
- **工作台** - 个人工作台和快捷操作

### 📝 表单页面 (Form)
- **基础表单** - 常规表单组件使用示例
- **分步表单** - 多步骤表单流程
- **高级表单** - 复杂表单布局和验证

### 📊 列表页面 (List)
- **查询表格** - 数据表格和查询功能
- **标准列表** - 标准列表布局
- **卡片列表** - 卡片式布局展示
- **搜索列表** - 搜索结果页面（文章、项目、应用）

### 👤 账户页面 (Account)
- **个人中心** - 用户信息展示和编辑
- **账户设置** - 用户设置管理

### 📄 详情页面 (Profile)
- **基础详情页** - 简单详情展示
- **高级详情页** - 复杂详情和操作

### ✅ 结果页面 (Result)
- **成功页** - 操作成功反馈
- **失败页** - 操作失败反馈

### ⚠️ 异常页面 (Exception)
- **403** - 访问权限不足
- **404** - 页面不存在
- **500** - 服务器错误

### 🔐 用户页面 (User)
- **登录页面** - 用户登录（支持账户密码和手机号两种方式）
- **注册页面** - 用户注册
- **注册结果** - 注册成功反馈

## 🛠️ 开发指南

### 环境要求
- Node.js >= 20.0.0
- npm 或 yarn 或 pnpm

### 安装依赖
```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 开发启动
```bash
npm start
# 或
yarn start
```

### 构建生产版本
```bash
npm run build
# 或
yarn build
```

### 代码检查
```bash
npm run lint
# 或
yarn lint
```

### 运行测试
```bash
npm test
# 或
yarn test
```

## 📚 项目特色

### 1. 完整的页面模板
项目提供了企业级应用常见的所有页面类型，包括仪表板、表单、列表、详情、结果页等，可以直接使用或作为参考。

### 2. 国际化支持
支持 8 种语言，包括中文、英文、日文、葡萄牙语、波斯语、印尼语、孟加拉语等，可以轻松扩展到更多语言。

### 3. 权限管理
内置基于角色的权限管理系统，可以灵活控制页面和功能的访问权限。

### 4. 主题定制
支持主题定制和暗黑模式，可以根据企业品牌进行个性化定制。

### 5. 移动端适配
所有页面都进行了移动端适配，确保在各种设备上的良好体验。

### 6. Mock 数据
提供完整的 Mock 数据系统，方便前端开发和测试。

### 7. TypeScript 支持
全项目使用 TypeScript，提供完整的类型安全保障。

### 8. 现代化工具链
使用 Biome 进行代码检查，Jest 进行测试，提供现代化的开发体验。

## 🔧 配置说明

### 路由配置
路由配置位于 `config/routes.ts`，支持嵌套路由、权限控制、布局配置等。

### 主题配置
主题配置位于 `config/defaultSettings.ts`，可以配置主题色、布局方式、导航模式等。

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