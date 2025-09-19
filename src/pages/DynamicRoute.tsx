import { useLocation, useModel } from '@umijs/max';
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

        // 检查全局状态中是否有路由数据
        const routeList = initialState?.routeList;

        if (!routeList || routeList.length === 0) {
          throw new Error('Route list not available in global state');
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
          throw new Error(`Route not found for path: ${location.pathname}`);
        }

        setRouteConfig(foundRoute);
      } catch (err) {
        console.error('Dynamic route loading error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    // 如果 initialState 还没有加载完成，等待
    if (initialState?.routeList) {
      loadRoute();
      return; // 添加 return
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
    if (!routeConfig) {
      return <div>Route configuration not found</div>;
    }

    // 使用路由配置中的 name 字段作为模型名称
    const modelName = routeConfig.name;

    switch (routeConfig.component) {
      case 'ModelAdmin':
        return <ModelAdmin modelName={modelName} />;

      case 'ModelCustom':
        return (
          <ModelCustom
            toolName={modelName}
            onBack={() => window.history.back()}
          />
        );

      // 对于传统的页面组件路径（如 './Welcome'），我们不在这里处理
      // 这些会由 UmiJS 的静态路由处理
      default:
        return (
          <div>Unsupported dynamic component: {routeConfig.component}</div>
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
