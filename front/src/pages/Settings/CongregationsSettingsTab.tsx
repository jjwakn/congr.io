import { ModuleSection } from '@components/common/modules/ModuleSection';
import { useAppContext } from '@hooks/useAppContext';
import { useAuth } from '@hooks/useAuth';
import { useNotificationContext } from '@hooks/useNotifications';
import { Alert, Stack, Typography } from '@mui/material';
import { CongregationsService } from '@services/congregations';
import { HttpRequestError, httpRequest } from '@utils/http';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Congregation } from '@/types/congregation.types';
import { CongregationFormDialog } from './CongregationFormDialog';
import { CongregationSettingsSection } from './CongregationSettingsSection';
import type { CongregationSettingsDraft } from './settings.types';

export const CongregationsSettingsTab = () => {
  const { t } = useTranslation();
  const { congregation } = useAppContext();
  const { user, hasPermission, refreshSession } = useAuth();
  const { showNotification } = useNotificationContext();
  const canCreate = hasPermission('congregation', 'create');
  const canUpdate = hasPermission('congregation', 'update');
  const congregations = user?.congregations ?? [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (values: CongregationSettingsDraft) => {
    setSubmitting(true);
    setError('');
    try {
      await httpRequest<Congregation>({
        service: CongregationsService.create,
        data: { ...values },
      });
      await refreshSession();
      setDialogOpen(false);
      showNotification(t('pages.settings.congregation.created'), { severity: 'success' });
    } catch (value) {
      const message =
        value instanceof HttpRequestError || value instanceof Error
          ? value.message
          : t('pages.settings.congregation.createFailed');
      setError(message);
      showNotification(message, { severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ModuleSection<Congregation>
        title={t('pages.settings.congregation.title')}
        createAction={
          canCreate
            ? {
                id: 'create-congregation',
                label: t('pages.settings.congregation.createAction'),
                onClick: () => setDialogOpen(true),
              }
            : undefined
        }
        refreshAction={{
          id: 'refresh-congregations',
          label: t('pages.modules.common.refresh'),
          onClick: () => void refreshSession(),
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {t('pages.settings.congregation.subtitle')}
        </Typography>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Stack spacing={2}>
          {congregations.map((item) => (
            <CongregationSettingsSection
              key={item.id}
              congregation={item}
              selected={item.id === congregation?.id}
              canUpdate={canUpdate}
              onUpdated={refreshSession}
            />
          ))}
        </Stack>
      </ModuleSection>

      <CongregationFormDialog
        open={dialogOpen}
        submitting={submitting}
        onClose={() => setDialogOpen(false)}
        onSubmit={(values) => void handleCreate(values)}
      />
    </>
  );
};
