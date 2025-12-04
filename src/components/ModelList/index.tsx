import type { ActionType } from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import { Modal, Table } from 'antd';
import React, { useCallback, useRef, useState } from 'react';
import { FileUploadModal, StringInputModal } from '@/components/ActionModals';
import { useModelOperations } from '@/hooks/useModelOperations';
import { deleteModelData, getModelDesc } from '@/services/api';
import { CommonProTable } from '../index';

interface ModelListProps {
  modelName: string;
  onDetail?: (record: Record<string, any>) => void;
  onModelDescLoaded?: (modelDesc: API.AdminSerializeModel) => void;
}

const ModelList: React.FC<ModelListProps> = ({
  modelName,
  onDetail,
  onModelDescLoaded,
}) => {
  const actionRef = useRef<ActionType>(null!);
  // Use ref to store latest search params (avoids async state update issues)
  const latestSearchParamsRef = useRef<Record<string, any>>({});

  // 使用自定义 Hook
  const {
    contextHolder,
    messageApi,
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
  const [modelDesc, setModelDesc] = useState<API.AdminSerializeModel | null>(
    null,
  );
  const [_editableKeys, setEditableRowKeys] = useState<React.Key[]>([]);

  // Action Modal 状态
  const [stringModalVisible, setStringModalVisible] = useState(false);
  const [fileModalVisible, setFileModalVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState<{
    actionKey: string;
    actionConfig: any;
    record?: Record<string, any>;
    isBatch?: boolean;
    records?: Record<string, any>[];
    searchParams?: Record<string, any>;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // 获取模型描述
  const { loading: descLoading } = useRequest(
    async () => {
      // 直接调用 API 而不是通过 fetchModelDesc，确保使用最新的 modelName
      const response = await getModelDesc(modelName);
      if (response?.code === 0) {
        const modelDescData = response.data;
        setModelDesc(modelDescData);
        onModelDescLoaded?.(modelDescData); // 通知父组件
        return modelDescData;
      } else {
        console.error('ModelList: getModelDesc failed:', response);
        return null;
      }
    },
    {
      manual: false,
      refreshDeps: [modelName], // 当 modelName 变化时重新请求
    },
  );

  // 包装数据获取函数
  const wrappedFetchModelData = useCallback(
    async (params: any) => {
      // Save latest search params to ref for batch actions
      latestSearchParamsRef.current = params;
      return await fetchModelData(params, modelDesc || undefined);
    },
    [fetchModelData, modelDesc],
  );

  // 显示数据弹窗
  const showDisplayModal = (data: any, actionConfig: any) => {
    const displayData = Array.isArray(data) ? data : [data];

    // 生成列配置
    const columns =
      displayData.length > 0
        ? Object.keys(displayData[0]).map((key) => ({
            title:
              key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
            dataIndex: key,
            key,
            ellipsis: true,
            render: (value: any) => {
              if (value === null || value === undefined) return '-';
              if (typeof value === 'boolean') return value ? '✓' : '✗';
              if (typeof value === 'object') return JSON.stringify(value);
              return String(value);
            },
          }))
        : [];

    Modal.info({
      title: actionConfig?.description || 'Action Result',
      width: Math.min(1000, window.innerWidth * 0.8),
      content: (
        <Table
          dataSource={displayData}
          columns={columns}
          pagination={{ pageSize: 10 }}
          size="small"
          rowKey={(record, index) => record.id || index}
          scroll={{ x: 'max-content' }}
        />
      ),
      onOk() {
        // Modal 关闭后的回调
      },
    });
  };

  // 执行Action的核心逻辑
  const executeAction = useCallback(
    async (
      actionKey: string,
      _actionConfig: any,
      record?: Record<string, any>,
      isBatch = false,
      records: Record<string, any>[] = [],
      extra?: any,
      searchParams?: Record<string, any>,
    ) => {
      setActionLoading(true);
      try {
        let result: any;
        if (isBatch) {
          result = await executeBatchAction(
            actionKey,
            records,
            modelDesc || undefined,
            extra,
            searchParams,
          );
        } else {
          result = await executeRowAction(
            actionKey,
            record || {},
            modelDesc || undefined,
            extra,
          );
        }

        if (result.success) {
          // 处理display类型的输出
          if (
            (result.actionConfig as any)?.output === 'display' &&
            result.data
          ) {
            showDisplayModal(result.data, result.actionConfig);
          } else {
            // 其他类型的输出已在hook中处理
            actionRef.current?.reload?.();
          }
        }
      } catch (error) {
        console.error('Action execution error:', error);
      } finally {
        setActionLoading(false);
      }
    },
    [executeBatchAction, executeRowAction, modelDesc],
  );

  // 触发Action（根据input类型）
  const triggerAction = useCallback(
    (
      actionKey: string,
      actionConfig: any,
      record?: Record<string, any>,
      isBatch = false,
      records: Record<string, any>[] = [],
      searchParams?: Record<string, any>,
    ) => {
      // Use latestSearchParamsRef if searchParams has no valid values
      const hasValidSearchParams =
        searchParams &&
        Object.values(searchParams).some(
          (v) => v !== undefined && v !== null && v !== '',
        );
      const effectiveSearchParams = hasValidSearchParams
        ? searchParams
        : latestSearchParamsRef.current;

      setCurrentAction({
        actionKey,
        actionConfig,
        record,
        isBatch,
        records,
        searchParams: effectiveSearchParams,
      });

      switch (actionConfig.input) {
        case 'string':
          setStringModalVisible(true);
          break;
        case 'file':
          setFileModalVisible(true);
          break;
        default:
          // 直接执行
          executeAction(
            actionKey,
            actionConfig,
            record,
            isBatch,
            records,
            undefined,
            effectiveSearchParams,
          );
          break;
      }
    },
    [executeAction],
  );

  // 字符串输入Modal的确认处理
  const handleStringInputConfirm = useCallback(
    (inputValue: string) => {
      if (currentAction) {
        const extra = { input: inputValue };
        executeAction(
          currentAction.actionKey,
          currentAction.actionConfig,
          currentAction.record,
          currentAction.isBatch,
          currentAction.records || [],
          extra,
          currentAction.searchParams,
        );
      }
      setStringModalVisible(false);
      setCurrentAction(null);
    },
    [currentAction, executeAction],
  );

  // 文件上传Modal的确认处理
  const handleFileUploadConfirm = useCallback(
    (files: File[]) => {
      if (currentAction) {
        // 这里应该将文件转换为后端需要的格式
        // 可以是base64编码或者FormData，根据后端要求调整
        const filePromises = files.map((file) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                name: file.name,
                size: file.size,
                type: file.type,
                content: reader.result, // base64 data URL
              });
            };
            reader.readAsDataURL(file);
          });
        });

        Promise.all(filePromises).then((filesData) => {
          const extra = { files: filesData };
          executeAction(
            currentAction.actionKey,
            currentAction.actionConfig,
            currentAction.record,
            currentAction.isBatch,
            currentAction.records || [],
            extra,
            currentAction.searchParams,
          );
        });
      }
      setFileModalVisible(false);
      setCurrentAction(null);
    },
    [currentAction, executeAction],
  );

  // Modal取消处理
  const handleModalCancel = useCallback(() => {
    setStringModalVisible(false);
    setFileModalVisible(false);
    setCurrentAction(null);
    setActionLoading(false);
  }, []);

  // 保存编辑的数据
  const handleSave = useCallback(
    async (key: React.Key, record: Record<string, any>) => {
      const success = await saveData(record);
      if (success) {
        setEditableRowKeys((prevKeys) => prevKeys.filter((k) => k !== key));
        actionRef.current?.reload?.();
      }
    },
    [saveData],
  );

  if (descLoading || !modelDesc) {
    return <div>Loading...</div>;
  }

  return (
    <PageContainer>
      {contextHolder}

      {/* Action Modals */}
      <StringInputModal
        visible={stringModalVisible}
        title={(currentAction?.actionConfig as any)?.label || 'Input Required'}
        description={currentAction?.actionConfig?.description}
        onOk={handleStringInputConfirm}
        onCancel={handleModalCancel}
        loading={actionLoading}
      />

      <FileUploadModal
        visible={fileModalVisible}
        title={(currentAction?.actionConfig as any)?.label || 'Upload Files'}
        description={currentAction?.actionConfig?.description}
        onOk={handleFileUploadConfirm}
        onCancel={handleModalCancel}
        loading={actionLoading}
      />

      {/* 列表展示 */}
      <CommonProTable
        modelDesc={modelDesc}
        modelName={modelName}
        onDetail={onDetail}
        actionRef={actionRef}
        onAction={(
          actionKey: string,
          action: any,
          record?: any,
          isBatch?: boolean,
          records?: any[],
          searchParams?: Record<string, any>,
        ) => {
          if (actionKey === 'add') {
            // 处理新增操作：跳转到 ModelDetail，使用 id = -1 表示新建模式
            const newRecord = { id: -1 };
            onDetail?.(newRecord);
          } else {
            triggerAction(
              actionKey,
              action,
              record,
              isBatch,
              records || [],
              searchParams,
            );
          }
        }}
        onSave={async (record: any) => {
          await handleSave(
            record.id || record.key || JSON.stringify(record),
            record,
          );
        }}
        onDelete={async (record: any) => {
          try {
            const response = await deleteModelData({
              name: modelName,
              data: record,
            });

            if (response?.code === 0) {
              messageApi.success('Deleted successfully');
              actionRef.current?.reload?.();
            } else {
              messageApi.error(response?.message || 'Delete failed');
            }
          } catch (_error) {
            messageApi.error('Delete failed');
          }
        }}
        onRequest={wrappedFetchModelData}
        tableProps={{
          pagination: {
            defaultPageSize:
              getStoredSettings().pageSize ||
              modelDesc.attrs.list_per_page ||
              20,
            showSizeChanger: true,
            showQuickJumper: true,
          },
        }}
      />
    </PageContainer>
  );
};

export default ModelList;
