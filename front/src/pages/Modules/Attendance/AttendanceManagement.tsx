import { ConfirmDialog } from '@components/common/forms/ConfirmDialog';
import type { ModuleListColumn } from '@components/common/modules/ModuleListTable.types';
import { ModuleRowActions } from '@components/common/modules/ModuleRowActions';
import { ModuleSection } from '@components/common/modules/ModuleSection';
import { useModuleList } from '@components/common/modules/useModuleList';
import { useAuth } from '@hooks/useAuth';
import { useNotificationContext } from '@hooks/useNotifications';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Button,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { EventParticipantsService } from '@services/eventParticipants';
import { EventsService } from '@services/events';
import { PersonFieldsService } from '@services/persons';
import { httpRequest } from '@utils/http';
import { MuiIcon } from '@utils/muiIcons';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EventParticipant } from '@/types/event-participant.types';
import type { CalendarEvent, EventsListResponse } from '@/types/event.types';
import type { JsonValue } from '@/types/json.types';
import type { PersonField } from '@/types/person.types';
import { EventParticipantsEditorDialog } from '../Events/EventParticipantsEditorDialog';
import { PastEventPickerDialog } from '../Events/PastEventPickerDialog';

const formatFieldValue = (value: JsonValue | undefined) => {
  if (Array.isArray(value)) return value.join(', ');
  return String(value ?? '-');
};

const getParticipantName = (participant: EventParticipant) =>
  participant.person ? `${participant.person.first_name} ${participant.person.last_name}` : '';

export const AttendanceManagement = () => {
  const { i18n, t } = useTranslation();
  const { hasPermission } = useAuth();
  const { showNotification } = useNotificationContext();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [historyRows, setHistoryRows] = useState<CalendarEvent[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyDeleting, setHistoryDeleting] = useState(false);
  const [pastEventsLoading, setPastEventsLoading] = useState(false);
  const [tab, setTab] = useState<'today' | 'history'>('today');
  const [eventId, setEventId] = useState('');
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [personFields, setPersonFields] = useState<PersonField[]>([]);
  const [pastEvents, setPastEvents] = useState<CalendarEvent[]>([]);
  const [selectedPastEvent, setSelectedPastEvent] = useState<CalendarEvent | null>(null);
  const [editorEvent, setEditorEvent] = useState<CalendarEvent | null>(null);
  const [editorReadOnly, setEditorReadOnly] = useState(false);
  const [deleteEvent, setDeleteEvent] = useState<CalendarEvent | null>(null);
  const [pastEventPickerOpen, setPastEventPickerOpen] = useState(false);
  const selectedEvent = events.find((event) => event.id === eventId) ?? null;
  const canCreatePerson = hasPermission('person', 'create');
  const canCreatePersonFields = hasPermission('person_field', 'create');
  const canViewPersonFields = hasPermission('person_field', 'get');
  const canCreateAttendance = hasPermission('event_attendance', 'create');
  const canUpdateAttendance = hasPermission('event_attendance', 'update');
  const canDeleteAttendance = hasPermission('event_attendance', 'delete');
  const canDeleteEvent = hasPermission('event', 'delete');
  const historyList = useModuleList({
    moduleKey: 'event-attendance-history',
    defaultSort: 'start_datetime',
    defaultDirection: 'DESC',
  });
  const loadParticipants = useCallback(async (id: string) => {
    if (!id) return;
    const response = await httpRequest<{ result: EventParticipant[]; total: number }>({
      service: EventParticipantsService.attendanceList,
      data: { event_id: id, page: 0, size: 500 },
    });
    setParticipants(response.result);
  }, []);
  const loadEvents = useCallback(async () => {
    const now = DateTime.now();
    const start = now.startOf('day');
    const end = now.plus({ days: 1 }).endOf('day');
    const response = await httpRequest<EventsListResponse>({
      service: EventsService.list,
      data: {
        attendance_enabled: true,
        start: start.toISO(),
        end: end.toISO(),
        page: 0,
        size: 100,
        order: 'start_datetime',
        direction: 'ASC',
      },
    });
    const available = response.result;
    setEvents(available);
    const current =
      available.find(
        (event) => DateTime.fromISO(event.start_datetime) <= now && DateTime.fromISO(event.end_datetime) >= now,
      ) ?? available[0];
    if (current) {
      setEventId(current.id);
      await loadParticipants(current.id);
      return;
    }
    setEventId('');
    setParticipants([]);
  }, [loadParticipants]);

  const loadHistoryEvents = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const now = DateTime.now();
      const response = await httpRequest<EventsListResponse>({
        service: EventsService.list,
        data: {
          end_datetime_to: now.toISO(),
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
      showNotification(value instanceof Error ? value.message : t('pages.attendance.error'), { severity: 'error' });
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

  const loadPastEvents = useCallback(async () => {
    setPastEventsLoading(true);
    try {
      const response = await httpRequest<EventsListResponse>({
        service: EventsService.list,
        data: {
          end_datetime_to: DateTime.now().toISO(),
          page: 0,
          size: 500,
          order: 'start_datetime',
          direction: 'DESC',
        },
      });
      setPastEvents(response.result);
      setSelectedPastEvent(response.result[0] ?? null);
    } catch (value) {
      showNotification(value instanceof Error ? value.message : t('pages.events.errors.load'), { severity: 'error' });
    } finally {
      setPastEventsLoading(false);
    }
  }, [showNotification, t]);

  const openPastEventPicker = useCallback(() => {
    setPastEventPickerOpen(true);
    void loadPastEvents();
  }, [loadPastEvents]);

  useEffect(() => {
    if (tab === 'today') void loadEvents();
    else if (canUpdateAttendance) void loadHistoryEvents();
  }, [canUpdateAttendance, loadEvents, loadHistoryEvents, tab]);
  useEffect(() => {
    if (!canUpdateAttendance && tab === 'history') setTab('today');
  }, [canUpdateAttendance, tab]);
  useEffect(() => {
    if (!canViewPersonFields) return;
    void httpRequest<{ result: PersonField[]; total: number }>({
      service: PersonFieldsService.list,
      data: { page: 0, size: 500, order: 'label', direction: 'ASC' },
    }).then(({ result }) => setPersonFields(result));
  }, [canViewPersonFields]);

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

  const removeHistoryEvent = useCallback(async () => {
    if (!deleteEvent) return;
    setHistoryDeleting(true);
    try {
      await httpRequest({ service: EventsService.remove, data: { id: deleteEvent.id } });
      setDeleteEvent(null);
      await loadHistoryEvents();
      showNotification(t('pages.events.success.deleted'), { severity: 'success' });
    } catch (value) {
      showNotification(value instanceof Error ? value.message : t('pages.events.errors.delete'), { severity: 'error' });
    } finally {
      setHistoryDeleting(false);
    }
  }, [deleteEvent, loadHistoryEvents, showNotification, t]);

  const removeParticipant = useCallback(
    async (participantId: string) => {
      try {
        await httpRequest({ service: EventParticipantsService.attendanceRemove, data: { id: participantId } });
        await loadParticipants(eventId);
      } catch (value) {
        showNotification(value instanceof Error ? value.message : t('pages.attendance.error'), { severity: 'error' });
      }
    },
    [eventId, loadParticipants, showNotification, t],
  );

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
                label: t('pages.attendance.editPeople'),
                icon: EditOutlinedIcon,
                hidden: !canUpdateAttendance,
                disabled: historyLoading,
                onClick: (value) => void openEditor(value),
              },
              {
                id: 'delete',
                label: t('pages.events.actions.delete'),
                icon: DeleteOutlineRoundedIcon,
                color: 'error',
                hidden: !canDeleteEvent,
                disabled: historyLoading,
                onClick: setDeleteEvent,
              },
            ]}
          />
        ),
      },
    ],
    [canDeleteEvent, canUpdateAttendance, historyLoading, i18n.language, openEditor, t],
  );

  return (
    <ModuleSection
      refreshAction={{
        id: 'refresh-attendance',
        label: t('pages.modules.common.refresh'),
        onClick: () =>
          void (tab === 'history' && canUpdateAttendance
            ? loadHistoryEvents()
            : eventId
              ? loadParticipants(eventId)
              : loadEvents()),
      }}
    >
      <Stack spacing={2}>
        <Tabs value={tab} onChange={(_event, value: 'today' | 'history') => setTab(value)}>
          <Tab value="today" label={t('pages.services.attendance.today')} />
          {canUpdateAttendance ? <Tab value="history" label={t('pages.services.attendance.history')} /> : null}
        </Tabs>
        {tab === 'today' ? (
          <>
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
            <Paper variant="outlined">
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('pages.persons.fields.code')}</TableCell>
                      <TableCell>{t('pages.attendance.person')}</TableCell>
                      {selectedEvent?.custom_fields.map((field) => (
                        <TableCell key={field.id}>{field.label}</TableCell>
                      ))}
                      <TableCell align="center">{t('pages.attendance.attended')}</TableCell>
                      <TableCell align="right">{t('pages.settings.congregation.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {participants.length ? (
                      participants.map((participant) => (
                        <TableRow key={participant.id}>
                          <TableCell>{participant.person?.code ?? '-'}</TableCell>
                          <TableCell>
                            {getParticipantName(participant) || t('pages.attendance.publicSubmission')}
                          </TableCell>
                          {selectedEvent?.custom_fields.map((field) => (
                            <TableCell key={`${participant.id}-${field.id}`}>
                              {formatFieldValue(participant.field_values[field.id])}
                            </TableCell>
                          ))}
                          <TableCell align="center">
                            <Switch
                              checked={participant.attended}
                              disabled={!canCreateAttendance}
                              onChange={async (event) => {
                                try {
                                  await httpRequest({
                                    service: EventParticipantsService.setAttendance,
                                    data: { id: participant.id, attended: event.target.checked },
                                  });
                                  await loadParticipants(eventId);
                                } catch (value) {
                                  showNotification(
                                    value instanceof Error ? value.message : t('pages.attendance.error'),
                                    { severity: 'error' },
                                  );
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <ModuleRowActions
                              row={participant}
                              actions={[
                                {
                                  id: 'delete',
                                  label: t('form.common.delete'),
                                  icon: DeleteOutlineRoundedIcon,
                                  color: 'error',
                                  hidden: !canDeleteAttendance,
                                  onClick: (value) => void removeParticipant(value.id),
                                },
                              ]}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={(selectedEvent?.custom_fields.length ?? 0) + 4} align="center">
                          <Typography variant="body2" color="text.secondary">
                            {t('pages.attendance.peopleEmpty')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
            {canCreateAttendance && selectedEvent ? (
              <Button
                startIcon={<PersonAddAltOutlinedIcon />}
                variant="contained"
                onClick={() => void openEditor(selectedEvent)}
              >
                {t('pages.attendance.add')}
              </Button>
            ) : null}
          </>
        ) : canUpdateAttendance ? (
          <ModuleSection<CalendarEvent>
            createAction={
              canCreateAttendance
                ? {
                    id: 'add-missing-attendance-event',
                    label: t('pages.attendance.addMissingEvent'),
                    onClick: openPastEventPicker,
                  }
                : undefined
            }
            refreshAction={{
              id: 'refresh-attendance-history',
              label: t('pages.modules.common.refresh'),
              disabled: historyLoading,
              onClick: () => void loadHistoryEvents(),
            }}
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
              loadingLabel: t('pages.attendance.loading'),
              emptyLabel: t('pages.attendance.empty'),
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
          mode="attendance"
          participants={participants}
          personFields={personFields}
          canAdd={!editorReadOnly && canCreateAttendance}
          canRemove={!editorReadOnly && canDeleteAttendance}
          canUpdateAttendance={!editorReadOnly && canCreateAttendance}
          canCreatePerson={canCreatePerson}
          canCreatePersonFields={canCreatePersonFields}
          readOnly={editorReadOnly}
          onClose={() => setEditorEvent(null)}
          onReload={() => (editorEvent ? loadParticipants(editorEvent.id) : Promise.resolve())}
        />
        <PastEventPickerDialog
          open={pastEventPickerOpen}
          title={t('pages.attendance.selectPastEventTitle')}
          eventLabel={t('pages.attendance.pastEvent')}
          confirmLabel={t('pages.attendance.addMissingEvent')}
          loadingLabel={t('pages.attendance.loading')}
          noOptionsLabel={t('pages.attendance.pastEventsEmpty')}
          events={pastEvents}
          loading={pastEventsLoading}
          selectedEvent={selectedPastEvent}
          onChange={setSelectedPastEvent}
          onClose={() => setPastEventPickerOpen(false)}
          onConfirm={confirmPastEvent}
        />
        <ConfirmDialog
          open={Boolean(deleteEvent)}
          title={t('pages.events.delete.title')}
          message={t('pages.events.delete.message')}
          confirmLabel={t('pages.events.actions.delete')}
          cancelLabel={t('form.field.cancel')}
          confirming={historyDeleting}
          confirmColor="error"
          onClose={() => setDeleteEvent(null)}
          onConfirm={() => void removeHistoryEvent()}
        />
      </Stack>
    </ModuleSection>
  );
};
export default AttendanceManagement;
