import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { ConfirmDialogProps } from './ConfirmDialog.types';

export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  confirming,
  onClose,
  onConfirm,
  maxWidth = 'xs',
  confirmColor = 'primary',
  confirmVariant = 'contained',
}: ConfirmDialogProps) => (
  <Dialog open={open} onClose={confirming ? undefined : onClose} maxWidth={maxWidth} fullWidth>
    <DialogTitle>{title}</DialogTitle>

    <DialogContent>
      <Typography variant="body2">{message}</Typography>
    </DialogContent>

    <DialogActions>
      <Button onClick={onClose} disabled={confirming}>
        {cancelLabel}
      </Button>
      <Button onClick={onConfirm} color={confirmColor} variant={confirmVariant} disabled={confirming}>
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);
