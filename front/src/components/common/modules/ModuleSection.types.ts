import type { SxProps, Theme } from '@mui/material';
import type { ReactNode } from 'react';
import type { ModuleListTableProps } from './ModuleListTable.types';
import type { ModuleSectionAction } from './ModuleSectionActions.types';
import type { ModuleStandardActionConfig } from './ModuleStandardActions.types';

export interface ModuleSectionSearchProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  sx?: SxProps<Theme>;
}

export interface ModuleSectionProps<RowType = never> {
  title?: string;
  actions?: ReactNode;
  createAction?: ModuleStandardActionConfig;
  refreshAction?: ModuleStandardActionConfig;
  extraActions?: ModuleSectionAction[];
  alerts?: ReactNode;
  search?: ModuleSectionSearchProps;
  table?: ModuleListTableProps<RowType>;
  children?: ReactNode;
}
