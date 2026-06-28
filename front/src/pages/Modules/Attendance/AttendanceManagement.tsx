import { PersonAutocomplete } from '@components/common/PersonAutocomplete';
import { useAuth } from '@hooks/useAuth';
import { useNotificationContext } from '@hooks/useNotifications';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { EventParticipantsService } from '@services/eventParticipants';
import { EventsService } from '@services/events';
import { httpRequest } from '@utils/http';
import { MuiIcon } from '@utils/muiIcons';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EventParticipant } from '@/types/event-participant.types';
import type { CalendarEvent, EventsListResponse } from '@/types/event.types';
import type { Person } from '@/types/person.types';

export const AttendanceManagement = () => {
  const { i18n, t } = useTranslation();
  const { hasPermission } = useAuth();
  const { showNotification } = useNotificationContext();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventId, setEventId] = useState('');
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [person, setPerson] = useState<Person | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const selectedEvent = events.find((event) => event.id === eventId) ?? null;
  const loadParticipants = useCallback(async (id: string) => {
    if (!id) return;
    const response = await httpRequest<{ result: EventParticipant[]; total: number }>({
      service: EventParticipantsService.attendanceList,
      data: { event_id: id, page: 0, size: 500 },
    });
    setParticipants(response.result);
  }, []);
  useEffect(() => {
    const now = DateTime.now();
    void httpRequest<EventsListResponse>({
      service: EventsService.list,
      data: { start: now.startOf('day').toISO(), end: now.plus({ days: 1 }).endOf('day').toISO(), page: 0, size: 100 },
    }).then(({ result }) => {
      const available = result.filter((event) => event.attendance_enabled);
      setEvents(available);
      const current =
        available.find(
          (event) => DateTime.fromISO(event.start_datetime) <= now && DateTime.fromISO(event.end_datetime) >= now,
        ) ?? available[0];
      if (current) {
        setEventId(current.id);
        void loadParticipants(current.id);
      }
    });
  }, [loadParticipants]);
  const add = async () => {
    if (!person || !eventId) return;
    await httpRequest({
      service: EventParticipantsService.attendanceCreate,
      data: { event_id: eventId, person_id: person.id, attended: true },
    });
    setPerson(null);
    setAddOpen(false);
    await loadParticipants(eventId);
  };
  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        {selectedEvent ? (
          <MuiIcon name={selectedEvent.type?.icon} sx={{ color: selectedEvent.type?.color ?? 'primary.main' }} />
        ) : null}
        <Typography variant="h5">{selectedEvent?.name ?? t('pages.attendance.title')}</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        {selectedEvent
          ? DateTime.fromISO(selectedEvent.start_datetime)
              .setLocale(i18n.language)
              .toLocaleString(DateTime.DATETIME_MED)
          : t('pages.attendance.noCurrentEvent')}
      </Typography>
      <Stack>
        {participants.map((participant) => (
          <Stack
            key={participant.id}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}
          >
            <Typography>
              {participant.person
                ? `${participant.person.first_name} ${participant.person.last_name}`
                : t('pages.attendance.publicSubmission')}
            </Typography>
            <Switch
              checked={participant.attended}
              disabled={!hasPermission('event_attendance', 'create')}
              onChange={async (e) => {
                try {
                  await httpRequest({
                    service: EventParticipantsService.setAttendance,
                    data: { id: participant.id, attended: e.target.checked },
                  });
                  await loadParticipants(eventId);
                } catch (value) {
                  showNotification(value instanceof Error ? value.message : t('pages.attendance.error'), {
                    severity: 'error',
                  });
                }
              }}
            />
          </Stack>
        ))}
      </Stack>
      {hasPermission('event_attendance', 'create') && selectedEvent && !selectedEvent.registration_locked ? (
        <Button startIcon={<PersonAddAltOutlinedIcon />} variant="contained" onClick={() => setAddOpen(true)}>
          {t('pages.attendance.add')}
        </Button>
      ) : null}
      <Dialog open={addOpen} fullWidth maxWidth="sm" onClose={() => setAddOpen(false)}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {t('pages.attendance.add')}
          <IconButton onClick={() => setAddOpen(false)} aria-label={t('form.field.close')}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <PersonAutocomplete value={person} onChange={setPerson} label={t('pages.attendance.person')} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>{t('form.field.cancel')}</Button>
          <Button variant="contained" disabled={!person} onClick={() => void add()}>
            {t('pages.attendance.add')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
export default AttendanceManagement;
