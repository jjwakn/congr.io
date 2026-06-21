import { useAuth } from '@hooks/useAuth';
import { Box, Paper, Tab, Tabs, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguageWithResources } from '../../../i18n';
import { CongregationsSettingsTab } from './CongregationsSettingsTab';
import { EventTypesManagement } from './EventTypes/EventTypesManagement';
import { UISettingsTab } from './UISettingsTab';
import type { SettingsPageProps, SettingsTabId } from './settings.types';

const SettingsPage = ({ showHeader = true }: SettingsPageProps) => {
  const { i18n, t } = useTranslation();
  const { hasPermission } = useAuth();
  const canViewCongregations = hasPermission('congregation', 'get');
  const canViewEventTypes = hasPermission('event_type', 'get');
  const tabs = useMemo(
    () => [
      ...(canViewCongregations
        ? [{ id: 'congregations' as const, label: t('pages.settings.tabs.congregations') }]
        : []),
      { id: 'ui' as const, label: t('pages.settings.tabs.ui') },
      ...(canViewEventTypes ? [{ id: 'eventTypes' as const, label: t('pages.settings.tabs.eventTypes') }] : []),
    ],
    [canViewCongregations, canViewEventTypes, t],
  );
  const [activeTab, setActiveTab] = useState<SettingsTabId>(() => (canViewCongregations ? 'congregations' : 'ui'));

  const resolvedActiveTab = tabs.some(({ id }) => id === activeTab) ? activeTab : (tabs[0]?.id ?? 'ui');

  return (
    <Paper
      variant="outlined"
      sx={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {showHeader ? (
        <Box sx={{ px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 } }}>
          <Typography variant="h4" gutterBottom>
            {t('pages.settings.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('pages.settings.subtitle')}
          </Typography>
        </Box>
      ) : null}

      <Tabs
        value={resolvedActiveTab}
        onChange={(_event, value: SettingsTabId) => setActiveTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ px: { xs: 1, md: 2 }, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}
      >
        {tabs.map((tab) => (
          <Tab key={tab.id} value={tab.id} label={tab.label} />
        ))}
      </Tabs>

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: { xs: 2, md: 3 } }}>
        {resolvedActiveTab === 'congregations' && canViewCongregations ? <CongregationsSettingsTab /> : null}
        {resolvedActiveTab === 'ui' ? (
          <UISettingsTab
            language={i18n.language?.startsWith('es') ? 'es' : 'en'}
            onLanguageChange={(event) => {
              const nextLanguage = event.target.value;
              if (nextLanguage && !i18n.language?.startsWith(nextLanguage))
                void changeLanguageWithResources(nextLanguage);
            }}
          />
        ) : null}
        {resolvedActiveTab === 'eventTypes' && canViewEventTypes ? <EventTypesManagement /> : null}
      </Box>
    </Paper>
  );
};

export default SettingsPage;
