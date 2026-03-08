import { NotificationProvider } from '@contexts/NotificationProvider';
import { ThemeModeProvider } from '@contexts/ThemeProvider';
import { syncBrandingHeadLinks } from '@utils/brandingHead';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import i18n, { initializeI18n } from '../i18n';
import './index.css';

const renderApp = (rootElement: HTMLElement) => {
  createRoot(rootElement).render(
    <StrictMode>
      <NotificationProvider>
        <ThemeModeProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
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
