import { UserAutocomplete } from '@components/common/UserAutocomplete';
import { ConfirmDialog } from '@components/common/forms/ConfirmDialog';
import { CreateEditDialog } from '@components/common/forms/CreateEditDialog';
import { LocalizedDateField } from '@components/common/forms/LocalizedDateField';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { Button, IconButton, InputAdornment, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { calculateAgeFromBirthdate, calculateDisplayedRegisteredAge } from '@utils/datetime';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PersonCustomFields } from './PersonCustomFields';
import { PersonFieldFormDialog } from './PersonFieldFormDialog';
import type { PersonFormDialogProps } from './persons.types';

export const PersonFormDialog = ({
  open,
  person,
  fields,
  canCreateFields,
  submitting,
  onClose,
  onSubmit,
  onCreateField,
}: PersonFormDialogProps) => {
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
    user_id: person?.user_id ?? '',
    regenerate_code: false,
    custom_values: person?.custom_values ?? {},
  }));
  const [selectedUser, setSelectedUser] = useState(person?.user ?? null);
  const [fieldOpen, setFieldOpen] = useState(false);
  const [codePromptOpen, setCodePromptOpen] = useState(false);
  const update = (key: string, value: string | number | undefined) =>
    setValues((current) => ({ ...current, [key]: value }));
  const lastNameChanged =
    Boolean(person) &&
    (values.last_name.trim() !== (person?.last_name ?? '') ||
      values.second_last_name.trim() !== (person?.second_last_name ?? ''));
  const calculatedAge = values.birthdate
    ? calculateAgeFromBirthdate(values.birthdate)
    : calculateDisplayedRegisteredAge(values.age, person?.age_recorded_at);
  const standardValues = {
    first_name: values.first_name,
    middle_name: values.middle_name,
    last_name: values.last_name,
    second_last_name: values.second_last_name,
    married_name: values.married_name,
    phone: values.phone,
    birthdate: values.birthdate,
    age: calculatedAge,
    email: values.email,
  };
  const requiredCustomFieldsAreComplete = fields.every((field) => {
    if (!field.required) return true;
    const value = values.custom_values[field.id];
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && String(value).trim() !== '';
  });
  const canSave = Boolean(values.first_name.trim() && values.last_name.trim() && requiredCustomFieldsAreComplete);
  const submit = (regenerateCode = values.regenerate_code) => {
    const payload = {
      ...values,
      email: values.email.trim() || undefined,
      user_id: values.user_id || undefined,
      regenerate_code: regenerateCode,
    };
    onSubmit(payload);
  };
  const handleSubmit = () => {
    if (lastNameChanged && !values.regenerate_code) {
      setCodePromptOpen(true);
      return;
    }
    submit();
  };

  return (
    <>
      <CreateEditDialog
        open={open}
        mode={person ? 'edit' : 'create'}
        submitting={submitting}
        onClose={onClose}
        onSubmit={handleSubmit}
        submitDisabled={!canSave}
        extraActions={
          canCreateFields ? (
            <Button startIcon={<AddRoundedIcon />} onClick={() => setFieldOpen(true)} disabled={submitting}>
              {t('pages.persons.fieldsCrud.create')}
            </Button>
          ) : undefined
        }
        labels={{
          createTitle: t('pages.persons.create'),
          editTitle: t('pages.persons.edit'),
          createSubmit: t('pages.persons.save'),
          editSubmit: t('pages.persons.save'),
          cancel: t('form.field.cancel'),
        }}
      >
        {person ? (
          <TextField
            fullWidth
            disabled
            label={t('pages.persons.fields.code')}
            value={values.regenerate_code ? t('pages.persons.code.pendingRegeneration') : person.code}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title={t('pages.persons.code.regenerate')}>
                    <IconButton
                      edge="end"
                      aria-label={t('pages.persons.code.regenerate')}
                      onClick={() => setValues((current) => ({ ...current, regenerate_code: true }))}
                    >
                      <RefreshRoundedIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        ) : null}
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
          <LocalizedDateField
            fullWidth
            label={t('pages.persons.fields.birthdate')}
            value={values.birthdate}
            onChange={(nextValue) => update('birthdate', nextValue)}
          />
          <TextField
            fullWidth
            type="number"
            label={t('pages.persons.fields.age')}
            value={calculatedAge ?? ''}
            disabled={Boolean(values.birthdate)}
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
        <UserAutocomplete
          value={selectedUser}
          disabled={submitting}
          label={t('pages.persons.fields.user')}
          onChange={(nextUser) => {
            setSelectedUser(nextUser);
            setValues((current) => ({ ...current, user_id: nextUser?.id ?? '' }));
          }}
        />
        {values.birthdate ? (
          <Typography variant="caption" color="text.secondary">
            {t('pages.persons.fields.ageCalculated')}
          </Typography>
        ) : null}
        <PersonCustomFields
          fields={fields}
          standardValues={standardValues}
          values={values.custom_values}
          onChange={(custom_values) => setValues((current) => ({ ...current, custom_values }))}
        />
      </CreateEditDialog>

      <PersonFieldFormDialog
        open={fieldOpen}
        field={null}
        submitting={submitting}
        onClose={() => setFieldOpen(false)}
        onSubmit={(fieldValues) => {
          void onCreateField(fieldValues).then((created) => {
            if (created) setFieldOpen(false);
          });
        }}
      />

      <ConfirmDialog
        open={codePromptOpen}
        title={t('pages.persons.code.regenerateTitle')}
        message={t('pages.persons.code.regenerateMessage')}
        confirmLabel={t('pages.persons.code.regenerateConfirm')}
        cancelLabel={t('pages.persons.code.keepCurrent')}
        confirming={submitting}
        onClose={() => {
          setCodePromptOpen(false);
          submit(false);
        }}
        onConfirm={() => {
          setCodePromptOpen(false);
          submit(true);
        }}
      />
    </>
  );
};
