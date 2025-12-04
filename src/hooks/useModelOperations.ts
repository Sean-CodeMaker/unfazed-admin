import { message } from 'antd';
import { useCallback, useState } from 'react';
import {
  executeModelAction,
  getModelData,
  getModelDesc,
  saveModelData,
} from '@/services/api';

interface UseModelOperationsOptions {
  modelName: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const useModelOperations = ({
  modelName,
  onSuccess,
  onError,
}: UseModelOperationsOptions) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [currentSearchParams, setCurrentSearchParams] = useState<any>({});

  // 从 localStorage 获取设置
  const getStoredSettings = useCallback(() => {
    try {
      const settings = localStorage.getItem('admin-settings');
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      console.error('Failed to parse stored settings:', error);
      return {};
    }
  }, []);

  // 构建搜索条件
  const buildSearchConditions = useCallback(
    (
      searchValues: any,
      modelDesc?: API.AdminSerializeModel,
    ): API.Condition[] => {
      if (!modelDesc) return [];

      const conditions: API.Condition[] = [];

      // strip pagination params
      const {
        current: _c,
        pageSize: _s,
        _timestamp: _t,
        ...searchParams
      } = searchValues;

      Object.entries(searchParams).forEach(([field, value]) => {
        if (value === undefined || value === null || value === '') return;

        const fieldConfig = modelDesc.fields[field];
        if (!fieldConfig) return;

        const condition: API.Condition = { field };

        // if the field is in attrs.list_search, prefer eq for text
        switch (fieldConfig.field_type) {
          case 'CharField':
          case 'TextField':
            if (fieldConfig.choices && fieldConfig.choices.length > 0) {
              condition.eq = String(value);
            } else {
              condition.icontains = String(value);
            }
            break;

          case 'IntegerField':
          case 'FloatField':
            condition.eq = Number(value);
            break;

          case 'BooleanField':
            condition.eq = value ? 1 : 0;
            break;

          case 'DateField':
          case 'DatetimeField':
            if (Array.isArray(value) && value.length === 2) {
              // range
              const [start, end] = value;
              if (start && end) {
                conditions.push(
                  {
                    field,
                    gte:
                      (start as any)?.format?.('YYYY-MM-DD') || String(start),
                  } as any,
                  {
                    field,
                    lte: (end as any)?.format?.('YYYY-MM-DD') || String(end),
                  } as any,
                );
              }
              return;
            } else if ((value as any)?.format) {
              condition.eq = (value as any).format(
                fieldConfig.field_type === 'DateField'
                  ? 'YYYY-MM-DD'
                  : 'YYYY-MM-DD HH:mm:ss',
              ) as any;
            }
            break;

          default:
            if (typeof value === 'string' || typeof value === 'number') {
              condition.eq = value as any;
            }
        }

        if (
          condition.eq !== undefined ||
          (condition as any).lt !== undefined ||
          (condition as any).lte !== undefined ||
          (condition as any).gt !== undefined ||
          (condition as any).gte !== undefined ||
          (condition as any).contains !== undefined ||
          (condition as any).icontains !== undefined
        ) {
          conditions.push(condition);
        }
      });

      return conditions;
    },
    [],
  );

  // 获取模型描述
  const fetchModelDesc =
    useCallback(async (): Promise<API.AdminSerializeModel | null> => {
      try {
        const response = await getModelDesc(modelName);
        if (response?.code === 0) {
          return response.data;
        } else {
          messageApi.error(
            response?.message || 'Failed to fetch model description',
          );
          onError?.(response);
          return null;
        }
      } catch (error) {
        messageApi.error('Failed to fetch model description');
        onError?.(error);
        return null;
      }
    }, [modelName, messageApi, onError]);

  // 获取模型数据
  const fetchModelData = useCallback(
    async (params: any, modelDesc?: API.AdminSerializeModel) => {
      if (!modelDesc) {
        return { data: [], success: false, total: 0 };
      }

      // 保存当前搜索参数用于 action 执行
      setCurrentSearchParams(params);

      const storedSettings = getStoredSettings();
      const pageSize =
        storedSettings.pageSize || modelDesc.attrs.list_per_page || 20;

      // 构建搜索条件
      const conditions = buildSearchConditions(params, modelDesc);

      try {
        const response = await getModelData({
          name: modelName,
          page: params.current || 1,
          size: params.pageSize || pageSize,
          cond: conditions.length > 0 ? conditions : undefined,
        });

        if (response.code === 0) {
          return {
            data: response.data.data,
            success: true,
            total: response.data.count,
          };
        } else {
          messageApi.error(response.message || 'Failed to fetch data');
          onError?.(response);
          return { data: [], success: false, total: 0 };
        }
      } catch (error) {
        messageApi.error('Failed to fetch data');
        onError?.(error);
        console.error('Fetch data error:', error);
        return { data: [], success: false, total: 0 };
      }
    },
    [modelName, messageApi, onError, getStoredSettings, buildSearchConditions],
  );

  // 处理action响应结果
  const handleActionResponse = useCallback(
    (response: any, actionConfig: any) => {
      if (!response || response.code !== 0) {
        messageApi.error(response?.message || 'Operation failed');
        return;
      }

      // 根据action的output类型处理响应
      switch (actionConfig?.output) {
        case 'toast':
          messageApi.success(response.message || 'Operation successful');
          break;
        case 'download':
          // 处理文件下载
          if (response.data?.url) {
            const link = document.createElement('a');
            link.href = response.data.url;
            link.download = response.data.filename || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else if (response.data?.content) {
            // 如果返回的是文件内容，创建blob下载
            const blob = new Blob([response.data.content], {
              type: response.data.contentType || 'application/octet-stream',
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = response.data.filename || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          }
          break;
        case 'refresh':
          messageApi.success(response.message || 'Operation successful');
          onSuccess?.(); // 触发页面刷新
          break;
        case 'display':
          // display类型的处理在调用处进行，这里只返回数据
          return response.data;
        default:
          messageApi.success(response.message || 'Operation successful');
      }

      return response.data;
    },
    [messageApi, onSuccess],
  );

  // 执行批量操作
  const executeBatchAction = useCallback(
    async (
      actionKey: string,
      _records: Record<string, any>[],
      modelDesc?: API.AdminSerializeModel,
      extra?: any,
      searchParams?: Record<string, any>,
    ) => {
      try {
        // Use provided searchParams if it has valid values, otherwise fall back to currentSearchParams
        // Check if searchParams has any non-undefined, non-null, non-empty values
        const hasValidSearchParams =
          searchParams &&
          Object.values(searchParams).some(
            (v) => v !== undefined && v !== null && v !== '',
          );
        const paramsToUse = hasValidSearchParams
          ? searchParams
          : currentSearchParams;

        console.log('executeBatchAction - searchParams:', searchParams);
        console.log(
          'executeBatchAction - hasValidSearchParams:',
          hasValidSearchParams,
        );
        console.log(
          'executeBatchAction - currentSearchParams:',
          currentSearchParams,
        );
        console.log('executeBatchAction - paramsToUse:', paramsToUse);

        // Build search conditions in structured format
        const searchConditions = buildSearchConditions(paramsToUse, modelDesc);
        console.log('executeBatchAction - searchConditions:', searchConditions);

        const payload: API.ModelActionRequest = {
          name: modelName,
          action: actionKey,
        };

        if (searchConditions.length > 0) {
          payload.search_condition = searchConditions;
        }

        if (
          extra &&
          typeof extra === 'object' &&
          Object.keys(extra).length > 0
        ) {
          payload.form_data = extra;
        }

        const response = await executeModelAction(payload);

        // 获取action配置
        const actionConfig = modelDesc?.actions?.[actionKey];
        const result = handleActionResponse(response, actionConfig);

        if ((actionConfig as any)?.output !== 'display') {
          onSuccess?.();
        }

        return { success: true, data: result, actionConfig };
      } catch (error) {
        messageApi.error('Operation failed');
        onError?.(error);
        console.error('Batch action error:', error);
        return { success: false, data: null, actionConfig: null };
      }
    },
    [
      modelName,
      messageApi,
      buildSearchConditions,
      currentSearchParams,
      onSuccess,
      onError,
      handleActionResponse,
    ],
  );

  // 执行行级操作
  const executeRowAction = useCallback(
    async (
      actionKey: string,
      record: Record<string, any>,
      modelDesc?: API.AdminSerializeModel,
      extra?: any,
    ) => {
      try {
        // 为单个记录生成条件，只需要当前行的 ID
        const conditions: API.Condition[] = [
          {
            field: 'id',
            eq: record.id,
          },
        ];

        const response = await executeModelAction({
          name: modelName,
          action: actionKey,
          search_condition: conditions,
          // Always provide the full row payload so the API has complete context.
          form_data: {
            ...(record || {}),
            ...(extra || {}),
          },
        });

        // 获取action配置
        const actionConfig = modelDesc?.actions?.[actionKey];
        const result = handleActionResponse(response, actionConfig);

        if ((actionConfig as any)?.output !== 'display') {
          onSuccess?.();
        }

        return { success: true, data: result, actionConfig };
      } catch (error) {
        messageApi.error('Operation failed');
        onError?.(error);
        console.error('Row action error:', error);
        return { success: false, data: null, actionConfig: null };
      }
    },
    [modelName, messageApi, onSuccess, onError, handleActionResponse],
  );

  // 保存模型数据
  const saveData = useCallback(
    async (data: Record<string, any>) => {
      try {
        await saveModelData({
          name: modelName,
          data,
        });
        messageApi.success('Saved successfully');
        onSuccess?.();
        return true;
      } catch (error) {
        messageApi.error('Save failed');
        onError?.(error);
        console.error('Save error:', error);
        return false;
      }
    },
    [modelName, messageApi, onSuccess, onError],
  );

  return {
    contextHolder,
    messageApi,
    currentSearchParams,
    setCurrentSearchParams,
    getStoredSettings,
    buildSearchConditions,
    fetchModelDesc,
    fetchModelData,
    executeBatchAction,
    executeRowAction,
    saveData,
    handleActionResponse,
  };
};
