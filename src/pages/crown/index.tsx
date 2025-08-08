import React, { useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, Switch, message, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ModelList } from '@/components';

const { TextArea } = Input;
const { Option } = Select;

/**
 * 皇冠管理页面
 * 使用 ModelList 组件展示和管理皇冠数据
 */
const CrownManagement: React.FC = () => {
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<Record<string, any> | null>(null);
    const [editForm] = Form.useForm();
    const [addForm] = Form.useForm();

    // 处理编辑操作
    const handleEdit = (record: Record<string, any>) => {
        setCurrentRecord(record);
        editForm.setFieldsValue({
            ...record,
            gems: Array.isArray(record.gems) ? record.gems.join(', ') : record.gems || ''
        });
        setEditModalVisible(true);
    };

    // 处理新增操作
    const handleAdd = () => {
        setCurrentRecord(null);
        addForm.resetFields();
        setAddModalVisible(true);
    };

    // 关闭编辑模态框
    const handleEditModalClose = () => {
        setEditModalVisible(false);
        setCurrentRecord(null);
        editForm.resetFields();
    };

    // 关闭新增模态框
    const handleAddModalClose = () => {
        setAddModalVisible(false);
        setCurrentRecord(null);
        addForm.resetFields();
    };

    // Handle edit form submission
    const handleEditSubmit = async () => {
        try {
            const values = await editForm.validateFields();
            console.log('Edit crown:', { ...currentRecord, ...values });
            message.success('Crown information updated successfully!');
            handleEditModalClose();
            // Here you can call API to save data
        } catch (error) {
            message.error('Please check form information');
        }
    };

    // Handle add form submission
    const handleAddSubmit = async () => {
        try {
            const values = await addForm.validateFields();
            console.log('Add crown:', values);
            message.success('New crown created successfully!');
            handleAddModalClose();
            // Here you can call API to save data
        } catch (error) {
            message.error('Please check form information');
        }
    };

    // Form item configuration
    const FormItems = ({ form, isEdit = false }: { form: any; isEdit?: boolean }) => (
        <>
            <Form.Item
                name="name"
                label="Crown Name"
                rules={[{ required: true, message: 'Please enter crown name' }]}
            >
                <Input placeholder="Please enter crown name" />
            </Form.Item>

            <Form.Item
                name="type"
                label="Crown Type"
                rules={[{ required: true, message: 'Please select crown type' }]}
            >
                <Select placeholder="Please select crown type">
                    <Option value="gold">Gold</Option>
                    <Option value="diamond">Diamond</Option>
                    <Option value="jade">Jade</Option>
                    <Option value="crystal">Crystal</Option>
                    <Option value="ruby">Ruby</Option>
                    <Option value="sapphire">Sapphire</Option>
                    <Option value="rainbow">Rainbow</Option>
                    <Option value="antique">Antique</Option>
                </Select>
            </Form.Item>

            <Form.Item
                name="level"
                label="Level"
                rules={[{ required: true, message: 'Please select level' }]}
            >
                <Select placeholder="Please select level">
                    <Option value={1}>1 - Common</Option>
                    <Option value={2}>2 - Excellent</Option>
                    <Option value={3}>3 - Rare</Option>
                    <Option value={4}>4 - Epic</Option>
                    <Option value={5}>5 - Legendary</Option>
                    <Option value={6}>6 - Mythic</Option>
                    <Option value={7}>7 - Supreme</Option>
                </Select>
            </Form.Item>

            <Form.Item
                name="price"
                label="Price"
                rules={[{ required: true, message: 'Please enter price' }]}
            >
                <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Please enter price"
                    min={0}
                    precision={2}
                    addonAfter="$"
                />
            </Form.Item>

            <Form.Item
                name="weight"
                label="Weight (kg)"
                rules={[{ required: true, message: 'Please enter weight' }]}
            >
                <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Please enter weight"
                    min={0}
                    precision={2}
                    addonAfter="kg"
                />
            </Form.Item>

            <Form.Item
                name="material"
                label="Material"
                rules={[{ required: true, message: 'Please select material' }]}
            >
                <Select placeholder="Please select material">
                    <Option value="gold">Gold</Option>
                    <Option value="silver">Silver</Option>
                    <Option value="platinum">Platinum</Option>
                    <Option value="bronze">Bronze</Option>
                    <Option value="jade">Jade</Option>
                    <Option value="crystal">Crystal</Option>
                    <Option value="mythril">Mythril</Option>
                </Select>
            </Form.Item>

            <Form.Item
                name="owner"
                label="Owner"
            >
                <Input placeholder="Please enter owner" />
            </Form.Item>

            <Form.Item
                name="region"
                label="Region"
            >
                <Select placeholder="Please select region" allowClear>
                    <Option value="Europe">Europe</Option>
                    <Option value="Asia">Asia</Option>
                    <Option value="Africa">Africa</Option>
                    <Option value="America">America</Option>
                    <Option value="Oceania">Oceania</Option>
                    <Option value="Arctic">Arctic</Option>
                    <Option value="Middle East">Middle East</Option>
                    <Option value="Ancient">Ancient</Option>
                    <Option value="Fantasy">Fantasy</Option>
                </Select>
            </Form.Item>

            <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
            >
                <Select placeholder="Please select status">
                    <Option value="available">Available</Option>
                    <Option value="reserved">Reserved</Option>
                    <Option value="sold">Sold</Option>
                    <Option value="maintenance">Maintenance</Option>
                    <Option value="museum">Museum</Option>
                    <Option value="legendary">Legendary</Option>
                </Select>
            </Form.Item>

            <Form.Item
                name="gems"
                label="Gems"
                tooltip="Multiple gems separated by commas"
            >
                <Input placeholder="e.g.: diamond, ruby, emerald" />
            </Form.Item>

            <Form.Item
                name="description"
                label="Description"
            >
                <TextArea rows={4} placeholder="Please enter crown description" />
            </Form.Item>

            <Form.Item
                name="is_active"
                label="Active Status"
                valuePropName="checked"
                initialValue={true}
            >
                <Switch />
            </Form.Item>
        </>
    );

    return (
        <>
            <ModelList
                modelName="crown"
                onEdit={handleEdit}
                onAdd={handleAdd}
            />

            {/* Edit Modal */}
            <Modal
                title="Edit Crown"
                open={editModalVisible}
                onCancel={handleEditModalClose}
                width={800}
                footer={[
                    <Button key="cancel" onClick={handleEditModalClose}>
                        Cancel
                    </Button>,
                    <Button key="submit" type="primary" onClick={handleEditSubmit}>
                        Save
                    </Button>
                ]}
            >
                <Form
                    form={editForm}
                    layout="vertical"
                    style={{ maxHeight: '60vh', overflowY: 'auto' }}
                >
                    <FormItems form={editForm} isEdit={true} />
                </Form>
            </Modal>

            {/* Add Modal */}
            <Modal
                title="Add Crown"
                open={addModalVisible}
                onCancel={handleAddModalClose}
                width={800}
                footer={[
                    <Button key="cancel" onClick={handleAddModalClose}>
                        Cancel
                    </Button>,
                    <Button key="submit" type="primary" onClick={handleAddSubmit}>
                        Create
                    </Button>
                ]}
            >
                <Form
                    form={addForm}
                    layout="vertical"
                    style={{ maxHeight: '60vh', overflowY: 'auto' }}
                    initialValues={{
                        type: 'gold',
                        level: 1,
                        material: 'gold',
                        status: 'available',
                        is_active: true
                    }}
                >
                    <FormItems form={addForm} isEdit={false} />
                </Form>
            </Modal>
        </>
    );
};

export default CrownManagement;
