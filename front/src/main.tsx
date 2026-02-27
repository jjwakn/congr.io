import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import i18n from '../i18n';
import App from './App.tsx';
import { NotificationProvider } from './contexts/NotificationProvider.tsx';
import { ThemeModeProvider } from './contexts/ThemeProvider';
import './index.css';
import { syncBrandingHeadLinks } from './utils/brandingHead.ts';

const rootElement = document.getElementById('root');

if (!rootElement) throw new Error(i18n.t('app.error.missingRootElement'));

const renderApp = () => {
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

void syncBrandingHeadLinks().finally(renderApp);
