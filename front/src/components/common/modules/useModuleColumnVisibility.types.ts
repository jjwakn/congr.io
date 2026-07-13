export interface UseModuleColumnVisibilityProps<ColumnId extends string> {
  moduleKey: string;
  allColumnIds: ColumnId[];
  defaultVisibleColumnIds: ColumnId[];
  fixedColumnIds?: ColumnId[];
  defaultSearchColumnIds?: ColumnId[];
}

export interface UseModuleColumnVisibilityState<ColumnId extends string> {
  visibleColumnIds: ColumnId[];
  defaultVisibleColumnIds: ColumnId[];
  columnsQuery: string;
  searchColumnsQuery: string;
  setVisibleColumnIds: (value: ColumnId[]) => void;
}
