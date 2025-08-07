# Routes 配置中支持的 Pro-Layout 字段指南

## UmiJS Routes 基础字段

根据项目中 `config/routes.ts` 文件的注释，UmiJS 只支持以下字段：

### 核心路由字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `path` | string | 路径配置，支持动态参数 `:id` 和通配符 `*` |
| `component` | string | React组件路径，可以是绝对路径或相对路径 |
| `routes` | array | 子路由配置，用于嵌套路由 |
| `redirect` | string | 路由重定向目标 |
| `wrappers` | array | 路由包装组件，用于权限校验等 |

### Pro-Layout 菜单字段

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `name` | string | 路由标题，读取国际化文件 `menu.ts` 中的值 | `'welcome'` |
| `icon` | string | 路由图标，去除风格后缀和大小写 | `'smile'`, `'crown'`, `'CheckCircleOutlined'` |

## Pro-Layout 扩展字段

虽然项目注释中只提到基础字段，但 Pro-Layout 实际支持更多菜单配置字段：

### 菜单控制字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `hideInMenu` | boolean | false | 在菜单中隐藏该项 |
| `hideChildrenInMenu` | boolean | false | 隐藏子菜单项 |
| `hideInBreadcrumb` | boolean | false | 在面包屑中隐藏 |
| `flatMenu` | boolean | false | 平铺菜单，将子项提升到当前级别 |

### 权限控制字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `access` | string | 权限控制标识符，配合 `src/access.ts` 使用 |

### 菜单外观字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `locale` | string \| false | 国际化键名，false 表示不使用国际化 |
| `target` | string | 链接打开方式：`_blank`, `_self`, `_parent`, `_top` |
| `disabled` | boolean | 禁用菜单项 |

### 高级字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `key` | string | 自定义菜单项的key，默认使用path |
| `parentKeys` | string[] | 当选中此节点时，同时选中的父节点 |

## 字段使用示例

### 基础菜单配置
```typescript
{
  name: 'welcome',
  icon: 'smile',
  path: '/welcome',
  component: './Welcome',
}
```

### 权限控制菜单
```typescript
{
  name: 'admin',
  icon: 'crown',
  path: '/admin',
  component: './Admin',
  access: 'canAdmin', // 需要管理员权限
}
```

### 隐藏菜单项
```typescript
{
  name: 'hidden-page',
  path: '/hidden',
  component: './Hidden',
  hideInMenu: true, // 不在菜单中显示
}
```

### 外部链接菜单
```typescript
{
  name: 'external-link',
  icon: 'link',
  path: 'https://example.com',
  target: '_blank', // 新窗口打开
}
```

### 分组菜单（仅显示子菜单）
```typescript
{
  name: 'group',
  icon: 'folder',
  path: '/group',
  hideChildrenInMenu: false,
  routes: [
    {
      name: 'item1',
      path: '/group/item1',
      component: './Item1',
    },
    {
      name: 'item2', 
      path: '/group/item2',
      component: './Item2',
    }
  ]
}
```

## 图标配置说明

### Ant Design 图标
- 使用图标名称，去除 `Outlined`、`Filled`、`TwoTone` 后缀
- 支持驼峰命名和小写命名
- 示例：`<UserOutlined />` → `'user'` 或 `'User'`
- 示例：`<StepBackwardOutlined />` → `'stepBackward'` 或 `'StepBackward'`

### 常用图标
```typescript
// 基础图标
'smile', 'crown', 'user', 'setting', 'home', 'dashboard'

// 操作图标  
'plus', 'edit', 'delete', 'search', 'filter'

// 状态图标
'warning', 'info', 'success', 'error', 'loading'

// 功能图标
'file', 'folder', 'image', 'video', 'download', 'upload'
```

## 国际化配置

菜单标题通过 `name` 字段配置，读取 `src/locales/[locale]/menu.ts` 文件：

### menu.ts 示例
```typescript
export default {
  'menu.welcome': '欢迎',
  'menu.admin': '管理',
  'menu.user': '用户',
  'menu.user.login': '登录',
  'menu.user.register': '注册',
};
```

### 配置对应关系
```typescript
{
  name: 'welcome', // 对应 menu.welcome
  path: '/welcome',
  component: './Welcome',
}
```

## 注意事项

1. **字段兼容性**：项目中明确声明只支持基础字段，扩展字段需要验证兼容性
2. **权限集成**：`access` 字段需要配合 `src/access.ts` 文件使用
3. **图标资源**：确保使用的图标在 Ant Design 图标库中存在
4. **国际化**：菜单标题建议使用国际化配置，便于多语言支持
5. **路径规范**：路径应该遵循 REST 风格，使用小写和连字符

## 参考资源

- [UmiJS 路由配置](https://umijs.org/docs/guides/routes)
- [Pro-Layout 配置](https://procomponents.ant.design/components/layout)
- [Ant Design 图标库](https://ant.design/components/icon-cn)
- [菜单数据结构 MenuDataItem](https://github.com/ant-design/pro-components)
