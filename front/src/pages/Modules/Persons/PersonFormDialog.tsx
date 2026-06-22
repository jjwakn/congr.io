import { CreateEditDialog } from '@components/common/forms/CreateEditDialog';
import { Stack, TextField } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PersonCustomFields } from './PersonCustomFields';
import type { PersonFormDialogProps } from './persons.types';

export const PersonFormDialog = ({ open, person, fields, submitting, onClose, onSubmit }: PersonFormDialogProps) => {
  const { t } = useTranslation();
  const [values, setValues] = useState(() => ({
    first_name: person?.first_name ?? '',
    middle_name: person?.middle_name ?? '',
    last_name: person?.last_name ?? '',
    second_last_name: person?.second_last_name ?? '',
    married_name: person?.married_name ?? '',
    phone: person?.phone ?? '',
    birthdate: person?.birthdate ?? '',
    age: person?.registered_age ?? undefined,
    email: person?.email ?? '',
    custom_values: person?.custom_values ?? {},
  }));
  const update = (key: string, value: string | number | undefined) =>
    setValues((current) => ({ ...current, [key]: value }));
  return (
    <CreateEditDialog
      open={open}
      mode={person ? 'edit' : 'create'}
      submitting={submitting}
      onClose={onClose}
      onSubmit={() => onSubmit(values)}
      labels={{
        createTitle: t('pages.persons.create'),
        editTitle: t('pages.persons.edit'),
        createSubmit: t('pages.persons.save'),
        editSubmit: t('pages.persons.save'),
        cancel: t('form.field.cancel'),
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField
          required
          fullWidth
          label={t('pages.persons.fields.firstName')}
          value={values.first_name}
          onChange={(e) => update('first_name', e.target.value)}
        />
        <TextField
          fullWidth
          label={t('pages.persons.fields.middleName')}
          value={values.middle_name}
          onChange={(e) => update('middle_name', e.target.value)}
        />
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField
          required
          fullWidth
          label={t('pages.persons.fields.lastName')}
          value={values.last_name}
          onChange={(e) => update('last_name', e.target.value)}
        />
        <TextField
          fullWidth
          label={t('pages.persons.fields.secondLastName')}
          value={values.second_last_name}
          onChange={(e) => update('second_last_name', e.target.value)}
        />
      </Stack>
      <TextField
        fullWidth
        label={t('pages.persons.fields.marriedName')}
        value={values.married_name}
        onChange={(e) => update('married_name', e.target.value)}
      />
      <TextField
        fullWidth
        multiline
        label={t('pages.persons.fields.phone')}
        value={values.phone}
        onChange={(e) => update('phone', e.target.value)}
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField
          fullWidth
          type="date"
          InputLabelProps={{ shrink: true }}
          label={t('pages.persons.fields.birthdate')}
          value={values.birthdate}
          onChange={(e) => update('birthdate', e.target.value)}
        />
        <TextField
          fullWidth
          type="number"
          label={t('pages.persons.fields.age')}
          value={values.age ?? ''}
          onChange={(e) => update('age', e.target.value ? Number(e.target.value) : undefined)}
        />
      </Stack>
      <TextField
        fullWidth
        type="email"
        label={t('pages.persons.fields.email')}
        value={values.email}
        onChange={(e) => update('email', e.target.value)}
      />
      <PersonCustomFields
        fields={fields}
        values={values.custom_values}
        onChange={(custom_values) => setValues((current) => ({ ...current, custom_values }))}
      />
    </CreateEditDialog>
  );
};
