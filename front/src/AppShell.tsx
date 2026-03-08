import Layout from '@components/Layout';
import { useAppContext } from '@hooks/useAppContext';
import { useAuth } from '@hooks/useAuth';
import { useMemo } from 'react';
import AppContent from '@/AppContent';

const AppShell = () => {
  const { isLoading, isSetup } = useAppContext();
  const { isAuthenticated, isSessionLoading } = useAuth();

  const showFooter = useMemo(
    () => !isLoading && !isSessionLoading && (!isSetup || !isAuthenticated),
    [isAuthenticated, isLoading, isSessionLoading, isSetup],
  );

  return (
    <Layout showFooter={showFooter}>
      <AppContent />
    </Layout>
  );
};

export default AppShell;
