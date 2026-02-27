import type { ReactNode } from 'react';

export interface ModuleListActionsProps {
  refreshLabel: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  children?: ReactNode;
}
