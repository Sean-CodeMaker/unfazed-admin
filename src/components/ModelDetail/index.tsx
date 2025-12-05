import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import type { ProFormInstance } from '@ant-design/pro-components';
import { PageContainer, ProForm, ProTable } from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import { Button, Card, Divider, Modal, Space, Tabs } from 'antd';
import React, { useCallback, useRef, useState } from 'react';
import {
  deleteModelData,
  getModelInlines,
  saveModelData,
} from '@/services/api';
import { renderFormField } from '@/utils/formFieldRenderer';
import { CommonProTable } from '../index';
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
    addInlineRecord,
  } = useInlineOperations({ mainRecord: record });

  // State management
  const [activeTab, setActiveTab] = useState('main');
  const [inlineDescs, setInlineDescs] = useState<Record<string, any>>({});
  const [m2mModalVisible, setM2MModalVisible] = useState<
    Record<string, boolean>
  >({});

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

      if (key !== 'main' && !loadedTabs.has(key)) {
        const inlineDesc = inlineDescs[key];
        if (inlineDesc && record) {
          loadInlineData(key, inlineDesc, record);
          markTabLoaded(key);
        }
      }
    },
    [
      inlineDescs,
      record,
      loadInlineData,
      loadedTabs,
      hasMainDataSaved,
      messageApi,
      markTabLoaded,
    ],
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
          const selectedCount = data.filter((item) => item.selected).length;
          const totalCount = data.length;

          return (
            <Card>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <div>
                  <span style={{ color: '#666' }}>
                    Selected {selectedCount} / {totalCount} items
                  </span>
                </div>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() =>
                    setM2MModalVisible((prev) => ({
                      ...prev,
                      [inlineName]: true,
                    }))
                  }
                >
                  Manage Relation
                </Button>
              </div>

              {selectedCount > 0 && (
                <div style={{ marginTop: 16 }}>
                  <ProTable
                    dataSource={data.filter((item) => item.selected)}
                    columns={[
                      ...Object.entries(inlineDesc.fields || {})
                        .filter(
                          ([_fieldName, fieldConfig]) =>
                            (fieldConfig as any).show !== false,
                        )
                        .slice(0, 3)
                        .map(([fieldName, fieldConfig]) => ({
                          title: (fieldConfig as any).name || fieldName,
                          dataIndex: fieldName,
                          key: fieldName,
                          width: 120,
                          ellipsis: true,
                          render: (value: any) => {
                            if (value === null || value === undefined)
                              return '-';
                            if (
                              typeof value === 'string' &&
                              value.length > 20
                            ) {
                              return `${value.substring(0, 20)}...`;
                            }
                            return value;
                          },
                        })),
                      {
                        title: 'Actions',
                        key: 'actions',
                        width: 80,
                        render: (_: any, record: any) => (
                          <Button
                            type="link"
                            size="small"
                            danger
                            onClick={async () => {
                              await handleM2MRemove(
                                inlineName,
                                inlineDesc,
                                record,
                              );
                            }}
                          >
                            Remove
                          </Button>
                        ),
                      },
                    ]}
                    rowKey="id"
                    size="small"
                    scroll={{ y: 200 }}
                    pagination={{
                      pageSize: 5,
                      size: 'small',
                      showSizeChanger: false,
                      showQuickJumper: false,
                    }}
                    search={false}
                    options={false}
                    toolBarRender={false}
                  />
                </div>
              )}
            </Card>
          );
        }

        case 'fk':
        case 'o2o':
        case 'bk_fk':
        case 'bk_o2o':
          return (
            <Card>
              <CommonProTable
                modelDesc={inlineDesc}
                modelName={inlineName}
                data={data}
                onAction={(
                  actionKey: string,
                  action: any,
                  actionRecord?: any,
                  isBatch?: boolean,
                  records?: any[],
                ) => {
                  if (actionKey === 'add') {
                    const destField =
                      (inlineDesc as any)?.relation?.target_field || 'crown_id';
                    const newRecord = {
                      id: -1,
                      [destField]: record.id,
                    };
                    addInlineRecord(inlineName, newRecord);
                  } else {
                    handleInlineAction(
                      inlineName,
                      actionKey,
                      action,
                      actionRecord,
                      isBatch,
                      records,
                    );
                  }
                }}
                onSave={async (saveRecord: any) => {
                  await handleInlineSave(inlineName, saveRecord);
                }}
                onDelete={async (deleteRecord: any) => {
                  await handleInlineDelete(inlineName, deleteRecord);
                }}
                tableProps={{
                  pagination: {
                    pageSize: inlineDesc.attrs?.list_per_page || 10,
                    pageSizeOptions: inlineDesc.attrs
                      ?.list_per_page_options || [10, 20, 50, 100],
                    showSizeChanger: true,
                    showQuickJumper: true,
                  },
                }}
              />
            </Card>
          );

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
      addInlineRecord,
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
              render: () => (
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                  >
                    Save
                  </Button>
                </Space>
              ),
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

              // Get field entries
              let fieldEntries = Object.entries(modelDesc.fields);

              // Filter by detail_display if defined
              if (detailDisplay && detailDisplay.length > 0) {
                fieldEntries = fieldEntries.filter(([fieldName]) =>
                  detailDisplay.includes(fieldName),
                );
              }

              // Sort by detail_order if defined
              if (detailOrder && detailOrder.length > 0) {
                fieldEntries = fieldEntries.sort(([a], [b]) => {
                  const indexA = detailOrder.indexOf(a);
                  const indexB = detailOrder.indexOf(b);
                  const orderA =
                    indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
                  const orderB =
                    indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
                  return orderA - orderB;
                });
              }

              return fieldEntries.map(
                ([fieldName, fieldConfig]: [string, any]) => {
                  if (!fieldConfig.show) return null;

                  // Determine if field is editable
                  let isReadonly = fieldConfig.readonly;
                  if (
                    !isReadonly &&
                    detailEditable &&
                    detailEditable.length > 0
                  ) {
                    isReadonly = !detailEditable.includes(fieldName);
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
          modelDesc.attrs.can_delete && !isCreateMode && (
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

      <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} />

      {/* M2M relation selection modals */}
      {Object.entries(m2mModalVisible).map(([inlineName, visible]) => {
        if (!visible || !inlineDescs[inlineName]) return null;

        const inlineDesc = inlineDescs[inlineName];
        const data = inlineData[inlineName] || [];
        const selectedIds = data
          .filter((item) => item.selected)
          .map((item) => item.id);

        return (
          <M2MSelectionModal
            key={inlineName}
            visible={visible}
            title={inlineDesc.attrs?.verbose_name || inlineName}
            modelDesc={inlineDesc}
            data={data}
            selectedIds={selectedIds}
            onCancel={() => {
              setM2MModalVisible((prev) => ({ ...prev, [inlineName]: false }));
            }}
            onOk={async (newSelectedIds) => {
              const currentSelectedIds = data
                .filter((item) => item.selected)
                .map((item) => item.id);

              const addedIds = newSelectedIds.filter(
                (id) => !currentSelectedIds.includes(id),
              );
              const removedIds = currentSelectedIds.filter(
                (id) => !newSelectedIds.includes(id),
              );

              try {
                for (const addedId of addedIds) {
                  const targetRecord = data.find((item) => item.id === addedId);
                  if (targetRecord) {
                    await handleM2MAdd(inlineName, inlineDesc, targetRecord);
                  }
                }

                for (const removedId of removedIds) {
                  const targetRecord = data.find(
                    (item) => item.id === removedId,
                  );
                  if (targetRecord) {
                    await handleM2MRemove(inlineName, inlineDesc, targetRecord);
                  }
                }

                await loadInlineData(inlineName, inlineDesc, record);
              } catch (error) {
                console.error('M2M batch operation error:', error);
                messageApi.error('Batch operation failed');
              }
            }}
          />
        );
      })}
    </PageContainer>
  );
};

export default ModelDetail;
