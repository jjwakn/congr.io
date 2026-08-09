import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { Box, IconButton, InputAdornment, Popover, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { formatDateForInput, getDateInputPlaceholder, parseDateInput } from '@utils/datetime';
import { DateTime } from 'luxon';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LocalizedDateFieldProps } from './LocalizedDateField.types';

export const LocalizedDateField = ({ value, onChange, helperText, ...props }: LocalizedDateFieldProps) => {
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<ReturnType<typeof DateTime.now>>(() =>
    (value ? DateTime.fromISO(value) : DateTime.now()).startOf('month'),
  );
  const source = `${i18n.language}:${value}`;
  const [fieldState, setFieldState] = useState(() => ({
    source,
    draft: formatDateForInput(value, i18n.language),
    invalid: false,
  }));
  if (fieldState.source !== source) {
    setFieldState({ source, draft: formatDateForInput(value, i18n.language), invalid: false });
  }

  const commit = (nextValue: string) => {
    const parsed = parseDateInput(nextValue, i18n.language);
    if (parsed === null) {
      setFieldState((current) => ({ ...current, invalid: true }));
      return;
    }

    setFieldState((current) => ({ ...current, invalid: false }));
    onChange(parsed);
  };
  const days = useMemo(() => {
    const start = calendarMonth.startOf('month').startOf('week');
    return Array.from({ length: 42 }, (_item, index) => start.plus({ days: index }));
  }, [calendarMonth]);

  const selectDate = (date: ReturnType<typeof DateTime.now>) => {
    const nextValue = date.toISODate() ?? '';
    setFieldState({
      source: `${i18n.language}:${nextValue}`,
      draft: formatDateForInput(nextValue, i18n.language),
      invalid: false,
    });
    onChange(nextValue);
    setAnchorEl(null);
  };

  return (
    <>
      <TextField
        {...props}
        value={fieldState.draft}
        error={props.error || fieldState.invalid}
        placeholder={getDateInputPlaceholder(i18n.language)}
        helperText={fieldState.invalid ? t('form.error.invalidDate') : helperText}
        InputProps={{
          ...props.InputProps,
          endAdornment: (
            <>
              {props.InputProps?.endAdornment}
              <InputAdornment position="end">
                <Tooltip title={t('form.field.selectDate')}>
                  <IconButton
                    edge="end"
                    aria-label={t('form.field.selectDate')}
                    onClick={(event) => setAnchorEl(event.currentTarget)}
                  >
                    <CalendarMonthRoundedIcon />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            </>
          ),
        }}
        onBlur={() => commit(fieldState.draft)}
        onChange={(event) => {
          const nextValue = event.target.value;
          setFieldState((current) => ({ ...current, draft: nextValue }));
          if (!nextValue.trim()) commit(nextValue);
        }}
      />
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Stack spacing={1} sx={{ p: 1.5, width: 300 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <IconButton
              onClick={() =>
                setCalendarMonth((current: ReturnType<typeof DateTime.now>) => current.minus({ months: 1 }))
              }
            >
              <ChevronLeftRoundedIcon />
            </IconButton>
            <Typography variant="subtitle2">{calendarMonth.setLocale(i18n.language).toFormat('LLLL yyyy')}</Typography>
            <IconButton
              onClick={() =>
                setCalendarMonth((current: ReturnType<typeof DateTime.now>) => current.plus({ months: 1 }))
              }
            >
              <ChevronRightRoundedIcon />
            </IconButton>
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
            {days.slice(0, 7).map((day) => (
              <Typography key={day.weekday} variant="caption" color="text.secondary" align="center">
                {day.setLocale(i18n.language).toFormat('ccc')}
              </Typography>
            ))}
            {days.map((day) => {
              const selected = value === day.toISODate();
              const muted = day.month !== calendarMonth.month;
              return (
                <IconButton
                  key={day.toISODate()}
                  size="small"
                  color={selected ? 'primary' : 'default'}
                  onClick={() => selectDate(day)}
                  sx={{
                    borderRadius: 1,
                    bgcolor: selected ? 'primary.main' : 'transparent',
                    color: selected ? 'primary.contrastText' : muted ? 'text.disabled' : 'text.primary',
                  }}
                >
                  <Typography variant="body2">{day.day}</Typography>
                </IconButton>
              );
            })}
          </Box>
        </Stack>
      </Popover>
    </>
  );
};
