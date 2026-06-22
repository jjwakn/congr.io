import { useModuleList } from '@components/common/modules/useModuleList';
import { EventTypesService } from '@services/eventTypes';
import { HttpRequestError, httpRequest } from '@utils/http';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EventType } from '@/types/event-type.types';
import type { EventTypesListResponse, UseEventTypesListProps, UseEventTypesListResult } from './eventTypes.types';

export const useEventTypesList = ({ enabled = true }: UseEventTypesListProps = {}): UseEventTypesListResult => {
  const { t } = useTranslation();
  const [result, setResult] = useState<EventType[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const list = useModuleList({ moduleKey: 'settings-event-types-list', defaultSort: 'name' });

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
      const normalizedSearch = list.debouncedSearch.trim();
      const response = await httpRequest<EventTypesListResponse>({
        service: EventTypesService.list,
        data: {
          page: list.page,
          size: list.pageSize,
          order: list.sort,
          direction: list.direction,
          ...(normalizedSearch ? { search: normalizedSearch } : {}),
        },
      });
      setResult(response.result ?? []);
      setTotal(response.total ?? 0);
    } catch (value) {
      setError(
        value instanceof HttpRequestError || value instanceof Error
          ? value.message
          : t('pages.settings.eventTypes.error.loadFailed'),
      );
    } finally {
      setLoading(false);
    }
  }, [enabled, list.debouncedSearch, list.direction, list.page, list.pageSize, list.sort, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (list.page <= 0) return;
    const maxPage = Math.max(0, Math.ceil(total / list.pageSize) - 1);
    if (list.page > maxPage) list.setPage(maxPage);
  }, [list, total]);

  return { result, total, loading, error, refresh, ...list };
};
