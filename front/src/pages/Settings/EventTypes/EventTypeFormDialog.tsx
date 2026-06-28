import { CreateEditDialog } from '@components/common/forms/CreateEditDialog';
import { useAuth } from '@hooks/useAuth';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import {
  Alert,
  Autocomplete,
  Box,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { EventCustomFieldsEditor } from '@pages/Modules/Events/EventCustomFieldsEditor';
import { EventFieldsService } from '@services/eventFields';
import { PersonFieldsService } from '@services/persons';
import { httpRequest } from '@utils/http';
import { DEFAULT_MUI_ICON, MUI_ICON_OPTIONS, MuiIcon } from '@utils/muiIcons';
import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { EventCustomField, EventField } from '@/types/event.types';
import type { PersonField } from '@/types/person.types';
import type { EventTypeFormDialogProps } from './eventTypes.types';

type EventTypeFormTab = 'info' | 'customFields';

const HOUR_OPTIONS = Array.from({ length: 24 }, (_value, index) => String(index).padStart(2, '0'));
const MINUTE_OPTIONS = ['00', '15', '30', '45'];
const DURATION_OPTIONS = ['15', '30', '45', '60'];

const normalizeTimePart = (value: string, max: number) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return '';
  return String(Math.max(0, Math.min(max, parsed))).padStart(2, '0');
};

const splitTime = (time: string) => {
  const [hour = '', minute = ''] = time.split(':');
  return [hour, minute] as const;
};

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
  const [tab, setTab] = useState<EventTypeFormTab>('info');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [attendanceEnabled, setAttendanceEnabled] = useState(false);
  const [defaultPublic, setDefaultPublic] = useState(false);
  const [defaultSelfRegistration, setDefaultSelfRegistration] = useState(false);
  const [defaultStartTime, setDefaultStartTime] = useState('');
  const [defaultDuration, setDefaultDuration] = useState('');
  const [customFields, setCustomFields] = useState<EventCustomField[]>([]);
  const [personFields, setPersonFields] = useState<PersonField[]>([]);
  const [eventFields, setEventFields] = useState<EventField[]>([]);
  const [color, setColor] = useState('#1976d2');
  const [icon, setIcon] = useState(DEFAULT_MUI_ICON);
  const [nameError, setNameError] = useState('');
  const [fieldError, setFieldError] = useState('');

  const resetState = useCallback(() => {
    setTab('info');
    setName(eventType?.name ?? '');
    setDescription(eventType?.description ?? '');
    setAttendanceEnabled(eventType?.attendance_enabled ?? false);
    setDefaultPublic(eventType?.default_public ?? false);
    setDefaultSelfRegistration(eventType?.default_self_registration ?? false);
    setDefaultStartTime(eventType?.default_start_time?.slice(0, 5) ?? '');
    setDefaultDuration(eventType?.default_duration_minutes ? String(eventType.default_duration_minutes) : '');
    setCustomFields(eventType?.custom_fields ?? []);
    setColor(eventType?.color ?? '#1976d2');
    setIcon(eventType?.icon || DEFAULT_MUI_ICON);
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
  const [startHour, startMinute] = useMemo(() => splitTime(defaultStartTime), [defaultStartTime]);
  const canSubmit = Boolean(name.trim()) && customFields.every((field) => field.label.trim());

  const setTimePart = (part: 'hour' | 'minute', value: string) => {
    const hour = part === 'hour' ? normalizeTimePart(value, 23) : startHour;
    const minute = part === 'minute' ? normalizeTimePart(value, 59) : startMinute || '00';
    setDefaultStartTime(hour ? `${hour}:${minute || '00'}` : '');
  };

  const switchLabel = (labelKey: string, helpKey: string): ReactNode => (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <span>{t(labelKey)}</span>
      <Tooltip title={t(helpKey)}>
        <IconButton size="small" aria-label={t(helpKey)} onClick={(event) => event.preventDefault()}>
          <HelpOutlineRoundedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
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
      attendance_enabled: attendanceEnabled,
      default_public: defaultPublic,
      default_self_registration: defaultSelfRegistration,
      default_start_time: defaultStartTime || undefined,
      default_duration_minutes: defaultDuration ? Number(defaultDuration) : undefined,
      custom_fields: customFields,
      color,
      icon,
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
      submitDisabled={!canSubmit}
    >
      <Tabs value={tab} onChange={(_event, value: EventTypeFormTab) => setTab(value)}>
        <Tab value="info" label={t('pages.settings.eventTypes.tabs.info')} />
        <Tab value="customFields" label={t('pages.settings.eventTypes.tabs.customFields')} />
      </Tabs>

      {tab === 'info' ? (
        <Stack spacing={2}>
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
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Autocomplete
              fullWidth
              options={MUI_ICON_OPTIONS}
              value={icon}
              onChange={(_event, value) => setIcon(value || DEFAULT_MUI_ICON)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('pages.settings.eventTypes.fields.icon')}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <MuiIcon name={icon} fontSize="small" />
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            <TextField
              type="color"
              label={t('pages.settings.eventTypes.fields.color')}
              value={color}
              onChange={(event) => setColor(event.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: { sm: 180 } }}
            />
          </Stack>
          <FormControlLabel
            control={
              <Switch checked={attendanceEnabled} onChange={(_event, checked) => setAttendanceEnabled(checked)} />
            }
            label={switchLabel(
              'pages.settings.eventTypes.fields.attendance',
              'pages.settings.eventTypes.help.attendance',
            )}
          />
          <FormControlLabel
            control={<Switch checked={defaultPublic} onChange={(_event, checked) => setDefaultPublic(checked)} />}
            label={switchLabel(
              'pages.settings.eventTypes.fields.defaultPublic',
              'pages.settings.eventTypes.help.public',
            )}
          />
          <FormControlLabel
            control={
              <Switch
                checked={defaultSelfRegistration}
                onChange={(_event, checked) => setDefaultSelfRegistration(checked)}
              />
            }
            label={switchLabel(
              'pages.settings.eventTypes.fields.defaultSelfRegistration',
              'pages.settings.eventTypes.help.selfRegistration',
            )}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Autocomplete
              freeSolo
              options={HOUR_OPTIONS}
              value={startHour}
              onInputChange={(_event, value) => setTimePart('hour', value)}
              renderInput={(params) => <TextField {...params} label={t('form.field.hour')} />}
            />
            <Autocomplete
              freeSolo
              options={MINUTE_OPTIONS}
              value={startMinute}
              onInputChange={(_event, value) => setTimePart('minute', value)}
              renderInput={(params) => <TextField {...params} label={t('form.field.minute')} />}
            />
            <Autocomplete
              freeSolo
              options={DURATION_OPTIONS}
              value={defaultDuration}
              onInputChange={(_event, value) => setDefaultDuration(value.replace(/\D/g, '').slice(0, 4))}
              renderInput={(params) => (
                <TextField {...params} label={t('pages.settings.eventTypes.fields.defaultDuration')} />
              )}
            />
          </Stack>
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {t('pages.settings.eventTypes.fields.customFieldsHelp')}
            </Typography>
          </Box>
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
        </Stack>
      )}
    </CreateEditDialog>
  );
};
