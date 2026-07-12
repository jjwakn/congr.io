import { FieldConditionsEditor } from '@components/common/forms/FieldConditionsEditor';
import type { FieldConditionOption } from '@components/common/forms/FieldConditionsEditor.types';
import { OptionsListEditor } from '@components/common/forms/OptionsListEditor';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import {
  Autocomplete,
  Box,
  Button,
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
  Typography,
} from '@mui/material';
import { CREATE_PERSON_FIELD_FROM_CAPTURED_FIELD, STANDARD_PERSON_FIELDS } from '@utils/customFields';
import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { EventCustomField, EventFieldType } from '@/types/event.types';
import type { FieldCondition } from '@/types/person.types';
import type { EventCustomFieldsEditorProps } from './events.types';

const TYPES: EventFieldType[] = ['text', 'paragraph', 'number', 'yes_no', 'options', 'date'];

const areOptionsEqual = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const areConditionsEqual = (left: FieldCondition[] = [], right: FieldCondition[] = []) =>
  left.length === right.length &&
  left.every(
    (condition, index) =>
      condition.field_id === right[index]?.field_id &&
      condition.operator === right[index]?.operator &&
      condition.value === right[index]?.value,
  );

interface PersonFieldOption extends FieldConditionOption {
  allow_multiple: boolean;
  calculated_conditions: FieldCondition[];
  options: string[];
  type: EventFieldType;
}

const createField = (canCreatePersonFields: boolean): EventCustomField => ({
  id: crypto.randomUUID(),
  label: '',
  type: 'text',
  required: false,
  options: [],
  allow_multiple: false,
  user_fillable: false,
  link_person_field: canCreatePersonFields,
  person_field_id: canCreatePersonFields ? CREATE_PERSON_FIELD_FROM_CAPTURED_FIELD : undefined,
});

export const EventCustomFieldsEditor = ({
  eventFields,
  typeFields,
  canUpdateEventType,
  canCreatePersonFields = false,
  canUpdatePersonFields = false,
  selfRegistration,
  personFields,
  mode = 'event',
  readOnly: readOnlyEditor = false,
  readOnlyTypeFields = false,
  canAddFields = true,
  onChange,
}: EventCustomFieldsEditorProps) => {
  const { t } = useTranslation();
  const personFieldOptions = useMemo<PersonFieldOption[]>(
    () => [
      ...STANDARD_PERSON_FIELDS.map((field) => ({
        id: field.id,
        label: t(field.labelKey),
        type: field.type as EventFieldType,
        options: field.options,
        allow_multiple: field.allow_multiple ?? false,
        calculated_conditions: [],
      })),
      ...personFields.map((personField) => ({
        id: personField.id,
        label: personField.label,
        type: personField.type,
        options: personField.options,
        allow_multiple: personField.allow_multiple,
        calculated_conditions: personField.calculated_conditions,
      })),
    ],
    [personFields, t],
  );
  const personFieldOptionById = useMemo(
    () => new Map(personFieldOptions.map((personField) => [personField.id, personField])),
    [personFieldOptions],
  );
  const conditionOperatorLabels = useMemo(
    () => ({
      equals: t('pages.persons.fieldsCrud.operators.equals'),
      not_equals: t('pages.persons.fieldsCrud.operators.notEquals'),
      contains: t('pages.persons.fieldsCrud.operators.contains'),
      starts_with: t('pages.persons.fieldsCrud.operators.startsWith'),
      ends_with: t('pages.persons.fieldsCrud.operators.endsWith'),
      greater_than: t('pages.persons.fieldsCrud.operators.greaterThan'),
      greater_or_equal: t('pages.persons.fieldsCrud.operators.greaterOrEqual'),
      less_than: t('pages.persons.fieldsCrud.operators.lessThan'),
      less_or_equal: t('pages.persons.fieldsCrud.operators.lessOrEqual'),
      is_empty: t('pages.persons.fieldsCrud.operators.empty'),
      is_not_empty: t('pages.persons.fieldsCrud.operators.notEmpty'),
      is_true: t('pages.persons.fieldsCrud.operators.isTrue'),
      is_false: t('pages.persons.fieldsCrud.operators.isFalse'),
    }),
    [t],
  );

  const getLinkedPersonFieldPatch = (personField: PersonFieldOption): Partial<EventCustomField> => ({
    label: personField.label,
    type: personField.type as EventFieldType,
    options: personField.type === 'options' ? personField.options : [],
    allow_multiple: personField.type === 'options' ? personField.allow_multiple : false,
    calculated_conditions: personField.type === 'yes_no' ? personField.calculated_conditions : [],
    link_person_field: true,
    person_field_id: personField.id,
  });

  const getSyncedLinkedConfig = useCallback(
    (field: EventCustomField) => {
      if (
        !field.link_person_field ||
        !field.person_field_id ||
        field.person_field_id === CREATE_PERSON_FIELD_FROM_CAPTURED_FIELD
      ) {
        return field;
      }

      const personField = personFieldOptionById.get(field.person_field_id);
      if (!personField) return field;

      const nextOptions = personField.type === 'options' ? personField.options : [];
      const nextAllowMultiple = personField.type === 'options' ? personField.allow_multiple : false;
      const nextConditions = personField.type === 'yes_no' ? personField.calculated_conditions : [];
      if (
        field.type === personField.type &&
        field.allow_multiple === nextAllowMultiple &&
        areOptionsEqual(field.options, nextOptions) &&
        areConditionsEqual(field.calculated_conditions ?? [], nextConditions)
      ) {
        return field;
      }

      return {
        ...field,
        type: personField.type as EventFieldType,
        options: nextOptions,
        allow_multiple: nextAllowMultiple,
        calculated_conditions: nextConditions,
      };
    },
    [personFieldOptionById],
  );

  const getFieldInputValue = (field: EventCustomField) => {
    const personField = field.person_field_id ? personFieldOptionById.get(field.person_field_id) : undefined;
    return personField && personField.label === field.label ? personField : null;
  };

  const isLinkedToExistingPersonField = (field: EventCustomField) =>
    Boolean(
      field.link_person_field &&
      field.person_field_id &&
      field.person_field_id !== CREATE_PERSON_FIELD_FROM_CAPTURED_FIELD,
    );

  useEffect(() => {
    let changed = false;
    const nextEventFields = eventFields.map((field) => {
      const nextField = getSyncedLinkedConfig(field);
      if (nextField !== field) changed = true;
      return nextField;
    });
    const nextTypeFields = typeFields.map((field) => {
      const nextField = getSyncedLinkedConfig(field);
      if (nextField !== field) changed = true;
      return nextField;
    });

    if (changed) onChange({ eventFields: nextEventFields, typeFields: nextTypeFields });
  }, [eventFields, getSyncedLinkedConfig, onChange, typeFields]);

  const update = (scope: 'event' | 'type', id: string, patch: Partial<EventCustomField>) => {
    const targetField = (scope === 'event' ? eventFields : typeFields).find((field) => field.id === id);
    const patchedTarget = targetField ? { ...targetField, ...patch } : undefined;
    const linkedPersonFieldId =
      patchedTarget?.link_person_field && patchedTarget.person_field_id !== CREATE_PERSON_FIELD_FROM_CAPTURED_FIELD
        ? patchedTarget.person_field_id
        : undefined;
    const shouldSyncLinkedOptions =
      Boolean(linkedPersonFieldId) &&
      patchedTarget?.type === 'options' &&
      ('options' in patch || 'allow_multiple' in patch);
    const shouldSyncLinkedConditions =
      Boolean(linkedPersonFieldId) && patchedTarget?.type === 'yes_no' && 'calculated_conditions' in patch;

    const applyPatch = (field: EventCustomField) => {
      if (field.id === id) return { ...field, ...patch };
      if (
        shouldSyncLinkedOptions &&
        field.link_person_field &&
        field.person_field_id === linkedPersonFieldId &&
        field.type === 'options'
      ) {
        return {
          ...field,
          ...('options' in patch ? { options: patch.options ?? [] } : {}),
          ...('allow_multiple' in patch ? { allow_multiple: patch.allow_multiple ?? false } : {}),
        };
      }
      if (
        shouldSyncLinkedConditions &&
        field.link_person_field &&
        field.person_field_id === linkedPersonFieldId &&
        field.type === 'yes_no'
      ) {
        return {
          ...field,
          calculated_conditions: patch.calculated_conditions ?? [],
        };
      }

      return field;
    };

    onChange({
      eventFields: eventFields.map(applyPatch),
      typeFields: typeFields.map(applyPatch),
    });
  };
  const remove = (scope: 'event' | 'type', id: string) =>
    onChange(
      scope === 'event'
        ? { eventFields: eventFields.filter((field) => field.id !== id), typeFields }
        : { eventFields, typeFields: typeFields.filter((field) => field.id !== id) },
    );
  const move = (scope: 'event' | 'type', field: EventCustomField) =>
    onChange(
      scope === 'event'
        ? { eventFields: eventFields.filter(({ id }) => id !== field.id), typeFields: [...typeFields, field] }
        : { eventFields: [...eventFields, field], typeFields: typeFields.filter(({ id }) => id !== field.id) },
    );

  return (
    <Stack spacing={2}>
      {(mode === 'event-type' ? (['type'] as const) : (['type', 'event'] as const)).map((scope) => {
        const fields = scope === 'type' ? typeFields : eventFields;
        if (scope === 'type' && !canUpdateEventType && !fields.length) return null;
        const readOnly = readOnlyEditor || (scope === 'type' && readOnlyTypeFields);
        return (
          <Stack key={scope} spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography variant="subtitle1">{t(`pages.events.fields.${scope}Title`)}</Typography>
              <Tooltip title={t('pages.events.fields.capturedHelp')}>
                <IconButton size="small" aria-label={t('pages.events.fields.capturedHelp')}>
                  <HelpOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
            {fields.map((field) => (
              <Box key={field.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                <Stack spacing={1.5}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Autocomplete<PersonFieldOption, false, false, true>
                      fullWidth
                      freeSolo
                      options={personFieldOptions}
                      getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      inputValue={field.label}
                      value={getFieldInputValue(field)}
                      disabled={readOnly}
                      onChange={(_event, value) => {
                        if (typeof value === 'string') {
                          update(scope, field.id, {
                            label: value,
                            link_person_field: canCreatePersonFields,
                            person_field_id: canCreatePersonFields
                              ? CREATE_PERSON_FIELD_FROM_CAPTURED_FIELD
                              : undefined,
                          });
                          return;
                        }

                        if (value) {
                          update(scope, field.id, getLinkedPersonFieldPatch(value));
                        }
                      }}
                      onInputChange={(_event, value, reason) => {
                        if (reason !== 'input') return;
                        const linkedPersonField = field.person_field_id
                          ? personFieldOptionById.get(field.person_field_id)
                          : undefined;
                        const renamedLinkedField = Boolean(linkedPersonField && value !== linkedPersonField.label);
                        update(scope, field.id, {
                          label: value,
                          ...(renamedLinkedField
                            ? {
                                link_person_field: canCreatePersonFields,
                                person_field_id: canCreatePersonFields
                                  ? CREATE_PERSON_FIELD_FROM_CAPTURED_FIELD
                                  : undefined,
                              }
                            : {}),
                        });
                      }}
                      renderInput={(params) => (
                        <TextField {...params} required label={t('pages.events.fields.label')} />
                      )}
                    />
                    <FormControl fullWidth>
                      <InputLabel>{t('pages.events.fields.type')}</InputLabel>
                      <Select
                        value={field.type}
                        disabled={readOnly || (isLinkedToExistingPersonField(field) && !canUpdatePersonFields)}
                        label={t('pages.events.fields.type')}
                        onChange={(event) => update(scope, field.id, { type: event.target.value as EventFieldType })}
                      >
                        {TYPES.map((type) => (
                          <MenuItem key={type} value={type}>
                            {t(`pages.events.fields.types.${type}`)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <IconButton
                      color="error"
                      disabled={readOnly}
                      onClick={() => remove(scope, field.id)}
                      aria-label={t('form.common.delete')}
                    >
                      <DeleteOutlineRoundedIcon />
                    </IconButton>
                  </Stack>
                  {field.type === 'options' ? (
                    <>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.allow_multiple ?? false}
                            disabled={readOnly || (isLinkedToExistingPersonField(field) && !canUpdatePersonFields)}
                            onChange={(_event, checked) => update(scope, field.id, { allow_multiple: checked })}
                          />
                        }
                        label={t('pages.persons.fieldsCrud.allowMultiple')}
                      />
                      <OptionsListEditor
                        label={t('pages.events.fields.options')}
                        disabled={readOnly || (isLinkedToExistingPersonField(field) && !canUpdatePersonFields)}
                        addLabel={t('pages.persons.fieldsCrud.addOption')}
                        removeLabel={t('form.common.delete')}
                        values={field.options}
                        onChange={(options) => update(scope, field.id, { options })}
                      />
                    </>
                  ) : null}
                  {field.type === 'yes_no' ? (
                    <FieldConditionsEditor
                      fields={personFieldOptions}
                      value={field.calculated_conditions ?? []}
                      fieldLabel={t('pages.persons.fieldsCrud.conditionField')}
                      operatorLabel={t('pages.persons.fieldsCrud.conditionOperator')}
                      valueLabel={t('pages.persons.fieldsCrud.conditionValue')}
                      addLabel={t('pages.persons.fieldsCrud.addCondition')}
                      removeLabel={t('form.common.delete')}
                      operatorLabels={conditionOperatorLabels}
                      disabled={readOnly || (isLinkedToExistingPersonField(field) && !canUpdatePersonFields)}
                      onChange={(calculatedConditions) =>
                        update(scope, field.id, { calculated_conditions: calculatedConditions })
                      }
                    />
                  ) : null}
                  {personFieldOptions.length || canCreatePersonFields ? (
                    <>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(field.link_person_field)}
                            disabled={readOnly}
                            onChange={(_event, checked) =>
                              update(scope, field.id, {
                                link_person_field: checked,
                                person_field_id: checked
                                  ? field.person_field_id ||
                                    (canCreatePersonFields ? CREATE_PERSON_FIELD_FROM_CAPTURED_FIELD : undefined)
                                  : undefined,
                              })
                            }
                          />
                        }
                        label={t('pages.events.fields.linkPersonField')}
                      />
                      {field.link_person_field ? (
                        <FormControl fullWidth>
                          <InputLabel>{t('pages.events.fields.personField')}</InputLabel>
                          <Select
                            label={t('pages.events.fields.personField')}
                            value={field.person_field_id ?? ''}
                            disabled={readOnly}
                            onChange={(event) => {
                              const personFieldId = event.target.value || undefined;
                              const personField = personFieldOptions.find(({ id }) => id === personFieldId);
                              update(scope, field.id, {
                                ...(personFieldId
                                  ? { link_person_field: true, person_field_id: personFieldId }
                                  : { link_person_field: false, person_field_id: undefined }),
                                ...(personField ? getLinkedPersonFieldPatch(personField) : {}),
                              });
                            }}
                          >
                            <MenuItem value="">{t('pages.events.fields.doNotSave')}</MenuItem>
                            {personFieldOptions.map((personField) => (
                              <MenuItem key={personField.id} value={personField.id}>
                                {personField.label}
                              </MenuItem>
                            ))}
                            {canCreatePersonFields ? (
                              <MenuItem value={CREATE_PERSON_FIELD_FROM_CAPTURED_FIELD}>
                                {t('pages.events.fields.createPersonFieldFromThis')}
                              </MenuItem>
                            ) : null}
                          </Select>
                        </FormControl>
                      ) : null}
                    </>
                  ) : null}
                  <Stack direction={{ xs: 'column', sm: 'row' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.required}
                          disabled={readOnly}
                          onChange={(_event, checked) => update(scope, field.id, { required: checked })}
                        />
                      }
                      label={t('pages.events.fields.required')}
                    />
                    {selfRegistration ? (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.user_fillable}
                            disabled={readOnly}
                            onChange={(_event, checked) => update(scope, field.id, { user_fillable: checked })}
                          />
                        }
                        label={t('pages.events.fields.userFillable')}
                      />
                    ) : null}
                    {canUpdateEventType && mode === 'event' ? (
                      <FormControlLabel
                        control={
                          <Switch checked={scope === 'type'} disabled={readOnly} onChange={() => move(scope, field)} />
                        }
                        label={t('pages.events.fields.allEvents')}
                      />
                    ) : null}
                  </Stack>
                </Stack>
              </Box>
            ))}
            {canAddFields && !readOnly ? (
              <Button
                startIcon={<AddRoundedIcon />}
                disabled={readOnly}
                onClick={() =>
                  onChange(
                    scope === 'event'
                      ? { eventFields: [...eventFields, createField(canCreatePersonFields)], typeFields }
                      : { eventFields, typeFields: [...typeFields, createField(canCreatePersonFields)] },
                  )
                }
                sx={{ alignSelf: 'flex-start' }}
              >
                {t('pages.events.fields.add')}
              </Button>
            ) : null}
          </Stack>
        );
      })}
    </Stack>
  );
};
