import { OptionsListEditor } from '@components/common/forms/OptionsListEditor';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import {
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
import { useTranslation } from 'react-i18next';
import type { EventCustomField, EventFieldType } from '@/types/event.types';
import type { EventCustomFieldsEditorProps } from './events.types';

const TYPES: EventFieldType[] = ['text', 'paragraph', 'number', 'yes_no', 'options', 'date'];
const createField = (): EventCustomField => ({
  id: crypto.randomUUID(),
  label: '',
  type: 'text',
  required: false,
  options: [],
  allow_multiple: false,
  user_fillable: false,
  link_person_field: true,
  person_field_id: CREATE_PERSON_FIELD_FROM_CAPTURED_FIELD,
});

export const EventCustomFieldsEditor = ({
  eventFields,
  typeFields,
  canUpdateEventType,
  selfRegistration,
  personFields,
  mode = 'event',
  readOnlyTypeFields = false,
  canAddFields = true,
  onChange,
}: EventCustomFieldsEditorProps) => {
  const { t } = useTranslation();
  const personFieldOptions = [
    ...STANDARD_PERSON_FIELDS.map((field) => ({
      id: field.id,
      label: t(field.labelKey),
      type: field.type,
      options: field.options,
      allow_multiple: field.allow_multiple ?? false,
    })),
    ...personFields,
  ];

  const getCompatiblePersonFields = (field: EventCustomField) =>
    personFieldOptions.filter(
      (personField) =>
        personField.type === field.type ||
        ((field.type === 'text' || field.type === 'paragraph') &&
          (personField.type === 'text' || personField.type === 'paragraph')),
    );

  const update = (scope: 'event' | 'type', id: string, patch: Partial<EventCustomField>) => {
    const source = scope === 'event' ? eventFields : typeFields;
    const next = source.map((field) => (field.id === id ? { ...field, ...patch } : field));
    onChange(scope === 'event' ? { eventFields: next, typeFields } : { eventFields, typeFields: next });
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
        const readOnly = scope === 'type' && readOnlyTypeFields;
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
                    <TextField
                      fullWidth
                      required
                      label={t('pages.events.fields.label')}
                      value={field.label}
                      disabled={readOnly}
                      onChange={(event) => update(scope, field.id, { label: event.target.value })}
                    />
                    <FormControl fullWidth>
                      <InputLabel>{t('pages.events.fields.type')}</InputLabel>
                      <Select
                        value={field.type}
                        disabled={readOnly}
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
                            disabled={readOnly}
                            onChange={(_event, checked) => update(scope, field.id, { allow_multiple: checked })}
                          />
                        }
                        label={t('pages.persons.fieldsCrud.allowMultiple')}
                      />
                      <OptionsListEditor
                        label={t('pages.events.fields.options')}
                        disabled={readOnly}
                        addLabel={t('pages.persons.fieldsCrud.addOption')}
                        removeLabel={t('form.common.delete')}
                        values={field.options}
                        onChange={(options) =>
                          update(scope, field.id, {
                            options: options.map((value) => value.trim()).filter(Boolean),
                          })
                        }
                      />
                    </>
                  ) : null}
                  {personFieldOptions.length ? (
                    <>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(field.link_person_field)}
                            disabled={readOnly}
                            onChange={(_event, checked) =>
                              update(scope, field.id, {
                                link_person_field: checked,
                                person_field_id: checked ? field.person_field_id : undefined,
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
                                person_field_id: personFieldId,
                                ...(personField
                                  ? {
                                      type: personField.type,
                                      options: personField.options,
                                      allow_multiple: personField.allow_multiple,
                                    }
                                  : {}),
                              });
                            }}
                          >
                            <MenuItem value="">{t('pages.events.fields.doNotSave')}</MenuItem>
                            {getCompatiblePersonFields(field).map((personField) => (
                              <MenuItem key={personField.id} value={personField.id}>
                                {personField.label}
                              </MenuItem>
                            ))}
                            <MenuItem value={CREATE_PERSON_FIELD_FROM_CAPTURED_FIELD}>
                              {t('pages.events.fields.createPersonFieldFromThis')}
                            </MenuItem>
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
                        control={<Switch checked={scope === 'type'} onChange={() => move(scope, field)} />}
                        label={t('pages.events.fields.allEvents')}
                      />
                    ) : null}
                  </Stack>
                </Stack>
              </Box>
            ))}
            {canAddFields ? (
              <Button
                startIcon={<AddRoundedIcon />}
                disabled={readOnly}
                onClick={() =>
                  onChange(
                    scope === 'event'
                      ? { eventFields: [...eventFields, createField()], typeFields }
                      : { eventFields, typeFields: [...typeFields, createField()] },
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
