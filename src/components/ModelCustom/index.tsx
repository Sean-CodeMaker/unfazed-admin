import type { ProFormInstance } from '@ant-design/pro-components';
import { PageContainer, ProForm } from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import { Button, Card, Divider, Modal, message, Space, Spin } from 'antd';
import React, { useCallback, useRef, useState } from 'react';
import { executeModelAction, getModelDesc } from '@/services/api';
import { renderFormField } from '@/utils/formFieldRenderer';

interface ModelCustomProps {
  toolName: string;
  onBack?: () => void;
}

const ModelCustom: React.FC<ModelCustomProps> = ({ toolName, onBack }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const formRef = useRef<ProFormInstance>(null!);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {},
  );
  const [toolDesc, setToolDesc] = useState<API.AdminToolSerializeModel | null>(
    null,
  );

  // 懒加载 model-desc
  const { loading: descLoading } = useRequest(
    async () => {
      const response = await getModelDesc(toolName);
      if (response?.code === 0) {
        setToolDesc(response.data as API.AdminToolSerializeModel);
      }
      return response;
    },
    {
      manual: false,
    },
  );

  // 执行 Action
  const executeAction = useCallback(
    async (actionKey: string, actionConfig: any, formData: any) => {
      if (!toolDesc) return;

      setActionLoading((prev) => ({ ...prev, [actionKey]: true }));

      try {
        const response = await executeModelAction({
          name: toolName,
          action: actionKey,
          form_data: formData || {},
          search_condition: [],
        });

        if (response?.code === 0) {
          switch (actionConfig.output) {
            case 'toast':
              messageApi.success(
                response.message || 'Action completed successfully',
              );
              break;

            case 'display': {
              // 显示数据弹窗
              const displayData = response.data;

              Modal.info({
                title: actionConfig.label || actionConfig.name,
                width: Math.min(800, window.innerWidth * 0.8),
                content: (
                  <div style={{ maxHeight: 400, overflow: 'auto' }}>
                    <pre
                      style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {typeof displayData === 'object'
                        ? JSON.stringify(displayData, null, 2)
                        : String(displayData)}
                    </pre>
                  </div>
                ),
              });
              break;
            }

            case 'download':
              // 处理文件下载
              if (response.data && typeof response.data === 'string') {
                const blob = new Blob([response.data], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${actionConfig.name}_${Date.now()}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
              }
              messageApi.success('File downloaded successfully');
              break;

            case 'refresh':
              messageApi.success(
                response.message || 'Action completed successfully',
              );
              // 可以在这里添加页面刷新逻辑
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
      } finally {
        setActionLoading((prev) => ({ ...prev, [actionKey]: false }));
      }
    },
    [toolName, toolDesc, messageApi],
  );

  // 渲染操作按钮
  const renderActionButtons = useCallback(() => {
    if (!toolDesc) return [];

    const buttons: React.ReactNode[] = [];

    Object.entries(toolDesc.actions || {}).forEach(
      ([actionKey, actionConfig]: [string, any]) => {
        buttons.push(
          <Button
            key={actionKey}
            type={actionKey === 'submit' ? 'primary' : 'default'}
            loading={actionLoading[actionKey]}
            onClick={async () => {
              // 根据 action input 类型处理
              if (actionConfig.input === 'empty') {
                // 不需要表单数据
                await executeAction(actionKey, actionConfig, {});
              } else {
                // 需要表单数据
                try {
                  const formData = await formRef.current?.validateFields();
                  await executeAction(actionKey, actionConfig, formData);
                } catch (_error) {
                  messageApi.warning('Please fill in all required fields');
                }
              }
            }}
          >
            {actionConfig.label || actionConfig.name}
          </Button>,
        );
      },
    );

    return buttons;
  }, [toolDesc?.actions, actionLoading, executeAction, messageApi]);

  // 如果正在加载或没有数据，显示加载状态
  if (descLoading || !toolDesc) {
    return (
      <PageContainer
        header={{
          title: toolName,
          breadcrumb: {},
          extra: onBack
            ? [
                <Button key="back" onClick={onBack}>
                  Back
                </Button>,
              ]
            : [],
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
          }}
        >
          <Spin size="large" tip="Loading tool description..." />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      header={{
        title: toolDesc.attrs.help_text || toolName,
        breadcrumb: {},
        extra: onBack
          ? [
              <Button key="back" onClick={onBack}>
                Back
              </Button>,
            ]
          : [],
      }}
    >
      {contextHolder}

      <Card>
        <ProForm
          formRef={formRef}
          layout="horizontal"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          submitter={false} // 禁用默认提交按钮
        >
          <Divider orientation="left">
            {toolDesc.attrs.help_text || 'Custom Tool'}
          </Divider>

          {/* 渲染字段 */}
          {Object.entries(toolDesc.fields || {}).map(
            ([fieldName, fieldConfig]: [string, any]) => {
              if (!fieldConfig.show) return null;
              return renderFormField(fieldName, fieldConfig, formRef, {
                commonProps: {
                  disabled: fieldConfig.readonly,
                  rules: fieldConfig.blank
                    ? []
                    : [
                        {
                          required: true,
                          message: `${fieldConfig.name || fieldName} is required`,
                        },
                      ],
                },
              });
            },
          )}

          {/* 渲染操作按钮 */}
          <Divider />
          <div style={{ textAlign: 'center' }}>
            <Space size="middle">{renderActionButtons()}</Space>
          </div>
        </ProForm>
      </Card>
    </PageContainer>
  );
};

export default ModelCustom;
