import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

type SupportedLanguage = 'en' | 'es';
type TranslationRecord = Record<string, unknown>;
type TranslationBundle = Record<string, TranslationRecord>;
type TranslationLoader = () => Promise<{ default: TranslationBundle }>;

const FALLBACK_LANGUAGE: SupportedLanguage = 'en';

const translationLoaders: Record<SupportedLanguage, TranslationLoader> = {
  en: () => import('./src/locales/en'),
  es: () => import('./src/locales/es'),
};

const loadedLanguages = new Set<SupportedLanguage>();
let initializationPromise: Promise<typeof i18n> | null = null;

const normalizeLanguage = (value?: string | null): SupportedLanguage => {
  if (!value) return FALLBACK_LANGUAGE;
  return value.toLowerCase().startsWith('es') ? 'es' : 'en';
};

const readStoredLanguage = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem('i18nextLng');
  } catch {
    return null;
  }
};

const persistLanguage = (language: SupportedLanguage) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem('i18nextLng', language);
  } catch {
    // Ignore storage write failures and keep language in memory.
  }
};

const resolveInitialLanguage = (): SupportedLanguage => {
  const storedLanguage = readStoredLanguage();
  if (storedLanguage) return normalizeLanguage(storedLanguage);

  if (typeof navigator !== 'undefined') {
    return normalizeLanguage(navigator.language);
  }

  return FALLBACK_LANGUAGE;
};

const loadLanguageBundle = async (
  language: SupportedLanguage,
): Promise<TranslationBundle> => {
  const loader = translationLoaders[language];
  const bundle = await loader();
  return bundle.default;
};

export const ensureLanguageResources = async (
  language: string,
): Promise<SupportedLanguage> => {
  const normalizedLanguage = normalizeLanguage(language);
  if (loadedLanguages.has(normalizedLanguage)) return normalizedLanguage;

  const bundle = await loadLanguageBundle(normalizedLanguage);
  i18n.addResourceBundle(normalizedLanguage, 'translation', bundle, true, true);
  loadedLanguages.add(normalizedLanguage);

  return normalizedLanguage;
};

export const initializeI18n = async (): Promise<typeof i18n> => {
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    const initialLanguage = resolveInitialLanguage();
    const initialBundle = await loadLanguageBundle(initialLanguage);

    await i18n.use(initReactI18next).init({
      lng: initialLanguage,
      fallbackLng: FALLBACK_LANGUAGE,
      interpolation: {
        escapeValue: false,
      },
      resources: {
        [initialLanguage]: { translation: initialBundle },
      },
    });

    loadedLanguages.add(initialLanguage);
    persistLanguage(initialLanguage);

    if (initialLanguage !== FALLBACK_LANGUAGE) {
      await ensureLanguageResources(FALLBACK_LANGUAGE);
    }

    return i18n;
  })();

  return initializationPromise;
};

export const changeLanguageWithResources = async (
  language: string,
): Promise<void> => {
  const normalizedLanguage = await ensureLanguageResources(language);
  if (normalizeLanguage(i18n.language) !== normalizedLanguage) {
    await i18n.changeLanguage(normalizedLanguage);
  }
  persistLanguage(normalizedLanguage);
};

export default i18n;
