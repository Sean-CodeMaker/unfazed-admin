import { Modal, message } from 'antd';
import React, { useCallback, useState } from 'react';
import {
  deleteModelData,
  executeModelAction,
  getModelData,
  saveModelData,
} from '@/services/api';

interface UseInlineOperationsOptions {
  mainRecord: Record<string, any>;
}

export const useInlineOperations = ({
  mainRecord,
}: UseInlineOperationsOptions) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [inlineData, setInlineData] = useState<
    Record<string, Record<string, any>[]>
  >({});
  const [editingKeys, setEditingKeys] = useState<Record<string, any[]>>({});
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['main']));

  // Build query conditions based on relation type
  const buildConditions = useCallback(
    (inlineDesc: any, record: Record<string, any>) => {
      const relation = inlineDesc?.relation;
      if (!relation) return [];

      switch (relation.relation) {
        case 'fk':
          return [
            {
              field: relation.source_field,
              eq: record[relation.target_field],
            },
          ];
        case 'o2o':
          return [
            {
              field: relation.source_field,
              eq: record[relation.target_field],
            },
          ];
        case 'bk_fk':
          return [
            {
              field: relation.target_field,
              eq: record[relation.source_field],
            },
          ];
        case 'bk_o2o':
          return [
            {
              field: relation.target_field,
              eq: record[relation.source_field],
            },
          ];
        default:
          console.error(`Unsupported relation type: ${relation.relation}`);
          return [];
      }
    },
    [],
  );

  // Handle inline action execution
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
        const cond = record ? [{ field: 'id', eq: record.id }] : [];

        const response = await executeModelAction({
          name: inlineName,
          action: actionKey,
          form_data: {},
          search_condition: isBatch ? [] : cond,
        });

        if (response?.code === 0) {
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

  // Save single inline record
  const handleInlineSave = useCallback(
    async (inlineName: string, record: Record<string, any>) => {
      try {
        const payload = { ...record };

        const response = await saveModelData({
          name: inlineName,
          data: payload,
        });

        if (response?.code === 0) {
          messageApi.success('Saved successfully');
          setInlineData((prev) => ({
            ...prev,
            [inlineName]: (prev[inlineName] || []).map((item) =>
              item.id === payload.id ? { ...item, ...payload } : item,
            ),
          }));
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
    },
    [messageApi],
  );

  // Delete single inline record
  const handleInlineDelete = useCallback(
    async (inlineName: string, record: Record<string, any>) => {
      try {
        const response = await deleteModelData({
          name: inlineName,
          data: record,
        });

        if (response?.code === 0) {
          messageApi.success('Deleted successfully');
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
    },
    [messageApi],
  );

  // Load inline data
  const loadInlineData = useCallback(
    async (
      inlineName: string,
      inlineDesc: any,
      mainRecordData: Record<string, any>,
    ) => {
      try {
        const relation = inlineDesc.relation;

        if (relation?.relation === 'm2m' && relation?.through) {
          const { through } = relation;

          // Load through table data
          const throughResponse = await getModelData({
            name: through.through,
            page: 1,
            size: 1000,
            cond: [
              {
                field: through.source_to_through_field,
                eq: mainRecordData[through.source_field],
              },
            ],
          });

          // Load target table data
          const targetResponse = await getModelData({
            name: relation.target,
            page: 1,
            size: 1000,
            cond: [],
          });

          if (throughResponse?.code === 0 && targetResponse?.code === 0) {
            const throughData = throughResponse.data?.data || [];
            const targetData = targetResponse.data?.data || [];

            const selectedTargetIds = throughData.map(
              (item: any) => item[through.target_to_through_field],
            );
            const enrichedTargetData = targetData.map((targetItem: any) => ({
              ...targetItem,
              selected: selectedTargetIds.includes(
                targetItem[through.target_field],
              ),
            }));

            setInlineData((prev) => ({
              ...prev,
              [inlineName]: enrichedTargetData,
              [`${inlineName}_through`]: throughData,
            }));
          }
        } else {
          const conditions = buildConditions(inlineDesc, mainRecordData);
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
    [buildConditions, messageApi],
  );

  // Handle M2M add (one by one, backend doesn't support batch)
  const handleM2MAdd = useCallback(
    async (inlineName: string, inlineDesc: any, targetRecords: any[]) => {
      try {
        const relation = inlineDesc.relation;
        if (
          relation?.relation === 'm2m' &&
          relation?.through &&
          targetRecords.length > 0
        ) {
          const { through } = relation;

          // Save each relation one by one (backend doesn't support batch)
          for (const targetRecord of targetRecords) {
            const throughData = {
              [through.source_to_through_field]:
                mainRecord[through.source_field],
              [through.target_to_through_field]:
                targetRecord[through.target_field],
            };

            const response = await saveModelData({
              name: through.through,
              data: throughData,
            });

            if (response?.code !== 0) {
              messageApi.error(
                `Failed to add relation for record ${targetRecord.id}`,
              );
              return;
            }
          }

          messageApi.success(
            `Successfully added ${targetRecords.length} relation(s)`,
          );
        }
      } catch (error) {
        messageApi.error('Failed to add relations');
        console.error('Add M2M error:', error);
      }
    },
    [mainRecord, messageApi],
  );

  // Handle M2M remove (one by one, backend doesn't support batch)
  const handleM2MRemove = useCallback(
    async (inlineName: string, inlineDesc: any, targetRecords: any | any[]) => {
      try {
        const relation = inlineDesc.relation;
        if (relation?.relation === 'm2m' && relation?.through) {
          const { through } = relation;

          // Support both single record and array of records
          const records = Array.isArray(targetRecords)
            ? targetRecords
            : [targetRecords];

          if (records.length === 0) return;

          // Delete each relation one by one (backend doesn't support batch)
          for (const targetRecord of records) {
            const throughData = {
              [through.source_to_through_field]:
                mainRecord[through.source_field],
              [through.target_to_through_field]:
                targetRecord[through.target_field],
            };

            const response = await deleteModelData({
              name: through.through,
              data: throughData,
            } as any);

            if (response?.code !== 0) {
              messageApi.error(
                `Failed to remove relation for record ${targetRecord.id}`,
              );
              return;
            }
          }

          messageApi.success(
            records.length === 1
              ? 'Relation removed'
              : `Successfully removed ${records.length} relation(s)`,
          );
        }
      } catch (error) {
        messageApi.error('Failed to remove relation');
        console.error('Remove M2M error:', error);
      }
    },
    [mainRecord, messageApi],
  );

  // Handle back relation link (for bk_fk and bk_o2o)
  // This updates the target record's foreign key field to point to the current main record
  const handleBackRelationLink = useCallback(
    async (inlineName: string, inlineDesc: any, targetRecords: any[]) => {
      try {
        const relation = inlineDesc.relation;
        if (relation?.relation === 'bk_fk' || relation?.relation === 'bk_o2o') {
          // Link each selected record to the main record
          for (const targetRecord of targetRecords) {
            // Send full record data with updated FK field and current timestamp (seconds)
            const response = await saveModelData({
              name: inlineName,
              data: {
                ...targetRecord,
                [relation.target_field]: mainRecord[relation.source_field],
                updated_at: Math.floor(Date.now() / 1000),
              },
            });

            if (response?.code !== 0) {
              messageApi.error(`Failed to link record ${targetRecord.id}`);
              return;
            }
          }

          messageApi.success(
            `Successfully linked ${targetRecords.length} record(s)`,
          );
          // Note: Don't call loadInlineData here - back relation tables use onRequest
          // The caller should call reload() on the table's actionRef instead
        }
      } catch (error) {
        messageApi.error('Failed to link records');
        console.error('Link back relation error:', error);
      }
    },
    [mainRecord, messageApi],
  );

  // Handle back relation unlink (for bk_fk and bk_o2o)
  // This sets the target record's foreign key field to null
  const handleBackRelationUnlink = useCallback(
    async (inlineName: string, inlineDesc: any, targetRecord: any) => {
      try {
        const relation = inlineDesc.relation;
        if (relation?.relation === 'bk_fk' || relation?.relation === 'bk_o2o') {
          // Send full record data with FK field set to -1 and current timestamp (seconds)
          const response = await saveModelData({
            name: inlineName,
            data: {
              ...targetRecord,
              [relation.target_field]: -1,
              updated_at: Math.floor(Date.now() / 1000),
            },
          });

          if (response?.code === 0) {
            messageApi.success('Unlinked successfully');
            // Note: Don't call loadInlineData here - back relation tables use onRequest
            // The caller should call reload() on the table's actionRef instead
          } else {
            messageApi.error(response?.message || 'Failed to unlink');
          }
        }
      } catch (error) {
        messageApi.error('Failed to unlink');
        console.error('Unlink back relation error:', error);
      }
    },
    [mainRecord, messageApi],
  );

  // Mark tab as loaded
  const markTabLoaded = useCallback((tabKey: string) => {
    setLoadedTabs((prev) => new Set([...prev, tabKey]));
  }, []);

  // Add new inline record
  const addInlineRecord = useCallback(
    (inlineName: string, newRecord: Record<string, any>) => {
      setInlineData((prev) => ({
        ...prev,
        [inlineName]: [...(prev[inlineName] || []), newRecord],
      }));
      setEditingKeys((prev) => ({
        ...prev,
        [inlineName]: [...(prev[inlineName] || []), newRecord.id],
      }));
    },
    [],
  );

  return {
    contextHolder,
    messageApi,
    inlineData,
    setInlineData,
    editingKeys,
    setEditingKeys,
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
  };
};
