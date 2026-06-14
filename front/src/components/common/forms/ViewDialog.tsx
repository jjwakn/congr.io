import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, useMediaQuery, useTheme } from '@mui/material';
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
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          pr: titleAction ? 1 : undefined,
        }}
      >
        <Box component="span" sx={{ minWidth: 0 }}>
          {title}
        </Box>

        {titleAction ? <Box sx={{ display: 'inline-flex', flexShrink: 0 }}>{titleAction}</Box> : null}
      </DialogTitle>

      <DialogContent>{children}</DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{closeLabel}</Button>
      </DialogActions>
    </Dialog>
  );
};
