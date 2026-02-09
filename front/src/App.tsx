import { useEffect, useState } from 'react';
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

  if (pathname === '/branding')
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
