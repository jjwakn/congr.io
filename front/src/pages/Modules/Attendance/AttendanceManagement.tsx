import type { ModuleListColumn } from '@components/common/modules/ModuleListTable.types';
import { ModuleRowActions } from '@components/common/modules/ModuleRowActions';
import { ModuleSection } from '@components/common/modules/ModuleSection';
import { useModuleList } from '@components/common/modules/useModuleList';
import { useAuth } from '@hooks/useAuth';
import { useNotificationContext } from '@hooks/useNotifications';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import { Button, MenuItem, Stack, Switch, Tab, Tabs, TextField, Typography } from '@mui/material';
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
import type { PersonField } from '@/types/person.types';
import { EventParticipantsEditorDialog } from '../Events/EventParticipantsEditorDialog';

export const AttendanceManagement = () => {
  const { i18n, t } = useTranslation();
  const { hasPermission } = useAuth();
  const { showNotification } = useNotificationContext();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [historyRows, setHistoryRows] = useState<CalendarEvent[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [tab, setTab] = useState<'today' | 'history'>('today');
  const [eventId, setEventId] = useState('');
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [personFields, setPersonFields] = useState<PersonField[]>([]);
  const [editorEvent, setEditorEvent] = useState<CalendarEvent | null>(null);
  const selectedEvent = events.find((event) => event.id === eventId) ?? null;
  const canCreatePerson = hasPermission('person', 'create');
  const canCreatePersonFields = hasPermission('person_field', 'create');
  const canViewPersonFields = hasPermission('person_field', 'get');
  const canCreateAttendance = hasPermission('event_attendance', 'create');
  const canDeleteAttendance = hasPermission('event_attendance', 'delete');
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
    }
  }, [loadParticipants]);

  const loadHistoryEvents = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const now = DateTime.now();
      const response = await httpRequest<EventsListResponse>({
        service: EventsService.list,
        data: {
          attendance_enabled: true,
          end: now.endOf('day').toISO(),
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

  useEffect(() => {
    if (tab === 'today') void loadEvents();
    else void loadHistoryEvents();
  }, [loadEvents, loadHistoryEvents, tab]);
  useEffect(() => {
    if (!canViewPersonFields) return;
    void httpRequest<{ result: PersonField[]; total: number }>({
      service: PersonFieldsService.list,
      data: { page: 0, size: 500, order: 'label', direction: 'ASC' },
    }).then(({ result }) => setPersonFields(result));
  }, [canViewPersonFields]);

  const openEditor = useCallback(
    async (event: CalendarEvent) => {
      setEditorEvent(event);
      await loadParticipants(event.id);
    },
    [loadParticipants],
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
                id: 'edit',
                label: t('pages.attendance.editPeople'),
                icon: EditOutlinedIcon,
                hidden: !canCreateAttendance && !canDeleteAttendance,
                disabled: historyLoading,
                onClick: (value) => void openEditor(value),
              },
            ]}
          />
        ),
      },
    ],
    [canCreateAttendance, canDeleteAttendance, historyLoading, i18n.language, openEditor, t],
  );

  return (
    <ModuleSection
      refreshAction={{
        id: 'refresh-attendance',
        label: t('pages.modules.common.refresh'),
        onClick: () =>
          void (tab === 'history' ? loadHistoryEvents() : eventId ? loadParticipants(eventId) : loadEvents()),
      }}
    >
      <Stack spacing={2}>
        <Tabs value={tab} onChange={(_event, value: 'today' | 'history') => setTab(value)}>
          <Tab value="today" label={t('pages.services.attendance.today')} />
          <Tab value="history" label={t('pages.services.attendance.history')} />
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
                    disabled={!canCreateAttendance}
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
            {canCreateAttendance && selectedEvent && !selectedEvent.registration_locked ? (
              <Button
                startIcon={<PersonAddAltOutlinedIcon />}
                variant="contained"
                onClick={() => void openEditor(selectedEvent)}
              >
                {t('pages.attendance.add')}
              </Button>
            ) : null}
          </>
        ) : (
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
        )}
        <EventParticipantsEditorDialog
          open={Boolean(editorEvent)}
          event={editorEvent}
          mode="attendance"
          participants={participants}
          personFields={personFields}
          canAdd={canCreateAttendance && !editorEvent?.registration_locked}
          canRemove={canDeleteAttendance}
          canUpdateAttendance={canCreateAttendance}
          canCreatePerson={canCreatePerson}
          canCreatePersonFields={canCreatePersonFields}
          onClose={() => setEditorEvent(null)}
          onReload={() => (editorEvent ? loadParticipants(editorEvent.id) : Promise.resolve())}
        />
      </Stack>
    </ModuleSection>
  );
};
export default AttendanceManagement;
