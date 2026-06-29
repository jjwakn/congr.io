import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { MuiIcon } from '@utils/muiIcons';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import type { EventDetailsDialogProps } from './events.types';

const formatDateTime = (value: string, timezone: string, language: string, use12HourTime: boolean) =>
  DateTime.fromISO(value)
    .setZone(timezone)
    .setLocale(language)
    .toLocaleString(use12HourTime ? DateTime.DATETIME_MED : DateTime.DATETIME_MED_WITH_SECONDS);

export const EventDetailsDialog = ({
  event,
  timezone,
  imageUrl,
  use12HourTime,
  onClose,
  onAddToCalendar,
  onShare,
}: EventDetailsDialogProps) => {
  const { i18n, t } = useTranslation();

  return (
    <Dialog open={Boolean(event)} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
          <MuiIcon name={event?.type?.icon} sx={{ color: event?.type?.color ?? 'primary.main' }} />
          <Typography variant="h6" noWrap>
            {event?.name}
          </Typography>
        </Stack>
        <IconButton onClick={onClose} aria-label={t('form.field.close')}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {event && imageUrl ? (
            <Box
              component="img"
              src={imageUrl}
              alt={event.name}
              sx={{ width: '100%', maxHeight: 320, objectFit: 'contain' }}
            />
          ) : null}
          <TextField
            fullWidth
            label={t('pages.events.form.type')}
            value={event?.type?.name ?? ''}
            slotProps={{ input: { readOnly: true } }}
          />
          <TextField
            fullWidth
            label={t('pages.events.form.name')}
            value={event?.name ?? ''}
            slotProps={{ input: { readOnly: true } }}
          />
          <TextField
            fullWidth
            multiline
            minRows={3}
            label={t('pages.events.form.description')}
            value={event?.description ?? ''}
            slotProps={{ input: { readOnly: true } }}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              fullWidth
              label={t('pages.events.form.start')}
              value={event ? formatDateTime(event.start_datetime, timezone, i18n.language, use12HourTime) : ''}
              slotProps={{ input: { readOnly: true } }}
            />
            <TextField
              fullWidth
              label={t('pages.events.form.end')}
              value={event ? formatDateTime(event.end_datetime, timezone, i18n.language, use12HourTime) : ''}
              slotProps={{ input: { readOnly: true } }}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch checked={Boolean(event?.all_day)} disabled />
              <Typography>{t('pages.events.form.allDay')}</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch checked={Boolean(event?.is_public)} disabled />
              <Typography>{t('pages.events.form.public')}</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch checked={Boolean(event?.attendance_enabled)} disabled />
              <Typography>{t('pages.events.form.attendance')}</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch checked={Boolean(event?.self_registration_enabled)} disabled />
              <Typography>{t('pages.events.form.selfRegistration')}</Typography>
            </Stack>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Switch checked={Boolean(event?.save_attendance_date)} disabled />
            <Typography>{t('pages.events.form.saveAttendanceDate')}</Typography>
          </Stack>
          {event?.custom_fields.length ? (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('pages.events.form.tabs.fields')}
              </Typography>
              <Stack spacing={1}>
                {event.custom_fields.map((field) => (
                  <TextField
                    key={field.id}
                    fullWidth
                    label={field.label}
                    value={t(`pages.events.fields.types.${field.type}`)}
                    slotProps={{ input: { readOnly: true } }}
                  />
                ))}
              </Stack>
            </Box>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        {event ? (
          <Button onClick={() => onAddToCalendar(event)}>{t('pages.events.actions.addToCalendar')}</Button>
        ) : null}
        {event?.is_public && event.public_id ? (
          <Button onClick={() => onShare(event)}>{t('pages.events.actions.share')}</Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
};
