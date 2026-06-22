import type { DashboardNavigationItem } from '@utils/dashboard';

export interface DashboardNavigationDrawerProps {
  items: DashboardNavigationItem[];
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
  items: DashboardNavigationItem[];
  selectedPath: string;
  onNavigate: (path: string) => void;
}
