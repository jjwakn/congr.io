import type { ModuleType } from '@utils/http';

export const EventTypesService: ModuleType = {
  list: { url: 'event_type', method: 'GET' },
  get: { url: 'event_type/{id}', method: 'GET' },
  create: { url: 'event_type', method: 'POST' },
  update: { url: 'event_type/{id}', method: 'PUT' },
  remove: { url: 'event_type/{id}', method: 'DELETE' },
};
