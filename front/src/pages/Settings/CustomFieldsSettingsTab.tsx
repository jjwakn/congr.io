import { Box, Tab, Tabs } from '@mui/material';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CustomFieldsSettingsTabProps } from './CustomFieldsSettingsTab.types';
import { EventTypesManagement } from './EventTypes/EventTypesManagement';
import { PersonFieldsManagement } from './PersonFields/PersonFieldsManagement';

export const CustomFieldsSettingsTab = ({
  canViewEventTypes,
  canViewPersonFields,
  initialTab,
}: CustomFieldsSettingsTabProps) => {
  const { t } = useTranslation();
  const tabs = useMemo(
    () => [
      ...(canViewEventTypes ? [{ id: 'eventTypes' as const, label: t('pages.settings.tabs.eventTypes') }] : []),
      ...(canViewPersonFields ? [{ id: 'personFields' as const, label: t('pages.settings.tabs.personFields') }] : []),
    ],
    [canViewEventTypes, canViewPersonFields, t],
  );
  const [activeTab, setActiveTab] = useState(() =>
    initialTab && tabs.some(({ id }) => id === initialTab) ? initialTab : tabs[0]?.id,
  );
  const resolvedTab = tabs.some(({ id }) => id === activeTab) ? activeTab : tabs[0]?.id;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0 }}>
      <Tabs value={resolvedTab} onChange={(_event, value) => setActiveTab(value)} variant="scrollable">
        {tabs.map((tab) => (
          <Tab key={tab.id} value={tab.id} label={tab.label} />
        ))}
      </Tabs>
      {resolvedTab === 'eventTypes' ? <EventTypesManagement /> : null}
      {resolvedTab === 'personFields' ? <PersonFieldsManagement /> : null}
    </Box>
  );
};
