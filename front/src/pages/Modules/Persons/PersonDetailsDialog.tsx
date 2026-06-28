import { ViewDialog } from '@components/common/forms/ViewDialog';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import { Box, Chip, Stack, Tab, Tabs, Typography } from '@mui/material';
import { PersonsService } from '@services/persons';
import { calculateAgeFromBirthdate, calculateDisplayedRegisteredAge, formatDateForInput } from '@utils/datetime';
import { httpRequest } from '@utils/http';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { JsonValue } from '@/types/json.types';
import type { PersonFlowProgress } from '@/types/person.types';
import type { PersonDetailsDialogProps } from './persons.types';

const formatCustomValue = (value: JsonValue | undefined) => {
  if (Array.isArray(value)) return value.join(', ');
  return String(value ?? '-');
};

export const PersonDetailsDialog = ({ person, fields, onClose }: PersonDetailsDialogProps) => {
  const { i18n, t } = useTranslation();
  const [tab, setTab] = useState<'details' | 'flows' | 'codes'>('details');
  const [flows, setFlows] = useState<PersonFlowProgress[]>([]);
  const displayedAge = person.birthdate
    ? calculateAgeFromBirthdate(person.birthdate)
    : calculateDisplayedRegisteredAge(person.registered_age, person.age_recorded_at);

  useEffect(() => {
    void httpRequest<PersonFlowProgress[]>({ service: PersonsService.flows, data: { id: person.id } }).then(setFlows);
  }, [person.id]);

  return (
    <ViewDialog
      open
      title={`${person.first_name} ${person.last_name}`}
      closeLabel={t('form.field.close')}
      onClose={onClose}
      maxWidth="lg"
    >
      <Tabs value={tab} onChange={(_event, value) => setTab(value)}>
        <Tab value="details" label={t('pages.persons.tabs.details')} />
        <Tab value="flows" label={t('pages.persons.tabs.flows')} />
        <Tab value="codes" label={t('pages.persons.tabs.codes')} />
      </Tabs>
      {tab === 'details' ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, pt: 2 }}>
          <Typography>
            <strong>{t('pages.persons.fields.code')}:</strong> {person.code}
          </Typography>
          <Typography>
            <strong>{t('pages.persons.fields.phone')}:</strong> {person.phone || '-'}
          </Typography>
          <Typography>
            <strong>{t('pages.persons.fields.email')}:</strong> {person.email || '-'}
          </Typography>
          <Typography>
            <strong>{t('pages.persons.fields.birthdate')}:</strong>{' '}
            {formatDateForInput(person.birthdate, i18n.language) || '-'}
          </Typography>
          <Typography>
            <strong>{t('pages.persons.fields.age')}:</strong> {displayedAge ?? '-'}
          </Typography>
          {fields.map((field) => (
            <Typography key={field.id}>
              <strong>{field.label}:</strong> {formatCustomValue(person.custom_values[field.id])}
            </Typography>
          ))}
        </Box>
      ) : tab === 'flows' ? (
        <Stack spacing={2} sx={{ pt: 2 }}>
          {flows.map((flow) => (
            <Box key={flow.id}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {flow.name}
              </Typography>
              <Stack spacing={1}>
                {flow.steps.map((step) => (
                  <Stack
                    key={step.step_id}
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ borderBottom: 1, borderColor: 'divider', py: 1 }}
                  >
                    {step.completed_at ? (
                      <CheckCircleOutlineRoundedIcon color="success" />
                    ) : (
                      <RadioButtonUncheckedRoundedIcon color="disabled" />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography>{step.step_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {step.step_description}
                      </Typography>
                    </Box>
                    {step.completed_at ? (
                      <Chip
                        size="small"
                        label={DateTime.fromISO(step.completed_at)
                          .setLocale(i18n.language)
                          .toLocaleString(DateTime.DATE_MED)}
                        title={DateTime.fromISO(step.completed_at)
                          .setLocale(i18n.language)
                          .toLocaleString(DateTime.DATETIME_MED)}
                      />
                    ) : null}
                  </Stack>
                ))}
              </Stack>
            </Box>
          ))}
          {!flows.length ? <Typography color="text.secondary">{t('pages.persons.flowsEmpty')}</Typography> : null}
        </Stack>
      ) : (
        <Stack spacing={1} sx={{ pt: 2 }}>
          {(person.code_history?.length ? person.code_history : [{ code: person.code, generated_at: '' }]).map(
            (entry) => (
              <Stack
                key={`${entry.code}-${entry.generated_at}`}
                direction="row"
                justifyContent="space-between"
                sx={{ borderBottom: 1, borderColor: 'divider', py: 1 }}
              >
                <Typography>{entry.code}</Typography>
                <Typography color="text.secondary">
                  {entry.generated_at
                    ? DateTime.fromISO(entry.generated_at)
                        .setLocale(i18n.language)
                        .toLocaleString(DateTime.DATETIME_MED)
                    : '-'}
                </Typography>
              </Stack>
            ),
          )}
        </Stack>
      )}
    </ViewDialog>
  );
};
