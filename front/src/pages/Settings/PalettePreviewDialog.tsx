import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import { AppBar, Box, Button, Chip, Dialog, IconButton, Paper, Stack, Toolbar, Typography } from '@mui/material';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { getTheme } from '@utils/theme';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { PalettePreviewDialogProps } from './PalettePreviewDialog.types';

const calendarCells = Array.from({ length: 35 }, (_value, index) => (index < 2 || index > 31 ? null : index - 1));

const eventDayKeys = new Map<number, 'service' | 'group' | 'outreach'>([
  [3, 'service'],
  [11, 'group'],
  [18, 'outreach'],
]);

const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export const PalettePreviewDialog = ({
  open,
  mode,
  paletteConfig,
  congregationName,
  onClose,
}: PalettePreviewDialogProps) => {
  const { t } = useTranslation();
  const theme = useMemo(() => getTheme({ mode, paletteConfig }), [mode, paletteConfig]);
  const modeLabel =
    mode === 'dark' ? t('pages.settings.palettePreview.dark') : t('pages.settings.palettePreview.light');

  return (
    <MuiThemeProvider theme={theme}>
      <Dialog
        fullScreen
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              bgcolor: 'background.default',
              color: 'text.primary',
            },
          },
        }}
      >
        <AppBar position="static" color="primary" elevation={0}>
          <Toolbar sx={{ gap: 2 }}>
            <CalendarMonthRoundedIcon />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" noWrap>
                {congregationName}
              </Typography>
              <Typography variant="body2" noWrap>
                {t('pages.settings.palettePreview.title', { mode: modeLabel })}
              </Typography>
            </Box>
            <Button variant="contained" color="secondary" startIcon={<GroupsRoundedIcon />}>
              {t('pages.settings.palettePreview.navAction')}
            </Button>
            <IconButton edge="end" color="inherit" onClick={onClose} aria-label={t('form.field.close')}>
              <CloseRoundedIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: { xs: 2, md: 4 }, display: 'grid', gap: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'stretch' }}>
            <Paper sx={{ flex: 1, p: 2, borderRadius: 2 }}>
              <Stack spacing={1}>
                <Typography variant="overline" color="text.secondary">
                  {t('pages.settings.palettePreview.nextEvent')}
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <EventRoundedIcon color="primary" />
                  <Box>
                    <Typography variant="h6">{t('pages.settings.palettePreview.events.service')}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('pages.settings.palettePreview.eventTime')}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Paper>

            <Paper sx={{ flex: 1, p: 2, borderRadius: 2 }}>
              <Stack spacing={1}>
                <Typography variant="overline" color="text.secondary">
                  {t('pages.settings.palettePreview.summary')}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                  <Chip color="primary" label={t('pages.settings.palettePreview.chips.today')} />
                  <Chip color="secondary" label={t('pages.settings.palettePreview.chips.registered')} />
                  <Chip variant="outlined" label={t('pages.settings.palettePreview.chips.pending')} />
                </Stack>
              </Stack>
            </Paper>
          </Stack>

          <Paper sx={{ p: { xs: 1, md: 2 }, borderRadius: 2 }}>
            <Stack spacing={2}>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Typography variant="h5">{t('pages.settings.palettePreview.calendar')}</Typography>
                <Chip color="primary" variant="outlined" label={t('pages.settings.palettePreview.month')} />
              </Stack>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                  gap: 1,
                }}
              >
                {dayKeys.map((key) => (
                  <Typography key={key} variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                    {t(`pages.settings.palettePreview.days.${key}`)}
                  </Typography>
                ))}

                {calendarCells.map((day, index) => {
                  const eventKey = day ? eventDayKeys.get(day) : undefined;

                  return (
                    <Paper
                      key={`${day ?? 'empty'}-${index}`}
                      variant="outlined"
                      sx={{
                        minHeight: { xs: 72, md: 96 },
                        p: 1,
                        bgcolor: day ? 'background.paper' : 'action.disabledBackground',
                        borderColor: eventKey ? 'primary.main' : 'divider',
                      }}
                    >
                      {day ? (
                        <Stack spacing={0.75}>
                          <Typography variant="body2" sx={{ fontWeight: eventKey ? 700 : 500 }}>
                            {day}
                          </Typography>
                          {eventKey ? (
                            <Chip
                              size="small"
                              color={eventKey === 'group' ? 'secondary' : 'primary'}
                              icon={<EventRoundedIcon />}
                              label={t(`pages.settings.palettePreview.events.${eventKey}`)}
                              sx={{ justifyContent: 'flex-start' }}
                            />
                          ) : null}
                        </Stack>
                      ) : null}
                    </Paper>
                  );
                })}
              </Box>
            </Stack>
          </Paper>
        </Box>
      </Dialog>
    </MuiThemeProvider>
  );
};
