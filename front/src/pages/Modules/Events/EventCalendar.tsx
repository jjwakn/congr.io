import { ConfirmDialog } from '@components/common/forms/ConfirmDialog';
import { ModuleSection } from '@components/common/modules/ModuleSection';
import type { DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useAppContext } from '@hooks/useAppContext';
import { useAuth } from '@hooks/useAuth';
import { useNotificationContext } from '@hooks/useNotifications';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  FormControlLabel,
  Menu,
  MenuItem,
  Popover,
  Snackbar,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import { EventTypesService } from '@services/eventTypes';
import { EventsService } from '@services/events';
import { FilesService } from '@services/files';
import { API_URL } from '@utils/constants';
import { resolveEventFieldPersonLinks } from '@utils/eventFieldLinks';
import { HttpRequestError, httpRequest } from '@utils/http';
import { MuiIcon } from '@utils/muiIcons';
import { getPreloadedResource } from '@utils/preload';
import { getPublicEventsPath } from '@utils/routes';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import type { EventType } from '@/types/event-type.types';
import type { CalendarEvent, EventsListResponse } from '@/types/event.types';
import { EventCalendarTitlePickerPopover } from './EventCalendarTitlePickerPopover';
import { EventDetailsDialog } from './EventDetailsDialog';
import { EventEditorDialog } from './EventEditorDialog';
import type { EventFormValues } from './events.types';

const toImageUrl = (event: CalendarEvent) =>
  event.image_file_id
    ? `${API_URL.replace(/\/$/, '')}/files/${event.is_public ? 'public/' : ''}${event.image_file_id}`
    : (event.image_url ?? '');

const toCalendarDisplayDate = (value: string, timezone: string, allDay: boolean) => {
  const local = DateTime.fromISO(value).setZone(timezone);
  return allDay ? (local.toISODate() ?? value) : (local.toISO() ?? value);
};

export const EventCalendar = () => {
  const { t, i18n } = useTranslation();
  const { congregation } = useAppContext();
  const { hasPermission, user } = useAuth();
  const { showNotification } = useNotificationContext();
  const location = useLocation();
  const calendarRef = useRef<FullCalendar | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>(
    () => getPreloadedResource<EventsListResponse>('events')?.result ?? [],
  );
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [visibleTypeIds, setVisibleTypeIds] = useState<string[]>([]);
  const [filterInitialized, setFilterInitialized] = useState(false);
  const [title, setTitle] = useState('');
  const [view, setView] = useState('dayGridMonth');
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<{ start: string; end: string }>();
  const [editor, setEditor] = useState<{ event: CalendarEvent | null; date?: string; typeId?: string }>();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<CalendarEvent | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dayMenu, setDayMenu] = useState<{ top: number; left: number; date: string }>();
  const [eventMenu, setEventMenu] = useState<{ top: number; left: number; event: CalendarEvent }>();
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  const [dateAnchor, setDateAnchor] = useState<HTMLElement | null>(null);
  const canCreate = hasPermission('event', 'create');
  const canUpdate = hasPermission('event', 'update');
  const canDelete = hasPermission('event', 'delete');
  const canCreateType = hasPermission('event_type', 'create');
  const canViewType = hasPermission('event_type', 'get');
  const canViewPersonFields = hasPermission('person_field', 'get');
  const use12HourTime = user?.preferences?.time_format === '12h';

  useEffect(() => {
    const eventId = new URLSearchParams(location.search).get('event');
    if (!eventId) return;
    void httpRequest<CalendarEvent>({ service: EventsService.get, data: { id: eventId } })
      .then(setSelectedEvent)
      .catch((value) =>
        showNotification(value instanceof Error ? value.message : t('pages.events.errors.load'), { severity: 'error' }),
      );
  }, [location.search, showNotification, t]);

  useEffect(() => {
    const typeId = new URLSearchParams(location.search).get('createEventType');
    if (typeId && canCreate) setEditor({ event: null, typeId });
  }, [canCreate, location.search]);

  const loadEventTypes = useCallback(async () => {
    try {
      const response = await httpRequest<{ result: EventType[]; total: number }>({
        service: EventTypesService.list,
        data: { page: 0, size: 500, order: 'name', direction: 'ASC' },
      });
      setEventTypes(response.result ?? []);
      setVisibleTypeIds((current) => (filterInitialized ? current : (response.result ?? []).map(({ id }) => id)));
      setFilterInitialized(true);
    } catch (value) {
      showNotification(value instanceof Error ? value.message : t('pages.events.errors.types'), { severity: 'error' });
    }
  }, [filterInitialized, showNotification, t]);

  const loadEvents = useCallback(
    async (nextRange: { start: string; end: string }) => {
      setLoading(true);
      setEvents((current) =>
        current.filter((event) => event.end_datetime > nextRange.start && event.start_datetime < nextRange.end),
      );
      try {
        const response = await httpRequest<EventsListResponse>({
          service: EventsService.list,
          data: {
            start: nextRange.start,
            end: nextRange.end,
            size: 500,
            page: 0,
            order: 'start_datetime',
            direction: 'ASC',
          },
        });
        setEvents(response.result ?? []);
        if (!canViewType) {
          const types = Array.from(
            new Map(
              (response.result ?? []).flatMap((event) => (event.type ? [[event.type.id, event.type] as const] : [])),
            ).values(),
          );
          setEventTypes(types);
          setVisibleTypeIds((current) => (filterInitialized ? current : types.map(({ id }) => id)));
          setFilterInitialized(true);
        }
      } catch (value) {
        const message =
          value instanceof HttpRequestError || value instanceof Error ? value.message : t('pages.events.errors.load');
        showNotification(message, { severity: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [canViewType, filterInitialized, showNotification, t],
  );

  const handleDatesSet = (arg: DatesSetArg) => {
    setTitle(arg.view.title);
    const nextRange = {
      start: DateTime.fromJSDate(arg.start).minus({ days: 7 }).toUTC().toISO() ?? arg.startStr,
      end: DateTime.fromJSDate(arg.end).plus({ days: 7 }).toUTC().toISO() ?? arg.endStr,
    };
    setRange(nextRange);
    void Promise.all([loadEvents(nextRange), canViewType && !eventTypes.length ? loadEventTypes() : Promise.resolve()]);
  };

  const calendarEvents = useMemo<EventInput[]>(
    () =>
      events
        .filter((event) => !filterInitialized || visibleTypeIds.includes(event.event_type_id))
        .map((event) => ({
          id: event.id,
          title: event.name,
          start: toCalendarDisplayDate(event.start_datetime, congregation?.timezone ?? 'UTC', event.all_day),
          end: toCalendarDisplayDate(event.end_datetime, congregation?.timezone ?? 'UTC', event.all_day),
          allDay: event.all_day,
          backgroundColor: event.type?.color,
          borderColor: event.type?.color,
          extendedProps: { source: event },
        })),
    [congregation?.timezone, events, filterInitialized, visibleTypeIds],
  );

  const handleDateClick = (arg: DateClickArg) => {
    setDayMenu({ top: arg.jsEvent.clientY, left: arg.jsEvent.clientX, date: arg.dateStr });
  };

  const handleEventClick = (arg: EventClickArg) => {
    const source = arg.event.extendedProps.source as CalendarEvent;
    setEventMenu({ top: arg.jsEvent.clientY, left: arg.jsEvent.clientX, event: source });
  };

  const saveEvent = async (values: EventFormValues, image?: File) => {
    setSubmitting(true);
    try {
      const eventFieldIds = new Set(values.event_fields.map(({ id }) => id));
      const resolvedCustomFields = await resolveEventFieldPersonLinks(values.custom_fields);
      const resolvedEventFields = resolvedCustomFields.filter(({ id }) => eventFieldIds.has(id));
      const inheritedFields = resolvedCustomFields.filter(({ id }) => !eventFieldIds.has(id));
      const { event_fields: _eventFields, ...eventValues } = values;
      let imageFileId = editor?.event?.image_file_id ?? undefined;
      if (image) {
        const form = new FormData();
        form.append('file', image);
        const uploaded = await httpRequest<{ id: string }>({ service: FilesService.uploadEventImage, data: form });
        imageFileId = uploaded.id;
      }
      const service = editor?.event ? EventsService.update : EventsService.create;
      await httpRequest({
        service,
        data: {
          ...(editor?.event ? { id: editor.event.id } : {}),
          ...eventValues,
          custom_fields: [...inheritedFields, ...resolvedEventFields],
          ...(imageFileId ? { image_file_id: imageFileId } : {}),
        },
      });
      setEditor(undefined);
      if (range) await Promise.all([loadEvents(range), loadEventTypes()]);
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
      if (range) await loadEvents(range);
      showNotification(t('pages.events.success.deleted'), { severity: 'success' });
    } catch (value) {
      showNotification(value instanceof Error ? value.message : t('pages.events.errors.delete'), { severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const shareEvent = async (event: CalendarEvent) => {
    if (!event.is_public || !event.public_id) return;
    const path = getPublicEventsPath(i18n.language, event.public_id);
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
    showNotification(t('pages.events.success.linkCopied'), { severity: 'success' });
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

  const api = calendarRef.current?.getApi();
  const currentViewDate = api?.getDate() ?? new Date();
  const weekStartsOn = i18n.language.startsWith('es') ? 1 : 0;

  const handleDatePickerNavigate = (nextView: string, date: Date) => {
    api?.changeView(nextView, date);
    setView(nextView);
  };

  const handleViewChange = (nextView: string) => {
    setView(nextView);
    api?.changeView(nextView);
  };

  return (
    <ModuleSection<CalendarEvent>
      createAction={
        canCreate
          ? {
              id: 'create-event',
              label: t('pages.events.create'),
              onClick: () => setEditor({ event: null }),
            }
          : undefined
      }
      refreshAction={{
        id: 'refresh-events',
        label: t('pages.events.refresh'),
        disabled: loading,
        onClick: () => range && void loadEvents(range),
      }}
    >
      <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={{ xs: 0.75, sm: 1 }}
          sx={{ flexShrink: 0 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={{ xs: 0.5, sm: 0.75 }}
            sx={{ order: { xs: 2, sm: 1 }, flexShrink: 0 }}
          >
            <ButtonGroup color="secondary" size="small" variant="contained">
              <Button
                aria-label={t('pages.events.previous')}
                onClick={() => api?.prev()}
                sx={{ minWidth: { xs: 30, sm: 34 }, px: { xs: 0.5, sm: 0.75 } }}
              >
                <ChevronLeftRoundedIcon fontSize="small" />
              </Button>
              <Button
                aria-label={t('pages.events.next')}
                onClick={() => api?.next()}
                sx={{ minWidth: { xs: 30, sm: 34 }, px: { xs: 0.5, sm: 0.75 } }}
              >
                <ChevronRightRoundedIcon fontSize="small" />
              </Button>
            </ButtonGroup>
            <Button
              size="small"
              variant="contained"
              onClick={() => api?.today()}
              sx={{ minHeight: { xs: 30, sm: 34 }, px: { xs: 0.9, sm: 1.1 } }}
            >
              {t('pages.events.today')}
            </Button>
            <Tooltip title={t('pages.events.filter')}>
              <span>
                <Button
                  aria-label={t('pages.events.filter')}
                  disabled={!eventTypes.length}
                  onClick={(e) => setFilterAnchor(e.currentTarget)}
                  size="small"
                  variant="contained"
                  sx={{ minHeight: { xs: 30, sm: 34 }, minWidth: { xs: 30, sm: 34 }, px: 0 }}
                >
                  <FilterListRoundedIcon fontSize="small" />
                </Button>
              </span>
            </Tooltip>
          </Stack>
          <Box
            sx={{
              order: { xs: 1, sm: 2 },
              flex: { xs: '0 0 100%', sm: '1 1 0' },
              minWidth: 0,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Button
              aria-label={t('pages.events.selectDate')}
              color="inherit"
              endIcon={
                <ExpandMoreRoundedIcon
                  sx={{
                    fontSize: '0.7em',
                    transform: dateAnchor ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 150ms ease',
                  }}
                />
              }
              onClick={(e) => setDateAnchor(e.currentTarget)}
              sx={{
                color: 'text.primary',
                fontSize: { xs: '1.35rem', sm: '1.5rem', md: '1.75rem' },
                fontWeight: 700,
                lineHeight: 1.2,
                maxWidth: '100%',
                minWidth: 0,
                p: 0,
                textAlign: 'center',
                textTransform: 'none',
                whiteSpace: 'normal',
                '&:hover': {
                  backgroundColor: 'transparent',
                },
                '& .MuiButton-endIcon': {
                  ml: 0.25,
                },
              }}
              variant="text"
            >
              <Typography
                component="span"
                noWrap
                sx={{ font: 'inherit', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {title}
              </Typography>
            </Button>
          </Box>
          <Stack direction="row" alignItems="center" spacing={0.25} sx={{ order: { xs: 3, sm: 3 }, flexShrink: 0 }}>
            <ButtonGroup
              color="primary"
              size="small"
              sx={{
                '& .MuiButton-root': {
                  minHeight: { xs: 30, sm: 34 },
                  px: { xs: 0.75, sm: 1 },
                  fontSize: { xs: '0.72rem', sm: '0.8125rem' },
                },
              }}
            >
              <Button
                onClick={() => handleViewChange('timeGridDay')}
                variant={view === 'timeGridDay' ? 'contained' : 'outlined'}
              >
                {t('pages.events.views.day')}
              </Button>
              <Button
                onClick={() => handleViewChange('timeGridWeek')}
                variant={view === 'timeGridWeek' ? 'contained' : 'outlined'}
              >
                {t('pages.events.views.week')}
              </Button>
              <Button
                onClick={() => handleViewChange('dayGridMonth')}
                variant={view === 'dayGridMonth' ? 'contained' : 'outlined'}
              >
                {t('pages.events.views.month')}
              </Button>
            </ButtonGroup>
          </Stack>
        </Stack>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            '& .fc': { height: '100%' },
            '& .fc-header-toolbar': { display: 'none' },
            '& .fc-view-harness': { minHeight: 0 },
          }}
        >
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={i18n.language.startsWith('es') ? esLocale : undefined}
            timeZone="local"
            events={calendarEvents}
            datesSet={handleDatesSet}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: use12HourTime }}
            slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: use12HourTime }}
            eventContent={(arg) => {
              const source = arg.event.extendedProps.source as CalendarEvent;
              const start = DateTime.fromISO(source.start_datetime)
                .setZone(congregation?.timezone)
                .setLocale(i18n.language)
                .toLocaleString(use12HourTime ? DateTime.TIME_SIMPLE : DateTime.TIME_24_SIMPLE);
              const end = DateTime.fromISO(source.end_datetime)
                .setZone(congregation?.timezone)
                .setLocale(i18n.language)
                .toLocaleString(use12HourTime ? DateTime.TIME_SIMPLE : DateTime.TIME_24_SIMPLE);
              const details = [source.name, `${start} - ${end}`, source.description].filter(Boolean).join('\n');
              return (
                <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{details}</span>}>
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
                    <MuiIcon
                      name={source.type?.icon}
                      sx={{ fontSize: 14, color: source.type?.color ?? 'inherit', flexShrink: 0 }}
                    />
                    <Typography component="span" variant="caption" noWrap>
                      {source.all_day ? '' : `${start} `}
                      {arg.event.title}
                    </Typography>
                  </Stack>
                </Tooltip>
              );
            }}
            dayMaxEvents
            nowIndicator
            selectable
            height="100%"
          />
        </Box>

        <Menu anchorEl={filterAnchor} open={Boolean(filterAnchor)} onClose={() => setFilterAnchor(null)}>
          {eventTypes.map((type) => (
            <MenuItem
              key={type.id}
              onClick={() =>
                setVisibleTypeIds((current) =>
                  current.includes(type.id) ? current.filter((id) => id !== type.id) : [...current, type.id],
                )
              }
            >
              <FormControlLabel control={<Switch checked={visibleTypeIds.includes(type.id)} />} label={type.name} />
            </MenuItem>
          ))}
        </Menu>

        <EventCalendarTitlePickerPopover
          anchorEl={dateAnchor}
          currentViewDate={currentViewDate}
          currentViewType={view}
          locale={i18n.language}
          nextLabel={t('pages.events.next')}
          previousLabel={t('pages.events.previous')}
          selectTitleLabel={t('pages.events.selectDate')}
          onClose={() => setDateAnchor(null)}
          onNavigate={handleDatePickerNavigate}
          open={Boolean(dateAnchor)}
          weekStartsOn={weekStartsOn}
        />

        <Popover
          open={Boolean(dayMenu)}
          anchorReference="anchorPosition"
          anchorPosition={dayMenu}
          onClose={() => setDayMenu(undefined)}
        >
          <MenuItem
            onClick={() => {
              api?.changeView('timeGridDay', dayMenu?.date);
              setView('timeGridDay');
              setDayMenu(undefined);
            }}
          >
            <VisibilityOutlinedIcon sx={{ mr: 1 }} />
            {t('pages.events.viewDay')}
          </MenuItem>
          {canCreate ? (
            <MenuItem
              onClick={() => {
                setEditor({ event: null, date: dayMenu?.date });
                setDayMenu(undefined);
              }}
            >
              <AddRoundedIcon sx={{ mr: 1 }} />
              {t('pages.events.create')}
            </MenuItem>
          ) : null}
        </Popover>

        <Popover
          open={Boolean(eventMenu)}
          anchorReference="anchorPosition"
          anchorPosition={eventMenu}
          onClose={() => setEventMenu(undefined)}
        >
          <MenuItem
            onClick={() => {
              setSelectedEvent(eventMenu?.event ?? null);
              setEventMenu(undefined);
            }}
          >
            <VisibilityOutlinedIcon sx={{ mr: 1 }} />
            {t('pages.events.actions.view')}
          </MenuItem>
          {canUpdate ? (
            <MenuItem
              onClick={() => {
                if (eventMenu) setEditor({ event: eventMenu.event });
                setEventMenu(undefined);
              }}
            >
              <EditOutlinedIcon sx={{ mr: 1 }} />
              {t('pages.events.actions.edit')}
            </MenuItem>
          ) : null}
          {canDelete ? (
            <MenuItem
              onClick={() => {
                setDeleteEvent(eventMenu?.event ?? null);
                setEventMenu(undefined);
              }}
            >
              <DeleteOutlineRoundedIcon sx={{ mr: 1 }} />
              {t('pages.events.actions.delete')}
            </MenuItem>
          ) : null}
          <MenuItem
            onClick={() => {
              if (eventMenu) addToCalendar(eventMenu.event);
              setEventMenu(undefined);
            }}
          >
            <CalendarMonthRoundedIcon sx={{ mr: 1 }} />
            {t('pages.events.actions.addToCalendar')}
          </MenuItem>
          {eventMenu?.event.is_public && eventMenu.event.public_id ? (
            <MenuItem
              onClick={() => {
                if (eventMenu) void shareEvent(eventMenu.event);
                setEventMenu(undefined);
              }}
            >
              <IosShareRoundedIcon sx={{ mr: 1 }} />
              {t('pages.events.actions.share')}
            </MenuItem>
          ) : null}
        </Popover>

        {editor && (!editor.typeId || eventTypes.length) ? (
          <EventEditorDialog
            key={editor.event?.id ?? editor.date ?? editor.typeId ?? 'new'}
            open
            event={editor.event}
            initialDate={editor.date}
            initialTypeId={editor.typeId}
            timezone={congregation?.timezone ?? 'UTC'}
            eventTypes={eventTypes}
            canCreateEventType={canCreateType}
            canViewPersonFields={canViewPersonFields}
            submitting={submitting}
            onClose={() => setEditor(undefined)}
            onSubmit={(values, image) => void saveEvent(values, image)}
          />
        ) : null}

        <EventDetailsDialog
          event={selectedEvent}
          timezone={congregation?.timezone ?? 'UTC'}
          imageUrl={selectedEvent ? toImageUrl(selectedEvent) : undefined}
          use12HourTime={use12HourTime}
          onClose={() => setSelectedEvent(null)}
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
        <Snackbar
          open={loading}
          message={
            <Stack direction="row" alignItems="center" spacing={1}>
              <CircularProgress size={18} color="inherit" />
              <Typography variant="body2">{t('pages.events.loading')}</Typography>
            </Stack>
          }
        />
      </Box>
    </ModuleSection>
  );
};

export default EventCalendar;
