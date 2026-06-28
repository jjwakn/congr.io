import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { EventRegistrationFields } from '@pages/Modules/Registration/EventRegistrationFields';
import { EventParticipantsService } from '@services/eventParticipants';
import { httpRequest } from '@utils/http';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { JsonObject } from '@/types/json.types';
import type { PublicEventRegistrationFormProps } from './public-events.types';

export const PublicEventRegistrationForm = ({ event }: PublicEventRegistrationFormProps) => {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [values, setValues] = useState<JsonObject>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const requiredMissing = event.custom_fields
    .filter((field) => field.user_fillable && field.required)
    .some((field) => values[field.id] === undefined || values[field.id] === '');

  return submitted ? (
    <Alert severity="success">{t('pages.publicEvents.registration.success')}</Alert>
  ) : (
    <Stack spacing={1.5} sx={{ mt: 1 }}>
      <Typography variant="h6">{t('pages.publicEvents.registration.title')}</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField
          required
          fullWidth
          label={t('pages.persons.fields.firstName')}
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
        />
        <TextField
          required
          fullWidth
          label={t('pages.persons.fields.lastName')}
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
        />
      </Stack>
      <EventRegistrationFields fields={event.custom_fields} values={values} publicOnly onChange={setValues} />
      <Button
        variant="contained"
        disabled={submitting || !firstName.trim() || !lastName.trim() || requiredMissing}
        onClick={() =>
          void (async () => {
            if (!event.public_id) return;
            setSubmitting(true);
            try {
              await httpRequest({
                service: EventParticipantsService.publicRegister,
                data: {
                  id: event.public_id,
                  submitted_person: { first_name: firstName.trim(), last_name: lastName.trim() },
                  field_values: values,
                },
              });
              setSubmitted(true);
            } finally {
              setSubmitting(false);
            }
          })()
        }
      >
        {t('pages.publicEvents.registration.submit')}
      </Button>
    </Stack>
  );
};
