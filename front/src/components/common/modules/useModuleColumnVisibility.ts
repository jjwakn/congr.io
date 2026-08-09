import { useAuth } from '@hooks/useAuth';
import { UsersService } from '@services/users';
import { httpRequest } from '@utils/http';
import { useCallback, useMemo, useState } from 'react';
import type { UseModuleColumnVisibilityProps, UseModuleColumnVisibilityState } from './useModuleColumnVisibility.types';

const unique = <Value extends string>(values: Value[]) => Array.from(new Set(values));

export const useModuleColumnVisibility = <ColumnId extends string>({
  moduleKey,
  allColumnIds,
  defaultVisibleColumnIds,
  fixedColumnIds = [],
  defaultSearchColumnIds = [],
}: UseModuleColumnVisibilityProps<ColumnId>): UseModuleColumnVisibilityState<ColumnId> => {
  const { refreshSession, user } = useAuth();
  const storedColumnIds = user?.preferences?.column_visibility?.[moduleKey];
  const allColumnSet = useMemo(() => new Set(allColumnIds), [allColumnIds]);
  const fixedColumnSet = useMemo(() => new Set(fixedColumnIds), [fixedColumnIds]);

  const sanitizeColumnIds = useCallback(
    (values: string[] | undefined): ColumnId[] => {
      const source = values?.length ? values : defaultVisibleColumnIds;
      return unique(
        [...source, ...fixedColumnIds].filter((columnId): columnId is ColumnId =>
          allColumnSet.has(columnId as ColumnId),
        ),
      );
    },
    [allColumnSet, defaultVisibleColumnIds, fixedColumnIds],
  );

  const [localColumnIds, setLocalColumnIds] = useState<ColumnId[] | null>(null);
  const sanitizedDefaultVisibleColumnIds = useMemo(
    () => sanitizeColumnIds(defaultVisibleColumnIds),
    [sanitizeColumnIds, defaultVisibleColumnIds],
  );
  const visibleColumnIds = useMemo(
    () => sanitizeColumnIds(localColumnIds ?? storedColumnIds),
    [localColumnIds, sanitizeColumnIds, storedColumnIds],
  );

  const persistVisibleColumnIds = useCallback(
    (value: ColumnId[]) => {
      const sanitized = sanitizeColumnIds(value);
      setLocalColumnIds(sanitized);

      void httpRequest({
        service: UsersService.updatePreferences,
        data: {
          column_visibility: {
            ...(user?.preferences?.column_visibility ?? {}),
            [moduleKey]: sanitized.filter((columnId) => !fixedColumnSet.has(columnId)),
          },
        },
      }).then(() => refreshSession());
    },
    [fixedColumnSet, moduleKey, refreshSession, sanitizeColumnIds, user?.preferences?.column_visibility],
  );

  const columnsQuery = useMemo(() => unique(['id' as ColumnId, ...visibleColumnIds]).join(','), [visibleColumnIds]);
  const searchColumnsQuery = useMemo(
    () =>
      unique([...defaultSearchColumnIds, ...visibleColumnIds].filter((columnId) => !fixedColumnSet.has(columnId))).join(
        ',',
      ),
    [defaultSearchColumnIds, fixedColumnSet, visibleColumnIds],
  );

  return {
    visibleColumnIds,
    defaultVisibleColumnIds: sanitizedDefaultVisibleColumnIds,
    columnsQuery,
    searchColumnsQuery,
    setVisibleColumnIds: persistVisibleColumnIds,
  };
};
