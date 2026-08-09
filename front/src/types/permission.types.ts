export type PermissionAction = 'get' | 'create' | 'update' | 'delete' | 'change_password' | 'lock';

export type PermissionMap = {
  [sectionId: string]: PermissionAction[];
};

export interface PermissionSection {
  id: string;
  permissions: PermissionAction[];
}
