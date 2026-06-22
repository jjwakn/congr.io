import type { ModuleType } from '@utils/http';

export const EventFieldsService: ModuleType = {
  list: { url: 'event-field', method: 'GET' },
  get: { url: 'event-field/{id}', method: 'GET' },
  create: { url: 'event-field', method: 'POST' },
  update: { url: 'event-field/{id}', method: 'PUT' },
  remove: { url: 'event-field/{id}', method: 'DELETE' },
};
