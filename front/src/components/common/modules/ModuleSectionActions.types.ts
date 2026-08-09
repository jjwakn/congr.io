import type { SvgIconProps } from '@mui/material';
import type { ElementType, MouseEvent } from 'react';

export interface ModuleSectionAction {
  id: string;
  label: string;
  icon: ElementType<SvgIconProps>;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'error' | 'default';
}

export interface ModuleSectionActionsProps {
  actions: ModuleSectionAction[];
}
