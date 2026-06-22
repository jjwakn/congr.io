import type { CreateEditDialogMode } from '@components/common/forms/CreateEditDialog.types';
import type { ListDirection } from '@components/common/modules/useModuleList.types';
import type { SxProps, Theme } from '@mui/material';
import type { Congregation, Location } from '@/types/congregation.types';
import type { Role } from '@/types/role.types';
import type { User } from '@/types/user.types';

export interface UsersListResponse {
  result: User[];
  total: number;
}

export interface UseUsersListProps {
  enabled?: boolean;
}

export type UserSort = 'name' | 'username' | 'enabled';

export interface UseUsersListResult {
  users: User[];
  total: number;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  search: string;
  setSearch: (value: string) => void;
  sort: UserSort;
  direction: ListDirection;
  page: number;
  pageSize: number;
  handleSort: (value: string) => void;
  handleChangePage: (value: number) => void;
  handleChangeRowsPerPage: (value: number) => void;
}

export type UserDialogMode = CreateEditDialogMode;

export interface UserFormValues {
  [key: string]: string | boolean | string[] | null | undefined;
  username?: string;
  password?: string;
  name: string;
  enabled?: boolean;
  roles_ids?: string[];
  congregations_ids?: string[];
  locations_ids?: string[];
  person_id?: string | null;
}

export interface UserMetadata {
  roles: Role[];
  congregations: Congregation[];
  locations: Location[];
}

export interface UserFormDialogProps {
  open: boolean;
  mode: UserDialogMode;
  user: User | null;
  metadata: UserMetadata;
  submitting: boolean;
  isSelfEdit?: boolean;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
}

export interface UserDetailsDialogProps {
  open: boolean;
  user: User | null;
  editDisabled?: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export interface UserRelationOption {
  id: string;
  label: string;
}

export interface UserRelationSelectProps {
  label: string;
  options: UserRelationOption[];
  value: string[];
  disabled: boolean;
  emptyText: string;
  helperText?: string;
  sx?: SxProps<Theme>;
  onChange: (value: string[]) => void;
}

export interface UserRelationSummaryProps {
  label: string;
  values: string[];
  emptyText: string;
}
