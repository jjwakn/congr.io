import { CreateEditDialog } from '@components/common/forms/CreateEditDialog';
import { OptionsListEditor } from '@components/common/forms/OptionsListEditor';
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
  const [allowMultiple, setAllowMultiple] = useState(field?.allow_multiple ?? false);
  const [options, setOptions] = useState(field?.options ?? []);
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
          allow_multiple: type === 'options' ? allowMultiple : false,
          options: type === 'options' ? options.map((value) => value.trim()).filter(Boolean) : [],
          calculated_conditions: [],
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
        {['text', 'paragraph', 'number', 'yes_no', 'options', 'date'].map((value) => (
          <MenuItem key={value} value={value}>
            {t(`pages.persons.fieldTypes.${value}`)}
          </MenuItem>
        ))}
      </TextField>
      {type === 'options' ? (
        <>
          <FormControlLabel
            control={<Switch checked={allowMultiple} onChange={(_event, checked) => setAllowMultiple(checked)} />}
            label={t('pages.persons.fieldsCrud.allowMultiple')}
          />
          <OptionsListEditor
            label={t('pages.persons.fieldsCrud.options')}
            addLabel={t('pages.persons.fieldsCrud.addOption')}
            removeLabel={t('form.common.delete')}
            values={options}
            onChange={setOptions}
          />
        </>
      ) : null}
      <FormControlLabel
        control={<Switch checked={required} onChange={(e) => setRequired(e.target.checked)} />}
        label={t('pages.persons.fieldsCrud.required')}
      />
    </CreateEditDialog>
  );
};
