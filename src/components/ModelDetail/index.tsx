import React, { useCallback, useRef, useState, useEffect } from 'react';
import type {
    ActionType,
    ProColumns,
    ProFormInstance,
} from '@ant-design/pro-components';
import {
    PageContainer,
    ProTable,
    ProForm,
    ProFormText,
    ProFormDigit,
    ProFormSwitch,
    ProFormSelect,
    ProFormDatePicker,
    ProFormDateTimePicker,
    ProFormTimePicker,
    ProFormTextArea,
    EditableProTable,
} from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import { Button, message, Space, Card, Tabs, Modal, Divider, Transfer } from 'antd';
import { SaveOutlined, DeleteOutlined, ArrowLeftOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import {
    getModelDesc,
    getModelData,
    getModelDetail,
    saveModelData,
    deleteModelData
} from '@/services/ant-design-pro/api';
import dayjs from 'dayjs';

interface ModelDetailProps {
    modelName: string;
    record: Record<string, any>;
    onBack?: () => void;
}

const ModelDetail: React.FC<ModelDetailProps> = ({ modelName, record, onBack }) => {
    const [messageApi, contextHolder] = message.useMessage();
    const formRef = useRef<ProFormInstance>(null!);

    // 工具函数：首字母大写
    const capitalizeFirstLetter = (str: string) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    // 状态管理
    const [modelDesc, setModelDesc] = useState<API.AdminSerializeModel | null>(null);
    const [detailData, setDetailData] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(true); // 默认启用编辑模式
    const [inlineData, setInlineData] = useState<Record<string, any[]>>({});
    const [inlineDescs, setInlineDescs] = useState<Record<string, API.AdminSerializeModel>>({});
    const [activeTab, setActiveTab] = useState('main');

    // 获取模型描述
    const { loading: descLoading } = useRequest(
        async () => {
            const response = await getModelDesc(modelName);
            if (response?.code === 0) {
                setModelDesc(response.data);
            } else {
                messageApi.error(response?.message || 'Failed to fetch model description');
            }
            return response;
        },
        {
            manual: false,
            onError: () => {
                messageApi.error('Failed to fetch model description');
            },
        }
    );

    // 根据关联关系构建查询条件
    const buildConditions = useCallback((relation: any, recordData: any) => {
        if (!relation) return [];

        const { source_field, dest_field, relation: relationType } = relation;
        const sourceValue = recordData[source_field];

        if (sourceValue === undefined || sourceValue === null) {
            return [];
        }

        // 根据关联类型构建条件
        switch (relationType) {
            case 'fk':  // 外键关联
            case 'o2o': // 一对一关联
                return [{
                    field: dest_field,
                    eq: sourceValue
                }];
            case 'bk_fk': // 反向外键
            case 'bk_o2o': // 反向一对一
                return [{
                    field: dest_field,
                    eq: sourceValue
                }];
            case 'm2m': // 多对多关联（可能需要更复杂的处理）
                return [{
                    field: dest_field,
                    eq: sourceValue
                }];
            default:
                return [];
        }
    }, []);

    // 获取详情数据
    const { loading: detailLoading } = useRequest(
        async () => {
            if (!modelDesc) return null;

            const response = await getModelDetail({
                name: modelName,
                data: record,
            });

            if (response?.code === 0) {
                setDetailData(response.data);

                // 获取 inline 数据
                const inlines = response.data.inlines || {};

                // 首先设置 inline 描述信息（从 model-detail 返回的数据中获取）
                const inlineDescriptions: Record<string, any> = {};
                Object.entries(inlines).forEach(([inlineName, inlineModel]: [string, any]) => {
                    inlineDescriptions[inlineName] = inlineModel;
                });
                setInlineDescs(inlineDescriptions);

                // 然后获取每个 inline 的实际数据
                const inlineDataPromises = Object.entries(inlines).map(async ([inlineName, inlineModel]: [string, any]) => {
                    try {
                        // 构建查询条件
                        const conditions = buildConditions(inlineModel.relation, record);

                        // 调用 model-data 接口获取数据
                        const dataResp = await getModelData({
                            name: inlineName,
                            page: 1,
                            size: 100,
                            cond: conditions,
                        });

                        if (dataResp?.code === 0) {
                            return { [inlineName]: dataResp.data.data };
                        } else {
                            console.error(`Failed to fetch data for inline ${inlineName}:`, dataResp?.message);
                            return { [inlineName]: [] };
                        }
                    } catch (error) {
                        console.error(`Error fetching data for inline ${inlineName}:`, error);
                        return { [inlineName]: [] };
                    }
                });

                const inlineResults = await Promise.all(inlineDataPromises);
                const mergedInlineData = inlineResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
                setInlineData(mergedInlineData);
            } else {
                messageApi.error(response?.message || 'Failed to fetch detail data');
            }
            return response;
        },
        {
            manual: false,
            ready: !!modelDesc,
            onError: () => {
                messageApi.error('Failed to fetch detail data');
            },
        }
    );



    // 删除数据
    const handleDelete = useCallback(() => {
        Modal.confirm({
            title: 'Confirm Delete',
            content: 'Are you sure to delete this record? This action cannot be undone.',
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    const response = await deleteModelData({
                        name: modelName,
                        data: [record],
                    });

                    if (response?.code === 0) {
                        messageApi.success('Deleted successfully');
                        onBack?.();
                    } else {
                        messageApi.error(response?.message || 'Delete failed');
                    }
                } catch (error) {
                    messageApi.error('Delete failed');
                    console.error('Delete error:', error);
                }
            },
        });
    }, [modelName, record, messageApi, onBack]);

    // 渲染表单字段
    const renderFormField = useCallback((fieldName: string, fieldConfig: API.AdminField) => {
        const value = record[fieldName];
        const commonProps = {
            name: fieldName,
            label: fieldConfig.name || fieldName,
            tooltip: fieldConfig.help_text,
            readonly: fieldConfig.readonly, // 移除 isEditing 条件，只依赖字段本身的 readonly 属性
            disabled: fieldConfig.readonly, // 对于只读字段，同时设置 disabled
            rules: fieldConfig.blank ? [] : [{ required: true, message: `${fieldConfig.name || fieldName} is required` }],
        };

        switch (fieldConfig.type) {
            case 'CharField':
                if (fieldConfig.choices && fieldConfig.choices.length > 0) {
                    return (
                        <ProFormSelect
                            key={fieldName}
                            {...commonProps}
                            options={fieldConfig.choices.map(([value, label]) => ({ value, label }))}
                        />
                    );
                }
                return <ProFormText key={fieldName} {...commonProps} />;

            case 'TextField':
                return <ProFormTextArea key={fieldName} {...commonProps} />;

            case 'IntegerField':
                return <ProFormDigit key={fieldName} {...commonProps} precision={0} />;

            case 'FloatField':
                return <ProFormDigit key={fieldName} {...commonProps} />;

            case 'BooleanField':
                return <ProFormSwitch key={fieldName} {...commonProps} />;

            case 'DateField':
                return (
                    <ProFormDatePicker
                        key={fieldName}
                        {...commonProps}
                        fieldProps={{
                            format: 'YYYY-MM-DD',
                        }}
                    />
                );

            case 'DatetimeField':
                return (
                    <ProFormDateTimePicker
                        key={fieldName}
                        {...commonProps}
                        fieldProps={{
                            format: 'YYYY-MM-DD HH:mm:ss',
                        }}
                    />
                );

            case 'TimeField':
                return (
                    <ProFormTimePicker
                        key={fieldName}
                        {...commonProps}
                        fieldProps={{
                            format: 'HH:mm:ss',
                        }}
                    />
                );

            default:
                return <ProFormText key={fieldName} {...commonProps} />;
        }
    }, [record, isEditing]);

    // 生成 inline 表格列配置
    const generateInlineColumns = useCallback((inlineName: string): ProColumns<Record<string, any>>[] => {
        const inlineDesc = inlineDescs[inlineName];
        if (!inlineDesc || !inlineDesc.fields) return [];

        const columns: ProColumns<Record<string, any>>[] = [];
        // 获取关联字段名称，用于设置只读
        const relationSourceField = (inlineDesc as any)?.relation?.source_field;

        Object.entries(inlineDesc.fields).forEach(([fieldName, fieldConfig]) => {
            if (!fieldConfig.show) return;

            // 检查是否是关联字段
            const isRelationField = fieldName === relationSourceField;

            const column: ProColumns<Record<string, any>> = {
                title: fieldConfig.name || fieldName,
                dataIndex: fieldName,
                key: fieldName,
                tooltip: fieldConfig.help_text,
                ellipsis: true,
                // 关联字段设置为只读，不可编辑
                editable: isRelationField ? false : undefined,
            };

            // 根据字段类型设置 valueType
            switch (fieldConfig.type) {
                case 'CharField':
                case 'TextField':
                    column.valueType = 'text';
                    if (fieldConfig.choices && fieldConfig.choices.length > 0) {
                        column.valueType = 'select';
                        column.valueEnum = fieldConfig.choices.reduce((acc, [value, label]) => {
                            acc[value] = { text: label };
                            return acc;
                        }, {} as Record<string, { text: string }>);
                    }
                    break;
                case 'IntegerField':
                    column.valueType = 'digit';
                    break;
                case 'FloatField':
                    column.valueType = 'digit';
                    break;
                case 'BooleanField':
                    column.valueType = 'switch';
                    break;
                case 'DateField':
                    column.valueType = 'date';
                    break;
                case 'DatetimeField':
                    column.valueType = 'dateTime';
                    break;
                case 'TimeField':
                    column.valueType = 'time';
                    break;
                default:
                    column.valueType = 'text';
            }

            // 如果是关联字段，添加只读状态提示
            if (isRelationField) {
                column.render = (text, record) => (
                    <span style={{ color: '#666', fontStyle: 'italic' }}>
                        {text}
                    </span>
                );
            }

            columns.push(column);
        });

        // 添加操作列
        if (inlineDesc.attrs?.can_edit || inlineDesc.attrs?.can_delete) {
            columns.push({
                title: 'Actions',
                dataIndex: 'option',
                valueType: 'option',
                width: 120,
                render: (_, record) => {
                    const actions = [];

                    if (inlineDesc.attrs?.can_edit) {
                        actions.push(
                            <Button
                                key="edit"
                                type="link"
                                size="small"
                                icon={<EditOutlined />}
                            >
                                Edit
                            </Button>
                        );
                    }

                    if (inlineDesc.attrs?.can_delete) {
                        actions.push(
                            <Button
                                key="delete"
                                type="link"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                            >
                                Delete
                            </Button>
                        );
                    }

                    return actions;
                },
            });
        }

        return columns;
    }, [inlineDescs]);

    // 根据关系类型渲染不同的组件
    const renderInlineComponent = useCallback((inlineName: string) => {
        const inlineDesc = inlineDescs[inlineName];
        const data = inlineData[inlineName] || [];
        const relationType = (inlineDesc as any)?.relation?.relation;

        if (!inlineDesc) return null;

        switch (relationType) {
            case 'm2m':
                // 多对多关系使用穿梭框
                return (
                    <Card>
                        <Transfer
                            dataSource={data}
                            showSearch
                            filterOption={(search, item) =>
                                item.name?.toLowerCase().includes(search.toLowerCase()) ||
                                item.description?.toLowerCase().includes(search.toLowerCase())
                            }
                            targetKeys={data.filter(item => item.selected).map(item => item.id)}
                            onChange={(targetKeys) => {
                                // 处理选择变化
                                const newData = data.map(item => ({
                                    ...item,
                                    selected: targetKeys.includes(item.id)
                                }));
                                setInlineData(prev => ({
                                    ...prev,
                                    [inlineName]: newData
                                }));
                            }}
                            render={item => `${item.name} - ${item.description}`}
                            titles={['Available Tags', 'Selected Tags']}
                            listStyle={{
                                width: 300,
                                height: 300,
                            }}
                        />
                    </Card>
                );

            case 'fk':
            case 'o2o':
                // 外键和一对一关系使用可编辑表格
                return (
                    <Card>
                        <EditableProTable<Record<string, any>>
                            headerTitle={inlineDesc.attrs?.help_text || capitalizeFirstLetter(inlineName)}
                            columns={generateInlineColumns(inlineName)}
                            value={data}
                            onChange={(newData) => {
                                setInlineData(prev => ({
                                    ...prev,
                                    [inlineName]: [...(newData || [])]
                                }));
                            }}
                            rowKey="id"
                            recordCreatorProps={
                                inlineDesc.attrs?.can_add ? {
                                    newRecordType: 'dataSource',
                                    record: () => {
                                        const sourceField = (inlineDesc as any)?.relation?.source_field || 'crown_id';
                                        return {
                                            id: Date.now(),
                                            [sourceField]: record.id,
                                        };
                                    },
                                } : false
                            }
                            editable={{
                                type: 'multiple',
                                editableKeys: [],
                                onDelete: async (key) => {
                                    console.log('Delete row:', key);
                                    // 从数据中移除对应的记录
                                    const newData = data.filter(item => item.id !== key);
                                    setInlineData(prev => ({
                                        ...prev,
                                        [inlineName]: newData
                                    }));
                                },
                                actionRender: (row, config, defaultDom) => [
                                    defaultDom.delete,
                                ],
                            }}
                            pagination={{
                                pageSize: inlineDesc.attrs?.list_per_page || 10,
                                showSizeChanger: true,
                            }}
                        />
                    </Card>
                );

            default:
                // 默认使用只读表格
                return (
                    <Card>
                        <ProTable
                            headerTitle={inlineDesc.attrs?.help_text || capitalizeFirstLetter(inlineName)}
                            columns={generateInlineColumns(inlineName)}
                            dataSource={data}
                            rowKey={(record) => record.id || record.key || JSON.stringify(record)}
                            search={false}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                            }}
                            toolBarRender={() => [
                                inlineDesc.attrs?.can_add && (
                                    <Button
                                        key="add"
                                        type="primary"
                                        icon={<EditOutlined />}
                                    >
                                        Add {capitalizeFirstLetter(inlineName)}
                                    </Button>
                                ),
                            ]}
                        />
                    </Card>
                );
        }
    }, [inlineDescs, inlineData, record, generateInlineColumns, capitalizeFirstLetter]);

    if (descLoading || detailLoading || !modelDesc) {
        return <div>Loading...</div>;
    }

    // 准备标签页数据
    const tabItems = [
        {
            key: 'main',
            label: 'Main Data',
            children: (
                <Card>
                    <ProForm
                        formRef={formRef}
                        layout="horizontal"
                        labelCol={{ span: 4, offset: 0 }}
                        wrapperCol={{ span: 20, offset: 0 }}
                        initialValues={record}
                        style={{ textAlign: 'left' }}
                        onFinish={async (values) => {
                            try {
                                const response = await saveModelData({
                                    name: modelName,
                                    data: { ...record, ...values },
                                    inlines: inlineData,
                                });

                                if (response?.code === 0) {
                                    messageApi.success('Saved successfully');
                                    // 可以选择是否返回列表或保持在详情页
                                } else {
                                    messageApi.error(response?.message || 'Save failed');
                                }
                            } catch (error) {
                                messageApi.error('Save failed');
                                console.error('Save error:', error);
                            }
                        }}
                        submitter={{
                            searchConfig: {
                                submitText: 'Save',
                                resetText: 'Reset',
                            },
                            submitButtonProps: {
                                size: 'large',
                                type: 'primary',
                            },
                            resetButtonProps: {
                                size: 'large',
                            },
                            render: (props, dom) => {
                                return (
                                    <div style={{
                                        display: 'block',
                                        width: '100%',
                                        marginTop: '24px',
                                        paddingTop: '16px',
                                        borderTop: '1px solid #f0f0f0',
                                        textAlign: 'right'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            gap: '12px',
                                            alignItems: 'center',
                                            justifyContent: 'flex-end'
                                        }}>
                                            {dom}
                                        </div>
                                    </div>
                                );
                            },
                        }}
                    >
                        {Object.entries(modelDesc.fields)
                            .filter(([_, fieldConfig]) => fieldConfig.show !== false)
                            .map(([fieldName, fieldConfig]) => renderFormField(fieldName, fieldConfig))
                        }
                    </ProForm>
                </Card>
            ),
        },
        ...Object.keys(inlineData).map(inlineName => ({
            key: inlineName,
            label: inlineDescs[inlineName]?.attrs?.help_text || capitalizeFirstLetter(inlineName),
            children: renderInlineComponent(inlineName),
        })),
    ];

    return (
        <PageContainer
            header={{
                title: `${modelDesc.attrs.help_text || modelName} Detail`,
                breadcrumb: {},
                extra: [
                    <Button
                        key="back"
                        icon={<ArrowLeftOutlined />}
                        onClick={onBack}
                    >
                        Back
                    </Button>,
                    modelDesc.attrs.can_delete && (
                        <Button
                            key="delete"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={handleDelete}
                        >
                            Delete
                        </Button>
                    ),
                ],
            }}
        >
            {contextHolder}

            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
            />
        </PageContainer>
    );
};

export default ModelDetail;
