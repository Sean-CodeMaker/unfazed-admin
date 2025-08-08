# ModelList 组件

ModelList 是一个基于 Ant Design Pro 的通用模型管理组件，用于展示和管理后端模型数据。

## 功能特性

- ✅ 自动获取模型描述信息（调用 `model-desc` 接口）
- ✅ 分页数据展示（调用 `model-data` 接口）
- ✅ 动态搜索面板（根据模型配置生成）
- ✅ 多种字段类型支持（文本、数字、布尔、日期等）
- ✅ 批量操作支持
- ✅ 编辑和删除操作
- ✅ 从 localStorage 读取设置信息

## 使用方法

### 基本用法

```tsx
import { ModelList } from '@/components';

const MyPage = () => {
  const handleEdit = (record: Record<string, any>) => {
    console.log('编辑记录:', record);
  };

  const handleAdd = () => {
    console.log('添加新记录');
  };

  return (
    <ModelList
      modelName="User"
      onEdit={handleEdit}
      onAdd={handleAdd}
    />
  );
};
```

### Props

| 属性      | 类型                                  | 必填 | 说明                   |
| --------- | ------------------------------------- | ---- | ---------------------- |
| modelName | string                                | ✅    | 模型名称，用于调用 API |
| onEdit    | (record: Record<string, any>) => void | ❌    | 编辑记录的回调函数     |
| onAdd     | () => void                            | ❌    | 添加新记录的回调函数   |

## API 接口

组件会自动调用以下接口：

### 1. 获取模型描述
- **接口**: `POST /api/admin/model-desc`
- **用途**: 获取模型的字段定义、权限设置等
- **调用时机**: 组件初始化时

### 2. 获取模型数据
- **接口**: `POST /api/admin/model-data`
- **用途**: 分页获取模型数据
- **调用时机**: 页面加载、搜索、翻页时

### 3. 删除数据
- **接口**: `POST /api/admin/model-delete`
- **用途**: 删除选中的记录
- **调用时机**: 用户点击删除按钮时

### 4. 执行操作
- **接口**: `POST /api/admin/model-action`
- **用途**: 执行批量操作
- **调用时机**: 用户点击批量操作按钮时

## 搜索功能

搜索面板会根据模型的 `attrs.list_search` 配置自动生成，支持以下字段类型：

- **文本字段**: 使用包含搜索（icontains）
- **数字字段**: 使用精确匹配（eq）
- **布尔字段**: 使用开关组件
- **日期字段**: 支持日期范围搜索

## 设置信息

组件会从 localStorage 中读取 `admin-settings` 配置，包括：

- `pageSize`: 每页显示条数
- 其他用户自定义设置

## 字段类型支持

| OpenAPI 字段类型 | ProTable valueType | 搜索方式  |
| ---------------- | ------------------ | --------- |
| CharField        | text/select        | icontains |
| TextField        | text               | icontains |
| IntegerField     | digit              | eq        |
| FloatField       | money              | eq        |
| BooleanField     | switch             | eq (0/1)  |
| DateField        | date               | 日期范围  |
| DatetimeField    | dateTime           | 日期范围  |
| TimeField        | time               | eq        |

## 完整示例

参考 `src/pages/model-admin/index.tsx` 文件，该文件展示了如何：

1. 通过 URL 参数传递模型名称
2. 处理编辑和新增操作
3. 集成模态框进行数据编辑

```tsx
// 访问 URL: /model-admin?model=User
// 将自动加载 User 模型的管理界面
```

## 注意事项

1. 确保后端 API 接口已正确实现
2. 模型的字段配置需要在后端正确设置
3. 权限控制需要在后端模型中配置
4. 日期字段需要 dayjs 库支持
