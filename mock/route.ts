// 将 routes.ts 第 13-118 行配置转换为符合 OpenAPI 规范的格式
// 对应 config/routes.ts 中的路由配置
const routeData = [
  {
    name: 'user',
    path: '/user',
    component: null,
    icon: null,
    hideInMenu: true, // layout: false 意味着在菜单中隐藏
    hideChildrenInMenu: false,
    routes: [
      {
        name: 'login',
        path: '/user/login',
        component: './user/login',
        icon: null,
        hideInMenu: true,
        hideChildrenInMenu: false,
      },
      {
        name: 'register-result',
        path: '/user/register-result',
        component: './user/register-result',
        icon: 'https://cdn.jsdelivr.net/npm/@ant-design/icons@5.0.1/lib/outlined/SmileOutlined.js',
        hideInMenu: true,
        hideChildrenInMenu: false,
      },
      {
        name: 'register',
        path: '/user/register',
        component: './user/register',
        icon: 'https://cdn.jsdelivr.net/npm/@ant-design/icons@5.0.1/lib/outlined/SmileOutlined.js',
        hideInMenu: true,
        hideChildrenInMenu: false,
      },
    ],
  },
  {
    name: 'result',
    path: '/result',
    component: null,
    icon: 'https://cdn.jsdelivr.net/npm/@ant-design/icons@5.0.1/lib/outlined/CheckCircleOutlined.js',
    hideInMenu: false,
    hideChildrenInMenu: false,
    routes: [
      {
        name: 'success',
        path: '/result/success',
        component: './result/success',
        icon: 'https://cdn.jsdelivr.net/npm/@ant-design/icons@5.0.1/lib/outlined/SmileOutlined.js',
        hideInMenu: false,
        hideChildrenInMenu: false,
      },
      {
        name: 'fail',
        path: '/result/fail',
        component: './result/fail',
        icon: 'https://cdn.jsdelivr.net/npm/@ant-design/icons@5.0.1/lib/outlined/SmileOutlined.js',
        hideInMenu: false,
        hideChildrenInMenu: false,
      },
    ],
  },
  {
    name: 'exception',
    path: '/exception',
    component: null,
    icon: 'https://cdn.jsdelivr.net/npm/@ant-design/icons@5.0.1/lib/outlined/WarningOutlined.js',
    hideInMenu: false,
    hideChildrenInMenu: false,
    routes: [
      {
        name: '403',
        path: '/exception/403',
        component: './exception/403',
        icon: 'https://cdn.jsdelivr.net/npm/@ant-design/icons@5.0.1/lib/outlined/SmileOutlined.js',
        hideInMenu: false,
        hideChildrenInMenu: false,
      },
      {
        name: '404',
        path: '/exception/404',
        component: './exception/404',
        icon: 'https://cdn.jsdelivr.net/npm/@ant-design/icons@5.0.1/lib/outlined/SmileOutlined.js',
        hideInMenu: false,
        hideChildrenInMenu: false,
      },
      {
        name: '500',
        path: '/exception/500',
        component: './exception/500',
        icon: 'https://cdn.jsdelivr.net/npm/@ant-design/icons@5.0.1/lib/outlined/SmileOutlined.js',
        hideInMenu: false,
        hideChildrenInMenu: false,
      },
    ],
  },
  {
    name: 'welcome',
    path: '/welcome',
    component: './Welcome',
    icon: 'https://cdn.jsdelivr.net/npm/@ant-design/icons@5.0.1/lib/outlined/SmileOutlined.js',
    hideInMenu: false,
    hideChildrenInMenu: false,
  },
  {
    name: 'admin',
    path: '/admin',
    component: './Admin',
    icon: 'https://cdn.jsdelivr.net/npm/@ant-design/icons@5.0.1/lib/outlined/CrownOutlined.js',
    hideInMenu: false,
    hideChildrenInMenu: false,
  },
];

export default {
  // 新增路由列表接口的 mock
  'GET /api/admin/route-list': {
    code: 0,
    message: 'success',
    data: routeData,
  },

  // 保留原有的权限路由配置
  '/api/auth_routes': {
    '/form/advanced-form': { authority: ['admin', 'user'] },
  },
};
