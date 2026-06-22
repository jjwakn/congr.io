import { PersonAutocomplete } from '@components/common/PersonAutocomplete';
import { useAuth } from '@hooks/useAuth';
import { useNotificationContext } from '@hooks/useNotifications';
import { Button, FormControl, InputLabel, MenuItem, Select, Stack, Switch, Typography } from '@mui/material';
import { EventParticipantsService } from '@services/eventParticipants';
import { EventsService } from '@services/events';
import { httpRequest } from '@utils/http';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EventParticipant } from '@/types/event-participant.types';
import type { CalendarEvent, EventsListResponse } from '@/types/event.types';
import type { Person } from '@/types/person.types';

export const AttendanceManagement = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { showNotification } = useNotificationContext();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventId, setEventId] = useState('');
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [person, setPerson] = useState<Person | null>(null);
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
    await loadParticipants(eventId);
  };
  return (
    <Stack spacing={2}>
      <Typography variant="h5">{t('pages.attendance.title')}</Typography>
      <FormControl>
        <InputLabel>{t('pages.attendance.event')}</InputLabel>
        <Select
          value={eventId}
          label={t('pages.attendance.event')}
          onChange={(e) => {
            setEventId(e.target.value);
            void loadParticipants(e.target.value);
          }}
        >
          {events.map((event) => (
            <MenuItem key={event.id} value={event.id}>
              {event.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {hasPermission('event_attendance', 'create') ? (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <PersonAutocomplete value={person} onChange={setPerson} label={t('pages.attendance.person')} />
          <Button variant="contained" onClick={() => void add()}>
            {t('pages.attendance.add')}
          </Button>
        </Stack>
      ) : null}
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
    </Stack>
  );
};
export default AttendanceManagement;
