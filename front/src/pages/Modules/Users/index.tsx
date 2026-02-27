import { Stack } from '@mui/material';
import { ModuleSection } from '../../../components/common/modules/ModuleSection';
import { RolesSection } from './RolesSection';
import { UsersModuleProps } from './users.types';

export const UsersModule = ({ title, description }: UsersModuleProps) => (
  <Stack spacing={3}>
    <ModuleSection title={title} description={description} />
    <RolesSection />
  </Stack>
);
