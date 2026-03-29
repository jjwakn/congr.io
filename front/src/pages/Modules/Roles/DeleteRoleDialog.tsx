import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DeleteRoleDialogProps } from './roles.types';

export const DeleteRoleDialog = ({ open, roleName, deleting, onClose, onConfirm }: DeleteRoleDialogProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={deleting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('pages.modules.roles.dialogs.deleteTitle')}</DialogTitle>

      <DialogContent>
        <Typography variant="body2">
          {t('pages.modules.roles.dialogs.deleteMessage', {
            name: roleName,
          })}
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={deleting}>
          {t('form.field.cancel')}
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={deleting}>
          {t('form.common.delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
