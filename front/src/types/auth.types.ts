import type { PermissionMap } from './permission.types';

export interface AuthPermissions {
  fullAccess: boolean;
  permissions: PermissionMap;
}
