import { Suspense, lazy, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from './components/Layout';
import Loading from './components/Loading';
import { AppProvider } from './contexts/AppProvider';
import { AuthProvider } from './contexts/AuthProvider';
import { SetupProvider } from './contexts/SetupProvider';
import { getLocalizedPathname, isBrandingPath } from './utils/routes';

const AppShell = lazy(() => import('./AppShell'));
const BrandingPage = lazy(() => import('./pages/Branding'));

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
        <Suspense fallback={<Loading />}>
          <BrandingPage />
        </Suspense>
      </Layout>
    );

  return (
    <AppProvider>
      <AuthProvider>
        <SetupProvider>
          <Suspense fallback={<Loading />}>
            <AppShell />
          </Suspense>
        </SetupProvider>
      </AuthProvider>
    </AppProvider>
  );
};

export default App;
