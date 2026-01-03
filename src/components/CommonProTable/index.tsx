import {
  DeleteOutlined,
  DisconnectOutlined,
  EditOutlined,
  EyeOutlined,
  LinkOutlined,
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
    searchParams?: Record<string, any>,
  ) => void;
  /** 保存操作回调 */
  onSave?: (record: Record<string, any>) => Promise<void>;
  /** 删除操作回调 */
  onDelete?: (record: Record<string, any>) => Promise<void>;
  /** 解除关联回调（用于 bk_fk/bk_o2o 关系） */
  onUnlink?: (record: Record<string, any>) => Promise<void>;
  /** 建立关联回调（用于 bk_fk/bk_o2o 关系，点击后打开选择弹窗） */
  onLink?: () => void;
  /** Link 按钮是否禁用（用于 bk_o2o 已有关联时禁用） */
  linkDisabled?: boolean;
  /** 新增关联记录回调（用于 bk_fk/bk_o2o 关系，点击后打开新增弹窗） */
  onAddRelated?: () => void;
  /** 删除关联记录回调（用于 bk_fk/bk_o2o 关系，彻底删除记录） */
  onDeleteRelated?: (record: Record<string, any>) => Promise<void>;
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
  onUnlink,
  onLink,
  linkDisabled,
  onAddRelated,
  onDeleteRelated,
  onRequest,
  tableProps = {},
  actionRef,
}) => {
  const formRef = useRef<ProFormInstance>(null as any);
  const [editableKeys, setEditableKeys] = useState<React.Key[]>([]);
  // Store current search params for batch actions
  const [currentSearchParams, setCurrentSearchParams] = useState<
    Record<string, any>
  >({});
  // Filtered data for client-side search (when using data mode)
  const [filteredData, setFilteredData] = useState<any[] | undefined>(
    undefined,
  );
  // Track pending unlink operations to prevent duplicate submissions
  const pendingUnlinkRef = useRef<Set<string | number>>(new Set());

  // Client-side filter function for data mode
  const filterDataBySearchParams = useCallback(
    (sourceData: any[], params: Record<string, any>) => {
      if (!sourceData || sourceData.length === 0) return sourceData;

      const searchFields = (modelDesc.attrs as any)?.list_search || [];
      if (searchFields.length === 0) return sourceData;

      // Check if any search param has value
      const hasSearchValue = Object.entries(params).some(
        ([key, value]) =>
          value &&
          key !== 'current' &&
          key !== 'pageSize' &&
          searchFields.includes(key),
      );

      if (!hasSearchValue) return sourceData;

      return sourceData.filter((record) => {
        return Object.entries(params).every(([key, value]) => {
          if (
            !value ||
            key === 'current' ||
            key === 'pageSize' ||
            !searchFields.includes(key)
          ) {
            return true;
          }

          const fieldValue = record[key];
          if (fieldValue === null || fieldValue === undefined) return false;

          // String contains match (case-insensitive)
          const searchStr = String(value).toLowerCase();
          const fieldStr = String(fieldValue).toLowerCase();
          return fieldStr.includes(searchStr);
        });
      });
    },
    [modelDesc.attrs],
  );

  // Reset filtered data when source data changes
  React.useEffect(() => {
    if (data) {
      // Re-apply current search params when data changes
      if (Object.keys(currentSearchParams).length > 0) {
        const filtered = filterDataBySearchParams(data, currentSearchParams);
        setFilteredData(filtered);
      } else {
        setFilteredData(undefined);
      }
    }
  }, [data, filterDataBySearchParams, currentSearchParams]);

  // 生成列配置（基于 ModelList 的实现）
  const generateColumns = useCallback((): ProColumns<Record<string, any>>[] => {
    const columns: ProColumns<Record<string, any>>[] = [];

    // Get field entries and filter by list_display if available
    const listDisplay = (modelDesc.attrs as any)?.list_display as
      | string[]
      | undefined;
    const listOrder = (modelDesc.attrs as any)?.list_order as
      | string[]
      | undefined;
    const listRangeSearch = (modelDesc.attrs as any)?.list_range_search as
      | string[]
      | undefined;
    let fieldEntries = Object.entries(modelDesc.fields || {});

    // Filter by list_display if defined
    if (listDisplay && listDisplay.length > 0) {
      fieldEntries = fieldEntries.filter(([fieldName]) =>
        listDisplay.includes(fieldName),
      );
    }

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

      // Check if field is in list_search
      const isInListSearch = (modelDesc.attrs as any)?.list_search?.includes(
        fieldName,
      );
      // list_range_search only works if field is also in list_search
      const isInListRangeSearch =
        isInListSearch && listRangeSearch?.includes(fieldName);

      const column: ProColumns<Record<string, any>> = {
        title: fieldConfig.name || fieldName,
        dataIndex: fieldName,
        key: fieldName,
        width: 150,
        ellipsis: true,
        tooltip: fieldConfig.help_text,
        hideInTable: false,
        hideInSearch: !isInListSearch,
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
          // Use dateRange for list_range_search fields
          if (isInListRangeSearch) {
            column.valueType = 'dateRange';
            column.search = {
              transform: (value: any) => {
                return {
                  [fieldName]: value,
                };
              },
            };
          } else {
            column.valueType = 'date';
          }
          column.render = (_, record) => {
            const value = record[fieldName];
            if (!value) return '-';
            const numValue = typeof value === 'string' ? Number(value) : value;
            const timestamp =
              typeof numValue === 'number' &&
              !Number.isNaN(numValue) &&
              numValue > 0 &&
              numValue < 10000000000
                ? numValue * 1000
                : numValue;
            const result = dayjs(timestamp);
            return result.isValid() ? result.format('YYYY-MM-DD') : '-';
          };
          break;
        case 'DatetimeField':
          // Use dateTimeRange for list_range_search fields
          if (isInListRangeSearch) {
            column.valueType = 'dateTimeRange';
            column.search = {
              transform: (value: any) => {
                return {
                  [fieldName]: value,
                };
              },
            };
          } else {
            column.valueType = 'dateTime';
          }
          column.render = (_, record) => {
            const value = record[fieldName];
            if (!value) return '-';
            const numValue = typeof value === 'string' ? Number(value) : value;
            const timestamp =
              typeof numValue === 'number' &&
              !Number.isNaN(numValue) &&
              numValue > 0 &&
              numValue < 10000000000
                ? numValue * 1000
                : numValue;
            const result = dayjs(timestamp);
            return result.isValid()
              ? result.format('YYYY-MM-DD HH:mm:ss')
              : '-';
          };
          break;
        case 'TimeField':
          column.valueType = 'time';
          column.render = (_, record) => {
            const value = record[fieldName];
            if (!value) return '-';
            const numValue = typeof value === 'string' ? Number(value) : value;
            const timestamp =
              typeof numValue === 'number' &&
              !Number.isNaN(numValue) &&
              numValue > 0 &&
              numValue < 10000000000
                ? numValue * 1000
                : numValue;
            const result = dayjs(timestamp);
            return result.isValid() ? result.format('HH:mm:ss') : '-';
          };
          break;
        case 'IntegerField':
        case 'FloatField':
          // Use digitRange for list_range_search fields
          if (isInListRangeSearch) {
            column.valueType = 'digitRange';
            column.search = {
              transform: (value: any) => {
                return {
                  [fieldName]: value,
                };
              },
            };
            // Use ProTable's built-in digitRange component (no custom renderFormItem)
          } else {
            column.valueType = 'digit';
          }
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
            // Use text range for list_range_search fields
            if (isInListRangeSearch) {
              column.valueType = 'text';
              column.search = {
                transform: (value: any) => {
                  return {
                    [fieldName]: value,
                  };
                },
              };
              column.renderFormItem = (_schema, config) => {
                const { value, onChange } = config;
                const currentValue = Array.isArray(value) ? value : ['', ''];
                return (
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <input
                      type="text"
                      placeholder="Start"
                      value={currentValue[0] || ''}
                      onChange={(e) => {
                        onChange?.([e.target.value, currentValue[1] || '']);
                      }}
                      style={{
                        flex: 1,
                        padding: '4px 11px',
                        border: '1px solid #d9d9d9',
                        borderRadius: 6,
                        outline: 'none',
                      }}
                    />
                    <span>~</span>
                    <input
                      type="text"
                      placeholder="End"
                      value={currentValue[1] || ''}
                      onChange={(e) => {
                        onChange?.([currentValue[0] || '', e.target.value]);
                      }}
                      style={{
                        flex: 1,
                        padding: '4px 11px',
                        border: '1px solid #d9d9d9',
                        borderRadius: 6,
                        outline: 'none',
                      }}
                    />
                  </div>
                );
              };
            } else {
              column.valueType = 'text';
            }
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

      // 设置可编辑 (readonly fields are never editable)
      const listEditable = (modelDesc.attrs as any)?.list_editable as
        | string[]
        | undefined;
      if (fieldConfig.readonly) {
        // Readonly fields are never editable
        column.editable = false;
      } else if (modelDesc.attrs.can_edit) {
        // If list_editable is defined and not empty, all fields except 'id' are editable
        // If list_editable is not defined or empty, no columns are editable
        if (listEditable && listEditable.length > 0) {
          // All fields are editable except 'id'
          column.editable = fieldName !== 'id' ? () => true : false;
        } else {
          // No list_editable defined, columns are not editable
          column.editable = false;
        }
      }

      columns.push(column);
    });

    // 添加操作列
    const hasDetailAction = !!onDetail; // Only show Detail button if onDetail callback is provided
    const hasEditAction = modelDesc.attrs.can_edit;
    const hasDeleteAction = modelDesc.attrs.can_delete && !onUnlink; // Hide delete if unlink is provided
    const hasUnlinkAction = !!onUnlink;
    const nonBatchActions = Object.values(modelDesc.actions || {}).filter(
      (action) => !action.batch,
    );
    const hasCustomActions = nonBatchActions.length > 0;

    if (
      hasDetailAction ||
      hasEditAction ||
      hasDeleteAction ||
      hasUnlinkAction ||
      onDeleteRelated ||
      hasCustomActions
    ) {
      // Calculate action column width based on actual buttons
      let actionWidth = 40; // Base padding
      if (hasDetailAction) actionWidth += 70;
      if (hasEditAction) actionWidth += 70;
      if (hasDeleteAction) actionWidth += 70;
      if (hasUnlinkAction) actionWidth += 80; // Unlink is slightly wider
      if (onDeleteRelated) actionWidth += 80; // Delete for back relations
      if (hasCustomActions) actionWidth += 70;

      columns.push({
        title: 'Actions',
        dataIndex: 'option',
        valueType: 'option',
        width: actionWidth,
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

          // Unlink button (for bk_fk/bk_o2o relations)
          if (onUnlink) {
            const recordKey = record.id || record.key || JSON.stringify(record);
            const isEditing = editableKeys.includes(recordKey);

            if (!isEditing) {
              actions.push(
                <Popconfirm
                  key="unlink"
                  title="Unlink this record?"
                  description="This will remove the link but won't delete the record."
                  onConfirm={async () => {
                    // Prevent duplicate submissions
                    const recordId = record.id;
                    if (pendingUnlinkRef.current.has(recordId)) {
                      return;
                    }

                    pendingUnlinkRef.current.add(recordId);
                    try {
                      await onUnlink(record);
                    } finally {
                      pendingUnlinkRef.current.delete(recordId);
                    }
                  }}
                  okText="Unlink"
                  cancelText="Cancel"
                >
                  <Button
                    type="link"
                    size="small"
                    danger
                    icon={<DisconnectOutlined />}
                  >
                    Unlink
                  </Button>
                </Popconfirm>,
              );
            }
          }

          // Delete button for back relations (bk_fk/bk_o2o) - permanently deletes the record
          if (onDeleteRelated) {
            const recordKey = record.id || record.key || JSON.stringify(record);
            const isEditing = editableKeys.includes(recordKey);

            if (!isEditing) {
              actions.push(
                <Popconfirm
                  key="delete-related"
                  title="Delete this record?"
                  description="This will permanently delete the record. This action cannot be undone."
                  onConfirm={async () => {
                    await onDeleteRelated(record);
                  }}
                  okText="Delete"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
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

          // Delete button (only show if no onUnlink provided)
          else if (hasDeleteAction) {
            const recordKey = record.id || record.key || JSON.stringify(record);
            const isEditing = editableKeys.includes(recordKey);

            // Only show delete button when not editing
            if (!isEditing) {
              actions.push(
                <Popconfirm
                  key="delete"
                  title="Are you sure you want to delete this record?"
                  onConfirm={() => onDelete?.(record)}
                  okText="Delete"
                  cancelText="Cancel"
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
  }, [
    modelDesc,
    onDetail,
    onAction,
    onSave,
    onDelete,
    onUnlink,
    onDeleteRelated,
    editableKeys,
  ]);

  // 生成批量操作菜单项
  const getBatchActionMenuItems = useCallback(() => {
    if (!modelDesc.actions) return [];

    const menuItems: any[] = [];
    Object.entries(modelDesc.actions).forEach(
      ([actionKey, action]: [string, any]) => {
        if (action.batch) {
          menuItems.push({
            key: actionKey,
            label: action.label || action.name,
            onClick: () => {
              // Get current form values directly when clicking
              const currentFormValues = formRef.current?.getFieldsValue() || {};
              // Merge with saved search params (in case form values are empty)
              const searchParams = {
                ...currentSearchParams,
                ...currentFormValues,
              };
              onAction?.(actionKey, action, undefined, true, [], searchParams);
            },
          });
        }
      },
    );

    return menuItems;
  }, [modelDesc, onAction, currentSearchParams]);

  // 生成工具栏按钮
  const renderToolBar = useCallback(() => {
    const buttons: React.ReactNode[] = [];

    // Link button for back relations (bk_fk/bk_o2o)
    if (onLink) {
      buttons.push(
        <Button
          key="link"
          type="primary"
          icon={<LinkOutlined />}
          onClick={onLink}
          disabled={linkDisabled}
        >
          Link
        </Button>,
      );
    }

    // Add button for back relations (bk_fk/bk_o2o) - creates new related record
    if (onAddRelated) {
      buttons.push(
        <Button
          key="add-related"
          type="primary"
          icon={<PlusOutlined />}
          onClick={onAddRelated}
        >
          Add
        </Button>,
      );
    }

    // Add button (standard add for main table)
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
  }, [modelDesc, onAction, onLink, linkDisabled, onAddRelated]);

  const columns = useMemo(() => generateColumns(), [generateColumns]);

  // 检查是否有可搜索的字段或批量操作
  const searchFields = (modelDesc.attrs as any)?.list_search || [];
  const hasSearchableFields = searchFields.length > 0;
  const batchActions = getBatchActionMenuItems();
  const hasBatchActions = batchActions.length > 0;
  const showSearchPanel = hasSearchableFields || hasBatchActions;

  return (
    <>
      <style>
        {`
          .common-pro-table [class*='ant-space'] {
            flex-wrap: wrap !important;
            justify-content: flex-end !important;
          }
          .common-pro-table [class*='ant-space-item']:last-child {
            margin-left: auto !important;
          }
          .common-pro-table [class*='ant-pro-query-filter-collapse-button'] {
            white-space: nowrap !important;
          }
        `}
      </style>
      <ProTable<Record<string, any>>
        className="common-pro-table"
        headerTitle={modelDesc.attrs.help_text || modelName}
        actionRef={actionRef}
        formRef={formRef}
        rowKey={(record) => record.id || record.key || JSON.stringify(record)}
        search={
          showSearchPanel
            ? {
                labelWidth: 120,
                defaultCollapsed: false,
                optionRender: (
                  _searchConfig: any,
                  formProps: any,
                  dom: any,
                ) => {
                  // Only show Query/Reset buttons if there are searchable fields
                  const originalButtons = hasSearchableFields
                    ? dom.reverse()
                    : [];

                  const buttons = [...originalButtons];

                  if (hasBatchActions) {
                    // Build batch action items dynamically with access to form
                    const batchActionItems = Object.entries(
                      modelDesc.actions || {},
                    )
                      .filter(([, action]: [string, any]) => action.batch)
                      .map(([actionKey, action]: [string, any]) => ({
                        key: actionKey,
                        label: action.label || action.name,
                        onClick: () => {
                          // Get form values directly from formProps
                          const formValues =
                            formProps.form?.getFieldsValue() || {};
                          onAction?.(
                            actionKey,
                            action,
                            undefined,
                            true,
                            [],
                            formValues,
                          );
                        },
                      }));

                    const batchActionsDropdown = (
                      <Dropdown
                        key="batch-actions"
                        menu={{ items: batchActionItems }}
                        trigger={['click']}
                      >
                        <Button>
                          Batch Actions
                          <MoreOutlined />
                        </Button>
                      </Dropdown>
                    );

                    buttons.push(batchActionsDropdown);
                  }

                  // Wrap buttons in a flex container that allows wrapping
                  return (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                      }}
                    >
                      {buttons}
                    </div>
                  );
                },
              }
            : false
        }
        toolBarRender={() => {
          const buttons = renderToolBar();
          return buttons.length > 0 ? buttons : false;
        }}
        request={data ? undefined : onRequest}
        beforeSearchSubmit={(params) => {
          // Save search params for batch actions
          setCurrentSearchParams(params);
          // Client-side filtering when using data mode
          if (data) {
            const filtered = filterDataBySearchParams(data, params);
            setFilteredData(filtered);
          }
          return params;
        }}
        dataSource={data ? (filteredData ?? data) : undefined}
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
        }}
        options={{
          search: false,
          reload: true,
          density: true,
          setting: true,
        }}
        {...tableProps}
      />
    </>
  );
};

export default CommonProTable;
