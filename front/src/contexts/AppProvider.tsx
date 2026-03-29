import { useNotificationContext } from '@hooks/useNotifications';
import { SetupService } from '@services/setup';
import { toTimestamp } from '@utils/datetime';
import { httpRequest } from '@utils/http';
import {
  clearCongregationFromStorage,
  getCongregationFromStorage,
  getIsSetupFromStorage,
  setCongregationToStorage,
  setIsSetupToStorage,
  setThemePaletteConfigToStorage,
} from '@utils/storage';
import { DEFAULT_THEME_PALETTE_CONFIG } from '@utils/theme';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Congregation } from '@/types/congregation.types';
import { IsSetupResponse } from '@/types/setup.types';
import { AppContext } from './AppContext';

let setupStatusRequest: Promise<IsSetupResponse> | null = null;

const shouldSyncCongregation = (localCongregation: Congregation | null, remoteCongregation: Congregation): boolean => {
  if (!localCongregation) return true;

  const localUpdated = toTimestamp(localCongregation.updated_at);
  const remoteUpdated = toTimestamp(remoteCongregation.updated_at);

  if (!localUpdated || !remoteUpdated) return true;
  return remoteUpdated > localUpdated;
};

const fetchSetupStatus = (forceRefresh = false) => {
  if (forceRefresh || !setupStatusRequest) {
    setupStatusRequest = httpRequest<IsSetupResponse>({
      service: SetupService.isSetup,
    }).catch((error) => {
      setupStatusRequest = null;
      throw error;
    });
  }
  return setupStatusRequest;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isSetup, setIsSetup] = useState<boolean>(() => getIsSetupFromStorage());
  const [congregation, setCongregation] = useState<Congregation | null>(() => getCongregationFromStorage());
  const [isLoading, setIsLoading] = useState<boolean>(() => !getIsSetupFromStorage());
  const { showNotification } = useNotificationContext();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isSetup) {
      document.title = t('setup.title');
      return;
    }

    const congregationName = congregation?.name?.trim();
    document.title = congregationName || 'congr.io';
  }, [congregation?.name, isSetup, t]);

  const checkIsSetup = useCallback(
    async (forceRefresh = false) => {
      const shouldShowLoading = forceRefresh || !isSetup;
      if (shouldShowLoading) setIsLoading(true);

      try {
        const data = await fetchSetupStatus(forceRefresh);

        const setupStatus = !!data?.isSetup;
        setIsSetup(setupStatus);
        setIsSetupToStorage(setupStatus);

        if (setupStatus && data?.congregation) {
          const localCongregation = congregation ?? getCongregationFromStorage();

          if (shouldSyncCongregation(localCongregation, data.congregation)) {
            setCongregation(data.congregation);
            setCongregationToStorage(data.congregation);
          } else if (!congregation && localCongregation) {
            setCongregation(localCongregation);
          }

          setThemePaletteConfigToStorage(data.congregation.theme_palette ?? DEFAULT_THEME_PALETTE_CONFIG);
        } else if (!setupStatus) {
          setCongregation(null);
          clearCongregationFromStorage();
          setThemePaletteConfigToStorage(DEFAULT_THEME_PALETTE_CONFIG);
        }

        if (!data || !data.isSetup) showNotification(t('setup.error.notFound'), { severity: 'warning' });
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        showNotification(error, { severity: 'error' });

        console.error(t('app.log.appProviderError'), error);

        const storedIsSetup = getIsSetupFromStorage();
        if (!isSetup && !storedIsSetup) {
          setIsSetup(false);
          setIsSetupToStorage(false);
        }
      } finally {
        if (shouldShowLoading) setIsLoading(false);
      }
    },
    [congregation, isSetup, showNotification, t],
  );

  const markSetupComplete = useCallback((nextCongregation: Congregation) => {
    setIsSetup(true);
    setIsLoading(false);
    setIsSetupToStorage(true);
    setCongregation(nextCongregation);
    setCongregationToStorage(nextCongregation);
    setThemePaletteConfigToStorage(nextCongregation.theme_palette ?? DEFAULT_THEME_PALETTE_CONFIG);
    setupStatusRequest = Promise.resolve({
      isSetup: true,
      congregation: nextCongregation,
    });
  }, []);

  useEffect(() => {
    void checkIsSetup();
  }, [checkIsSetup]);

  return (
    <AppContext.Provider
      value={{
        isSetup,
        congregation,
        isLoading,
        refreshIsSetup: () => checkIsSetup(true),
        markSetupComplete,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
