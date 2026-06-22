import { createContext } from 'react';
import type { DashboardSectionActionsContextValue } from './DashboardSectionActionsContext.types';

export const DashboardSectionActionsContext = createContext<DashboardSectionActionsContextValue | null>(null);
