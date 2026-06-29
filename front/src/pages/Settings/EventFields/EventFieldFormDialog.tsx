import { CreateEditDialog } from '@components/common/forms/CreateEditDialog';
import { FieldConditionsEditor } from '@components/common/forms/FieldConditionsEditor';
import { OptionsListEditor } from '@components/common/forms/OptionsListEditor';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import {
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
} from '@mui/material';
import {
  CREATE_PERSON_FIELD_FROM_EVENT_FIELD,
  STANDARD_EVENT_FIELDS,
  STANDARD_PERSON_FIELDS,
} from '@utils/customFields';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EventFieldType } from '@/types/event.types';
import type { FieldCondition } from '@/types/person.types';
import type { EventFieldFormDialogProps } from './eventFields.types';

const TYPES: EventFieldType[] = ['text', 'paragraph', 'number', 'yes_no', 'options', 'date'];

export const EventFieldFormDialog = ({
  open,
  mode,
  field,
  eventFields,
  personFields,
  submitting,
  onClose,
  onSubmit,
}: EventFieldFormDialogProps) => {
  const { t } = useTranslation();
  const [label, setLabel] = useState('');
  const [type, setType] = useState<EventFieldType>('text');
  const [required, setRequired] = useState(false);
  const [linkPersonField, setLinkPersonField] = useState(false);
  const [personFieldId, setPersonFieldId] = useState('');
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [calculatedConditions, setCalculatedConditions] = useState<FieldCondition[]>([]);
  const resetState = useCallback(() => {
    setLabel(field?.label ?? '');
    setType(field?.type ?? 'text');
    setRequired(field?.required ?? false);
    setLinkPersonField(field?.link_person_field ?? Boolean(field?.person_field_id));
    setPersonFieldId(field?.person_field_id ?? '');
    setAllowMultiple(field?.allow_multiple ?? false);
    setOptions(field?.options ?? []);
    setCalculatedConditions(field?.calculated_conditions ?? []);
  }, [field]);
  const personFieldOptions = useMemo(
    () => [
      ...STANDARD_PERSON_FIELDS.map((standardField) => ({
        id: standardField.id,
        label: t(standardField.labelKey),
        type: standardField.type,
        options: standardField.options,
        allow_multiple: standardField.allow_multiple ?? false,
      })),
      ...personFields,
    ],
    [personFields, t],
  );
  const linkedPersonField = personFieldOptions.find(({ id }) => id === personFieldId);
  const conditionFields = useMemo(
    () => [
      ...STANDARD_EVENT_FIELDS.map((standardField) => ({
        id: standardField.id,
        label: t(standardField.labelKey),
        type: standardField.type,
        options: standardField.options,
      })),
      ...eventFields
        .filter((eventField) => eventField.id !== field?.id)
        .map((eventField) => ({
          id: eventField.id,
          label: eventField.label,
          type: eventField.type,
          options: eventField.options,
        })),
      ...STANDARD_PERSON_FIELDS.map((standardField) => ({
        id: standardField.id,
        label: t(standardField.labelKey),
        type: standardField.type,
        options: standardField.options,
      })),
      ...personFields.map((personField) => ({
        id: personField.id,
        label: personField.label,
        type: personField.type,
        options: personField.options,
      })),
    ],
    [eventFields, field?.id, personFields, t],
  );
  const effectiveType = linkPersonField && linkedPersonField ? (linkedPersonField.type as EventFieldType) : type;
  const effectiveOptions = linkPersonField && linkedPersonField ? linkedPersonField.options : options;
  const effectiveAllowMultiple =
    linkPersonField && linkedPersonField ? linkedPersonField.allow_multiple : allowMultiple;
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
          type: effectiveType,
          required: effectiveType === 'yes_no' && calculatedConditions.length > 0 ? false : required,
          user_fillable: false,
          link_person_field: linkPersonField,
          person_field_id: linkPersonField ? personFieldId || undefined : undefined,
          allow_multiple: effectiveType === 'options' ? effectiveAllowMultiple : false,
          options: effectiveType === 'options' ? effectiveOptions.map((value) => value.trim()).filter(Boolean) : [],
          calculated_conditions: effectiveType === 'yes_no' ? calculatedConditions : [],
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
        value={linkPersonField && linkedPersonField ? linkedPersonField.type : type}
        disabled={linkPersonField && Boolean(linkedPersonField)}
        onChange={(event) => setType(event.target.value as EventFieldType)}
      >
        {TYPES.map((value) => (
          <MenuItem key={value} value={value}>
            {t(`pages.events.fields.types.${value}`)}
          </MenuItem>
        ))}
      </TextField>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <FormControlLabel
          control={<Switch checked={linkPersonField} onChange={(_event, checked) => setLinkPersonField(checked)} />}
          label={t('pages.events.fields.linkPersonField')}
        />
        <Tooltip title={t('pages.events.fields.linkPersonFieldHelp')}>
          <IconButton size="small" aria-label={t('pages.events.fields.linkPersonFieldHelp')}>
            <HelpOutlineRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      {linkPersonField ? (
        <FormControl fullWidth>
          <InputLabel>{t('pages.events.fields.personField')}</InputLabel>
          <Select
            label={t('pages.events.fields.personField')}
            value={personFieldId}
            onChange={(event) => {
              const value = event.target.value;
              const selected = personFieldOptions.find(({ id }) => id === value);
              setPersonFieldId(value);
              if (!selected) return;
              setType(selected.type as EventFieldType);
              setAllowMultiple(selected.allow_multiple ?? false);
              setOptions(selected.options ?? []);
            }}
          >
            <MenuItem value="">{t('pages.events.fields.doNotSave')}</MenuItem>
            {personFieldOptions.map((personField) => (
              <MenuItem key={personField.id} value={personField.id}>
                {personField.label}
              </MenuItem>
            ))}
            <MenuItem value={CREATE_PERSON_FIELD_FROM_EVENT_FIELD}>
              {t('pages.events.fields.createPersonFieldFromThis')}
            </MenuItem>
          </Select>
        </FormControl>
      ) : null}
      {effectiveType === 'options' ? (
        <>
          <FormControlLabel
            control={
              <Switch
                checked={effectiveAllowMultiple}
                disabled={linkPersonField && Boolean(linkedPersonField)}
                onChange={(_event, checked) => setAllowMultiple(checked)}
              />
            }
            label={t('pages.persons.fieldsCrud.allowMultiple')}
          />
          <OptionsListEditor
            label={t('pages.events.fields.options')}
            addLabel={t('pages.persons.fieldsCrud.addOption')}
            removeLabel={t('form.common.delete')}
            values={effectiveOptions}
            onChange={setOptions}
          />
        </>
      ) : null}
      {effectiveType === 'yes_no' ? (
        <FieldConditionsEditor
          fields={conditionFields}
          value={calculatedConditions}
          fieldLabel={t('pages.persons.fieldsCrud.conditionField')}
          operatorLabel={t('pages.persons.fieldsCrud.conditionOperator')}
          valueLabel={t('pages.persons.fieldsCrud.conditionValue')}
          addLabel={t('pages.persons.fieldsCrud.addCondition')}
          removeLabel={t('form.common.delete')}
          trueLabel={t('form.common.yes')}
          falseLabel={t('form.common.no')}
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
            disabled={effectiveType === 'yes_no' && calculatedConditions.length > 0}
            onChange={(_event, checked) => setRequired(checked)}
          />
        }
        label={t('pages.events.fields.required')}
      />
    </CreateEditDialog>
  );
};
