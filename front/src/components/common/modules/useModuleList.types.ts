export type ListDirection = 'ASC' | 'DESC';

export interface UseModuleListProps {
  moduleKey: string;
  defaultSort: string;
  defaultDirection?: ListDirection;
  defaultPageSize?: number;
}

export interface UseModuleListState {
  direction: ListDirection;
  sort: string;
  page: number;
  pageSize: number;
  search: string;
  setSearch: (value: string) => void;
  setPage: (value: number) => void;
  handleSort: (value: string) => void;
  handleChangePage: (value: number) => void;
  handleChangeRowsPerPage: (value: number) => void;
}

export interface ModuleSortingState {
  sort: string;
  direction: ListDirection;
}

export type ListSortingStorage = Record<string, ModuleSortingState>;
