import { lazy } from 'react';
import { RolesModule } from './Roles';
import { UsersModule } from './Users';
import type { ModuleRouteDefinition } from './moduleRoutes.types';

const EventCalendar = lazy(() => import('./Events/EventCalendar'));
const PersonsModule = lazy(() => import('./Persons'));
const AttendanceManagement = lazy(() => import('./Attendance/AttendanceManagement'));
const RegistrationManagement = lazy(() => import('./Registration/RegistrationManagement'));
const FlowsManagement = lazy(() => import('./Flows'));

export const UsersRoute: ModuleRouteDefinition = {
  id: 'users',
  Component: UsersModule,
};

export const RolesRoute: ModuleRouteDefinition = {
  id: 'roles',
  Component: RolesModule,
};

export const EventsRoute: ModuleRouteDefinition = {
  id: 'events_calendar',
  Component: EventCalendar,
};
export const EventsListRoute: ModuleRouteDefinition = {
  id: 'events',
  Component: EventCalendar,
};
export const PersonsRoute: ModuleRouteDefinition = { id: 'members', Component: PersonsModule };
export const AttendanceRoute: ModuleRouteDefinition = { id: 'events_attendance', Component: AttendanceManagement };
export const RegistrationRoute: ModuleRouteDefinition = { id: 'event_registration', Component: RegistrationManagement };
export const FlowsRoute: ModuleRouteDefinition = { id: 'processes', Component: FlowsManagement };

export const moduleRoutes: ModuleRouteDefinition[] = [
  UsersRoute,
  RolesRoute,
  EventsRoute,
  EventsListRoute,
  PersonsRoute,
  AttendanceRoute,
  RegistrationRoute,
  FlowsRoute,
];

export const getModuleRoute = (moduleId: string): ModuleRouteDefinition | null =>
  moduleRoutes.find((route) => route.id === moduleId) ?? null;

export const canRenderModuleRoute = (moduleId: string): boolean => Boolean(getModuleRoute(moduleId));
