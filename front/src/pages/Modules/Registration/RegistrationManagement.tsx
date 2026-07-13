import { PersonAutocomplete } from '@components/common/PersonAutocomplete';
import { ConfirmDialog } from '@components/common/forms/ConfirmDialog';
import type { ModuleListColumn } from '@components/common/modules/ModuleListTable.types';
import { ModuleRowActions } from '@components/common/modules/ModuleRowActions';
import { ModuleSection } from '@components/common/modules/ModuleSection';
import { useModuleList } from '@components/common/modules/useModuleList';
import { useAppContext } from '@hooks/useAppContext';
import { useAuth } from '@hooks/useAuth';
import { useNotificationContext } from '@hooks/useNotifications';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { EventParticipantsService } from '@services/eventParticipants';
import { EventsService } from '@services/events';
import { PersonFieldsService, PersonsService } from '@services/persons';
import { UsersService } from '@services/users';
import { httpRequest } from '@utils/http';
import { MuiIcon } from '@utils/muiIcons';
import { getModulePath } from '@utils/routes';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import type { EventParticipant } from '@/types/event-participant.types';
import type { CalendarEvent, EventsListResponse } from '@/types/event.types';
import type { JsonObject, JsonValue } from '@/types/json.types';
import type { Person, PersonField } from '@/types/person.types';
import { EventParticipantsEditorDialog } from '../Events/EventParticipantsEditorDialog';
import { PastEventPickerDialog } from '../Events/PastEventPickerDialog';
import { PersonFormDialog } from '../Persons/PersonFormDialog';
import type { PersonFieldFormValues, PersonFormValues } from '../Persons/persons.types';
import { EventRegistrationFields } from './EventRegistrationFields';

const PAST_EVENTS_PAGE_SIZE = 50;

const getPersonMappedValue = (fieldId: string | undefined, person: Person) => {
  if (!fieldId) return undefined;

  const standardValue = {
    code: person.code,
    first_name: person.first_name,
    middle_name: person.middle_name,
    last_name: person.last_name,
    second_last_name: person.second_last_name,
    married_name: person.married_name,
    phone: person.phone,
    birthdate: person.birthdate,
    email: person.email,
    age: person.registered_age,
  }[fieldId];

  return standardValue ?? person.custom_values[fieldId];
};

const formatFieldValue = (value: JsonValue | undefined) => {
  if (Array.isArray(value)) return value.join(', ');
  return String(value ?? '-');
};

const getParticipantCode = (participant: EventParticipant) =>
  participant.person?.code ?? String(participant.submitted_person.code ?? '-');

const getParticipantName = (participant: EventParticipant) =>
  participant.person
    ? `${participant.person.first_name} ${participant.person.last_name}`
    : `${String(participant.submitted_person.first_name ?? '')} ${String(
        participant.submitted_person.last_name ?? '',
      )}`.trim();

export const RegistrationManagement = () => {
  const { t, i18n } = useTranslation();
  const { hasPermission, user, refreshSession } = useAuth();
  const { showNotification } = useNotificationContext();
  const { congregation } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const routeEventId = location.pathname.split('/').filter(Boolean)[1];
  const favoriteTypeId = new URLSearchParams(location.search).get('type');
  const [tab, setTab] = useState<'today' | 'history'>('today');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [historyRows, setHistoryRows] = useState<CalendarEvent[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyDeleting, setHistoryDeleting] = useState(false);
  const [pastEventsLoading, setPastEventsLoading] = useState(false);
  const [person, setPerson] = useState<Person | null>(null);
  const [personFields, setPersonFields] = useState<PersonField[]>([]);
  const [values, setValues] = useState<JsonObject>({});
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [pastEvents, setPastEvents] = useState<CalendarEvent[]>([]);
  const [pastEventsPage, setPastEventsPage] = useState(0);
  const [pastEventsTotal, setPastEventsTotal] = useState(0);
  const [pastEventSearch, setPastEventSearch] = useState('');
  const [debouncedPastEventSearch, setDebouncedPastEventSearch] = useState('');
  const [selectedPastEvent, setSelectedPastEvent] = useState<CalendarEvent | null>(null);
  const [editorEvent, setEditorEvent] = useState<CalendarEvent | null>(null);
  const [editorReadOnly, setEditorReadOnly] = useState(false);
  const [captureEventToClear, setCaptureEventToClear] = useState<CalendarEvent | null>(null);
  const [pastEventPickerOpen, setPastEventPickerOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [personOpen, setPersonOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const selected = useMemo(() => events.find(({ id }) => id === routeEventId) ?? null, [events, routeEventId]);
  const canCreateRegistration = hasPermission('event_registration', 'create');
  const canUpdateRegistration = hasPermission('event_registration', 'update');
  const canDeleteRegistration = hasPermission('event_registration', 'delete');
  const canCreatePerson = hasPermission('person', 'create');
  const canCreatePersonFields = hasPermission('person_field', 'create');
  const canViewPersonFields = hasPermission('person_field', 'get');
  const historyList = useModuleList({
    moduleKey: 'event-registration-history',
    defaultSort: 'start_datetime',
    defaultDirection: 'DESC',
  });

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!canViewPersonFields) return;
    void httpRequest<{ result: PersonField[]; total: number }>({
      service: PersonFieldsService.list,
      data: { page: 0, size: 500, order: 'label', direction: 'ASC' },
    }).then(({ result }) => setPersonFields(result));
  }, [canViewPersonFields]);

  const loadParticipants = useCallback(async (eventId: string) => {
    const response = await httpRequest<{ result: EventParticipant[]; total: number }>({
      service: EventParticipantsService.list,
      data: { event_id: eventId, page: 0, size: 500 },
    });
    setParticipants(response.result);
  }, []);

  const loadHistoryEvents = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await httpRequest<EventsListResponse>({
        service: EventsService.list,
        data: {
          end_datetime_to: DateTime.now().toISO(),
          participant_filter: 'with_registration',
          page: historyList.page,
          size: historyList.pageSize,
          order: historyList.sort,
          direction: historyList.direction,
          ...(historyList.debouncedSearch ? { search: historyList.debouncedSearch } : {}),
        },
      });
      setHistoryRows(response.result);
      setHistoryTotal(response.total);
    } catch (value) {
      showNotification(value instanceof Error ? value.message : t('pages.registration.loadFailed'), {
        severity: 'error',
      });
    } finally {
      setHistoryLoading(false);
    }
  }, [
    historyList.debouncedSearch,
    historyList.direction,
    historyList.page,
    historyList.pageSize,
    historyList.sort,
    showNotification,
    t,
  ]);

  const loadPastEvents = useCallback(
    async (page: number, search: string, append: boolean) => {
      setPastEventsLoading(true);
      try {
        const response = await httpRequest<EventsListResponse>({
          service: EventsService.list,
          data: {
            end_datetime_to: DateTime.now().toISO(),
            participant_filter: 'without_registration',
            page,
            size: PAST_EVENTS_PAGE_SIZE,
            order: 'start_datetime',
            direction: 'DESC',
            ...(search.trim() ? { search: search.trim() } : {}),
          },
        });
        setPastEvents((current) => (append ? [...current, ...response.result] : response.result));
        setPastEventsPage(page);
        setPastEventsTotal(response.total);
        if (!append) setSelectedPastEvent(null);
      } catch (value) {
        showNotification(value instanceof Error ? value.message : t('pages.events.errors.load'), { severity: 'error' });
      } finally {
        setPastEventsLoading(false);
      }
    },
    [showNotification, t],
  );

  const openPastEventPicker = useCallback(() => {
    setPastEvents([]);
    setPastEventsPage(0);
    setPastEventsTotal(0);
    setPastEventSearch('');
    setDebouncedPastEventSearch('');
    setSelectedPastEvent(null);
    setPastEventPickerOpen(true);
  }, []);

  const loadMorePastEvents = useCallback(() => {
    if (pastEventsLoading || pastEvents.length >= pastEventsTotal) return;
    void loadPastEvents(pastEventsPage + 1, debouncedPastEventSearch, true);
  }, [debouncedPastEventSearch, loadPastEvents, pastEvents.length, pastEventsLoading, pastEventsPage, pastEventsTotal]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedPastEventSearch(pastEventSearch), 600);
    return () => window.clearTimeout(timer);
  }, [pastEventSearch]);

  useEffect(() => {
    if (!pastEventPickerOpen) return;
    void loadPastEvents(0, debouncedPastEventSearch, false);
  }, [debouncedPastEventSearch, loadPastEvents, pastEventPickerOpen]);

  useEffect(() => {
    if (tab === 'history' && canUpdateRegistration) void loadHistoryEvents();
  }, [canUpdateRegistration, loadHistoryEvents, tab]);

  useEffect(() => {
    if (!canUpdateRegistration && tab === 'history') setTab('today');
  }, [canUpdateRegistration, tab]);

  const openEditor = useCallback(
    async (event: CalendarEvent, readOnly = false) => {
      setEditorReadOnly(readOnly);
      setEditorEvent(event);
      await loadParticipants(event.id);
    },
    [loadParticipants],
  );

  const confirmPastEvent = useCallback(() => {
    if (!selectedPastEvent) return;
    setPastEventPickerOpen(false);
    void openEditor(selectedPastEvent);
  }, [openEditor, selectedPastEvent]);

  const clearHistoryRegistration = useCallback(async () => {
    if (!captureEventToClear) return;
    setHistoryDeleting(true);
    try {
      await httpRequest({
        service: EventParticipantsService.clearRegistrationEvent,
        data: { id: captureEventToClear.id },
      });
      setCaptureEventToClear(null);
      await loadHistoryEvents();
      showNotification(t('pages.registration.deleted'), { severity: 'success' });
    } catch (value) {
      showNotification(value instanceof Error ? value.message : t('pages.registration.deleteFailed'), {
        severity: 'error',
      });
    } finally {
      setHistoryDeleting(false);
    }
  }, [captureEventToClear, loadHistoryEvents, showNotification, t]);

  const removeRegisteredParticipant = useCallback(
    async (participantId: string, eventId: string) => {
      try {
        await httpRequest({ service: EventParticipantsService.remove, data: { id: participantId } });
        await loadParticipants(eventId);
      } catch (value) {
        showNotification(value instanceof Error ? value.message : t('pages.registration.loadFailed'), {
          severity: 'error',
        });
      }
    },
    [loadParticipants, showNotification, t],
  );

  const savePerson = async (formValues: PersonFormValues) => {
    setSubmitting(true);
    try {
      const created = await httpRequest<Person>({ service: PersonsService.create, data: formValues });
      setPerson(created);
      setPersonOpen(false);
      setRegisterOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const savePersonField = async (formValues: PersonFieldFormValues) => {
    const created = await httpRequest<PersonField>({ service: PersonFieldsService.create, data: formValues });
    setPersonFields((current) => [...current, created].sort((left, right) => left.label.localeCompare(right.label)));
    return created;
  };

  useEffect(() => {
    if (!routeEventId) return;
    void loadParticipants(routeEventId);
  }, [loadParticipants, routeEventId]);

  const historyColumns = useMemo<ModuleListColumn<CalendarEvent>[]>(
    () => [
      {
        id: 'type',
        width: 72,
        align: 'center',
        render: (event) => <MuiIcon name={event.type?.icon} sx={{ color: event.type?.color ?? 'primary.main' }} />,
      },
      { id: 'name', minWidth: 220, render: (event) => event.name },
      {
        id: 'start_datetime',
        minWidth: 190,
        render: (event) =>
          DateTime.fromISO(event.start_datetime).setLocale(i18n.language).toLocaleString(DateTime.DATETIME_MED),
      },
      {
        id: 'actions',
        minWidth: 120,
        align: 'right',
        render: (event) => (
          <ModuleRowActions
            row={event}
            actions={[
              {
                id: 'view',
                label: t('pages.events.actions.view'),
                icon: VisibilityOutlinedIcon,
                disabled: historyLoading,
                onClick: (value) => void openEditor(value, true),
              },
              {
                id: 'edit',
                label: t('pages.registration.editPeople'),
                icon: EditOutlinedIcon,
                hidden: !canUpdateRegistration,
                disabled: historyLoading,
                onClick: (value) => void openEditor(value),
              },
              {
                id: 'delete',
                label: t('pages.registration.deleteAction'),
                icon: DeleteOutlineRoundedIcon,
                color: 'error',
                hidden: !canDeleteRegistration,
                disabled: historyLoading,
                onClick: setCaptureEventToClear,
              },
            ]}
          />
        ),
      },
    ],
    [canDeleteRegistration, canUpdateRegistration, historyLoading, i18n.language, openEditor, t],
  );

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
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
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
            <MuiIcon name={selected.type?.icon} sx={{ color: selected.type?.color ?? 'primary.main' }} />
            <Typography variant="h4" sx={{ minWidth: 0 }} noWrap>
              {selected.name}
            </Typography>
          </Stack>
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
        <Button
          variant="contained"
          disabled={selected.registration_locked || !canCreateRegistration}
          onClick={() => setRegisterOpen(true)}
        >
          {t('pages.registration.register')}
        </Button>
        <Typography variant="h6">{t('pages.registration.people')}</Typography>
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('pages.persons.fields.code')}</TableCell>
                  <TableCell>{t('pages.attendance.person')}</TableCell>
                  {selected.custom_fields.map((field) => (
                    <TableCell key={field.id}>{field.label}</TableCell>
                  ))}
                  <TableCell align="right">{t('pages.settings.congregation.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {participants.length ? (
                  participants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell>{getParticipantCode(participant)}</TableCell>
                      <TableCell>{getParticipantName(participant) || t('pages.attendance.publicSubmission')}</TableCell>
                      {selected.custom_fields.map((field) => (
                        <TableCell key={`${participant.id}-${field.id}`}>
                          {formatFieldValue(participant.field_values[field.id])}
                        </TableCell>
                      ))}
                      <TableCell align="right">
                        <Stack direction="row" justifyContent="flex-end" spacing={1}>
                          {!participant.person && participant.possible_person ? (
                            <Tooltip
                              title={t('pages.registration.possiblePerson', {
                                name: `${participant.possible_person.first_name} ${participant.possible_person.last_name}`,
                              })}
                            >
                              <span>
                                <IconButton
                                  color="success"
                                  disabled={!canUpdateRegistration}
                                  onClick={() =>
                                    void httpRequest({
                                      service: EventParticipantsService.match,
                                      data: { id: participant.id, person_id: participant.possible_person?.id },
                                    }).then(() => loadParticipants(selected.id))
                                  }
                                >
                                  <CheckRoundedIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          ) : null}
                          {!participant.person && canCreatePerson ? (
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
                          <ModuleRowActions
                            row={participant}
                            actions={[
                              {
                                id: 'delete',
                                label: t('form.common.delete'),
                                icon: DeleteOutlineRoundedIcon,
                                color: 'error',
                                hidden: !canDeleteRegistration || selected.registration_locked,
                                onClick: (value) => void removeRegisteredParticipant(value.id, selected.id),
                              },
                            ]}
                          />
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={selected.custom_fields.length + 3} align="center">
                      <Typography variant="body2" color="text.secondary">
                        {t('pages.registration.peopleEmpty')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        <Dialog open={registerOpen} onClose={() => setRegisterOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">{t('pages.registration.register')}</Typography>
            <IconButton onClick={() => setRegisterOpen(false)} aria-label={t('form.field.close')}>
              <CloseRoundedIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <PersonAutocomplete
                value={person}
                onChange={(nextPerson) => {
                  setPerson(nextPerson);
                  if (!nextPerson) return;
                  setValues(
                    Object.fromEntries(
                      selected.custom_fields.flatMap((field) => {
                        const mapped = getPersonMappedValue(field.person_field_id, nextPerson);
                        return mapped === undefined ? [] : [[field.id, mapped]];
                      }),
                    ),
                  );
                }}
                createLabel={t('pages.attendance.createPerson')}
                onCreate={canCreatePerson ? () => setPersonOpen(true) : undefined}
                label={t('pages.attendance.person')}
              />
              <EventRegistrationFields fields={selected.custom_fields} values={values} onChange={setValues} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRegisterOpen(false)}>{t('form.field.cancel')}</Button>
            <Button
              variant="contained"
              disabled={!person || requiredMissing || selected.registration_locked || submitting}
              onClick={() =>
                void httpRequest({
                  service: EventParticipantsService.create,
                  data: { event_id: selected.id, person_id: person?.id, field_values: values },
                }).then(() => {
                  setPerson(null);
                  setValues({});
                  setRegisterOpen(false);
                  return loadParticipants(selected.id);
                })
              }
            >
              {t('pages.registration.register')}
            </Button>
          </DialogActions>
        </Dialog>
        {personOpen ? (
          <PersonFormDialog
            open
            person={null}
            fields={personFields}
            canCreateFields={canCreatePersonFields}
            submitting={submitting}
            onClose={() => setPersonOpen(false)}
            onSubmit={(formValues) => void savePerson(formValues)}
            onCreateField={savePersonField}
          />
        ) : null}
      </Stack>
    );
  }

  const upcoming = events.filter((event) => DateTime.fromISO(event.end_datetime) >= DateTime.now());
  return (
    <ModuleSection
      createAction={
        tab === 'history' && canUpdateRegistration && canCreateRegistration
          ? {
              id: 'add-missing-registration-event',
              label: t('pages.registration.addMissingEvent'),
              onClick: openPastEventPicker,
            }
          : undefined
      }
      refreshAction={{
        id: 'refresh-registration',
        label: t('pages.modules.common.refresh'),
        onClick: () => void (tab === 'history' && canUpdateRegistration ? loadHistoryEvents() : load()),
      }}
    >
      <Stack spacing={2}>
        <Typography variant="h5">{t('pages.registration.title')}</Typography>
        <Tabs value={tab} onChange={(_event, value: 'today' | 'history') => setTab(value)}>
          <Tab value="today" label={t('pages.registration.today')} />
          {canUpdateRegistration ? <Tab value="history" label={t('pages.registration.history')} /> : null}
        </Tabs>
        {tab === 'today' ? (
          <>
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
                <Paper
                  key={event.id}
                  variant="outlined"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`${getModulePath('event_registration', i18n.language)}/${event.id}`)}
                  onKeyDown={(keyEvent) => {
                    if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                      navigate(`${getModulePath('event_registration', i18n.language)}/${event.id}`);
                    }
                  }}
                  sx={{
                    p: 2,
                    width: { xs: '100%', sm: 280 },
                    cursor: 'pointer',
                    transition: (theme) => theme.transitions.create(['border-color', 'box-shadow']),
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: 4,
                    },
                  }}
                >
                  <Stack direction="row" alignItems="flex-start" spacing={1}>
                    <MuiIcon name={event.type?.icon} sx={{ color: event.type?.color ?? 'primary.main', mt: 0.25 }} />
                    <Typography variant="h6" sx={{ flex: 1 }}>
                      {event.name}
                    </Typography>
                    {event.registration_locked ? <LockOutlinedIcon color="action" /> : null}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {DateTime.fromISO(event.start_datetime)
                      .setLocale(i18n.language)
                      .toLocaleString(DateTime.DATETIME_MED)}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </>
        ) : canUpdateRegistration ? (
          <ModuleSection<CalendarEvent>
            search={{
              label: t('pages.modules.common.search'),
              value: historyList.search,
              onChange: historyList.setSearch,
            }}
            table={{
              headerRows: [
                [
                  { id: 'type', label: t('pages.events.form.type'), align: 'center' },
                  { id: 'name', label: t('pages.events.form.name'), sortKey: 'name' },
                  { id: 'start_datetime', label: t('pages.events.form.start'), sortKey: 'start_datetime' },
                  { id: 'actions', label: t('pages.settings.congregation.actions'), align: 'right' },
                ],
              ],
              columns: historyColumns,
              rows: historyRows,
              getRowId: (row) => row.id,
              loading: historyLoading,
              loadingLabel: t('pages.registration.loading'),
              emptyLabel: t('pages.registration.empty'),
              sort: historyList.sort,
              direction: historyList.direction,
              onSort: historyList.handleSort,
              page: historyList.page,
              pageSize: historyList.pageSize,
              total: historyTotal,
              onPageChange: historyList.handleChangePage,
              onPageSizeChange: historyList.handleChangeRowsPerPage,
              rowsPerPageLabel: t('pages.modules.common.rowsPerPage'),
            }}
          />
        ) : null}
        <EventParticipantsEditorDialog
          open={Boolean(editorEvent)}
          event={editorEvent}
          mode="registration"
          participants={participants}
          personFields={personFields}
          canAdd={!editorReadOnly && canCreateRegistration && !editorEvent?.registration_locked}
          canRemove={!editorReadOnly && canDeleteRegistration}
          canCreatePerson={canCreatePerson}
          canCreatePersonFields={canCreatePersonFields}
          readOnly={editorReadOnly}
          onClose={() => setEditorEvent(null)}
          onReload={() => (editorEvent ? loadParticipants(editorEvent.id) : Promise.resolve())}
        />
        <PastEventPickerDialog
          open={pastEventPickerOpen}
          title={t('pages.registration.selectPastEventTitle')}
          eventLabel={t('pages.registration.pastEvent')}
          confirmLabel={t('pages.registration.addMissingEvent')}
          loadingLabel={t('pages.registration.loading')}
          noOptionsLabel={t('pages.registration.pastEventsEmpty')}
          events={pastEvents}
          hasMore={pastEvents.length < pastEventsTotal}
          loading={pastEventsLoading}
          search={pastEventSearch}
          selectedEvent={selectedPastEvent}
          onChange={setSelectedPastEvent}
          onClose={() => setPastEventPickerOpen(false)}
          onConfirm={confirmPastEvent}
          onLoadMore={loadMorePastEvents}
          onSearchChange={setPastEventSearch}
        />
        <ConfirmDialog
          open={Boolean(captureEventToClear)}
          title={t('pages.registration.deleteTitle')}
          message={t('pages.registration.deleteMessage', { name: captureEventToClear?.name ?? '' })}
          confirmLabel={t('pages.registration.deleteAction')}
          cancelLabel={t('form.field.cancel')}
          confirming={historyDeleting}
          confirmColor="error"
          onClose={() => setCaptureEventToClear(null)}
          onConfirm={() => void clearHistoryRegistration()}
        />
      </Stack>
    </ModuleSection>
  );
};

export default RegistrationManagement;
