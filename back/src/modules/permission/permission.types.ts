import { Module, ModuleAction } from 'src/utils/constants';

export interface PermissionModuleType {
  id?: string;
  permissions: ModuleAction[];
}

export type PermissionType = {
  [key in Module]: PermissionModuleType;
};

export type UserPermission = {
  [key in keyof typeof Module]?: ModuleAction[];
};

export type PermissionSectionResolver = (controller: { module?: Module }) => Module;

export interface PermissionMetadata {
  section: Module | PermissionSectionResolver;
  action: ModuleAction;
}
