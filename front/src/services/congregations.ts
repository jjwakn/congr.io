import { ModuleType } from '@utils/http';

export const CongregationsService: ModuleType = {
  list: { url: 'congregation', method: 'GET' },
  get: { url: 'congregation/{id}', method: 'GET' },
  create: { url: 'congregation', method: 'POST' },
  update: { url: 'congregation/{id}', method: 'PUT' },
};
