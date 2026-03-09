import type { DashboardModuleView } from '@pages/Modules';

export interface DashboardContentRoutesProps {
  availableModules: DashboardModuleView[];
  homeTitle: string;
  homeSubtitle: string;
  settingsTitle: string;
  settingsSubtitle: string;
  loadingLabel: string;
  noModulesLabel: string;
  moduleNotFoundLabel: string;
  settingsPath: string;
}
