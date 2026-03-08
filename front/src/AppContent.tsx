import { Suspense, lazy } from 'react';
import Loading from './components/Loading';
import { useAppContext } from './hooks/useAppContext';
import { useAuth } from './hooks/useAuth';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Setup = lazy(() => import('./pages/Setup'));

const AppContent = () => {
  const { isLoading, isSetup } = useAppContext();
  const { isAuthenticated, isSessionLoading } = useAuth();

  return isLoading || isSessionLoading ? (
    <Loading />
  ) : (
    <Suspense fallback={<Loading />}>{!isSetup ? <Setup /> : isAuthenticated ? <Dashboard /> : <Login />}</Suspense>
  );
};

export default AppContent;
