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

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_ONLY_PATTERN = /^\d{2}:\d{2}(?::\d{2})?$/;
const HAS_TIME_ZONE_PATTERN = /(Z|[+-]\d{2}:?\d{2})$/i;

const parseTimeZoneOffsetFromValue = (value: string): number | null => {
  if (/Z$/i.test(value)) return 0;

  const match = value.match(/([+-])(\d{2}):?(\d{2})$/);
  if (!match) return null;

  const sign = match[1] === '+' ? 1 : -1;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3], 10);

  return sign * (hours * 60 + minutes);
};

/**
 * Parse a UTC+X style timezone string and return the offset in minutes.
 * @param timeZone Timezone string such as 'UTC', 'UTC+0', 'UTC+8', 'UTC-5'
 * @returns Offset minutes; 'UTC' returns 0 and invalid formats return null
 */
const parseUtcOffset = (timeZone: string): number | null => {
  if (!timeZone) return null;
  if (timeZone === 'UTC') return 0;

  const match = timeZone.match(/^UTC([+-])(\d{1,2})(?::(\d{2}))?$/i);
  if (!match) return null;

  const sign = match[1] === '+' ? 1 : -1;
  const hours = parseInt(match[2], 10);
  const minutes = match[3] ? parseInt(match[3], 10) : 0;

  return sign * (hours * 60 + minutes);
};

const getDisplayDayjs = (value: any) => {
  if (isEmptyDateTimeValue(value)) return null;

  const timeZone = getTimeZone();
  const offsetMinutes = parseUtcOffset(timeZone);

  if (isNumericTimestamp(value)) {
    const timestampMs = Number(toTimestampMilliseconds(value));
    if (offsetMinutes !== null) {
      return dayjs.utc(timestampMs).utcOffset(offsetMinutes);
    }
    return dayjs(timestampMs);
  }

  if (value instanceof Date) {
    const timestampMs = value.getTime();
    if (!Number.isFinite(timestampMs)) return null;
    if (offsetMinutes !== null) {
      return dayjs.utc(timestampMs).utcOffset(offsetMinutes);
    }
    return dayjs(timestampMs);
  }

  if (typeof (value as any)?.valueOf === 'function') {
    const maybeTimestamp = Number((value as any).valueOf());
    if (
      Number.isFinite(maybeTimestamp) &&
      typeof (value as any)?.format === 'function'
    ) {
      if (offsetMinutes !== null) {
        return dayjs.utc(maybeTimestamp).utcOffset(offsetMinutes);
      }
      return dayjs(maybeTimestamp);
    }
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (DATE_ONLY_PATTERN.test(trimmed) || TIME_ONLY_PATTERN.test(trimmed)) {
      const parsed = dayjs(trimmed);
      return parsed.isValid() ? parsed : null;
    }

    if (HAS_TIME_ZONE_PATTERN.test(trimmed)) {
      const absolute = dayjs(trimmed);
      const embeddedOffset = parseTimeZoneOffsetFromValue(trimmed);
      if (!absolute.isValid() || embeddedOffset === null) return null;

      return dayjs.utc(absolute.valueOf()).utcOffset(embeddedOffset);
    }

    if (offsetMinutes !== null) {
      const parsedAsUtc = dayjs.utc(trimmed);
      return parsedAsUtc.isValid()
        ? parsedAsUtc.utcOffset(offsetMinutes)
        : null;
    }
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
};

export const formatDateTimeValue = (
  value: any,
  format: string,
  fallback = '-',
) => {
  if (isEmptyDateTimeValue(value)) return fallback;

  const parsed = getDisplayDayjs(value);
  return parsed?.isValid() ? parsed.format(format) : fallback;
};

export const toDisplayDateTimePickerValue = (value: any) => {
  if (isEmptyDateTimeValue(value)) return value;

  const parsed = getDisplayDayjs(value);
  return parsed?.isValid() ? parsed : value;
};
