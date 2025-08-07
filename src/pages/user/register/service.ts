import { request } from '@umijs/max';

export interface StateType {
  status?: 'ok' | 'error';
  currentAuthority?: 'user' | 'guest' | 'admin';
  // 新增字段以匹配OpenAPI规范
  code?: number;
  message?: string;
  data?: Record<string, any>;
}

export interface UserRegisterParams {
  mail: string;
  password: string;
  confirm: string;
  mobile: string;
  captcha: string;
  prefix: string;
  // 新增字段以匹配OpenAPI规范
  account?: string;
  platform?: string;
  extra?: Record<string, any>;
}

export async function fakeRegister(params: UserRegisterParams) {
  // 使用新的注册API端点
  const registerData = {
    account: params.mail || params.account || '',
    password: params.password || '',
    platform: params.platform || 'default',
    extra: {
      mobile: params.mobile,
      captcha: params.captcha,
      prefix: params.prefix,
      ...(params.extra || {})
    }
  };

  return request('/api/auth/register', {
    method: 'POST',
    data: registerData,
  });
}
