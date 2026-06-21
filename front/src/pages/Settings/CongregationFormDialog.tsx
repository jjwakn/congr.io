import { CreateEditDialog } from '@components/common/forms/CreateEditDialog';
import { Autocomplete, TextField, createFilterOptions } from '@mui/material';
import { getSupportedTimeZones } from '@utils/datetime';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CongregationFormDialogProps, CongregationSettingsDraft } from './settings.types';

const EMPTY_DRAFT: CongregationSettingsDraft = { name: '', type: '', timezone: 'UTC' };

export const CongregationFormDialog = ({ open, submitting, onClose, onSubmit }: CongregationFormDialogProps) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<CongregationSettingsDraft>(EMPTY_DRAFT);
  const [nameError, setNameError] = useState('');
  const [typeError, setTypeError] = useState('');
  const supportedTimeZones = useMemo(() => getSupportedTimeZones(), []);
  const filterTimeZones = useMemo(() => createFilterOptions<string>(), []);

  const resetState = useCallback(() => {
    setDraft(EMPTY_DRAFT);
    setNameError('');
    setTypeError('');
  }, []);

  const handleSubmit = () => {
    const normalized = {
      name: draft.name.trim(),
      type: draft.type.trim(),
      timezone: draft.timezone.trim() || 'UTC',
    };

    setNameError(normalized.name ? '' : `${t('form.field.name')} ${t('form.error.isRequired')}`);
    setTypeError(normalized.type ? '' : `${t('form.field.type')} ${t('form.error.isRequired')}`);
    if (!normalized.name || !normalized.type) return;

    onSubmit(normalized);
  };

  return (
    <CreateEditDialog
      open={open}
      mode="create"
      submitting={submitting}
      onClose={onClose}
      onSubmit={handleSubmit}
      onEnter={resetState}
      labels={{
        createTitle: t('pages.settings.congregation.createTitle'),
        editTitle: t('pages.settings.congregation.createTitle'),
        createSubmit: t('pages.settings.congregation.createAction'),
        editSubmit: t('pages.settings.congregation.createAction'),
        cancel: t('form.field.cancel'),
      }}
    >
      <TextField
        autoFocus
        fullWidth
        label={t('form.field.name')}
        value={draft.name}
        error={Boolean(nameError)}
        helperText={nameError}
        onChange={(event) => {
          setDraft((current) => ({ ...current, name: event.target.value }));
          if (nameError) setNameError('');
        }}
      />
      <TextField
        fullWidth
        label={t('form.field.type')}
        value={draft.type}
        error={Boolean(typeError)}
        helperText={typeError}
        onChange={(event) => {
          setDraft((current) => ({ ...current, type: event.target.value }));
          if (typeError) setTypeError('');
        }}
      />
      <Autocomplete
        disableClearable
        freeSolo
        options={supportedTimeZones}
        inputValue={draft.timezone}
        onInputChange={(_event, value) => setDraft((current) => ({ ...current, timezone: value }))}
        filterOptions={(options, params) => {
          const filtered = filterTimeZones(options, params);
          if (params.inputValue && !options.some((option) => option.toLowerCase() === params.inputValue.toLowerCase()))
            filtered.push(params.inputValue);
          return filtered;
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t('form.field.timezone')}
            helperText={t('pages.settings.congregation.timezoneHelp')}
          />
        )}
      />
    </CreateEditDialog>
  );
};
