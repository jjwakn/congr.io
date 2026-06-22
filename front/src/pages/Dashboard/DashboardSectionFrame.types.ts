import type { ReactNode } from 'react';

export interface DashboardSectionFrameProps {
  title: string;
  children: ReactNode;
  favorite?: boolean;
  favoriteLabel?: string;
  onToggleFavorite?: () => void;
}
