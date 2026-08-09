import { DialogTitleBar } from '@components/common/forms/DialogTitleBar';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { MuiIcon } from '@utils/muiIcons';
import { DateTime } from 'luxon';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EventCustomFieldsEditor } from './EventCustomFieldsEditor';
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
  canEdit = false,
  personFields,
  use12HourTime,
  onClose,
  onAddToCalendar,
  onEdit,
  onShare,
}: EventDetailsDialogProps) => {
  const { i18n, t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'details' | 'fields'>('details');
  const typeFieldIds = useMemo(
    () => new Set((event?.type?.custom_fields ?? []).map(({ id }) => id)),
    [event?.type?.custom_fields],
  );
  const typeFields = useMemo(
    () => (event?.custom_fields ?? []).filter(({ id }) => typeFieldIds.has(id)),
    [event?.custom_fields, typeFieldIds],
  );
  const eventFields = useMemo(
    () => (event?.custom_fields ?? []).filter(({ id }) => !typeFieldIds.has(id)),
    [event?.custom_fields, typeFieldIds],
  );

  return (
    <Dialog open={Boolean(event)} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitleBar
        title={
          <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
            <MuiIcon name={event?.type?.icon} sx={{ color: event?.type?.color ?? 'primary.main' }} />
            <Typography variant="h6" noWrap>
              {event?.name}
            </Typography>
          </Stack>
        }
        action={
          canEdit && event && onEdit ? (
            <Button startIcon={<EditOutlinedIcon />} onClick={() => onEdit(event)}>
              {t('pages.events.actions.edit')}
            </Button>
          ) : undefined
        }
        onClose={onClose}
      />
      <DialogContent dividers>
        <Tabs value={activeTab} onChange={(_event, value) => setActiveTab(value)} sx={{ mb: 2 }}>
          <Tab value="details" label={t('pages.events.form.tabs.details')} />
          <Tab value="fields" label={t('pages.events.form.tabs.fields')} />
        </Tabs>
        {activeTab === 'details' ? (
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
              {event?.is_public ? (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Switch checked={Boolean(event?.self_registration_enabled)} disabled />
                  <Typography>{t('pages.events.form.selfRegistration')}</Typography>
                </Stack>
              ) : null}
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch checked={Boolean(event?.save_attendance_date)} disabled />
              <Typography>{t('pages.events.form.saveAttendanceDate')}</Typography>
            </Stack>
          </Stack>
        ) : (
          <EventCustomFieldsEditor
            eventFields={eventFields}
            typeFields={typeFields}
            canUpdateEventType={false}
            selfRegistration={Boolean(event?.is_public && event.self_registration_enabled)}
            personFields={personFields}
            readOnly
            canAddFields={false}
            onChange={() => undefined}
          />
        )}
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
