import React, { useState } from 'react';
import { useSearchParams } from '@umijs/max';
import { Modal, message } from 'antd';
import { ModelList } from '@/components';

/**
 * 模型管理页面
 * 通过 URL 参数 model 指定要管理的模型名称
 * 例如: /model-admin?model=User
 */
const ModelAdmin: React.FC = () => {
    const [searchParams] = useSearchParams();
    const modelName = searchParams.get('model') || '';
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<Record<string, any> | null>(null);

    // 处理编辑操作
    const handleEdit = (record: Record<string, any>) => {
        setCurrentRecord(record);
        setEditModalVisible(true);
    };

    // 处理新增操作
    const handleAdd = () => {
        setCurrentRecord(null);
        setAddModalVisible(true);
    };

    // 关闭编辑模态框
    const handleEditModalClose = () => {
        setEditModalVisible(false);
        setCurrentRecord(null);
    };

    // 关闭新增模态框
    const handleAddModalClose = () => {
        setAddModalVisible(false);
        setCurrentRecord(null);
    };

    if (!modelName) {
        return (
            <div style={{ padding: 24, textAlign: 'center' }}>
                <h2>请在URL中指定模型名称</h2>
                <p>例如: /model-admin?model=User</p>
            </div>
        );
    }

    return (
        <>
            <ModelList
                modelName={modelName}
                onEdit={handleEdit}
                onAdd={handleAdd}
            />

            {/* 编辑模态框 */}
            <Modal
                title={`编辑 ${modelName}`}
                open={editModalVisible}
                onCancel={handleEditModalClose}
                footer={null}
                width={800}
            >
                {/* 这里可以放置编辑表单组件 */}
                <div style={{ padding: 20, textAlign: 'center' }}>
                    <p>编辑表单将在这里实现</p>
                    <p>当前记录: {JSON.stringify(currentRecord, null, 2)}</p>
                </div>
            </Modal>

            {/* 新增模态框 */}
            <Modal
                title={`新增 ${modelName}`}
                open={addModalVisible}
                onCancel={handleAddModalClose}
                footer={null}
                width={800}
            >
                {/* 这里可以放置新增表单组件 */}
                <div style={{ padding: 20, textAlign: 'center' }}>
                    <p>新增表单将在这里实现</p>
                </div>
            </Modal>
        </>
    );
};

export default ModelAdmin;
