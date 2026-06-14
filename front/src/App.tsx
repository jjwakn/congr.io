import Layout from '@components/Layout';
import Loading from '@components/Loading';
import { AppProvider } from '@contexts/AppProvider';
import { AuthProvider } from '@contexts/AuthProvider';
import { SetupProvider } from '@contexts/SetupProvider';
import { getLocalizedPathname, isBrandingPath } from '@utils/routes';
import { Suspense, lazy, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

const AppShell = lazy(() => import('@/AppShell'));
const BrandingPage = lazy(() => import('@pages/Branding'));

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const pathname = useMemo(() => location.pathname, [location.pathname]);
  const isBranding = useMemo(() => isBrandingPath(pathname), [pathname]);

  useEffect(() => {
    const localizedPathname = getLocalizedPathname(pathname, i18n.language);
    if (localizedPathname === pathname) return;

    navigate(`${localizedPathname}${location.search}${location.hash}`, {
      replace: true,
    });
  }, [i18n.language, location.hash, location.search, navigate, pathname]);

  return isBranding ? (
    <Layout>
      <Suspense fallback={<Loading />}>
        <BrandingPage />
      </Suspense>
    </Layout>
  ) : (
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
