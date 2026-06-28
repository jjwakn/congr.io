import { CreateEditDialog } from '@components/common/forms/CreateEditDialog';
import { FieldConditionsEditor } from '@components/common/forms/FieldConditionsEditor';
import { OptionsListEditor } from '@components/common/forms/OptionsListEditor';
import { FormControlLabel, MenuItem, Switch, TextField } from '@mui/material';
import { STANDARD_PERSON_FIELDS } from '@utils/customFields';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FieldCondition, PersonFieldType } from '@/types/person.types';
import type { PersonFieldFormDialogProps } from './personFields.types';

const TYPES: PersonFieldType[] = ['text', 'paragraph', 'number', 'yes_no', 'options', 'date'];

export const PersonFieldSettingsFormDialog = ({
  open,
  mode,
  field,
  submitting,
  onClose,
  onSubmit,
}: PersonFieldFormDialogProps) => {
  const { t } = useTranslation();
  const [label, setLabel] = useState('');
  const [type, setType] = useState<PersonFieldType>('text');
  const [required, setRequired] = useState(false);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [calculatedConditions, setCalculatedConditions] = useState<FieldCondition[]>([]);

  const resetState = useCallback(() => {
    setLabel(field?.label ?? '');
    setType(field?.type ?? 'text');
    setRequired(field?.required ?? false);
    setAllowMultiple(field?.allow_multiple ?? false);
    setOptions(field?.options ?? []);
    setCalculatedConditions(field?.calculated_conditions ?? []);
  }, [field]);

  const labels = useMemo(
    () => ({
      createTitle: t('pages.persons.fieldsCrud.create'),
      editTitle: t('pages.persons.fieldsCrud.edit'),
      createSubmit: t('pages.persons.save'),
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
          required: calculatedConditions.length ? false : required,
          allow_multiple: type === 'options' ? allowMultiple : false,
          options: type === 'options' ? options.map((value) => value.trim()).filter(Boolean) : [],
          calculated_conditions: type === 'yes_no' ? calculatedConditions : [],
        })
      }
      onEnter={resetState}
      labels={labels}
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
        {TYPES.map((value) => (
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
      {type === 'yes_no' ? (
        <FieldConditionsEditor
          fields={STANDARD_PERSON_FIELDS.map((fieldDefinition) => ({
            id: fieldDefinition.id,
            label: t(fieldDefinition.labelKey),
            type: fieldDefinition.type,
            options: fieldDefinition.options,
          }))}
          value={calculatedConditions}
          fieldLabel={t('pages.persons.fieldsCrud.conditionField')}
          operatorLabel={t('pages.persons.fieldsCrud.conditionOperator')}
          valueLabel={t('pages.persons.fieldsCrud.conditionValue')}
          addLabel={t('pages.persons.fieldsCrud.addCondition')}
          removeLabel={t('form.common.delete')}
          operatorLabels={{
            not_empty: t('pages.persons.fieldsCrud.operators.notEmpty'),
            empty: t('pages.persons.fieldsCrud.operators.empty'),
            equals: t('pages.persons.fieldsCrud.operators.equals'),
            not_equals: t('pages.persons.fieldsCrud.operators.notEquals'),
            greater_than: t('pages.persons.fieldsCrud.operators.greaterThan'),
            less_than: t('pages.persons.fieldsCrud.operators.lessThan'),
            age_greater_than: t('pages.persons.fieldsCrud.operators.ageGreaterThan'),
            age_less_than: t('pages.persons.fieldsCrud.operators.ageLessThan'),
          }}
          onChange={setCalculatedConditions}
        />
      ) : null}
      <FormControlLabel
        control={
          <Switch
            checked={required}
            disabled={Boolean(calculatedConditions.length)}
            onChange={(e) => setRequired(e.target.checked)}
          />
        }
        label={t('pages.persons.fieldsCrud.required')}
      />
    </CreateEditDialog>
  );
};
