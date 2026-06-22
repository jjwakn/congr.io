import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import { EventsService } from '@services/events';
import { API_URL } from '@utils/constants';
import { httpRequest } from '@utils/http';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import type { CalendarEvent, EventsListResponse } from '@/types/event.types';
import { PublicEventRegistrationForm } from './PublicEventRegistrationForm';

export const PublicEventsPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  const publicId = segments[1];
  const congregationId = new URLSearchParams(location.search).get('congregation_id');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const request = publicId
      ? httpRequest<CalendarEvent>({ service: EventsService.publicGet, data: { id: publicId } }).then((event) => [
          event,
        ])
      : congregationId
        ? httpRequest<EventsListResponse>({
            service: EventsService.publicList,
            data: { congregation_id: congregationId, page: 0, size: 100, order: 'start_datetime', direction: 'ASC' },
          }).then(({ result }) => result)
        : Promise.reject(new Error(t('pages.publicEvents.congregationRequired')));
    void request
      .then(setEvents)
      .catch((value) => setError(value instanceof Error ? value.message : t('pages.publicEvents.loadFailed')));
  }, [congregationId, publicId, t]);

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Typography variant="h3" sx={{ mb: 3 }}>
        {t('pages.publicEvents.title')}
      </Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Stack spacing={2}>
        {events.map((event) => {
          const image = event.image_file_id
            ? `${API_URL.replace(/\/$/, '')}/files/public/${event.image_file_id}`
            : event.image_url;
          return (
            <Paper
              key={event.id}
              variant="outlined"
              sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, overflow: 'hidden' }}
            >
              {image ? (
                <Box
                  component="img"
                  src={image}
                  alt={event.name}
                  sx={{ width: { xs: '100%', md: '42%' }, maxHeight: 420, objectFit: 'cover' }}
                />
              ) : null}
              <Stack spacing={1.5} sx={{ p: 3, flex: 1 }}>
                <Typography variant="h4">{event.name}</Typography>
                <Typography color="text.secondary">
                  {DateTime.fromISO(event.start_datetime).toLocaleString(DateTime.DATETIME_MED)}
                </Typography>
                <Typography sx={{ whiteSpace: 'pre-line' }}>{event.description}</Typography>
                <Button
                  startIcon={<CalendarMonthRoundedIcon />}
                  onClick={() =>
                    window.open(
                      `data:text/calendar;charset=utf8,${encodeURIComponent(`BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:${event.name}\nDTSTART:${event.start_datetime}\nDTEND:${event.end_datetime}\nEND:VEVENT\nEND:VCALENDAR`)}`,
                    )
                  }
                >
                  {t('pages.events.actions.addToCalendar')}
                </Button>
                {event.self_registration_enabled && event.public_id && !event.registration_locked ? (
                  <PublicEventRegistrationForm event={event} />
                ) : null}
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
};

export default PublicEventsPage;
