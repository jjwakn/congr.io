import type { SvgIconProps } from '@mui/material';
import type { ElementType } from 'react';

export interface ModuleSectionAction {
  id: string;
  label: string;
  icon: ElementType<SvgIconProps>;
  onClick: () => void;
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'error' | 'default';
}

export interface ModuleSectionActionsProps {
  actions: ModuleSectionAction[];
}
