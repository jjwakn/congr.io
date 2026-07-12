import { Button, Dialog, DialogActions, DialogContent, useMediaQuery, useTheme } from '@mui/material';
import { DialogTitleBar } from './DialogTitleBar';
import { ViewDialogProps } from './ViewDialog.types';

export const ViewDialog = ({
  open,
  title,
  closeLabel,
  onClose,
  maxWidth = 'md',
  mobileFullScreen = true,
  titleAction,
  children,
}: ViewDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth fullScreen={mobileFullScreen && isMobile}>
      <DialogTitleBar title={title} action={titleAction} onClose={onClose} />

      <DialogContent>{children}</DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{closeLabel}</Button>
      </DialogActions>
    </Dialog>
  );
};
