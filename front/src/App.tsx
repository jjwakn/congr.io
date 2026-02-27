import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from './components/Layout';
import Loading from './components/Loading';
import { AppProvider } from './contexts/AppProvider';
import { AuthProvider } from './contexts/AuthProvider';
import { FooterProvider } from './contexts/FooterProvider';
import { SetupProvider } from './contexts/SetupProvider';
import { useAppContext } from './hooks/useAppContext';
import { useAuth } from './hooks/useAuth';
import BrandingPage from './pages/Branding';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Setup from './pages/Setup';
import { getLocalizedPathname, isBrandingPath } from './utils/routes';

const AppContent = () => {
  const { isLoading, isSetup } = useAppContext();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  return isLoading || authLoading ? (
    <Loading />
  ) : !isSetup ? (
    <Setup />
  ) : isAuthenticated ? (
    <Dashboard />
  ) : (
    <Login />
  );
};

const usePathname = () => {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return pathname;
};

const App = () => {
  const pathname = usePathname();
  const { i18n } = useTranslation();

  useEffect(() => {
    const localizedPathname = getLocalizedPathname(pathname, i18n.language);
    if (localizedPathname === pathname) return;

    const { search, hash } = window.location;
    window.history.replaceState(
      null,
      '',
      `${localizedPathname}${search}${hash}`,
    );
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, [i18n.language, pathname]);

  if (isBrandingPath(pathname))
    return (
      <FooterProvider>
        <Layout>
          <BrandingPage />
        </Layout>
      </FooterProvider>
    );

  return (
    <AppProvider>
      <AuthProvider>
        <SetupProvider>
          <FooterProvider>
            <Layout>
              <AppContent />
            </Layout>
          </FooterProvider>
        </SetupProvider>
      </AuthProvider>
    </AppProvider>
  );
};

export default App;
