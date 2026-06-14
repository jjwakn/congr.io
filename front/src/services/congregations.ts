import { ModuleType } from '@utils/http';

export const CongregationsService: ModuleType = {
  get: { url: 'congregation/{id}', method: 'GET' },
  update: { url: 'congregation/{id}', method: 'PUT' },
};
