import { message } from 'antd';
import dayjs from 'dayjs';
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

      // 从搜索参数获取条件 (排除分页参数)
      const {
        current: _current,
        pageSize: _requestPageSize,
        ...searchParams
      } = searchValues;
      Object.entries(searchParams).forEach(([field, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          const fieldConfig = modelDesc.fields[field];
          if (fieldConfig) {
            const condition: API.Condition = { field };

            // 根据字段类型设置搜索条件
            switch (fieldConfig.type) {
              case 'CharField':
              case 'TextField':
                condition.icontains = String(value);
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
                  // 日期范围搜索
                  const startDate = dayjs.isDayjs(value[0])
                    ? value[0].format('YYYY-MM-DD')
                    : '';
                  const endDate = dayjs.isDayjs(value[1])
                    ? value[1].format('YYYY-MM-DD')
                    : '';
                  if (startDate && endDate) {
                    conditions.push(
                      { field, gte: startDate as any },
                      { field, lte: endDate as any },
                    );
                  }
                  return;
                } else if (dayjs.isDayjs(value)) {
                  condition.eq = value.format('YYYY-MM-DD');
                }
                break;
              default:
                if (typeof value === 'string' || typeof value === 'number') {
                  condition.eq = value;
                }
            }

            if (
              condition.eq !== undefined ||
              condition.lt !== undefined ||
              condition.lte !== undefined ||
              condition.gt !== undefined ||
              condition.gte !== undefined ||
              condition.contains !== undefined ||
              condition.icontains !== undefined
            ) {
              conditions.push(condition);
            }
          }
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
      records: Record<string, any>[],
      modelDesc?: API.AdminSerializeModel,
      extra?: any,
    ) => {
      try {
        // 获取当前搜索条件
        const searchConditions = buildSearchConditions(
          currentSearchParams,
          modelDesc,
        );

        let allConditions: API.Condition[] = [...searchConditions];

        // 如果提供了records，则为基于选中记录的操作
        if (records.length > 0) {
          // 根据 records 生成选中记录的条件
          const recordConditions: API.Condition[] = records.map((record) => ({
            field: 'id',
            eq: record.id,
          }));
          // 合并搜索条件和选中记录条件
          allConditions = [...searchConditions, ...recordConditions];
        }
        // 如果records为空，则为基于搜索条件的批量操作，只使用搜索条件

        const response = await executeModelAction({
          name: modelName,
          action: actionKey,
          search_condition:
            allConditions.length > 0 ? allConditions : undefined,
          form_data: extra || {},
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
          form_data: extra || {},
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
