import { DateTime, IANAZone } from 'luxon';

export const DEFAULT_TIMEZONE = 'UTC';

export const getBrowserTimeZone = (): string => {
  const zoneName = DateTime.local().zoneName;
  return IANAZone.isValidZone(zoneName) ? zoneName : DEFAULT_TIMEZONE;
};

export const getSupportedTimeZones = (): string[] => {
  const browserTimeZone = getBrowserTimeZone();
  const internationalization = Intl as typeof Intl & {
    supportedValuesOf?: (key: 'timeZone') => string[];
  };

  const values =
    typeof internationalization.supportedValuesOf === 'function'
      ? internationalization.supportedValuesOf('timeZone')
      : [browserTimeZone, DEFAULT_TIMEZONE];

  return Array.from(new Set(values.filter((value) => IANAZone.isValidZone(value))));
};

export const toTimestamp = (value?: Date | string | null): number => {
  if (!value) return 0;

  const parsed = value instanceof Date ? DateTime.fromJSDate(value) : DateTime.fromISO(value, { setZone: true });

  if (!parsed.isValid) return 0;
  return parsed.toMillis();
};
