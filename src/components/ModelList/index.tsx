import React, { useCallback, useRef, useState } from 'react';
import type {
    ActionType,
    ProColumns,
    ProFormInstance,
} from '@ant-design/pro-components';
import {
    PageContainer,
    ProTable,
    ProCard,
} from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import { Button, message, Form, Input, Select, DatePicker, Switch, Space, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { getModelDesc, getModelData, executeModelAction, deleteModelData } from '@/services/ant-design-pro/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface ModelListProps {
    modelName: string;
    onEdit?: (record: Record<string, any>) => void;
    onAdd?: () => void;
}

const ModelList: React.FC<ModelListProps> = ({ modelName, onEdit, onAdd }) => {
    const [messageApi, contextHolder] = message.useMessage();
    const actionRef = useRef<ActionType>(null!);
    const formRef = useRef<ProFormInstance>(null!);

    // 状态管理
    const [modelDesc, setModelDesc] = useState<API.AdminSerializeModel | null>(null);
    const [selectedRowsState, setSelectedRows] = useState<Record<string, any>[]>([]);
    const [searchForm] = Form.useForm();

    // 从 localStorage 获取设置
    const getStoredSettings = useCallback(() => {
        try {
            const settings = localStorage.getItem('admin-settings');
            return settings ? JSON.parse(settings) : {};
        } catch (error) {
            console.error('Failed to parse stored settings:', error);
            return {};
        }
    }, []);

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

    // 获取模型数据的请求函数
    const fetchModelData = useCallback(
        async (params: any) => {
            if (!modelDesc) {
                return { data: [], success: false, total: 0 };
            }

            const storedSettings = getStoredSettings();
            const pageSize = storedSettings.pageSize || modelDesc.attrs.list_per_page || 20;

            // 构建搜索条件
            const conditions: API.Condition[] = [];

            // 从搜索表单获取条件
            const searchValues = searchForm.getFieldsValue();
            Object.entries(searchValues).forEach(([field, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    const fieldConfig = modelDesc.fields[field];
                    if (fieldConfig) {
                        const condition: API.Condition = { field };

                        // 根据字段类型设置搜索条件
                        switch (fieldConfig.type) {
                            case 'CharField':
                            case 'TextField':
                                condition.icontains = String(value);
                                break;
                            case 'IntegerField':
                            case 'FloatField':
                                condition.eq = Number(value);
                                break;
                            case 'BooleanField':
                                condition.eq = value ? 1 : 0;
                                break;
                            case 'DateField':
                            case 'DatetimeField':
                                if (Array.isArray(value) && value.length === 2) {
                                    // 日期范围搜索
                                    const startDate = dayjs.isDayjs(value[0]) ? value[0].format('YYYY-MM-DD') : '';
                                    const endDate = dayjs.isDayjs(value[1]) ? value[1].format('YYYY-MM-DD') : '';
                                    if (startDate && endDate) {
                                        conditions.push(
                                            { field, gte: startDate as any },
                                            { field, lte: endDate as any }
                                        );
                                    }
                                    return;
                                } else if (dayjs.isDayjs(value)) {
                                    condition.eq = value.format('YYYY-MM-DD');
                                }
                                break;
                            default:
                                if (typeof value === 'string' || typeof value === 'number') {
                                    condition.eq = value;
                                }
                        }

                        if (condition.eq !== undefined || condition.lt !== undefined || condition.lte !== undefined ||
                            condition.gt !== undefined || condition.gte !== undefined || condition.contains !== undefined ||
                            condition.icontains !== undefined) {
                            conditions.push(condition);
                        }
                    }
                }
            });

            try {
                const response = await getModelData({
                    name: modelName,
                    page: params.current || 1,
                    size: params.pageSize || pageSize,
                    cond: conditions.length > 0 ? conditions : undefined,
                });

                if (response.code === 0) {
                    return {
                        data: response.data.data,
                        success: true,
                        total: response.data.count,
                    };
                } else {
                    messageApi.error(response.message || 'Failed to fetch data');
                    return { data: [], success: false, total: 0 };
                }
            } catch (error) {
                messageApi.error('Failed to fetch data');
                console.error('Fetch data error:', error);
                return { data: [], success: false, total: 0 };
            }
        },
        [modelDesc, modelName, searchForm, getStoredSettings, messageApi]
    );

    // 删除操作
    const { loading: deleteLoading, run: handleDelete } = useRequest(
        (records: Record<string, any>[]) => deleteModelData({
            name: modelName,
            data: records,
        }),
        {
            manual: true,
            onSuccess: (response) => {
                if (response.code === 0) {
                    messageApi.success('删除成功');
                    setSelectedRows([]);
                    actionRef.current?.reloadAndRest?.();
                } else {
                    messageApi.error(response.message || '删除失败');
                }
            },
            onError: () => {
                messageApi.error('删除失败');
            },
        }
    );

    // 执行批量操作
    const handleBatchAction = useCallback(
        async (actionKey: string, records: Record<string, any>[]) => {
            if (!records.length) {
                messageApi.warning('请选择要操作的记录');
                return;
            }

            try {
                for (const record of records) {
                    await executeModelAction({
                        name: modelName,
                        action: actionKey,
                        data: record,
                    });
                }
                messageApi.success('操作成功');
                setSelectedRows([]);
                actionRef.current?.reloadAndRest?.();
            } catch (error) {
                messageApi.error('操作失败');
                console.error('Batch action error:', error);
            }
        },
        [modelName, messageApi]
    );

    // 执行行级操作
    const handleRowAction = useCallback(
        async (actionKey: string, record: Record<string, any>) => {
            try {
                await executeModelAction({
                    name: modelName,
                    action: actionKey,
                    data: record,
                });
                messageApi.success('操作成功');
                actionRef.current?.reload?.();
            } catch (error) {
                messageApi.error('操作失败');
                console.error('Row action error:', error);
            }
        },
        [modelName, messageApi]
    );

    // 根据字段类型生成 ProTable 列配置
    const generateColumns = useCallback((): ProColumns<Record<string, any>>[] => {
        if (!modelDesc) return [];

        const columns: ProColumns<Record<string, any>>[] = [];

        // 遍历模型字段
        Object.entries(modelDesc.fields).forEach(([fieldName, fieldConfig]) => {
            if (!fieldConfig.show) return;

            const column: ProColumns<Record<string, any>> = {
                title: fieldConfig.name || fieldName,
                dataIndex: fieldName,
                key: fieldName,
                tooltip: fieldConfig.help_text,
                readonly: fieldConfig.readonly,
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

            // 设置搜索相关属性
            if (modelDesc.attrs.list_search?.includes(fieldName)) {
                column.hideInSearch = false;
            } else {
                column.hideInSearch = true;
            }

            // 设置排序
            if (modelDesc.attrs.list_sort?.includes(fieldName)) {
                column.sorter = true;
            }

            columns.push(column);
        });

        // 添加操作列
        if (modelDesc.attrs.can_edit || modelDesc.attrs.can_delete || Object.values(modelDesc.actions || {}).some(action => !action.batch)) {
            columns.push({
                title: '操作',
                dataIndex: 'option',
                valueType: 'option',
                render: (_, record) => {
                    const actions = [];

                    if (modelDesc.attrs.can_edit && onEdit) {
                        actions.push(
                            <Button
                                key="edit"
                                type="link"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => onEdit(record)}
                            >
                                Edit
                            </Button>
                        );
                    }

                    if (modelDesc.attrs.can_delete) {
                        actions.push(
                            <Popconfirm
                                key="delete"
                                title="确定要删除这条记录吗？"
                                onConfirm={() => handleDelete([record])}
                                okText="确定"
                                cancelText="取消"
                            >
                                <Button
                                    type="link"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                >
                                    Delete
                                </Button>
                            </Popconfirm>
                        );
                    }

                    // 添加非批量的自定义操作
                    Object.entries(modelDesc.actions || {}).forEach(([actionKey, action]) => {
                        if (!action.batch) {
                            const actionButton = (
                                <Button
                                    key={actionKey}
                                    type="link"
                                    size="small"
                                    onClick={() => handleRowAction(actionKey, record)}
                                >
                                    {action.name}
                                </Button>
                            );

                            if (action.confirm) {
                                actions.push(
                                    <Popconfirm
                                        key={actionKey}
                                        title={`确定要${action.description}这条记录吗？`}
                                        onConfirm={() => handleRowAction(actionKey, record)}
                                        okText="确定"
                                        cancelText="取消"
                                    >
                                        {actionButton}
                                    </Popconfirm>
                                );
                            } else {
                                actions.push(actionButton);
                            }
                        }
                    });

                    return actions;
                },
            });
        }

        return columns;
    }, [modelDesc, onEdit, handleDelete, handleRowAction]);

    // 生成搜索面板
    const renderSearchPanel = useCallback(() => {
        if (!modelDesc || !modelDesc.attrs.can_search) return null;

        const searchFields = modelDesc.attrs.list_search || [];
        if (searchFields.length === 0) return null;

        return (
            <ProCard title="搜索条件" collapsible style={{ marginBottom: 16 }}>
                <Form
                    form={searchForm}
                    layout="inline"
                    onFinish={() => actionRef.current?.reload?.()}
                >
                    {searchFields.map((fieldName) => {
                        const fieldConfig = modelDesc.fields[fieldName];
                        if (!fieldConfig) return null;

                        const commonProps = {
                            key: fieldName,
                            name: fieldName,
                            label: fieldConfig.name || fieldName,
                            placeholder: `请输入${fieldConfig.name || fieldName}`,
                        };

                        switch (fieldConfig.type) {
                            case 'CharField':
                            case 'TextField':
                                if (fieldConfig.choices && fieldConfig.choices.length > 0) {
                                    return (
                                        <Form.Item {...commonProps}>
                                            <Select
                                                allowClear
                                                placeholder={`请选择${fieldConfig.name || fieldName}`}
                                                style={{ width: 200 }}
                                            >
                                                {fieldConfig.choices.map(([value, label]) => (
                                                    <Select.Option key={value} value={value}>
                                                        {label}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    );
                                }
                                return (
                                    <Form.Item {...commonProps}>
                                        <Input allowClear style={{ width: 200 }} />
                                    </Form.Item>
                                );
                            case 'IntegerField':
                            case 'FloatField':
                                return (
                                    <Form.Item {...commonProps}>
                                        <Input type="number" allowClear style={{ width: 200 }} />
                                    </Form.Item>
                                );
                            case 'BooleanField':
                                return (
                                    <Form.Item {...commonProps} valuePropName="checked">
                                        <Switch />
                                    </Form.Item>
                                );
                            case 'DateField':
                            case 'DatetimeField':
                                return (
                                    <Form.Item {...commonProps}>
                                        <RangePicker style={{ width: 300 }} />
                                    </Form.Item>
                                );
                            default:
                                return (
                                    <Form.Item {...commonProps}>
                                        <Input allowClear style={{ width: 200 }} />
                                    </Form.Item>
                                );
                        }
                    })}
                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                搜索
                            </Button>
                            <Button
                                onClick={() => {
                                    searchForm.resetFields();
                                    actionRef.current?.reload?.();
                                }}
                            >
                                重置
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </ProCard>
        );
    }, [modelDesc, searchForm]);

    // 生成工具栏按钮
    const renderToolBar = useCallback(() => {
        const buttons = [];

        // 添加按钮
        if (modelDesc?.attrs.can_add && onAdd) {
            buttons.push(
                <Button
                    key="add"
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={onAdd}
                >
                    新增
                </Button>
            );
        }

        // 批量操作按钮 - 只显示 batch=true 的操作
        Object.entries(modelDesc?.actions || {}).forEach(([actionKey, action]) => {
            if (action.batch) {
                const batchButton = (
                    <Button
                        key={actionKey}
                        disabled={selectedRowsState.length === 0}
                    >
                        {action.name}
                    </Button>
                );

                if (action.confirm) {
                    buttons.push(
                        <Popconfirm
                            key={actionKey}
                            title={`确定要${action.description}选中的记录吗？`}
                            onConfirm={() => handleBatchAction(actionKey, selectedRowsState)}
                            okText="确定"
                            cancelText="取消"
                        >
                            {batchButton}
                        </Popconfirm>
                    );
                } else {
                    buttons.push(
                        <Button
                            key={actionKey}
                            disabled={selectedRowsState.length === 0}
                            onClick={() => handleBatchAction(actionKey, selectedRowsState)}
                        >
                            {action.name}
                        </Button>
                    );
                }
            }
        });

        return buttons;
    }, [modelDesc, onAdd, selectedRowsState, handleBatchAction]);

    if (descLoading || !modelDesc) {
        return <div>加载中...</div>;
    }

    return (
        <PageContainer>
            {contextHolder}

            {/* 搜索面板 */}
            {renderSearchPanel()}

            {/* 列表展示 */}
            <ProTable<Record<string, any>>
                headerTitle={modelDesc.attrs.help_text || modelName}
                actionRef={actionRef}
                formRef={formRef}
                rowKey={(record) => record.id || record.key || JSON.stringify(record)}
                search={false} // 禁用内置搜索，使用自定义搜索面板
                toolBarRender={() => renderToolBar()}
                request={fetchModelData}
                columns={generateColumns()}
                rowSelection={
                    selectedRowsState && {
                        selectedRowKeys: selectedRowsState.map(item => item.id || item.key || JSON.stringify(item)),
                        onChange: (_, selectedRows) => {
                            setSelectedRows(selectedRows);
                        },
                    }
                }
                pagination={{
                    pageSize: getStoredSettings().pageSize || modelDesc.attrs.list_per_page || 20,
                    showSizeChanger: true,
                    showQuickJumper: true,
                }}
            />
        </PageContainer>
    );
};

export default ModelList;
