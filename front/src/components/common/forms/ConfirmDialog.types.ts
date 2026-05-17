import type { ButtonProps, DialogProps } from '@mui/material';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  confirming: boolean;
  onClose: () => void;
  onConfirm: () => void;
  maxWidth?: DialogProps['maxWidth'];
  confirmColor?: ButtonProps['color'];
  confirmVariant?: ButtonProps['variant'];
}
