import { ConfirmDialog } from '@components/common/forms/ConfirmDialog';
import { LocalizedDateField } from '@components/common/forms/LocalizedDateField';
import { CrudPermissionStatus } from '@components/common/modules/CrudPermissionStatus';
import type { ModuleListColumn, ModuleListHeaderCell } from '@components/common/modules/ModuleListTable.types';
import { ModuleRowActions } from '@components/common/modules/ModuleRowActions';
import { ModuleSection } from '@components/common/modules/ModuleSection';
import type { ModuleSectionAction } from '@components/common/modules/ModuleSectionActions.types';
import { useModuleList } from '@components/common/modules/useModuleList';
import { useAppContext } from '@hooks/useAppContext';
import { useAuth } from '@hooks/useAuth';
import { useNotificationContext } from '@hooks/useNotifications';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ViewColumnRoundedIcon from '@mui/icons-material/ViewColumnRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Button, FormControlLabel, Menu, MenuItem, Popover, Stack, Switch, Typography } from '@mui/material';
import { EventTypesService } from '@services/eventTypes';
import { EventsService } from '@services/events';
import { FilesService } from '@services/files';
import { API_URL } from '@utils/constants';
import { persistNewEventFields } from '@utils/event-fields';
import { resolveEventFieldPersonLinks } from '@utils/eventFieldLinks';
import { httpRequest } from '@utils/http';
import { MuiIcon } from '@utils/muiIcons';
import { getPreloadedResource } from '@utils/preload';
import { DateTime } from 'luxon';
import { type MouseEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EventType } from '@/types/event-type.types';
import type { CalendarEvent, EventsListResponse } from '@/types/event.types';
import { EventDetailsDialog } from './EventDetailsDialog';
import { EventEditorDialog } from './EventEditorDialog';
import type { EventFormValues } from './events.types';

type BooleanFilterValue = 'all' | 'yes' | 'no';
type EventBooleanFilterKey = 'enabled' | 'all_day' | 'is_public' | 'attendance_enabled' | 'self_registration_enabled';
type EventDateFilterKey = 'start_datetime' | 'end_datetime';
type EventFilterKey = EventBooleanFilterKey | EventDateFilterKey;
type EventColumnId =
  | 'icon'
  | 'name'
  | 'type'
  | 'start_datetime'
  | 'end_datetime'
  | 'all_day'
  | 'is_public'
  | 'attendance_enabled'
  | 'self_registration_enabled'
  | 'enabled'
  | 'actions';

interface DateFilterState {
  from: string;
  to: string;
}

interface EventColumnDefinition {
  id: EventColumnId;
  label: string;
  sortKey?: string;
  minWidth?: number;
  width?: number;
  align?: ModuleListColumn<CalendarEvent>['align'];
  filterKey?: EventFilterKey;
  fixed?: boolean;
  render: (event: CalendarEvent) => ReactNode;
}

const DEFAULT_VISIBLE_COLUMNS: EventColumnId[] = [
  'icon',
  'name',
  'type',
  'start_datetime',
  'end_datetime',
  'all_day',
  'is_public',
  'attendance_enabled',
  'enabled',
  'actions',
];

const BOOLEAN_FILTERS: EventBooleanFilterKey[] = [
  'enabled',
  'all_day',
  'is_public',
  'attendance_enabled',
  'self_registration_enabled',
];

const DATE_FILTERS: EventDateFilterKey[] = ['start_datetime', 'end_datetime'];

const toImageUrl = (event: CalendarEvent) =>
  event.image_file_id
    ? `${API_URL.replace(/\/$/, '')}/files/${event.is_public ? 'public/' : ''}${event.image_file_id}`
    : (event.image_url ?? '');

const formatEventDateTime = ({
  value,
  timezone,
  language,
  use12HourTime,
}: {
  value: string;
  timezone: string;
  language: string;
  use12HourTime: boolean;
}) =>
  DateTime.fromISO(value)
    .setZone(timezone)
    .setLocale(language)
    .toLocaleString(use12HourTime ? DateTime.DATETIME_MED : DateTime.DATETIME_MED_WITH_SECONDS);

const toFilterIso = (date: string, timezone: string, edge: 'start' | 'end') => {
  if (!date) return undefined;

  const parsed = DateTime.fromISO(date, { zone: timezone });
  if (!parsed.isValid) return undefined;

  return (edge === 'start' ? parsed.startOf('day') : parsed.endOf('day')).toUTC().toISO() ?? undefined;
};

const hasDateFilter = (filter: DateFilterState) => Boolean(filter.from || filter.to);

export const EventsManagement = () => {
  const { i18n, t } = useTranslation();
  const { congregation } = useAppContext();
  const { hasPermission, user } = useAuth();
  const { showNotification } = useNotificationContext();
  const cached = getPreloadedResource<EventsListResponse>('events');
  const [rows, setRows] = useState<CalendarEvent[]>(cached?.result ?? []);
  const [total, setTotal] = useState(cached?.total ?? 0);
  const [loading, setLoading] = useState(false);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [editor, setEditor] = useState<{ event: CalendarEvent | null }>();
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<CalendarEvent | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [columnAnchor, setColumnAnchor] = useState<HTMLElement | null>(null);
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  const [activeFilter, setActiveFilter] = useState<EventFilterKey | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<EventColumnId[]>(DEFAULT_VISIBLE_COLUMNS);
  const [booleanFilters, setBooleanFilters] = useState<Record<EventBooleanFilterKey, BooleanFilterValue>>({
    enabled: 'all',
    all_day: 'all',
    is_public: 'all',
    attendance_enabled: 'all',
    self_registration_enabled: 'all',
  });
  const [dateFilters, setDateFilters] = useState<Record<EventDateFilterKey, DateFilterState>>({
    start_datetime: { from: '', to: '' },
    end_datetime: { from: '', to: '' },
  });
  const canCreate = hasPermission('event', 'create');
  const canUpdate = hasPermission('event', 'update');
  const canDelete = hasPermission('event', 'delete');
  const canCreateType = hasPermission('event_type', 'create');
  const canViewType = hasPermission('event_type', 'get');
  const canViewPersonFields = hasPermission('person_field', 'get');
  const canViewEventFields = hasPermission('event_field', 'get');
  const canCreateEventFields = hasPermission('event_field', 'create');
  const timezone = congregation?.timezone ?? 'UTC';
  const use12HourTime = user?.preferences?.time_format === '12h';
  const list = useModuleList({
    moduleKey: 'events-list',
    defaultSort: 'start_datetime',
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const startFrom = toFilterIso(dateFilters.start_datetime.from, timezone, 'start');
      const startTo = toFilterIso(dateFilters.start_datetime.to, timezone, 'end');
      const endFrom = toFilterIso(dateFilters.end_datetime.from, timezone, 'start');
      const endTo = toFilterIso(dateFilters.end_datetime.to, timezone, 'end');
      const response = await httpRequest<EventsListResponse>({
        service: EventsService.list,
        data: {
          page: list.page,
          size: list.pageSize,
          order: list.sort,
          direction: list.direction,
          ...(list.debouncedSearch ? { search: list.debouncedSearch } : {}),
          ...(booleanFilters.enabled !== 'all' ? { enabled: booleanFilters.enabled === 'yes' } : {}),
          ...(booleanFilters.all_day !== 'all' ? { all_day: booleanFilters.all_day === 'yes' } : {}),
          ...(booleanFilters.is_public !== 'all' ? { is_public: booleanFilters.is_public === 'yes' } : {}),
          ...(booleanFilters.attendance_enabled !== 'all'
            ? { attendance_enabled: booleanFilters.attendance_enabled === 'yes' }
            : {}),
          ...(booleanFilters.self_registration_enabled !== 'all'
            ? { self_registration_enabled: booleanFilters.self_registration_enabled === 'yes' }
            : {}),
          ...(startFrom ? { start_datetime_from: startFrom } : {}),
          ...(startTo ? { start_datetime_to: startTo } : {}),
          ...(endFrom ? { end_datetime_from: endFrom } : {}),
          ...(endTo ? { end_datetime_to: endTo } : {}),
        },
      });
      setRows(response.result ?? []);
      setTotal(response.total);
    } catch (value) {
      showNotification(value instanceof Error ? value.message : t('pages.events.errors.load'), { severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [
    booleanFilters,
    dateFilters,
    list.debouncedSearch,
    list.direction,
    list.page,
    list.pageSize,
    list.sort,
    showNotification,
    t,
    timezone,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!canViewType) return;

    void httpRequest<{ result: EventType[]; total: number }>({
      service: EventTypesService.list,
      data: { page: 0, size: 500, order: 'name', direction: 'ASC' },
    })
      .then(({ result }) => setEventTypes(result ?? []))
      .catch((value) =>
        showNotification(value instanceof Error ? value.message : t('pages.events.errors.types'), {
          severity: 'error',
        }),
      );
  }, [canViewType, showNotification, t]);

  const saveEvent = async (values: EventFormValues, image?: File) => {
    setSubmitting(true);
    try {
      const eventFieldIds = new Set(values.event_fields.map(({ id }) => id));
      const resolvedCustomFields = await resolveEventFieldPersonLinks(values.custom_fields);
      const resolvedEventFields = resolvedCustomFields.filter(({ id }) => eventFieldIds.has(id));
      const inheritedFields = resolvedCustomFields.filter(({ id }) => !eventFieldIds.has(id));
      const persistedEventFields = canCreateEventFields
        ? await persistNewEventFields(resolvedEventFields)
        : resolvedEventFields;
      const { event_fields: _eventFields, ...eventValues } = values;
      let imageFileId = editor?.event?.image_file_id ?? undefined;
      if (image) {
        const form = new FormData();
        form.append('file', image);
        const uploaded = await httpRequest<{ id: string }>({ service: FilesService.uploadEventImage, data: form });
        imageFileId = uploaded.id;
      }
      await httpRequest({
        service: editor?.event ? EventsService.update : EventsService.create,
        data: {
          ...(editor?.event ? { id: editor.event.id } : {}),
          ...eventValues,
          custom_fields: [...inheritedFields, ...persistedEventFields],
          ...(imageFileId ? { image_file_id: imageFileId } : {}),
        },
      });
      setEditor(undefined);
      await refresh();
      showNotification(t('pages.events.success.saved'), { severity: 'success' });
    } catch (value) {
      showNotification(value instanceof Error ? value.message : t('pages.events.errors.save'), { severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const removeEvent = async () => {
    if (!deleteEvent) return;

    setSubmitting(true);
    try {
      await httpRequest({ service: EventsService.remove, data: { id: deleteEvent.id } });
      setDeleteEvent(null);
      await refresh();
      showNotification(t('pages.events.success.deleted'), { severity: 'success' });
    } catch (value) {
      showNotification(value instanceof Error ? value.message : t('pages.events.errors.delete'), { severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const addToCalendar = (event: CalendarEvent) => {
    const start = DateTime.fromISO(event.start_datetime).toUTC().toFormat("yyyyLLdd'T'HHmmss'Z'");
    const end = DateTime.fromISO(event.end_datetime).toUTC().toFormat("yyyyLLdd'T'HHmmss'Z'");
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `UID:${event.id}@congr.io`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${event.name.replace(/\n/g, ' ')}`,
      `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${event.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'event'}.ics`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const shareEvent = async (event: CalendarEvent) => {
    if (!event.is_public || !event.public_id) return;
    await navigator.clipboard.writeText(`${window.location.origin}/e/${event.public_id}`);
    showNotification(t('pages.events.success.linkCopied'), { severity: 'success' });
  };

  const openFilter = useCallback(
    (filterKey: EventFilterKey) => (event: MouseEvent<HTMLElement>) => {
      setActiveFilter(filterKey);
      setFilterAnchor(event.currentTarget);
    },
    [],
  );

  const isFilterActive = useCallback(
    (filterKey?: EventFilterKey) => {
      if (!filterKey) return false;
      if (BOOLEAN_FILTERS.includes(filterKey as EventBooleanFilterKey)) {
        return booleanFilters[filterKey as EventBooleanFilterKey] !== 'all';
      }
      return hasDateFilter(dateFilters[filterKey as EventDateFilterKey]);
    },
    [booleanFilters, dateFilters],
  );

  const setBooleanFilter = (filterKey: EventBooleanFilterKey, value: BooleanFilterValue) => {
    list.setPage(0);
    setBooleanFilters((current) => ({ ...current, [filterKey]: value }));
    setFilterAnchor(null);
    setActiveFilter(null);
  };

  const setDateFilter = (filterKey: EventDateFilterKey, edge: keyof DateFilterState, value: string) => {
    list.setPage(0);
    setDateFilters((current) => ({
      ...current,
      [filterKey]: {
        ...current[filterKey],
        [edge]: value,
      },
    }));
  };

  const clearDateFilter = (filterKey: EventDateFilterKey) => {
    list.setPage(0);
    setDateFilters((current) => ({ ...current, [filterKey]: { from: '', to: '' } }));
    setFilterAnchor(null);
    setActiveFilter(null);
  };

  const columnsDefinitions = useMemo<EventColumnDefinition[]>(
    () => [
      {
        id: 'icon',
        label: '',
        width: 64,
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
        id: 'type',
        label: t('pages.events.form.type'),
        sortKey: 'event_type_id',
        minWidth: 180,
        render: (event) => event.type?.name ?? t('pages.modules.common.emptyValue'),
      },
      {
        id: 'start_datetime',
        label: t('pages.events.form.start'),
        sortKey: 'start_datetime',
        filterKey: 'start_datetime',
        minWidth: 190,
        render: (event) =>
          formatEventDateTime({
            value: event.start_datetime,
            timezone,
            language: i18n.language,
            use12HourTime,
          }),
      },
      {
        id: 'end_datetime',
        label: t('pages.events.form.end'),
        sortKey: 'end_datetime',
        filterKey: 'end_datetime',
        minWidth: 190,
        render: (event) =>
          formatEventDateTime({
            value: event.end_datetime,
            timezone,
            language: i18n.language,
            use12HourTime,
          }),
      },
      {
        id: 'all_day',
        label: t('pages.events.form.allDay'),
        sortKey: 'all_day',
        filterKey: 'all_day',
        width: 130,
        align: 'center',
        render: (event) => <CrudPermissionStatus enabled={Boolean(event.all_day)} />,
      },
      {
        id: 'is_public',
        label: t('pages.events.form.public'),
        sortKey: 'is_public',
        filterKey: 'is_public',
        width: 130,
        align: 'center',
        render: (event) => <CrudPermissionStatus enabled={Boolean(event.is_public)} />,
      },
      {
        id: 'attendance_enabled',
        label: t('pages.events.form.attendance'),
        sortKey: 'attendance_enabled',
        filterKey: 'attendance_enabled',
        width: 150,
        align: 'center',
        render: (event) => <CrudPermissionStatus enabled={Boolean(event.attendance_enabled)} />,
      },
      {
        id: 'self_registration_enabled',
        label: t('pages.events.form.selfRegistration'),
        sortKey: 'self_registration_enabled',
        filterKey: 'self_registration_enabled',
        width: 170,
        align: 'center',
        render: (event) => <CrudPermissionStatus enabled={Boolean(event.self_registration_enabled)} />,
      },
      {
        id: 'enabled',
        label: t('pages.modules.users.columns.enabled'),
        sortKey: 'enabled',
        filterKey: 'enabled',
        width: 120,
        align: 'center',
        render: (event) => <CrudPermissionStatus enabled={Boolean(event.enabled)} />,
      },
      {
        id: 'actions',
        label: t('pages.settings.congregation.actions'),
        minWidth: 150,
        align: 'right',
        fixed: true,
        render: (event) => (
          <ModuleRowActions
            row={event}
            actions={[
              {
                id: 'view',
                label: t('pages.events.actions.view'),
                icon: VisibilityOutlinedIcon,
                disabled: loading,
                onClick: setDetailEvent,
              },
              {
                id: 'edit',
                label: t('pages.events.actions.edit'),
                icon: EditOutlinedIcon,
                hidden: !canUpdate,
                disabled: loading,
                onClick: (value) => setEditor({ event: value }),
              },
              {
                id: 'delete',
                label: t('pages.events.actions.delete'),
                icon: DeleteOutlineRoundedIcon,
                color: 'error',
                hidden: !canDelete,
                disabled: loading,
                onClick: setDeleteEvent,
              },
            ]}
          />
        ),
      },
    ],
    [canDelete, canUpdate, i18n.language, loading, t, timezone, use12HourTime],
  );

  const visibleColumnDefinitions = useMemo(
    () => columnsDefinitions.filter((column) => column.fixed || visibleColumns.includes(column.id)),
    [columnsDefinitions, visibleColumns],
  );

  const columns = useMemo<ModuleListColumn<CalendarEvent>[]>(
    () =>
      visibleColumnDefinitions.map((column) => ({
        id: column.id,
        align: column.align,
        minWidth: column.minWidth,
        width: column.width,
        render: column.render,
      })),
    [visibleColumnDefinitions],
  );

  const headerRows = useMemo<ModuleListHeaderCell[][]>(
    () => [
      visibleColumnDefinitions.map((column) => ({
        id: column.id,
        label: column.label,
        sortKey: column.sortKey,
        align: column.align,
        filter: column.filterKey
          ? {
              active: isFilterActive(column.filterKey),
              disabled: loading,
              label: t('pages.modules.common.filter'),
              onClick: openFilter(column.filterKey),
            }
          : undefined,
      })),
    ],
    [isFilterActive, loading, openFilter, t, visibleColumnDefinitions],
  );

  const extraActions = useMemo<ModuleSectionAction[]>(
    () => [
      {
        id: 'columns',
        label: t('pages.modules.common.columns'),
        icon: ViewColumnRoundedIcon,
        disabled: loading,
        onClick: (event) => setColumnAnchor(event.currentTarget),
      },
    ],
    [loading, t],
  );

  const activeDateFilter =
    activeFilter && DATE_FILTERS.includes(activeFilter as EventDateFilterKey)
      ? dateFilters[activeFilter as EventDateFilterKey]
      : null;

  return (
    <>
      <ModuleSection<CalendarEvent>
        createAction={
          canCreate
            ? {
                id: 'create-event',
                label: t('pages.events.create'),
                disabled: loading,
                onClick: () => setEditor({ event: null }),
              }
            : undefined
        }
        refreshAction={{
          id: 'refresh-events',
          label: t('pages.events.refresh'),
          disabled: loading,
          onClick: () => void refresh(),
        }}
        extraActions={extraActions}
        search={{ label: t('pages.modules.common.search'), value: list.search, onChange: list.setSearch }}
        table={{
          headerRows,
          columns,
          rows,
          getRowId: (row) => row.id,
          loading,
          loadingLabel: t('pages.events.loading'),
          emptyLabel: t('pages.events.empty'),
          sort: list.sort,
          direction: list.direction,
          onSort: list.handleSort,
          page: list.page,
          pageSize: list.pageSize,
          total,
          onPageChange: list.handleChangePage,
          onPageSizeChange: list.handleChangeRowsPerPage,
          rowsPerPageLabel: t('pages.modules.common.rowsPerPage'),
        }}
      />

      <Menu anchorEl={columnAnchor} open={Boolean(columnAnchor)} onClose={() => setColumnAnchor(null)}>
        {columnsDefinitions
          .filter((column) => !column.fixed)
          .map((column) => (
            <MenuItem key={column.id}>
              <FormControlLabel
                control={
                  <Switch
                    checked={visibleColumns.includes(column.id)}
                    onChange={(_event, checked) =>
                      setVisibleColumns((current) =>
                        checked ? [...current, column.id] : current.filter((columnId) => columnId !== column.id),
                      )
                    }
                  />
                }
                label={column.label || column.id}
              />
            </MenuItem>
          ))}
      </Menu>

      {activeFilter && BOOLEAN_FILTERS.includes(activeFilter as EventBooleanFilterKey) ? (
        <Menu anchorEl={filterAnchor} open={Boolean(filterAnchor)} onClose={() => setFilterAnchor(null)}>
          {(['all', 'yes', 'no'] as BooleanFilterValue[]).map((value) => (
            <MenuItem
              key={value}
              selected={booleanFilters[activeFilter as EventBooleanFilterKey] === value}
              onClick={() => setBooleanFilter(activeFilter as EventBooleanFilterKey, value)}
            >
              {t(
                value === 'all'
                  ? 'pages.modules.common.filterAll'
                  : value === 'yes'
                    ? 'pages.modules.common.filterYes'
                    : 'pages.modules.common.filterNo',
              )}
            </MenuItem>
          ))}
        </Menu>
      ) : null}

      {activeFilter && activeDateFilter ? (
        <Popover open={Boolean(filterAnchor)} anchorEl={filterAnchor} onClose={() => setFilterAnchor(null)}>
          <Stack spacing={1.5} sx={{ p: 2, width: 280 }}>
            <Typography variant="subtitle2">{t('pages.modules.common.filter')}</Typography>
            <LocalizedDateField
              size="small"
              fullWidth
              label={t('pages.modules.common.filterFrom')}
              value={activeDateFilter.from}
              onChange={(value) => setDateFilter(activeFilter as EventDateFilterKey, 'from', value)}
            />
            <LocalizedDateField
              size="small"
              fullWidth
              label={t('pages.modules.common.filterTo')}
              value={activeDateFilter.to}
              onChange={(value) => setDateFilter(activeFilter as EventDateFilterKey, 'to', value)}
            />
            <Button onClick={() => clearDateFilter(activeFilter as EventDateFilterKey)}>
              {t('pages.modules.common.clearFilter')}
            </Button>
          </Stack>
        </Popover>
      ) : null}

      {editor && eventTypes.length ? (
        <EventEditorDialog
          key={editor.event?.id ?? 'new-event'}
          open
          event={editor.event}
          timezone={timezone}
          eventTypes={eventTypes}
          canCreateEventType={canCreateType}
          canViewPersonFields={canViewPersonFields}
          canViewEventFields={canViewEventFields}
          canCreateEventFields={canCreateEventFields}
          submitting={submitting}
          onClose={() => setEditor(undefined)}
          onSubmit={(values, image) => void saveEvent(values, image)}
        />
      ) : null}

      <EventDetailsDialog
        event={detailEvent}
        timezone={timezone}
        imageUrl={detailEvent ? toImageUrl(detailEvent) : undefined}
        use12HourTime={use12HourTime}
        onClose={() => setDetailEvent(null)}
        onAddToCalendar={addToCalendar}
        onShare={(event) => void shareEvent(event)}
      />

      <ConfirmDialog
        open={Boolean(deleteEvent)}
        title={t('pages.events.delete.title')}
        message={t('pages.events.delete.message')}
        confirmLabel={t('pages.events.actions.delete')}
        cancelLabel={t('form.field.cancel')}
        confirming={submitting}
        confirmColor="error"
        onClose={() => setDeleteEvent(null)}
        onConfirm={() => void removeEvent()}
      />
    </>
  );
};

export default EventsManagement;
