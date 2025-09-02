import { ReactNode, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotificationContext } from '../hooks/useNotifications';
import { SetupService } from '../services/setup';
import { IsSetupResponse } from '../types/setup.types';
import { httpRequest } from '../utils/http';
import { getIsSetupFromStorage, setIsSetupToStorage } from '../utils/storage';
import { AppContext } from './AppContext';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isSetup, setIsSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { showNotification } = useNotificationContext();
  const { t } = useTranslation();

  const checkIsSetup = useCallback(
    async (forceRefresh = false) => {
      if (!forceRefresh) {
        const storedIsSetup = getIsSetupFromStorage();
        if (storedIsSetup) {
          setIsSetup(true);
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(true);
      try {
        const data = await httpRequest<IsSetupResponse>({
          service: SetupService.isSetup,
        });

        const setupStatus = !!data?.isSetup;

        setIsSetup(setupStatus);
        if (setupStatus) setIsSetupToStorage(true);

        if (!data || !data.isSetup)
          showNotification(t('setup.error.notFound'), { severity: 'warning' });
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        showNotification(error, { severity: 'error' });

        console.error('AppProvider Error', error);

        setIsSetup(false);
      } finally {
        setIsLoading(false);
      }
    },
    [showNotification, t],
  );

  useEffect(() => {
    const storedIsSetup = getIsSetupFromStorage();
    if (storedIsSetup) {
      setIsSetup(true);
      setIsLoading(false);
    } else {
      checkIsSetup();
    }
  }, [checkIsSetup]);

  return (
    <AppContext.Provider
      value={{
        isSetup,
        isLoading,
        refreshIsSetup: () => checkIsSetup(true),
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
