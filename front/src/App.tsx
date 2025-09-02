import Loading from './components/Loading';
import { AppProvider } from './contexts/AppProvider';
import { AuthProvider } from './contexts/AuthProvider';
import { useAppContext } from './hooks/useAppContext';
import { useAuth } from './hooks/useAuth';
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

const App = () => {
  return (
    <AppProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AppProvider>
  );
};

export default App;
