import type { ModuleType } from '@utils/http';

export const PersonsService: ModuleType = {
  list: { url: 'person', method: 'GET' },
  get: { url: 'person/{id}', method: 'GET' },
  flows: { url: 'person/{id}/flows', method: 'GET' },
  create: { url: 'person', method: 'POST' },
  update: { url: 'person/{id}', method: 'PUT' },
  remove: { url: 'person/{id}', method: 'DELETE' },
};
export const PersonFieldsService: ModuleType = {
  list: { url: 'person-field', method: 'GET' },
  get: { url: 'person-field/{id}', method: 'GET' },
  create: { url: 'person-field', method: 'POST' },
  update: { url: 'person-field/{id}', method: 'PUT' },
  remove: { url: 'person-field/{id}', method: 'DELETE' },
};
