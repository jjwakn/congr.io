import AppContent from './AppContent';
import Layout from './components/Layout';
import { useAppContext } from './hooks/useAppContext';
import { useAuth } from './hooks/useAuth';

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

export default AppShell;
