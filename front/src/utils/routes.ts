import { AppLanguage, LocalizedValue } from './routes.types';

const HOME_PATH = '/';

const BRANDING_SEGMENT: LocalizedValue = {
  en: 'branding',
  es: 'marca',
};

const FILES_SEGMENT: LocalizedValue = { en: 'files', es: 'archivos' };
const PUBLIC_EVENTS_SEGMENT = 'e';

const MODULES_SEGMENT: LocalizedValue = {
  en: 'modules',
  es: 'modulos',
};

const SETTINGS_SEGMENT: LocalizedValue = {
  en: 'settings',
  es: 'preferencias',
};

const LEGACY_SETTINGS_SEGMENTS = ['configuracion'];

const MODULE_SLUGS: Record<string, LocalizedValue> = {
  roles: { en: 'roles', es: 'roles' },
  users: { en: 'users', es: 'usuarios' },
  members: { en: 'members', es: 'miembros' },
  processes: { en: 'processes', es: 'procesos' },
  events: { en: 'events', es: 'eventos' },
  events_calendar: { en: 'events-calendar', es: 'calendario-eventos' },
  events_attendance: {
    en: 'events-attendance',
    es: 'asistencia-eventos',
  },
  event_registration: {
    en: 'event-registration',
    es: 'registro-eventos',
  },
  ministries: { en: 'ministries', es: 'ministerios' },
  ministries_calendar: {
    en: 'ministries-calendar',
    es: 'calendario-ministerios',
  },
  services: { en: 'services', es: 'servicios' },
  services_new_people: { en: 'new-people', es: 'personas-nuevas' },
  services_follow_up: { en: 'follow-up', es: 'seguimiento' },
  services_attendance: { en: 'service-attendance', es: 'asistencia-servicios' },
};

const normalizeLanguage = (language?: string): AppLanguage => (language?.toLowerCase().startsWith('es') ? 'es' : 'en');

const trimPath = (pathname: string): string => pathname.replace(/^\/+|\/+$/g, '');

const splitPath = (pathname: string): string[] => {
  const trimmed = trimPath(pathname);
  return trimmed ? trimmed.split('/').filter(Boolean) : [];
};

const matchesLocalizedSegment = (segment: string | undefined, values: LocalizedValue): boolean =>
  Boolean(segment && Object.values(values).includes(segment));

const getModuleSlug = (moduleId: string, language?: string): string => {
  const lang = normalizeLanguage(language);
  return MODULE_SLUGS[moduleId]?.[lang] ?? moduleId.replace(/_/g, '-');
};

const getModuleIdFromSlug = (slug: string): string | null => {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug) return null;

  for (const [moduleId, localized] of Object.entries(MODULE_SLUGS)) {
    if (
      normalizedSlug === localized.en ||
      normalizedSlug === localized.es ||
      normalizedSlug === moduleId ||
      normalizedSlug === moduleId.replace(/_/g, '-')
    ) {
      return moduleId;
    }
  }

  return null;
};

export const getBrandingPath = (language?: string): string => {
  const lang = normalizeLanguage(language);
  return `/${BRANDING_SEGMENT[lang]}`;
};

export const getHomePath = (): string => HOME_PATH;

export const isHomePath = (pathname: string): boolean => {
  const trimmed = trimPath(pathname);
  return !trimmed;
};

export const isBrandingPath = (pathname: string): boolean => {
  const segments = splitPath(pathname);
  return segments.length === 1 && matchesLocalizedSegment(segments[0], BRANDING_SEGMENT);
};

export const getFilesPath = (language?: string) => `/${FILES_SEGMENT[normalizeLanguage(language)]}`;
export const isFilesPath = (pathname: string) => {
  const segments = splitPath(pathname);
  return segments.length === 1 && matchesLocalizedSegment(segments[0], FILES_SEGMENT);
};
export const isPublicEventsPath = (pathname: string) => {
  const segments = splitPath(pathname);
  return segments[0] === PUBLIC_EVENTS_SEGMENT;
};
export const getPublicEventsPath = (_language?: string, publicId?: string) => {
  const base = `/${PUBLIC_EVENTS_SEGMENT}`;
  return publicId ? `${base}/${publicId}` : base;
};

export const getModulePrefix = (language?: string): string => {
  const lang = normalizeLanguage(language);
  return `/${MODULES_SEGMENT[lang]}`;
};

export const getSettingsPath = (language?: string): string => {
  const lang = normalizeLanguage(language);
  return `/${SETTINGS_SEGMENT[lang]}`;
};

export const isSettingsPath = (pathname: string): boolean => {
  const segments = splitPath(pathname);
  return (
    segments.length === 1 &&
    (matchesLocalizedSegment(segments[0], SETTINGS_SEGMENT) || LEGACY_SETTINGS_SEGMENTS.includes(segments[0]))
  );
};

export const getSettingsPaths = (): string[] => [
  `/${SETTINGS_SEGMENT.en}`,
  `/${SETTINGS_SEGMENT.es}`,
  ...LEGACY_SETTINGS_SEGMENTS.map((segment) => `/${segment}`),
];

export const getModulePath = (moduleId: string, language?: string): string => `/${getModuleSlug(moduleId, language)}`;

export const getModuleIdFromPath = (pathname: string): string | null => {
  const segments = splitPath(pathname);
  if (!segments.length) return null;

  if (matchesLocalizedSegment(segments[0], MODULES_SEGMENT)) {
    return segments[1] ? getModuleIdFromSlug(segments[1]) : null;
  }

  if (!matchesLocalizedSegment(segments[0], BRANDING_SEGMENT)) {
    return getModuleIdFromSlug(segments[0]);
  }

  return null;
};

export const getLocalizedPathname = (pathname: string, language?: string): string => {
  if (isBrandingPath(pathname)) return getBrandingPath(language);
  if (isFilesPath(pathname)) return getFilesPath(language);
  if (isPublicEventsPath(pathname)) {
    const [, publicId] = splitPath(pathname);
    return getPublicEventsPath(language, publicId);
  }
  if (isSettingsPath(pathname)) return getSettingsPath(language);

  const moduleId = getModuleIdFromPath(pathname);
  if (moduleId) {
    const segments = splitPath(pathname);
    return [getModulePath(moduleId, language), ...segments.slice(1)].join('/');
  }

  return pathname;
};
