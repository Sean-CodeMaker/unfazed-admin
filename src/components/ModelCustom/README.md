# ModelCustom Component

`ModelCustom` 组件用于渲染基于 `AdminToolSerializeModel` 的自定义页面。它提供了一个灵活的表单界面，支持多种字段类型和操作按钮。

## 功能特性

### 🎯 **核心功能**
- **动态表单渲染**：基于 `fields` 配置自动生成表单字段
- **多种字段类型**：支持 CharField、TextField、IntegerField、FloatField、BooleanField、DateField 等
- **操作按钮**：基于 `actions` 配置生成操作按钮
- **多种输出类型**：支持 toast、display、download、refresh 等输出模式

### 📊 **字段类型支持**

| 字段类型        | 组件                        | 说明                               |
| --------------- | --------------------------- | ---------------------------------- |
| `CharField`     | ProFormText / ProFormSelect | 文本输入或选择器（如果有 choices） |
| `TextField`     | ProFormTextArea             | 多行文本输入                       |
| `IntegerField`  | ProFormDigit                | 整数输入                           |
| `FloatField`    | ProFormDigit                | 浮点数输入                         |
| `BooleanField`  | ProFormSwitch               | 开关组件                           |
| `DateField`     | ProFormDatePicker           | 日期选择器                         |
| `DatetimeField` | ProFormDateTimePicker       | 日期时间选择器                     |
| `TimeField`     | ProFormTimePicker           | 时间选择器                         |

### 🎛️ **操作按钮功能**

| Output 类型 | 行为                         |
| ----------- | ---------------------------- |
| `toast`     | 显示成功/错误消息            |
| `display`   | 在模态框中显示返回的数据     |
| `download`  | 下载文件（如果返回文本数据） |
| `refresh`   | 显示消息（可扩展为刷新页面） |

## 使用方法

### 基础用法

```typescript
import { ModelCustom } from '@/components';

const MyCustomTool = () => {
    const toolDesc: API.AdminToolSerializeModel = {
        fields: {
            name: {
                type: 'CharField',
                name: 'Name',
                help_text: 'Enter your name',
                show: true,
                blank: false,
                readonly: false,
                choices: [],
                default: null
            },
            age: {
                type: 'IntegerField',
                name: 'Age',
                help_text: 'Enter your age',
                show: true,
                blank: true,
                readonly: false,
                choices: [],
                default: null
            }
        },
        actions: {
            submit: {
                name: 'submit',
                label: 'Submit',
                description: 'Submit the form',
                input: 'empty', // 或 'string', 'file'
                output: 'toast',
                confirm: false,
                batch: false,
                extra: {}
            }
        },
        attrs: {
            help_text: 'Custom Form Tool',
            output_field: 'result'
        }
    };

    return (
        <ModelCustom
            toolDesc={toolDesc}
            toolName="my_custom_tool"
            onBack={() => console.log('Go back')}
        />
    );
};
```

### 与路由集成

```typescript
// 在路由组件中使用
const CustomToolPage = () => {
    const { toolName } = useParams();
    const [toolDesc, setToolDesc] = useState<API.AdminToolSerializeModel | null>(null);
    
    // 获取工具描述
    useRequest(async () => {
        const response = await getModelDesc({ name: toolName });
        if (response?.code === 0) {
            setToolDesc(response.data as API.AdminToolSerializeModel);
        }
    });

    if (!toolDesc) {
        return <div>Loading...</div>;
    }

    return (
        <ModelCustom
            toolDesc={toolDesc}
            toolName={toolName}
            onBack={() => history.back()}
        />
    );
};
```

## API 接口

### Props

| 属性       | 类型                          | 描述                      | 必填 |
| ---------- | ----------------------------- | ------------------------- | ---- |
| `toolDesc` | `API.AdminToolSerializeModel` | 工具描述对象              | ✅    |
| `toolName` | `string`                      | 工具名称（用于 API 调用） | ✅    |
| `onBack`   | `() => void`                  | 返回按钮回调              | ❌    |

### toolDesc 结构

```typescript
interface AdminToolSerializeModel {
    fields: Record<string, AdminField>;    // 表单字段配置
    actions: Record<string, AdminAction>;  // 操作按钮配置
    attrs: AdminToolAttrs;                 // 工具属性
}

interface AdminToolAttrs {
    help_text: string;      // 工具描述文本
    output_field: string;   // 输出字段名
}
```

## 自定义扩展

### 添加新的字段类型

```typescript
// 在 renderFormField 函数中添加新的 case
case 'CustomField':
    return <CustomFormComponent key={fieldName} {...commonProps} />;
```

### 添加新的输出类型

```typescript
// 在 executeAction 函数中添加新的 case
case 'custom_output':
    // 自定义处理逻辑
    handleCustomOutput(response.data);
    break;
```

## 注意事项

1. **字段验证**：必填字段（`blank: false`）会自动添加验证规则
2. **只读字段**：`readonly: true` 的字段将被禁用
3. **选择字段**：有 `choices` 的 CharField 自动渲染为选择器
4. **操作输入**：根据 `action.input` 决定是否需要表单数据
5. **错误处理**：所有 API 调用都有错误处理和用户友好的提示

## 示例场景

- **数据导入工具**：文件上传 + 处理按钮
- **报表生成器**：参数输入 + 生成报表
- **系统配置**：设置表单 + 保存按钮
- **数据分析工具**：查询条件 + 分析按钮
