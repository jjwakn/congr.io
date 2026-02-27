import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import i18n, { initializeI18n } from '../i18n';
import App from './App.tsx';
import { NotificationProvider } from './contexts/NotificationProvider.tsx';
import { ThemeModeProvider } from './contexts/ThemeProvider';
import './index.css';
import { syncBrandingHeadLinks } from './utils/brandingHead.ts';

const renderApp = (rootElement: HTMLElement) => {
  createRoot(rootElement).render(
    <StrictMode>
      <NotificationProvider>
        <ThemeModeProvider>
          <App />
        </ThemeModeProvider>
      </NotificationProvider>
    </StrictMode>,
  );
};

const bootstrapApp = async () => {
  await initializeI18n();

  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error(i18n.t('app.error.missingRootElement'));

  try {
    await syncBrandingHeadLinks();
  } finally {
    renderApp(rootElement);
  }
};

void bootstrapApp();
