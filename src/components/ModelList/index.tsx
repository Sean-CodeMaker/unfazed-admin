import React, { useCallback, useRef, useState } from 'react';
import type {
    ActionType,
    ProColumns,
    ProFormInstance,
} from '@ant-design/pro-components';
import {
    PageContainer,
    ProTable,
} from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import { Button, Space, Popconfirm, Dropdown, Modal } from 'antd';
import { PlusOutlined, EditOutlined, MoreOutlined, EyeOutlined } from '@ant-design/icons';
import { useModelOperations } from '@/hooks/useModelOperations';
import dayjs from 'dayjs';

interface ModelListProps {
    modelName: string;
    onDetail?: (record: Record<string, any>) => void;
    onAdd?: () => void;
}

const ModelList: React.FC<ModelListProps> = ({ modelName, onDetail, onAdd }) => {
    const actionRef = useRef<ActionType>(null!);
    const formRef = useRef<ProFormInstance>(null!);

    // 使用自定义 Hook
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
            actionRef.current?.reload?.();
        },
    });

    // 状态管理
    const [modelDesc, setModelDesc] = useState<API.AdminSerializeModel | null>(null);
    const [selectedRowsState, setSelectedRows] = useState<Record<string, any>[]>([]);
    const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([]);

    // 获取模型描述
    const { loading: descLoading } = useRequest(
        async () => {
            const modelDescData = await fetchModelDesc();
            if (modelDescData) {
                setModelDesc(modelDescData);
            }
            return modelDescData;
        },
        {
            manual: false,
        }
    );

    // 包装数据获取函数
    const wrappedFetchModelData = useCallback(
        async (params: any) => {
            return await fetchModelData(params, modelDesc || undefined);
        },
        [fetchModelData, modelDesc]
    );



    // 执行批量操作
    const handleBatchAction = useCallback(
        async (actionKey: string, records: Record<string, any>[]) => {
            const success = await executeBatchAction(actionKey, records, modelDesc || undefined);
            if (success) {
                setSelectedRows([]);
                actionRef.current?.reloadAndRest?.();
            }
        },
        [executeBatchAction, modelDesc]
    );

    // 执行行级操作
    const handleRowAction = useCallback(
        async (actionKey: string, record: Record<string, any>) => {
            const success = await executeRowAction(actionKey, record);
            if (success) {
                actionRef.current?.reload?.();
            }
        },
        [executeRowAction]
    );

    // 保存编辑的数据
    const handleSave = useCallback(
        async (key: React.Key, record: Record<string, any>) => {
            const success = await saveData(record, {});
            if (success) {
                setEditableRowKeys(prevKeys => prevKeys.filter(k => k !== key));
                actionRef.current?.reload?.();
            }
        },
        [saveData]
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
                ellipsis: true, // 启用省略号
            };

            // 为 ID 字段设置固定列
            if (fieldName === 'id') {
                column.fixed = 'left';
                column.width = 80;
            }

            // 根据字段类型设置 valueType 和宽度 (如果没有预设宽度)
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
                        if (!column.width) column.width = 120;
                    } else if (fieldConfig.type === 'TextField') {
                        if (!column.width) column.width = 200;
                    } else {
                        if (!column.width) column.width = 150;
                    }
                    break;
                case 'IntegerField':
                    column.valueType = 'digit';
                    if (!column.width) column.width = 100;
                    break;
                case 'FloatField':
                    column.valueType = 'digit';
                    if (!column.width) column.width = 120;
                    break;
                case 'BooleanField':
                    column.valueType = 'switch';
                    if (!column.width) column.width = 80;
                    break;
                case 'DateField':
                    column.valueType = 'date';
                    if (!column.width) column.width = 120;
                    break;
                case 'DatetimeField':
                    column.valueType = 'dateTime';
                    if (!column.width) column.width = 160;
                    break;
                case 'TimeField':
                    column.valueType = 'time';
                    if (!column.width) column.width = 100;
                    break;
                default:
                    column.valueType = 'text';
                    if (!column.width) column.width = 150;
            }

            // 设置搜索相关属性 - 基于 search_fields
            if (modelDesc.attrs.search_fields?.includes(fieldName)) {
                column.hideInSearch = false;
            } else {
                column.hideInSearch = true;
            }

            // 设置排序
            if (modelDesc.attrs.list_sort?.includes(fieldName)) {
                column.sorter = true;
            }

            // 设置筛选
            if (modelDesc.attrs.list_filter?.includes(fieldName) && fieldConfig.choices && fieldConfig.choices.length > 0) {
                column.filters = fieldConfig.choices.map(([value, label]) => ({
                    text: label,
                    value: value,
                }));
                column.onFilter = (value: any, record: Record<string, any>) => {
                    return record[fieldName] === value;
                };
            }



            // 设置可编辑 (对于 EditableProTable)
            if (modelDesc.attrs.editable && !fieldConfig.readonly) {
                column.editable = () => true;
            }

            columns.push(column);
        });

        // 添加操作列 - 始终显示（因为 Detail 按钮总是存在）
        // 计算操作列宽度
        let actionWidth = 80; // 基础宽度
        actionWidth += 60; // Detail 按钮 - 始终存在
        if (modelDesc.attrs.editable) actionWidth += 100; // Edit/Save/Cancel 按钮

        // 非批量操作现在只占用一个 "More" 按钮的宽度
        const nonBatchActions = Object.values(modelDesc.actions || {}).filter(action => !action.batch);
        if (nonBatchActions.length > 0) actionWidth += 60; // More 按钮

        columns.push({
            title: 'Actions',
            dataIndex: 'option',
            valueType: 'option',
            width: Math.min(actionWidth, 300), // 最大宽度 300px
            fixed: 'right', // 固定到右侧
            render: (_, record, __, action) => {
                const actions = [];

                // 添加非批量的自定义操作到下拉菜单 - 移到最前面


                // Detail 按钮 - 始终显示
                actions.push(
                    <Button
                        key="detail"
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => onDetail?.(record)}
                    >
                        Detail
                    </Button>
                );

                // 可编辑模式的操作按钮
                if (modelDesc.attrs.editable) {
                    const recordKey = record.id || record.key || JSON.stringify(record);
                    const isEditing = editableKeys.includes(recordKey);

                    if (isEditing) {
                        // 编辑状态：显示保存和取消按钮
                        actions.push(
                            <Button
                                key="save"
                                type="link"
                                size="small"
                                onClick={async () => {
                                    try {
                                        await handleSave(recordKey, record);
                                    } catch (error) {
                                        console.error('Save error:', error);
                                    }
                                }}
                            >
                                Save
                            </Button>
                        );
                        actions.push(
                            <Button
                                key="cancel"
                                type="link"
                                size="small"
                                onClick={() => {
                                    action?.cancelEditable?.(recordKey);
                                    setEditableRowKeys(prevKeys => prevKeys.filter(k => k !== recordKey));
                                }}
                            >
                                Cancel
                            </Button>
                        );
                    } else {
                        // 非编辑状态：显示编辑按钮
                        actions.push(
                            <Button
                                key="edit-inline"
                                type="link"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => {
                                    action?.startEditable?.(recordKey);
                                    setEditableRowKeys(prevKeys => [...prevKeys, recordKey]);
                                }}
                            >
                                Edit
                            </Button>
                        );
                    }
                }

                const nonBatchActions = Object.entries(modelDesc.actions || {}).filter(([_, action]) => !action.batch);
                if (nonBatchActions.length > 0) {
                    const menuItems = nonBatchActions.map(([actionKey, action]) => ({
                        key: actionKey,
                        label: action.name,
                        onClick: () => {
                            if (action.confirm) {
                                // 使用 Ant Design 的确认对话框
                                Modal.confirm({
                                    title: 'Confirm Action',
                                    content: `Are you sure to ${action.description} this record?`,
                                    okText: 'Confirm',
                                    cancelText: 'Cancel',
                                    onOk: () => {
                                        handleRowAction(actionKey, record);
                                    },
                                });
                            } else {
                                handleRowAction(actionKey, record);
                            }
                        }
                    }));

                    actions.push(
                        <Dropdown
                            key="more"
                            menu={{ items: menuItems }}
                            placement="bottomRight"
                        >
                            <Button
                                type="link"
                                size="small"
                                icon={<MoreOutlined />}
                            >
                                More
                            </Button>
                        </Dropdown>
                    );
                }

                return actions;
            },
        });

        return columns;
    }, [modelDesc, onDetail, handleRowAction, handleSave, editableKeys, setEditableRowKeys]);



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
                    Add
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
                            title={`Are you sure to ${action.description} selected records?`}
                            onConfirm={() => handleBatchAction(actionKey, selectedRowsState)}
                            okText="Confirm"
                            cancelText="Cancel"
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
        return <div>Loading...</div>;
    }

    return (
        <PageContainer>
            {contextHolder}



            {/* 列表展示 */}
            <ProTable<Record<string, any>>
                headerTitle={modelDesc.attrs.help_text || modelName}
                actionRef={actionRef}
                formRef={formRef}
                rowKey={(record) => record.id || record.key || JSON.stringify(record)}
                search={{
                    labelWidth: 120,
                    defaultCollapsed: false,
                    optionRender: (searchConfig, formProps, dom) => [
                        ...dom.reverse(),
                    ],
                }}
                toolBarRender={() => renderToolBar()}
                request={wrappedFetchModelData}
                columns={generateColumns()}
                rowSelection={
                    selectedRowsState && {
                        selectedRowKeys: selectedRowsState.map(item => item.id || item.key || JSON.stringify(item)),
                        onChange: (_, selectedRows) => {
                            setSelectedRows(selectedRows);
                        },
                    }
                }
                editable={
                    modelDesc.attrs.editable ? {
                        type: 'multiple',
                        editableKeys,
                        onChange: setEditableRowKeys,
                        onSave: async (key: any, record: Record<string, any>) => {
                            await handleSave(key, record);
                        },
                        actionRender: (row, config, defaultDom) => {
                            return [defaultDom.save, defaultDom.cancel];
                        },
                    } : undefined
                }
                scroll={{
                    x: 'max-content',
                    y: 'calc(100vh - 400px)'
                }}
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
