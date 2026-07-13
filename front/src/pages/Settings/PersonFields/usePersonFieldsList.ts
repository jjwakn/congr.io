import { useModuleList } from '@components/common/modules/useModuleList';
import { PersonFieldsService } from '@services/persons';
import { HttpRequestError, httpRequest } from '@utils/http';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PersonField } from '@/types/person.types';
import type {
  PersonFieldsListResponse,
  UsePersonFieldsListProps,
  UsePersonFieldsListResult,
} from './personFields.types';

export const usePersonFieldsList = ({
  enabled = true,
  columnsQuery,
  searchColumnsQuery,
}: UsePersonFieldsListProps = {}): UsePersonFieldsListResult => {
  const { t } = useTranslation();
  const [result, setResult] = useState<PersonField[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const list = useModuleList({ moduleKey: 'settings-person-fields-list', defaultSort: 'label' });

  const refresh = useCallback(async () => {
    if (!enabled) {
      setResult([]);
      setTotal(0);
      setError('');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await httpRequest<PersonFieldsListResponse>({
        service: PersonFieldsService.list,
        data: {
          page: list.page,
          size: list.pageSize,
          order: list.sort,
          direction: list.direction,
          ...(columnsQuery ? { columns: columnsQuery } : {}),
          ...(searchColumnsQuery ? { search_columns: searchColumnsQuery } : {}),
          ...(list.debouncedSearch ? { search: list.debouncedSearch } : {}),
        },
      });
      setResult(response.result ?? []);
      setTotal(response.total ?? 0);
    } catch (value) {
      setError(
        value instanceof HttpRequestError || value instanceof Error
          ? value.message
          : t('pages.persons.fieldsCrud.loadFailed'),
      );
    } finally {
      setLoading(false);
    }
  }, [
    columnsQuery,
    enabled,
    list.debouncedSearch,
    list.direction,
    list.page,
    list.pageSize,
    list.sort,
    searchColumnsQuery,
    t,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { result, total, loading, error, refresh, ...list };
};
