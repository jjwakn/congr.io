import { useModuleList } from '@components/common/modules/useModuleList';
import { UsersService } from '@services/users';
import { HttpRequestError, httpRequest } from '@utils/http';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '@/types/user.types';
import type { UseUsersListProps, UseUsersListResult, UserSort, UsersListResponse } from './users.types';

export const useUsersList = ({ enabled = true }: UseUsersListProps = {}): UseUsersListResult => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
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
    moduleKey: 'users-list',
    defaultSort: 'name',
  });

  const refresh = useCallback(async () => {
    if (!enabled) {
      setUsers([]);
      setTotal(0);
      setError('');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const normalizedSearch = search.trim();
      const response = await httpRequest<UsersListResponse>({
        service: UsersService.list,
        data: {
          page,
          size: pageSize,
          order: sort,
          direction,
          ...(normalizedSearch ? { search: normalizedSearch } : {}),
        },
      });

      setUsers(response.result ?? []);
      setTotal(response.total ?? 0);
    } catch (value) {
      const message =
        value instanceof HttpRequestError || value instanceof Error
          ? value.message
          : t('pages.modules.users.error.loadFailed');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [direction, enabled, page, pageSize, search, sort, t]);

  useEffect(() => {
    if (!enabled) {
      setUsers([]);
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
    users,
    total,
    loading,
    error,
    refresh,
    search,
    setSearch,
    sort: sort as UserSort,
    direction,
    page,
    pageSize,
    handleSort,
    handleChangePage,
    handleChangeRowsPerPage,
  };
};
