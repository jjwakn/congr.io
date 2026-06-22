import { CreateEditDialog } from '@components/common/forms/CreateEditDialog';
import { useAuth } from '@hooks/useAuth';
import { Alert, FormControlLabel, Switch, TextField, Typography } from '@mui/material';
import { EventCustomFieldsEditor } from '@pages/Modules/Events/EventCustomFieldsEditor';
import { EventFieldsService } from '@services/eventFields';
import { PersonFieldsService } from '@services/persons';
import { httpRequest } from '@utils/http';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EventCustomField, EventField } from '@/types/event.types';
import type { PersonField } from '@/types/person.types';
import type { EventTypeFormDialogProps } from './eventTypes.types';

export const EventTypeFormDialog = ({
  open,
  mode,
  eventType,
  submitting,
  onClose,
  onSubmit,
}: EventTypeFormDialogProps) => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [attendanceEnabled, setAttendanceEnabled] = useState(false);
  const [defaultPublic, setDefaultPublic] = useState(false);
  const [defaultSelfRegistration, setDefaultSelfRegistration] = useState(false);
  const [defaultStartTime, setDefaultStartTime] = useState('');
  const [defaultDuration, setDefaultDuration] = useState('');
  const [customFields, setCustomFields] = useState<EventCustomField[]>([]);
  const [personFields, setPersonFields] = useState<PersonField[]>([]);
  const [eventFields, setEventFields] = useState<EventField[]>([]);
  const [color, setColor] = useState('#1976d2');
  const [nameError, setNameError] = useState('');
  const [fieldError, setFieldError] = useState('');

  const resetState = useCallback(() => {
    setName(eventType?.name ?? '');
    setDescription(eventType?.description ?? '');
    setEnabled(eventType?.enabled ?? true);
    setAttendanceEnabled(eventType?.attendance_enabled ?? false);
    setDefaultPublic(eventType?.default_public ?? false);
    setDefaultSelfRegistration(eventType?.default_self_registration ?? false);
    setDefaultStartTime(eventType?.default_start_time?.slice(0, 5) ?? '');
    setDefaultDuration(eventType?.default_duration_minutes ? String(eventType.default_duration_minutes) : '');
    setCustomFields(eventType?.custom_fields ?? []);
    setColor(eventType?.color ?? '#1976d2');
    setNameError('');
    setFieldError('');
    void Promise.all([
      hasPermission('person_field', 'get')
        ? httpRequest<{ result: PersonField[]; total: number }>({
            service: PersonFieldsService.list,
            data: { page: 0, size: 500, order: 'label', direction: 'ASC' },
          })
        : Promise.resolve({ result: [], total: 0 }),
      hasPermission('event_field', 'get')
        ? httpRequest<{ result: EventField[]; total: number }>({
            service: EventFieldsService.list,
            data: { page: 0, size: 500, order: 'label', direction: 'ASC' },
          })
        : Promise.resolve({ result: [], total: 0 }),
    ]).then(([personResponse, eventResponse]) => {
      setPersonFields(personResponse.result ?? []);
      setEventFields(eventResponse.result ?? []);
    });
  }, [eventType, hasPermission]);

  const labels = useMemo(
    () => ({
      createTitle: t('pages.settings.eventTypes.dialogs.createTitle'),
      editTitle: t('pages.settings.eventTypes.dialogs.editTitle'),
      createSubmit: t('pages.settings.eventTypes.actions.create'),
      editSubmit: t('pages.settings.eventTypes.actions.save'),
      cancel: t('form.field.cancel'),
    }),
    [t],
  );

  const handleSubmit = () => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      setNameError(`${t('form.field.name')} ${t('form.error.isRequired')}`);
      return;
    }
    if (customFields.some((field) => !field.label.trim())) {
      setFieldError(t('pages.events.form.required'));
      return;
    }
    onSubmit({
      name: normalizedName,
      description: description.trim(),
      enabled,
      attendance_enabled: attendanceEnabled,
      default_public: defaultPublic,
      default_self_registration: defaultSelfRegistration,
      default_start_time: defaultStartTime || undefined,
      default_duration_minutes: defaultDuration ? Number(defaultDuration) : undefined,
      custom_fields: customFields,
      color,
    });
  };

  return (
    <CreateEditDialog
      open={open}
      mode={mode}
      submitting={submitting}
      onClose={onClose}
      onSubmit={handleSubmit}
      onEnter={resetState}
      labels={labels}
    >
      <TextField
        autoFocus
        fullWidth
        label={t('form.field.name')}
        value={name}
        error={Boolean(nameError)}
        helperText={nameError}
        onChange={(event) => {
          setName(event.target.value);
          if (nameError) setNameError('');
        }}
      />
      <TextField
        fullWidth
        multiline
        minRows={3}
        label={t('pages.settings.eventTypes.fields.description')}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <FormControlLabel
        control={<Switch checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />}
        label={t('pages.settings.eventTypes.fields.enabled')}
      />
      <FormControlLabel
        control={<Switch checked={attendanceEnabled} onChange={(_event, checked) => setAttendanceEnabled(checked)} />}
        label={t('pages.settings.eventTypes.fields.attendance')}
      />
      <FormControlLabel
        control={<Switch checked={defaultPublic} onChange={(_event, checked) => setDefaultPublic(checked)} />}
        label={t('pages.settings.eventTypes.fields.defaultPublic')}
      />
      <FormControlLabel
        control={
          <Switch
            checked={defaultSelfRegistration}
            onChange={(_event, checked) => setDefaultSelfRegistration(checked)}
          />
        }
        label={t('pages.settings.eventTypes.fields.defaultSelfRegistration')}
      />
      <TextField
        type="time"
        label={t('pages.settings.eventTypes.fields.defaultStartTime')}
        value={defaultStartTime}
        onChange={(event) => setDefaultStartTime(event.target.value)}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        type="number"
        label={t('pages.settings.eventTypes.fields.defaultDuration')}
        value={defaultDuration}
        inputProps={{ min: 1, max: 1440 }}
        onChange={(event) => setDefaultDuration(event.target.value)}
      />
      <EventCustomFieldsEditor
        mode="event-type"
        eventFields={[]}
        typeFields={customFields}
        canUpdateEventType
        selfRegistration={defaultSelfRegistration}
        personFields={attendanceEnabled ? personFields : []}
        reusableFields={eventFields}
        onChange={({ typeFields }) => {
          setCustomFields(typeFields);
          if (fieldError) setFieldError('');
        }}
      />
      {fieldError ? <Alert severity="error">{fieldError}</Alert> : null}
      <TextField
        type="color"
        label={t('pages.settings.eventTypes.fields.color')}
        value={color}
        onChange={(event) => setColor(event.target.value)}
        InputLabelProps={{ shrink: true }}
      />
      <Typography variant="body2" color="text.secondary">
        {t('pages.settings.eventTypes.fields.enabledHint')}
      </Typography>
    </CreateEditDialog>
  );
};
