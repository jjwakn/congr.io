import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import AltRouteOutlinedIcon from '@mui/icons-material/AltRouteOutlined';
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import type { TFunction } from 'i18next';
import { type ReactNode, createElement } from 'react';
import { getSettingsPath } from './routes';

export type DashboardNavigationCategoryId = 'events' | 'services' | 'people' | 'flows' | 'system';

export const DASHBOARD_NAVIGATION_CATEGORY_PREFIX = 'category:';

export const DASHBOARD_NAVIGATION_CATEGORY_MODULES: Record<DashboardNavigationCategoryId, string[]> = {
  events: ['events_calendar', 'events_attendance', 'events', 'event_registration'],
  services: ['services_attendance', 'services'],
  people: ['services_new_people', 'members', 'services_follow_up'],
  flows: ['processes'],
  system: ['users', 'roles'],
};

export const DASHBOARD_NAVIGATION_CATEGORY_IDS = Object.keys(
  DASHBOARD_NAVIGATION_CATEGORY_MODULES,
) as DashboardNavigationCategoryId[];

export const getDashboardCategoryPreferenceId = (categoryId: DashboardNavigationCategoryId) =>
  `${DASHBOARD_NAVIGATION_CATEGORY_PREFIX}${categoryId}`;

export interface DashboardNavigationItem {
  id: string;
  label: string;
  icon: ReactNode;
  path: string;
}

export interface DashboardNavigationCategory {
  id: DashboardNavigationCategoryId;
  preferenceId: string;
  label: string;
  icon: ReactNode;
  items: DashboardNavigationItem[];
}

interface CreateSettingsNavigationItemProps {
  label: string;
  language?: string;
}

interface CreateModuleNavigationItemProps {
  moduleId: string;
  label: string;
  path: string;
}

interface CreateDashboardNavigationCategoriesProps {
  modules: Array<{ id: string; title: string; path: string }>;
  sidebarOrder: string[];
  language: string;
  t: TFunction;
}

const getOrderValue = (order: Map<string, number>, ids: string[]) =>
  ids.reduce((current, id) => Math.min(current, order.get(id) ?? Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);

export const getModuleIcon = (moduleId: string): DashboardNavigationItem['icon'] => {
  switch (moduleId) {
    case 'roles':
      return createElement(AdminPanelSettingsOutlinedIcon, { fontSize: 'small' });
    case 'users':
      return createElement(PeopleAltOutlinedIcon, { fontSize: 'small' });
    case 'members':
      return createElement(GroupsOutlinedIcon, { fontSize: 'small' });
    case 'processes':
      return createElement(AltRouteOutlinedIcon, { fontSize: 'small' });
    case 'events_calendar':
      return createElement(EventOutlinedIcon, { fontSize: 'small' });
    case 'events_attendance':
      return createElement(HowToRegOutlinedIcon, { fontSize: 'small' });
    case 'event_registration':
      return createElement(HowToRegOutlinedIcon, { fontSize: 'small' });
    case 'ministries':
      return createElement(AccountTreeOutlinedIcon, { fontSize: 'small' });
    case 'ministries_calendar':
      return createElement(CalendarMonthOutlinedIcon, { fontSize: 'small' });
    case 'services':
      return createElement(VolunteerActivismOutlinedIcon, { fontSize: 'small' });
    case 'services_new_people':
      return createElement(PersonAddAltOutlinedIcon, { fontSize: 'small' });
    case 'services_follow_up':
      return createElement(AltRouteOutlinedIcon, { fontSize: 'small' });
    case 'services_attendance':
      return createElement(HowToRegOutlinedIcon, { fontSize: 'small' });
    default:
      return createElement(AppsOutlinedIcon, { fontSize: 'small' });
  }
};

export const getDashboardCategoryId = (moduleId: string): DashboardNavigationCategoryId | null =>
  DASHBOARD_NAVIGATION_CATEGORY_IDS.find((categoryId) =>
    DASHBOARD_NAVIGATION_CATEGORY_MODULES[categoryId].includes(moduleId),
  ) ?? null;

export const getDashboardCategoryIcon = (
  categoryId: DashboardNavigationCategoryId,
): DashboardNavigationItem['icon'] => {
  switch (categoryId) {
    case 'events':
      return createElement(EventAvailableOutlinedIcon, { fontSize: 'small' });
    case 'services':
      return createElement(VolunteerActivismOutlinedIcon, { fontSize: 'small' });
    case 'people':
      return createElement(GroupsOutlinedIcon, { fontSize: 'small' });
    case 'flows':
      return createElement(AltRouteOutlinedIcon, { fontSize: 'small' });
    case 'system':
      return createElement(AdminPanelSettingsOutlinedIcon, { fontSize: 'small' });
  }
};

export const createDashboardNavigationCategories = ({
  modules,
  sidebarOrder,
  language,
  t,
}: CreateDashboardNavigationCategoriesProps): DashboardNavigationCategory[] => {
  const order = new Map(sidebarOrder.map((id, index) => [id, index]));
  const moduleById = new Map(modules.map((module) => [module.id, module]));
  const collator = new Intl.Collator(language, { sensitivity: 'base' });

  return DASHBOARD_NAVIGATION_CATEGORY_IDS.map((categoryId) => {
    const categoryModuleIds = DASHBOARD_NAVIGATION_CATEGORY_MODULES[categoryId];
    const items = categoryModuleIds
      .map((moduleId) => moduleById.get(moduleId))
      .filter((module): module is (typeof modules)[number] => Boolean(module))
      .map((module) =>
        createModuleNavigationItem({
          moduleId: module.id,
          label: module.title,
          path: module.path,
        }),
      )
      .sort((left, right) => {
        const leftOrder = order.get(left.id);
        const rightOrder = order.get(right.id);
        if (leftOrder !== undefined || rightOrder !== undefined)
          return (leftOrder ?? Number.MAX_SAFE_INTEGER) - (rightOrder ?? Number.MAX_SAFE_INTEGER);

        return collator.compare(left.label, right.label);
      });

    return {
      id: categoryId,
      preferenceId: getDashboardCategoryPreferenceId(categoryId),
      label: t(`pages.dashboard.categories.${categoryId}`),
      icon: getDashboardCategoryIcon(categoryId),
      items,
    };
  })
    .filter((category) => category.items.length > 0)
    .sort((left, right) => {
      const leftOrder = getOrderValue(order, [left.preferenceId, ...left.items.map((item) => item.id)]);
      const rightOrder = getOrderValue(order, [right.preferenceId, ...right.items.map((item) => item.id)]);
      if (leftOrder !== Number.MAX_SAFE_INTEGER || rightOrder !== Number.MAX_SAFE_INTEGER)
        return leftOrder - rightOrder;

      return collator.compare(left.label, right.label);
    });
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
  path,
}: CreateModuleNavigationItemProps): DashboardNavigationItem => ({
  id: moduleId,
  label,
  icon: getModuleIcon(moduleId),
  path,
});
