import { ModuleSection } from '@components/common/modules/ModuleSection';
import { Stack } from '@mui/material';
import { RolesSection } from './RolesSection';
import { UsersModuleProps } from './users.types';

export const UsersModule = ({ title, description, showSummary = true }: UsersModuleProps) => (
  <Stack spacing={3}>
    {showSummary ? <ModuleSection title={title} description={description} /> : null}
    <RolesSection />
  </Stack>
);
