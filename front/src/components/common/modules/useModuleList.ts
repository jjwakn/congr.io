import { useAuth } from '@hooks/useAuth';
import { useEffect, useState } from 'react';
import {
  ListDirection,
  ListSortingStorage,
  ModuleSortingState,
  UseModuleListProps,
  UseModuleListState,
} from './useModuleList.types';

const LIST_SORTING_STORAGE_VERSION = 1;
const LIST_SORTING_STORAGE_KEY = `congrio:modules:list-sorting:v${LIST_SORTING_STORAGE_VERSION}`;

const isDirection = (value: unknown): value is ListDirection => value === 'ASC' || value === 'DESC';

const readSortingStorage = (): ListSortingStorage => {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(LIST_SORTING_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as ListSortingStorage;
  } catch {
    return {};
  }
};

const writeSortingStorage = (value: ListSortingStorage) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(LIST_SORTING_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Ignore storage write failures and keep in-memory list controls.
  }
};

const getInitialSortingState = ({
  moduleKey,
  defaultSort,
  defaultDirection,
}: {
  moduleKey: string;
  defaultSort: string;
  defaultDirection: ListDirection;
}): ModuleSortingState => {
  if (!moduleKey) {
    return {
      sort: defaultSort,
      direction: defaultDirection,
    };
  }

  const storage = readSortingStorage();
  const stored = storage[moduleKey];

  return {
    sort: stored && typeof stored.sort === 'string' && stored.sort.trim() ? stored.sort : defaultSort,
    direction: stored && isDirection(stored.direction) ? stored.direction : defaultDirection,
  };
};

export const useModuleList = ({
  moduleKey,
  defaultSort,
  defaultDirection = 'ASC',
  defaultPageSize = 50,
}: UseModuleListProps): UseModuleListState => {
  const { user } = useAuth();
  const preferredPageSize =
    user?.preferences?.page_sizes?.[moduleKey] ?? user?.preferences?.page_sizes?.default ?? defaultPageSize;
  const [direction, setDirection] = useState<ListDirection>(
    () =>
      getInitialSortingState({
        moduleKey,
        defaultSort,
        defaultDirection,
      }).direction,
  );
  const [sort, setSort] = useState(
    () =>
      getInitialSortingState({
        moduleKey,
        defaultSort,
        defaultDirection,
      }).sort,
  );
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(preferredPageSize);
  const [search, setSearchValue] = useState('');

  useEffect(() => {
    if (!moduleKey) return;

    const storage = readSortingStorage();
    writeSortingStorage({
      ...storage,
      [moduleKey]: {
        sort,
        direction,
      },
    });
  }, [direction, moduleKey, sort]);

  return {
    direction,
    sort,
    page,
    pageSize,
    search,
    setSearch: (value) => {
      setPage(0);
      setSearchValue(value);
    },
    setPage,
    handleSort: (value) => {
      setPage(0);
      setSort(value);
      setDirection((currentDirection) => (sort === value && currentDirection === 'ASC' ? 'DESC' : 'ASC'));
    },
    handleChangePage: (value) => {
      setPage(value);
    },
    handleChangeRowsPerPage: (value) => {
      setPage(0);
      setPageSize(value);
    },
  };
};
