import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../i18n';
import App from './App.tsx';
import { NotificationProvider } from './contexts/NotificationProvider.tsx';
import { ThemeModeProvider } from './contexts/ThemeProvider';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NotificationProvider>
      <ThemeModeProvider>
        <App />
      </ThemeModeProvider>
    </NotificationProvider>
  </StrictMode>,
);
