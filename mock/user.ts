import type { Request, Response } from 'express';

const waitTime = (time: number = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
};

async function getFakeCaptcha(_req: Request, res: Response) {
  await waitTime(2000);
  return res.json('captcha-xxx');
}

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
  // 支持值为 Object 和 Array
  'GET /api/currentUser': (_req: Request, res: Response) => {
    if (!getAccess()) {
      res.status(401).send({
        data: {
          isLogin: false,
        },
        errorCode: '401',
        errorMessage: '请先登录！',
        success: true,
      });
      return;
    }

    // 根据不同的访问级别返回不同的用户信息
    let userData;
    const access = getAccess();
    if (access === 'admin') {
      userData = {
        name: 'Admin User',
        avatar: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
        userid: '00000001',
        email: 'admin@unfazed.com',
        signature: '管理员账户',
        title: '系统管理员',
        group: 'Unfazed Admin',
        account: 'admin',
        roles: [
          { id: 1, name: 'admin' },
          { id: 2, name: 'user' }
        ],
        groups: [
          { id: 1, name: 'administrators' }
        ],
        tags: [
          {
            key: '0',
            label: '管理员',
          },
          {
            key: '1',
            label: '系统维护',
          },
        ],
        notifyCount: 12,
        unreadCount: 11,
        country: 'China',
        access,
        geographic: {
          province: {
            label: '浙江省',
            key: '330000',
          },
          city: {
            label: '杭州市',
            key: '330100',
          },
        },
        address: '西湖区工专路 77 号',
        phone: '0752-268888888',
      };
    } else {
      userData = {
        name: 'Regular User',
        avatar: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
        userid: '00000002',
        email: 'user@unfazed.com',
        signature: '普通用户',
        title: '用户',
        group: 'Unfazed Users',
        account: 'user',
        roles: [
          { id: 2, name: 'user' }
        ],
        groups: [
          { id: 2, name: 'users' }
        ],
        tags: [
          {
            key: '0',
            label: '普通用户',
          },
        ],
        notifyCount: 5,
        unreadCount: 3,
        country: 'China',
        access,
        geographic: {
          province: {
            label: '广东省',
            key: '440000',
          },
          city: {
            label: '深圳市',
            key: '440300',
          },
        },
        address: '南山区科技园',
        phone: '0755-123456789',
      };
    }

    res.send({
      success: true,
      data: userData,
    });
  },
  // GET POST 可省略
  'GET /api/users': [
    {
      key: '1',
      name: 'John Brown',
      age: 32,
      address: 'New York No. 1 Lake Park',
    },
    {
      key: '2',
      name: 'Jim Green',
      age: 42,
      address: 'London No. 1 Lake Park',
    },
    {
      key: '3',
      name: 'Joe Black',
      age: 32,
      address: 'Sidney No. 1 Lake Park',
    },
  ],
  // 保持原有登录路径以兼容现有代码
  'POST /api/login/account': async (req: Request, res: Response) => {
    const { password, username, type } = req.body;
    await waitTime(2000);
    if (password === 'ant.design' && username === 'admin') {
      res.send({
        status: 'ok',
        type,
        currentAuthority: 'admin',
      });
      access = 'admin';
      return;
    }
    if (password === 'ant.design' && username === 'user') {
      res.send({
        status: 'ok',
        type,
        currentAuthority: 'user',
      });
      access = 'user';
      return;
    }
    if (type === 'mobile') {
      res.send({
        status: 'ok',
        type,
        currentAuthority: 'admin',
      });
      access = 'admin';
      return;
    }

    res.send({
      status: 'error',
      type,
      currentAuthority: 'guest',
    });
    access = 'guest';
  },

  // 新的登录API端点
  'POST /api/auth/login': async (req: Request, res: Response) => {
    const { password, account, platform, extra } = req.body;
    await waitTime(2000);

    if (password === 'ant.design' && account === 'admin') {
      res.send({
        code: 0,
        message: 'success',
        data: {
          account: 'admin',
          email: 'admin@unfazed.com',
          roles: [
            { id: 1, name: 'admin' },
            { id: 2, name: 'user' }
          ],
          groups: [
            { id: 1, name: 'administrators' }
          ],
          extra: extra || {}
        }
      });
      access = 'admin';
      return;
    }

    if (password === 'ant.design' && account === 'user') {
      res.send({
        code: 0,
        message: 'success',
        data: {
          account: 'user',
          email: 'user@unfazed.com',
          roles: [
            { id: 2, name: 'user' }
          ],
          groups: [
            { id: 2, name: 'users' }
          ],
          extra: extra || {}
        }
      });
      access = 'user';
      return;
    }

    res.send({
      code: 1,
      message: 'Invalid account or password',
      data: null
    });
    access = 'guest';
  },
  // 保持原有登出路径以兼容现有代码
  'POST /api/login/outLogin': (_req: Request, res: Response) => {
    access = '';
    res.send({ data: {}, success: true });
  },

  // 新的登出API端点
  'POST /api/auth/logout': (_req: Request, res: Response) => {
    access = '';
    res.send({
      code: 0,
      message: 'success',
      data: {}
    });
  },

  // 保持原有注册路径以兼容现有代码
  'POST /api/register': (_req: Request, res: Response) => {
    res.send({ status: 'ok', currentAuthority: 'user', success: true });
  },

  // 新的注册API端点
  'POST /api/auth/register': async (req: Request, res: Response) => {
    const { account, password, platform, extra } = req.body;
    await waitTime(1000);

    // 简单验证
    if (!account || !password) {
      res.send({
        code: 1,
        message: 'Account and password are required',
        data: null
      });
      return;
    }

    // 检查账户是否已存在
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
      message: 'success',
      data: {
        account: account,
        registered: true
      }
    });
  },

  // 管理员设置API端点
  'GET /api/admin/settings': (_req: Request, res: Response) => {
    if (!getAccess()) {
      res.status(401).send({
        code: 401,
        message: 'Unauthorized',
        data: null
      });
      return;
    }

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
        colorWeak: false,
        logo: 'https://unfazed-eco.github.io/images/uz-logo.png',
        fixSiderbar: true,
        pwa: true,
        iconfontUrl: '',
        pageSize: 20,
        timeZone: 'Asia/Shanghai',
        apiPrefix: '/api',
        debug: true,
        version: '1.0.0',
        extra: {
          description: 'Unfazed Admin Panel'
        },
        authPlugins: []
      }
    });
  },

  // 管理员路由列表API端点
  'GET /api/admin/route-list': (_req: Request, res: Response) => {
    if (!getAccess()) {
      res.status(401).send({
        code: 401,
        message: 'Unauthorized',
        data: null
      });
      return;
    }

    res.send({
      code: 0,
      message: 'success',
      data: [
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
        {
          name: 'crown-management',
          path: '/crown',
          component: './crown',
          icon: 'https://cdn.jsdelivr.net/npm/@ant-design/icons@5.0.1/lib/outlined/CrownOutlined.js',
          hideInMenu: false,
          hideChildrenInMenu: false,
        }
      ]
    });
  },

  'GET /api/500': (_req: Request, res: Response) => {
    res.status(500).send({
      timestamp: 1513932555104,
      status: 500,
      error: 'error',
      message: 'error',
      path: '/base/category/list',
    });
  },
  'GET /api/404': (_req: Request, res: Response) => {
    res.status(404).send({
      timestamp: 1513932643431,
      status: 404,
      error: 'Not Found',
      message: 'No message available',
      path: '/base/category/list/2121212',
    });
  },
  'GET /api/403': (_req: Request, res: Response) => {
    res.status(403).send({
      timestamp: 1513932555104,
      status: 403,
      error: 'Forbidden',
      message: 'Forbidden',
      path: '/base/category/list',
    });
  },
  'GET /api/401': (_req: Request, res: Response) => {
    res.status(401).send({
      timestamp: 1513932555104,
      status: 401,
      error: 'Unauthorized',
      message: 'Unauthorized',
      path: '/base/category/list',
    });
  },

  'GET  /api/login/captcha': getFakeCaptcha,
};
