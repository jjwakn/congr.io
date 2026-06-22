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
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { PersonFieldsService } from '@services/persons';
import { httpRequest } from '@utils/http';
import { DateTime } from 'luxon';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PersonField } from '@/types/person.types';
import { EventCustomFieldsEditor } from './EventCustomFieldsEditor';
import type { EventEditorDialogProps } from './events.types';

const toLocalInput = (value: string | undefined, timezone: string) => {
  const parsed = value ? DateTime.fromISO(value).setZone(timezone) : DateTime.now().setZone(timezone);
  return parsed.toFormat("yyyy-LL-dd'T'HH:mm");
};

export const EventEditorDialog = ({
  open,
  event,
  initialDate,
  initialTypeId,
  timezone,
  eventTypes,
  canCreateEventType,
  canUpdateEventType,
  canViewPersonFields,
  submitting,
  onClose,
  onSubmit,
}: EventEditorDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const inputRef = useRef<HTMLInputElement | null>(null);
  const initialStart = initialDate
    ? DateTime.fromISO(initialDate, { zone: timezone }).set({ hour: 9, minute: 0 }).toFormat("yyyy-LL-dd'T'HH:mm")
    : toLocalInput(event?.start_datetime, timezone);
  const initialType = eventTypes.find(({ id }) => id === (event?.event_type_id ?? initialTypeId));
  const [name, setName] = useState(event?.name ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(
    event?.end_datetime
      ? toLocalInput(event.end_datetime, timezone)
      : DateTime.fromFormat(initialStart, "yyyy-LL-dd'T'HH:mm", { zone: timezone })
          .plus({ hours: 1 })
          .toFormat("yyyy-LL-dd'T'HH:mm"),
  );
  const [typeId, setTypeId] = useState(event?.event_type_id ?? initialTypeId ?? '');
  const [newTypeOpen, setNewTypeOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');
  const [allDay, setAllDay] = useState(event?.all_day ?? false);
  const [isPublic, setIsPublic] = useState(event?.is_public ?? false);
  const [attendance, setAttendance] = useState(event?.attendance_enabled ?? initialType?.attendance_enabled ?? false);
  const [selfRegistration, setSelfRegistration] = useState(event?.self_registration_enabled ?? false);
  const [applyAttendanceToType, setApplyAttendanceToType] = useState(false);
  const [eventFields, setEventFields] = useState(event?.custom_fields ?? []);
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

  const chooseImage = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) {
      setError(t('pages.events.form.invalidImage'));
      return;
    }
    setImage(file);
    setError('');
  };

  const submit = () => {
    if (!name.trim() || (!typeId && !newTypeName.trim()) || !start || !end) {
      setError(t('pages.events.form.required'));
      return;
    }
    onSubmit(
      {
        name: name.trim(),
        description: description.trim(),
        start_datetime: start,
        end_datetime: end,
        ...(typeId ? { type_id: typeId } : {}),
        ...(!typeId && newTypeName.trim()
          ? { new_type: { name: newTypeName.trim(), description: newTypeDescription.trim() } }
          : {}),
        all_day: allDay,
        is_public: isPublic,
        attendance_enabled: attendance,
        self_registration_enabled: attendance && selfRegistration,
        custom_fields: [...typeFields, ...eventFields],
        ...(canUpdateEventType && typeId
          ? {
              apply_attendance_to_type: applyAttendanceToType,
              type_custom_fields: typeFields,
            }
          : {}),
        ...(imageUrl.trim() ? { image_url: imageUrl.trim() } : {}),
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
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField
            autoFocus
            required
            label={t('pages.events.form.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Autocomplete
              fullWidth
              options={eventTypes}
              getOptionLabel={(option) => option.name}
              value={eventTypes.find(({ id }) => id === typeId) ?? null}
              onChange={(_event, value) => {
                setTypeId(value?.id ?? '');
                if (value) {
                  setAttendance(value.attendance_enabled ?? false);
                  setTypeFields(value.custom_fields ?? []);
                  setSaveAttendanceDate(value.save_attendance_date ?? false);
                  setAttendanceDateFieldId(value.attendance_date_person_field_id ?? '');
                }
              }}
              renderInput={(params) => <TextField {...params} required label={t('pages.events.form.type')} />}
            />
            {canCreateEventType ? (
              <Tooltip title={t('pages.events.form.newType')}>
                <IconButton color="primary" onClick={() => setNewTypeOpen(true)}>
                  <AddRoundedIcon />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
          {newTypeOpen ? (
            <Box sx={{ p: 2, border: 1, borderColor: 'divider' }}>
              <Stack spacing={1.5}>
                <Typography fontWeight={600}>{t('pages.events.form.newType')}</Typography>
                <TextField
                  label={t('form.field.name')}
                  value={newTypeName}
                  onChange={(e) => {
                    setNewTypeName(e.target.value);
                    setTypeId('');
                  }}
                />
                <TextField
                  multiline
                  minRows={2}
                  label={t('pages.events.form.description')}
                  value={newTypeDescription}
                  onChange={(e) => setNewTypeDescription(e.target.value)}
                />
                <Button
                  onClick={() => {
                    setNewTypeOpen(false);
                    setNewTypeName('');
                  }}
                >
                  {t('form.field.cancel')}
                </Button>
              </Stack>
            </Box>
          ) : null}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              fullWidth
              type="datetime-local"
              label={t('pages.events.form.start')}
              value={start}
              onChange={(e) => setStart(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              type="datetime-local"
              label={t('pages.events.form.end')}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {t('pages.events.form.timezone', { timezone })}
          </Typography>
          <TextField
            multiline
            minRows={3}
            label={t('pages.events.form.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Box
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              chooseImage(event.dataTransfer.files[0]);
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
              onChange={(e) => chooseImage(e.target.files?.[0])}
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
          <TextField
            label={t('pages.events.form.publicImageUrl')}
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <FormControlLabel
              control={<Switch checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />}
              label={t('pages.events.form.allDay')}
            />
            <FormControlLabel
              control={<Switch checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />}
              label={t('pages.events.form.public')}
            />
            <FormControlLabel
              control={<Switch checked={attendance} onChange={(e) => setAttendance(e.target.checked)} />}
              label={t('pages.events.form.attendance')}
            />
            {attendance ? (
              <FormControlLabel
                control={<Switch checked={selfRegistration} onChange={(e) => setSelfRegistration(e.target.checked)} />}
                label={t('pages.events.form.selfRegistration')}
              />
            ) : null}
          </Stack>
          {attendance && canUpdateEventType && typeId ? (
            <FormControlLabel
              control={
                <Switch
                  checked={applyAttendanceToType}
                  onChange={(_event, checked) => setApplyAttendanceToType(checked)}
                />
              }
              label={t('pages.events.form.applyAttendanceToType')}
            />
          ) : null}
          {attendance ? (
            <>
              <FormControlLabel
                control={
                  <Switch checked={saveAttendanceDate} onChange={(_event, checked) => setSaveAttendanceDate(checked)} />
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
              <EventCustomFieldsEditor
                eventFields={eventFields}
                typeFields={typeFields}
                canUpdateEventType={canUpdateEventType}
                selfRegistration={selfRegistration}
                personFields={personFields}
                onChange={({ eventFields: nextEventFields, typeFields: nextTypeFields }) => {
                  setEventFields(nextEventFields);
                  setTypeFields(nextTypeFields);
                }}
              />
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
