
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import React from 'react';
import {
  AvatarDropdown,
  AvatarName,
  Footer,
} from '@/components';
import { currentUser as queryCurrentUser, getAdminSettings } from '@/services/ant-design-pro/api';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
import '@ant-design/v5-patch-for-react-19';

const isDev =
  process.env.NODE_ENV === 'development' || process.env.CI;
const loginPath = '/user/login';

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
}> {
  const fetchUserInfo = async () => {
    try {
      const msg = await queryCurrentUser({
        skipErrorHandler: true,
      });
      return msg.data;
    } catch (_error) {
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

  // 如果不是登录页面，执行
  const { location } = history;
  if (
    ![loginPath, '/user/register', '/user/register-result'].includes(
      location.pathname,
    )
  ) {
    const currentUser = await fetchUserInfo();
    if (currentUser) {
      // 用户已登录，获取API设置
      const settings = await fetchSettings();
      return {
        fetchUserInfo,
        currentUser,
        settings,
      };
    }
    return {
      fetchUserInfo,
      currentUser,
      settings: defaultSettings as Partial<LayoutSettings>,
    };
  }
  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
  return {
    actionsRender: () => [],
    avatarProps: {
      src: initialState?.currentUser?.avatar,
      title: <AvatarName />,
      render: (_, avatarChildren) => {
        return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
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
