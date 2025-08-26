import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { ProFormItem } from '@ant-design/pro-components';
import type { ProFormItemProps } from '@ant-design/pro-components';
import EditorJSComponent from '../EditorJS';
import type { EditorJSProps, EditorJSRef } from '../EditorJS';
import type { OutputData } from '@editorjs/editorjs';

export interface ProFormEditorJSProps extends ProFormItemProps {
    /** Editor.js 的属性 */
    fieldProps?: EditorJSProps & {
        /** 编辑器高度 */
        height?: number;
        /** 是否只读 */
        readOnly?: boolean;
    };
}

const ProFormEditorJS = forwardRef<EditorJSRef, ProFormEditorJSProps>(({
    fieldProps,
    ...restProps
}, ref) => {
    const editorRef = useRef<EditorJSRef>(null);

    // 暴露编辑器方法
    useImperativeHandle(ref, () => ({
        save: async () => {
            if (!editorRef.current) {
                throw new Error('Editor is not initialized');
            }
            return await editorRef.current.save();
        },
        clear: async () => {
            if (editorRef.current) {
                await editorRef.current.clear();
            }
        },
        destroy: async () => {
            if (editorRef.current) {
                await editorRef.current.destroy();
            }
        },
        getEditor: () => {
            return editorRef.current?.getEditor() || null;
        },
    }));

    return (
        <ProFormItem
            {...restProps}
            // 自定义渲染函数，处理表单值的转换
            getValueFromEvent={(data: OutputData) => {
                // 将 Editor.js 的 OutputData 转换为 JSON 字符串存储
                return JSON.stringify(data);
            }}
            normalize={(value: string) => {
                // 从 JSON 字符串转换回 OutputData
                if (!value) return undefined;
                try {
                    return JSON.parse(value);
                } catch (error) {
                    console.error('Error parsing editor data:', error);
                    return undefined;
                }
            }}
        >
            <EditorJSComponent
                ref={editorRef}
                {...fieldProps}
                config={{
                    ...fieldProps?.config,
                    minHeight: fieldProps?.height || 200,
                    readOnly: fieldProps?.readOnly || false,
                }}
            />
        </ProFormItem>
    );
});

ProFormEditorJS.displayName = 'ProFormEditorJS';

export default ProFormEditorJS;
