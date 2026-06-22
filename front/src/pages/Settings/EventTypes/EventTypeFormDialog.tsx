import { CreateEditDialog } from '@components/common/forms/CreateEditDialog';
import { FormControlLabel, Switch, TextField, Typography } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [attendanceEnabled, setAttendanceEnabled] = useState(false);
  const [color, setColor] = useState('#1976d2');
  const [nameError, setNameError] = useState('');

  const resetState = useCallback(() => {
    setName(eventType?.name ?? '');
    setDescription(eventType?.description ?? '');
    setEnabled(eventType?.enabled ?? true);
    setAttendanceEnabled(eventType?.attendance_enabled ?? false);
    setColor(eventType?.color ?? '#1976d2');
    setNameError('');
  }, [eventType]);

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
    onSubmit({
      name: normalizedName,
      description: description.trim(),
      enabled,
      attendance_enabled: attendanceEnabled,
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
