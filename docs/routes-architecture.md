# 路由架构设计

## 概述

本项目采用混合路由架构，将路由分为两个主要部分：

1. **内置路由**：编译时确定的静态路由
2. **动态路由**：运行时从后端获取的业务路由

## 路由分类

### 1. 内置路由（Static Routes）

这些路由在 `config/routes.ts` 中定义，包括：

- **用户认证路由**：`/user/login`, `/user/register`, `/oauth/login`
- **异常页面路由**：`/exception/403`, `/exception/404`, `/exception/500`
- **结果页面路由**：`/result/success`, `/result/fail`
- **动态路由占位符**：`/crown`, `/tools` 等

**特点：**
- 编译时确定，性能优化
- 不依赖后端API
- 适用于系统级页面

### 2. 动态路由（Dynamic Routes）

通过 `/api/admin/route-list` 接口获取的业务路由：

```typescript
// API 返回格式
interface AdminRoute {
  name: string;        // 模型名称，用于API调用
  label: string;       // 显示名称，用于菜单
  path: string;        // 路由路径
  component: string;   // 组件类型：'ModelAdmin' | 'ModelCustom'
  icon?: string;       // 菜单图标
  hideInMenu?: boolean;
  routes?: AdminRoute[];
}
```

**特点：**
- 运行时获取，灵活配置
- 适用于业务数据管理页面
- 通过 `DynamicRoute` 组件渲染

## 路由处理流程

### 1. 应用启动

```typescript
// app.tsx - getInitialState()
// 只有在用户已登录的情况下才获取动态路由
if (currentUser) {
  const { routeList, menuData } = await getRouteAndMenuData();
  // 将动态路由存储在全局状态中
} else {
  // 未登录用户只有空的路由和菜单数据
  return { routeList: [], menuData: [] };
}
```

### 2. 用户登录

```typescript
// 普通登录和OAuth登录成功后
const routeAndMenuData = await getRouteAndMenuData();
setInitialState({
  currentUser: userInfo,
  menuData: routeAndMenuData.menuData,
  routeList: routeAndMenuData.routeList,
});
```

### 3. 路由匹配

```typescript
// config/routes.ts
{
  path: '/crown',           // 静态路由路径
  component: './DynamicRoute', // 指向动态路由组件
}
```

### 4. 组件渲染

```typescript
// DynamicRoute.tsx
const routeConfig = findRouteByPath(routeList, location.pathname);
switch (routeConfig.component) {
  case 'ModelAdmin':
    return <ModelAdmin modelName={routeConfig.name} />;
  case 'ModelCustom':
    return <ModelCustom toolName={routeConfig.name} />;
}
```

## 文件结构

```
src/
├── app.tsx                 # 全局状态管理，获取动态路由
├── pages/
│   ├── DynamicRoute.tsx    # 动态路由渲染组件
│   ├── user/               # 用户认证相关页面
│   ├── oauth/              # OAuth回调页面
│   └── exception/          # 异常页面
├── utils/
│   └── routeManager.ts     # 路由管理工具
└── components/
    ├── ModelAdmin/         # 数据模型管理组件
    └── ModelCustom/        # 自定义工具组件

config/
└── routes.ts               # 静态路由配置
```

## 添加新路由的步骤

### 1. 后端添加路由

在后端的 `/api/admin/route-list` 接口中添加新的路由配置：

```python
{
    "name": "product",
    "label": "Product Management",
    "path": "/product",
    "component": "ModelAdmin",
    "icon": "ShopOutlined"
}
```

### 2. 前端配置路由

在 `config/routes.ts` 中添加对应的路由占位符：

```typescript
{
  path: '/product',
  component: './DynamicRoute',
},
```

### 3. 测试

- 重启应用以使路由配置生效
- 检查菜单是否正确显示
- 验证页面是否正确渲染

## 最佳实践

### 1. 路由命名规范

- 使用小写字母和连字符：`/user-management`
- 保持简洁明了：`/product` 而不是 `/product-management-system`
- 避免嵌套过深：最多2-3层

### 2. 组件选择

- **ModelAdmin**：用于数据模型的CRUD操作
- **ModelCustom**：用于自定义工具和特殊功能

### 3. 权限控制和安全性

**动态路由获取时机**：
- ✅ 只有在用户成功登录后才获取动态路由
- ✅ 未登录用户无法访问任何业务路由
- ✅ 路由数据在登录成功时实时获取，确保权限时效性

**权限控制实现**：
- 后端API根据用户权限动态返回路由配置
- 不同角色的用户看到不同的菜单和路由
- 前端无法绕过权限限制访问未授权的路由

### 4. 性能优化

- 内置路由在编译时优化
- 动态路由数据缓存在全局状态中
- 避免频繁的API调用

## 故障排除

### 1. 路由不匹配

**问题**：访问动态路由返回404
**解决**：检查 `config/routes.ts` 中是否有对应的路由占位符

### 2. 组件渲染失败

**问题**：DynamicRoute 组件显示错误信息
**解决**：检查后端API返回的 `component` 字段是否为支持的类型

### 3. 菜单不显示

**问题**：动态路由不在菜单中显示
**解决**：检查路由配置中的 `hideInMenu` 属性

## 未来优化

1. **自动路由生成**：考虑使用工具自动生成路由配置
2. **类型安全**：为动态路由提供更好的TypeScript类型支持
3. **路由缓存**：实现更智能的路由缓存策略
4. **权限路由**：集成权限系统，支持基于角色的路由访问控制
