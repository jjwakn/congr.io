import type { TableCellProps } from '@mui/material';
import type { ReactNode } from 'react';
import type { ListDirection } from './useModuleList.types';

export interface ModuleListColumn<RowType> {
  id: string;
  label: string;
  align?: TableCellProps['align'];
  sortKey?: string;
  render: (row: RowType) => ReactNode;
}

export interface ModuleListTableProps<RowType> {
  columns: ModuleListColumn<RowType>[];
  rows: RowType[];
  getRowId: (row: RowType) => string;
  loading: boolean;
  loadingLabel: string;
  emptyLabel: string;
  sort: string;
  direction: ListDirection;
  onSort: (value: string) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (value: number) => void;
  onPageSizeChange: (value: number) => void;
  rowsPerPageLabel: string;
}
