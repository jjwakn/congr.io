import type { ListDirection } from '@components/common/modules/useModuleList.types';
import type { Role } from '@/types/role.types';

export interface RolesListResponse {
  result: Role[];
  total: number;
}

export type RoleSort = 'name';

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
