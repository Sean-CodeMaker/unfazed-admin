# Pro Layout Routes 字段测试指南

## ⚠️ 问题解决记录

### 发现的问题
- **错误信息**: `Objects are not valid as a React child (found: object with keys {description})`
- **根本原因**: UmiJS 路由配置不支持 Pro Layout 专有字段（如 `hideInMenu`, `tooltip` 等）
- **解决方案**: 将 Pro Layout 字段配置移至 `src/app.tsx` 的 `menuDataRender` 中

## 📋 正确的实施方案

### 1. 路由配置 (`config/routes.ts`)
- 保持标准的 UmiJS 路由配置
- 移除所有 Pro Layout 专有字段
- 只保留 `path`, `name`, `icon`, `component`, `routes` 等标准字段

### 2. Pro Layout 配置 (`src/app.tsx`)
- 通过 `menuDataRender` 函数自定义菜单数据
- 在运行时动态添加 Pro Layout 字段
- 支持基于权限的菜单控制

#### 🎯 Dashboard 菜单 - 混合测试
```typescript
{
  path: '/dashboard',
  name: 'dashboard',
  hideInMenu: false,        // ✅ 显示主菜单
  hideChildrenInMenu: false, // ✅ 显示子菜单
  tooltip: 'Dashboard - 数据看板',
  routes: [
    {
      name: 'analysis',
      hideInMenu: false,    // ✅ 显示
      tooltip: '数据分析页面',
    },
    {
      name: 'monitor', 
      hideInMenu: true,     // 🚫 隐藏监控页面
      tooltip: '系统监控页面（已隐藏）',
    },
    {
      name: 'workplace',
      hideInMenu: false,
      disabled: true,       // ⚪ 禁用工作台
      tooltip: '工作台页面（已禁用）',
    }
  ]
}
```

#### 📝 Form 菜单 - hideChildrenInMenu 测试
```typescript
{
  path: '/form',
  name: 'form',
  hideInMenu: false,
  hideChildrenInMenu: true,  // 🚫 隐藏所有子菜单
  tooltip: '表单页面（子菜单已隐藏）',
}
```

#### ⚠️ Exception 菜单 - 完全隐藏测试
```typescript
{
  name: 'exception',
  hideInMenu: true,         // 🚫 完全隐藏整个菜单
  tooltip: '异常页面（完全隐藏）',
}
```

#### 🔗 外链测试
```typescript
{
  name: 'external-link',
  path: 'https://procomponents.ant.design/components/layout',
  target: '_blank',         // 🌐 新窗口打开
  tooltip: 'Pro Layout 官方文档（外链）',
}
```

## 🔍 测试验证点

### 应该看到的效果：

1. **Dashboard 菜单** ✅
   - 显示 "Dashboard" 主菜单
   - 显示 "Analysis" 子菜单
   - **不显示** "Monitor" 子菜单（已隐藏）
   - 显示 "Workplace" 子菜单但呈禁用状态

2. **Form 菜单** ✅
   - 显示 "Form" 主菜单
   - **不显示** 任何子菜单（hideChildrenInMenu: true）

3. **Exception 菜单** 🚫
   - **完全不显示** Exception 菜单（hideInMenu: true）

4. **外链菜单** 🔗
   - 显示 "External Link" 菜单项
   - 点击时在新窗口打开 Pro Layout 文档

5. **Tooltip 效果** 💬
   - 鼠标悬停在菜单项上应显示自定义 tooltip

## 🚀 启动测试

```bash
npm start
```

访问 http://localhost:8000 查看效果

## 📝 Pro Layout 支持的完整字段

| 字段                 | 类型         | 说明         | 测试状态 |
| -------------------- | ------------ | ------------ | -------- |
| `hideInMenu`         | boolean      | 隐藏菜单项   | ✅ 已测试 |
| `hideChildrenInMenu` | boolean      | 隐藏子菜单   | ✅ 已测试 |
| `disabled`           | boolean      | 禁用菜单项   | ✅ 已测试 |
| `tooltip`            | string       | 菜单提示     | ✅ 已测试 |
| `target`             | string       | 外链打开方式 | ✅ 已测试 |
| `disabledTooltip`    | boolean      | 禁用提示     | ⏳ 待测试 |
| `locale`             | string/false | 国际化键     | ⏳ 待测试 |
| `key`                | string       | 选中标识     | ⏳ 待测试 |
| `parentKeys`         | string[]     | 父节点关联   | ⏳ 待测试 |
| `flatMenu`           | boolean      | 提升子节点   | ⏳ 待测试 |

## ✅ 国际化配置已完成

所有支持的语言都已添加 `menu.external-link` 翻译：

| 语言       | 翻译                    | 文件            |
| ---------- | ----------------------- | --------------- |
| 中文(简体) | Pro Layout 文档         | `zh-CN/menu.ts` |
| 中文(繁体) | Pro Layout 文檔         | `zh-TW/menu.ts` |
| 英文       | Pro Layout Docs         | `en-US/menu.ts` |
| 日文       | Pro Layout ドキュメント | `ja-JP/menu.ts` |
| 葡萄牙语   | Documentação Pro Layout | `pt-BR/menu.ts` |
| 印尼语     | Dokumentasi Pro Layout  | `id-ID/menu.ts` |
| 波斯语     | مستندات Pro Layout      | `fa-IR/menu.ts` |
| 孟加拉语   | Pro Layout ডকুমেন্টেশন      | `bn-BD/menu.ts` |

## 🔄 对比 OpenAPI Routes

| 功能       | OpenAPI                | Pro Layout           | 状态        |
| ---------- | ---------------------- | -------------------- | ----------- |
| 隐藏菜单   | `meta.hidden`          | `hideInMenu`         | ✅ 等效      |
| 隐藏子菜单 | `meta.hidden_children` | `hideChildrenInMenu` | ✅ 等效      |
| 禁用菜单   | ❌ 不支持               | `disabled`           | ✅ Pro更强   |
| 图标       | `meta.icon` (CDN)      | `icon` (ReactNode)   | ✅ Pro更灵活 |
| 工具提示   | ❌ 不支持               | `tooltip`            | ✅ Pro更强   |
| 国际化     | ❌ 不支持               | `locale`             | ✅ Pro更强   |

## 📱 下一步计划

如果基础字段测试成功，可以继续测试：
1. 动态路由加载
2. 权限控制集成
3. 国际化配置
4. 更复杂的菜单结构

---

**创建时间**: ${new Date().toLocaleString()}
**测试环境**: Ant Design Pro + UmiJS 4
