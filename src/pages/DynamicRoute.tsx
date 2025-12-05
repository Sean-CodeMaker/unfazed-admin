import { history, useLocation, useModel } from '@umijs/max';
import { Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { ModelAdmin, ModelCustom } from '@/components';

/**
 * 动态路由组件
 * 根据当前路径和 route-list 接口返回的配置，动态渲染相应的组件
 */
const DynamicRoute: React.FC = () => {
  const location = useLocation();
  const { initialState } = useModel('@@initialState');
  const [loading, setLoading] = useState(true);
  const [routeConfig, setRouteConfig] = useState<API.AdminRoute | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRoute = () => {
      try {
        setLoading(true);
        setError(null);
        // 不要立即重置 routeConfig，避免中间状态的渲染

        console.log('Loading route for path:', location.pathname);

        // 检查全局状态中是否有路由数据
        const routeList = initialState?.routeList;

        if (!routeList || routeList.length === 0) {
          // 如果没有路由数据，可能是用户未登录或路由加载失败
          console.warn('Route list not available in global state');

          // 检查是否是需要登录的页面
          const publicPaths = [
            '/user/login',
            '/oauth/login',
            '/exception',
            '/result',
          ];
          const isPublicPath = publicPaths.some((path) =>
            location.pathname.startsWith(path),
          );

          if (!isPublicPath) {
            // 对于需要登录的页面，重定向到登录页面
            history.replace('/user/login');
            return;
          } else {
            // 对于公共页面，抛出错误让静态路由处理
            throw new Error(
              'Route list not available, but this should be handled by static routes',
            );
          }
        }

        // 处理根路径重定向
        if (location.pathname === '/') {
          // 获取第一个可用的动态路由进行重定向
          const getFirstAvailableRoute = (
            routes: API.AdminRoute[],
          ): string | null => {
            for (const route of routes) {
              if (route.routes && route.routes.length > 0) {
                const firstChild = getFirstAvailableRoute(route.routes);
                if (firstChild) return firstChild;
              } else if (route.path && route.component) {
                return route.path;
              }
            }
            return null;
          };

          const redirectPath = getFirstAvailableRoute(routeList);
          if (redirectPath) {
            console.log('Redirecting from root to:', redirectPath);
            history.replace(redirectPath);
            return;
          } else {
            throw new Error('No available routes for redirection');
          }
        }

        // 查找当前路径对应的路由配置
        const findRouteByPath = (
          routes: API.AdminRoute[],
          targetPath: string,
        ): API.AdminRoute | null => {
          for (const route of routes) {
            if (route.path === targetPath) {
              return route;
            }
            if (route.routes && route.routes.length > 0) {
              const found = findRouteByPath(route.routes, targetPath);
              if (found) return found;
            }
          }
          return null;
        };

        const foundRoute = findRouteByPath(routeList, location.pathname);

        if (!foundRoute) {
          // 对于找不到的路由，重定向到 404 页面
          history.replace('/exception/404');
          return;
        }

        console.log('Found route config:', foundRoute);
        setRouteConfig(foundRoute);
      } catch (err) {
        console.error('Dynamic route loading error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    // 每次路径变化时都重新加载路由
    if (initialState?.routeList) {
      loadRoute();
      return; // 添加 return 语句
    } else {
      // 等待全局状态加载完成
      setLoading(true);
      const timer = setTimeout(() => {
        if (initialState?.routeList) {
          loadRoute();
        } else {
          setError('Failed to load route configuration from global state');
          setLoading(false);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, initialState?.routeList]);

  // 渲染对应的组件
  const renderComponent = () => {
    // Avoid rendering with stale routeConfig when path just changed
    if (!routeConfig || routeConfig.path !== location.pathname) {
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
          }}
        >
          <Spin size="large" tip="Loading..." />
        </div>
      );
    }

    const modelName = routeConfig.name;
    const routeLabel = routeConfig.label;
    // Use routeConfig.path to stabilize key with the actual config we will render
    const componentKey = `${routeConfig.component}-${routeConfig.path}`;

    switch (routeConfig.component) {
      case 'ModelAdmin':
        return (
          <ModelAdmin
            key={componentKey}
            modelName={modelName}
            routeLabel={routeLabel}
          />
        );
      case 'ModelCustom':
        return (
          <ModelCustom
            key={componentKey}
            toolName={modelName}
            onBack={() => window.history.back()}
          />
        );
      default:
        return (
          <div key={componentKey}>
            Unsupported dynamic component: {routeConfig.component}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
        }}
      >
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
          flexDirection: 'column',
        }}
      >
        <h3>Error Loading Route</h3>
        <p>{error}</p>
      </div>
    );
  }

  return renderComponent();
};

export default DynamicRoute;
