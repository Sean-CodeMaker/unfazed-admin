import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Dropdown, Image, Popconfirm, Tooltip } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useMemo, useRef, useState } from 'react';

interface CommonProTableProps {
  /** 模型描述信息 */
  modelDesc: API.AdminSerializeModel;
  /** 模型名称 */
  modelName: string;
  /** 表格数据（可选，如果提供则使用 dataSource 模式，否则使用 request 模式） */
  data?: any[];
  /** 详情按钮点击回调 */
  onDetail?: (record: Record<string, any>) => void;
  /** 自定义操作触发器 */
  onAction?: (
    actionKey: string,
    action: any,
    record?: any,
    isBatch?: boolean,
    records?: any[],
  ) => void;
  /** 保存操作回调 */
  onSave?: (record: Record<string, any>) => Promise<void>;
  /** 删除操作回调 */
  onDelete?: (record: Record<string, any>) => Promise<void>;
  /** 数据请求函数（当不提供 data 时使用） */
  onRequest?: (
    params: any,
  ) => Promise<{ data: any[]; total: number; success: boolean }>;
  /** 额外的 ProTable 属性 */
  tableProps?: any;
  actionRef?: React.MutableRefObject<ActionType | undefined>;
}

const CommonProTable: React.FC<CommonProTableProps> = ({
  modelDesc,
  modelName,
  data,
  onDetail,
  onAction,
  onSave,
  onDelete,
  onRequest,
  tableProps = {},
  actionRef,
}) => {
  const formRef = useRef<ProFormInstance>(null as any);
  const [editableKeys, setEditableKeys] = useState<React.Key[]>([]);

  // 生成列配置（基于 ModelList 的实现）
  const generateColumns = useCallback((): ProColumns<Record<string, any>>[] => {
    const columns: ProColumns<Record<string, any>>[] = [];

    // Get field entries and sort by list_order if available
    const listOrder = (modelDesc.attrs as any)?.list_order as
      | string[]
      | undefined;
    let fieldEntries = Object.entries(modelDesc.fields || {});

    if (listOrder && listOrder.length > 0) {
      // Sort fields by list_order, fields not in list_order go to the end
      fieldEntries = fieldEntries.sort(([a], [b]) => {
        const indexA = listOrder.indexOf(a);
        const indexB = listOrder.indexOf(b);
        // If not in list_order, put at the end
        const orderA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
        const orderB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
        return orderA - orderB;
      });
    }

    // 生成数据列
    fieldEntries.forEach(([fieldName, fieldConfig]) => {
      if (fieldConfig.show === false) {
        return;
      }

      const column: ProColumns<Record<string, any>> = {
        title: fieldConfig.name || fieldName,
        dataIndex: fieldName,
        key: fieldName,
        width: 150,
        ellipsis: true,
        tooltip: fieldConfig.help_text,
        hideInTable: false,
        hideInSearch: !(modelDesc.attrs as any)?.list_search?.includes(
          fieldName,
        ),
      };

      // 根据字段类型设置 valueType 和渲染逻辑
      switch (fieldConfig.field_type) {
        case 'BooleanField':
          column.valueType = 'switch';
          column.render = (_, record) => (
            <span>{record[fieldName] ? '✓' : '✗'}</span>
          );
          break;
        case 'DateField':
          column.valueType = 'date';
          column.render = (_, record) =>
            record[fieldName]
              ? dayjs(record[fieldName]).format('YYYY-MM-DD')
              : '-';
          break;
        case 'DatetimeField':
          column.valueType = 'dateTime';
          column.render = (_, record) =>
            record[fieldName]
              ? dayjs(
                  typeof record[fieldName] === 'number' &&
                    `${record[fieldName]}`.length === 10
                    ? record[fieldName] * 1000
                    : record[fieldName],
                ).format('YYYY-MM-DD HH:mm:ss')
              : '-';
          break;
        case 'TimeField':
          column.valueType = 'time';
          column.render = (_, record) =>
            record[fieldName]
              ? dayjs(record[fieldName]).format('HH:mm:ss')
              : '-';
          break;
        case 'IntegerField':
        case 'FloatField':
          column.valueType = 'digit';
          column.render = (_, record) =>
            record[fieldName] !== null && record[fieldName] !== undefined
              ? Number(record[fieldName]).toLocaleString()
              : '-';
          break;
        case 'CharField':
        case 'TextField':
          if (fieldConfig.choices && fieldConfig.choices.length > 0) {
            column.valueType = 'select';
            column.valueEnum = fieldConfig.choices.reduce(
              (acc: any, [value, label]: [string, string]) => {
                acc[value] = { text: label };
                return acc;
              },
              {},
            );
            column.render = (_, record) => {
              const choice = fieldConfig.choices?.find(
                ([value]: [string, string]) => value === record[fieldName],
              );
              return choice ? choice[1] : record[fieldName] || '-';
            };
          } else {
            column.valueType = 'text';
            column.render = (_, record) => {
              const text = record[fieldName] || '-';
              return text.length > 20 ? `${text.substring(0, 20)}...` : text;
            };
          }
          break;
        case 'EditorField':
          column.valueType = 'text';
          column.width = 220;
          column.render = (_, record) => {
            const content = record[fieldName];
            if (!content) return '-';

            const stringContent = String(content);
            const sanitizedText = stringContent
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/&nbsp;/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();

            const preview =
              sanitizedText.length > 50
                ? `${sanitizedText.substring(0, 50)}...`
                : sanitizedText || 'Rich content';

            return (
              <Tooltip
                title={
                  <div
                    style={{
                      maxWidth: 500,
                      maxHeight: 300,
                      overflow: 'auto',
                      padding: '8px',
                      backgroundColor: '#fff',
                    }}
                    dangerouslySetInnerHTML={{ __html: stringContent }}
                  />
                }
                placement="topLeft"
                overlayStyle={{ maxWidth: 'none' }}
              >
                <span
                  style={{
                    cursor: 'pointer',
                    color: '#1677ff',
                    fontSize: '12px',
                  }}
                  title="Hover to view formatted content"
                >
                  ✍️ {preview}
                </span>
              </Tooltip>
            );
          };
          break;

        case 'ImageField':
          column.valueType = 'text';
          column.width = 120;
          column.render = (_, record) => {
            const imageUrl = record[fieldName];
            if (!imageUrl) return '-';

            return (
              <Image
                src={imageUrl}
                alt={fieldConfig.name || fieldName}
                width={80}
                height={60}
                style={{
                  objectFit: 'cover',
                  borderRadius: 4,
                  border: '1px solid #d9d9d9',
                }}
                placeholder={
                  <div
                    style={{
                      width: 80,
                      height: 60,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f5f5f5',
                      border: '1px solid #d9d9d9',
                      borderRadius: 4,
                    }}
                  >
                    <EyeOutlined style={{ color: '#bfbfbf' }} />
                  </div>
                }
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+2oqIrqwOqG4otoP/7DwhIHGALSCxgCzgASCAJSCBhA0ggAQkgASRAAgkgAQkrAUlbrUoroKChzZmNe/+t2+NZTZ+3pt6vr7+7/ffO9/S7v//x8v9Nv339b7Y8A4cOHjjyBAADGHGAYNwBjFjAGIJBBzBmAYMIJh3AqAWMIph0AKMWMIpg0gGMWsAogkknMGrBgAWMIph0AqMWDFjAKIJJJzBqwYAFjCKYdAKjFgxYwCiCSSc="
              />
            );
          };
          break;

        case 'JsonField':
          column.valueType = 'text';
          column.width = 180;
          column.render = (_, record) => {
            const content = record[fieldName];
            if (content === null || content === undefined) return '-';

            // Convert to string for display
            let jsonString: string;
            let formattedJson: string;
            try {
              if (typeof content === 'string') {
                // Parse and re-stringify to validate and format
                const parsed = JSON.parse(content);
                jsonString = JSON.stringify(parsed);
                formattedJson = JSON.stringify(parsed, null, 2);
              } else {
                jsonString = JSON.stringify(content);
                formattedJson = JSON.stringify(content, null, 2);
              }
            } catch {
              jsonString = String(content);
              formattedJson = String(content);
            }

            // Create preview text
            const preview =
              jsonString.length > 30
                ? `${jsonString.substring(0, 30)}...`
                : jsonString;

            return (
              <Tooltip
                title={
                  <pre
                    style={{
                      margin: 0,
                      maxWidth: 500,
                      maxHeight: 400,
                      overflow: 'auto',
                      fontSize: 12,
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}
                  >
                    {formattedJson}
                  </pre>
                }
                placement="topLeft"
                overlayStyle={{ maxWidth: 'none' }}
                color="#fff"
                overlayInnerStyle={{ color: '#333' }}
              >
                <span
                  style={{
                    cursor: 'pointer',
                    color: '#722ed1',
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    fontSize: 12,
                  }}
                  title="Hover to view formatted JSON"
                >
                  📋 {preview}
                </span>
              </Tooltip>
            );
          };
          break;

        default:
          column.valueType = 'text';
      }

      // 设置排序 (front-end only, no API request)
      if ((modelDesc.attrs as any)?.list_sort?.includes(fieldName)) {
        column.sorter = (a: Record<string, any>, b: Record<string, any>) => {
          const aVal = a[fieldName];
          const bVal = b[fieldName];
          if (aVal === null || aVal === undefined) return -1;
          if (bVal === null || bVal === undefined) return 1;
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return aVal - bVal;
          }
          return String(aVal).localeCompare(String(bVal));
        };
      }

      // 设置筛选
      if ((modelDesc.attrs as any)?.list_filter?.includes(fieldName)) {
        if (fieldConfig.choices && fieldConfig.choices.length > 0) {
          column.filters = fieldConfig.choices.map(
            ([value, label]: [string, string]) => ({
              text: label,
              value: value,
            }),
          );
          column.onFilter = (value: any, record: Record<string, any>) => {
            return record[fieldName] === value;
          };
        }
      }

      // 设置可编辑 (only fields in list_editable are editable, and readonly fields are never editable)
      const listEditable = (modelDesc.attrs as any)?.list_editable as
        | string[]
        | undefined;
      if (
        modelDesc.attrs.can_edit &&
        !fieldConfig.readonly &&
        listEditable?.includes(fieldName)
      ) {
        column.editable = () => true;
      }

      columns.push(column);
    });

    // 添加操作列
    const hasDetailAction = true; // Always show Detail button
    const hasEditAction = modelDesc.attrs.can_edit;
    const hasDeleteAction = modelDesc.attrs.can_delete;
    const nonBatchActions = Object.values(modelDesc.actions || {}).filter(
      (action) => !action.batch,
    );
    const hasCustomActions = nonBatchActions.length > 0;

    if (
      hasDetailAction ||
      hasEditAction ||
      hasDeleteAction ||
      hasCustomActions
    ) {
      let actionWidth = 80;
      if (hasDetailAction) actionWidth += 60;
      if (hasEditAction) actionWidth += 100;
      if (hasDeleteAction) actionWidth += 80;
      if (hasCustomActions) actionWidth += 60;

      columns.push({
        title: 'Actions',
        dataIndex: 'option',
        valueType: 'option',
        width: Math.min(actionWidth, 300),
        fixed: 'right',
        render: (_, record, __, action) => {
          const actions = [];

          // Detail 按钮
          if (hasDetailAction) {
            actions.push(
              <Button
                key="detail"
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onDetail?.(record)}
              >
                Detail
              </Button>,
            );
          }

          // 编辑相关按钮
          if (hasEditAction) {
            const recordKey = record.id || record.key || JSON.stringify(record);
            const isEditing = editableKeys.includes(recordKey);

            if (isEditing) {
              // 编辑状态：显示保存和取消按钮
              actions.push(
                <Button
                  key="save"
                  type="link"
                  size="small"
                  icon={<SaveOutlined />}
                  onClick={async () => {
                    await onSave?.(record);
                    setEditableKeys((keys) =>
                      keys.filter((key) => key !== recordKey),
                    );
                  }}
                  style={{ color: '#52c41a' }}
                >
                  Save
                </Button>,
                <Button
                  key="cancel"
                  type="link"
                  size="small"
                  onClick={() => {
                    setEditableKeys((keys) =>
                      keys.filter((key) => key !== recordKey),
                    );
                    action?.cancelEditable?.(recordKey);
                  }}
                  style={{ color: '#ff4d4f' }}
                >
                  Cancel
                </Button>,
              );
            } else {
              // 非编辑状态：显示编辑按钮
              actions.push(
                <Button
                  key="edit"
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditableKeys((keys) => [...keys, recordKey]);
                    action?.startEditable?.(recordKey);
                  }}
                >
                  Edit
                </Button>,
              );
            }
          }

          // 删除按钮
          if (hasDeleteAction) {
            const recordKey = record.id || record.key || JSON.stringify(record);
            const isEditing = editableKeys.includes(recordKey);

            // 只有在非编辑状态时才显示删除按钮
            if (!isEditing) {
              actions.push(
                <Popconfirm
                  key="delete"
                  title="确定要删除这条记录吗？"
                  onConfirm={() => onDelete?.(record)}
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
                </Popconfirm>,
              );
            }
          }

          // 自定义操作
          if (hasCustomActions && nonBatchActions.length > 0) {
            const menuItems = Object.entries(modelDesc.actions || {})
              .filter(([_, action]: [string, any]) => !action.batch)
              .map(([actionKey, action]: [string, any]) => {
                return {
                  key: actionKey,
                  label: action.label || action.name,
                  onClick: () =>
                    onAction?.(actionKey, action, record, false, []),
                };
              });

            actions.push(
              <Dropdown
                key="more"
                menu={{ items: menuItems }}
                placement="bottomRight"
              >
                <Button type="link" size="small" icon={<MoreOutlined />}>
                  More
                </Button>
              </Dropdown>,
            );
          }

          return actions;
        },
      });
    }

    return columns;
  }, [modelDesc, onDetail, onAction, onSave, onDelete, editableKeys]);

  // 生成批量操作菜单项
  const renderBatchActions = useCallback(() => {
    if (!modelDesc.actions) return [];

    const menuItems: any[] = [];
    Object.entries(modelDesc.actions).forEach(
      ([actionKey, action]: [string, any]) => {
        if (action.batch) {
          menuItems.push({
            key: actionKey,
            label: action.label || action.name,
            onClick: () => onAction?.(actionKey, action, undefined, true, []),
          });
        }
      },
    );

    return menuItems;
  }, [modelDesc, onAction]);

  // 生成工具栏按钮
  const renderToolBar = useCallback(() => {
    const buttons: React.ReactNode[] = [];

    if (modelDesc.attrs.can_add) {
      buttons.push(
        <Button
          key="add"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => onAction?.('add', { name: 'add' })}
        >
          Add
        </Button>,
      );
    }

    return buttons;
  }, [modelDesc, modelName, onAction]);

  const columns = useMemo(() => generateColumns(), [generateColumns]);

  // 检查是否有可搜索的字段
  const searchFields = (modelDesc.attrs as any)?.list_search || [];
  const hasSearchableFields = searchFields.length > 0;

  return (
    <ProTable<Record<string, any>>
      headerTitle={modelDesc.attrs.help_text || modelName}
      actionRef={actionRef}
      formRef={formRef}
      rowKey={(record) => record.id || record.key || JSON.stringify(record)}
      search={
        hasSearchableFields
          ? {
              labelWidth: 120,
              defaultCollapsed: false,
              optionRender: (_searchConfig: any, _formProps: any, dom: any) => {
                const batchActions = renderBatchActions();
                const originalButtons = dom.reverse();

                if (batchActions.length > 0) {
                  const moreActionsDropdown = (
                    <Dropdown
                      key="more-actions"
                      menu={{ items: batchActions }}
                      trigger={['click']}
                    >
                      <Button>
                        More
                        <MoreOutlined />
                      </Button>
                    </Dropdown>
                  );

                  return [...originalButtons, moreActionsDropdown];
                }

                return originalButtons;
              },
            }
          : false
      }
      toolBarRender={() => {
        const buttons = renderToolBar();
        return buttons.length > 0 ? buttons : false;
      }}
      request={data ? undefined : onRequest}
      dataSource={data}
      columns={columns}
      editable={
        modelDesc.attrs.can_edit
          ? {
              type: 'multiple',
              editableKeys,
              onChange: setEditableKeys,
              onSave: async (_key: any, record: Record<string, any>) => {
                await onSave?.(record);
              },
              actionRender: (_row: any, _config: any, defaultDom: any) => {
                return [defaultDom.save, defaultDom.cancel];
              },
            }
          : undefined
      }
      scroll={{
        x: 'max-content',
        y: 'calc(100vh - 400px)',
      }}
      pagination={{
        showSizeChanger: true,
        showQuickJumper: true,
        ...(data ? { pageSize: 20 } : {}),
      }}
      options={{
        search: false,
        reload: true,
        density: true,
        setting: true,
      }}
      {...tableProps}
    />
  );
};

export default CommonProTable;
