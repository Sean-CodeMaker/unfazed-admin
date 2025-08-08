// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 获取当前的用户 GET /api/currentUser */
export async function currentUser(options?: { [key: string]: any }) {
  return request<{
    data: API.CurrentUser;
  }>('/api/currentUser', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 退出登录接口 POST /api/auth/logout */
export async function outLogin(options?: { [key: string]: any }) {
  return request<Record<string, any>>('/api/auth/logout', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 获取管理员设置 GET /api/admin/settings */
export async function getAdminSettings(options?: { [key: string]: any }) {
  return request<{
    code: number;
    message: string;
    data: API.AdminSettings;
  }>('/api/admin/settings', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 登录接口 POST /api/auth/login */
export async function login(body: API.LoginParams, options?: { [key: string]: any }) {
  // 转换参数以匹配OpenAPI规范
  const loginData = {
    account: body.username || body.account || '',
    password: body.password || '',
    platform: body.platform || 'default',
    extra: body.extra || {}
  };

  return request<API.LoginResult>('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: loginData,
    ...(options || {}),
  });
}

/** 注册接口 POST /api/auth/register */
export async function register(body: API.RegisterParams, options?: { [key: string]: any }) {
  // 转换参数以匹配OpenAPI规范
  const registerData = {
    account: body.account || '',
    password: body.password || '',
    platform: body.platform || 'default',
    extra: body.extra || {}
  };

  return request<API.RegisterResult>('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: registerData,
    ...(options || {}),
  });
}

/** 获取路由列表 GET /api/admin/route-list */
export async function getRouteList(options?: { [key: string]: any }) {
  return request<API.RouteListResponse>('/api/admin/route-list', {
    method: 'GET',
    ...(options || {}),
  });
}
