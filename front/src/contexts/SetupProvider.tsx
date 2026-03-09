import { ReactNode, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotificationContext } from '../hooks/useNotifications';
import { FeaturesService } from '../services/features';
import { Feature } from '../types/feature.types';
import { SetupData } from '../types/setup.types';
import { httpRequest } from '../utils/http';
import { SetupContext } from './SetupContext';

const initialSetupData: SetupData = {
  congregation: {
    name: '',
    type: '',
  },
  features: { features: [] },
  locations: { locations: [] },
  admin: { username: '', password: '', name: '', roleName: '' },
};

export const SetupProvider = ({ children }: { children: ReactNode }) => {
  const [setupData, setSetupDataState] = useState<SetupData>(initialSetupData);
  const [activeStep, setActiveStepState] = useState(0);
  const [loading, setLoadingState] = useState(false);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loadingFeatures, setLoadingFeatures] = useState(false);

  const { showNotification } = useNotificationContext();
  const { t } = useTranslation();

  const setSetupData = useCallback((data: SetupData | ((prev: SetupData) => SetupData)) => {
    setSetupDataState(data);
  }, []);

  const setActiveStep = useCallback((step: number | ((prev: number) => number)) => {
    setActiveStepState(step);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setLoadingState(loading);
  }, []);

  const loadFeatures = useCallback(async () => {
    setLoadingFeatures(true);
    try {
      const data = await httpRequest<Feature[]>({
        service: FeaturesService.list,
      });

      if (!data || !data.length)
        showNotification(t('setup.error.featuresNotFound'), {
          severity: 'error',
        });

      setFeatures(data ?? []);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      showNotification(error, { severity: 'error' });

      console.error(t('setup.log.featuresError'), error);
    } finally {
      setLoadingFeatures(false);
    }
  }, [showNotification, t]);

  useEffect(() => {
    void loadFeatures();
  }, [loadFeatures]);

  return (
    <SetupContext.Provider
      value={{
        setupData,
        setSetupData,
        activeStep,
        setActiveStep,
        loading,
        setLoading,
        features,
        setFeatures,
        loadingFeatures,
        setLoadingFeatures,
      }}
    >
      {children}
    </SetupContext.Provider>
  );
};
