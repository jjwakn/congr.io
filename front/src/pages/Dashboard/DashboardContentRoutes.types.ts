import type { DashboardModuleView } from '@pages/Modules/modules.types';

export interface DashboardContentRoutesProps {
  availableModules: DashboardModuleView[];
  homeTitle: string;
  homeSubtitle: string;
  settingsTitle: string;
  loadingLabel: string;
  moduleNotFoundLabel: string;
  settingsPath: string;
}
