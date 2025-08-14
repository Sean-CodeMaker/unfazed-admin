import type { Request, Response } from 'express';

const waitTime = (time: number = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
};

const { ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION } = process.env;

/**
 * 当前用户的权限，如果为空代表没登录
 * current user access， if is '', user need login
 * 如果是 pro 的预览，默认是有权限的
 */
let access =
  ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION === 'site' ? 'admin' : '';

const getAccess = () => {
  return access;
};

// 代码中会兼容本地 service mock 以及部署站点的静态数据
export default {
  // 注释：currentUser API 已删除，改为使用本地存储的用户信息

  // 登录接口 - 符合 OpenAPI 规范
  'POST /api/auth/login': async (req: Request, res: Response) => {
    const { account, password, platform = 'default', extra = {} } = req.body;
    await waitTime(2000);

    if (account === 'admin' && password === 'ant.design') {
      access = 'admin';
      res.send({
        code: 0,
        message: 'success',
        data: {
          account: 'admin',
          email: 'admin@example.com',
          roles: [
            { id: 1, name: 'admin' }
          ],
          groups: [
            { id: 1, name: 'administrators' }
          ],
          extra: {
            username: 'admin',
            nickname: 'Administrator',
            avatar: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
            ...extra
          }
        }
      });
      return;
    }

    if (account === 'user' && password === 'ant.design') {
      access = 'user';
      res.send({
        code: 0,
        message: 'success',
        data: {
          account: 'user',
          email: 'user@example.com',
          roles: [
            { id: 2, name: 'user' }
          ],
          groups: [
            { id: 2, name: 'users' }
          ],
          extra: {
            username: 'user',
            nickname: 'User',
            avatar: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
            ...extra
          }
        }
      });
      return;
    }

    res.send({
      code: 1,
      message: 'Invalid account or password',
      data: null
    });
  },

  // 登出接口 - 符合 OpenAPI 规范
  'POST /api/auth/logout': (_req: Request, res: Response) => {
    access = '';
    res.send({
      code: 0,
      message: 'success',
      data: {}
    });
  },

  // 注册接口 - 符合 OpenAPI 规范
  'POST /api/auth/register': async (req: Request, res: Response) => {
    const { account, password, platform = 'default', extra = {} } = req.body;
    await waitTime(1000);

    // 简单的注册逻辑
    if (!account || !password) {
      res.send({
        code: 1,
        message: 'Account and password are required',
        data: null
      });
      return;
    }

    if (account === 'admin' || account === 'user') {
      res.send({
        code: 1,
        message: 'Account already exists',
        data: null
      });
      return;
    }

    res.send({
      code: 0,
      message: 'Registration successful',
      data: {
        account,
        platform,
        extra
      }
    });
  },

  // 管理员设置接口 - 符合 OpenAPI 规范
  'GET /api/admin/settings': (_req: Request, res: Response) => {
    res.send({
      code: 0,
      message: 'success',
      data: {
        title: 'Unfazed Admin',
        navTheme: 'light',
        colorPrimary: '#1890ff',
        layout: 'mix',
        contentWidth: 'Fluid',
        fixedHeader: false,
        fixSiderbar: true,
        pwa: false,
        iconfontUrl: '',
        colorWeak: false,
        logo: '/logo.svg',
        pageSize: 20,
        timeZone: 'Asia/Shanghai',
        apiPrefix: '/api',
        debug: false,
        version: '1.0.0',
        extra: {},
        authPlugins: []
      }
    });
  },

  // 路由列表接口 - 符合 OpenAPI 规范
  'GET /api/admin/route-list': (_req: Request, res: Response) => {
    res.send({
      code: 0,
      message: 'success',
      data: [
        {
          name: 'crown',  // 模型名称，用于 model-desc/model-data API
          label: 'Crown Management',  // 显示名称，用于侧边栏
          path: '/crown',
          component: 'ModelAdmin',
          icon: 'https://cdn.jsdelivr.net/npm/@ant-design/icons@5.0.1/lib/outlined/CrownOutlined.js',
          hideInMenu: false,
          hideChildrenInMenu: false,
        },
        {
          name: 'tools',  // 工具名称，用于 model-desc API
          label: 'Custom Tools',  // 显示名称，用于侧边栏
          path: '/tools',
          component: 'ModelCustom',
          icon: 'https://cdn.jsdelivr.net/npm/@ant-design/icons@5.0.1/lib/outlined/ToolOutlined.js',
          hideInMenu: false,
          hideChildrenInMenu: false,
        }
      ]
    });
  },
};