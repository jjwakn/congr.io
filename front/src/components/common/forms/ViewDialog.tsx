import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
          pr: 1,
        }}
      >
        <Box component="span" sx={{ minWidth: 0 }}>
          {title}
        </Box>

        <Box sx={{ display: 'inline-flex', flexShrink: 0, alignItems: 'center', gap: 0.5 }}>
          {titleAction}
          <Tooltip title={t('form.field.close')}>
            <IconButton onClick={onClose} aria-label={t('form.field.close')} edge="end">
              <CloseRoundedIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent>{children}</DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{closeLabel}</Button>
      </DialogActions>
    </Dialog>
  );
};
