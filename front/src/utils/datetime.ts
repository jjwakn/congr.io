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

export const getDateInputFormat = (language?: string) => (language?.startsWith('es') ? 'dd/LL/yyyy' : 'LL/dd/yyyy');

export const getDateInputPlaceholder = (language?: string) =>
  language?.startsWith('es') ? 'dd/mm/yyyy' : 'mm/dd/yyyy';

export const formatDateForInput = (value?: string | null, language?: string) => {
  if (!value) return '';
  const parsed = DateTime.fromISO(value);
  return parsed.isValid ? parsed.setLocale(language ?? 'en').toFormat(getDateInputFormat(language)) : '';
};

export const parseDateInput = (value: string, language?: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const parsed = DateTime.fromFormat(trimmed, getDateInputFormat(language), { locale: language ?? 'en' });
  return parsed.isValid ? parsed.toISODate() : null;
};

export const calculateAgeFromBirthdate = (birthdate?: string | null) => {
  if (!birthdate) return null;
  const parsed = DateTime.fromISO(birthdate);
  if (!parsed.isValid) return null;
  return Math.floor(DateTime.now().diff(parsed, 'years').years);
};

export const calculateDisplayedRegisteredAge = (age?: number | null, recordedAt?: string | null) => {
  if (age === undefined || age === null) return null;
  if (!recordedAt) return age;
  const recorded = DateTime.fromISO(recordedAt);
  if (!recorded.isValid) return age;
  return age + Math.max(0, DateTime.now().year - recorded.year);
};
