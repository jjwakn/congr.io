import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from './components/Layout';
import Loading from './components/Loading';
import { AppProvider } from './contexts/AppProvider';
import { AuthProvider } from './contexts/AuthProvider';
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
  const { isAuthenticated, isSessionLoading } = useAuth();

  return isLoading || isSessionLoading ? (
    <Loading />
  ) : !isSetup ? (
    <Setup />
  ) : isAuthenticated ? (
    <Dashboard />
  ) : (
    <Login />
  );
};

const AppShell = () => {
  const { isLoading, isSetup } = useAppContext();
  const { isAuthenticated, isSessionLoading } = useAuth();

  const showFooter =
    !isLoading && !isSessionLoading && (!isSetup || !isAuthenticated);

  return (
    <Layout showFooter={showFooter}>
      <AppContent />
    </Layout>
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
      <Layout>
        <BrandingPage />
      </Layout>
    );

  return (
    <AppProvider>
      <AuthProvider>
        <SetupProvider>
          <AppShell />
        </SetupProvider>
      </AuthProvider>
    </AppProvider>
  );
};

export default App;
