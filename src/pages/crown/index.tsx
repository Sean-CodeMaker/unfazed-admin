import React from 'react';
import { ModelAdmin } from '@/components';

/**
 * 皇冠管理页面
 * 使用 ModelAdmin 组件展示和管理皇冠数据，支持列表和详情视图切换
 */
const CrownManagement: React.FC = () => {
    return <ModelAdmin modelName="crown" />;
};

export default CrownManagement;
