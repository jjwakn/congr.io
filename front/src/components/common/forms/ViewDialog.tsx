import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { ViewDialogProps } from './ViewDialog.types';

export const ViewDialog = ({ open, title, closeLabel, onClose, maxWidth = 'md', children }: ViewDialogProps) => (
  <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth>
    <DialogTitle>{title}</DialogTitle>

    <DialogContent>{children}</DialogContent>

    <DialogActions>
      <Button onClick={onClose}>{closeLabel}</Button>
    </DialogActions>
  </Dialog>
);
