# useModelOperations Hook

这是一个封装了模型操作通用逻辑的自定义 Hook，可以在 ModelList、ModelDetail 等组件中复用。

## 功能特性

- ✅ 模型描述获取
- ✅ 数据查询（支持搜索条件构建）
- ✅ 批量操作（自动合并搜索条件）
- ✅ 行级操作
- ✅ 数据保存
- ✅ 统一的消息提示和错误处理

## 使用方法

### 基本用法

```tsx
import { useModelOperations } from '@/hooks/useModelOperations';

const MyComponent = ({ modelName }) => {
    const {
        contextHolder,
        messageApi,
        fetchModelDesc,
        fetchModelData,
        executeBatchAction,
        executeRowAction,
        saveData,
        getStoredSettings,
    } = useModelOperations({
        modelName,
        onSuccess: () => {
            // 操作成功后的回调
            console.log('Operation successful');
        },
        onError: (error) => {
            // 操作失败后的回调
            console.error('Operation failed:', error);
        },
    });

    return (
        <div>
            {contextHolder}
            {/* 你的组件内容 */}
        </div>
    );
};
```

### 在 ModelList 中使用

```tsx
const ModelList = ({ modelName, onDetail, onAdd }) => {
    const {
        contextHolder,
        fetchModelDesc,
        fetchModelData,
        executeBatchAction,
        executeRowAction,
        saveData,
    } = useModelOperations({
        modelName,
        onSuccess: () => {
            actionRef.current?.reload?.();
        },
    });

    // 使用 Hook 提供的函数...
};
```

### 在 ModelDetail 中使用

```tsx
const ModelDetail = ({ modelName, record }) => {
    const {
        contextHolder,
        fetchModelDesc,
        executeRowAction,
        saveData,
    } = useModelOperations({
        modelName,
        onSuccess: () => {
            // 保存成功后的处理
        },
    });

    // 使用 Hook 提供的函数...
};
```

## API 参考

### 参数

| 参数      | 类型     | 必填 | 说明                 |
| --------- | -------- | ---- | -------------------- |
| modelName | string   | ✅    | 模型名称             |
| onSuccess | function | ❌    | 操作成功后的回调函数 |
| onError   | function | ❌    | 操作失败后的回调函数 |

### 返回值

| 属性                   | 类型      | 说明                 |
| ---------------------- | --------- | -------------------- |
| contextHolder          | ReactNode | 消息提示的上下文容器 |
| messageApi             | object    | 消息 API             |
| currentSearchParams    | any       | 当前搜索参数         |
| setCurrentSearchParams | function  | 设置搜索参数         |
| getStoredSettings      | function  | 获取本地存储的设置   |
| buildSearchConditions  | function  | 构建搜索条件         |
| fetchModelDesc         | function  | 获取模型描述         |
| fetchModelData         | function  | 获取模型数据         |
| executeBatchAction     | function  | 执行批量操作         |
| executeRowAction       | function  | 执行行级操作         |
| saveData               | function  | 保存数据             |

### 函数签名

#### fetchModelDesc()
```typescript
() => Promise<API.AdminSerializeModel | null>
```

#### fetchModelData(params, modelDesc?)
```typescript
(params: any, modelDesc?: API.AdminSerializeModel) => Promise<{
    data: any[];
    success: boolean;
    total: number;
}>
```

#### executeBatchAction(actionKey, records, modelDesc?)
```typescript
(
    actionKey: string, 
    records: Record<string, any>[], 
    modelDesc?: API.AdminSerializeModel
) => Promise<boolean>
```

#### executeRowAction(actionKey, record)
```typescript
(actionKey: string, record: Record<string, any>) => Promise<boolean>
```

#### saveData(data, inlines?)
```typescript
(
    data: Record<string, any>, 
    inlines?: Record<string, Record<string, any>[]>
) => Promise<boolean>
```

## 优势

1. **代码复用**：避免在多个组件中重复相同的逻辑
2. **统一处理**：统一的错误处理和消息提示
3. **类型安全**：完整的 TypeScript 类型支持
4. **灵活配置**：支持自定义成功/失败回调
5. **易于维护**：集中管理模型操作相关逻辑
