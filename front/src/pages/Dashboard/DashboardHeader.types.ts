export interface DashboardHeaderProps {
  congregationName: string;
  username?: string;
  homeLabel: string;
  logoutLabel: string;
  onLogout: () => void;
  onMenuClick: () => void;
  onLogoClick: () => void;
}
