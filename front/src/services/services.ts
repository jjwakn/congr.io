import type { ModuleType } from '@utils/http';

export const ServicesService: ModuleType = {
  list: { url: 'service', method: 'GET' },
  get: { url: 'service/{id}', method: 'GET' },
  create: { url: 'service', method: 'POST' },
  update: { url: 'service/{id}', method: 'PUT' },
  remove: { url: 'service/{id}', method: 'DELETE' },
};

export const ServiceNewPeopleService: ModuleType = {
  list: { url: 'service-new-people', method: 'GET' },
  get: { url: 'service-new-people/{id}', method: 'GET' },
  create: { url: 'service-new-people', method: 'POST' },
  update: { url: 'service-new-people/{id}', method: 'PUT' },
  remove: { url: 'service-new-people/{id}', method: 'DELETE' },
  addPerson: { url: 'service-new-people/{id}/person', method: 'POST' },
  removePerson: { url: 'service-new-people/{id}/person/{personId}', method: 'DELETE' },
};

export const ServiceAttendanceService: ModuleType = {
  list: { url: 'service-attendance', method: 'GET' },
  get: { url: 'service-attendance/{id}', method: 'GET' },
  create: { url: 'service-attendance', method: 'POST' },
  update: { url: 'service-attendance/{id}', method: 'PUT' },
  remove: { url: 'service-attendance/{id}', method: 'DELETE' },
  delta: { url: 'service-attendance/delta', method: 'POST' },
};
