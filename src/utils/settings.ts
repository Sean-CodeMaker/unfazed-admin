/**
 * 应用级别设置类型定义
 */
export interface AppSettings {
  pageSize: number;
  timeZone: string;
  apiPrefix: string;
  debug: boolean;
  version: string;
  extra?: Record<string, any>;
  authPlugins?: Record<string, any>[];
}

/**
 * 默认应用设置
 */
export const defaultAppSettings: AppSettings = {
  pageSize: 20,
  timeZone: 'Asia/Shanghai',
  apiPrefix: '/api',
  debug: false,
  version: '1.0.0',
  extra: {},
  authPlugins: [],
};

/**
 * 获取应用设置
 * @returns AppSettings
 */
export const getAppSettings = (): AppSettings => {
  try {
    const saved = localStorage.getItem('unfazed_app_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultAppSettings, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to parse app settings from localStorage:', error);
  }
  return defaultAppSettings;
};

/**
 * 设置应用配置
 * @param settings 部分或完整的应用设置
 */
export const setAppSettings = (settings: Partial<AppSettings>): void => {
  try {
    const current = getAppSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem('unfazed_app_settings', JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save app settings to localStorage:', error);
  }
};

/**
 * 获取API前缀
 * @returns string
 */
export const getApiPrefix = (): string => {
  return getAppSettings().apiPrefix;
};

/**
 * 获取分页大小
 * @returns number
 */
export const getPageSize = (): number => {
  return getAppSettings().pageSize;
};

/**
 * 获取时区
 * @returns string
 */
export const getTimeZone = (): string => {
  return getAppSettings().timeZone;
};

/**
 * 获取调试模式
 * @returns boolean
 */
export const getDebugMode = (): boolean => {
  return getAppSettings().debug;
};

/**
 * 获取应用版本
 * @returns string
 */
export const getAppVersion = (): string => {
  return getAppSettings().version;
};

/**
 * 获取扩展配置
 * @returns Record<string, any>
 */
export const getExtraSettings = (): Record<string, any> => {
  return getAppSettings().extra || {};
};

/**
 * 获取认证插件配置
 * @returns Record<string, any>[]
 */
export const getAuthPlugins = (): Record<string, any>[] => {
  return getAppSettings().authPlugins || [];
};
