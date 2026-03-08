import { ModuleSection } from '../../components/common/modules/ModuleSection';
import { UsersModule } from './Users';
import { DashboardModuleView, ModulesRendererProps } from './modules.types';

export type { DashboardModuleView };

export const ModulesRenderer = ({ module }: ModulesRendererProps) => {
  if (module.id === 'users') return <UsersModule title={module.title} description={module.description} />;

  return <ModuleSection title={module.title} description={module.description} />;
};
