import { CreateEditDialog } from '@components/common/forms/CreateEditDialog';
import { FormControlLabel, MenuItem, Switch, TextField } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PersonFieldType } from '@/types/person.types';
import type { PersonFieldFormDialogProps } from './persons.types';

export const PersonFieldFormDialog = ({ open, field, submitting, onClose, onSubmit }: PersonFieldFormDialogProps) => {
  const { t } = useTranslation();
  const [label, setLabel] = useState(field?.label ?? '');
  const [type, setType] = useState<PersonFieldType>(field?.type ?? 'text');
  const [required, setRequired] = useState(field?.required ?? false);
  const [options, setOptions] = useState(field?.options.join('\n') ?? '');
  return (
    <CreateEditDialog
      open={open}
      mode={field ? 'edit' : 'create'}
      submitting={submitting}
      onClose={onClose}
      onSubmit={() =>
        onSubmit({
          label: label.trim(),
          type,
          required,
          options: options
            .split('\n')
            .map((value) => value.trim())
            .filter(Boolean),
        })
      }
      labels={{
        createTitle: t('pages.persons.fieldsCrud.create'),
        editTitle: t('pages.persons.fieldsCrud.edit'),
        createSubmit: t('pages.persons.save'),
        editSubmit: t('pages.persons.save'),
        cancel: t('form.field.cancel'),
      }}
    >
      <TextField
        required
        label={t('pages.persons.fieldsCrud.label')}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <TextField
        select
        label={t('pages.persons.fieldsCrud.type')}
        value={type}
        onChange={(e) => setType(e.target.value as PersonFieldType)}
      >
        {['text', 'paragraph', 'number', 'switch', 'single_option', 'multiple_options', 'date'].map((value) => (
          <MenuItem key={value} value={value}>
            {t(`pages.persons.fieldTypes.${value}`)}
          </MenuItem>
        ))}
      </TextField>
      {type === 'single_option' || type === 'multiple_options' ? (
        <TextField
          multiline
          minRows={3}
          label={t('pages.persons.fieldsCrud.options')}
          value={options}
          onChange={(e) => setOptions(e.target.value)}
        />
      ) : null}
      <FormControlLabel
        control={<Switch checked={required} onChange={(e) => setRequired(e.target.checked)} />}
        label={t('pages.persons.fieldsCrud.required')}
      />
    </CreateEditDialog>
  );
};
