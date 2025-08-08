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
} from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import { Button, message, Space, Card, Tabs, Modal, Divider } from 'antd';
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

    // 状态管理
    const [modelDesc, setModelDesc] = useState<API.AdminSerializeModel | null>(null);
    const [detailData, setDetailData] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
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
                const inlinePromises = Object.entries(inlines).map(async ([inlineName, inlineModel]) => {
                    // 获取 inline 模型描述
                    const descResp = await getModelDesc(inlineName);
                    if (descResp?.code === 0) {
                        setInlineDescs(prev => ({
                            ...prev,
                            [inlineName]: descResp.data
                        }));
                    }

                    // 获取 inline 数据
                    const dataResp = await getModelData({
                        name: inlineName,
                        page: 1,
                        size: 100,
                        cond: [], // TODO: 根据关联关系设置条件
                    });

                    if (dataResp?.code === 0) {
                        return { [inlineName]: dataResp.data.data };
                    }
                    return { [inlineName]: [] };
                });

                const inlineResults = await Promise.all(inlinePromises);
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

    // 保存数据
    const handleSave = useCallback(async () => {
        try {
            const formValues = await formRef.current?.validateFields();
            if (!formValues) return;

            const response = await saveModelData({
                name: modelName,
                data: { ...record, ...formValues },
                inlines: inlineData,
            });

            if (response?.code === 0) {
                messageApi.success('Saved successfully');
                setIsEditing(false);
            } else {
                messageApi.error(response?.message || 'Save failed');
            }
        } catch (error) {
            messageApi.error('Save failed');
            console.error('Save error:', error);
        }
    }, [modelName, record, inlineData, messageApi]);

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
            readonly: !isEditing || fieldConfig.readonly,
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
        if (!inlineDesc) return [];

        const columns: ProColumns<Record<string, any>>[] = [];

        Object.entries(inlineDesc.fields).forEach(([fieldName, fieldConfig]) => {
            if (!fieldConfig.show) return;

            const column: ProColumns<Record<string, any>> = {
                title: fieldConfig.name || fieldName,
                dataIndex: fieldName,
                key: fieldName,
                tooltip: fieldConfig.help_text,
                ellipsis: true,
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
                    column.valueType = 'money';
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

            columns.push(column);
        });

        // 添加操作列
        if (inlineDesc.attrs.can_edit || inlineDesc.attrs.can_delete) {
            columns.push({
                title: 'Actions',
                dataIndex: 'option',
                valueType: 'option',
                width: 120,
                render: (_, record) => {
                    const actions = [];

                    if (inlineDesc.attrs.can_edit) {
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

                    if (inlineDesc.attrs.can_delete) {
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
                        submitter={false}
                        layout="horizontal"
                        labelCol={{ span: 6 }}
                        wrapperCol={{ span: 18 }}
                        initialValues={record}
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
            label: inlineDescs[inlineName]?.attrs.help_text || inlineName,
            children: (
                <Card>
                    <ProTable
                        headerTitle={inlineDescs[inlineName]?.attrs.help_text || inlineName}
                        columns={generateInlineColumns(inlineName)}
                        dataSource={inlineData[inlineName] || []}
                        rowKey={(record) => record.id || record.key || JSON.stringify(record)}
                        search={false}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                        }}
                        toolBarRender={() => [
                            inlineDescs[inlineName]?.attrs.can_add && (
                                <Button
                                    key="add"
                                    type="primary"
                                    icon={<EditOutlined />}
                                >
                                    Add {inlineName}
                                </Button>
                            ),
                        ]}
                    />
                </Card>
            ),
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
                    <Button
                        key="edit"
                        type={isEditing ? 'default' : 'primary'}
                        icon={isEditing ? <EyeOutlined /> : <EditOutlined />}
                        onClick={() => setIsEditing(!isEditing)}
                    >
                        {isEditing ? 'View' : 'Edit'}
                    </Button>,
                    isEditing && (
                        <Button
                            key="save"
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={handleSave}
                        >
                            Save
                        </Button>
                    ),
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
