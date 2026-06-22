import type { DialogProps, SxProps, Theme } from '@mui/material';
import type { ReactNode } from 'react';

export type CreateEditDialogMode = 'create' | 'edit';

export interface CreateEditDialogLabels {
  cancel: string;
  createSubmit: string;
  createTitle: string;
  editSubmit: string;
  editTitle: string;
}

export interface CreateEditDialogProps {
  open: boolean;
  mode: CreateEditDialogMode;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onEnter?: () => void;
  maxWidth?: DialogProps['maxWidth'];
  fullWidth?: boolean;
  mobileFullScreen?: boolean;
  contentSx?: SxProps<Theme>;
  extraActions?: ReactNode;
  children?: ReactNode;
  labels: CreateEditDialogLabels;
}
