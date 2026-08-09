import { ViewDialog } from '@components/common/forms/ViewDialog';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Box, Chip, IconButton, Stack, Switch, TextField, Tooltip, Typography } from '@mui/material';
import { MuiIcon } from '@utils/muiIcons';
import { useTranslation } from 'react-i18next';
import type { EventTypeDetailsDialogProps } from './eventTypes.types';

export const EventTypeDetailsDialog = ({
  open,
  eventType,
  editDisabled,
  onClose,
  onEdit,
}: EventTypeDetailsDialogProps) => {
  const { t } = useTranslation();
  const editLabel = t('pages.settings.eventTypes.actions.edit');

  return (
    <ViewDialog
      open={open}
      title={t('pages.settings.eventTypes.dialogs.viewTitle')}
      closeLabel={t('form.field.close')}
      onClose={onClose}
      titleAction={
        <Tooltip title={editLabel}>
          <span>
            <IconButton onClick={onEdit} disabled={editDisabled} aria-label={editLabel}>
              <EditOutlinedIcon />
            </IconButton>
          </span>
        </Tooltip>
      }
    >
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <MuiIcon name={eventType?.icon} sx={{ color: eventType?.color ?? 'primary.main' }} />
            <TextField
              label={t('pages.settings.eventTypes.fields.icon')}
              value={eventType?.icon ?? ''}
              slotProps={{ input: { readOnly: true } }}
            />
          </Stack>
          <TextField
            type="color"
            label={t('pages.settings.eventTypes.fields.color')}
            value={eventType?.color ?? '#1976d2'}
            InputLabelProps={{ shrink: true }}
            slotProps={{ input: { readOnly: true } }}
          />
        </Stack>
        <TextField
          fullWidth
          label={t('form.field.name')}
          value={eventType?.name ?? ''}
          slotProps={{ input: { readOnly: true } }}
        />
        <TextField
          fullWidth
          multiline
          minRows={3}
          label={t('pages.settings.eventTypes.fields.description')}
          value={eventType?.description ?? ''}
          slotProps={{ input: { readOnly: true } }}
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Switch checked={Boolean(eventType?.attendance_enabled)} disabled />
            <Typography>{t('pages.settings.eventTypes.fields.attendance')}</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Switch checked={Boolean(eventType?.default_public)} disabled />
            <Typography>{t('pages.settings.eventTypes.fields.defaultPublic')}</Typography>
          </Stack>
          {eventType?.default_public ? (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch checked={Boolean(eventType?.default_self_registration)} disabled />
              <Typography>{t('pages.settings.eventTypes.fields.defaultSelfRegistration')}</Typography>
            </Stack>
          ) : null}
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            fullWidth
            label={t('pages.settings.eventTypes.fields.defaultStartTime')}
            value={eventType?.default_start_time?.slice(0, 5) ?? ''}
            slotProps={{ input: { readOnly: true } }}
          />
          <TextField
            fullWidth
            label={t('pages.settings.eventTypes.fields.defaultDuration')}
            value={eventType?.default_duration_minutes ?? ''}
            slotProps={{ input: { readOnly: true } }}
          />
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Switch checked={Boolean(eventType?.save_attendance_date)} disabled />
          <Typography>{t('pages.events.form.saveAttendanceDate')}</Typography>
        </Stack>
        <TextField
          fullWidth
          label={t('pages.events.form.attendanceDateField')}
          value={eventType?.attendance_date_person_field_id ?? ''}
          slotProps={{ input: { readOnly: true } }}
        />
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t('pages.settings.eventTypes.tabs.customFields')}
          </Typography>
          <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
            {(eventType?.custom_fields ?? []).map((field) => (
              <Chip
                key={field.id}
                label={`${field.label} · ${t(`pages.events.fields.types.${field.type}`)}`}
                variant="outlined"
              />
            ))}
          </Stack>
        </Box>
      </Stack>
    </ViewDialog>
  );
};
