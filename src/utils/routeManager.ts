/**
 * 统一路由管理器
 * 负责合并内置路由和动态路由，生成完整的路由配置
 */

import { getRouteList } from '@/services/api';

// 注意：静态路由现在在 config/routes.ts 中定义
// 这里只保留动态路由相关的工具函数

/**
 * 将API路由转换为UmiJS路由格式
 */
function _transformApiRouteToUmiRoute(apiRoute: API.AdminRoute): any {
  const umiRoute: any = {
    path: apiRoute.path,
    name: apiRoute.name,
  };

  // 根据组件类型决定如何渲染
  switch (apiRoute.component) {
    case 'ModelAdmin':
      umiRoute.component = './DynamicRoute';
      break;
    case 'ModelCustom':
      umiRoute.component = './DynamicRoute';
      break;
    case 'DynamicRoute':
      umiRoute.component = './DynamicRoute';
      break;
    default:
      // 传统组件路径
      umiRoute.component = apiRoute.component;
      break;
  }

  // 处理子路由
  if (apiRoute.routes && apiRoute.routes.length > 0) {
    umiRoute.routes = apiRoute.routes.map(_transformApiRouteToUmiRoute);
  }

  return umiRoute;
}

/**
 * 将API路由数据转换为菜单数据格式
 */
export function transformApiRoutesToMenuData(routes: API.AdminRoute[]): any[] {
  const transformRoute = (route: API.AdminRoute): any => {
    const menuItem: any = {
      name: route.label || route.name,
      path: route.path,
    };

    // 设置图标
    if (route.icon) {
      menuItem.icon = getIconComponent(route.icon);
    }

    // 设置菜单隐藏属性
    if (route.hideInMenu) {
      menuItem.hideInMenu = route.hideInMenu;
    }

    if (route.hideChildrenInMenu) {
      menuItem.hideChildrenInMenu = route.hideChildrenInMenu;
    }

    // 递归处理子路由
    if (route.routes && route.routes.length > 0) {
      menuItem.routes = route.routes.map(transformRoute);
    }

    return menuItem;
  };

  return routes.map(transformRoute);
}

/**
 * 根据图标名称获取对应的 Ant Design 图标组件
 */
function getIconComponent(iconName: string): React.ReactNode {
  const React = require('react');

  // 创建图标组件的映射
  const iconMap: Record<string, any> = {
    CrownOutlined: require('@ant-design/icons').CrownOutlined,
    ToolOutlined: require('@ant-design/icons').ToolOutlined,
    TableOutlined: require('@ant-design/icons').TableOutlined,
    UserOutlined: require('@ant-design/icons').UserOutlined,
    SettingOutlined: require('@ant-design/icons').SettingOutlined,
    HomeOutlined: require('@ant-design/icons').HomeOutlined,
    DashboardOutlined: require('@ant-design/icons').DashboardOutlined,
    FileOutlined: require('@ant-design/icons').FileOutlined,
    FolderOutlined: require('@ant-design/icons').FolderOutlined,
  };

  const IconComponent = iconMap[iconName];
  if (IconComponent) {
    return React.createElement(IconComponent);
  }

  // 默认图标
  return React.createElement(require('@ant-design/icons').SmileOutlined);
}

/**
 * 获取路由和菜单数据
 */
export async function getRouteAndMenuData(): Promise<{
  routeList: API.AdminRoute[];
  menuData: any[];
}> {
  try {
    const response = await getRouteList({
      skipErrorHandler: true,
    });

    if (response.code === 0) {
      const routeList = response.data;
      const menuData = transformApiRoutesToMenuData(routeList);
      return { routeList, menuData };
    }
  } catch (error) {
    console.warn('Failed to fetch route and menu data:', error);
  }

  return { routeList: [], menuData: [] };
}
