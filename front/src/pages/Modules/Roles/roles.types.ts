import type { ModuleListHeaderCell } from '@components/common/modules/ModuleListTable.types';
import type { ListDirection } from '@components/common/modules/useModuleList.types';
import type { PermissionAction, PermissionMap, PermissionSection } from '@/types/permission.types';
import type { Role } from '@/types/role.types';

export interface RolesModuleProps {
  title: string;
  description: string;
  showSummary?: boolean;
}

export type RolesManagementProps = RolesModuleProps;

export interface RolesListResponse {
  result: Role[];
  total: number;
}

export interface UseRolesListProps {
  enabled?: boolean;
}

export type RolePermissionSort = `${string}-${PermissionAction}`;

export type RoleSort = 'name' | RolePermissionSort;

export interface UseRolesListResult {
  roles: Role[];
  total: number;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  search: string;
  setSearch: (value: string) => void;
  sort: RoleSort;
  direction: ListDirection;
  page: number;
  pageSize: number;
  handleSort: (value: string) => void;
  handleChangePage: (value: number) => void;
  handleChangeRowsPerPage: (value: number) => void;
}

export interface SortRolesProps {
  data: Role[];
  sort: RoleSort;
  direction: ListDirection;
}

export type RoleDialogMode = 'create' | 'edit';

export interface RoleFormValues {
  [key: string]: string | boolean | PermissionMap;
  name: string;
  full_access: boolean;
  permissions: PermissionMap;
}

export interface RoleFormDialogProps {
  open: boolean;
  mode: RoleDialogMode;
  role: Role | null;
  sections: PermissionSection[];
  actions: PermissionAction[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: RoleFormValues) => void;
}

export interface PermissionsMatrixProps {
  actions: PermissionAction[];
  disabled: boolean;
  value: PermissionMap;
  sections: PermissionSection[];
  onToggle: (sectionId: string, action: PermissionAction) => void;
}

export interface DeleteRoleDialogProps {
  open: boolean;
  roleName: string;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export interface RolePermissionColumn {
  id: string;
  sectionId: string;
  action: PermissionAction;
}

export interface RoleTableSchema {
  headerRows: ModuleListHeaderCell[][];
  permissionColumns: RolePermissionColumn[];
}
