import { LinkOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import { Button, Modal } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { getModelData } from '@/services/api';

interface BackRelationSelectionModalProps {
  visible: boolean;
  onCancel: () => void;
  onLink: (selectedRecords: any[]) => void;
  title: string;
  modelName: string;
  modelDesc: any;
  relation: API.Relation;
  mainRecordId?: any;
  // For bk_o2o, only allow single selection
  isSingleSelect?: boolean;
  loading?: boolean;
}

const BackRelationSelectionModal: React.FC<BackRelationSelectionModalProps> = ({
  visible,
  onCancel,
  onLink,
  title,
  modelName,
  modelDesc,
  relation,
  mainRecordId,
  isSingleSelect = false,
  loading = false,
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  // Reset selection state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedRowKeys([]);
      setSelectedRows([]);
    }
  }, [visible]);

  const handleOk = () => {
    if (selectedRows.length > 0) {
      onLink(selectedRows);
    }
  };

  // Check if a record is linked to the current main record
  const isLinkedToCurrentRecord = (record: any) => {
    const fkValue = record[relation.target_field];
    return fkValue === mainRecordId;
  };

  const rowSelection = {
    type: isSingleSelect ? ('radio' as const) : ('checkbox' as const),
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[], newSelectedRows: any[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
      setSelectedRows(newSelectedRows);
    },
    // Disable selection for records already linked to current record
    getCheckboxProps: (record: any) => ({
      disabled: isLinkedToCurrentRecord(record),
    }),
  };

  return (
    <Modal
      title={
        <span>
          <LinkOutlined style={{ marginRight: 8 }} />
          Link {title}
        </span>
      }
      open={visible}
      onCancel={onCancel}
      width={1000}
      style={{ top: 20 }}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="link"
          type="primary"
          icon={<LinkOutlined />}
          onClick={handleOk}
          disabled={selectedRowKeys.length === 0}
          loading={loading}
        >
          Link Selected ({selectedRowKeys.length})
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <span style={{ color: '#666' }}>
          {isSingleSelect
            ? 'Select one record to link'
            : `Select records to link (${selectedRowKeys.length} selected)`}
        </span>
      </div>

      <ProTable
        rowKey="id"
        size="small"
        scroll={{ y: 400 }}
        rowSelection={rowSelection}
        rowClassName={(record) => {
          if (isLinkedToCurrentRecord(record)) {
            return 'linked-to-current';
          }
          return '';
        }}
        request={async (params) => {
          try {
            // Build search conditions - show ALL records
            const conditions: any[] = [];

            // Process form search conditions
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

            const response = await getModelData({
              name: modelName,
              page: params.current || 1,
              size: params.pageSize || 10,
              cond: conditions,
            });

            if (response?.code === 0) {
              const responseData = response.data?.data || [];
              const total = response.data?.count || 0;

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
        columns={[
          ...Object.entries(modelDesc.fields || {})
            .filter(
              ([fieldName, fieldConfig]) =>
                (fieldConfig as any).show !== false &&
                fieldName !== relation.target_field, // Hide the FK field since we're linking
            )
            .slice(0, 6) // Limit columns for better display
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
                column.render = (value: any, record: any) => {
                  const actualValue = record?.[fieldName] ?? value;
                  if (actualValue === null || actualValue === undefined)
                    return '-';
                  const choice = fieldConf.choices.find(
                    ([choiceValue]: [string, string]) =>
                      choiceValue === actualValue,
                  );
                  return choice ? choice[1] : actualValue;
                };
              } else if (fieldConf.field_type === 'BooleanField') {
                column.valueType = 'switch';
                column.render = (value: any, record: any) => {
                  const actualValue = record?.[fieldName] ?? value;
                  return actualValue ? '✓' : '✗';
                };
              } else if (fieldConf.field_type === 'DateField') {
                column.valueType = 'date';
                column.render = (value: any, record: any) => {
                  const actualValue = record?.[fieldName] ?? value;
                  if (actualValue === null || actualValue === undefined)
                    return '-';
                  const numValue =
                    typeof actualValue === 'string'
                      ? Number(actualValue)
                      : actualValue;
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
              } else if (fieldConf.field_type === 'DatetimeField') {
                column.valueType = 'dateTime';
                column.render = (value: any, record: any) => {
                  const actualValue = record?.[fieldName] ?? value;
                  if (actualValue === null || actualValue === undefined)
                    return '-';
                  const numValue =
                    typeof actualValue === 'string'
                      ? Number(actualValue)
                      : actualValue;
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
              } else if (fieldConf.field_type === 'TimeField') {
                column.valueType = 'time';
                column.render = (value: any, record: any) => {
                  const actualValue = record?.[fieldName] ?? value;
                  if (actualValue === null || actualValue === undefined)
                    return '-';
                  const numValue =
                    typeof actualValue === 'string'
                      ? Number(actualValue)
                      : actualValue;
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
              } else if (
                fieldConf.field_type === 'IntegerField' ||
                fieldConf.field_type === 'FloatField'
              ) {
                column.valueType = 'digit';
                column.render = (value: any, record: any) => {
                  const actualValue = record?.[fieldName] ?? value;
                  if (actualValue === null || actualValue === undefined)
                    return '-';
                  const num = Number(actualValue);
                  if (Number.isNaN(num)) return '-';
                  return num.toLocaleString();
                };
              } else {
                column.valueType = 'text';
                column.render = (value: any, record: any) => {
                  const actualValue = record?.[fieldName] ?? value;
                  if (actualValue === null || actualValue === undefined)
                    return '-';
                  if (
                    typeof actualValue === 'string' &&
                    actualValue.length > 30
                  ) {
                    return `${actualValue.substring(0, 30)}...`;
                  }
                  return actualValue;
                };
              }

              // Add sort based on list_sort
              if (attrs.list_sort?.includes(fieldName)) {
                column.sorter = true;
              }

              return column;
            }),
        ]}
        search={
          modelDesc.attrs?.list_search?.length > 0
            ? {
                labelWidth: 120,
                defaultCollapsed: true,
              }
            : false
        }
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          showQuickJumper: false,
        }}
        options={{
          search: false,
          reload: true,
          density: false,
          setting: false,
        }}
        toolBarRender={false}
      />

      <style>
        {`
          .linked-to-current {
            background-color: #f5f5f5 !important;
          }
          .linked-to-current td {
            color: #999 !important;
          }
        `}
      </style>
    </Modal>
  );
};

export default BackRelationSelectionModal;
