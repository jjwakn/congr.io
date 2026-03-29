import { ModuleType } from '@utils/http';

export const RolesService: ModuleType = {
  list: { url: 'role', method: 'GET' },
  get: { url: 'role/{id}', method: 'GET' },
  create: { url: 'role', method: 'POST' },
  update: { url: 'role/{id}', method: 'PUT' },
  remove: { url: 'role/{id}', method: 'DELETE' },
};
