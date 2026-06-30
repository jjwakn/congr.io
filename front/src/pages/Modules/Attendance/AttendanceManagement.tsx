import { PersonAutocomplete } from '@components/common/PersonAutocomplete';
import { ModuleSection } from '@components/common/modules/ModuleSection';
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
  MenuItem,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { EventParticipantsService } from '@services/eventParticipants';
import { EventsService } from '@services/events';
import { PersonFieldsService, PersonsService } from '@services/persons';
import { httpRequest } from '@utils/http';
import { MuiIcon } from '@utils/muiIcons';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EventParticipant } from '@/types/event-participant.types';
import type { CalendarEvent, EventsListResponse } from '@/types/event.types';
import type { Person, PersonField } from '@/types/person.types';
import { PersonFormDialog } from '../Persons/PersonFormDialog';
import type { PersonFieldFormValues, PersonFormValues } from '../Persons/persons.types';

export const AttendanceManagement = () => {
  const { i18n, t } = useTranslation();
  const { hasPermission } = useAuth();
  const { showNotification } = useNotificationContext();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tab, setTab] = useState<'today' | 'history'>('today');
  const [eventId, setEventId] = useState('');
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [person, setPerson] = useState<Person | null>(null);
  const [personFields, setPersonFields] = useState<PersonField[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [personOpen, setPersonOpen] = useState(false);
  const [personSubmitting, setPersonSubmitting] = useState(false);
  const selectedEvent = events.find((event) => event.id === eventId) ?? null;
  const canCreatePerson = hasPermission('person', 'create');
  const canCreatePersonFields = hasPermission('person_field', 'create');
  const canViewPersonFields = hasPermission('person_field', 'get');
  const loadParticipants = useCallback(async (id: string) => {
    if (!id) return;
    const response = await httpRequest<{ result: EventParticipant[]; total: number }>({
      service: EventParticipantsService.attendanceList,
      data: { event_id: id, page: 0, size: 500 },
    });
    setParticipants(response.result);
  }, []);
  const loadEvents = useCallback(
    async (mode: 'today' | 'history' = tab) => {
      const now = DateTime.now();
      const start = mode === 'today' ? now.startOf('day') : now.minus({ months: 12 }).startOf('day');
      const end = mode === 'today' ? now.plus({ days: 1 }).endOf('day') : now.endOf('day');
      const response = await httpRequest<EventsListResponse>({
        service: EventsService.list,
        data: { start: start.toISO(), end: end.toISO(), page: 0, size: 100, order: 'start_datetime', direction: 'ASC' },
      });
      const available = response.result.filter((event) => event.attendance_enabled);
      setEvents(available);
      const current =
        available.find(
          (event) => DateTime.fromISO(event.start_datetime) <= now && DateTime.fromISO(event.end_datetime) >= now,
        ) ?? available[0];
      if (current) {
        setEventId(current.id);
        await loadParticipants(current.id);
      }
    },
    [loadParticipants, tab],
  );
  useEffect(() => {
    void loadEvents(tab);
  }, [loadEvents, tab]);
  useEffect(() => {
    if (!canViewPersonFields) return;
    void httpRequest<{ result: PersonField[]; total: number }>({
      service: PersonFieldsService.list,
      data: { page: 0, size: 500, order: 'label', direction: 'ASC' },
    }).then(({ result }) => setPersonFields(result));
  }, [canViewPersonFields]);

  const addPersonToAttendance = async (personId: string) => {
    if (!eventId) return;
    await httpRequest({
      service: EventParticipantsService.attendanceCreate,
      data: { event_id: eventId, person_id: personId, attended: true },
    });
    await loadParticipants(eventId);
  };

  const add = async () => {
    if (!person || !eventId) return;
    await addPersonToAttendance(person.id);
    setPerson(null);
    setAddOpen(false);
  };

  const savePersonField = async (values: PersonFieldFormValues) => {
    try {
      const created = await httpRequest<PersonField>({ service: PersonFieldsService.create, data: values });
      setPersonFields((current) => [...current, created]);
      return created;
    } catch (value) {
      showNotification(value instanceof Error ? value.message : t('pages.persons.fieldsCrud.saveFailed'), {
        severity: 'error',
      });
      return null;
    }
  };

  const createPersonAndAdd = async (values: PersonFormValues) => {
    if (!eventId) return;
    setPersonSubmitting(true);
    try {
      const created = await httpRequest<Person>({ service: PersonsService.create, data: values });
      await addPersonToAttendance(created.id);
      setPerson(created);
      setPersonOpen(false);
      setAddOpen(false);
      showNotification(t('pages.persons.createdWithCode', { code: created.code }), { severity: 'success' });
    } catch (value) {
      showNotification(value instanceof Error ? value.message : t('pages.persons.loadFailed'), {
        severity: 'error',
      });
    } finally {
      setPersonSubmitting(false);
    }
  };
  return (
    <ModuleSection
      refreshAction={{
        id: 'refresh-attendance',
        label: t('pages.modules.common.refresh'),
        onClick: () => void (eventId ? loadParticipants(eventId) : loadEvents(tab)),
      }}
    >
      <Stack spacing={2}>
        <Tabs value={tab} onChange={(_event, value: 'today' | 'history') => setTab(value)}>
          <Tab value="today" label={t('pages.services.attendance.today')} />
          <Tab value="history" label={t('pages.services.attendance.history')} />
        </Tabs>
        {events.length > 1 ? (
          <TextField
            select
            size="small"
            label={t('pages.attendance.event')}
            value={eventId}
            onChange={(event) => {
              setEventId(event.target.value);
              void loadParticipants(event.target.value);
            }}
            sx={{ maxWidth: 420 }}
          >
            {events.map((event) => (
              <MenuItem key={event.id} value={event.id}>
                {event.name}
              </MenuItem>
            ))}
          </TextField>
        ) : null}
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
              direction={{ xs: 'column', md: 'row' }}
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
              sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}
            >
              <Stack sx={{ flex: 1, minWidth: 0 }}>
                <Typography>
                  {participant.person
                    ? `${participant.person.code} · ${participant.person.first_name} ${participant.person.last_name}`
                    : t('pages.attendance.publicSubmission')}
                </Typography>
                {selectedEvent?.custom_fields?.length ? (
                  <Typography variant="caption" color="text.secondary">
                    {selectedEvent.custom_fields
                      .map((field) => `${field.label}: ${String(participant.field_values[field.id] ?? '-')}`)
                      .join(' · ')}
                  </Typography>
                ) : null}
              </Stack>
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
            <PersonAutocomplete
              value={person}
              onChange={setPerson}
              label={t('pages.attendance.person')}
              createLabel={t('pages.attendance.createPerson')}
              onCreate={canCreatePerson ? () => setPersonOpen(true) : undefined}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddOpen(false)}>{t('form.field.cancel')}</Button>
            <Button variant="contained" disabled={!person} onClick={() => void add()}>
              {t('pages.attendance.add')}
            </Button>
          </DialogActions>
        </Dialog>
        <PersonFormDialog
          open={personOpen}
          person={null}
          fields={personFields}
          canCreateFields={canCreatePersonFields}
          submitting={personSubmitting}
          onClose={() => setPersonOpen(false)}
          onSubmit={(values) => void createPersonAndAdd(values)}
          onCreateField={savePersonField}
        />
      </Stack>
    </ModuleSection>
  );
};
export default AttendanceManagement;
