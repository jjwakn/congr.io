import type { SxProps, TableCellProps, Theme } from '@mui/material';
import type { ReactNode } from 'react';
import type { ListDirection } from './useModuleList.types';

export interface ModuleListHeaderCell {
  id: string;
  label: ReactNode;
  align?: TableCellProps['align'];
  sortKey?: string;
  colSpan?: number;
  rowSpan?: number;
  sx?: SxProps<Theme>;
}

export interface ModuleListColumn<RowType> {
  id: string;
  align?: TableCellProps['align'];
  width?: number | string;
  minWidth?: number | string;
  cellSx?: SxProps<Theme>;
  getCellSx?: (row: RowType) => SxProps<Theme>;
  render: (row: RowType) => ReactNode;
}

export interface ModuleListTableProps<RowType> {
  headerRows: ModuleListHeaderCell[][];
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
  fixedStartColumnIds?: string[];
  fixedEndColumnIds?: string[];
}
