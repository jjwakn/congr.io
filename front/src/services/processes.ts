import type { ModuleType } from '@utils/http';

export const ProcessesService: ModuleType = {
  list: { url: 'process', method: 'GET' },
  get: { url: 'process/{id}', method: 'GET' },
  create: { url: 'process', method: 'POST' },
  update: { url: 'process/{id}', method: 'PUT' },
  remove: { url: 'process/{id}', method: 'DELETE' },
};
