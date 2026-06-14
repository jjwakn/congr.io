import type { SvgIconProps } from '@mui/material';
import type { ElementType, ReactNode } from 'react';

export interface ModuleRowAction<RowType> {
  id: string;
  label: string;
  icon: ElementType<SvgIconProps>;
  onClick: (row: RowType) => void;
  disabled?: boolean | ((row: RowType) => boolean);
  hidden?: boolean | ((row: RowType) => boolean);
  color?: 'primary' | 'secondary' | 'error' | 'default';
}

export interface ModuleRowActionsProps<RowType> {
  row: RowType;
  actions: ModuleRowAction<RowType>[];
  emptyLabel?: ReactNode;
}
