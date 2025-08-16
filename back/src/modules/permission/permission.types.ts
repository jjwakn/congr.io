import { Module, ModuleAction } from 'src/utils/constants';

export interface PermissionModuleType {
  id?: string;
  permissions: ModuleAction[];
}

export type PermissionType = {
  [key in keyof typeof Module]?: PermissionModuleType;
};

export type UserPermission = {
  [key in keyof typeof Module]?: ModuleAction[];
};

export interface PermissionMetadata {
  section: Module;
  action: ModuleAction;
}
