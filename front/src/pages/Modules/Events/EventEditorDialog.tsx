import { LocalizedDateField } from '@components/common/forms/LocalizedDateField';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { FilesService } from '@services/files';
import { PersonFieldsService } from '@services/persons';
import { httpRequest } from '@utils/http';
import { getSettingsPath } from '@utils/routes';
import { DateTime } from 'luxon';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { EventType } from '@/types/event-type.types';
import type { PersonField } from '@/types/person.types';
import { EventCustomFieldsEditor } from './EventCustomFieldsEditor';
import type { EventEditorDialogProps } from './events.types';

const toLocalInput = (value: string | undefined, timezone: string) => {
  const parsed = value ? DateTime.fromISO(value).setZone(timezone) : DateTime.now().setZone(timezone);
  return parsed.toFormat("yyyy-LL-dd'T'HH:mm");
};

const splitLocalInput = (value: string) => {
  const [date = '', time = ''] = value.split('T');
  return { date, time };
};

const combineLocalInput = (date: string, time: string) => `${date}T${time || '00:00'}`;

const toAllDayEndInput = (date: string, timezone: string) =>
  DateTime.fromISO(date, { zone: timezone }).plus({ days: 1 }).toFormat("yyyy-LL-dd'T'HH:mm");

export const EventEditorDialog = ({
  open,
  event,
  initialDate,
  initialTypeId,
  timezone,
  eventTypes,
  canCreateEventType,
  canViewPersonFields,
  submitting,
  onClose,
  onSubmit,
}: EventEditorDialogProps) => {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const inputRef = useRef<HTMLInputElement | null>(null);
  const initialType = eventTypes.find(({ id }) => id === (event?.event_type_id ?? initialTypeId));
  const baseInitialStart = initialDate
    ? DateTime.fromISO(initialDate, { zone: timezone }).set({ hour: 9, minute: 0 }).toFormat("yyyy-LL-dd'T'HH:mm")
    : toLocalInput(event?.start_datetime, timezone);
  const initialStart =
    !event && initialType?.default_start_time
      ? `${splitLocalInput(baseInitialStart).date}T${initialType.default_start_time.slice(0, 5)}`
      : baseInitialStart;
  const initialEnd = event?.end_datetime
    ? toLocalInput(event.end_datetime, timezone)
    : DateTime.fromFormat(initialStart, "yyyy-LL-dd'T'HH:mm", { zone: timezone })
        .plus({ minutes: initialType?.default_duration_minutes ?? 60 })
        .toFormat("yyyy-LL-dd'T'HH:mm");
  const initialTypeFieldIds = new Set((initialType?.custom_fields ?? []).map(({ id }) => id));
  const [activeTab, setActiveTab] = useState<'details' | 'fields'>('details');
  const [name, setName] = useState(event?.name ?? initialType?.name ?? '');
  const [nameTouched, setNameTouched] = useState(Boolean(event?.name));
  const [description, setDescription] = useState(event?.description ?? '');
  const [startDate, setStartDate] = useState(splitLocalInput(initialStart).date);
  const [startTime, setStartTime] = useState(
    event?.start_datetime
      ? splitLocalInput(initialStart).time
      : (initialType?.default_start_time?.slice(0, 5) ?? splitLocalInput(initialStart).time),
  );
  const [endDate, setEndDate] = useState(splitLocalInput(initialEnd).date);
  const [endTime, setEndTime] = useState(splitLocalInput(initialEnd).time);
  const [typeId, setTypeId] = useState(event?.event_type_id ?? initialTypeId ?? '');
  const [allDay, setAllDay] = useState(event?.all_day ?? false);
  const [isPublic, setIsPublic] = useState(event?.is_public ?? initialType?.default_public ?? false);
  const [attendance, setAttendance] = useState(event?.attendance_enabled ?? initialType?.attendance_enabled ?? false);
  const [selfRegistration, setSelfRegistration] = useState(
    event?.self_registration_enabled ?? initialType?.default_self_registration ?? false,
  );
  const [eventFields, setEventFields] = useState(
    (event?.custom_fields ?? []).filter(({ id }) => !initialTypeFieldIds.has(id)),
  );
  const [typeFields, setTypeFields] = useState(initialType?.custom_fields ?? []);
  const [personFields, setPersonFields] = useState<PersonField[]>([]);
  const [saveAttendanceDate, setSaveAttendanceDate] = useState(
    event?.save_attendance_date ?? initialType?.save_attendance_date ?? false,
  );
  const [attendanceDateFieldId, setAttendanceDateFieldId] = useState(
    event?.attendance_date_person_field_id ?? initialType?.attendance_date_person_field_id ?? '',
  );
  const [imageUrl, setImageUrl] = useState(event?.image_url ?? '');
  const [image, setImage] = useState<File>();
  const [imageOptions, setImageOptions] = useState({ allow_upload: true, allow_public_url: false });
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const previewUrl = useMemo(() => (image ? URL.createObjectURL(image) : imageUrl), [image, imageUrl]);

  useEffect(
    () => () => {
      if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  useEffect(() => {
    if (!canViewPersonFields) return;
    void httpRequest<{ result: PersonField[]; total: number }>({
      service: PersonFieldsService.list,
      data: { page: 0, size: 500, order: 'label', direction: 'ASC' },
    }).then(({ result }) => setPersonFields(result));
  }, [canViewPersonFields]);

  useEffect(() => {
    void httpRequest<{ allow_upload: boolean; allow_public_url: boolean }>({
      service: FilesService.eventImageOptions,
    })
      .then(setImageOptions)
      .catch(() => setImageOptions({ allow_upload: true, allow_public_url: false }));
  }, []);

  const updateEndFromType = (type: EventType, nextDate: string, nextTime: string) => {
    const start = DateTime.fromFormat(combineLocalInput(nextDate, nextTime), "yyyy-LL-dd'T'HH:mm", {
      zone: timezone,
    });
    if (!start.isValid) return;
    const end = start.plus({ minutes: type.default_duration_minutes ?? 60 });
    setEndDate(end.toFormat('yyyy-LL-dd'));
    setEndTime(end.toFormat('HH:mm'));
  };

  const applyEventType = (type: EventType | null) => {
    setTypeId(type?.id ?? '');
    if (!type) return;
    if (!event && !nameTouched) setName(type.name);
    setAttendance(type.attendance_enabled ?? false);
    setIsPublic(type.default_public ?? false);
    setSelfRegistration(type.default_self_registration ?? false);
    setTypeFields(type.custom_fields ?? []);
    setSaveAttendanceDate(type.save_attendance_date ?? false);
    setAttendanceDateFieldId(type.attendance_date_person_field_id ?? '');
    const nextTime = type.default_start_time?.slice(0, 5) ?? startTime;
    setStartTime(nextTime);
    updateEndFromType(type, startDate, nextTime);
  };

  const chooseImage = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) {
      setError(t('pages.events.form.invalidImage'));
      return;
    }
    setImage(file);
    setError('');
  };

  const submit = () => {
    if (!name.trim() || !typeId || !startDate || (!allDay && (!startTime || !endDate || !endTime))) {
      setError(t('pages.events.form.required'));
      setActiveTab('details');
      return;
    }
    if ([...typeFields, ...eventFields].some((field) => !field.label.trim())) {
      setError(t('pages.events.form.required'));
      setActiveTab('fields');
      return;
    }
    onSubmit(
      {
        name: name.trim(),
        description: description.trim(),
        start_datetime: allDay ? combineLocalInput(startDate, '00:00') : combineLocalInput(startDate, startTime),
        end_datetime: allDay ? toAllDayEndInput(startDate, timezone) : combineLocalInput(endDate, endTime),
        type_id: typeId,
        all_day: allDay,
        is_public: isPublic,
        attendance_enabled: attendance,
        self_registration_enabled: attendance && selfRegistration,
        custom_fields: [...typeFields, ...eventFields],
        event_fields: eventFields,
        ...(imageOptions.allow_public_url && imageUrl.trim() ? { image_url: imageUrl.trim() } : {}),
        save_attendance_date: attendance && saveAttendanceDate,
        ...(attendance && saveAttendanceDate && attendanceDateFieldId
          ? { attendance_date_person_field_id: attendanceDateFieldId }
          : {}),
      },
      image,
    );
  };

  return (
    <Dialog open={open} fullWidth maxWidth="md" fullScreen={fullScreen} onClose={submitting ? undefined : onClose}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {event ? t('pages.events.form.editTitle') : t('pages.events.form.createTitle')}
        <Tooltip title={t('form.field.close')}>
          <IconButton onClick={onClose} disabled={submitting} aria-label={t('form.field.close')}>
            <CloseRoundedIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>
      <DialogContent dividers>
        <Tabs value={activeTab} onChange={(_event, value) => setActiveTab(value)} sx={{ mb: 2 }}>
          <Tab value="details" label={t('pages.events.form.tabs.details')} />
          <Tab value="fields" label={t('pages.events.form.tabs.fields')} />
        </Tabs>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        {activeTab === 'details' ? (
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <Autocomplete
                fullWidth
                options={eventTypes}
                getOptionLabel={(option) => option.name}
                value={eventTypes.find(({ id }) => id === typeId) ?? null}
                onChange={(_event, value) => applyEventType(value)}
                renderInput={(params) => (
                  <TextField {...params} autoFocus required label={t('pages.events.form.type')} />
                )}
              />
              {canCreateEventType ? (
                <Tooltip title={t('pages.events.form.newType')}>
                  <IconButton
                    color="primary"
                    onClick={() => {
                      onClose();
                      navigate(getSettingsPath(i18n.language), {
                        state: { settingsTab: 'customFields', customFieldsTab: 'eventTypes', createEventType: true },
                      });
                    }}
                  >
                    <AddRoundedIcon />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
              <TextField
                required
                fullWidth
                label={t('pages.events.form.name')}
                value={name}
                onChange={(eventValue) => {
                  setNameTouched(true);
                  setName(eventValue.target.value);
                }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={allDay}
                    onChange={(_event, checked) => {
                      setAllDay(checked);
                      if (checked) setEndDate(startDate);
                    }}
                  />
                }
                label={t('pages.events.form.allDay')}
                sx={{ flexShrink: 0 }}
              />
            </Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="center">
              <LocalizedDateField
                fullWidth
                label={t('pages.events.form.startDate')}
                value={startDate}
                onChange={(value) => {
                  setStartDate(value);
                  setEndDate(value);
                  const type = eventTypes.find(({ id }) => id === typeId);
                  if (type && !allDay) updateEndFromType(type, value, startTime);
                }}
              />
              {allDay ? null : (
                <TextField
                  fullWidth
                  type="time"
                  label={t('pages.events.form.startTime')}
                  value={startTime}
                  onChange={(eventValue) => {
                    const value = eventValue.target.value;
                    setStartTime(value);
                    const type = eventTypes.find(({ id }) => id === typeId);
                    if (type) updateEndFromType(type, startDate, value);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            </Stack>
            {allDay ? null : (
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                <LocalizedDateField
                  fullWidth
                  label={t('pages.events.form.endDate')}
                  value={endDate}
                  onChange={setEndDate}
                />
                <TextField
                  fullWidth
                  type="time"
                  label={t('pages.events.form.endTime')}
                  value={endTime}
                  onChange={(eventValue) => setEndTime(eventValue.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
            )}
            <TextField
              multiline
              minRows={3}
              label={t('pages.events.form.description')}
              value={description}
              onChange={(eventValue) => setDescription(eventValue.target.value)}
            />
            {imageOptions.allow_upload ? (
              <Box
                onDragOver={(dragEvent) => {
                  dragEvent.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(dropEvent) => {
                  dropEvent.preventDefault();
                  setDragging(false);
                  chooseImage(dropEvent.dataTransfer.files[0]);
                }}
                onClick={() => inputRef.current?.click()}
                sx={{
                  border: 2,
                  borderStyle: 'dashed',
                  borderColor: dragging ? 'primary.main' : 'divider',
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                <input
                  ref={inputRef}
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(inputEvent) => chooseImage(inputEvent.target.files?.[0])}
                />
                {previewUrl ? (
                  <Box
                    component="img"
                    src={previewUrl}
                    alt=""
                    sx={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain' }}
                  />
                ) : (
                  <CloudUploadOutlinedIcon />
                )}
                <Typography variant="body2">{t('pages.events.form.dropImage')}</Typography>
              </Box>
            ) : null}
            {imageOptions.allow_public_url ? (
              <TextField
                label={t('pages.events.form.publicImageUrl')}
                value={imageUrl}
                onChange={(eventValue) => setImageUrl(eventValue.target.value)}
              />
            ) : null}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <FormControlLabel
                control={<Switch checked={isPublic} onChange={(_event, checked) => setIsPublic(checked)} />}
                label={t('pages.events.form.public')}
              />
              <FormControlLabel
                control={<Switch checked={attendance} onChange={(_event, checked) => setAttendance(checked)} />}
                label={t('pages.events.form.attendance')}
              />
              {attendance ? (
                <FormControlLabel
                  control={
                    <Switch checked={selfRegistration} onChange={(_event, checked) => setSelfRegistration(checked)} />
                  }
                  label={t('pages.events.form.selfRegistration')}
                />
              ) : null}
            </Stack>
            {attendance ? (
              <>
                <FormControlLabel
                  control={
                    <Switch
                      checked={saveAttendanceDate}
                      onChange={(_event, checked) => setSaveAttendanceDate(checked)}
                    />
                  }
                  label={t('pages.events.form.saveAttendanceDate')}
                />
                {saveAttendanceDate ? (
                  <Autocomplete
                    options={personFields.filter(({ type }) => type === 'date')}
                    getOptionLabel={(option) => option.label}
                    value={personFields.find(({ id }) => id === attendanceDateFieldId) ?? null}
                    onChange={(_event, value) => setAttendanceDateFieldId(value?.id ?? '')}
                    renderInput={(params) => (
                      <TextField {...params} required label={t('pages.events.form.attendanceDateField')} />
                    )}
                  />
                ) : null}
              </>
            ) : null}
            {isPublic && attendance && !selfRegistration ? (
              <Alert
                severity="warning"
                action={
                  <Button color="inherit" onClick={() => setSelfRegistration(true)}>
                    {t('pages.events.form.allowRegistration')}
                  </Button>
                }
              >
                {t('pages.events.form.publicAttendanceNotice')}
              </Alert>
            ) : null}
          </Stack>
        ) : (
          <EventCustomFieldsEditor
            eventFields={eventFields}
            typeFields={typeFields}
            canUpdateEventType={false}
            selfRegistration={selfRegistration}
            personFields={personFields}
            readOnlyTypeFields
            onChange={({ eventFields: nextEventFields }) => setEventFields(nextEventFields)}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          {t('form.field.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={submitting || (isPublic && attendance && !selfRegistration)}
        >
          {t('pages.events.form.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
