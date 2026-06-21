import type { Congregation } from '@/types/congregation.types';

export interface DashboardHeaderProps {
  congregationName: string;
  congregationId?: string;
  congregations: Congregation[];
  username?: string;
  homeLabel: string;
  logoutLabel: string;
  switchCongregationLabel: string;
  onLogout: () => void;
  onMenuClick: () => void;
  onLogoClick: () => void;
  onCongregationChange: (congregationId: string) => void;
}
