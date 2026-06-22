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
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
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
}: ConfirmDialogProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={confirming ? undefined : onClose} maxWidth={maxWidth} fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Box component="span" sx={{ minWidth: 0 }}>
          {title}
        </Box>
        <Tooltip title={t('form.field.close')}>
          <IconButton onClick={onClose} disabled={confirming} aria-label={t('form.field.close')} edge="end">
            <CloseRoundedIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>

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
};
