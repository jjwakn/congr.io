import { RolesManagement } from './RolesManagement';
import { RolesModuleProps } from './roles.types';

export const RolesModule = ({ title, description, showSummary = true }: RolesModuleProps) => (
  <RolesManagement title={title} description={description} showSummary={showSummary} />
);
