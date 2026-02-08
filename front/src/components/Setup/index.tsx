import { Box, LinearProgress } from '@mui/material';
import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../hooks/useAppContext';
import { useFooter } from '../../hooks/useFooter';
import { useNotificationContext } from '../../hooks/useNotifications';
import { useSetup } from '../../hooks/useSetup';
import { SetupService } from '../../services/setup';
import { SetupSubmitResponse } from '../../types/setup.types';
import { API_URL } from '../../utils/constants';
import { setCongregationToStorage } from '../../utils/storage';
import AdminStep from './steps/AdminStep';
import ConfirmStep from './steps/ConfirmStep';
import CongregationStep from './steps/CongregationStep';
import FeaturesStep from './steps/FeaturesStep';
import LocationsStep from './steps/LocationsStep';
import LogoStep from './steps/LogoStep';

const Progress = ({ activeStep }: { activeStep: number }) => {
  return (
    <Box sx={{ width: '100%', padding: 2 }}>
      <LinearProgress variant="determinate" value={(100 / 6) * activeStep} />
    </Box>
  );
};

const Setup = () => {
  const { markSetupComplete } = useAppContext();
  const { showNotification } = useNotificationContext();
  const { setChildren } = useFooter();
  const { i18n, t } = useTranslation();
  const {
    setupData: data,
    activeStep,
    setActiveStep,
    loading: loadingSetup,
    setLoading: setLoadingSetup,
    loadingFeatures,
  } = useSetup();

  const loading = useMemo(
    () => loadingSetup || loadingFeatures,
    [loadingFeatures, loadingSetup],
  );

  const goNext = useCallback(
    () =>
      setActiveStep((step) => {
        const next = step + 1;
        setChildren(<Progress activeStep={next} />);
        return next;
      }),
    [setActiveStep, setChildren],
  );
  const goBack = useCallback(
    () =>
      setActiveStep((step) => {
        const next = step - 1;
        setChildren(<Progress activeStep={next} />);
        return next;
      }),
    [setActiveStep, setChildren],
  );

  const handleFinish = useCallback(async () => {
    try {
      setLoadingSetup(true);

      const smallLogo = data.logo.small?.data;
      const largeLogo = data.logo.large?.data;

      if (!smallLogo || !largeLogo) {
        throw new Error(t('setup.form.logoRequired'));
      }

      const payload = {
        user: {
          username: data.admin.username.trim(),
          password: data.admin.password,
          name: data.admin.name.trim(),
        },
        role: {
          name: data.admin.roleName.trim(),
        },
        congregation: {
          name: data.congregation.name.trim(),
          type: data.congregation.type.trim(),
          locations: data.locations.locations.map((location) => ({
            order: location.order,
            name: location.name.trim(),
            address: location.address.trim(),
          })),
          features: data.features.features,
        },
      };

      const formData = new FormData();
      formData.append('payload', JSON.stringify(payload));
      formData.append('logoSmall', smallLogo);
      formData.append('logoLarge', largeLogo);

      const response = await fetch(`${API_URL}/${SetupService.setup.url}`, {
        method: SetupService.setup.method,
        headers: {
          'Accept-Language': i18n.language || 'en',
        },
        body: formData,
      });

      const rawResult = (await response.json()) as unknown;

      if (!response.ok) {
        let message = t('setup.error.saveFailed');
        if (
          rawResult &&
          typeof rawResult === 'object' &&
          'message' in rawResult
        ) {
          const apiMessage = (rawResult as { message?: string | string[] })
            .message;
          if (Array.isArray(apiMessage)) message = apiMessage.join(', ');
          else if (typeof apiMessage === 'string') message = apiMessage;
        }
        throw new Error(message);
      }

      if (
        !rawResult ||
        typeof rawResult !== 'object' ||
        !('isSetup' in rawResult) ||
        !('congregation' in rawResult) ||
        !(rawResult as SetupSubmitResponse).isSetup
      )
        throw new Error(t('setup.error.saveFailed'));

      const result = rawResult as SetupSubmitResponse;

      setCongregationToStorage(result.congregation);
      markSetupComplete();
      showNotification(t('setup.success.saved'), { severity: 'success' });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      showNotification(error, { severity: 'error' });
      console.error('Setup Error', error);
    } finally {
      setLoadingSetup(false);
    }
  }, [
    data,
    i18n.language,
    markSetupComplete,
    setLoadingSetup,
    showNotification,
    t,
  ]);

  useEffect(() => {
    setChildren(<Progress activeStep={activeStep} />);
  }, [activeStep, setChildren]);

  return (
    <Box
      sx={{
        height: 'fit-content',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        width: '100%',
        minHeight: '100%',
      }}
    >
      {activeStep === 0 && (
        <CongregationStep goNext={goNext} loading={loading} />
      )}

      {activeStep === 1 && (
        <FeaturesStep goNext={goNext} goBack={goBack} loading={loading} />
      )}

      {activeStep === 2 && (
        <LocationsStep goNext={goNext} goBack={goBack} loading={loading} />
      )}

      {activeStep === 3 && (
        <LogoStep goNext={goNext} goBack={goBack} loading={loading} />
      )}

      {activeStep === 4 && (
        <AdminStep goNext={goNext} goBack={goBack} loading={loading} />
      )}

      {activeStep === 5 && (
        <ConfirmStep
          data={data}
          onFinish={handleFinish}
          disabled={loading}
          onBack={goBack}
        />
      )}
    </Box>
  );
};

export default Setup;
