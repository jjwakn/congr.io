import { PersonAutocomplete } from '@components/common/PersonAutocomplete';
import { useAppContext } from '@hooks/useAppContext';
import { useAuth } from '@hooks/useAuth';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { Alert, Button, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { EventParticipantsService } from '@services/eventParticipants';
import { EventsService } from '@services/events';
import { PersonsService } from '@services/persons';
import { UsersService } from '@services/users';
import { httpRequest } from '@utils/http';
import { getModulePath } from '@utils/routes';
import { DateTime } from 'luxon';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import type { EventParticipant } from '@/types/event-participant.types';
import type { CalendarEvent, EventsListResponse } from '@/types/event.types';
import type { Person } from '@/types/person.types';
import { EventRegistrationFields } from './EventRegistrationFields';

export const RegistrationManagement = () => {
  const { t, i18n } = useTranslation();
  const { hasPermission, user, refreshSession } = useAuth();
  const { congregation } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const routeEventId = location.pathname.split('/').filter(Boolean)[1];
  const favoriteTypeId = new URLSearchParams(location.search).get('type');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [person, setPerson] = useState<Person | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const selected = useMemo(() => events.find(({ id }) => id === routeEventId) ?? null, [events, routeEventId]);

  const load = async () => {
    const response = await httpRequest<EventsListResponse>({
      service: EventsService.list,
      data: {
        start: DateTime.now().minus({ years: 1 }).toISO(),
        end: DateTime.now().plus({ years: 2 }).toISO(),
        page: 0,
        size: 500,
        order: 'start_datetime',
        direction: 'ASC',
      },
    });
    setEvents(response.result.filter((event) => event.attendance_enabled));
  };

  useEffect(() => {
    void httpRequest<EventsListResponse>({
      service: EventsService.list,
      data: {
        start: DateTime.now().minus({ years: 1 }).toISO(),
        end: DateTime.now().plus({ years: 2 }).toISO(),
        page: 0,
        size: 500,
        order: 'start_datetime',
        direction: 'ASC',
      },
    }).then((response) => setEvents(response.result.filter((event) => event.attendance_enabled)));
  }, []);

  const loadParticipants = async (eventId: string) => {
    const response = await httpRequest<{ result: EventParticipant[]; total: number }>({
      service: EventParticipantsService.list,
      data: { event_id: eventId, page: 0, size: 500 },
    });
    setParticipants(response.result);
  };

  useEffect(() => {
    if (!routeEventId) return;
    void httpRequest<{ result: EventParticipant[]; total: number }>({
      service: EventParticipantsService.list,
      data: { event_id: routeEventId, page: 0, size: 500 },
    }).then((response) => setParticipants(response.result));
  }, [routeEventId]);

  if (selected) {
    const favoriteId = `registration-type:${selected.event_type_id}`;
    const isFavorite = Boolean(user?.preferences?.favorites?.includes(favoriteId));
    const requiredMissing = selected.custom_fields.some(
      (field) => field.required && (values[field.id] === undefined || values[field.id] === ''),
    );
    return (
      <Stack spacing={2}>
        <Button
          sx={{ alignSelf: 'flex-start' }}
          onClick={() => navigate(getModulePath('event_registration', i18n.language))}
        >
          {t('form.field.back')}
        </Button>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h4">{selected.name}</Typography>
          <Tooltip title={t('pages.registration.favoriteType')}>
            <IconButton
              color={isFavorite ? 'warning' : 'default'}
              onClick={() =>
                void (async () => {
                  const current = user?.preferences?.favorites ?? [];
                  const next = isFavorite
                    ? current.filter((id) => id !== favoriteId)
                    : [...current, favoriteId].slice(0, congregation?.max_favorites ?? 10);
                  await httpRequest({ service: UsersService.updatePreferences, data: { favorites: next } });
                  await refreshSession();
                })()
              }
            >
              {isFavorite ? <StarRoundedIcon /> : <StarBorderRoundedIcon />}
            </IconButton>
          </Tooltip>
          {hasPermission('event_registration', 'lock') ? (
            <Tooltip title={t(selected.registration_locked ? 'pages.registration.unlock' : 'pages.registration.lock')}>
              <IconButton
                onClick={() =>
                  void httpRequest<CalendarEvent>({
                    service: EventsService.setRegistrationLock,
                    data: { id: selected.id, locked: !selected.registration_locked },
                  }).then(load)
                }
              >
                {selected.registration_locked ? <LockOutlinedIcon /> : <LockOpenOutlinedIcon />}
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
        <PersonAutocomplete
          value={person}
          onChange={(nextPerson) => {
            setPerson(nextPerson);
            if (!nextPerson) return;
            setValues(
              Object.fromEntries(
                selected.custom_fields.flatMap((field) => {
                  const mapped = field.person_field_id ? nextPerson.custom_values[field.person_field_id] : undefined;
                  return mapped === undefined ? [] : [[field.id, mapped]];
                }),
              ),
            );
          }}
          label={t('pages.attendance.person')}
        />
        <EventRegistrationFields fields={selected.custom_fields} values={values} onChange={setValues} />
        <Button
          variant="contained"
          disabled={
            !person || requiredMissing || selected.registration_locked || !hasPermission('event_registration', 'create')
          }
          onClick={() =>
            void httpRequest({
              service: EventParticipantsService.create,
              data: { event_id: selected.id, person_id: person?.id, field_values: values },
            }).then(() => {
              setPerson(null);
              setValues({});
              return loadParticipants(selected.id);
            })
          }
        >
          {t('pages.registration.register')}
        </Button>
        <Typography variant="h6">{t('pages.registration.people')}</Typography>
        <Stack spacing={1}>
          {participants.map((participant) => (
            <Stack
              key={participant.id}
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}
            >
              <Typography sx={{ flex: 1 }}>
                {participant.person
                  ? `${participant.person.first_name} ${participant.person.last_name}`
                  : `${String(participant.submitted_person.first_name ?? '')} ${String(participant.submitted_person.last_name ?? '')}`}
              </Typography>
              {!participant.person && participant.possible_person ? (
                <>
                  <Typography variant="body2" color="text.secondary">
                    {t('pages.registration.possiblePerson', {
                      name: `${participant.possible_person.first_name} ${participant.possible_person.last_name}`,
                    })}
                  </Typography>
                  {hasPermission('event_registration', 'update') ? (
                    <Tooltip title={t('pages.registration.confirmMatch')}>
                      <IconButton
                        color="success"
                        onClick={() =>
                          void httpRequest({
                            service: EventParticipantsService.match,
                            data: { id: participant.id, person_id: participant.possible_person?.id },
                          }).then(() => loadParticipants(selected.id))
                        }
                      >
                        <CheckRoundedIcon />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                </>
              ) : null}
              {!participant.person && hasPermission('person', 'create') ? (
                <Tooltip title={t('pages.registration.createPerson')}>
                  <IconButton
                    onClick={() =>
                      void httpRequest<Person>({
                        service: PersonsService.create,
                        data: {
                          first_name: String(participant.submitted_person.first_name ?? ''),
                          last_name: String(participant.submitted_person.last_name ?? ''),
                          phone: String(participant.submitted_person.phone ?? ''),
                          email: String(participant.submitted_person.email ?? '') || undefined,
                        },
                      })
                        .then((created) =>
                          httpRequest({
                            service: EventParticipantsService.match,
                            data: { id: participant.id, person_id: created.id },
                          }),
                        )
                        .then(() => loadParticipants(selected.id))
                    }
                  >
                    <PersonAddAltOutlinedIcon />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Stack>
          ))}
        </Stack>
      </Stack>
    );
  }

  const upcoming = events.filter((event) => DateTime.fromISO(event.end_datetime) >= DateTime.now());
  return (
    <Stack spacing={2}>
      <Typography variant="h5">{t('pages.registration.title')}</Typography>
      {favoriteTypeId && !upcoming.some(({ event_type_id }) => event_type_id === favoriteTypeId) ? (
        <Alert
          severity="warning"
          action={
            hasPermission('event', 'create') ? (
              <Button color="inherit" onClick={() => navigate(`/?createEventType=${favoriteTypeId}`)}>
                {t('pages.registration.createEvent')}
              </Button>
            ) : undefined
          }
        >
          {t('pages.registration.noUpcoming')}
        </Alert>
      ) : null}
      <Stack direction="row" useFlexGap flexWrap="wrap" gap={2}>
        {upcoming.map((event) => (
          <Paper key={event.id} variant="outlined" sx={{ p: 2, width: { xs: '100%', sm: 280 } }}>
            <Typography variant="h6">{event.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {DateTime.fromISO(event.start_datetime).setLocale(i18n.language).toLocaleString(DateTime.DATETIME_MED)}
            </Typography>
            <Button onClick={() => navigate(`${getModulePath('event_registration', i18n.language)}/${event.id}`)}>
              {t('pages.registration.open')}
            </Button>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
};

export default RegistrationManagement;
