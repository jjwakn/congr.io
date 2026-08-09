import * as Luxon from 'luxon';

interface ParsedDateTime {
  isValid: boolean;
  toMillis: () => number;
  toUTC: () => {
    toJSDate: () => Date;
  };
}

interface LuxonModule {
  DateTime: {
    fromISO: (value: string, options?: { zone?: string }) => ParsedDateTime;
  };
  IANAZone: {
    isValidZone: (value: string) => boolean;
  };
}

const { DateTime, IANAZone } = Luxon as LuxonModule;

export const DEFAULT_CONGREGATION_TIMEZONE = 'UTC';

export const isValidTimeZone = (value?: string | null): value is string =>
  typeof value === 'string' && IANAZone.isValidZone(value.trim());

export const normalizeTimeZone = (value?: string | null): string => {
  const normalized = value?.trim();
  return isValidTimeZone(normalized) ? normalized : DEFAULT_CONGREGATION_TIMEZONE;
};

export const parseDateTimeInTimeZone = ({ value, timeZone }: { value: string; timeZone: string }): ParsedDateTime =>
  DateTime.fromISO(value, { zone: timeZone });
