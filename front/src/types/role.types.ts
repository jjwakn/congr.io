import { CommonEntity } from './common.types';
import type { PermissionMap } from './permission.types';

export interface Role extends CommonEntity {
  name: string;
  permissions?: PermissionMap;
  full_access: boolean;
}
