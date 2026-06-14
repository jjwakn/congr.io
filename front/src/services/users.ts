import { ModuleType } from '@utils/http';

export const UsersService: ModuleType = {
  list: { url: 'user', method: 'GET' },
  get: { url: 'user/{id}', method: 'GET' },
  create: { url: 'user', method: 'POST' },
  update: { url: 'user/{id}', method: 'PUT' },
  changeOwnPassword: { url: 'user/me/password', method: 'PUT' },
  completeTemporaryPassword: { url: 'user/me/temporary-password', method: 'PUT' },
  setTemporaryPassword: { url: 'user/{id}/temporary-password', method: 'PUT' },
  remove: { url: 'user/{id}', method: 'DELETE' },
};
