import { Box } from '@mui/material';
import { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../hooks/useAppContext';
import { useNotificationContext } from '../../hooks/useNotifications';
import { useSetup } from '../../hooks/useSetup';
import { SetupService } from '../../services/setup';
import { SetupSubmitResponse } from '../../types/setup.types';
import { HttpRequestError, httpRequest } from '../../utils/http';
import Progress from './Progress';
import AdminStep from './steps/AdminStep';
import ConfirmStep from './steps/ConfirmStep';
import CongregationStep from './steps/CongregationStep';
import FeaturesStep from './steps/FeaturesStep';
import LocationsStep from './steps/LocationsStep';

const Setup = () => {
  const { markSetupComplete } = useAppContext();
  const { showNotification } = useNotificationContext();
  const { t } = useTranslation();
  const { setupData: data, activeStep, setActiveStep, loading: loadingSetup, setLoading: setLoadingSetup, loadingFeatures } = useSetup();
  const setupSubmittedRef = useRef(false);

  const loading = useMemo(() => loadingSetup || loadingFeatures, [loadingFeatures, loadingSetup]);

  const goNext = useCallback(() => setActiveStep((step) => step + 1), [setActiveStep]);
  const goBack = useCallback(() => setActiveStep((step) => step - 1), [setActiveStep]);

  const handleFinish = useCallback(async () => {
    if (setupSubmittedRef.current) return;
    setupSubmittedRef.current = true;

    try {
      setLoadingSetup(true);

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

      const rawResult = await httpRequest<SetupSubmitResponse>({
        service: SetupService.setup,
        data: payload,
      });

      if (
        !rawResult ||
        typeof rawResult !== 'object' ||
        !('isSetup' in rawResult) ||
        !('congregation' in rawResult) ||
        !(rawResult as SetupSubmitResponse).isSetup
      )
        throw new Error(t('setup.error.saveFailed'));

      const result = rawResult as SetupSubmitResponse;

      markSetupComplete(result.congregation);
      showNotification(t('setup.success.saved'), { severity: 'success' });
    } catch (err) {
      setupSubmittedRef.current = false;
      const error =
        err instanceof HttpRequestError ? err.message || t('setup.error.saveFailed') : err instanceof Error ? err.message : String(err);
      showNotification(error, { severity: 'error' });
      console.error(t('setup.log.setupError'), error);
    } finally {
      setLoadingSetup(false);
    }
  }, [data, markSetupComplete, setLoadingSetup, showNotification, t]);

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
        backgroundColor: ({ palette }) => palette.background.paper,
      }}
    >
      <Progress activeStep={activeStep} />

      {activeStep === 0 && <CongregationStep goNext={goNext} loading={loading} />}

      {activeStep === 1 && <FeaturesStep goNext={goNext} goBack={goBack} loading={loading} />}

      {activeStep === 2 && <LocationsStep goNext={goNext} goBack={goBack} loading={loading} />}

      {activeStep === 3 && <AdminStep goNext={goNext} goBack={goBack} loading={loading} />}

      {activeStep === 4 && <ConfirmStep data={data} onFinish={handleFinish} disabled={loading} onBack={goBack} />}
    </Box>
  );
};

export default Setup;
