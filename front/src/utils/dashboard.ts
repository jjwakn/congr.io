import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { type ReactNode, createElement } from 'react';
import { getModulePath, getSettingsPath } from './routes';

export interface DashboardNavigationItem {
  id: string;
  label: string;
  icon: ReactNode;
  path: string;
}

interface CreateSettingsNavigationItemProps {
  label: string;
  language?: string;
}

interface CreateModuleNavigationItemProps {
  moduleId: string;
  label: string;
  language?: string;
}

export const getModuleIcon = (moduleId: string): DashboardNavigationItem['icon'] => {
  switch (moduleId) {
    case 'users':
      return createElement(PeopleAltOutlinedIcon, { fontSize: 'small' });
    case 'members':
      return createElement(GroupsOutlinedIcon, { fontSize: 'small' });
    case 'events_calendar':
      return createElement(EventOutlinedIcon, { fontSize: 'small' });
    case 'events_attendance':
      return createElement(HowToRegOutlinedIcon, { fontSize: 'small' });
    case 'ministries':
      return createElement(AccountTreeOutlinedIcon, { fontSize: 'small' });
    case 'ministries_calendar':
      return createElement(CalendarMonthOutlinedIcon, { fontSize: 'small' });
    default:
      return createElement(AppsOutlinedIcon, { fontSize: 'small' });
  }
};

export const createSettingsNavigationItem = ({
  label,
  language,
}: CreateSettingsNavigationItemProps): DashboardNavigationItem => ({
  id: 'settings',
  label,
  icon: createElement(SettingsOutlinedIcon, { fontSize: 'small' }),
  path: getSettingsPath(language),
});

export const createModuleNavigationItem = ({
  moduleId,
  label,
  language,
}: CreateModuleNavigationItemProps): DashboardNavigationItem => ({
  id: moduleId,
  label,
  icon: getModuleIcon(moduleId),
  path: getModulePath(moduleId, language),
});
