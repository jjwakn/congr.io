import type { SxProps, TableCellProps, Theme } from '@mui/material';
import type { MouseEvent, ReactNode } from 'react';
import type { ListDirection } from './useModuleList.types';

export interface ModuleColumnVisibilityOption {
  id: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface ModuleColumnVisibilityProps {
  label: string;
  options: ModuleColumnVisibilityOption[];
  visibleIds: string[];
  disabled?: boolean;
  onChange: (value: string[]) => void;
}

export interface ModuleListHeaderCell {
  id: string;
  label: ReactNode;
  align?: TableCellProps['align'];
  sortKey?: string;
  filter?: {
    active: boolean;
    disabled?: boolean;
    label: string;
    onClick: (event: MouseEvent<HTMLElement>) => void;
  };
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
  columnVisibility?: ModuleColumnVisibilityProps;
  fixedStartColumnIds?: string[];
  fixedEndColumnIds?: string[];
}
