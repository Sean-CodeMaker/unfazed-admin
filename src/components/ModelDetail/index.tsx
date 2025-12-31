import {
  ArrowLeftOutlined,
  DeleteOutlined,
  DisconnectOutlined,
  EditOutlined,
  LinkOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import type { ActionType, ProFormInstance } from '@ant-design/pro-components';
import { PageContainer, ProForm, ProTable } from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import { Button, Card, Divider, Modal, Space, Spin, Tabs } from 'antd';
import React, { useCallback, useRef, useState } from 'react';
import {
  deleteModelData,
  getModelData,
  getModelInlines,
  saveModelData,
} from '@/services/api';
import { renderFormField } from '@/utils/formFieldRenderer';
import { CommonProTable } from '../index';
import BackRelationSelectionModal from './BackRelationSelectionModal';
import M2MSelectionModal from './M2MSelectionModal';
import { useInlineOperations } from './useInlineOperations';

interface ModelDetailProps {
  modelName: string;
  routeLabel?: string;
  modelDesc: API.AdminSerializeModel;
  record: Record<string, any>;
  onBack?: () => void;
}

// Utility function: capitalize first letter
const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const ModelDetail: React.FC<ModelDetailProps> = ({
  modelName,
  routeLabel,
  modelDesc,
  record,
  onBack,
}) => {
  const formRef = useRef<ProFormInstance>(null!);

  // Check if create mode
  const isCreateMode = record.id === -1;
  const [hasMainDataSaved, _setHasMainDataSaved] = useState(!isCreateMode);

  // Check if editing is allowed
  const canEdit = modelDesc.attrs.can_edit !== false;

  // Use inline operations hook
  const {
    contextHolder,
    messageApi,
    inlineData,
    editingKeys,
    loadedTabs,
    markTabLoaded,
    handleInlineAction,
    handleInlineSave,
    handleInlineDelete,
    loadInlineData,
    handleM2MAdd,
    handleM2MRemove,
    handleBackRelationLink,
    handleBackRelationUnlink,
    addInlineRecord,
  } = useInlineOperations({ mainRecord: record });

  // State management
  const [activeTab, setActiveTab] = useState('main');
  const [inlineDescs, setInlineDescs] = useState<Record<string, any>>({});
  const [m2mModalVisible, setM2MModalVisible] = useState<
    Record<string, boolean>
  >({});
  const [backRelationModalVisible, setBackRelationModalVisible] = useState<
    Record<string, boolean>
  >({});
  const [linkLoading, setLinkLoading] = useState(false);
  // Global loading state for inline operations
  const [operationLoading, setOperationLoading] = useState(false);
  // Action refs for inline tables to enable reload
  const inlineActionRefs = useRef<Record<string, ActionType | undefined>>({});

  // Memoized request handlers for each inline table to prevent unnecessary re-requests
  const inlineRequestHandlers = useRef<Record<string, any>>({});

  // Track reload timestamps to prevent duplicate reloads
  const lastReloadTime = useRef<Record<string, number>>({});

  // Helper function to reload table with debounce (prevents duplicate requests)
  const debouncedReload = useCallback((inlineName: string) => {
    const now = Date.now();
    const lastTime = lastReloadTime.current[inlineName] || 0;
    if (now - lastTime > 500) {
      // Only reload if more than 500ms since last reload
      lastReloadTime.current[inlineName] = now;
      inlineActionRefs.current[inlineName]?.reload();
    }
  }, []);

  // Create stable request handler for back relation tables
  const createBackRelationRequestHandler = useCallback(
    (inlineName: string, inlineDesc: any) => {
      // Return cached handler if exists
      const cacheKey = `bk_${inlineName}`;
      if (inlineRequestHandlers.current[cacheKey]) {
        return inlineRequestHandlers.current[cacheKey];
      }

      // Create new handler
      const handler = async (params: any) => {
        try {
          const relation = inlineDesc.relation;
          // Build base conditions for back relation
          const baseConditions = [
            {
              field: relation.target_field,
              eq: record[relation.source_field],
            },
          ];

          // Add search conditions
          const searchFields = inlineDesc.attrs?.list_search || [];
          const searchConditions: any[] = [];
          Object.entries(params).forEach(([key, value]) => {
            if (
              value &&
              key !== 'current' &&
              key !== 'pageSize' &&
              searchFields.includes(key)
            ) {
              searchConditions.push({
                field: key,
                icontains: String(value),
              });
            }
          });

          const response = await getModelData({
            name: inlineName,
            page: params.current || 1,
            size: params.pageSize || inlineDesc.attrs?.list_per_page || 10,
            cond: [...baseConditions, ...searchConditions],
          });

          if (response?.code === 0) {
            return {
              data: response.data?.data || [],
              total: response.data?.count || 0,
              success: true,
            };
          }

          return { data: [], total: 0, success: false };
        } catch (error) {
          console.error('Request error:', error);
          return { data: [], total: 0, success: false };
        }
      };

      // Cache it
      inlineRequestHandlers.current[cacheKey] = handler;
      return handler;
    },
    [record],
  );

  // Create stable request handler for forward relation (fk/o2o) tables
  const createForwardRelationRequestHandler = useCallback(
    (inlineName: string, inlineDesc: any) => {
      // Return cached handler if exists
      const cacheKey = `fk_${inlineName}`;
      if (inlineRequestHandlers.current[cacheKey]) {
        return inlineRequestHandlers.current[cacheKey];
      }

      // Create new handler
      const handler = async (params: any) => {
        try {
          const fkRelation = inlineDesc.relation;
          // Build base conditions for fk/o2o relation
          const baseConditions = [
            {
              field: fkRelation.source_field,
              eq: record[fkRelation.target_field],
            },
          ];

          // Add search conditions
          const searchFields = inlineDesc.attrs?.list_search || [];
          const searchConditions: any[] = [];
          Object.entries(params).forEach(([key, value]) => {
            if (
              value &&
              key !== 'current' &&
              key !== 'pageSize' &&
              searchFields.includes(key)
            ) {
              searchConditions.push({
                field: key,
                icontains: String(value),
              });
            }
          });

          const response = await getModelData({
            name: inlineName,
            page: params.current || 1,
            size: params.pageSize || inlineDesc.attrs?.list_per_page || 10,
            cond: [...baseConditions, ...searchConditions],
          });

          if (response?.code === 0) {
            return {
              data: response.data?.data || [],
              total: response.data?.count || 0,
              success: true,
            };
          }

          return { data: [], total: 0, success: false };
        } catch (error) {
          console.error('Request error:', error);
          return { data: [], total: 0, success: false };
        }
      };

      // Cache it
      inlineRequestHandlers.current[cacheKey] = handler;
      return handler;
    },
    [record],
  );

  // Create stable request handler for M2M tables
  // M2M table shows ONLY linked records
  const createM2MRequestHandler = useCallback(
    (inlineName: string, inlineDesc: any) => {
      // Return cached handler if exists
      const cacheKey = `m2m_${inlineName}`;
      if (inlineRequestHandlers.current[cacheKey]) {
        return inlineRequestHandlers.current[cacheKey];
      }

      // Create new handler
      const handler = async (params: any) => {
        try {
          const m2mRelation = inlineDesc.relation;
          const throughInfo = m2mRelation?.through;

          if (!throughInfo) {
            return { data: [], total: 0, success: false };
          }

          // Step 1: Get linked IDs from through table
          const throughResponse = await getModelData({
            name: throughInfo.through,
            page: 1,
            size: 10000, // Get all linked IDs
            cond: [
              {
                field: throughInfo.source_to_through_field,
                eq: record[throughInfo.source_field],
              },
            ],
          });

          if (throughResponse?.code !== 0) {
            return { data: [], total: 0, success: false };
          }

          const linkedIds = (throughResponse.data?.data || []).map(
            (item: any) => item[throughInfo.target_to_through_field],
          );

          if (linkedIds.length === 0) {
            return { data: [], total: 0, success: true };
          }

          // Step 2: Build conditions for target table
          const baseConditions = [
            {
              field: throughInfo.target_field,
              in: linkedIds,
            },
          ];

          // Add search conditions
          const searchFields = inlineDesc.attrs?.list_search || [];
          const searchConditions: any[] = [];
          Object.entries(params).forEach(([key, value]) => {
            if (
              value &&
              key !== 'current' &&
              key !== 'pageSize' &&
              searchFields.includes(key)
            ) {
              searchConditions.push({
                field: key,
                icontains: String(value),
              });
            }
          });

          // Step 3: Get target records with pagination
          const targetModelName = m2mRelation.target || inlineName;
          const response = await getModelData({
            name: targetModelName,
            page: params.current || 1,
            size: params.pageSize || inlineDesc.attrs?.list_per_page || 10,
            cond: [...baseConditions, ...searchConditions],
          });

          if (response?.code === 0) {
            return {
              data: response.data?.data || [],
              total: response.data?.count || 0,
              success: true,
            };
          }

          return { data: [], total: 0, success: false };
        } catch (error) {
          console.error('M2M request error:', error);
          return { data: [], total: 0, success: false };
        }
      };

      // Cache it
      inlineRequestHandlers.current[cacheKey] = handler;
      return handler;
    },
    [record],
  );

  // Load inline model data
  const { loading: detailLoading } = useRequest(
    async () => {
      return await getModelInlines({
        name: modelName,
        data: record,
      });
    },
    {
      manual: false,
      onSuccess: (resp: any) => {
        if (formRef.current && record) {
          formRef.current.setFieldsValue(record);
        }
        setInlineDescs(resp || {});
      },
    },
  );

  // Handle tab change
  const handleTabChange = useCallback(
    (key: string) => {
      if (key !== 'main' && !hasMainDataSaved) {
        messageApi.warning(
          'Please save the main data first before accessing related data',
        );
        return;
      }

      setActiveTab(key);

      // Mark tab as loaded (CommonProTable's onRequest will handle data fetching)
      if (key !== 'main' && !loadedTabs.has(key)) {
        markTabLoaded(key);
      }
    },
    [loadedTabs, hasMainDataSaved, messageApi, markTabLoaded],
  );

  // Delete main record
  const handleDelete = async () => {
    Modal.confirm({
      title: 'Confirm Delete',
      content: 'Are you sure you want to delete this record?',
      onOk: async () => {
        try {
          const response = await deleteModelData({
            name: modelName,
            data: record,
          });

          if (response?.code === 0) {
            messageApi.success('Deleted successfully');
            onBack?.();
          } else {
            messageApi.error(response?.message || 'Delete failed');
          }
        } catch (_error) {
          messageApi.error('Delete failed');
        }
      },
    });
  };

  // Render inline component based on relation type
  const renderInlineComponent = useCallback(
    (inlineName: string) => {
      const inlineDesc = inlineDescs[inlineName];
      const data = inlineData[inlineName] || [];
      const relationType = (inlineDesc as any)?.relation?.relation;
      const isLoaded = loadedTabs.has(inlineName);

      if (!inlineDesc) return null;

      if (!isLoaded) {
        return (
          <Card>
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <span>Loading...</span>
            </div>
          </Card>
        );
      }

      switch (relationType) {
        case 'm2m': {
          // M2M table uses request mode to show ONLY linked records with pagination
          // Use stable request handler to prevent unnecessary re-requests
          const handleM2MRequest = createM2MRequestHandler(
            inlineName,
            inlineDesc,
          );

          return (
            <Card>
              <CommonProTable
                modelDesc={{
                  ...inlineDesc,
                  attrs: {
                    ...inlineDesc.attrs,
                    can_add: false,
                    can_edit: false,
                    can_delete: false,
                  },
                }}
                modelName={inlineName}
                onRequest={handleM2MRequest}
                onAction={(
                  actionKey: string,
                  action: any,
                  actionRecord?: any,
                  isBatch?: boolean,
                  records?: any[],
                ) => {
                  handleInlineAction(
                    inlineName,
                    actionKey,
                    action,
                    actionRecord,
                    isBatch,
                    records,
                  );
                }}
                onUnlink={async (unlinkRecord: any) => {
                  setOperationLoading(true);
                  try {
                    await handleM2MRemove(inlineName, inlineDesc, unlinkRecord);
                    debouncedReload(inlineName);
                  } finally {
                    setOperationLoading(false);
                  }
                }}
                onLink={() =>
                  setM2MModalVisible((prev) => ({
                    ...prev,
                    [inlineName]: true,
                  }))
                }
                actionRef={
                  {
                    get current() {
                      return inlineActionRefs.current[inlineName];
                    },
                    set current(ref: ActionType | undefined) {
                      inlineActionRefs.current[inlineName] = ref;
                    },
                  } as React.MutableRefObject<ActionType | undefined>
                }
                tableProps={{
                  pagination: {
                    defaultPageSize: inlineDesc.attrs?.list_per_page || 10,
                    pageSizeOptions: inlineDesc.attrs
                      ?.list_per_page_options || [10, 20, 50, 100],
                    showSizeChanger: true,
                    showQuickJumper: true,
                  },
                }}
              />
            </Card>
          );
        }

        case 'fk':
        case 'o2o': {
          // Use stable request handler to prevent unnecessary re-requests
          const handleFkRequest = createForwardRelationRequestHandler(
            inlineName,
            inlineDesc,
          );

          return (
            <Card>
              <CommonProTable
                modelDesc={{
                  ...inlineDesc,
                  attrs: {
                    ...inlineDesc.attrs,
                    can_add: false, // Disable Add button for inline tables
                    can_edit: false, // Disable Edit button for inline tables
                  },
                }}
                modelName={inlineName}
                onRequest={handleFkRequest}
                onAction={(
                  actionKey: string,
                  action: any,
                  actionRecord?: any,
                  isBatch?: boolean,
                  records?: any[],
                ) => {
                  handleInlineAction(
                    inlineName,
                    actionKey,
                    action,
                    actionRecord,
                    isBatch,
                    records,
                  );
                }}
                onSave={async (saveRecord: any) => {
                  setOperationLoading(true);
                  try {
                    await handleInlineSave(inlineName, saveRecord);
                    debouncedReload(inlineName);
                  } finally {
                    setOperationLoading(false);
                  }
                }}
                onDelete={async (deleteRecord: any) => {
                  setOperationLoading(true);
                  try {
                    await handleInlineDelete(inlineName, deleteRecord);
                    debouncedReload(inlineName);
                  } finally {
                    setOperationLoading(false);
                  }
                }}
                actionRef={
                  {
                    get current() {
                      return inlineActionRefs.current[inlineName];
                    },
                    set current(ref: ActionType | undefined) {
                      inlineActionRefs.current[inlineName] = ref;
                    },
                  } as React.MutableRefObject<ActionType | undefined>
                }
                tableProps={{
                  pagination: {
                    defaultPageSize: inlineDesc.attrs?.list_per_page || 10,
                    pageSizeOptions: inlineDesc.attrs
                      ?.list_per_page_options || [10, 20, 50, 100],
                    showSizeChanger: true,
                    showQuickJumper: true,
                  },
                }}
              />
            </Card>
          );
        }

        case 'bk_fk':
        case 'bk_o2o': {
          // For back relations, use Link/Unlink instead of Add/Edit/Delete
          // Use stable request handler to prevent unnecessary re-requests
          const handleRequest = createBackRelationRequestHandler(
            inlineName,
            inlineDesc,
          );

          return (
            <Card>
              <CommonProTable
                modelDesc={{
                  ...inlineDesc,
                  attrs: {
                    ...inlineDesc.attrs,
                    can_add: false, // Disable Add button for back relation tables
                    can_edit: false, // Disable Edit button for back relation tables
                    can_delete: false, // Disable Delete button, use Unlink instead
                  },
                }}
                modelName={inlineName}
                onRequest={handleRequest}
                onAction={(
                  actionKey: string,
                  action: any,
                  actionRecord?: any,
                  isBatch?: boolean,
                  records?: any[],
                ) => {
                  handleInlineAction(
                    inlineName,
                    actionKey,
                    action,
                    actionRecord,
                    isBatch,
                    records,
                  );
                }}
                onUnlink={async (unlinkRecord: any) => {
                  setOperationLoading(true);
                  try {
                    await handleBackRelationUnlink(
                      inlineName,
                      inlineDesc,
                      unlinkRecord,
                    );
                    debouncedReload(inlineName);
                  } finally {
                    setOperationLoading(false);
                  }
                }}
                onLink={() =>
                  setBackRelationModalVisible((prev) => ({
                    ...prev,
                    [inlineName]: true,
                  }))
                }
                // bk_o2o can always open modal to change the linked record
                linkDisabled={false}
                actionRef={
                  {
                    get current() {
                      return inlineActionRefs.current[inlineName];
                    },
                    set current(ref: ActionType | undefined) {
                      inlineActionRefs.current[inlineName] = ref;
                    },
                  } as React.MutableRefObject<ActionType | undefined>
                }
                tableProps={{
                  pagination: {
                    defaultPageSize: inlineDesc.attrs?.list_per_page || 10,
                    pageSizeOptions: inlineDesc.attrs
                      ?.list_per_page_options || [10, 20, 50, 100],
                    showSizeChanger: true,
                    showQuickJumper: true,
                  },
                }}
              />
            </Card>
          );
        }

        default:
          console.error(
            `Unsupported relation type: ${(inlineDesc as any)?.relation?.relation}`,
          );
          return (
            <Card>
              <div
                style={{ padding: 16, textAlign: 'center', color: '#ff4d4f' }}
              >
                Unsupported relation type:{' '}
                {(inlineDesc as any)?.relation?.relation}
              </div>
            </Card>
          );
      }
    },
    [
      inlineDescs,
      inlineData,
      record,
      editingKeys,
      handleInlineSave,
      handleInlineDelete,
      loadedTabs,
      handleInlineAction,
      handleM2MRemove,
      handleBackRelationUnlink,
      addInlineRecord,
      createBackRelationRequestHandler,
      createForwardRelationRequestHandler,
      createM2MRequestHandler,
      debouncedReload,
    ],
  );

  if (detailLoading || !modelDesc) {
    return <div>Loading...</div>;
  }

  // Prepare tab items
  const tabItems = [
    {
      key: 'main',
      label: 'Main',
      children: (
        <Card>
          <ProForm
            formRef={formRef}
            layout="horizontal"
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
            initialValues={record}
            onFinish={async (values) => {
              try {
                const dataToSave = isCreateMode
                  ? values
                  : { ...record, ...values };

                const response = await saveModelData({
                  name: modelName,
                  data: dataToSave,
                });

                if (response?.code === 0) {
                  messageApi.success(
                    isCreateMode
                      ? 'Created successfully'
                      : 'Saved successfully',
                  );
                  onBack?.();
                } else {
                  messageApi.error(response?.message || 'Save failed');
                }
              } catch (error) {
                messageApi.error('Save failed');
                console.error('Save error:', error);
              }
            }}
            submitter={{
              render: () =>
                canEdit ? (
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SaveOutlined />}
                    >
                      Save
                    </Button>
                  </Space>
                ) : null,
            }}
          >
            <Divider orientation="left">Basic Information</Divider>
            {(() => {
              // Get detail config from attrs
              const detailDisplay = (modelDesc.attrs as any)?.detail_display as
                | string[]
                | undefined;
              const detailOrder = (modelDesc.attrs as any)?.detail_order as
                | string[]
                | undefined;
              const detailEditable = (modelDesc.attrs as any)
                ?.detail_editable as string[] | undefined;

              // Debug: log detail_display configuration
              console.log('=== ModelDetail Debug ===');
              console.log('detail_display:', detailDisplay);
              console.log('detail_editable:', detailEditable);
              console.log('can_edit:', canEdit);
              console.log('all fields:', Object.keys(modelDesc.fields));

              // Get field entries
              let fieldEntries = Object.entries(modelDesc.fields);

              // Filter by detail_display if defined
              if (detailDisplay && detailDisplay.length > 0) {
                fieldEntries = fieldEntries.filter(([fieldName]) =>
                  detailDisplay.includes(fieldName),
                );
                console.log(
                  'after detail_display filter:',
                  fieldEntries.map(([name]) => name),
                );
              } else {
                console.log('detail_display not applied (empty or undefined)');
              }

              // Sort by detail_order if defined
              console.log('detail_order:', detailOrder);
              if (detailOrder && detailOrder.length > 0) {
                console.log(
                  'before detail_order sort:',
                  fieldEntries.map(([name]) => name),
                );
                fieldEntries = fieldEntries.sort(([a], [b]) => {
                  const indexA = detailOrder.indexOf(a);
                  const indexB = detailOrder.indexOf(b);
                  const orderA =
                    indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
                  const orderB =
                    indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
                  return orderA - orderB;
                });
                console.log(
                  'after detail_order sort:',
                  fieldEntries.map(([name]) => name),
                );
              } else {
                console.log('detail_order not applied (empty or undefined)');
              }

              return fieldEntries.map(
                ([fieldName, fieldConfig]: [string, any]) => {
                  if (!fieldConfig.show) {
                    console.log(`field "${fieldName}" hidden by show=false`);
                    return null;
                  }
                  console.log(`rendering field: ${fieldName}`);

                  // Determine if field is editable
                  // If can_edit is false, all fields are readonly
                  let isReadonly = !canEdit || fieldConfig.readonly;
                  console.log(
                    `  ${fieldName} initial readonly:`,
                    isReadonly,
                    `(canEdit: ${canEdit}, fieldConfig.readonly: ${fieldConfig.readonly})`,
                  );

                  if (
                    canEdit &&
                    !isReadonly &&
                    detailEditable &&
                    detailEditable.length > 0
                  ) {
                    isReadonly = !detailEditable.includes(fieldName);
                    console.log(
                      `  ${fieldName} after detail_editable check:`,
                      isReadonly,
                      `(in list: ${detailEditable.includes(fieldName)})`,
                    );
                  }

                  return renderFormField(fieldName, fieldConfig, formRef, {
                    commonProps: {
                      readonly: isReadonly,
                      rules: fieldConfig.required
                        ? [
                            {
                              required: true,
                              message: `${fieldConfig.name || fieldName} is required`,
                            },
                          ]
                        : [],
                    },
                  });
                },
              );
            })()}
          </ProForm>
        </Card>
      ),
    },
    // Only show inline tabs when main data is saved
    ...(hasMainDataSaved
      ? Object.keys(inlineDescs).map((inlineName) => ({
          key: inlineName,
          label:
            inlineDescs[inlineName]?.attrs?.label ||
            capitalizeFirstLetter(inlineName),
          children: renderInlineComponent(inlineName),
        }))
      : []),
  ];

  return (
    <PageContainer
      header={{
        title: isCreateMode
          ? `Create New ${routeLabel || modelName}`
          : `${routeLabel || modelName} Detail`,
        breadcrumb: {},
        extra: [
          <Button key="back" icon={<ArrowLeftOutlined />} onClick={onBack}>
            Back
          </Button>,
          modelDesc.attrs.can_delete &&
            !isCreateMode &&
            activeTab === 'main' && (
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

      <Spin spinning={operationLoading} tip="Processing...">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
        />
      </Spin>

      {/* M2M relation selection modals */}
      {Object.entries(m2mModalVisible).map(([inlineName, visible]) => {
        if (!visible || !inlineDescs[inlineName]) return null;

        const inlineDesc = inlineDescs[inlineName];
        const relation = inlineDesc.relation;

        return (
          <M2MSelectionModal
            key={inlineName}
            visible={visible}
            title={inlineDesc.attrs?.verbose_name || inlineName}
            modelDesc={inlineDesc}
            relation={relation}
            mainRecordId={record[relation.through.source_field]}
            onCancel={() => {
              setM2MModalVisible((prev) => ({ ...prev, [inlineName]: false }));
            }}
            onOk={async (
              newSelectedIds,
              selectedRecords,
              initialSelectedIds,
            ) => {
              try {
                const addedIds = newSelectedIds.filter(
                  (id) => !initialSelectedIds.includes(id),
                );
                const removedIds = initialSelectedIds.filter(
                  (id) => !newSelectedIds.includes(id),
                );

                // Add new relations one by one
                const recordsToAdd = addedIds
                  .map((addedId) =>
                    selectedRecords.find((item) => item.id === addedId),
                  )
                  .filter(Boolean);

                if (recordsToAdd.length > 0) {
                  await handleM2MAdd(inlineName, inlineDesc, recordsToAdd);
                }

                // Remove relations one by one
                const recordsToRemove = removedIds
                  .map((removedId) =>
                    selectedRecords.find((item) => item.id === removedId),
                  )
                  .filter(Boolean);

                if (recordsToRemove.length > 0) {
                  await handleM2MRemove(
                    inlineName,
                    inlineDesc,
                    recordsToRemove,
                  );
                }

                // Reload the inline table
                debouncedReload(inlineName);
              } catch (error) {
                console.error('M2M operation error:', error);
                messageApi.error('Operation failed');
              }
            }}
          />
        );
      })}

      {/* Back relation (bk_fk/bk_o2o) selection modals */}
      {Object.entries(backRelationModalVisible).map(([inlineName, visible]) => {
        if (!visible || !inlineDescs[inlineName]) return null;

        const inlineDesc = inlineDescs[inlineName];
        const relation = inlineDesc.relation;
        const isBkO2O = relation?.relation === 'bk_o2o';

        return (
          <BackRelationSelectionModal
            key={inlineName}
            visible={visible}
            title={inlineDesc.attrs?.label || inlineName}
            modelName={inlineName}
            modelDesc={inlineDesc}
            relation={relation}
            mainRecordId={record.id}
            isSingleSelect={isBkO2O}
            loading={linkLoading}
            onCancel={() => {
              setBackRelationModalVisible((prev) => ({
                ...prev,
                [inlineName]: false,
              }));
            }}
            onLink={async (selectedRecords, unlinkedRecords) => {
              setLinkLoading(true);
              try {
                // Handle newly linked records
                if (selectedRecords.length > 0) {
                  await handleBackRelationLink(
                    inlineName,
                    inlineDesc,
                    selectedRecords,
                  );
                }

                // Handle unlinked records (set FK to -1)
                if (unlinkedRecords.length > 0) {
                  for (const unlinkRecord of unlinkedRecords) {
                    await handleBackRelationUnlink(
                      inlineName,
                      inlineDesc,
                      unlinkRecord,
                    );
                  }
                }

                setBackRelationModalVisible((prev) => ({
                  ...prev,
                  [inlineName]: false,
                }));

                // Reload the inline table after linking/unlinking
                debouncedReload(inlineName);
              } finally {
                setLinkLoading(false);
              }
            }}
          />
        );
      })}
    </PageContainer>
  );
};

export default ModelDetail;
