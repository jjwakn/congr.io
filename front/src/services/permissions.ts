import { ModuleType } from '@utils/http';

export const PermissionsService: ModuleType = {
  list: { url: 'permissions', method: 'GET' },
  listActions: { url: 'permissions/actions', method: 'GET' },
};
