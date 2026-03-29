export type PermissionAction = 'get' | 'create' | 'update' | 'delete';

export type PermissionMap = {
  [sectionId: string]: PermissionAction[];
};

export interface PermissionSection {
  id: string;
  permissions: PermissionAction[];
}
