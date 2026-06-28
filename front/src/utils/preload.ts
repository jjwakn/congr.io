import { EventsService } from '@services/events';
import { PersonsService } from '@services/persons';
import { ProcessesService } from '@services/processes';
import { RolesService } from '@services/roles';
import { UsersService } from '@services/users';
import type { EventsListResponse } from '@/types/event.types';
import type { Person } from '@/types/person.types';
import type { Process } from '@/types/process.types';
import type { Role } from '@/types/role.types';
import type { User } from '@/types/user.types';
import { httpRequest } from './http';
import type { PreloadResourceId } from './preload.types';
import { getSelectedCongregationId } from './storage';

type ListResponse<Item> = {
  result: Item[];
  total: number;
};

type PreloadedResource =
  | EventsListResponse
  | ListResponse<Person>
  | ListResponse<Process>
  | ListResponse<Role>
  | ListResponse<User>;

const FAVORITE_PRELOAD_REQUIREMENTS: Record<string, PreloadResourceId[]> = {
  events_calendar: ['events'],
  events_attendance: ['events', 'members'],
  event_registration: ['events', 'members'],
  members: ['members'],
  processes: ['processes'],
  roles: ['roles'],
  users: ['users'],
};

const cache = new Map<string, PreloadedResource>();
const inFlight = new Map<string, Promise<PreloadedResource>>();

const getCacheKey = (resource: PreloadResourceId) => `${getSelectedCongregationId() ?? 'none'}:${resource}`;

export const getPreloadedResource = <Response>(resource: PreloadResourceId): Response | null =>
  (cache.get(getCacheKey(resource)) as Response | undefined) ?? null;

const loadResource = (resource: PreloadResourceId, pageSize: number) => {
  const key = getCacheKey(resource);
  if (cache.has(key)) return Promise.resolve(cache.get(key));
  const existing = inFlight.get(key);
  if (existing) return existing;

  const listData = { page: 0, size: pageSize, direction: 'ASC' };
  const request: Promise<PreloadedResource> =
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
