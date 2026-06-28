import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CelebrationRoundedIcon from '@mui/icons-material/CelebrationRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ChurchRoundedIcon from '@mui/icons-material/ChurchRounded';
import Diversity3RoundedIcon from '@mui/icons-material/Diversity3Rounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import HandshakeRoundedIcon from '@mui/icons-material/HandshakeRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import LocalActivityRoundedIcon from '@mui/icons-material/LocalActivityRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import RestaurantRoundedIcon from '@mui/icons-material/RestaurantRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import VolunteerActivismRoundedIcon from '@mui/icons-material/VolunteerActivismRounded';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import { type ComponentType, createElement } from 'react';

export const DEFAULT_MUI_ICON = 'CalendarMonth';

const MUI_ICONS: Record<string, ComponentType<SvgIconProps>> = {
  AccountBalance: AccountBalanceRoundedIcon,
  AutoAwesome: AutoAwesomeRoundedIcon,
  CalendarMonth: CalendarMonthRoundedIcon,
  Celebration: CelebrationRoundedIcon,
  CheckCircle: CheckCircleRoundedIcon,
  Church: ChurchRoundedIcon,
  Diversity3: Diversity3RoundedIcon,
  EmojiEvents: EmojiEventsRoundedIcon,
  EventAvailable: EventAvailableRoundedIcon,
  Favorite: FavoriteRoundedIcon,
  Groups: GroupsRoundedIcon,
  Handshake: HandshakeRoundedIcon,
  Home: HomeRoundedIcon,
  LocalActivity: LocalActivityRoundedIcon,
  MenuBook: MenuBookRoundedIcon,
  MusicNote: MusicNoteRoundedIcon,
  Person: PersonRoundedIcon,
  Restaurant: RestaurantRoundedIcon,
  School: SchoolRoundedIcon,
  VolunteerActivism: VolunteerActivismRoundedIcon,
};

export const MUI_ICON_OPTIONS = Object.keys(MUI_ICONS).sort((left, right) => left.localeCompare(right));

export const getMuiIcon = (name?: string | null): ComponentType<SvgIconProps> =>
  MUI_ICONS[name || DEFAULT_MUI_ICON] ?? MUI_ICONS[DEFAULT_MUI_ICON];

export interface MuiIconProps extends Omit<SvgIconProps, 'name'> {
  name?: string | null;
}

export const MuiIcon = ({ name, ...props }: MuiIconProps) => createElement(getMuiIcon(name), props);
