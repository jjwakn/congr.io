import { EventsService } from '@services/events';
import { PersonsService } from '@services/persons';
import { ProcessesService } from '@services/processes';
import { RolesService } from '@services/roles';
import { UsersService } from '@services/users';
import { httpRequest } from './http';
import type { PreloadResourceId } from './preload.types';
import { getSelectedCongregationId } from './storage';

const FAVORITE_PRELOAD_REQUIREMENTS: Record<string, PreloadResourceId[]> = {
  events_calendar: ['events'],
  events_attendance: ['events', 'members'],
  event_registration: ['events', 'members'],
  members: ['members'],
  processes: ['processes'],
  roles: ['roles'],
  users: ['users'],
};

const cache = new Map<string, unknown>();
const inFlight = new Map<string, Promise<unknown>>();

const getCacheKey = (resource: PreloadResourceId) => `${getSelectedCongregationId() ?? 'none'}:${resource}`;

export const getPreloadedResource = <Response>(resource: PreloadResourceId): Response | null =>
  (cache.get(getCacheKey(resource)) as Response | undefined) ?? null;

const loadResource = (resource: PreloadResourceId, pageSize: number) => {
  const key = getCacheKey(resource);
  if (cache.has(key)) return Promise.resolve(cache.get(key));
  const existing = inFlight.get(key);
  if (existing) return existing;

  const listData = { page: 0, size: pageSize, direction: 'ASC' };
  const request =
    resource === 'events'
      ? httpRequest({
          service: EventsService.list,
          data: {
            ...listData,
            start: new Date().toISOString(),
            end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            order: 'start_datetime',
          },
        })
      : resource === 'users'
        ? httpRequest({ service: UsersService.list, data: { ...listData, order: 'name' } })
        : resource === 'roles'
          ? httpRequest({ service: RolesService.list, data: { ...listData, order: 'name' } })
          : resource === 'members'
            ? httpRequest({ service: PersonsService.list, data: { ...listData, order: 'last_name' } })
            : httpRequest({ service: ProcessesService.list, data: { ...listData, order: 'name' } });

  const tracked = request
    .then((response) => {
      cache.set(key, response);
      return response;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, tracked);
  return tracked;
};

export const preloadDashboardResources = ({ favorites, pageSize }: { favorites: string[]; pageSize: number }) => {
  const resources = new Set<PreloadResourceId>(['events']);
  favorites.forEach((favorite) => {
    const requirementKey = favorite.startsWith('registration-type:') ? 'event_registration' : favorite;
    FAVORITE_PRELOAD_REQUIREMENTS[requirementKey]?.forEach((resource) => resources.add(resource));
  });

  return Promise.all(Array.from(resources).map((resource) => loadResource(resource, pageSize)));
};
