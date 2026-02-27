import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModuleList } from '../../../components/common/modules/useModuleList';
import { RolesService } from '../../../services/roles';
import type { Role } from '../../../types/role.types';
import { HttpRequestError, httpRequest } from '../../../utils/http';
import type {
  RoleSort,
  RolesListResponse,
  SortRolesProps,
  UseRolesListResult,
} from './useRolesList.types';

const sortRoles = ({ data, sort, direction }: SortRolesProps) => {
  const sortDirection = direction === 'DESC' ? -1 : 1;

  if (sort === 'name') {
    return [...data].sort(
      (left, right) =>
        left.name.localeCompare(right.name, undefined, {
          sensitivity: 'base',
        }) * sortDirection,
    );
  }

  return data;
};

export const useRolesList = (): UseRolesListResult => {
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
  }, [t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filteredAndSorted = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = normalizedSearch
      ? sourceRoles.filter((role) => {
          const roleTerms = [
            role.id,
            role.name,
            role.full_access ? 'true' : 'false',
          ]
            .join(' ')
            .toLowerCase();
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
