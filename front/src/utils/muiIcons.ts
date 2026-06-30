import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import CakeRoundedIcon from '@mui/icons-material/CakeRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import CelebrationRoundedIcon from '@mui/icons-material/CelebrationRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ChurchRoundedIcon from '@mui/icons-material/ChurchRounded';
import CoPresentRoundedIcon from '@mui/icons-material/CoPresentRounded';
import DateRangeRoundedIcon from '@mui/icons-material/DateRangeRounded';
import Diversity3RoundedIcon from '@mui/icons-material/Diversity3Rounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import EventRepeatRoundedIcon from '@mui/icons-material/EventRepeatRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import FestivalRoundedIcon from '@mui/icons-material/FestivalRounded';
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';
import Groups2RoundedIcon from '@mui/icons-material/Groups2Rounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import HandshakeRoundedIcon from '@mui/icons-material/HandshakeRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import LocalActivityRoundedIcon from '@mui/icons-material/LocalActivityRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import PersonSearchRoundedIcon from '@mui/icons-material/PersonSearchRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import RecordVoiceOverRoundedIcon from '@mui/icons-material/RecordVoiceOverRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import VolunteerActivismRoundedIcon from '@mui/icons-material/VolunteerActivismRounded';
import WavingHandRoundedIcon from '@mui/icons-material/WavingHandRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import { Icon as MaterialIcon } from '@mui/material';
import type { IconProps } from '@mui/material/Icon';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import { type ComponentType, createElement } from 'react';

export const DEFAULT_MUI_ICON = 'Event';

export const MUI_ICON_COMPONENTS = {
  AccessTime: AccessTimeRoundedIcon,
  AccountCircle: AccountCircleRoundedIcon,
  AssignmentInd: AssignmentIndRoundedIcon,
  Badge: BadgeRoundedIcon,
  Cake: CakeRoundedIcon,
  CalendarMonth: CalendarMonthRoundedIcon,
  CalendarToday: CalendarTodayRoundedIcon,
  Campaign: CampaignRoundedIcon,
  Celebration: CelebrationRoundedIcon,
  CheckCircle: CheckCircleRoundedIcon,
  Church: ChurchRoundedIcon,
  CoPresent: CoPresentRoundedIcon,
  DateRange: DateRangeRoundedIcon,
  Diversity3: Diversity3RoundedIcon,
  EmojiEvents: EmojiEventsRoundedIcon,
  Event: EventRoundedIcon,
  EventAvailable: EventAvailableRoundedIcon,
  EventBusy: EventBusyRoundedIcon,
  EventNote: EventNoteRoundedIcon,
  EventRepeat: EventRepeatRoundedIcon,
  FactCheck: FactCheckRoundedIcon,
  Festival: FestivalRoundedIcon,
  GroupAdd: GroupAddRoundedIcon,
  Groups: GroupsRoundedIcon,
  Groups2: Groups2RoundedIcon,
  Handshake: HandshakeRoundedIcon,
  HowToReg: HowToRegRoundedIcon,
  LocalActivity: LocalActivityRoundedIcon,
  LocationOn: LocationOnRoundedIcon,
  MeetingRoom: MeetingRoomRoundedIcon,
  People: PeopleRoundedIcon,
  PersonAdd: PersonAddRoundedIcon,
  PersonSearch: PersonSearchRoundedIcon,
  Place: PlaceRoundedIcon,
  Public: PublicRoundedIcon,
  RecordVoiceOver: RecordVoiceOverRoundedIcon,
  Schedule: ScheduleRoundedIcon,
  School: SchoolRoundedIcon,
  Today: TodayRoundedIcon,
  VolunteerActivism: VolunteerActivismRoundedIcon,
  WavingHand: WavingHandRoundedIcon,
  WorkspacePremium: WorkspacePremiumRoundedIcon,
} satisfies Record<string, ComponentType<SvgIconProps>>;

export const MUI_ICON_OPTIONS = Object.keys(MUI_ICON_COMPONENTS).sort((left, right) => left.localeCompare(right));

export const getMuiIcon = (name?: string | null): ComponentType<SvgIconProps> =>
  MUI_ICON_COMPONENTS[name as keyof typeof MUI_ICON_COMPONENTS] ?? MUI_ICON_COMPONENTS[DEFAULT_MUI_ICON];

const toMaterialSymbolName = (name?: string | null) =>
  (name?.trim() || DEFAULT_MUI_ICON)
    .replace(/Rounded$|Outlined$|TwoTone$|Sharp$/u, '')
    .replace(/([a-z0-9])([A-Z])/gu, '$1_$2')
    .replace(/[\s-]+/gu, '_')
    .toLowerCase();

export interface MuiIconProps extends Omit<SvgIconProps, 'name'> {
  name?: string | null;
}

export const MuiIcon = ({ name, ...props }: MuiIconProps) => {
  const knownIcon = MUI_ICON_COMPONENTS[name as keyof typeof MUI_ICON_COMPONENTS];
  if (knownIcon) return createElement(knownIcon, props);

  return createElement(
    MaterialIcon,
    {
      ...(props as IconProps),
      baseClassName: 'material-symbols-rounded',
    },
    toMaterialSymbolName(name),
  );
};
