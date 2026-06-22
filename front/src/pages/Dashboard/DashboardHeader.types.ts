import type { DashboardNavigationItem } from '@utils/dashboard';
import type { Congregation } from '@/types/congregation.types';

export interface DashboardHeaderProps {
  congregationName: string;
  congregationId?: string;
  logoSrc?: string;
  congregations: Congregation[];
  username?: string;
  homeLabel: string;
  logoutLabel: string;
  switchCongregationLabel: string;
  favoriteItems: DashboardNavigationItem[];
  onLogout: () => void;
  onMenuClick: () => void;
  onLogoClick: () => void;
  onCongregationChange: (congregationId: string) => void;
  onFavoriteNavigate: (path: string) => void;
}
