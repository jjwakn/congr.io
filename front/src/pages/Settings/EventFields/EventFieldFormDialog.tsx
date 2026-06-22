import { CreateEditDialog } from '@components/common/forms/CreateEditDialog';
import { FormControl, FormControlLabel, InputLabel, MenuItem, Select, Switch, TextField } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EventFieldType } from '@/types/event.types';
import type { EventFieldFormDialogProps } from './eventFields.types';

const TYPES: EventFieldType[] = ['text', 'paragraph', 'number', 'switch', 'single_option', 'multiple_options'];

export const EventFieldFormDialog = ({
  open,
  mode,
  field,
  personFields,
  submitting,
  onClose,
  onSubmit,
}: EventFieldFormDialogProps) => {
  const { t } = useTranslation();
  const [label, setLabel] = useState('');
  const [type, setType] = useState<EventFieldType>('text');
  const [required, setRequired] = useState(false);
  const [userFillable, setUserFillable] = useState(false);
  const [personFieldId, setPersonFieldId] = useState('');
  const [options, setOptions] = useState('');
  const resetState = useCallback(() => {
    setLabel(field?.label ?? '');
    setType(field?.type ?? 'text');
    setRequired(field?.required ?? false);
    setUserFillable(field?.user_fillable ?? false);
    setPersonFieldId(field?.person_field_id ?? '');
    setOptions(field?.options.join('\n') ?? '');
  }, [field]);
  const labels = useMemo(
    () => ({
      createTitle: t('pages.settings.eventFields.create'),
      editTitle: t('pages.settings.eventFields.edit'),
      createSubmit: t('form.field.add'),
      editSubmit: t('pages.persons.save'),
      cancel: t('form.field.cancel'),
    }),
    [t],
  );

  return (
    <CreateEditDialog
      open={open}
      mode={mode}
      submitting={submitting}
      onClose={onClose}
      onSubmit={() =>
        onSubmit({
          label: label.trim(),
          type,
          required,
          user_fillable: userFillable,
          person_field_id: personFieldId || undefined,
          options: options
            .split('\n')
            .map((value) => value.trim())
            .filter(Boolean),
        })
      }
      onEnter={resetState}
      labels={labels}
    >
      <TextField
        required
        label={t('pages.events.fields.label')}
        value={label}
        onChange={(event) => setLabel(event.target.value)}
      />
      <TextField
        select
        label={t('pages.events.fields.type')}
        value={type}
        onChange={(event) => setType(event.target.value as EventFieldType)}
      >
        {TYPES.map((value) => (
          <MenuItem key={value} value={value}>
            {t(`pages.events.fields.types.${value}`)}
          </MenuItem>
        ))}
      </TextField>
      {type === 'single_option' || type === 'multiple_options' ? (
        <TextField
          multiline
          minRows={3}
          label={t('pages.events.fields.options')}
          value={options}
          onChange={(event) => setOptions(event.target.value)}
        />
      ) : null}
      <FormControl fullWidth>
        <InputLabel>{t('pages.events.fields.personField')}</InputLabel>
        <Select
          label={t('pages.events.fields.personField')}
          value={personFieldId}
          onChange={(event) => setPersonFieldId(event.target.value)}
        >
          <MenuItem value="">{t('pages.events.fields.doNotSave')}</MenuItem>
          {personFields.map((personField) => (
            <MenuItem key={personField.id} value={personField.id}>
              {personField.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControlLabel
        control={<Switch checked={required} onChange={(_event, checked) => setRequired(checked)} />}
        label={t('pages.events.fields.required')}
      />
      <FormControlLabel
        control={<Switch checked={userFillable} onChange={(_event, checked) => setUserFillable(checked)} />}
        label={t('pages.events.fields.userFillable')}
      />
    </CreateEditDialog>
  );
};
