import Code from '@editorjs/code';
import EditorJS, { type OutputData } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import InlineCode from '@editorjs/inline-code';
import LinkTool from '@editorjs/link';
import List from '@editorjs/list';
import Marker from '@editorjs/marker';
import Paragraph from '@editorjs/paragraph';
import Quote from '@editorjs/quote';
import SimpleImage from '@editorjs/simple-image';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

export interface EditorJSProps {
  /** 编辑器的初始数据 */
  data?: OutputData;
  /** 数据变化回调 */
  onChange?: (data: OutputData) => void;
  /** 编辑器配置 */
  config?: {
    /** 是否只读 */
    readOnly?: boolean;
    /** 占位符文本 */
    placeholder?: string;
    /** 最小高度 */
    minHeight?: number;
  };
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

export interface EditorJSRef {
  /** 获取编辑器数据 */
  save: () => Promise<OutputData>;
  /** 清空编辑器 */
  clear: () => Promise<void>;
  /** 销毁编辑器实例 */
  destroy: () => Promise<void>;
  /** 获取原始编辑器实例 */
  getEditor: () => EditorJS | null;
}

const EditorJSComponent = forwardRef<EditorJSRef, EditorJSProps>(
  ({ data, onChange, config = {}, style = {}, className = '' }, ref) => {
    const editorRef = useRef<EditorJS | null>(null);
    const holderRef = useRef<HTMLDivElement>(null);
    const isInitialized = useRef(false);

    // 配置 Editor.js 工具
    const tools = {
      header: Header,
      paragraph: Paragraph,
      list: List,
      quote: Quote,
      code: Code,
      linkTool: LinkTool,
      image: SimpleImage,
      marker: Marker,
      inlineCode: InlineCode,
    } as any;

    // 初始化编辑器
    const initEditor = async () => {
      if (!holderRef.current || isInitialized.current) return;

      try {
        editorRef.current = new EditorJS({
          holder: holderRef.current,
          tools,
          data: data || undefined,
          readOnly: config.readOnly || false,
          placeholder: config.placeholder || "Let's write an awesome story!",
          minHeight: config.minHeight || 200,
          onChange: async (api, _event) => {
            if (onChange) {
              try {
                const outputData = await api.saver.save();
                onChange(outputData);
              } catch (error) {
                console.error('Error saving editor data:', error);
              }
            }
          },
          onReady: () => {
            console.log('Editor.js is ready to work!');
          },
        });

        await editorRef.current.isReady;
        isInitialized.current = true;
      } catch (error) {
        console.error('Error initializing Editor.js:', error);
      }
    };

    // 暴露给父组件的方法
    useImperativeHandle(ref, () => ({
      save: async () => {
        if (!editorRef.current) {
          throw new Error('Editor is not initialized');
        }
        return await editorRef.current.save();
      },
      clear: async () => {
        if (!editorRef.current) return;
        await editorRef.current.clear();
      },
      destroy: async () => {
        if (editorRef.current) {
          await editorRef.current.destroy();
          editorRef.current = null;
          isInitialized.current = false;
        }
      },
      getEditor: () => editorRef.current,
    }));

    // 初始化编辑器
    useEffect(() => {
      initEditor();

      return () => {
        // 清理编辑器实例
        if (editorRef.current) {
          editorRef.current.destroy();
          editorRef.current = null;
          isInitialized.current = false;
        }
      };
    }, []);

    // 数据更新时重新渲染
    useEffect(() => {
      if (editorRef.current && data && isInitialized.current) {
        editorRef.current.render(data);
      }
    }, [data]);

    return (
      <div
        ref={holderRef}
        style={{
          border: '1px solid #e8e8e8',
          borderRadius: '6px',
          padding: '16px',
          minHeight: config.minHeight || 200,
          ...style,
        }}
        className={`editorjs-container ${className}`}
      />
    );
  },
);

EditorJSComponent.displayName = 'EditorJS';

export default EditorJSComponent;
