import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { getTimeZone } from '@/utils/settings';

dayjs.extend(utc);

export const SECONDS_TIMESTAMP_LIMIT = 10000000000;

export const isEmptyDateTimeValue = (value: any) =>
  value === undefined || value === null || value === '';

export const isNumericTimestamp = (value: any) =>
  (typeof value === 'number' && Number.isFinite(value)) ||
  (typeof value === 'string' && /^\d+$/.test(value));

export const toTimestampMilliseconds = (value: any) => {
  if (!isNumericTimestamp(value)) return value;

  const numValue = Number(value);
  return numValue > 0 && numValue < SECONDS_TIMESTAMP_LIMIT
    ? numValue * 1000
    : numValue;
};

export const toDateTimePickerValue = (value: any) => {
  if (isEmptyDateTimeValue(value)) return value;

  if (isNumericTimestamp(value)) {
    return dayjs(toTimestampMilliseconds(value));
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : value;
};

export const toUnixTimestamp = (value: any) => {
  if (isEmptyDateTimeValue(value)) return value;

  if (isNumericTimestamp(value)) {
    const numValue = Number(value);
    return numValue > 0 && numValue < SECONDS_TIMESTAMP_LIMIT
      ? numValue
      : Math.floor(numValue / 1000);
  }

  if (typeof (value as any)?.unix === 'function') {
    const unixValue = Number((value as any).unix());
    return Number.isFinite(unixValue) ? unixValue : null;
  }

  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isFinite(time) ? Math.floor(time / 1000) : null;
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.unix() : null;
};

export const currentUnixTimestamp = () => Math.floor(Date.now() / 1000);

/**
 * 解析 UTC+X 格式的时区字符串，返回偏移分钟数
 * @param timeZone 时区字符串，如 'UTC', 'UTC+0', 'UTC+8', 'UTC-5'
 * @returns 偏移分钟数；'UTC' 返回 null（浏览器本地时区），无效格式返回 null
 */
const parseUtcOffset = (timeZone: string): number | null => {
  if (!timeZone || timeZone === 'UTC') return null;

  const match = timeZone.match(/^UTC([+-])(\d{1,2})(?::(\d{2}))?$/i);
  if (!match) return null;

  const sign = match[1] === '+' ? 1 : -1;
  const hours = parseInt(match[2], 10);
  const minutes = match[3] ? parseInt(match[3], 10) : 0;

  return sign * (hours * 60 + minutes);
};

export const formatDateTimeValue = (
  value: any,
  format: string,
  fallback = '-',
) => {
  if (isEmptyDateTimeValue(value)) return fallback;

  const timeZone = getTimeZone();
  const offsetMinutes = parseUtcOffset(timeZone);

  // 尝试作为数值时间戳处理
  if (isNumericTimestamp(value)) {
    const timestampMs = Number(toTimestampMilliseconds(value));

    if (offsetMinutes !== null) {
      return dayjs.utc(timestampMs).utcOffset(offsetMinutes).format(format);
    }

    return dayjs(timestampMs).format(format);
  }

  // 非数值类型（日期字符串等），直接解析
  const parsed = toDateTimePickerValue(value);
  const result = dayjs(parsed);
  return result.isValid() ? result.format(format) : fallback;
};
