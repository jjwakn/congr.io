import { useModuleList } from '@components/common/modules/useModuleList';
import { RolesService } from '@services/roles';
import { HttpRequestError, httpRequest } from '@utils/http';
import { getPreloadedResource } from '@utils/preload';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Role } from '@/types/role.types';
import type { RoleSort, RolesListResponse, UseRolesListProps, UseRolesListResult } from './roles.types';

export const useRolesList = ({
  enabled = true,
  columnsQuery,
  searchColumnsQuery,
}: UseRolesListProps = {}): UseRolesListResult => {
  const { t } = useTranslation();
  const cached = getPreloadedResource<RolesListResponse>('roles');
  const [roles, setRoles] = useState<Role[]>(cached?.result ?? []);
  const [total, setTotal] = useState(cached?.total ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    direction,
    sort,
    page,
    pageSize,
    search,
    debouncedSearch,
    setSearch,
    setPage,
    handleSort,
    handleChangePage,
    handleChangeRowsPerPage,
  } = useModuleList({
    moduleKey: 'roles-list',
    defaultSort: 'name',
  });

  const refresh = useCallback(async () => {
    if (!enabled) {
      setRoles([]);
      setTotal(0);
      setError('');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const normalizedSearch = debouncedSearch.trim();
      const response = await httpRequest<RolesListResponse>({
        service: RolesService.list,
        data: {
          page,
          size: pageSize,
          order: sort,
          direction,
          ...(columnsQuery ? { columns: columnsQuery } : {}),
          ...(searchColumnsQuery ? { search_columns: searchColumnsQuery } : {}),
          ...(normalizedSearch ? { search: normalizedSearch } : {}),
        },
      });
      setRoles(response.result ?? []);
      setTotal(response.total ?? 0);
    } catch (value) {
      const message =
        value instanceof HttpRequestError || value instanceof Error
          ? value.message
          : t('pages.modules.roles.error.loadFailed');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [columnsQuery, debouncedSearch, direction, enabled, page, pageSize, searchColumnsQuery, sort, t]);

  useEffect(() => {
    if (!enabled) {
      setRoles([]);
      setTotal(0);
      setError('');
      setLoading(false);
      return;
    }

    void refresh();
  }, [enabled, refresh]);

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
