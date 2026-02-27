import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { ReactNode } from 'react';
import { getModulePath, getSettingsPath } from '../../../utils/routes';

export type DashboardNavigationItem = {
  id: string;
  label: string;
  icon: ReactNode;
  path: string;
};

export const getModuleIcon = (moduleId: string): ReactNode => {
  switch (moduleId) {
    case 'users':
      return <PeopleAltOutlinedIcon fontSize="small" />;
    case 'members':
      return <GroupsOutlinedIcon fontSize="small" />;
    case 'events_calendar':
      return <EventOutlinedIcon fontSize="small" />;
    case 'events_attendance':
      return <HowToRegOutlinedIcon fontSize="small" />;
    case 'ministries':
      return <AccountTreeOutlinedIcon fontSize="small" />;
    case 'ministries_calendar':
      return <CalendarMonthOutlinedIcon fontSize="small" />;
    default:
      return <AppsOutlinedIcon fontSize="small" />;
  }
};

export const createSettingsNavigationItem = ({
  label,
  language,
}: {
  label: string;
  language?: string;
}): DashboardNavigationItem => ({
  id: 'settings',
  label,
  icon: <SettingsOutlinedIcon fontSize="small" />,
  path: getSettingsPath(language),
});

export const createModuleNavigationItem = ({
  moduleId,
  label,
  language,
}: {
  moduleId: string;
  label: string;
  language?: string;
}): DashboardNavigationItem => ({
  id: moduleId,
  label,
  icon: getModuleIcon(moduleId),
  path: getModulePath(moduleId, language),
});
