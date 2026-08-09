import type { DashboardNavigationCategory, DashboardNavigationItem } from '@utils/dashboard';

export interface DashboardNavigationDrawerProps {
  categories: DashboardNavigationCategory[];
  settingsItem: DashboardNavigationItem;
  selectedPath: string;
  congregationName: string;
  logoSrc?: string;
  homeLabel: string;
  open: boolean;
  onNavigate: (path: string) => void;
  onLogoClick: () => void;
  onClose: () => void;
}

export interface NavigationItemsProps {
  categories: DashboardNavigationCategory[];
  settingsItem: DashboardNavigationItem;
  selectedPath: string;
  onNavigate: (path: string) => void;
}
