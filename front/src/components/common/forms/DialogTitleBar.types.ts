import type { ReactNode } from 'react';

export interface DialogTitleBarProps {
  action?: ReactNode;
  closeDisabled?: boolean;
  onClose: () => void;
  title: ReactNode;
}
