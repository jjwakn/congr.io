import type { Dispatch, ReactNode, SetStateAction } from 'react';

export interface DashboardSectionActionsContextValue {
  actions: ReactNode;
  setActions: Dispatch<SetStateAction<ReactNode>>;
}
