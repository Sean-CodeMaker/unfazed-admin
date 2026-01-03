/**
 * Hook for generating table columns based on model description
 */

import {
  DeleteOutlined,
  DisconnectOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, Dropdown, Popconfirm } from 'antd';
import React, { useCallback } from 'react';
import {
  renderBooleanField,
  renderChoiceField,
  renderDateField,
  renderDatetimeField,
  renderEditorField,
  renderImageField,
  renderJsonField,
  renderNumberField,
  renderTextField,
  renderTextRangeFormItem,
  renderTimeField,
} from './columnRenderers';

interface UseColumnGeneratorOptions {
  modelDesc: API.AdminSerializeModel;
  editableKeys: React.Key[];
  setEditableKeys: React.Dispatch<React.SetStateAction<React.Key[]>>;
  pendingUnlinkRef: React.MutableRefObject<Set<string | number>>;
  onDetail?: (record: Record<string, any>) => void;
  onAction?: (
    actionKey: string,
    action: any,
    record?: any,
    isBatch?: boolean,
    records?: any[],
  ) => void;
  onSave?: (record: Record<string, any>) => Promise<void>;
  onDelete?: (record: Record<string, any>) => Promise<void>;
  onUnlink?: (record: Record<string, any>) => Promise<void>;
  onDeleteRelated?: (record: Record<string, any>) => Promise<void>;
}

export const useColumnGenerator = ({
  modelDesc,
  editableKeys,
  setEditableKeys,
  pendingUnlinkRef,
  onDetail,
  onAction,
  onSave,
  onDelete,
  onUnlink,
  onDeleteRelated,
}: UseColumnGeneratorOptions) => {
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

    // Generate data columns
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

      // Set valueType and render based on field type
      switch (fieldConfig.field_type) {
        case 'BooleanField':
          column.valueType = 'switch';
          column.render = renderBooleanField(fieldName);
          break;

        case 'DateField':
          if (isInListRangeSearch) {
            column.valueType = 'dateRange';
            column.search = {
              transform: (value: any) => ({ [fieldName]: value }),
            };
          } else {
            column.valueType = 'date';
          }
          column.render = renderDateField(fieldName);
          break;

        case 'DatetimeField':
          if (isInListRangeSearch) {
            column.valueType = 'dateTimeRange';
            column.search = {
              transform: (value: any) => ({ [fieldName]: value }),
            };
          } else {
            column.valueType = 'dateTime';
          }
          column.render = renderDatetimeField(fieldName);
          break;

        case 'TimeField':
          column.valueType = 'time';
          column.render = renderTimeField(fieldName);
          break;

        case 'IntegerField':
        case 'FloatField':
          if (isInListRangeSearch) {
            column.valueType = 'digitRange';
            column.search = {
              transform: (value: any) => ({ [fieldName]: value }),
            };
          } else {
            column.valueType = 'digit';
          }
          column.render = renderNumberField(fieldName);
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
            column.render = renderChoiceField(fieldName, fieldConfig.choices);
          } else {
            if (isInListRangeSearch) {
              column.valueType = 'text';
              column.search = {
                transform: (value: any) => ({ [fieldName]: value }),
              };
              column.renderFormItem = renderTextRangeFormItem;
            } else {
              column.valueType = 'text';
            }
            column.render = renderTextField(fieldName);
          }
          break;

        case 'EditorField':
          column.valueType = 'text';
          column.width = 220;
          column.render = renderEditorField(fieldName);
          break;

        case 'ImageField':
          column.valueType = 'text';
          column.width = 120;
          column.render = renderImageField(fieldName, fieldConfig);
          break;

        case 'JsonField':
          column.valueType = 'text';
          column.width = 180;
          column.render = renderJsonField(fieldName);
          break;

        default:
          column.valueType = 'text';
      }

      // Set sorting (front-end only)
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

      // Set editable
      const listEditable = (modelDesc.attrs as any)?.list_editable as
        | string[]
        | undefined;
      if (fieldConfig.readonly) {
        column.editable = false;
      } else if (modelDesc.attrs.can_edit) {
        if (listEditable && listEditable.length > 0) {
          column.editable = fieldName !== 'id' ? () => true : false;
        } else {
          column.editable = false;
        }
      }

      columns.push(column);
    });

    // Add action column
    const hasDetailAction = !!onDetail;
    const hasEditAction = modelDesc.attrs.can_edit;
    const hasDeleteAction = modelDesc.attrs.can_delete && !onUnlink;
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
      // Calculate action column width
      let actionWidth = 40;
      if (hasDetailAction) actionWidth += 70;
      if (hasEditAction) actionWidth += 70;
      if (hasDeleteAction) actionWidth += 70;
      if (hasUnlinkAction) actionWidth += 80;
      if (onDeleteRelated) actionWidth += 80;
      if (hasCustomActions) actionWidth += 70;

      columns.push({
        title: 'Actions',
        dataIndex: 'option',
        valueType: 'option',
        width: actionWidth,
        fixed: 'right',
        render: (_, record, __, action) => {
          const actions = [];
          const recordKey = record.id || record.key || JSON.stringify(record);
          const isEditing = editableKeys.includes(recordKey);

          // Detail button
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

          // Edit buttons
          if (hasEditAction) {
            if (isEditing) {
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

          // Unlink button
          if (onUnlink && !isEditing) {
            actions.push(
              <Popconfirm
                key="unlink"
                title="Unlink this record?"
                description="This will remove the link but won't delete the record."
                onConfirm={async () => {
                  const recordId = record.id;
                  if (pendingUnlinkRef.current.has(recordId)) return;

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

          // Delete related button
          if (onDeleteRelated && !isEditing) {
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
          } else if (hasDeleteAction && !isEditing) {
            // Standard delete button
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

          // Custom actions
          if (hasCustomActions && nonBatchActions.length > 0) {
            const menuItems = Object.entries(modelDesc.actions || {})
              .filter(([_, actionItem]: [string, any]) => !actionItem.batch)
              .map(([actionKey, actionItem]: [string, any]) => ({
                key: actionKey,
                label: actionItem.label || actionItem.name,
                onClick: () =>
                  onAction?.(actionKey, actionItem, record, false, []),
              }));

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
    setEditableKeys,
    pendingUnlinkRef,
  ]);

  return { generateColumns };
};
