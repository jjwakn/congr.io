import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import CelebrationRoundedIcon from '@mui/icons-material/CelebrationRounded';
import ChurchRoundedIcon from '@mui/icons-material/ChurchRounded';
import DateRangeRoundedIcon from '@mui/icons-material/DateRangeRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import VolunteerActivismRoundedIcon from '@mui/icons-material/VolunteerActivismRounded';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import { type ComponentType, createElement } from 'react';

export const DEFAULT_MUI_ICON = 'Event';

export const MUI_ICON_COMPONENTS = {
  AccessTime: AccessTimeRoundedIcon,
  CalendarMonth: CalendarMonthRoundedIcon,
  CalendarToday: CalendarTodayRoundedIcon,
  Celebration: CelebrationRoundedIcon,
  Church: ChurchRoundedIcon,
  DateRange: DateRangeRoundedIcon,
  Event: EventRoundedIcon,
  EventAvailable: EventAvailableRoundedIcon,
  EventBusy: EventBusyRoundedIcon,
  EventNote: EventNoteRoundedIcon,
  Groups: GroupsRoundedIcon,
  HowToReg: HowToRegRoundedIcon,
  MeetingRoom: MeetingRoomRoundedIcon,
  People: PeopleRoundedIcon,
  Schedule: ScheduleRoundedIcon,
  Today: TodayRoundedIcon,
  VolunteerActivism: VolunteerActivismRoundedIcon,
} satisfies Record<string, ComponentType<SvgIconProps>>;

export const MUI_ICON_OPTIONS = Object.keys(MUI_ICON_COMPONENTS).sort((left, right) => left.localeCompare(right));

export const getMuiIcon = (name?: string | null): ComponentType<SvgIconProps> =>
  MUI_ICON_COMPONENTS[name as keyof typeof MUI_ICON_COMPONENTS] ?? MUI_ICON_COMPONENTS[DEFAULT_MUI_ICON];

export interface MuiIconProps extends Omit<SvgIconProps, 'name'> {
  name?: string | null;
}

export const MuiIcon = ({ name, ...props }: MuiIconProps) => createElement(getMuiIcon(name), props);
