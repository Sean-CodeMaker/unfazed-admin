/**
 * 后端返回的 errorMessage 到人类可读描述的映射
 * 当 API 返回的 message 字段匹配到映射中的 key 时，自动替换为对应的描述文案
 */
const ERROR_MESSAGE_MAP: Record<string, string> = {
  TOAST_SERVER_BUSY:
    'Sever busy：May be due to connection error, API error, etc. Please contact the dev',
};

/**
 * 根据后端返回的 message 获取对应的展示文案
 * 若未在映射表中找到，则返回原始 message
 */
export function getErrorMessage(rawMessage: string): string {
  return ERROR_MESSAGE_MAP[rawMessage] || rawMessage;
}
