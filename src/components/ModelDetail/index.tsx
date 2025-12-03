import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import type { ProFormInstance } from '@ant-design/pro-components';
import { PageContainer, ProForm, ProTable } from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import { Button, Card, Divider, Modal, message, Space, Tabs } from 'antd';
import React, { useCallback, useRef, useState } from 'react';
import {
  deleteModelData,
  executeModelAction,
  getModelData,
  getModelInlines,
  saveModelData,
} from '@/services/api';
import { renderFormField } from '@/utils/formFieldRenderer';
import { CommonProTable } from '../index';

interface ModelDetailProps {
  modelName: string;
  modelDesc: API.AdminSerializeModel;
  record: Record<string, any>;
  onBack?: () => void;
}

const ModelDetail: React.FC<ModelDetailProps> = ({
  modelName,
  modelDesc,
  record,
  onBack,
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const formRef = useRef<ProFormInstance>(null!);

  // 判断是否为新建模式
  const isCreateMode = record.id === -1;
  const [hasMainDataSaved, setHasMainDataSaved] = useState(!isCreateMode);

  // 创建一个通用的 action 处理函数
  const handleInlineAction = useCallback(
    async (
      inlineName: string,
      actionKey: string,
      action: any,
      record?: any,
      isBatch?: boolean,
      _records?: any[],
    ) => {
      try {
        // 构建查询条件
        const cond = record ? [{ field: 'id', eq: record.id }] : [];

        const response = await executeModelAction({
          name: inlineName,
          action: actionKey,
          form_data: {},
          search_condition: isBatch ? [] : cond,
        });

        if (response?.code === 0) {
          // 根据不同的输出类型处理响应
          switch (action.output) {
            case 'toast':
              messageApi.success(
                response.message || 'Action completed successfully',
              );
              break;
            case 'display':
              Modal.info({
                title: action.label || actionKey,
                width: 800,
                content: (
                  <div>
                    {Array.isArray(response.data) ? (
                      <table
                        style={{ width: '100%', borderCollapse: 'collapse' }}
                      >
                        <tbody>
                          {response.data.map((item: any) => (
                            <tr
                              key={item.id}
                              style={{ borderBottom: '1px solid #f0f0f0' }}
                            >
                              <td
                                style={{
                                  padding: '8px',
                                  fontWeight: 'bold',
                                  width: '30%',
                                }}
                              >
                                {item.property}:
                              </td>
                              <td style={{ padding: '8px' }}>{item.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <pre>{JSON.stringify(response.data, null, 2)}</pre>
                    )}
                  </div>
                ),
              });
              break;
            case 'download': {
              const downloadData = response.data?.download;
              if (downloadData?.url) {
                const link = document.createElement('a');
                link.href = downloadData.url;
                link.download = downloadData.filename || 'download';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                messageApi.success('Download started');
              }
              break;
            }
            case 'refresh':
              messageApi.success(
                response.message || 'Action completed successfully',
              );
              // 重新加载该 inline 的数据 - 刷新页面或重新获取数据
              window.location.reload();
              break;
            default:
              messageApi.success(
                response.message || 'Action completed successfully',
              );
          }
        } else {
          messageApi.error(response?.message || 'Action failed');
        }
      } catch (error) {
        messageApi.error('Action failed');
        console.error('Action error:', error);
      }
    },
    [messageApi],
  );

  // 工具函数：首字母大写
  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // 保存单个内联记录
  const handleInlineSave = async (
    inlineName: string,
    record: Record<string, any>,
  ) => {
    try {
      const payload = { ...record };

      const response = await saveModelData({
        name: inlineName,
        data: payload,
      });

      if (response?.code === 0) {
        messageApi.success('Saved successfully');
        // 更新本地数据而不重新请求
        setInlineData((prev) => ({
          ...prev,
          [inlineName]: (prev[inlineName] || []).map((item) =>
            item.id === payload.id ? { ...item, ...payload } : item,
          ),
        }));
        // 退出编辑模式
        setEditingKeys((prev) => ({
          ...prev,
          [inlineName]:
            prev[inlineName]?.filter((key) => key !== record.id) || [],
        }));
      } else {
        messageApi.error(response?.message || 'Save failed');
      }
    } catch (error) {
      messageApi.error('Save failed');
      console.error('Save error:', error);
    }
  };

  // 删除单个内联记录
  const handleInlineDelete = async (
    inlineName: string,
    record: Record<string, any>,
  ) => {
    try {
      const response = await deleteModelData({
        name: inlineName,
        data: record,
      });

      if (response?.code === 0) {
        messageApi.success('Deleted successfully');
        // 更新本地数据
        setInlineData((prev) => ({
          ...prev,
          [inlineName]: (prev[inlineName] || []).filter(
            (item) => item.id !== record.id,
          ),
        }));
      } else {
        messageApi.error(response?.message || 'Delete failed');
      }
    } catch (error) {
      messageApi.error('Delete failed');
      console.error('Delete error:', error);
    }
  };

  // 状态管理
  const [activeTab, setActiveTab] = useState('main');
  const [inlineData, setInlineData] = useState<
    Record<string, Record<string, any>[]>
  >({});
  const [editingKeys, setEditingKeys] = useState<Record<string, any[]>>({});
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['main']));
  const [inlineDescs, setInlineDescs] = useState<Record<string, any>>({});
  const [m2mModalVisible, setM2MModalVisible] = useState<
    Record<string, boolean>
  >({});

  // 内联模型数据请求
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
        // 主表单使用传入的 record
        if (formRef.current && record) {
          formRef.current.setFieldsValue(record);
        }
        setInlineDescs(resp || {});
      },
    },
  );

  // 构建查询条件
  const buildConditions = useCallback(
    (inlineDesc: any, mainRecord: Record<string, any>) => {
      const relation = inlineDesc?.relation;
      if (!relation) return [];

      switch (relation.relation) {
        case 'fk':
          return [
            {
              field: relation.source_field,
              eq: mainRecord[relation.target_field],
            },
          ];
        case 'o2o':
          return [
            {
              field: relation.source_field,
              eq: mainRecord[relation.target_field],
            },
          ];
        case 'bk_fk':
          return [
            {
              field: relation.target_field,
              eq: mainRecord[relation.source_field],
            },
          ];
        case 'bk_o2o':
          return [
            {
              field: relation.target_field,
              eq: mainRecord[relation.source_field],
            },
          ];
        default:
          console.error(`Unsupported relation type: ${relation.relation}`);
          return [];
      }
    },
    [],
  );

  // 加载内联数据
  const loadInlineData = useCallback(
    async (
      inlineName: string,
      inlineDesc: any,
      mainRecord: Record<string, any>,
    ) => {
      try {
        const relation = inlineDesc.relation;

        if (relation?.relation === 'm2m' && relation?.through) {
          // M2M 关系需要加载两个数据源：中间表和目标表
          const { through } = relation;

          // 1. 加载中间表数据（用于确定已选择的关系）
          const throughResponse = await getModelData({
            name: through.through,
            page: 1,
            size: 1000,
            cond: [
              {
                field: through.source_to_through_field,
                eq: mainRecord[through.source_field],
              },
            ],
          });

          // 2. 加载目标表所有数据（用于显示可选择的项目）
          const targetResponse = await getModelData({
            name: relation.target,
            page: 1,
            size: 1000,
            cond: [],
          });

          if (throughResponse?.code === 0 && targetResponse?.code === 0) {
            const throughData = throughResponse.data?.data || [];
            const targetData = targetResponse.data?.data || [];

            // 根据中间表数据标记已选择的项目
            const selectedTargetIds = throughData.map(
              (item) => item[through.target_to_through_field],
            );
            const enrichedTargetData = targetData.map((targetItem) => ({
              ...targetItem,
              selected: selectedTargetIds.includes(
                targetItem[through.target_field],
              ),
            }));

            setInlineData((prev) => ({
              ...prev,
              [inlineName]: enrichedTargetData,
              [`${inlineName}_through`]: throughData, // 存储中间表数据
            }));
          }
        } else {
          // 普通关系的处理逻辑保持不变
          const conditions = buildConditions(inlineDesc, mainRecord);
          console.log('inlineDesc', inlineDesc);
          console.log('conditions', conditions);
          const response = await getModelData({
            name: inlineName,
            cond: conditions,
            page: 1,
            size: 100,
          });
          if (response?.code === 0) {
            setInlineData((prev) => ({
              ...prev,
              [inlineName]: (response.data as any)?.data || [],
            }));
          } else {
            messageApi.error(`Failed to load ${inlineName} data`);
          }
        }
      } catch (error) {
        messageApi.error(`Failed to load ${inlineName} data`);
        console.error('Load error:', error);
      }
    },
    [buildConditions, messageApi, record],
  );

  // 处理 M2M 关系的添加操作
  const handleM2MAdd = useCallback(
    async (inlineName: string, inlineDesc: any, targetRecord: any) => {
      try {
        const relation = inlineDesc.relation;
        if (relation?.relation === 'm2m' && relation?.through) {
          const { through } = relation;

          // 创建中间表记录
          const throughData = {
            [through.source_to_through_field]: record[through.source_field],
            [through.target_to_through_field]:
              targetRecord[through.target_field],
          };

          const response = await saveModelData({
            name: through.through,
            data: throughData,
          });

          if (response?.code === 0) {
            messageApi.success('关联项已添加');
            // 重新加载数据以更新显示
            await loadInlineData(inlineName, inlineDesc, record);
          } else {
            messageApi.error('添加关联项失败');
          }
        }
      } catch (error) {
        messageApi.error('添加关联项失败');
        console.error('Add M2M error:', error);
      }
    },
    [record, messageApi, loadInlineData],
  );

  // 处理 M2M 关系的移除操作
  const handleM2MRemove = useCallback(
    async (inlineName: string, inlineDesc: any, targetRecord: any) => {
      try {
        const relation = inlineDesc.relation;
        if (relation?.relation === 'm2m' && relation?.through) {
          const { through } = relation;
          const throughData = inlineData[`${inlineName}_through`] || [];

          // 找到对应的中间表记录
          const throughRecord = throughData.find(
            (item) =>
              item[through.source_to_through_field] ===
                record[through.source_field] &&
              item[through.target_to_through_field] ===
                targetRecord[through.target_field],
          );

          if (throughRecord) {
            const response = await deleteModelData({
              name: through.through,
              data: throughRecord,
            } as any);

            if (response?.code === 0) {
              messageApi.success('关联项已移除');
              // 重新加载数据以更新显示
              await loadInlineData(inlineName, inlineDesc, record);
            } else {
              messageApi.error('移除关联项失败');
            }
          } else {
            messageApi.error('未找到对应的关联记录');
          }
        }
      } catch (error) {
        messageApi.error('移除关联项失败');
        console.error('Remove M2M error:', error);
      }
    },
    [record, inlineData, messageApi, loadInlineData],
  );

  // 处理标签页切换
  const handleTabChange = useCallback(
    (key: string) => {
      // 新建模式下，如果主数据还未保存，则不允许切换到 inline tabs
      if (key !== 'main' && !hasMainDataSaved) {
        messageApi.warning(
          'Please save the main data first before accessing related data',
        );
        return;
      }

      setActiveTab(key);

      // 如果切换到内联表格且数据尚未加载，则加载数据
      if (key !== 'main' && !loadedTabs.has(key)) {
        const inlineDesc = inlineDescs[key];
        if (inlineDesc && record) {
          console.log('Loading data for:', key);
          loadInlineData(key, inlineDesc, record);
          setLoadedTabs((prev) => new Set([...prev, key]));
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
    ],
  );

  // 删除主记录
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

  // 根据关系类型渲染不同的组件
  const renderInlineComponent = useCallback(
    (inlineName: string) => {
      const inlineDesc = inlineDescs[inlineName];
      const data = inlineData[inlineName] || [];
      const relationType = (inlineDesc as any)?.relation?.relation;
      const isLoaded = loadedTabs.has(inlineName);

      if (!inlineDesc) return null;

      // 如果数据还没有加载，显示加载状态
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
          // 多对多关系使用模态框 + 表格选择
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

              {/* 使用表格显示已选择的项目 */}
              {selectedCount > 0 && (
                <div style={{ marginTop: 16 }}>
                  <ProTable
                    dataSource={data.filter((item) => item.selected)}
                    columns={[
                      // 动态生成列
                      ...Object.entries(inlineDesc.fields || {})
                        .filter(
                          ([_fieldName, fieldConfig]) =>
                            (fieldConfig as any).show !== false,
                        )
                        .slice(0, 3) // 只显示前3个字段
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
                      // 操作列
                      {
                        title: 'Actions',
                        key: 'actions',
                        width: 80,
                        render: (_, record) => (
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
          // 外键和一对一关系使用普通表格
          return (
            <Card>
              <CommonProTable
                modelDesc={inlineDesc}
                modelName={inlineName}
                data={data}
                onAction={(
                  actionKey: string,
                  action: any,
                  record?: any,
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
                    setInlineData((prev) => ({
                      ...prev,
                      [inlineName]: [...(prev[inlineName] || []), newRecord],
                    }));
                    // 立即进入编辑模式
                    setEditingKeys((prev) => ({
                      ...prev,
                      [inlineName]: [...(prev[inlineName] || []), newRecord.id],
                    }));
                  } else {
                    // 处理其他自定义 actions
                    handleInlineAction(
                      inlineName,
                      actionKey,
                      action,
                      record,
                      isBatch,
                      records,
                    );
                  }
                }}
                onSave={async (record: any) => {
                  await handleInlineSave(inlineName, record);
                }}
                onDelete={async (record: any) => {
                  await handleInlineDelete(inlineName, record);
                }}
                tableProps={{
                  pagination: {
                    pageSize: inlineDesc.attrs?.list_per_page || 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                  },
                }}
              />
            </Card>
          );

        default:
          // 不支持的关系类型
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
      capitalizeFirstLetter,
      editingKeys,
      handleInlineSave,
      handleInlineDelete,
      loadedTabs,
      handleInlineAction,
    ],
  );

  if (detailLoading || !modelDesc) {
    return <div>Loading...</div>;
  }

  // 准备标签页数据
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
                // 新建模式下，不包含 id 字段
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

                  // 新建模式下，保存成功后启用 inline tabs
                  if (isCreateMode) {
                    setHasMainDataSaved(true);
                    // 更新 record 以包含新创建的 ID
                    if (response.data?.saved_data?.id) {
                      record.id = response.data.saved_data.id;
                    }
                  }
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
            {Object.entries(modelDesc.fields).map(
              ([fieldName, fieldConfig]: [string, any]) => {
                if (!fieldConfig.show) return null;
                return renderFormField(fieldName, fieldConfig, formRef, {
                  commonProps: {
                    readonly: fieldConfig.readonly,
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
            )}
          </ProForm>
        </Card>
      ),
    },
    // 只有在非新建模式或主数据已保存的情况下才显示 inline tabs
    ...(hasMainDataSaved
      ? Object.keys(inlineDescs).map((inlineName) => ({
          key: inlineName,
          label: capitalizeFirstLetter(inlineName),
          children: renderInlineComponent(inlineName),
        }))
      : []),
  ];

  return (
    <PageContainer
      header={{
        title: isCreateMode
          ? `Create New ${modelDesc.attrs.help_text || modelName}`
          : `${modelDesc.attrs.help_text || modelName} Detail`,
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

      {/* M2M 关系选择模态框 */}
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
              const inlineDesc = inlineDescs[inlineName];
              const data = inlineData[inlineName] || [];
              const currentSelectedIds = data
                .filter((item) => item.selected)
                .map((item) => item.id);

              // 找出新添加的项目
              const addedIds = newSelectedIds.filter(
                (id) => !currentSelectedIds.includes(id),
              );
              // 找出被移除的项目
              const removedIds = currentSelectedIds.filter(
                (id) => !newSelectedIds.includes(id),
              );

              try {
                // 处理新添加的项目
                for (const addedId of addedIds) {
                  const targetRecord = data.find((item) => item.id === addedId);
                  if (targetRecord) {
                    await handleM2MAdd(inlineName, inlineDesc, targetRecord);
                  }
                }

                // 处理被移除的项目
                for (const removedId of removedIds) {
                  const targetRecord = data.find(
                    (item) => item.id === removedId,
                  );
                  if (targetRecord) {
                    await handleM2MRemove(inlineName, inlineDesc, targetRecord);
                  }
                }

                // 重新加载数据确保一致性
                await loadInlineData(inlineName, inlineDesc, record);
              } catch (error) {
                console.error('M2M batch operation error:', error);
                messageApi.error('批量操作失败');
              }
            }}
          />
        );
      })}
    </PageContainer>
  );
};

// M2M 关系选择模态框组件
interface M2MSelectionModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (selectedIds: React.Key[]) => void;
  title: string;
  modelDesc: any;
  data: any[];
  selectedIds: React.Key[];
}

const M2MSelectionModal: React.FC<M2MSelectionModalProps> = ({
  visible,
  onCancel,
  onOk,
  title,
  modelDesc,
  data,
  selectedIds: initialSelectedIds,
}) => {
  const [selectedRowKeys, setSelectedRowKeys] =
    useState<React.Key[]>(initialSelectedIds);
  const [totalCount, setTotalCount] = useState<number>(data.length);

  // 当模态框打开时重置选择状态
  React.useEffect(() => {
    if (visible) {
      setSelectedRowKeys(initialSelectedIds);
      setTotalCount(data.length);
    }
  }, [visible, initialSelectedIds, data.length]);

  const handleOk = () => {
    onOk(selectedRowKeys);
    onCancel();
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    getCheckboxProps: (record: any) => ({
      name: record.name,
    }),
  };

  return (
    <Modal
      title={`Manage ${title} relations`}
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      width={1000}
      style={{ top: 20 }}
      okText="Confirm"
      cancelText="Cancel"
    >
      <div style={{ marginBottom: 16 }}>
        <span style={{ color: '#666' }}>
          Selected {selectedRowKeys.length} / {totalCount} items
        </span>
      </div>

      <ProTable
        rowKey="id"
        size="small"
        scroll={{ y: 400 }}
        rowSelection={rowSelection}
        request={async (params) => {
          try {
            // 构建搜索条件
            const conditions: any[] = [];

            // 处理表单搜索条件，只对 search_fields 中的字段进行搜索
            const searchFields = modelDesc.attrs?.search_fields || [];
            Object.entries(params).forEach(([key, value]) => {
              if (
                value &&
                key !== 'current' &&
                key !== 'pageSize' &&
                searchFields.includes(key)
              ) {
                conditions.push({
                  field: key,
                  icontains: String(value), // 使用模糊搜索
                });
              }
            });

            // 对于 M2M 关系，应该请求目标模型的数据
            const targetModelName =
              modelDesc.relation?.to || modelDesc.name || title;

            const response = await getModelData({
              name: targetModelName,
              page: params.current || 1,
              size: params.pageSize || 10,
              cond: conditions,
            });

            if (response?.code === 0) {
              const responseData = response.data?.data || [];
              const total = response.data?.count || 0;

              // 更新总数（仅在搜索为空时，即显示所有数据时）
              if (conditions.length === 0) {
                setTotalCount(total);
              }

              return {
                data: responseData,
                total: total,
                success: true,
              };
            }

            return {
              data: [],
              total: 0,
              success: false,
            };
          } catch (error) {
            console.error('Search error:', error);
            return {
              data: [],
              total: 0,
              success: false,
            };
          }
        }}
        columns={
          // 动态生成列
          Object.entries(modelDesc.fields || {})
            .filter(
              ([_fieldName, fieldConfig]) =>
                (fieldConfig as any).show !== false,
            )
            .map(([fieldName, fieldConfig]) => {
              const fieldConf = fieldConfig as any;
              const attrs = modelDesc.attrs || {};

              const column: any = {
                title: fieldConf.name || fieldName,
                dataIndex: fieldName,
                key: fieldName,
                width: 150,
                ellipsis: true,
                // 根据 search_fields 和 can_search 确定是否在搜索面板中显示
                hideInSearch:
                  !attrs.can_search ||
                  !attrs.search_fields?.includes(fieldName),
                render: (value: any) => {
                  if (value === null || value === undefined) return '-';

                  // 处理选择字段
                  if (fieldConf.choices && fieldConf.choices.length > 0) {
                    const choice = fieldConf.choices.find(
                      ([choiceValue]: [string, string]) =>
                        choiceValue === value,
                    );
                    return choice ? choice[1] : value;
                  }

                  // 处理布尔字段
                  if (fieldConf.field_type === 'BooleanField') {
                    return value ? '✓' : '✗';
                  }

                  // 处理文本截断
                  if (typeof value === 'string' && value.length > 30) {
                    return `${value.substring(0, 30)}...`;
                  }

                  return value;
                },
              };

              // 根据 list_sort 添加排序功能
              if (attrs.list_sort?.includes(fieldName)) {
                column.sorter = true;
              }

              // 根据 list_filter 添加筛选功能
              if (attrs.list_filter?.includes(fieldName)) {
                if (fieldConf.choices && fieldConf.choices.length > 0) {
                  column.filters = fieldConf.choices.map(
                    ([value, label]: [string, string]) => ({
                      text: label,
                      value: value,
                    }),
                  );
                  column.onFilter = (value: any, record: any) => {
                    return record[fieldName] === value;
                  };
                }
              }

              return column;
            })
        }
        search={
          // 根据 can_search 和 search_fields 控制搜索面板显示
          modelDesc.attrs?.can_search &&
          modelDesc.attrs?.search_fields?.length > 0
            ? {
                labelWidth: 120,
                defaultCollapsed: false,
              }
            : false
        }
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        options={{
          search: false,
          reload: true,
          density: true,
          setting: false,
        }}
        toolBarRender={false}
      />
    </Modal>
  );
};

export default ModelDetail;
