import Loading from '@components/Loading';
import type { PasswordChangeValues } from '@components/auth/PasswordChangeDialog.types';
import { RequiredPasswordChange } from '@components/auth/RequiredPasswordChange';
import { useAppContext } from '@hooks/useAppContext';
import { useAuth } from '@hooks/useAuth';
import { useNotificationContext } from '@hooks/useNotifications';
import { UsersService } from '@services/users';
import { HttpRequestError, httpRequest } from '@utils/http';
import { Suspense, lazy, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

const Dashboard = lazy(() => import('@pages/Dashboard'));
const Login = lazy(() => import('@pages/Login'));
const Setup = lazy(() => import('@pages/Setup'));

const getErrorMessage = (value: Error | null, fallback: string) =>
  value instanceof HttpRequestError || value instanceof Error ? value.message : fallback;

const AppContent = () => {
  const { t } = useTranslation();
  const { isLoading, isSetup } = useAppContext();
  const { user, isAuthenticated, isSessionLoading, refreshSession } = useAuth();
  const { showNotification } = useNotificationContext();
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const handleRequiredPasswordChange = useCallback(
    async (values: PasswordChangeValues) => {
      setPasswordSubmitting(true);

      try {
        await httpRequest({
          service: UsersService.completeTemporaryPassword,
          data: values,
        });
        await refreshSession();
        showNotification(t('pages.modules.users.success.passwordUpdated'), {
          severity: 'success',
        });
      } catch (value) {
        showNotification(
          getErrorMessage(value instanceof Error ? value : null, t('pages.modules.users.error.changePasswordFailed')),
          {
            severity: 'error',
          },
        );
      } finally {
        setPasswordSubmitting(false);
      }
    },
    [refreshSession, showNotification, t],
  );

  return isLoading || isSessionLoading ? (
    <Loading />
  ) : (
    <Suspense fallback={<Loading />}>
      {!isSetup ? (
        <Setup />
      ) : isAuthenticated && user?.password_change_required ? (
        <RequiredPasswordChange submitting={passwordSubmitting} onSubmit={handleRequiredPasswordChange} />
      ) : isAuthenticated ? (
        <Dashboard />
      ) : (
        <Login />
      )}
    </Suspense>
  );
};

export default AppContent;
