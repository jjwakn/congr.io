import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
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
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { EventCustomField, EventFieldType } from '@/types/event.types';
import type { EventCustomFieldsEditorProps } from './events.types';

const TYPES: EventFieldType[] = ['text', 'paragraph', 'number', 'switch', 'single_option', 'multiple_options'];
const createField = (): EventCustomField => ({
  id: crypto.randomUUID(),
  label: '',
  type: 'text',
  required: false,
  options: [],
  user_fillable: false,
});

export const EventCustomFieldsEditor = ({
  eventFields,
  typeFields,
  canUpdateEventType,
  selfRegistration,
  personFields,
  onChange,
}: EventCustomFieldsEditorProps) => {
  const { t } = useTranslation();
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
      {(['type', 'event'] as const).map((scope) => {
        const fields = scope === 'type' ? typeFields : eventFields;
        if (scope === 'type' && !canUpdateEventType && !fields.length) return null;
        return (
          <Stack key={scope} spacing={1.5}>
            <Typography variant="subtitle1">{t(`pages.events.fields.${scope}Title`)}</Typography>
            {fields.map((field) => (
              <Box key={field.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                <Stack spacing={1.5}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      fullWidth
                      required
                      label={t('pages.events.fields.label')}
                      value={field.label}
                      onChange={(event) => update(scope, field.id, { label: event.target.value })}
                    />
                    <FormControl fullWidth>
                      <InputLabel>{t('pages.events.fields.type')}</InputLabel>
                      <Select
                        value={field.type}
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
                      onClick={() => remove(scope, field.id)}
                      aria-label={t('form.common.delete')}
                    >
                      <DeleteOutlineRoundedIcon />
                    </IconButton>
                  </Stack>
                  {field.type === 'single_option' || field.type === 'multiple_options' ? (
                    <TextField
                      label={t('pages.events.fields.options')}
                      value={field.options.join(', ')}
                      onChange={(event) =>
                        update(scope, field.id, {
                          options: event.target.value
                            .split(',')
                            .map((value) => value.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  ) : null}
                  {personFields.length ? (
                    <FormControl fullWidth>
                      <InputLabel>{t('pages.events.fields.personField')}</InputLabel>
                      <Select
                        label={t('pages.events.fields.personField')}
                        value={field.person_field_id ?? ''}
                        onChange={(event) =>
                          update(scope, field.id, { person_field_id: event.target.value || undefined })
                        }
                      >
                        <MenuItem value="">{t('pages.events.fields.doNotSave')}</MenuItem>
                        {personFields
                          .filter(
                            (personField) =>
                              personField.type === field.type ||
                              ((field.type === 'text' || field.type === 'paragraph') &&
                                (personField.type === 'text' || personField.type === 'paragraph')),
                          )
                          .map((personField) => (
                            <MenuItem key={personField.id} value={personField.id}>
                              {personField.label}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  ) : null}
                  <Stack direction={{ xs: 'column', sm: 'row' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.required}
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
                            onChange={(_event, checked) => update(scope, field.id, { user_fillable: checked })}
                          />
                        }
                        label={t('pages.events.fields.userFillable')}
                      />
                    ) : null}
                    {canUpdateEventType ? (
                      <FormControlLabel
                        control={<Switch checked={scope === 'type'} onChange={() => move(scope, field)} />}
                        label={t('pages.events.fields.allEvents')}
                      />
                    ) : null}
                  </Stack>
                </Stack>
              </Box>
            ))}
            <Button
              startIcon={<AddRoundedIcon />}
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
          </Stack>
        );
      })}
    </Stack>
  );
};
