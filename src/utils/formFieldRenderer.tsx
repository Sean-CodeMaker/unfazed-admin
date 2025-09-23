import type { ProFormInstance } from '@ant-design/pro-components';
import {
  ProFormDatePicker,
  ProFormDateTimePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProFormTimePicker,
} from '@ant-design/pro-components';
import { Button, Modal } from 'antd';
import React from 'react';
import { ProFormEditorJS } from '@/components';

/**
 * 渲染表单字段的公共工具函数
 * @param fieldName 字段名称
 * @param fieldConfig 字段配置
 * @param formRef 表单引用（用于 ImageField 预览功能）
 * @param options 额外选项
 */
export const renderFormField = (
  fieldName: string,
  fieldConfig: any,
  formRef?: React.RefObject<ProFormInstance>,
  options?: {
    /** 是否只读模式 */
    readonly?: boolean;
    /** 自定义通用属性 */
    commonProps?: any;
  },
) => {
  const { readonly = false, commonProps: customCommonProps } = options || {};

  const commonProps = {
    name: fieldName,
    label: fieldConfig.name || fieldName,
    tooltip: fieldConfig.help_text,
    readonly: readonly || fieldConfig.readonly,
    rules: fieldConfig.blank
      ? []
      : [
          {
            required: true,
            message: `${fieldConfig.name || fieldName} is required`,
          },
        ],
    ...customCommonProps,
  };

  // 根据字段类型渲染不同的组件
  switch (fieldConfig.field_type) {
    case 'CharField':
      if (fieldConfig.choices && fieldConfig.choices.length > 0) {
        return (
          <ProFormSelect
            key={fieldName}
            {...commonProps}
            options={fieldConfig.choices.map(
              ([value, label]: [string, string]) => ({
                label,
                value,
              }),
            )}
          />
        );
      }
      return <ProFormText key={fieldName} {...commonProps} />;

    case 'TextField':
      return <ProFormTextArea key={fieldName} {...commonProps} />;

    case 'IntegerField':
      return (
        <ProFormDigit
          key={fieldName}
          {...commonProps}
          fieldProps={{
            precision: 0,
          }}
        />
      );

    case 'FloatField':
      return (
        <ProFormDigit
          key={fieldName}
          {...commonProps}
          fieldProps={{
            precision: 2,
          }}
        />
      );

    case 'BooleanField':
      return <ProFormSwitch key={fieldName} {...commonProps} />;

    case 'DateField':
      return <ProFormDatePicker key={fieldName} {...commonProps} />;

    case 'DatetimeField':
      return <ProFormDateTimePicker key={fieldName} {...commonProps} />;

    case 'TimeField':
      return <ProFormTimePicker key={fieldName} {...commonProps} />;

    case 'EditorField':
      return (
        <ProFormEditorJS
          key={fieldName}
          {...commonProps}
          fieldProps={{
            height: 300,
            readOnly: readonly,
            config: {
              placeholder: commonProps.tooltip || 'Start writing your story...',
            },
          }}
        />
      );

    case 'ImageField':
      return (
        <ProFormText
          key={fieldName}
          {...commonProps}
          fieldProps={{
            placeholder: 'Enter image URL...',
            addonAfter: (
              <Button
                size="small"
                onClick={() => {
                  if (!formRef?.current) {
                    Modal.warning({
                      title: 'Preview Unavailable',
                      content: 'Form reference not available for preview',
                    });
                    return;
                  }

                  const url = formRef.current.getFieldValue(fieldName);
                  if (url) {
                    Modal.info({
                      title: 'Image Preview',
                      content: (
                        <div style={{ textAlign: 'center' }}>
                          <img
                            src={url}
                            alt="Preview"
                            style={{
                              maxWidth: '100%',
                              maxHeight: 400,
                              objectFit: 'contain',
                            }}
                            onError={(e) => {
                              e.currentTarget.src =
                                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+2oqIrqwOqG4otoP/7DwhIHGALSCxgCzgASCAJSCBhA0ggAQkgASRAAgkgAQkrAUlbrUoroKChzZmNe/+t2+NZTZ+3pt6vr7+7/ffO9/S7v//x8v9Nv339b7Y8A4cOHjjyBAADGHGAYNwBjFjAGIJBBzBmAYMIJh3AqAWMIph0AKMWMIpg0gGMWsAogkknMGrBgAWMIph0AqMWDFjAKIJJJzBqwYAFjCKYdAKjFgxYwCiCSSc=';
                            }}
                          />
                        </div>
                      ),
                      width: 600,
                    });
                  } else {
                    Modal.warning({
                      title: 'No Image URL',
                      content: 'Please enter an image URL first',
                    });
                  }
                }}
              >
                Preview
              </Button>
            ),
          }}
        />
      );

    default:
      return <ProFormText key={fieldName} {...commonProps} />;
  }
};

/**
 * 批量渲染表单字段
 * @param fields 字段配置对象
 * @param formRef 表单引用
 * @param options 额外选项
 */
export const renderFormFields = (
  fields: Record<string, any>,
  formRef?: React.RefObject<ProFormInstance>,
  options?: {
    /** 是否只读模式 */
    readonly?: boolean;
    /** 字段过滤函数 */
    fieldFilter?: (fieldName: string, fieldConfig: any) => boolean;
    /** 自定义通用属性 */
    commonProps?: any;
  },
) => {
  const { fieldFilter, ...renderOptions } = options || {};

  return Object.entries(fields)
    .map(([fieldName, fieldConfig]: [string, any]) => {
      // 如果字段不显示，跳过
      if (fieldConfig.show === false) return null;

      // 如果有自定义过滤函数，应用过滤
      if (fieldFilter && !fieldFilter(fieldName, fieldConfig)) return null;

      return renderFormField(fieldName, fieldConfig, formRef, renderOptions);
    })
    .filter(Boolean); // 过滤掉 null 值
};
