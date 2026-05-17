import { ModuleType } from '@utils/http';

export const UsersService: ModuleType = {
  list: { url: 'user', method: 'GET' },
  get: { url: 'user/{id}', method: 'GET' },
  create: { url: 'user', method: 'POST' },
  update: { url: 'user/{id}', method: 'PUT' },
  remove: { url: 'user/{id}', method: 'DELETE' },
};
