import { ProTable } from '@ant-design/pro-components';
import { Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import { getModelData } from '@/services/api';

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

  // Reset selection state when modal opens
  useEffect(() => {
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
            // Build search conditions
            const conditions: any[] = [];

            // Process form search conditions, only search fields in list_search
            const searchFields = modelDesc.attrs?.list_search || [];
            Object.entries(params).forEach(([key, value]) => {
              if (
                value &&
                key !== 'current' &&
                key !== 'pageSize' &&
                searchFields.includes(key)
              ) {
                conditions.push({
                  field: key,
                  icontains: String(value),
                });
              }
            });

            // For M2M relation, request target model data
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

              // Update total count only when showing all data (no search conditions)
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
        columns={Object.entries(modelDesc.fields || {})
          .filter(
            ([_fieldName, fieldConfig]) => (fieldConfig as any).show !== false,
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
              hideInSearch: !attrs.list_search?.includes(fieldName),
            };

            // Set valueType and valueEnum for fields with choices
            if (fieldConf.choices && fieldConf.choices.length > 0) {
              column.valueType = 'select';
              column.valueEnum = fieldConf.choices.reduce(
                (acc: any, [value, label]: [string, string]) => {
                  acc[value] = { text: label };
                  return acc;
                },
                {},
              );
              column.render = (value: any) => {
                if (value === null || value === undefined) return '-';
                const choice = fieldConf.choices.find(
                  ([choiceValue]: [string, string]) => choiceValue === value,
                );
                return choice ? choice[1] : value;
              };
            } else if (fieldConf.field_type === 'BooleanField') {
              column.valueType = 'switch';
              column.render = (value: any) => (value ? '✓' : '✗');
            } else if (fieldConf.field_type === 'DateField') {
              column.valueType = 'date';
              column.render = (value: any) => {
                if (value === null || value === undefined) return '-';
                return value;
              };
            } else if (fieldConf.field_type === 'DatetimeField') {
              column.valueType = 'dateTime';
              column.render = (value: any) => {
                if (value === null || value === undefined) return '-';
                return value;
              };
            } else if (
              fieldConf.field_type === 'IntegerField' ||
              fieldConf.field_type === 'FloatField'
            ) {
              column.valueType = 'digit';
              column.render = (value: any) => {
                if (value === null || value === undefined) return '-';
                return Number(value).toLocaleString();
              };
            } else {
              column.valueType = 'text';
              column.render = (value: any) => {
                if (value === null || value === undefined) return '-';
                // Handle text truncation
                if (typeof value === 'string' && value.length > 30) {
                  return `${value.substring(0, 30)}...`;
                }
                return value;
              };
            }

            // Add sort based on list_sort
            if (attrs.list_sort?.includes(fieldName)) {
              column.sorter = true;
            }

            return column;
          })}
        search={
          modelDesc.attrs?.list_search?.length > 0
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

export default M2MSelectionModal;
