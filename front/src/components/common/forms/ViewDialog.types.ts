import type { DialogProps } from '@mui/material';
import type { ReactNode } from 'react';

export interface ViewDialogProps {
  open: boolean;
  title: string;
  closeLabel: string;
  onClose: () => void;
  maxWidth?: DialogProps['maxWidth'];
  mobileFullScreen?: boolean;
  titleAction?: ReactNode;
  children?: ReactNode;
}
