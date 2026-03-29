import { useModuleList } from '@components/common/modules/useModuleList';
import { RolesService } from '@services/roles';
import { HttpRequestError, httpRequest } from '@utils/http';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PermissionAction } from '@/types/permission.types';
import type { Role } from '@/types/role.types';
import type { RoleSort, RolesListResponse, SortRolesProps, UseRolesListProps, UseRolesListResult } from './roles.types';

const PERMISSION_ACTIONS: PermissionAction[] = ['get', 'create', 'update', 'delete'];

const hasRolePermission = (role: Role, sectionId: string, action: PermissionAction): boolean => {
  if (role.full_access) return true;

  return role.permissions?.[sectionId]?.includes(action) ?? false;
};

const parsePermissionSort = (sort: string): { sectionId: string; action: PermissionAction } | null => {
  const separatorIndex = sort.lastIndexOf('-');
  if (separatorIndex <= 0) return null;

  const sectionId = sort.slice(0, separatorIndex);
  const action = sort.slice(separatorIndex + 1) as PermissionAction;

  return PERMISSION_ACTIONS.includes(action)
    ? {
        sectionId,
        action,
      }
    : null;
};

const sortRoles = ({ data, sort, direction }: SortRolesProps) => {
  const sortDirection = direction === 'DESC' ? -1 : 1;
  const compareNames = (left: Role, right: Role) =>
    left.name.localeCompare(right.name, undefined, {
      sensitivity: 'base',
    });

  if (sort === 'name') {
    return [...data].sort((left, right) => compareNames(left, right) * sortDirection);
  }

  const permissionSort = parsePermissionSort(sort);
  if (permissionSort) {
    return [...data].sort((left, right) => {
      const leftValue = Number(hasRolePermission(left, permissionSort.sectionId, permissionSort.action));
      const rightValue = Number(hasRolePermission(right, permissionSort.sectionId, permissionSort.action));
      const permissionComparison = (leftValue - rightValue) * sortDirection;

      return permissionComparison || compareNames(left, right);
    });
  }

  return data;
};

export const useRolesList = ({ enabled = true }: UseRolesListProps = {}): UseRolesListResult => {
  const { t } = useTranslation();
  const [sourceRoles, setSourceRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    direction,
    sort,
    page,
    pageSize,
    search,
    setSearch,
    setPage,
    handleSort,
    handleChangePage,
    handleChangeRowsPerPage,
  } = useModuleList({
    moduleKey: 'roles-list',
    defaultSort: 'name',
    defaultPageSize: 10,
  });

  const refresh = useCallback(async () => {
    if (!enabled) {
      setSourceRoles([]);
      setError('');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await httpRequest<RolesListResponse>({
        service: RolesService.list,
      });
      setSourceRoles(response.result ?? []);
    } catch (value) {
      const message =
        value instanceof HttpRequestError || value instanceof Error
          ? value.message
          : t('pages.modules.roles.error.loadFailed');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [enabled, t]);

  useEffect(() => {
    if (!enabled) {
      setSourceRoles([]);
      setError('');
      setLoading(false);
      return;
    }

    void refresh();
  }, [enabled, refresh]);

  const filteredAndSorted = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = normalizedSearch
      ? sourceRoles.filter((role) => {
          const roleTerms = [role.id, role.name, role.full_access ? 'true' : 'false'].join(' ').toLowerCase();
          return roleTerms.includes(normalizedSearch);
        })
      : sourceRoles;

    return sortRoles({ data: filtered, sort: sort as RoleSort, direction });
  }, [direction, search, sort, sourceRoles]);

  const total = filteredAndSorted.length;
  const roles = useMemo(() => {
    const start = page * pageSize;
    return filteredAndSorted.slice(start, start + pageSize);
  }, [filteredAndSorted, page, pageSize]);

  useEffect(() => {
    if (page <= 0) return;
    const maxPage = Math.max(0, Math.ceil(total / pageSize) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [page, pageSize, setPage, total]);

  return {
    roles,
    total,
    loading,
    error,
    refresh,
    search,
    setSearch,
    sort: sort as RoleSort,
    direction,
    page,
    pageSize,
    handleSort,
    handleChangePage,
    handleChangeRowsPerPage,
  };
};
