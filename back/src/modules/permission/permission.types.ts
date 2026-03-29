import { Module, ModuleAction } from 'src/utils/constants';

export interface PermissionModuleType {
  id?: string;
  permissions: ModuleAction[];
}

export type PermissionType = Partial<Record<Module, PermissionModuleType>>;

export type UserPermission = Partial<Record<Module, ModuleAction[]>>;

export type PermissionSectionResolver = (controller: { module?: Module }) => Module;

export interface PermissionMetadata {
  section: Module | PermissionSectionResolver;
  action: ModuleAction;
}
