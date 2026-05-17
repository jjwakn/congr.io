import { RolesModule } from './Roles';
import { UsersModule } from './Users';
import type { ModuleRouteDefinition } from './moduleRoutes.types';

export const UsersRoute: ModuleRouteDefinition = {
  id: 'users',
  Component: UsersModule,
};

export const RolesRoute: ModuleRouteDefinition = {
  id: 'roles',
  Component: RolesModule,
};

export const moduleRoutes: ModuleRouteDefinition[] = [UsersRoute, RolesRoute];

export const getModuleRoute = (moduleId: string): ModuleRouteDefinition | null =>
  moduleRoutes.find((route) => route.id === moduleId) ?? null;

export const canRenderModuleRoute = (moduleId: string): boolean => Boolean(getModuleRoute(moduleId));
