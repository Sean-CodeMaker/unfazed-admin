# Settings 工具函数

本文件提供了应用级别设置的管理工具函数。

## 设计理念

项目中的设置被分为两类：

### 1. ProLayout 布局设置
直接传递给 ProLayout 组件，用于控制布局外观：
- `title` - 应用标题
- `logo` - 应用 Logo
- `navTheme` - 导航主题
- `colorPrimary` - 主题色
- `layout` - 布局模式
- `contentWidth` - 内容宽度
- `fixedHeader` - 固定顶部
- `fixSiderbar` - 固定侧边栏
- `colorWeak` - 色弱模式
- `pwa` - PWA 设置
- `iconfontUrl` - 图标字体 URL

### 2. 应用级别设置
存储在 localStorage 中，供应用业务逻辑使用：
- `pageSize` - 分页大小
- `timeZone` - 时区
- `apiPrefix` - API 前缀
- `debug` - 调试模式
- `version` - 应用版本
- `extra` - 扩展配置
- `authPlugins` - 认证插件配置

## 使用方法

### 获取应用设置
```typescript
import { getAppSettings, getPageSize, getApiPrefix } from '@/utils/settings';

// 获取完整应用设置
const settings = getAppSettings();

// 获取特定设置
const pageSize = getPageSize();
const apiPrefix = getApiPrefix();
```

### 更新应用设置
```typescript
import { setAppSettings } from '@/utils/settings';

// 更新部分设置
setAppSettings({
  pageSize: 50,
  debug: true
});
```

### 在组件中使用
```typescript
import React, { useEffect, useState } from 'react';
import { getAppSettings, getPageSize } from '@/utils/settings';

const MyComponent = () => {
  const [pageSize, setPageSize] = useState(getPageSize());
  
  useEffect(() => {
    // 组件挂载时获取设置
    const settings = getAppSettings();
    console.log('当前应用设置:', settings);
  }, []);

  return <div>当前分页大小: {pageSize}</div>;
};
```

## 注意事项

1. **localStorage 错误处理**: 所有 localStorage 操作都包含错误处理，避免在无痕模式或存储空间不足时崩溃。

2. **默认值**: 当 localStorage 中没有设置或解析失败时，会使用默认值。

3. **类型安全**: 所有函数都提供了完整的 TypeScript 类型定义。

4. **向后兼容**: 新增字段时会与现有设置合并，不会覆盖未更新的字段。
