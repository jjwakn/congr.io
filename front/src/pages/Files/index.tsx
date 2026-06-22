import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { Alert, Box, Chip, Paper, Tab, Tabs, Typography } from '@mui/material';
import { FilesService } from '@services/files';
import { httpRequest } from '@utils/http';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProviderStatus } from './files.types';

export const FilesSetupPage = () => {
  const { t } = useTranslation();
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [active, setActive] = useState('local');

  useEffect(() => {
    void httpRequest<{ selected: string; providers: ProviderStatus[] }>({ service: FilesService.status })
      .then((response) => {
        setProviders(response.providers);
        setActive(response.selected);
      })
      .catch(() =>
        setProviders(
          ['local', 'url', 'aws', 'gcp', 'onedrive', 'google_drive'].map((id) => ({
            id,
            selected: id === 'local',
            configured: false,
            available: id === 'local' || id === 'url',
            missing: [],
          })),
        ),
      );
  }, []);

  const current = providers.find(({ id }) => id === active);
  return (
    <Box sx={{ width: '100%', maxWidth: 1000, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Typography variant="h3" sx={{ mb: 1 }}>
        {t('pages.files.title')}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t('pages.files.description')}
      </Typography>
      <Paper variant="outlined">
        <Tabs
          value={active}
          onChange={(_event, value: string) => setActive(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {providers.map((provider) => (
            <Tab
              key={provider.id}
              value={provider.id}
              label={t(`pages.files.providers.${provider.id}.title`)}
              icon={
                provider.configured ? (
                  <CheckCircleOutlineRoundedIcon color="success" />
                ) : (
                  <ErrorOutlineRoundedIcon color="disabled" />
                )
              }
              iconPosition="start"
            />
          ))}
        </Tabs>
        <Box sx={{ p: 3 }}>
          {current?.selected ? <Chip color="primary" label={t('pages.files.selected')} sx={{ mb: 2 }} /> : null}
          <Alert severity={current?.configured ? 'success' : 'info'} sx={{ mb: 2 }}>
            {t(
              current?.configured
                ? 'pages.files.configured'
                : current?.available
                  ? 'pages.files.notConfigured'
                  : 'pages.files.adapterUnavailable',
            )}
          </Alert>
          <Typography sx={{ whiteSpace: 'pre-line' }}>{t(`pages.files.providers.${active}.instructions`)}</Typography>
          {current?.missing.length ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {t('pages.files.missing', { variables: current.missing.join(', ') })}
            </Typography>
          ) : null}
        </Box>
      </Paper>
    </Box>
  );
};

export default FilesSetupPage;
