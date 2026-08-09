import type { ModuleType } from '@utils/http';

export const EventsService: ModuleType = {
  list: { url: 'event', method: 'GET' },
  get: { url: 'event/{id}', method: 'GET' },
  create: { url: 'event', method: 'POST' },
  update: { url: 'event/{id}', method: 'PUT' },
  remove: { url: 'event/{id}', method: 'DELETE' },
  setRegistrationLock: { url: 'event/{id}/registration-lock', method: 'PUT' },
  publicList: { url: 'public/events', method: 'GET' },
  publicGet: { url: 'public/events/{id}', method: 'GET' },
};
