import { ConfirmDialog } from '@components/common/forms/ConfirmDialog';
import type { ModuleListColumn, ModuleListHeaderCell } from '@components/common/modules/ModuleListTable.types';
import { ModuleRowActions } from '@components/common/modules/ModuleRowActions';
import { ModuleSection } from '@components/common/modules/ModuleSection';
import {
  CRUD_AUDIT_COLUMN_IDS,
  type CrudAuditColumnId,
  getCrudAuditColumnDefinitions,
} from '@components/common/modules/crudAuditColumns';
import { useModuleColumnVisibility } from '@components/common/modules/useModuleColumnVisibility';
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

const PAST_EVENTS_PAGE_SIZE = 50;
type AttendanceHistoryColumnId = 'id' | 'type' | 'name' | 'start_datetime' | 'actions' | CrudAuditColumnId;
const ATTENDANCE_HISTORY_COLUMN_IDS: AttendanceHistoryColumnId[] = ['id', 'type', 'name', 'start_datetime', 'actions'];
const DEFAULT_ATTENDANCE_HISTORY_VISIBLE_COLUMNS: AttendanceHistoryColumnId[] = [
  'type',
  'name',
  'start_datetime',
  'actions',
];

const formatFieldValue = (value: JsonValue | undefined) => {
  if (Array.isArray(value)) return value.join(', ');
  return String(value ?? '-');
};

const getParticipantName = (participant: EventParticipant) =>
  participant.person ? `${participant.person.first_name} ${participant.person.last_name}` : '';

export const AttendanceManagement = () => {
  const { i18n, t } = useTranslation();
  const { auth, hasPermission } = useAuth();
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
  const [pastEventsPage, setPastEventsPage] = useState(0);
  const [pastEventsTotal, setPastEventsTotal] = useState(0);
  const [pastEventSearch, setPastEventSearch] = useState('');
  const [debouncedPastEventSearch, setDebouncedPastEventSearch] = useState('');
  const [selectedPastEvent, setSelectedPastEvent] = useState<CalendarEvent | null>(null);
  const [editorEvent, setEditorEvent] = useState<CalendarEvent | null>(null);
  const [editorReadOnly, setEditorReadOnly] = useState(false);
  const [captureEventToClear, setCaptureEventToClear] = useState<CalendarEvent | null>(null);
  const [pastEventPickerOpen, setPastEventPickerOpen] = useState(false);
  const selectedEvent = events.find((event) => event.id === eventId) ?? null;
  const canCreatePerson = hasPermission('person', 'create');
  const canCreatePersonFields = hasPermission('person_field', 'create');
  const canViewPersonFields = hasPermission('person_field', 'get');
  const canCreateAttendance = hasPermission('event_attendance', 'create');
  const canUpdateAttendance = hasPermission('event_attendance', 'update');
  const canDeleteAttendance = hasPermission('event_attendance', 'delete');
  const historyList = useModuleList({
    moduleKey: 'event-attendance-history',
    defaultSort: 'start_datetime',
    defaultDirection: 'DESC',
  });
  const historyColumnIds = useMemo<AttendanceHistoryColumnId[]>(
    () => [...ATTENDANCE_HISTORY_COLUMN_IDS, ...(auth?.fullAccess ? CRUD_AUDIT_COLUMN_IDS : [])],
    [auth?.fullAccess],
  );
  const historyColumnVisibility = useModuleColumnVisibility<AttendanceHistoryColumnId>({
    moduleKey: 'event-attendance-history',
    allColumnIds: historyColumnIds,
    defaultVisibleColumnIds: DEFAULT_ATTENDANCE_HISTORY_VISIBLE_COLUMNS,
    fixedColumnIds: ['actions'],
    defaultSearchColumnIds: ['name'],
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
          attendance_enabled: true,
          end_datetime_to: now.toISO(),
          participant_filter: 'with_attendance',
          page: historyList.page,
          size: historyList.pageSize,
          order: historyList.sort,
          direction: historyList.direction,
          columns: historyColumnVisibility.columnsQuery,
          search_columns: historyColumnVisibility.searchColumnsQuery,
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
    historyColumnVisibility.columnsQuery,
    historyColumnVisibility.searchColumnsQuery,
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
            attendance_enabled: true,
            end_datetime_to: DateTime.now().toISO(),
            participant_filter: 'without_attendance',
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

  const clearHistoryAttendance = useCallback(async () => {
    if (!captureEventToClear) return;
    setHistoryDeleting(true);
    try {
      await httpRequest({
        service: EventParticipantsService.clearAttendanceEvent,
        data: { id: captureEventToClear.id },
      });
      setCaptureEventToClear(null);
      await loadHistoryEvents();
      showNotification(t('pages.attendance.deleted'), { severity: 'success' });
    } catch (value) {
      showNotification(value instanceof Error ? value.message : t('pages.attendance.deleteFailed'), {
        severity: 'error',
      });
    } finally {
      setHistoryDeleting(false);
    }
  }, [captureEventToClear, loadHistoryEvents, showNotification, t]);

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

  const historyAuditColumnDefinitions = useMemo(
    () =>
      auth?.fullAccess
        ? getCrudAuditColumnDefinitions<CalendarEvent>({
            language: i18n.language,
            t,
          }).columns
        : [],
    [auth?.fullAccess, i18n.language, t],
  );

  const historyColumnDefinitions = useMemo<
    Array<
      {
        id: AttendanceHistoryColumnId;
        label: string;
        sortKey?: string;
      } & ModuleListColumn<CalendarEvent>
    >
  >(
    () => [
      { id: 'id', label: t('pages.modules.common.id'), minWidth: 260, render: (event) => event.id },
      {
        id: 'type',
        label: t('pages.events.form.type'),
        width: 72,
        align: 'center',
        render: (event) => <MuiIcon name={event.type?.icon} sx={{ color: event.type?.color ?? 'primary.main' }} />,
      },
      {
        id: 'name',
        label: t('pages.events.form.name'),
        sortKey: 'name',
        minWidth: 220,
        render: (event) => event.name,
      },
      {
        id: 'start_datetime',
        label: t('pages.events.form.start'),
        sortKey: 'start_datetime',
        minWidth: 190,
        render: (event) =>
          DateTime.fromISO(event.start_datetime).setLocale(i18n.language).toLocaleString(DateTime.DATETIME_MED),
      },
      ...historyAuditColumnDefinitions,
      {
        id: 'actions',
        label: t('pages.settings.congregation.actions'),
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
                label: t('pages.attendance.deleteAction'),
                icon: DeleteOutlineRoundedIcon,
                color: 'error',
                hidden: !canDeleteAttendance,
                disabled: historyLoading,
                onClick: setCaptureEventToClear,
              },
            ]}
          />
        ),
      },
    ],
    [
      canDeleteAttendance,
      canUpdateAttendance,
      historyAuditColumnDefinitions,
      historyLoading,
      i18n.language,
      openEditor,
      t,
    ],
  );
  const visibleHistoryColumnDefinitions = useMemo(
    () =>
      historyColumnDefinitions.filter(
        (column) => column.id === 'actions' || historyColumnVisibility.visibleColumnIds.includes(column.id),
      ),
    [historyColumnDefinitions, historyColumnVisibility.visibleColumnIds],
  );
  const historyColumns = useMemo<ModuleListColumn<CalendarEvent>[]>(
    () =>
      visibleHistoryColumnDefinitions.map((column) => ({
        id: column.id,
        minWidth: column.minWidth,
        width: column.width,
        align: column.align,
        render: column.render,
      })),
    [visibleHistoryColumnDefinitions],
  );
  const historyHeaderRows = useMemo<ModuleListHeaderCell[][]>(
    () => [
      visibleHistoryColumnDefinitions.map((column) => ({
        id: column.id,
        label: column.label,
        sortKey: column.sortKey,
        align: column.align,
      })),
    ],
    [visibleHistoryColumnDefinitions],
  );

  return (
    <ModuleSection
      createAction={
        tab === 'history' && canUpdateAttendance && canCreateAttendance
          ? {
              id: 'add-missing-attendance-event',
              label: t('pages.attendance.addMissingEvent'),
              onClick: openPastEventPicker,
            }
          : undefined
      }
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
            search={{
              label: t('pages.modules.common.search'),
              value: historyList.search,
              onChange: historyList.setSearch,
            }}
            table={{
              headerRows: historyHeaderRows,
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
              columnVisibility: {
                label: t('pages.modules.common.columns'),
                options: historyColumnDefinitions
                  .filter((column) => column.id !== 'actions')
                  .map((column) => ({ id: column.id, label: column.label })),
                visibleIds: historyColumnVisibility.visibleColumnIds,
                disabled: historyLoading,
                onChange: (value) => historyColumnVisibility.setVisibleColumnIds(value as AttendanceHistoryColumnId[]),
              },
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
          title={t('pages.attendance.deleteTitle')}
          message={t('pages.attendance.deleteMessage', { name: captureEventToClear?.name ?? '' })}
          confirmLabel={t('pages.attendance.deleteAction')}
          cancelLabel={t('form.field.cancel')}
          confirming={historyDeleting}
          confirmColor="error"
          onClose={() => setCaptureEventToClear(null)}
          onConfirm={() => void clearHistoryAttendance()}
        />
      </Stack>
    </ModuleSection>
  );
};
export default AttendanceManagement;
