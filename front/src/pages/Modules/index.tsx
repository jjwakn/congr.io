import { ModuleSection } from '@components/common/modules/ModuleSection';
import { UsersModule } from '@pages/Modules/Users';
import { DashboardModuleView, ModulesRendererProps } from '@pages/Modules/modules.types';

export type { DashboardModuleView };

export const ModulesRenderer = ({ module, showSummary = true }: ModulesRendererProps) => {
  if (module.id === 'users')
    return <UsersModule title={module.title} description={module.description} showSummary={showSummary} />;

  return showSummary ? <ModuleSection title={module.title} description={module.description} /> : null;
};
