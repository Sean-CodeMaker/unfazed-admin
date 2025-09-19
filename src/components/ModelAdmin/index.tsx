import React, { useState } from 'react';
import { ModelDetail, ModelList } from '@/components';

interface ModelAdminProps {
  modelName: string;
}

const ModelAdmin: React.FC<ModelAdminProps> = ({ modelName }) => {
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
  const [currentRecord, setCurrentRecord] = useState<Record<
    string,
    any
  > | null>(null);
  const [modelDesc, setModelDesc] = useState<API.AdminSerializeModel | null>(
    null,
  );

  // 处理查看详情操作
  const handleDetail = (record: Record<string, any>) => {
    setCurrentRecord(record);
    setCurrentView('detail');
  };

  // 处理新增操作
  const handleAdd = () => {
    // TODO: 实现新增逻辑
    console.log('Add clicked');
  };

  // 返回列表
  const handleBackToList = () => {
    setCurrentView('list');
    setCurrentRecord(null);
  };

  // 处理模型描述加载
  const handleModelDescLoaded = (loadedModelDesc: API.AdminSerializeModel) => {
    setModelDesc(loadedModelDesc);
  };

  if (!modelName) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h2>请指定模型名称</h2>
        <p>Model name is required</p>
      </div>
    );
  }

  return (
    <>
      {currentView === 'list' ? (
        <ModelList
          modelName={modelName}
          onDetail={handleDetail}
          onAdd={handleAdd}
          onModelDescLoaded={handleModelDescLoaded}
        />
      ) : currentRecord && modelDesc ? (
        <ModelDetail
          modelName={modelName}
          modelDesc={modelDesc}
          record={currentRecord}
          onBack={handleBackToList}
        />
      ) : (
        <div>
          Loading detail... currentRecord: {!!currentRecord}, modelDesc:{' '}
          {!!modelDesc}
        </div>
      )}
    </>
  );
};

export default ModelAdmin;
