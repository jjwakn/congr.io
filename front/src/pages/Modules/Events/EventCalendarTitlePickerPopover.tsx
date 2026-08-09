import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import KeyboardArrowLeftRoundedIcon from '@mui/icons-material/KeyboardArrowLeftRounded';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
import { Box, Button, IconButton, Popover, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DateTime } from 'luxon';
import { useEffect, useMemo, useState } from 'react';
import type {
  EventCalendarDateTime,
  EventCalendarTitlePickerDayCell,
  EventCalendarTitlePickerPanel,
  EventCalendarTitlePickerPopoverProps,
  EventCalendarTitlePickerWeekRow,
} from './events.types';

const CALENDAR_MONTH_VIEW = 'dayGridMonth';
const CALENDAR_WEEK_VIEW = 'timeGridWeek';
const CALENDAR_DAY_VIEW = 'timeGridDay';
const CALENDAR_MONTH_PICKER_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const MONTH_PICKER_VISIBLE_YEARS = 12;
const MONTH_PICKER_CENTER_YEAR_INDEX = 5;
const CALENDAR_TITLE_PICKER_DAY_CELL_COUNT = 42;
const CALENDAR_TITLE_PICKER_WEEKDAY_COUNT = 7;

const getInitialPanel = (viewType: string): EventCalendarTitlePickerPanel => {
  if (viewType === CALENDAR_DAY_VIEW) return 'days';
  if (viewType === CALENDAR_WEEK_VIEW) return 'weeks';

  return 'months';
};

const getPanelAfterMonthSelection = (viewType: string): EventCalendarTitlePickerPanel => {
  if (viewType === CALENDAR_DAY_VIEW) return 'days';
  if (viewType === CALENDAR_WEEK_VIEW) return 'weeks';

  return 'months';
};

const buildYearOptions = (year: number): number[] =>
  Array.from({ length: MONTH_PICKER_VISIBLE_YEARS }, (_value, index) => year + index - MONTH_PICKER_CENTER_YEAR_INDEX);

const getLuxonWeekdayFromCalendarIndex = (weekStartsOn: number): number => (weekStartsOn === 0 ? 7 : weekStartsOn);

const getGridStartDate = ({ month, weekStartsOn, year }: { month: number; weekStartsOn: number; year: number }) => {
  const firstOfMonth = DateTime.fromObject({ day: 1, month, year }).startOf('day');
  const firstWeekday = getLuxonWeekdayFromCalendarIndex(weekStartsOn);
  const offsetDays = (firstOfMonth.weekday - firstWeekday + CALENDAR_TITLE_PICKER_WEEKDAY_COUNT) % 7;

  return firstOfMonth.minus({ days: offsetDays });
};

const buildWeekdayLabels = ({ locale, weekStartsOn }: { locale: string; weekStartsOn: number }): string[] => {
  const gridStartDate = getGridStartDate({ month: 1, weekStartsOn, year: 2026 });

  return Array.from({ length: CALENDAR_TITLE_PICKER_WEEKDAY_COUNT }, (_value, index) =>
    gridStartDate.plus({ days: index }).setLocale(locale).toFormat('ccc').slice(0, 2),
  );
};

const buildDayCells = ({
  month,
  weekStartsOn,
  year,
}: {
  month: number;
  weekStartsOn: number;
  year: number;
}): EventCalendarTitlePickerDayCell[] => {
  const gridStartDate = getGridStartDate({ month, weekStartsOn, year });

  return Array.from({ length: CALENDAR_TITLE_PICKER_DAY_CELL_COUNT }, (_value, index) => {
    const date = gridStartDate.plus({ days: index });

    return {
      date,
      isoDate: date.toISODate() ?? '',
      isCurrentMonth: date.month === month && date.year === year,
    };
  });
};

const buildWeekRows = ({
  currentViewDate,
  month,
  weekStartsOn,
  year,
}: {
  currentViewDate: Date;
  month: number;
  weekStartsOn: number;
  year: number;
}): EventCalendarTitlePickerWeekRow[] => {
  const selectedDate = DateTime.fromJSDate(currentViewDate).startOf('day');
  const lastOfMonth = DateTime.fromObject({ day: 1, month, year }).endOf('month');
  const rows: EventCalendarTitlePickerWeekRow[] = [];
  let startDate = getGridStartDate({ month, weekStartsOn, year });

  while (startDate <= lastOfMonth) {
    const endDate = startDate.plus({ days: CALENDAR_TITLE_PICKER_WEEKDAY_COUNT - 1 }).endOf('day');
    rows.push({
      endDate,
      isSelected: selectedDate >= startDate && selectedDate <= endDate,
      startDate,
    });
    startDate = startDate.plus({ days: CALENDAR_TITLE_PICKER_WEEKDAY_COUNT });
  }

  return rows;
};

const shiftMonth = ({ month, months, year }: { month: number; months: number; year: number }) => {
  const shiftedDate = DateTime.fromObject({ day: 1, month, year }).plus({ months });

  return {
    month: shiftedDate.month,
    year: shiftedDate.year,
  };
};

export const EventCalendarTitlePickerPopover = ({
  anchorEl,
  currentViewDate,
  currentViewType,
  locale,
  nextLabel,
  previousLabel,
  selectTitleLabel,
  onClose,
  onNavigate,
  open,
  weekStartsOn,
}: EventCalendarTitlePickerPopoverProps) => {
  const theme = useTheme();
  const currentDate = DateTime.fromJSDate(currentViewDate);
  const safeCurrentDate = currentDate.isValid ? currentDate : DateTime.now();
  const [displayMonth, setDisplayMonth] = useState<number>(safeCurrentDate.month);
  const [displayYear, setDisplayYear] = useState<number>(safeCurrentDate.year);
  const [panel, setPanel] = useState<EventCalendarTitlePickerPanel>(getInitialPanel(currentViewType));
  const selectedIsoDate = safeCurrentDate.toISODate();
  const yearOptions = useMemo(() => buildYearOptions(displayYear), [displayYear]);
  const weekdayLabels = useMemo(() => buildWeekdayLabels({ locale, weekStartsOn }), [locale, weekStartsOn]);
  const dayCells = useMemo(
    () => buildDayCells({ month: displayMonth, weekStartsOn, year: displayYear }),
    [displayMonth, displayYear, weekStartsOn],
  );
  const weekRows = useMemo(
    () => buildWeekRows({ currentViewDate, month: displayMonth, weekStartsOn, year: displayYear }),
    [currentViewDate, displayMonth, displayYear, weekStartsOn],
  );
  const titleDate = DateTime.fromObject({ day: 1, month: displayMonth, year: displayYear }).setLocale(locale);
  const titleLabel =
    panel === 'years'
      ? `${yearOptions[0]} - ${yearOptions[yearOptions.length - 1]}`
      : panel === 'months'
        ? `${displayYear}`
        : titleDate.toFormat('LLLL yyyy');

  useEffect(() => {
    if (!open) return undefined;

    const timeoutId = window.setTimeout(() => {
      setDisplayMonth(safeCurrentDate.month);
      setDisplayYear(safeCurrentDate.year);
      setPanel(getInitialPanel(currentViewType));
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [currentViewType, open, safeCurrentDate.month, safeCurrentDate.year]);

  const handleShiftMonth = (months: number) => {
    if (panel === 'years') {
      setDisplayYear((year) => year + MONTH_PICKER_VISIBLE_YEARS * months);
      return;
    }

    if (panel === 'months') {
      setDisplayYear((year) => year + months);
      return;
    }

    const nextDate = shiftMonth({ month: displayMonth, months, year: displayYear });
    setDisplayMonth(nextDate.month);
    setDisplayYear(nextDate.year);
  };

  const handleTitleClick = () => {
    if (panel === 'years') {
      setPanel('months');
      return;
    }

    setPanel(panel === 'months' ? 'years' : 'months');
  };

  const handleSelectMonth = (month: number) => {
    setDisplayMonth(month);

    if (currentViewType === CALENDAR_MONTH_VIEW) {
      onNavigate(CALENDAR_MONTH_VIEW, DateTime.fromObject({ day: 1, month, year: displayYear }).toJSDate());
      onClose();
      return;
    }

    setPanel(getPanelAfterMonthSelection(currentViewType));
  };

  const handleSelectYear = (year: number) => {
    setDisplayYear(year);
    setPanel('months');
  };

  const handleSelectDay = (date: EventCalendarDateTime) => {
    onNavigate(CALENDAR_DAY_VIEW, date.toJSDate());
    onClose();
  };

  const handleSelectWeek = (date: EventCalendarDateTime) => {
    onNavigate(CALENDAR_WEEK_VIEW, date.toJSDate());
    onClose();
  };

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
      onClose={onClose}
      open={open}
      transformOrigin={{ horizontal: 'center', vertical: 'top' }}
    >
      <Stack spacing={1} sx={{ p: 1.5, width: { xs: '17rem', sm: '18rem' } }}>
        <Stack alignItems="center" direction="row" justifyContent="space-between">
          <IconButton aria-label={previousLabel} onClick={() => handleShiftMonth(-1)} size="small">
            <KeyboardArrowLeftRoundedIcon />
          </IconButton>

          <Button
            aria-label={selectTitleLabel}
            color="inherit"
            onClick={handleTitleClick}
            size="small"
            sx={{ gap: 0.35, minWidth: '7rem', px: 0.75, textTransform: 'none' }}
            variant="text"
          >
            <Typography sx={{ textTransform: 'capitalize' }} variant="subtitle1">
              {titleLabel}
            </Typography>
            <ExpandMoreRoundedIcon
              sx={{
                fontSize: '1rem',
                transform: panel === 'months' || panel === 'years' ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 150ms ease',
              }}
            />
          </Button>

          <IconButton aria-label={nextLabel} onClick={() => handleShiftMonth(1)} size="small">
            <KeyboardArrowRightRoundedIcon />
          </IconButton>
        </Stack>

        {panel === 'years' ? (
          <Box sx={{ display: 'grid', gap: 0.5, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            {yearOptions.map((yearOption) => (
              <Button
                key={yearOption}
                onClick={() => handleSelectYear(yearOption)}
                size="small"
                variant={yearOption === displayYear ? 'contained' : 'outlined'}
              >
                {yearOption}
              </Button>
            ))}
          </Box>
        ) : null}

        {panel === 'months' ? (
          <Box sx={{ display: 'grid', gap: 0.5, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            {CALENDAR_MONTH_PICKER_MONTHS.map((monthOption) => {
              const isSelectedMonth = safeCurrentDate.year === displayYear && safeCurrentDate.month === monthOption;

              return (
                <Button
                  key={monthOption}
                  onClick={() => handleSelectMonth(monthOption)}
                  size="small"
                  variant={isSelectedMonth ? 'contained' : 'outlined'}
                >
                  {DateTime.fromObject({ day: 1, month: monthOption, year: displayYear })
                    .setLocale(locale)
                    .toFormat('LLL')}
                </Button>
              );
            })}
          </Box>
        ) : null}

        {panel === 'days' ? (
          <Box sx={{ display: 'grid', gap: 0.4, gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
            {weekdayLabels.map((weekdayLabel) => (
              <Typography
                align="center"
                color="text.secondary"
                key={weekdayLabel}
                sx={{ fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.2, textTransform: 'uppercase' }}
              >
                {weekdayLabel}
              </Typography>
            ))}
            {dayCells.map((dayCell) => {
              const isSelectedDate = dayCell.isoDate === selectedIsoDate;

              return (
                <Button
                  color={isSelectedDate ? 'primary' : 'inherit'}
                  key={dayCell.isoDate}
                  onClick={() => handleSelectDay(dayCell.date)}
                  size="small"
                  sx={{
                    borderColor: isSelectedDate ? 'primary.main' : 'transparent',
                    color: dayCell.isCurrentMonth ? 'text.primary' : 'text.disabled',
                    fontWeight: isSelectedDate ? 700 : 400,
                    minWidth: 0,
                    p: 0,
                    width: '100%',
                  }}
                  variant={isSelectedDate ? 'contained' : 'text'}
                >
                  {dayCell.date.day}
                </Button>
              );
            })}
          </Box>
        ) : null}

        {panel === 'weeks' ? (
          <Stack spacing={0.5}>
            {weekRows.map((weekRow) => (
              <Button
                fullWidth
                key={weekRow.startDate.toISODate()}
                onClick={() => handleSelectWeek(weekRow.startDate)}
                size="small"
                sx={{
                  justifyContent: 'space-between',
                  px: 1.25,
                  textTransform: 'none',
                }}
                variant={weekRow.isSelected ? 'contained' : 'outlined'}
              >
                <Box component="span">{weekRow.startDate.setLocale(locale).toFormat('d LLL')}</Box>
                <Box component="span" sx={{ color: weekRow.isSelected ? 'inherit' : theme.palette.text.secondary }}>
                  {weekRow.endDate.setLocale(locale).toFormat('d LLL')}
                </Box>
              </Button>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Popover>
  );
};
