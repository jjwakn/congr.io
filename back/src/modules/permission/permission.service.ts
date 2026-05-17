import { ModuleAction, permission } from 'src/utils/constants';
import { Injectable } from '@nestjs/common';
import { PermissionModuleType } from './permission.types';

@Injectable()
export class PermissionService {
  list() {
    return Object.keys(permission)
      .sort((a, b) => (a > b ? 1 : -1))
      .map((k) => ({
        id: k,
        permissions: (permission[k] as PermissionModuleType).permissions,
      }));
  }

  listActions() {
    return Object.keys(ModuleAction);
  }
}
