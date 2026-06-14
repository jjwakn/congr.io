import type { ModuleSectionAction } from './ModuleSectionActions.types';

export type ModuleStandardActionConfig = Omit<ModuleSectionAction, 'icon' | 'color'>;

export interface ModuleStandardActionsProps {
  createAction?: ModuleStandardActionConfig;
  refreshAction: ModuleStandardActionConfig;
  extraActions?: ModuleSectionAction[];
}
