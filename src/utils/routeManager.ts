/**
 * 统一路由管理器
 * 负责合并内置路由和动态路由，生成完整的路由配置
 */

import { getRouteList } from '@/services/api';

// 内置路由配置（不依赖后端API的路由）
const BUILT_IN_ROUTES = [
    // 用户相关路由
    {
        path: '/user',
        layout: false,
        routes: [
            {
                path: '/user/login',
                layout: false,
                name: 'login',
                component: './user/login',
            },
            {
                path: '/user',
                redirect: '/user/login',
            },
            {
                name: 'register-result',
                icon: 'smile',
                path: '/user/register-result',
                component: './user/register-result',
            },
            {
                name: 'register',
                icon: 'smile',
                path: '/user/register',
                component: './user/register',
            },
            {
                component: '404',
                path: '/user/*',
            },
        ],
    },
    // OAuth 登录回调路由
    {
        path: '/oauth/login',
        layout: false,
        name: 'oauth-login',
        component: './oauth/login',
    },
    // 结果页面路由
    {
        name: 'result',
        icon: 'CheckCircleOutlined',
        path: '/result',
        routes: [
            {
                path: '/result',
                redirect: '/result/success',
            },
            {
                name: 'success',
                icon: 'smile',
                path: '/result/success',
                component: './result/success',
            },
            {
                name: 'fail',
                icon: 'smile',
                path: '/result/fail',
                component: './result/fail',
            },
        ],
    },
    // 异常页面路由
    {
        name: 'exception',
        icon: 'warning',
        path: '/exception',
        routes: [
            {
                path: '/exception',
                redirect: '/exception/403',
            },
            {
                name: '403',
                icon: 'smile',
                path: '/exception/403',
                component: './exception/403',
            },
            {
                name: '404',
                icon: 'smile',
                path: '/exception/404',
                component: './exception/404',
            },
            {
                name: '500',
                icon: 'smile',
                path: '/exception/500',
                component: './exception/500',
            },
        ],
    },
];

// 全局路由和通配符路由
const GLOBAL_ROUTES = [
    {
        path: '/',
        redirect: '/crown', // 默认重定向，可以根据动态路由调整
    },
    {
        component: '404',
        path: '/*',
    },
];

/**
 * 将API路由转换为UmiJS路由格式
 */
function transformApiRouteToUmiRoute(apiRoute: API.AdminRoute): any {
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
        default:
            // 传统组件路径
            umiRoute.component = apiRoute.component;
            break;
    }

    // 处理子路由
    if (apiRoute.routes && apiRoute.routes.length > 0) {
        umiRoute.routes = apiRoute.routes.map(transformApiRouteToUmiRoute);
    }

    return umiRoute;
}

/**
 * 获取完整的路由配置（内置路由 + 动态路由）
 */
export async function getCompleteRoutes(): Promise<any[]> {
    try {
        // 获取动态路由
        const response = await getRouteList({
            skipErrorHandler: true,
        });

        let dynamicRoutes: any[] = [];
        let defaultRedirectPath = '/crown'; // 默认值

        if (response.code === 0 && response.data && response.data.length > 0) {
            // 转换API路由为UmiJS路由格式
            dynamicRoutes = response.data.map(transformApiRouteToUmiRoute);

            // 更新默认重定向路径为第一个动态路由
            defaultRedirectPath = response.data[0].path;
        }

        // 更新默认重定向
        const globalRoutesWithRedirect = GLOBAL_ROUTES.map(route => {
            if (route.path === '/' && route.redirect) {
                return { ...route, redirect: defaultRedirectPath };
            }
            return route;
        });

        // 合并路由：内置路由 + 动态路由 + 全局路由
        const completeRoutes = [
            ...BUILT_IN_ROUTES,
            ...dynamicRoutes,
            ...globalRoutesWithRedirect,
        ];

        console.log('Complete routes generated:', completeRoutes);
        return completeRoutes;

    } catch (error) {
        console.error('Failed to fetch dynamic routes, using built-in routes only:', error);

        // 如果获取动态路由失败，只使用内置路由
        return [
            ...BUILT_IN_ROUTES,
            ...GLOBAL_ROUTES,
        ];
    }
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
