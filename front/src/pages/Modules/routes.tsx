import { lazy } from 'react';
import { RolesModule } from './Roles';
import { UsersModule } from './Users';
import type { ModuleRouteDefinition } from './moduleRoutes.types';

const EventCalendar = lazy(() => import('./Events/EventCalendar'));
const EventsManagement = lazy(() => import('./Events/EventsManagement'));
const PersonsModule = lazy(() => import('./Persons'));
const AttendanceManagement = lazy(() => import('./Attendance/AttendanceManagement'));
const RegistrationManagement = lazy(() => import('./Registration/RegistrationManagement'));
const FlowsManagement = lazy(() => import('./Flows'));
const ServicesManagement = lazy(() => import('./Services/ServicesManagement'));
const ServiceNewPeopleManagement = lazy(() => import('./Services/ServiceNewPeopleManagement'));
const ServiceFollowUpManagement = lazy(() => import('./Services/ServiceFollowUpManagement'));
const ServiceAttendanceManagement = lazy(() => import('./Services/ServiceAttendanceManagement'));

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
  Component: EventsManagement,
};
export const PersonsRoute: ModuleRouteDefinition = { id: 'members', Component: PersonsModule };
export const AttendanceRoute: ModuleRouteDefinition = { id: 'events_attendance', Component: AttendanceManagement };
export const RegistrationRoute: ModuleRouteDefinition = { id: 'event_registration', Component: RegistrationManagement };
export const FlowsRoute: ModuleRouteDefinition = { id: 'processes', Component: FlowsManagement };
export const ServicesRoute: ModuleRouteDefinition = { id: 'services', Component: ServicesManagement };
export const ServiceNewPeopleRoute: ModuleRouteDefinition = {
  id: 'services_new_people',
  Component: ServiceNewPeopleManagement,
};
export const ServiceFollowUpRoute: ModuleRouteDefinition = {
  id: 'services_follow_up',
  Component: ServiceFollowUpManagement,
};
export const ServiceAttendanceRoute: ModuleRouteDefinition = {
  id: 'services_attendance',
  Component: ServiceAttendanceManagement,
};

export const moduleRoutes: ModuleRouteDefinition[] = [
  UsersRoute,
  RolesRoute,
  EventsRoute,
  EventsListRoute,
  PersonsRoute,
  AttendanceRoute,
  RegistrationRoute,
  FlowsRoute,
  ServicesRoute,
  ServiceNewPeopleRoute,
  ServiceFollowUpRoute,
  ServiceAttendanceRoute,
];

export const getModuleRoute = (moduleId: string): ModuleRouteDefinition | null =>
  moduleRoutes.find((route) => route.id === moduleId) ?? null;

export const canRenderModuleRoute = (moduleId: string): boolean => Boolean(getModuleRoute(moduleId));
