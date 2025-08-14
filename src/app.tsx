
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import React from 'react';
import {
  AvatarDropdown,
  AvatarName,
  Footer,
  SelectLang,
  Question,
} from '@/components';
import { getAdminSettings, getRouteList } from '@/services/ant-design-pro/api';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
import '@ant-design/v5-patch-for-react-19';

const isDev =
  process.env.NODE_ENV === 'development' || process.env.CI;
const loginPath = '/user/login';

/**
 * 将 API 路由数据转换为 ProLayout 菜单数据格式
 */
function transformApiRoutesToMenuData(routes: API.AdminRoute[]): any[] {
  const transformRoute = (route: API.AdminRoute): any => {
    const menuItem: any = {
      name: route.label || route.name,  // 使用 label 作为显示名称，fallback 到 name
      path: route.path,
    };

    // 设置图标
    if (route.icon) {
      menuItem.icon = extractIconNameFromUrl(route.icon);
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
 * 从 CDN 图标 URL 中提取图标名称
 */
function extractIconNameFromUrl(iconUrl: string): string {
  const iconMap: Record<string, string> = {
    'SmileOutlined': 'smile',
    'CheckCircleOutlined': 'CheckCircleOutlined',
    'WarningOutlined': 'warning',
    'CrownOutlined': 'crown',
    'UserOutlined': 'user',
  };

  for (const [key, value] of Object.entries(iconMap)) {
    if (iconUrl.includes(key)) {
      return value;
    }
  }

  return 'smile';
}

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
  menuData?: any[];
  routeList?: API.AdminRoute[];  // 添加原始路由数据
}> {
  const fetchUserInfo = async () => {
    try {
      // 从本地存储获取用户信息，而不是调用 currentUser API
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        return JSON.parse(userInfo) as API.CurrentUser;
      }
    } catch (_error) {
      console.warn('Failed to parse user info from localStorage:', _error);
    }

    // 如果没有用户信息且不在登录相关页面，才跳转到登录页
    const { location } = history;
    if (![loginPath, '/user/register', '/user/register-result'].includes(location.pathname)) {
      history.push(loginPath);
    }
    return undefined;
  };

  const fetchSettings = async () => {
    try {
      const response = await getAdminSettings({
        skipErrorHandler: true,
      });
      if (response.code === 0) {
        const apiData = response.data;

        // 分离ProLayout需要的字段和应用级别的字段
        const layoutSettings = {
          // ProLayout直接支持的字段
          title: apiData.title,
          logo: apiData.logo,
          navTheme: apiData.navTheme,
          colorPrimary: apiData.colorPrimary,
          layout: apiData.layout,
          contentWidth: apiData.contentWidth,
          fixedHeader: apiData.fixedHeader,
          fixSiderbar: apiData.fixSiderbar ?? defaultSettings.fixSiderbar,
          colorWeak: apiData.colorWeak,
          // 前端特有字段
          pwa: apiData.pwa ?? defaultSettings.pwa,
          iconfontUrl: apiData.iconfontUrl ?? defaultSettings.iconfontUrl,
        };

        // 应用级别的配置存储到localStorage
        const appSettings = {
          pageSize: apiData.pageSize,
          timeZone: apiData.timeZone,
          apiPrefix: apiData.apiPrefix,
          debug: apiData.debug,
          version: apiData.version,
          extra: apiData.extra,
          authPlugins: apiData.authPlugins,
        };

        // 存储应用级别配置到localStorage
        try {
          localStorage.setItem('unfazed_app_settings', JSON.stringify(appSettings));
        } catch (error) {
          console.warn('Failed to save app settings to localStorage:', error);
        }

        return layoutSettings as any;
      }
    } catch (_error) {
      console.warn('Failed to fetch settings, using default settings');
    }
    return defaultSettings as Partial<LayoutSettings>;
  };

  const fetchMenuData = async () => {
    try {
      const response = await getRouteList({
        skipErrorHandler: true,
      });
      if (response.code === 0) {
        const routeList = response.data;
        const menuData = transformApiRoutesToMenuData(routeList);
        return { routeList, menuData };
      }
    } catch (_error) {
      console.warn('Failed to fetch menu data, using default menu');
    }
    return { routeList: [], menuData: [] };
  };

  // 如果不是登录页面，执行
  const { location } = history;
  if (
    ![loginPath, '/user/register', '/user/register-result'].includes(
      location.pathname,
    )
  ) {
    const currentUser = await fetchUserInfo();
    if (currentUser) {
      // 用户已登录，获取API设置和菜单数据
      const settings = await fetchSettings();
      const { routeList, menuData } = await fetchMenuData();
      return {
        fetchUserInfo,
        currentUser,
        settings,
        menuData,
        routeList,
      };
    }
    return {
      fetchUserInfo,
      currentUser,
      settings: defaultSettings as Partial<LayoutSettings>,
      menuData: [],
      routeList: [],
    };
  }
  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
    menuData: [],
    routeList: [],
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
  return {
    actionsRender: () => [
      <Question key="question" />,
      <SelectLang key="selectLang" />,
    ],
    avatarProps: {
      src: initialState?.currentUser?.avatar,
      title: <AvatarName />,
      render: (_, avatarChildren) => {
        return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
      },
    },
    // 使用动态菜单数据
    menu: {
      request: async () => {
        return initialState?.menuData || [];
      },
    },
    waterMarkProps: {
      content: initialState?.currentUser?.name,
    },
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history;
      // 如果没有登录，重定向到 login
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
      }
    },
    bgLayoutImgList: [
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr',
        left: 85,
        bottom: 100,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr',
        bottom: -68,
        right: -45,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr',
        bottom: 0,
        left: 0,
        width: '331px',
      },
    ],
    links: [],
    menuHeaderRender: undefined,
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    // 增加一个 loading 的状态
    childrenRender: (children) => {
      // if (initialState?.loading) return <PageLoading />;
      return (
        <>
          {children}
          {isDev && (
            <SettingDrawer
              disableUrlParams
              enableDarkTheme
              settings={initialState?.settings}
              onSettingChange={(settings) => {
                setInitialState((preInitialState) => ({
                  ...preInitialState,
                  settings,
                }));
              }}
            />
          )}
        </>
      );
    },
    ...initialState?.settings,
  };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request: RequestConfig = {
  // 在开发环境使用相对路径，生产环境可以配置具体API地址
  // baseURL: process.env.NODE_ENV === 'development' ? '' : 'your-production-api-url',
  ...errorConfig,
};
