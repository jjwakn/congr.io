import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import enApp from './src/locales/en/app.json';
import enAuth from './src/locales/en/auth.json';
import enBrandingGenerator from './src/locales/en/brandingGenerator.json';
import enComponents from './src/locales/en/components.json';
import enContext from './src/locales/en/context.json';
import enFooter from './src/locales/en/footer.json';
import enForm from './src/locales/en/form.json';
import enHttp from './src/locales/en/http.json';
import enPages from './src/locales/en/pages.json';
import enPwa from './src/locales/en/pwa.json';
import enSetup from './src/locales/en/setup.json';
import esApp from './src/locales/es/app.json';
import esAuth from './src/locales/es/auth.json';
import esBrandingGenerator from './src/locales/es/brandingGenerator.json';
import esComponents from './src/locales/es/components.json';
import esContext from './src/locales/es/context.json';
import esFooter from './src/locales/es/footer.json';
import esForm from './src/locales/es/form.json';
import esHttp from './src/locales/es/http.json';
import esPages from './src/locales/es/pages.json';
import esPwa from './src/locales/es/pwa.json';
import esSetup from './src/locales/es/setup.json';

const enTranslation = {
  app: enApp,
  auth: enAuth,
  brandingGenerator: enBrandingGenerator,
  components: enComponents,
  context: enContext,
  footer: enFooter,
  form: enForm,
  http: enHttp,
  pages: enPages,
  pwa: enPwa,
  setup: enSetup,
};

const esTranslation = {
  app: esApp,
  auth: esAuth,
  brandingGenerator: esBrandingGenerator,
  components: esComponents,
  context: esContext,
  footer: esFooter,
  form: esForm,
  http: esHttp,
  pages: esPages,
  pwa: esPwa,
  setup: esSetup,
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: { translation: enTranslation },
      es: { translation: esTranslation },
    },
  });

export default i18n;
